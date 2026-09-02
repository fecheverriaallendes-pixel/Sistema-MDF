
import React, { useMemo, useState } from 'react';
import { ReportModal } from '../components/ReportModal';
import { 
  TrendingUp, 
  Package, 
  DollarSign,
  AlertCircle,
  ArrowRight,
  Zap,
  Ticket,
  RefreshCw,
  Cloud,
  PieChart,
  BarChart3,
  Users,
  ArrowUpRight,
  LayoutDashboard,
  FileText,
  Truck,
  Boxes,
  Layers,
  Search,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { useStore } from '../store/GlobalContext';
import { Sale } from '../types';

const StatCard = ({ title, value, icon: Icon, color, subtitle, trend, to }: any) => {
  const content = (
    <div className={`bg-white p-7 rounded-[40px] border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.03)] relative overflow-hidden group hover:shadow-xl transition-all duration-500 ${to ? 'cursor-pointer' : ''}`}>
      <div className={`absolute -right-6 -top-6 w-28 h-28 bg-${color}-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 scale-150`}></div>
      <div className={`w-14 h-14 rounded-2xl bg-${color}-50 text-${color}-600 flex items-center justify-center mb-6 relative z-10 transition-transform group-hover:rotate-6`}>
        <Icon size={28} />
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">{title}</p>
        <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
        <div className="flex items-center justify-between mt-3">
          <p className="text-[10px] text-slate-400 font-bold uppercase">{subtitle}</p>
          {trend && (
            <span className="flex items-center text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
              <ArrowUpRight size={12} className="mr-1" /> {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (to) {
    return <Link to={to}>{content}</Link>;
  }
  return content;
};

export default function Dashboard() {
  const { getStats, getReportData, syncWithCloud, isSyncing, settings, sales, stock, coupons } = useStore();
  const [reportState, setReportState] = React.useState<{isOpen: boolean, type: 'weekly' | 'monthly' | 'custom', sales: Sale[]}>({isOpen: false, type: 'weekly', sales: []});
  const [dateRange, setDateRange] = React.useState({ start: '', end: '' });
  const [juntaSearchTerm, setJuntaSearchTerm] = useState('');
  const [juntaViewMode, setJuntaViewMode] = useState<'clientes' | 'ventas'>('clientes');
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [isJuntaExpanded, setIsJuntaExpanded] = useState(false);
  const [clientPage, setClientPage] = useState(1);
  const [salePage, setSalePage] = useState(1);
  const CLIENTS_PER_PAGE = 5;
  const SALES_PER_PAGE = 6;
  
  const stats = getStats();

  const pendingCoupons = coupons.filter(c => !c.used).length;
  const totalPendingValue = coupons.filter(c => !c.used).reduce((acc, c) => acc + c.value, 0);

  const openReport = (type: 'weekly' | 'monthly' | 'custom') => {
    if (type === 'custom') {
      if (!dateRange.start || !dateRange.end) {
        alert("Por favor selecciona ambas fechas");
        return;
      }
      setReportState({ isOpen: true, type, sales: getReportData(type, new Date(dateRange.start), new Date(dateRange.end)) });
    } else {
      setReportState({ isOpen: true, type, sales: getReportData(type) });
    }
  };

  // Procesar datos para el gráfico de área (Ventas últimos 7 días)
  const chartData = useMemo(() => {
    const days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString();
    });

    return days.map(day => {
      const daySales = sales.filter(s => s.fecha === day);
      const total = daySales.reduce((acc, s) => acc + s.total, 0);
      return { name: day.split('/')[0], total };
    });
  }, [sales]);

  // Junta Compra análisis detallado
  const isJunta = (s: Sale) => Boolean(s.juntaCompra && s.juntaCompra.trim().toUpperCase().includes('JUNTA'));
  
  const juntaPendingSales = useMemo(() => {
    return (sales || []).filter(s => s.status === 'Pendiente' && isJunta(s));
  }, [sales]);

  const juntaByCustomer = useMemo(() => {
    const map: Record<string, {
      cliente: string;
      telefono?: string;
      rut?: string;
      direccion?: string;
      ventas: Sale[];
      totalFardos: number;
      montoTotal: number;
      vendedores: string[];
    }> = {};

    juntaPendingSales.forEach(sale => {
      const clientKey = (sale.cliente || 'CLIENTE SIN NOMBRE').trim().toUpperCase();
      if (!map[clientKey]) {
        map[clientKey] = {
          cliente: sale.cliente || 'Sin Nombre',
          telefono: sale.telefono,
          rut: sale.rut,
          direccion: sale.direccion,
          ventas: [],
          totalFardos: 0,
          montoTotal: 0,
          vendedores: []
        };
      }
      map[clientKey].ventas.push(sale);
      const qty = sale.items && sale.items.length > 0 
        ? sale.items.reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0)
        : (Number(sale.cantidad) || 1);
      map[clientKey].totalFardos += qty;
      map[clientKey].montoTotal += (Number(sale.total) || 0);
      if (sale.vendedor && !map[clientKey].vendedores.includes(sale.vendedor)) {
        map[clientKey].vendedores.push(sale.vendedor);
      }
    });

    return Object.values(map).sort((a, b) => b.totalFardos - a.totalFardos);
  }, [juntaPendingSales]);

  const filteredJuntaCustomers = useMemo(() => {
    if (!juntaSearchTerm.trim()) return juntaByCustomer;
    const term = juntaSearchTerm.toLowerCase().trim();
    return juntaByCustomer.filter(c => 
      c.cliente.toLowerCase().includes(term) ||
      (c.telefono || '').toLowerCase().includes(term) ||
      c.ventas.some(v => 
        v.numeroVenta?.toString().includes(term) ||
        (v.codigoFardo || '').toLowerCase().includes(term) ||
        (v.vendedor || '').toLowerCase().includes(term) ||
        v.items?.some(it => it.codigoFardo?.toLowerCase().includes(term))
      )
    );
  }, [juntaByCustomer, juntaSearchTerm]);

  const filteredJuntaSales = useMemo(() => {
    if (!juntaSearchTerm.trim()) return juntaPendingSales;
    const term = juntaSearchTerm.toLowerCase().trim();
    return juntaPendingSales.filter(s =>
      s.cliente.toLowerCase().includes(term) ||
      s.numeroVenta?.toString().includes(term) ||
      (s.codigoFardo || '').toLowerCase().includes(term) ||
      (s.vendedor || '').toLowerCase().includes(term) ||
      (s.telefono || '').toLowerCase().includes(term) ||
      s.items?.some(it => it.codigoFardo?.toLowerCase().includes(term))
    );
  }, [juntaPendingSales, juntaSearchTerm]);

  const totalClientPages = Math.max(1, Math.ceil(filteredJuntaCustomers.length / CLIENTS_PER_PAGE));
  const paginatedJuntaCustomers = useMemo(() => {
    const start = (clientPage - 1) * CLIENTS_PER_PAGE;
    return filteredJuntaCustomers.slice(start, start + CLIENTS_PER_PAGE);
  }, [filteredJuntaCustomers, clientPage]);

  const totalSalePages = Math.max(1, Math.ceil(filteredJuntaSales.length / SALES_PER_PAGE));
  const paginatedJuntaSales = useMemo(() => {
    const start = (salePage - 1) * SALES_PER_PAGE;
    return filteredJuntaSales.slice(start, start + SALES_PER_PAGE);
  }, [filteredJuntaSales, salePage]);

  const handleSearchChange = (val: string) => {
    setJuntaSearchTerm(val);
    setClientPage(1);
    setSalePage(1);
  };

  const handleViewModeChange = (mode: 'clientes' | 'ventas') => {
    setJuntaViewMode(mode);
    setClientPage(1);
    setSalePage(1);
  };

  const pendingBySeller = useMemo(() => {
    const summary: Record<string, {
      vendedor: string;
      incompletas: number;
      sinEtiquetar: number;
      sinPagar: number;
      totalPendientes: number;
    }> = {};

    sales.forEach(s => {
      if (!s) return;
      const seller = s.vendedor || 'SISTEMA';
      
      const isIncompleta = !s.datosCompletos;
      const isSinEtiquetar = s.datosCompletos && !s.impresa;
      const isSinPagar = s.estadoPago !== 'Pagado';

      if (isIncompleta || isSinEtiquetar || isSinPagar) {
        if (!summary[seller]) {
          summary[seller] = {
            vendedor: seller,
            incompletas: 0,
            sinEtiquetar: 0,
            sinPagar: 0,
            totalPendientes: 0
          };
        }
        
        if (isIncompleta) summary[seller].incompletas++;
        if (isSinEtiquetar) summary[seller].sinEtiquetar++;
        if (isSinPagar) summary[seller].sinPagar++;
        
        summary[seller].totalPendientes = 
          summary[seller].incompletas + 
          summary[seller].sinEtiquetar + 
          summary[seller].sinPagar;
      }
    });

    return Object.values(summary).sort((a, b) => b.totalPendientes - a.totalPendientes);
  }, [sales]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-4">
            <LayoutDashboard size={14} /> Sistema Inteligente v2.5
          </div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tight uppercase">Dashboard <span className="text-emerald-500 italic">MDF</span></h2>
          <p className="text-slate-500 font-medium italic mt-2">Inteligencia de negocios y control operativo centralizado</p>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-[24px]">
             <input type="date" onChange={e => setDateRange({...dateRange, start: e.target.value})} className="px-4 py-2 rounded-xl border-none outline-none text-xs font-bold" />
             <span className="text-slate-400 font-black">A</span>
             <input type="date" onChange={e => setDateRange({...dateRange, end: e.target.value})} className="px-4 py-2 rounded-xl border-none outline-none text-xs font-bold" />
             <button 
              onClick={() => openReport('custom')}
              className="px-6 py-2 bg-amber-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition-all active:scale-95"
            >
              Histórico
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button 
              onClick={() => openReport('weekly')}
              className="flex items-center gap-3 px-6 py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-[24px] font-black text-xs uppercase tracking-widest hover:border-amber-200 transition-all shadow-sm active:scale-95"
            >
              <FileText size={18} /> Reporte Semanal
            </button>
            
            <button 
              onClick={() => openReport('monthly')}
              className="flex items-center gap-3 px-6 py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-[24px] font-black text-xs uppercase tracking-widest hover:border-amber-200 transition-all shadow-sm active:scale-95"
            >
              <FileText size={18} /> Reporte Mensual
            </button>

            <button 
              onClick={() => syncWithCloud()}
              disabled={isSyncing}
              className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-[24px] font-black text-xs uppercase tracking-widest hover:border-slate-300 transition-all shadow-sm active:scale-95"
            >
              <RefreshCw className={isSyncing ? 'animate-spin text-blue-500' : 'text-slate-400'} size={18} /> 
              {isSyncing ? 'Actualizando...' : 'Refrescar'}
            </button>
          </div>
          
          {stats.stockCritico > 0 && (
            <Link 
              to="/stock"
              className="flex items-center justify-center gap-3 bg-red-500 text-white px-8 py-4 rounded-[24px] font-black animate-pulse shadow-xl shadow-red-500/20 text-xs uppercase tracking-widest"
            >
              <AlertCircle size={18} />
              {stats.stockCritico} Alertas Stock
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          title="Ventas de Hoy" 
          value={`$${stats.ventasHoy.toLocaleString()}`} 
          icon={TrendingUp} 
          color="emerald" 
          subtitle={`${stats.countHoy} órdenes cerradas`}
          trend="+12%"
        />
        <StatCard 
          title="Valor Bodega" 
          value={`$${stats.valorInventarioVenta.toLocaleString()}`} 
          icon={Package} 
          color="amber" 
          subtitle={`${stats.disponibles} fardos en stock`}
        />
        {/* KPI DESTACADO JUNTA COMPRA */}
        <StatCard 
          title="📦 Junta Compra" 
          value={`${stats.juntaCompraVentas} Ventas`} 
          icon={Boxes} 
          color="indigo" 
          subtitle={`${stats.juntaCompraProductos} productos/fardos en custodia`}
          trend={`$${(stats.juntaCompraMonto || 0).toLocaleString('es-CL')}`}
          to="/despachos?tab=JUNTA_COMPRA"
        />
        <StatCard 
          title="Eficiencia TikTok" 
          value={stats.pendientesDatos > 0 ? `${stats.pendientesDatos} Pend.` : 'Óptima'} 
          icon={Zap} 
          color="purple" 
          subtitle="Datos de envío faltantes"
        />
        <StatCard title="Falta Completar" value={stats.faltaCompletar} icon={AlertCircle} color="red" subtitle="Pedidos con datos incompletos" />
        <StatCard title="Falta Pagar" value={stats.faltaPagar} icon={DollarSign} color="amber" subtitle="Pedidos pendientes de pago" />
        <StatCard title="Falta Despachar" value={stats.faltaDespachar} icon={Truck} color="blue" subtitle="Pedidos listos para salir" to="/despachos" />
        <StatCard title="Cupones Pendientes" value={pendingCoupons} icon={Ticket} color="emerald" subtitle="Cupones por canjear" />
      </div>

      {/* SECCIÓN DEDICADA: CONTROL OPERATIVO DE JUNTA COMPRA (COMPACTA Y OPTIMIZADA) */}
      <div className="bg-white p-6 md:p-8 rounded-[40px] border-2 border-indigo-100 shadow-xl overflow-hidden relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-indigo-50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0">
              <Boxes size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Custodia y Acumulación
                </span>
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest hidden sm:inline-block">
                  Bodega • Despachos
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight mt-1">
                Control Operativo de <span className="text-indigo-600">JUNTA COMPRA</span>
              </h3>
              <p className="text-slate-500 text-xs font-semibold">
                {stats.juntaCompraVentas} ventas retenidas para consolidación física en bodega
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-indigo-50/70 p-2 rounded-2xl border border-indigo-100/80">
              <div className="text-center px-2.5 py-1.5 bg-white rounded-xl shadow-xs">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Ventas</p>
                <p className="text-sm font-black text-indigo-600">{stats.juntaCompraVentas}</p>
              </div>
              <div className="text-center px-2.5 py-1.5 bg-white rounded-xl shadow-xs">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fardos</p>
                <p className="text-sm font-black text-emerald-600">{stats.juntaCompraProductos} u.</p>
              </div>
              <div className="text-center px-2.5 py-1.5 bg-white rounded-xl shadow-xs">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Clientes</p>
                <p className="text-sm font-black text-purple-600">{stats.juntaCompraClientes}</p>
              </div>
              <div className="text-center px-2.5 py-1.5 bg-white rounded-xl shadow-xs">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Monto</p>
                <p className="text-xs font-black text-slate-900 font-mono">${(stats.juntaCompraMonto || 0).toLocaleString('es-CL')}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsJuntaExpanded(!isJuntaExpanded)}
                className={`px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 border ${
                  isJuntaExpanded
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                }`}
              >
                {isJuntaExpanded ? (
                  <>
                    <ChevronUp size={16} /> Contraer Vista
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} /> Vista Rápida ({filteredJuntaCustomers.length})
                  </>
                )}
              </button>

              <Link 
                to="/despachos?tab=JUNTA_COMPRA"
                className="px-5 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-md shrink-0"
              >
                <Truck size={16} /> Módulo Despachos <ExternalLink size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* MODO CONTRAÍDO: BANNER EJECUTIVO LIMPIO */}
        {!isJuntaExpanded && (
          <div className="mt-5 p-5 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 rounded-2xl border border-indigo-100/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Package size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  <span className="font-black text-indigo-600">{stats.juntaCompraVentas} ventas</span> retenidas para consolidación física ({stats.juntaCompraProductos} fardos distribuidos en {stats.juntaCompraClientes} clientes).
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  La vista rápida está acotada para mantener el Dashboard ligero. Puedes expandir una vista previa paginada o gestionar todo en el módulo dedicado de Despachos.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsJuntaExpanded(true)}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <ChevronDown size={14} /> Ver Vista Rápida
              </button>
              <Link
                to="/despachos?tab=JUNTA_COMPRA"
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5"
              >
                <ExternalLink size={14} /> Despachar
              </Link>
            </div>
          </div>
        )}

        {/* MODO EXPANDIDO: VISTA RÁPIDA CON BÚSQUEDA Y PAGINACIÓN LIMITADA */}
        {isJuntaExpanded && (
          <div className="mt-6 space-y-5 animate-in fade-in duration-300">
            {/* Toolbar & Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  placeholder="Buscar por cliente, fardo, # venta o vendedor..."
                  value={juntaSearchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-xs outline-none focus:border-indigo-500 uppercase transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                  <button
                    onClick={() => handleViewModeChange('clientes')}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${juntaViewMode === 'clientes' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Clientes ({filteredJuntaCustomers.length})
                  </button>
                  <button
                    onClick={() => handleViewModeChange('ventas')}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${juntaViewMode === 'ventas' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Ventas ({filteredJuntaSales.length})
                  </button>
                </div>
              </div>
            </div>

            {/* Content View delimitada con max-height */}
            <div className="max-h-[440px] overflow-y-auto pr-1">
              {juntaPendingSales.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 size={24} />
                  </div>
                  <h4 className="text-sm font-black text-slate-800 uppercase">Sin Pedidos en Junta Compra</h4>
                  <p className="text-slate-400 text-xs mt-1 font-medium">Actualmente no hay ventas acumulándose en espera de consolidación.</p>
                </div>
              ) : juntaViewMode === 'clientes' ? (
                <div className="space-y-3">
                  {paginatedJuntaCustomers.map((cust) => {
                    const isExpanded = expandedClient === cust.cliente;
                    return (
                      <div 
                        key={cust.cliente}
                        className="bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200/80 p-4 transition-all overflow-hidden"
                      >
                        <div 
                          onClick={() => setExpandedClient(isExpanded ? null : cust.cliente)}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                              {cust.totalFardos}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{cust.cliente}</h4>
                                {cust.totalFardos > 1 && (
                                  <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-[8px] font-black uppercase tracking-wider shadow-xs">
                                    {cust.totalFardos} Fardos
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                                {cust.ventas.length} {cust.ventas.length === 1 ? 'Venta' : 'Ventas'} • {cust.telefono || 'Sin Teléfono'} • Vendedor: {cust.vendedores.join(', ')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-auto">
                            <div className="text-right">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Acumulado</span>
                              <span className="text-sm font-black text-slate-900 font-mono">${cust.montoTotal.toLocaleString('es-CL')}</span>
                            </div>
                            <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </div>
                        </div>

                        {/* Expanded sale items */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-slate-200 space-y-2 animate-in fade-in duration-300">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Detalle de Ventas:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {cust.ventas.map((v) => (
                                <div key={v.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
                                  <div className="flex justify-between items-center">
                                    <span className="px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black uppercase rounded-md">
                                      Venta #{v.numeroVenta}
                                    </span>
                                    <span className={`px-2 py-0.5 text-[8px] font-black rounded-full uppercase ${v.estadoPago === 'Pagado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                      {v.estadoPago || 'Pendiente'}
                                    </span>
                                  </div>

                                  {v.items && v.items.length > 0 ? (
                                    <div className="space-y-1">
                                      {v.items.map((it, idx) => {
                                        const stockInfo = stock.find(st => st.codigo === it.codigoFardo);
                                        return (
                                          <div key={idx} className="flex justify-between items-center text-[11px] font-bold text-slate-700 bg-slate-50 p-1.5 rounded-lg">
                                            <span className="font-mono text-indigo-600">{it.cantidad}x [{it.codigoFardo}] {stockInfo?.tipo || 'Fardo'}</span>
                                            <span className="font-mono text-slate-500">${(it.valorUnitario * it.cantidad).toLocaleString('es-CL')}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 bg-slate-50 p-1.5 rounded-lg">
                                      <span className="font-mono text-indigo-600">{v.cantidad || 1}x [{v.codigoFardo}] {v.variante || 'Fardo'}</span>
                                      <span className="font-mono text-slate-500">${(v.total || 0).toLocaleString('es-CL')}</span>
                                    </div>
                                  )}

                                  <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase pt-0.5">
                                    <span>{v.fecha}</span>
                                    <span className="text-slate-600">{v.vendedor}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="overflow-x-auto bg-slate-50/50 rounded-2xl border border-slate-200/80">
                  <table className="w-full text-left border-collapse font-sans">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100/70">
                        <th className="py-2.5 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest"># Venta</th>
                        <th className="py-2.5 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                        <th className="py-2.5 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Productos / Fardos</th>
                        <th className="py-2.5 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Cant.</th>
                        <th className="py-2.5 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Vendedor</th>
                        <th className="py-2.5 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Pago</th>
                        <th className="py-2.5 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {paginatedJuntaSales.map((s) => {
                        const qty = s.items && s.items.length > 0
                          ? s.items.reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0)
                          : (Number(s.cantidad) || 1);
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 bg-slate-900 text-white rounded-md font-mono font-black text-[11px]">
                                #{s.numeroVenta}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <p className="font-black text-slate-900 uppercase text-xs">{s.cliente}</p>
                              <p className="text-[9px] text-slate-400 font-bold">{s.telefono || 'Sin contacto'}</p>
                            </td>
                            <td className="py-3 px-3">
                              {s.items && s.items.length > 0 ? (
                                <div className="space-y-0.5">
                                  {s.items.map((it, idx) => (
                                    <span key={idx} className="inline-block mr-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[9px] font-black font-mono">
                                      {it.cantidad}x {it.codigoFardo}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[9px] font-black font-mono">
                                  {s.cantidad || 1}x {s.codigoFardo || 'S/C'}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-black text-[11px] font-mono">
                                {qty}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-[11px] font-black uppercase text-slate-700">
                              {s.vendedor}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${s.estadoPago === 'Pagado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {s.estadoPago || 'Pendiente'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-black text-slate-900 text-xs font-mono">
                              ${(s.total || 0).toLocaleString('es-CL')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {juntaViewMode === 'clientes' && filteredJuntaCustomers.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-500">
                  Mostrando página <span className="font-black text-slate-900">{clientPage}</span> de <span className="font-black text-slate-900">{totalClientPages}</span> ({filteredJuntaCustomers.length} clientes en total)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setClientPage(prev => Math.max(1, prev - 1))}
                    disabled={clientPage <= 1}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-black text-xs uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1 shadow-xs"
                  >
                    <ChevronLeft size={14} /> Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientPage(prev => Math.min(totalClientPages, prev + 1))}
                    disabled={clientPage >= totalClientPages}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-black text-xs uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1 shadow-xs"
                  >
                    Siguiente <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {juntaViewMode === 'ventas' && filteredJuntaSales.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-500">
                  Mostrando página <span className="font-black text-slate-900">{salePage}</span> de <span className="font-black text-slate-900">{totalSalePages}</span> ({filteredJuntaSales.length} ventas en total)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSalePage(prev => Math.max(1, prev - 1))}
                    disabled={salePage <= 1}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-black text-xs uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1 shadow-xs"
                  >
                    <ChevronLeft size={14} /> Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setSalePage(prev => Math.min(totalSalePages, prev + 1))}
                    disabled={salePage >= totalSalePages}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-black text-xs uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1 shadow-xs"
                  >
                    Siguiente <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Tendencia */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl overflow-hidden relative">
           <div className="flex items-center justify-between mb-8">
             <div>
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Tendencia de Ventas</h3>
               <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Últimos 7 días de operación</p>
             </div>
             <div className="flex gap-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Ingresos</div>
             </div>
           </div>
           <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold', fontSize: 10}} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
           </div>
        </div>

        {/* Ranking de Vendedores */}
        <div className="bg-slate-900 p-10 rounded-[48px] text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Users size={120} /></div>
          <h3 className="text-xl font-black uppercase tracking-tighter mb-8 relative z-10">Leaderboard Ventas</h3>
          <div className="space-y-6 relative z-10">
            {stats.topSellers.map(([name, total]: any, idx: number) => (
              <div key={name} className="flex items-center gap-4 bg-white/5 p-5 rounded-[28px] border border-white/10 hover:bg-white/10 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${idx === 0 ? 'bg-amber-400 text-slate-900 shadow-[0_0_20px_rgba(251,191,36,0.5)]' : 'bg-slate-700 text-white'}`}>
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black uppercase tracking-tight">{name}</p>
                  <p className="text-emerald-400 font-bold text-sm tracking-tight">${total.toLocaleString()}</p>
                </div>
                <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${(total / stats.totalVendido) * 100}%` }}></div>
                </div>
              </div>
            ))}
            {stats.topSellers.length === 0 && (
               <div className="text-center py-10 opacity-30">
                 <p className="text-xs font-black uppercase italic">Sin datos de venta registrados hoy</p>
               </div>
            )}
          </div>
          <Link to="/ventas" className="mt-8 w-full py-4 bg-white/10 hover:bg-white/20 rounded-[20px] flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all">
            Ver Detalle Completo <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Control de Pendientes por Vendedor */}
      <div id="pending-sales-by-seller" className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl overflow-hidden relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2 font-sans">
              <AlertCircle className="text-rose-500 animate-pulse" size={24} /> Pendientes por Vendedor
            </h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
              Ventas con datos incompletos, fardos sin etiquetar o pagos pendientes de confirmar
            </p>
          </div>
          <span className="px-4 py-2 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 self-start md:self-auto font-sans">
            {pendingBySeller.reduce((acc, curr) => acc + curr.totalPendientes, 0)} Alertas Totales
          </span>
        </div>

        {pendingBySeller.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest font-sans">Vendedor</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center font-sans">Datos Incompletos</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center font-sans">Sin Etiquetar/Imprimir</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center font-sans">Pendiente de Pago</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right font-sans">Total Pendientes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-sans">
                {pendingBySeller.map((item) => (
                  <tr key={item.vendedor} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-5">
                      <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{item.vendedor}</p>
                    </td>
                    <td className="py-5 text-center">
                      <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-black ${item.incompletas > 0 ? 'bg-amber-100 text-amber-700 font-mono' : 'bg-slate-100 text-slate-400 font-mono'}`}>
                        {item.incompletas}
                      </span>
                    </td>
                    <td className="py-5 text-center">
                      <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-black ${item.sinEtiquetar > 0 ? 'bg-blue-100 text-blue-700 font-mono' : 'bg-slate-100 text-slate-400 font-mono'}`}>
                        {item.sinEtiquetar}
                      </span>
                    </td>
                    <td className="py-5 text-center">
                      <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-black ${item.sinPagar > 0 ? 'bg-rose-100 text-rose-700 font-mono' : 'bg-slate-100 text-slate-400 font-mono'}`}>
                        {item.sinPagar}
                      </span>
                    </td>
                    <td className="py-5 text-right font-black text-slate-900 text-sm">
                      <span className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 text-white rounded-2xl text-[11px] font-black tracking-tight shadow-sm font-mono">
                        {item.totalPendientes} u.
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-100 font-sans">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
              <TrendingUp size={28} />
            </div>
            <h4 className="text-base font-black text-slate-800 uppercase tracking-tight">¡Felicitaciones! Todo al día</h4>
            <p className="text-slate-400 text-xs mt-2 max-w-md font-medium">No hay ventas con datos incompletos, etiquetas pendientes o pagos sin registrar en el sistema.</p>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-[56px] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden shadow-2xl">
        <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[150%] bg-white/10 blur-[80px] rounded-full rotate-12 pointer-events-none"></div>
        <div className="space-y-6 text-center md:text-left relative z-10">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-black/20 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-full">
            <Zap size={16} /> Alta Disponibilidad
          </div>
          <h3 className="text-5xl font-black uppercase tracking-tighter leading-none">Aumenta tu Margen <br/>con Estrategia</h3>
          <p className="text-white/80 font-medium max-w-lg text-xl italic leading-relaxed">El sistema MDF ha detectado que los fardos de "Polerones Premium" tienen el mejor retorno de inversión este mes.</p>
        </div>
        <div className="flex flex-col gap-4 relative z-10">
          <Link 
            to="/registrar" 
            className="bg-white text-emerald-600 px-12 py-7 rounded-[32px] font-black text-2xl transition-all shadow-2xl hover:scale-105 active:scale-95 flex items-center gap-4"
          >
            <Zap size={32} />
            NUEVO LIVE
          </Link>
        </div>
      </div>

      {/* Indicador de conexión */}
      <div className="flex items-center justify-center gap-3 text-[10px] font-black text-slate-300 uppercase tracking-widest pt-4">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
        Sincronizado vía Cloud Protocol <Cloud size={12} className="text-blue-400" />
      </div>
      
      <ReportModal 
        isOpen={reportState.isOpen} 
        onClose={() => setReportState({...reportState, isOpen: false})} 
        title={`Reporte ${reportState.type === 'weekly' ? 'Semanal' : reportState.type === 'monthly' ? 'Mensual' : 'Histórico (Personalizado)'}`}
        sales={reportState.sales}
        stats={stats}
      />
    </div>
  );
}
