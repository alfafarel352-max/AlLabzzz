import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// KONFIGURASI SUPABASE
// Ganti dengan Project URL dan Anon Key dari Dashboard Supabase Anda
const SUPABASE_URL = 'https://ckuyaqrwuefixcgeqmfm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2A7Oc4ICNUrmBKQmGNdSyw__UMWNKbm';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BUCKET_NAME = 'roblox-assets';
const TABLE_NAME = 'files';

/**
 * Upload file ke Storage Bucket dan simpan metadata ke Tabel
 */
export const saveFileToDB = async (file) => {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const fileId = crypto.randomUUID();
  // Membuat path unik: timestamp_namafile
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
    // Jika gagal simpan DB, hapus file yg sudah terupload
    await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
    console.error('Supabase DB Error:', dbError);
    throw new Error(dbError.message);
  }

  // 3. Kembalikan format object
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
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('created_at', { ascending: false });

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
 * Hapus file dari Storage dan Tabel
 */
export const deleteFileFromDB = async (id) => {
  // 1. Coba ambil info file untuk hapus dari Storage
  // Gunakan maybeSingle() agar TIDAK error jika data sudah tidak ada di DB
  const { data: fileData, error: fetchError } = await supabase
    .from(TABLE_NAME)
    .select('storage_path')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    // Jika error koneksi atau izin select, kita throw
    console.error("Error fetching file info for delete:", fetchError);
    throw fetchError;
  }

  // Jika data ditemukan, hapus file fisiknya dari Storage
  // Note: Kita lanjut meskipun storage delete gagal (agar DB tetap bersih)
  if (fileData && fileData.storage_path) {
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileData.storage_path]);

    if (storageError) {
      console.warn('Gagal menghapus file storage (mungkin sudah hilang atau permission), lanjut hapus DB:', storageError);
    }
  }

  // 2. Hapus record dari Tabel
  const { error: dbError } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id);

  if (dbError) {
    console.error("Error deleting from DB:", dbError);
    throw dbError;
  }
  
  return true;
};

/**
 * Download file dari Storage
 */
export const downloadFileFromDB = async (id) => {
  // 1. Ambil path file dari database
  const { data: fileData, error: fetchError } = await supabase
    .from(TABLE_NAME)
    .select('storage_path, name')
    .eq('id', id)
    .single();

  if (fetchError || !fileData) throw new Error("File not found in DB");

  // 2. Download Blob dari Storage
  const { data, error: downloadError } = await supabase.storage
    .from(BUCKET_NAME)
    .download(fileData.storage_path);

  if (downloadError) throw downloadError;

  // 3. Trigger download browser
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