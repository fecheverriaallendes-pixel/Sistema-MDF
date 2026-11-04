
import React, { useState, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  FileDown,
  MessageCircle,
  Share2,
  ShieldAlert,
  Calendar,
  Scale,
  Ruler,
  Compass,
  Users,
  ShieldCheck,
  Sparkles,
  FileText,
  Copy,
  Check,
  Truck,
  RotateCcw,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/GlobalContext';
import { StockItem } from '../types';
import { smartSearchMatch } from '../utils/search';
import { PoliticasModal } from '../components/PoliticasModal';
import { ProductFichaModal } from '../components/ProductFichaModal';
import { 
  inferCharacteristicsFromTitle, 
  formatFardoPitchWhatsApp, 
  getSeasonBadgeStyle, 
  getQualityBadgeStyle,
  TEMPORADAS_OPTIONS,
  GENEROS_SEGMENTOS_OPTIONS,
  parseTemporadas,
  matchesSeason,
  formatSeasonDisplay
} from '../utils/productCharacteristics';

// Extend jsPDF interface for autotable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}

const LOGO_URL = "https://i.ibb.co/qMyZQHYg/logo-sin-fondo-1.png";

type SortOption = 'alpha-asc' | 'alpha-desc' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc';

const TableHeader = () => (
  <thead>
    <tr className="border-b-2 border-slate-900 bg-slate-50 print:bg-slate-100">
      <th className="px-2 py-2 text-[10px] font-black uppercase text-left w-12">Cód</th>
      <th className="px-2 py-2 text-[10px] font-black uppercase text-left">Producto y Ficha Técnica</th>
      <th className="px-2 py-2 text-[10px] font-black uppercase text-right w-20">Valor</th>
      <th className="px-2 py-2 text-[10px] font-black uppercase text-center w-8">Stk</th>
    </tr>
  </thead>
);

const ProductRow: React.FC<{ item: StockItem; onOpenFicha: (item: StockItem) => void }> = ({ item, onOpenFicha }) => {
  const temporadasList = parseTemporadas(item.temporada);
  const tallas = item.tallas;
  const pesoVal = item.pesoKg || item.peso;
  const genero = item.generoSegmento || item.estilo;
  const calidad = item.calidad;
  const desc = item.descripcion;

  const hasAnySpec = !!(temporadasList.length > 0 || tallas || pesoVal || genero || calidad);

  return (
    <tr className="border-b border-slate-100 print:border-slate-200 hover:bg-slate-50 transition-colors">
      <td className="px-2 py-2 font-mono font-bold text-slate-400 text-[10px] uppercase align-top">
        {item.codigo.replace('MDF-','')}
      </td>
      <td className="px-2 py-2 product-detail-cell align-top">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-900 uppercase text-[11px] leading-tight italic">
              {item.tipo}
            </span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
              ({item.proveedor})
            </span>
            <button
              onClick={() => onOpenFicha(item)}
              className="no-print px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 rounded text-[8px] font-black uppercase tracking-wider transition-colors"
              title="Ver Ficha Técnica"
            >
              Ficha
            </button>
          </div>
          {hasAnySpec && (
            <div className="flex flex-wrap items-center gap-1 text-[8px] font-bold text-slate-600">
              {temporadasList.map(t => {
                const st = getSeasonBadgeStyle(t);
                return (
                  <span key={t} className={`px-1.5 py-0.5 rounded ${st.bg} ${st.text} border ${st.border} uppercase`}>
                    {st.icon} {t}
                  </span>
                );
              })}
              {genero && <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 uppercase">{genero}</span>}
              {tallas && <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 uppercase">Tallas: {tallas}</span>}
              {pesoVal && <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">{pesoVal} KG</span>}
              {calidad && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">{calidad}</span>}
            </div>
          )}
          {desc && (
            <p className="text-[9px] text-slate-500 italic line-clamp-1 leading-snug">
              {desc}
            </p>
          )}
        </div>
      </td>
      <td className="px-2 py-2 text-right font-black text-slate-900 text-xs align-top">
        ${item.precioSugerido.toLocaleString('es-CL')}
      </td>
      <td className="px-2 py-2 text-center align-top">
        <span className={`font-black text-[10px] ${item.stockActual < 5 ? 'text-red-600' : 'text-slate-900'}`}>
          {item.stockActual}
        </span>
      </td>
    </tr>
  );
};

export default function Catalogo() {
  const { stock, playSound } = useStore();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState('TODOS');
  const [categoryFilter, setCategoryFilter] = useState<'TODOS' | 'FARDO' | 'LOTE'>('TODOS');
  const [temporadaFilter, setTemporadaFilter] = useState('TODOS');
  const [generoFilter, setGeneroFilter] = useState('TODOS');
  const [sortOrder, setSortOrder] = useState<SortOption>('alpha-asc');

  const searchParams = new URLSearchParams(location.search);
  const [viewMode, setViewMode] = useState<'digital' | 'print'>((searchParams.get('mode') as 'digital' | 'print') || 'digital');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const [showPoliticas, setShowPoliticas] = useState(false);
  const [selectedFichaItem, setSelectedFichaItem] = useState<StockItem | null>(null);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);

  const uniqueProviders = useMemo(() => {
    const providers = stock.map(item => (item.proveedor || '').trim().toUpperCase()).filter(Boolean);
    return ['TODOS', ...Array.from(new Set(providers))].sort();
  }, [stock]);

  const sortedAndFilteredStock = useMemo(() => {
    let result = stock.filter(item => {
      // Ocultar productos con stock 0
      if (item.stockActual <= 0) return false;

      const matchesSearch = smartSearchMatch(item, searchTerm);
      const matchesProvider = providerFilter === 'TODOS' || (item.proveedor || '').toUpperCase() === providerFilter;
      
      const itemCategory = item.categoria || 'FARDO';
      const matchesCategory = categoryFilter === 'TODOS' || itemCategory === categoryFilter;

      const matchesTemporada = temporadaFilter === 'TODOS' || matchesSeason(item.temporada, temporadaFilter);

      const itemGenero = item.generoSegmento || item.estilo || '';
      const matchesGenero = generoFilter === 'TODOS' || itemGenero === generoFilter;

      return matchesSearch && matchesProvider && matchesCategory && matchesTemporada && matchesGenero;
    });

    return result.sort((a, b) => {
      const tipoA = a.tipo || '';
      const tipoB = b.tipo || '';
      switch (sortOrder) {
        case 'alpha-asc': return tipoA.localeCompare(tipoB);
        case 'alpha-desc': return tipoB.localeCompare(tipoA);
        case 'price-asc': return (a.precioSugerido || 0) - (b.precioSugerido || 0);
        case 'price-desc': return (b.precioSugerido || 0) - (a.precioSugerido || 0);
        case 'stock-asc': return (a.stockActual || 0) - (b.stockActual || 0);
        case 'stock-desc': return (b.stockActual || 0) - (a.stockActual || 0);
        default: return 0;
      }
    });
  }, [stock, searchTerm, providerFilter, categoryFilter, temporadaFilter, generoFilter, sortOrder]);

  const handlePrint = () => {
    playSound('success');
    window.print();
  };

  const contentRef = useRef<HTMLDivElement>(null);
  
  const handleDownloadPDF = async () => {
    playSound('success');
    setIsDownloading(true);
    
    // Brief delay to allow UI to update
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const todayStr = new Date().toLocaleDateString('es-CL');

        if (viewMode === 'print') {
          // --- NUEVO ENCABEZADO PROFESIONAL ---
          pdf.setFillColor(15, 23, 42); // Dark slate
          pdf.rect(0, 0, 210, 35, 'F');
          
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(20);
          pdf.setFont('helvetica', 'bold');
          pdf.text('CUADERNO MDF S.A.', 14, 18);
          
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.text('LISTA OFICIAL DE PRECIOS', 14, 26);
          
          pdf.setFontSize(8);
          pdf.text(`FECHA DE EMISIÓN: ${todayStr}`, 196, 18, { align: 'right' });

          // --- OPTIMIZACIÓN DE DATOS (Doble Columna con Stock y Filtro > 0) ---
          const onlyWithStock = sortedAndFilteredStock.filter(item => item.stockActual > 0);
          
          const pairedRows = [];
          for (let i = 0; i < onlyWithStock.length; i += 2) {
            const left = onlyWithStock[i];
            const right = onlyWithStock[i+1];
            
            pairedRows.push([
              (left.codigo || '').replace('MDF-', ''),
              (left.tipo || '').toUpperCase().substring(0, 28),
              (left.stockActual || 0).toString(),
              `$ ${(left.precioSugerido || 0).toLocaleString('es-CL')}`,
              '', // Espaciador
              right ? (right.codigo || '').replace('MDF-', '') : '',
              right ? (right.tipo || '').toUpperCase().substring(0, 28) : '',
              right ? (right.stockActual || 0).toString() : '',
              right ? `$ ${(right.precioSugerido || 0).toLocaleString('es-CL')}` : ''
            ]);
          }

          autoTable(pdf, {
            startY: 40,
            head: [['CÓD', 'PRODUCTO', 'STK', 'VALOR', '', 'CÓD', 'PRODUCTO', 'STK', 'VALOR']],
            body: pairedRows,
            theme: 'striped',
            headStyles: { 
              fillColor: [51, 65, 85], 
              textColor: [255, 255, 255], 
              fontSize: 7, 
              fontStyle: 'bold',
              cellPadding: 1.5
            },
            bodyStyles: { 
              fontSize: 6.5,
              cellPadding: 1,
              textColor: [30, 41, 59]
            },
            columnStyles: {
              0: { cellWidth: 10, fontStyle: 'bold' },
              1: { cellWidth: 55 },
              2: { cellWidth: 10, halign: 'center' },
              3: { cellWidth: 17, halign: 'right', fontStyle: 'bold' },
              4: { cellWidth: 4 }, // Spacer
              5: { cellWidth: 10, fontStyle: 'bold' },
              6: { cellWidth: 55 },
              7: { cellWidth: 10, halign: 'center' },
              8: { cellWidth: 17, halign: 'right', fontStyle: 'bold' }
            },
            margin: { top: 40, bottom: 15, left: 8, right: 8 },
            didDrawPage: () => {
              // Dibujar encabezado en cada página (opcional, el rectangulo oscuro solo en la 1)
              if (pdf.getNumberOfPages() > 1) {
                pdf.setFillColor(15, 23, 42);
                pdf.rect(0, 0, 210, 15, 'F');
                pdf.setTextColor(255, 255, 255);
                pdf.setFontSize(10);
                pdf.text('CUADERNO MDF S.A. - LISTA DE PRECIOS', 14, 10);
              }

              // Footer info
              pdf.setFontSize(7);
              pdf.setTextColor(148, 163, 184);
              const pageNum = pdf.getNumberOfPages();
              pdf.text(`Página ${pageNum}`, 14, pdf.internal.pageSize.getHeight() - 8);
              pdf.text('Precios sujetos a cambio sin previo aviso • CUADERNO MDF CHILE', 105, pdf.internal.pageSize.getHeight() - 8, { align: 'center' });
            }
          });

          pdf.save(`Lista_Precios_MDF_${new Date().toISOString().slice(0, 10)}.pdf`);
        } else {
          // MODE: DIGITAL (Canvas screenshot)
          const input = contentRef.current;
          if (!input) return;

          const canvas = await html2canvas(input, { 
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });
          
          const imgData = canvas.toDataURL('image/jpeg', 0.9);
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          
          const pageHeight = pdf.internal.pageSize.getHeight();
          let heightLeft = pdfHeight;
          let position = 0;
          
          // First page
          pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;
          
          // Subsequent pages
          while (heightLeft > 0) {
            position = heightLeft - pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;
          }
          
          pdf.save(`catalogo_mdf_${new Date().toISOString().slice(0, 10)}.pdf`);
        }
    } catch (err) {
        console.error('PDF Generation Error:', err);
        alert('Hubo un error al generar el PDF. Por favor intenta usando el botón de imprimir y selecciona "Guardar como PDF".');
    } finally {
        setIsDownloading(false);
    }
  };

  const handleShareLink = () => {
    playSound('success');
    const catalogUrl = `${window.location.origin}${window.location.pathname}#/catalogo-publico`;
    navigator.clipboard.writeText(catalogUrl).then(() => {
      setShowCopyFeedback(true);
      setTimeout(() => setShowCopyFeedback(false), 3000);
    });
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
            <button 
              onClick={handleShareLink}
              className={`flex items-center gap-3 px-8 py-4 text-white rounded-[24px] font-black text-xs uppercase tracking-widest transition-all shadow-2xl active:scale-95 ${showCopyFeedback ? 'bg-slate-900 animate-bounce' : 'bg-emerald-500 hover:bg-emerald-600'}`}
            >
              <Share2 size={18} />
              {showCopyFeedback ? '¡Link Copiado!' : 'Compartir Link'}
            </button>
            <button 
              onClick={() => setShowPoliticas(true)}
              className="flex items-center gap-2 px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-[24px] font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95"
            >
              <ShieldAlert size={18} className="text-emerald-400" />
              Políticas
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="flex bg-slate-100 p-1.5 rounded-[24px] shadow-inner sm:col-span-2 lg:col-span-1">
            {(['TODOS', 'FARDO', 'LOTE'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => { setCategoryFilter(cat); playSound('click'); }}
                className={`flex-1 py-3 rounded-[18px] font-black text-[9px] uppercase tracking-widest transition-all ${
                  categoryFilter === cat ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                {cat === 'TODOS' ? 'Todos' : cat === 'FARDO' ? 'Fardos' : 'Lotes'}
              </button>
            ))}
          </div>

          <div className="sm:col-span-2 lg:col-span-2">
            <input 
              type="text" 
              placeholder="Buscar producto, temporada, estilo..."
              className="w-full px-6 py-4 rounded-[24px] border-2 border-slate-100 focus:border-emerald-500 outline-none transition-all shadow-sm text-sm font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <select 
              className="w-full px-5 py-4 rounded-[24px] border-2 border-slate-100 bg-white font-black text-[10px] uppercase outline-none focus:border-emerald-500 shadow-sm cursor-pointer"
              value={temporadaFilter}
              onChange={(e) => { setTemporadaFilter(e.target.value); playSound('click'); }}
            >
              <option value="TODOS">TEMPORADA: TODAS</option>
              {TEMPORADAS_OPTIONS.map(temp => (
                <option key={temp} value={temp}>{temp.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div>
            <select 
              className="w-full px-5 py-4 rounded-[24px] border-2 border-slate-100 bg-white font-black text-[10px] uppercase outline-none focus:border-emerald-500 shadow-sm cursor-pointer"
              value={generoFilter}
              onChange={(e) => { setGeneroFilter(e.target.value); playSound('click'); }}
            >
              <option value="TODOS">GÉNERO / SEGMENTO: TODOS</option>
              {GENEROS_SEGMENTOS_OPTIONS.map(gen => (
                <option key={gen} value={gen}>{gen}</option>
              ))}
            </select>
          </div>

          <div>
            <select 
              className="w-full px-5 py-4 rounded-[24px] border-2 border-slate-100 bg-white font-black text-[10px] uppercase outline-none focus:border-emerald-500 shadow-sm cursor-pointer"
              value={providerFilter}
              onChange={(e) => { setProviderFilter(e.target.value); playSound('click'); }}
            >
              {uniqueProviders.map(p => (
                <option key={p} value={p}>{p === 'TODOS' ? 'PROVEEDORES: TODOS' : `ORIGEN: ${p}`}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Barra de Filtros Rápidos: Temporada y Proveedor */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-4">
            {/* Temporadas */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-1 shrink-0">
                <Calendar size={12} className="text-emerald-500" /> Temporada:
              </span>
              {['TODOS', ...TEMPORADAS_OPTIONS].map(temp => (
                <button
                  key={temp}
                  type="button"
                  onClick={() => { setTemporadaFilter(temp); playSound('click'); }}
                  className={`px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all ${
                    temporadaFilter === temp
                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/40'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {temp === 'TODOS' ? '🌦️ Todas' : temp}
                </button>
              ))}
            </div>

            {/* Proveedores */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-1 shrink-0">
                <Truck size={12} className="text-indigo-500" /> Proveedor:
              </span>
              {uniqueProviders.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setProviderFilter(p); playSound('click'); }}
                  className={`px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all ${
                    providerFilter === p
                      ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/40'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p === 'TODOS' ? '🏢 Todos' : p}
                </button>
              ))}
            </div>
          </div>

          {(searchTerm || categoryFilter !== 'TODOS' || temporadaFilter !== 'TODOS' || generoFilter !== 'TODOS' || providerFilter !== 'TODOS') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('TODOS');
                setTemporadaFilter('TODOS');
                setGeneroFilter('TODOS');
                setProviderFilter('TODOS');
                playSound('click');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-[9px] font-black uppercase tracking-wider transition-all"
            >
              <RotateCcw size={11} /> Limpiar Filtros ({sortedAndFilteredStock.length})
            </button>
          )}
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
                <p className="text-xs font-bold text-slate-500">{viewMode === 'digital' ? 'Catálogo Maestro con Fichas Técnicas' : 'Lista Oficial de Precios'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase">Fecha: {today}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase">{sortedAndFilteredStock.length} FARDOS DISPONIBLES</p>
          </div>
        </div>

        {viewMode === 'digital' ? (
          /* MODO DIGITAL: TARJETAS CON FICHA TÉCNICA Y DESCRIPCIÓN */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 print:grid-cols-2 print:gap-4">
            {sortedAndFilteredStock.map(item => {
              const temporada = item.temporada;
              const temporadasList = parseTemporadas(item.temporada);
              const tallas = item.tallas || 'Sin especificar';
              const pesoVal = item.pesoKg || item.peso;
              const peso = pesoVal ? `${pesoVal} KG APROX` : 'Sin especificar';
              const genero = item.generoSegmento || item.estilo || 'Sin especificar';
              const calidad = item.calidad || 'Sin especificar';
              const descripcion = item.descripcion;
              const consejo = item.consejoVenta;

              return (
                <div key={item.id} className="digital-card bg-white rounded-[36px] border-2 border-slate-100 shadow-xl overflow-hidden flex flex-col group hover:border-emerald-400 hover:shadow-2xl transition-all print:break-inside-avoid print:shadow-none print:border print:rounded-2xl print:mb-4 print:w-full print:inline-block">
                  
                  {/* Top Bar with Code & Season */}
                  <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white relative print:bg-white print:text-slate-900 print:border-b print:p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono font-black text-xs text-emerald-400 bg-white/10 px-2.5 py-1 rounded-full uppercase tracking-wider print:bg-slate-100 print:text-slate-800">
                        {item.codigo}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {temporadasList.map(t => {
                          const sStyle = getSeasonBadgeStyle(t);
                          return (
                            <span key={t} className="px-2.5 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-wider text-slate-200 border border-white/10 print:border-slate-200 print:text-slate-700">
                              {sStyle.icon} {t}
                            </span>
                          );
                        })}
                        <span className="px-2 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-300 print:hidden">
                          {item.unidad || 'FARDO'}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-black uppercase tracking-tight text-lg leading-tight italic min-h-[3rem] flex items-center print:text-xs print:min-h-0">
                      {item.tipo}
                    </h3>
                  </div>

                  {/* Body */}
                  <div className="p-6 flex flex-col flex-1 justify-between gap-4 print:p-3">
                    <div>
                      {/* Provider & Price */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-widest print:text-[8px] print:py-0.5">
                          {item.proveedor}
                        </span>
                        <div className="text-3xl font-black text-slate-900 tracking-tighter print:text-xl">
                          ${item.precioSugerido.toLocaleString('es-CL')}
                        </div>
                      </div>

                      {/* Specifications Grid */}
                      <div className="grid grid-cols-2 gap-2 mb-4 text-[10px] font-black">
                        <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex flex-col">
                          <span className="text-[8px] text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Ruler size={10} className="text-purple-500" /> Tallas / Edades
                          </span>
                          <span className="text-slate-900 uppercase mt-0.5 font-black truncate" title={tallas}>
                            {tallas}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex flex-col">
                          <span className="text-[8px] text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Scale size={10} className="text-emerald-500" /> Peso Real
                          </span>
                          <span className="text-slate-900 uppercase mt-0.5 font-black">
                            {peso}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex flex-col">
                          <span className="text-[8px] text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Users size={10} className="text-amber-500" /> Género / Segmento
                          </span>
                          <span className="text-slate-900 uppercase mt-0.5 font-black truncate">
                            {genero}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex flex-col">
                          <span className="text-[8px] text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <ShieldCheck size={10} className="text-indigo-500" /> Calidad
                          </span>
                          <span className="text-slate-900 uppercase mt-0.5 font-black truncate">
                            {calidad}
                          </span>
                        </div>
                      </div>

                      {/* Contenido Real del Fardo / Descripción */}
                      {descripcion && (
                        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/70 text-left space-y-1 mb-3">
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-700 uppercase tracking-wider">
                            <Sparkles size={11} className="text-indigo-600" />
                            <span>¿Qué trae este producto?</span>
                          </div>
                          <p className="text-[11px] text-slate-600 font-medium leading-relaxed line-clamp-3">
                            {descripcion}
                          </p>
                        </div>
                      )}

                      {/* Tip para Vendedoras */}
                      {consejo && (
                        <div className="p-2.5 bg-amber-50/90 border border-amber-200 rounded-xl text-left print:hidden mb-2">
                          <p className="text-[9px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1">
                            💡 Tip Venta: <span className="font-medium normal-case text-amber-800 line-clamp-2">{consejo}</span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider print:pt-1 print:text-[8px]">
                        <span>Stock: <strong className={item.stockActual < 5 ? 'text-red-600 font-black' : 'text-emerald-600 font-black'}>{item.stockActual} {item.unidad}s</strong></span>
                        {item.piezasAprox && <span className="text-slate-500 font-bold">{item.piezasAprox}</span>}
                      </div>

                      <div className="grid grid-cols-2 gap-2 print:hidden">
                        <button
                          onClick={() => {
                            setSelectedFichaItem(item);
                            playSound('click');
                          }}
                          className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                        >
                          <FileText size={12} />
                          Ficha Completa
                        </button>

                        <button
                          onClick={() => {
                            const pitch = formatFardoPitchWhatsApp(item);
                            navigator.clipboard.writeText(pitch);
                            setCopiedItemId(item.id);
                            playSound('success');
                            setTimeout(() => setCopiedItemId(null), 2000);
                          }}
                          className={`py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                            copiedItemId === item.id 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {copiedItemId === item.id ? <Check size={12} /> : <Copy size={12} />}
                          {copiedItemId === item.id ? '¡Copiado!' : 'Copiar Ficha'}
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* MODO LISTADO (Tabla simple para mejor paginación) */
          <div className="print-columns-container overflow-visible h-auto">
              <table className="w-full border-collapse table-auto">
                <TableHeader />
                <tbody>
                  {sortedAndFilteredStock.map(item => (
                    <ProductRow 
                      key={item.id} 
                      item={item} 
                      onOpenFicha={(it) => setSelectedFichaItem(it)}
                    />
                  ))}
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

      <PoliticasModal isOpen={showPoliticas} onClose={() => setShowPoliticas(false)} />

      {/* Modal Ficha Técnica Completa */}
      <ProductFichaModal 
        item={selectedFichaItem} 
        isOpen={Boolean(selectedFichaItem)} 
        onClose={() => setSelectedFichaItem(null)} 
      />

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
