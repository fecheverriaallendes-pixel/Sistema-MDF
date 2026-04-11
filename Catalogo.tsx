
import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
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
import { useStore } from '../store/AppContext';

const LOGO_URL = "https://i.ibb.co/qMyZQHYg/logo-sin-fondo-1.png";

type SortOption = 'alpha-asc' | 'alpha-desc' | 'price-asc' | 'price-desc';

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
    <td className="px-2 py-1.5">
      <div className="flex flex-col">
        <span className="font-black text-slate-900 uppercase text-[11px] leading-tight italic line-clamp-1">
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
  const [viewMode, setViewMode] = useState<'digital' | 'print'>(
    (searchParams.get('mode') as 'digital' | 'print') || 'digital'
  );

  const uniqueProviders = useMemo(() => {
    const providers = stock.map(item => item.proveedor.toUpperCase());
    return ['TODOS', ...Array.from(new Set(providers))].sort();
  }, [stock]);

  const sortedAndFilteredStock = useMemo(() => {
    let result = stock.filter(item => 
      item.stockActual > 0 &&
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
        default: return 0;
      }
    });
  }, [stock, searchTerm, providerFilter, sortOrder]);

  const printColumns = useMemo(() => {
    const half = Math.ceil(sortedAndFilteredStock.length / 2);
    return {
      left: sortedAndFilteredStock.slice(0, half),
      right: sortedAndFilteredStock.slice(half)
    };
  }, [sortedAndFilteredStock]);

  const handlePrint = () => {
    playSound('success');
    window.print();
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
              onClick={handlePrint}
              className={`flex items-center gap-3 px-8 py-4 text-white rounded-[24px] font-black text-xs uppercase tracking-widest transition-all shadow-2xl active:scale-95 ${viewMode === 'digital' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {viewMode === 'digital' ? <FileDown size={18} /> : <Printer size={18} />}
              {viewMode === 'digital' ? 'Guardar PDF Catálogo' : 'Imprimir Listado'}
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
          </select>
        </div>
      </div>

      {/* ÁREA DE CONTENIDO */}
      <div className="catalogo-content bg-white p-4 print:p-0">
        
        {/* Header Impresión Común */}
        <div className="hidden print:flex items-center justify-between border-b-4 border-slate-900 pb-4 mb-6">
          <div className="flex items-center gap-4">
            <img src={LOGO_URL} alt="Logo" className="w-12 h-12 grayscale contrast-150" />
            <h1 className="text-xl font-black uppercase tracking-tighter">
              {viewMode === 'digital' ? 'Catálogo Maestro MDF' : 'Lista Oficial de Precios MDF'}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase">Fecha: {today}</p>
            <p className="text-[8px] font-bold text-slate-400">CUADERNO MDF S.A.</p>
          </div>
        </div>

        {viewMode === 'digital' ? (
          /* MODO DIGITAL: TARJETAS (Grilla en pantalla, Grilla optimizada en impresión) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 print:grid-cols-2 print:gap-4 print:block">
            {sortedAndFilteredStock.map(item => (
              <div key={item.id} className="digital-card bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden flex flex-col group hover:border-emerald-400 transition-all print:break-inside-avoid print:shadow-none print:border-2 print:rounded-2xl print:mb-4 print:w-[48%] print:inline-flex print:mr-[2%]">
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
          /* MODO IMPRESIÓN / LISTADO (Dos columnas forzadas) */
          <div className="print-columns-container flex flex-col md:flex-row print:flex-row gap-8">
            <div className="flex-1">
              <table className="w-full border-collapse">
                <TableHeader />
                <tbody>
                  {printColumns.left.map(item => <ProductRow key={item.id} item={item} />)}
                </tbody>
              </table>
            </div>
            <div className="flex-1">
              <table className="w-full border-collapse">
                <TableHeader />
                <tbody>
                  {printColumns.right.map(item => <ProductRow key={item.id} item={item} />)}
                </tbody>
              </table>
            </div>
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
          @page { 
            size: portrait; 
            margin: 10mm; 
          }
          body { 
            background: white !important; 
            -webkit-print-color-adjust: exact;
          }
          .no-print { display: none !important; }
          .catalogo-content { width: 100% !important; margin: 0 !important; }
          main { margin-left: 0 !important; padding: 0 !important; }
          header { display: none !important; }
          
          /* ESTILOS PARA MODO LISTA (DOS COLUMNAS) */
          .view-is-list .catalogo-content > div {
            display: flex !important;
            flex-direction: row !important;
            gap: 20px !important;
          }

          /* ESTILOS PARA MODO DIGITAL (TARJETAS) */
          .view-is-digital .digital-card {
            display: inline-flex !important;
            vertical-align: top;
          }

          table {
            page-break-inside: auto;
          }

          tr, .digital-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
