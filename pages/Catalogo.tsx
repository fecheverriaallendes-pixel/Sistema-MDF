
import React, { useState, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Printer, 
  LayoutGrid, 
  List, 
  Search, 
  Package, 
  Tag, 
  Clock,
  ChevronLeft,
  ArrowUpDown,
  Layers,
  Square,
  Filter,
  FileDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/GlobalContext';

const LOGO_URL = "https://i.ibb.co/qMyZQHYg/logo-sin-fondo-1.png";

type SortOption = 'alpha-asc' | 'alpha-desc' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc';

const TableHeader = () => (
  <thead>
    <tr className="border-b-2 border-slate-900 bg-slate-50 print:bg-slate-100">
      <th className="px-2 py-2 text-[10px] font-black uppercase text-left w-12">Cód</th>
      <th className="px-2 py-2 text-[10px] font-black uppercase text-left">Producto</th>
      <th className="px-2 py-2 text-[10px] font-black uppercase text-right w-20">Valor</th>
      <th className="px-2 py-2 text-[10px] font-black uppercase text-center w-8">Stk</th>
    </tr>
  </thead>
);

const ProductRow = ({ item }: { item: any }) => (
  <tr className="border-b border-slate-100 print:border-slate-200">
    <td className="px-2 py-1.5 font-mono font-bold text-slate-400 text-[10px] uppercase">
      {item.codigo.replace('MDF-','')}
    </td>
    <td className="px-2 py-1.5 product-detail-cell">
      <div className="flex flex-col">
        <span className="font-black text-slate-900 uppercase text-[11px] leading-tight italic line-clamp-2">
          {item.tipo}
        </span>
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
          ({item.proveedor})
        </span>
      </div>
    </td>
    <td className="px-2 py-1.5 text-right font-black text-slate-900 text-xs">
      ${item.precioSugerido.toLocaleString('es-CL')}
    </td>
    <td className="px-2 py-1.5 text-center">
      <span className={`font-black text-[10px] ${item.stockActual < 5 ? 'text-red-600' : 'text-slate-900'}`}>
        {item.stockActual}
      </span>
    </td>
  </tr>
);

export default function Catalogo() {
  const { stock, playSound } = useStore();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState('TODOS');
  const [sortOrder, setSortOrder] = useState<SortOption>('alpha-asc');
  
  const searchParams = new URLSearchParams(location.search);
  const [viewMode, setViewMode] = useState<'digital' | 'print'>((searchParams.get('mode') as 'digital' | 'print') || 'digital');
  const [isDownloading, setIsDownloading] = useState(false);

  const uniqueProviders = useMemo(() => {
    const providers = stock.map(item => item.proveedor.toUpperCase());
    return ['TODOS', ...Array.from(new Set(providers))].sort();
  }, [stock]);

  const sortedAndFilteredStock = useMemo(() => {
    let result = stock.filter(item => 
      (item.tipo.toLowerCase().includes(searchTerm.toLowerCase()) || 
       item.codigo.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (providerFilter === 'TODOS' || item.proveedor.toUpperCase() === providerFilter)
    );

    return result.sort((a, b) => {
      switch (sortOrder) {
        case 'alpha-asc': return a.tipo.localeCompare(b.tipo);
        case 'alpha-desc': return b.tipo.localeCompare(a.tipo);
        case 'price-asc': return a.precioSugerido - b.precioSugerido;
        case 'price-desc': return b.precioSugerido - a.precioSugerido;
        case 'stock-asc': return a.stockActual - b.stockActual;
        case 'stock-desc': return b.stockActual - a.stockActual;
        default: return 0;
      }
    });
  }, [stock, searchTerm, providerFilter, sortOrder]);

  const handlePrint = () => {
    playSound('success');
    window.print();
  };

  const contentRef = useRef<HTMLDivElement>(null);
  
  const handleDownloadPDF = async () => {
    playSound('success');
    setIsDownloading(true);
    
    // Give time to render the 'downloading' state
    await new Promise(resolve => setTimeout(resolve, 500));

    const input = contentRef.current;
    if (!input) {
        setIsDownloading(false);
        return;
    }
    
    const canvas = await html2canvas(input, { 
      scale: 2,
      useCORS: true,
      logging: false,
    });
    
    setIsDownloading(false);
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    let heightLeft = pdfHeight;
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= 297; 
    
    while (heightLeft > 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= 297;
    }
    
    pdf.save(`catalogo_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const today = new Date().toLocaleDateString('es-CL');

  return (
    <div className={`space-y-8 max-w-[1200px] mx-auto animate-in fade-in duration-500 pb-20 ${viewMode === 'digital' ? 'view-is-digital' : 'view-is-list'}`}>
      {/* Header Controles - No Imprimibles */}
      <div className="no-print space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
              <ChevronLeft size={24} />
            </Link>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Generador de Catálogo</h2>
              <p className="text-slate-500 italic font-medium">Visualización y Exportación</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex bg-slate-200 p-1.5 rounded-[24px] shadow-inner">
              <button 
                onClick={() => { setViewMode('digital'); playSound('click'); }}
                className={`flex items-center gap-2 px-6 py-3 rounded-[18px] font-black text-[10px] uppercase tracking-widest transition-all ${viewMode === 'digital' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500'}`}
              >
                <LayoutGrid size={18} /> Digital
              </button>
              <button 
                onClick={() => { setViewMode('print'); playSound('click'); }}
                className={`flex items-center gap-2 px-6 py-3 rounded-[18px] font-black text-[10px] uppercase tracking-widest transition-all ${viewMode === 'print' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500'}`}
              >
                <List size={18} /> Impreso
              </button>
            </div>
            <button 
              onClick={handleDownloadPDF}
              className={`flex items-center gap-3 px-8 py-4 text-white rounded-[24px] font-black text-xs uppercase tracking-widest transition-all shadow-2xl active:scale-95 ${viewMode === 'digital' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              <FileDown size={18} />
              Guardar PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            type="text" 
            placeholder="Buscar producto..."
            className="w-full px-8 py-5 rounded-[28px] border-2 border-slate-100 focus:border-emerald-500 outline-none transition-all shadow-sm text-lg font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="w-full px-8 py-5 rounded-[28px] border-2 border-slate-100 bg-white font-black text-[10px] uppercase outline-none focus:border-emerald-500 shadow-sm cursor-pointer"
            value={providerFilter}
            onChange={(e) => { setProviderFilter(e.target.value); playSound('click'); }}
          >
            {uniqueProviders.map(p => (
              <option key={p} value={p}>{p === 'TODOS' ? 'PROVEEDORES: TODOS' : `ORIGEN: ${p}`}</option>
            ))}
          </select>
          <select 
            className="w-full px-8 py-5 rounded-[28px] border-2 border-slate-100 bg-white font-black text-[10px] uppercase outline-none focus:border-emerald-500 shadow-sm cursor-pointer"
            value={sortOrder}
            onChange={(e) => { setSortOrder(e.target.value as SortOption); playSound('click'); }}
          >
            <option value="alpha-asc">Orden: A - Z</option>
            <option value="alpha-desc">Orden: Z - A</option>
            <option value="price-asc">Precio: Menor a Mayor</option>
            <option value="price-desc">Precio: Mayor a Menor</option>
            <option value="stock-asc">Stock: Menor a Mayor</option>
            <option value="stock-desc">Stock: Mayor a Menor</option>
          </select>
        </div>
      </div>

      {/* ÁREA DE CONTENIDO */}
      <div ref={contentRef} className={`catalogo-content bg-white p-8 ${isDownloading ? 'px-4' : 'p-4'}`}>
        
        {/* Header Impresión - visible siempre para captura */}
        <div className="flex items-center justify-between border-b-4 border-slate-900 pb-4 mb-6">
          <div className="flex items-center gap-4">
            <img src={LOGO_URL} alt="Logo" className="w-12 h-12 grayscale contrast-150" />
            <div>
                <h1 className="text-xl font-black uppercase tracking-tighter">CUADERNO MDF S.A.</h1>
                <p className="text-xs font-bold text-slate-500">{viewMode === 'digital' ? 'Catálogo Maestro' : 'Lista Oficial de Precios'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase">Fecha: {today}</p>
          </div>
        </div>

        {viewMode === 'digital' ? (
          /* MODO DIGITAL: TARJETAS (Grilla en pantalla, Grilla optimizada en impresión) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 print:grid-cols-2 print:gap-4">
            {sortedAndFilteredStock.map(item => (
              <div key={item.id} className="digital-card bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden flex flex-col group hover:border-emerald-400 transition-all print:break-inside-avoid print:shadow-none print:border-2 print:rounded-2xl print:mb-4 print:w-full print:inline-block">
                <div className="p-6 bg-slate-900 text-white text-center relative print:bg-white print:text-slate-900 print:border-b print:p-3">
                  <div className="absolute top-2 right-4 flex items-center gap-1.5 px-2 py-0.5 bg-white/10 rounded-full text-[8px] font-black uppercase tracking-widest print:bg-slate-100 print:text-slate-500">
                    {item.unidad}
                  </div>
                  <h3 className="font-black uppercase tracking-tight text-lg leading-tight line-clamp-2 min-h-[3rem] flex items-center justify-center italic print:text-xs print:min-h-0">
                    {item.tipo}
                  </h3>
                </div>
                <div className="p-8 flex flex-col items-center text-center flex-1 print:p-4">
                   <div className="px-4 py-1.5 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 print:mb-2 print:text-[8px] print:py-0.5">
                     {item.proveedor}
                   </div>
                   <div className="text-5xl font-black text-slate-900 tracking-tighter mb-6 print:text-2xl print:mb-2">
                     ${item.precioSugerido.toLocaleString('es-CL')}
                   </div>
                   <div className="w-full pt-6 border-t border-slate-50 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest print:pt-2 print:text-[7px]">
                      <div className="flex items-center gap-2">
                         <Tag size={12} className="print:hidden" /> {item.codigo}
                      </div>
                      <div className="flex items-center gap-2 text-emerald-500">
                         <Package size={12} className="print:hidden" /> STOCK: {item.stockActual}
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* MODO LISTADO (Tabla simple para mejor paginación) */
          <div className="print-columns-container">
              <table className="w-full border-collapse">
                <TableHeader />
                <tbody>
                  {sortedAndFilteredStock.map(item => <ProductRow key={item.id} item={item} />)}
                </tbody>
              </table>
          </div>
        )}

        {sortedAndFilteredStock.length === 0 && (
          <div className="py-40 text-center opacity-30 italic font-black uppercase tracking-widest">
             No hay productos disponibles para mostrar
          </div>
        )}

        <div className="mt-12 text-center border-t border-slate-100 pt-8 print:mt-6 print:border-slate-900">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] print:text-[8px] print:text-slate-900">
             INTELIGENCIA OPERATIVA EN FARDOS • CUADERNO MDF
           </p>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 1cm; }
          
          /* Ensure everything is visible and not clipped */
          body, #root, .catalogo-content { height: auto !important; overflow: visible !important; }
          
          /* Hide UI elements */
          .no-print { display: none !important; }

          /* Layout: Linearize everything */
          .grid { display: block !important; }
          
          /* Cards: Allow natural flow */
          .digital-card { 
            display: inline-block !important; 
            width: 31% !important;
            margin: 1% !important;
            break-inside: avoid !important;
            border: 1px solid #ddd !important;
          }

          /* Tables: ensure simple layout */
          table { width: 100% !important; border-collapse: collapse !important; table-layout: fixed !important; }
          td, th { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .product-detail-cell { white-space: normal !important; }
          tr { break-inside: avoid !important; }
          thead { display: table-header-group; }
        }
      `}</style>
    </div>
  );
}
