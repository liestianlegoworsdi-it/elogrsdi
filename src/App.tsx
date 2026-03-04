import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, AlertCircle, LogOut, Activity } from 'lucide-react';
import { User, Barang, Transaksi, CartItem, OrderGroup, PendingSyncItem, Anggaran } from './types';
import { getInitialData, submitOrder as submitOrderApi, updateApproval as updateApprovalApi, updateMasterBarang as updateMasterBarangApi, updateTerimaBarang as updateTerimaBarangApi, updateSettings as updateSettingsApi, updatePOQty as updatePOQtyApi, finalizePO as finalizePOApi } from './services/api';
import { Navbar } from './components/Navbar';
import { Login } from './components/Login';
import { POS } from './components/POS';
import { HistoryView } from './components/HistoryView';
import { AdminApprovalView } from './components/AdminApprovalView';
import { DetailModal } from './components/DetailModal';
import { AdminTerimaBarangView } from './components/AdminTerimaBarangView';
import { AdminMasterBarangView } from './components/AdminMasterBarangView';
import { AdminPOView } from './components/AdminPOView';
import { AdminReportView } from './components/AdminReportView';
import { AdminMonitoringView } from './components/AdminMonitoringView';
import { AdminEfficiencyReportView } from './components/AdminEfficiencyReportView';
import { AdminSettingsView } from './components/AdminSettingsView';
import { AdminPOAdjustmentView } from './components/AdminPOAdjustmentView';
import { AdminBudgetAchievementView } from './components/AdminBudgetAchievementView';

