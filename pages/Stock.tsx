
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { PackagePlus, Search, Package, FileUp, X, Download, Tag, Boxes, Edit3, Trash2, Save, AlertTriangle, Layers, Square, Filter, History, Calendar, User, ArrowUpRight, ArrowDownLeft, TrendingUp, Sparkles, ChevronRight, Truck, FileText, Ruler, Scale, Compass, ShieldCheck, Wand2, PackageCheck, CheckCircle2, RotateCcw, Check } from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { StaffRole, StockItem } from '../types';
import { smartSearchMatch } from '../utils/search';
import { ValeEntradaModal } from '../components/stock/ValeEntradaModal';
import { HistorialValesTab } from '../components/stock/HistorialValesTab';
import { ProductFichaModal } from '../components/ProductFichaModal';
import { 
  inferCharacteristicsFromTitle, 
  TEMPORADAS_OPTIONS, 
  GENEROS_SEGMENTOS_OPTIONS,
  ESTILOS_OPTIONS, 
  CALIDADES_OPTIONS, 
  TALLAS_COMUNES, 
  PESOS_COMUNES,
  getSeasonBadgeStyle,
  parseTemporadas,
  toggleTemporada,
  formatSeasonDisplay,
  matchesSeason
} from '../utils/productCharacteristics';

function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  const slashParts = dateStr.split('/');
  if (slashParts.length === 3) {
    if (slashParts[0].length === 4) {
      return new Date(parseInt(slashParts[0], 10), parseInt(slashParts[1], 10) - 1, parseInt(slashParts[2], 10));
    } else {
      return new Date(parseInt(slashParts[2], 10), parseInt(slashParts[1], 10) - 1, parseInt(slashParts[0], 10));
    }
  }
  return new Date(dateStr);
}

