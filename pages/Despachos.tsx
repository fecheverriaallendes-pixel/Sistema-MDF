
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Send, 
  CheckCircle2, 
  Search, 
  LayoutGrid, 
  List, 
  Phone, 
  MapPin, 
  Truck,
  Package,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  Box,
  QrCode,
  Minus,
  Plus,
  Home,
  Building2,
  ArrowRight,
  Camera,
  Trash2,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Clock,
  Filter,
  CheckCircle,
  Boxes,
  Layers,
  Sparkles,
  ArrowUpRight,
  MessageSquare,
  Copy,
  Check,
  Eye,
  User
} from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { SaleStatus, Sale, DispatchType, DispatchStatus, StaffRole } from '../types';
import { SaleTrackingModal, generateWhatsAppTrackingMessage } from '../components/SaleTrackingModal';

function parseLocalDate(dateStr?: string | null): Date {
  if (!dateStr) return new Date();
  if (dateStr.includes('T')) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
  }
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
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

function getStartOfDay(dateStr: string): Date {
  const d = parseLocalDate(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getEndOfDay(dateStr: string): Date {
  const d = parseLocalDate(dateStr);
  d.setHours(23, 59, 59, 999);
  return d;
}

function getDispatchDate(sale: Sale): Date {
  if (sale.fechaDespacho) return parseLocalDate(sale.fechaDespacho);
  if (sale.conductorFecha) return parseLocalDate(sale.conductorFecha);
  return parseLocalDate(sale.fecha);
}

function getSaleDate(sale: Sale): Date {
  if (sale.timestamp) return parseLocalDate(sale.timestamp);
  return parseLocalDate(sale.fecha);
}

function formatDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    const d = parseLocalDate(dateStr);
    return d.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

function formatDisplayDateTime(dateStr?: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    const d = parseLocalDate(dateStr);
    return `${d.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })} ${d.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  } catch {
    return dateStr;
  }
}

export default function Despachos() {
  const { sales, stock, markAsSent, updateDispatchStatus, updateDispatchItems, assignCarrier, assignAgency, playSound, carriers, deleteSale, updateSale, currentUser } = useStore();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as any) || 'AGENCIA';
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [vendedorFilter, setVendedorFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'AGENCIA' | 'DOMICILIO' | 'RETIRO' | 'JUNTA_COMPRA' | 'HISTORIAL'>(
    ['AGENCIA', 'DOMICILIO', 'RETIRO', 'JUNTA_COMPRA', 'HISTORIAL'].includes(initialTab) ? initialTab : 'AGENCIA'
  );
  const [dateFilterType, setDateFilterType] = useState<'despacho' | 'venta'>('despacho');
  const [transportistaFilter, setTransportistaFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [verifyingSaleId, setVerifyingSaleId] = useState<string | null>(null);
  const [selectedTrackingSale, setSelectedTrackingSale] = useState<Sale | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const allSales = sales;
  const vendedores = Array.from(new Set(sales.map(s => s.vendedor).filter(Boolean)));
  
  // Categorize sales into tabs
  const isJunta = (s: Sale) => Boolean(s.juntaCompra && s.juntaCompra.trim().toUpperCase().includes('JUNTA'));
  const allJuntaCompraSales = allSales.filter(s => s.status === SaleStatus.PENDIENTE && isJunta(s));
  const allAgencySales = allSales.filter(s => s.status === SaleStatus.PENDIENTE && s.tipoDespacho === DispatchType.AGENCIA && !isJunta(s));
  const allHomeSales = allSales.filter(s => s.status === SaleStatus.PENDIENTE && s.tipoDespacho === DispatchType.DOMICILIO && !isJunta(s));
  const allWithdrawalSales = allSales.filter(s => s.status === SaleStatus.PENDIENTE && s.tipoDespacho === DispatchType.RETIRO && !isJunta(s));
  const allHistorySales = allSales.filter(s => s.status === SaleStatus.ENVIADO);

  const juntaTotalProducts = allJuntaCompraSales.reduce((acc, s) => {
    if (s.items && s.items.length > 0) {
      return acc + s.items.reduce((sum, it) => sum + (Number(it.cantidad) || 0), 0);
    }
    return acc + (Number(s.cantidad) || 1);
  }, 0);

  const juntaTotalMoney = allJuntaCompraSales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);

  const activeTabList = activeTab === 'AGENCIA' ? allAgencySales 
                      : activeTab === 'DOMICILIO' ? allHomeSales 
                      : activeTab === 'RETIRO' ? allWithdrawalSales
                      : activeTab === 'JUNTA_COMPRA' ? allJuntaCompraSales
                      : allHistorySales;

  // Filter the current list
  const filteredList = activeTabList.filter(s => {
    // Determine the date to compare against
    const targetDate = (activeTab === 'HISTORIAL' && dateFilterType === 'despacho')
      ? getDispatchDate(s)
      : getSaleDate(s);

    // Date range filter
    if (startDate) {
      const start = getStartOfDay(startDate);
      if (targetDate < start) return false;
    }
    if (endDate) {
      const end = getEndOfDay(endDate);
      if (targetDate > end) return false;
    }

    // Transportista filter
    if (transportistaFilter && s.transportista !== transportistaFilter) {
      return false;
    }

    // Vendedor filter
    if (vendedorFilter && s.vendedor !== vendedorFilter) {
      return false;
    }

    // Search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      const productObj = stock.find(item => item.codigo === s.codigoFardo);
      const productTypeName = productObj?.tipo?.toLowerCase() || '';
      const itemsMatch = s.items?.some(it => {
        const itStock = stock.find(item => item.codigo === it.codigoFardo);
        return it.codigoFardo.toLowerCase().includes(search) || (itStock?.tipo?.toLowerCase() || '').includes(search);
      }) ?? false;

      return (
        s.cliente.toLowerCase().includes(search) || 
        s.numeroVenta.toString().includes(search) ||
        (s.codigoFardo?.toLowerCase().includes(search) ?? false) ||
        productTypeName.includes(search) ||
        itemsMatch ||
        (s.transportista?.toLowerCase().includes(search) ?? false) ||
        (s.agencia?.toLowerCase().includes(search) ?? false) ||
        (s.direccion?.toLowerCase().includes(search) ?? false) ||
        (s.telefono?.toLowerCase().includes(search) ?? false) ||
        (s.rut?.toLowerCase().includes(search) ?? false)
      );
    }

    return true;
  });

  // Sorting
  const currentList = [...filteredList].sort((a, b) => {
    const timeA = (activeTab === 'HISTORIAL' && dateFilterType === 'despacho')
      ? getDispatchDate(a).getTime()
      : getSaleDate(a).getTime();
    const timeB = (activeTab === 'HISTORIAL' && dateFilterType === 'despacho')
      ? getDispatchDate(b).getTime()
      : getSaleDate(b).getTime();
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });

  const setDatePreset = (preset: 'today' | 'yesterday' | 'week' | 'month' | 'clear') => {
    playSound('click');
    const now = new Date();
    const formatDateInput = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'today') {
      const str = formatDateInput(now);
      setStartDate(str);
      setEndDate(str);
    } else if (preset === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const str = formatDateInput(yesterday);
      setStartDate(str);
      setEndDate(str);
    } else if (preset === 'week') {
      const pastWeek = new Date(now);
      pastWeek.setDate(now.getDate() - 6);
      setStartDate(formatDateInput(pastWeek));
      setEndDate(formatDateInput(now));
    } else if (preset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(formatDateInput(firstDay));
      setEndDate(formatDateInput(now));
    } else if (preset === 'clear') {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleExportExcel = () => {
    import('xlsx').then(XLSX => {
      const data = currentList.map(s => ({
        "N_Venta": s.numeroVenta,
        "Fecha_Venta": s.fecha,
        "Fecha_Despacho": s.fechaDespacho ? new Date(s.fechaDespacho).toLocaleString('es-CL') : (s.conductorFecha || 'N/A'),
        "Cliente": s.cliente,
        "RUT": s.rut || 'N/A',
        "Direccion": s.direccion || 'RETIRO EN TIENDA',
        "Telefono": s.telefono,
        "Producto": s.codigoFardo || (s.items?.map(i => `${i.cantidad}x ${i.codigoFardo}`).join(', ') || 'N/A'),
        "Cant": s.cantidad || s.items?.reduce((acc, i) => acc + i.cantidad, 0) || 1,
        "Tipo_Despacho": s.tipoDespacho || 'N/A',
        "Transportista": s.transportista || 'N/A',
        "Agencia": s.agencia || 'N/A',
        "Estado_Despacho": s.estadoDespacho || s.status,
        "Status": s.status
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Despachos");
      XLSX.writeFile(wb, `Planilla_Despacho_${activeTab}_${new Date().toLocaleDateString('es-CL').replace(/\//g, '-')}.xlsx`);
      playSound('success');
    });
  };

  const handleIncrementItem = (sale: Sale) => {
    const current = sale.itemsDespachados || 0;
    if (current < (sale.cantidad || 1)) {
      updateDispatchItems(sale.id, current + 1);
      playSound('click');
    } else {
      playSound('click'); 
    }
  };

  const handleDecrementItem = (sale: Sale) => {
    const current = sale.itemsDespachados || 0;
    if (current > 0) {
      updateDispatchItems(sale.id, current - 1);
      playSound('click');
    }
  };

  const handleConfirmDispatch = (sale: Sale) => {
    const requiredQty = sale.cantidad || 1;
    if ((sale.itemsDespachados || 0) !== requiredQty) {
      alert(`Error: La cantidad verificada (${sale.itemsDespachados || 0}) no coincide con la venta (${requiredQty}).`);
      return;
    }
    if ((sale.tipoDespacho === DispatchType.DOMICILIO || sale.tipoDespacho === DispatchType.AGENCIA) && !sale.transportista) {
      alert("Error: Debes asignar un transportista para este tipo de despacho.");
      return;
    }
    markAsSent(sale.id);
    setVerifyingSaleId(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-amber-500 text-white rounded-[20px] flex items-center justify-center shadow-xl shadow-amber-500/20">
              <Truck size={28} />
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Centro Logístico</h2>
          </div>
          <p className="text-slate-500 italic ml-16 font-medium">Gestión de envíos, verificación de carga, transportistas y tracking de historial.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-3 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
          >
            <FileSpreadsheet size={18} /> Exportar Lista ({currentList.length})
          </button>
          
          <div className="flex bg-slate-200 p-1 rounded-[20px] shadow-inner">
            <button 
              onClick={() => { setViewMode('grid'); playSound('click'); }}
              className={`p-3 rounded-[16px] transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
              title="Vista en Cuadrícula"
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => { setViewMode('list'); playSound('click'); }}
              className={`p-3 rounded-[16px] transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
              title="Vista en Tabla"
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap p-1.5 bg-slate-200 rounded-[24px] w-full max-w-6xl mx-auto shadow-inner gap-1">
        <button 
          onClick={() => { setActiveTab('AGENCIA'); playSound('click'); }}
          className={`flex-1 min-w-[140px] py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'AGENCIA' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Building2 size={16} /> Agencia <span className="bg-slate-100 px-2 py-0.5 rounded-full text-[10px]">{allAgencySales.length}</span>
        </button>
        <button 
          onClick={() => { setActiveTab('DOMICILIO'); playSound('click'); }}
          className={`flex-1 min-w-[140px] py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'DOMICILIO' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Home size={16} /> Domicilio <span className="bg-slate-100 px-2 py-0.5 rounded-full text-[10px]">{allHomeSales.length}</span>
        </button>
        <button 
          onClick={() => { setActiveTab('RETIRO'); playSound('click'); }}
          className={`flex-1 min-w-[140px] py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'RETIRO' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Package size={16} /> Retiro <span className="bg-slate-100 px-2 py-0.5 rounded-full text-[10px]">{allWithdrawalSales.length}</span>
        </button>
        <button 
          onClick={() => { setActiveTab('JUNTA_COMPRA'); playSound('click'); }}
          className={`flex-1 min-w-[180px] py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'JUNTA_COMPRA' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-indigo-900'}`}
        >
          <Boxes size={16} /> 📦 Junta Compra <span className={`${activeTab === 'JUNTA_COMPRA' ? 'bg-indigo-700 text-white' : 'bg-indigo-100 text-indigo-800'} px-2 py-0.5 rounded-full text-[10px] font-mono`}>{allJuntaCompraSales.length} vta ({juntaTotalProducts} u)</span>
        </button>
        <button 
          onClick={() => { setActiveTab('HISTORIAL'); playSound('click'); }}
          className={`flex-1 min-w-[140px] py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'HISTORIAL' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <CheckCircle2 size={16} /> Historial <span className={`${activeTab === 'HISTORIAL' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'} px-2 py-0.5 rounded-full text-[10px]`}>{allHistorySales.length}</span>
        </button>
      </div>

      {/* Banner Informativo Junta Compra */}
      {activeTab === 'JUNTA_COMPRA' && (
        <div className="max-w-6xl mx-auto bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 md:p-8 rounded-[36px] shadow-xl border border-indigo-700/50 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 text-indigo-300 shrink-0">
              <Boxes size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Custodia Temporal Bodega
                </span>
                <span className="text-xs text-indigo-300 font-medium">Junta Compra MDF</span>
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight mt-1">
                {allJuntaCompraSales.length} Ventas • {juntaTotalProducts} Fardos Retenidos
              </h3>
              <p className="text-xs text-indigo-200/80 font-medium mt-0.5">
                Los clientes acumulan compras para enviarlas en un solo despacho. Cuando el cliente dé la orden, haz clic en "Liberar para Despacho".
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 px-5 py-3 rounded-2xl border border-white/10 text-right">
              <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Valor Acumulado</p>
              <p className="text-xl font-black font-mono text-emerald-400">${juntaTotalMoney.toLocaleString('es-CL')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="space-y-4 max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative group flex-1 w-full">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors">
                <Search size={24} />
              </div>
              <input 
                type="text" 
                placeholder="Buscar cliente, N° venta, código producto, transportista, agencia, dirección..."
                className="w-full pl-14 pr-6 py-4 bg-white rounded-[24px] border-2 border-slate-100 focus:border-amber-400 outline-none font-bold text-base shadow-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <div className="flex-1 lg:flex-none min-w-[200px]">
                <select 
                    className={`w-full px-5 py-4 rounded-[24px] border-2 font-bold text-sm outline-none transition-all ${transportistaFilter ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-white border-slate-100 text-slate-700'}`}
                    value={transportistaFilter}
                    onChange={(e) => setTransportistaFilter(e.target.value)}
                >
                    <option value="">🚚 Transportista (Todos)</option>
                    {carriers.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex-1 lg:flex-none min-w-[180px] flex items-center gap-2">
                <select 
                    className={`w-full px-5 py-4 rounded-[24px] border-2 font-bold text-sm outline-none transition-all ${vendedorFilter ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-white border-slate-100 text-slate-700'}`}
                    value={vendedorFilter}
                    onChange={(e) => setVendedorFilter(e.target.value)}
                >
                    <option value="">👤 Vendedor (Todos)</option>
                    {vendedores.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                {currentUser?.nombre && (
                  <button
                    type="button"
                    onClick={() => {
                      setVendedorFilter(vendedorFilter === currentUser.nombre ? '' : currentUser.nombre);
                      playSound('click');
                    }}
                    className={`px-4 py-4 rounded-[24px] font-black text-xs uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      vendedorFilter === currentUser.nombre
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                        : 'bg-white border-2 border-slate-100 text-slate-700 hover:border-amber-300'
                    }`}
                    title="Filtrar solo mis ventas"
                  >
                    <User size={14} /> Mis Ventas
                  </button>
                )}
              </div>
            </div>
        </div>

        {/* Date Ranges & Controls */}
        <div className="bg-white p-4 rounded-[32px] border-2 border-slate-100 shadow-sm space-y-3">
          {/* Active Tab Date Mode Indicator (Historial specific toggle) */}
          {activeTab === 'HISTORIAL' && (
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 px-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Filter size={14} className="text-emerald-600" /> Criterio de Fecha para Historial:
                </span>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
                <button
                  onClick={() => { setDateFilterType('despacho'); playSound('click'); }}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 ${
                    dateFilterType === 'despacho'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Truck size={13} /> Fecha de Despacho (Recomendado)
                </button>
                <button
                  onClick={() => { setDateFilterType('venta'); playSound('click'); }}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 ${
                    dateFilterType === 'venta'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar size={13} /> Fecha de Venta
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Date Inputs */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  {activeTab === 'HISTORIAL' ? (dateFilterType === 'despacho' ? 'Despacho Desde' : 'Venta Desde') : 'Desde'}
                </span>
                <input 
                  type="date" 
                  className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:border-amber-500 focus:bg-white transition-colors"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <span className="text-slate-300 font-bold">-</span>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Hasta
                </span>
                <input 
                  type="date" 
                  className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:border-amber-500 focus:bg-white transition-colors"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1 pl-2">
                <button 
                  onClick={() => setDatePreset('today')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
                >
                  Hoy
                </button>
                <button 
                  onClick={() => setDatePreset('yesterday')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
                >
                  Ayer
                </button>
                <button 
                  onClick={() => setDatePreset('week')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
                >
                  7 Días
                </button>
                <button 
                  onClick={() => setDatePreset('month')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
                >
                  Este Mes
                </button>
              </div>
            </div>

            {/* Sort order & Clear filters */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
                  playSound('click');
                }}
                className="group flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:border-amber-500 transition-all font-bold text-[10px] uppercase tracking-widest text-slate-700"
                title="Cambiar orden cronológico"
              >
                {sortOrder === 'desc' ? (
                  <>
                    <ArrowDownWideNarrow size={14} className="text-amber-500" /> Más recientes primero
                  </>
                ) : (
                  <>
                    <ArrowUpNarrowWide size={14} className="text-amber-500" /> Más antiguos primero
                  </>
                )}
              </button>

              {(startDate || endDate || vendedorFilter || searchTerm || transportistaFilter) && (
                <button 
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setVendedorFilter('');
                    setSearchTerm('');
                    setTransportistaFilter('');
                    playSound('click');
                  }}
                  className="px-3 py-2 text-[10px] font-black text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl uppercase tracking-widest transition-colors"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Summary Bar */}
          {(startDate || endDate || transportistaFilter || vendedorFilter || searchTerm) && (
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filtrando por:</span>
              {activeTab === 'HISTORIAL' && (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                  {dateFilterType === 'despacho' ? '🚚 Fecha de Despacho' : '📋 Fecha de Venta'}
                </span>
              )}
              {startDate && (
                <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                  Desde: {startDate}
                </span>
              )}
              {endDate && (
                <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                  Hasta: {endDate}
                </span>
              )}
              {transportistaFilter && (
                <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                  Transportista: {transportistaFilter}
                </span>
              )}
              {vendedorFilter && (
                <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                  Vendedor: {vendedorFilter}
                </span>
              )}
              {searchTerm && (
                <span className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                  Búsqueda: "{searchTerm}"
                </span>
              )}
              <span className="text-[11px] font-bold text-slate-400 ml-auto">
                {currentList.length} resultado(s) encontrados
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentList.map((sale) => (
            <div key={sale.id} className={`group bg-white rounded-[40px] border-2 ${verifyingSaleId === sale.id ? 'border-amber-400 ring-4 ring-amber-100' : 'border-slate-100'} shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col`}>
              
              {/* Card Header */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black mb-1.5">#{sale.numeroVenta}</span>
                    {sale.comprobante && (
                      <a href={sale.comprobante} target="_blank" rel="noreferrer" className="text-emerald-500 mb-1.5 hover:scale-110 transition-transform" title="Ver Comprobante">
                        <Camera size={16} />
                      </a>
                    )}
                    {sale.tipoDespacho && (
                      <span className="inline-block px-2.5 py-0.5 bg-slate-200 text-slate-700 rounded-md text-[9px] font-black uppercase mb-1.5">
                        {sale.tipoDespacho}
                      </span>
                    )}
                    {isJunta(sale) && (
                      <span className="inline-block px-2.5 py-0.5 bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-md text-[9px] font-black uppercase mb-1.5 shadow-sm">
                        📦 Junta Compra
                      </span>
                    )}
                  </div>
                  
                  {/* Dates Display */}
                  <div className="space-y-0.5 mt-1">
                    {sale.fechaDespacho && (
                      <p className="text-xs font-black text-emerald-700 flex items-center gap-1">
                        <Truck size={13} className="text-emerald-600" /> 
                        <span>Despacho: {formatDisplayDateTime(sale.fechaDespacho)}</span>
                      </p>
                    )}
                    <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Calendar size={12} className="text-slate-400" />
                      <span>Venta: {formatDisplayDate(sale.fecha)} {sale.hora ? `(${sale.hora})` : ''}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase ${sale.status === SaleStatus.PENDIENTE ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {sale.status === SaleStatus.ENVIADO ? (sale.estadoDespacho || 'Despachado') : sale.status}
                  </span>
                  <button 
                    onClick={() => {
                        if(confirm("¿Estás seguro de que quieres eliminar este despacho?")) {
                            deleteSale(sale.id);
                        }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar despacho"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 space-y-5">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</p>
                  <p className="text-lg font-black text-slate-900 uppercase leading-tight truncate">{sale.cliente}</p>
                  <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-1">
                    <Phone size={12} /> {sale.telefono || 'Sin teléfono'} {sale.rut ? `• RUT: ${sale.rut}` : ''}
                  </p>
                </div>

                {/* Transportista & Destino */}
                <div className="bg-slate-50 p-4 rounded-[24px] border border-slate-100 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1">
                      <MapPin size={11} /> Destino
                    </p>
                    {sale.agencia && (
                      <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        Agencia: {sale.agencia}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs font-bold text-slate-700 uppercase leading-snug">
                    {sale.direccion || 'RETIRO EN BODEGA'}
                  </p>

                  {(sale.transportista || sale.agencia) && (
                    <div className="pt-2 border-t border-slate-200/60 flex items-center gap-1 text-xs font-bold text-slate-800">
                      <Truck size={13} className="text-amber-600" />
                      <span>Transporte: <strong className="text-slate-900">{sale.transportista || sale.agencia}</strong></span>
                    </div>
                  )}
                </div>

                {/* Product Content */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contenido</p>
                  {sale.items && sale.items.length > 0 ? (
                    <div className="space-y-1.5">
                      {sale.items.map((it, idx) => {
                        const product = stock.find(item => item.codigo === it.codigoFardo);
                        return (
                          <div key={idx} className="flex items-center justify-between bg-white border border-slate-100 p-2.5 rounded-xl">
                            <div className="flex items-center gap-2.5">
                              <Package size={16} className="text-blue-500" />
                              <div>
                                <p className="text-xs font-black text-slate-800">{product?.tipo || it.codigoFardo}</p>
                                <p className="text-[9px] text-slate-400 font-mono">{it.codigoFardo}</p>
                              </div>
                            </div>
                            <span className="text-xs font-black text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">x{it.cantidad}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-white border-2 border-slate-100 p-3 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                          <Package size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{stock.find(item => item.codigo === sale.codigoFardo)?.tipo || sale.codigoFardo}</p>
                          <p className="text-[10px] text-slate-500 font-bold">CANTIDAD: {sale.cantidad || 1}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Verification Section for Pending Sales */}
                {verifyingSaleId === sale.id && sale.status === SaleStatus.PENDIENTE && (
                  <div className="bg-amber-50 p-4 rounded-[24px] border-2 border-amber-200 animate-in zoom-in duration-300 space-y-3">
                    {sale.tipoDespacho === DispatchType.RETIRO || (sale.juntaCompra && sale.juntaCompra !== 'DESPACHO INMEDIATO') ? (
                      <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest text-center">Verificación para Retiro</p>
                    ) : (
                      <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest text-center">Verificación para Envío</p>
                    )}
                    
                    <div className="flex items-center justify-center gap-4 py-2">
                      <button 
                        onClick={() => handleDecrementItem(sale)}
                        className="w-10 h-10 bg-white rounded-full shadow-sm border border-amber-200 flex items-center justify-center text-amber-600 hover:bg-amber-100 active:scale-90 transition-all"
                      >
                        <Minus size={20} />
                      </button>
                      <div className="text-center">
                        <span className={`text-3xl font-black ${(sale.itemsDespachados || 0) === (sale.cantidad || 1) ? 'text-emerald-500' : 'text-slate-900'}`}>
                          {sale.itemsDespachados || 0}
                        </span>
                        <span className="text-sm font-bold text-slate-400"> / {sale.cantidad || 1}</span>
                      </div>
                      <button 
                        onClick={() => handleIncrementItem(sale)}
                        className="w-10 h-10 bg-white rounded-full shadow-sm border border-amber-200 flex items-center justify-center text-amber-600 hover:bg-amber-100 active:scale-90 transition-all"
                      >
                        <Plus size={20} />
                      </button>
                    </div>

                    {(sale.itemsDespachados || 0) === (sale.cantidad || 1) ? (
                      <div className="text-center text-[10px] font-black text-emerald-600 bg-emerald-100 py-2 rounded-xl animate-pulse">
                        ¡CANTIDAD VERIFICADA!
                      </div>
                    ) : (sale.itemsDespachados || 0) > (sale.cantidad || 1) ? (
                      <div className="text-center text-[10px] font-black text-red-600 bg-red-100 py-2 rounded-xl">
                        ¡EXCESO DE ITEMS!
                      </div>
                    ) : (
                      <div className="text-center text-[10px] font-bold text-amber-700/80">
                        Confirma los productos físicamente
                      </div>
                    )}

                    {sale.tipoDespacho === DispatchType.DOMICILIO && (
                      <div>
                        <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest text-center mb-1.5">Asignar Transportista</p>
                        <select 
                          className="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-amber-400"
                          value={sale.transportista || ''}
                          onChange={(e) => assignCarrier(sale.id, e.target.value)}
                        >
                          <option value="">Seleccionar Transportista...</option>
                          {carriers.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {sale.tipoDespacho === DispatchType.AGENCIA && (
                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest text-center mb-1">Nombre de Agencia</p>
                          <input 
                            type="text"
                            className="w-full px-4 py-2 bg-white border border-amber-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-amber-400"
                            placeholder="Ej: Starken, Chilexpress..."
                            value={sale.agencia || ''}
                            onChange={(e) => assignAgency(sale.id, e.target.value)}
                          />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest text-center mb-1">Transporte a Agencia</p>
                          <select 
                            className="w-full px-4 py-2 bg-white border border-amber-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-amber-400"
                            value={sale.transportista || ''}
                            onChange={(e) => assignCarrier(sale.id, e.target.value)}
                          >
                            <option value="">Seleccionar Transportista...</option>
                            {carriers.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={() => handleConfirmDispatch(sale)}
                      disabled={(sale.itemsDespachados || 0) !== (sale.cantidad || 1) || ((sale.tipoDespacho === DispatchType.DOMICILIO || sale.tipoDespacho === DispatchType.AGENCIA) && !sale.transportista)}
                      className="w-full py-3 bg-emerald-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      {sale.tipoDespacho === DispatchType.RETIRO || (sale.juntaCompra && sale.juntaCompra !== 'DESPACHO INMEDIATO') ? 'Confirmar Retiro' : 'Confirmar Salida'}
                    </button>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="p-6 bg-slate-50/50 mt-auto border-t border-slate-100 space-y-2">
                {/* WhatsApp status & Tracking actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleOpenWhatsApp(sale)}
                    className="flex-1 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                    title="Notificar estado por WhatsApp al cliente"
                  >
                    <MessageSquare size={13} /> WhatsApp
                  </button>
                  <button
                    onClick={() => handleCopyStatus(sale)}
                    className={`p-2.5 rounded-2xl border transition-all ${
                      copiedId === sale.id 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-300' 
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 active:scale-95'
                    }`}
                    title="Copiar texto de estado para WhatsApp"
                  >
                    {copiedId === sale.id ? <Check size={15} /> : <Copy size={15} />}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTrackingSale(sale);
                      playSound('click');
                    }}
                    className="p-2.5 bg-slate-900 hover:bg-black text-white rounded-2xl transition-all active:scale-95"
                    title="Ver seguimiento completo"
                  >
                    <Eye size={15} />
                  </button>
                </div>

                {isJunta(sale) && sale.status === SaleStatus.PENDIENTE && (
                  <button 
                    onClick={() => {
                      if (confirm(`¿Liberar Venta #${sale.numeroVenta} (${sale.cliente}) de Junta Compra para Despacho Inmediato?`)) {
                        updateSale(sale.id, { juntaCompra: 'DESPACHO INMEDIATO' });
                        playSound('success');
                      }
                    }}
                    className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-[20px] text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                  >
                    <Sparkles size={14} /> Liberar a Despacho Inmediato
                  </button>
                )}

                {sale.status === SaleStatus.PENDIENTE ? (
                  verifyingSaleId !== sale.id ? (
                    <button 
                      onClick={() => { setVerifyingSaleId(sale.id); playSound('click'); }}
                      className="w-full py-4 bg-slate-900 text-white rounded-[24px] text-xs font-black hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
                    >
                      <QrCode size={16} /> PREPARAR ENVÍO
                    </button>
                  ) : (
                    <button 
                      onClick={() => setVerifyingSaleId(null)}
                      className="w-full py-3 text-slate-400 font-bold text-xs hover:text-slate-600"
                    >
                      Cancelar Verificación
                    </button>
                  )
                ) : (
                  <div className="w-full py-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-[24px] text-xs font-black flex items-center justify-center gap-2 uppercase tracking-widest">
                    <CheckCircle2 size={16} /> Despacho Completado
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Venta</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Destino / Tipo</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Producto(s)</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {activeTab === 'HISTORIAL' ? 'Fecha Despacho' : 'Fecha Venta'}
                  </th>
                  {activeTab === 'HISTORIAL' && (
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Venta</th>
                  )}
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transportista / Agencia</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentList.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-5 font-mono font-bold text-slate-700">
                      <span className="bg-slate-100 px-2.5 py-1 rounded-lg">#{sale.numeroVenta}</span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-900 text-sm">{sale.cliente}</p>
                      <p className="text-xs text-slate-400">{sale.telefono}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs text-slate-700 uppercase font-medium max-w-xs truncate">{sale.direccion || 'Retiro en Bodega'}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-bold text-slate-400">{sale.tipoDespacho}</span>
                        {isJunta(sale) && (
                          <span className="bg-indigo-100 text-indigo-800 px-2 py-0.2 rounded text-[9px] font-black">
                            📦 Junta Compra
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 font-bold text-xs text-slate-700">
                      {sale.items && sale.items.length > 0 ? (
                        <div>
                          {sale.items.map((it, idx) => (
                            <div key={idx}>
                              {it.cantidad}x {stock.find(item => item.codigo === it.codigoFardo)?.tipo || it.codigoFardo}
                            </div>
                          ))}
                        </div>
                      ) : (
                        `${sale.cantidad || 1} x ${stock.find(item => item.codigo === sale.codigoFardo)?.tipo || sale.codigoFardo}`
                      )}
                    </td>
                    <td className="px-6 py-5 text-xs font-bold">
                      {activeTab === 'HISTORIAL' ? (
                        sale.fechaDespacho ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            {formatDisplayDateTime(sale.fechaDespacho)}
                          </span>
                        ) : (
                          <span className="text-slate-500">{sale.conductorFecha || sale.fecha}</span>
                        )
                      ) : (
                        <span className="text-slate-700">{formatDisplayDate(sale.fecha)}</span>
                      )}
                    </td>
                    {activeTab === 'HISTORIAL' && (
                      <td className="px-6 py-5 text-xs text-slate-500 font-medium">
                        {formatDisplayDate(sale.fecha)}
                      </td>
                    )}
                    <td className="px-6 py-5 text-xs font-bold">
                      {sale.transportista ? (
                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100 inline-flex items-center gap-1">
                          <Truck size={12} /> {sale.transportista}
                        </span>
                      ) : sale.agencia ? (
                        <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg border border-purple-100 inline-flex items-center gap-1">
                          <Building2 size={12} /> {sale.agencia}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No asignado</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${sale.status === SaleStatus.PENDIENTE ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {sale.status === SaleStatus.ENVIADO ? (sale.estadoDespacho || 'Despachado') : sale.status}
                        </span>
                        <button
                          onClick={() => handleOpenWhatsApp(sale)}
                          className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all"
                          title="Enviar estado por WhatsApp"
                        >
                          <MessageSquare size={13} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTrackingSale(sale);
                            playSound('click');
                          }}
                          className="p-1.5 bg-slate-900 hover:bg-black text-white rounded-lg transition-all"
                          title="Ver tracking"
                        >
                          <Eye size={13} />
                        </button>
                      </div>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {currentList.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm">
          <div className="w-20 h-20 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mb-6">
            <Box size={40} />
          </div>
          <h3 className="text-2xl font-black text-slate-400 uppercase tracking-tight">Sin Movimientos</h3>
          <p className="text-slate-400 font-medium mt-2 max-w-md">
            {searchTerm || startDate || endDate || transportistaFilter || vendedorFilter
              ? 'No se encontraron despachos que coincidan con los filtros aplicados. Intenta ajustando las fechas o el transportista.'
              : 'No hay despachos registrados en esta categoría.'}
          </p>
          {(searchTerm || startDate || endDate || transportistaFilter || vendedorFilter) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setTransportistaFilter('');
                setVendedorFilter('');
                setSearchTerm('');
                playSound('click');
              }}
              className="mt-6 px-6 py-2.5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors"
            >
              Restablecer Filtros
            </button>
          )}
        </div>
      )}

      {/* Modal de Seguimiento / Tracking */}
      {selectedTrackingSale && (
        <SaleTrackingModal
          sale={selectedTrackingSale}
          stock={stock}
          onClose={() => setSelectedTrackingSale(null)}
          onLiberarJuntaCompra={(s) => {
            updateSale(s.id, { juntaCompra: 'DESPACHO INMEDIATO' });
            playSound('success');
            setSelectedTrackingSale(null);
          }}
        />
      )}
    </div>
  );
}