export default function App() {
  const [view, setView] = useState('login');
  const [user, setUser] = useState<User | null>(null);
  const [barang, setBarang] = useState<Barang[]>([]);
  const [userList, setUserList] = useState<User[]>([]);
  const [transaksi, setTransaksi] = useState<Transaksi[]>([]);
  const [anggaran, setAnggaran] = useState<Anggaran[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showGreeting, setShowGreeting] = useState(false);
  const [isEditing, setIsEditing] = useState<string | false>(false);
  const [originalItemIds, setOriginalItemIds] = useState<string[]>([]);
  const [detailOrder, setDetailOrder] = useState<OrderGroup | null>(null);
  const [pendingSync, setPendingSync] = useState<PendingSyncItem[]>([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [isRequestEnabled, setIsRequestEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('elog_request_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [serverHealth, setServerHealth] = useState<{ status: string; env: string; googleConnectivity?: string } | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showDebug, setShowDebug] = useState(false);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setServerHealth(data);
      setDebugInfo(prev => prev + `\n[${new Date().toLocaleTimeString()}] Health: ${JSON.stringify(data)}`);
    } catch (err: any) {
      console.error('Health check failed:', err);
      setDebugInfo(prev => prev + `\n[${new Date().toLocaleTimeString()}] Health Error: ${err.message}`);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Optimistic UI: Merge server data with pending local changes
  const displayTransaksi = React.useMemo(() => {
    let result = [...transaksi];
    
    // Sort pending sync by timestamp to apply in order
    const sortedSync = [...pendingSync].sort((a, b) => a.timestamp - b.timestamp);

    sortedSync.forEach(item => {
      if (item.type === 'submitOrder') {
        const { data, isUpdate, idOrder } = item.payload;
        if (isUpdate) {
          // Remove old items of this order
          result = result.filter(t => t.Idorder !== idOrder);
        }
        // Add new/updated items
        result = [...result, ...data];
      } else if (item.type === 'updateApproval') {
        const { iddetil, status, jmlAcc, totalAcc } = item.payload;
        result = result.map(t => t.iddetil === iddetil ? { 
          ...t, 
          ACC: status, 
          JmlACC: jmlAcc,
          Subtotal: totalAcc 
        } : t);
      } else if (item.type === 'updateTerimaBarang') {
        const { iddetil, sesuai, jmlTerima, tanggalTerima } = item.payload;
        result = result.map(t => t.iddetil === iddetil ? { 
          ...t, 
          TerimaBarang: sesuai, 
          JmlTerima: jmlTerima, 
          TanggalTerima: tanggalTerima 
        } : t);
      } else if (item.type === 'updatePO') {
        const { iddetil, poQty } = item.payload;
        result = result.map(t => String(t.iddetil) === String(iddetil) ? { 
          ...t, 
          POQty: poQty,
          Subtotal: t.Harga * poQty
        } : t);
      } else if (item.type === 'finalizePO') {
        const { items } = item.payload;
        result = result.map(t => {
          const update = items.find((i: any) => String(i.iddetil) === String(t.iddetil));
          if (update) {
            return { 
              ...t, 
              StatusPO: 'FINALIZED',
              POQty: update.poQty,
              Subtotal: t.Harga * update.poQty
            };
          }
          return t;
        });
      }
    });

    return result;
  }, [transaksi, pendingSync]);

  const displayBarang = React.useMemo(() => {
    let result = [...barang];
    const sortedSync = [...pendingSync].sort((a, b) => a.timestamp - b.timestamp);

    sortedSync.forEach(item => {
      if (item.type === 'updateMasterBarang') {
        const payload = item.payload;
        const id = payload.id || payload.iddetil;
        const exists = result.findIndex(b => (b.id || b.iddetil) === id);
        if (exists !== -1) {
          result[exists] = { ...result[exists], ...payload };
        }
      }
    });
    return result;
  }, [barang, pendingSync]);

  // Load pending sync from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('elog_pending_sync');
    if (saved) {
      try {
        setPendingSync(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse pending sync', e);
      }
    }
  }, []);

  // Save pending sync to localStorage
  useEffect(() => {
    localStorage.setItem('elog_pending_sync', JSON.stringify(pendingSync));
  }, [pendingSync]);

  useEffect(() => {
    localStorage.setItem('elog_request_enabled', JSON.stringify(isRequestEnabled));
  }, [isRequestEnabled]);

  const fetchData = useCallback(async (isBackground = false) => {
    if (isBackground) {
      setSyncing(true);
      setSyncProgress(0);
    } else {
      setLoading(true);
      setLoadingProgress(0);
    }
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      if (isBackground) {
        setSyncProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.floor(Math.random() * 5) + 1;
        });
      } else {
        setLoadingProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.floor(Math.random() * 10) + 1;
        });
      }
    }, 200);

    try {
      const data = await getInitialData();
      if (isBackground) setSyncProgress(100);
      else setLoadingProgress(100);
      
      setBarang(data.barang || []);
      setUserList(data.user || []);
      setTransaksi(data.transaksi || []);
      setAnggaran(data.anggaran || []);
      setLastSyncTime(new Date());
      
      if (data.settings) {
        const reqEnabled = data.settings.find((s: any) => s.key === 'isRequestEnabled');
        if (reqEnabled) {
          setIsRequestEnabled(reqEnabled.value === 'true' || reqEnabled.value === true);
        }
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Gagal mengambil data');
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        if (isBackground) {
          setSyncing(false);
          setSyncProgress(0);
        } else {
          setLoading(false);
          setLoadingProgress(0);
        }
      }, 500);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const handleLogin = async (username: string, pass: string) => {
    setLoading(true);
    setLoadingProgress(0);
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.floor(Math.random() * 10) + 1;
      });
    }, 200);

    try {
      const data = await getInitialData();
      setLoadingProgress(100);
      const foundUser = data.user.find(
        (x: User) => String(x.Username).toLowerCase() === username.toLowerCase() && String(x.Password) === pass
      );
      if (foundUser) {
        setUser(foundUser);
        setBarang(data.barang || []);
        setUserList(data.user || []);
        setTransaksi(data.transaksi || []);
        setAnggaran(data.anggaran || []);
        setShowGreeting(true);
        const isAdmin = foundUser.Role.toLowerCase() === 'admin';
        const initialView = isAdmin ? 'admin_capaian' : (isRequestEnabled ? 'pos' : 'history');
        setView(initialView);
      } else {
        setError('Username atau Password salah');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal login');
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setLoading(false);
        setLoadingProgress(0);
      }, 500);
    }
  };

  const handleAddToCart = (item: Barang) => {
    const exists = cart.find((c) => c.NamaBarang === item.NamaBarang);
    if (exists) {
      setCart(cart.map((c) => (c.iddetil === exists.iddetil ? { ...c, qty: c.qty + 1 } : c)));
    } else {
      setCart([
        ...cart,
        {
          ...item,
          qty: 1,
          iddetil: 'DTL-' + Math.random().toString(36).substr(2, 9),
        },
      ]);
    }
  };

  const handleUpdateQty = (id: string, delta: number) => {
    setCart(
      cart
        .map((c) => (c.iddetil === id ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0)
    );
  };

  const handleSetManualQty = (id: string, val: string) => {
    const num = parseInt(val);
    if (!isNaN(num)) {
      setCart(
        cart
          .map((c) => (c.iddetil === id ? { ...c, qty: num } : c))
          .filter((c) => c.qty > 0)
      );
    }
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(cart.filter((c) => c.iddetil !== id));
  };

  const handleSubmitOrder = async () => {
    if (!user || cart.length === 0) return;
    
    // Safety check: Block submission if admin has disabled requests (except for revisions)
    if (user.Role.toLowerCase() !== 'admin' && !isRequestEnabled && !isEditing) {
      setError('Mohon maaf, admin baru saja menonaktifkan menu permintaan. Data Anda tidak dapat dikirim.');
      setView('history');
      setCart([]);
      setIsEditing(false);
      return;
    }

    const idOrder = isEditing ? (isEditing as string) : 'ORD-' + Math.floor(Date.now() / 1000);
    let tanggal = new Date().toLocaleDateString('id-ID');
    let unit = user.Unit;

    if (isEditing) {
      const originalGroup = groupTransactions(displayTransaksi).find(g => g.id === isEditing);
      if (originalGroup) {
        tanggal = originalGroup.tanggal;
        unit = originalGroup.unit;
      }
    }

    const currentItemIds = cart.map((c) => String(c.iddetil || ''));
    const deletedItemIds = isEditing ? originalItemIds.map(id => String(id)).filter((id) => !currentItemIds.includes(id)) : [];

    const orderData = cart.map((c) => ({
      iddetil: c.iddetil,
      Idorder: idOrder,
      Tanggal: tanggal,
      Unit: unit,
      NamaBarang: c.NamaBarang,
      Harga: c.Harga,
      Qty: c.qty,
      Subtotal: c.Harga * c.qty,
      Vendor: c.Vendor || '-',
      ACC: isEditing ? 'Pending' : 'Pending',
    }));

    const newItem: PendingSyncItem = {
      id: 'SYNC-' + Date.now(),
      type: 'submitOrder',
      payload: { data: orderData, isUpdate: !!isEditing, deletedIds: deletedItemIds, idOrder },
      timestamp: Date.now(),
      description: `Pesanan ${idOrder} (${cart.length} item)`
    };

    setPendingSync([...pendingSync, newItem]);
    setCart([]);
    setIsEditing(false);
    setOriginalItemIds([]);
    setView(user.Role.toLowerCase() === 'admin' ? 'admin_all_history' : 'history');
  };

  const handleEditOrder = (idOrder: string) => {
    const group = groupTransactions(displayTransaksi).find((g) => g.id === idOrder);
    if (!group) return;
    setOriginalItemIds(group.items.map((i) => i.iddetil));
    setCart(
      group.items.map((item) => ({
        iddetil: item.iddetil,
        NamaBarang: item.NamaBarang,
        Harga: parseFloat(item.Harga as any),
        qty: parseFloat(item.Qty as any),
        Vendor: item.Vendor,
      }))
    );
    setIsEditing(group.id);
    setView('pos');
    setDetailOrder(null);
  };

  const handleCancelEdit = () => {
    setCart([]);
    setIsEditing(false);
    setOriginalItemIds([]);
    setView(user?.Role.toLowerCase() === 'admin' ? 'admin_all_history' : 'history');
  };

  const handleApproval = (idOrder: string, status: string, selectedIds?: string[]) => {
    const group = groupTransactions(displayTransaksi).find((g) => g.id === idOrder);
    if (!group) return;

    const newItems: PendingSyncItem[] = group.items.map(item => {
      let finalStatus = status;
      if (status === 'APPROVED' && selectedIds) {
        finalStatus = selectedIds.includes(item.iddetil) ? 'APPROVED' : 'TOLAK';
      }

      return {
        id: 'SYNC-' + Math.random().toString(36).substr(2, 9),
        type: 'updateApproval',
        payload: {
          iddetil: item.iddetil,
          status: finalStatus,
          jmlAcc: finalStatus === 'APPROVED' ? item.Qty : 0,
          totalAcc: finalStatus === 'APPROVED' ? item.Subtotal : 0
        },
        timestamp: Date.now(),
        description: `${finalStatus} Item: ${item.NamaBarang}`
      };
    });

    setPendingSync([...pendingSync, ...newItems]);
    setDetailOrder(null);
  };

  const handleUpdateTerima = async (idOrder: string, items: { iddetil: string; sesuai: string; jmlTerima: number }[]) => {
    const newItems: PendingSyncItem[] = items.map(item => ({
      id: 'SYNC-' + Math.random().toString(36).substr(2, 9),
      type: 'updateTerimaBarang',
      payload: {
        iddetil: item.iddetil,
        sesuai: item.sesuai,
        jmlTerima: item.jmlTerima,
        tanggalTerima: new Date().toLocaleDateString('id-ID'),
      },
      timestamp: Date.now(),
      description: `Terima Item ID: ${item.iddetil}`
    }));

    setPendingSync([...pendingSync, ...newItems]);
  };

  const handleSaveMaster = async (payload: any) => {
    const newItem: PendingSyncItem = {
      id: 'SYNC-' + Date.now(),
      type: 'updateMasterBarang',
      payload,
      timestamp: Date.now(),
      description: `Update Master: ${payload.NamaBarang}`
    };
    setPendingSync([...pendingSync, newItem]);
  };

  const handleToggleRequest = (enabled: boolean) => {
    setIsRequestEnabled(enabled);
    const newItem: PendingSyncItem = {
      id: 'SYNC-' + Date.now(),
      type: 'updateSettings',
      payload: { key: 'isRequestEnabled', value: enabled },
      timestamp: Date.now(),
      description: `Update Pengaturan: Menu Permintaan ${enabled ? 'ON' : 'OFF'}`
    };
    setPendingSync([...pendingSync, newItem]);
  };

  const handleFinalizePO = (items: { iddetil: string; poQty: number; jmlTerima: number; noPO: string }[]) => {
    const newItem: PendingSyncItem = {
      id: 'SYNC-' + Date.now(),
      type: 'finalizePO',
      payload: { items },
      timestamp: Date.now(),
      description: `Finalize PO for ${items.length} items`
    };
    setPendingSync([...pendingSync, newItem]);
  };

  const handleSyncAll = useCallback(async () => {
    if (pendingSync.length === 0 || syncing) return;
    setSyncing(true);
    setSyncProgress(0);
    setError(null);
    
    const currentSyncItems = [...pendingSync];
    const succeededIds: string[] = [];
    const total = currentSyncItems.length;

    for (let i = 0; i < total; i++) {
      const item = currentSyncItems[i];
      try {
        if (item.type === 'submitOrder') {
          await submitOrderApi(item.payload.data, item.payload.isUpdate, item.payload.deletedIds, item.payload.idOrder);
        } else if (item.type === 'updateApproval') {
          await updateApprovalApi(item.payload.iddetil, item.payload.status, item.payload.jmlAcc, item.payload.totalAcc);
        } else if (item.type === 'updateTerimaBarang') {
          await updateTerimaBarangApi(item.payload);
        } else if (item.type === 'updateMasterBarang') {
          await updateMasterBarangApi(item.payload);
        } else if (item.type === 'updateSettings') {
          await updateSettingsApi(item.payload);
        } else if (item.type === 'finalizePO') {
          await finalizePOApi(item.payload.items);
        }
        succeededIds.push(item.id);
        setSyncProgress(Math.round(((i + 1) / total) * 100));
      } catch (err: any) {
        console.error('Sync failed for item:', item, err);
        // Continue to next item
      }
    }

    // Functional update to avoid race conditions with items added during sync
    setPendingSync(prev => prev.filter(item => !succeededIds.includes(item.id)));
    
    const failedCount = total - succeededIds.length;
    if (failedCount > 0) {
      setError(`${failedCount} item gagal disinkronisasi. Silakan periksa koneksi internet atau URL Apps Script Anda, lalu coba lagi.`);
    } else {
      await fetchData(true);
    }
    
    setSyncing(false);
    setSyncProgress(0);
    setLastSyncTime(new Date());
  }, [pendingSync, syncing, fetchData]);

  // Auto-sync immediately when there are pending changes
  useEffect(() => {
    if (pendingSync.length > 0 && !syncing) {
      const debounceTimer = setTimeout(() => {
        handleSyncAll();
      }, 2000); // Wait 2 seconds of inactivity before syncing
      return () => clearTimeout(debounceTimer);
    }
  }, [pendingSync.length, syncing, handleSyncAll]);

  // Background refresh every 5 minutes to get fresh data from others
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(() => {
      if (syncing) return; // Skip if already syncing

      if (pendingSync.length === 0) {
        console.log('Auto-fetching fresh data...');
        fetchData(true);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(intervalId);
  }, [user, pendingSync.length, syncing, fetchData]);

  // Track user activity for auto-logout
  useEffect(() => {
    if (!user) return;

    const handleActivity = () => {
      setLastActivity(Date.now());
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [user]);

  // Auto-logout after 7 minutes of inactivity
  useEffect(() => {
    if (!user) return;

    const checkInactivity = async () => {
      const now = Date.now();
      const inactiveTime = now - lastActivity;
      const limit = 7 * 60 * 1000; // 7 minutes

      if (inactiveTime >= limit) {
        console.log('Inactivity detected. Syncing and logging out...');
        
        // Ensure all data is synced before logout
        if (pendingSync.length > 0) {
          try {
            await handleSyncAll();
          } catch (err) {
            console.error('Final sync before auto-logout failed:', err);
          }
        }
        
        // Perform logout without confirmation
        confirmLogout();
      }
    };

    const intervalId = setInterval(checkInactivity, 30000); // Check every 30 seconds
    return () => clearInterval(intervalId);
  }, [user, lastActivity, pendingSync.length, handleSyncAll]);

  // Safety: Force exit from POS if admin disables requests while user is active
  useEffect(() => {
    if (user && user.Role.toLowerCase() !== 'admin' && !isRequestEnabled && view === 'pos') {
      setError('Akses menu permintaan telah ditutup oleh admin.');
      setView('history');
      setCart([]);
      setIsEditing(false);
    }
  }, [isRequestEnabled, view, user]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setUser(null);
    setView('login');
    setCart([]);
    setShowLogoutConfirm(false);
  };

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
          totalApproved: 0,
        };
      }
      groups[t.Idorder].items.push(t);
      groups[t.Idorder].total += parseFloat(t.Subtotal as any) || 0;
      if ((t.ACC || '').toLowerCase() === 'approved') {
        groups[t.Idorder].totalApproved += (t.Harga * (t.JmlACC || 0)) || 0;
      }
    });
    return Object.values(groups).reverse();
  };

  const renderLoadingOverlay = () => {
    return (
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[5000] bg-white flex flex-col items-center justify-center no-print"
          >
            <div className="w-full max-w-xs space-y-6 text-center">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="44"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-blue-600 transition-all duration-300"
                    style={{
                      strokeDasharray: 276.46,
                      strokeDashoffset: 276.46 - (276.46 * loadingProgress) / 100,
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-black text-slate-800">{loadingProgress}%</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-black text-slate-800 uppercase tracking-widest">Mohon tunggu sejenak</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Syncing Database...</p>
              </div>
              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-blue-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${loadingProgress}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  if (view === 'login' || !user) {
    return (
      <>
        {renderLoadingOverlay()}
        <Login onLogin={handleLogin} loading={loading} />
        
        {/* Server Health Indicator */}
        <div className="fixed bottom-4 left-4 z-[100] no-print flex flex-col gap-2">
          <div 
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-sm cursor-pointer hover:opacity-80 transition-opacity ${serverHealth ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}
            onClick={() => {
              checkHealth();
              setShowDebug(!showDebug);
            }}
          >
            <Activity size={10} className={serverHealth ? 'animate-pulse' : ''} />
            {serverHealth ? `Server Online (${serverHealth.env})` : 'Server Offline'}
            {serverHealth?.googleConnectivity && (
              <span className="ml-2 opacity-50">| Google: {serverHealth.googleConnectivity}</span>
            )}
          </div>
          
          {showDebug && (
            <div className="bg-slate-900 text-slate-300 p-3 rounded-lg text-[8px] font-mono max-w-xs max-h-40 overflow-auto shadow-xl border border-slate-800">
              <div className="flex justify-between items-center mb-2 border-bottom border-slate-800 pb-1">
                <span className="text-slate-500 uppercase">Debug Console</span>
                <button onClick={() => setDebugInfo('')} className="hover:text-white">Clear</button>
              </div>
              <pre className="whitespace-pre-wrap">{debugInfo || 'No logs yet...'}</pre>
            </div>
          )}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-5 right-5 z-[200] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex flex-col border-l-4 border-red-500"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1 flex items-center gap-2">
                <AlertCircle size={12} /> System Alert
              </p>
              <p className="text-xs font-medium leading-tight">{error}</p>
              <button onClick={() => setError(null)} className="absolute top-2 right-2 text-slate-500 hover:text-white">
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      {renderLoadingOverlay()}
      <AnimatePresence>
        {showGreeting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden text-center p-8 space-y-6"
            >
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="text-blue-600" size={32} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none italic">
                  {user.Role.toLowerCase() === 'admin' ? 'Assalamualaikum, Admin Pengadaan' : 'Assalamualaikum'}
                </h2>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{user.Unit}</p>
              </div>
              <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic">
                {user.Role.toLowerCase() === 'admin' 
                  ? 'Selamat datang di panel pengelolaan pengadaan. Silakan pantau, setujui, dan kelola data permintaan unit dengan amanah.'
                  : 'Silakan lengkapi data permintaan pengadaan Anda dengan teliti agar operasional unit tetap berjalan optimal.'}
              </p>
              <button
                onClick={() => {
                  setShowGreeting(false);
                  const isAdmin = user.Role.toLowerCase() === 'admin';
                  if (!isAdmin && !isRequestEnabled) {
                    setView('history');
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg text-[10px] tracking-[0.2em] uppercase transition-all"
              >
                {user.Role.toLowerCase() === 'admin' ? 'Bismillah' : (isRequestEnabled ? 'MULAI PERMINTAAN' : 'LIHAT RIWAYAT')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar 
        user={user} 
        currentView={view} 
        onViewChange={setView} 
        onLogout={handleLogout} 
        pendingSyncCount={pendingSync.length}
        onSync={handleSyncAll}
        syncLoading={syncing}
        isRequestEnabled={isRequestEnabled}
        lastSyncTime={lastSyncTime}
      />

      {/* Background Sync Indicator */}
      <AnimatePresence>
        {syncing && (
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[1000] bg-white/95 backdrop-blur-md border border-blue-100 shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 no-print"
          >
            <div className="flex items-center gap-3">
              <div className="relative w-6 h-6">
                <svg className="w-6 h-6 transform -rotate-90">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="transparent"
                    className="text-slate-100"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="transparent"
                    className="text-blue-600 transition-all duration-300"
                    style={{
                      strokeDasharray: 62.83,
                      strokeDashoffset: 62.83 - (62.83 * syncProgress) / 100,
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 size={10} className="text-blue-600 animate-spin" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider leading-none">Syncing...</span>
                <span className="text-[8px] font-bold text-blue-600 uppercase tracking-widest">{syncProgress}%</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-grow max-w-7xl mx-auto w-full p-4 md:p-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {view === 'pos' && (
              user.Role.toLowerCase() === 'admin' || isRequestEnabled || isEditing ? (
                <POS
                  barang={displayBarang}
                  cart={cart}
                  onAddToCart={handleAddToCart}
                  onUpdateQty={handleUpdateQty}
                  onSetManualQty={handleSetManualQty}
                  onRemoveFromCart={handleRemoveFromCart}
                  onSubmitOrder={handleSubmitOrder}
                  onCancelEdit={handleCancelEdit}
                  isEditing={isEditing}
                  loading={loading}
                  isRequestEnabled={isRequestEnabled}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-8 w-full">
                  <div className="bg-amber-50 p-12 md:p-20 rounded-[3rem] border border-amber-100 w-full shadow-2xl shadow-amber-500/10">
                    <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-10">
                      <AlertCircle className="text-amber-600" size={48} />
                    </div>
                    <h3 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tighter leading-tight mb-8 italic">
                      Akses Dibatasi Sementara
                    </h3>
                    <p className="font-black text-slate-700 leading-tight w-full text-balance" style={{ fontSize: 'clamp(1rem, 3vw, 2rem)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      UPPPS, Mohon maaf belum dapat melakukan input permintaan pengadaan,<br />
                      Menu input permintaan pengadaan akan muncul sesuai dengan jadwal input oleh Admin Pengadaan
                    </p>
                  </div>
                  <button 
                    onClick={() => setView('history')}
                    className="text-sm font-black text-blue-600 uppercase tracking-[0.3em] hover:underline bg-blue-50 px-8 py-4 rounded-2xl transition-all"
                  >
                    Lihat Riwayat Unit
                  </button>
                </div>
              )
            )}
            {view === 'history' && (
              <HistoryView
                transaksi={displayTransaksi}
                unit={user.Unit}
                onEditOrder={handleEditOrder}
                onViewDetail={setDetailOrder}
                isRequestEnabled={isRequestEnabled}
                isAdmin={user.Role.toLowerCase() === 'admin'}
              />
            )}
            {view === 'admin_approval' && (
              <AdminApprovalView transaksi={displayTransaksi} onProcess={setDetailOrder} />
            )}
            {view === 'admin_terima_barang' && (
              <AdminTerimaBarangView
                transaksi={displayTransaksi}
                onUpdateTerima={handleUpdateTerima}
                loading={syncing}
              />
            )}
            {view === 'admin_master_barang' && (
              <AdminMasterBarangView barang={displayBarang} onSave={handleSaveMaster} loading={syncing} />
            )}
            {view === 'admin_po' && <AdminPOView transaksi={displayTransaksi} barang={displayBarang} />}
            {view === 'admin_report' && (
              <AdminReportView 
                transaksi={displayTransaksi} 
                users={userList} 
                barang={displayBarang} 
                initialTab="unit"
              />
            )}
            {view === 'admin_capaian' && (
              <AdminBudgetAchievementView 
                transaksi={displayTransaksi} 
                anggaran={anggaran}
              />
            )}
            {view === 'admin_efficiency' && <AdminEfficiencyReportView transaksi={displayTransaksi} users={userList} />}
            {view === 'admin_po_adjustment' && (
              <AdminPOAdjustmentView
                transaksi={displayTransaksi}
                onFinalizePO={handleFinalizePO}
                loading={syncing}
                pendingSyncCount={pendingSync.length}
                onSync={handleSyncAll}
              />
            )}
            {view === 'admin_all_history' && (
              <AdminMonitoringView
                transaksi={displayTransaksi}
                onEditOrder={handleEditOrder}
                onViewDetail={setDetailOrder}
              />
            )}
            {view === 'admin_settings' && (
              <AdminSettingsView 
                isRequestEnabled={isRequestEnabled} 
                onToggleRequest={handleToggleRequest} 
              />
            )}
          </motion.div>
      </main>

      <DetailModal
        isOpen={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        group={detailOrder}
        isAdmin={user.Role.toLowerCase() === 'admin'}
        onApprove={(id, selectedIds) => handleApproval(id, 'APPROVED', selectedIds)}
        onReject={(id) => handleApproval(id, 'TOLAK')}
        loading={syncing}
        allTransaksi={displayTransaksi}
      />

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden text-center p-8 space-y-6"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                <LogOut className="text-red-600" size={32} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none italic">
                  Konfirmasi Keluar
                </h2>
                <p className="text-sm font-medium text-slate-500">
                  Apakah Anda yakin ingin keluar dari aplikasi?
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-4 rounded-2xl text-[10px] tracking-[0.2em] uppercase transition-all"
                >
                  BATAL
                </button>
                <button
                  onClick={confirmLogout}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl shadow-lg text-[10px] tracking-[0.2em] uppercase transition-all"
                >
                  YA, KELUAR
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="fixed bottom-5 right-5 z-[200] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex flex-col border-l-4 border-red-500"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1 flex items-center gap-2">
              <AlertCircle size={12} /> System Alert
            </p>
            <p className="text-xs font-medium leading-tight">{error}</p>
            <button onClick={() => setError(null)} className="absolute top-2 right-2 text-slate-500 hover:text-white">
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="py-8 text-center text-[10px] font-bold text-blue-600 italic no-print">
        E-LOG RSDI - Logistics System - IT RSDI Kendal - Hak Cipta Milik Allah Semata
      </footer>
    </div>
  );
}
