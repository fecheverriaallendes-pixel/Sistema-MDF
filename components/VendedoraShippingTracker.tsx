import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Truck, 
  Search, 
  Clock, 
  CheckCircle2, 
  Package, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Copy, 
  Check, 
  Boxes, 
  Building2, 
  Home, 
  Sparkles, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Filter,
  Eye,
  Calendar,
  AlertCircle,
  LayoutGrid,
  List,
  ExternalLink
} from 'lucide-react';
import { Sale, SaleStatus, DispatchType, StockItem } from '../types';
import { SaleTrackingModal, formatShippingStatus, generateWhatsAppTrackingMessage } from './SaleTrackingModal';

interface VendedoraShippingTrackerProps {
  sales: Sale[];
  stock: StockItem[];
  vendedoraName?: string;
  isAdmin?: boolean;
  onUpdateSale?: (id: string, data: Partial<Sale>) => void;
  playSound?: (sound: string) => void;
}

export function VendedoraShippingTracker({
  sales,
  stock,
  vendedoraName,
  isAdmin = false,
  onUpdateSale,
  playSound = () => {}
}: VendedoraShippingTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewLayout, setViewLayout] = useState<'cards' | 'table'>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusTab, setStatusTab] = useState<'PENDIENTES' | 'ALL' | 'PREPARACION' | 'EN_RUTA' | 'JUNTA' | 'RETIRO' | 'ENTREGADO'>('PENDIENTES');
  const [timeFilter, setTimeFilter] = useState<'ALL' | '30DAYS' | '7DAYS'>('30DAYS');
  const [selectedSaleForModal, setSelectedSaleForModal] = useState<Sale | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE_CARDS = 6;
  const PAGE_SIZE_TABLE = 10;
  const pageSize = viewLayout === 'cards' ? PAGE_SIZE_CARDS : PAGE_SIZE_TABLE;

  // Filter sales for this vendedora (unless admin who can view all or specific)
  const mySales = useMemo(() => {
    return (sales || []).filter(s => {
      if (!s) return false;
      if (!isAdmin && vendedoraName && s.vendedor !== vendedoraName) return false;
      return true;
    });
  }, [sales, vendedoraName, isAdmin]);

  // Metrics counters
  const counts = useMemo(() => {
    let prep = 0;
    let enRuta = 0;
    let junta = 0;
    let retiro = 0;
    let entregados = 0;
    let pendientes = 0;

    mySales.forEach(s => {
      const isJunta = Boolean(s.juntaCompra && s.juntaCompra.trim().toUpperCase().includes('JUNTA') && s.status === SaleStatus.PENDIENTE);
      const isRetiro = s.tipoDespacho === DispatchType.RETIRO;
      const isEnviado = s.status === SaleStatus.ENVIADO;
      const isEnRuta = s.status === SaleStatus.PENDIENTE && Boolean(s.transportista) && !isJunta;

      if (isEnviado) {
        entregados++;
      } else {
        pendientes++;
        if (isJunta) junta++;
        else if (isRetiro) retiro++;
        else if (isEnRuta) enRuta++;
        else prep++;
      }
    });

    return {
      total: mySales.length,
      pendientes,
      prep,
      enRuta,
      junta,
      retiro,
      entregados
    };
  }, [mySales]);

  // Apply time and search filters
  const filteredSales = useMemo(() => {
    const now = new Date().getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    return mySales.filter(s => {
      // Time filter
      if (timeFilter !== 'ALL') {
        let saleDate: Date | null = null;
        if (s.fecha) {
          if (s.fecha.includes('/')) {
            const parts = s.fecha.split('/');
            if (parts.length === 3) saleDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
          } else if (s.fecha.includes('-')) {
            const parts = s.fecha.split('-');
            if (parts.length === 3) {
              if (parts[0].length === 4) {
                saleDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
              } else {
                saleDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
              }
            }
          }
        }
        if (saleDate && !isNaN(saleDate.getTime())) {
          const diffDays = (now - saleDate.getTime()) / dayMs;
          if (timeFilter === '7DAYS' && diffDays > 7) return false;
          if (timeFilter === '30DAYS' && diffDays > 35) return false;
        } else if (timeFilter !== 'ALL') {
          return false;
        }
      }

      // Status Tab filter
      const isJunta = Boolean(s.juntaCompra && s.juntaCompra.trim().toUpperCase().includes('JUNTA') && s.status === SaleStatus.PENDIENTE);
      const isRetiro = s.tipoDespacho === DispatchType.RETIRO;
      const isEnviado = s.status === SaleStatus.ENVIADO;
      const isEnRuta = s.status === SaleStatus.PENDIENTE && Boolean(s.transportista) && !isJunta;
      const isPrep = s.status === SaleStatus.PENDIENTE && !s.transportista && !isJunta && !isRetiro;

      if (statusTab === 'PENDIENTES' && isEnviado) return false;
      if (statusTab === 'PREPARACION' && !isPrep) return false;
      if (statusTab === 'EN_RUTA' && !isEnRuta) return false;
      if (statusTab === 'JUNTA' && !isJunta) return false;
      if (statusTab === 'RETIRO' && (!isRetiro || isEnviado)) return false;
      if (statusTab === 'ENTREGADO' && !isEnviado) return false;

      // Text Search
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase().trim();
        const clientMatch = (s.cliente || '').toLowerCase().includes(search);
        const saleNumMatch = String(s.numeroVenta || '').includes(search);
        const phoneMatch = (s.telefono || '').toLowerCase().includes(search);
        const carrierMatch = (s.transportista || '').toLowerCase().includes(search);
        const agencyMatch = (s.agencia || '').toLowerCase().includes(search);
        const addressMatch = (s.direccion || '').toLowerCase().includes(search);
        const productCodeMatch = (s.codigoFardo || '').toLowerCase().includes(search);
        const itemsMatch = s.items?.some(it => (it.codigoFardo || '').toLowerCase().includes(search)) ?? false;

        return clientMatch || saleNumMatch || phoneMatch || carrierMatch || agencyMatch || addressMatch || productCodeMatch || itemsMatch;
      }

      return true;
    }).sort((a, b) => (b.numeroVenta || 0) - (a.numeroVenta || 0));
  }, [mySales, timeFilter, statusTab, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / pageSize));
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSales.slice(start, start + pageSize);
  }, [filteredSales, currentPage, pageSize]);

  const handleTabChange = (tab: typeof statusTab) => {
    setStatusTab(tab);
    setCurrentPage(1);
    playSound('click');
  };

  const handleTimeFilterChange = (filter: typeof timeFilter) => {
    setTimeFilter(filter);
    setCurrentPage(1);
    playSound('click');
  };

  const handleSearchChange = (text: string) => {
    setSearchTerm(text);
    setCurrentPage(1);
  };

  const handleCopyStatus = (sale: Sale) => {
    const text = generateWhatsAppTrackingMessage(sale, stock);
    navigator.clipboard.writeText(text);
    setCopiedId(sale.id);
    playSound('success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenWhatsApp = (sale: Sale) => {
    playSound('click');
    const phone = (sale.telefono || '').replace(/\D/g, '');
    if (!phone) {
      alert("El cliente no tiene teléfono registrado.");
      return;
    }
    const cleanPhone = phone.startsWith('56') ? phone : `56${phone}`;
    const text = generateWhatsAppTrackingMessage(sale, stock);
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleLiberarJunta = (sale: Sale) => {
    if (onUpdateSale) {
      onUpdateSale(sale.id, { juntaCompra: 'DESPACHO INMEDIATO' });
      playSound('success');
      setSelectedSaleForModal(null);
    }
  };

  return (
    <div className="w-full max-w-6xl mb-12 animate-in slide-in-from-top duration-700">
      {/* TARJETA CONTENEDORA PRINCIPAL */}
      <div className="bg-white p-6 md:p-8 rounded-[36px] border-2 border-slate-100 shadow-xl overflow-hidden relative">
        {/* Cabecera Principal */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0">
              <Truck size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Logística y Seguimiento
                </span>
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest hidden sm:inline-block">
                  WhatsApp Directo
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight mt-1">
                Estado de Envíos de Clientes
              </h2>
              <p className="text-slate-500 text-xs font-semibold">
                {counts.pendientes} envíos pendientes en curso de un total de {counts.total} ventas registradas
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
              <div className="text-center px-2 py-1 bg-white rounded-xl shadow-xs">
                <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Prep.</p>
                <p className="text-xs font-black text-slate-800">{counts.prep}</p>
              </div>
              <div className="text-center px-2 py-1 bg-white rounded-xl shadow-xs">
                <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">En Ruta</p>
                <p className="text-xs font-black text-slate-800">{counts.enRuta}</p>
              </div>
              <div className="text-center px-2 py-1 bg-white rounded-xl shadow-xs">
                <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Junta</p>
                <p className="text-xs font-black text-slate-800">{counts.junta}</p>
              </div>
              <div className="text-center px-2 py-1 bg-white rounded-xl shadow-xs hidden sm:block">
                <p className="text-[8px] font-black text-orange-500 uppercase tracking-widest">Retiro</p>
                <p className="text-xs font-black text-slate-800">{counts.retiro}</p>
              </div>
              <div className="text-center px-2 py-1 bg-white rounded-xl shadow-xs hidden sm:block">
                <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Entregados</p>
                <p className="text-xs font-black text-slate-800">{counts.entregados}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(!isExpanded);
                  playSound('click');
                }}
                className={`px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 border ${
                  isExpanded 
                    ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                }`}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp size={16} /> Contraer Ventanas
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} /> Ver Ventanas ({filteredSales.length})
                  </>
                )}
              </button>

              <Link 
                to="/despachos"
                className="px-4 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-md shrink-0"
              >
                <Truck size={16} /> Módulo Despachos <ExternalLink size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* MODO CONTRAÍDO: RESUMEN EJECUTIVO LIMPIO (NO INVADE EL DASHBOARD) */}
        {!isExpanded && (
          <div className="mt-5 p-5 bg-gradient-to-r from-slate-50 via-blue-50/30 to-slate-50 rounded-2xl border border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Package size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  <span className="font-black text-blue-600">{counts.pendientes} ventas pendientes</span> de despacho actualmente.
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Las ventanas individuales están acotadas para mantener el Dashboard rápido y limpio. Haz clic en "Ver Ventanas" para consultar de a 6 clientes o ve a Despachos.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(true);
                  playSound('click');
                }}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-blue-700 transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <ChevronDown size={14} /> Ver Ventanas ({counts.pendientes})
              </button>
              <Link
                to="/despachos"
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5"
              >
                <ExternalLink size={14} /> Despachar
              </Link>
            </div>
          </div>
        )}

        {/* MODO EXPANDIDO: VISTA CONTROLADA Y PAGINADA */}
        {isExpanded && (
          <div className="mt-6 space-y-6 animate-in fade-in duration-300">
            {/* Toolbar: Filtro de tiempo y vista */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                  <button
                    onClick={() => { setViewLayout('cards'); playSound('click'); }}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                      viewLayout === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <LayoutGrid size={14} /> Tarjetas
                  </button>
                  <button
                    onClick={() => { setViewLayout('table'); playSound('click'); }}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                      viewLayout === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <List size={14} /> Lista Compacta
                  </button>
                </div>

                <span className="text-slate-300">|</span>

                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                  <button
                    onClick={() => handleTimeFilterChange('7DAYS')}
                    className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                      timeFilter === '7DAYS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    7 Días
                  </button>
                  <button
                    onClick={() => handleTimeFilterChange('30DAYS')}
                    className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                      timeFilter === '30DAYS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Mes
                  </button>
                  <button
                    onClick={() => handleTimeFilterChange('ALL')}
                    className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                      timeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Todas ({counts.total})
                  </button>
                </div>
              </div>

              {/* Botón Contraer */}
              <button
                onClick={() => {
                  setIsExpanded(false);
                  playSound('click');
                }}
                className="px-3 py-1.5 text-slate-500 hover:text-slate-900 text-xs font-black uppercase tracking-wider flex items-center gap-1 self-end sm:self-auto"
              >
                <ChevronUp size={16} /> Ocultar Ventanas
              </button>
            </div>

            {/* KPI Status Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              <button
                onClick={() => handleTabChange('PENDIENTES')}
                className={`p-2.5 rounded-2xl border text-left transition-all ${
                  statusTab === 'PENDIENTES' 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                    : 'bg-white text-slate-800 border-slate-200 hover:border-blue-200'
                }`}
              >
                <span className="text-[8px] font-black uppercase tracking-widest opacity-80 block">Pendientes</span>
                <p className="text-lg font-black mt-0.5">{counts.pendientes}</p>
              </button>

              <button
                onClick={() => handleTabChange('PREPARACION')}
                className={`p-2.5 rounded-2xl border text-left transition-all ${
                  statusTab === 'PREPARACION' 
                    ? 'bg-amber-500 text-white border-amber-500 shadow-md' 
                    : 'bg-white text-slate-800 border-slate-200 hover:border-amber-200'
                }`}
              >
                <span className="text-[8px] font-black uppercase tracking-widest opacity-80 block">Preparación</span>
                <p className="text-lg font-black mt-0.5">{counts.prep}</p>
              </button>

              <button
                onClick={() => handleTabChange('EN_RUTA')}
                className={`p-2.5 rounded-2xl border text-left transition-all ${
                  statusTab === 'EN_RUTA' 
                    ? 'bg-blue-700 text-white border-blue-700 shadow-md' 
                    : 'bg-white text-slate-800 border-slate-200 hover:border-blue-200'
                }`}
              >
                <span className="text-[8px] font-black uppercase tracking-widest opacity-80 block">En Ruta</span>
                <p className="text-lg font-black mt-0.5">{counts.enRuta}</p>
              </button>

              <button
                onClick={() => handleTabChange('JUNTA')}
                className={`p-2.5 rounded-2xl border text-left transition-all ${
                  statusTab === 'JUNTA' 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                    : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-200'
                }`}
              >
                <span className="text-[8px] font-black uppercase tracking-widest opacity-80 block">Junta Compra</span>
                <p className="text-lg font-black mt-0.5">{counts.junta}</p>
              </button>

              <button
                onClick={() => handleTabChange('RETIRO')}
                className={`p-2.5 rounded-2xl border text-left transition-all ${
                  statusTab === 'RETIRO' 
                    ? 'bg-orange-500 text-white border-orange-500 shadow-md' 
                    : 'bg-white text-slate-800 border-slate-200 hover:border-orange-200'
                }`}
              >
                <span className="text-[8px] font-black uppercase tracking-widest opacity-80 block">Retiro</span>
                <p className="text-lg font-black mt-0.5">{counts.retiro}</p>
              </button>

              <button
                onClick={() => handleTabChange('ENTREGADO')}
                className={`p-2.5 rounded-2xl border text-left transition-all ${
                  statusTab === 'ENTREGADO' 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' 
                    : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-200'
                }`}
              >
                <span className="text-[8px] font-black uppercase tracking-widest opacity-80 block">Entregados</span>
                <p className="text-lg font-black mt-0.5">{counts.entregados}</p>
              </button>

              <button
                onClick={() => handleTabChange('ALL')}
                className={`p-2.5 rounded-2xl border text-left transition-all ${
                  statusTab === 'ALL' 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                    : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="text-[8px] font-black uppercase tracking-widest opacity-80 block">Total</span>
                <p className="text-lg font-black mt-0.5">{counts.total}</p>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <Search size={18} />
              </div>
              <input 
                type="text" 
                placeholder="Buscar por cliente, N° venta, teléfono, fardo, transportista, ciudad..."
                className="w-full pl-11 pr-24 py-3 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-blue-400 outline-none font-bold text-xs shadow-xs transition-all uppercase"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 hover:text-slate-600 bg-slate-200/80 px-2 py-1 rounded-md"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Content List: Cards or Compact Table */}
            {filteredSales.length === 0 ? (
              <div className="bg-slate-50 p-10 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-2">
                <div className="w-12 h-12 bg-white text-slate-400 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <Truck size={22} />
                </div>
                <p className="font-extrabold text-slate-800 text-sm uppercase tracking-tight">No se encontraron envíos</p>
                <p className="text-slate-400 text-xs font-medium max-w-md mx-auto">
                  No hay registros que coincidan con los filtros seleccionados.
                </p>
              </div>
            ) : viewLayout === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginatedSales.map((sale) => {
                  const statusInfo = formatShippingStatus(sale);
                  const isSent = sale.status === SaleStatus.ENVIADO;
                  const itemsCount = sale.items && sale.items.length > 0 
                    ? sale.items.reduce((acc, i) => acc + (Number(i.cantidad) || 0), 0)
                    : (sale.cantidad || 1);

                  return (
                    <div 
                      key={sale.id}
                      className="bg-white rounded-3xl border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between p-5 relative overflow-hidden group"
                    >
                      {/* Status indicator bar */}
                      <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                        isSent 
                          ? 'bg-emerald-500' 
                          : statusInfo.isJunta 
                            ? 'bg-indigo-500' 
                            : sale.tipoDespacho === DispatchType.RETIRO 
                              ? 'bg-orange-500' 
                              : sale.transportista 
                                ? 'bg-blue-500' 
                                : 'bg-amber-500'
                      }`} />

                      {/* Card Header */}
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2 pt-1">
                          <span className="px-2.5 py-0.5 bg-slate-900 text-white rounded-lg text-[10px] font-black font-mono">
                            #{sale.numeroVenta}
                          </span>
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${statusInfo.badgeBg} ${statusInfo.badgeTextColor}`}>
                            {statusInfo.badgeText}
                          </span>
                        </div>

                        {/* Customer Info */}
                        <div>
                          <h3 className="text-base font-black text-slate-900 uppercase leading-tight truncate">
                            {sale.cliente}
                          </h3>
                          <p className="text-xs font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone size={11} className="text-emerald-600" />
                            <span>{sale.telefono || 'Sin teléfono'}</span>
                          </p>
                        </div>

                        {/* Product & Destination Details */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-slate-400 text-[10px] uppercase">Producto:</span>
                            <span className="text-slate-800 text-right truncate max-w-[170px] font-black text-[11px]">
                              {sale.items && sale.items.length > 0 
                                ? `${sale.items.length} ítem(s) (${itemsCount} u.)`
                                : (stock.find(s => s.codigo === sale.codigoFardo)?.tipo || sale.codigoFardo || 'Fardo')}
                            </span>
                          </div>

                          <div className="flex items-center justify-between font-bold pt-1 border-t border-slate-200/60">
                            <span className="text-slate-400 text-[10px] uppercase">Modalidad:</span>
                            <span className="text-slate-800 font-bold uppercase text-[10px]">
                              {sale.tipoDespacho || 'Despacho'} {sale.agencia ? `(${sale.agencia})` : ''}
                            </span>
                          </div>

                          {sale.direccion && sale.tipoDespacho !== DispatchType.RETIRO && (
                            <p className="text-[10px] font-semibold text-slate-600 uppercase truncate flex items-center gap-1">
                              <MapPin size={10} className="text-amber-500 shrink-0" />
                              <span className="truncate">{sale.direccion}</span>
                            </p>
                          )}

                          {sale.transportista && (
                            <p className="text-[10px] font-black text-blue-700 uppercase flex items-center gap-1">
                              <Truck size={10} className="shrink-0" />
                              <span>{sale.transportista}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex gap-1.5">
                        <button
                          onClick={() => handleOpenWhatsApp(sale)}
                          className="flex-1 py-2 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                          title="Enviar actualización directamente al WhatsApp del cliente"
                        >
                          <MessageSquare size={13} /> WhatsApp
                        </button>

                        <button
                          onClick={() => handleCopyStatus(sale)}
                          className={`p-2 rounded-xl border transition-all ${
                            copiedId === sale.id 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-300' 
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 active:scale-95'
                          }`}
                          title="Copiar texto de estado para WhatsApp"
                        >
                          {copiedId === sale.id ? <Check size={14} /> : <Copy size={14} />}
                        </button>

                        <button
                          onClick={() => {
                            setSelectedSaleForModal(sale);
                            playSound('click');
                          }}
                          className="p-2 bg-slate-900 hover:bg-black text-white rounded-xl transition-all active:scale-95"
                          title="Ver detalle completo de seguimiento"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* TABLA COMPACTA */
              <div className="overflow-x-auto bg-slate-50 rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse font-sans">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="py-2.5 px-3"># Venta</th>
                      <th className="py-2.5 px-3">Cliente</th>
                      <th className="py-2.5 px-3">Producto</th>
                      <th className="py-2.5 px-3">Modalidad</th>
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-xs">
                    {paginatedSales.map((sale) => {
                      const statusInfo = formatShippingStatus(sale);
                      return (
                        <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 bg-slate-900 text-white rounded-md font-mono font-black text-[11px]">
                              #{sale.numeroVenta}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-black text-slate-900 uppercase text-xs">{sale.cliente}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{sale.telefono || 'Sin teléfono'}</p>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-700 text-xs">
                              {sale.codigoFardo || 'Fardo'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-bold text-slate-700 uppercase text-[11px]">{sale.tipoDespacho || 'Despacho'}</p>
                            <p className="text-[10px] text-slate-400">{sale.agencia || sale.transportista || ''}</p>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${statusInfo.badgeBg} ${statusInfo.badgeTextColor}`}>
                              {statusInfo.badgeText}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenWhatsApp(sale)}
                                className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-1"
                              >
                                <MessageSquare size={12} /> WhatsApp
                              </button>
                              <button
                                onClick={() => handleCopyStatus(sale)}
                                className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                              >
                                {copiedId === sale.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedSaleForModal(sale);
                                  playSound('click');
                                }}
                                className="p-1 bg-slate-900 text-white rounded-lg hover:bg-black"
                              >
                                <Eye size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {filteredSales.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-500">
                  Mostrando página <span className="font-black text-slate-900">{currentPage}</span> de <span className="font-black text-slate-900">{totalPages}</span> ({filteredSales.length} ventas)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-black text-xs uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1 shadow-xs"
                  >
                    <ChevronLeft size={14} /> Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-black text-xs uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1 shadow-xs"
                  >
                    Siguiente <ChevronRight size={14} />
                  </button>
                  <Link
                    to="/despachos"
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase hover:bg-black transition-all flex items-center gap-1 ml-2"
                  >
                    Ir a Despachos <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sale Tracking Detail Modal */}
      {selectedSaleForModal && (
        <SaleTrackingModal
          sale={selectedSaleForModal}
          stock={stock}
          onClose={() => setSelectedSaleForModal(null)}
          onLiberarJuntaCompra={handleLiberarJunta}
        />
      )}
    </div>
  );
}

