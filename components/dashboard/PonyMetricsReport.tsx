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
  ShieldCheck,
  CreditCard,
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert,
  ArrowDownLeft,
  Flame,
  Award,
  RefreshCw
} from 'lucide-react';
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
import { Sale, StockItem, StaffRole } from '../../types';
import { useStore } from '../../store/GlobalContext';

interface PonyMetricsReportProps {
  sales: Sale[];
  stock: StockItem[];
  currentUser: { id?: string; nombre: string; rol: StaffRole } | null;
}

export const PonyMetricsReport: React.FC<PonyMetricsReportProps> = ({
  sales,
  stock,
  currentUser
}) => {
  const { playSound } = useStore();

  // Authentication & Master Permission State
  const isMasterAccount = useMemo(() => {
    if (!currentUser) return false;
    const name = (currentUser.nombre || '').trim().toUpperCase();
    const id = (currentUser.id || '').trim().toLowerCase();
    const role = currentUser.rol;

    return (
      id === 'master' ||
      name === 'ADMINISTRADOR MAESTRO' ||
      name.includes('ADMINISTRADOR MAESTRO') ||
      name === 'MASTER' ||
      (role === StaffRole.ADMIN && name.includes('MAESTRO'))
    );
  }, [currentUser]);

  const [unlockedWithPin, setUnlockedWithPin] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  const hasAccess = isMasterAccount || unlockedWithPin;

  // View state
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'resumen' | 'ventas' | 'stock' | 'productos'>('resumen');
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Date Filter
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'LAST30' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Sales Filters
  const [salesSearch, setSalesSearch] = useState<string>('');
  const [salesPaymentFilter, setSalesPaymentFilter] = useState<string>('ALL');
  const [salesDispatchFilter, setSalesDispatchFilter] = useState<string>('ALL');
  const [salesSellerFilter, setSalesSellerFilter] = useState<string>('ALL');
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [salesPage, setSalesPage] = useState<number>(1);
  const SALES_PER_PAGE = 10;

  // Stock Filters
  const [stockSearch, setStockSearch] = useState<string>('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'CRITICAL' | 'OUT_OF_STOCK' | 'NEGATIVE'>('ALL');
  const [stockSortBy, setStockSortBy] = useState<'codigo' | 'stock' | 'vendidos' | 'recaudacion' | 'precio'>('stock');
  const [stockSortAsc, setStockSortAsc] = useState<boolean>(false);
  const [stockPage, setStockPage] = useState<number>(1);
  const STOCK_PER_PAGE = 10;

  // Products Tab Filters
  const [productSearch, setProductSearch] = useState<string>('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<'ALL' | 'TOP' | 'AVAILABLE' | 'OUT_OF_STOCK'>('ALL');

  // --- 1. DETECCIÓN Y FILTRADO ESTRICTO DE PRODUCTOS CON ETIQUETA PONY ---
  const isPonyProduct = (item: StockItem | null | undefined): boolean => {
    if (!item) return false;
    const prov = (item.proveedor || '').trim().toUpperCase();
    const tipo = (item.tipo || '').trim().toUpperCase();
    const cod = (item.codigo || '').trim().toUpperCase();

    if (prov === 'PONY' || prov.startsWith('PONY') || prov.includes('PONY')) return true;
    if (tipo.includes('PONY')) return true;
    // Rango MDF-1000 a MDF-1050 identificado como fardos de partida PONY
    if (cod.startsWith('MDF-10') && (prov.includes('PONY') || tipo.includes('PONY'))) return true;
    return false;
  };

  const ponyStockItems = useMemo(() => {
    return (stock || []).filter(item => isPonyProduct(item));
  }, [stock]);

  const ponyCodesSet = useMemo(() => {
    const set = new Set<string>();
    ponyStockItems.forEach(item => {
      if (item.codigo) set.add(item.codigo.trim().toUpperCase());
    });
    return set;
  }, [ponyStockItems]);

  const stockByCode = useMemo(() => {
    const map = new Map<string, StockItem>();
    (stock || []).forEach(item => {
      if (item.codigo) map.set(item.codigo.trim().toUpperCase(), item);
    });
    return map;
  }, [stock]);

  // --- 2. FECHAS Y FILTRO TEMPORAL ---
  const parseDate = (dateStr?: string, timestamp?: string): Date | null => {
    if (timestamp) {
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) return d;
    }
    if (!dateStr || typeof dateStr !== 'string') return null;
    try {
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const [d, m, y] = parts;
          return new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
        }
      }
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            const [y, m, d] = parts;
            return new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
          } else {
            const [d, m, y] = parts;
            return new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
          }
        }
      }
      const parsed = new Date(dateStr);
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch {
      return null;
    }
  };

  const isWithinDateRange = (dateStr?: string, timestamp?: string): boolean => {
    if (dateFilter === 'ALL') return true;
    const saleDate = parseDate(dateStr, timestamp);
    if (!saleDate) return true;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (dateFilter === 'TODAY') {
      const sDay = new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate());
      return sDay.getTime() === today.getTime();
    }

    if (dateFilter === 'WEEK') {
      const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
      const monday = new Date(today);
      monday.setDate(today.getDate() - dayOfWeek);
      monday.setHours(0, 0, 0, 0);
      return saleDate >= monday;
    }

    if (dateFilter === 'MONTH') {
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return saleDate >= firstDayOfMonth;
    }

    if (dateFilter === 'LAST30') {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      return saleDate >= thirtyDaysAgo;
    }

    if (dateFilter === 'CUSTOM') {
      if (!customStartDate && !customEndDate) return true;
      const start = customStartDate ? new Date(customStartDate) : new Date('2020-01-01');
      const end = customEndDate ? new Date(customEndDate) : new Date('2035-12-31');
      end.setHours(23, 59, 59, 999);
      return saleDate >= start && saleDate <= end;
    }

    return true;
  };

  // --- 3. PROCESAMIENTO EXHAUSTIVO DE VENTAS CON ETIQUETA PONY ---
  interface ProcessedPonyItem {
    codigoFardo: string;
    nombre: string;
    cantidad: number;
    valorUnitario: number;
    subtotal: number;
  }

  interface ProcessedPonySale {
    id: string;
    sale: Sale;
    numeroVenta: number;
    fecha: string;
    hora?: string;
    cliente: string;
    telefono?: string;
    rut?: string;
    vendedor: string;
    estadoPago: string;
    tipoDespacho?: string;
    estadoDespacho?: string;
    totalVentaGeneral: number;
    ponyItems: ProcessedPonyItem[];
    ponyTotalUnidades: number;
    ponyTotalMonto: number;
    fechaParsed: Date | null;
  }

  const processedPonySales = useMemo(() => {
    const list: ProcessedPonySale[] = [];

    (sales || []).forEach(sale => {
      if (!sale) return;

      const itemsFound: ProcessedPonyItem[] = [];

      if (sale.items && Array.isArray(sale.items) && sale.items.length > 0) {
        sale.items.forEach(it => {
          const cod = (it.codigoFardo || '').trim().toUpperCase();
          const stockInfo = stockByCode.get(cod);
          const isPonyByCode = ponyCodesSet.has(cod);
          const isPonyByStock = isPonyProduct(stockInfo);
          const isPonyByText = cod.includes('PONY');

          if (isPonyByCode || isPonyByStock || isPonyByText) {
            const qty = Number(it.cantidad) || 1;
            const unitPrice = Number(it.valorUnitario) || 0;
            itemsFound.push({
              codigoFardo: it.codigoFardo || cod,
              nombre: stockInfo?.tipo || `Fardo PONY (${cod})`,
              cantidad: qty,
              valorUnitario: unitPrice,
              subtotal: qty * unitPrice
            });
          }
        });
      } else {
        const cod = (sale.codigoFardo || '').trim().toUpperCase();
        const variante = (sale.variante || '').trim().toUpperCase();
        const obs = (sale.observaciones || '').trim().toUpperCase();
        const stockInfo = stockByCode.get(cod);

        const isPonyByCode = ponyCodesSet.has(cod);
        const isPonyByStock = isPonyProduct(stockInfo);
        const isPonyByText = cod.includes('PONY') || variante.includes('PONY') || obs.includes('PONY');

        if (isPonyByCode || isPonyByStock || isPonyByText) {
          const qty = Number(sale.cantidad) || 1;
          const unitPrice = Number(sale.valorUnitario) || (Number(sale.total) / (qty || 1)) || 0;
          itemsFound.push({
            codigoFardo: sale.codigoFardo || cod || 'PONY',
            nombre: stockInfo?.tipo || sale.variante || 'Fardo Etiqueta PONY',
            cantidad: qty,
            valorUnitario: unitPrice,
            subtotal: Number(sale.total) || (qty * unitPrice)
          });
        }
      }

      if (itemsFound.length > 0) {
        const ponyTotalUnidades = itemsFound.reduce((acc, it) => acc + it.cantidad, 0);
        const ponyTotalMonto = itemsFound.reduce((acc, it) => acc + it.subtotal, 0);

        list.push({
          id: sale.id,
          sale,
          numeroVenta: Number(sale.numeroVenta) || 0,
          fecha: sale.fecha || 'Sin fecha',
          hora: sale.hora || '',
          cliente: sale.cliente || 'Cliente no especificado',
          telefono: sale.telefono || '',
          rut: sale.rut || '',
          vendedor: sale.vendedor || 'Vendedor no asignado',
          estadoPago: sale.estadoPago || 'Pendiente',
          tipoDespacho: sale.tipoDespacho,
          estadoDespacho: sale.estadoDespacho,
          totalVentaGeneral: Number(sale.total) || 0,
          ponyItems: itemsFound,
          ponyTotalUnidades,
          ponyTotalMonto,
          fechaParsed: parseDate(sale.fecha, sale.timestamp)
        });
      }
    });

    // Ordenar de más reciente a más antigua
    return list.sort((a, b) => {
      const timeA = a.fechaParsed ? a.fechaParsed.getTime() : 0;
      const timeB = b.fechaParsed ? b.fechaParsed.getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
      return b.numeroVenta - a.numeroVenta;
    });
  }, [sales, ponyCodesSet, stockByCode]);

  // Ventas PONY filtradas por período seleccionado
  const dateFilteredPonySales = useMemo(() => {
    return processedPonySales.filter(s => isWithinDateRange(s.fecha, s.sale.timestamp));
  }, [processedPonySales, dateFilter, customStartDate, customEndDate]);

  // --- 4. RESUMEN Y PERFORMANCE DE CADA PRODUCTO PONY ---
  interface PonyProductSummary {
    item: StockItem;
    codigo: string;
    tipo: string;
    proveedor: string;
    stockActual: number;
    precioCosto: number;
    precioSugerido: number;
    valorInventarioSugerido: number;
    valorInventarioCosto: number;
    unidadesVendidas: number;
    montoVendido: number;
    ordenesCount: number;
    rotacionPorcentaje: number;
    estadoStock: 'DISPONIBLE' | 'CRITICO' | 'AGOTADO' | 'NEGATIVO';
  }

  const ponyProductsSummaries = useMemo(() => {
    // Mapa acumulador de ventas por código
    const salesAgg: Record<string, { unidades: number; monto: number; ordenes: number }> = {};

    dateFilteredPonySales.forEach(sale => {
      sale.ponyItems.forEach(it => {
        const cod = (it.codigoFardo || '').trim().toUpperCase();
        if (!salesAgg[cod]) salesAgg[cod] = { unidades: 0, monto: 0, ordenes: 0 };
        salesAgg[cod].unidades += it.cantidad;
        salesAgg[cod].monto += it.subtotal;
        salesAgg[cod].ordenes += 1;
      });
    });

    return ponyStockItems.map(item => {
      const cod = (item.codigo || '').trim().toUpperCase();
      const s = salesAgg[cod] || { unidades: 0, monto: 0, ordenes: 0 };

      const stockActual = Number(item.stockActual) || 0;
      const precioCosto = Number(item.precioCosto) || 0;
      const precioSugerido = Number(item.precioSugerido) || 0;
      const valorInventarioSugerido = Math.max(0, stockActual) * precioSugerido;
      const valorInventarioCosto = Math.max(0, stockActual) * precioCosto;

      const totalHistorico = stockActual + s.unidades;
      const rotacionPorcentaje = totalHistorico > 0 ? Math.round((s.unidades / totalHistorico) * 100) : 0;

      let estadoStock: PonyProductSummary['estadoStock'] = 'DISPONIBLE';
      if (stockActual < 0) estadoStock = 'NEGATIVO';
      else if (stockActual === 0) estadoStock = 'AGOTADO';
      else if (stockActual <= 3) estadoStock = 'CRITICO';

      return {
        item,
        codigo: item.codigo,
        tipo: item.tipo,
        proveedor: item.proveedor || 'PONY',
        stockActual,
        precioCosto,
        precioSugerido,
        valorInventarioSugerido,
        valorInventarioCosto,
        unidadesVendidas: s.unidades,
        montoVendido: s.monto,
        ordenesCount: s.ordenes,
        rotacionPorcentaje,
        estadoStock
      };
    });
  }, [ponyStockItems, dateFilteredPonySales]);

  // --- 5. MÉTRICAS GLOBALES EJECUTIVAS ---
  const globalMetrics = useMemo(() => {
    const totalVariedades = ponyStockItems.length;
    const stockFisicoDisponible = ponyStockItems.reduce((acc, item) => acc + (Number(item.stockActual) || 0), 0);
    const variedadesConStock = ponyStockItems.filter(item => (Number(item.stockActual) || 0) > 0).length;
    const variedadesAgotadas = ponyStockItems.filter(item => (Number(item.stockActual) || 0) === 0).length;
    const variedadesCriticas = ponyStockItems.filter(item => (Number(item.stockActual) || 0) > 0 && (Number(item.stockActual) || 0) <= 3).length;

    const valorStockVenta = ponyProductsSummaries.reduce((acc, p) => acc + p.valorInventarioSugerido, 0);
    const valorStockCosto = ponyProductsSummaries.reduce((acc, p) => acc + p.valorInventarioCosto, 0);
    const margenBrutoPotencial = valorStockVenta - valorStockCosto;

    const totalVentasMonto = dateFilteredPonySales.reduce((acc, s) => acc + s.ponyTotalMonto, 0);
    const totalFardosVendidos = dateFilteredPonySales.reduce((acc, s) => acc + s.ponyTotalUnidades, 0);
    const totalOrdenesRegistradas = dateFilteredPonySales.length;

    const ticketPromedioFardo = totalFardosVendidos > 0 ? Math.round(totalVentasMonto / totalFardosVendidos) : 0;
    const ticketPromedioOrden = totalOrdenesRegistradas > 0 ? Math.round(totalVentasMonto / totalOrdenesRegistradas) : 0;

    const ventasPagadasMonto = dateFilteredPonySales
      .filter(s => (s.estadoPago || '').toUpperCase().includes('PAGAD'))
      .reduce((acc, s) => acc + s.ponyTotalMonto, 0);
    const ventasPendientesMonto = totalVentasMonto - ventasPagadasMonto;

    // Ranking de Vendedores
    const sellerMap: Record<string, { fardos: number; monto: number; ordenes: number }> = {};
    dateFilteredPonySales.forEach(s => {
      const v = s.vendedor;
      if (!sellerMap[v]) sellerMap[v] = { fardos: 0, monto: 0, ordenes: 0 };
      sellerMap[v].fardos += s.ponyTotalUnidades;
      sellerMap[v].monto += s.ponyTotalMonto;
      sellerMap[v].ordenes += 1;
    });

    const sellersRanking = Object.entries(sellerMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.monto - a.monto);

    // Top 8 Fardos Más Vendidos
    const topProducts = [...ponyProductsSummaries]
      .filter(p => p.unidadesVendidas > 0)
      .sort((a, b) => b.unidadesVendidas - a.unidadesVendidas)
      .slice(0, 8);

    // Top Fardos con Mayor Stock
    const topStockProducts = [...ponyProductsSummaries]
      .filter(p => p.stockActual > 0)
      .sort((a, b) => b.stockActual - a.stockActual)
      .slice(0, 6);

    return {
      totalVariedades,
      stockFisicoDisponible,
      variedadesConStock,
      variedadesAgotadas,
      variedadesCriticas,
      valorStockVenta,
      valorStockCosto,
      margenBrutoPotencial,
      totalVentasMonto,
      totalFardosVendidos,
      totalOrdenesRegistradas,
      ticketPromedioFardo,
      ticketPromedioOrden,
      ventasPagadasMonto,
      ventasPendientesMonto,
      sellersRanking,
      topProducts,
      topStockProducts
    };
  }, [ponyStockItems, ponyProductsSummaries, dateFilteredPonySales]);

  // --- 6. DATOS PARA GRÁFICO DE TENDENCIA DE VENTAS PONY ---
  const chartSalesTrend = useMemo(() => {
    const buckets: Record<string, { dateLabel: string; totalMonto: number; fardos: number; sortKey: number }> = {};

    dateFilteredPonySales.forEach(s => {
      if (!s.fechaParsed) return;
      const key = `${s.fechaParsed.getFullYear()}-${String(s.fechaParsed.getMonth() + 1).padStart(2, '0')}`;
      const label = s.fechaParsed.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' });
      const sortKey = s.fechaParsed.getFullYear() * 100 + (s.fechaParsed.getMonth() + 1);

      if (!buckets[key]) {
        buckets[key] = { dateLabel: label, totalMonto: 0, fardos: 0, sortKey };
      }
      buckets[key].totalMonto += s.ponyTotalMonto;
      buckets[key].fardos += s.ponyTotalUnidades;
    });

    const list = Object.values(buckets).sort((a, b) => a.sortKey - b.sortKey);
    // Si hay pocos meses o es filtro reciente, mostramos los últimos
    return list.slice(-12);
  }, [dateFilteredPonySales]);

  // --- 7. FILTRADO Y PAGINACIÓN DE VENTAS ---
  const filteredSales = useMemo(() => {
    let list = [...dateFilteredPonySales];

    // Search filter
    if (salesSearch.trim()) {
      const term = salesSearch.toLowerCase().trim();
      list = list.filter(s => {
        const matchNum = String(s.numeroVenta).includes(term);
        const matchCli = s.cliente.toLowerCase().includes(term);
        const matchTel = (s.telefono || '').toLowerCase().includes(term);
        const matchVend = s.vendedor.toLowerCase().includes(term);
        const matchItems = s.ponyItems.some(it => 
          it.codigoFardo.toLowerCase().includes(term) || it.nombre.toLowerCase().includes(term)
        );
        return matchNum || matchCli || matchTel || matchVend || matchItems;
      });
    }

    // Payment Filter
    if (salesPaymentFilter !== 'ALL') {
      list = list.filter(s => {
        const isPagado = (s.estadoPago || '').toUpperCase().includes('PAGAD');
        return salesPaymentFilter === 'PAGADO' ? isPagado : !isPagado;
      });
    }

    // Dispatch Filter
    if (salesDispatchFilter !== 'ALL') {
      list = list.filter(s => {
        const dType = (s.tipoDespacho || '').toUpperCase();
        const dStatus = (s.estadoDespacho || '').toUpperCase();
        if (salesDispatchFilter === 'ENTREGADO') return dStatus.includes('ENTREGADO');
        if (salesDispatchFilter === 'RETIRO') return dType.includes('RETIRO');
        if (salesDispatchFilter === 'DOMICILIO') return dType.includes('DOMICILIO');
        if (salesDispatchFilter === 'AGENCIA') return dType.includes('AGENCIA');
        return true;
      });
    }

    // Seller Filter
    if (salesSellerFilter !== 'ALL') {
      list = list.filter(s => s.vendedor.toUpperCase() === salesSellerFilter.toUpperCase());
    }

    return list;
  }, [dateFilteredPonySales, salesSearch, salesPaymentFilter, salesDispatchFilter, salesSellerFilter]);

  const paginatedSales = useMemo(() => {
    const start = (salesPage - 1) * SALES_PER_PAGE;
    return filteredSales.slice(start, start + SALES_PER_PAGE);
  }, [filteredSales, salesPage]);

  const totalSalesPages = Math.ceil(filteredSales.length / SALES_PER_PAGE) || 1;

  // --- 8. FILTRADO Y PAGINACIÓN DE STOCK ---
  const filteredStockList = useMemo(() => {
    let list = [...ponyProductsSummaries];

    // Search
    if (stockSearch.trim()) {
      const term = stockSearch.toLowerCase().trim();
      list = list.filter(p => 
        p.codigo.toLowerCase().includes(term) ||
        p.tipo.toLowerCase().includes(term)
      );
    }

    // Status
    if (stockStatusFilter === 'IN_STOCK') {
      list = list.filter(p => p.stockActual > 0);
    } else if (stockStatusFilter === 'CRITICAL') {
      list = list.filter(p => p.stockActual > 0 && p.stockActual <= 3);
    } else if (stockStatusFilter === 'OUT_OF_STOCK') {
      list = list.filter(p => p.stockActual === 0);
    } else if (stockStatusFilter === 'NEGATIVE') {
      list = list.filter(p => p.stockActual < 0);
    }

    // Sort
    list.sort((a, b) => {
      if (stockSortBy === 'codigo') {
        return stockSortAsc 
          ? a.codigo.localeCompare(b.codigo) 
          : b.codigo.localeCompare(a.codigo);
      }
      let valA = 0;
      let valB = 0;
      if (stockSortBy === 'stock') {
        valA = a.stockActual;
        valB = b.stockActual;
      } else if (stockSortBy === 'vendidos') {
        valA = a.unidadesVendidas;
        valB = b.unidadesVendidas;
      } else if (stockSortBy === 'recaudacion') {
        valA = a.montoVendido;
        valB = b.montoVendido;
      } else if (stockSortBy === 'precio') {
        valA = a.precioSugerido;
        valB = b.precioSugerido;
      }
      return stockSortAsc ? valA - valB : valB - valA;
    });

    return list;
  }, [ponyProductsSummaries, stockSearch, stockStatusFilter, stockSortBy, stockSortAsc]);

  const paginatedStock = useMemo(() => {
    const start = (stockPage - 1) * STOCK_PER_PAGE;
    return filteredStockList.slice(start, start + STOCK_PER_PAGE);
  }, [filteredStockList, stockPage]);

  const totalStockPages = Math.ceil(filteredStockList.length / STOCK_PER_PAGE) || 1;

  // --- 9. FILTRADO PARA PESTAÑA CATÁLOGO DE PRODUCTOS ---
  const filteredCatalogProducts = useMemo(() => {
    let list = [...ponyProductsSummaries];

    if (productSearch.trim()) {
      const term = productSearch.toLowerCase().trim();
      list = list.filter(p => 
        p.codigo.toLowerCase().includes(term) ||
        p.tipo.toLowerCase().includes(term)
      );
    }

    if (productCategoryFilter === 'TOP') {
      list = list.filter(p => p.unidadesVendidas >= 5).sort((a, b) => b.unidadesVendidas - a.unidadesVendidas);
    } else if (productCategoryFilter === 'AVAILABLE') {
      list = list.filter(p => p.stockActual > 0);
    } else if (productCategoryFilter === 'OUT_OF_STOCK') {
      list = list.filter(p => p.stockActual <= 0);
    }

    return list;
  }, [ponyProductsSummaries, productSearch, productCategoryFilter]);

  // Lista de vendedores únicos para el selector de filtros
  const uniqueSellers = useMemo(() => {
    const s = new Set<string>();
    dateFilteredPonySales.forEach(sale => {
      if (sale.vendedor) s.add(sale.vendedor);
    });
    return Array.from(s).sort();
  }, [dateFilteredPonySales]);

  // Manejo del PIN Maestro
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '2024') {
      playSound('success');
      setUnlockedWithPin(true);
      setPinError(null);
    } else {
      playSound('error');
      setPinError('PIN Maestro incorrecto. Acceso denegado.');
    }
  };

  // Exportar Ventas a CSV compatible con Excel en Chile
  const handleExportSalesCsv = () => {
    playSound('click');
    const headers = [
      'N° Venta',
      'Fecha',
      'Cliente',
      'RUT',
      'Teléfono',
      'Vendedor',
      'Fardos PONY (Detalle)',
      'Total Unidades PONY',
      'Monto Fardos PONY (CLP)',
      'Total Venta General (CLP)',
      'Estado Pago',
      'Tipo Despacho',
      'Estado Despacho'
    ];

    const rows = filteredSales.map(s => [
      s.numeroVenta,
      `"${s.fecha}"`,
      `"${s.cliente.replace(/"/g, '""')}"`,
      `"${s.rut || ''}"`,
      `"${s.telefono || ''}"`,
      `"${s.vendedor.replace(/"/g, '""')}"`,
      `"${s.ponyItems.map(it => `${it.cantidad}x ${it.codigoFardo} (${it.nombre})`).join(' | ')}"`,
      s.ponyTotalUnidades,
      s.ponyTotalMonto,
      s.totalVentaGeneral,
      `"${s.estadoPago}"`,
      `"${s.tipoDespacho || ''}"`,
      `"${s.estadoDespacho || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Ventas_Fardos_Etiqueta_PONY_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar Stock a CSV
  const handleExportStockCsv = () => {
    playSound('click');
    const headers = [
      'Código',
      'Descripción / Tipo',
      'Proveedor / Etiqueta',
      'Stock Actual (u)',
      'Unidades Vendidas',
      'Recaudación Total (CLP)',
      'Precio Costo (CLP)',
      'Precio Sugerido (CLP)',
      'Valorización en Bodega (CLP)',
      'Estado'
    ];

    const rows = filteredStockList.map(p => [
      `"${p.codigo}"`,
      `"${p.tipo.replace(/"/g, '""')}"`,
      '"PONY"',
      p.stockActual,
      p.unidadesVendidas,
      p.montoVendido,
      p.precioCosto,
      p.precioSugerido,
      p.valorInventarioSugerido,
      `"${p.estadoStock}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Inventario_Stock_Etiqueta_PONY_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- VISTA BLOQUEADA SI NO ES ADMINISTRADOR MAESTRO Y NO HA INGRESADO EL PIN ---
  if (!hasAccess) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-950 rounded-[40px] border-2 border-purple-500/30 p-8 shadow-2xl relative overflow-hidden text-white my-8">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <ShieldAlert size={280} />
        </div>

        <div className="max-w-xl mx-auto text-center relative z-10 py-6">
          <div className="w-20 h-20 bg-purple-500/20 text-purple-400 border-2 border-purple-400/40 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-xl shadow-purple-950">
            <Lock size={36} />
          </div>

          <span className="px-3.5 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 mb-3">
            <ShieldCheck size={13} /> Área Reservada • Cuenta Maestro
          </span>

          <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
            Métricas Exclusivas: <span className="text-purple-400 italic">Etiqueta PONY</span>
          </h3>

          <p className="text-slate-300 text-sm mt-3 leading-relaxed">
            Este panel contiene auditorías comerciales, márgenes, inventario crítico y ventas detalladas de los productos con etiqueta <span className="font-bold text-white uppercase">PONY</span>. 
            Disponible exclusivamente para la cuenta <span className="font-black text-amber-300">ADMINISTRADOR MAESTRO</span>.
          </p>

          <form onSubmit={handlePinSubmit} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm mx-auto">
            <div className="relative w-full">
              <KeyRound size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
              <input 
                type="password"
                placeholder="PIN Maestro..."
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(null);
                }}
                className="w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-purple-500/40 rounded-2xl text-white placeholder-slate-500 font-mono text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                maxLength={8}
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <Unlock size={16} /> Desbloquear
            </button>
          </form>

          {pinError && (
            <p className="text-rose-400 text-xs font-bold mt-3 animate-shake">
              ⚠️ {pinError}
            </p>
          )}

          <p className="text-slate-400 text-[11px] font-medium mt-6">
            Inicia sesión con la cuenta <strong className="text-slate-200">ADMINISTRADOR MAESTRO</strong> o digita el PIN de seguridad.
          </p>
        </div>
      </div>
    );
  }

  // --- VISTA PRINCIPAL AUTORIZADA PARA ADMINISTRADOR MAESTRO ---
  return (
    <div id="pony-metrics-dashboard-section" className="bg-white rounded-[40px] border-2 border-purple-200 shadow-2xl overflow-hidden relative transition-all my-8">
      {/* 1. HEADER PRINCIPAL PREMIUM */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Layers size={180} />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-fuchsia-500 to-indigo-600 text-white font-black rounded-3xl flex items-center justify-center text-xl shadow-xl shadow-purple-500/25 shrink-0 border border-white/20">
              PONY
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-xs">
                  <ShieldCheck size={13} className="text-amber-400" /> Exclusivo Administrador Maestro
                </span>
                <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Etiqueta "PONY"
                </span>
                <span className="px-2.5 py-0.5 bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
                  {globalMetrics.totalVariedades} Productos en Catálogo
                </span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight mt-1.5 flex items-center gap-2 text-white">
                Métricas & Control Comercial <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-300 to-indigo-300 italic">Etiqueta PONY</span>
              </h3>
              <p className="text-slate-300 text-xs font-medium mt-1">
                Auditoría financiera, rotación de stock, catálogo de fardos y trazabilidad de {globalMetrics.totalOrdenesRegistradas} ventas registradas para la línea PONY.
              </p>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                playSound('click');
                setShowPrintModal(true);
              }}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 border border-white/10 shadow-xs"
              title="Imprimir informe oficial para Administrador Maestro"
            >
              <Printer size={15} /> Imprimir Informe
            </button>

            <button
              onClick={handleExportSalesCsv}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-purple-600/30"
              title="Descargar historial de ventas en formato CSV / Excel"
            >
              <Download size={15} /> Exportar Ventas
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all"
              title={isExpanded ? 'Contraer panel' : 'Expandir panel'}
            >
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>

        {/* 2. BARRA DE FILTROS TEMPORALES */}
        {isExpanded && (
          <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <Calendar size={13} /> Período:
              </span>
              {[
                { id: 'ALL', label: 'Histórico Completo' },
                { id: 'TODAY', label: 'Hoy' },
                { id: 'WEEK', label: 'Esta Semana' },
                { id: 'MONTH', label: 'Este Mes' },
                { id: 'LAST30', label: 'Últimos 30 Días' },
                { id: 'CUSTOM', label: 'Personalizado' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => {
                    playSound('click');
                    setDateFilter(f.id as any);
                    setSalesPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                    dateFilter === f.id
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md shadow-purple-500/20'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {dateFilter === 'CUSTOM' && (
              <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
                <input 
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-slate-900 text-white text-xs px-2.5 py-1 rounded-xl border border-white/10 focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
                <span className="text-slate-400 text-xs font-bold">a</span>
                <input 
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-slate-900 text-white text-xs px-2.5 py-1 rounded-xl border border-white/10 focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="p-6 md:p-8 space-y-8 bg-slate-50/50">
          {/* 3. TARJETAS DE MÉTRICAS EJECUTIVAS (TOP KPIS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Facturación Total Ventas PONY */}
            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <DollarSign size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ventas Totales PONY</p>
              <h4 className="text-2xl md:text-3xl font-black text-slate-900 font-mono tracking-tight mt-1">
                ${globalMetrics.totalVentasMonto.toLocaleString('es-CL')}
              </h4>
              <div className="flex items-center justify-between mt-3 text-[11px] font-semibold text-slate-500 pt-3 border-t border-slate-100">
                <span>{globalMetrics.totalOrdenesRegistradas} órdenes</span>
                <span className="text-purple-600 font-bold">
                  Avg: ${globalMetrics.ticketPromedioFardo.toLocaleString('es-CL')}/fardo
                </span>
              </div>
            </div>

            {/* KPI 2: Fardos Vendidos */}
            <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Package size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fardos PONY Vendidos</p>
              <h4 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mt-1">
                {globalMetrics.totalFardosVendidos} <span className="text-base font-bold text-slate-400">unidades</span>
              </h4>
              <div className="flex items-center justify-between mt-3 text-[11px] font-semibold text-slate-500 pt-3 border-t border-slate-100">
                <span className="text-emerald-600 font-bold">
                  ${globalMetrics.ventasPagadasMonto.toLocaleString('es-CL')} Pagado
                </span>
                <span className="text-amber-600 font-bold">
                  ${globalMetrics.ventasPendientesMonto.toLocaleString('es-CL')} Pend.
                </span>
              </div>
            </div>

            {/* KPI 3: Stock Físico Disponible en Bodega */}
            <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Boxes size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Disponible PONY</p>
              <h4 className="text-2xl md:text-3xl font-black text-emerald-600 tracking-tight mt-1">
                {globalMetrics.stockFisicoDisponible} <span className="text-base font-bold text-slate-400">fardos</span>
              </h4>
              <div className="flex items-center justify-between mt-3 text-[11px] font-semibold text-slate-500 pt-3 border-t border-slate-100">
                <span>{globalMetrics.variedadesConStock} con stock</span>
                <span className="text-rose-600 font-bold">{globalMetrics.variedadesAgotadas} agotados</span>
              </div>
            </div>

            {/* KPI 4: Valorización de Stock en Bodega */}
            <div className="bg-white p-6 rounded-3xl border border-fuchsia-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <TrendingUp size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valorización Stock en Bodega</p>
              <h4 className="text-2xl md:text-3xl font-black text-slate-900 font-mono tracking-tight mt-1">
                ${globalMetrics.valorStockVenta.toLocaleString('es-CL')}
              </h4>
              <div className="flex items-center justify-between mt-3 text-[11px] font-semibold text-slate-500 pt-3 border-t border-slate-100">
                <span>Costo: ${globalMetrics.valorStockCosto.toLocaleString('es-CL')}</span>
                <span className="text-fuchsia-600 font-bold">
                  Margen: ${globalMetrics.margenBrutoPotencial.toLocaleString('es-CL')}
                </span>
              </div>
            </div>
          </div>

          {/* 4. BARRA DE PESTAÑAS (TABS) */}
          <div className="flex border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto pb-1">
            <button
              onClick={() => {
                playSound('click');
                setActiveTab('resumen');
              }}
              className={`pb-3 px-4 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 border-b-2 ${
                activeTab === 'resumen'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <BarChart3 size={16} /> Resumen Ejecutivo & Gráficos
            </button>

            <button
              onClick={() => {
                playSound('click');
                setActiveTab('ventas');
              }}
              className={`pb-3 px-4 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 border-b-2 ${
                activeTab === 'ventas'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <DollarSign size={16} /> Ventas PONY
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'ventas' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {filteredSales.length}
              </span>
            </button>

            <button
              onClick={() => {
                playSound('click');
                setActiveTab('stock');
              }}
              className={`pb-3 px-4 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 border-b-2 ${
                activeTab === 'stock'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <Boxes size={16} /> Inventario & Stock
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'stock' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {globalMetrics.totalVariedades}
              </span>
            </button>

            <button
              onClick={() => {
                playSound('click');
                setActiveTab('productos');
              }}
              className={`pb-3 px-4 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 border-b-2 ${
                activeTab === 'productos'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <Tag size={16} /> Catálogo de Productos
            </button>
          </div>

          {/* 5. CONTENIDO DE LAS PESTAÑAS */}

          {/* === TAB 1: RESUMEN EJECUTIVO & GRÁFICOS === */}
          {activeTab === 'resumen' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Gráfico de Tendencia Histórica de Ventas PONY */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                        <TrendingUp size={16} className="text-purple-600" /> Evolución de Ventas PONY en el Tiempo
                      </h4>
                      <p className="text-slate-400 text-xs font-medium">Facturación mensual de productos con etiqueta PONY</p>
                    </div>
                    <span className="text-xs font-mono font-bold px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-100">
                      Total: ${globalMetrics.totalVentasMonto.toLocaleString('es-CL')}
                    </span>
                  </div>

                  <div className="h-64 w-full">
                    {chartSalesTrend.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartSalesTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="ponySalesGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#9333ea" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#9333ea" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#64748b' }} />
                          <YAxis 
                            tick={{ fontSize: 11, fill: '#64748b' }} 
                            tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                          />
                          <Tooltip 
                            formatter={(value: any) => [`$${Number(value || 0).toLocaleString('es-CL')}`, 'Ventas PONY']}
                            labelFormatter={(label) => `Período: ${label}`}
                            contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="totalMonto" 
                            stroke="#9333ea" 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#ponySalesGradient)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                        No hay datos temporales suficientes para el período seleccionado.
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Vendedores de Fardos PONY */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                        <Award size={16} className="text-amber-500" /> Ranking Vendedores PONY
                      </h4>
                      <p className="text-slate-400 text-xs font-medium">Colaboradores con mayor volumen PONY</p>
                    </div>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto max-h-64 pr-1">
                    {globalMetrics.sellersRanking.length > 0 ? (
                      globalMetrics.sellersRanking.map((s, idx) => (
                        <div key={s.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl hover:bg-purple-50/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                              idx === 0 
                                ? 'bg-amber-400 text-slate-950 shadow-xs' 
                                : idx === 1 
                                  ? 'bg-slate-300 text-slate-800' 
                                  : idx === 2 
                                    ? 'bg-amber-700/20 text-amber-900' 
                                    : 'bg-slate-200 text-slate-600'
                            }`}>
                              {idx + 1}
                            </span>
                            <div>
                              <p className="text-xs font-black text-slate-800">{s.name}</p>
                              <p className="text-[10px] text-slate-400 font-semibold">{s.ordenes} órdenes • {s.fardos} fardos</p>
                            </div>
                          </div>
                          <span className="text-xs font-black font-mono text-purple-700">
                            ${s.monto.toLocaleString('es-CL')}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 text-xs text-center py-8">No hay ventas registradas en este período.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Fardos Más Vendidos vs Fardos con Mayor Stock */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top 6 Fardos PONY Más Vendidos */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                      <Flame size={16} className="text-rose-500" /> Fardos PONY "Estrella" (Más Vendidos)
                    </h4>
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Por unidades</span>
                  </div>

                  <div className="space-y-2.5">
                    {globalMetrics.topProducts.slice(0, 5).map(prod => (
                      <div key={prod.codigo} className="p-3.5 bg-slate-50 rounded-2xl flex items-center justify-between hover:bg-slate-100/70 transition-colors">
                        <div className="flex-1 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black font-mono px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md">
                              {prod.codigo}
                            </span>
                            <span className="text-xs font-black text-slate-900 line-clamp-1">{prod.tipo}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                            <span>Stock actual: <strong className={prod.stockActual > 0 ? 'text-emerald-600' : 'text-rose-600'}>{prod.stockActual} u.</strong></span>
                            <span>•</span>
                            <span>Sugerido: ${prod.precioSugerido.toLocaleString('es-CL')}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-purple-700 block">{prod.unidadesVendidas} vendidos</span>
                          <span className="text-[10px] font-mono text-slate-400 font-bold">${prod.montoVendido.toLocaleString('es-CL')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fardos PONY con Mayor Stock en Bodega */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                      <Boxes size={16} className="text-emerald-600" /> Fardos PONY con Mayor Stock Físico
                    </h4>
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Disponibilidad en Bodega</span>
                  </div>

                  <div className="space-y-2.5">
                    {globalMetrics.topStockProducts.slice(0, 5).map(prod => (
                      <div key={prod.codigo} className="p-3.5 bg-slate-50 rounded-2xl flex items-center justify-between hover:bg-slate-100/70 transition-colors">
                        <div className="flex-1 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black font-mono px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                              {prod.codigo}
                            </span>
                            <span className="text-xs font-black text-slate-900 line-clamp-1">{prod.tipo}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                            <span>Vendidos hist.: <strong>{prod.unidadesVendidas} u.</strong></span>
                            <span>•</span>
                            <span>Valor en Bodega: ${prod.valorInventarioSugerido.toLocaleString('es-CL')}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black text-emerald-600 block">{prod.stockActual} u.</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">En Bodega</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === TAB 2: VENTAS DETALLADAS DE FARDOS PONY === */}
          {activeTab === 'ventas' && (
            <div className="space-y-4">
              {/* Controles y Filtros de Búsqueda de Ventas */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                  {/* Buscador */}
                  <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Buscar por N° venta, cliente, fardo, vendedora..."
                      value={salesSearch}
                      onChange={(e) => {
                        setSalesSearch(e.target.value);
                        setSalesPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    {salesSearch && (
                      <button 
                        onClick={() => setSalesSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Filtro Estado Pago */}
                  <select
                    value={salesPaymentFilter}
                    onChange={(e) => {
                      setSalesPaymentFilter(e.target.value);
                      setSalesPage(1);
                    }}
                    className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="ALL">Todos los Pagos</option>
                    <option value="PAGADO">Solo Pagados</option>
                    <option value="PENDIENTE">Solo Pendientes</option>
                  </select>

                  {/* Filtro Despacho */}
                  <select
                    value={salesDispatchFilter}
                    onChange={(e) => {
                      setSalesDispatchFilter(e.target.value);
                      setSalesPage(1);
                    }}
                    className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="ALL">Todos los Despachos</option>
                    <option value="ENTREGADO">Entregados</option>
                    <option value="DOMICILIO">Domicilio</option>
                    <option value="RETIRO">Retiro en Bodega</option>
                    <option value="AGENCIA">Agencia</option>
                  </select>

                  {/* Filtro Vendedor */}
                  {uniqueSellers.length > 0 && (
                    <select
                      value={salesSellerFilter}
                      onChange={(e) => {
                        setSalesSellerFilter(e.target.value);
                        setSalesPage(1);
                      }}
                      className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 max-w-[160px]"
                    >
                      <option value="ALL">Todas las Vendedoras</option>
                      {uniqueSellers.map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-bold">
                    {filteredSales.length} ventas encontradas
                  </span>
                  <button
                    onClick={handleExportSalesCsv}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Download size={14} /> CSV
                  </button>
                </div>
              </div>

              {/* Tabla de Ventas PONY */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="py-4 px-4">N° Venta</th>
                        <th className="py-4 px-4">Fecha</th>
                        <th className="py-4 px-4">Cliente</th>
                        <th className="py-4 px-4">Vendedora</th>
                        <th className="py-4 px-4">Fardos PONY</th>
                        <th className="py-4 px-4 text-center">Unidades</th>
                        <th className="py-4 px-4 text-right">Monto PONY</th>
                        <th className="py-4 px-4 text-center">Pago</th>
                        <th className="py-4 px-4 text-center">Despacho</th>
                        <th className="py-4 px-4 text-center">Detalle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                      {paginatedSales.length > 0 ? (
                        paginatedSales.map(s => {
                          const isExpandedRow = expandedSaleId === s.id;
                          const isPagado = (s.estadoPago || '').toUpperCase().includes('PAGAD');

                          return (
                            <React.Fragment key={s.id}>
                              <tr className="hover:bg-purple-50/30 transition-colors">
                                <td className="py-3.5 px-4 font-mono font-black text-purple-700">
                                  #{s.numeroVenta}
                                </td>
                                <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                                  {s.fecha}
                                </td>
                                <td className="py-3.5 px-4 font-bold text-slate-900">
                                  <div>{s.cliente}</div>
                                  {s.telefono && (
                                    <span className="text-[10px] font-normal text-slate-400">{s.telefono}</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-slate-600 font-semibold whitespace-nowrap">
                                  {s.vendedor}
                                </td>
                                <td className="py-3.5 px-4 max-w-xs">
                                  <div className="flex flex-wrap gap-1">
                                    {s.ponyItems.map((it, idx) => (
                                      <span key={idx} className="px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-800 rounded-md text-[10px] font-bold line-clamp-1">
                                        {it.cantidad > 1 ? `${it.cantidad}x ` : ''}{it.codigoFardo} - {it.nombre}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 text-center font-black text-slate-900">
                                  {s.ponyTotalUnidades}
                                </td>
                                <td className="py-3.5 px-4 text-right font-mono font-black text-purple-700 whitespace-nowrap">
                                  ${s.ponyTotalMonto.toLocaleString('es-CL')}
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                    isPagado 
                                      ? 'bg-emerald-100 text-emerald-800' 
                                      : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {s.estadoPago}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">
                                    {s.tipoDespacho || 'Despacho'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <button
                                    onClick={() => setExpandedSaleId(isExpandedRow ? null : s.id)}
                                    className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-colors"
                                    title="Ver detalle completo"
                                  >
                                    {isExpandedRow ? <ChevronUp size={16} /> : <Eye size={16} />}
                                  </button>
                                </td>
                              </tr>

                              {/* Fila expandible con detalle completo de la orden */}
                              {isExpandedRow && (
                                <tr className="bg-purple-50/20 border-b border-purple-100">
                                  <td colSpan={10} className="p-4">
                                    <div className="bg-white p-4 rounded-2xl border border-purple-100 space-y-3">
                                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                        <div className="flex items-center gap-3">
                                          <span className="text-xs font-black text-purple-800">
                                            Desglose Ítems PONY de Venta #{s.numeroVenta}
                                          </span>
                                          <span className="text-xs text-slate-500">
                                            Cliente: <strong>{s.cliente}</strong> (RUT: {s.rut || 'No registra'})
                                          </span>
                                        </div>
                                        <span className="text-xs font-mono font-bold text-slate-600">
                                          Total General Orden: ${s.totalVentaGeneral.toLocaleString('es-CL')}
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                        {s.ponyItems.map((it, idx) => (
                                          <div key={idx} className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-xs">
                                            <div className="flex items-center justify-between font-black text-purple-900 mb-1">
                                              <span>{it.codigoFardo}</span>
                                              <span>${it.subtotal.toLocaleString('es-CL')}</span>
                                            </div>
                                            <p className="text-slate-600 line-clamp-1 font-medium">{it.nombre}</p>
                                            <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
                                              <span>Cantidad: {it.cantidad} fardo(s)</span>
                                              <span>Unitario: ${it.valorUnitario.toLocaleString('es-CL')}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={10} className="py-12 text-center text-slate-400">
                            No se encontraron ventas de productos con etiqueta PONY con los filtros seleccionados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginador de Ventas */}
                {totalSalesPages > 1 && (
                  <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between">
                    <p className="text-xs text-slate-500 font-semibold">
                      Mostrando página {salesPage} de {totalSalesPages} ({filteredSales.length} ventas)
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSalesPage(p => Math.max(1, p - 1))}
                        disabled={salesPage === 1}
                        className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="px-3 py-1 text-xs font-black text-slate-700 bg-white border border-slate-200 rounded-xl">
                        {salesPage} / {totalSalesPages}
                      </span>
                      <button
                        onClick={() => setSalesPage(p => Math.min(totalSalesPages, p + 1))}
                        disabled={salesPage === totalSalesPages}
                        className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* === TAB 3: INVENTARIO & STOCK DE FARDOS PONY === */}
          {activeTab === 'stock' && (
            <div className="space-y-4">
              {/* Controles de Búsqueda y Filtro de Stock */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                  {/* Buscador */}
                  <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Buscar por código (ej: MDF-1000) o tipo de fardo..."
                      value={stockSearch}
                      onChange={(e) => {
                        setStockSearch(e.target.value);
                        setStockPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    {stockSearch && (
                      <button 
                        onClick={() => setStockSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Filtro Estado de Stock */}
                  <select
                    value={stockStatusFilter}
                    onChange={(e) => {
                      setStockStatusFilter(e.target.value as any);
                      setStockPage(1);
                    }}
                    className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="ALL">Todo el Inventario</option>
                    <option value="IN_STOCK">Con Stock Físico (&gt; 0)</option>
                    <option value="CRITICAL">Stock Crítico (1 a 3 u.)</option>
                    <option value="OUT_OF_STOCK">Agotados (0 u.)</option>
                    <option value="NEGATIVE">Stock Negativo (&lt; 0)</option>
                  </select>

                  {/* Selector de Ordenamiento */}
                  <select
                    value={stockSortBy}
                    onChange={(e) => {
                      setStockSortBy(e.target.value as any);
                    }}
                    className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="stock">Ordenar por: Stock Actual</option>
                    <option value="vendidos">Ordenar por: Más Vendidos</option>
                    <option value="recaudacion">Ordenar por: Mayor Recaudación</option>
                    <option value="precio">Ordenar por: Precio Sugerido</option>
                    <option value="codigo">Ordenar por: Código</option>
                  </select>

                  <button
                    onClick={() => setStockSortAsc(!stockSortAsc)}
                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors"
                    title={stockSortAsc ? 'Ascendente' : 'Descendente'}
                  >
                    {stockSortAsc ? '↑ Asc' : '↓ Desc'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-bold">
                    {filteredStockList.length} productos
                  </span>
                  <button
                    onClick={handleExportStockCsv}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Download size={14} /> CSV
                  </button>
                </div>
              </div>

              {/* Tabla de Stock de Productos PONY */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="py-4 px-4">Código</th>
                        <th className="py-4 px-4">Descripción / Tipo de Fardo</th>
                        <th className="py-4 px-4 text-center">Proveedor</th>
                        <th className="py-4 px-4 text-center">Stock Actual</th>
                        <th className="py-4 px-4 text-center">Estado</th>
                        <th className="py-4 px-4 text-right">Precio Sugerido</th>
                        <th className="py-4 px-4 text-right">Valorización en Bodega</th>
                        <th className="py-4 px-4 text-center">Vendidos</th>
                        <th className="py-4 px-4 text-right">Total Facturado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                      {paginatedStock.length > 0 ? (
                        paginatedStock.map(p => {
                          return (
                            <tr key={p.codigo} className="hover:bg-purple-50/30 transition-colors">
                              <td className="py-3.5 px-4 font-mono font-black text-purple-700">
                                {p.codigo}
                              </td>
                              <td className="py-3.5 px-4 font-bold text-slate-900">
                                {p.tipo}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="px-2 py-0.5 bg-purple-50 text-purple-800 rounded-md text-[10px] font-black uppercase">
                                  {p.proveedor}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center font-black text-sm">
                                <span className={
                                  p.stockActual > 3 ? 'text-emerald-600' :
                                  p.stockActual > 0 ? 'text-amber-600' :
                                  p.stockActual === 0 ? 'text-slate-400' : 'text-rose-600'
                                }>
                                  {p.stockActual} u.
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                  p.estadoStock === 'DISPONIBLE' ? 'bg-emerald-100 text-emerald-800' :
                                  p.estadoStock === 'CRITICO' ? 'bg-amber-100 text-amber-800' :
                                  p.estadoStock === 'AGOTADO' ? 'bg-slate-100 text-slate-600' :
                                  'bg-rose-100 text-rose-800'
                                }`}>
                                  {p.estadoStock}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700">
                                ${p.precioSugerido.toLocaleString('es-CL')}
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">
                                ${p.valorInventarioSugerido.toLocaleString('es-CL')}
                              </td>
                              <td className="py-3.5 px-4 text-center font-black text-purple-700">
                                {p.unidadesVendidas} u.
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono font-bold text-purple-800">
                                ${p.montoVendido.toLocaleString('es-CL')}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-400">
                            No se encontraron productos de stock PONY con los filtros seleccionados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginador de Stock */}
                {totalStockPages > 1 && (
                  <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between">
                    <p className="text-xs text-slate-500 font-semibold">
                      Mostrando página {stockPage} de {totalStockPages} ({filteredStockList.length} productos)
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setStockPage(p => Math.max(1, p - 1))}
                        disabled={stockPage === 1}
                        className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="px-3 py-1 text-xs font-black text-slate-700 bg-white border border-slate-200 rounded-xl">
                        {stockPage} / {totalStockPages}
                      </span>
                      <button
                        onClick={() => setStockPage(p => Math.min(totalStockPages, p + 1))}
                        disabled={stockPage === totalStockPages}
                        className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* === TAB 4: CATÁLOGO DE PRODUCTOS PONY === */}
          {activeTab === 'productos' && (
            <div className="space-y-6">
              {/* Barra de Filtro Rápido */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="relative flex-1 min-w-[240px]">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Filtrar catálogo PONY..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'ALL', label: 'Todos' },
                    { id: 'TOP', label: '🔥 Más Vendidos' },
                    { id: 'AVAILABLE', label: 'En Bodega' },
                    { id: 'OUT_OF_STOCK', label: 'Agotados' },
                  ].map(c => (
                    <button
                      key={c.id}
                      onClick={() => setProductCategoryFilter(c.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        productCategoryFilter === c.id
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid de Tarjetas de Productos PONY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCatalogProducts.map(prod => {
                  const isTopSeller = prod.unidadesVendidas >= 10;
                  return (
                    <div 
                      key={prod.codigo} 
                      className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-purple-300 hover:shadow-lg transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-black font-mono px-2.5 py-1 bg-purple-100 text-purple-900 rounded-xl">
                            {prod.codigo}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            prod.stockActual > 3 ? 'bg-emerald-100 text-emerald-800' :
                            prod.stockActual > 0 ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {prod.stockActual > 0 ? `${prod.stockActual} en stock` : 'Agotado'}
                          </span>
                        </div>

                        <h5 className="text-sm font-black text-slate-900 group-hover:text-purple-700 transition-colors line-clamp-2 mt-2">
                          {prod.tipo}
                        </h5>

                        <div className="mt-4 p-3 bg-slate-50 rounded-2xl space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-slate-600">
                            <span>Precio Sugerido:</span>
                            <strong className="text-slate-900">${prod.precioSugerido.toLocaleString('es-CL')}</strong>
                          </div>
                          {prod.precioCosto > 0 && (
                            <div className="flex items-center justify-between text-slate-500 text-[11px]">
                              <span>Precio Costo:</span>
                              <span>${prod.precioCosto.toLocaleString('es-CL')}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-slate-600 pt-1.5 border-t border-slate-200">
                            <span>Valor en Bodega:</span>
                            <strong className="text-purple-700 font-mono">${prod.valorInventarioSugerido.toLocaleString('es-CL')}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Ventas Acumuladas</p>
                          <p className="text-xs font-black text-slate-900">
                            {prod.unidadesVendidas} fardos (${prod.montoVendido.toLocaleString('es-CL')})
                          </p>
                        </div>
                        {isTopSeller && (
                          <span className="p-1.5 bg-amber-100 text-amber-800 rounded-xl text-[10px] font-black uppercase flex items-center gap-1">
                            <Flame size={12} className="text-amber-600" /> Top
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE IMPRESIÓN OFICIAL DEL REPORTE PONY */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowPrintModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X size={20} />
            </button>

            {/* Encabezado del documento imprimible */}
            <div className="text-center pb-6 border-b border-slate-200">
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-2">
                Documento Oficial de Auditoría
              </span>
              <h2 className="text-2xl font-black uppercase text-slate-900 tracking-tight">
                INFORME DE AUDITORÍA COMERCIAL: ETIQUETA PONY
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Cuaderno MDF • Partida de Fardos con Etiqueta PONY
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Generado el {new Date().toLocaleDateString('es-CL')} a las {new Date().toLocaleTimeString('es-CL')} por: {currentUser?.nombre || 'ADMINISTRADOR MAESTRO'}
              </p>
            </div>

            {/* Resumen de Cifras Clave */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Facturación Total</p>
                <p className="text-lg font-black text-purple-700 font-mono mt-1">
                  ${globalMetrics.totalVentasMonto.toLocaleString('es-CL')}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fardos Vendidos</p>
                <p className="text-lg font-black text-slate-900 mt-1">
                  {globalMetrics.totalFardosVendidos} unidades
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock en Bodega</p>
                <p className="text-lg font-black text-emerald-600 mt-1">
                  {globalMetrics.stockFisicoDisponible} fardos
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Bodega</p>
                <p className="text-lg font-black text-slate-900 font-mono mt-1">
                  ${globalMetrics.valorStockVenta.toLocaleString('es-CL')}
                </p>
              </div>
            </div>

            {/* Tabla Resumen de Fardos PONY */}
            <div className="my-6">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider mb-2">
                Resumen de Productos Etiqueta PONY ({globalMetrics.totalVariedades} Variedades)
              </h4>
              <table className="w-full text-left text-[11px] border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 font-black text-slate-700 border-b border-slate-200">
                    <th className="py-2 px-3">Código</th>
                    <th className="py-2 px-3">Descripción</th>
                    <th className="py-2 px-3 text-center">Stock</th>
                    <th className="py-2 px-3 text-right">Precio Sug.</th>
                    <th className="py-2 px-3 text-right">Valor Bodega</th>
                    <th className="py-2 px-3 text-center">Vendidos</th>
                    <th className="py-2 px-3 text-right">Facturado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ponyProductsSummaries.map(p => (
                    <tr key={p.codigo}>
                      <td className="py-2 px-3 font-mono font-bold text-purple-800">{p.codigo}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{p.tipo}</td>
                      <td className="py-2 px-3 text-center font-bold">{p.stockActual}</td>
                      <td className="py-2 px-3 text-right font-mono">${p.precioSugerido.toLocaleString('es-CL')}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">${p.valorInventarioSugerido.toLocaleString('es-CL')}</td>
                      <td className="py-2 px-3 text-center font-bold text-purple-700">{p.unidadesVendidas}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-purple-900">${p.montoVendido.toLocaleString('es-CL')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sección de Firmas */}
            <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <div className="w-48 border-b border-slate-400 mx-auto mb-2"></div>
                <p className="font-black text-slate-900 uppercase">ADMINISTRADOR MAESTRO</p>
                <p className="text-slate-400 text-[10px]">Autorización y Firma de Auditoría</p>
              </div>
              <div>
                <div className="w-48 border-b border-slate-400 mx-auto mb-2"></div>
                <p className="font-black text-slate-900 uppercase">JEFATURA DE BODEGA</p>
                <p className="text-slate-400 text-[10px]">Conformidad de Inventario Físico</p>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="mt-8 flex justify-end gap-3 no-print">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-2xl transition-all"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2"
              >
                <Printer size={16} /> Imprimir Ahora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
