
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { PjsRecord } from '../types';
import { exportToCSV, parseCSV } from '../utils/csvUtils';

interface PjsPageProps {
  records: PjsRecord[];
  onAdd: (record: Omit<PjsRecord, 'id'>) => void;
  onDelete: (id: string) => void;
  onImport: (data: PjsRecord[]) => void;
}

const DRAFT_KEY = 'hma_draft_pjs';

type SortConfig = {
  key: keyof PjsRecord;
  direction: 'asc' | 'desc';
} | null;

const PjsPage: React.FC<PjsPageProps> = ({ records, onAdd, onDelete, onImport }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [name, setName] = useState('');
  const [detail, setDetail] = useState('');
  const [amount, setAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const d = JSON.parse(saved);
        setName(d.name || '');
        setDetail(d.detail || '');
        setAmount(d.amount || '');
        if (d.date) setDate(d.date);
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    const draft = { name, detail, amount, date };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [name, detail, amount, date]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return alert("Sila isi nama dan amaun!");
    onAdd({
      date,
      name: name.toUpperCase(),
      detail: detail.toUpperCase(),
      amount: parseFloat(amount)
    });
    setName(''); setDetail(''); setAmount('');
    localStorage.removeItem(DRAFT_KEY);
  };

  const handleExport = () => {
    const headers = ["Date", "Name", "Detail", "Amount"];
    const data = records.map(r => ({
      date: r.date,
      name: r.name,
      detail: r.detail,
      amount: r.amount.toFixed(2)
    }));
    exportToCSV("HMA_PJS", headers, data);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rawData = await parseCSV(file);
      const imported: PjsRecord[] = rawData.map(row => ({
        id: crypto.randomUUID(),
        date: row.date || new Date().toISOString().split('T')[0],
        name: (row.name || "UNNAMED").toUpperCase(),
        detail: (row.detail || "").toUpperCase(),
        amount: parseFloat(row.amount) || 0
      }));
      if (confirm(`Import ${imported.length} rekod? Data sedia ada akan diganti.`)) {
        onImport(imported);
      }
    } catch (err) {
      alert("Ralat membaca fail CSV.");
    }
  };

  const handleSort = (key: keyof PjsRecord) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    let todayTotal = 0;
    let monthTotal = 0;
    let allTimeTotal = 0;

    records.forEach(r => {
      const rDate = new Date(r.date);
      allTimeTotal += r.amount;
      if (r.date === todayStr) todayTotal += r.amount;
      if (rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear) {
        monthTotal += r.amount;
      }
    });

    return { todayTotal, monthTotal, allTimeTotal, count: records.length };
  }, [records]);

  const filteredRecords = useMemo(() => {
    let result = records.filter(r => 
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.detail.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig !== null) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [records, searchTerm, sortConfig]);

  const getSortIcon = (key: keyof PjsRecord) => {
    if (!sortConfig || sortConfig.key !== key) return <i className="fas fa-sort ml-1.5 opacity-20"></i>;
    return sortConfig.direction === 'asc' 
      ? <i className="fas fa-sort-up ml-1.5 text-[#FFD700]"></i> 
      : <i className="fas fa-sort-down ml-1.5 text-[#FFD700]"></i>;
  };

  return (
    <div className="animate-fadeIn space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-[#2a2a2a] pb-8">
        <h2 className="text-3xl font-black text-[#FFD700] uppercase tracking-tighter leading-none">
          REKOD PESURUHJAYA SUMPAH
        </h2>
        <div className="flex gap-2.5">
          <button onClick={handleExport} className="px-5 py-3 bg-[#1c1c1c] text-[#FFD700] border border-[#2a2a2a] rounded-xl font-black text-[10px] hover:bg-[#242424] transition-all shadow-xl uppercase tracking-widest active:scale-95">
            <i className="fas fa-file-export mr-2.5"></i> EXPORT
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="px-5 py-3 bg-[#1c1c1c] text-[#FFD700] border border-[#2a2a2a] rounded-xl font-black text-[10px] hover:bg-[#242424] transition-all shadow-xl uppercase tracking-widest active:scale-95">
            <i className="fas fa-file-import mr-2.5"></i> IMPORT
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".csv" className="hidden" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Kutipan Hari Ini', val: stats.todayTotal, color: 'border-[#FFD700]' },
          { label: 'Kutipan Bulan Ini', val: stats.monthTotal, color: 'border-blue-500' },
          { label: 'Jumlah Keseluruhan', val: stats.allTimeTotal, color: 'border-green-500' },
          { label: 'Bilangan Rekod', val: stats.count, color: 'border-purple-500', isCount: true }
        ].map((s, i) => (
          <div key={i} className={`bg-[#1c1c1c] p-6 rounded-2xl border-l-4 ${s.color} shadow-xl border-y border-r border-[#2a2a2a]`}>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{s.label}</p>
            <p className="text-2xl font-black text-white tabular-nums">
              {s.isCount ? s.val : `RM ${s.val.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`}
              {s.isCount && <span className="text-[10px] text-gray-600 ml-2 font-black uppercase">KES</span>}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bg-[#181818] p-8 rounded-2xl border border-[#2a2a2a] shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-2">
            <label className="block text-[#FFD700] text-[10px] font-black uppercase mb-2 tracking-[0.2em]">Tarikh</label>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              className="w-full bg-[#0d0d0d] border border-[#2a2a2a] text-white font-black p-4 rounded-xl text-sm input-gold-focus" 
            />
          </div>
          <div className="md:col-span-4">
            <label className="block text-[#FFD700] text-[10px] font-black uppercase mb-2 tracking-[0.2em]">Nama Pelanggan</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="NAMA PENUH"
              className="w-full bg-[#0d0d0d] border border-[#2a2a2a] text-white font-black p-4 rounded-xl text-sm input-gold-focus placeholder-gray-800 uppercase" 
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-[#FFD700] text-[10px] font-black uppercase mb-2 tracking-[0.2em]">Butiran Dokumen</label>
            <input 
              type="text" 
              value={detail} 
              onChange={e => setDetail(e.target.value)} 
              placeholder="CTH: AKUAN BERKANUN"
              className="w-full bg-[#0d0d0d] border border-[#2a2a2a] text-white font-black p-4 rounded-xl text-sm input-gold-focus placeholder-gray-800 uppercase" 
            />
          </div>
          <div className="md:col-span-3 flex gap-3">
            <div className="flex-1">
              <label className="block text-[#FFD700] text-[10px] font-black uppercase mb-2 tracking-[0.2em]">Amaun (RM)</label>
              <input 
                type="number" 
                step="0.01"
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                placeholder="0.00"
                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] text-white font-black p-4 rounded-xl text-sm input-gold-focus placeholder-gray-800" 
              />
            </div>
            <button type="submit" className="bg-[#FFD700] hover:bg-[#FFA500] text-black px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95">
              SIMPAN
            </button>
          </div>
        </div>
      </form>

      <div className="bg-[#181818] rounded-2xl border border-[#2a2a2a] shadow-2xl overflow-hidden">
        <div className="p-6 bg-[#1c1c1c] border-b border-[#2a2a2a] flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="relative w-full md:w-96">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"></i>
            <input 
              type="text" 
              placeholder="CARI NAMA / BUTIRAN..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#0d0d0d] border border-[#2a2a2a] text-[#FFD700] pl-12 pr-4 py-3.5 rounded-xl text-xs font-black input-gold-focus uppercase tracking-widest"
            />
          </div>
          <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
            Menunjukkan {filteredRecords.length} rekod
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#222]">
              <tr className="text-[#FFD700] text-[10px] uppercase font-black tracking-widest border-b border-[#2a2a2a]">
                <th className="p-5 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => handleSort('date')}>Tarikh {getSortIcon('date')}</th>
                <th className="p-5 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => handleSort('name')}>Nama Pelanggan {getSortIcon('name')}</th>
                <th className="p-5">Butiran</th>
                <th className="p-5 text-right cursor-pointer hover:bg-white/5 transition-colors" onClick={() => handleSort('amount')}>Amaun (RM) {getSortIcon('amount')}</th>
                <th className="p-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {filteredRecords.length === 0 ? (
                <tr><td colSpan={5} className="p-24 text-center text-gray-600 font-bold uppercase italic tracking-widest text-xs">Tiada rekod PJS ditemui.</td></tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-white/[0.05] even:bg-white/[0.02] transition-colors group">
                    <td className="p-5 text-gray-400 text-xs font-bold tabular-nums">{rec.date}</td>
                    <td className="p-5 font-black text-white uppercase tracking-tight text-sm">{rec.name}</td>
                    <td className="p-5 text-gray-500 text-[10px] font-black uppercase tracking-wider">{rec.detail}</td>
                    <td className="p-5 text-right font-black text-[#FFD700] tabular-nums text-xl">
                      {rec.amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-5 text-center">
                      <button 
                        onClick={() => { if(confirm('Padam rekod ini kekal?')){ onDelete(rec.id); }}}
                        className="w-11 h-11 flex items-center justify-center bg-red-600/5 text-red-500 border border-red-600/10 rounded-xl opacity-20 group-hover:opacity-100 transition-all hover:bg-red-600 hover:text-white"
                      >
                        <i className="fas fa-trash-can text-sm"></i>
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
  );
};

export default PjsPage;
