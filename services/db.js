// KONFIGURASI SUPABASE
const SUPABASE_URL = 'https://ckuyaqrwuefixcgeqmfm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2A7Oc4ICNUrmBKQmGNdSyw__UMWNKbm';
const BUCKET_NAME = 'roblox-assets';
const TABLE_NAME = 'files';

let supabaseInstance = null;

// Fungsi inisialisasi yang aman (Lazy Load)
// Kita tidak melakukan inisialisasi di luar fungsi agar script tidak crash saat dimuat
const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;

  if (!window.supabase) {
    throw new Error("Supabase SDK gagal dimuat. Cek koneksi internet atau AdBlock.");
  }

  try {
    supabaseInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return supabaseInstance;
  } catch (err) {
    throw new Error("Gagal menghubungkan ke database: " + err.message);
  }
};

/**
 * Upload file ke Storage Bucket dan simpan metadata ke Tabel
 */
export const saveFileToDB = async (file) => {
  const supabase = getSupabase();
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const fileId = crypto.randomUUID();
  const storagePath = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

  // 1. Upload ke Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file);

  if (uploadError) {
    console.error('Supabase Upload Error:', uploadError);
    throw new Error(uploadError.message);
  }

  // 2. Simpan Metadata ke Database
  const { data, error: dbError } = await supabase
    .from(TABLE_NAME)
    .insert([
      {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        extension: extension,
        storage_path: storagePath,
      },
    ])
    .select()
    .single();

  if (dbError) {
    // Rollback: hapus file jika DB gagal
    await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
    console.error('Supabase DB Error:', dbError);
    throw new Error(dbError.message);
  }

  return {
    id: data.id,
    name: data.name,
    size: data.size,
    type: data.type,
    extension: data.extension,
    uploadDate: new Date(data.created_at).getTime(),
    storagePath: data.storage_path
  };
};

/**
 * Ambil daftar file dari Tabel
 */
export const getFilesFromDB = async () => {
  const supabase = getSupabase();
  
  // Timeout safety: Jika koneksi stuck lebih dari 10 detik, lempar error
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("Koneksi timeout (RTO). Cek internet Anda.")), 10000)
  );

  const fetchPromise = supabase
    .from(TABLE_NAME)
    .select('*')
    .order('created_at', { ascending: false });

  // Race antara fetch data vs timeout
  const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

  if (error) {
    console.error('Supabase Fetch Error:', error);
    throw error;
  }

  return data.map(file => ({
    id: file.id,
    name: file.name,
    size: file.size,
    type: file.type,
    extension: file.extension,
    uploadDate: new Date(file.created_at).getTime(),
    storagePath: file.storage_path
  }));
};

/**
 * Hapus file
 */
export const deleteFileFromDB = async (id) => {
  const supabase = getSupabase();

  // 1. Ambil info path storage
  const { data: fileData, error: fetchError } = await supabase
    .from(TABLE_NAME)
    .select('storage_path')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) throw fetchError;

  // 2. Hapus fisik file di Storage (jika ada)
  if (fileData && fileData.storage_path) {
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileData.storage_path]);
      
    if (storageError) console.warn("Storage delete warning:", storageError);
  }

  // 3. Hapus record DB
  const { error: dbError } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id);

  if (dbError) throw dbError;
  
  return true;
};

/**
 * Download file
 */
export const downloadFileFromDB = async (id) => {
  const supabase = getSupabase();

  const { data: fileData, error: fetchError } = await supabase
    .from(TABLE_NAME)
    .select('storage_path, name')
    .eq('id', id)
    .single();

  if (fetchError || !fileData) throw new Error("File not found");

  const { data, error: downloadError } = await supabase.storage
    .from(BUCKET_NAME)
    .download(fileData.storage_path);

  if (downloadError) throw downloadError;

  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileData.name;
  document.body.appendChild(a);
  a.click();
  
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
};