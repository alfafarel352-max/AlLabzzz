import { useEffect, useState } from 'react';
import { html } from './utils/html.js';
import Header from './components/Header.js';
import UploadZone from './components/UploadZone.js';
import FileList from './components/FileList.js';
import { getFilesFromDB } from './services/db.js';

const App = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load files on mount
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const storedFiles = await getFilesFromDB();
        setFiles(storedFiles);
      } catch (error) {
        console.error("Failed to load files:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, []);

  const handleUploadSuccess = (newFile) => {
    setFiles(prev => [newFile, ...prev]);
  };

  const handleDelete = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  return html`
    <div className="min-h-screen bg-al-dark text-al-text font-sans selection:bg-al-accent selection:text-white pb-20">
      <${Header} />
      
      <main className="container mx-auto px-4">
        <${UploadZone} onUploadSuccess=${handleUploadSuccess} />
        
        ${loading ? html`
          <div className="w-full flex justify-center items-center py-20 text-gray-500">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-al-accent border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm">Memuat data...</p>
            </div>
          </div>
        ` : html`
          <${FileList} files=${files} onDelete=${handleDelete} />
        `}
      </main>

      <footer className="fixed bottom-0 w-full py-4 text-center text-xs text-gray-600 bg-al-dark/80 backdrop-blur-sm border-t border-gray-800">
        <p>&copy; ${new Date().getFullYear()} AL Production. Roblox Asset Manager.</p>
      </footer>
    </div>
  `;
};

export default App;