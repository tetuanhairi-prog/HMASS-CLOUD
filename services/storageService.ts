
import { AppState, PjsRecord, Client } from '../types';
import { GOOGLE_SHEET_URL } from '../constants';

const STORAGE_KEY = 'hma_sistem_data_v3';

const INITIAL_CLIENT_DATA: Client[] = [
  { id: 'c1', name: 'AMIRA', phone: '012-3456789', detail: 'N.Anak', category: 'LAWYER HM', ledger: [{ date: '2025-01-01', desc: 'FEE PROFESSIONAL DIPERSETUJUI', amt: 2500 }] },
  { id: 'c2', name: 'AMIR', phone: '019-9876543', detail: 'Faraid Pusaka', category: 'LAWYER HM', ledger: [{ date: '2025-01-01', desc: 'FEE PROFESSIONAL DIPERSETUJUI', amt: 4000 }] },
];

const INITIAL_PJS_DATA: PjsRecord[] = [
  { id: '1', date: '2025-11-02', name: 'AHMAD SUBRI BIN HARUN', detail: 'AKUAN BERKANUN', amount: 10 },
];

const DEFAULT_INV_CATEGORIES = ['GUAMAN SYARIE', 'PESURUHJAYA SUMPAH', 'DOKUMENTASI', 'CONSULTATION', 'LAIN-LAIN'];

export const saveToStorage = (state: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const loadFromStorage = (): AppState => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      return {
        clients: parsed.clients || INITIAL_CLIENT_DATA,
        pjsRecords: parsed.pjsRecords || INITIAL_PJS_DATA,
        inventory: parsed.inventory || [],
        inventoryCategories: parsed.inventoryCategories || DEFAULT_INV_CATEGORIES,
        finances: parsed.finances || [],
        financeFolders: parsed.financeFolders || ['ALAT TULIS', 'SEWA', 'GAJI', 'UTILITI', 'LAIN-LAIN'],
        invCounter: parsed.invCounter || 1,
        firmLogo: parsed.firmLogo || null,
        currentPage: parsed.currentPage || 'home',
        activeClientIdx: parsed.activeClientIdx !== undefined ? parsed.activeClientIdx : null,
        googleSheetUrl: parsed.googleSheetUrl || GOOGLE_SHEET_URL,
        previousSheetUrls: parsed.previousSheetUrls || [],
        lastLocalUpdate: parsed.lastLocalUpdate || "Tiada rekod",
        lastCloudUpdate: parsed.lastCloudUpdate || "Belum disinkron"
      };
    } catch (e) {
      console.error("Failed to parse stored state", e);
    }
  }
  return {
    clients: INITIAL_CLIENT_DATA,
    pjsRecords: INITIAL_PJS_DATA,
    inventory: [],
    inventoryCategories: DEFAULT_INV_CATEGORIES,
    finances: [],
    financeFolders: ['ALAT TULIS', 'SEWA', 'GAJI', 'UTILITI', 'LAIN-LAIN'],
    invCounter: 1,
    firmLogo: null,
    currentPage: 'home',
    activeClientIdx: null,
    googleSheetUrl: GOOGLE_SHEET_URL,
    previousSheetUrls: [],
    lastLocalUpdate: "Tiada rekod",
    lastCloudUpdate: "Belum disinkron"
  };
};
