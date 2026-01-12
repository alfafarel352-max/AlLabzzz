import { html } from '../utils/html.js';

const Header = () => {
  return html`
    <header className="w-full py-6 mb-8 border-b border-gray-800">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
            <div className="relative w-10 h-10 bg-gradient-to-br from-gray-800 to-black rounded-lg border border-gray-700 flex items-center justify-center font-bold text-xl italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-white shadow-lg">
              AL
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide text-white">
              PRODUCTION
            </h1>
            <p className="text-xs text-al-accent tracking-widest uppercase font-medium">Roblox Asset Hub</p>
          </div>
        </div>
        
        <div className="hidden sm:block">
          <span className="px-3 py-1 rounded-full bg-al-card border border-gray-700 text-xs text-gray-400">
            v1.0.0
          </span>
        </div>
      </div>
    </header>
  `;
};

export default Header;