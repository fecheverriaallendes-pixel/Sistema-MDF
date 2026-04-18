import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Sale, StockItem, SaleStatus, SaleType, StaffMember, StaffRole, Purchase, PurchaseType, Abono, DispatchType, DispatchStatus, CommissionAdjustment } from '../types';
import { db, auth } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch, getDocs } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

const INITIAL_MASTER_STOCK: Omit<StockItem, 'id' | 'disponible'>[] = [
  { codigo: 'GF-001', tipo: 'Fardo Premium Invierno', categoria: 'INVIERNO', presentacion: '25kg', calidad: '1ra', etiqueta: 'DESTACADO', detalle: '', precioCosto: 50000, precioSugerido: 120000, stockActual: 10, unidad: 'FARDO' },
  { codigo: 'GF-002', tipo: 'Fardo Standard Verano', categoria: 'VERANO', presentacion: '25kg', calidad: '1ra', etiqueta: '', detalle: '', precioCosto: 30000, precioSugerido: 80000, stockActual: 15, unidad: 'FARDO' },
  { codigo: 'GF-003', tipo: 'Fardo Oferta Mixto', categoria: 'BÁSICOS', presentacion: '25kg', calidad: '1ra', etiqueta: '', detalle: '', precioCosto: 20000, precioSugerido: 50000, stockActual: 5, unidad: 'FARDO' },
];

