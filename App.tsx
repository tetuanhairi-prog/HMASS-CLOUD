
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PageId, AppState, Client, PjsRecord, ServiceItem, LedgerEntry, FinanceEntry } from './types';
import { loadFromStorage, saveToStorage } from './services/storageService';
import { syncToSheets, fetchFromSheets } from './services/syncService';
import Navbar from './components/Navbar';
import Header from './components/Header';
import HomePage from './components/HomePage';
import GuamanPage from './components/GuamanPage';
import PjsPage from './components/PjsPage';
import InventoryPage from './components/InventoryPage';
import InvoicePage from './components/InvoicePage';
import FinancePage from './components/FinancePage';
import Receipt from './components/Receipt';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => loadFromStorage());
  const [receiptData, setReceiptData] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  
  const lastSavedDataRef = useRef<string>(JSON.stringify({
    clients: state.clients,
    pjsRecords: state.pjsRecords,
    inventory: state.inventory,
    inventoryCategories: state.inventoryCategories,
    finances: state.finances,
    financeFolders: state.financeFolders,
    firmLogo: state.firmLogo,
    googleSheetUrl: state.googleSheetUrl,
    previousSheetUrls: state.previousSheetUrls
  }));

  const getCurrentTime = () => {
    return new Date().toLocaleString('ms-MY', { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });
  };

  const loadCloudData = useCallback(async (isManual = false) => {
    if (!state.googleSheetUrl || !state.googleSheetUrl.startsWith("https://")) {
      if(isManual) alert("Sila masukkan URL Google Script yang sah.");
      return;
    }
    
    setIsSyncing(true);
    try {
      const cloudData = await fetchFromSheets(state.googleSheetUrl);
      
      if (cloudData && typeof cloudData === 'object') {
        const newState = {
          ...state,
          clients: cloudData.clients || state.clients,
          pjsRecords: cloudData.pjsRecords || state.pjsRecords,
          inventory: cloudData.inventory || state.inventory,
          inventoryCategories: cloudData.inventoryCategories || state.inventoryCategories,
          finances: cloudData.finances || state.finances,
          financeFolders: cloudData.financeFolders || state.financeFolders,
          lastCloudUpdate: getCurrentTime(),
        };

        setState(newState);
        lastSavedDataRef.current = JSON.stringify({
          clients: newState.clients,
          pjsRecords: newState.pjsRecords,
          inventory: newState.inventory,
          inventoryCategories: newState.inventoryCategories,
          finances: newState.finances,
          financeFolders: newState.financeFolders,
          firmLogo: newState.firmLogo,
          googleSheetUrl: newState.googleSheetUrl,
          previousSheetUrls: newState.previousSheetUrls
        });

        if (isManual) alert("Data berjaya dikemaskini dari Cloud.");
      }
    } catch (e) {
      console.error("Cloud load error:", e);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  }, [state.googleSheetUrl]);

  useEffect(() => {
    const currentData = JSON.stringify({
      clients: state.clients,
      pjsRecords: state.pjsRecords,
      inventory: state.inventory,
      inventoryCategories: state.inventoryCategories,
      finances: state.finances,
      financeFolders: state.financeFolders,
      firmLogo: state.firmLogo,
      googleSheetUrl: state.googleSheetUrl,
      previousSheetUrls: state.previousSheetUrls
    });

    if (currentData !== lastSavedDataRef.current) {
      const timer = setTimeout(() => setShowSaveConfirm(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [state.clients, state.pjsRecords, state.inventory, state.inventoryCategories, state.finances, state.financeFolders, state.firmLogo, state.googleSheetUrl]);

  useEffect(() => { loadCloudData(); }, []);

  const handleManualSave = () => {
    saveToStorage(state);
    lastSavedDataRef.current = JSON.stringify({
      clients: state.clients,
      pjsRecords: state.pjsRecords,
      inventory: state.inventory,
      inventoryCategories: state.inventoryCategories,
      finances: state.finances,
      financeFolders: state.financeFolders,
      firmLogo: state.firmLogo,
      googleSheetUrl: state.googleSheetUrl,
      previousSheetUrls: state.previousSheetUrls
    });
    setShowSaveConfirm(false);
  };

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => {
      const isDataUpdate = Object.keys(updates).some(k => 
        ['clients', 'pjsRecords', 'inventory', 'inventoryCategories', 'finances', 'firmLogo', 'financeFolders', 'googleSheetUrl'].includes(k)
      );
      
      return { 
        ...prev, 
        ...updates,
        lastLocalUpdate: isDataUpdate ? getCurrentTime() : prev.lastLocalUpdate
      };
    });
  };

  // Sync effect: Trigger sync when data changes
  useEffect(() => {
    const currentData = {
      clients: state.clients,
      pjsRecords: state.pjsRecords,
      inventory: state.inventory,
      inventoryCategories: state.inventoryCategories,
      finances: state.finances,
      financeFolders: state.financeFolders,
      firmLogo: state.firmLogo
    };
    
    // Only sync if it's not the initial load and we have a URL
    if (state.googleSheetUrl && state.lastLocalUpdate !== "Tiada rekod") {
      performSync(state);
    }
  }, [state.clients, state.pjsRecords, state.inventory, state.inventoryCategories, state.finances, state.financeFolders, state.firmLogo]);

  const performSync = async (payload: AppState) => {
    if (!state.googleSheetUrl) return;
    setIsSyncing(true);
    try {
      await syncToSheets({ 
        clients: payload.clients,
        pjsRecords: payload.pjsRecords,
        inventory: payload.inventory,
        inventoryCategories: payload.inventoryCategories,
        finances: payload.finances,
        financeFolders: payload.financeFolders,
        type: "FULL_UPDATE", 
        timestamp: new Date().toISOString() 
      }, state.googleSheetUrl);
    } finally {
      setTimeout(() => setIsSyncing(false), 1000);
    }
  };

  const handleSaveUrl = () => {
    if (!state.googleSheetUrl || !state.googleSheetUrl.startsWith("https://")) {
      return alert("URL tidak sah!");
    }
    
    const currentHistory = state.previousSheetUrls || [];
    const newHistory = [
      state.googleSheetUrl,
      ...currentHistory.filter(u => u !== state.googleSheetUrl)
    ].slice(0, 5); // Simpan 5 yang terbaru sahaja

    updateState({ previousSheetUrls: newHistory });
    handleManualSave();
    alert("URL disimpan ke sejarah.");
  };

  const selectHistoryUrl = (url: string) => {
    updateState({ googleSheetUrl: url });
  };

  const addClient = (client: Omit<Client, 'id' | 'ledger'>, initialFee: number, date: string) => {
    const newClient: Client = { ...client, id: crypto.randomUUID(), ledger: [{ date: date, desc: "FEE PROFESSIONAL DIPERSETUJUI", amt: initialFee }] };
    updateState({ clients: [...state.clients, newClient] });
  };

  const deleteClient = (id: string) => updateState({ clients: state.clients.filter(c => c.id !== id), activeClientIdx: null });

  const addPjsRecord = (record: Omit<PjsRecord, 'id'>) => updateState({ pjsRecords: [{ ...record, id: crypto.randomUUID() }, ...state.pjsRecords] });

  const deletePjsRecord = (id: string) => updateState({ pjsRecords: state.pjsRecords.filter(r => r.id !== id) });

  const addFinanceEntry = (entry: Omit<FinanceEntry, 'id'>) => updateState({ finances: [{ ...entry, id: crypto.randomUUID() }, ...state.finances] });

  const deleteFinanceEntry = (id: string) => updateState({ finances: state.finances.filter(f => f.id !== id) });

  const addFinanceFolder = (name: string) => {
    const upperName = name.toUpperCase();
    setState(prev => ({
      ...prev,
      financeFolders: [...prev.financeFolders, upperName],
      lastLocalUpdate: getCurrentTime()
    }));
  };

  const deleteFinanceFolder = (idx: number) => {
    setState(prev => ({
      ...prev,
      financeFolders: prev.financeFolders.filter((_, i) => i !== idx),
      lastLocalUpdate: getCurrentTime()
    }));
  };

  const reorderFinanceFolder = (idx: number, direction: 'up' | 'down') => {
    setState(prev => {
      const newFolders = [...prev.financeFolders];
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= newFolders.length) return prev;
      [newFolders[idx], newFolders[targetIdx]] = [newFolders[targetIdx], newFolders[idx]];
      return {
        ...prev,
        financeFolders: newFolders,
        lastLocalUpdate: getCurrentTime()
      };
    });
  };

  const addService = (service: Omit<ServiceItem, 'id'>) => updateState({ inventory: [...state.inventory, { ...service, id: crypto.randomUUID() }] });

  const deleteService = (id: string) => updateState({ inventory: state.inventory.filter(s => s.id !== id) });

  const addInventoryCategory = (name: string) => {
    const upperName = name.toUpperCase();
    setState(prev => ({
      ...prev,
      inventoryCategories: [...prev.inventoryCategories, upperName],
      lastLocalUpdate: getCurrentTime()
    }));
  };
  
  const deleteInventoryCategory = (idx: number) => {
    setState(prev => ({
      ...prev,
      inventoryCategories: prev.inventoryCategories.filter((_, i) => i !== idx),
      lastLocalUpdate: getCurrentTime()
    }));
  };

  const reorderInventoryCategory = (idx: number, direction: 'up' | 'down') => {
    setState(prev => {
      const newCats = [...prev.inventoryCategories];
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= newCats.length) return prev;
      [newCats[idx], newCats[targetIdx]] = [newCats[targetIdx], newCats[idx]];
      return {
        ...prev,
        inventoryCategories: newCats,
        lastLocalUpdate: getCurrentTime()
      };
    });
  };

  const updateLedger = (clientIdx: number, newEntry: LedgerEntry) => {
    const newClients = [...state.clients];
    if (newClients[clientIdx]) {
      newClients[clientIdx].ledger = [...newClients[clientIdx].ledger, newEntry];
      updateState({ clients: newClients });
    }
  };

  const deleteLedgerEntry = (clientIdx: number, entryIdx: number) => {
    const newClients = [...state.clients];
    if (newClients[clientIdx]) {
      newClients[clientIdx].ledger.splice(entryIdx, 1);
      updateState({ clients: newClients });
    }
  };

  const { currentPage, activeClientIdx, clients, pjsRecords, inventory, inventoryCategories, finances, financeFolders, invCounter, firmLogo, googleSheetUrl, previousSheetUrls, lastLocalUpdate, lastCloudUpdate } = state;
  const showLedger = currentPage === 'guaman' && activeClientIdx !== null && activeClientIdx < clients.length;

  return (
    <div className="min-h-screen pb-10 bg-[#080808]">
      <div className="max-w-6xl mx-auto px-4 py-8 no-print">
        <div className="bg-[#121212] rounded-xl border border-[#2a2a2a] shadow-2xl overflow-hidden">
          <Header 
            logo={firmLogo} 
            onLogoChange={(logo) => updateState({ firmLogo: logo })} 
            syncing={isSyncing}
            onOpenSettings={() => setShowSettings(true)}
            onRefresh={() => loadCloudData(true)}
          />
          <Navbar currentPage={currentPage} onPageChange={(page) => updateState({ currentPage: page })} />
          
          <main className="p-6 md:p-10 bg-[#121212]">
            {currentPage === 'home' && <HomePage state={state} onNavigate={(page) => updateState({ currentPage: page })} />}
            {currentPage === 'guaman' && <GuamanPage clients={clients} onAdd={addClient} onDelete={deleteClient} onOpenLedger={(idx) => updateState({ activeClientIdx: idx })} onImport={(data) => updateState({ clients: data })} />}
            {currentPage === 'pjs' && <PjsPage records={pjsRecords} onAdd={addPjsRecord} onDelete={deletePjsRecord} onImport={(data) => updateState({ pjsRecords: data })} />}
            {currentPage === 'kewangan' && (
              <FinancePage 
                finances={finances} folders={financeFolders} onAddEntry={addFinanceEntry} onDeleteEntry={deleteFinanceEntry} 
                onAddFolder={addFinanceFolder} onDeleteFolder={deleteFinanceFolder} onReorderFolder={reorderFinanceFolder}
                onImport={(data) => updateState({ finances: data })}
              />
            )}
            {currentPage === 'inventory' && (
              <InventoryPage 
                services={inventory} categories={inventoryCategories} onAdd={addService} onDelete={deleteService}
                onAddCategory={addInventoryCategory} onDeleteCategory={deleteInventoryCategory} onReorderCategory={reorderInventoryCategory}
                onImport={(data) => updateState({ inventory: data })}
              />
            )}
            {currentPage === 'invoice' && <InvoicePage clients={clients} services={inventory} invCounter={invCounter} onProcessPayment={(receipt) => {
              setReceiptData(receipt);
              updateState({
                invCounter: invCounter + 1,
                finances: [{ id: crypto.randomUUID(), date: receipt.date, type: 'MASUK', category: 'FEE GUAMAN', desc: `RESIT ${receipt.docNo}: ${receipt.customer}`, amount: receipt.total }, ...finances]
              });
            }} />}
          </main>
        </div>
      </div>

      {showSaveConfirm && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4 animate-slideUp no-print">
          <div className="bg-[#1e1e1e] border-2 border-[#FFD700]/40 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
             <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#FFD700]/20 flex items-center justify-center text-[#FFD700]"><i className="fas fa-save text-xl"></i></div>
                <div>
                   <h4 className="text-white font-black uppercase text-xs tracking-widest">Simpan Perubahan?</h4>
                   <p className="text-gray-400 text-[10px] font-bold mt-1 uppercase leading-tight">Data baru dikesan. Kemaskini storan tempatan?</p>
                </div>
             </div>
             <div className="flex gap-2">
                <button onClick={handleManualSave} className="flex-1 py-3 bg-[#FFD700] text-black font-black rounded-xl uppercase text-[10px] tracking-widest hover:bg-[#FFA500] transition-all">Simpan Sekarang</button>
                <button onClick={() => setShowSaveConfirm(false)} className="px-4 py-3 bg-white/10 text-gray-300 font-black rounded-xl uppercase text-[10px] tracking-widest">Abai</button>
             </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 no-print animate-fadeIn">
          <div className="bg-[#1a1a1a] w-full max-w-md rounded-2xl border border-[#333] p-8 shadow-2xl relative">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[#FFD700] font-black uppercase tracking-[0.2em] text-sm">Tetapan Cloud Sync</h3>
              <button onClick={() => setShowSettings(false)} className="w-10 h-10 rounded-full bg-red-600/10 text-red-500 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all">&times;</button>
            </div>
            
            <div className="space-y-8">
              <div className="bg-black/40 rounded-xl p-5 border border-[#333] space-y-3 text-[10px]">
                <div className="flex justify-between items-center"><span className="font-black text-gray-500 uppercase tracking-widest">Local Status</span><span className="font-mono text-[#FFD700]">{lastLocalUpdate}</span></div>
                <div className="flex justify-between items-center"><span className="font-black text-gray-500 uppercase tracking-widest">Cloud Sync</span><span className="font-mono text-[#FFD700]">{lastCloudUpdate}</span></div>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Google Apps Script URL</label>
                <div className="relative group">
                  <i className="fas fa-link absolute left-4 top-1/2 -translate-y-1/2 text-[#FFD700]/40"></i>
                  <input 
                    type="text" 
                    value={googleSheetUrl} 
                    onChange={(e) => updateState({ googleSheetUrl: e.target.value })} 
                    placeholder="https://script.google.com/macros/s/..."
                    className="w-full bg-black border border-[#333] text-white pl-12 pr-4 py-4 rounded-xl text-xs font-mono input-gold-focus" 
                  />
                </div>
                
                {/* Previous URLs Picker */}
                {previousSheetUrls && previousSheetUrls.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] ml-1">Sejarah URL (Pilih Cepat)</p>
                    <div className="space-y-2">
                      {previousSheetUrls.map((url, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => selectHistoryUrl(url)}
                          className={`w-full text-left p-3 rounded-xl border text-[10px] font-mono truncate transition-all ${googleSheetUrl === url ? 'bg-[#FFD700]/10 border-[#FFD700]/30 text-[#FFD700]' : 'bg-[#0d0d0d] border-[#222] text-gray-500 hover:border-[#444] hover:text-gray-300'}`}
                        >
                          {url}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleSaveUrl} 
                  className="w-full py-4 bg-[#FFD700] text-black font-black rounded-xl text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-[#FFA500] active:scale-95 transition-all"
                >
                  <i className="fas fa-save mr-2"></i> Simpan & Rekod URL
                </button>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#333]">
                <button onClick={() => loadCloudData(true)} className="flex-1 py-4 bg-blue-600/10 text-blue-500 border border-blue-600/20 font-black rounded-xl uppercase text-[10px] tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl">
                  <i className="fas fa-download mr-2"></i> Tarik
                </button>
                <button onClick={() => performSync(state)} className="flex-1 py-4 bg-green-600/10 text-green-500 border border-green-600/20 font-black rounded-xl uppercase text-[10px] tracking-widest hover:bg-green-600 hover:text-white transition-all shadow-xl">
                  <i className="fas fa-upload mr-2"></i> Hantar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLedger && activeClientIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 no-print animate-fadeIn backdrop-blur-sm">
          <div className="bg-[#1a1a1a] w-full max-w-4xl rounded-2xl border border-[#333] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slideUp">
            <div className="p-6 bg-[#1a1a1a] flex justify-between items-center border-b border-[#333]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#FFD700]/10 flex items-center justify-center text-[#FFD700] border border-[#FFD700]/20"><i className="fas fa-folder-open text-xl"></i></div>
                <div><h3 className="text-xl font-black text-white uppercase">{clients[activeClientIdx].name}</h3></div>
              </div>
              <button onClick={() => updateState({ activeClientIdx: null })} className="w-10 h-10 rounded-xl bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all"><i className="fas fa-times text-lg"></i></button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-[#121212]/30">
              <LedgerForm onAdd={(entry) => updateLedger(activeClientIdx!, entry)} />
              <div className="bg-[#181818] rounded-xl border border-[#333] mt-8 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFD700] text-black uppercase font-black tracking-widest">
                    <tr><th className="p-4">Tarikh</th><th className="p-4">Keterangan</th><th className="p-4 text-right">Amaun (RM)</th><th className="p-4 w-12"></th></tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {clients[activeClientIdx].ledger.map((t, i) => (
                      <tr key={i} className="hover:bg-white/[0.05] even:bg-white/[0.02] group transition-colors">
                        <td className="p-4 text-gray-500 font-mono">{t.date}</td>
                        <td className="p-4 text-white font-bold uppercase">{t.desc}</td>
                        <td className={`p-4 text-right font-black ${t.amt < 0 ? 'text-green-500' : 'text-red-500'}`}>{t.amt.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4"><button onClick={() => deleteLedgerEntry(activeClientIdx!, i)} className="text-red-500 opacity-0 group-hover:opacity-100"><i className="fas fa-trash-can"></i></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-6 bg-[#1a1a1a] border-t border-[#333] flex justify-end items-center gap-6">
               <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Baki Tertunggak</span>
               <div className={`px-6 py-3 rounded-xl border-2 font-black text-2xl tabular-nums shadow-lg ${clients[activeClientIdx].ledger.reduce((s,t) => s + t.amt, 0) > 0 ? 'bg-red-600/10 border-red-600/40 text-red-500' : 'bg-green-600/10 border-green-600/40 text-green-500'}`}>
                 RM {clients[activeClientIdx].ledger.reduce((s,t) => s + t.amt, 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
               </div>
            </div>
          </div>
        </div>
      )}

      {receiptData && (
        <div id="receipt-print" className="fixed inset-0 z-[100] bg-white overflow-y-auto p-4 md:p-10 print:p-0 print:overflow-visible">
           <div className="max-w-[148mm] mx-auto print:max-w-none print:w-full print:mx-0">
            <Receipt data={receiptData} logo={firmLogo} onClose={() => setReceiptData(null)} />
           </div>
        </div>
      )}
    </div>
  );
};

const LedgerForm: React.FC<{ onAdd: (entry: LedgerEntry) => void }> = ({ onAdd }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [desc, setDesc] = useState('');
  const [amt, setAmt] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amt) return;
    onAdd({ date, desc: desc.toUpperCase(), amt: parseFloat(amt) });
    setDesc(''); setAmt('');
  };
  return (
    <form onSubmit={handleSubmit} className="bg-[#222]/50 p-6 rounded-2xl border border-[#333] grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
      <div className="md:col-span-3"><label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Tarikh</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-black border border-[#444] text-white p-4 rounded-xl text-sm input-gold-focus" /></div>
      <div className="md:col-span-5"><label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Butiran</label><input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="BAYARAN..." className="w-full bg-black border border-[#444] text-white p-4 rounded-xl text-sm input-gold-focus uppercase" /></div>
      <div className="md:col-span-4 flex gap-3">
        <div className="flex-1"><label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Amaun (RM)</label><input type="number" step="0.01" value={amt} onChange={e => setAmt(e.target.value)} placeholder="0.00" className="w-full bg-black border border-[#444] text-white p-4 rounded-xl text-sm input-gold-focus" /></div>
        <button type="submit" className="bg-[#FFD700] text-black px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl">SIMPAN</button>
      </div>
    </form>
  );
};

export default App;
