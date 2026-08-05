
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
  ChevronRight
} from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { smartSearchMatch } from '../utils/search';
import { PoliticasModal, PoliticasSectionInline } from '../components/PoliticasModal';

const LOGO_URL = "https://i.ibb.co/qMyZQHYg/logo-sin-fondo-1.png";

export default function CatalogoPublico() {
  const { stock } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'TODOS' | 'FARDO' | 'LOTE'>('TODOS');
  const [isPoliticasOpen, setIsPoliticasOpen] = useState(false);

  // Filter only items with stock
  const availableStock = useMemo(() => {
    return stock.filter(item => item.stockActual > 0);
  }, [stock]);

  const filteredStock = useMemo(() => {
    return availableStock.filter(item => {
      const matchesSearch = smartSearchMatch(item, searchTerm);
      
      const itemCategory = item.categoria || 'FARDO';
      const matchesFilter = activeFilter === 'TODOS' || itemCategory === activeFilter;
      
      return matchesSearch && matchesFilter;
    }).sort((a, b) => (a.tipo || '').localeCompare(b.tipo || ''));
  }, [availableStock, searchTerm, activeFilter]);

  const handleWhatsAppInquiry = (item: any) => {
    const message = `Hola! Me interesa el producto: ${item.tipo} (${item.codigo}). ¿Tienen disponibilidad?`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/56964035464?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-100">      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Logo" className="w-10 h-10" />
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">CATÁLOGO MDF</h1>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Stock en Tiempo Real</p>
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
              placeholder="¿Qué estás buscando hoy?"
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

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {(['TODOS', 'FARDO', 'LOTE'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`whitespace-nowrap px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  activeFilter === filter 
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 scale-105' 
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {filter === 'TODOS' ? 'Todo' : filter === 'FARDO' ? 'Fardos' : 'Lotes'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-6 space-y-8">
        {filteredStock.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredStock.map((item) => (
              <div 
                key={item.id} 
                className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col group active:scale-[0.98] transition-transform"
              >
                <div className="p-6 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <Hash size={10} /> {item.codigo}
                      </div>
                      <h3 className="text-lg font-black text-slate-900 uppercase italic leading-tight">{item.tipo}</h3>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                      item.categoria === 'LOTE' ? 'bg-amber-100 text-amber-700' : 
                      item.unidad === 'FARDO' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.unidad} {item.peso && item.categoria === 'LOTE' ? `(${item.peso}KG)` : ''}
                    </span>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Precio Sugerido</p>
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
                
                <button 
                  onClick={() => handleWhatsAppInquiry(item)}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <MessageCircle size={18} /> Consultar por WhatsApp
                </button>
              </div>
            ))}
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
