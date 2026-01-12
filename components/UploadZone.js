import { useState, useRef, useCallback } from 'react';
import { html } from '../utils/html.js';
import { UploadCloud, AlertCircle, Box } from './Icons.js';
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '../constants.js';
import { saveFileToDB } from '../services/db.js';

const UploadZone = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    const fileName = file.name.toLowerCase();
    const isValidExt = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    
    if (!isValidExt) {
      return `Format file tidak valid. Gunakan: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `Ukuran file terlalu besar. Maksimal ${MAX_FILE_SIZE_MB}MB.`;
    }

    return null;
  };

  const handleProcessFile = async (file) => {
    setError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUploading(true);
    try {
      await new Promise(r => setTimeout(r, 600)); // Simulate delay
      const savedFile = await saveFileToDB(file);
      onUploadSuccess(savedFile);
    } catch (err) {
      console.error(err);
      setError("Gagal menyimpan file. Storage mungkin penuh.");
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  }, []);

  const onFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return html`
    <div className="w-full max-w-2xl mx-auto mb-10">
      <div
        onDragOver=${onDragOver}
        onDragLeave=${onDragLeave}
        onDrop=${onDrop}
        onClick=${() => !isUploading && fileInputRef.current?.click()}
        className=${`
          relative group cursor-pointer
          border-2 border-dashed rounded-2xl p-10
          flex flex-col items-center justify-center text-center
          transition-all duration-300 ease-out
          ${isDragging 
            ? 'border-al-accent bg-al-accent/10 shadow-[0_0_30px_rgba(6,182,212,0.15)]' 
            : 'border-gray-700 bg-al-card hover:border-gray-600 hover:bg-gray-800'
          }
        `}
      >
        <input 
          type="file" 
          ref=${fileInputRef} 
          className="hidden" 
          accept=${ALLOWED_EXTENSIONS.join(',')}
          onChange=${onFileInputChange}
        />

        ${isUploading ? html`
          <div className="flex flex-col items-center animate-pulse">
            <${Box} className="w-12 h-12 text-al-accent mb-4 animate-bounce" />
            <p className="text-lg font-medium text-white">Mengupload...</p>
            <p className="text-sm text-gray-400">Mohon tunggu sebentar</p>
          </div>
        ` : html`
          <div>
            <div className=${`
              p-4 rounded-full bg-gray-900 mb-4 transition-transform duration-300 inline-block
              ${isDragging ? 'scale-110' : 'group-hover:scale-105'}
            `}>
              <${UploadCloud} className=${`w-8 h-8 ${isDragging ? 'text-al-accent' : 'text-gray-400'}`} />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">
              Upload File Roblox
            </h3>
            <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
              Drag & drop atau klik untuk memilih file. <br/>
              <span className="text-gray-500 text-xs mt-1 block">
                Support: .rbxm, .rbxl, .rbxasset (Max 50MB)
              </span>
            </p>

            <button className="px-6 py-2 bg-al-accent hover:bg-al-hover text-white font-semibold rounded-lg shadow-lg shadow-cyan-900/20 transition-colors">
              Pilih File
            </button>
          </div>
        `}
      </div>

      ${error && html`
        <div className="mt-4 p-4 bg-red-900/20 border border-red-900/50 rounded-lg flex items-center gap-3 text-red-200 animate-in fade-in slide-in-from-top-2">
          <${AlertCircle} className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">${error}</span>
        </div>
      `}
    </div>
  `;
};

export default UploadZone;