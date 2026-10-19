import React, { useState, useMemo } from 'react';
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  Download, 
  Printer, 
  Truck, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Users, 
  Tag, 
  Sparkles,
  BarChart3,
  Layers,
  ArrowUpRight,
  Filter,
  X,
  FileText,
  Boxes,
  Eye,
  Store,
  ExternalLink,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { Sale, StockItem, StaffRole } from '../../types';
import { useStore } from '../../store/GlobalContext';
import { isLautaroOrFardolandia, FARDOLANDIA_LOGO_URL } from '../../utils/partnerUtils';
import { PrintLabelsModal } from '../PrintLabelsModal';

interface FardolandiaPartnerReportProps {
  sales: Sale[];
  stock: StockItem[];
  currentUser: { nombre: string; rol: StaffRole } | null;
}

export const FardolandiaPartnerReport: React.FC<FardolandiaPartnerReportProps> = ({
  sales,
  stock,
  currentUser
}) => {
  const { playSound } = useStore();

  // Navigation & View state
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'resumen' | 'ventas' | 'productos'>('resumen');
  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState<Sale | null>(null);

  // Date Filter
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Search & Status filters for sales
  const [searchSale, setSearchSale] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'PAGADO' | 'PENDIENTE'>('ALL');
  const [dispatchFilter, setDispatchFilter] = useState<'ALL' | 'ENTREGADO' | 'PENDIENTE' | 'RETIRO'>('ALL');
  const [saleTypeFilter, setSaleTypeFilter] = useState<'ALL' | 'NORMAL' | 'LIVE' | 'NOTA_VENTA'>('ALL');

  // Pagination
  const [salesPage, setSalesPage] = useState<number>(1);
  const [productsPage, setProductsPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 8;

  // 1. Filtrar todas las ventas pertenecientes a Lautaro Jofré / Fardolandia
  const allLautaroSales = useMemo(() => {
    return (sales || []).filter(s => isLautaroOrFardolandia(s));
  }, [sales]);

  // Helper date parsing
  const parseSaleDate = (dateStr?: string, timestamp?: string): Date | null => {
    if (timestamp) {
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) return d;
    }
    if (!dateStr || typeof dateStr !== 'string') return null;
    try {
      if (dateStr.includes('/')) {
        const [d, m, y] = dateStr.split('/');
        return new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
      }
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts[0].length === 4) {
          const [y, m, d] = parts;
          return new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
        } else {
          const [d, m, y] = parts;
          return new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
        }
      }
      const parsed = new Date(dateStr);
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch {
      return null;
    }
  };

  // 2. Filtrar por rango de fechas
  const dateFilteredSales = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    return allLautaroSales.filter(sale => {
      const saleDate = parseSaleDate(sale.fecha, sale.timestamp);
      if (!saleDate) return true; // Si no hay fecha clara, no lo excluimos

      if (dateFilter === 'TODAY') {
        return saleDate >= todayStart && saleDate <= todayEnd;
      }
      if (dateFilter === 'WEEK') {
        const currentDay = now.getDay() === 0 ? 7 : now.getDay();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - currentDay + 1);
        startOfWeek.setHours(0, 0, 0, 0);
        return saleDate >= startOfWeek;
      }
      if (dateFilter === 'MONTH') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        return saleDate >= startOfMonth;
      }
      if (dateFilter === 'CUSTOM' && customStartDate && customEndDate) {
        const start = new Date(`${customStartDate}T00:00:00`);
        const end = new Date(`${customEndDate}T23:59:59`);
        return saleDate >= start && saleDate <= end;
      }
      return true;
    });
  }, [allLautaroSales, dateFilter, customStartDate, customEndDate]);

  // 3. Métricas y KPIs agregados del periodo
  const metrics = useMemo(() => {
    let totalVendido = 0;
    let totalFardos = 0;
    let totalPagado = 0;
    let totalPendientePago = 0;
    let totalDespachados = 0;
    let totalPendientesDespacho = 0;
    let totalRetiros = 0;

    dateFilteredSales.forEach(s => {
      const monto = Number(s.total) || 0;
      totalVendido += monto;

      // Unidades / Fardos
      const qty = s.items && s.items.length > 0
        ? s.items.reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0)
        : (Number(s.cantidad) || 1);
      totalFardos += qty;

      // Estado pago
      const estadoPagoNorm = (s.estadoPago || '').toUpperCase();
      if (estadoPagoNorm.includes('PAGADO')) {
        totalPagado += monto;
      } else {
        totalPendientePago += monto;
      }

      // Despacho
      const isRetiro = s.tipoDespacho?.toString().toUpperCase().includes('RETIRO') ||
                       (s.juntaCompra && s.juntaCompra.toUpperCase().includes('RETIRO')) ||
                       (s.agencia && s.agencia.toUpperCase().includes('RETIRO'));

      if (isRetiro) {
        totalRetiros++;
      }
      if (s.enviado || s.status === 'Enviado') {
        totalDespachados++;
      } else {
        totalPendientesDespacho++;
      }
    });

    const ordenesCount = dateFilteredSales.length;
    const ticketPromedio = ordenesCount > 0 ? Math.round(totalVendido / ordenesCount) : 0;
    const pctPagado = totalVendido > 0 ? Math.round((totalPagado / totalVendido) * 100) : 100;

    return {
      totalVendido,
      totalFardos,
      ordenesCount,
      ticketPromedio,
      totalPagado,
      totalPendientePago,
      pctPagado,
      totalDespachados,
      totalPendientesDespacho,
      totalRetiros
    };
  }, [dateFilteredSales]);

  // 4. Desglose de Productos más vendidos por Lautaro
  const productRanking = useMemo(() => {
    const map: Record<string, {
      codigo: string;
      tipo: string;
      cantidadVendida: number;
      montoTotal: number;
      ventasCount: number;
      stockActual: number;
      precioSugerido: number;
      proveedor: string;
    }> = {};

    dateFilteredSales.forEach(s => {
      const processItem = (codigo: string, qty: number, unitVal: number) => {
        const cleanCode = (codigo || 'S/C').trim().toUpperCase();
        const stockInfo = stock.find(st => st.codigo === cleanCode);
        const name = stockInfo?.tipo || s.variante || 'Fardo Especial';

        if (!map[cleanCode]) {
          map[cleanCode] = {
            codigo: cleanCode,
            tipo: name,
            cantidadVendida: 0,
            montoTotal: 0,
            ventasCount: 0,
            stockActual: stockInfo?.stockActual || 0,
            precioSugerido: stockInfo?.precioSugerido || unitVal,
            proveedor: stockInfo?.proveedor || 'MDF'
          };
        }

        map[cleanCode].cantidadVendida += qty;
        map[cleanCode].montoTotal += (unitVal * qty);
        map[cleanCode].ventasCount += 1;
      };

      if (s.items && s.items.length > 0) {
        s.items.forEach(it => {
          processItem(it.codigoFardo, Number(it.cantidad) || 1, Number(it.valorUnitario) || 0);
        });
      } else {
        processItem(s.codigoFardo || 'N/A', Number(s.cantidad) || 1, Number(s.valorUnitario) || Number(s.total) || 0);
      }
    });

    return Object.values(map).sort((a, b) => b.cantidadVendida - a.cantidadVendida);
  }, [dateFilteredSales, stock]);

  // 5. Tabla de ventas con búsqueda y filtros
  const filteredSalesList = useMemo(() => {
    return dateFilteredSales.filter(s => {
      // Búsqueda libre
      if (searchSale.trim()) {
        const query = searchSale.trim().toLowerCase();
        const matchesClient = (s.cliente || '').toLowerCase().includes(query);
        const matchesNum = (s.numeroVenta || '').toString().includes(query);
        const matchesPhone = (s.telefono || '').includes(query);
        const matchesCode = (s.codigoFardo || '').toLowerCase().includes(query);
        const matchesItems = s.items?.some(it => it.codigoFardo.toLowerCase().includes(query));

        if (!matchesClient && !matchesNum && !matchesPhone && !matchesCode && !matchesItems) {
          return false;
        }
      }

      // Filtro pago
      if (paymentFilter === 'PAGADO') {
        if (!(s.estadoPago || '').toUpperCase().includes('PAGADO')) return false;
      } else if (paymentFilter === 'PENDIENTE') {
        if ((s.estadoPago || '').toUpperCase().includes('PAGADO')) return false;
      }

      // Filtro despacho
      if (dispatchFilter === 'ENTREGADO') {
        if (!s.enviado && s.status !== 'Enviado') return false;
      } else if (dispatchFilter === 'PENDIENTE') {
        if (s.enviado || s.status === 'Enviado') return false;
      } else if (dispatchFilter === 'RETIRO') {
        const isRetiro = s.tipoDespacho?.toString().toUpperCase().includes('RETIRO') ||
                         (s.juntaCompra && s.juntaCompra.toUpperCase().includes('RETIRO')) ||
                         (s.agencia && s.agencia.toUpperCase().includes('RETIRO'));
        if (!isRetiro) return false;
      }

      // Filtro tipo venta
      if (saleTypeFilter !== 'ALL') {
        if (saleTypeFilter === 'LIVE' && s.tipoVenta !== 'Live TikTok') return false;
        if (saleTypeFilter === 'NOTA_VENTA' && s.tipoVenta !== 'Nota de Venta') return false;
        if (saleTypeFilter === 'NORMAL' && s.tipoVenta !== 'Normal') return false;
      }

      return true;
    }).sort((a, b) => (b.numeroVenta || 0) - (a.numeroVenta || 0));
  }, [dateFilteredSales, searchSale, paymentFilter, dispatchFilter, saleTypeFilter]);

  // Paginación
  const totalSalesPages = Math.max(1, Math.ceil(filteredSalesList.length / ITEMS_PER_PAGE));
  const paginatedSales = filteredSalesList.slice((salesPage - 1) * ITEMS_PER_PAGE, salesPage * ITEMS_PER_PAGE);

  const totalProductsPages = Math.max(1, Math.ceil(productRanking.length / ITEMS_PER_PAGE));
  const paginatedProducts = productRanking.slice((productsPage - 1) * ITEMS_PER_PAGE, productsPage * ITEMS_PER_PAGE);

  // Exportar a CSV
  const handleExportCSV = () => {
    playSound('click');
    if (filteredSalesList.length === 0) {
      alert("No hay ventas para exportar en este filtro.");
      return;
    }

    const headers = ["N° Venta", "Fecha", "Hora", "Cliente", "Teléfono", "RUT", "Dirección", "Tipo Venta", "Total CLP", "Estado Pago", "Despacho", "Agencia / Transportista", "Fardos"];
    const rows = filteredSalesList.map(s => {
      const itemsCount = s.items?.reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0) || s.cantidad || 1;
      return [
        s.numeroVenta,
        `"${s.fecha || ''}"`,
        `"${s.hora || ''}"`,
        `"${(s.cliente || '').replace(/"/g, '""')}"`,
        `"${s.telefono || ''}"`,
        `"${s.rut || ''}"`,
        `"${(s.direccion || '').replace(/"/g, '""')}"`,
        `"${s.tipoVenta || ''}"`,
        s.total || 0,
        `"${s.estadoPago || ''}"`,
        `"${s.enviado ? 'Despachado' : 'Pendiente'}"`,
        `"${s.agencia || s.transportista || ''}"`,
        itemsCount
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Ventas_Fardolandia_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isAdmin = !currentUser || currentUser.rol === 'Administrador' || currentUser.rol === StaffRole.ADMIN;
  const isLautaroUser = Boolean(currentUser && isLautaroOrFardolandia(currentUser.nombre));

  // Solo visible para cuenta Administrador o para el propio Lautaro
  if (!isAdmin && !isLautaroUser) {
    return null;
  }

  return (
    <div id="fardolandia-partner-dashboard-section" className="bg-white rounded-[44px] border-2 border-purple-200/90 shadow-2xl p-6 sm:p-10 space-y-8 relative overflow-hidden transition-all duration-300">
      
      {/* Background ambient decorative glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-fuchsia-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* 1. Header con Logo de Fardolandia y Resumen Ejecutivo */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-purple-100 relative z-10">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white border-2 border-purple-200 p-1.5 flex items-center justify-center shadow-lg shadow-purple-600/10 shrink-0 overflow-hidden">
            <img 
              src={FARDOLANDIA_LOGO_URL} 
              alt="Fardolandia Logo" 
              className="w-full h-full object-contain" 
            />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-0.5 bg-purple-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xs">
                Partner Mayorista Oficial
              </span>
              <span className="px-3 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded-full text-[10px] font-black uppercase tracking-wider">
                Lautaro Jofré
              </span>
              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[9px] font-bold uppercase hidden sm:inline-block">
                Catálogo & Bodega MDF
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase mt-1">
              Fardolandia <span className="text-purple-600 italic">Métricas y Ventas</span>
            </h3>
            <p className="text-slate-500 text-xs font-semibold mt-0.5">
              Control operativo exclusivo para Administrador • Lautaro trabaja con nuestro stock en instalaciones MDF
            </p>
          </div>
        </div>

        {/* Actions & Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
            <button
              onClick={() => { setDateFilter('ALL'); playSound('click'); }}
              className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${
                dateFilter === 'ALL' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Histórico
            </button>
            <button
              onClick={() => { setDateFilter('MONTH'); playSound('click'); }}
              className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${
                dateFilter === 'MONTH' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Este Mes
            </button>
            <button
              onClick={() => { setDateFilter('WEEK'); playSound('click'); }}
              className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${
                dateFilter === 'WEEK' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => { setDateFilter('TODAY'); playSound('click'); }}
              className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${
                dateFilter === 'TODAY' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hoy
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-xs"
            title="Exportar a archivo Excel / CSV"
          >
            <Download size={14} className="text-purple-600" /> Exportar
          </button>

          <button
            onClick={() => { setIsExpanded(!isExpanded); playSound('click'); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-xs"
          >
            {isExpanded ? (
              <>
                <ChevronUp size={16} /> Contraer
              </>
            ) : (
              <>
                <ChevronDown size={16} /> Ver Métricas ({allLautaroSales.length} Ventas)
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. KPI Cards (Se muestran tanto contraído como expandido) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative z-10">
        {/* Card 1: Total Facturado */}
        <div className="bg-gradient-to-br from-purple-950 via-slate-900 to-slate-900 text-white p-6 rounded-[32px] border border-purple-800/40 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-300">Total Vendido</span>
              <span className="p-2 bg-purple-600/30 text-purple-300 rounded-xl">
                <DollarSign size={16} />
              </span>
            </div>
            <h4 className="text-2xl sm:text-3xl font-black tracking-tight mt-2 font-mono text-purple-50">
              ${metrics.totalVendido.toLocaleString('es-CL')}
            </h4>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-4 text-[10px]">
            <span className="text-slate-400 font-bold uppercase">Ticket Promedio</span>
            <span className="font-mono font-black text-purple-300">${metrics.ticketPromedio.toLocaleString('es-CL')}</span>
          </div>
        </div>

        {/* Card 2: Fardos / Unidades */}
        <div className="bg-white p-6 rounded-[32px] border border-purple-100 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Fardos Movilizados</span>
              <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <Boxes size={16} />
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <h4 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
                {metrics.totalFardos}
              </h4>
              <span className="text-xs font-bold text-slate-400 uppercase">Fardos</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-4 text-[10px]">
            <span className="text-slate-400 font-bold uppercase">En {metrics.ordenesCount} órdenes</span>
            <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              {metrics.ordenesCount > 0 ? (metrics.totalFardos / metrics.ordenesCount).toFixed(1) : 0} fardos/orden
            </span>
          </div>
        </div>

        {/* Card 3: Cobros & Pagos */}
        <div className="bg-white p-6 rounded-[32px] border border-purple-100 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Estado de Cobro</span>
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <CreditCard size={16} />
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <h4 className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight font-mono">
                ${metrics.totalPagado.toLocaleString('es-CL')}
              </h4>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                {metrics.pctPagado}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-4 text-[10px]">
            <span className="text-slate-400 font-bold uppercase">Por Cobrar:</span>
            <span className={`font-mono font-black ${metrics.totalPendientePago > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              ${metrics.totalPendientePago.toLocaleString('es-CL')}
            </span>
          </div>
        </div>

        {/* Card 4: Despachos y Logística */}
        <div className="bg-white p-6 rounded-[32px] border border-purple-100 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Logística & Salidas</span>
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Truck size={16} />
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <h4 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
                {metrics.totalDespachados}
              </h4>
              <span className="text-xs font-bold text-slate-400 uppercase">Enviados</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-4 text-[10px]">
            <span className="text-slate-400 font-bold uppercase">En bodega / prep:</span>
            <span className="font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              {metrics.totalPendientesDespacho} pendientes
            </span>
          </div>
        </div>
      </div>

      {/* 3. Panel Expandido con Pestañas: Resumen, Detalle de Ventas, Ranking de Productos */}
      {isExpanded && (
        <div className="space-y-6 pt-4 border-t border-purple-100 animate-in fade-in duration-300">
          
          {/* Navigation Bar inside report */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button
                onClick={() => { setActiveTab('resumen'); playSound('click'); }}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeTab === 'resumen' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 size={14} /> Resumen General
              </button>
              <button
                onClick={() => { setActiveTab('ventas'); playSound('click'); }}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeTab === 'ventas' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText size={14} /> Registro de Ventas ({filteredSalesList.length})
              </button>
              <button
                onClick={() => { setActiveTab('productos'); playSound('click'); }}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeTab === 'productos' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package size={14} /> Fardos Más Vendidos ({productRanking.length})
              </button>
            </div>

            {/* Banner aclaratorio para Administrador */}
            <div className="flex items-center gap-2 bg-purple-50 text-purple-900 border border-purple-200 px-3.5 py-1.5 rounded-2xl text-[11px] font-bold">
              <ShieldCheck size={14} className="text-purple-600 shrink-0" />
              <span>Etiquetas térmicas de estas ventas salen impresas automáticamente con el logo de Fardolandia</span>
            </div>
          </div>

          {/* TAB 1: RESUMEN GENERAL Y DESGLOSES */}
          {activeTab === 'resumen' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
              
              {/* Desglose por Canal de Venta */}
              <div className="bg-slate-50/80 p-6 rounded-3xl border border-slate-200/80 space-y-4">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Tag size={14} className="text-purple-600" /> Canal de Venta
                </h4>
                <div className="space-y-3">
                  {[
                    { tipo: 'Normal', label: 'Venta Tradicional', color: 'emerald' },
                    { tipo: 'Live TikTok', label: 'Transmisión TikTok', color: 'purple' },
                    { tipo: 'Nota de Venta', label: 'Nota de Venta / Mayorista', color: 'blue' }
                  ].map(channel => {
                    const matching = dateFilteredSales.filter(s => s.tipoVenta === channel.tipo);
                    const total = matching.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
                    const qty = matching.length;
                    const pct = metrics.totalVendido > 0 ? Math.round((total / metrics.totalVendido) * 100) : 0;
                    return (
                      <div key={channel.tipo} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-800 uppercase">{channel.label}</span>
                          <span className="font-mono text-xs font-black text-slate-900">${total.toLocaleString('es-CL')}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                          <span>{qty} ventas registradas</span>
                          <span className="text-purple-600 font-mono">{pct}% del volumen</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-purple-600 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Métodos de Despacho y Entrega */}
              <div className="bg-slate-50/80 p-6 rounded-3xl border border-slate-200/80 space-y-4">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Truck size={14} className="text-purple-600" /> Modalidad de Entrega
                </h4>
                <div className="space-y-3">
                  {(() => {
                    const retiros = dateFilteredSales.filter(s => 
                      s.tipoDespacho?.toString().toUpperCase().includes('RETIRO') ||
                      (s.juntaCompra && s.juntaCompra.toUpperCase().includes('RETIRO')) ||
                      (s.agencia && s.agencia.toUpperCase().includes('RETIRO'))
                    ).length;

                    const agencias = dateFilteredSales.filter(s => 
                      s.tipoDespacho?.toString().toUpperCase().includes('AGENCIA') ||
                      (s.agencia && !s.agencia.toUpperCase().includes('RETIRO') && s.agencia !== 'DOMICILIO')
                    ).length;

                    const domicilios = Math.max(0, dateFilteredSales.length - retiros - agencias);

                    return [
                      { label: 'Retiro en Bodega MDF', count: retiros, color: 'indigo' },
                      { label: 'Envíos por Agencia (Starken, etc.)', count: agencias, color: 'blue' },
                      { label: 'Despacho a Domicilio', count: domicilios, color: 'emerald' }
                    ].map((item, idx) => {
                      const pct = dateFilteredSales.length > 0 ? Math.round((item.count / dateFilteredSales.length) * 100) : 0;
                      return (
                        <div key={idx} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-800 uppercase">{item.label}</span>
                            <span className="font-mono text-xs font-black text-slate-900">{item.count} envíos</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                            <span>Distribución</span>
                            <span className="text-purple-600 font-mono">{pct}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-purple-600 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Destacados y Top Fardos Rápido */}
              <div className="bg-slate-50/80 p-6 rounded-3xl border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles size={14} className="text-purple-600" /> Top Fardos Movilizados
                  </h4>
                  <button 
                    onClick={() => setActiveTab('productos')}
                    className="text-[10px] font-black text-purple-700 hover:underline uppercase"
                  >
                    Ver Todos
                  </button>
                </div>

                <div className="space-y-2.5">
                  {productRanking.slice(0, 4).map((p, idx) => (
                    <div key={p.codigo} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 font-black text-[10px] flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-900 truncate uppercase">{p.tipo}</p>
                          <span className="text-[10px] font-mono text-slate-400 font-bold">[{p.codigo}] • Stock MDF: {p.stockActual}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-xs font-black text-purple-700 block">{p.cantidadVendida} fardos</span>
                        <span className="text-[9px] font-mono text-slate-400">${p.montoTotal.toLocaleString('es-CL')}</span>
                      </div>
                    </div>
                  ))}

                  {productRanking.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-xs italic">
                      No hay productos registrados en el periodo seleccionado.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: REGISTRO DETALLADO DE VENTAS FARDOLANDIA */}
          {activeTab === 'ventas' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              
              {/* Barra de Búsqueda y Filtros */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-3xl border border-slate-200">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchSale}
                    onChange={e => { setSearchSale(e.target.value); setSalesPage(1); }}
                    placeholder="Buscar por cliente, N° venta, fardo o teléfono..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-purple-500 shadow-2xs"
                  />
                  {searchSale && (
                    <button 
                      onClick={() => setSearchSale('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={paymentFilter}
                    onChange={e => { setPaymentFilter(e.target.value as any); setSalesPage(1); }}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value="ALL">Todos los Pagos</option>
                    <option value="PAGADO">Pagado</option>
                    <option value="PENDIENTE">Pendiente</option>
                  </select>

                  <select
                    value={dispatchFilter}
                    onChange={e => { setDispatchFilter(e.target.value as any); setSalesPage(1); }}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value="ALL">Todos los Despachos</option>
                    <option value="ENTREGADO">Despachados / Enviados</option>
                    <option value="PENDIENTE">En Preparación</option>
                    <option value="RETIRO">Retiro en Bodega</option>
                  </select>

                  <select
                    value={saleTypeFilter}
                    onChange={e => { setSaleTypeFilter(e.target.value as any); setSalesPage(1); }}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value="ALL">Todo Canal</option>
                    <option value="NORMAL">Normal</option>
                    <option value="LIVE">Live TikTok</option>
                    <option value="NOTA_VENTA">Nota de Venta</option>
                  </select>
                </div>
              </div>

              {/* Tabla de Ventas */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-purple-950 text-white font-black uppercase text-[10px] tracking-wider">
                        <th className="py-3.5 px-4">N° Venta</th>
                        <th className="py-3.5 px-4">Fecha / Hora</th>
                        <th className="py-3.5 px-4">Cliente</th>
                        <th className="py-3.5 px-4">Fardo / Productos</th>
                        <th className="py-3.5 px-4 text-center">Despacho</th>
                        <th className="py-3.5 px-4 text-center">Estado Pago</th>
                        <th className="py-3.5 px-4 text-right">Total CLP</th>
                        <th className="py-3.5 px-4 text-center">Etiqueta Fardolandia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedSales.map((sale) => {
                        const itemsCount = sale.items?.reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0) || sale.cantidad || 1;
                        const isPagado = (sale.estadoPago || '').toUpperCase().includes('PAGADO');

                        return (
                          <tr key={sale.id} className="hover:bg-purple-50/40 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-black text-slate-900">
                              #{sale.numeroVenta}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                              {sale.fecha || 'S/F'}{sale.hora ? ` • ${sale.hora}` : ''}
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-black text-slate-900 uppercase">{sale.cliente}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{sale.telefono || 'Sin teléfono'}</p>
                            </td>
                            <td className="py-3.5 px-4">
                              {sale.items && sale.items.length > 0 ? (
                                <div className="space-y-0.5">
                                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-black text-[10px] uppercase">
                                    Nota de Venta ({itemsCount} fardos)
                                  </span>
                                  <p className="text-[10px] text-slate-500 font-mono truncate max-w-xs">
                                    {sale.items.map(it => `[${it.codigoFardo}] x${it.cantidad}`).join(', ')}
                                  </p>
                                </div>
                              ) : (
                                <div>
                                  <span className="font-mono font-bold text-slate-800">[{sale.codigoFardo || 'N/A'}]</span>
                                  <span className="text-[10px] text-slate-500 ml-1.5 uppercase font-medium">({sale.cantidad || 1} fardo)</span>
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                sale.enviado 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {sale.enviado ? 'Enviado' : 'En Preparación'}
                              </span>
                              <span className="block text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                                {sale.agencia || sale.transportista || 'Bodega'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                isPagado 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-rose-100 text-rose-700'
                              }`}>
                                {sale.estadoPago || 'Pendiente'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
                              ${(Number(sale.total) || 0).toLocaleString('es-CL')}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => {
                                  setSelectedSaleForPrint(sale);
                                  playSound('click');
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-[10px] uppercase tracking-wider transition-all shadow-xs"
                                title="Ver e imprimir etiqueta térmica con logo de Fardolandia"
                              >
                                <Printer size={12} />
                                Imprimir
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {paginatedSales.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                            No se encontraron ventas para Fardolandia con los filtros aplicados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginación de Ventas */}
                {totalSalesPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
                    <span className="text-xs font-bold text-slate-500">
                      Página <span className="font-black text-slate-900">{salesPage}</span> de <span className="font-black text-slate-900">{totalSalesPages}</span> ({filteredSalesList.length} ventas)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSalesPage(p => Math.max(1, p - 1))}
                        disabled={salesPage <= 1}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-black text-xs uppercase disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1"
                      >
                        <ChevronLeft size={14} /> Anterior
                      </button>
                      <button
                        onClick={() => setSalesPage(p => Math.min(totalSalesPages, p + 1))}
                        disabled={salesPage >= totalSalesPages}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-black text-xs uppercase disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1"
                      >
                        Siguiente <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: RANKING DE FARDOS Y PRODUCTOS */}
          {activeTab === 'productos' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-purple-950 text-white font-black uppercase text-[10px] tracking-wider">
                        <th className="py-3.5 px-4">Posición</th>
                        <th className="py-3.5 px-4">Código SKU</th>
                        <th className="py-3.5 px-4">Descripción del Fardo</th>
                        <th className="py-3.5 px-4 text-center">Proveedor Origen</th>
                        <th className="py-3.5 px-4 text-center">Stock MDF Disponible</th>
                        <th className="py-3.5 px-4 text-center">Fardos Vendidos</th>
                        <th className="py-3.5 px-4 text-right">Total Facturado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedProducts.map((p, idx) => {
                        const globalIdx = (productsPage - 1) * ITEMS_PER_PAGE + idx + 1;
                        return (
                          <tr key={p.codigo} className="hover:bg-purple-50/40 transition-colors">
                            <td className="py-3.5 px-4 font-black">
                              <span className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center ${
                                globalIdx === 1 ? 'bg-amber-400 text-slate-900 shadow-sm' :
                                globalIdx === 2 ? 'bg-slate-200 text-slate-800' :
                                globalIdx === 3 ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-600'
                              }`}>
                                #{globalIdx}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-black text-purple-700">
                              {p.codigo}
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-black text-slate-900 uppercase">{p.tipo}</p>
                              <span className="text-[10px] text-slate-400">En {p.ventasCount} ventas diferentes</span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase">
                                {p.proveedor}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black font-mono ${
                                p.stockActual > 3 ? 'bg-emerald-100 text-emerald-800' :
                                p.stockActual > 0 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-700'
                              }`}>
                                {p.stockActual} u.
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono font-black text-sm text-purple-900">
                              {p.cantidadVendida} fardos
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
                              ${p.montoTotal.toLocaleString('es-CL')}
                            </td>
                          </tr>
                        );
                      })}

                      {paginatedProducts.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                            No hay productos registrados en el periodo seleccionado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginación de Productos */}
                {totalProductsPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
                    <span className="text-xs font-bold text-slate-500">
                      Página <span className="font-black text-slate-900">{productsPage}</span> de <span className="font-black text-slate-900">{totalProductsPages}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setProductsPage(p => Math.max(1, p - 1))}
                        disabled={productsPage <= 1}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-black text-xs uppercase disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1"
                      >
                        <ChevronLeft size={14} /> Anterior
                      </button>
                      <button
                        onClick={() => setProductsPage(p => Math.min(totalProductsPages, p + 1))}
                        disabled={productsPage >= totalProductsPages}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-black text-xs uppercase disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1"
                      >
                        Siguiente <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Modal de Impresión de Etiquetas con el Logo de Fardolandia */}
      {selectedSaleForPrint && (
        <PrintLabelsModal
          sale={selectedSaleForPrint}
          stock={stock}
          isOpen={Boolean(selectedSaleForPrint)}
          onClose={() => setSelectedSaleForPrint(null)}
        />
      )}

    </div>
  );
};
