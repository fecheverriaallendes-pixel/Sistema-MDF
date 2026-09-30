
import React, { useState, useEffect, useRef } from 'react';
import { Printer, ArrowLeft, CheckCircle2, AlertCircle, User, X, Boxes, Layers, SlidersHorizontal, Settings2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/GlobalContext';
import { Sale, SaleType, SaleStatus, CommissionType, StaffRole } from '../types';
import { Label, LabelItemData } from '../components/Label';
import { PrintLabelsModal } from '../components/PrintLabelsModal';
import { getTotalBultos, generateIndividualLabels, generateGroupedLabels } from '../utils/labelUtils';

const LOGO_URL = "https://i.ibb.co/qMyZQHYg/logo-sin-fondo-1.png";

interface QueuePrintableLabel {
  sale: Sale;
  item: LabelItemData;
}

export default function Etiquetas() {
  const { sales, stock, currentUser, updateSale, playSound } = useStore();
  const [labelsToPrint, setLabelsToPrint] = useState<QueuePrintableLabel[]>([]);
  // Use a ref to store labels currently in the queue so the print callback can access them safely
  const printingLabelsRef = useRef<QueuePrintableLabel[]>([]);
  const [showDemo, setShowDemo] = useState(false);
  const [showPrinted, setShowPrinted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEtiquetadorModal, setShowEtiquetadorModal] = useState(false);
  const [etiquetadorName, setEtiquetadorName] = useState('');
  const [pendingSaleId, setPendingSaleId] = useState<string | null>(null); // 'all' for print all
  const [queueMode, setQueueMode] = useState<'INDIVIDUAL' | 'GROUPED'>('INDIVIDUAL');
  const [modalSale, setModalSale] = useState<Sale | null>(null);

  const isAdmin = currentUser?.rol === StaffRole.ADMIN;
  const readyToPrint = sales.filter(s => {
    if (!s) return false;
    const matchesSearch = searchTerm === '' || 
                          s.cliente.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.numeroVenta.toString().includes(searchTerm) ||
                          (s.codigoFardo && s.codigoFardo.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;

    const isSellerReady = s.datosCompletos;
    if (!isSellerReady) {
      return false;
    }
    if (!showPrinted && s.impresa) return false;
    if (isAdmin) return true;
    return s.vendedor === currentUser?.nombre;
  }).sort((a, b) => b.numeroVenta - a.numeroVenta);

  // Total thermal labels to be printed in queue
  const totalQueueLabelsCount = readyToPrint.reduce((acc, s) => {
    return acc + (queueMode === 'INDIVIDUAL' ? getTotalBultos(s) : (s.items?.length || 1));
  }, 0);

  const demoSale: Sale = {
    id: 'demo', numeroVenta: 8080, tipoVenta: SaleType.NORMAL, cliente: 'CLIENTE DE PRUEBA',
    telefono: '+569 8808 0880', rut: '18.080.808-0', codigoFardo: 'F-8080',
    direccion: 'AVENIDA CENTRAL 123, SANTIAGO', variante: 'FARDO PREMIUM',
    total: 150000, datosCompletos: true, enviado: false, status: SaleStatus.PENDIENTE,
    fecha: new Date().toLocaleDateString(), hora: '12:00', vendedor: 'ADMIN',
    valorUnitario: 150000, cantidad: 1, estadoPago: 'Pagado', observaciones: '',
    tipoComision: CommissionType.FARDO_NORMAL
  };

  useEffect(() => {
    const handleAfterPrint = () => {
      if (printingLabelsRef.current.length > 0) {
        const uniqueSaleIds = Array.from(new Set(printingLabelsRef.current.map(l => l.sale.id)));
        uniqueSaleIds.forEach(id => {
          const item = printingLabelsRef.current.find(l => l.sale.id === id);
          updateSale(id, { impresa: true, etiquetador: item?.sale.etiquetador });
        });
        printingLabelsRef.current = [];
      }
      setLabelsToPrint([]);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, [updateSale]);

  useEffect(() => {
    if (labelsToPrint.length > 0) {
      printingLabelsRef.current = labelsToPrint;
      
      const timer = setTimeout(() => {
        window.print();
        
        // Fallback for environments where afterprint might not trigger or we want immediate sync
        const activePrintingLabels = printingLabelsRef.current;
        if (activePrintingLabels.length > 0) {
          const uniqueSaleIds = Array.from(new Set(activePrintingLabels.map(l => l.sale.id)));
          uniqueSaleIds.forEach(id => {
            const item = activePrintingLabels.find(l => l.sale.id === id);
            updateSale(id, { impresa: true, etiquetador: item?.sale.etiquetador });
          });
          printingLabelsRef.current = [];
          setLabelsToPrint([]);
        }
      }, 250);
      
      return () => clearTimeout(timer);
    }
  }, [labelsToPrint, updateSale]);

  const generateLabelsForSale = (sale: Sale, etiquetador: string, mode: 'INDIVIDUAL' | 'GROUPED'): QueuePrintableLabel[] => {
    const enrichedSale = { ...sale, impresa: true, etiquetador };
    if (mode === 'INDIVIDUAL') {
      return generateIndividualLabels(enrichedSale, stock).map(gl => ({
        sale: enrichedSale,
        item: gl.item
      }));
    } else {
      return generateGroupedLabels(enrichedSale, stock).map(gl => ({
        sale: enrichedSale,
        item: gl.item
      }));
    }
  };

  const handlePrintAll = () => {
    const currentEtiquetador = etiquetadorName.trim() || currentUser?.nombre || '';
    if (!currentEtiquetador) {
      setPendingSaleId('all');
      setShowEtiquetadorModal(true);
      return;
    }

    const allLabels: QueuePrintableLabel[] = [];
    readyToPrint.forEach(s => {
      allLabels.push(...generateLabelsForSale(s, currentEtiquetador, queueMode));
    });

    setLabelsToPrint(allLabels);
    setShowEtiquetadorModal(false);
  };

  const handlePrintSingle = (sale: Sale, mode: 'INDIVIDUAL' | 'GROUPED' = 'INDIVIDUAL') => {
    const currentEtiquetador = etiquetadorName.trim() || currentUser?.nombre || '';
    if (!currentEtiquetador) {
      setPendingSaleId(sale.id);
      setShowEtiquetadorModal(true);
      return;
    }

    const labels = generateLabelsForSale(sale, currentEtiquetador, mode);
    setLabelsToPrint(labels);
    setShowEtiquetadorModal(false);
  };

  const confirmPrint = (e: React.FormEvent) => {
    e.preventDefault();
    const finalEtiquetador = etiquetadorName.trim() || currentUser?.nombre || 'BODEGA';
    
    if (pendingSaleId === 'all') {
      const allLabels: QueuePrintableLabel[] = [];
      readyToPrint.forEach(s => {
        allLabels.push(...generateLabelsForSale(s, finalEtiquetador, queueMode));
      });
      setLabelsToPrint(allLabels);
    } else if (pendingSaleId) {
      const sale = sales.find(s => s.id === pendingSaleId);
      if (sale) {
        const labels = generateLabelsForSale(sale, finalEtiquetador, queueMode);
        setLabelsToPrint(labels);
      }
    }
    
    setShowEtiquetadorModal(false);
  };

  return (
    <div className="space-y-8">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between no-print gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Centro de Etiquetado</h2>
          <p className="text-slate-500 font-medium italic">Cola de impresión térmica (100x150mm) con soporte para bultos individuales</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Search */}
          <input 
            type="text" 
            placeholder="Buscar por cliente, venta, fardo..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-56"
          />

          {/* Queue Mode Selector for Notas de Venta */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setQueueMode('INDIVIDUAL')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase transition-all flex items-center gap-1.5 ${
                queueMode === 'INDIVIDUAL'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Genera 1 etiqueta por cada fardo físico (ej: 15 etiquetas para 10 + 5 fardos)"
            >
              <Boxes size={13} /> 1 por Fardo
            </button>
            <button
              type="button"
              onClick={() => setQueueMode('GROUPED')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase transition-all flex items-center gap-1.5 ${
                queueMode === 'GROUPED'
                  ? 'bg-white text-blue-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Genera 1 etiqueta por producto con la cantidad total"
            >
              <Layers size={13} /> Agrupadas
            </button>
          </div>

          <label className="flex items-center gap-2 px-3 py-2.5 bg-slate-100 rounded-xl cursor-pointer">
            <input type="checkbox" checked={showPrinted} onChange={e => setShowPrinted(e.target.checked)} />
            <span className="text-xs font-bold text-slate-700">Incluir impresos</span>
          </label>

          <button onClick={() => setShowDemo(!showDemo)} className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${showDemo ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
            {showDemo ? 'Ocultar Demo' : 'Guía Visual'}
          </button>

          <button 
            onClick={handlePrintAll} 
            disabled={readyToPrint.length === 0} 
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer size={20} /> 
            <span>
              Imprimir Cola ({readyToPrint.length} ventas / {totalQueueLabelsCount} etiquetas)
            </span>
          </button>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center no-print pb-20">
        {showDemo && (
          <div className="relative group w-full flex flex-col items-center">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-amber-500 text-white text-[10px] font-black px-4 py-1 rounded-full shadow-lg">ETIQUETA DE MUESTRA</div>
            <div className="relative bg-white p-4 border-4 border-amber-200 rounded-[32px] shadow-lg scale-[0.5] origin-top overflow-hidden">
              <Label sale={demoSale} stock={stock} />
            </div>
          </div>
        )}

        {readyToPrint.map((sale) => {
          const bultos = getTotalBultos(sale);
          const hasMultipleItems = Boolean(sale.items && sale.items.length > 0);
          const isNotaVenta = sale.tipoVenta === SaleType.NOTA_VENTA;

          return (
            <div key={sale.id} className="relative group animate-in fade-in slide-in-from-bottom duration-500 w-full flex flex-col items-center bg-white rounded-3xl p-3 border-2 border-slate-100 shadow-sm hover:shadow-md transition-all">
              
              {/* Sale Info Bar */}
              <div className="w-full flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-slate-900">#{sale.numeroVenta}</span>
                  {bultos > 1 && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Boxes size={11} /> {bultos} FARDOS
                    </span>
                  )}
                </div>
                
                {sale.impresa ? (
                  <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full">
                    IMPRESO
                  </span>
                ) : (
                  <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded-full">
                    PENDIENTE
                  </span>
                )}
              </div>

              {/* Thermal Preview Box */}
              <div className={`relative bg-white p-2 border-2 border-dashed ${sale.impresa ? 'border-emerald-300' : 'border-slate-200'} rounded-2xl hover:border-emerald-400 transition-all shadow-md scale-[0.42] origin-top -mb-[85mm] overflow-hidden`}>
                {sale.impresa && sale.etiquetador && (
                  <div className="absolute top-4 right-4 z-10 bg-white/90 text-slate-900 text-[8px] font-black px-2 py-1 rounded-full border border-emerald-200 shadow-sm flex items-center gap-1">
                    <User size={8} /> {sale.etiquetador}
                  </div>
                )}
                
                <Label 
                  sale={sale} 
                  stock={stock} 
                  item={bultos > 1 ? {
                    codigoFardo: sale.items?.[0]?.codigoFardo || sale.codigoFardo || 'N/A',
                    cantidad: 1,
                    bultoNumero: 1,
                    bultoTotal: bultos,
                    itemIndex: 1,
                    itemTotalQty: sale.items?.[0]?.cantidad || 1,
                    variante: sale.variante
                  } : undefined}
                />

                {/* Hover overlay with printing actions */}
                <div className="absolute inset-0 bg-slate-950/85 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-sm p-4">
                  <button 
                    onClick={() => handlePrintSingle(sale, 'INDIVIDUAL')} 
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all"
                  >
                    <Printer size={16} /> 
                    {bultos > 1 ? `Imprimir ${bultos} Fardos` : (sale.impresa ? 'Imprimir Otra Vez' : 'Imprimir Ahora')}
                  </button>

                  <button 
                    onClick={() => { setModalSale(sale); playSound('click'); }} 
                    className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                  >
                    <Settings2 size={15} /> Opciones / Vista Previa
                  </button>
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="w-full mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-bold px-1">
                <span className="truncate max-w-[140px] text-slate-800">{sale.cliente}</span>
                <button
                  type="button"
                  onClick={() => { setModalSale(sale); playSound('click'); }}
                  className="text-emerald-600 hover:text-emerald-800 font-black"
                >
                  {bultos > 1 ? `${bultos} etiquetas` : '1 etiqueta'}
                </button>
              </div>

            </div>
          );
        })}

        {readyToPrint.length === 0 && !showDemo && (
          <div className="col-span-full py-40 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-6">
              <Printer size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-400">No hay etiquetas pendientes</h3>
            <button onClick={() => setShowDemo(true)} className="mt-6 text-emerald-500 font-bold flex items-center gap-2 hover:underline">
              <AlertCircle size={16} /> Ver cómo se verá una etiqueta
            </button>
          </div>
        )}
      </div>

      {/* Hidden Print Container for thermal printer output */}
      <div className="hidden print-only">
        {labelsToPrint.map((lbl, idx) => (
          <div key={`${lbl.sale.id}-${idx}`} className="label-container">
            <Label sale={lbl.sale} stock={stock} item={lbl.item} />
          </div>
        ))}
      </div>

      {/* Modal de Impresión Detallada con vista previa y selección de bultos */}
      {modalSale && (
        <PrintLabelsModal 
          isOpen={Boolean(modalSale)}
          sale={modalSale}
          stock={stock}
          onClose={() => setModalSale(null)}
        />
      )}

      {/* Modal Simple: ¿Quién etiqueta? */}
      {showEtiquetadorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 no-print">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in slide-in-from-bottom-8 duration-500">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase">¿Quién etiqueta?</h3>
                <p className="text-slate-500 text-sm font-medium">Ingresa el nombre de la persona a cargo</p>
              </div>
              <button onClick={() => setShowEtiquetadorModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
            </div>

            <form onSubmit={confirmPrint} className="space-y-6">
              <div className="relative">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Nombre del etiquetador..."
                  value={etiquetadorName}
                  onChange={(e) => setEtiquetadorName(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-xl text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner"
                />
              </div>

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowEtiquetadorModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={!etiquetadorName.trim()}
                  className="flex-[2] py-4 bg-emerald-500 disabled:bg-slate-200 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                >
                  Iniciar Impresión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
    </div>
  );
}

