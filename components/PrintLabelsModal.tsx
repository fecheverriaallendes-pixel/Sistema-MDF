import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Printer, 
  Package, 
  Boxes, 
  Layers, 
  CheckSquare, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Check, 
  AlertCircle, 
  Truck,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { Sale, StockItem, SaleType } from '../types';
import { 
  getTotalBultos, 
  generateIndividualLabels, 
  generateGroupedLabels, 
  GeneratedLabel,
  getSaleItemsList,
  getProductDescription
} from '../utils/labelUtils';
import { Label, getAgenciaODestino } from './Label';
import { useStore } from '../store/GlobalContext';

interface PrintLabelsModalProps {
  sale: Sale | null;
  stock: StockItem[];
  isOpen: boolean;
  onClose: () => void;
  onPrintComplete?: (saleId: string, etiquetador: string) => void;
}

type PrintMode = 'INDIVIDUAL' | 'GROUPED' | 'CUSTOM';

export const PrintLabelsModal: React.FC<PrintLabelsModalProps> = ({
  sale,
  stock,
  isOpen,
  onClose,
  onPrintComplete
}) => {
  const { currentUser, updateSale, playSound } = useStore();

  const [printMode, setPrintMode] = useState<PrintMode>('INDIVIDUAL');
  const [etiquetador, setEtiquetador] = useState('');
  const [previewIndex, setPreviewIndex] = useState(0);
  const [customSelectedIds, setCustomSelectedIds] = useState<string[]>([]);
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(1);
  const [isPrinting, setIsPrinting] = useState(false);

  // Initialize etiquetador with current user name or sale etiquetador
  useEffect(() => {
    if (sale) {
      setEtiquetador(sale.etiquetador || currentUser?.nombre || '');
    }
  }, [sale, currentUser]);

  const totalBultos = useMemo(() => {
    if (!sale) return 1;
    return getTotalBultos(sale);
  }, [sale]);

  const itemsList = useMemo(() => {
    if (!sale) return [];
    return getSaleItemsList(sale);
  }, [sale]);

  const individualLabels = useMemo(() => {
    if (!sale) return [];
    return generateIndividualLabels(sale, stock);
  }, [sale, stock]);

  const groupedLabels = useMemo(() => {
    if (!sale) return [];
    return generateGroupedLabels(sale, stock);
  }, [sale, stock]);

  // Reset selections when sale changes or modal opens
  useEffect(() => {
    if (isOpen && sale) {
      setPrintMode('INDIVIDUAL');
      setPreviewIndex(0);
      setCustomSelectedIds(individualLabels.map(l => l.id));
      setRangeStart(1);
      setRangeEnd(totalBultos);
    }
  }, [isOpen, sale, individualLabels, totalBultos]);

  // Labels currently active for printing based on mode
  const activeLabelsToPrint = useMemo<GeneratedLabel[]>(() => {
    if (!sale) return [];
    if (printMode === 'INDIVIDUAL') {
      return individualLabels;
    }
    if (printMode === 'GROUPED') {
      return groupedLabels;
    }
    if (printMode === 'CUSTOM') {
      const selectedSet = new Set(customSelectedIds);
      return individualLabels.filter(l => selectedSet.has(l.id));
    }
    return individualLabels;
  }, [printMode, individualLabels, groupedLabels, customSelectedIds, sale]);

  // Ensure previewIndex is within valid range
  useEffect(() => {
    if (previewIndex >= activeLabelsToPrint.length) {
      setPreviewIndex(Math.max(0, activeLabelsToPrint.length - 1));
    }
  }, [activeLabelsToPrint.length, previewIndex]);

  const currentPreviewLabel = activeLabelsToPrint[previewIndex] || activeLabelsToPrint[0] || null;

  if (!isOpen || !sale) return null;

  const destinoText = getAgenciaODestino(sale);
  const isNotaVenta = sale.tipoVenta === SaleType.NOTA_VENTA;

  // Custom selection helpers
  const handleToggleSelectId = (id: string) => {
    setCustomSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = () => {
    setCustomSelectedIds(individualLabels.map(l => l.id));
  };

  const handleDeselectAll = () => {
    setCustomSelectedIds([]);
  };

  const handleApplyRange = () => {
    const start = Math.max(1, Math.min(rangeStart, totalBultos));
    const end = Math.max(start, Math.min(rangeEnd, totalBultos));
    const matching = individualLabels.filter(
      l => l.bultoNumero >= start && l.bultoNumero <= end
    );
    setCustomSelectedIds(matching.map(l => l.id));
  };

  const handleExecutePrint = () => {
    if (activeLabelsToPrint.length === 0) {
      alert('⚠️ No hay etiquetas seleccionadas para imprimir.');
      return;
    }

    const etiquetadorName = (etiquetador.trim() || currentUser?.nombre || 'BODEGA').toUpperCase();
    setIsPrinting(true);

    // Save etiquetador and mark sale as printed
    updateSale(sale.id, {
      impresa: true,
      etiquetador: etiquetadorName
    });

    if (onPrintComplete) {
      onPrintComplete(sale.id, etiquetadorName);
    }

    // Trigger print
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
      playSound('success');
      onClose();
    }, 300);
  };

  return (
    <>
      {/* Modal Overlay */}
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-300 no-print">
        <div className="bg-white rounded-[36px] w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                <Printer size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    Impresión de Etiquetas Térmicas
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-emerald-100 text-emerald-800">
                    Venta #{sale.numeroVenta}
                  </span>
                </div>
                <p className="text-slate-500 text-xs font-semibold flex items-center gap-2 mt-0.5">
                  <span>{sale.cliente}</span>
                  <span>•</span>
                  <span className="font-bold text-slate-700">{destinoText}</span>
                  <span>•</span>
                  <span className="font-mono text-slate-600">{sale.fecha}</span>
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={22} />
            </button>
          </div>

          {/* Modal Content Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            
            {/* Top Banner: Package Summary */}
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-2 border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
                  <Boxes size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black uppercase text-amber-950">
                      Total del Envío: {totalBultos} {totalBultos === 1 ? 'Fardo / Bulto' : 'Fardos / Bultos'}
                    </span>
                    {isNotaVenta && (
                      <span className="text-[10px] font-black uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                        Nota de Venta ({itemsList.length} {itemsList.length === 1 ? 'ítem' : 'ítems'})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-amber-900/80 font-medium mt-0.5">
                    {itemsList.map(i => `${i.cantidad}x ${getProductDescription(i.codigoFardo, stock)}`).join(' + ')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-black text-slate-500 uppercase">Destino:</span>
                <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-wider">
                  {destinoText}
                </span>
              </div>
            </div>

            {/* Mode Selector Cards */}
            <div>
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider mb-2.5 block">
                Selecciona cómo deseas imprimir las etiquetas:
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                
                {/* Mode 1: Individual por Fardo (Recomendado para transportes) */}
                <button
                  type="button"
                  onClick={() => setPrintMode('INDIVIDUAL')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                    printMode === 'INDIVIDUAL'
                      ? 'border-emerald-500 bg-emerald-50/40 shadow-md ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  {printMode === 'INDIVIDUAL' && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <Check size={13} strokeWidth={3} />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-1.5">
                    <Boxes className={printMode === 'INDIVIDUAL' ? 'text-emerald-600' : 'text-slate-600'} size={18} />
                    <span className="font-black text-xs uppercase text-slate-900">
                      Individual por Fardo
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {individualLabels.length}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                      {individualLabels.length === 1 ? 'etiqueta' : 'etiquetas'}
                    </span>
                    <span className="ml-auto text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    1 etiqueta por cada fardo físico (Bulto 1/{totalBultos} a {totalBultos}/{totalBultos}). Requerido por Starken, Pullman y transportistas.
                  </p>
                </button>

                {/* Mode 2: Agrupado por Producto */}
                <button
                  type="button"
                  onClick={() => setPrintMode('GROUPED')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                    printMode === 'GROUPED'
                      ? 'border-blue-500 bg-blue-50/40 shadow-md ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  {printMode === 'GROUPED' && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center">
                      <Check size={13} strokeWidth={3} />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-1.5">
                    <Layers className={printMode === 'GROUPED' ? 'text-blue-600' : 'text-slate-600'} size={18} />
                    <span className="font-black text-xs uppercase text-slate-900">
                      Agrupadas por Producto
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {groupedLabels.length}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                      {groupedLabels.length === 1 ? 'etiqueta' : 'etiquetas'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    1 etiqueta por cada producto con la cantidad total de fardos (ej: x{itemsList[0]?.cantidad || 1}).
                  </p>
                </button>

                {/* Mode 3: Personalizado / Reimpresión */}
                <button
                  type="button"
                  onClick={() => setPrintMode('CUSTOM')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                    printMode === 'CUSTOM'
                      ? 'border-purple-500 bg-purple-50/40 shadow-md ring-2 ring-purple-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  {printMode === 'CUSTOM' && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center">
                      <Check size={13} strokeWidth={3} />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-1.5">
                    <CheckSquare className={printMode === 'CUSTOM' ? 'text-purple-600' : 'text-slate-600'} size={18} />
                    <span className="font-black text-xs uppercase text-slate-900">
                      Selección / Rango
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {customSelectedIds.length}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                      seleccionadas
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Elige bultos específicos para reimprimir (por ejemplo solo bulto 3 al 5 si se dañó una etiqueta).
                  </p>
                </button>

              </div>
            </div>

            {/* Split Screen: Left Options & Breakdown / Right Thermal Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Breakdown, Custom Controls, and Etiquetador */}
              <div className="lg:col-span-7 space-y-5">
                
                {/* Custom Mode Range Controls */}
                {printMode === 'CUSTOM' && (
                  <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-purple-900 flex items-center gap-1.5">
                        <CheckSquare size={16} /> Selector Rápido de Rango de Bultos
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSelectAll}
                          className="text-[10px] font-black uppercase bg-white border border-purple-200 text-purple-700 px-2.5 py-1 rounded-lg hover:bg-purple-100"
                        >
                          Marcar Todos
                        </button>
                        <button
                          type="button"
                          onClick={handleDeselectAll}
                          className="text-[10px] font-black uppercase bg-white border border-purple-200 text-slate-600 px-2.5 py-1 rounded-lg hover:bg-purple-100"
                        >
                          Desmarcar
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-600">Desde Bulto:</span>
                        <input 
                          type="number"
                          min={1}
                          max={totalBultos}
                          value={rangeStart}
                          onChange={e => setRangeStart(parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1.5 bg-white border border-purple-200 rounded-xl text-center font-black text-sm outline-none focus:ring-2 focus:ring-purple-400"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-600">Hasta:</span>
                        <input 
                          type="number"
                          min={1}
                          max={totalBultos}
                          value={rangeEnd}
                          onChange={e => setRangeEnd(parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1.5 bg-white border border-purple-200 rounded-xl text-center font-black text-sm outline-none focus:ring-2 focus:ring-purple-400"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyRange}
                        className="px-4 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-black uppercase hover:bg-purple-700 shadow-sm"
                      >
                        Aplicar Rango
                      </button>
                    </div>

                    {/* Scrollable list of individual bultos */}
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border-t border-purple-200/60 pt-2">
                      {individualLabels.map((lbl, idx) => {
                        const isChecked = customSelectedIds.includes(lbl.id);
                        return (
                          <label 
                            key={lbl.id}
                            className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                              isChecked ? 'bg-white border-purple-300 shadow-sm' : 'bg-purple-100/30 border-transparent text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleSelectId(lbl.id)}
                                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                              />
                              <span className="font-mono font-black text-slate-900">
                                BULTO {lbl.bultoNumero}/{lbl.bultoTotal}
                              </span>
                              <span className="text-slate-600 truncate max-w-[200px]">
                                {lbl.productDescription}
                              </span>
                            </div>
                            <span className="text-[10px] uppercase font-mono text-slate-400">
                              {lbl.itemCode}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Items Breakdown Accordion/Card */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-700">
                      Desglose de Artículos en la Venta
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {itemsList.length} {itemsList.length === 1 ? 'Producto' : 'Productos'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {itemsList.map((item, idx) => {
                      const prodDesc = getProductDescription(item.codigoFardo, stock);
                      return (
                        <div 
                          key={idx}
                          className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-mono font-black text-xs">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="text-xs font-black uppercase text-slate-900">
                                {prodDesc}
                              </p>
                              <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">
                                SKU: {item.codigoFardo}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-black text-slate-900">
                              {item.cantidad} {item.cantidad === 1 ? 'Fardo' : 'Fardos'}
                            </span>
                            {totalBultos > 1 && (
                              <p className="text-[10px] font-bold text-slate-400 uppercase">
                                {Math.round((item.cantidad / totalBultos) * 100)}% del total
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Etiquetador Responsable Input */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <label className="flex items-center gap-2 text-xs font-black uppercase text-slate-700 mb-2">
                    <User size={16} className="text-emerald-500" />
                    Responsable de Etiquetado / Despacho
                  </label>
                  <input 
                    type="text"
                    value={etiquetador}
                    onChange={e => setEtiquetador(e.target.value)}
                    placeholder="Nombre de la persona que etiqueta..."
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <p className="text-[10px] text-slate-400 font-medium mt-1.5">
                    Este nombre quedará registrado en el historial de la venta y en el pie de la etiqueta.
                  </p>
                </div>

              </div>

              {/* Right Column: Thermal Label Live Preview */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-black uppercase text-slate-700 flex items-center gap-1.5">
                    <Printer size={15} /> Previsualización Térmica
                  </span>

                  {/* Pager Controls */}
                  {activeLabelsToPrint.length > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewIndex(prev => Math.max(0, prev - 1))}
                        disabled={previewIndex === 0}
                        className="p-1 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:bg-slate-50"
                        title="Etiqueta anterior"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      
                      <span className="px-2 py-0.5 font-mono text-[11px] font-black text-slate-700 bg-slate-100 rounded-md">
                        {previewIndex + 1} / {activeLabelsToPrint.length}
                      </span>

                      <button
                        type="button"
                        onClick={() => setPreviewIndex(prev => Math.min(activeLabelsToPrint.length - 1, prev + 1))}
                        disabled={previewIndex >= activeLabelsToPrint.length - 1}
                        className="p-1 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:bg-slate-50"
                        title="Siguiente etiqueta"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Thermal Label Display Box */}
                {currentPreviewLabel ? (
                  <div className="w-full flex flex-col items-center">
                    <div className="relative border-4 border-slate-800 rounded-3xl p-3 bg-slate-900/5 shadow-xl overflow-hidden scale-[0.68] sm:scale-[0.78] origin-top -mb-28">
                      <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <Label 
                          sale={{
                            ...sale,
                            etiquetador: etiquetador.trim() || sale.etiquetador || currentUser?.nombre || 'BODEGA'
                          }} 
                          stock={stock} 
                          item={currentPreviewLabel.item} 
                        />
                      </div>
                    </div>

                    <div className="mt-4 bg-slate-100 px-3 py-1.5 rounded-full text-center">
                      <span className="text-[11px] font-black text-slate-700 uppercase">
                        Mostrando: Bulto {currentPreviewLabel.bultoNumero} de {currentPreviewLabel.bultoTotal}
                        {' • '}
                        {currentPreviewLabel.productDescription}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-80 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                    <AlertCircle size={32} className="mb-2" />
                    <p className="text-xs font-bold">No hay etiquetas seleccionadas</p>
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Modal Footer / Action Bar */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-xs font-bold text-slate-700">
                Se enviarán <strong className="text-slate-900 font-black">{activeLabelsToPrint.length} etiquetas térmicas</strong> a la impresora (100x150mm).
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-6 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-wider transition-all"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={activeLabelsToPrint.length === 0 || isPrinting}
                onClick={handleExecutePrint}
                className="flex-1 sm:flex-none px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Printer size={18} />
                {activeLabelsToPrint.length === 1 
                  ? 'Imprimir 1 Etiqueta' 
                  : `Imprimir ${activeLabelsToPrint.length} Etiquetas`}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Hidden Thermal Print Container */}
      <div className="hidden print-only">
        {activeLabelsToPrint.map((lbl) => (
          <div key={lbl.id} className="label-container">
            <Label 
              sale={{
                ...sale,
                etiquetador: etiquetador.trim() || sale.etiquetador || currentUser?.nombre || 'BODEGA'
              }} 
              stock={stock} 
              item={lbl.item} 
            />
          </div>
        ))}
      </div>

      <style>{`
        @media print {
          @page {
            size: 100mm 150mm portrait;
            margin: 0mm !important;
          }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100mm !important;
            height: 150mm !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-only {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            z-index: 99999 !important;
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
        }
      `}</style>
    </>
  );
};
