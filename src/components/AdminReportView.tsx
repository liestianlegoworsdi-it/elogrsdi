import React, { useState } from 'react';
import { Printer } from 'lucide-react';
import { Transaksi, User, Barang } from '../types';

interface AdminReportViewProps {
  transaksi: Transaksi[];
  users: User[];
  barang: Barang[];
}

export const AdminReportView: React.FC<AdminReportViewProps> = ({ transaksi, users, barang }) => {
  const [tab, setTab] = useState<'unit' | 'vendor'>('unit');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');

  const units = [...new Set(users.map((u) => u.Unit).filter((u) => u))];
  const vendors = [...new Set(barang.map((b) => b.Vendor).filter((v) => v && v !== '-'))];

  const parseDate = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    return new Date(dateStr);
  };

  const filteredTrans = transaksi.filter((t) => {
    const tDate = parseDate(t.Tanggal);
    if (!tDate) return false;
    if (startDate && tDate < new Date(startDate)) return false;
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      if (tDate > end) return false;
    }
    if (selectedUnit && t.Unit !== selectedUnit) return false;
    if (selectedVendor && t.Vendor !== selectedVendor) return false;
    return true;
  });

  const totalReport = filteredTrans.reduce((sum, item) => sum + (parseFloat(item.Subtotal as any) || 0), 0);

  const groupedData: { [key: string]: { items: Transaksi[]; total: number; aggregated: { [key: string]: any } } } = {};
  const groupKey = tab === 'vendor' ? 'Vendor' : 'Unit';

  filteredTrans.forEach((item) => {
    const key = (item as any)[groupKey] || 'Lainnya';
    if (!groupedData[key]) {
      groupedData[key] = { items: [], total: 0, aggregated: {} };
    }

    if (tab === 'vendor') {
      if (!groupedData[key].aggregated[item.NamaBarang]) {
        groupedData[key].aggregated[item.NamaBarang] = {
          NamaBarang: item.NamaBarang,
          Qty: 0,
          Subtotal: 0,
          Tanggal: item.Tanggal,
        };
      }
      groupedData[key].aggregated[item.NamaBarang].Qty += parseFloat(item.Qty as any) || 0;
      groupedData[key].aggregated[item.NamaBarang].Subtotal += parseFloat(item.Subtotal as any) || 0;
    } else {
      groupedData[key].items.push(item);
    }
    groupedData[key].total += parseFloat(item.Subtotal as any) || 0;
  });

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 w-1 h-4 rounded-full"></div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Laporan Rekap Pengadaan</h2>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setTab('unit')}
              className={`px-6 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${
                tab === 'unit' ? 'bg-white shadow text-blue-600' : 'text-slate-500'
              }`}
            >
              PER UNIT
            </button>
            <button
              onClick={() => setTab('vendor')}
              className={`px-6 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${
                tab === 'vendor' ? 'bg-white shadow text-blue-600' : 'text-slate-500'
              }`}
            >
              PER VENDOR
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div>
            <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block">Unit</label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-[10px] font-bold outline-none"
            >
              <option value="">SEMUA UNIT</option>
              {units.map((u, idx) => (
                <option key={`unit-${u}-${idx}`} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block">Vendor</label>
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
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
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={(e) => {
              e.preventDefault();
              const printContent = document.getElementById('report-print-area');
              if (!printContent) return;
              
              const printWindow = window.open('', '_blank');
              if (!printWindow) {
                alert('Silakan izinkan popup untuk mencetak laporan');
                return;
              }

              const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
                .map(s => s.outerHTML)
                .join('');

              printWindow.document.write(`
                <html>
                  <head>
                    <title>Cetak Laporan Rekap</title>
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
            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-slate-800 transition-all active:scale-95"
          >
            <Printer size={14} />
            CETAK REKAP
          </button>
        </div>
      </div>

      <div id="report-print-area" className="bg-white p-10 shadow-xl rounded-2xl border border-slate-100 min-h-[297mm] print:shadow-none print:border-none">
        <div className="text-center mb-10 pb-6 border-b-2 border-slate-900">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            LAPORAN REKAP PESANAN {tab === 'vendor' ? 'PER VENDOR' : 'PER UNIT'}
          </h1>
          <p className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] mt-2">
            RSU Muhammadiyah Darul Istiqomah Kendal
          </p>
          <div className="flex justify-center gap-6 mt-4 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
            <span>
              Periode: {startDate || 'Awal'} - {endDate || 'Akhir'}
            </span>
          </div>
        </div>

        {Object.keys(groupedData).length === 0 ? (
          <div className="py-20 text-center font-black text-slate-300 uppercase tracking-widest italic">
            Tidak ada data
          </div>
        ) : (
          Object.keys(groupedData).map((key, kIdx) => {
            const data = groupedData[key];
            const rows = tab === 'vendor' ? Object.values(data.aggregated) : data.items;
            return (
              <div key={`group-${key}-${kIdx}`} className="mb-8">
                <div className="bg-slate-900 text-white px-4 py-2 flex justify-between items-center rounded-t-lg">
                  <h3 className="text-xs font-black uppercase tracking-widest">
                    {tab === 'vendor' ? 'VENDOR' : 'UNIT'}: {key}
                  </h3>
                </div>
                <table className="w-full text-xs border-x border-b border-slate-200">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-2 text-left w-10">NO</th>
                      {tab !== 'vendor' && <th className="px-4 py-2 text-left w-24">TANGGAL</th>}
                      {tab !== 'vendor' && <th className="px-4 py-2 text-left">VENDOR</th>}
                      <th className="px-4 py-2 text-left">NAMA BARANG</th>
                      <th className="px-4 py-2 text-center w-16">QTY</th>
                      <th className="px-4 py-2 text-right w-28">SUBTOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((t: any, idx: number) => (
                      <tr key={`row-${t.iddetil || idx}`}>
                        <td className="px-4 py-2 text-slate-400 font-bold">{idx + 1}</td>
                        {tab !== 'vendor' && <td className="px-4 py-2 font-medium">{t.Tanggal}</td>}
                        {tab !== 'vendor' && (
                          <td className="px-4 py-2 font-bold uppercase italic text-slate-600">{t.Vendor || '-'}</td>
                        )}
                        <td className="px-4 py-2 font-black uppercase">{t.NamaBarang}</td>
                        <td className="px-4 py-2 text-center font-black">{t.Qty}</td>
                        <td className="px-4 py-2 text-right font-black">
                          Rp {Number(t.Subtotal).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50">
                      <td colSpan={tab === 'vendor' ? 3 : 5} className="px-4 py-2 text-right font-black text-slate-500 uppercase italic">
                        Sub Total
                      </td>
                      <td className="px-4 py-2 text-right font-black text-slate-900 border-t border-slate-200">
                        Rp {data.total.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            );
          })
        )}

        <div className="mt-10 pt-6 border-t-2 border-slate-900 signature-block">
          <div className="flex justify-end items-end mb-10">
            <div className="text-right">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">TOTAL KESELURUHAN</p>
              <p className="text-lg font-black text-slate-900 italic tracking-tighter">
                Rp {totalReport.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <div className="flex justify-end mr-10">
            <div className="text-center">
              <p className="text-[8px] font-black text-slate-400 uppercase mb-12">Admin Pengadaan,</p>
              <div className="w-32 border-b border-slate-900 mx-auto"></div>
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
