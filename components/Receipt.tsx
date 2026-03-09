
import React, { useState, useEffect, useRef } from 'react';
import { DEFAULT_LOGO } from '../constants';

interface ReceiptProps {
  data: {
    title: string;
    customer: string;
    docNo: string;
    date: string;
    notes?: string;
    items: { name: string; price: number }[];
    total: number;
    isStatement?: boolean;
  };
  logo: string | null;
  onClose: () => void;
}

const Receipt: React.FC<ReceiptProps> = ({ data, logo, onClose }) => {
  const displayLogo = logo || DEFAULT_LOGO;
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Editable state for customer section
  const [customerName, setCustomerName] = useState(data.customer);
  const [customerLabel, setCustomerLabel] = useState('Tandatangan Pelanggan');
  
  // Editable state for firm section
  const [firmName, setFirmName] = useState('HAIRI MUSTAFA');
  const [firmSign, setFirmSign] = useState('HM');
  const [firmLabel, setFirmLabel] = useState('Wakil Firma');

  // Editable state for line items
  const [items, setItems] = useState(data.items);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  
  const [editForm, setEditForm] = useState({
    name: '',
    quantity: 1,
    price: 0
  });

  const currentTotal = items.reduce((sum, item) => sum + item.price, 0);

  useEffect(() => {
    setItems(data.items);
    setCustomerName(data.customer);
  }, [data]);

  const handleEditClick = (index: number) => {
    const item = items[index];
    const qtyMatch = item.name.match(/^(.*)\s\(x(\d+)\)$/);
    
    let name = item.name;
    let quantity = 1;

    if (qtyMatch) {
      name = qtyMatch[1];
      quantity = parseInt(qtyMatch[2], 10);
    }

    setEditForm({
      name: name,
      quantity: quantity,
      price: item.price
    });
    setEditingRow(index);
  };

  const handleSaveItem = (index: number) => {
    const newItems = [...items];
    const finalName = editForm.quantity > 1 
      ? `${editForm.name} (x${editForm.quantity})` 
      : editForm.name;

    newItems[index] = {
      name: finalName,
      price: Number(editForm.price)
    };

    setItems(newItems);
    setEditingRow(null);
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
  };

  const handleDeleteItem = (index: number) => {
    if (confirm("Adakah anda pasti mahu memadam item ini?")) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      if (editingRow === index) {
        setEditingRow(null);
      } else if (editingRow !== null && editingRow > index) {
        setEditingRow(editingRow - 1);
      }
    }
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    setIsGeneratingPDF(true);
    
    // Small delay to ensure any pending renders clear
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const element = receiptRef.current;
      const opt = {
        margin: 0, 
        filename: `Resit_HMA_${data.docNo}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          logging: false,
          letterRendering: true,
          allowTaint: true,
          scrollY: 0
        },
        jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' }
      };

      if ((window as any).html2pdf) {
        await (window as any).html2pdf().from(element).set(opt).save();
      } else {
        throw new Error("Pustaka PDF tidak ditemui.");
      }
    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("Gagal menjana PDF. Sila cuba gunakan fungsi Cetak pelayar.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const inputClasses = "w-full text-center bg-transparent border-none p-0 focus:outline-none input-gold-focus rounded transition-all print:bg-transparent print:border-none";
  const labelInputClasses = "w-full text-center bg-transparent border-none p-0 focus:outline-none text-[7px] font-bold uppercase tracking-wider text-gray-500 placeholder-gray-300 input-gold-focus rounded transition-all print:bg-transparent print:border-none";

  return (
    <div className="flex flex-col items-center min-h-screen">
      {/* Top Action Bar */}
      <div className="w-full max-w-[148mm] bg-[#1a1a1a] p-4 mb-6 rounded-xl border border-[#333] flex items-center justify-between no-print shadow-xl sticky top-4 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#FFD700] rounded-lg flex items-center justify-center">
            <i className="fas fa-file-invoice text-black"></i>
          </div>
          <div>
            <p className="text-white text-[10px] font-black uppercase tracking-widest leading-none">Pratonton Resit</p>
            <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mt-1">Format A5</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleDownloadPDF} 
            disabled={isGeneratingPDF}
            className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg border border-blue-400/30 ${isGeneratingPDF ? 'opacity-50 cursor-not-allowed animate-pulse' : ''}`}
          >
            {isGeneratingPDF ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-file-pdf"></i>}
            {isGeneratingPDF ? 'Menjana...' : 'PDF'}
          </button>
          
          <button 
            onClick={() => window.print()} 
            className="flex items-center gap-2 bg-[#FFD700] hover:bg-[#FFA500] text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg border border-black/10"
          >
            <i className="fas fa-print"></i>
            Cetak
          </button>

          <button 
            onClick={onClose} 
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      {/* Main Receipt Paper - A5 Dimensions (148mm width) */}
      <div 
        ref={receiptRef}
        className="
            paper-texture text-black 
            w-[148mm] max-w-[148mm] min-h-[210mm] 
            p-[15mm] 
            mx-auto relative flex flex-col shadow-2xl 
            
            /* Print Overrides to Ensure Fit */
            print:w-full print:max-w-full print:min-h-0 print:h-auto 
            print:p-[5mm] print:m-0 
            print:shadow-none print:rounded-none
            print:bg-white print:bg-none
            print:block
            box-border
        "
      >
        {/* Background Patterns */}
        <div className="absolute inset-0 border-[6px] border-double border-black pointer-events-none hidden print:block print:inset-[5mm]"></div>
        <div className="absolute inset-0 border-[8px] border-double border-black pointer-events-none block print:hidden"></div>

        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-[0.03] print:opacity-[0.05]">
          <span className="font-legal font-bold text-[80px] -rotate-45 uppercase select-none tracking-widest">
            {data.isStatement ? 'COPY' : 'OFFICIAL'}
          </span>
        </div>

        <div className="relative z-10 flex flex-col h-full justify-between">
          <div>
              {/* Header */}
              <div className="flex items-start justify-between border-b-2 border-black pb-4 mb-4">
                  <div className="flex items-start gap-3">
                    {displayLogo && (
                        <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-white p-0.5 border border-gray-100 print:border-none">
                        <img 
                            src={displayLogo} 
                            alt="Logo" 
                            className="max-h-full max-w-full object-contain"
                            crossOrigin="anonymous" 
                        />
                        </div>
                    )}
                    <div className="flex-1">
                        <h1 className="font-legal text-lg font-bold m-0 leading-tight uppercase tracking-tight text-gray-900">
                        HAIRI MUSTAFA ASSOCIATES
                        </h1>
                        <p className="text-[8px] font-black m-0 uppercase tracking-[0.1em] mt-1 text-gray-700">
                        Peguam Syarie & Pesuruhjaya Sumpah
                        </p>
                        <div className="mt-1 space-y-0.5 text-gray-600 leading-none">
                            <p className="text-[7px] font-bold">Lot 02, Arked Mara, 09100 Baling, Kedah</p>
                            <p className="text-[7px] font-bold">Tel: +604-470 1234</p>
                        </div>
                    </div>
                  </div>
              </div>

              {/* Title & Info */}
              <div className="text-center mb-4">
                  <h2 className="font-legal inline-block text-xl font-bold border-b-2 border-black pb-0.5 px-4 uppercase tracking-[0.2em]">
                      {data.title}
                  </h2>
              </div>

              <div className="flex justify-between items-end mb-4 text-xs border-b border-black/20 pb-2">
                  <div className="text-left">
                    <p className="text-[8px] font-black uppercase text-gray-500 tracking-wider">Diterima Daripada:</p>
                    <p className="font-bold text-sm uppercase">{data.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black uppercase text-gray-500 tracking-wider">No. Rujukan:</p>
                    <p className="font-mono font-bold text-sm">{data.docNo}</p>
                    <p className="text-[8px] font-black uppercase text-gray-500 tracking-wider mt-1">Tarikh:</p>
                    <p className="font-bold text-xs">{data.date}</p>
                  </div>
              </div>

              {/* Line Items */}
              <div className="mb-4">
                  <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b-2 border-black">
                        <th className="py-1 text-left text-[8px] font-black uppercase tracking-wider text-gray-700 w-[65%]">
                            Keterangan
                        </th>
                        <th className="py-1 text-right text-[8px] font-black uppercase tracking-wider text-gray-700">
                            Jumlah (MYR)
                        </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/10">
                        {items.map((item, idx) => (
                        <tr key={idx} className="group relative break-inside-avoid">
                            {editingRow === idx ? (
                                <>
                                <td className="py-2 bg-yellow-50 pr-2">
                                    <input 
                                        type="text" 
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({...editForm, name: e.target.value.toUpperCase()})}
                                        className="w-full text-[9px] font-bold uppercase bg-transparent border-b border-black/30 outline-none input-gold-focus rounded"
                                    />
                                    <div className="flex items-center gap-1 mt-1 no-print">
                                        <span className="text-[8px] font-bold">Qty:</span>
                                        <input 
                                            type="number" min="1"
                                            value={editForm.quantity}
                                            onChange={(e) => setEditForm({...editForm, quantity: parseInt(e.target.value) || 1})}
                                            className="w-10 text-[8px] font-bold border border-gray-300 px-1 input-gold-focus rounded"
                                        />
                                    </div>
                                </td>
                                <td className="py-2 bg-yellow-50 text-right align-top">
                                    <input 
                                        type="number" step="0.01"
                                        value={editForm.price}
                                        onChange={(e) => setEditForm({...editForm, price: parseFloat(e.target.value)})}
                                        className="w-full text-right text-[9px] font-bold bg-transparent border-b border-black/30 outline-none input-gold-focus rounded"
                                    />
                                    <div className="flex justify-end gap-1 mt-1 no-print">
                                        <button onClick={() => handleSaveItem(idx)} className="text-green-600"><i className="fas fa-check"></i></button>
                                        <button onClick={handleCancelEdit} className="text-red-600"><i className="fas fa-times"></i></button>
                                    </div>
                                </td>
                                </>
                            ) : (
                                <>
                                <td className="py-2 pr-2 relative">
                                    <p className="font-bold text-[9px] uppercase leading-tight">{item.name}</p>
                                </td>
                                <td className="py-2 text-right relative group">
                                    <span className="font-bold text-[10px]">{Math.abs(item.price).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</span>
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-2 opacity-0 group-hover:opacity-100 transition-opacity no-print flex gap-1 bg-white">
                                        <button onClick={() => handleEditClick(idx)} className="text-blue-500 text-[10px]"><i className="fas fa-pencil-alt"></i></button>
                                        <button onClick={() => handleDeleteItem(idx)} className="text-red-500 text-[10px]"><i className="fas fa-trash-alt"></i></button>
                                    </div>
                                </td>
                                </>
                            )}
                        </tr>
                        ))}
                    </tbody>
                  </table>
              </div>

              {data.notes && (
                  <div className="mb-4 p-2 bg-gray-50 border border-black/10 rounded print:border-gray-200">
                    <p className="text-[7px] font-black uppercase text-gray-400 mb-0.5 tracking-widest italic">Nota:</p>
                    <p className="text-[9px] font-bold italic whitespace-pre-wrap leading-tight">{data.notes}</p>
                  </div>
              )}
          </div>

          <div className="break-inside-avoid">
              {/* Total */}
              <div className="flex justify-end mb-6">
                  <div className="border-y-2 border-black py-2 px-4 min-w-[50%]">
                      <div className="flex justify-between items-end">
                          <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mr-4">Jumlah Besar</p>
                          <p className="text-xl font-black tracking-tighter">RM {currentTotal.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
                      </div>
                  </div>
              </div>

              {/* Signatures & Stamp */}
              <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="text-center pt-8">
                      <div className="border-t border-black pt-1">
                          <input 
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              className={`${inputClasses} text-[9px] font-bold uppercase`}
                          />
                          <input 
                              value={customerLabel}
                              onChange={(e) => setCustomerLabel(e.target.value)}
                              className={labelInputClasses}
                          />
                      </div>
                  </div>
                  
                  <div className="text-center relative">
                      {/* CSS Stamp - Official Looking */}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[60%] w-20 h-20 border-[3px] border-double border-blue-900 rounded-full opacity-80 pointer-events-none flex items-center justify-center -rotate-12 z-0 mix-blend-multiply print:opacity-100">
                          <div className="w-[92%] h-[92%] border border-blue-900 rounded-full flex items-center justify-center p-1">
                              <div className="text-center flex flex-col items-center justify-center h-full w-full">
                                  <div className="w-full border-t border-blue-900 mb-0.5 opacity-50"></div>
                                  <p className="text-[5px] font-black text-blue-900 uppercase tracking-widest leading-none">PEGUAM SYARIE</p>
                                  <p className="text-[7px] font-black text-blue-900 uppercase tracking-tighter leading-none my-0.5">HAIRI MUSTAFA</p>
                                  <p className="text-[5px] font-black text-blue-900 uppercase tracking-widest leading-none">ASSOCIATES</p>
                                  <div className="w-full border-b border-blue-900 mt-0.5 opacity-50"></div>
                              </div>
                          </div>
                      </div>

                      <div className="h-10 flex items-end justify-center relative z-10">
                           <input 
                              value={firmSign}
                              onChange={(e) => setFirmSign(e.target.value)}
                              className="w-full font-signature text-xl text-center bg-transparent border-none p-0 focus:outline-none input-gold-focus rounded"
                          />
                      </div>
                      <div className="border-t border-black pt-1 relative z-10">
                          <input 
                              value={firmName}
                              onChange={(e) => setFirmName(e.target.value)}
                              className={`${inputClasses} text-[9px] font-bold uppercase`}
                          />
                          <input 
                              value={firmLabel}
                              onChange={(e) => setFirmLabel(e.target.value)}
                              className={labelInputClasses}
                          />
                      </div>
                  </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
