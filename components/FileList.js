import { useState } from 'react';
import { html } from '../utils/html.js';
import { FileCode, Box, Download, Trash2, File } from './Icons.js';
import { downloadFileFromDB, deleteFileFromDB } from '../services/db.js';

const FileList = ({ files, onDelete }) => {
  const [downloadingId, setDownloadingId] = useState(null);

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (ts) => {
    return new Date(ts).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getIcon = (ext) => {
    if (ext && ext.includes('rbxl')) return html`<${FileCode} className="w-5 h-5 text-blue-400" />`;
    if (ext && ext.includes('rbxm')) return html`<${Box} className="w-5 h-5 text-green-400" />`;
    return html`<${File} className="w-5 h-5 text-gray-400" />`;
  };

  const handleDownload = async (id) => {
    setDownloadingId(id);
    try {
      await downloadFileFromDB(id);
    } catch (e) {
      console.error(e);
      alert("Gagal mendownload file.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Hapus file ini?")) {
      try {
        await deleteFileFromDB(id);
        onDelete(id);
      } catch (e) {
        console.error(e);
        alert("Gagal menghapus file.");
      }
    }
  };

  if (files.length === 0) {
    return html`
      <div className="text-center py-20 opacity-50">
        <div className="inline-block p-4 rounded-full bg-gray-800 mb-4">
          <${Box} className="w-8 h-8 text-gray-500" />
        </div>
        <p className="text-gray-400">Belum ada file yang diupload.</p>
      </div>
    `;
  }

  return html`
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-lg font-semibold text-white">File Tersimpan (${files.length})</h2>
      </div>

      <div className="bg-al-card rounded-xl border border-gray-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-900/50 text-xs uppercase tracking-wider text-gray-400">
                <th className="p-4 font-medium">Nama File</th>
                <th className="p-4 font-medium w-32">Ukuran</th>
                <th className="p-4 font-medium w-48 hidden sm:table-cell">Tanggal</th>
                <th className="p-4 font-medium w-32 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              ${files.map((file) => html`
                <tr key=${file.id} className="group hover:bg-gray-800/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-900 border border-gray-700">
                        ${getIcon(file.extension)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-200 truncate max-w-[150px] sm:max-w-xs" title=${file.name}>
                          ${file.name}
                        </p>
                        <span className="text-xs text-al-accent bg-al-accent/10 px-1.5 py-0.5 rounded border border-al-accent/20">
                          ${file.extension.toUpperCase().replace('.', '')}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-400 font-mono">
                    ${formatSize(file.size)}
                  </td>
                  <td className="p-4 text-sm text-gray-500 hidden sm:table-cell">
                    ${formatDate(file.uploadDate)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick=${() => handleDownload(file.id)}
                        disabled=${downloadingId === file.id}
                        className="p-2 text-gray-400 hover:text-al-accent hover:bg-al-accent/10 rounded-lg transition-colors"
                        title="Download"
                      >
                        ${downloadingId === file.id 
                          ? html`<div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>` 
                          : html`<${Download} className="w-5 h-5" />`
                        }
                      </button>
                      <button 
                        onClick=${() => handleDelete(file.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <${Trash2} className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
};

export default FileList;