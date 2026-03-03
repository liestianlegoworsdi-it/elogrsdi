export interface User {
  Username: string;
  Password: string;
  Nama: string;
  Unit: string;
  Role: string;
}

export interface Barang {
  iddetil?: string;
  id?: string;
  NamaBarang: string;
  Harga: number;
  Vendor: string;
  STATUS?: string;
  Status?: string;
}

export interface Transaksi {
  iddetil: string;
  Idorder: string;
  Tanggal: string;
  Unit: string;
  NamaBarang: string;
  Harga: number;
  Qty: number;
  Subtotal: number;
  Vendor: string;
  ACC: string;
  TerimaBarang?: string;
  JmlTerima?: number;
  SESUAI?: string;
  TanggalTerima?: string;
  POQty?: number;
  StatusPO?: string;
}

export interface CartItem extends Barang {
  qty: number;
}

export interface OrderGroup {
  id: string;
  tanggal: string;
  unit: string;
  status: string;
  items: Transaksi[];
  total: number;
}

export interface PendingSyncItem {
  id: string;
  type: 'submitOrder' | 'updateApproval' | 'updateTerimaBarang' | 'updateMasterBarang' | 'updateSettings' | 'updatePO' | 'finalizePO';
  payload: any;
  timestamp: number;
  description: string;
}
