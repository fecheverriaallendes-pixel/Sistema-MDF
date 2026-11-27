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
  RotateCcw,
  AlertTriangle,
  Link2,
  Users,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp
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
import { isLautaroOrFardolandia, getPartnerInfo } from '../utils/partnerUtils';
import { 
  getPendingSalesForClient, 
  consolidateSales, 
  PendingSalesAnalysis 
} from '../utils/clientPendingSales';

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
  const { currentUser, updateSale, playSound, addLabelPrintLog, getSalePrintLogs, sales } = useStore();

  // Active sale currently in focus inside the modal (can switch between client's sales)
  const [activeSale, setActiveSale] = useState<Sale | null>(sale);
  const [isConsolidatedMode, setIsConsolidatedMode] = useState(false);
  const [dismissAlert, setDismissAlert] = useState(false);
  const [showRelatedList, setShowRelatedList] = useState(true);
  const [consolidationSuccessNotice, setConsolidationSuccessNotice] = useState<string | null>(null);

  const [printMode, setPrintMode] = useState<PrintMode>('INDIVIDUAL');
  const [etiquetador, setEtiquetador] = useState('');
  const [previewIndex, setPreviewIndex] = useState(0);
  const [customSelectedIds, setCustomSelectedIds] = useState<string[]>([]);
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(1);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showHistorySection, setShowHistorySection] = useState(false);
  const [reprintReason, setReprintReason] = useState('Copia adicional solicitada');
  const [customReprintNote, setCustomReprintNote] = useState('');

  // Keep activeSale in sync when sale prop changes or modal opens
  useEffect(() => {
    if (sale) {
      setActiveSale(sale);
      setIsConsolidatedMode(false);
      setDismissAlert(false);
      setShowRelatedList(true);
      setConsolidationSuccessNotice(null);
    }
  }, [sale, isOpen]);

  // Current effective sale to render
  const effectiveSale = activeSale || sale;

  // Initialize etiquetador with current user name or sale etiquetador
  useEffect(() => {
    if (effectiveSale) {
      setEtiquetador(effectiveSale.etiquetador || currentUser?.nombre || '');
    }
  }, [effectiveSale, currentUser]);

  // Analyze pending/undispatched sales for this customer across other WhatsApp sellers
  const pendingAnalysis = useMemo<PendingSalesAnalysis>(() => {
    return getPendingSalesForClient(effectiveSale, sales);
  }, [effectiveSale, sales]);

  const totalBultos = useMemo(() => {
    if (!effectiveSale) return 1;
    return getTotalBultos(effectiveSale);
  }, [effectiveSale]);

  const itemsList = useMemo(() => {
    if (!effectiveSale) return [];
    return getSaleItemsList(effectiveSale);
  }, [effectiveSale]);

  const individualLabels = useMemo(() => {
    if (!effectiveSale) return [];
    return generateIndividualLabels(effectiveSale, stock);
  }, [effectiveSale, stock]);

  const groupedLabels = useMemo(() => {
    if (!effectiveSale) return [];
    return generateGroupedLabels(effectiveSale, stock);
  }, [effectiveSale, stock]);

  // Consolidated labels across ALL pending sales of this client
  const consolidatedLabels = useMemo(() => {
    if (!pendingAnalysis.hasPendingPurchases) return [];
    if (printMode === 'GROUPED') {
      return pendingAnalysis.allGroupSales.flatMap(s => generateGroupedLabels(s, stock));
    }
    return pendingAnalysis.allGroupSales.flatMap(s => generateIndividualLabels(s, stock));
  }, [pendingAnalysis, printMode, stock]);

  const salePrintLogs = useMemo(() => {
    if (!effectiveSale) return [];
    return getSalePrintLogs(effectiveSale.id);
  }, [effectiveSale, getSalePrintLogs]);

  const isReprint = salePrintLogs.length > 0 || Boolean(effectiveSale?.impresa);
  const currentPrintAttemptNumber = salePrintLogs.length + 1;

  const productsToDeliver = useMemo(() => {
    if (!effectiveSale) return [];
    const list = getSaleItemsList(effectiveSale);
    return list.map(item => ({
      codigo: item.codigoFardo,
      descripcion: getProductDescription(item.codigoFardo, stock),
      cantidad: item.cantidad
    }));
  }, [effectiveSale, stock]);

  // Reset selections when sale changes or modal opens
  useEffect(() => {
    if (isOpen && effectiveSale) {
      setPrintMode('INDIVIDUAL');
      setPreviewIndex(0);
      setCustomSelectedIds(individualLabels.map(l => l.id));
      setRangeStart(1);
      setRangeEnd(totalBultos);
      setShowHistorySection(false);
      setReprintReason('Copia adicional solicitada');
      setCustomReprintNote('');
    }
  }, [isOpen, effectiveSale, individualLabels, totalBultos]);

  // Labels currently active for printing based on mode and consolidated state
  const activeLabelsToPrint = useMemo<GeneratedLabel[]>(() => {
    if (!effectiveSale) return [];

    if (isConsolidatedMode && consolidatedLabels.length > 0) {
      return consolidatedLabels;
    }

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
  }, [isConsolidatedMode, consolidatedLabels, printMode, individualLabels, groupedLabels, customSelectedIds, effectiveSale]);

  // Ensure previewIndex is within valid range
  useEffect(() => {
    if (previewIndex >= activeLabelsToPrint.length) {
      setPreviewIndex(Math.max(0, activeLabelsToPrint.length - 1));
    }
  }, [activeLabelsToPrint.length, previewIndex]);

  const currentPreviewLabel = activeLabelsToPrint[previewIndex] || activeLabelsToPrint[0] || null;

  if (!isOpen || !effectiveSale) return null;

  const destinoText = getAgenciaODestino(effectiveSale);
  const isNotaVenta = effectiveSale.tipoVenta === SaleType.NOTA_VENTA;

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

  // Action: Consolidate all sales under JUNTA COMPRA
  const handleConsolidateAll = () => {
    if (!pendingAnalysis.hasPendingPurchases) return;
    const saleNums = consolidateSales(pendingAnalysis.allGroupSales, updateSale);
    playSound('success');
    setConsolidationSuccessNotice(`¡Ventas ${saleNums} unificadas bajo JUNTA COMPRA para despacho físico! Cada venta mantiene su propio N° único, vendedora y comisión.`);
    setIsConsolidatedMode(true);
  };

  const handleExecutePrint = async () => {
    if (activeLabelsToPrint.length === 0) {
      alert('⚠️ No hay etiquetas seleccionadas para imprimir.');
      return;
    }

    const etiquetadorName = (etiquetador.trim() || currentUser?.nombre || 'BODEGA').toUpperCase();
    setIsPrinting(true);

    const finalReason = isReprint 
      ? (customReprintNote.trim() || reprintReason)
      : undefined;

    if (isConsolidatedMode && pendingAnalysis.hasPendingPurchases) {
      // Print logs and updates for ALL sales in the consolidated group
      for (const s of pendingAnalysis.allGroupSales) {
        const sItems = getSaleItemsList(s);
        const sProds = sItems.map(item => ({
          codigo: item.codigoFardo,
          descripcion: getProductDescription(item.codigoFardo, stock),
          cantidad: item.cantidad
        }));
        const sResumen = sProds.map(p => `${p.codigo} (${p.cantidad > 1 ? `x${p.cantidad}` : '1'})`).join(', ');
        const sBultos = getTotalBultos(s);

        try {
          await addLabelPrintLog({
            saleId: s.id,
            numeroVenta: s.numeroVenta,
            cliente: s.cliente,
            vendedor: s.vendedor,
            impresoPor: etiquetadorName,
            cantidadEtiquetas: sBultos,
            modoImpresion: 'CONSOLIDADO',
            bultosTotales: sBultos,
            productosEntregados: sProds,
            productosResumen: sResumen,
            entregaMultiplesProductos: true,
            motivoReimpresion: finalReason ? `${finalReason} (Despacho Consolidado)` : 'Despacho Consolidado Multicompras WhatsApp',
            agenciaODestino: getAgenciaODestino(s)
          });
        } catch (err) {
          console.error("Error al registrar print log consolidado:", err);
        }

        updateSale(s.id, { impresa: true, etiquetador: etiquetadorName });
        if (onPrintComplete) {
          onPrintComplete(s.id, etiquetadorName);
        }
      }
    } else {
      // Standard print for the current sale
      const productosResumen = productsToDeliver
        .map(p => `${p.codigo} (${p.cantidad > 1 ? `x${p.cantidad}` : '1'})`)
        .join(', ');

      try {
        await addLabelPrintLog({
          saleId: effectiveSale.id,
          numeroVenta: effectiveSale.numeroVenta,
          cliente: effectiveSale.cliente,
          vendedor: effectiveSale.vendedor,
          impresoPor: etiquetadorName,
          cantidadEtiquetas: activeLabelsToPrint.length,
          modoImpresion: printMode,
          bultosTotales: totalBultos,
          productosEntregados: productsToDeliver,
          productosResumen,
          entregaMultiplesProductos: productsToDeliver.length > 1 || (printMode === 'GROUPED' && totalBultos > 1),
          motivoReimpresion: finalReason,
          agenciaODestino: destinoText
        });
      } catch (err) {
        console.error("Error al registrar print log:", err);
      }

      if (onPrintComplete) {
        onPrintComplete(effectiveSale.id, etiquetadorName);
      }
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
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    Impresión de Etiquetas Térmicas
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-emerald-100 text-emerald-800">
                    Venta #{effectiveSale.numeroVenta}
                  </span>
                  {isConsolidatedMode && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-indigo-600 text-white shadow-xs animate-pulse flex items-center gap-1">
                      <Boxes size={12} /> Despacho Consolidado ({pendingAnalysis.allGroupSales.length} ventas)
                    </span>
                  )}
                  {isLautaroOrFardolandia(effectiveSale) && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-purple-100 text-purple-800 border border-purple-200">
                      Partner Fardolandia
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-xs font-semibold flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="font-bold text-slate-800">{effectiveSale.cliente}</span>
                  {effectiveSale.rut && <span className="font-mono text-slate-600">RUT: {effectiveSale.rut}</span>}
                  <span>•</span>
                  <span className="font-bold text-slate-700">{destinoText}</span>
                  <span>•</span>
                  <span className="font-mono text-slate-600">{effectiveSale.fecha}</span>
                  <span>•</span>
                  <span className="text-violet-700 font-bold bg-violet-50 px-2 py-0.5 rounded-md">Vendedora: {effectiveSale.vendedor || 'General'}</span>
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

            {/* ALERTA CRÍTICA: CLIENTA CON OTRAS COMPRAS PENDIENTES DE DESPACHO */}
            {pendingAnalysis.hasPendingPurchases && !dismissAlert && (
              <div className="bg-gradient-to-br from-rose-50 via-amber-50 to-orange-50 border-2 border-rose-300/90 rounded-3xl p-5 shadow-lg shadow-rose-500/5 animate-in slide-in-from-top-3 duration-300 space-y-4">
                
                {/* Notice Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md animate-bounce">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black uppercase text-rose-950 tracking-tight flex items-center gap-1.5">
                          🚨 ¡ALERTA: CLIENTA CON {pendingAnalysis.totalPendingCount} COMPRA(S) ADICIONAL(ES) SIN DESPACHAR!
                        </span>
                        <span className="bg-rose-200 text-rose-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                          Riesgo de despacho incompleto
                        </span>
                      </div>
                      <p className="text-xs text-rose-900/90 font-medium mt-0.5">
                        Esta clienta ({effectiveSale.cliente}) tiene <strong>{pendingAnalysis.totalPendingBultos} fardos/bultos más</strong> en sistema que aún <strong>NO han sido despachados</strong>.
                        {pendingAnalysis.hasDifferentVendedora && (
                          <span className="block mt-0.5 text-rose-950 font-bold">
                            ⚠️ ¡Atención! Estas ventas fueron emitidas por distintas vendedoras ({pendingAnalysis.distinctVendedoras.join(', ')}). Cada una imprimió o generó su venta por WhatsApp por separado.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowRelatedList(!showRelatedList)}
                      className="px-3 py-1.5 rounded-xl bg-white/90 border border-rose-200 text-rose-900 text-xs font-black hover:bg-white transition-all shadow-xs flex items-center gap-1.5"
                    >
                      {showRelatedList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {showRelatedList ? 'Minimizar Detalle' : `Ver ${pendingAnalysis.totalPendingCount} Compras`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDismissAlert(true)}
                      className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-white/80 rounded-lg transition-colors"
                      title="Ocultar alerta por ahora"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Feedback Toast if Consolidated Just Now */}
                {consolidationSuccessNotice && (
                  <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                    <span>{consolidationSuccessNotice}</span>
                  </div>
                )}

                {/* List of Other Pending Sales for This Client */}
                {showRelatedList && (
                  <div className="space-y-2 pt-2 border-t border-rose-200/70">
                    <div className="flex items-center justify-between text-[11px] font-black text-rose-950 uppercase tracking-wider">
                      <span>Compras activas pendientes de esta clienta:</span>
                      <span className="text-rose-700">Total en espera: {pendingAnalysis.totalGroupBultos} bultos (${pendingAnalysis.totalGroupMonto.toLocaleString('es-CL')})</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                      {/* Current sale card */}
                      <div className="p-3 bg-white rounded-2xl border-2 border-emerald-400/80 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Venta #{effectiveSale.numeroVenta} (Venta Actual)
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase">
                            En Pantalla
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 space-y-0.5">
                          <p><strong className="text-slate-800">Vendedora:</strong> {effectiveSale.vendedor || 'General'} • <span className="font-mono text-[10px]">{effectiveSale.fecha}</span></p>
                          <p><strong className="text-slate-800">Mercadería:</strong> {totalBultos} {totalBultos === 1 ? 'fardo' : 'fardos'} • ${effectiveSale.total.toLocaleString('es-CL')}</p>
                          <p className="text-[10px] text-slate-500 truncate">Destino: {destinoText}</p>
                        </div>
                      </div>

                      {/* Related other sales */}
                      {pendingAnalysis.relatedSales.map(({ sale: otherSale, bultos: otherBultos, esMismaVendedora, matchReason }) => {
                        const otherDestino = getAgenciaODestino(otherSale);
                        const otherItems = getSaleItemsList(otherSale);
                        return (
                          <div 
                            key={otherSale.id}
                            className="p-3 bg-white rounded-2xl border border-rose-200 hover:border-rose-400 transition-all shadow-xs flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="font-black text-xs text-slate-900">
                                  Venta #{otherSale.numeroVenta}
                                </span>
                                <div className="flex items-center gap-1">
                                  {otherSale.impresa ? (
                                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-amber-100 text-amber-800 uppercase" title={`Ya impresa por ${otherSale.etiquetador || 'otro usuario'}`}>
                                      Etiqueta Ya Impresa
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-slate-100 text-slate-700 uppercase">
                                      Sin Imprimir
                                    </span>
                                  )}
                                  <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-rose-100 text-rose-800 font-mono">
                                    {matchReason}
                                  </span>
                                </div>
                              </div>

                              <div className="text-[11px] text-slate-600 space-y-0.5">
                                <p className="flex items-center gap-1.5">
                                  <strong className="text-slate-800">Vendedora:</strong> 
                                  <span className={`px-1.5 py-0.2 rounded font-black text-[10px] ${esMismaVendedora ? 'bg-slate-100 text-slate-700' : 'bg-rose-100 text-rose-900'}`}>
                                    {otherSale.vendedor || 'General'}
                                  </span>
                                  <span className="font-mono text-[10px] text-slate-400">{otherSale.fecha}</span>
                                </p>
                                <p>
                                  <strong className="text-slate-800">Mercadería:</strong> {otherBultos} {otherBultos === 1 ? 'fardo' : 'fardos'} ({otherItems.map(i => i.codigoFardo).join(', ')}) • ${otherSale.total.toLocaleString('es-CL')}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate">
                                  Destino: {otherDestino}
                                </p>
                              </div>
                            </div>

                            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                              <span className="text-[10px] font-semibold text-slate-400">
                                {otherSale.juntaCompra?.toUpperCase().includes('JUNTA') ? '📦 Ya en Junta Compra' : '🚚 Despacho Inmediato'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveSale(otherSale);
                                  playSound('click');
                                }}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-black uppercase transition-colors flex items-center gap-1"
                              >
                                <ExternalLink size={10} />
                                Ver Venta #{otherSale.numeroVenta}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Operational Action Buttons Bar */}
                    <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Action 1: Consolidate under JUNTA COMPRA */}
                        <button
                          type="button"
                          onClick={handleConsolidateAll}
                          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                          title="Marca todas las ventas de la clienta como JUNTA COMPRA para que bodega las arme y despache juntas"
                        >
                          <Link2 size={15} />
                          <span>1. Consolidar Todo en JUNTA COMPRA</span>
                        </button>

                        {/* Action 2: Toggle Consolidated Multi-Sale Printing */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsConsolidatedMode(!isConsolidatedMode);
                            playSound('click');
                          }}
                          className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-2 ${
                            isConsolidatedMode
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                              : 'bg-white hover:bg-rose-50 text-rose-900 border-rose-300'
                          }`}
                          title="Prepara e imprime las etiquetas de TODAS las ventas pendientes de la clienta en una sola tirada térmica"
                        >
                          <Printer size={15} />
                          <span>
                            {isConsolidatedMode 
                              ? `✓ Imprimiendo Todo el Pedido (${consolidatedLabels.length} etiquetas)` 
                              : `2. Imprimir Todas las Ventas Juntas (${pendingAnalysis.totalGroupBultos} fardos)`}
                          </span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setDismissAlert(true);
                          setIsConsolidatedMode(false);
                        }}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline self-center sm:self-auto"
                      >
                        Despachar solo Venta #{effectiveSale.numeroVenta} por separado
                      </button>
                    </div>

                  </div>
                )}

              </div>
            )}
            
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
                    {isConsolidatedMode && (
                      <span className="text-[10px] font-black uppercase bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                        Consolidado ({pendingAnalysis.totalGroupBultos} bultos totales)
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

            {/* Aviso de Reimpresión / Historial de Impresiones Previas */}
            {isReprint && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 animate-in fade-in">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                      #{currentPrintAttemptNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-amber-950">
                          Esta venta ya fue impresa anteriormente ({salePrintLogs.length} {salePrintLogs.length === 1 ? 'impresión registrada' : 'impresiones registradas'})
                        </span>
                        <span className="bg-amber-200 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                          Reimpresión
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                        {effectiveSale.ultimoEtiquetador ? `Última impresión realizada por ${effectiveSale.ultimoEtiquetador}` : 'Se registrará este nuevo tiraje en el historial de etiquetas de bodega.'}
                      </p>
                    </div>
                  </div>

                  {salePrintLogs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowHistorySection(!showHistorySection)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-all shadow-xs flex items-center gap-1.5 shrink-0"
                    >
                      <RotateCcw size={13} />
                      {showHistorySection ? 'Ocultar Historial' : `Ver Historial (${salePrintLogs.length})`}
                    </button>
                  )}
                </div>

                {/* Selector de Motivo de Reimpresión */}
                <div className="mt-3 pt-3 border-t border-amber-200/80">
                  <label className="text-[11px] font-black uppercase text-amber-900 tracking-wider mb-1.5 block">
                    Motivo de la reimpresión o etiqueta adicional:
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {[
                      'Copia adicional solicitada',
                      'Etiqueta dañada o ilegible',
                      'Extraviada en bodega',
                      'Piden más de 1 etiqueta',
                      '1 etiqueta entrega varios productos',
                      'Cambio de agencia o destino'
                    ].map(reason => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => { setReprintReason(reason); setCustomReprintNote(''); }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          reprintReason === reason && !customReprintNote
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={customReprintNote}
                    onChange={e => setCustomReprintNote(e.target.value)}
                    placeholder="Otro motivo específico o nota para bodega (opcional)..."
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Acordeón de Historial Detallado de esta Venta */}
                {showHistorySection && salePrintLogs.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-amber-200/80 space-y-2">
                    <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider block">
                      Tirajes anteriores registrados para esta venta:
                    </span>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {salePrintLogs.map((log, idx) => (
                        <div key={log.id || idx} className="bg-white/90 p-2.5 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-900">
                                {log.esReimpresion ? `Impresión #${log.numeroImpresion} (Reimpresión)` : '1ra Impresión'}
                              </span>
                              <span className="text-slate-500 font-mono text-[10px]">{log.fechaFormateada}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5">
                              <span className="font-bold text-slate-700">Por:</span> {log.impresoPor} • <span className="font-bold text-slate-700">Modo:</span> {log.modoImpresion} • {log.cantidadEtiquetas} {log.cantidadEtiquetas === 1 ? 'etiqueta' : 'etiquetas'}
                            </p>
                            {log.productosResumen && (
                              <p className="text-[10px] text-emerald-700 font-medium">
                                📦 Productos amparados: {log.productosResumen}
                              </p>
                            )}
                            {log.motivoReimpresion && (
                              <p className="text-[10px] text-amber-800 font-semibold italic">
                                Motivo: "{log.motivoReimpresion}"
                              </p>
                            )}
                          </div>
                          <span className="px-2 py-1 bg-amber-100 text-amber-900 rounded-lg text-[10px] font-black uppercase shrink-0">
                            Registrado
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Banner de Entrega Multiproducto (1 etiqueta = más de un producto) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Sparkles size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-slate-900">
                      Entrega y Bultos: {productsToDeliver.length} {productsToDeliver.length === 1 ? 'Tipo de Producto' : 'Tipos de Productos'} ({totalBultos} {totalBultos === 1 ? 'fardo' : 'fardos'} en total)
                    </span>
                    {productsToDeliver.length > 1 && (
                      <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Multiproducto
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {printMode === 'GROUPED' && totalBultos > 1
                      ? '⚠️ Modo Agrupado: Cada etiqueta cubre y entrega todos los fardos del producto en una sola entrega.'
                      : printMode === 'INDIVIDUAL' && totalBultos > 1
                      ? 'Modo Individual: Se entrega 1 etiqueta separada por cada fardo físico.'
                      : 'Esta impresión ampara la entrega física de la mercadería especificada.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 max-w-sm justify-end">
                {productsToDeliver.map((p, idx) => (
                  <span key={idx} className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold">
                    {p.codigo} {p.cantidad > 1 ? `x${p.cantidad}` : ''}
                  </span>
                ))}
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
                {currentPreviewLabel ? (() => {
                  const previewSale = currentPreviewLabel.sale || effectiveSale;
                  return (
                  <div className="w-full flex flex-col items-center">
                    <div className="relative border-4 border-slate-800 rounded-3xl p-3 bg-slate-900/5 shadow-xl overflow-hidden scale-[0.68] sm:scale-[0.78] origin-top -mb-28">
                      <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <Label 
                          sale={{
                            ...previewSale,
                            etiquetador: etiquetador.trim() || previewSale.etiquetador || currentUser?.nombre || 'BODEGA'
                          }} 
                          stock={stock} 
                          item={currentPreviewLabel.item} 
                        />
                      </div>
                    </div>

                    <div className="mt-4 bg-slate-100 px-3 py-1.5 rounded-full text-center">
                      <span className="text-[11px] font-black text-slate-700 uppercase">
                        Venta #{previewSale.numeroVenta} • Bulto {currentPreviewLabel.bultoNumero} de {currentPreviewLabel.bultoTotal}
                        {' • '}
                        {currentPreviewLabel.productDescription}
                      </span>
                    </div>
                  </div>
                  );
                })() : (
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
              <span className={`w-3 h-3 rounded-full animate-pulse ${isConsolidatedMode ? 'bg-indigo-600' : 'bg-emerald-500'}`}></span>
              <p className="text-xs font-bold text-slate-700">
                Se enviarán <strong className="text-slate-900 font-black">{activeLabelsToPrint.length} etiquetas térmicas</strong> a la impresora (100x150mm).
                {isConsolidatedMode && (
                  <span className="ml-2 font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                    Pedido Consolidado ({pendingAnalysis.allGroupSales.length} ventas)
                  </span>
                )}
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
                className={`flex-1 sm:flex-none px-8 py-3.5 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 ${
                  isConsolidatedMode 
                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25' 
                    : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25 disabled:bg-slate-300'
                }`}
              >
                <Printer size={18} />
                {isConsolidatedMode
                  ? `Imprimir Todo el Pedido (${activeLabelsToPrint.length} Etiquetas)`
                  : activeLabelsToPrint.length === 1 
                  ? 'Imprimir 1 Etiqueta' 
                  : `Imprimir ${activeLabelsToPrint.length} Etiquetas`}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Hidden Thermal Print Container */}
      <div className="hidden print-only">
        {activeLabelsToPrint.map((lbl) => {
          const lblSale = lbl.sale || effectiveSale;
          return (
            <div key={lbl.id} className="label-container">
              <Label 
                sale={{
                  ...lblSale,
                  etiquetador: etiquetador.trim() || lblSale.etiquetador || currentUser?.nombre || 'BODEGA'
                }} 
                stock={stock} 
                item={lbl.item} 
              />
            </div>
          );
        })}
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
