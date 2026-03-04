import React from 'react';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, BarChart3, AlertTriangle, Check, Printer } from 'lucide-react';
import { Transaksi, Anggaran } from '../types';

interface AdminBudgetAchievementViewProps {
  transaksi: Transaksi[];
  anggaran: Anggaran[];
}

export const AdminBudgetAchievementView: React.FC<AdminBudgetAchievementViewProps> = ({ transaksi, anggaran }) => {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'Nopember', 'Desember'];

  const parseDate = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    return new Date(dateStr);
  };

  const parseBudgetVal = (val: any) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const cleaned = val.replace(/[^\d]/g, '');
      return parseInt(cleaned) || 0;
    }
    return 0;
  };

  const totalAnggaran = anggaran.reduce((sum, a) => {
    return sum + months.reduce((mSum, m) => mSum + parseBudgetVal(a[m]), 0);
  }, 0);

  const totalRealisasi = transaksi
    .filter(t => {
      const tDate = parseDate(t.Tanggal);
      return (t.ACC || '').toUpperCase() === 'APPROVED' && tDate && tDate.getFullYear() === 2026;
    })
    .reduce((sum, t) => sum + ((Number(t.Harga) || 0) * (Number(t.JmlACC) || 0)), 0);

  const totalSisa = totalAnggaran - totalRealisasi;
  const totalAbsorpsi = totalAnggaran > 0 ? (totalRealisasi / totalAnggaran) * 100 : 0;

  const monthlyCapaian = months.map((month, idx) => {
    const budget = anggaran.reduce((sum, a) => sum + parseBudgetVal(a[month]), 0);
    const realization = transaksi
      .filter(t => {
        const tDate = parseDate(t.Tanggal);
        return (t.ACC || '').toUpperCase() === 'APPROVED' && 
               tDate && 
               tDate.getFullYear() === 2026 && 
               tDate.getMonth() === idx;
      })
      .reduce((sum, t) => sum + ((Number(t.Harga) || 0) * (Number(t.JmlACC) || 0)), 0);
    
    const remaining = budget - realization;
    const absorption = budget > 0 ? (realization / budget) * 100 : 0;

    return { month, budget, realization, remaining, absorption };
  });

  // Gauge Data
  const gaugeData = [
    { name: 'Serapan', value: totalAbsorpsi },
    { name: 'Sisa', value: Math.max(0, 100 - totalAbsorpsi) }
  ];

  const COLORS = [totalAbsorpsi > 90 ? '#ef4444' : totalAbsorpsi > 70 ? '#f59e0b' : '#10b981', '#f1f5f9'];

  const handlePrint = () => {
    const printContent = document.getElementById('budget-achievement-print-area');
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(s => s.outerHTML)
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>DASHBOARD SERAPAN ANGGARAN LOGISTIK UMUM 2026</title>
          ${styles}
          <style>
            @page {
              size: A4;
              margin: 5mm;
            }
            @media print {
              .no-print { display: none !important; }
              body { 
                background: white !important; 
                padding: 0 !important; 
                margin: 0 !important;
                font-family: 'Inter', sans-serif;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                height: 287mm;
                display: flex;
                flex-direction: column;
              }
              #budget-achievement-print-area { 
                flex: 1;
                display: flex !important;
                flex-direction: column !important;
                gap: 0 !important;
                height: 100%;
              }
              
              /* Top Section: Cards (30%) */
              #budget-achievement-print-area > div:first-child {
                height: 28% !important;
                display: grid !important;
                grid-template-columns: 1fr 2fr !important;
                gap: 10px !important;
                margin-bottom: 10px !important;
              }
              
              /* Stats Grid inside Top Section */
              #budget-achievement-print-area > div:first-child > div:last-child {
                display: grid !important;
                grid-template-columns: 1fr !important;
                grid-template-rows: repeat(3, 1fr) !important;
                gap: 6px !important;
              }

              /* Bottom Section: Table + Analysis (70%) */
              /* Container for Table */
              #budget-achievement-print-area > div:nth-child(2) {
                height: 58% !important;
                display: flex !important;
                flex-direction: column !important;
                margin-bottom: 10px !important;
              }
              
              /* Analysis Card */
              #budget-achievement-print-area > div:nth-child(3) {
                height: 10% !important;
                display: block !important;
                padding: 10px !important;
                border: 1px solid #e2e8f0 !important;
                border-radius: 10px !important;
                background: #fffbeb !important;
              }
              #budget-achievement-print-area > div:nth-child(3) svg { display: none !important; }
              #budget-achievement-print-area > div:nth-child(3) h4 { font-size: 10px !important; margin-bottom: 2px !important; }
              #budget-achievement-print-area > div:nth-child(3) p { font-size: 8.5px !important; line-height: 1.2 !important; }

              /* Compact Cards */
              .rounded-3xl { border-radius: 10px !important; }
              .p-8 { padding: 10px !important; }
              .p-6 { padding: 6px !important; }
              
              /* Gauge adjustment */
              .h-48 { height: 100px !important; }
              .text-4xl { font-size: 24px !important; }
              .mb-4 { margin-bottom: 4px !important; }
              .mt-6 { margin-top: 6px !important; }
              .pt-6 { padding-top: 6px !important; }
              
              /* Stats adjustment */
              .w-16 { width: 36px !important; height: 36px !important; }
              .w-16 svg { width: 18px !important; height: 18px !important; }
              .text-2xl { font-size: 14px !important; }
              .text-\\[10px\\] { font-size: 7px !important; }
              
              /* Table adjustment */
              .overflow-x-auto { overflow: visible !important; flex: 1; display: flex !important; flex-direction: column !important; }
              table { 
                width: 100% !important; 
                flex: 1 !important;
                border-collapse: collapse !important; 
                font-size: 9px !important;
              }
              th, td { 
                border: 1px solid #e2e8f0 !important; 
                padding: 4px 8px !important; 
              }
              thead tr { height: 30px !important; }
              tbody tr { height: auto !important; }
              tfoot tr { height: 40px !important; }
              
              .text-base { font-size: 9px !important; }
              .text-sm { font-size: 8px !important; }
              .text-xl { font-size: 10px !important; }
              .text-2xl { font-size: 11px !important; }
              
              /* Header & Footer */
              .print-header { margin-bottom: 8px !important; }
              .print-footer {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                border-top: 1px solid #e2e8f0;
                padding: 4px 0;
                font-size: 8px !important;
                background: white;
              }
            }
          </style>
        </head>
        <body>
          <div class="hidden print:block text-center border-b-2 border-slate-900 pb-2 print-header">
            <h1 class="text-xl font-black text-slate-900 uppercase">RSU Muhammadiyah Darul Istiqomah Kendal</h1>
            <h2 class="text-xs font-bold text-slate-700 uppercase tracking-widest">DASHBOARD SERAPAN ANGGARAN LOGISTIK UMUM 2026</h2>
          </div>
          ${printContent.innerHTML}
          <div class="hidden print:flex justify-between text-slate-400 uppercase print-footer">
            <span>Dicetak pada: ${new Date().toLocaleString('id-ID')}</span>
            <span>e-Log Logistics System - Halaman 1 dari 1</span>
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
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 max-w-7xl mx-auto pb-20"
    >
      {/* Header & Print Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 w-1.5 h-6 rounded-full"></div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">
              DASHBOARD SERAPAN ANGGARAN LOGISTIK UMUM 2026
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Analisa Realisasi vs Anggaran Tahunan</p>
          </div>
        </div>
        <button
          onClick={handlePrint}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-slate-800 transition-all active:scale-95"
        >
          <Printer size={16} />
          CETAK LAPORAN
        </button>
      </div>

      {/* Bento Grid Layout */}
      <div id="budget-achievement-print-area" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gauge Meter Card */}
          <motion.div variants={itemVariants} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Serapan Tahunan</h3>
            
            <div className="w-full h-48 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="85%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={0}
                    dataKey="value"
                  >
                    {gaugeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
                <span className="text-4xl font-black text-slate-800">{totalAbsorpsi.toFixed(1)}%</span>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Terpakai</p>
              </div>
            </div>

            <div className="grid grid-cols-2 w-full gap-4 mt-6 pt-6 border-t border-slate-100">
              <div className="text-center">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${
                  totalAbsorpsi > 90 ? 'bg-red-50 text-red-600 border-red-100' : 
                  totalAbsorpsi > 70 ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                  'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                  {totalAbsorpsi > 90 ? 'KRITIS' : totalAbsorpsi > 70 ? 'WASPADA' : 'AMAN'}
                </span>
              </div>
              <div className="text-center">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Tahun</p>
                <span className="text-[10px] font-black text-slate-800">2026</span>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 gap-6">
            <motion.div variants={itemVariants} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6 group hover:border-blue-200 transition-colors">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                <PieChartIcon size={32} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Anggaran</p>
                <p className="text-2xl font-black text-slate-800 italic">
                  Rp {totalAnggaran.toLocaleString('id-ID')}
                </p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6 group hover:border-emerald-200 transition-colors">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <TrendingUp size={32} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Realisasi</p>
                <p className="text-2xl font-black text-slate-800 italic">
                  Rp {totalRealisasi.toLocaleString('id-ID')}
                </p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6 group hover:border-amber-200 transition-colors">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                <BarChart3 size={32} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sisa Anggaran</p>
                <p className="text-2xl font-black text-slate-800 italic">
                  Rp {totalSisa.toLocaleString('id-ID')}
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Monthly Table */}
        <motion.div variants={itemVariants} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Detail Capaian Per Bulan</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Aman</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Waspada</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Kritis</span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest w-16">NO</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest">BULAN</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest">ANGGARAN</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest">REALISASI</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest">SISA</th>
                  <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest w-40">% SERAPAN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyCapaian.map((item, idx) => {
                  let bgColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                  let dotColor = 'bg-emerald-500';
                  if (item.absorption > 90) {
                    bgColor = 'bg-red-50 text-red-700 border-red-100';
                    dotColor = 'bg-red-500';
                  } else if (item.absorption >= 70) {
                    bgColor = 'bg-amber-50 text-amber-700 border-amber-100';
                    dotColor = 'bg-amber-500';
                  }

                  return (
                    <tr key={item.month} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6 text-slate-400 font-black text-sm">{idx + 1}</td>
                      <td className="px-8 py-6 font-black uppercase text-slate-800 text-sm tracking-tight">{item.month}</td>
                      <td className="px-8 py-6 text-right font-bold text-slate-600 text-base">
                        Rp {item.budget.toLocaleString('id-ID')}
                      </td>
                      <td className="px-8 py-6 text-right font-black text-blue-600 text-base">
                        Rp {item.realization.toLocaleString('id-ID')}
                      </td>
                      <td className="px-8 py-6 text-right font-bold text-slate-400 italic text-base">
                        Rp {item.remaining.toLocaleString('id-ID')}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className={`inline-flex items-center gap-3 px-4 py-1.5 rounded-full border text-xs font-black ${bgColor}`}>
                          <div className={`w-2 h-2 rounded-full ${dotColor} animate-pulse`}></div>
                          {item.absorption.toFixed(1)}%
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={2} className="px-8 py-8 text-right text-xs font-black uppercase tracking-widest text-slate-500 italic">Total Keseluruhan Tahun 2026</td>
                  <td className="px-8 py-8 text-right text-xl font-black text-slate-900">
                    Rp {totalAnggaran.toLocaleString('id-ID')}
                  </td>
                  <td className="px-8 py-8 text-right text-xl font-black text-blue-600">
                    Rp {totalRealisasi.toLocaleString('id-ID')}
                  </td>
                  <td className="px-8 py-8 text-right text-xl font-black text-slate-400">
                    Rp {totalSisa.toLocaleString('id-ID')}
                  </td>
                  <td className="px-8 py-8 text-center">
                    <div className="text-2xl font-black text-slate-900">{totalAbsorpsi.toFixed(1)}%</div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </motion.div>

        {/* Analysis Card */}
        <motion.div variants={itemVariants} className="bg-amber-50 p-8 rounded-3xl border border-amber-100 flex items-start gap-6">
          <div className="bg-amber-100 p-4 rounded-2xl text-amber-600">
            <AlertTriangle size={32} />
          </div>
          <div>
            <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest mb-2">Analisa Strategis Serapan Anggaran</h4>
            <p className="text-sm font-medium text-amber-800 leading-relaxed italic">
              {totalAbsorpsi > 90 
                ? `PERINGATAN: Serapan anggaran tahunan sudah mencapai ${totalAbsorpsi.toFixed(1)}%. Pengadaan barang di sisa bulan tahun ini harus dilakukan dengan seleksi yang sangat ketat dan prioritas tinggi.`
                : totalAbsorpsi >= 70
                ? `WASPADA: Serapan anggaran tahunan berada di angka ${totalAbsorpsi.toFixed(1)}%. Tim pengadaan disarankan untuk mulai melakukan review inventori sebelum menyetujui pengajuan baru.`
                : `AMAN: Serapan anggaran tahunan masih dalam batas aman (${totalAbsorpsi.toFixed(1)}%). Alokasi dana masih mencukupi untuk operasional rutin hingga akhir tahun.`}
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
