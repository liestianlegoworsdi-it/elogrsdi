import React from 'react';
import { Settings, Power, Info } from 'lucide-react';

interface AdminSettingsViewProps {
  isRequestEnabled: boolean;
  onToggleRequest: (enabled: boolean) => void;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({ isRequestEnabled, onToggleRequest }) => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-600/20">
            <Settings size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none italic">Pengaturan Sistem</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Konfigurasi Akses Unit</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${isRequestEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                <Power size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Menu Buat Permintaan</p>
                <p className="text-[10px] font-medium text-slate-500">Aktifkan atau nonaktifkan akses input pesanan untuk seluruh unit.</p>
              </div>
            </div>
            
            <button
              onClick={() => onToggleRequest(!isRequestEnabled)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${
                isRequestEnabled ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  isRequestEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex gap-4">
            <div className="text-blue-600 shrink-0">
              <Info size={20} />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Informasi</p>
              <p className="text-xs font-medium text-blue-800 leading-relaxed">
                Ketika menu dinonaktifkan, unit tidak akan dapat membuat permintaan baru. Mereka akan melihat pesan pemberitahuan mengenai jadwal input.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Preview Pesan User (Saat Off)</p>
        <div className="bg-white/10 p-8 rounded-3xl border border-white/10 text-slate-200 text-center" style={{ fontSize: 'clamp(0.8rem, 2vw, 1.1rem)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <p className="font-black leading-tight">
            UPPPS, Mohon maaf belum dapat melakukan input permintaan pengadaan,<br />
            Menu input permintaan pengadaan akan muncul sesuai dengan jadwal input oleh Admin Pengadaan
          </p>
        </div>
      </div>
    </div>
  );
};
