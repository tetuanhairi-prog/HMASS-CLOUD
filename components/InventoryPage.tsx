
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ServiceItem } from '../types';
import { exportToCSV, parseCSV } from '../utils/csvUtils';

interface InventoryPageProps {
  services: ServiceItem[];
  categories: string[];
  onAdd: (service: Omit<ServiceItem, 'id'>) => void;
  onDelete: (id: string) => void;
  onAddCategory: (name: string) => void;
  onDeleteCategory: (idx: number) => void;
  onReorderCategory: (idx: number, direction: 'up' | 'down') => void;
  onImport: (data: ServiceItem[]) => void;
}

const DRAFT_KEY = 'hma_draft_inventory';

const InventoryPage: React.FC<InventoryPageProps> = ({ 
  services, categories, onAdd, onDelete, 
  onAddCategory, onDeleteCategory, onReorderCategory, onImport 
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(categories[0] || 'LAIN-LAIN');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCatManager, setShowCatManager] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!category && categories.length > 0) {
      setCategory(categories[0]);
    }
  }, [categories]);

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const d = JSON.parse(saved);
        setName(d.name || '');
        setPrice(d.price || '');
        if (d.category) setCategory(d.category);
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ name, price, category }));
  }, [name, price, category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return alert("Sila isi butiran perkhidmatan!");
    onAdd({
      name: name.toUpperCase(),
      price: parseFloat(price),
      category: category.toUpperCase()
    });
    setName('');
    setPrice('');
    localStorage.removeItem(DRAFT_KEY);
  };

  const handleExport = () => {
    const headers = ["Name", "Price", "Category"];
    const data = services.map(s => ({
      name: s.name,
      price: s.price.toFixed(2),
      category: s.category || "LAIN-LAIN"
    }));
    exportToCSV("HMA_Services", headers, data);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rawData = await parseCSV(file);
      const imported: ServiceItem[] = rawData.map(row => ({
        id: crypto.randomUUID(),
        name: (row.name || "UNNAMED").toUpperCase(),
        price: parseFloat(row.price) || 0,
        category: (row.category || "LAIN-LAIN").toUpperCase()
      }));
      if (confirm(`Import ${imported.length} rekod? Data sedia ada akan diganti.`)) {
        onImport(imported);
      }
    } catch (err) {
      alert("Ralat membaca fail CSV.");
    }
  };

  const filteredServices = useMemo(() => {
    return services.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (s.category && s.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [services, searchTerm]);

  return (
    <div className="animate-fadeIn space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-[#2a2a2a] pb-8">
        <div>
          <h2 className="text-3xl font-black text-[#FFD700] uppercase tracking-tighter leading-none">
            Inventori <span className="text-white">Servis</span>
          </h2>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-3">Katalog Perkhidmatan Firma</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2.5">
          <button onClick={() => setShowCatManager(true)} className="px-5 py-3 bg-[#1c1c1c] text-white border border-[#333] rounded-xl font-black text-[10px] hover:bg-[#242424] transition-all shadow-xl uppercase tracking-widest active:scale-95">
            <i className="fas fa-layer-group mr-2.5 text-[#FFD700]"></i> Urus Kategori
          </button>
          <button onClick={handleExport} className="px-5 py-3 bg-[#1c1c1c] text-[#FFD700] border border-[#2a2a2a] rounded-xl font-black text-[10px] hover:bg-[#242424] transition-all shadow-xl uppercase tracking-widest active:scale-95">
            <i className="fas fa-file-export mr-2.5"></i> EXPORT
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="px-5 py-3 bg-[#1c1c1c] text-[#FFD700] border border-[#2a2a2a] rounded-xl font-black text-[10px] hover:bg-[#242424] transition-all shadow-xl uppercase tracking-widest active:scale-95">
            <i className="fas fa-file-import mr-2.5"></i> IMPORT
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".csv" className="hidden" />
        </div>
      </div>

      {/* Entry Form */}
      <form onSubmit={handleSubmit} className="bg-[#0d0d0d] p-8 md:p-10 rounded-2xl border border-[#2a2a2a] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#FFD700] group-focus-within:w-2 transition-all duration-500"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <label className="block text-[11px] font-black text-gray-500 uppercase mb-3 tracking-[0.2em]">Kategori</label>
            <div className="relative">
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-[#121212] border border-[#333] text-white font-black p-4 rounded-xl input-gold-focus appearance-none cursor-pointer text-sm"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[#FFD700]/60 pointer-events-none"></i>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-black text-gray-500 uppercase mb-3 tracking-[0.2em]">Nama Servis</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full bg-[#121212] border border-[#333] text-white font-bold p-4 rounded-xl input-gold-focus placeholder-gray-800 uppercase text-sm" 
              placeholder="CTH: PERMOHONAN CERAI"
            />
          </div>
          <div>
            <label className="block text-[11px] font-black text-gray-500 uppercase mb-3 tracking-[0.2em]">Harga (RM)</label>
            <input 
              type="number" 
              step="0.01"
              value={price} 
              onChange={e => setPrice(e.target.value)} 
              className="w-full bg-[#121212] border border-[#333] text-white font-black p-4 rounded-xl input-gold-focus placeholder-gray-800 text-sm" 
              placeholder="0.00"
            />
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-[#1a1a1a] flex justify-end">
          <button type="submit" className="bg-[#FFD700] text-black px-12 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-[#FFA500] active:scale-95 transition-all">
            <i className="fas fa-plus-circle mr-3"></i> Tambah Ke Katalog
          </button>
        </div>
      </form>

      {/* Catalog Display Table */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
           <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.3em]">Senarai Katalog Aktif</h3>
           <div className="relative w-full md:w-96">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"></i>
            <input 
              type="text" 
              placeholder="CARI NAMA ATAU KATEGORI..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#050505] border border-[#333] text-[#FFD700] pl-12 pr-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest input-gold-focus"
            />
          </div>
        </div>

        <div className="bg-[#111] rounded-2xl border border-[#222] shadow-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#1a1a1a] text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-[#222]">
                <th className="p-6">Butiran Perkhidmatan</th>
                <th className="p-6">Kategori</th>
                <th className="p-6 text-right">Harga Standard (RM)</th>
                <th className="p-6 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1c1c]">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-24 text-center">
                    <i className="fas fa-box-open text-gray-800 text-6xl mb-6 block"></i>
                    <p className="text-gray-700 font-bold uppercase italic tracking-[0.3em] text-xs">Tiada rekod inventori ditemui.</p>
                  </td>
                </tr>
              ) : (
                filteredServices.map(svc => (
                  <tr key={svc.id} className="hover:bg-white/[0.05] even:bg-white/[0.02] transition-colors group">
                    <td className="p-6">
                      <span className="font-black text-white uppercase text-sm group-hover:text-[#FFD700] transition-colors">{svc.name}</span>
                    </td>
                    <td className="p-6">
                      <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest border border-gray-800 px-3 py-1 rounded-full">{svc.category}</span>
                    </td>
                    <td className="p-6 text-right">
                      <span className="font-black text-xl text-[#FFD700] tabular-nums">{svc.price.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="p-6 text-center">
                      <button 
                        onClick={() => { if(confirm('Padam servis ini?')) onDelete(svc.id); }}
                        className="text-gray-700 hover:text-red-500 transition-all opacity-20 group-hover:opacity-100"
                      >
                        <i className="fas fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Manager Modal */}
      {showCatManager && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 p-4 animate-fadeIn no-print backdrop-blur-md">
          <div className="bg-[#1a1a1a] w-full max-w-md rounded-3xl border border-[#333] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[#FFD700] font-black uppercase tracking-[0.2em] text-sm">Urus Kategori</h3>
              <button onClick={() => setShowCatManager(false)} className="w-10 h-10 rounded-full bg-red-600/10 text-red-500 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all">&times;</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if(newCatName) { onAddCategory(newCatName.toUpperCase()); setNewCatName(''); } }} className="mb-8">
              <div className="flex gap-3">
                <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="NAMA KATEGORI..." className="flex-1 bg-black border border-[#333] text-white p-4 rounded-xl text-xs font-black input-gold-focus uppercase" />
                <button type="submit" className="bg-[#FFD700] text-black px-6 py-4 rounded-xl font-black text-[10px] uppercase shadow-lg">TAMBAH</button>
              </div>
            </form>
            <div className="max-h-[350px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {categories.map((cat, idx) => (
                <div key={cat} className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-[#333]">
                  <span className="text-xs font-black text-white uppercase">{cat}</span>
                  <div className="flex gap-2">
                    <button onClick={() => onReorderCategory(idx, 'up')} disabled={idx === 0} className="w-8 h-8 flex items-center justify-center bg-[#222] text-gray-500 disabled:opacity-20"><i className="fas fa-chevron-up text-[10px]"></i></button>
                    <button onClick={() => onReorderCategory(idx, 'down')} disabled={idx === categories.length - 1} className="w-8 h-8 flex items-center justify-center bg-[#222] text-gray-500 disabled:opacity-20"><i className="fas fa-chevron-down text-[10px]"></i></button>
                    <button onClick={() => { if(confirm('Padam kategori?')) onDeleteCategory(idx); }} className="w-8 h-8 flex items-center justify-center bg-red-600/10 text-red-500"><i className="fas fa-trash-can text-[10px]"></i></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
