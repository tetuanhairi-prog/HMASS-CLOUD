
import React from 'react';
import { PageId, AppState } from '../types';

interface HomePageProps {
  state: AppState;
  onNavigate: (page: PageId) => void;
}

const HomePage: React.FC<HomePageProps> = ({ state, onNavigate }) => {
  const { clients, pjsRecords, finances, inventory } = state;

  const activeCases = clients.length;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const pjsToday = pjsRecords
    .filter(r => r.date === todayStr)
    .reduce((sum, r) => sum + r.amount, 0);

  const netBalance = finances.reduce((sum, f) => {
    return f.type === 'MASUK' ? sum + f.amount : sum - f.amount;
  }, 0);

  const quickActions = [
    { id: 'guaman', label: 'Daftar Kes', icon: 'fa-gavel', color: 'from-blue-600/80 to-blue-900/90' },
    { id: 'invoice', label: 'Jana Resit', icon: 'fa-receipt', color: 'from-amber-500/80 to-amber-800/90' },
    { id: 'pjs', label: 'Rekod PJS', icon: 'fa-stamp', color: 'from-purple-600/80 to-purple-900/90' },
    { id: 'kewangan', label: 'Aliran Tunai', icon: 'fa-wallet', color: 'from-green-600/80 to-green-900/90' },
  ];

  return (
    <div className="animate-fadeIn space-y-12">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase">
          Selamat Datang
        </h2>
        <div className="flex justify-center">
          <div className="h-1.5 w-24 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent rounded-full opacity-60"></div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { id: 'guaman', label: 'Guaman', value: activeCases, unit: 'Kes Terdaftar', icon: 'fa-folder-open', color: 'text-blue-500', bg: 'bg-blue-500/5' },
          { id: 'pjs', label: 'PJS Today', value: `RM ${pjsToday.toFixed(0)}`, unit: 'Kutipan Hari Ini', icon: 'fa-stamp', color: 'text-purple-500', bg: 'bg-purple-500/5' },
          { id: 'kewangan', label: 'Aliran Firma', value: `RM ${netBalance.toLocaleString('en-MY', { maximumFractionDigits: 0 })}`, unit: 'Baki Bersih', icon: 'fa-coins', color: netBalance >= 0 ? 'text-green-500' : 'text-red-500', bg: 'bg-green-500/5' },
          { id: 'inventory', label: 'Servis', value: inventory.length, unit: 'Jenis Perkhidmatan', icon: 'fa-tags', color: 'text-[#FFD700]', bg: 'bg-[#FFD700]/5' }
        ].map(stat => (
          <div 
            key={stat.id}
            onClick={() => onNavigate(stat.id as PageId)}
            className="bg-[#1c1c1c] border border-[#2a2a2a] border-t-2 border-t-[#FFD700]/30 p-6 rounded-2xl hover:border-[#FFD700]/50 transition-all cursor-pointer group shadow-xl"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform border border-white/5`}>
                <i className={`fas ${stat.icon} text-lg`}></i>
              </div>
              <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{stat.label}</span>
            </div>
            <h3 className={`text-2xl md:text-3xl font-black text-white truncate ${stat.color === 'text-red-500' ? 'text-red-500' : ''}`}>
              {stat.value}
            </h3>
            <p className="text-[10px] font-bold text-gray-500 uppercase mt-1 tracking-wider">{stat.unit}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions Grid */}
      <div className="space-y-6">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] flex items-center justify-center gap-4">
          <span className="w-12 h-px bg-white/5"></span>
          Pintasan Pantas
          <span className="w-12 h-px bg-white/5"></span>
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => onNavigate(action.id as PageId)}
              className={`relative overflow-hidden group p-7 rounded-2xl bg-gradient-to-br ${action.color} border border-white/10 shadow-2xl transition-all hover:-translate-y-1.5 active:scale-95 text-left`}
            >
              <div className="absolute top-[-10%] right-[-5%] opacity-10 group-hover:opacity-25 transition-opacity pointer-events-none">
                <i className={`fas ${action.icon} text-7xl rotate-12`}></i>
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between gap-10">
                <i className={`fas ${action.icon} text-2xl text-white shadow-sm`}></i>
                <span className="text-white font-black uppercase text-[11px] tracking-widest">{action.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Firm Footer Info */}
      <div className="bg-[#181818] p-8 rounded-3xl border border-[#2a2a2a] flex flex-col md:flex-row items-center justify-between gap-6 shadow-inner">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FFD700] to-[#b8860b] flex items-center justify-center text-black text-2xl shadow-[0_10px_30px_rgba(255,215,0,0.3)] border border-white/20">
            <i className="fas fa-shield-halved"></i>
          </div>
          <div>
            <p className="text-white font-black uppercase text-sm tracking-tight">Status Sistem Cloud</p>
            <p className="text-green-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_currentColor]"></span>
              Operasi Normal (Online)
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-center px-5 py-3 bg-black/40 rounded-xl border border-white/5 backdrop-blur-md">
             <p className="text-gray-600 text-[9px] font-black uppercase tracking-widest mb-1">Local Sync</p>
             <p className="text-white font-mono text-[10px] font-bold">{state.lastLocalUpdate}</p>
          </div>
          <div className="text-center px-5 py-3 bg-black/40 rounded-xl border border-white/5 backdrop-blur-md">
             <p className="text-gray-600 text-[9px] font-black uppercase tracking-widest mb-1">Cloud Load</p>
             <p className="text-white font-mono text-[10px] font-bold">{state.lastCloudUpdate}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