interface StoreContextType {
  currentUser: { nombre: string; rol: StaffRole } | null;
  settings: { soundEnabled: boolean; cloudUrl: string; lastSync: string | null; dbConnected: boolean; lastError: string | null; dolarBlueRate: number; fardoNormalCommission: number; fardoPromoCommission: number; };
  updateSettings: (newSettings: any) => void;
  playSound: (type: 'click' | 'success' | 'transition') => void;
  login: (nombre: string, rol: StaffRole) => void;
  logout: () => void;
  sales: Sale[];
  stock: StockItem[];
  staff: StaffMember[];
  purchases: Purchase[];
  carriers: string[];
  categories: string[];
  adjustments: CommissionAdjustment[];
  addSale: (saleData: Partial<Sale>) => Sale;
  updateSale: (id: string, updatedData: Partial<Sale>) => void;
  markAsSent: (saleId: string) => void;
  updateDispatchStatus: (saleId: string, status: DispatchStatus) => void;
  updateDispatchItems: (saleId: string, quantity: number) => void;
  assignCarrier: (saleId: string, carrier: string) => void;
  addCarrier: (name: string) => void;
  removeCarrier: (name: string) => void;
  addCategory: (name: string) => void;
  editCategory: (oldName: string, newName: string) => void;
  removeCategory: (name: string) => void;
  addAdjustment: (adj: Omit<CommissionAdjustment, 'id'>) => void;
  removeAdjustment: (id: string) => void;
  clearAllSales: () => void;
  addStockItem: (item: Omit<StockItem, 'id' | 'disponible'>) => void;
  updateStockItem: (id: string, updatedData: Partial<StockItem>) => void;
  removeStockItem: (id: string) => void;
  bulkAddStock: (items: Omit<StockItem, 'id' | 'disponible'>[]) => void;
  resetToMasterStock: () => void;
  addStaff: (member: Omit<StaffMember, 'id' | 'activo'>) => void;
  removeStaff: (id: string) => void;
  addPurchase: (p: Omit<Purchase, 'id' | 'saldoPendiente' | 'abonos' | 'estado'>) => void;
  removePurchase: (id: string) => void;
  addAbono: (purchaseId: string, monto: number, metodo: string, observacion: string) => void;
  removeAbono: (purchaseId: string, abonoId: string) => void;
  getStats: () => any;
  syncWithCloud: (silent?: boolean) => Promise<boolean>;
  pushToCloud: (curSales: Sale[], curStock: StockItem[], curStaff: StaffMember[], curPurchases: Purchase[]) => Promise<void>;
  isSyncing: boolean;
  lastSync: string | null;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('fa_settings');
    return saved ? JSON.parse(saved) : { soundEnabled: true, cloudUrl: '', lastSync: null, dbConnected: false, lastError: null, dolarBlueRate: 1000, fardoNormalCommission: 3000, fardoPromoCommission: 1500 };
  });

  const [sales, setSales] = useState<Sale[]>(() => JSON.parse(localStorage.getItem('fa_sales') || '[]'));
  
  const [stock, setStock] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem('fa_stock');
    if (saved && JSON.parse(saved).length > 0) return JSON.parse(saved);
    
    return INITIAL_MASTER_STOCK.map(item => ({
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      disponible: item.stockActual > 0
    }));
  });

  const [staff, setStaff] = useState<StaffMember[]>(() => JSON.parse(localStorage.getItem('fa_staff') || '[]'));
  const [purchases, setPurchases] = useState<Purchase[]>(() => JSON.parse(localStorage.getItem('fa_purchases') || '[]'));
  
  const [carriers, setCarriers] = useState<string[]>(() => {
    const saved = localStorage.getItem('fa_carriers');
    return saved ? JSON.parse(saved) : [
      'Isaias Peralta',
      'Anthony Mendez',
      'Ariel Echeverria',
      'Gonzalo Duarte',
      'Transportes Tamarindo',
      'Transportes Runn'
    ];
  });
  
  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('fa_categories');
    return saved ? JSON.parse(saved) : ['DEPORTIVO', 'BÁSICOS', 'INTERIOR', 'VERANO', 'ESCOLAR', 'LABORAL', 'INVIERNO', 'PROMOS'];
  });
  
  const [adjustments, setAdjustments] = useState<CommissionAdjustment[]>(() => JSON.parse(localStorage.getItem('fa_adjustments') || '[]'));

  const calculatePurchaseState = (purchase: Purchase) => {
    const totalAbonado = purchase.abonos.reduce((acc, a) => acc + a.monto, 0);
    const saldoPendiente = Math.max(0, purchase.montoTotal - totalAbonado);
    return {
      ...purchase,
      saldoPendiente,
      estado: saldoPendiente <= 0 ? 'PAGADO' : 'PENDIENTE' as 'PAGADO' | 'PENDIENTE'
    };
  };

  const updateSettings = (newSettings: any) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('fa_settings', JSON.stringify(updated));
  };

  const playSound = useCallback((type: 'click' | 'success' | 'transition') => {
    if (!settings.soundEnabled) return;
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      const now = ctx.currentTime;
      if (type === 'click') {
        osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.1, now); osc.start(now); osc.stop(now + 0.1);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, now); osc.frequency.setValueAtTime(659.25, now + 0.1);
        gain.gain.setValueAtTime(0.1, now); osc.start(now); osc.stop(now + 0.3);
      } else if (type === 'transition') {
        osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
        gain.gain.setValueAtTime(0.05, now); osc.start(now); osc.stop(now + 0.15);
      }
    } catch (e) {}
  }, [settings.soundEnabled]);

  const pushToCloud = async (curSales: Sale[], curStock: StockItem[], curStaff: StaffMember[], curPurchases: Purchase[], curCarriers?: string[], curCategories?: string[], curAdjustments?: CommissionAdjustment[]) => {
    setIsSyncing(true);
    try {
      const batch = writeBatch(db);
      
      curSales.forEach(s => batch.set(doc(db, 'sales', s.id), s));
      curStock.forEach(s => batch.set(doc(db, 'stock', s.id), s));
      curStaff.forEach(s => batch.set(doc(db, 'staff', s.id), s));
      curPurchases.forEach(p => batch.set(doc(db, 'purchases', p.id), p));
      (curAdjustments || adjustments).forEach(a => batch.set(doc(db, 'adjustments', a.id), a));
      
      batch.set(doc(db, 'config', 'carriers'), { list: curCarriers || carriers });
      batch.set(doc(db, 'config', 'categories'), { list: curCategories || categories });
      
      await batch.commit();
      
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      updateSettings({ dbConnected: true, lastError: null, lastSync: timeString });
    } catch (error: any) {
      updateSettings({ dbConnected: false, lastError: error.message });
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const syncWithCloud = async (silent = false) => {
    return true;
  };

  useEffect(() => {
    let unsubSales: any;
    let unsubStock: any;
    let unsubStaff: any;
    let unsubPurchases: any;
    let unsubAdjustments: any;
    let unsubConfig: any;
    let unsubCategories: any;

    const initFirebase = async () => {
      try {
        await new Promise<void>((resolve) => {
          const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            if (!user) {
              signInAnonymously(auth).then(() => resolve()).catch(() => resolve());
            } else {
              resolve();
            }
          });
        });

        if (auth.currentUser) {
            unsubSales = onSnapshot(collection(db, 'sales'), (snap) => setSales(snap.docs.map(d => d.data() as Sale)));
            unsubStock = onSnapshot(collection(db, 'stock'), (snap) => setStock(snap.docs.map(d => d.data() as StockItem)));
            unsubStaff = onSnapshot(collection(db, 'staff'), (snap) => setStaff(snap.docs.map(d => d.data() as StaffMember)));
            unsubPurchases = onSnapshot(collection(db, 'purchases'), (snap) => setPurchases(snap.docs.map(d => d.data() as Purchase)));
            unsubAdjustments = onSnapshot(collection(db, 'adjustments'), (snap) => setAdjustments(snap.docs.map(d => d.data() as CommissionAdjustment)));
            unsubConfig = onSnapshot(doc(db, 'config', 'carriers'), (docSnap) => { if (docSnap.exists() && docSnap.data().list) setCarriers(docSnap.data().list); });
            unsubCategories = onSnapshot(doc(db, 'config', 'categories'), (docSnap) => { if (docSnap.exists() && docSnap.data().list) setCategories(docSnap.data().list); });
        }
      } catch (error) { console.error(error); }
    };
    initFirebase();
    
    return () => {
        if (unsubSales) unsubSales();
        if (unsubStock) unsubStock();
        if (unsubStaff) unsubStaff();
        if (unsubPurchases) unsubPurchases();
        if (unsubAdjustments) unsubAdjustments();
        if (unsubConfig) unsubConfig();
        if (unsubCategories) unsubCategories();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('fa_sales', JSON.stringify(sales));
    localStorage.setItem('fa_stock', JSON.stringify(stock));
    localStorage.setItem('fa_staff', JSON.stringify(staff));
    localStorage.setItem('fa_purchases', JSON.stringify(purchases));
    localStorage.setItem('fa_carriers', JSON.stringify(carriers));
    localStorage.setItem('fa_categories', JSON.stringify(categories));
    localStorage.setItem('fa_adjustments', JSON.stringify(adjustments));
    localStorage.setItem('fa_settings', JSON.stringify(settings));
  }, [sales, stock, staff, purchases, carriers, categories, adjustments, settings]);

  const [currentUser, setCurrentUser] = useState<{ nombre: string; rol: StaffRole } | null>(() => {
    const saved = sessionStorage.getItem('fa_session');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (nombre: string, rol: StaffRole) => {
    const user = { nombre, rol };
    setCurrentUser(user);
    sessionStorage.setItem('fa_session', JSON.stringify(user));
    playSound('success');
    syncWithCloud();
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('fa_session');
    playSound('click');
  };

  const addSale = (saleData: Partial<Sale>) => {
    const now = new Date();
    const newSale: Sale = {
      ...saleData,
      id: Math.random().toString(36).substr(2, 9),
      numeroVenta: sales.length > 0 ? Math.max(...sales.map(s => s.numeroVenta || 0)) + 1 : 2000,
      fecha: now.toLocaleDateString(),
      hora: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: SaleStatus.PENDIENTE,
      enviado: false,
      datosCompletos: saleData.tipoVenta === SaleType.NORMAL,
      estadoDespacho: DispatchStatus.PREPARACION,
      itemsDespachados: 0,
      tipoDespacho: saleData.tipoDespacho || ''
    } as Sale;
    
    const cleanSale = Object.fromEntries(Object.entries(newSale).filter(([_, v]) => v !== undefined));
    
    setDoc(doc(db, 'sales', newSale.id), cleanSale);

    const stockItem = stock.find(item => item.codigo === saleData.codigoFardo);
    if (stockItem) {
      const nuevoStockVal = Math.max(0, stockItem.stockActual - (saleData.cantidad || 1));
      setDoc(doc(db, 'stock', stockItem.id), { ...stockItem, stockActual: nuevoStockVal, disponible: nuevoStockVal > 0 });
    }

    return newSale;
  };

  const updateSale = (id: string, updatedData: Partial<Sale>) => {
    const sale = sales.find(s => s.id === id);
    if (sale) setDoc(doc(db, 'sales', id), { ...sale, ...updatedData });
  };

  const markAsSent = (saleId: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (sale) {
      setDoc(doc(db, 'sales', saleId), { ...sale, status: SaleStatus.ENVIADO, enviado: true, fechaDespacho: new Date().toISOString(), estadoDespacho: DispatchStatus.EN_RUTA });
      playSound('success');
    }
  };

  const updateDispatchStatus = (saleId: string, status: DispatchStatus) => {
    const sale = sales.find(s => s.id === saleId);
    if (sale) setDoc(doc(db, 'sales', saleId), { ...sale, estadoDespacho: status });
  };

  const updateDispatchItems = (saleId: string, quantity: number) => {
    const sale = sales.find(s => s.id === saleId);
    if (sale) setDoc(doc(db, 'sales', saleId), { ...sale, itemsDespachados: quantity });
  };

  const assignCarrier = (saleId: string, carrier: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (sale) setDoc(doc(db, 'sales', saleId), { ...sale, transportista: carrier });
  };

  const addCarrier = (name: string) => {
    if (!carriers.includes(name)) {
      const newCarriers = [...carriers, name];
      setDoc(doc(db, 'config', 'carriers'), { list: newCarriers });
    }
  };

  const removeCarrier = (name: string) => {
    const newCarriers = carriers.filter(c => c !== name);
    setDoc(doc(db, 'config', 'carriers'), { list: newCarriers });
  };

  const addCategory = (name: string) => {
    if (!categories.includes(name)) {
      const newCats = [...categories, name];
      setDoc(doc(db, 'config', 'categories'), { list: newCats });
    }
  };

  const editCategory = (oldName: string, newName: string) => {
     const newCats = categories.map(c => c === oldName ? newName : c);
     setDoc(doc(db, 'config', 'categories'), { list: newCats });
  };

  const removeCategory = (name: string) => {
    const newCats = categories.filter(c => c !== name);
    setDoc(doc(db, 'config', 'categories'), { list: newCats });
  };

  const addAdjustment = (adj: Omit<CommissionAdjustment, 'id'>) => {
    const newAdj = { ...adj, id: Math.random().toString(36).substr(2, 9) };
    setDoc(doc(db, 'adjustments', newAdj.id), newAdj);
  };

  const removeAdjustment = (id: string) => {
    deleteDoc(doc(db, 'adjustments', id));
  };

  const clearAllSales = () => {
    sales.forEach(s => deleteDoc(doc(db, 'sales', s.id)));
  };

  const addStockItem = (item: Omit<StockItem, 'id' | 'disponible'>) => {
    const newId = Math.random().toString(36).substr(2, 9);
    setDoc(doc(db, 'stock', newId), { ...item, id: newId, disponible: item.stockActual > 0 });
  };

  const updateStockItem = (id: string, updatedData: Partial<StockItem>) => {
    const item = stock.find(i => i.id === id);
    if (item) setDoc(doc(db, 'stock', id), { ...item, ...updatedData, disponible: (updatedData.stockActual ?? item.stockActual) > 0 });
  };

  const removeStockItem = (id: string) => {
    deleteDoc(doc(db, 'stock', id));
  };

  const bulkAddStock = (items: Omit<StockItem, 'id' | 'disponible'>[]) => {
    const batch = writeBatch(db);
    items.forEach(i => {
      const newId = Math.random().toString(36).substr(2, 9);
      batch.set(doc(db, 'stock', newId), { ...i, id: newId, disponible: i.stockActual > 0 });
    });
    batch.commit();
  };

  const resetToMasterStock = () => {
    const batch = writeBatch(db);
    INITIAL_MASTER_STOCK.forEach(item => {
      const newId = Math.random().toString(36).substr(2, 9);
      batch.set(doc(db, 'stock', newId), { ...item, id: newId, disponible: item.stockActual > 0 });
    });
    batch.commit();
  };

  const addStaff = (member: Omit<StaffMember, 'id' | 'activo'>) => {
    const newId = Math.random().toString(36).substr(2, 9);
    setDoc(doc(db, 'staff', newId), { ...member, id: newId, activo: true });
  };

  const removeStaff = (id: string) => {
    deleteDoc(doc(db, 'staff', id));
  };

  const addPurchase = (p: Omit<Purchase, 'id' | 'saldoPendiente' | 'abonos' | 'estado'>) => {
    const newId = Math.random().toString(36).substr(2, 9);
    setDoc(doc(db, 'purchases', newId), {
      ...p,
      id: newId,
      saldoPendiente: p.montoTotal,
      abonos: [],
      estado: 'PENDIENTE'
    });
  };

  const removePurchase = (id: string) => {
    deleteDoc(doc(db, 'purchases', id));
  };

  const addAbono = (purchaseId: string, monto: number, metodo: string, observacion: string) => {
    const p = purchases.find(p => p.id === purchaseId);
    if (p) {
      const newAbono: Abono = {
        id: Math.random().toString(36).substr(2, 9),
        fecha: new Date().toLocaleDateString(),
        monto, metodo, observacion
      };
      const tempPurchase = { ...p, abonos: [...p.abonos, newAbono] };
      setDoc(doc(db, 'purchases', purchaseId), calculatePurchaseState(tempPurchase));
    }
  };

  const removeAbono = (purchaseId: string, abonoId: string) => {
    const p = purchases.find(p => p.id === purchaseId);
    if (p) {
      const filteredAbonos = p.abonos.filter(a => a.id !== abonoId);
      const tempPurchase = { ...p, abonos: filteredAbonos };
      setDoc(doc(db, 'purchases', purchaseId), calculatePurchaseState(tempPurchase));
    }
  };

  const getStats = () => {
    const today = new Date().toLocaleDateString();
    const todaySales = sales.filter(s => s.fecha === today);
    let totalCosto = 0;
    sales.forEach(sale => {
      const product = stock.find(p => p.codigo === sale.codigoFardo);
      if (product) totalCosto += (product.precioCosto * sale.cantidad);
    });
    const totalIngresos = sales.reduce((acc, s) => acc + (s.total || 0), 0);
    const sellerStats: Record<string, number> = {};
    sales.forEach(s => { if (s.vendedor) sellerStats[s.vendedor] = (sellerStats[s.vendedor] || 0) + s.total; });
    const topSellers = Object.entries(sellerStats).sort((a, b) => b[1] - a[1]).slice(0, 3);

    return {
      ventasHoy: todaySales.reduce((acc, s) => acc + (s.total || 0), 0),
      countHoy: todaySales.length,
      totalVendido: totalIngresos,
      utilidadTotal: totalIngresos - totalCosto,
      disponibles: stock.reduce((acc, i) => acc + i.stockActual, 0),
      pendientesDatos: sales.filter(s => !s.datosCompletos).length,
      topSellers,
      stockCritico: stock.filter(i => i.stockActual < 3 && i.stockActual > 0).length,
      valorInventarioVenta: stock.reduce((acc, i) => acc + (i.precioSugerido * i.stockActual), 0),
      deudaTotalProveedores: purchases.reduce((acc, p) => acc + p.saldoPendiente, 0)
    };
  };

  return (
    <StoreContext.Provider value={{
      currentUser, login, logout, settings, updateSettings, playSound,
      sales, stock, staff, purchases, carriers, categories, adjustments, addSale, updateSale, markAsSent, updateDispatchStatus, updateDispatchItems, assignCarrier, addCarrier, removeCarrier, addCategory, editCategory, removeCategory, addAdjustment, removeAdjustment, clearAllSales,
      addStockItem, updateStockItem, removeStockItem, bulkAddStock, resetToMasterStock, addStaff, removeStaff, 
      addPurchase, removePurchase, addAbono, removeAbono, getStats, syncWithCloud, pushToCloud, isSyncing, lastSync: settings.lastSync
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error();
  return context;
};
