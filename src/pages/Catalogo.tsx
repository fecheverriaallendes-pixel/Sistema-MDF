import React, { useState, useMemo } from 'react';
import { 
  Printer, 
  Search, 
  Tag, 
  ChevronLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/GlobalContext';
import { formatCurrencyWithUSD, formatARS, formatUSD } from '../utils/currency';

const LOGO_URL = "https://i.ibb.co/qMSczKZF/Whats-App-Image-2026-04-13-at-12-23-21.jpg";

type SortOption = 'alpha-asc' | 'alpha-desc' | 'price-asc' | 'price-desc';

const TableHeader = () => (
  <thead>
    <tr className="border-b-2 border-slate-900 bg-slate-50 print:bg-slate-100">
      <th className="px-2 py-2 text-[10px] font-black uppercase text-left">Producto</th>
      <th className="px-2 py-2 text-[10px] font-black uppercase text-left">Presentación</th>
      <th className="px-2 py-2 text-[10px] font-black uppercase text-left">Calidad</th>
      <th className="px-2 py-2 text-[10px] font-black uppercase text-right">Precio</th>
      <th className="px-2 py-2 text-[10px] font-black uppercase text-left">Notas</th>
    </tr>
  </thead>
);

const ProductRow: React.FC<{ item: any }> = ({ item }) => (
  <tr className="border-b border-slate-100 print:border-slate-200">
    <td className="px-2 py-1.5 font-bold text-slate-900 uppercase text-[11px]">
      {item.tipo} {item.etiqueta === 'DESTACADO' && '⭐'}
    </td>
    <td className="px-2 py-1.5 text-[10px] text-slate-600">{item.presentacion}</td>
    <td className="px-2 py-1.5 text-[10px] text-slate-600">{item.calidad}</td>
    <td className="px-2 py-1.5 text-right font-black text-slate-900 text-xs">
      ${item.precioSugerido.toLocaleString('es-CL')}
    </td>
    <td className="px-2 py-1.5 text-[10px] text-slate-500 italic">{item.detalle}</td>
  </tr>
);

export default function Catalogo() {
  const { stock, playSound, settings } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('TODOS');
  const [sortOrder, setSortOrder] = useState<SortOption>('alpha-asc');

  const uniqueCategorias = useMemo(() => {
    const categorias = stock.map(item => (item.categoria || 'SIN CATEGORÍA').toUpperCase());
    return ['TODOS', ...Array.from(new Set(categorias))].sort();
  }, [stock]);

  const sortedAndFilteredStock = useMemo(() => {
    let result = stock.filter(item => 
      item.stockActual > 0 &&
      (item.tipo.toLowerCase().includes(searchTerm.toLowerCase()) || 
       item.codigo.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (categoriaFilter === 'TODOS' || (item.categoria || 'SIN CATEGORÍA').toUpperCase() === categoriaFilter)
    );

    return result.sort((a, b) => {
      // Prioritize DESTACADO
      const aDest = (a.etiqueta || '').toUpperCase() === 'DESTACADO' ? -1 : 1;
      const bDest = (b.etiqueta || '').toUpperCase() === 'DESTACADO' ? -1 : 1;
      if (aDest !== bDest) return aDest - bDest;

      switch (sortOrder) {
        case 'alpha-asc': return a.tipo.localeCompare(b.tipo);
        case 'alpha-desc': return b.tipo.localeCompare(a.tipo);
        case 'price-asc': return a.precioSugerido - b.precioSugerido;
        case 'price-desc': return b.precioSugerido - a.precioSugerido;
        default: return 0;
      }
    });
  }, [stock, searchTerm, categoriaFilter, sortOrder]);

  const handlePrint = () => {
    playSound('success');
    window.print();
  };

  const today = new Date().toLocaleDateString('es-CL');

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto animate-in fade-in duration-500 pb-20 view-is-list">
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
            <button 
              onClick={handlePrint}
              className="flex items-center gap-3 px-8 py-4 bg-amber-600 text-white rounded-[24px] font-black text-xs uppercase tracking-widest transition-all shadow-2xl active:scale-95"
            >
              <Printer size={18} /> Imprimir Listado
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            type="text" 
            placeholder="Buscar producto..."
            className="w-full px-8 py-5 rounded-[28px] border-2 border-slate-100 focus:border-amber-500 outline-none transition-all shadow-sm text-lg font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="w-full px-8 py-5 rounded-[28px] border-2 border-slate-100 bg-white font-black text-[10px] uppercase outline-none focus:border-amber-500 shadow-sm cursor-pointer"
            value={categoriaFilter}
            onChange={(e) => { setCategoriaFilter(e.target.value); playSound('click'); }}
          >
            {uniqueCategorias.map(p => (
              <option key={p} value={p}>{p === 'TODOS' ? 'CATEGORÍAS: TODAS' : `CATEGORÍA: ${p}`}</option>
            ))}
          </select>
          <select 
            className="w-full px-8 py-5 rounded-[28px] border-2 border-slate-100 bg-white font-black text-[10px] uppercase outline-none focus:border-amber-500 shadow-sm cursor-pointer"
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

      <div className="catalogo-content bg-white p-4 print:p-0">
        
        <div className="hidden print:flex items-center justify-between border-b-4 border-slate-900 pb-4 mb-6">
          <div className="flex items-center gap-4">
            <img src={LOGO_URL} alt="Logo" className="w-12 h-12 grayscale contrast-150" />
            <h1 className="text-xl font-black uppercase tracking-tighter">
              Lista Oficial de Precios El Garage del Fardo
            </h1>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase">Fecha: {today}</p>
            <p className="text-[8px] font-bold text-slate-400">El Garage del Fardo S.A.</p>
          </div>
        </div>

        <div className="print-columns-container">
          <table className="w-full border-collapse">
            <TableHeader />
            <tbody>
              {sortedAndFilteredStock.map(item => <ProductRow key={item.id} item={item} />)}
            </tbody>
          </table>
        </div>

        {sortedAndFilteredStock.length === 0 && (
          <div className="py-40 text-center opacity-30 italic font-black uppercase tracking-widest">
             No hay productos disponibles para mostrar
          </div>
        )}

        <div className="mt-12 text-center border-t border-slate-100 pt-8 print:mt-6 print:border-slate-900">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] print:text-[8px] print:text-slate-900">
             INTELIGENCIA OPERATIVA EN FARDOS • El Garage del Fardo
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
          
          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
