import React, { useState, useRef, useEffect } from 'react';
import { LogOut, RefreshCw, Loader2, ChevronDown, Package, ClipboardList, BarChart3, Menu, X, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';

interface NavbarProps {
  user: User;
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
  pendingSyncCount: number;
  onSync: () => void;
  syncLoading: boolean;
  isRequestEnabled: boolean;
  lastSyncTime: Date;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  user, 
  currentView, 
  onViewChange, 
  onLogout, 
  pendingSyncCount, 
  onSync, 
  syncLoading,
  isRequestEnabled,
  lastSyncTime
}) => {
  const isAdmin = user.Role.toLowerCase() === 'admin';
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories = [
    {
      id: 'permintaan',
      label: 'Permintaan',
      icon: <Package size={14} />,
      items: [
        ...(isAdmin || isRequestEnabled ? [{ id: 'pos', label: 'Buat Permintaan' }] : []),
        { id: 'history', label: 'Riwayat Unit' }
      ]
    },
    ...(isAdmin ? [
      {
        id: 'kelola',
        label: 'Kelola Permintaan',
        icon: <ClipboardList size={14} />,
        items: [
          { id: 'admin_approval', label: 'Approval' },
          { id: 'admin_all_history', label: 'Monitoring' },
          { id: 'admin_terima_barang', label: 'Terima Barang' },
          { id: 'admin_master_barang', label: 'Master Barang' },
          { id: 'admin_settings', label: 'Pengaturan' }
        ]
      },
      {
        id: 'purchase_order',
        label: 'Purchase Order',
        icon: <FileText size={14} />,
        items: [
          { id: 'admin_po_adjustment', label: 'Finalisasi PO' },
          { id: 'admin_po', label: 'Cetak PO' }
        ]
      },
      {
        id: 'report',
        label: 'Report',
        icon: <BarChart3 size={14} />,
        items: [
          { id: 'admin_report', label: 'Laporan' },
          { id: 'admin_efficiency', label: 'Rekap Per Unit' }
        ]
      }
    ] : [])
  ];

  const handleItemClick = (id: string) => {
    onViewChange(id);
    setActiveDropdown(null);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md no-print" ref={dropdownRef}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onViewChange(isAdmin ? 'admin_all_history' : 'history')}>
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
              <Package size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-blue-600 tracking-tighter">
                E-LOG <span className="text-slate-800">RSDI</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest -mt-1">
                Logistics Management
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            {categories.map((cat, cIdx) => (
              <div key={`cat-${cat.id}-${cIdx}`} className="relative">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === cat.id ? null : cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    cat.items.some(i => i.id === currentView) || activeDropdown === cat.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {cat.icon}
                  {cat.label}
                  <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === cat.id ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {activeDropdown === cat.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden py-2"
                    >
                      {cat.items.map((item, iIdx) => (
                        <button
                          key={`item-${item.id}-${iIdx}`}
                          onClick={() => handleItemClick(item.id)}
                          className={`w-full text-left px-4 py-3 text-xs font-bold transition-all flex items-center justify-between ${
                            currentView === item.id 
                              ? 'bg-blue-50 text-blue-600' 
                              : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                          }`}
                        >
                          {item.label}
                          {currentView === item.id && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {pendingSyncCount > 0 && (
            <button
              onClick={onSync}
              disabled={syncLoading}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all disabled:opacity-50"
            >
              {syncLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              SINGKRONISASI ({pendingSyncCount})
            </button>
          )}
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800 leading-none">{user.Nama}</p>
            <div className="flex flex-col items-end mt-1">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{user.Unit}</p>
              <p className="text-[8px] font-bold text-blue-500/60 uppercase tracking-tighter mt-0.5">
                Last Sync: {lastSyncTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <button
            onClick={onLogout}
            className="hidden sm:block p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-slate-100 overflow-hidden"
          >
            <div className="p-4 space-y-6">
              {categories.map((cat, cIdx) => (
                <div key={`m-cat-${cat.id}-${cIdx}`} className="space-y-2">
                  <div className="flex items-center gap-2 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {cat.icon}
                    {cat.label}
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {cat.items.map((item, iIdx) => (
                      <button
                        key={`m-item-${item.id}-${iIdx}`}
                        onClick={() => handleItemClick(item.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                          currentView === item.id 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-red-50 text-red-600 text-xs font-black uppercase tracking-widest"
                >
                  <LogOut size={18} />
                  KELUAR APLIKASI
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
