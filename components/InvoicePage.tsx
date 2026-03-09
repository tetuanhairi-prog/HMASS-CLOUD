
import React, { useState, useEffect } from 'react';
import { Client, ServiceItem } from '../types';

interface InvoicePageProps {
  clients: Client[];
  services: ServiceItem[];
  invCounter: number;
  onProcessPayment: (receiptData: any) => void;
}

interface InvoiceLineItem {
  name: string;
  price: number;
  quantity: number;
}

const DRAFT_KEY = 'hma_draft_invoice';

const InvoicePage: React.FC<InvoicePageProps> = ({ clients, services, invCounter, onProcessPayment }) => {
  const [invNo, setInvNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [isManualCustomer, setIsManualCustomer] = useState(false);
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [currentItems, setCurrentItems] = useState<InvoiceLineItem[]>([]);

  const [manualName, setManualName] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualQty, setManualQty] = useState('1');
  
  useEffect(() => {
    const year = new Date().getFullYear();
    setInvNo(`INV-${year}${String(invCounter).padStart(4, '0')}`);
  }, [invCounter]);

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const d = JSON.parse(saved);
        if (d.date) setDate(d.date);
        setSelectedCustomer(d.selectedCustomer || '');
        setManualCustomerName(d.manualCustomerName || '');
        setIsManualCustomer(d.isManualCustomer || false);
        setNotes(d.notes || '');
        setCurrentItems(d.currentItems || []);
        setManualName(d.manualName || '');
        setManualPrice(d.manualPrice || '');
        setManualQty(d.manualQty || '1');
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    const draft = { date, selectedCustomer, isManualCustomer, manualCustomerName, notes, currentItems, manualName, manualPrice, manualQty };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [date, selectedCustomer, isManualCustomer, manualCustomerName, notes, currentItems, manualName, manualPrice, manualQty]);

  const addItem = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    const item = JSON.parse(val) as ServiceItem;
    setCurrentItems([...currentItems, { name: item.name, price: item.price, quantity: 1 }]);
    e.target.value = ""; 
  };

  const addManualItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName || !manualPrice) return;
    const price = parseFloat(manualPrice);
    const qty = parseInt(manualQty) || 1;
    if (isNaN(price)) return;
    setCurrentItems([...currentItems, { name: manualName.toUpperCase(), price, quantity: qty }]);
    clearManualFields();
  };

  const clearManualFields = () => {
    setManualName('');
    setManualPrice('');
    setManualQty('1');
  };

  const updateItem = (idx: number, field: keyof InvoiceLineItem, value: string | number) => {
    const newItems = [...currentItems];
    if (field === 'price') newItems[idx].price = parseFloat(value.toString()) || 0;
    else if (field === 'quantity') newItems[idx].quantity = parseInt(value.toString()) || 0;
    else if (field === 'name') newItems[idx].name = value.toString();
    setCurrentItems(newItems);
  };

  const removeItem = (idx: number) => setCurrentItems(currentItems.filter((_, i) => i !== idx));
  const total = currentItems.reduce((s, i) => s + (i.price * i.quantity), 0);

  const handlePrint = () => {
    const customer = isManualCustomer ? manualCustomerName.toUpperCase() : selectedCustomer;
    if (!customer) return alert("Sila pilih atau masukkan nama pelanggan!");
    if (currentItems.length === 0) return alert("Tambah sekurang-kurangnya 1 item!");
    onProcessPayment({
      title: "RESIT RASMI",
      customer: customer,
      docNo: invNo,
      date: date,
      notes: notes,
      items: currentItems.map(it => ({ name: it.quantity > 1 ? `${it.name} (x${it.quantity})` : it.name, price: it.price * it.quantity })),
      total: total
    });
    setCurrentItems([]); setSelectedCustomer(''); setManualCustomerName(''); setIsManualCustomer(false); setNotes(''); setManualName('');
    localStorage.removeItem(DRAFT_KEY);
  };

  return (
    <div className="animate-fadeIn max-w-5xl mx-auto space-y-2">
      <div className="bg-[#1a1a1a] rounded-t-2xl border-x border-t border-[#333] p-8 flex flex-col md:flex-row justify-between items-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#FFD700]"></div>
        <div className="relative z-10 flex items-center gap-5">
            <div className="bg-[#FFD700] p-4 rounded-xl shadow-lg"><i className="fas fa-file-invoice-dollar text-black text-3xl"></i></div>
            <div>
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Penjanaan Resit</h2>
                <p className="text-[#FFD700]/70 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Sistem Pengurusan Kewangan Firma</p>
            </div>
        </div>
        <div className="relative z-10 mt-6 md:mt-0 text-right">
             <div className="bg-black/40 border border-[#FFD700]/20 rounded-xl px-6 py-3">
                <span className="block text-[9px] text-gray-500 font-black uppercase tracking-[0.3em] mb-1">No. Resit Seterusnya</span>
                <span className="block text-2xl font-mono font-black text-[#FFD700] tracking-wider">{invNo}</span>
             </div>
        </div>
      </div>

      <div className="bg-[#141414] rounded-b-2xl shadow-2xl overflow-hidden border-x border-b border-[#333]">
        <div className="grid grid-cols-1 md:grid-cols-12 border-b border-[#333]">
            <div className="md:col-span-4 p-8 border-b md:border-b-0 md:border-r border-[#333] bg-[#1a1a1a]/50">
                <label className="block text-[11px] font-black uppercase text-[#FFD700] mb-3 tracking-[0.2em]">Tarikh Dokumen</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-[#0d0d0d] border border-[#333] text-white text-sm font-black rounded-xl p-4 input-gold-focus" />
            </div>
            <div className="md:col-span-8 p-8">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-[11px] font-black uppercase text-[#FFD700] tracking-[0.2em]">Pilih Pelanggan / Fail</label>
                  <button onClick={() => setIsManualCustomer(!isManualCustomer)} className="text-[9px] font-black uppercase tracking-widest px-4 py-1.5 bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30 hover:bg-[#FFD700] hover:text-black transition-all rounded-full">{isManualCustomer ? 'Guna Senarai' : 'Daftar Baru'}</button>
                </div>
                {isManualCustomer ? (
                  <input type="text" value={manualCustomerName} onChange={(e) => setManualCustomerName(e.target.value)} placeholder="MASUKKAN NAMA PELANGGAN..." className="w-full bg-[#0d0d0d] border border-[#333] text-white text-sm font-black rounded-xl p-4 input-gold-focus uppercase" />
                ) : (
                  <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} className="w-full appearance-none bg-[#0d0d0d] border border-[#333] text-white text-sm font-black rounded-xl p-4 pr-12 input-gold-focus uppercase">
                    <option value="">-- Sila Pilih Pelanggan --</option>
                    {clients.map(c => <option key={c.id} value={c.name}>{c.name} - {c.detail}</option>)}
                    <option value="PELANGGAN TUNAI">PELANGGAN TUNAI (WALK-IN)</option>
                  </select>
                )}
            </div>
        </div>

        <div className="p-8 bg-[#1a1a1a]/30 border-b border-[#333] space-y-8">
            <div>
                <label className="block text-[11px] font-black uppercase text-gray-500 mb-3 tracking-[0.2em]">Ambil Dari Inventori</label>
                <select onChange={addItem} className="w-full bg-[#0d0d0d] border-2 border-dashed border-[#333] text-[#FFD700] font-black rounded-xl p-4 input-gold-focus uppercase text-xs">
                    <option value="">+ KLIK UNTUK PILIH ITEM...</option>
                    {services.map(s => <option key={s.id} value={JSON.stringify(s)}>{s.name} — RM {s.price.toFixed(2)}</option>)}
                </select>
            </div>
            <div className="flex items-center gap-6"><div className="h-px bg-[#333] flex-1"></div><span className="text-[9px] font-black text-gray-700 uppercase tracking-[0.4em]">ATAU DAFTAR MANUAL</span><div className="h-px bg-[#333] flex-1"></div></div>
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow-[4]"><input type="text" value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="Keterangan Item..." className="w-full bg-[#0d0d0d] border border-[#333] text-white text-sm font-black rounded-xl p-4 input-gold-focus uppercase" /></div>
                <div className="flex-grow-[1] min-w-[140px]"><input type="number" step="0.01" value={manualPrice} onChange={(e) => setManualPrice(e.target.value)} placeholder="Harga" className="w-full bg-[#0d0d0d] border border-[#333] text-white text-sm font-black rounded-xl p-4 input-gold-focus" /></div>
                <div className="flex-grow-[0] w-24"><input type="number" min="1" value={manualQty} onChange={(e) => setManualQty(e.target.value)} placeholder="Unit" className="w-full bg-[#0d0d0d] border border-[#333] text-white text-sm font-black rounded-xl p-4 input-gold-focus text-center" /></div>
                <div className="flex gap-2">
                    <button onClick={addManualItem} className="px-6 py-4 bg-[#FFD700] text-black rounded-xl font-black text-xs uppercase shadow-lg hover:bg-[#FFA500] active:scale-95 transition-all"><i className="fas fa-plus"></i></button>
                    <button onClick={(e) => { e.preventDefault(); clearManualFields(); }} className="px-6 py-4 bg-red-600/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-600 hover:text-white shadow-lg active:scale-95 transition-all"><i className="fas fa-eraser"></i></button>
                </div>
            </div>
        </div>

        <div className="p-8">
            <div className="bg-[#0d0d0d] border border-[#333] rounded-2xl overflow-hidden mb-8 shadow-inner">
                <table className="w-full text-left">
                    <thead className="bg-[#1a1a1a] text-gray-500 border-b border-[#333]">
                        <tr className="text-[10px] font-black uppercase tracking-[0.2em]">
                            <th className="p-5">Butiran Perkhidmatan</th>
                            <th className="p-5 text-center w-28">Unit</th>
                            <th className="p-5 text-right w-40">Amaun (RM)</th>
                            <th className="p-5 w-16"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1c1c1c]">
                        {currentItems.length === 0 ? (
                            <tr><td colSpan={4} className="p-20 text-center text-gray-800 font-black uppercase text-[10px] tracking-[0.3em]">Tiada item dalam senarai</td></tr>
                        ) : (
                            currentItems.map((it, idx) => (
                                <tr key={idx} className="hover:bg-white/[0.02]">
                                    <td className="p-4"><input type="text" value={it.name} onChange={(e) => updateItem(idx, 'name', e.target.value)} className="w-full font-black text-white uppercase text-sm bg-transparent border-none outline-none input-gold-focus rounded p-2" /></td>
                                    <td className="p-4"><input type="number" min="1" value={it.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} className="w-full bg-black/40 border-none text-center font-black text-white text-sm p-2 input-gold-focus rounded" /></td>
                                    <td className="p-4 text-right"><span className="font-black text-lg text-[#FFD700]">{(it.price * it.quantity).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</span></td>
                                    <td className="p-4 text-center"><button onClick={() => removeItem(idx)} className="text-gray-700 hover:text-red-500"><i className="fas fa-trash-can"></i></button></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    {currentItems.length > 0 && <tfoot className="bg-[#1a1a1a]/40"><tr className="border-t border-[#333]"><td colSpan={2} className="p-6 text-right text-[11px] font-black uppercase tracking-[0.3em] text-gray-500">Jumlah Kasar</td><td className="p-6 text-right"><span className="font-black text-2xl text-white">RM {total.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</span></td><td></td></tr></tfoot>}
                </table>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
                <div className="lg:col-span-8">
                    <label className="block text-[11px] font-black uppercase text-gray-600 mb-3 tracking-[0.2em]">Nota Tambahan</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full border border-[#333] bg-[#0d0d0d] rounded-2xl p-5 text-sm font-black text-white input-gold-focus h-28 resize-none shadow-inner uppercase"></textarea>
                </div>
                <div className="lg:col-span-4 space-y-4">
                    <button onClick={handlePrint} disabled={currentItems.length === 0 || (!selectedCustomer && !manualCustomerName)} className={`px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] w-full shadow-2xl transition-all active:scale-95 ${currentItems.length > 0 && (selectedCustomer || manualCustomerName) ? 'bg-[#FFD700] text-black hover:bg-[#FFA500]' : 'bg-[#222] text-gray-700 cursor-not-allowed'}`}>Sahkan & Jana Resit</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;
