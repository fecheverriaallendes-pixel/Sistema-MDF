
import React, { useState, useRef, useMemo } from 'react';
import { Search, Phone, CheckCircle2, AlertCircle, X, Save, MapPin, CreditCard, UserCheck, Tag, Info, FileEdit, BadgeDollarSign, Truck, Building2, Home, Package, Trash2, Camera, Archive, RotateCcw, Send, ShieldAlert, Lock, Printer, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { SaleStatus, SaleType, Sale, DispatchType, StaffRole } from '../types';
import { smartTextMatch } from '../utils/search';
import { matchRut, cleanRut, formatRut } from '../utils/rutUtils';
import { Label } from '../components/Label';
import { Invoice } from '../components/Invoice';
import { VentasArchiveModal } from '../components/VentasArchiveModal';
import { VentasEliminadasModal } from '../components/VentasEliminadasModal';
import { SaleTrackingModal, formatShippingStatus, generateWhatsAppTrackingMessage } from '../components/SaleTrackingModal';
import { PrintLabelsModal } from '../components/PrintLabelsModal';
import { getTotalBultos, generateIndividualLabels } from '../utils/labelUtils';
import { isLautaroOrFardolandia } from '../utils/partnerUtils';
import { matchesCarrierSearch } from '../utils/carrierUtils';
import { getPendingSalesForClient } from '../utils/clientPendingSales';

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

export default function Ventas() {
  const { sales, updateSale, markAsSent, revertDispatchToPending, playSound, deleteSale, deleteAllSales, reassignDuplicateSaleNumber, currentUser, stock, deletedSales, getSalePrintLogs } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [reassigningSaleId, setReassigningSaleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'READY'>('READY');
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [printSale, setPrintSale] = useState<Sale | null>(null);
  const [printType, setPrintType] = useState<'FACTURA' | 'ETIQUETAS' | null>(null);
  const [sortKey, setSortKey] = useState<'numeroVenta' | 'fecha'>('numeroVenta');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [shippingFilter, setShippingFilter] = useState<'ALL' | 'PREP' | 'EN_RUTA' | 'JUNTA' | 'RETIRO' | 'ENTREGADO'>('ALL');
  const [trackingSale, setTrackingSale] = useState<Sale | null>(null);
  const [labelModalSale, setLabelModalSale] = useState<Sale | null>(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isDeletedSalesModalOpen, setIsDeletedSalesModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);

  const isAdmin = currentUser?.rol === StaffRole.ADMIN;
  const isLautaroUser = Boolean(currentUser && isLautaroOrFardolandia(currentUser));
  const canSeeAll = isAdmin && !isLautaroUser;

  const matchesLautaro = (s: Sale) => isLautaroOrFardolandia(s) || (currentUser?.nombre && s.vendedor === currentUser.nombre);

  const pendingLiveSales = useMemo(() => {
    return (sales || []).filter(s => {
      if (!s || s.datosCompletos || s.tipoVenta !== SaleType.LIVE) return false;
      if (isLautaroUser) return matchesLautaro(s);
      return canSeeAll || s.vendedor === currentUser?.nombre;
    });
  }, [sales, isLautaroUser, canSeeAll, currentUser?.nombre]);

  const readySales = useMemo(() => {
    return (sales || []).filter(s => {
      if (!s) return false;
      if (!(s.datosCompletos || s.tipoVenta === SaleType.NORMAL || s.tipoVenta === SaleType.NOTA_VENTA)) return false;
      if (isLautaroUser) {
        if (!matchesLautaro(s)) return false;
      } else if (!canSeeAll && s.vendedor !== currentUser?.nombre) {
        return false;
      }
      
      const d = s.fecha ? parseLocalDate(s.fecha) : new Date();
      if (isNaN(d.getTime())) return false;
      
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [sales, isLautaroUser, canSeeAll, currentUser?.nombre, selectedMonth, selectedYear]);

  const currentSales = activeTab === 'PENDING' ? pendingLiveSales : readySales;

  // Detectar números de venta duplicados entre las ventas activas (para corrección inmediata por Admin)
  const duplicateNumberMap = useMemo(() => {
    const map = new Map<number, Sale[]>();
    (sales || []).forEach(s => {
      const num = Number(s?.numeroVenta) || 0;
      if (num <= 0) return;
      const list = map.get(num) || [];
      list.push(s);
      map.set(num, list);
    });
    const dups = new Map<number, Sale[]>();
    map.forEach((list, num) => {
      if (list.length > 1) {
        const sorted = [...list].sort((a, b) =>
          (a.timestamp || a.fecha || '').localeCompare(b.timestamp || b.fecha || '')
        );
        dups.set(num, sorted);
      }
    });
    return dups;
  }, [sales]);

  const pendingDuplicateGroups = useMemo(() => {
    return Array.from(duplicateNumberMap.entries())
      .filter(([_, list]) => list.some(s => s.status === SaleStatus.PENDIENTE && !s.enviado))
      .sort((a, b) => b[0] - a[0]);
  }, [duplicateNumberMap]);

  const handleReassignDuplicate = async (sale: Sale) => {
    if (!isAdmin) return;
    const confirmed = confirm(
      `¿Asignar un nuevo número de venta único a la compra de ${sale.cliente} (${sale.vendedor || 'Sin vendedora'}) actualmente con el N° duplicado #${sale.numeroVenta}?\n\n` +
      `• Se conservarán intactos el cliente, producto, vendedora y comisión.\n` +
      `• Recuerda reimprimir la etiqueta térmica con el nuevo número asignado.`
    );
    if (!confirmed) return;
    setReassigningSaleId(sale.id);
    try {
      const newNum = await reassignDuplicateSaleNumber(sale.id);
      alert(`✓ Venta corregida: ahora tiene el número único #${newNum}.\nRecuerda reimprimir la etiqueta de esta venta si ya estaba impresa.`);
    } catch (err: any) {
      alert(`Error al reasignar número: ${err?.message || 'Error desconocido'}`);
    } finally {
      setReassigningSaleId(null);
    }
  };

  const filteredSales = useMemo(() => {
    return currentSales
      .filter(s => {
        if (shippingFilter !== 'ALL') {
          const isJunta = Boolean(s.juntaCompra && s.juntaCompra.trim().toUpperCase().includes('JUNTA') && s.status === SaleStatus.PENDIENTE);
          const isRetiro = s.tipoDespacho === DispatchType.RETIRO;
          const isEnviado = s.status === SaleStatus.ENVIADO;
          const isEnRuta = s.status === SaleStatus.PENDIENTE && Boolean(s.transportista) && !isJunta;
          const isPrep = s.status === SaleStatus.PENDIENTE && !s.transportista && !isJunta && !isRetiro;

          if (shippingFilter === 'PREP' && !isPrep) return false;
          if (shippingFilter === 'EN_RUTA' && !isEnRuta) return false;
          if (shippingFilter === 'JUNTA' && !isJunta) return false;
          if (shippingFilter === 'RETIRO' && (!isRetiro || isEnviado)) return false;
          if (shippingFilter === 'ENTREGADO' && !isEnviado) return false;
        }

        if (!searchTerm.trim()) return true;

        const itemsText = (s.items || []).map(i => `${i.codigoFardo}`).join(' ');
        const cleanRutVal = s.rut ? cleanRut(s.rut) : '';
        const combined = `${s.cliente} ${s.codigoFardo || ''} ${s.numeroVenta} ${s.rut || ''} ${cleanRutVal} ${s.vendedor || ''} ${itemsText} ${s.transportista || ''} ${s.agencia || ''}`;
        return matchesCarrierSearch(searchTerm.toLowerCase().trim(), s) || smartTextMatch(combined, searchTerm) || Boolean(s.rut && matchRut(s.rut, searchTerm));
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortKey === 'numeroVenta') {
          comparison = (a.numeroVenta || 0) - (b.numeroVenta || 0);
        } else {
          comparison = parseLocalDate(a.fecha).getTime() - parseLocalDate(b.fecha).getTime();
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [currentSales, shippingFilter, searchTerm, sortKey, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedSales = useMemo(() => {
    if (pageSize >= 1000) return filteredSales;
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredSales.slice(start, start + pageSize);
  }, [filteredSales, safeCurrentPage, pageSize]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleTabChange = (tab: 'PENDING' | 'READY') => {
    setActiveTab(tab);
    setCurrentPage(1);
    playSound('click');
  };

  const handleQuickRetiro = (sale: Sale) => {
    if (confirm(`¿Confirmar retiro físico de la Venta #${sale.numeroVenta} (${sale.cliente}) en Bodega?`)) {
      markAsSent(sale.id);
      playSound('success');
    }
  };

  const handleSaveSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;
    
    // Ensure dispatch type is set, default to AGENCIA if not selected
    const finalSale = {
      ...editingSale,
      datosCompletos: true,
      status: editingSale.status === SaleStatus.PENDIENTE ? SaleStatus.PENDIENTE : editingSale.status,
      tipoDespacho: editingSale.tipoDespacho || DispatchType.AGENCIA
    };

    updateSale(editingSale.id, finalSale);
    setEditingSale(null);
    playSound('success');
  };

  const togglePaymentStatus = (sale: Sale) => {
    const newStatus = sale.estadoPago === 'Pagado' ? 'Pendiente' : 'Pagado';
    updateSale(sale.id, { estadoPago: newStatus });
    playSound('success');
  };

  const handlePrint = (sale: Sale, type: 'FACTURA' | 'ETIQUETAS') => {
    setPrintSale(sale);
    setPrintType(type);
  };

  React.useEffect(() => {
    if (printSale && printType) {
      console.log(`Debug print: ${printType} for ${printSale.numeroVenta}`);
      const timer = setTimeout(() => {
        window.print();
        // Clear print state after printing
        setTimeout(() => {
          setPrintSale(null);
          setPrintType(null);
        }, 1000);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [printSale, printType]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="print-only">
        {printSale && printType === 'FACTURA' && (
          <div className="invoice-container">
            <Invoice sale={printSale} stock={stock} />
            {console.log("Invoice rendered")}
          </div>
        )}
        {printSale && printType === 'ETIQUETAS' && (
          generateIndividualLabels(printSale, stock).map((lbl, idx) => (
            <div key={`${printSale.id}-${idx}`} className="label-container"><Label sale={printSale} stock={stock} item={lbl.item} /></div>
          ))
        )}
      </div>
      <style>{`
          @media print {
            body { 
              background: white !important; 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
            }
            .no-print { display: none !important; }
            .print-only { 
              display: block !important; 
              position: static !important; 
              width: 100% !important; 
              margin: 0 !important; 
              padding: 0 !important; 
            }
            
            /* Reset body limits to allow printing full content without cutoff */
            body, html {
              height: auto !important;
              overflow: visible !important;
            }
            #root, #root > div, main {
              height: auto !important;
              overflow: visible !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            .label-container { 
              width: 100mm !important; 
              height: 150mm !important; 
              max-height: 150mm !important;
              margin: 0 !important;
              padding: 2mm 2mm 5mm 2mm !important;
              box-sizing: border-box !important;
              page-break-after: always !important; 
              page-break-inside: avoid !important;
              break-after: page !important;
              break-inside: avoid !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              justify-content: center !important;
              overflow: hidden !important; 
            }
            .label-container:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
            .invoice-container { 
              width: 100%; 
              padding: 15mm 20mm; 
              box-sizing: border-box; 
              page-break-after: always; 
              overflow: visible; 
            }
            @page { size: auto; margin: 0; }
          }
          
          /* Hide print-only on screen */
          @media screen {
            .print-only { display: none; }
          }
        `}</style>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 no-print">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Historial de Ventas</h2>
          <p className="text-slate-500 italic font-medium">Gestión de clientes y recolección de datos pendientes</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <>
              <button
                onClick={() => { setIsDeletedSalesModalOpen(true); playSound('click'); }}
                className="flex items-center gap-2 px-5 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200/90 rounded-[20px] font-black text-xs uppercase tracking-wider transition-all shadow-xs active:scale-95"
                title="Ver ventas eliminadas y números bloqueados definitivamente"
              >
                <ShieldAlert size={16} className="text-rose-600" />
                <span>Ventas Eliminadas ({deletedSales.length})</span>
              </button>

              <button
                onClick={() => { setIsArchiveModalOpen(true); playSound('click'); }}
                className="flex items-center gap-2 px-5 py-3.5 bg-slate-900 hover:bg-black text-white rounded-[20px] font-black text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-slate-900/20 active:scale-95"
                title="Archivar ventas antiguas y descargar copias de respaldo"
              >
                <Archive size={16} className="text-emerald-400" />
                <span>Respaldar / Archivar</span>
              </button>
            </>
          )}
          <div className="flex bg-slate-200 p-1.5 rounded-[24px] shadow-inner">
            <button 
              onClick={() => { setActiveTab('PENDING'); playSound('click'); }}
              className={`flex items-center gap-3 px-6 py-3 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'PENDING' ? 'bg-amber-500 text-white shadow-xl' : 'text-slate-600'}`}
            >
              <AlertCircle size={18} /> Pendientes Live ({pendingLiveSales.length})
            </button>
            <button 
              onClick={() => { setActiveTab('READY'); playSound('click'); }}
              className={`flex items-center gap-3 px-6 py-3 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'READY' ? 'bg-emerald-500 text-white shadow-xl' : 'text-slate-600'}`}
            >
              <CheckCircle2 size={18} /> Ventas Completas ({readySales.length})
            </button>
          </div>
        </div>
      </div>

      {isAdmin && pendingDuplicateGroups.length > 0 && (
        <div className="no-print bg-rose-50 border-2 border-rose-300 rounded-[28px] p-5 shadow-md space-y-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0">
              <AlertTriangle size={22} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-black uppercase text-rose-950 tracking-tight">
                Se detectaron {pendingDuplicateGroups.length} número(s) de venta duplicado(s) en ventas pendientes
              </h3>
              <p className="text-xs text-rose-900 font-medium mt-0.5">
                Puedes conservar el número original en la primera venta y asignar un folio nuevo único a la copia (se mantienen intactos los productos, vendedoras y comisiones).
              </p>
            </div>
          </div>
          <div className="space-y-2.5">
            {pendingDuplicateGroups.map(([dupNum, groupSales]) => (
              <div key={dupNum} className="bg-white border border-rose-200 rounded-2xl p-3.5 space-y-2">
                <div className="text-xs font-black uppercase text-rose-800">
                  Folio duplicado #{dupNum} ({groupSales.length} ventas)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {groupSales.map((dupSale, idx) => {
                    const prodText = dupSale.tipoVenta === SaleType.NOTA_VENTA
                      ? (dupSale.items || []).map(i => `${i.codigoFardo} x${i.cantidad}`).join(', ')
                      : (dupSale.codigoFardo || 'Sin código');
                    return (
                      <div key={dupSale.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                        <div className="min-w-0 text-xs">
                          <div className="font-black text-slate-900 truncate">
                            {dupSale.cliente}
                            {idx === 0 && (
                              <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] uppercase">
                                1ra registrada
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-600 font-semibold">
                            Vendedora: <strong className="text-slate-800">{dupSale.vendedor || 'General'}</strong> • {prodText} • ${(dupSale.total || 0).toLocaleString('es-CL')}
                          </div>
                        </div>
                        {idx > 0 && (
                          <button
                            type="button"
                            disabled={reassigningSaleId === dupSale.id}
                            onClick={() => handleReassignDuplicate(dupSale)}
                            className="shrink-0 px-3 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-xs"
                          >
                            {reassigningSaleId === dupSale.id ? 'Asignando...' : 'Asignar N° único'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative group no-print">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={28} />
        <input 
          type="text" 
          placeholder="Buscar por cliente, RUT (ej: 12.345.678-9), fardo o N° de venta..."
          className="w-full pl-16 pr-8 py-5 rounded-[32px] border-2 border-slate-100 focus:border-slate-300 outline-none transition-all shadow-sm text-xl font-bold"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="flex flex-wrap gap-4 p-4 bg-slate-50 rounded-[24px] no-print items-center">
        {activeTab === 'READY' && (
          <>
            <select className="px-5 py-3 rounded-xl border font-bold text-sm bg-white" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
              {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select className="px-5 py-3 rounded-xl border font-bold text-sm bg-white" value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
              {Array.from({length: 12}).map((_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('es-ES', { month: 'long' })}</option>)}
            </select>
          </>
        )}
        <select 
          className="px-5 py-3 rounded-xl border font-bold text-sm bg-white text-slate-800" 
          value={shippingFilter} 
          onChange={(e) => setShippingFilter(e.target.value as any)}
        >
          <option value="ALL">🚚 Envíos (Todos)</option>
          <option value="PREP">⏳ En Preparación</option>
          <option value="EN_RUTA">🚚 En Ruta / Asignado</option>
          <option value="JUNTA">📦 Junta Compra</option>
          <option value="RETIRO">🏢 Retiro en Bodega</option>
          <option value="ENTREGADO">✅ Entregados / Despachados</option>
        </select>
        <select className="px-5 py-3 rounded-xl border font-bold text-sm bg-white" value={sortKey} onChange={(e) => setSortKey(e.target.value as 'numeroVenta' | 'fecha')}>
          <option value="numeroVenta">Ordenar por Nº Venta</option>
          <option value="fecha">Ordenar por Fecha</option>
        </select>
        <button className="px-5 py-3 rounded-xl border font-bold bg-white text-sm" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
           {sortOrder === 'asc' ? 'A-Z (Asc)' : 'Z-A (Desc)'}
        </button>
      </div>

      <div className="bg-white rounded-[48px] border border-slate-100 shadow-2xl overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operación / Fecha</th>
                <th className="px-6 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Producto / Mercadería</th>
                <th className="px-6 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Monto</th>
                <th className="px-6 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado Pago</th>
                <th className="px-6 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado Envío</th>
                <th className="px-6 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold uppercase text-xs">
                    No se encontraron ventas para los filtros seleccionados
                  </td>
                </tr>
              ) : (
                paginatedSales.map((sale) => {
                  const statusInfo = formatShippingStatus(sale);
                  return (
                  <tr key={sale.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-6 font-mono font-black text-slate-900 text-lg flex items-center gap-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span>#{sale.numeroVenta}</span>
                          {duplicateNumberMap.has(Number(sale.numeroVenta)) && (
                            <span
                              className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 text-[9px] font-sans font-black uppercase"
                              title="Número de venta duplicado"
                            >
                              Duplicado
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold">{parseLocalDate(sale.fecha).toLocaleDateString()}</span>
                        {isAdmin && duplicateNumberMap.has(Number(sale.numeroVenta)) && duplicateNumberMap.get(Number(sale.numeroVenta))?.[0]?.id !== sale.id && (
                          <button
                            type="button"
                            disabled={reassigningSaleId === sale.id}
                            onClick={() => handleReassignDuplicate(sale)}
                            className="mt-1 px-2 py-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg font-sans text-[9px] font-black uppercase tracking-wider w-fit"
                          >
                            {reassigningSaleId === sale.id ? 'Corrigiendo...' : 'Asignar N° único'}
                          </button>
                        )}
                      </div>
                      {sale.comprobante && (
                        <a href={sale.comprobante} target="_blank" rel="noreferrer" className="text-emerald-500 hover:text-emerald-700">
                          <Camera size={16} />
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 uppercase tracking-tight">{sale.cliente}</span>
                        <a 
                          href={`https://wa.me/${sale.telefono.replace(/\D/g, '')}`} 
                          target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs text-emerald-600 font-black hover:underline"
                        >
                          <Phone size={14} /> {sale.telefono}
                        </a>
                        <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">Vendedor: {sale.vendedor || 'Desconocido'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                          <Tag size={18} className="text-slate-400" />
                          <span className="font-black text-slate-700 uppercase">
                            {sale.tipoVenta === SaleType.NOTA_VENTA 
                              ? 'Nota de Venta (Varios)' 
                              : stock.find(item => item.codigo === sale.codigoFardo)?.tipo || sale.codigoFardo}
                          </span>
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase ml-7">
                          {sale.tipoVenta === SaleType.NOTA_VENTA 
                            ? sale.items?.map(i => i.codigoFardo).join(', ') 
                            : (sale.variante || 'Pendiente Clasificar')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right font-black text-slate-900 text-2xl tracking-tighter">
                      ${sale.total.toLocaleString()}
                    </td>
                    <td className="px-6 py-6 text-center">
                      <button 
                        onClick={() => togglePaymentStatus(sale)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all shadow-sm ${sale.estadoPago === 'Pagado' ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-100'}`}
                      >
                        <BadgeDollarSign size={14} /> {sale.estadoPago}
                      </button>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <button
                          onClick={() => {
                            setTrackingSale(sale);
                            playSound('click');
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm border hover:scale-105 ${statusInfo.badgeBg} ${statusInfo.badgeTextColor}`}
                          title="Ver tracking y enviar estado al cliente"
                        >
                          <Truck size={12} /> {statusInfo.badgeText}
                        </button>

                        {/* Botón directo de Retiro en Bodega para mayor rapidez */}
                        {sale.status === SaleStatus.PENDIENTE && sale.tipoDespacho === DispatchType.RETIRO && (
                          <button
                            onClick={() => handleQuickRetiro(sale)}
                            className="mt-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-tight flex items-center gap-1 shadow-xs active:scale-95 transition-all"
                            title="Confirmar retiro físico en bodega inmediatamente"
                          >
                            <CheckCircle2 size={11} /> Confirmar Retiro
                          </button>
                        )}

                        <div className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[130px]">
                          {sale.tipoDespacho || 'Despacho'} {sale.transportista ? `• ${sale.transportista}` : ''}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-1.5 justify-center">
                          <button 
                            onClick={() => setEditingSale(sale)}
                            className={`px-4 py-2 rounded-[14px] font-black text-[11px] uppercase tracking-wider transition-all flex items-center gap-1 shadow-md ${activeTab === 'PENDING' ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                          >
                            <FileEdit size={14} /> {activeTab === 'PENDING' ? 'Completar' : 'Editar'}
                          </button>
                          <button
                            onClick={() => {
                              setTrackingSale(sale);
                              playSound('click');
                            }}
                            className="px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-[14px] text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1"
                            title="Tracking de Envío"
                          >
                            <Truck size={14} /> Tracking
                          </button>
                        </div>
                        {(sale.datosCompletos || sale.tipoVenta === SaleType.NOTA_VENTA) && (
                          <div className="flex gap-2 justify-center text-xs font-bold items-center flex-wrap">
                            <button onClick={() => { handlePrint(sale, 'FACTURA'); }} className="text-blue-500 hover:text-blue-700">Factura</button>
                            <button 
                              onClick={() => { setLabelModalSale(sale); playSound('click'); }} 
                              className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg transition-colors font-black"
                              title={sale.impresa ? `Impresa previamente (${sale.totalImpresiones || 1} veces). Clic para ver historial o reimprimir` : 'Imprimir etiquetas térmicas'}
                            >
                              Etiquetas {(() => {
                                const b = getTotalBultos(sale);
                                return b > 1 ? `(${b})` : '';
                              })()}
                              {sale.impresa && (
                                <span className="ml-0.5 text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-full font-mono font-bold" title={`Impresa ${sale.totalImpresiones || 1} vez/veces`}>
                                  ✓{sale.totalImpresiones && sale.totalImpresiones > 1 ? `x${sale.totalImpresiones}` : ''}
                                </span>
                              )}
                            </button>
                            {sale.status === SaleStatus.PENDIENTE && (() => {
                              const cp = getPendingSalesForClient(sale, sales);
                              if (!cp.hasPendingPurchases) return null;
                              return (
                                <button
                                  type="button"
                                  onClick={() => { setLabelModalSale(sale); playSound('warning'); }}
                                  className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-rose-800 bg-rose-100 hover:bg-rose-200 border border-rose-300 px-1.5 py-0.5 rounded-md transition-all shadow-xs"
                                  title={`Clienta con ${cp.totalPendingCount + 1} compras pendientes (${cp.distinctVendedoras.join(', ')}). Clic para ver y consolidar`}
                                >
                                  <AlertTriangle size={10} className="text-rose-600 shrink-0" />
                                  <span>{cp.totalPendingCount + 1} Compras</span>
                                </button>
                              );
                            })()}
                          </div>
                        )}
                        {isAdmin && (sale.status === SaleStatus.ENVIADO || sale.enviado) && (
                          <button
                            onClick={() => {
                              if (confirm(`¿Estás seguro de que deseas volver la Venta #${sale.numeroVenta} (${sale.cliente}) a status PENDIENTE de despacho?`)) {
                                revertDispatchToPending(sale.id);
                              }
                            }}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-black uppercase tracking-tight flex items-center justify-center gap-1 transition-all mx-auto shadow-sm active:scale-95"
                            title="Potestad Administrador: Volver despacho a estado Pendiente"
                          >
                            <RotateCcw size={11} className="text-amber-700" />
                            <span>Revertir Despacho</span>
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => { 
                              if(confirm(`¿Estás seguro de que deseas eliminar la venta #${sale.numeroVenta} (${sale.cliente})?\n\n⚠️ AVISO IMPORTANTE: El número #${sale.numeroVenta} quedará BLOQUEADO PERMANENTEMENTE y NO será reutilizado por ninguna otra venta para evitar confusiones en bodega.`)) {
                                deleteSale(sale.id);
                              }
                            }}
                            className="mt-1 text-red-500 hover:text-red-700 block mx-auto text-xs"
                            title={`Eliminar venta #${sale.numeroVenta} (Bloquea el número permanentemente)`}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Barra de Paginación Rápida */}
        {filteredSales.length > 0 && (
          <div className="bg-slate-50 border-t border-slate-100 p-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs font-bold text-slate-500">
              Mostrando <span className="font-black text-slate-900">{Math.min((safeCurrentPage - 1) * pageSize + 1, filteredSales.length)} - {Math.min(safeCurrentPage * pageSize, filteredSales.length)}</span> de <span className="font-black text-slate-900">{filteredSales.length}</span> ventas
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                <span>Por pág:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-black text-xs text-slate-800 outline-none"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={5000}>Todas</option>
                </select>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCurrentPage(prev => Math.max(1, prev - 1));
                      playSound('click');
                    }}
                    disabled={safeCurrentPage <= 1}
                    className="p-2 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 rounded-xl text-slate-700 transition-all shadow-xs"
                    title="Página Anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <span className="text-xs font-black text-slate-700 px-2">
                    {safeCurrentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => {
                      setCurrentPage(prev => Math.min(totalPages, prev + 1));
                      playSound('click');
                    }}
                    disabled={safeCurrentPage >= totalPages}
                    className="p-2 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 rounded-xl text-slate-700 transition-all shadow-xs"
                    title="Página Siguiente"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {editingSale && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[56px] shadow-[0_50px_100px_rgba(0,0,0,0.5)] w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10 bg-slate-900 text-white flex justify-between items-center relative">
              <div className="relative z-10">
                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">
                  {editingSale.datosCompletos ? 'Editar Datos de Venta' : 'Completar Datos de Venta Live'}
                </p>
                <h3 className="text-4xl font-black uppercase tracking-tighter">
                  {editingSale.datosCompletos ? `VENTA #${editingSale.numeroVenta}` : `CLIENTE: ${editingSale.cliente}`}
                </h3>
              </div>
              <button onClick={() => setEditingSale(null)} className="relative z-10 p-3 hover:bg-white/10 rounded-full transition-colors">
                <X size={36} />
              </button>
            </div>
            
            <form onSubmit={handleSaveSale} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block flex items-center gap-2">
                    <UserCheck size={14} className="text-indigo-500" /> Nombre del Cliente
                  </label>
                  <input required type="text" className="w-full px-7 py-4 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black text-lg uppercase" placeholder="NOMBRE COMPLETO" value={editingSale.cliente || ''} onChange={(e) => setEditingSale({...editingSale, cliente: e.target.value.toUpperCase()})}/>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block flex items-center gap-2">
                    <Phone size={14} className="text-emerald-500" /> Teléfono / WhatsApp
                  </label>
                  <input required type="text" className="w-full px-7 py-4 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black text-lg" placeholder="+56 9 ..." value={editingSale.telefono || ''} onChange={(e) => setEditingSale({...editingSale, telefono: e.target.value})}/>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block flex items-center gap-2">
                    <CreditCard size={14} className="text-blue-500" /> RUT Cliente
                  </label>
                  <input required type="text" className="w-full px-7 py-4 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black text-lg uppercase" placeholder="12.345.678-9" value={editingSale.rut || ''} onChange={(e) => setEditingSale({...editingSale, rut: e.target.value.toUpperCase()})}/>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block flex items-center gap-2">
                    <Info size={14} className="text-purple-500" /> Vendedor Asignado
                  </label>
                  <input required type="text" className="w-full px-7 py-4 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black text-lg uppercase" placeholder="NOMBRE VENDEDOR" value={editingSale.vendedor || ''} onChange={(e) => setEditingSale({...editingSale, vendedor: e.target.value.toUpperCase()})}/>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Estado Pago Actual</label>
                  <select className="w-full px-7 py-4 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black text-lg" value={editingSale.estadoPago} onChange={(e) => setEditingSale({...editingSale, estadoPago: e.target.value})}>
                    <option value="Pendiente">PENDIENTE DE PAGO</option>
                    <option value="Pagado">YA PAGADO</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Prioridad Envío</label>
                  <select className="w-full px-7 py-4 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black text-lg" value={editingSale.juntaCompra} onChange={(e) => setEditingSale({...editingSale, juntaCompra: e.target.value})}>
                    <option value="DESPACHO INMEDIATO">DESPACHO INMEDIATO</option>
                    <option value="JUNTA COMPRA">JUNTA COMPRA</option>
                    <option value="RETIRO BODEGA">RETIRO EN BODEGA</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block flex items-center gap-2">
                  <MapPin size={14} className="text-amber-500" /> Dirección Completa Despacho
                </label>
                <textarea required className="w-full px-7 py-4 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black text-lg uppercase resize-y min-h-[160px]" placeholder="CALLE, N°, COMUNA, REGIÓN" value={editingSale.direccion || ''} onChange={(e) => setEditingSale({...editingSale, direccion: e.target.value.toUpperCase()})}/>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block flex items-center gap-2">
                  <Truck size={14} className="text-blue-500" /> Tipo de Entrega
                </label>
                <div className="flex bg-slate-50 p-1.5 rounded-[24px] border-2 border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setEditingSale({...editingSale, tipoDespacho: DispatchType.AGENCIA, agencia: ''})}
                    className={`flex-1 py-3 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${editingSale.tipoDespacho === DispatchType.AGENCIA ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-200'}`}
                  >
                    <Building2 size={16} /> Agencia
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditingSale({...editingSale, tipoDespacho: DispatchType.DOMICILIO, agencia: ''})}
                    className={`flex-1 py-3 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${editingSale.tipoDespacho === DispatchType.DOMICILIO ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-200'}`}
                  >
                    <Home size={16} /> Domicilio
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditingSale({...editingSale, tipoDespacho: DispatchType.RETIRO, agencia: 'RETIRO BODEGA'})}
                    className={`flex-1 py-3 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${editingSale.tipoDespacho === DispatchType.RETIRO ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-200'}`}
                  >
                    <Package size={16} /> Retiro en Bodega
                  </button>
                </div>
                {editingSale.tipoDespacho === DispatchType.AGENCIA && (
                  <input required type="text" className="w-full mt-4 px-7 py-4 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black uppercase" placeholder="NOMBRE DE LA AGENCIA" value={editingSale.agencia || ''} onChange={(e) => setEditingSale({...editingSale, agencia: e.target.value.toUpperCase()})}/>
                )}
                {editingSale.tipoDespacho === DispatchType.RETIRO && (
                  <div className="p-3 mt-3 bg-slate-100 border border-slate-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-slate-700 animate-in fade-in duration-300">
                    <Package size={16} className="text-slate-600 shrink-0" />
                    <span>Retiro directo en Bodega</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Tipo de Mercadería (Obligatorio)</label>
                  <select 
                    required 
                    className="w-full px-7 py-4 bg-blue-50 border-2 border-blue-200 text-blue-900 rounded-[24px] font-black text-lg outline-none appearance-none" 
                    value={editingSale.variante} 
                    onChange={(e) => setEditingSale({...editingSale, variante: e.target.value})}
                  >
                    <option value="">SELECCIONAR TIPO...</option>
                    <option value="FARDO">FARDO COMPLETO</option>
                    <option value="MEDIO FARDO">MEDIO FARDO</option>
                    <option value="LOTE">LOTE</option>
                    <option value="SACO">SACO</option>
                    <option value="PACK">PACK</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 flex gap-6">
                <button type="button" onClick={() => setEditingSale(null)} className="flex-1 py-5 border-2 border-slate-100 text-slate-400 font-black rounded-[24px] hover:bg-slate-50 transition-all uppercase tracking-widest text-xs">Cerrar</button>
                <button type="submit" className="flex-[2] py-6 bg-emerald-500 text-white font-black rounded-[24px] shadow-2xl flex items-center justify-center gap-3 text-xl hover:bg-emerald-600 transition-all active:scale-95">
                  <Save size={24} /> GUARDAR Y FINALIZAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Repositorio de Respaldo y Archivo Histórico de Ventas */}
      <VentasArchiveModal 
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
      />

      {/* Modal de Tracking de Envíos */}
      {trackingSale && (
        <SaleTrackingModal 
          sale={trackingSale}
          stock={stock}
          isAdmin={isAdmin}
          onRevertToPending={(s) => {
            revertDispatchToPending(s.id);
            setTrackingSale(null);
          }}
          onClose={() => setTrackingSale(null)}
          onLiberarJuntaCompra={(s) => {
            updateSale(s.id, { juntaCompra: 'DESPACHO INMEDIATO' });
            playSound('success');
            setTrackingSale(null);
          }}
        />
      )}

      {/* Modal de Impresión de Etiquetas Térmicas (Individuales por Bulto / Agrupadas) */}
      {labelModalSale && (
        <PrintLabelsModal 
          isOpen={Boolean(labelModalSale)}
          sale={labelModalSale}
          stock={stock}
          onClose={() => setLabelModalSale(null)}
        />
      )}
    </div>
  );
}
