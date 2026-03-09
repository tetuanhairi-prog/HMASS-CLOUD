
import React, { useRef } from 'react';
import { DEFAULT_LOGO } from '../constants';

interface HeaderProps {
  logo: string | null;
  onLogoChange: (logo: string) => void;
  syncing?: boolean;
  onOpenSettings: () => void;
  onRefresh: () => void;
}

const Header: React.FC<HeaderProps> = ({ logo, onLogoChange, syncing = false, onOpenSettings, onRefresh }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const displayLogo = logo || DEFAULT_LOGO;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onLogoChange(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <header className="bg-gradient-to-br from-[#d4af37] via-[#FFD700] to-[#b8860b] p-10 text-center shadow-[0_15px_40px_rgba(0,0,0,0.4)] relative overflow-hidden group/header">
      {/* Dynamic Background Atmosphere */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none overflow-hidden">
        <div className="absolute top-[-50%] left-[-10%] w-[120%] h-[200%] bg-gradient-to-tr from-transparent via-white to-transparent rotate-45 animate-[sweep_8s_linear_infinite]"></div>
      </div>

      {/* Cloud Sync Status Indicator & Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-3 no-print z-20">
        <button 
          onClick={onRefresh}
          className={`w-10 h-10 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/25 transition-all text-black/80 backdrop-blur-md border border-black/10 shadow-sm ${syncing ? 'animate-spin' : 'hover:rotate-180 duration-500'}`}
          title="Refresh Data Cloud"
        >
          <i className="fas fa-sync-alt text-sm"></i>
        </button>
        <button 
          onClick={onOpenSettings}
          className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/25 transition-all text-black/80 backdrop-blur-md border border-black/10 shadow-sm hover:scale-110"
          title="Tetapan Online"
        >
          <i className="fas fa-cog text-sm"></i>
        </button>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all backdrop-blur-lg shadow-lg border ${syncing ? 'bg-black text-[#FFD700] border-black animate-pulse' : 'bg-white/30 text-black/80 border-white/40'}`}>
          <div className={`w-2 h-2 rounded-full ${syncing ? 'bg-[#FFD700]' : 'bg-green-600'} shadow-[0_0_8px_currentColor]`}></div>
          {syncing ? 'Syncing...' : 'Connected'}
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 relative z-10">
        {/* Enhanced Professional Logo Container */}
        <div className="relative group cursor-pointer perspective-1000">
          {/* Multi-layered Glow Orbs */}
          <div className="absolute -inset-4 bg-[#FFD700] rounded-full blur-[40px] opacity-0 group-hover:opacity-20 transition-opacity duration-700"></div>
          <div className="absolute -inset-2 bg-gradient-to-r from-[#FFD700] via-white to-[#b8860b] rounded-2xl blur-lg opacity-10 group-hover:opacity-40 transition-all duration-1000 group-hover:duration-500 group-hover:animate-pulse"></div>
          
          <div className="relative bg-white p-6 rounded-2xl shadow-2xl border-2 border-[#FFD700]/40 overflow-hidden transform transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 group-hover:border-[#FFD700] group-hover:rotate-1 group-active:scale-95 group-active:rotate-0">
            {displayLogo && (
              <img 
                src={displayLogo} 
                alt="Firm Logo" 
                className="h-28 w-auto object-contain animate-float-pro transition-all duration-700 select-none pointer-events-none group-hover:brightness-110 group-hover:contrast-110" 
                crossOrigin="anonymous"
              />
            )}
            
            {/* Elegant Shimmer Sweep Effect */}
            <div className="absolute top-0 -inset-full h-full w-[200%] z-5 block transform -skew-x-25 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-[shimmer-sweep_1.5s_ease-out_infinite] pointer-events-none"></div>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl md:text-5xl font-black text-black tracking-tighter leading-tight uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)] transition-transform duration-500 group-header:scale-[1.02]">
            HAIRI MUSTAFA <span className="text-black/90">&</span> ASSOCIATES
          </h1>
          <div className="flex items-center justify-center gap-4">
             <div className="h-px w-12 bg-black/15 group-hover/header:w-16 transition-all duration-700"></div>
             <p className="text-black/75 font-black text-xs md:text-base uppercase tracking-[0.4em] drop-shadow-sm">
               Peguam Syarie & Pesuruhjaya Sumpah
             </p>
             <div className="h-px w-12 bg-black/15 group-hover/header:w-16 transition-all duration-700"></div>
          </div>
        </div>
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 px-8 py-3 bg-black text-[#FFD700] text-[10px] font-black rounded-full hover:bg-gray-900 hover:shadow-[0_10px_25px_rgba(0,0,0,0.3)] transition-all uppercase tracking-[0.25em] border border-white/5 active:scale-95 shadow-md group/btn"
        >
          <i className="fas fa-camera-rotate mr-3 group-hover/btn:rotate-180 transition-transform duration-500"></i>
          Kemaskini Identiti Firma
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleLogoUpload} 
          accept="image/*" 
          className="hidden" 
        />
      </div>

      {/* Global & Specific CSS Keyframes */}
      <style>{`
        @keyframes shimmer-sweep {
          0% { transform: translateX(-150%) skewX(-25deg); opacity: 0; }
          20% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { transform: translateX(150%) skewX(-25deg); opacity: 0; }
        }
        @keyframes float-pro {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(0.5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes sweep {
          0% { transform: translate(-10%, -10%) rotate(45deg); }
          100% { transform: translate(10%, 10%) rotate(45deg); }
        }
        .animate-float-pro {
          animation: float-pro 8s ease-in-out infinite;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </header>
  );
};

export default Header;
