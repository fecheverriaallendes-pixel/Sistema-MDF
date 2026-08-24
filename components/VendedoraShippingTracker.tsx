import React, { useState, useMemo } from 'react';
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
  Filter,
  Eye,
  Calendar,
  AlertCircle
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusTab, setStatusTab] = useState<'ALL' | 'PREPARACION' | 'EN_RUTA' | 'JUNTA' | 'RETIRO' | 'ENTREGADO'>('ALL');
  const [timeFilter, setTimeFilter] = useState<'ALL' | '30DAYS' | '7DAYS'>('30DAYS');
  const [selectedSaleForModal, setSelectedSaleForModal] = useState<Sale | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter sales for this vendedora (unless admin who can view all or specific)
  const mySales = useMemo(() => {
    return (sales || []).filter(s => {
      if (!s) return false;
      if (!isAdmin && vendedoraName && s.vendedor !== vendedoraName) return false;
      return true;
    });
  }, [sales, vendedoraName, isAdmin]);

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
            if (parts.length === 3) saleDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          }
        }
        if (saleDate && !isNaN(saleDate.getTime())) {
          const diffDays = (now - saleDate.getTime()) / dayMs;
          if (timeFilter === '7DAYS' && diffDays > 7) return false;
          if (timeFilter === '30DAYS' && diffDays > 35) return false;
        }
      }

      // Status Tab filter
      const isJunta = Boolean(s.juntaCompra && s.juntaCompra.trim().toUpperCase().includes('JUNTA') && s.status === SaleStatus.PENDIENTE);
      const isRetiro = s.tipoDespacho === DispatchType.RETIRO;
      const isEnviado = s.status === SaleStatus.ENVIADO;
      const isEnRuta = s.status === SaleStatus.PENDIENTE && Boolean(s.transportista) && !isJunta;
      const isPrep = s.status === SaleStatus.PENDIENTE && !s.transportista && !isJunta && !isRetiro;

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

  // Metrics counters
  const counts = useMemo(() => {
    let prep = 0;
    let enRuta = 0;
    let junta = 0;
    let retiro = 0;
    let entregados = 0;

    mySales.forEach(s => {
      const isJunta = Boolean(s.juntaCompra && s.juntaCompra.trim().toUpperCase().includes('JUNTA') && s.status === SaleStatus.PENDIENTE);
      const isRetiro = s.tipoDespacho === DispatchType.RETIRO;
      const isEnviado = s.status === SaleStatus.ENVIADO;
      const isEnRuta = s.status === SaleStatus.PENDIENTE && Boolean(s.transportista) && !isJunta;

      if (isEnviado) entregados++;
      else if (isJunta) junta++;
      else if (isRetiro) retiro++;
      else if (isEnRuta) enRuta++;
      else prep++;
    });

    return {
      total: mySales.length,
      prep,
      enRuta,
      junta,
      retiro,
      entregados
    };
  }, [mySales]);

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
    <div className="w-full max-w-6xl mb-12 animate-in slide-in-from-top duration-700 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20">
            <Truck size={24} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">
              Estado de Envíos de Mis Ventas
            </h2>
            <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider">
              Consulta en tiempo real el estado de despacho y comparte actualizaciones a tus clientes
            </p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex bg-slate-100 p-1 rounded-2xl self-start sm:self-auto border border-slate-200">
          <button
            onClick={() => { setTimeFilter('7DAYS'); playSound('click'); }}
            className={`px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
              timeFilter === '7DAYS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Últimos 7 Días
          </button>
          <button
            onClick={() => { setTimeFilter('30DAYS'); playSound('click'); }}
            className={`px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
              timeFilter === '30DAYS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Último Mes
          </button>
          <button
            onClick={() => { setTimeFilter('ALL'); playSound('click'); }}
            className={`px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
              timeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Todas ({counts.total})
          </button>
        </div>
      </div>

      {/* KPI Status Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => { setStatusTab('ALL'); playSound('click'); }}
          className={`p-3.5 rounded-[22px] border text-left transition-all ${
            statusTab === 'ALL' 
              ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
              : 'bg-white text-slate-800 border-slate-100 hover:border-slate-200'
          }`}
        >
          <span className="text-[9px] font-black uppercase tracking-widest opacity-70 block">Total</span>
          <p className="text-2xl font-black mt-0.5">{counts.total}</p>
        </button>

        <button
          onClick={() => { setStatusTab('PREPARACION'); playSound('click'); }}
          className={`p-3.5 rounded-[22px] border text-left transition-all ${
            statusTab === 'PREPARACION' 
              ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' 
              : 'bg-white text-slate-800 border-slate-100 hover:border-amber-200'
          }`}
        >
          <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 block flex items-center gap-1">
            <Clock size={10} /> Preparación
          </span>
          <p className="text-2xl font-black mt-0.5">{counts.prep}</p>
        </button>

        <button
          onClick={() => { setStatusTab('EN_RUTA'); playSound('click'); }}
          className={`p-3.5 rounded-[22px] border text-left transition-all ${
            statusTab === 'EN_RUTA' 
              ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' 
              : 'bg-white text-slate-800 border-slate-100 hover:border-blue-200'
          }`}
        >
          <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 block flex items-center gap-1">
            <Truck size={10} /> En Ruta
          </span>
          <p className="text-2xl font-black mt-0.5">{counts.enRuta}</p>
        </button>

        <button
          onClick={() => { setStatusTab('JUNTA'); playSound('click'); }}
          className={`p-3.5 rounded-[22px] border text-left transition-all ${
            statusTab === 'JUNTA' 
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' 
              : 'bg-white text-slate-800 border-slate-100 hover:border-indigo-200'
          }`}
        >
          <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 block flex items-center gap-1">
            <Boxes size={10} /> Junta Compra
          </span>
          <p className="text-2xl font-black mt-0.5">{counts.junta}</p>
        </button>

        <button
          onClick={() => { setStatusTab('RETIRO'); playSound('click'); }}
          className={`p-3.5 rounded-[22px] border text-left transition-all ${
            statusTab === 'RETIRO' 
              ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20' 
              : 'bg-white text-slate-800 border-slate-100 hover:border-orange-200'
          }`}
        >
          <span className="text-[9px] font-black uppercase tracking-widest text-orange-600 block flex items-center gap-1">
            <Package size={10} /> Retiro
          </span>
          <p className="text-2xl font-black mt-0.5">{counts.retiro}</p>
        </button>

        <button
          onClick={() => { setStatusTab('ENTREGADO'); playSound('click'); }}
          className={`p-3.5 rounded-[22px] border text-left transition-all ${
            statusTab === 'ENTREGADO' 
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20' 
              : 'bg-white text-slate-800 border-slate-100 hover:border-emerald-200'
          }`}
        >
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 block flex items-center gap-1">
            <CheckCircle2 size={10} /> Entregados
          </span>
          <p className="text-2xl font-black mt-0.5">{counts.entregados}</p>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative group">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
          <Search size={20} />
        </div>
        <input 
          type="text" 
          placeholder="Buscar venta por cliente, N° venta, teléfono, fardo, transportista, ciudad..."
          className="w-full pl-13 pr-6 py-4 bg-white rounded-[24px] border-2 border-slate-100 focus:border-blue-400 outline-none font-bold text-sm shadow-sm transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 hover:text-slate-600 bg-slate-100 px-2 py-1 rounded-lg"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Sales Shipping Cards List */}
      {filteredSales.length === 0 ? (
        <div className="bg-white p-10 rounded-[36px] border border-slate-100 shadow-lg text-center space-y-3">
          <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <Truck size={24} />
          </div>
          <p className="font-extrabold text-slate-800 text-base uppercase tracking-tight">No se encontraron envíos</p>
          <p className="text-slate-400 text-xs font-medium max-w-md mx-auto">
            No hay registros que coincidan con los filtros actuales. Intenta cambiar de pestaña o borrar la búsqueda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSales.map((sale) => {
            const statusInfo = formatShippingStatus(sale);
            const isSent = sale.status === SaleStatus.ENVIADO;
            const itemsCount = sale.items && sale.items.length > 0 
              ? sale.items.reduce((acc, i) => acc + (Number(i.cantidad) || 0), 0)
              : (sale.cantidad || 1);

            return (
              <div 
                key={sale.id}
                className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col justify-between p-6 relative group"
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
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 pt-1">
                    <span className="px-3 py-1 bg-slate-900 text-white rounded-xl text-[10px] font-black font-mono">
                      #{sale.numeroVenta}
                    </span>
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border ${statusInfo.badgeBg} ${statusInfo.badgeTextColor}`}>
                      {statusInfo.badgeText}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase leading-tight truncate">
                      {sale.cliente}
                    </h3>
                    <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Phone size={12} className="text-emerald-600" />
                      <span>{sale.telefono || 'Sin teléfono'}</span>
                    </p>
                  </div>

                  {/* Product & Destination Details */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-500 text-[10px] uppercase">Producto:</span>
                      <span className="text-slate-800 text-right truncate max-w-[180px] font-black">
                        {sale.items && sale.items.length > 0 
                          ? `${sale.items.length} ítem(s) (${itemsCount} u.)`
                          : (stock.find(s => s.codigo === sale.codigoFardo)?.tipo || sale.codigoFardo || 'Fardo')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 text-[10px] uppercase">Modalidad:</span>
                      <span className="text-slate-800 font-bold uppercase text-[11px]">
                        {sale.tipoDespacho || 'Despacho'} {sale.agencia ? `(${sale.agencia})` : ''}
                      </span>
                    </div>

                    {sale.direccion && sale.tipoDespacho !== DispatchType.RETIRO && (
                      <p className="text-[10px] font-semibold text-slate-600 uppercase truncate flex items-center gap-1">
                        <MapPin size={11} className="text-amber-500 shrink-0" />
                        <span className="truncate">{sale.direccion}</span>
                      </p>
                    )}

                    {sale.transportista && (
                      <p className="text-[10px] font-black text-blue-700 uppercase flex items-center gap-1">
                        <Truck size={11} className="shrink-0" />
                        <span>Transporte: {sale.transportista}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenWhatsApp(sale)}
                      className="flex-1 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                      title="Enviar actualización directamente al WhatsApp del cliente"
                    >
                      <MessageSquare size={14} /> WhatsApp
                    </button>

                    <button
                      onClick={() => handleCopyStatus(sale)}
                      className={`p-2.5 rounded-2xl border transition-all ${
                        copiedId === sale.id 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-300' 
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 active:scale-95'
                      }`}
                      title="Copiar texto de estado para WhatsApp"
                    >
                      {copiedId === sale.id ? <Check size={16} /> : <Copy size={16} />}
                    </button>

                    <button
                      onClick={() => {
                        setSelectedSaleForModal(sale);
                        playSound('click');
                      }}
                      className="p-2.5 bg-slate-900 hover:bg-black text-white rounded-2xl transition-all active:scale-95"
                      title="Ver detalle completo de seguimiento"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
