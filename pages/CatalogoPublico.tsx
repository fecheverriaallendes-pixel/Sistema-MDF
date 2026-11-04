
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Package, 
  Tag, 
  Layers, 
  Square, 
  Filter,
  MessageCircle,
  Hash,
  AlertCircle,
  ShieldAlert,
  ChevronRight,
  Calendar,
  Ruler,
  Scale,
  Users,
  Sparkles,
  FileText,
  Truck,
  RotateCcw,
  X
} from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { StockItem } from '../types';
import { smartSearchMatch } from '../utils/search';
import { PoliticasModal, PoliticasSectionInline } from '../components/PoliticasModal';
import { ProductFichaModal } from '../components/ProductFichaModal';
import { 
  getSeasonBadgeStyle,
  TEMPORADAS_OPTIONS 
} from '../utils/productCharacteristics';

const LOGO_URL = "https://i.ibb.co/qMyZQHYg/logo-sin-fondo-1.png";

export default function CatalogoPublico() {
  const { stock } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'TODOS' | 'FARDO' | 'LOTE'>('TODOS');
  const [temporadaFilter, setTemporadaFilter] = useState<string>('TODOS');
  const [providerFilter, setProviderFilter] = useState<string>('TODOS');
  const [isPoliticasOpen, setIsPoliticasOpen] = useState(false);
  const [selectedFichaItem, setSelectedFichaItem] = useState<StockItem | null>(null);

  // Filter only items with stock
  const availableStock = useMemo(() => {
    return stock.filter(item => item.stockActual > 0);
  }, [stock]);

  // Lista única de proveedores para el catálogo público
  const uniqueProviders = useMemo(() => {
    const providers = availableStock
      .map(item => (item.proveedor || '').trim().toUpperCase())
      .filter(Boolean);
    return ['TODOS', ...Array.from(new Set(providers))].sort();
  }, [availableStock]);

  const filteredStock = useMemo(() => {
    return availableStock.filter(item => {
      const matchesSearch = smartSearchMatch(item, searchTerm);
      
      const itemCategory = item.categoria || 'FARDO';
      const matchesFilter = activeFilter === 'TODOS' || itemCategory === activeFilter;

      const itemTemporada = item.temporada || '';
      const matchesTemporada = temporadaFilter === 'TODOS' || itemTemporada === temporadaFilter;

      const matchesProvider = providerFilter === 'TODOS' || (item.proveedor || '').toUpperCase() === providerFilter;
      
      return matchesSearch && matchesFilter && matchesTemporada && matchesProvider;
    }).sort((a, b) => (a.tipo || '').localeCompare(b.tipo || ''));
  }, [availableStock, searchTerm, activeFilter, temporadaFilter, providerFilter]);

  const handleWhatsAppInquiry = (item: StockItem) => {
    let details = '';
    if (item.temporada) details += `\n• Temporada: ${item.temporada}`;
    const gen = item.generoSegmento || item.estilo;
    if (gen) details += `\n• Género/Segmento: ${gen}`;
    if (item.tallas) details += `\n• Tallas/Edades: ${item.tallas}`;
    const pesoVal = item.pesoKg || item.peso;
    if (pesoVal) details += `\n• Peso: ${pesoVal} KG`;

    const message = `Hola! Me interesa el fardo: ${item.tipo} (${item.codigo})${details}\n¿Tienen disponibilidad para despacho?`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/56964035464?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Logo" className="w-10 h-10" />
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">CATÁLOGO MDF</h1>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Stock & Fichas en Tiempo Real</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsPoliticasOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-[9px] font-black uppercase tracking-wider transition-all shadow-sm"
            >
              <ShieldAlert size={12} className="text-emerald-400" />
              <span>Políticas</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full animate-pulse">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
              <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">En Vivo</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero & Search */}
      <div className="bg-white px-6 pb-6 pt-4 border-b border-slate-100 space-y-4">
        <div className="max-w-xl mx-auto space-y-4">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por prenda, temporada (invierno/verano), estilo..."
              className="w-full pl-14 pr-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Policy quick banner */}
          <button 
            onClick={() => setIsPoliticasOpen(true)}
            className="w-full p-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl flex items-center justify-between text-left hover:brightness-110 transition-all shadow-sm group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <ShieldAlert size={16} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-200">Garantías y Devoluciones</p>
                <p className="text-[11px] font-extrabold text-emerald-400 leading-tight">Ver Políticas de la Empresa respecto a la Mercadería</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Type filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {(['TODOS', 'FARDO', 'LOTE'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`whitespace-nowrap px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  activeFilter === filter 
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 scale-105' 
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {filter === 'TODOS' ? 'Todo' : filter === 'FARDO' ? 'Fardos' : 'Lotes'}
              </button>
            ))}
          </div>

          {/* Season filters */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[9px] font-black uppercase text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar size={12} className="text-emerald-500" /> Temporada:
              </span>
              {temporadaFilter !== 'TODOS' && (
                <button 
                  onClick={() => setTemporadaFilter('TODOS')}
                  className="text-emerald-600 hover:underline font-bold"
                >
                  Todas
                </button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {['TODOS', ...TEMPORADAS_OPTIONS].map((temp) => (
                <button
                  key={temp}
                  onClick={() => setTemporadaFilter(temp)}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all ${
                    temporadaFilter === temp
                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/50'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {temp === 'TODOS' ? '🌦️ Todas las Temporadas' : temp}
                </button>
              ))}
            </div>
          </div>

          {/* Provider / Origen filters */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[9px] font-black uppercase text-slate-400">
              <span className="flex items-center gap-1">
                <Truck size={12} className="text-indigo-500" /> Proveedor / Origen:
              </span>
              {providerFilter !== 'TODOS' && (
                <button 
                  onClick={() => setProviderFilter('TODOS')}
                  className="text-indigo-600 hover:underline font-bold"
                >
                  Todos
                </button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {uniqueProviders.map((p) => (
                <button
                  key={p}
                  onClick={() => setProviderFilter(p)}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all ${
                    providerFilter === p
                      ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/50'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p === 'TODOS' ? '🏢 Todos los Proveedores' : p}
                </button>
              ))}
            </div>
          </div>

          {/* Active Filters Summary */}
          {(searchTerm || activeFilter !== 'TODOS' || temporadaFilter !== 'TODOS' || providerFilter !== 'TODOS') && (
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                {filteredStock.length} de {availableStock.length} disponibles
              </div>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setActiveFilter('TODOS');
                  setTemporadaFilter('TODOS');
                  setProviderFilter('TODOS');
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-[9px] font-black uppercase tracking-wider transition-all"
              >
                <RotateCcw size={10} /> Limpiar Filtros
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Content */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-6 space-y-8">
        {filteredStock.length > 0 ? (
          <div className="grid grid-cols-1 gap-5">
            {filteredStock.map((item) => {
              const temporada = item.temporada;
              const tallas = item.tallas || 'A consultar';
              const pesoVal = item.pesoKg || item.peso;
              const peso = pesoVal ? `${pesoVal} KG APROX` : 'A consultar';
              const genero = item.generoSegmento || item.estilo || 'A consultar';
              const calidad = item.calidad || 'A consultar';
              const descripcion = item.descripcion;
              const seasonStyle = getSeasonBadgeStyle(temporada);

              return (
                <div 
                  key={item.id} 
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden flex flex-col group transition-all"
                >
                  <div className="p-6 flex flex-col space-y-4">
                    
                    {/* Top Row: Code, Unit, Season */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <Hash size={11} /> {item.codigo} • {item.proveedor}
                        </div>
                        <h3 className="text-lg font-black text-slate-900 uppercase italic leading-tight">{item.tipo}</h3>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {temporada && (
                          <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border ${seasonStyle.bg} ${seasonStyle.text} ${seasonStyle.border}`}>
                            {seasonStyle.icon} {temporada}
                          </span>
                        )}
                        <span className="text-[8px] font-bold text-slate-400 uppercase">
                          {item.unidad}
                        </span>
                      </div>
                    </div>

                    {/* Characteristics Summary Badges */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-black">
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex flex-col">
                        <span className="text-[8px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Ruler size={10} className="text-purple-500" /> Tallas / Edades
                        </span>
                        <span className="text-slate-900 uppercase mt-0.5 font-black truncate">
                          {tallas}
                        </span>
                      </div>

                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex flex-col">
                        <span className="text-[8px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Scale size={10} className="text-emerald-500" /> Peso Real
                        </span>
                        <span className="text-slate-900 uppercase mt-0.5 font-black">
                          {peso}
                        </span>
                      </div>

                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex flex-col">
                        <span className="text-[8px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Users size={10} className="text-amber-500" /> Género / Segmento
                        </span>
                        <span className="text-slate-900 uppercase mt-0.5 font-black truncate">
                          {genero}
                        </span>
                      </div>

                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex flex-col">
                        <span className="text-[8px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Tag size={10} className="text-indigo-500" /> Calidad
                        </span>
                        <span className="text-slate-900 uppercase mt-0.5 font-black truncate">
                          {calidad}
                        </span>
                      </div>
                    </div>

                    {/* Descripción de qué trae realmente el producto */}
                    {descripcion && (
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-700 uppercase tracking-wider">
                          <Sparkles size={12} className="text-indigo-600" />
                          <span>¿Qué trae realmente este fardo?</span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          {descripcion}
                        </p>
                      </div>
                    )}

                    {/* Price and Stock */}
                    <div className="flex items-end justify-between pt-2 border-t border-slate-100">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Precio Sugerido</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tighter">${item.precioSugerido.toLocaleString('es-CL')}</p>
                      </div>
                      <div className={`flex flex-col items-center px-4 py-2 rounded-2xl ${
                        item.stockActual > 5 ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                      }`}>
                        <span className="text-xl font-black leading-none">{item.stockActual}</span>
                        <span className="text-[8px] font-black uppercase mt-1">Disponibles</span>
                      </div>
                    </div>

                  </div>
                  
                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedFichaItem(item)}
                      className="py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <FileText size={14} className="text-indigo-600" /> Ver Ficha
                    </button>

                    <button 
                      onClick={() => handleWhatsAppInquiry(item)}
                      className="py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                    >
                      <MessageCircle size={16} /> Consultar WhatsApp
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center px-6">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-6">
              <Package size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase italic mb-2">No se encontraron productos</h3>
            <p className="text-slate-500 text-sm font-medium">Intenta buscando con otros términos o filtros.</p>
          </div>
        )}

        {/* Inline Policies Section */}
        <PoliticasSectionInline />
      </main>

      {/* Modal Ficha Técnica */}
      <ProductFichaModal
        item={selectedFichaItem}
        isOpen={Boolean(selectedFichaItem)}
        onClose={() => setSelectedFichaItem(null)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-10 px-6 text-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">CUADERNO MDF • CHILE</p>
        <div className="flex items-center justify-center gap-4 text-slate-400 mb-2">
          <AlertCircle size={16} />
          <p className="text-[9px] font-bold uppercase italic">Los precios y stock pueden variar sin previo aviso</p>
        </div>
        <button 
          onClick={() => setIsPoliticasOpen(true)}
          className="text-[10px] font-black text-emerald-600 hover:underline uppercase tracking-wider"
        >
          Ver Políticas de Cambios y Devoluciones
        </button>
      </footer>

      {/* Policies Modal */}
      <PoliticasModal isOpen={isPoliticasOpen} onClose={() => setIsPoliticasOpen(false)} />

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
