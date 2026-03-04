import React, { useState, useMemo } from 'react';
import { Edit3, CheckCircle, Search, Filter, AlertCircle, Save } from 'lucide-react';
import { Transaksi, PendingSyncItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface AdminPOAdjustmentViewProps {
  transaksi: Transaksi[];
  onFinalizePO: (items: { iddetil: string; poQty: number; jmlTerima: number; noPO: string }[]) => void;
  loading: boolean;
  pendingSyncCount: number;
  onSync: () => void;
}

export const AdminPOAdjustmentView: React.FC<AdminPOAdjustmentViewProps> = ({ 
  transaksi, 
  onFinalizePO, 
  loading,
  pendingSyncCount,
  onSync
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('ALL');
  const [selectedVendor, setSelectedVendor] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [localAdjustments, setLocalAdjustments] = useState<{ [key: string]: number }>({});
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  const parseDate = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    return new Date(dateStr);
  };

  // Filter items that are APPROVED but not yet finalized for PO
  const approvedItems = useMemo(() => {
    return transaksi.filter(t => 
      (t.ACC || '').toUpperCase() === 'APPROVED' && 
      (t.StatusPO || '').toUpperCase() !== 'FINALIZED'
    );
  }, [transaksi]);

  const units = useMemo(() => {
    return ['ALL', ...new Set(approvedItems.map(t => t.Unit))];
  }, [approvedItems]);

  const vendors = useMemo(() => {
    return ['ALL', ...new Set(approvedItems.map(t => t.Vendor).filter(v => v && v !== '-'))];
  }, [approvedItems]);

  const filteredItems = useMemo(() => {
    return approvedItems.filter(t => {
      const matchesSearch = t.NamaBarang.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           t.Idorder.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUnit = selectedUnit === 'ALL' || t.Unit === selectedUnit;
      const matchesVendor = selectedVendor === 'ALL' || t.Vendor === selectedVendor;
      const notReceived = (t.TerimaBarang || '').toUpperCase() !== 'YA';
      
      const tDate = parseDate(t.Tanggal);
      let matchesDate = true;
      if (tDate) {
        if (startDate && tDate < new Date(startDate)) matchesDate = false;
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59);
          if (tDate > end) matchesDate = false;
        }
      } else if (startDate || endDate) {
        matchesDate = false;
      }

      return matchesSearch && matchesUnit && matchesVendor && matchesDate && notReceived;
    });
  }, [approvedItems, searchTerm, selectedUnit, selectedVendor, startDate, endDate]);

  const grandTotal = useMemo(() => {
    return filteredItems.reduce((sum, item) => {
      const qty = localAdjustments[String(item.iddetil)] ?? item.POQty ?? item.JmlACC ?? item.Qty;
      return sum + (item.Harga * qty);
    }, 0);
  }, [filteredItems, localAdjustments]);

  const groupedItems = useMemo(() => {
    const groups: { [unit: string]: { [orderId: string]: Transaksi[] } } = {};
    filteredItems.forEach(item => {
      if (!groups[item.Unit]) groups[item.Unit] = {};
      if (!groups[item.Unit][item.Idorder]) groups[item.Unit][item.Idorder] = [];
      groups[item.Unit][item.Idorder].push(item);
    });
    return groups;
  }, [filteredItems]);

  const handleQtyChange = (iddetil: any, val: string, originalQty: number) => {
    const num = parseInt(val);
    if (isNaN(num)) return;
    const idStr = String(iddetil);
    setLocalAdjustments(prev => ({ ...prev, [idStr]: num }));
    
    // Auto-select if modified
    const newSelection = new Set(selectedItemIds);
    newSelection.add(idStr);
    setSelectedItemIds(newSelection);
  };

  const toggleSelect = (iddetil: any) => {
    const idStr = String(iddetil);
    const newSelection = new Set(selectedItemIds);
    if (newSelection.has(idStr)) {
      newSelection.delete(idStr);
    } else {
      newSelection.add(idStr);
    }
    setSelectedItemIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedItemIds.size === filteredItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(filteredItems.map(i => String(i.iddetil))));
    }
  };

  const handleFinalize = () => {
    if (selectedItemIds.size === 0) return;
    
    // Generate a single PO number for this finalization batch
    const batchPONumber = `PO-${Math.floor(Math.random() * 90000000 + 10000000)}`;
    
    const itemsToFinalize = Array.from(selectedItemIds).map(id => {
      const item = approvedItems.find(i => String(i.iddetil) === String(id));
      
      // Logic: local adjustment > existing POQty > JmlACC > Qty
      let finalQty: number;
      if (localAdjustments[String(id)] !== undefined) {
        finalQty = Number(localAdjustments[String(id)]);
      } else if (item?.POQty !== undefined && item?.POQty !== null && item?.POQty !== "") {
        finalQty = Number(item.POQty);
      } else if (item?.JmlACC !== undefined && item?.JmlACC !== null && item?.JmlACC !== "") {
        finalQty = Number(item.JmlACC);
      } else {
        finalQty = Number(item?.Qty || 0);
      }

      if (isNaN(finalQty)) finalQty = 0;

      return {
        iddetil: String(id),
        poQty: finalQty,
        jmlTerima: finalQty, // As requested: Jml Terima = Qty PO
        noPO: batchPONumber
      };
    });
    onFinalizePO(itemsToFinalize);
    setSelectedItemIds(new Set());
    setLocalAdjustments({});
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-amber-500 p-3 rounded-2xl text-white shadow-lg shadow-amber-500/20">
              <Edit3 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none italic uppercase">Finalisasi PO</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Sesuaikan jumlah barang sebelum cetak PO</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Cari barang atau ID Order..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64 transition-all"
              />
            </div>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="ALL">SEMUA UNIT</option>
              {units.filter(u => u !== 'ALL').map((u, idx) => <option key={`${u}-${idx}`} value={u}>{u}</option>)}
            </select>

            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="ALL">SEMUA VENDOR</option>
              {vendors.filter(v => v !== 'ALL').map((v, idx) => <option key={`${v}-${idx}`} value={v}>{v}</option>)}
            </select>

            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Dari</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-[10px] font-bold outline-none cursor-pointer text-slate-700"
                />
              </div>
              <div className="w-[1px] h-8 bg-slate-200"></div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Sampai</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-[10px] font-bold outline-none cursor-pointer text-slate-700"
                />
              </div>
            </div>
            
            {selectedItemIds.size > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleFinalize}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  <CheckCircle size={16} />
                  Finalisasi PO ({selectedItemIds.size})
                </button>
              </div>
            )}
            {pendingSyncCount > 0 && (
              <button
                onClick={onSync}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                <Save size={16} className={loading ? 'animate-spin' : 'animate-pulse'} />
                SINKRON DATA ({pendingSyncCount})
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-separate border-spacing-y-0">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox" 
                    checked={selectedItemIds.size === filteredItems.length && filteredItems.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-4">Nama Barang & Vendor</th>
                <th className="px-6 py-4 text-center">Qty Awal</th>
                <th className="px-6 py-4 text-center w-32">Qty PO</th>
                <th className="px-6 py-4 text-right">Subtotal Estimasi</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedItems).map(([unit, orders], uIdx) => (
                <React.Fragment key={`unit-${unit}-${uIdx}`}>
                  <tr className="bg-slate-900">
                    <td colSpan={5} className="px-6 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">UNIT: {unit}</span>
                      </div>
                    </td>
                  </tr>
                  {Object.entries(orders).map(([orderId, items], oIdx) => (
                    <React.Fragment key={`order-${orderId}-${oIdx}`}>
                      <tr className="bg-slate-100/80">
                        <td className="px-6 py-1.5"></td>
                        <td colSpan={4} className="px-6 py-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">ORDER ID: {orderId}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">{items[0].Tanggal}</span>
                          </div>
                        </td>
                      </tr>
                      {items.map((item, iIdx) => {
                        const idStr = String(item.iddetil);
                        const hasPOQty = item.POQty !== undefined && item.POQty !== null && item.POQty !== "";
                        const hasJmlACC = item.JmlACC !== undefined && item.JmlACC !== null && item.JmlACC !== "";
                        
                        const currentPOQty = localAdjustments[idStr] ?? 
                                           (hasPOQty ? item.POQty : (hasJmlACC ? item.JmlACC : item.Qty));
                        
                        const isModified = localAdjustments[idStr] !== undefined;
                        const isSelected = selectedItemIds.has(idStr);
                        
                        return (
                          <motion.tr 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={`item-${idStr}-${iIdx}`} 
                            className={`border-b border-slate-50 hover:bg-slate-50 transition-colors group ${isSelected ? 'bg-blue-50/30' : ''}`}
                          >
                            <td className="px-6 py-3">
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={() => toggleSelect(item.iddetil)}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-6 py-3">
                              <p className="text-xs font-black text-slate-800 uppercase italic">{item.NamaBarang}</p>
                              <p className="text-[8px] font-bold text-emerald-600 mt-0.5 uppercase tracking-wider">{item.Vendor}</p>
                            </td>
                            <td className="px-6 py-3 text-center font-bold text-slate-500 text-xs">
                              {item.Qty}
                            </td>
                            <td className="px-6 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={currentPOQty}
                                  onChange={(e) => handleQtyChange(item.iddetil, e.target.value, item.Qty)}
                                  className={`w-20 px-3 py-1.5 rounded-xl text-center text-xs font-black outline-none border-2 transition-all ${
                                    isModified 
                                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                      : 'border-slate-200 bg-white text-slate-700 focus:border-blue-300'
                                  }`}
                                />
                              </div>
                            </td>
                            <td className="px-6 py-3 text-right">
                              <p className="text-sm font-black text-blue-600 italic">
                                Rp {(item.Harga * currentPOQty).toLocaleString('id-ID')}
                              </p>
                              {isModified && (
                                <p className="text-[8px] font-bold text-amber-500 uppercase tracking-widest mt-0.5 italic">
                                  Belum Disimpan
                                </p>
                              )}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
              {filteredItems.length > 0 && (
                <tr className="bg-slate-50">
                  <td colSpan={4} className="px-6 py-4 text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">Grand Total Estimasi</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-lg font-black text-blue-600 italic">
                      Rp {grandTotal.toLocaleString('id-ID')}
                    </span>
                  </td>
                </tr>
              )}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-slate-100 p-4 rounded-full text-slate-300">
                        <AlertCircle size={32} />
                      </div>
                      <p className="text-xs font-black text-slate-300 uppercase italic tracking-widest">Tidak ada item yang perlu disesuaikan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
