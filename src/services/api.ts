import { User, Barang, Transaksi } from '../types';

// GANTI URL DI BAWAH INI dengan Web App URL dari Google Apps Script Anda
const API_URL = 'https://script.google.com/macros/s/AKfycbyOtPzpwyx-1lSXZ7tNVHCQAER-DNG7mX-j3wMUqft-jGzT0kSqkornbCvNRk4S2kAhuw/exec';

export async function apiRequest(action: string, method: 'GET' | 'POST' = 'GET', body: any = null) {
  const url = `${API_URL}?action=${action}&_t=${Date.now()}`;
  const options: RequestInit = { 
    method, 
    mode: 'cors',
    redirect: 'follow',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
  };
  
  if (method === 'POST') {
    options.body = JSON.stringify({ action, ...body });
  }

  try {
    const response = await fetch(url, options);
    const text = await response.text();
    
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${text.slice(0, 100)}`);
    }

    try {
      const result = JSON.parse(text);
      if (result.success === false) {
        throw new Error(result.message || 'Unknown server error');
      }
      return result.data;
    } catch (e: any) {
      if (e.message.includes('Server Error') || e.message.includes('HTTP Error')) throw e;
      console.error('Raw response:', text);
      throw new Error('Respon dari server tidak valid. Pastikan Apps Script sudah di-deploy sebagai Web App dengan akses "Anyone".');
    }
  } catch (err: any) {
    console.error('API Request failed:', err);
    if (err.message === 'Failed to fetch') {
      throw new Error('Koneksi diblokir atau URL salah. Pastikan: 1. URL Apps Script benar, 2. Akses diset ke "Anyone", 3. Matikan Ad-blocker.');
    }
    throw err;
  }
}

export async function getInitialData() {
  return await apiRequest('getInitialData');
}

export async function submitOrder(data: any[], isUpdate: boolean, deletedIds: string[], targetOrder: string) {
  return await apiRequest('submitOrder', 'POST', { data, isUpdate, deletedIds, targetOrder });
}

export async function updateApproval(iddetil: string, status: string, jmlAcc: number, totalAcc: number) {
  return await apiRequest('updateApproval', 'POST', { iddetil, status, jmlAcc, totalAcc });
}

export async function updateMasterBarang(payload: any) {
  return await apiRequest('updateMasterBarang', 'POST', payload);
}

export async function updateTerimaBarang(payload: any) {
  return await apiRequest('updateTerimaBarang', 'POST', payload);
}

export async function updateSettings(payload: any) {
  return await apiRequest('updateSettings', 'POST', payload);
}

export async function updatePOQty(iddetil: string, poQty: number) {
  return await apiRequest('updatePOQty', 'POST', { iddetil, poQty });
}

export async function finalizePO(items: { iddetil: string; poQty: number; jmlTerima: number; noPO: string }[]) {
  return await apiRequest('finalizePO', 'POST', { items });
}
