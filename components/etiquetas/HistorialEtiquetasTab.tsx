import React, { useState, useMemo } from 'react';
import { 
  Printer, 
  Search, 
  RotateCcw, 
  Boxes, 
  Layers, 
  Calendar, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight,
  Filter,
  Tag,
  Clock,
  Truck,
  Ban,
  ShieldAlert,
  Info
} from 'lucide-react';
import { LabelPrintLog, Sale, StockItem, DeletedSaleRecord } from '../../types';

interface HistorialEtiquetasTabProps {
  labelPrintLogs: LabelPrintLog[];
  sales: Sale[];
  stock: StockItem[];
  deletedSales?: DeletedSaleRecord[];
  onSelectSale: (sale: Sale) => void;
}

export const HistorialEtiquetasTab: React.FC<HistorialEtiquetasTabProps> = ({
  labelPrintLogs,
  sales,
  stock,
  deletedSales = [],
  onSelectSale
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'REPRINTS' | 'MULTIPRODUCT' | 'TODAY' | 'BLOCKED_NUMBERS'>('ALL');

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const stats = useMemo(() => {
    const totalPrints = labelPrintLogs.length;
    const totalReprints = labelPrintLogs.filter(l => l.esReimpresion).length;
    const multiProductPrints = labelPrintLogs.filter(l => l.entregaMultiplesProductos).length;
    const todayPrints = labelPrintLogs.filter(l => l.fechaHora?.startsWith(todayStr)).length;
    const totalBlocked = deletedSales.length;

    return { totalPrints, totalReprints, multiProductPrints, todayPrints, totalBlocked };
  }, [labelPrintLogs, todayStr, deletedSales]);

  const filteredLogs = useMemo(() => {
    if (activeFilter === 'BLOCKED_NUMBERS') return [];
    return labelPrintLogs.filter(log => {
      // Filter by type
      if (activeFilter === 'REPRINTS' && !log.esReimpresion) return false;
      if (activeFilter === 'MULTIPRODUCT' && !log.entregaMultiplesProductos) return false;
      if (activeFilter === 'TODAY' && !log.fechaHora?.startsWith(todayStr)) return false;

      // Filter by search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const saleNumStr = String(log.numeroVenta || '');
        const clientStr = (log.cliente || '').toLowerCase();
        const userStr = (log.impresoPor || '').toLowerCase();
        const prodStr = (log.productosResumen || '').toLowerCase();
        const motiveStr = (log.motivoReimpresion || '').toLowerCase();

        return (
          saleNumStr.includes(term) ||
          clientStr.includes(term) ||
          userStr.includes(term) ||
          prodStr.includes(term) ||
          motiveStr.includes(term)
        );
      }

      return true;
    });
  }, [labelPrintLogs, activeFilter, searchTerm, todayStr]);

  const filteredDeletedSales = useMemo(() => {
    if (activeFilter !== 'BLOCKED_NUMBERS' && activeFilter !== 'ALL') return [];
    return deletedSales.filter(record => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const saleNumStr = String(record.numeroVenta || '');
        const clientStr = (record.cliente || '').toLowerCase();
        const userStr = (record.deletedBy || '').toLowerCase();
        const motiveStr = (record.motivo || '').toLowerCase();

        return (
          saleNumStr.includes(term) ||
          clientStr.includes(term) ||
          userStr.includes(term) ||
          motiveStr.includes(term)
        );
      }
      return true;
    });
  }, [deletedSales, activeFilter, searchTerm]);

  const handleSaleClick = (saleId: string) => {
    const foundSale = sales.find(s => s.id === saleId);
    if (foundSale) {
      onSelectSale(foundSale);
    } else {
      alert("⚠️ La venta correspondiente ya no se encuentra en la lista activa (podría haber sido despachada, eliminada o archivada).");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Total Impresiones */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Tirajes Registrados</p>
            <h4 className="text-3xl font-black text-slate-900 tracking-tight mt-1">{stats.totalPrints}</h4>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Historial global de bodega</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
            <Printer size={22} />
          </div>
        </div>

        {/* Stat 2: Reimpresiones */}
        <div className="bg-white p-5 rounded-3xl border border-amber-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase text-amber-700 tracking-wider">Reimpresiones (2+)</p>
            <h4 className="text-3xl font-black text-amber-900 tracking-tight mt-1">{stats.totalReprints}</h4>
            <p className="text-[10px] text-amber-700/80 font-semibold mt-0.5">Copias o etiquetas extra</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
            <RotateCcw size={22} />
          </div>
        </div>

        {/* Stat 3: Entregas Multiproducto */}
        <div className="bg-white p-5 rounded-3xl border border-emerald-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase text-emerald-700 tracking-wider">Multiproducto</p>
            <h4 className="text-3xl font-black text-emerald-900 tracking-tight mt-1">{stats.multiProductPrints}</h4>
            <p className="text-[10px] text-emerald-700/80 font-semibold mt-0.5">1 etiqueta = varios productos</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
            <Boxes size={22} />
          </div>
        </div>

        {/* Stat 4: Impresas Hoy */}
        <div className="bg-white p-5 rounded-3xl border border-blue-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase text-blue-700 tracking-wider">Impresas Hoy</p>
            <h4 className="text-3xl font-black text-blue-900 tracking-tight mt-1">{stats.todayPrints}</h4>
            <p className="text-[10px] text-blue-700/80 font-semibold mt-0.5">Turno del día actual</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <Calendar size={22} />
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input 
            type="text"
            placeholder="Buscar por N° Venta, cliente, etiquetador, fardo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-2 rounded-xl text-xs font-black uppercase transition-all ${
              activeFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Todas ({labelPrintLogs.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('REPRINTS')}
            className={`px-3 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
              activeFilter === 'REPRINTS'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-amber-800 hover:text-amber-900'
            }`}
          >
            <RotateCcw size={12} />
            Reimpresiones ({stats.totalReprints})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('MULTIPRODUCT')}
            className={`px-3 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
              activeFilter === 'MULTIPRODUCT'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-800 hover:text-emerald-900'
            }`}
          >
            <Boxes size={12} />
            Multiproducto ({stats.multiProductPrints})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('TODAY')}
            className={`px-3 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
              activeFilter === 'TODAY'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-blue-800 hover:text-blue-900'
            }`}
          >
            <Calendar size={12} />
            Hoy ({stats.todayPrints})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('BLOCKED_NUMBERS')}
            className={`px-3 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
              activeFilter === 'BLOCKED_NUMBERS'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-rose-800 hover:text-rose-900'
            }`}
            title="Ventas eliminadas cuyos números quedaron bloqueados para que nunca se confundan en bodega"
          >
            <Ban size={12} />
            Números Bloqueados ({stats.totalBlocked})
          </button>
        </div>
      </div>

      {/* Info notice about blocked sale numbers */}
      {activeFilter === 'BLOCKED_NUMBERS' && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-4 flex items-center gap-3 text-xs text-rose-900">
          <ShieldAlert size={20} className="text-rose-600 shrink-0" />
          <div>
            <p className="font-black uppercase">Auditoría de Números Retirados y Bloqueados Definitivamente</p>
            <p className="text-[11px] text-rose-700 font-medium mt-0.5">
              Cuando se elimina una venta, su número de venta jamás vuelve a quedar disponible para otra venta. De esta forma, en bodega se elimina cualquier posibilidad de confusión con fardos, etiquetas o despachos pasados.
            </p>
          </div>
        </div>
      )}

      {/* Render Blocked / Deleted Sales if selected or if search matches */}
      {activeFilter === 'BLOCKED_NUMBERS' && (
        <div className="space-y-3">
          {filteredDeletedSales.map((record) => (
            <div 
              key={record.id} 
              className="bg-white rounded-3xl p-5 border-2 border-rose-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-black text-sm px-3 py-1 bg-rose-600 text-white rounded-xl shadow-xs flex items-center gap-1.5">
                    <Ban size={13} />
                    Venta #{record.numeroVenta} (BLOQUEADO)
                  </span>
                  <span className="bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                    Número No Reutilizable
                  </span>
                  <span className="text-slate-400 font-medium text-xs flex items-center gap-1 ml-auto">
                    <Clock size={12} /> Eliminado el: {new Date(record.deletedAt).toLocaleString()}
                  </span>
                </div>

                <div className="text-xs text-slate-700">
                  <span className="font-bold text-slate-900">Cliente original:</span> {record.cliente} • <span className="font-bold text-slate-900">Vendedor:</span> {record.vendedor || 'N/A'} • <span className="font-bold text-slate-900">Fecha de venta:</span> {record.fechaVenta}
                </div>

                <div className="text-[11px] text-slate-500 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700">Motivo / Auditoría:</span> {record.motivo}
                  <span className="block text-[10px] text-slate-400 mt-0.5">Eliminado por: <strong className="text-slate-600">{record.deletedBy}</strong></span>
                </div>
              </div>
            </div>
          ))}

          {filteredDeletedSales.length === 0 && (
            <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
              <Ban size={28} className="mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-black text-slate-800">No hay números bloqueados registrados</p>
              <p className="text-xs text-slate-500">Ninguna venta ha sido eliminada recientemente.</p>
            </div>
          )}
        </div>
      )}

      {/* Logs List */}
      {activeFilter !== 'BLOCKED_NUMBERS' && (
      <div className="space-y-3">
        {filteredLogs.map((log) => {
          const associatedSale = sales.find(s => s.id === log.saleId);

          return (
            <div 
              key={log.id} 
              className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
            >
              {/* Left Column: Sale info & Badges */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono font-black text-sm px-3 py-1 bg-slate-900 text-white rounded-xl shadow-xs">
                    Venta #{log.numeroVenta}
                  </span>

                  {log.esReimpresion ? (
                    <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase flex items-center gap-1">
                      <RotateCcw size={11} /> Reimpresión #{log.numeroImpresion}
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase flex items-center gap-1">
                      <CheckCircle2 size={11} /> 1ra Impresión
                    </span>
                  )}

                  {log.entregaMultiplesProductos && (
                    <span className="bg-blue-100 text-blue-800 border border-blue-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase flex items-center gap-1">
                      <Boxes size={11} /> Entrega Multiproducto ({log.productosEntregados?.length || 'Varios'} ítems)
                    </span>
                  )}

                  <span className="text-slate-400 font-medium text-xs flex items-center gap-1 ml-auto">
                    <Clock size={12} /> {log.fechaFormateada}
                  </span>
                </div>

                {/* Client and Destination */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <div className="font-black text-slate-900">
                    {log.cliente}
                  </div>
                  {log.vendedor && (
                    <div className="text-slate-500 font-semibold">
                      Vendedor: <span className="text-slate-700 font-bold">{log.vendedor}</span>
                    </div>
                  )}
                  {log.agenciaODestino && (
                    <div className="text-slate-500 font-semibold flex items-center gap-1">
                      <Truck size={12} className="text-slate-400" />
                      Destino: <span className="text-slate-800 font-bold">{log.agenciaODestino}</span>
                    </div>
                  )}
                </div>

                {/* Products Covered / Delivered */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-slate-600">
                    <Boxes size={13} className="text-emerald-600" />
                    <span>Productos Amparados / Entregados con esta Etiqueta:</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {log.productosEntregados && log.productosEntregados.length > 0 ? (
                      log.productosEntregados.map((item, idx) => (
                        <div 
                          key={idx}
                          className="bg-white border border-slate-200/90 text-slate-800 px-2.5 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 shadow-2xs"
                        >
                          <span className="text-emerald-700 font-black">{item.codigo}</span>
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-sans text-[10px]">
                            {item.cantidad} {item.cantidad === 1 ? 'fardo' : 'fardos'}
                          </span>
                          {item.descripcion && (
                            <span className="text-slate-400 font-normal font-sans text-[10px] truncate max-w-[120px]">
                              {item.descripcion}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-600 font-medium font-mono">
                        {log.productosResumen || 'Fardos de la venta'}
                      </span>
                    )}
                  </div>

                  {log.motivoReimpresion && (
                    <div className="mt-1 pt-1 border-t border-slate-200/60 text-[11px] text-amber-900 font-medium flex items-center gap-1.5">
                      <span className="font-black uppercase text-[9px] bg-amber-200 px-1.5 py-0.5 rounded">Motivo:</span>
                      <span>"{log.motivoReimpresion}"</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Etiquetador & Actions */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between lg:justify-center gap-3 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-black">
                    <User size={15} />
                  </div>
                  <div className="text-left lg:text-right">
                    <p className="text-[10px] text-slate-400 font-black uppercase">Impreso por</p>
                    <p className="font-black text-slate-900">{log.impresoPor}</p>
                  </div>
                </div>

                <div className="text-left lg:text-right">
                  <span className="text-xs font-black text-slate-900">
                    {log.cantidadEtiquetas} {log.cantidadEtiquetas === 1 ? 'etiqueta' : 'etiquetas'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                    Modo {log.modoImpresion}
                  </span>
                </div>

                {associatedSale && (
                  <button
                    type="button"
                    onClick={() => handleSaleClick(log.saleId)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Printer size={13} />
                    <span>Ver / Reimprimir</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredLogs.length === 0 && (
          <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <Printer size={28} />
            </div>
            <h4 className="text-lg font-black text-slate-800">No se encontraron registros de impresión</h4>
            <p className="text-xs text-slate-500 font-medium max-w-md mt-1">
              {searchTerm 
                ? 'No hay registros que coincidan con los criterios de búsqueda actuales.'
                : 'Aún no se han registrado impresiones de etiquetas térmicas en esta sesión.'}
            </p>
          </div>
        )}
      </div>
      )}
    </div>
  );
};
