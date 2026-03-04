import React, { useState, useRef, useEffect } from 'react';
import { Printer, ChevronDown, Check, X } from 'lucide-react';
import { Transaksi, User, Barang, Anggaran } from '../types';
import { TrendingUp, PieChart, BarChart3, AlertTriangle } from 'lucide-react';

interface AdminReportViewProps {
  transaksi: Transaksi[];
  users: User[];
  barang: Barang[];
  initialTab?: 'unit' | 'vendor';
}

export const AdminReportView: React.FC<AdminReportViewProps> = ({ transaksi, users, barang, initialTab }) => {
  const [tab, setTab] = useState<'unit' | 'vendor'>(initialTab || 'unit');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const [isDataVisible, setIsDataVisible] = useState(false);
  const vendorDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target as Node)) {
        setIsVendorDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab]);

  const units = [...new Set(users.map((u) => u.Unit).filter((u) => u))];
  const vendors = [...new Set(barang.map((b) => b.Vendor).filter((v) => v && v !== '-'))];

  const parseDate = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    return new Date(dateStr);
  };

  const filteredTrans = isDataVisible ? transaksi.filter((t) => {
    const tDate = parseDate(t.Tanggal);
    if (!tDate) return false;
    if (startDate && tDate < new Date(startDate)) return false;
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      if (tDate > end) return false;
    }
    if (selectedUnit && t.Unit !== selectedUnit) return false;
    if (selectedVendors.length > 0 && !selectedVendors.includes(t.Vendor || '')) return false;
    return true;
  }) : [];

  const totalReport = filteredTrans.reduce((sum, item) => {
    const approvedSubtotal = (Number(item.Harga) || 0) * (Number(item.JmlACC) || 0);
    return sum + approvedSubtotal;
  }, 0);

  const groupedData: { [key: string]: { items: Transaksi[]; total: number; aggregated: { [key: string]: any } } } = {};
  const groupKey = tab === 'vendor' ? 'Vendor' : 'Unit';

  filteredTrans.forEach((item) => {
    const key = (item as any)[groupKey] || 'Lainnya';
    if (!groupedData[key]) {
      groupedData[key] = { items: [], total: 0, aggregated: {} };
    }

    const approvedSubtotal = (Number(item.Harga) || 0) * (Number(item.JmlACC) || 0);

    if (tab === 'vendor') {
      if (!groupedData[key].aggregated[item.NamaBarang]) {
        groupedData[key].aggregated[item.NamaBarang] = {
          NamaBarang: item.NamaBarang,
          Harga: Number(item.Harga) || 0,
          Qty: 0,
          JmlACC: 0,
          Subtotal: 0,
          Tanggal: item.Tanggal,
        };
      }
      groupedData[key].aggregated[item.NamaBarang].Qty += Number(item.Qty) || 0;
      groupedData[key].aggregated[item.NamaBarang].JmlACC += Number(item.JmlACC) || 0;
      groupedData[key].aggregated[item.NamaBarang].Subtotal += approvedSubtotal;
    } else {
      groupedData[key].items.push(item);
    }
    groupedData[key].total += approvedSubtotal;
  });

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 w-1 h-4 rounded-full"></div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">
              Laporan Rekap Pengadaan
            </h2>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => {
                setTab('unit');
                setIsDataVisible(false);
              }}
              className={`px-6 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${
                tab === 'unit' ? 'bg-white shadow text-blue-600' : 'text-slate-500'
              }`}
            >
              PER UNIT
            </button>
            <button
              onClick={() => {
                setTab('vendor');
                setIsDataVisible(false);
              }}
              className={`px-6 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${
                tab === 'vendor' ? 'bg-white shadow text-blue-600' : 'text-slate-500'
              }`}
            >
              PER VENDOR
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block">Dari Tanggal</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setIsDataVisible(false);
                }}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-[10px] font-bold outline-none"
              />
            </div>
            <div>
              <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block">Sampai Tanggal</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setIsDataVisible(false);
                }}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-[10px] font-bold outline-none"
              />
            </div>
            <div>
              <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block">Unit</label>
              <select
                value={selectedUnit}
                onChange={(e) => {
                  setSelectedUnit(e.target.value);
                  setIsDataVisible(false);
                }}
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
            <div className="relative" ref={vendorDropdownRef}>
              <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block">Vendor</label>
              <button
                type="button"
                onClick={() => setIsVendorDropdownOpen(!isVendorDropdownOpen)}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-[10px] font-bold outline-none flex items-center justify-between min-h-[38px]"
              >
                <div className="flex flex-wrap gap-1 items-center overflow-hidden">
                  {selectedVendors.length === 0 ? (
                    <span className="text-slate-400">SEMUA VENDOR</span>
                  ) : (
                    selectedVendors.map((v) => (
                      <span key={v} className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md flex items-center gap-1 text-[9px]">
                        {v}
                        <X
                          size={10}
                          className="cursor-pointer hover:text-blue-900"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVendors(selectedVendors.filter((sv) => sv !== v));
                            setIsDataVisible(false);
                          }}
                        />
                      </span>
                    ))
                  )}
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isVendorDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isVendorDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto py-2">
                  <div
                    className="px-4 py-2 text-[10px] font-bold text-blue-600 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                    onClick={() => {
                      setSelectedVendors([]);
                      setIsDataVisible(false);
                    }}
                  >
                    SEMUA VENDOR
                    {selectedVendors.length === 0 && <Check size={12} />}
                  </div>
                  <div className="border-t border-slate-100 my-1"></div>
                  {vendors.map((v) => {
                    const isSelected = selectedVendors.includes(v);
                    return (
                      <div
                        key={v}
                        className={`px-4 py-2 text-[10px] font-bold hover:bg-slate-50 cursor-pointer flex items-center justify-between ${
                          isSelected ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedVendors(selectedVendors.filter((sv) => sv !== v));
                          } else {
                            setSelectedVendors([...selectedVendors, v]);
                          }
                          setIsDataVisible(false);
                        }}
                      >
                        {v}
                        {isSelected && <Check size={12} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div>
              <button
                onClick={() => {
                  if (!startDate || !endDate) {
                    alert('Pilih rentang tanggal terlebih dahulu');
                    return;
                  }
                  setIsDataVisible(true);
                }}
                className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
              >
                Tampilkan Data
              </button>
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
                          padding: 0 !important;
                          margin: 0 !important;
                          background: white !important;
                        }
                        #report-print-area {
                          min-height: 0 !important;
                          padding: 0 !important;
                          margin: 0 !important;
                          border: none !important;
                          box-shadow: none !important;
                          display: block !important;
                          width: 100% !important;
                        }
                        .group-container {
                          break-inside: auto !important;
                          page-break-inside: auto !important;
                          margin-bottom: 20px !important;
                          overflow: visible !important;
                          border: 1px solid #e2e8f0 !important;
                        }
                        table {
                          width: 100% !important;
                          border-collapse: collapse !important;
                          page-break-inside: auto !important;
                        }
                        tr {
                          page-break-inside: avoid !important;
                          page-break-after: auto !important;
                        }
                        thead {
                          display: table-header-group !important;
                        }
                        tfoot {
                          display: table-footer-group !important;
                        }
                        /* Avoid breaking signature block across pages */
                        .signature-block {
                          page-break-inside: avoid !important;
                        }
                        .report-header {
                          page-break-after: avoid !important;
                          margin-bottom: 20px !important;
                        }
                      }
                      body { background: white !important; }
                    </style>
                  </head>
                  <body>
                    <div id="report-print-area">
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

      {isDataVisible ? (
        <div id="report-print-area" className="bg-white p-10 shadow-xl rounded-2xl border border-slate-100 print:shadow-none print:border-none relative">
          {/* Print Footer - Page Numbering */}
          <div className="hidden print:block print-footer">
            <div className="flex justify-between items-center px-10">
              <span className="text-[7px] font-black uppercase tracking-widest">
                RSU Muhammadiyah Darul Istiqomah Kendal - Laporan Rekap Pengadaan
              </span>
              <span className="page-number"></span>
            </div>
          </div>

          <div className="text-center mb-10 pb-6 border-b-2 border-slate-900 report-header">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              LAPORAN REKAP PENGAJUAN {tab === 'vendor' ? 'PER VENDOR' : 'PER UNIT'}
            </h1>
            <p className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] mt-2">
              RSU Muhammadiyah Darul Istiqomah Kendal
            </p>
            <div className="flex flex-col items-center gap-2 mt-4 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
              <span>
                Periode: {startDate || 'Awal'} - {endDate || 'Akhir'}
              </span>
              {selectedVendors.length > 0 && (
                <span>
                  Vendor: {selectedVendors.join(', ')}
                </span>
              )}
            </div>
          </div>

          {Object.keys(groupedData).length === 0 ? (
            <div className="py-20 text-center font-black text-slate-300 uppercase tracking-widest italic">
              Tidak ada data yang sesuai dengan filter
            </div>
          ) : (
            Object.keys(groupedData).map((key, kIdx) => {
              const data = groupedData[key];
              const rows = tab === 'vendor' ? Object.values(data.aggregated) : data.items;
              return (
                <div key={`group-${key}-${kIdx}`} className="mb-8 border border-slate-200 rounded-lg overflow-hidden group-container">
                  <div className="bg-slate-900 text-white px-4 py-2 flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-widest">
                      {tab === 'vendor' ? 'VENDOR' : 'UNIT'}: {key}
                    </h3>
                  </div>
                  <table className="w-full text-[9px] table-fixed border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-2 py-2 text-left w-8">NO</th>
                        {tab !== 'vendor' && <th className="px-2 py-2 text-left w-20">TANGGAL</th>}
                        {tab !== 'vendor' && <th className="px-2 py-2 text-left w-28">VENDOR</th>}
                        <th className="px-2 py-2 text-left">NAMA BARANG</th>
                        <th className="px-2 py-2 text-right w-24">HARGA</th>
                        <th className="px-2 py-2 text-center w-12">AJU</th>
                        <th className="px-2 py-2 text-center w-12">REJ</th>
                        <th className="px-2 py-2 text-center w-12">ACC</th>
                        <th className="px-2 py-2 text-right w-28">SUBTOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((t: any, idx: number) => (
                        <tr key={`row-${t.iddetil || idx}`} className="hover:bg-slate-50/50">
                          <td className="px-2 py-2 text-slate-400 font-bold">{idx + 1}</td>
                          {tab !== 'vendor' && <td className="px-2 py-2 font-medium truncate">{t.Tanggal}</td>}
                          {tab !== 'vendor' && (
                            <td className="px-2 py-2 font-bold uppercase italic text-slate-600 truncate">{t.Vendor || '-'}</td>
                          )}
                          <td className="px-2 py-2 font-black uppercase truncate">{t.NamaBarang}</td>
                          <td className="px-2 py-2 text-right font-black">
                            {Number(t.Harga || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="px-2 py-2 text-center font-black">
                            {Number(t.Qty) || 0}
                          </td>
                          <td className="px-2 py-2 text-center font-bold text-red-500">
                            {(Number(t.Qty) || 0) - (Number(t.JmlACC) || 0)}
                          </td>
                          <td className="px-2 py-2 text-center font-black text-blue-600">
                            {Number(t.JmlACC) || 0}
                          </td>
                          <td className="px-2 py-2 text-right font-black">
                            {((Number(t.Harga) || 0) * (Number(t.JmlACC) || 0)).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 border-t border-slate-200">
                        <td colSpan={tab === 'vendor' ? 6 : 8} className="px-4 py-2 text-right font-black text-slate-500 uppercase italic">
                          Sub Total (Approved)
                        </td>
                        <td className="px-4 py-2 text-right font-black text-slate-900">
                          Rp {data.total.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              );
            })
          )}

          <div className="mt-4 border-2 border-slate-900 rounded-lg overflow-hidden break-inside-avoid">
            <table className="w-full text-[10px] table-fixed border-collapse">
              <tbody>
                <tr className="bg-slate-900 text-white">
                  <td colSpan={tab === 'vendor' ? 6 : 8} className="px-4 py-3 text-right font-black uppercase tracking-widest">
                    TOTAL KESELURUHAN (APPROVED)
                  </td>
                  <td className="px-4 py-3 text-right font-black text-sm w-32 bg-slate-800">
                    Rp {totalReport.toLocaleString('id-ID')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-10 pt-6 signature-block">
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
      ) : (
        <div className="bg-white p-20 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-blue-50 p-6 rounded-full text-blue-200">
              <Printer size={48} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 uppercase italic">Laporan Siap Dibuat</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Pilih rentang tanggal dan klik tombol "Tampilkan Data"</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
