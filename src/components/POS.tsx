import React, { useState } from 'react';
import { Search, Plus, Minus, Trash2, Loader2 } from 'lucide-react';
import { Barang, CartItem } from '../types';

interface POSProps {
  barang: Barang[];
  cart: CartItem[];
  onAddToCart: (item: Barang) => void;
  onUpdateQty: (id: string, delta: number) => void;
  onSetManualQty: (id: string, val: string) => void;
  onRemoveFromCart: (id: string) => void;
  onSubmitOrder: () => void;
  onCancelEdit: () => void;
  isEditing: string | false;
  loading: boolean;
  isRequestEnabled?: boolean;
}

export const POS: React.FC<POSProps> = ({
  barang,
  cart,
  onAddToCart,
  onUpdateQty,
  onSetManualQty,
  onRemoveFromCart,
  onSubmitOrder,
  onCancelEdit,
  isEditing,
  loading,
  isRequestEnabled = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = barang.filter(
    (b) =>
      (String(b.STATUS || b.Status || 'Aktif').toLowerCase() !== 'nonaktif') &&
      b.NamaBarang.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cartTotal = cart.reduce((sum, item) => sum + item.Harga * item.qty, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 space-y-4">
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-black text-slate-800 tracking-tight">
            {isEditing ? 'REVISI ORDER' : 'KATALOG'}
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari barang..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase">Nama Barang</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase text-center">Pilih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-10 text-center text-slate-300 font-black text-[10px] uppercase">
                    Barang tidak ditemukan
                  </td>
                </tr>
              ) : (
                filteredItems.map((b, idx) => (
                  <tr key={`item-${b.iddetil || b.id || idx}`} className="hover:bg-blue-50/30">
                    <td className="px-4 py-2.5">
                      <p className="font-bold text-slate-700 text-xs uppercase">{b.NamaBarang}</p>
                      <p className="text-[9px] text-slate-400 italic">
                        Rp {Number(b.Harga || 0).toLocaleString('id-ID')}
                      </p>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => onAddToCart(b)}
                        className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-2.5 py-1 rounded-lg font-black text-[9px] transition-all"
                      >
                        TAMBAH
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="lg:col-span-8">
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[calc(100vh-140px)]">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center">
            <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-widest">DAFTAR PESANAN</h3>
            <div className="bg-blue-600 text-white text-[10px] px-3 py-1 rounded-full font-black">
              {cart.length} ITEM
            </div>
          </div>
          <div className="flex-grow overflow-y-auto p-4 custom-scrollbar space-y-2">
            {cart.length === 0 ? (
              <p className="text-center text-slate-300 py-10 font-black text-[10px] uppercase">Keranjang Kosong</p>
            ) : (
              cart.map((c, idx) => (
                <div key={`cart-${c.iddetil || idx}`} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <button
                    onClick={() => onRemoveFromCart(c.iddetil!)}
                    className="text-slate-300 hover:text-red-500 transition-colors shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="flex-grow min-w-0">
                    <h4 className="text-[11px] font-black text-slate-800 truncate uppercase">{c.NamaBarang}</h4>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5 tracking-tighter">
                      @ Rp {c.Harga.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="flex items-center bg-white border border-slate-200 rounded-lg shrink-0">
                    <button
                      onClick={() => onUpdateQty(c.iddetil!, -1)}
                      className="w-7 h-7 flex items-center justify-center font-bold text-slate-400 hover:text-red-500"
                    >
                      <Minus size={12} />
                    </button>
                    <input
                      type="number"
                      onChange={(e) => onSetManualQty(c.iddetil!, e.target.value)}
                      value={c.qty}
                      className="w-9 text-center bg-transparent font-black text-[11px] outline-none"
                    />
                    <button
                      onClick={() => onUpdateQty(c.iddetil!, 1)}
                      className="w-7 h-7 flex items-center justify-center font-bold text-slate-400 hover:text-emerald-500"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="w-24 text-right shrink-0">
                    <p className="text-[11px] font-black text-blue-600">
                      Rp {(c.Harga * c.qty).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          {cart.length > 0 && (
            <div className="bg-slate-900 px-6 py-5">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">TOTAL</span>
                <span className="text-2xl font-black text-white italic tracking-tighter leading-none">
                  Rp {cartTotal.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex gap-3">
                {isEditing && (
                  <button
                    onClick={onCancelEdit}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all"
                  >
                    BATAL REVISI
                  </button>
                )}
                <button
                  onClick={onSubmitOrder}
                  disabled={loading || !isRequestEnabled}
                  className={`${
                    isEditing ? 'flex-[2]' : 'w-full'
                  } ${!isRequestEnabled ? 'bg-slate-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'} text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg flex items-center justify-center gap-2`}
                >
                  {loading && <Loader2 className="animate-spin" size={16} />}
                  {!isRequestEnabled ? 'MENU DITUTUP' : (isEditing ? 'UPDATE PESANAN' : 'KIRIM PESANAN')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
