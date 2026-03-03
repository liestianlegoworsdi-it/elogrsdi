import React, { useState } from 'react';
import { Search, Plus, Edit2, ExternalLink, X, Loader2 } from 'lucide-react';
import { Barang } from '../types';

interface AdminMasterBarangViewProps {
  barang: Barang[];
  onSave: (payload: any) => Promise<void>;
  loading: boolean;
}

export const AdminMasterBarangView: React.FC<AdminMasterBarangViewProps> = ({ barang, onSave, loading }) => {
  const [tab, setTab] = useState<'aktif' | 'nonaktif'>('aktif');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<Barang | null>(null);
  const [showModal, setShowModal] = useState(false);

  const MASTER_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1bAfKEW1IKGeajKqcfHkprNPP0KpJeFhy6Zn-I1uFPw8/edit?usp=sharing';

  const filteredBarang = barang.filter(
    (b) =>
      String(b.STATUS || b.Status || 'Aktif').toLowerCase() === tab &&
      b.NamaBarang.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (item: Barang) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const form = e.target as HTMLFormElement;
    const payload = {
      id: editingItem.id || editingItem.iddetil,
      NamaBarang: (form.elements.namedItem('nama') as HTMLInputElement).value,
      Vendor: (form.elements.namedItem('vendor') as HTMLInputElement).value,
      Harga: Number((form.elements.namedItem('harga') as HTMLInputElement).value),
      Status: (form.elements.namedItem('status') as HTMLSelectElement).value,
    };

    await onSave(payload);
    setShowModal(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-800 italic">Database Management</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => window.open(MASTER_SHEET_URL, '_blank')}
            className="flex-1 sm:flex-initial px-6 py-3 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
          >
            <ExternalLink size={14} />
            Buat dan Tambah Master
          </button>
        </div>
      </div>
      <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 bg-slate-50/50 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari barang master..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex bg-slate-200 p-1 rounded-xl">
            <button
              onClick={() => setTab('aktif')}
              className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${
                tab === 'aktif' ? 'bg-white shadow text-blue-600' : 'text-slate-500'
              }`}
            >
              Aktif
            </button>
            <button
              onClick={() => setTab('nonaktif')}
              className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${
                tab === 'nonaktif' ? 'bg-white shadow text-slate-600' : 'text-slate-500'
              }`}
            >
              Nonaktif
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-2 text-[9px] font-black text-slate-400 uppercase">Nama Barang</th>
                <th className="px-6 py-2 text-[9px] font-black text-slate-400 uppercase">Vendor</th>
                <th className="px-6 py-2 text-[9px] font-black text-slate-400 uppercase text-right">Harga</th>
                <th className="px-6 py-2 text-[9px] font-black text-slate-400 uppercase text-center">Opsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 italic">
              {filteredBarang.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-300 font-black text-[10px] uppercase italic">
                    Tidak ada barang
                  </td>
                </tr>
              ) : (
                filteredBarang.map((b, idx) => (
                  <tr key={b.id || b.iddetil || `master-${idx}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-2 text-[10px] font-black uppercase italic">{b.NamaBarang}</td>
                    <td className="px-6 py-2 text-[9px] font-medium text-slate-500">{b.Vendor || '-'}</td>
                    <td className="px-6 py-2 text-right text-[10px] font-black text-blue-600">
                      Rp {Number(b.Harga).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-2 text-center">
                      <button
                        onClick={() => handleEdit(b)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                      >
                        <Edit2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && editingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none italic uppercase">
                Edit Master Barang
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingItem(null);
                }}
                className="p-2 text-slate-300 hover:text-red-500"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Barang</label>
                <input
                  name="nama"
                  type="text"
                  defaultValue={editingItem.NamaBarang}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Vendor</label>
                <input
                  name="vendor"
                  type="text"
                  defaultValue={editingItem.Vendor || ''}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Harga Satuan</label>
                <input
                  name="harga"
                  type="number"
                  defaultValue={editingItem.Harga}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Barang</label>
                <select
                  name="status"
                  defaultValue={editingItem.STATUS || editingItem.Status || 'Aktif'}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs uppercase"
                >
                  <option value="Aktif">AKTIF</option>
                  <option value="Nonaktif">NONAKTIF</option>
                </select>
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg text-[10px] tracking-widest uppercase hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="animate-spin" size={16} />}
                  SIMPAN PERUBAHAN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
