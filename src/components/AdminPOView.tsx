import React, { useState } from 'react';
import { Printer } from 'lucide-react';
import { Transaksi, Barang } from '../types';

interface AdminPOViewProps {
  transaksi: Transaksi[];
  barang: Barang[];
}

export const AdminPOView: React.FC<AdminPOViewProps> = ({ transaksi, barang }) => {
  const [vendor, setVendor] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const vendors = [...new Set(barang.map((b) => b.Vendor).filter((v) => v && v !== '-'))];

  const parseDate = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    return new Date(dateStr);
  };

  const filteredTrans = transaksi.filter((t) => {
    const tStatus = (t.ACC || 'Pending').toUpperCase();
    const poStatus = (t.StatusPO || '').toUpperCase();
    
    // Only show items that are APPROVED and FINALIZED for PO
    if (tStatus !== 'APPROVED' || poStatus !== 'FINALIZED') return false;
    
    if (vendor && t.Vendor !== vendor) return false;
    const tDate = parseDate(t.Tanggal);
    if (!tDate) return false;
    if (startDate && tDate < new Date(startDate)) return false;
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      if (tDate > end) return false;
    }
    return true;
  });

  const grouped: { [key: string]: { NamaBarang: string; Harga: number; Qty: number; Subtotal: number } } = {};
  filteredTrans.forEach((t) => {
    if (!grouped[t.NamaBarang]) {
      grouped[t.NamaBarang] = { NamaBarang: t.NamaBarang, Harga: t.Harga, Qty: 0, Subtotal: 0 };
    }
    const hasPOQty = t.POQty !== undefined && t.POQty !== null && t.POQty !== "";
    const qty = hasPOQty ? t.POQty : t.Qty;
    const subtotal = hasPOQty ? t.Harga * Number(t.POQty) : t.Subtotal;
    grouped[t.NamaBarang].Qty += Number(qty);
    grouped[t.NamaBarang].Subtotal += Number(subtotal);
  });

  const poItems = Object.values(grouped);
  const totalPO = poItems.reduce((sum, i) => sum + i.Subtotal, 0);

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 w-1 h-4 rounded-full"></div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">PO Generator & Cetak</h2>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              const printContent = document.getElementById('po-print-area');
              if (!printContent) return;
              
              const printWindow = window.open('', '_blank');
              if (!printWindow) {
                alert('Silakan izinkan popup untuk mencetak PO');
                return;
              }

              const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
                .map(s => s.outerHTML)
                .join('');

              printWindow.document.write(`
                <html>
                  <head>
                    <title>Cetak Purchase Order</title>
                    ${styles}
                    <style>
                      @media print {
                        .no-print { display: none !important; }
                        .print-footer-timestamp {
                          position: fixed;
                          bottom: 0;
                          left: 0;
                          right: 0;
                          background: white !important;
                          padding: 10px 40px !important;
                          border-top: 1px solid #f1f5f9 !important;
                          z-index: 9999;
                        }
                        body {
                          padding-bottom: 60px !important;
                        }
                        /* Avoid breaking signature block across pages */
                        .signature-block {
                          page-break-inside: avoid;
                        }
                      }
                      body { background: white !important; }
                    </style>
                  </head>
                  <body>
                    <div class="p-10">
                      ${printContent.innerHTML}
                    </div>
                    <script>
                      setTimeout(() => {
                        window.print();
                        window.close();
                      }, 500);
                    </script>
                  </body>
                </html>
              `);
              printWindow.document.close();
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <Printer size={14} />
            CETAK SEKARANG
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 border-t pt-4 border-slate-100">
          <div>
            <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block">Filter Vendor</label>
            <select
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-[10px] font-bold outline-none"
            >
              <option value="">SEMUA VENDOR</option>
              {vendors.map((v, idx) => (
                <option key={`vendor-${v}-${idx}`} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-[10px] font-bold outline-none"
            />
          </div>
          <div>
            <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-[10px] font-bold outline-none"
            />
          </div>
        </div>
      </div>

      <div id="po-print-area" className="bg-white p-10 mx-auto shadow-xl rounded-lg print:shadow-none print:border-none" style={{ width: '210mm', minHeight: '297mm', display: 'flex', flexDirection: 'column' }}>
        <div className="flex justify-between items-start mb-10 pb-6 border-b-4 border-slate-900">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 w-4 h-12 rounded-full"></div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">PURCHASE ORDER</h1>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-1">
                LOGISTICS SYSTEM &bull; RSDI KENDAL
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">DOKUMEN NO.</p>
            <p className="text-base font-black text-slate-900 border-2 border-slate-900 px-4 py-1 rounded-md italic">
              PO-{Date.now().toString().slice(-8)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-10 mb-10">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">KEPADA VENDOR:</p>
            <p className="text-2xl font-black text-slate-900 uppercase italic leading-none">
              {vendor || 'ALL VENDORS'}
            </p>
          </div>
          <div className="text-right space-y-4">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">TANGGAL CETAK</p>
              <p className="text-sm font-black text-slate-900">
                {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
        <div className="flex-grow">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-4 py-2 text-xs font-black uppercase text-left w-12">No</th>
                <th className="px-4 py-2 text-xs font-black uppercase text-left">Nama Item</th>
                <th className="px-4 py-2 text-xs font-black uppercase text-center w-24">Qty</th>
                <th className="px-4 py-2 text-xs font-black uppercase text-right w-40">Total</th>
              </tr>
            </thead>
            <tbody className="border-x border-slate-200 divide-y divide-slate-100">
              {poItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-slate-50 p-4 rounded-full text-slate-300">
                        <Printer size={32} />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-xs leading-relaxed">
                        Tidak ada data PO yang siap cetak. <br/>
                        Pastikan Anda sudah melakukan <span className="text-blue-600">Finalisasi PO</span> di menu <span className="italic">Finalisasi PO</span> terlebih dahulu.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                poItems.map((item, idx) => (
                  <tr key={`po-item-${item.NamaBarang}-${idx}`}>
                    <td className="px-4 py-2 text-xs font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-2 text-sm font-black text-slate-900 uppercase">{item.NamaBarang}</td>
                    <td className="px-4 py-2 text-center text-sm font-black text-slate-900">{item.Qty}</td>
                    <td className="px-4 py-2 text-right text-sm font-black text-slate-900">
                      Rp {Number(item.Subtotal).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-10 pt-6 border-t-4 border-slate-900 signature-block">
          <div className="flex justify-end items-center gap-6 mb-8">
            <p className="text-xs font-black text-slate-400 uppercase italic tracking-widest">TOTAL PO</p>
            <p className="text-2xl font-black text-slate-900 italic tracking-tighter">
              Rp {totalPO.toLocaleString('id-ID')}
            </p>
          </div>
          
          <div className="flex justify-center gap-48 mb-10">
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-10">Dibuat Oleh,</p>
              <div className="w-32 border-b border-slate-900 mx-auto"></div>
              <p className="text-[10px] font-black text-slate-900 mt-1 uppercase">Admin Pengadaan</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-10">Disetujui Oleh,</p>
              <div className="w-32 border-b border-slate-900 mx-auto"></div>
              <p className="text-[10px] font-black text-slate-900 mt-1 uppercase">Manajer</p>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-100 text-[8px] font-bold text-slate-300 uppercase tracking-[0.3em] print-footer-timestamp">
          e-Log - Logistics System RSDI Kendal - {new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
        </div>
      </div>
    </div>
  );
};
