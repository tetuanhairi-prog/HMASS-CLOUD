
export interface LedgerEntry {
  date: string;
  desc: string;
  amt: number;
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  detail: string;
  category: string;
  ledger: LedgerEntry[];
}

export interface PjsRecord {
  id: string;
  date: string;
  name: string;
  detail: string;
  amount: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface FinanceEntry {
  id: string;
  date: string;
  type: 'MASUK' | 'KELUAR';
  category: string;
  desc: string;
  amount: number;
  items?: { name: string; price: number }[];
}

export type PageId = 'home' | 'guaman' | 'pjs' | 'inventory' | 'invoice' | 'kewangan';

export interface AppState {
  clients: Client[];
  pjsRecords: PjsRecord[];
  inventory: ServiceItem[];
  inventoryCategories: string[];
  finances: FinanceEntry[];
  financeFolders: string[];
  invCounter: number;
  firmLogo: string | null;
  currentPage: PageId;
  activeClientIdx: number | null;
  googleSheetUrl: string;
  previousSheetUrls: string[];
  lastLocalUpdate: string;
  lastCloudUpdate: string;
}