export default function Stock() {
  const { stock, addStockItem, updateStockItem, togglePromocion, removeStockItem, bulkAddStock, currentUser, playSound, stockHistory, sales, valesEntrada } = useStore();
  const location = useLocation();
  const [activeMainView, setActiveMainView] = useState<'INVENTARIO' | 'VALES'>('INVENTARIO');
  const [isAddingVale, setIsAddingVale] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState('TODOS');
  const [categoryFilter, setCategoryFilter] = useState<'TODOS' | 'FARDO' | 'LOTE' | 'NEGATIVO'>('TODOS');
  const [temporadaFilter, setTemporadaFilter] = useState<string>('TODOS');
  const [stockQtyFilter, setStockQtyFilter] = useState<'TODOS' | 'CON_STOCK' | 'SIN_STOCK' | 'BAJO' | 'NEGATIVO'>('TODOS');
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [selectedFichaItem, setSelectedFichaItem] = useState<StockItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<StockItem | null>(null);
  const [historyTab, setHistoryTab] = useState<'TODOS' | 'INGRESOS' | 'SALIDAS'>('TODOS');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    if (action === 'add') {
      setIsAdding(true);
    } else if (action === 'vale') {
      setIsAddingVale(true);
    }
    const tab = params.get('tab');
    if (tab === 'vales') {
      setActiveMainView('VALES');
    }
  }, [location]);
  
  const [newBale, setNewBale] = useState<Partial<StockItem>>({ 
    codigo: '', 
    tipo: '', 
    proveedor: '', 
    precioCosto: 0, 
    precioSugerido: 0, 
    stockActual: 1,
    unidad: 'FARDO',
    categoria: 'FARDO',
    peso: 0,
    descripcion: '',
    temporada: '',
    tallas: '',
    pesoKg: '',
    generoSegmento: '',
    estilo: '',
    calidad: '',
    piezasAprox: '',
    detallesPrendas: '',
    consejoVenta: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canModify = currentUser?.rol === StaffRole.ADMIN || currentUser?.rol === StaffRole.BODEGA;

  // --- HISTORIAL MOVIMIENTOS DYNAMIC TIMELINE ---
  const itemTimeline = useMemo(() => {
    if (!selectedHistoryItem) return [];
    const code = selectedHistoryItem.codigo.trim().toUpperCase();

    // 1. Manual/system transactions in stock_history
    const manualEvents = (stockHistory || [])
      .filter(h => h.productId?.trim().toUpperCase() === code)
      .map(h => ({
        id: h.id,
        tipo: h.tipo,
        cantidad: h.cantidad,
        fecha: h.fecha,
        vendedor: h.vendedor || 'SISTEMA',
        observaciones: h.observaciones || 'Movimiento de inventario'
      }));

    // 2. Sales events
    const salesEvents = (sales || []).flatMap(sale => {
      if (sale.tipoVenta === 'NOTA_VENTA') {
        return (sale.items || [])
          .filter(it => !it.esManual && it.codigoFardo?.trim().toUpperCase() === code)
          .map(it => ({
            id: `${sale.id}-${it.codigoFardo}`,
            tipo: 'VENTA' as const,
            cantidad: -it.cantidad,
            fecha: sale.timestamp || parseLocalDate(sale.fecha).toISOString(),
            vendedor: sale.vendedor || 'VENDEDOR',
            observaciones: `Nota de Venta #${sale.numeroVenta} - Cliente: ${sale.cliente || 'Otros'}`
          }));
      } else if (sale.codigoFardo?.trim().toUpperCase() === code && !sale.esManual) {
        return [{
          id: sale.id,
          tipo: 'VENTA' as const,
          cantidad: -(sale.cantidad || 0),
          fecha: sale.timestamp || parseLocalDate(sale.fecha).toISOString(),
          vendedor: sale.vendedor || 'VENDEDOR',
          observaciones: `Venta #${sale.numeroVenta} - Cliente: ${sale.cliente || 'Consumidor'} (${sale.tipoVenta})`
        }];
      }
      return [];
    });

    // 3. Merge and sort
    return [...manualEvents, ...salesEvents].sort((a, b) => {
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
  }, [selectedHistoryItem, stockHistory, sales]);

  const filteredTimeline = useMemo(() => {
    if (historyTab === 'INGRESOS') {
      return itemTimeline.filter(e => e.tipo !== 'VENTA');
    }
    if (historyTab === 'SALIDAS') {
      return itemTimeline.filter(e => e.tipo === 'VENTA');
    }
    return itemTimeline;
  }, [itemTimeline, historyTab]);

  const historyStats = useMemo(() => {
    let inputs = 0;
    let outputs = 0;

    itemTimeline.forEach(e => {
      if (e.tipo === 'VENTA') {
        outputs += Math.abs(e.cantidad);
      } else {
        if (e.cantidad > 0) {
          inputs += e.cantidad;
        } else {
          outputs += Math.abs(e.cantidad);
        }
      }
    });

    return { inputs, outputs };
  }, [itemTimeline]);

  // Obtener lista única de proveedores para el filtro
  const uniqueProviders = useMemo(() => {
    const providers = stock.map(item => (item.proveedor || '').trim().toUpperCase()).filter(Boolean);
    return ['TODOS', ...Array.from(new Set(providers))].sort();
  }, [stock]);

  // Contadores de stock para los filtros
  const stockCounts = useMemo(() => {
    let conStock = 0;
    let sinStock = 0;
    let bajoStock = 0;
    let negativos = 0;

    stock.forEach(item => {
      const qty = item.stockActual ?? 0;
      if (qty > 0) {
        conStock++;
        if (qty <= 3) bajoStock++;
      } else if (qty === 0) {
        sinStock++;
      } else {
        negativos++;
      }
    });

    return { conStock, sinStock, bajoStock, negativos };
  }, [stock]);

  const filteredStock = useMemo(() => {
    return stock.filter(item => {
      const matchesSearch = smartSearchMatch(item, searchTerm);
      const matchesProvider = providerFilter === 'TODOS' || (item.proveedor || '').toUpperCase() === providerFilter;
      const itemCategory = item.categoria || 'FARDO';
      const matchesCategory = categoryFilter === 'TODOS' 
        ? true 
        : categoryFilter === 'NEGATIVO' 
          ? item.stockActual < 0 
          : itemCategory === categoryFilter;
      
      const matchesTemporada = temporadaFilter === 'TODOS' || matchesSeason(item.temporada, temporadaFilter);

      const qty = item.stockActual ?? 0;
      const matchesStockQty = stockQtyFilter === 'TODOS'
        ? true
        : stockQtyFilter === 'CON_STOCK'
          ? qty > 0
          : stockQtyFilter === 'SIN_STOCK'
            ? qty === 0
            : stockQtyFilter === 'BAJO'
              ? qty > 0 && qty <= 3
              : qty < 0;

      return matchesSearch && matchesProvider && matchesCategory && matchesTemporada && matchesStockQty;
    });
  }, [stock, searchTerm, providerFilter, categoryFilter, temporadaFilter, stockQtyFilter]);

  const juntaCompraStats = useMemo(() => {
    const isJunta = (s: any) => Boolean(s.juntaCompra && s.juntaCompra.trim().toUpperCase().includes('JUNTA'));
    const pendingJuntaSales = (sales || []).filter(s => s.status === 'PENDIENTE' && isJunta(s));
    const totalProducts = pendingJuntaSales.reduce((acc, s) => {
      if (s.items && s.items.length > 0) {
        return acc + s.items.reduce((sum: number, it: any) => sum + (Number(it.cantidad) || 0), 0);
      }
      return acc + (Number(s.cantidad) || 1);
    }, 0);
    return {
      ventas: pendingJuntaSales.length,
      productos: totalProducts,
      clientes: new Set(pendingJuntaSales.map(s => s.cliente)).size
    };
  }, [sales]);

  const downloadFormat = () => {
    const csvContent = "codigo,tipo,proveedor,precioCosto,precioSugerido,stockActual,unidad\nF-101,Polerones Premium,Bale Center,100000,150000,10,FARDO\nU-102,Jeans Unitario,USA Direct,8000,15000,50,PIEZA";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formato_carga_mdf_pro.csv';
    a.click();
    playSound('success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const items: any[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const [codigo, tipo, proveedor, costo, precio, stockCant, unidad] = line.split(',');
        if (codigo && tipo && !isNaN(Number(precio))) {
          items.push({
            codigo: codigo.trim().toUpperCase(),
            tipo: tipo.trim(),
            proveedor: proveedor?.trim().toUpperCase() || 'GENERAL',
            precioCosto: Number(costo) || 0,
            precioSugerido: Number(precio),
            stockActual: Number(stockCant) || 1,
            unidad: (unidad?.trim().toUpperCase() === 'PIEZA' ? 'PIEZA' : 'FARDO')
          });
        }
      }
      if (items.length > 0) bulkAddStock(items);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canModify) return;
    
    let finalCodigo = newBale.codigo;
    if (!finalCodigo) {
        const existingCodes = stock.map(s => s.codigo).filter(c => c.startsWith('MDF-'));
        let nextNum = 1;
        if(existingCodes.length > 0) {
            const numbers = existingCodes.map(c => parseInt(c.split('-')[1]) || 0);
            nextNum = Math.max(...numbers) + 1;
        }
        finalCodigo = `MDF-${String(nextNum).padStart(3, '0')}`;
    }

    const codeExists = stock.some(s => s.codigo.toUpperCase() === finalCodigo.toUpperCase());
    if (codeExists) {
        alert(`ERROR: El código ${finalCodigo} ya está en uso. Por favor ingresa uno diferente.`);
        return;
    }

    addStockItem({ 
      ...newBale, 
      codigo: finalCodigo, 
      tipo: newBale.tipo || '',
      proveedor: (newBale.proveedor || '').toUpperCase(),
      precioCosto: Number(newBale.precioCosto) || 0,
      precioSugerido: Number(newBale.precioSugerido) || 0,
      stockActual: Number(newBale.stockActual) || 1,
      unidad: newBale.unidad || 'FARDO',
      categoria: newBale.categoria || 'FARDO'
    } as any);
    setNewBale({ 
      codigo: '', 
      tipo: '', 
      proveedor: '', 
      precioCosto: 0, 
      precioSugerido: 0, 
      stockActual: 1, 
      unidad: 'FARDO',
      categoria: 'FARDO',
      peso: 0,
      descripcion: '',
      temporada: '',
      tallas: '',
      pesoKg: '',
      generoSegmento: '',
      estilo: '',
      calidad: '',
      piezasAprox: '',
      detallesPrendas: '',
      consejoVenta: ''
    });
    setIsAdding(false);
    playSound('success');
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !canModify) return;
    
    const conflict = stock.find(s => s.id !== editingItem.id && (s.codigo || '').toUpperCase() === (editingItem.codigo || '').toUpperCase());
    if (conflict) {
      alert(`ERROR: No puedes usar el código ${editingItem.codigo} porque ya pertenece a otro producto (${conflict.tipo}).`);
      return;
    }

    updateStockItem(editingItem.id, { ...editingItem, proveedor: (editingItem.proveedor || '').toUpperCase() });
    setEditingItem(null);
    playSound('success');
  };

  const handleDelete = () => {
    if (!deletingId || !canModify) return;
    removeStockItem(deletingId);
    setDeletingId(null);
    playSound('click');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-20">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tight uppercase">Inventario Central</h2>
          <p className="text-slate-500 font-medium italic mt-2">Control maestro de Fardos, Piezas Unitarias y Cargamentos</p>
        </div>
        {canModify && (
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => { setIsAddingVale(true); playSound('transition'); }}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-[24px] font-black text-xs uppercase tracking-wider transition-all shadow-xl shadow-emerald-600/25 active:scale-95 border-2 border-emerald-400/30"
            >
              <Truck size={20} /> Vale de Entrada (Contenedor)
            </button>
            <button 
              onClick={downloadFormat}
              className="flex items-center gap-2 px-6 py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-[24px] font-black text-xs uppercase hover:bg-slate-50 transition-all shadow-sm"
            >
              <Download size={16} /> CSV Pro
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-6 py-4 bg-slate-800 text-white rounded-[24px] font-black text-xs uppercase hover:bg-slate-900 transition-all shadow-lg"
            >
              <FileUp size={16} /> Carga Masiva
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".csv" />
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase shadow-2xl hover:bg-black transition-all active:scale-95"
            >
              <PackagePlus size={18} /> Entrada Simple
            </button>
          </div>
        )}
      </div>

      {/* Selector de Vista Principal: Catálogo Central vs Historial de Vales de Entrada */}
      <div className="flex bg-slate-100 p-2 rounded-[32px] w-fit shadow-sm border border-slate-200/50">
        <button
          type="button"
          onClick={() => { setActiveMainView('INVENTARIO'); playSound('click'); }}
          className={`flex items-center gap-2.5 px-8 py-3.5 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all ${
            activeMainView === 'INVENTARIO' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Package size={16} /> Catálogo e Inventario ({stock.length})
        </button>
        <button
          type="button"
          onClick={() => { setActiveMainView('VALES'); playSound('click'); }}
          className={`flex items-center gap-2.5 px-8 py-3.5 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all ${
            activeMainView === 'VALES' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Truck size={16} /> Vales de Entrada y Contenedores ({valesEntrada?.length || 0})
        </button>
      </div>

      {activeMainView === 'VALES' ? (
        <HistorialValesTab onOpenNewVale={() => setIsAddingVale(true)} />
      ) : (
        <>
          {/* Junta Compra Bodega Status */}
          {juntaCompraStats.ventas > 0 && (
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-5 md:p-6 rounded-[32px] shadow-lg border border-indigo-700/50 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 text-indigo-300 shrink-0">
                  <Boxes size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded-full text-[10px] font-black uppercase tracking-wider">
                      Custodia en Bodega
                    </span>
                    <span className="text-xs font-bold text-indigo-300">📦 Junta Compra Activa</span>
                  </div>
                  <h4 className="text-lg font-black uppercase tracking-tight mt-0.5">
                    {juntaCompraStats.productos} productos en espera de despacho ({juntaCompraStats.ventas} ventas de {juntaCompraStats.clientes} clientes)
                  </h4>
                </div>
              </div>
              <Link
                to="/despachos?tab=JUNTA_COMPRA"
                className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-950 hover:bg-indigo-50 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md shrink-0 active:scale-95"
              >
                Ver en Despachos <ChevronRight size={16} />
              </Link>
            </div>
          )}

      <div className="space-y-4 w-full">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Categorías */}
            <div className="flex bg-slate-100 p-1.5 rounded-[28px] shadow-sm">
              {(['TODOS', 'FARDO', 'LOTE', 'NEGATIVO'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => { 
                    setCategoryFilter(cat); 
                    if (cat === 'NEGATIVO' && stockQtyFilter === 'CON_STOCK') {
                      setStockQtyFilter('TODOS');
                    }
                    playSound('transition'); 
                  }}
                  className={`px-5 md:px-7 py-3 rounded-[22px] font-black text-xs uppercase tracking-widest transition-all ${
                    categoryFilter === cat ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {cat === 'TODOS' ? 'Todos' : cat === 'FARDO' ? 'Fardos' : cat === 'LOTE' ? 'Lotes' : '⚠️ Negativos'}
                </button>
              ))}
            </div>

            {/* Filtro rápido de Cantidad / Stock */}
            <div className="flex bg-slate-100 p-1.5 rounded-[28px] shadow-sm items-center flex-wrap gap-1">
              {[
                { id: 'TODOS', label: 'Todo Stock', badge: stock.length },
                { id: 'CON_STOCK', label: 'Solo con Stock (>0)', badge: stockCounts.conStock, icon: '✅' },
                { id: 'SIN_STOCK', label: 'Agotados (0)', badge: stockCounts.sinStock, icon: '🚫' },
                { id: 'BAJO', label: 'Bajo (1-3)', badge: stockCounts.bajoStock, icon: '⚠️' },
              ].map((stk) => (
                <button
                  key={stk.id}
                  type="button"
                  onClick={() => { setStockQtyFilter(stk.id as any); playSound('click'); }}
                  className={`px-4 py-2.5 rounded-[20px] font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                    stockQtyFilter === stk.id 
                      ? 'bg-emerald-600 text-white shadow-md' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {stk.icon && <span className="text-xs">{stk.icon}</span>}
                  <span>{stk.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    stockQtyFilter === stk.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {stk.badge}
                  </span>
                </button>
              ))}
            </div>

            {categoryFilter === 'NEGATIVO' && filteredStock.length > 0 && canModify && (
              <button
                type="button"
                onClick={async () => {
                  const confirmReset = window.confirm(`⚠️ ¿Estás seguro de que deseas reajustar los ${filteredStock.length} productos con stock negativo a 0?\n\nEsta acción modificará su stock actual directamente en la base de datos.`);
                  if (confirmReset) {
                    try {
                      for (const item of filteredStock) {
                        await updateStockItem(item.id, { stockActual: 0 });
                      }
                      playSound('success');
                      alert("✅ Corrección masiva exitosa: Todos los productos con stock negativo han sido reajustados a 0.");
                    } catch (err) {
                      console.error("Error updating negative stocks:", err);
                      alert("Error al corregir algunos artículos. Revisa la consola.");
                    }
                  }
                }}
                className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-[22px] shadow-md shadow-red-600/20 flex items-center gap-2 transition-all active:scale-95 animate-pulse"
              >
                <AlertTriangle size={16} /> Corregir Negativos a 0
              </button>
            )}
          </div>

          {(searchTerm || categoryFilter !== 'TODOS' || providerFilter !== 'TODOS' || temporadaFilter !== 'TODOS' || stockQtyFilter !== 'TODOS') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('TODOS');
                setProviderFilter('TODOS');
                setTemporadaFilter('TODOS');
                setStockQtyFilter('TODOS');
                playSound('click');
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-full text-xs font-black uppercase tracking-wider transition-all"
            >
              <RotateCcw size={14} /> Limpiar Filtros ({filteredStock.length}/{stock.length})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por código o producto..."
              className="w-full pl-16 pr-6 py-5 rounded-[28px] border-2 border-slate-100 focus:border-blue-400 outline-none transition-all shadow-sm text-base font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <PackageCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              className="w-full pl-14 pr-8 py-5 rounded-[28px] border-2 border-slate-100 bg-white font-black text-xs uppercase tracking-wider outline-none focus:border-blue-400 appearance-none shadow-sm cursor-pointer"
              value={stockQtyFilter}
              onChange={(e) => { setStockQtyFilter(e.target.value as any); playSound('click'); }}
            >
              <option value="TODOS">📦 CANTIDAD: TODOS ({stock.length})</option>
              <option value="CON_STOCK">✅ SOLO CON STOCK &gt;0 ({stockCounts.conStock})</option>
              <option value="SIN_STOCK">🚫 AGOTADOS = 0 ({stockCounts.sinStock})</option>
              <option value="BAJO">⚠️ STOCK BAJO 1-3 ({stockCounts.bajoStock})</option>
              <option value="NEGATIVO">🚨 NEGATIVOS &lt;0 ({stockCounts.negativos})</option>
            </select>
          </div>
          
          <div className="relative">
            <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              className="w-full pl-14 pr-8 py-5 rounded-[28px] border-2 border-slate-100 bg-white font-black text-xs uppercase tracking-wider outline-none focus:border-blue-400 appearance-none shadow-sm cursor-pointer"
              value={temporadaFilter}
              onChange={(e) => { setTemporadaFilter(e.target.value); playSound('click'); }}
            >
              <option value="TODOS">TEMPORADA: TODAS</option>
              {TEMPORADAS_OPTIONS.map(temp => (
                <option key={temp} value={temp}>{temp.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              className="w-full pl-14 pr-8 py-5 rounded-[28px] border-2 border-slate-100 bg-white font-black text-xs uppercase tracking-wider outline-none focus:border-blue-400 appearance-none shadow-sm cursor-pointer"
              value={providerFilter}
              onChange={(e) => { setProviderFilter(e.target.value); playSound('click'); }}
            >
              {uniqueProviders.map(p => (
                <option key={`${p}-option`} value={p}>{p === 'TODOS' ? 'PROVEEDORES: TODOS' : `PROVEEDOR: ${p}`}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[48px] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cat.</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidad</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Código</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción Producto</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Precio Venta</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Cant.</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Promoción</th>
                {canModify && <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Gestión</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStock.map((item) => (
                <tr key={`${item.id}-${item.codigo}`} className={`group hover:bg-slate-50 transition-colors ${item.stockActual < 3 && item.stockActual > 0 ? 'bg-red-50/30' : ''}`}>
                  <td className="px-8 py-6">
                    <span className={`p-2 rounded-xl flex items-center justify-center w-10 h-10 ${item.categoria === 'LOTE' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`} title={item.categoria || 'FARDO'}>
                      {item.categoria === 'LOTE' ? <Boxes size={18} /> : <Layers size={18} />}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item.unidad === 'FARDO' ? 'bg-indigo-100 text-indigo-700' : item.unidad === 'LOTE' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                        {item.unidad}
                      </span>
                      {item.peso && item.categoria === 'LOTE' && (
                        <span className="text-[10px] font-black text-amber-600 mt-1 ml-1">{item.peso} KG</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6 font-mono font-black text-slate-400 uppercase text-xs tracking-widest">{item.codigo}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${item.stockActual < 3 ? 'bg-red-100 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                        <Package size={22} />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 uppercase text-sm tracking-tighter leading-none">{item.tipo}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedFichaItem(item)}
                            className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all shadow-sm"
                            title="Ver Ficha Técnica"
                          >
                            <FileText size={10} /> Ficha
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{item.proveedor}</span>
                          {item.temporada && (
                            <div className="flex items-center gap-1 flex-wrap">
                              {parseTemporadas(item.temporada).map(t => {
                                const st = getSeasonBadgeStyle(t);
                                return (
                                  <span key={t} className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${st.bg} ${st.text} ${st.border}`}>
                                    {st.icon} {t}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-slate-900 text-xl tracking-tighter">
                    ${item.precioSugerido.toLocaleString()}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className={`inline-flex flex-col items-center justify-center w-14 h-14 rounded-2xl ${item.stockActual > 3 ? 'bg-emerald-50 text-emerald-600' : item.stockActual > 0 ? 'bg-amber-50 text-amber-600 animate-pulse border border-amber-200' : 'bg-red-50 text-red-600'}`}>
                      <span className="text-xl font-black leading-none">{item.stockActual}</span>
                      <span className="text-[8px] font-black uppercase mt-1">
                        {item.unidad === 'FARDO' ? 'Uds' : item.unidad === 'LOTE' ? 'Lotes' : 'Kgs'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <button 
                      onClick={() => canModify && togglePromocion(item.id)} 
                      disabled={!canModify}
                      className={`p-3 rounded-xl transition-all ${item.promocion ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'} ${!canModify ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                      title={!canModify ? "No tienes permisos para modificar promociones" : "Alternar Promoción"}
                    >
                        <Tag size={20} />
                    </button>
                  </td>
                  {canModify && (
                    <td className="px-8 py-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => { setSelectedFichaItem(item); playSound('click'); }} 
                          className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                          title="Ver Ficha Técnica"
                        >
                          <FileText size={16} />
                        </button>
                        {currentUser?.rol === StaffRole.ADMIN && (
                          <button 
                            onClick={() => { setSelectedHistoryItem(item); setHistoryTab('TODOS'); playSound('click'); }} 
                            className="p-3 bg-purple-50 text-purple-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                            title="Ver Historial de Movimientos"
                          >
                            <History size={16} />
                          </button>
                        )}
                        <button onClick={() => setEditingItem(item)} className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm" title="Editar Producto y Ficha"><Edit3 size={16} /></button>
                        <button onClick={() => setDeletingId(item.id)} className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm" title="Eliminar"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Agregar */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[56px] shadow-[0_50px_100px_rgba(0,0,0,0.5)] w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-12 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Registro de Inventario</p>
                <h3 className="text-4xl font-black uppercase tracking-tighter italic">Entrada de Mercancía</h3>
              </div>
              <button onClick={() => setIsAdding(false)} className="p-4 hover:bg-white/10 rounded-full transition-colors"><X size={36} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-12 space-y-8 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Categoría de Producto</label>
                  <div className="flex bg-slate-100 p-2 rounded-[28px] shadow-inner">
                    <button 
                      type="button"
                      onClick={() => setNewBale({...newBale, categoria: 'FARDO', unidad: 'FARDO'})}
                      className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[22px] font-black text-xs uppercase tracking-widest transition-all ${newBale.categoria === 'FARDO' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      <Layers size={20} /> Fardo
                    </button>
                    <button 
                      type="button"
                      onClick={() => setNewBale({...newBale, categoria: 'LOTE', unidad: 'LOTE'})}
                      className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[22px] font-black text-xs uppercase tracking-widest transition-all ${newBale.categoria === 'LOTE' ? 'bg-amber-500 text-white shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      <Boxes size={20} /> Lote
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Tipo de Unidad</label>
                  <select 
                    className="w-full px-7 py-5 bg-slate-100 rounded-[28px] font-black text-xs uppercase tracking-widest outline-none border-2 border-transparent"
                    value={newBale.unidad}
                    onChange={(e) => setNewBale({...newBale, unidad: e.target.value as any})}
                  >
                    <option value="FARDO">FARDO</option>
                    <option value="MEDIO FARDO">MEDIO FARDO</option>
                    <option value="LOTE">LOTE</option>
                    <option value="PIEZA">PIEZA</option>
                  </select>
                </div>
              </div>

              {newBale.categoria === 'LOTE' && (
                <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Peso del Lote (Kgs)</label>
                  <div className="flex gap-4">
                    {[10, 20].map(w => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setNewBale({...newBale, peso: w})}
                        className={`flex-1 py-5 rounded-[24px] font-black text-xl transition-all ${newBale.peso === w ? 'bg-amber-500 text-white shadow-xl scale-105' : 'bg-slate-50 text-slate-400'}`}
                      >
                        {w} KG
                      </button>
                    ))}
                    <input 
                      type="number" 
                      placeholder="Otro..." 
                      className="flex-1 px-8 py-5 bg-slate-50 rounded-[28px] border-2 border-transparent focus:border-amber-500 outline-none font-black text-xl"
                      value={newBale.peso || ''}
                      onChange={(e) => setNewBale({...newBale, peso: Number(e.target.value)})}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Código Identificador (Opcional)</label>
                  <input className="w-full px-7 py-5 bg-slate-50 rounded-[28px] border-2 border-transparent focus:border-indigo-500 outline-none font-black text-xl uppercase" placeholder="MDF-XXXX" value={newBale.codigo || ''} onChange={(e) => setNewBale({...newBale, codigo: e.target.value.toUpperCase()})}/>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Cant. Inicial ({newBale.unidad})</label>
                  <input required type="number" onWheel={(e) => e.currentTarget.blur()} onFocus={(e) => e.target.select()} className="w-full px-7 py-5 bg-slate-50 rounded-[28px] border-2 border-transparent focus:border-indigo-500 outline-none font-black text-xl" value={newBale.stockActual === 0 ? '' : newBale.stockActual} onChange={(e) => setNewBale({...newBale, stockActual: e.target.value === '' ? 0 : Number(e.target.value)})}/>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Nombre del Producto / Fardo</label>
                <input required className="w-full px-7 py-5 bg-slate-50 rounded-[28px] border-2 border-transparent focus:border-emerald-500 outline-none font-bold text-lg" placeholder="Ej: Abrigo Lana Hombre IM..." value={newBale.tipo || ''} onChange={(e) => setNewBale({...newBale, tipo: e.target.value})}/>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-1 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Proveedor (IM, CANADA...)</label>
                  <input required className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold uppercase focus:border-emerald-500 outline-none" value={newBale.proveedor || ''} onChange={(e) => setNewBale({...newBale, proveedor: e.target.value.toUpperCase()})}/>
                </div>
                <div className="col-span-1 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Costo ($)</label>
                  <input type="number" className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-black text-slate-500 outline-none focus:border-emerald-500 border-2 border-transparent transition-all" value={newBale.precioCosto || ''} onChange={(e) => setNewBale({...newBale, precioCosto: Number(e.target.value)})}/>
                </div>
                <div className="col-span-1 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Precio Venta ($)</label>
                  <input required type="number" className="w-full px-6 py-4 bg-emerald-500 text-white rounded-2xl font-black" value={newBale.precioSugerido || ''} onChange={(e) => setNewBale({...newBale, precioSugerido: Number(e.target.value)})}/>
                </div>
              </div>

              {/* Ficha Técnica y Características para Vendedoras y Post-Venta */}
              <div className="bg-slate-50 border-2 border-slate-200/80 rounded-[32px] p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-indigo-600" />
                    <div>
                      <h4 className="font-black text-sm text-slate-900 uppercase tracking-tight">Ficha Técnica y Características del Fardo</h4>
                      <p className="text-[11px] text-slate-500 font-medium">Información oficial para que las vendedoras informen bien al cliente y no haya reclamos</p>
                    </div>
                  </div>
                </div>

                {/* Temporada (Permite selección múltiple) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        Temporada / Estación
                      </label>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Puedes seleccionar más de una estación (ej: Invierno + Media Temporada)
                      </span>
                    </div>
                    {newBale.temporada && (
                      <button
                        type="button"
                        onClick={() => setNewBale({...newBale, temporada: ''})}
                        className="text-[10px] font-bold text-red-500 hover:underline"
                      >
                        Limpiar selección
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {TEMPORADAS_OPTIONS.map(temp => {
                      const isSelected = parseTemporadas(newBale.temporada).includes(temp);
                      const sStyle = getSeasonBadgeStyle(temp);
                      return (
                        <button
                          key={temp}
                          type="button"
                          onClick={() => setNewBale({
                            ...newBale,
                            temporada: toggleTemporada(newBale.temporada, temp)
                          })}
                          className={`py-3 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all border flex items-center justify-center gap-1.5 ${
                            isSelected 
                              ? `${sStyle.bg} ${sStyle.text} ${sStyle.border} ring-2 ring-blue-500 shadow-sm font-black` 
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span>{sStyle.icon}</span>
                          <span>{temp}</span>
                          {isSelected && <Check size={14} className="text-blue-600 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                  {newBale.temporada && (
                    <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 pt-1">
                      <span className="text-slate-400">Seleccionado:</span>
                      <span className="text-blue-700 font-extrabold">{formatSeasonDisplay(newBale.temporada)}</span>
                    </div>
                  )}
                </div>

                {/* Tallas / Rango de Edad */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tallas o Rango de Edad (Ej: 2 a 8 años, S a XL)</label>
                  <input 
                    type="text" 
                    className="w-full px-5 py-3.5 bg-white rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-indigo-500"
                    placeholder="Ej: 2 a 8 años (Infantil), S a XL (Adulto), etc."
                    value={newBale.tallas || ''}
                    onChange={(e) => setNewBale({...newBale, tallas: e.target.value})}
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {TALLAS_COMUNES.map(talla => (
                      <button
                        key={talla}
                        type="button"
                        onClick={() => setNewBale({...newBale, tallas: talla})}
                        className="text-[9px] font-black px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors uppercase"
                      >
                        {talla}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Peso Real en KG */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Peso del Fardo (KG)</label>
                  <div className="flex flex-wrap gap-2">
                    {PESOS_COMUNES.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNewBale({...newBale, pesoKg: newBale.pesoKg === p ? '' : p, peso: newBale.pesoKg === p ? 0 : p})}
                        className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all border ${
                          (newBale.pesoKg === p || newBale.peso === p)
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {p} KG
                      </button>
                    ))}
                    <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                      <input 
                        type="number"
                        placeholder="Otro KG"
                        className="w-20 font-black text-xs outline-none"
                        value={newBale.pesoKg || ''}
                        onChange={(e) => setNewBale({...newBale, pesoKg: Number(e.target.value), peso: Number(e.target.value)})}
                      />
                      <span className="text-[10px] font-black text-slate-400">KG</span>
                    </div>
                  </div>
                </div>

                {/* Género / Segmento & Calidad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">GÉNERO / SEGMENTO</label>
                    <select
                      className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 font-black text-xs uppercase outline-none focus:border-indigo-500"
                      value={newBale.generoSegmento || newBale.estilo || ''}
                      onChange={(e) => setNewBale({...newBale, generoSegmento: e.target.value, estilo: e.target.value})}
                    >
                      <option value="">-- Sin seleccionar --</option>
                      {GENEROS_SEGMENTOS_OPTIONS.map(gen => (
                        <option key={gen} value={gen}>{gen}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Calidad</label>
                    <select
                      className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 font-black text-xs uppercase outline-none focus:border-indigo-500"
                      value={newBale.calidad || ''}
                      onChange={(e) => setNewBale({...newBale, calidad: e.target.value})}
                    >
                      <option value="">-- Sin seleccionar --</option>
                      {CALIDADES_OPTIONS.map(cal => (
                        <option key={cal} value={cal}>{cal}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Cantidad Aprox de Prendas */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Cantidad Aproximada de Prendas (Opcional)</label>
                  <input 
                    type="text" 
                    className="w-full px-5 py-3 bg-white rounded-xl border border-slate-200 font-bold text-xs outline-none focus:border-indigo-500"
                    placeholder="Ej: 120 a 140 prendas aprox."
                    value={newBale.piezasAprox || ''}
                    onChange={(e) => setNewBale({...newBale, piezasAprox: e.target.value})}
                  />
                </div>

                {/* Descripción Detallada */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">¿Qué trae realmente este producto? (Descripción en Catálogo)</label>
                  <textarea 
                    rows={3}
                    className="w-full px-5 py-3.5 bg-white rounded-2xl border border-slate-200 font-medium text-xs outline-none focus:border-indigo-500 resize-none leading-relaxed"
                    placeholder="Explicar qué tipo de prendas vienen, si vienen más deportivas o casuales, cómo viene el surtido..."
                    value={newBale.descripcion || ''}
                    onChange={(e) => setNewBale({...newBale, descripcion: e.target.value})}
                  />
                </div>

                {/* Consejo para Vendedoras */}
                <div className="space-y-2 bg-amber-50 p-4 rounded-2xl border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-900 text-xs font-black uppercase tracking-wider">
                    <AlertTriangle size={14} className="text-amber-600" />
                    <span>Guía de Venta / Advertencia para Vendedoras</span>
                  </div>
                  <textarea 
                    rows={2}
                    className="w-full px-4 py-2.5 bg-white rounded-xl border border-amber-300 font-medium text-xs outline-none focus:border-amber-500 resize-none"
                    placeholder="Ej: Aclarar al cliente que las tallas van de 2 a 8 años y no trae ropa de adulto..."
                    value={newBale.consejoVenta || ''}
                    onChange={(e) => setNewBale({...newBale, consejoVenta: e.target.value})}
                  />
                </div>

              </div>

              <button type="submit" className="w-full py-7 bg-slate-900 text-white rounded-[32px] font-black text-2xl shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4 active:scale-95">
                <Boxes size={32} /> CONFIRMAR EN BODEGA
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[56px] shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in duration-300 border border-slate-100">
            <div className="p-8 sm:p-10 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Control de Inventario & Ficha</p>
                <h3 className="text-3xl font-black uppercase tracking-tighter italic">Editar Fardo y Características</h3>
              </div>
              <button onClick={() => setEditingItem(null)} className="p-3 hover:bg-white/10 rounded-full transition-colors"><X size={28} /></button>
            </div>
            <form onSubmit={handleUpdate} className="p-8 sm:p-10 space-y-6 overflow-y-auto max-h-[75vh]">
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Categoría de Producto</label>
                  <div className="flex bg-slate-100 p-1.5 rounded-[24px] shadow-inner">
                    <button 
                      type="button"
                      onClick={() => setEditingItem({...editingItem, categoria: 'FARDO'})}
                      className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[18px] font-black text-xs uppercase tracking-widest transition-all ${editingItem.categoria === 'FARDO' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500'}`}
                    >
                      <Layers size={18} /> Fardo
                    </button>
                    <button 
                      type="button"
                      onClick={() => setEditingItem({...editingItem, categoria: 'LOTE'})}
                      className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[18px] font-black text-xs uppercase tracking-widest transition-all ${(editingItem.categoria || (editingItem as any).unidad === 'LOTE' ? 'LOTE' : 'FARDO') === 'LOTE' ? 'bg-amber-500 text-white shadow-xl' : 'text-slate-500'}`}
                    >
                      <Boxes size={18} /> Lote
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Tipo de Unidad</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-100 rounded-[24px] font-black text-xs uppercase tracking-widest outline-none border-2 border-transparent"
                    value={editingItem.unidad}
                    onChange={(e) => setEditingItem({...editingItem, unidad: e.target.value as any})}
                  >
                    <option value="FARDO">FARDO</option>
                    <option value="MEDIO FARDO">MEDIO FARDO</option>
                    <option value="LOTE">LOTE</option>
                    <option value="PIEZA">PIEZA</option>
                  </select>
                </div>
              </div>

              {/* Nombre / Título del Fardo */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Nombre del Producto / Fardo</label>
                <input 
                  required 
                  className="w-full px-7 py-4 bg-slate-50 rounded-[24px] border-2 border-transparent focus:border-indigo-500 outline-none font-bold text-lg uppercase" 
                  value={editingItem.tipo || ''} 
                  onChange={(e) => setEditingItem({...editingItem, tipo: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Código Identificador</label>
                  <input required className="w-full px-6 py-4 bg-slate-50 rounded-[24px] font-black text-lg uppercase outline-none focus:border-indigo-500 border-2 border-transparent" value={editingItem.codigo} onChange={(e) => setEditingItem({...editingItem, codigo: e.target.value.toUpperCase()})}/>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Stock Físico Actual</label>
                  <input required type="number" className="w-full px-6 py-4 bg-slate-50 rounded-[24px] font-black text-lg outline-none focus:border-indigo-500 border-2 border-transparent" value={editingItem.stockActual} onChange={(e) => setEditingItem({...editingItem, stockActual: Number(e.target.value)})}/>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Proveedor</label>
                  <input required className="w-full px-5 py-4 bg-slate-50 rounded-[20px] font-black text-sm uppercase outline-none focus:border-indigo-500 border-2 border-transparent" placeholder="IM, BETA..." value={editingItem.proveedor} onChange={(e) => setEditingItem({...editingItem, proveedor: e.target.value.toUpperCase()})}/>
                </div>
                <div className="col-span-1 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Costo ($)</label>
                  <input type="number" className="w-full px-5 py-4 bg-slate-50 rounded-[20px] font-bold text-sm outline-none focus:border-indigo-500 border-2 border-transparent" value={editingItem.precioCosto || ''} onChange={(e) => setEditingItem({...editingItem, precioCosto: Number(e.target.value)})}/>
                </div>
                <div className="col-span-1 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Venta Sugerida ($)</label>
                  <input required type="number" className="w-full px-5 py-4 bg-emerald-500 text-white rounded-[20px] font-black text-base outline-none focus:border-emerald-600 border-2 border-transparent" value={editingItem.precioSugerido} onChange={(e) => setEditingItem({...editingItem, precioSugerido: Number(e.target.value)})}/>
                </div>
              </div>

              {/* Ficha Técnica y Características Detalladas */}
              <div className="bg-slate-50 border-2 border-slate-200/80 rounded-[32px] p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-indigo-600" />
                    <div>
                      <h4 className="font-black text-sm text-slate-900 uppercase tracking-tight">Ficha Técnica y Características del Fardo</h4>
                      <p className="text-[11px] text-slate-500 font-medium">Define qué trae realmente el producto para el catálogo y las vendedoras</p>
                    </div>
                  </div>
                </div>

                {/* Temporada (Permite selección múltiple) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        Temporada / Estación
                      </label>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Puedes seleccionar más de una estación (ej: Invierno + Media Temporada)
                      </span>
                    </div>
                    {editingItem.temporada && (
                      <button
                        type="button"
                        onClick={() => setEditingItem({...editingItem, temporada: ''})}
                        className="text-[10px] font-bold text-red-500 hover:underline"
                      >
                        Limpiar selección
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {TEMPORADAS_OPTIONS.map(temp => {
                      const isSelected = parseTemporadas(editingItem.temporada).includes(temp);
                      const sStyle = getSeasonBadgeStyle(temp);
                      return (
                        <button
                          key={temp}
                          type="button"
                          onClick={() => setEditingItem({
                            ...editingItem,
                            temporada: toggleTemporada(editingItem.temporada, temp)
                          })}
                          className={`py-3 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all border flex items-center justify-center gap-1.5 ${
                            isSelected 
                              ? `${sStyle.bg} ${sStyle.text} ${sStyle.border} ring-2 ring-blue-500 shadow-sm font-black` 
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span>{sStyle.icon}</span>
                          <span>{temp}</span>
                          {isSelected && <Check size={14} className="text-blue-600 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                  {editingItem.temporada && (
                    <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 pt-1">
                      <span className="text-slate-400">Seleccionado:</span>
                      <span className="text-blue-700 font-extrabold">{formatSeasonDisplay(editingItem.temporada)}</span>
                    </div>
                  )}
                </div>

                {/* Tallas / Rango de Edad */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tallas o Rango de Edad (Ej: 2 a 8 años, S a XL)</label>
                  <input 
                    type="text" 
                    className="w-full px-5 py-3.5 bg-white rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-indigo-500"
                    placeholder="Ej: 2 a 8 años (Infantil), S a XL (Adulto), etc."
                    value={editingItem.tallas || ''}
                    onChange={(e) => setEditingItem({...editingItem, tallas: e.target.value})}
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {TALLAS_COMUNES.map(talla => (
                      <button
                        key={talla}
                        type="button"
                        onClick={() => setEditingItem({...editingItem, tallas: talla})}
                        className="text-[9px] font-black px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors uppercase"
                      >
                        {talla}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Peso Real en KG */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Peso del Fardo (KG)</label>
                  <div className="flex flex-wrap gap-2">
                    {PESOS_COMUNES.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setEditingItem({...editingItem, pesoKg: editingItem.pesoKg === p ? '' : p, peso: editingItem.pesoKg === p ? 0 : p})}
                        className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all border ${
                          (editingItem.pesoKg === p || editingItem.peso === p)
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {p} KG
                      </button>
                    ))}
                    <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                      <input 
                        type="number"
                        placeholder="Otro KG"
                        className="w-20 font-black text-xs outline-none"
                        value={editingItem.pesoKg || editingItem.peso || ''}
                        onChange={(e) => setEditingItem({...editingItem, pesoKg: Number(e.target.value), peso: Number(e.target.value)})}
                      />
                      <span className="text-[10px] font-black text-slate-400">KG</span>
                    </div>
                  </div>
                </div>

                {/* Género / Segmento & Calidad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">GÉNERO / SEGMENTO</label>
                    <select
                      className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 font-black text-xs uppercase outline-none focus:border-indigo-500"
                      value={editingItem.generoSegmento || editingItem.estilo || ''}
                      onChange={(e) => setEditingItem({...editingItem, generoSegmento: e.target.value, estilo: e.target.value})}
                    >
                      <option value="">-- Sin seleccionar --</option>
                      {GENEROS_SEGMENTOS_OPTIONS.map(gen => (
                        <option key={gen} value={gen}>{gen}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Calidad</label>
                    <select
                      className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 font-black text-xs uppercase outline-none focus:border-indigo-500"
                      value={editingItem.calidad || ''}
                      onChange={(e) => setEditingItem({...editingItem, calidad: e.target.value})}
                    >
                      <option value="">-- Sin seleccionar --</option>
                      {CALIDADES_OPTIONS.map(cal => (
                        <option key={cal} value={cal}>{cal}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Cantidad Aprox de Prendas */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Cantidad Aproximada de Prendas (Opcional)</label>
                  <input 
                    type="text" 
                    className="w-full px-5 py-3 bg-white rounded-xl border border-slate-200 font-bold text-xs outline-none focus:border-indigo-500"
                    placeholder="Ej: 120 a 140 prendas aprox."
                    value={editingItem.piezasAprox || ''}
                    onChange={(e) => setEditingItem({...editingItem, piezasAprox: e.target.value})}
                  />
                </div>

                {/* Descripción Detallada */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">¿Qué trae realmente este producto? (Descripción en Catálogo)</label>
                  <textarea 
                    rows={3}
                    className="w-full px-5 py-3.5 bg-white rounded-2xl border border-slate-200 font-medium text-xs outline-none focus:border-indigo-500 resize-none leading-relaxed"
                    placeholder="Explicar qué tipo de prendas vienen, si vienen más deportivas o casuales, cómo viene el surtido..."
                    value={editingItem.descripcion || ''}
                    onChange={(e) => setEditingItem({...editingItem, descripcion: e.target.value})}
                  />
                </div>

                {/* Consejo para Vendedoras */}
                <div className="space-y-2 bg-amber-50 p-4 rounded-2xl border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-900 text-xs font-black uppercase tracking-wider">
                    <AlertTriangle size={14} className="text-amber-600" />
                    <span>Guía de Venta / Advertencia para Vendedoras</span>
                  </div>
                  <textarea 
                    rows={2}
                    className="w-full px-4 py-2.5 bg-white rounded-xl border border-amber-300 font-medium text-xs outline-none focus:border-amber-500 resize-none"
                    placeholder="Ej: Aclarar al cliente que las tallas van de 2 a 8 años y no trae ropa de adulto..."
                    value={editingItem.consejoVenta || ''}
                    onChange={(e) => setEditingItem({...editingItem, consejoVenta: e.target.value})}
                  />
                </div>

              </div>

              <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[28px] font-black text-xl shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95">
                <Save size={24} /> GUARDAR CAMBIOS DE INVENTARIO Y FICHA
              </button>
            </form>
          </div>
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white p-12 rounded-[56px] shadow-2xl w-full max-md text-center animate-in zoom-in">
            <div className="w-28 h-28 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <AlertTriangle size={56} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tighter">¿Eliminar Item?</h3>
            <p className="text-slate-500 font-medium mb-10 leading-relaxed italic">Esta operación purgará el fardo/pieza de la base de datos centralizada. <br/>¿Estás seguro de continuar?</p>
            <div className="flex gap-4">
              <button onClick={() => setDeletingId(null)} className="flex-1 py-5 bg-slate-100 text-slate-900 rounded-[24px] font-black uppercase text-xs tracking-widest">Abortar</button>
              <button onClick={handleDelete} className="flex-1 py-5 bg-red-600 text-white rounded-[24px] font-black shadow-2xl shadow-red-600/30 uppercase text-xs tracking-widest">Confirmar Purga</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Historial Movimientos */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[48px] shadow-[0_50px_100px_rgba(0,0,0,0.5)] w-full max-w-4xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-10 bg-slate-950 text-white flex items-center justify-between col-span-3">
              <div>
                <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Auditoría / Kárdex del Producto</p>
                <h3 className="text-3xl font-black uppercase tracking-tighter italic">Historial de Movimientos</h3>
                <p className="text-slate-400 text-xs font-bold mt-1 uppercase">
                  {selectedHistoryItem.codigo} — {selectedHistoryItem.tipo} (P. Sugerido: ${selectedHistoryItem.precioSugerido?.toLocaleString()})
                </p>
              </div>
              <button onClick={() => setSelectedHistoryItem(null)} className="p-3 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                <X size={28} />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-10 flex-grow overflow-y-auto space-y-8 bg-slate-50/50">
              {/* Metrics Summary Rows */}
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <ArrowDownLeft size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Ingresos</span>
                    <h4 className="text-2xl font-black text-slate-950 mt-0.5">+{historyStats.inputs} <span className="text-xs font-normal text-slate-500">unids</span></h4>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <ArrowUpRight size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Salidas</span>
                    <h4 className="text-2xl font-black text-slate-950 mt-0.5">-{historyStats.outputs} <span className="text-xs font-normal text-slate-500">unids</span></h4>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm flex items-center gap-4 ring-2 ring-indigo-50">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <Package size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Suelto en Bodega</span>
                    <h4 className="text-3xl font-black text-indigo-600 mt-0.5">{selectedHistoryItem.stockActual}</h4>
                  </div>
                </div>
              </div>

              {/* Tabs selector */}
              <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200/30">
                {(['TODOS', 'INGRESOS', 'SALIDAS'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => { setHistoryTab(tab); playSound('click'); }}
                    className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${
                      historyTab === tab 
                        ? 'bg-slate-900 text-white shadow-md' 
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {tab === 'TODOS' ? 'Todos' : tab === 'INGRESOS' ? 'Ingresos / Ajustes' : 'Ventas (Salidas)'}
                  </button>
                ))}
              </div>

              {/* Movements Timeline List */}
              <div className="space-y-4">
                {filteredTimeline.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8">
                    <History size={48} className="mx-auto text-slate-300 mb-4 animate-spin-slow" />
                    <h4 className="font-bold text-slate-900 text-lg uppercase">Sin datos para mostrar</h4>
                    <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto italic">No hemos detectado movimientos que coincidan con este filtro de búsqueda de inventario.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm divide-y divide-slate-100">
                    {filteredTimeline.map((item) => {
                      const isVenta = item.tipo === 'VENTA';
                      const isAnulacion = item.tipo === 'ANULACION';
                      const isIngreso = item.tipo === 'INGRESO';
                      const isAjuste = item.tipo === 'AJUSTE';
                      const isCargaMasiva = item.tipo === 'CARGA_MASIVA';

                      let badgeColor = '';
                      let icon = null;
                      let typeLabel = '';

                      if (isVenta) {
                        badgeColor = 'bg-rose-100 text-rose-700';
                        icon = <ArrowUpRight size={14} />;
                        typeLabel = 'SALIDA (VENTA)';
                      } else if (isAnulacion) {
                        badgeColor = 'bg-emerald-100 text-emerald-700 border border-emerald-200';
                        icon = <ArrowDownLeft size={14} />;
                        typeLabel = 'RETORNO (ANULACIÓN)';
                      } else if (isIngreso) {
                        badgeColor = 'bg-emerald-50 text-emerald-700';
                        icon = <ArrowDownLeft size={14} />;
                        typeLabel = 'INGRESO INICIAL';
                      } else if (isCargaMasiva) {
                        badgeColor = 'bg-indigo-100 text-indigo-700';
                        icon = <Download size={14} />;
                        typeLabel = 'CARGA MASIVA CSV';
                      } else {
                        badgeColor = item.cantidad >= 0 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800';
                        icon = <TrendingUp size={14} />;
                        typeLabel = 'AJUSTE MANUAL';
                      }

                      const dateObj = new Date(item.fecha);
                      const displayDate = isNaN(dateObj.getTime()) ? item.fecha : dateObj.toLocaleDateString([], {
                        day: '2-digit', month: 'short', year: 'numeric'
                      }) + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                      return (
                        <div key={item.id} className="p-6 flex items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`p-3 rounded-2xl flex items-center justify-center h-11 w-11 ${
                              isVenta ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {isVenta ? <ArrowUpRight size={18} /> : isAnulacion ? <ArrowDownLeft size={18} className="text-emerald-600" /> : <TrendingUp size={18} />}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${badgeColor} flex items-center gap-1`}>
                                  {icon} {typeLabel}
                                </span>
                              </div>
                              <p className="text-slate-800 font-bold uppercase text-sm leading-none">{item.observaciones}</p>
                              
                              <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 mt-1 uppercase">
                                <span className="flex items-center gap-1"><Calendar size={12} /> {displayDate}</span>
                                <span className="flex items-center gap-1"><User size={12} /> Responsable: {item.vendedor}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`font-mono text-xl font-black tracking-tight ${
                              item.cantidad > 0 ? 'text-emerald-600' : item.cantidad < 0 ? 'text-red-500' : 'text-slate-500'
                            }`}>
                              {item.cantidad > 0 ? `+${item.cantidad}` : item.cantidad}
                            </span>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">UDS</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 bg-slate-100 border-t border-slate-200/60 flex items-center justify-end">
              <button 
                onClick={() => setSelectedHistoryItem(null)} 
                className="px-8 py-3 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Modal Vale de Entrada de Mercadería / Contenedor */}
      {isAddingVale && (
        <ValeEntradaModal
          onClose={() => setIsAddingVale(false)}
          onValeCreated={() => {
            setActiveMainView('VALES');
          }}
        />
      )}

      {/* Modal Ficha Técnica y Características del Fardo */}
      <ProductFichaModal
        item={selectedFichaItem}
        isOpen={Boolean(selectedFichaItem)}
        onClose={() => setSelectedFichaItem(null)}
        onEdit={(it) => setEditingItem(it)}
        canEdit={canModify}
      />
    </div>
  );
}
