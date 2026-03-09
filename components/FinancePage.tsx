
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FinanceEntry } from '../types';
import { exportToCSV, parseCSV } from '../utils/csvUtils';

interface FinancePageProps {
  finances: FinanceEntry[];
  folders: string[];
  onAddEntry: (entry: Omit<FinanceEntry, 'id'>) => void;
  onDeleteEntry: (id: string) => void;
  onAddFolder: (name: string) => void;
  onDeleteFolder: (idx: number) => void;
  onReorderFolder: (idx: number, direction: 'up' | 'down') => void;
  onImport: (data: FinanceEntry[]) => void;
}

const DRAFT_KEY = 'hma_draft_finance';
const SECURITY_PIN = '5495';

const FinancePage: React.FC<FinancePageProps> = ({ 
  finances, 
  folders, 
  onAddEntry, 
  onDeleteEntry, 
  onAddFolder, 
  onDeleteFolder, 
  onReorderFolder,
  onImport
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showFolderManager, setShowFolderManager] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [manualEntry, setManualEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'KELUAR' as 'MASUK' | 'KELUAR',
    category: folders[0] || '',
    desc: '',
    amount: ''
  });

  // Load Draft
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const d = JSON.parse(saved);
        setManualEntry(prev => ({
          ...prev,
          date: d.date || new Date().toISOString().split('T')[0],
          type: d.type || 'KELUAR',
          category: d.category || folders[0] || '',
          desc: d.desc || '',
          amount: d.amount || ''
        }));
      } catch (e) { console.error(e); }
    }
  }, [folders]);

  // Save Draft
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(manualEntry));
  }, [manualEntry]);

  // Handle PIN Logic
  const handlePinPress = (num: string) => {
    if (pinInput.length < 4) {
      const newPin = pinInput + num;
      setPinInput(newPin);
      setPinError(false);
      
      if (newPin === SECURITY_PIN) {
        setTimeout(() => setIsUnlocked(true), 300);
      } else if (newPin.length === 4) {
        setPinError(true);
        setTimeout(() => setPinInput(''), 500);
      }
    }
  };

  const stats = useMemo(() => {
    const income = finances.filter(f => f.type === 'MASUK').reduce((s, f) => s + f.amount, 0);
    const expense = finances.filter(f => f.type === 'KELUAR').reduce((s, f) => s + f.amount, 0);
    return { income, expense, balance: income - expense };
  }, [finances]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEntry.desc || !manualEntry.amount) return;
    onAddEntry({
      date: manualEntry.date,
      type: manualEntry.type,
      category: manualEntry.category || 'LAIN-LAIN',
      desc: manualEntry.desc.toUpperCase(),
      amount: parseFloat(manualEntry.amount)
    });
    setManualEntry({ ...manualEntry, desc: '', amount: '' });
    localStorage.removeItem(DRAFT_KEY);
  };

  const handleExport = () => {
    const headers = ["Date", "Type", "Category", "Description", "Amount"];
    const data = finances.map(f => ({
      date: f.date,
      type: f.type,
      category: f.category,
      description: f.desc,
      amount: f.amount.toFixed(2)
    }));
    exportToCSV("HMA_Kewangan", headers, data);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rawData = await parseCSV(file);
      const imported: FinanceEntry[] = rawData.map(row => ({
        id: crypto.randomUUID(),
        date: row.date || new Date().toISOString().split('T')[0],
        type: (row.type?.toUpperCase() === 'MASUK' ? 'MASUK' : 'KELUAR'),
        category: (row.category || "LAIN-LAIN").toUpperCase(),
        desc: (row.description || "").toUpperCase(),
        amount: parseFloat(row.amount) || 0
      }));
      if (confirm(`Import ${imported.length} rekod kewangan?`)) {
        onImport(imported);
      }
    } catch (err) {
      alert("Ralat membaca fail CSV.");
    }
  };

  const handleAddFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName) return;
    onAddFolder(newFolderName);
    setNewFolderName('');
  };

  // Render Lock Screen if not unlocked
  if (!isUnlocked) {
    return (
      <div className="animate-fadeIn min-h-[60vh] flex flex-col items-center justify-center py-12">
        <div className="bg-[#111] border border-[#333] p-10 rounded-3xl shadow-2xl w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-[#FFD700]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#FFD700]/20">
            <i className={`fas ${pinError ? 'fa-lock-open text-red-500' : 'fa-lock text-[#FFD700]'} text-3xl`}></i>
          </div>
          <h2 className="text-white font-black uppercase text-lg tracking-widest mb-2">Akses Terhad</h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-8">Masukkan PIN Keselamatan</p>
          
          <div className="flex justify-center gap-4 mb-10">
            {[...Array(4)].map((_, i) => (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                  i < pinInput.length 
                    ? 'bg-[#FFD700] border-[#FFD700] scale-125 shadow-[0_0_10px_rgba(255,215,0,0.5)]' 
                    : pinError ? 'border-red-500' : 'border-[#333]'
                }`}
              ></div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handlePinPress(num.toString())}
                className="w-full aspect-square bg-[#1a1a1a] border border-[#333] rounded-2xl text-white font-black text-xl hover:bg-[#222] hover:border-[#FFD700]/50 active:scale-90 transition-all"
              >
                {num}
              </button>
            ))}
            <button className="invisible"></button>
            <button
              onClick={() => handlePinPress('0')}
              className="w-full aspect-square bg-[#1a1a1a] border border-[#333] rounded-2xl text-white font-black text-xl hover:bg-[#222] hover:border-[#FFD700]/50 active:scale-90 transition-all"
            >
              0
            </button>
            <button
              onClick={() => setPinInput(prev => prev.slice(0, -1))}
              className="w-full aspect-square bg-[#1a1a1a] border border-[#333] rounded-2xl text-gray-500 hover:text-white hover:bg-red-500/10 active:scale-90 transition-all"
            >
              <i className="fas fa-backspace"></i>
            </button>
          </div>

          {pinError && (
            <p className="text-red-500 text-[10px] font-black uppercase mt-6 tracking-widest animate-pulse">PIN Tidak Sah!</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-8">
      {/* Finance Header with Import/Export */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-[#2a2a2a] pb-6">
        <div>
          <h2 className="text-2xl font-black text-[#FFD700] uppercase tracking-tighter">Pengurusan Kewangan</h2>
          <p className="text-gray-500 text-[9px] font-bold uppercase tracking-[0.3em] mt-1">Cash Flow & Folders</p>
        </div>
        <div className="flex gap-2.5">
          <button onClick={handleExport} className="px-5 py-3 bg-[#1c1c1c] text-[#FFD700] border border-[#333] rounded-xl font-black text-[10px] hover:bg-[#222] transition-all uppercase tracking-widest shadow-lg">
            <i className="fas fa-file-export mr-2.5"></i> Export
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="px-5 py-3 bg-[#1c1c1c] text-[#FFD700] border border-[#333] rounded-xl font-black text-[10px] hover:bg-[#222] transition-all uppercase tracking-widest shadow-lg">
            <i className="fas fa-file-import mr-2.5"></i> Import CSV
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".csv" className="hidden" />
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111] border border-[#333] p-6 rounded-2xl shadow-lg group hover:border-green-500/30 transition-all">
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Jumlah Masuk</p>
          <h3 className="text-3xl font-black text-green-500 tabular-nums">RM {stats.income.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-[#111] border border-[#333] p-6 rounded-2xl shadow-lg group hover:border-red-500/30 transition-all">
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Jumlah Keluar</p>
          <h3 className="text-3xl font-black text-red-500 tabular-nums">RM {stats.expense.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-[#111] border-2 border-[#FFD700] p-6 rounded-2xl shadow-[0_0_20px_rgba(255,215,0,0.1)]">
          <p className="text-[#FFD700] text-[10px] font-black uppercase tracking-[0.2em] mb-2">Baki Bersih</p>
          <h3 className={`text-3xl font-black tabular-nums ${stats.balance >= 0 ? 'text-[#FFD700]' : 'text-red-500'}`}>
            RM {stats.balance.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <form onSubmit={handleManualSubmit} className="bg-[#1a1a1a] p-8 rounded-2xl border border-[#333] shadow-xl space-y-5">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-[#FFD700] text-xs font-black uppercase flex items-center gap-2">
                <i className="fas fa-edit"></i> Rekod Transaksi
              </h4>
              <button 
                type="button" 
                onClick={() => setShowFolderManager(true)}
                className="text-[9px] font-black text-gray-500 hover:text-[#FFD700] uppercase tracking-widest border border-gray-800 px-2 py-1 rounded transition-colors"
              >
                Urus Kategori
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex bg-[#0a0a0a] rounded-xl p-1.5 border border-[#222]">
                <button 
                  type="button" 
                  onClick={() => setManualEntry({...manualEntry, type: 'MASUK'})}
                  className={`flex-1 py-3 text-[10px] font-black rounded-lg transition-all ${manualEntry.type === 'MASUK' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-600 hover:text-gray-400'}`}
                >MASUK</button>
                <button 
                  type="button" 
                  onClick={() => setManualEntry({...manualEntry, type: 'KELUAR'})}
                  className={`flex-1 py-3 text-[10px] font-black rounded-lg transition-all ${manualEntry.type === 'KELUAR' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-600 hover:text-gray-400'}`}
                >KELUAR</button>
              </div>
              <div className="relative">
                <label className="block text-[9px] font-black text-gray-600 uppercase mb-2 ml-1 tracking-widest">Tarikh Transaksi</label>
                <input 
                  type="date" 
                  value={manualEntry.date}
                  onChange={e => setManualEntry({...manualEntry, date: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#333] text-white p-4 rounded-xl text-sm font-bold outline-none input-gold-focus"
                />
              </div>
              <div className="relative">
                <label className="block text-[9px] font-black text-gray-600 uppercase mb-2 ml-1 tracking-widest">Kategori</label>
                <select 
                  value={manualEntry.category}
                  onChange={e => setManualEntry({...manualEntry, category: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#333] text-white p-4 rounded-xl text-sm font-bold outline-none input-gold-focus appearance-none cursor-pointer"
                >
                  {folders.map(f => <option key={f} value={f}>{f}</option>)}
                  <option value="LAIN-LAIN">LAIN-LAIN</option>
                </select>
                <div className="absolute top-[42px] right-4 flex items-center pointer-events-none text-[#FFD700]/60">
                  <i className="fas fa-chevron-down text-xs"></i>
                </div>
              </div>
              <div>
                 <label className="block text-[9px] font-black text-gray-600 uppercase mb-2 ml-1 tracking-widest">Keterangan</label>
                 <input 
                  type="text" 
                  placeholder="CTH: BELI ALAT TULIS..."
                  value={manualEntry.desc}
                  onChange={e => setManualEntry({...manualEntry, desc: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#333] text-white p-4 rounded-xl text-sm font-bold outline-none input-gold-focus placeholder-gray-800 uppercase"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-gray-600 uppercase mb-2 ml-1 tracking-widest">Amaun (RM)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00"
                  value={manualEntry.amount}
                  onChange={e => setManualEntry({...manualEntry, amount: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#333] text-white p-4 rounded-xl text-sm font-bold outline-none input-gold-focus placeholder-gray-800 tabular-nums"
                />
              </div>
              <button type="submit" className="w-full py-5 bg-[#FFD700] text-black font-black rounded-xl hover:bg-[#FFA500] transition-all uppercase text-xs tracking-[0.2em] shadow-xl active:scale-95 mt-4">
                Sahkan Transaksi
              </button>
            </div>
          </form>
          <div className="bg-[#1a1a1a]/40 p-5 rounded-2xl border border-[#333] border-dashed text-center">
            <button 
              onClick={() => setIsUnlocked(false)}
              className="text-[10px] text-[#FFD700] font-black uppercase tracking-widest hover:text-[#FFA500] transition-colors"
            >
              <i className="fas fa-lock mr-2.5"></i> Kunci Bahagian Sulit
            </button>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-[#111] rounded-2xl border border-[#333] overflow-hidden shadow-2xl">
            <div className="p-6 bg-[#1a1a1a] border-b border-[#333] flex justify-between items-center">
              <h4 className="text-[#FFD700] text-xs font-black uppercase tracking-widest">Sejarah Aliran Tunai Firma</h4>
              <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                {finances.length} REKOD DIJUMPA
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#0d0d0d] text-gray-500 text-[10px] font-black uppercase tracking-widest border-b border-[#222]">
                    <th className="p-5">Tarikh / Kat</th>
                    <th className="p-5">Butiran Transaksi</th>
                    <th className="p-5 text-right">Amaun (RM)</th>
                    <th className="p-5 w-14 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c1c1c]">
                  {finances.length === 0 ? (
                    <tr><td colSpan={4} className="p-24 text-center text-gray-700 font-bold uppercase italic text-xs tracking-[0.3em]">Tiada rekod kewangan sedia ada.</td></tr>
                  ) : (
                    finances.map((f, i) => (
                      <tr key={f.id} className="hover:bg-white/[0.05] even:bg-white/[0.02] transition-colors group">
                        <td className="p-5">
                          <p className="text-gray-400 text-[11px] font-mono font-bold leading-none mb-2">{f.date}</p>
                          <span className="text-[8px] px-2 py-0.5 bg-[#FFD700]/10 text-[#FFD700] rounded uppercase font-black tracking-widest border border-[#FFD700]/20">{f.category}</span>
                        </td>
                        <td className="p-5">
                          <p className="text-white font-black text-xs uppercase tracking-tight group-hover:text-[#FFD700] transition-colors">{f.desc}</p>
                        </td>
                        <td className={`p-5 text-right font-black text-lg tabular-nums ${f.type === 'MASUK' ? 'text-green-500' : 'text-red-500'}`}>
                          {f.type === 'MASUK' ? '+' : '-'} {f.amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-5 text-center">
                          <button 
                            onClick={() => { if(confirm('Padam rekod ini kekal?')) onDeleteEntry(f.id); }}
                            className="w-9 h-9 flex items-center justify-center text-red-500 bg-red-500/5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white transition-all"
                          >
                            <i className="fas fa-trash-can text-[10px]"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showFolderManager && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 p-4 animate-fadeIn no-print backdrop-blur-md">
          <div className="bg-[#1a1a1a] w-full max-w-md rounded-3xl border border-[#333] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[#FFD700] font-black uppercase tracking-[0.2em] text-sm">Urus Kategori</h3>
              <button onClick={() => setShowFolderManager(false)} className="w-10 h-10 rounded-full bg-red-600/10 text-red-500 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all">&times;</button>
            </div>
            <form onSubmit={handleAddFolderSubmit} className="mb-8">
              <label className="block text-[9px] font-black text-gray-500 uppercase mb-2 ml-1 tracking-widest">Nama Kategori Baru</label>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value.toUpperCase())}
                  placeholder="CTH: UTILITI..."
                  className="flex-1 bg-black border border-[#333] text-white p-4 rounded-xl text-xs font-bold outline-none input-gold-focus"
                />
                <button type="submit" className="bg-[#FFD700] text-black px-6 py-4 rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-[#FFA500] transition-colors">
                  TAMBAH
                </button>
              </div>
            </form>
            <div className="max-h-[350px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {folders.map((folder, idx) => (
                <div key={folder + idx} className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-[#333] group hover:border-[#FFD700]/30 transition-all">
                  <span className="text-xs font-black text-white uppercase tracking-widest">{folder}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => onReorderFolder(idx, 'up')} disabled={idx === 0} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#222] text-gray-500 hover:text-[#FFD700] disabled:opacity-20 transition-all"><i className="fas fa-chevron-up text-[10px]"></i></button>
                    <button onClick={() => onReorderFolder(idx, 'down')} disabled={idx === folders.length - 1} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#222] text-gray-500 hover:text-[#FFD700] disabled:opacity-20 transition-all"><i className="fas fa-chevron-down text-[10px]"></i></button>
                    <button onClick={() => { if(confirm('Padam kategori ini?')) onDeleteFolder(idx); }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white ml-2 transition-all"><i className="fas fa-trash-can text-[10px]"></i></button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowFolderManager(false)} className="w-full mt-10 py-4 bg-[#FFD700] text-black font-black rounded-2xl uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-[#FFA500] transition-colors">Simpan & Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancePage;
