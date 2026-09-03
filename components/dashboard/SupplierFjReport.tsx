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
  ShieldCheck, 
  Sparkles,
  BarChart3,
  Layers,
  ArrowUpRight,
  Filter,
  X
} from 'lucide-react';
import { Sale, StockItem, StaffRole } from '../../types';

interface SupplierFjReportProps {
  sales: Sale[];
  stock: StockItem[];
  currentUser: { nombre: string; rol: StaffRole } | null;
}

export const SupplierFjReport: React.FC<SupplierFjReportProps> = ({
  sales,
  stock,
  currentUser
}) => {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<'resumen' | 'fardos' | 'ventas'>('resumen');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Search & Filters for Fardos
  const [fardoSearch, setFardoSearch] = useState<string>('');
  const [fardoStockFilter, setFardoStockFilter] = useState<'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [fardoSortBy, setFardoSortBy] = useState<'codigo' | 'stock' | 'vendidos' | 'ingresos'>('vendidos');
  const [fardoSortAsc, setFardoSortAsc] = useState<boolean>(false);
  const [fardoPage, setFardoPage] = useState<number>(1);
  const FARDOS_PER_PAGE = 10;

  // Search & Filters for Sales
  const [salesSearch, setSalesSearch] = useState<string>('');
  const [salesPaymentFilter, setSalesPaymentFilter] = useState<string>('ALL');
  const [salesSellerFilter, setSalesSellerFilter] = useState<string>('ALL');
  const [salesDispatchFilter, setSalesDispatchFilter] = useState<string>('ALL');
  const [salesDateFilter, setSalesDateFilter] = useState<string>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [salesPage, setSalesPage] = useState<number>(1);
  const SALES_PER_PAGE = 10;

  // --- IDENTIFICACIÓN DE FARDOS DEL PROVEEDOR FJ ---
  const fjStockItems = useMemo(() => {
    return stock.filter(item => {
      const prov = (item.proveedor || '').trim().toUpperCase();
      const tipo = (item.tipo || '').toUpperCase();
      const cod = (item.codigo || '').toUpperCase();
      return prov === 'FJ' || prov.startsWith('FJ') || prov.includes('FJ') || cod.startsWith('MDF-9') || tipo.includes(' FJ');
    });
  }, [stock]);

  // Lookup map and set of FJ codes
  const fjCodesSet = useMemo(() => {
    const set = new Set<string>();
    fjStockItems.forEach(item => {
      if (item.codigo) set.add(item.codigo.trim().toUpperCase());
    });
    return set;
  }, [fjStockItems]);

  const stockByCode = useMemo(() => {
    const map = new Map<string, StockItem>();
    stock.forEach(item => {
      if (item.codigo) map.set(item.codigo.trim().toUpperCase(), item);
    });
    return map;
  }, [stock]);

  // --- IDENTIFICACIÓN DE VENTAS CON PRODUCTOS FJ ---
  interface ProcessedFjSale {
    id: string;
    sale: Sale;
    numeroVenta: number;
    fecha: string;
    cliente: string;
    telefono?: string;
    vendedor: string;
    estadoPago: string;
    tipoDespacho?: string;
    estadoDespacho?: string;
    totalVentaGeneral: number;
    fjItems: {
      codigoFardo: string;
      nombre: string;
      cantidad: number;
      valorUnitario: number;
      subtotal: number;
    }[];
    fjTotalUnidades: number;
    fjTotalMonto: number;
  }

  const processedFjSales = useMemo(() => {
    const list: ProcessedFjSale[] = [];

    (sales || []).forEach(sale => {
      if (!sale) return;

      const fjItemsFound: ProcessedFjSale['fjItems'] = [];

      if (sale.items && Array.isArray(sale.items) && sale.items.length > 0) {
        sale.items.forEach(it => {
          const cod = (it.codigoFardo || '').trim().toUpperCase();
          if (fjCodesSet.has(cod)) {
            const stockInfo = stockByCode.get(cod);
            const qty = Number(it.cantidad) || 1;
            const unitPrice = Number(it.valorUnitario) || 0;
            fjItemsFound.push({
              codigoFardo: it.codigoFardo,
              nombre: stockInfo?.tipo || 'Fardo FJ',
              cantidad: qty,
              valorUnitario: unitPrice,
              subtotal: qty * unitPrice
            });
          }
        });
      } else if (sale.codigoFardo) {
        const cod = (sale.codigoFardo || '').trim().toUpperCase();
        if (fjCodesSet.has(cod)) {
          const stockInfo = stockByCode.get(cod);
          const qty = Number(sale.cantidad) || 1;
          const unitPrice = Number(sale.valorUnitario) || (Number(sale.total) / (qty || 1)) || 0;
          fjItemsFound.push({
            codigoFardo: sale.codigoFardo,
            nombre: stockInfo?.tipo || sale.variante || 'Fardo FJ',
            cantidad: qty,
            valorUnitario: unitPrice,
            subtotal: Number(sale.total) || (qty * unitPrice)
          });
        }
      }

      if (fjItemsFound.length > 0) {
        const fjTotalUnidades = fjItemsFound.reduce((acc, it) => acc + it.cantidad, 0);
        const fjTotalMonto = fjItemsFound.reduce((acc, it) => acc + it.subtotal, 0);

        list.push({
          id: sale.id,
          sale,
          numeroVenta: sale.numeroVenta,
          fecha: sale.fecha,
          cliente: sale.cliente || 'Cliente sin nombre',
          telefono: sale.telefono,
          vendedor: sale.vendedor || 'Sin vendedor asignado',
          estadoPago: sale.estadoPago || 'Pendiente',
          tipoDespacho: sale.tipoDespacho,
          estadoDespacho: sale.estadoDespacho,
          totalVentaGeneral: sale.total || 0,
          fjItems: fjItemsFound,
          fjTotalUnidades,
          fjTotalMonto
        });
      }
    });

    // Sort sales by order number descending
    return list.sort((a, b) => (b.numeroVenta || 0) - (a.numeroVenta || 0));
  }, [sales, fjCodesSet, stockByCode]);

  // --- ACUMULACIÓN FARDO POR FARDO ---
  interface FjFardoSummary {
    stockItem: StockItem;
    codigo: string;
    tipo: string;
    stockActual: number;
    precioCosto: number;
    precioSugerido: number;
    unidadesVendidas: number;
    montoVendido: number;
    ordenesCount: number;
    stockInicialEstimado: number;
    porcentajeVendido: number;
    valorInventarioSugerido: number;
    valorInventarioCosto: number;
  }

  const fardosSummaries = useMemo(() => {
    // Map of code -> sales metrics
    const salesMap = new Map<string, { unidades: number; monto: number; ordenes: number }>();

    processedFjSales.forEach(s => {
      s.fjItems.forEach(it => {
        const code = it.codigoFardo.trim().toUpperCase();
        const current = salesMap.get(code) || { unidades: 0, monto: 0, ordenes: 0 };
        current.unidades += it.cantidad;
        current.monto += it.subtotal;
        current.ordenes += 1;
        salesMap.set(code, current);
      });
    });

    return fjStockItems.map(item => {
      const code = item.codigo.trim().toUpperCase();
      const salesData = salesMap.get(code) || { unidades: 0, monto: 0, ordenes: 0 };
      const stockActual = Number(item.stockActual) || 0;
      const precioCosto = Number(item.precioCosto) || 0;
      const precioSugerido = Number(item.precioSugerido) || 0;
      const unidadesVendidas = salesData.unidades;
      const stockInicialEstimado = stockActual + unidadesVendidas;
      const porcentajeVendido = stockInicialEstimado > 0 
        ? Math.round((unidadesVendidas / stockInicialEstimado) * 100) 
        : 0;

      return {
        stockItem: item,
        codigo: item.codigo,
        tipo: item.tipo,
        stockActual,
        precioCosto,
        precioSugerido,
        unidadesVendidas,
        montoVendido: salesData.monto,
        ordenesCount: salesData.ordenes,
        stockInicialEstimado,
        porcentajeVendido,
        valorInventarioSugerido: stockActual * precioSugerido,
        valorInventarioCosto: stockActual * precioCosto
      };
    });
  }, [fjStockItems, processedFjSales]);

  // --- MÉTRICAS EJECUTIVAS GLOBALES FJ ---
  const globalMetrics = useMemo(() => {
    const totalCatalogoFardos = fjStockItems.length;
    const stockFisicoDisponible = fjStockItems.reduce((acc, it) => acc + (Number(it.stockActual) || 0), 0);
    const fardosConStock = fjStockItems.filter(it => (Number(it.stockActual) || 0) > 0).length;
    const fardosAgotados = fjStockItems.filter(it => (Number(it.stockActual) || 0) <= 0).length;

    const totalUnidadesVendidas = processedFjSales.reduce((acc, s) => acc + s.fjTotalUnidades, 0);
    const totalRecaudacionFj = processedFjSales.reduce((acc, s) => acc + s.fjTotalMonto, 0);
    const totalVentasRegistradas = processedFjSales.length;

    const ventasPagadasMonto = processedFjSales
      .filter(s => s.estadoPago === 'Pagado')
      .reduce((acc, s) => acc + s.fjTotalMonto, 0);
    const ventasPendientesMonto = processedFjSales
      .filter(s => s.estadoPago !== 'Pagado')
      .reduce((acc, s) => acc + s.fjTotalMonto, 0);

    const valorInventarioVenta = fardosSummaries.reduce((acc, f) => acc + f.valorInventarioSugerido, 0);
    const valorInventarioCosto = fardosSummaries.reduce((acc, f) => acc + f.valorInventarioCosto, 0);

    // Rotación global
    const totalStockInicial = stockFisicoDisponible + totalUnidadesVendidas;
    const porcentajeRotacion = totalStockInicial > 0 
      ? Math.round((totalUnidadesVendidas / totalStockInicial) * 100) 
      : 0;

    // Vendedor ranking
    const sellerMap: Record<string, { fardos: number; monto: number; ordenes: number }> = {};
    processedFjSales.forEach(s => {
      const v = s.vendedor;
      if (!sellerMap[v]) sellerMap[v] = { fardos: 0, monto: 0, ordenes: 0 };
      sellerMap[v].fardos += s.fjTotalUnidades;
      sellerMap[v].monto += s.fjTotalMonto;
      sellerMap[v].ordenes += 1;
    });

    const sellersRanking = Object.entries(sellerMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.fardos - a.fardos);

    // Top fardos vendidos
    const topFardos = [...fardosSummaries]
      .filter(f => f.unidadesVendidas > 0)
      .sort((a, b) => b.unidadesVendidas - a.unidadesVendidas)
      .slice(0, 6);

    return {
      totalCatalogoFardos,
      stockFisicoDisponible,
      fardosConStock,
      fardosAgotados,
      totalUnidadesVendidas,
      totalRecaudacionFj,
      totalVentasRegistradas,
      ventasPagadasMonto,
      ventasPendientesMonto,
      valorInventarioVenta,
      valorInventarioCosto,
      porcentajeRotacion,
      sellersRanking,
      topFardos
    };
  }, [fjStockItems, processedFjSales, fardosSummaries]);

  // --- FILTRADO Y ORDENACIÓN DE FARDOS ---
  const filteredFardos = useMemo(() => {
    let list = [...fardosSummaries];

    // Search filter
    if (fardoSearch.trim()) {
      const term = fardoSearch.toLowerCase().trim();
      list = list.filter(f => 
        f.codigo.toLowerCase().includes(term) ||
        f.tipo.toLowerCase().includes(term)
      );
    }

    // Stock status filter
    if (fardoStockFilter === 'IN_STOCK') {
      list = list.filter(f => f.stockActual > 0);
    } else if (fardoStockFilter === 'OUT_OF_STOCK') {
      list = list.filter(f => f.stockActual <= 0);
    }

    // Sort
    list.sort((a, b) => {
      if (fardoSortBy === 'codigo') {
        const codA = String(a.codigo || '');
        const codB = String(b.codigo || '');
        return fardoSortAsc ? codA.localeCompare(codB) : codB.localeCompare(codA);
      }

      let numA = 0;
      let numB = 0;
      if (fardoSortBy === 'stock') {
        numA = a.stockActual;
        numB = b.stockActual;
      } else if (fardoSortBy === 'vendidos') {
        numA = a.unidadesVendidas;
        numB = b.unidadesVendidas;
      } else if (fardoSortBy === 'ingresos') {
        numA = a.montoVendido;
        numB = b.montoVendido;
      }

      return fardoSortAsc ? numA - numB : numB - numA;
    });

    return list;
  }, [fardosSummaries, fardoSearch, fardoStockFilter, fardoSortBy, fardoSortAsc]);

  const totalFardoPages = Math.max(1, Math.ceil(filteredFardos.length / FARDOS_PER_PAGE));
  const paginatedFardos = useMemo(() => {
    const start = (fardoPage - 1) * FARDOS_PER_PAGE;
    return filteredFardos.slice(start, start + FARDOS_PER_PAGE);
  }, [filteredFardos, fardoPage]);

  // --- FILTRADO Y PAGINACIÓN DE VENTAS ---
  const filteredSales = useMemo(() => {
    let list = [...processedFjSales];

    // Search
    if (salesSearch.trim()) {
      const term = salesSearch.toLowerCase().trim();
      list = list.filter(s =>
        s.cliente.toLowerCase().includes(term) ||
        s.numeroVenta.toString().includes(term) ||
        (s.telefono || '').toLowerCase().includes(term) ||
        s.vendedor.toLowerCase().includes(term) ||
        s.fjItems.some(it => it.codigoFardo.toLowerCase().includes(term) || it.nombre.toLowerCase().includes(term))
      );
    }

    // Payment Filter
    if (salesPaymentFilter !== 'ALL') {
      list = list.filter(s => s.estadoPago === salesPaymentFilter);
    }

    // Seller Filter
    if (salesSellerFilter !== 'ALL') {
      list = list.filter(s => s.vendedor === salesSellerFilter);
    }

    // Dispatch Filter
    if (salesDispatchFilter !== 'ALL') {
      list = list.filter(s => s.estadoDespacho === salesDispatchFilter);
    }

    // Date Filter
    if (salesDateFilter === 'TODAY') {
      const todayIso = new Date().toISOString().split('T')[0];
      list = list.filter(s => s.fecha === todayIso);
    } else if (salesDateFilter === 'YESTERDAY') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const yesterdayIso = d.toISOString().split('T')[0];
      list = list.filter(s => s.fecha === yesterdayIso);
    } else if (salesDateFilter === 'CUSTOM' && (customStartDate || customEndDate)) {
      list = list.filter(s => {
        if (!s.fecha) return false;
        if (customStartDate && s.fecha < customStartDate) return false;
        if (customEndDate && s.fecha > customEndDate) return false;
        return true;
      });
    }

    return list;
  }, [processedFjSales, salesSearch, salesPaymentFilter, salesSellerFilter, salesDispatchFilter, salesDateFilter, customStartDate, customEndDate]);

  const totalSalePages = Math.max(1, Math.ceil(filteredSales.length / SALES_PER_PAGE));
  const paginatedSales = useMemo(() => {
    const start = (salesPage - 1) * SALES_PER_PAGE;
    return filteredSales.slice(start, start + SALES_PER_PAGE);
  }, [filteredSales, salesPage]);

  // Unique Sellers for dropdown
  const uniqueSellers = useMemo(() => {
    const set = new Set<string>();
    processedFjSales.forEach(s => {
      if (s.vendedor) set.add(s.vendedor);
    });
    return Array.from(set).sort();
  }, [processedFjSales]);

  // --- EXPORT TO CSV HELPERS ---
  const handleExportSalesCsv = () => {
    const headers = [
      'N° Venta',
      'Fecha',
      'Cliente',
      'Teléfono',
      'Vendedor',
      'Fardo(s) FJ',
      'Cant. Fardos FJ',
      'Monto Fardos FJ (CLP)',
      'Total Venta General (CLP)',
      'Estado Pago',
      'Despacho'
    ];

    const rows = filteredSales.map(s => [
      `"${s.numeroVenta}"`,
      `"${s.fecha}"`,
      `"${s.cliente.replace(/"/g, '""')}"`,
      `"${s.telefono || ''}"`,
      `"${s.vendedor.replace(/"/g, '""')}"`,
      `"${s.fjItems.map(it => `${it.cantidad}x ${it.codigoFardo} (${it.nombre})`).join(' | ').replace(/"/g, '""')}"`,
      s.fjTotalUnidades,
      s.fjTotalMonto,
      s.totalVentaGeneral,
      `"${s.estadoPago}"`,
      `"${s.estadoDespacho || s.tipoDespacho || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Reporte_Ventas_Proveedor_FJ_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportStockCsv = () => {
    const headers = [
      'Código',
      'Descripción / Tipo',
      'Proveedor',
      'Stock Actual',
      'Unidades Vendidas',
      'Monto Vendido (CLP)',
      'Órdenes con Venta',
      'Precio Costo (CLP)',
      'Precio Sugerido (CLP)',
      'Valor Stock Sugerido (CLP)',
      'Estado'
    ];

    const rows = filteredFardos.map(f => [
      `"${f.codigo}"`,
      `"${f.tipo.replace(/"/g, '""')}"`,
      '"FJ"',
      f.stockActual,
      f.unidadesVendidas,
      f.montoVendido,
      f.ordenesCount,
      f.precioCosto,
      f.precioSugerido,
      f.valorInventarioSugerido,
      f.stockActual > 0 ? '"DISPONIBLE"' : '"AGOTADO"'
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Inventario_Fardos_Proveedor_FJ_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="supplier-fj-dashboard-section" className="bg-white rounded-[40px] border-2 border-emerald-100 shadow-xl overflow-hidden relative transition-all">
      {/* HEADER PRINCIPAL DE LA SECCIÓN */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Layers size={180} />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 font-black rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20 shrink-0">
              FJ
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck size={12} /> Informe Exclusivo Administrador
                </span>
                <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Proveedor "FJ"
                </span>
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {globalMetrics.totalCatalogoFardos} Fardos en Catálogo
                </span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight mt-1.5 flex items-center gap-2">
                Control Integral <span className="text-emerald-400 italic">Proveedor FJ</span>
              </h3>
              <p className="text-slate-300 text-xs font-medium mt-1">
                Monitoreo centralizado de inventario físico, rotación de fardos y órdenes de venta registradas para la partida FJ.
              </p>
            </div>
          </div>

          {/* Acciones principales de cabecera */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowPrintModal(true)}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 border border-white/10 shadow-xs"
              title="Imprimir informe oficial"
            >
              <Printer size={15} /> Imprimir Informe
            </button>

            <button
              onClick={handleExportSalesCsv}
              className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/30"
              title="Descargar Ventas en Excel/CSV"
            >
              <Download size={15} /> Exportar Ventas ({filteredSales.length})
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3.5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-black text-xs uppercase transition-all flex items-center gap-1.5"
            >
              {isExpanded ? (
                <>
                  <ChevronUp size={16} /> <span className="hidden sm:inline">Contraer</span>
                </>
              ) : (
                <>
                  <ChevronDown size={16} /> <span className="hidden sm:inline">Expandir</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* TARJETAS KPI RESUMEN RÁPIDO */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Fardos en Catálogo</p>
            <p className="text-xl font-black text-white mt-0.5">{globalMetrics.totalCatalogoFardos}</p>
            <p className="text-[9px] text-emerald-400 font-bold mt-0.5">{globalMetrics.fardosConStock} con stock</p>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Stock Bodega</p>
            <p className="text-xl font-black text-emerald-400 mt-0.5">{globalMetrics.stockFisicoDisponible} <span className="text-xs text-slate-400 font-normal">fardos</span></p>
            <p className="text-[9px] text-slate-400 font-bold mt-0.5">{globalMetrics.fardosAgotados} agotados</p>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Fardos Vendidos</p>
            <p className="text-xl font-black text-white mt-0.5">{globalMetrics.totalUnidadesVendidas} <span className="text-xs text-slate-400 font-normal">u.</span></p>
            <p className="text-[9px] text-emerald-400 font-bold mt-0.5">{globalMetrics.porcentajeRotacion}% rotación</p>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Órdenes FJ</p>
            <p className="text-xl font-black text-white mt-0.5">{globalMetrics.totalVentasRegistradas}</p>
            <p className="text-[9px] text-slate-400 font-bold mt-0.5">Ventas con fardos FJ</p>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Facturado Total</p>
            <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">
              ${(globalMetrics.totalRecaudacionFj).toLocaleString('es-CL')}
            </p>
            <p className="text-[9px] text-slate-400 font-bold mt-0.5">
              Pagado: ${(globalMetrics.ventasPagadasMonto).toLocaleString('es-CL')}
            </p>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Valor Bodega Sug.</p>
            <p className="text-xl font-black text-amber-400 font-mono mt-0.5">
              ${(globalMetrics.valorInventarioVenta).toLocaleString('es-CL')}
            </p>
            <p className="text-[9px] text-slate-400 font-bold mt-0.5">Valor proyectado venta</p>
          </div>
        </div>
      </div>

      {/* CONTENIDO EXPANDIDO CON PESTAÑAS */}
      {isExpanded && (
        <div className="p-6 md:p-8 space-y-6">
          {/* BARRA DE NAVEGACIÓN ENTRE VISTAS */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
              <button
                onClick={() => setActiveTab('resumen')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeTab === 'resumen'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <BarChart3 size={15} className={activeTab === 'resumen' ? 'text-emerald-600' : ''} /> Resumen Ejecutivo
              </button>

              <button
                onClick={() => setActiveTab('fardos')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeTab === 'fardos'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Package size={15} className={activeTab === 'fardos' ? 'text-emerald-600' : ''} />
                Catálogo Fardos FJ ({fjStockItems.length})
              </button>

              <button
                onClick={() => setActiveTab('ventas')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeTab === 'ventas'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <DollarSign size={15} className={activeTab === 'ventas' ? 'text-emerald-600' : ''} />
                Ventas FJ ({processedFjSales.length})
              </button>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Última Actualización
              </span>
              <p className="text-xs font-black text-slate-700">
                {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* TAB 1: RESUMEN EJECUTIVO Y ANÁLISIS */}
          {activeTab === 'resumen' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Ranking de Vendedoras */}
                <div className="bg-slate-900 text-white p-6 rounded-[32px] shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-200 flex items-center gap-2">
                        <Users size={16} className="text-emerald-400" /> Vendedoras Partida FJ
                      </h4>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-black uppercase">
                        {globalMetrics.sellersRanking.length} Vendedoras
                      </span>
                    </div>
                    <div className="space-y-3">
                      {globalMetrics.sellersRanking.map((s, idx) => (
                        <div key={s.name} className="bg-white/5 p-3 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                          <div className="flex items-center justify-between text-xs font-black">
                            <div className="flex items-center gap-2">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                                idx === 0 ? 'bg-amber-400 text-slate-950 font-mono' : 'bg-slate-800 text-slate-300 font-mono'
                              }`}>
                                {idx + 1}
                              </span>
                              <span className="uppercase">{s.name}</span>
                            </div>
                            <span className="text-emerald-400 font-mono font-black">{s.fardos} fardos</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 pl-8">
                            <span>{s.ordenes} órdenes</span>
                            <span className="font-mono text-slate-300">${s.monto.toLocaleString('es-CL')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between font-bold">
                    <span>Total Venta Colocada:</span>
                    <span className="text-emerald-400 font-mono font-black">{globalMetrics.totalUnidadesVendidas} fardos</span>
                  </div>
                </div>

                {/* Top Fardos Más Vendidos */}
                <div className="lg:col-span-2 bg-slate-50 border border-slate-200/80 p-6 rounded-[32px] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                        <TrendingUp size={16} className="text-emerald-600" /> Fardos Más Vendidos (Proveedor FJ)
                      </h4>
                      <button
                        onClick={() => setActiveTab('fardos')}
                        className="text-[10px] font-black uppercase text-emerald-700 hover:underline"
                      >
                        Ver todos los 55 →
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {globalMetrics.topFardos.map((f, idx) => (
                        <div key={f.codigo} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <span className="px-2 py-0.5 bg-slate-900 text-white rounded-md text-[10px] font-black font-mono">
                              #{idx + 1} • {f.codigo}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              f.stockActual > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {f.stockActual > 0 ? `${f.stockActual} en bodega` : 'Agotado'}
                            </span>
                          </div>

                          <p className="text-xs font-black text-slate-800 uppercase tracking-tight line-clamp-2">
                            {f.tipo}
                          </p>

                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                            <div>
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Vendidos</span>
                              <span className="font-black text-emerald-600 font-mono">{f.unidadesVendidas} u.</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Total Recaudado</span>
                              <span className="font-black text-slate-900 font-mono">${f.montoVendido.toLocaleString('es-CL')}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600 font-medium">
                    <span>Rotación global de la partida FJ: <strong className="text-slate-900 font-black">{globalMetrics.porcentajeRotacion}%</strong> ({globalMetrics.totalUnidadesVendidas} de {globalMetrics.stockFisicoDisponible + globalMetrics.totalUnidadesVendidas} fardos)</span>
                    <button
                      onClick={handleExportStockCsv}
                      className="text-xs font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1 uppercase"
                    >
                      <Download size={13} /> Descargar Catálogo CSV
                    </button>
                  </div>
                </div>
              </div>

              {/* Estado de Pagos y Logística */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cobranza */}
                <div className="bg-white p-6 rounded-[32px] border border-slate-200/80 shadow-xs">
                  <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
                    <DollarSign size={16} className="text-amber-500" /> Estado Financiero y Pagos FJ
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-emerald-700 font-black">Pagadas ({processedFjSales.filter(s => s.estadoPago === 'Pagado').length} órdenes)</span>
                        <span className="font-mono text-slate-900 font-black">${globalMetrics.ventasPagadasMonto.toLocaleString('es-CL')}</span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${globalMetrics.totalRecaudacionFj > 0 ? (globalMetrics.ventasPagadasMonto / globalMetrics.totalRecaudacionFj) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-amber-700 font-black">Pendientes de Pago ({processedFjSales.filter(s => s.estadoPago !== 'Pagado').length} órdenes)</span>
                        <span className="font-mono text-slate-900 font-black">${globalMetrics.ventasPendientesMonto.toLocaleString('es-CL')}</span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: `${globalMetrics.totalRecaudacionFj > 0 ? (globalMetrics.ventasPendientesMonto / globalMetrics.totalRecaudacionFj) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl text-[11px] text-slate-600 font-medium">
                      El monto total facturado por fardos FJ asciende a <strong className="text-slate-900">${globalMetrics.totalRecaudacionFj.toLocaleString('es-CL')}</strong>. El porcentaje pagado es del {globalMetrics.totalRecaudacionFj > 0 ? Math.round((globalMetrics.ventasPagadasMonto / globalMetrics.totalRecaudacionFj) * 100) : 0}%.
                    </div>
                  </div>
                </div>

                {/* Stock Remanente y Valoración */}
                <div className="bg-white p-6 rounded-[32px] border border-slate-200/80 shadow-xs">
                  <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
                    <Package size={16} className="text-blue-500" /> Valoración de Stock Remanente FJ
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100">
                      <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Valor Venta Sugerida</p>
                      <p className="text-xl font-black text-emerald-950 font-mono mt-1">
                        ${globalMetrics.valorInventarioVenta.toLocaleString('es-CL')}
                      </p>
                      <p className="text-[10px] text-emerald-700 mt-1 font-medium">
                        {globalMetrics.stockFisicoDisponible} fardos disponibles
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Valor a Costo</p>
                      <p className="text-xl font-black text-slate-900 font-mono mt-1">
                        ${globalMetrics.valorInventarioCosto.toLocaleString('es-CL')}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">
                        Costo registrado en sistema
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-900">Total Fardos Físicos Disponibles:</span>
                    <span className="font-black text-indigo-700 font-mono text-sm">{globalMetrics.stockFisicoDisponible} unidades</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CATÁLOGO Y STOCK DE TODOS LOS FARDOS FJ */}
          {activeTab === 'fardos' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Filtros de Fardos */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar fardo FJ por código o descripción..."
                    value={fardoSearch}
                    onChange={(e) => { setFardoSearch(e.target.value); setFardoPage(1); }}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none focus:border-emerald-500 uppercase transition-all"
                  />
                  {fardoSearch && (
                    <button
                      onClick={() => { setFardoSearch(''); setFardoPage(1); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => { setFardoStockFilter('ALL'); setFardoPage(1); }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                        fardoStockFilter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Todos ({fardosSummaries.length})
                    </button>
                    <button
                      onClick={() => { setFardoStockFilter('IN_STOCK'); setFardoPage(1); }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                        fardoStockFilter === 'IN_STOCK' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Con Stock ({globalMetrics.fardosConStock})
                    </button>
                    <button
                      onClick={() => { setFardoStockFilter('OUT_OF_STOCK'); setFardoPage(1); }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                        fardoStockFilter === 'OUT_OF_STOCK' ? 'bg-rose-600 text-white' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Agotados ({globalMetrics.fardosAgotados})
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Ordenar:</span>
                    <select
                      value={fardoSortBy}
                      onChange={(e) => setFardoSortBy(e.target.value as any)}
                      className="font-black text-slate-800 uppercase outline-none text-xs bg-transparent cursor-pointer"
                    >
                      <option value="vendidos">Más Vendidos</option>
                      <option value="stock">Stock Disponible</option>
                      <option value="ingresos">Mayor Recaudación</option>
                      <option value="codigo">Código MDF</option>
                    </select>
                    <button
                      onClick={() => setFardoSortAsc(!fardoSortAsc)}
                      className="text-slate-400 hover:text-slate-700 font-black text-xs px-1"
                      title={fardoSortAsc ? 'Ascendente' : 'Descendente'}
                    >
                      {fardoSortAsc ? '↑' : '↓'}
                    </button>
                  </div>

                  <button
                    onClick={handleExportStockCsv}
                    className="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 shadow-xs"
                  >
                    <Download size={14} /> CSV
                  </button>
                </div>
              </div>

              {/* Tabla de Fardos */}
              <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse font-sans">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Código</th>
                      <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción / Fardo</th>
                      <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Stock Actual</th>
                      <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Vendidos</th>
                      <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Precio Sugerido</th>
                      <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Monto Recaudado</th>
                      <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedFardos.map((f) => (
                      <tr key={f.codigo} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-black text-xs text-slate-900">
                          <span className="px-2 py-0.5 bg-slate-900 text-white rounded-md">
                            {f.codigo}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-black text-slate-800 uppercase text-xs tracking-tight">{f.tipo}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                            Proveedor: FJ • {f.ordenesCount} órdenes de compra
                          </p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full font-mono font-black text-xs ${
                            f.stockActual > 2 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : f.stockActual > 0 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-slate-100 text-slate-400'
                          }`}>
                            {f.stockActual} u.
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-black text-xs text-slate-800">
                          {f.unidadesVendidas > 0 ? (
                            <span className="text-emerald-600 font-bold">
                              {f.unidadesVendidas} u.
                            </span>
                          ) : (
                            <span className="text-slate-300">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-xs text-slate-700">
                          ${f.precioSugerido.toLocaleString('es-CL')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-xs text-slate-900">
                          {f.montoVendido > 0 ? (
                            <span className="text-emerald-700 font-bold">
                              ${f.montoVendido.toLocaleString('es-CL')}
                            </span>
                          ) : (
                            <span className="text-slate-300">$0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {f.stockActual > 0 ? (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[9px] font-black uppercase">
                              Disponible
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full text-[9px] font-black uppercase">
                              Agotado
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {paginatedFardos.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-400 text-xs font-bold uppercase">
                          No se encontraron fardos de FJ con los filtros aplicados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación de Fardos */}
              {filteredFardos.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-500">
                    Mostrando página <strong className="text-slate-900">{fardoPage}</strong> de <strong className="text-slate-900">{totalFardoPages}</strong> ({filteredFardos.length} fardos filtrados de {fardosSummaries.length} totales)
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFardoPage(prev => Math.max(1, prev - 1))}
                      disabled={fardoPage <= 1}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-black text-xs uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1 shadow-xs"
                    >
                      <ChevronLeft size={14} /> Anterior
                    </button>
                    <button
                      onClick={() => setFardoPage(prev => Math.min(totalFardoPages, prev + 1))}
                      disabled={fardoPage >= totalFardoPages}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-black text-xs uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1 shadow-xs"
                    >
                      Siguiente <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REGISTRO DE TODAS LAS VENTAS FJ */}
          {activeTab === 'ventas' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Filtros de Ventas */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Buscar por cliente, # venta, teléfono, fardo FJ o vendedora..."
                      value={salesSearch}
                      onChange={(e) => { setSalesSearch(e.target.value); setSalesPage(1); }}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none focus:border-emerald-500 uppercase transition-all"
                    />
                    {salesSearch && (
                      <button
                        onClick={() => { setSalesSearch(''); setSalesPage(1); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Selector de Fecha */}
                    <div className="flex items-center gap-1 bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs">
                      <Calendar size={14} className="text-slate-400" />
                      <select
                        value={salesDateFilter}
                        onChange={(e) => { setSalesDateFilter(e.target.value); setSalesPage(1); }}
                        className="font-black text-slate-800 uppercase outline-none text-xs bg-transparent cursor-pointer"
                      >
                        <option value="ALL">Todas las Fechas</option>
                        <option value="TODAY">Hoy</option>
                        <option value="YESTERDAY">Ayer</option>
                        <option value="CUSTOM">Rango de Fecha</option>
                      </select>
                    </div>

                    {/* Selector de Pago */}
                    <div className="flex items-center gap-1 bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs">
                      <DollarSign size={14} className="text-slate-400" />
                      <select
                        value={salesPaymentFilter}
                        onChange={(e) => { setSalesPaymentFilter(e.target.value); setSalesPage(1); }}
                        className="font-black text-slate-800 uppercase outline-none text-xs bg-transparent cursor-pointer"
                      >
                        <option value="ALL">Todos los Pagos</option>
                        <option value="Pagado">Solo Pagados</option>
                        <option value="Pendiente">Solo Pendientes</option>
                      </select>
                    </div>

                    {/* Selector de Vendedora */}
                    <div className="flex items-center gap-1 bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs">
                      <Users size={14} className="text-slate-400" />
                      <select
                        value={salesSellerFilter}
                        onChange={(e) => { setSalesSellerFilter(e.target.value); setSalesPage(1); }}
                        className="font-black text-slate-800 uppercase outline-none text-xs bg-transparent cursor-pointer"
                      >
                        <option value="ALL">Todas las Vendedoras</option>
                        {uniqueSellers.map(v => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleExportSalesCsv}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 shadow-sm"
                    >
                      <Download size={14} /> Exportar
                    </button>
                  </div>
                </div>

                {/* Date range picker if CUSTOM */}
                {salesDateFilter === 'CUSTOM' && (
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-200 text-xs">
                    <span className="font-bold text-slate-500">Desde:</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => { setCustomStartDate(e.target.value); setSalesPage(1); }}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-xs outline-none"
                    />
                    <span className="font-bold text-slate-500">Hasta:</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => { setCustomEndDate(e.target.value); setSalesPage(1); }}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-xs outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Tabla de Ventas */}
              <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse font-sans">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest"># Venta</th>
                      <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                      <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                      <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fardos FJ Comprados</th>
                      <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Cant. FJ</th>
                      <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total FJ</th>
                      <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendedora</th>
                      <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Pago</th>
                      <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedSales.map((s) => {
                      const isExpanded = expandedSaleId === s.id;
                      return (
                        <React.Fragment key={s.id}>
                          <tr className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-mono font-black text-xs text-slate-900">
                              <span className="px-2 py-0.5 bg-slate-900 text-white rounded-md">
                                #{s.numeroVenta}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs font-bold text-slate-600">
                              {s.fecha}
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-black text-slate-800 uppercase text-xs">{s.cliente}</p>
                              <p className="text-[9px] text-slate-400 font-bold">{s.telefono || 'Sin teléfono'}</p>
                            </td>
                            <td className="py-3 px-4">
                              <div className="space-y-1">
                                {s.fjItems.map((it, idx) => (
                                  <div key={idx} className="inline-flex items-center gap-1.5 mr-1.5 mb-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md text-[10px] font-bold border border-emerald-100">
                                    <span className="font-mono font-black">{it.cantidad}x {it.codigoFardo}</span>
                                    <span className="truncate max-w-[140px] text-slate-600">({it.nombre})</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-mono font-black text-xs">
                                {s.fjTotalUnidades}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-xs text-slate-900">
                              ${s.fjTotalMonto.toLocaleString('es-CL')}
                            </td>
                            <td className="py-3 px-4 text-xs font-black uppercase text-slate-700">
                              {s.vendedor}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                s.estadoPago === 'Pagado'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {s.estadoPago}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => setExpandedSaleId(isExpanded ? null : s.id)}
                                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center mx-auto transition-all"
                                title="Ver detalles de la orden"
                              >
                                {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                              </button>
                            </td>
                          </tr>

                          {/* FILA EXPANDIBLE CON EL DETALLE COMPLETO DE LA VENTA */}
                          {isExpanded && (
                            <tr className="bg-slate-50/70 border-b border-slate-200">
                              <td colSpan={9} className="p-4">
                                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs font-bold text-slate-600">
                                    <div>
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Dirección de Entrega / Despacho</span>
                                      <p className="text-slate-800">{s.sale.direccion || 'Sin dirección registrada'} • {s.sale.agencia || s.sale.tipoDespacho || 'Retiro / Domicilio'}</p>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total General de la Orden</span>
                                      <p className="text-sm font-black text-slate-900 font-mono">${(s.totalVentaGeneral || 0).toLocaleString('es-CL')}</p>
                                    </div>
                                  </div>

                                  <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Desglose de Ítems FJ:</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                      {s.fjItems.map((it, idx) => (
                                        <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                                          <div>
                                            <p className="font-mono font-black text-emerald-700">{it.cantidad}x [{it.codigoFardo}]</p>
                                            <p className="text-[10px] text-slate-600 font-medium truncate max-w-[180px]">{it.nombre}</p>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-[10px] text-slate-400 font-mono">${it.valorUnitario.toLocaleString('es-CL')} c/u</p>
                                            <p className="font-mono font-black text-slate-900">${it.subtotal.toLocaleString('es-CL')}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {s.sale.observaciones && (
                                    <div className="pt-2 text-[11px] text-slate-500 font-medium">
                                      <span className="font-black text-slate-700">Observaciones:</span> {s.sale.observaciones}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                    {paginatedSales.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400 text-xs font-bold uppercase">
                          No se encontraron ventas de fardos FJ con los filtros seleccionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación de Ventas */}
              {filteredSales.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-500">
                    Mostrando página <strong className="text-slate-900">{salesPage}</strong> de <strong className="text-slate-900">{totalSalePages}</strong> ({filteredSales.length} ventas filtradas de {processedFjSales.length} totales)
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSalesPage(prev => Math.max(1, prev - 1))}
                      disabled={salesPage <= 1}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-black text-xs uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1 shadow-xs"
                    >
                      <ChevronLeft size={14} /> Anterior
                    </button>
                    <button
                      onClick={() => setSalesPage(prev => Math.min(totalSalePages, prev + 1))}
                      disabled={salesPage >= totalSalePages}
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
      )}

      {/* MODAL DE IMPRESIÓN OFICIAL DEL INFORME */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-black uppercase text-slate-900 flex items-center gap-2">
                  <Printer size={20} className="text-emerald-600" /> Informe Oficial: Proveedor FJ
                </h2>
                <p className="text-xs text-slate-500 font-medium">Documento ejecutivo de fardos e historial de ventas</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()} 
                  className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Printer size={16} /> Imprimir / PDF
                </button>
                <button 
                  onClick={() => setShowPrintModal(false)} 
                  className="bg-slate-100 text-slate-500 p-2 rounded-xl hover:bg-slate-200 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* Header impreso */}
              <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-end">
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-tight text-slate-950">
                    CUADERNO MDF • INFORME PROVEEDOR FJ
                  </h1>
                  <p className="text-xs text-slate-500 font-bold uppercase mt-1">
                    Gestión Integral de Fardos y Rendimiento Comercial
                  </p>
                </div>
                <div className="text-right text-xs font-bold text-slate-600">
                  <p>Fecha de Emisión: {new Date().toLocaleDateString('es-CL')}</p>
                  <p>Autorizado por: {currentUser?.nombre || 'Administración Central'}</p>
                </div>
              </div>

              {/* Resumen en 4 bloques */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Catálogo FJ</p>
                  <p className="text-lg font-black text-slate-900">{globalMetrics.totalCatalogoFardos} Fardos</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Stock Físico</p>
                  <p className="text-lg font-black text-emerald-700 font-mono">{globalMetrics.stockFisicoDisponible} u.</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Fardos Vendidos</p>
                  <p className="text-lg font-black text-slate-900 font-mono">{globalMetrics.totalUnidadesVendidas} u.</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Facturación Total</p>
                  <p className="text-lg font-black text-emerald-700 font-mono">${globalMetrics.totalRecaudacionFj.toLocaleString('es-CL')}</p>
                </div>
              </div>

              {/* Fardos con Stock Actual */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
                  Detalle de Fardos con Existencia en Bodega ({globalMetrics.fardosConStock} ítems)
                </h3>
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-300 bg-slate-100 font-black text-slate-600 uppercase">
                      <th className="p-2">Código</th>
                      <th className="p-2">Descripción</th>
                      <th className="p-2 text-center">Stock</th>
                      <th className="p-2 text-center">Vendidos</th>
                      <th className="p-2 text-right">Precio Sug.</th>
                      <th className="p-2 text-right">Total Vendido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {fardosSummaries.filter(f => f.stockActual > 0).map(f => (
                      <tr key={f.codigo}>
                        <td className="p-2 font-mono font-bold">{f.codigo}</td>
                        <td className="p-2 uppercase font-bold">{f.tipo}</td>
                        <td className="p-2 text-center font-mono font-black">{f.stockActual}</td>
                        <td className="p-2 text-center font-mono">{f.unidadesVendidas}</td>
                        <td className="p-2 text-right font-mono">${f.precioSugerido.toLocaleString('es-CL')}</td>
                        <td className="p-2 text-right font-mono font-bold">${f.montoVendido.toLocaleString('es-CL')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Resumen por Vendedora */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
                  Rendimiento por Vendedora
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {globalMetrics.sellersRanking.map(s => (
                    <div key={s.name} className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                      <p className="font-black uppercase">{s.name}</p>
                      <p className="text-slate-500 text-[10px]">{s.fardos} fardos • ${s.monto.toLocaleString('es-CL')}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8 border-t border-slate-200 flex justify-between text-xs text-slate-400 font-bold uppercase">
                <span>Cuaderno MDF • Sistema de Gestión de Fardos</span>
                <span>Firma Responsable Administración: _______________________</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
