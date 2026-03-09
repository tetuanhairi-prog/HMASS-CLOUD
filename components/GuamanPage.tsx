
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Client } from '../types';
import { exportToCSV, parseCSV } from '../utils/csvUtils';

interface GuamanPageProps {
  clients: Client[];
  onAdd: (client: { name: string; phone: string; detail: string; category: string }, fee: number, date: string) => void;
  onDelete: (id: string) => void;
  onOpenLedger: (idx: number) => void;
  onImport: (data: Client[]) => void;
}

const DRAFT_KEY = 'hma_draft_guaman';

const GuamanPage: React.FC<GuamanPageProps> = ({ clients, onAdd, onDelete, onOpenLedger, onImport }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [detail, setDetail] = useState('');
  const [fee, setFee] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('LAWYER');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const d = JSON.parse(saved);
        setName(d.name || '');
        setPhone(d.phone || '');
        setDetail(d.detail || '');
        setFee(d.fee || '');
        setCategory(d.category || 'LAWYER');
        if (d.date) setDate(d.date);
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    const draft = { name, phone, detail, fee, date, category };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [name, phone, detail, fee, date, category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return alert("Nama pelanggan diperlukan untuk pendaftaran!");
    
    onAdd(
      { name: name.toUpperCase(), phone: phone.trim(), detail: detail.toUpperCase(), category: category.toUpperCase() }, 
      parseFloat(fee) || 0,
      date
    );
    
    setName(''); setPhone(''); setDetail(''); setFee('');
    localStorage.removeItem(DRAFT_KEY);
  };

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.detail.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const handleExport = () => {
    const headers = ["Name", "Phone", "Category", "Detail", "Balance"];
    const data = clients.map(c => ({
      name: c.name,
      phone: c.phone || "",
      category: c.category || "GUAMAN",
      detail: c.detail,
      balance: c.ledger.reduce((s, e) => s + e.amt, 0).toFixed(2)
    }));
    exportToCSV("HMA_Guaman", headers, data);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rawData = await parseCSV(file);
      const importedClients: Client[] = rawData.map(row => ({
        id: crypto.randomUUID(),
        name: (row.name || "UNNAMED").toUpperCase(),
        phone: row.phone || "",
        detail: row.detail || "",
        category: (row.category || "GUAMAN").toUpperCase(),
        ledger: [{
          date: new Date().toISOString().split('T')[0],
          desc: "IMPORTED BALANCE",
          amt: parseFloat(row.balance) || 0
        }]
      }));
      if (confirm(`Import ${importedClients.length} rekod? Data sedia ada akan diganti.`)) {
        onImport(importedClients);
      }
    } catch (err) {
      alert("Ralat membaca fail CSV.");
    }
  };

  return (
    <div className="animate-fadeIn max-w-6xl mx-auto space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-[#333] pb-8">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
            Pendaftaran <span className="text-[#FFD700]">Kes Baru</span>
          </h2>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#FFD700] rounded-full shadow-[0_0_10px_rgba(255,215,0,0.5)]"></span>
            Law Firm Portfolio Management
          </p>
        </div>
        <div className="flex gap-2.5">
          <button onClick={handleExport} className="px-5 py-3 bg-[#1c1c1c] text-[#FFD700] border border-[#333] rounded-xl font-black text-[10px] hover:bg-[#222] transition-all uppercase tracking-widest shadow-lg">
            <i className="fas fa-file-export mr-2.5"></i> Export Data
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="px-5 py-3 bg-[#1c1c1c] text-[#FFD700] border border-[#333] rounded-xl font-black text-[10px] hover:bg-[#222] transition-all uppercase tracking-widest shadow-lg">
            <i className="fas fa-file-import mr-2.5"></i> Import CSV
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".csv" className="hidden" />
        </div>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="relative group">
        <div className="relative bg-[#0d0d0d] p-8 md:p-10 rounded-2xl border border-[#2a2a2a] shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-black text-gray-500 uppercase mb-3 tracking-[0.2em]">Nama Penuh Pelanggan</label>
              <div className="relative group/input">
                <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-[#FFD700]/60 z-10"></i>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full bg-[#121212] border border-[#333] text-white font-bold p-4 pl-12 rounded-xl input-gold-focus placeholder-gray-700 uppercase text-sm" 
                  placeholder="MASUKKAN NAMA PENUH PELANGGAN" 
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-black text-gray-500 uppercase mb-3 tracking-[0.2em]">Tarikh Pendaftaran</label>
              <div className="relative group/input">
                <i className="fas fa-calendar-alt absolute left-4 top-1/2 -translate-y-1/2 text-[#FFD700]/60 z-10"></i>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  className="w-full bg-[#121212] border border-[#333] text-white font-bold p-4 pl-12 rounded-xl input-gold-focus text-sm" 
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-black text-gray-500 uppercase mb-3 tracking-[0.2em]">No. Telefon</label>
              <div className="relative group/input">
                <i className="fas fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-[#FFD700]/60 z-10"></i>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  className="w-full bg-[#121212] border border-[#333] text-white font-bold p-4 pl-12 rounded-xl input-gold-focus placeholder-gray-700 text-sm" 
                  placeholder="01X-XXXXXXX" 
                />
              </div>
            </div>
            <div>
               <label className="block text-[11px] font-black text-gray-500 uppercase mb-3 tracking-[0.2em]">Kategori Fail</label>
               <div className="relative group/input">
                  <i className="fas fa-tags absolute left-4 top-1/2 -translate-y-1/2 text-[#FFD700]/60 z-10"></i>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-[#121212] border border-[#333] text-white font-black p-4 pl-12 rounded-xl input-gold-focus appearance-none text-sm cursor-pointer"
                  >
                    <option value="LAWYER">LAWYER</option>
                    <option value="DOKUMEN">DOKUMEN</option>
                    <option value="LAIN-LAIN">LAIN-LAIN</option>
                  </select>
                  <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none"></i>
               </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[11px] font-black text-gray-500 uppercase mb-3 tracking-[0.2em]">Ringkasan Butiran Kes</label>
              <div className="relative group/input">
                <i className="fas fa-briefcase absolute left-4 top-1/2 -translate-y-1/2 text-[#FFD700]/60 z-10"></i>
                <input 
                  type="text" 
                  value={detail} 
                  onChange={e => setDetail(e.target.value)} 
                  className="w-full bg-[#121212] border border-[#333] text-white font-bold p-4 pl-12 rounded-xl input-gold-focus placeholder-gray-700 uppercase text-sm" 
                  placeholder="KETERANGAN RINGKAS FAIL" 
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-black text-gray-500 uppercase mb-3 tracking-[0.2em]">Fee Professional (RM)</label>
              <div className="relative group/input">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFD700]/60 font-black text-[10px] z-10">RM</span>
                <input 
                  type="number" 
                  value={fee} 
                  onChange={e => setFee(e.target.value)} 
                  className="w-full bg-[#121212] border border-[#333] text-white font-black p-4 pl-12 rounded-xl input-gold-focus tabular-nums placeholder-gray-700 text-sm" 
                  placeholder="0.00" 
                />
              </div>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-[#1a1a1a] flex justify-end">
            <button type="submit" className="bg-[#FFD700] hover:bg-[#FFA500] text-black px-12 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:-translate-y-1 active:scale-95 border border-[#FFD700]/20">
              <i className="fas fa-check-circle mr-3"></i> Sahkan Pendaftaran Fail
            </button>
          </div>
        </div>
      </form>

      {/* List Table Area */}
      <div className="bg-[#111] rounded-2xl border border-[#222] shadow-2xl overflow-hidden">
        <div className="p-6 md:p-8 bg-[#1a1a1a]/50 border-b border-[#222] flex flex-col md:flex-row justify-between items-center gap-6">
          <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.3em]">Senarai Fail Aktif</h3>
          <div className="relative w-full md:w-96 group/search">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 transition-colors group-focus-within/search:text-[#FFD700]"></i>
            <input 
              type="text" 
              placeholder="CARI NAMA ATAU FAIL..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#050505] border border-[#333] text-[#FFD700] pl-12 pr-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest input-gold-focus"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-500 text-[10px] uppercase font-black tracking-widest border-b border-[#222] bg-[#151515]">
                <th className="p-6">Pelanggan & Fail</th>
                <th className="p-6">Hubungan</th>
                <th className="p-6 text-right">Baki Tunggakan (RM)</th>
                <th className="p-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center text-gray-700 font-bold uppercase italic tracking-widest text-xs">
                    Tiada fail guaman ditemui.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client, idx) => {
                  const balance = client.ledger.reduce((sum, entry) => sum + entry.amt, 0);
                  return (
                    <tr key={client.id} className="hover:bg-white/[0.05] even:bg-white/[0.02] transition-colors group">
                      <td className="p-6">
                        <p className="font-black text-white uppercase tracking-tight text-sm mb-1 group-hover:text-[#FFD700] transition-colors">
                          {client.name}
                        </p>
                        <p className="text-gray-600 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                          <i className="fas fa-briefcase text-gray-700"></i>
                          {client.detail}
                        </p>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-col">
                           <span className="text-gray-400 font-mono text-xs font-bold">{client.phone || '-'}</span>
                           <span className="text-[8px] text-gray-600 font-black uppercase mt-1 tracking-wider">{client.category}</span>
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <p className={`font-black text-xl tabular-nums ${balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {balance.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                        </p>
                      </td>
                      <td className="p-6">
                        <div className="flex justify-center gap-3">
                          <button 
                            onClick={() => onOpenLedger(idx)} 
                            className="flex items-center gap-2 px-6 py-2.5 bg-[#FFD700]/5 text-[#FFD700] border border-[#FFD700]/20 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#FFD700] hover:text-black transition-all shadow-md"
                          >
                            <i className="fas fa-book-open"></i> Ledger
                          </button>
                          <button 
                            onClick={() => { if(confirm('Hapus rekod ini?')) onDelete(client.id); }} 
                            className="w-10 h-10 flex items-center justify-center bg-red-600/5 text-red-500 border border-red-600/10 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                          >
                            <i className="fas fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GuamanPage;
