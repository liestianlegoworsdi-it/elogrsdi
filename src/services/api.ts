import { User, Barang, Transaksi } from '../types';

// GANTI URL DI BAWAH INI dengan Web App URL dari Google Apps Script Anda
const API_URL = 'https://script.google.com/macros/s/AKfycbwJAkB_WIGnvlomBIXVkIcAm71TH54XhHNi15-ag1d7632-hbeoE76YwsVZcbJyyRVCsg/exec'.trim();

export async function apiRequest(action: string, method: 'GET' | 'POST' = 'GET', body: any = null) {
  const targetUrl = `${API_URL}?action=${action}&_t=${Date.now()}`;
  
  // Deteksi lingkungan
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isAStudio = window.location.hostname.includes('run.app');
  
  // Gunakan proxy hanya jika di lingkungan AI Studio atau Local Dev yang mendukung server.ts
  // Di Netlify/GitHub Pages, kita HARUS panggil langsung.
  const useProxy = isLocal || isAStudio;
  const requestUrl = useProxy ? `/api/proxy?url=${encodeURIComponent(targetUrl)}` : targetUrl;
  
  console.log(`[API] ${action} via ${useProxy ? 'Proxy' : 'Direct Call'} (${window.location.hostname})`);
  
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
    let response = await fetch(requestUrl, options);
    
    // Jika menggunakan proxy dan mendapat 404, kemungkinan besar ini adalah hosting statis 
    // (Netlify/GitHub) yang tidak punya rute /api/proxy. Coba fallback langsung.
    if (useProxy && response.status === 404) {
      console.warn('[API] Proxy endpoint not found (404). Falling back to direct call...');
      response = await fetch(targetUrl, options);
    }

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
      
      // Jika respon bukan JSON tapi OK, mungkin Apps Script mengembalikan HTML error atau redirect
      if (text.includes('<!DOCTYPE html>')) {
        throw new Error('Respon server berupa HTML. Pastikan URL Apps Script benar dan sudah di-deploy sebagai Web App.');
      }
      
      console.error('Raw response:', text);
      throw new Error('Respon dari server tidak valid (Bukan JSON).');
    }
  } catch (err: any) {
    console.error('API Request failed:', err);
    if (err.message === 'Failed to fetch') {
      throw new Error('Koneksi gagal. Pastikan URL Apps Script benar, akses diset ke "Anyone", dan matikan Ad-blocker.');
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
