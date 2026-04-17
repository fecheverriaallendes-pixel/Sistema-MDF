import React, { useState, useEffect } from 'react';
import { Printer, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/GlobalContext';
import { Sale, SaleType, SaleStatus, CommissionType, StockItem } from '../types';

const LOGO_URL = "https://i.ibb.co/qMSczKZF/Whats-App-Image-2026-04-13-at-12-23-21.jpg";

const Label = ({ sale, stock }: { sale: Sale, stock: StockItem[] }) => (
  <div className="w-[100mm] h-[70mm] bg-white border-2 border-black p-4 flex flex-row items-stretch overflow-hidden print:m-0 print:w-[100mm] print:h-[70mm]">
    <div className="w-[35mm] flex flex-col border-r-2 border-black pr-4 justify-between">
      <div className="flex flex-col items-center">
        <img src={LOGO_URL} alt="Logo" className="w-[28mm] object-contain mb-4 grayscale contrast-[2] brightness-75" />
        <div className="text-center w-full bg-black text-white py-2 rounded-lg">
          <p className="text-[10px] font-black uppercase tracking-widest mb-1">Venta</p>
          <p className="text-3xl font-black font-mono leading-none">#{sale.numeroVenta}</p>
        </div>
      </div>
      <div className="text-center border-t border-black pt-2">
        <p className="text-[8px] font-black uppercase tracking-tighter text-slate-600">Origen</p>
        <p className="text-[10px] font-bold uppercase">{sale.tipoVenta}</p>
      </div>
    </div>
    <div className="flex-1 pl-6 flex flex-col justify-between py-1">
      <div>
        <div className="mb-4">
          <p className="text-[9px] font-black uppercase text-slate-500 mb-1">Destinatario / Cliente</p>
          <p className="text-xl font-black uppercase leading-tight line-clamp-1">{sale.cliente}</p>
          <p className="text-sm font-bold text-slate-700 mt-1">{sale.rut || 'DNI PENDIENTE'}</p>
        </div>
        <div className="mb-4">
          <p className="text-[9px] font-black uppercase text-slate-500 mb-1">Dirección de Entrega</p>
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
            <p className="text-sm font-black uppercase leading-snug line-clamp-2 italic">{sale.direccion || 'SIN DIRECCIÓN REGISTRADA'}</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 border-t border-black pt-4">
        <div>
          <p className="text-[9px] font-black uppercase text-slate-500 mb-1">Producto</p>
          <p className="text-[14px] font-black leading-none line-clamp-2">{sale.variante || stock.find(s => s.codigo === sale.codigoFardo)?.tipo || 'Producto sin nombre'}</p>
        </div>
        <div className="text-right flex flex-col justify-end">
          <p className="text-[9px] font-black uppercase text-slate-500">Contacto</p>
          <p className="text-sm font-black leading-tight break-all">{sale.telefono}</p>
          <p className="text-[8px] font-bold uppercase text-slate-400 mt-1">Fardos Aaron S.A.</p>
        </div>
      </div>
    </div>
  </div>
);

export default function Etiquetas() {
  const { sales, stock } = useStore();
  const [individualSale, setIndividualSale] = useState<Sale | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const readyToPrint = sales.filter(s => s.datosCompletos && !s.enviado).sort((a, b) => b.numeroVenta - a.numeroVenta);

  const demoSale: Sale = {
    id: 'demo', numeroVenta: 9999, tipoVenta: SaleType.NORMAL, cliente: 'CLIENTE DE PRUEBA',
    telefono: '+569 1234 5678', rut: '12.345.678-9', codigoFardo: 'F-DEMO',
    direccion: 'AVENIDA CENTRAL 123, SANTIAGO', variante: 'FARDO PREMIUM',
    total: 150000, datosCompletos: true, enviado: false, status: SaleStatus.PENDIENTE,
    fecha: new Date().toLocaleDateString(), hora: '12:00', vendedor: 'ADMIN',
    valorUnitario: 150000, cantidad: 1, estadoPago: 'Pagado', observaciones: '',
    tipoComision: CommissionType.FARDO_NORMAL
  };

  useEffect(() => {
    const handleAfterPrint = () => setIndividualSale(null);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const handlePrintAll = () => { setIndividualSale(null); setTimeout(() => window.print(), 50); };
  const handlePrintSingle = (sale: Sale) => { setIndividualSale(sale); setTimeout(() => window.print(), 50); };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between no-print gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Centro de Etiquetado</h2>
          <p className="text-slate-500 font-medium italic">Cola de impresión térmica (100x70mm Horizontal)</p>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <button onClick={() => setShowDemo(!showDemo)} className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${showDemo ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
            {showDemo ? 'Ocultar Demo' : 'Ver Guía Visual'}
          </button>
          <button onClick={handlePrintAll} disabled={readyToPrint.length === 0} className="flex-[2] sm:flex-none flex items-center justify-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition-all shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed">
            <Printer size={24} /> Imprimir Cola ({readyToPrint.length})
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 justify-items-center no-print pb-20">
        {showDemo && (
          <div className="relative group w-full flex flex-col items-center">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-amber-500 text-white text-[10px] font-black px-4 py-1 rounded-full shadow-lg">ETIQUETA DE MUESTRA</div>
            <div className="relative bg-white p-4 border-4 border-amber-200 rounded-[32px] shadow-lg scale-75 sm:scale-100 origin-top overflow-hidden"><Label sale={demoSale} stock={stock} /></div>
          </div>
        )}
        {readyToPrint.map((sale) => (
          <div key={sale.id} className="relative group animate-in fade-in slide-in-from-bottom duration-500 w-full flex flex-col items-center">
            <div className="relative bg-white p-4 border-4 border-dashed border-slate-200 rounded-[32px] hover:border-amber-400 transition-all shadow-lg scale-75 sm:scale-100 origin-top overflow-hidden">
              <Label sale={sale} stock={stock} />
              <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                <button onClick={() => handlePrintSingle(sale)} className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-2xl transition-all">
                  <Printer size={20} /> IMPRIMIR ÉSTA
                </button>
              </div>
            </div>
            <p className="mt-4 text-xs font-black uppercase text-slate-400">Previsualización #{sale.numeroVenta}</p>
          </div>
        ))}
        {readyToPrint.length === 0 && !showDemo && (
          <div className="col-span-full py-40 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-6"><Printer size={48} /></div>
            <h3 className="text-2xl font-black text-slate-400">No hay etiquetas pendientes</h3>
            <button onClick={() => setShowDemo(true)} className="mt-6 text-amber-600 font-bold flex items-center gap-2 hover:underline"><AlertCircle size={16} /> Ver cómo se verá una etiqueta</button>
          </div>
        )}
      </div>
      <div className="hidden print-only">
        {individualSale ? <div className="label-container"><Label sale={individualSale} stock={stock} /></div> : readyToPrint.map((sale) => <div key={sale.id} className="label-container"><Label sale={sale} stock={stock} /></div>)}
      </div>
      <style>{`
        @media print {
          @page { size: 100mm 70mm landscape; margin: 0; }
          body { margin: 0; padding: 0; background: white !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .label-container { width: 100mm; height: 70mm; page-break-after: always; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        }
      `}</style>
    </div>
  );
}
