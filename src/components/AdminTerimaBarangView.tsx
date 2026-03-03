import React, { useState } from 'react';
import { ChevronDown, Loader2, CheckSquare, Square, CheckCircle2 } from 'lucide-react';
import { Transaksi, OrderGroup } from '../types';

interface AdminTerimaBarangViewProps {
  transaksi: Transaksi[];
  onUpdateTerima: (idOrder: string, items: { iddetil: string; sesuai: string; jmlTerima: number }[]) => Promise<void>;
  loading: boolean;
}

export const AdminTerimaBarangView: React.FC<AdminTerimaBarangViewProps> = ({ transaksi, onUpdateTerima, loading }) => {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [terimaData, setTerimaData] = useState<{ [key: string]: { sesuai: string; jmlTerima: number } }>({});
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const groupTransactions = (items: Transaksi[]): OrderGroup[] => {
    const groups: { [key: string]: OrderGroup } = {};
    items.forEach((t) => {
      if (!groups[t.Idorder]) {
        groups[t.Idorder] = {
          id: t.Idorder,
          tanggal: t.Tanggal,
          unit: t.Unit,
          status: t.ACC || 'Pending',
          items: [],
          total: 0,
        };
      }
      groups[t.Idorder].items.push(t);
      groups[t.Idorder].total += parseFloat(t.Subtotal as any) || 0;
    });
    return Object.values(groups).reverse();
  };

  // Filter approved orders that haven't been received yet
  const openApproved = transaksi.filter((t) => t.ACC === 'APPROVED' && !t.TerimaBarang);
  const groups = groupTransactions(openApproved);

  const handleUpdateInput = (iddetil: string, key: 'sesuai' | 'jmlTerima', val: any) => {
    const current = terimaData[iddetil] || { sesuai: 'YA', jmlTerima: 0 };
    const trans = transaksi.find(t => t.iddetil === iddetil);
    
    const newData = { ...current, [key]: val };
    if (key === 'sesuai' && val === 'YA' && trans) {
      newData.jmlTerima = trans.Qty;
    }
    
    setTerimaData({ ...terimaData, [iddetil]: newData });
  };

  const toggleItemSelection = (iddetil: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(iddetil)) {
      newSelection.delete(iddetil);
    } else {
      newSelection.add(iddetil);
    }
    setSelectedItems(newSelection);
  };

  const toggleOrderSelection = (idOrder: string) => {
    const group = groups.find(g => g.id === idOrder);
    if (!group) return;

    const newSelection = new Set(selectedItems);
    const allSelected = group.items.every(item => newSelection.has(item.iddetil));

    group.items.forEach(item => {
      if (allSelected) {
        newSelection.delete(item.iddetil);
      } else {
        newSelection.add(item.iddetil);
      }
    });
    setSelectedItems(newSelection);
  };

  const toggleAllSelection = () => {
    const allItems = groups.flatMap(g => g.items);
    const allSelected = allItems.every(item => selectedItems.has(item.iddetil));

    if (allSelected) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(allItems.map(item => item.iddetil)));
    }
  };

  const handleSubmitSelected = async (idOrder?: string) => {
    setExpandedOrder(null);
    
    // If idOrder is provided, only process items for that order that are selected
    // If not, process all selected items across all orders
    const targetGroups = idOrder ? groups.filter(g => g.id === idOrder) : groups;
    
    for (const group of targetGroups) {
      const itemsToSubmit = group.items
        .filter(item => selectedItems.has(item.iddetil))
        .map(item => {
          const data = terimaData[item.iddetil] || { sesuai: 'YA', jmlTerima: item.Qty };
          return {
            iddetil: item.iddetil,
            sesuai: 'YA', // Force YA as per request "ketika diterima value di kolom 'Terima Barang' menjadi 'YA'"
            jmlTerima: data.sesuai === 'YA' ? item.Qty : data.jmlTerima
          };
        });

      if (itemsToSubmit.length > 0) {
        await onUpdateTerima(group.id, itemsToSubmit);
      }
    }
    
    // Clear selection for processed items
    const processedIds = new Set(targetGroups.flatMap(g => g.items.map(i => i.iddetil)));
    const newSelection = new Set([...selectedItems].filter(id => !processedIds.has(id)));
    setSelectedItems(newSelection);
  };

  const handleSubmitSingleOrder = async (idOrder: string) => {
    const group = groups.find(g => g.id === idOrder);
    if (!group) return;

    const itemsToSubmit = group.items.map(item => {
      const data = terimaData[item.iddetil] || { sesuai: 'YA', jmlTerima: item.Qty };
      return {
        iddetil: item.iddetil,
        sesuai: data.sesuai,
        jmlTerima: data.jmlTerima
      };
    });

    await onUpdateTerima(idOrder, itemsToSubmit);
    setExpandedOrder(null);
    
    // Clear selection for this order
    const orderItemIds = new Set(group.items.map(i => i.iddetil));
    const newSelection = new Set([...selectedItems].filter(id => !orderItemIds.has(id)));
    setSelectedItems(newSelection);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-800 italic">
            Penerimaan Barang per Pengajuan
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
            {openApproved.length} Item Menunggu Penerimaan
          </p>
        </div>
        
        {groups.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={toggleAllSelection}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              {groups.flatMap(g => g.items).every(item => selectedItems.has(item.iddetil)) ? (
                <CheckSquare size={16} className="text-blue-600" />
              ) : (
                <Square size={16} className="text-slate-300" />
              )}
              Pilih Semua
            </button>
            
            <button
              onClick={() => handleSubmitSelected()}
              disabled={loading || selectedItems.size === 0}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
              Terima Terpilih ({selectedItems.size})
            </button>
          </div>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-[1.5rem] p-20 border border-dashed border-slate-200 text-center">
          <p className="font-black text-slate-300 text-[10px] uppercase tracking-widest">
            Tidak ada pengajuan yang siap diterima
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {groups.map((g, idx) => {
            const isExpanded = expandedOrder === g.id;
            const allOrderItemsSelected = g.items.every(item => selectedItems.has(item.iddetil));
            const someOrderItemsSelected = g.items.some(item => selectedItems.has(item.iddetil));
            
            return (
              <div
                key={`group-${g.id}-${idx}`}
                className={`bg-white rounded-2xl border ${
                  isExpanded ? 'border-blue-500 shadow-lg ring-1 ring-blue-500/20' : 'border-slate-200'
                } overflow-hidden transition-all duration-300`}
              >
                <div className="flex items-center">
                  <div 
                    className="pl-6 pr-2 py-4 cursor-pointer"
                    onClick={() => toggleOrderSelection(g.id)}
                  >
                    {allOrderItemsSelected ? (
                      <CheckSquare size={20} className="text-blue-600" />
                    ) : someOrderItemsSelected ? (
                      <div className="w-5 h-5 border-2 border-blue-600 rounded flex items-center justify-center bg-blue-50">
                        <div className="w-2.5 h-0.5 bg-blue-600 rounded-full"></div>
                      </div>
                    ) : (
                      <Square size={20} className="text-slate-300" />
                    )}
                  </div>
                  
                  <div
                    onClick={() => setExpandedOrder(isExpanded ? null : g.id)}
                    className="flex-grow px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-50/50"
                  >
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-[10px] font-black text-blue-600 uppercase italic leading-none">{g.unit}</p>
                        <h4 className="text-sm font-black text-slate-800 mt-1 uppercase">{g.id}</h4>
                      </div>
                      <div className="hidden md:block h-8 w-px bg-slate-100"></div>
                      <div className="hidden md:block">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tanggal Pesan</p>
                        <p className="text-[10px] font-black text-slate-600 uppercase">{g.tanggal}</p>
                      </div>
                      <div className="h-8 w-px bg-slate-100"></div>
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Item</p>
                        <p className="text-[10px] font-black text-slate-600 uppercase">{g.items.length} ITEM</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`bg-slate-100 text-slate-500 p-2 rounded-lg transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      >
                        <ChevronDown size={16} />
                      </span>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 p-6 bg-slate-50/30">
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-2 w-10"></th>
                            <th className="px-6 py-2 text-[9px] font-black text-slate-400 uppercase">Barang</th>
                            <th className="px-6 py-2 text-[9px] font-black text-slate-400 uppercase text-center w-24">
                              Qty Acc
                            </th>
                            <th className="px-6 py-2 text-[9px] font-black text-slate-400 uppercase text-center w-32">
                              Sesuai?
                            </th>
                            <th className="px-6 py-2 text-[9px] font-black text-slate-400 uppercase text-center w-32">
                              Jml Terima
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 italic">
                          {g.items.map((item, iIdx) => {
                            const input = terimaData[item.iddetil] || { sesuai: 'YA', jmlTerima: item.Qty };
                            const isSelected = selectedItems.has(item.iddetil);
                            return (
                              <tr key={`item-${item.iddetil}-${iIdx}`} className={isSelected ? 'bg-blue-50/30' : ''}>
                                <td className="px-6 py-2">
                                  <div 
                                    className="cursor-pointer"
                                    onClick={() => toggleItemSelection(item.iddetil)}
                                  >
                                    {isSelected ? (
                                      <CheckSquare size={18} className="text-blue-600" />
                                    ) : (
                                      <Square size={18} className="text-slate-300" />
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-2">
                                  <p className="text-[10px] font-black uppercase text-slate-800">
                                    {item.NamaBarang}
                                  </p>
                                  <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">
                                    {item.Vendor || '-'}
                                  </p>
                                </td>
                                <td className="px-6 py-2 text-center">
                                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg font-black text-[10px]">
                                    {item.Qty}
                                  </span>
                                </td>
                                <td className="px-6 py-2 text-center">
                                  <div className="flex justify-center">
                                    <select
                                      value={input.sesuai}
                                      onChange={(e) => handleUpdateInput(item.iddetil, 'sesuai', e.target.value)}
                                      className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-black uppercase outline-none focus:ring-2 ring-blue-500/20"
                                    >
                                      <option value="YA">YA</option>
                                      <option value="TIDAK">TIDAK</option>
                                    </select>
                                  </div>
                                </td>
                                <td className="px-6 py-2 text-center">
                                  <div className="flex justify-center">
                                    <input
                                      type="number"
                                      value={input.jmlTerima}
                                      readOnly={input.sesuai === 'YA'}
                                      onChange={(e) =>
                                        handleUpdateInput(item.iddetil, 'jmlTerima', parseInt(e.target.value))
                                      }
                                      className={`w-20 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-black text-center outline-none ${
                                        input.sesuai === 'YA'
                                          ? 'bg-slate-50 text-slate-300'
                                          : 'focus:ring-2 ring-blue-500/20 text-blue-600 font-extrabold'
                                      }`}
                                    />
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        onClick={() => handleSubmitSelected(g.id)}
                        disabled={loading || !someOrderItemsSelected}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center gap-2"
                      >
                        {loading && <Loader2 className="animate-spin" size={12} />}
                        TERIMA TERPILIH DI GROUP INI
                      </button>
                      
                      <button
                        onClick={() => handleSubmitSingleOrder(g.id)}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center gap-2"
                      >
                        {loading && <Loader2 className="animate-spin" size={12} />}
                        TERIMA SEMUA DI GROUP INI
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

