import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  Package,
  Tag,
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
} from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { StockItem } from '../types';
import { smartSearchMatch } from '../utils/search';
import { PoliticasModal, PoliticasSectionInline } from '../components/PoliticasModal';
import { ProductFichaModal } from '../components/ProductFichaModal';
import { BlackFridayLogo } from '../components/BlackFridayLogo';
import {
  getSeasonBadgeStyle,
  TEMPORADAS_OPTIONS,
  parseTemporadas,
  matchesSeason,
  formatSeasonDisplay,
} from '../utils/productCharacteristics';
import {
  BLACK_FRIDAY_ACTIVE,
  getBlackFridayOffer,
  getBlackFridayStats,
} from '../utils/blackFridayOffers';

const LOGO_LOCAL = '/assets/mdf-logo.png';
const LOGO_FALLBACK = 'https://i.ibb.co/qMyZQHYg/logo-sin-fondo-1.png';

export default function CatalogoPublico() {
  const { stock } = useStore();
  const location = useLocation();
  const initialOnlyBF = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('blackfriday') === '1' || params.get('oferta') === 'black-friday';
  }, [location.search]);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'TODOS' | 'FARDO' | 'LOTE'>('TODOS');
  const [onlyBlackFriday, setOnlyBlackFriday] = useState<boolean>(initialOnlyBF);
  const [temporadaFilter, setTemporadaFilter] = useState<string>('TODOS');
  const [providerFilter, setProviderFilter] = useState<string>('TODOS');
  const [isPoliticasOpen, setIsPoliticasOpen] = useState(false);
  const [selectedFichaItem, setSelectedFichaItem] = useState<StockItem | null>(null);
  const [logoSrc, setLogoSrc] = useState(LOGO_LOCAL);

  // Filter only items with stock
  const availableStock = useMemo(() => {
    return stock.filter((item) => item.stockActual > 0);
  }, [stock]);

  // Black Friday stats over currently available stock
  const bfStats = useMemo(() => getBlackFridayStats(availableStock), [availableStock]);

  // Lista única de proveedores para el catálogo público
  const uniqueProviders = useMemo(() => {
    const providers = availableStock
      .map((item) => (item.proveedor || '').trim().toUpperCase())
      .filter(Boolean);
    return ['TODOS', ...Array.from(new Set(providers))].sort();
  }, [availableStock]);

  const filteredStock = useMemo(() => {
    return availableStock
      .filter((item) => {
        const matchesSearch = smartSearchMatch(item, searchTerm);
        const bfOffer = getBlackFridayOffer(item);
        if (onlyBlackFriday && !bfOffer) return false;

        const itemCategory = item.categoria || 'FARDO';
        const matchesFilter = activeFilter === 'TODOS' || itemCategory === activeFilter;

        const matchesTemporada =
          temporadaFilter === 'TODOS' || matchesSeason(item.temporada, temporadaFilter);

        const matchesProvider =
          providerFilter === 'TODOS' || (item.proveedor || '').toUpperCase() === providerFilter;

        return matchesSearch && matchesFilter && matchesTemporada && matchesProvider;
      })
      .sort((a, b) => {
        // Priorizar ofertas Black Friday al principio del catálogo
        const aOffer = getBlackFridayOffer(a) ? 1 : 0;
        const bOffer = getBlackFridayOffer(b) ? 1 : 0;
        if (aOffer !== bOffer) return bOffer - aOffer;
        return (a.tipo || '').localeCompare(b.tipo || '');
      });
  }, [availableStock, searchTerm, activeFilter, onlyBlackFriday, temporadaFilter, providerFilter]);

  const handleWhatsAppInquiry = (item: StockItem) => {
    const bfOffer = getBlackFridayOffer(item);
    let details = '';
    if (bfOffer) {
      details += `\n• Oferta Black Friday (-${bfOffer.porcentajeDescuento}%): $${bfOffer.precioOferta.toLocaleString('es-CL')} (antes $${bfOffer.precioOriginal.toLocaleString('es-CL')})`;
      if (bfOffer.promoExtra) details += `\n• Promo especial: ${bfOffer.promoExtra}`;
    } else {
      details += `\n• Precio: $${item.precioSugerido.toLocaleString('es-CL')}`;
    }
    if (item.temporada) details += `\n• Temporada: ${formatSeasonDisplay(item.temporada)}`;
    const gen = item.generoSegmento || item.estilo;
    if (gen) details += `\n• Género/Segmento: ${gen}`;
    if (item.tallas) details += `\n• Tallas/Edades: ${item.tallas}`;
    const pesoVal = item.pesoKg || item.peso;
    if (pesoVal) details += `\n• Peso: ${pesoVal} KG`;

    const intro = bfOffer
      ? `Hola! Me interesa la oferta BLACK FRIDAY del fardo: ${item.tipo} (${item.codigo})`
      : `Hola! Me interesa el fardo: ${item.tipo} (${item.codigo})`;

    const message = `${intro}${details}\n¿Tienen disponibilidad para despacho?`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/56964035464?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-amber-100">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={logoSrc}
              alt="Logo El Mundo del Fardo"
              referrerPolicy="no-referrer"
              onError={() => {
                if (logoSrc !== LOGO_FALLBACK) setLogoSrc(LOGO_FALLBACK);
              }}
              className="w-10 h-10 rounded-full object-contain shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase leading-none truncate">
                El Mundo del Fardo
              </h1>
              <p className="text-[11px] font-semibold text-slate-500 mt-1 truncate">
                Catálogo Oficial · Stock en Tiempo Real
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {BLACK_FRIDAY_ACTIVE && bfStats.count > 0 && (
              <button
                type="button"
                onClick={() => setOnlyBlackFriday((prev) => !prev)}
                className={`flex items-center gap-2 pr-3 pl-1 py-1 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${
                  onlyBlackFriday
                    ? 'bg-zinc-950 text-amber-300 border-amber-400 ring-2 ring-amber-400/60'
                    : 'bg-zinc-950 hover:bg-zinc-900 text-amber-300 border-amber-400/40'
                }`}
                title="Mostrar solo ofertas Black Friday"
              >
                <BlackFridayLogo size="xs" />
                <span>Black Friday</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsPoliticasOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap shrink-0"
            >
              <ShieldAlert size={14} className="text-emerald-400" />
              <span className="hidden sm:inline">Políticas</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero, Black Friday Banner & Search */}
      <div className="bg-white px-4 sm:px-6 pb-6 pt-5 border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto space-y-4">
          {/* Black Friday Campaign Hero Banner */}
          {BLACK_FRIDAY_ACTIVE && bfStats.count > 0 && (
            <section className="bg-zinc-950 text-white rounded-3xl border border-amber-400/40 p-4 sm:p-5 shadow-lg shadow-zinc-950/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <BlackFridayLogo size="lg" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">
                    Evento Especial · El Mundo del Fardo
                  </p>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight mt-0.5">
                    Ofertas Black Friday
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-300 font-medium mt-1 tabular-nums">
                    {bfStats.count} fardos rebajados · Hasta{' '}
                    <span className="text-amber-300 font-extrabold">
                      {bfStats.maxDiscountPercent}% OFF
                    </span>{' '}
                    y packs 3x $100.000
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOnlyBlackFriday((prev) => !prev)}
                className={`px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${
                  onlyBlackFriday
                    ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                    : 'bg-amber-400 hover:bg-amber-300 text-zinc-950 shadow-md shadow-amber-400/20'
                }`}
              >
                {onlyBlackFriday
                  ? 'Ver Catálogo Completo'
                  : `Black Friday (${bfStats.count})`}
              </button>
            </section>
          )}

          {/* Search & Policy row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
            <div className="relative group md:col-span-7">
              <Search
                className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors"
                size={19}
              />
              <input
                type="text"
                placeholder="Buscar por prenda, temporada (invierno/verano), código..."
                className="w-full h-full pl-12 pr-5 py-3.5 bg-slate-50 rounded-2xl border border-slate-200 focus:border-slate-900 focus:bg-white outline-none transition-all font-medium text-sm text-slate-900 placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={() => setIsPoliticasOpen(true)}
              className="md:col-span-5 px-4 py-3 bg-slate-900 text-white rounded-2xl flex items-center justify-between text-left hover:bg-slate-800 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
                  <ShieldAlert size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300 truncate">
                    Garantías y Devoluciones
                  </p>
                  <p className="text-xs font-extrabold text-emerald-400 leading-tight truncate">
                    Ver Políticas de Mercadería
                  </p>
                </div>
              </div>
              <ChevronRight
                size={18}
                className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0"
              />
            </button>
          </div>

          {/* Primary Type & Black Friday Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {BLACK_FRIDAY_ACTIVE && bfStats.count > 0 && (
              <button
                type="button"
                onClick={() => setOnlyBlackFriday((prev) => !prev)}
                className={`whitespace-nowrap shrink-0 pl-1.5 pr-4 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                  onlyBlackFriday
                    ? 'bg-zinc-950 text-amber-300 ring-2 ring-amber-400 shadow-md'
                    : 'bg-zinc-900 text-white border border-amber-400/40 hover:bg-zinc-800'
                }`}
              >
                <BlackFridayLogo size="xs" />
                <span>Black Friday ({bfStats.count})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setActiveFilter('TODOS');
                setOnlyBlackFriday(false);
              }}
              className={`whitespace-nowrap shrink-0 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                activeFilter === 'TODOS' && !onlyBlackFriday
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              Todo ({availableStock.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('FARDO')}
              className={`whitespace-nowrap shrink-0 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                activeFilter === 'FARDO'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              Fardos
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('LOTE')}
              className={`whitespace-nowrap shrink-0 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                activeFilter === 'LOTE'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              Lotes
            </button>
          </div>

          {/* Season & Provider Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Season filters */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} className="text-emerald-600" /> Temporada
                </span>
                {temporadaFilter !== 'TODOS' && (
                  <button
                    type="button"
                    onClick={() => setTemporadaFilter('TODOS')}
                    className="text-emerald-700 hover:underline font-bold"
                  >
                    Todas
                  </button>
                )}
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {['TODOS', ...TEMPORADAS_OPTIONS].map((temp) => (
                  <button
                    key={temp}
                    type="button"
                    onClick={() => setTemporadaFilter(temp)}
                    className={`whitespace-nowrap shrink-0 px-3 py-1.5 rounded-lg font-bold text-[11px] uppercase tracking-wide transition-colors ${
                      temporadaFilter === temp
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {temp === 'TODOS' ? 'Todas' : temp}
                  </button>
                ))}
              </div>
            </div>

            {/* Provider / Origen filters */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Truck size={12} className="text-indigo-600" /> Proveedor / Origen
                </span>
                {providerFilter !== 'TODOS' && (
                  <button
                    type="button"
                    onClick={() => setProviderFilter('TODOS')}
                    className="text-indigo-700 hover:underline font-bold"
                  >
                    Todos
                  </button>
                )}
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {uniqueProviders.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProviderFilter(p)}
                    className={`whitespace-nowrap shrink-0 px-3 py-1.5 rounded-lg font-bold text-[11px] uppercase tracking-wide transition-colors ${
                      providerFilter === p
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {p === 'TODOS' ? 'Todos' : p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          {(searchTerm ||
            onlyBlackFriday ||
            activeFilter !== 'TODOS' ||
            temporadaFilter !== 'TODOS' ||
            providerFilter !== 'TODOS') && (
            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
              <div className="text-xs font-bold text-slate-600 tabular-nums">
                Mostrando {filteredStock.length} de {availableStock.length} disponibles
                {onlyBlackFriday ? ' · Solo ofertas Black Friday' : ''}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setOnlyBlackFriday(false);
                  setActiveFilter('TODOS');
                  setTemporadaFilter('TODOS');
                  setProviderFilter('TODOS');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors whitespace-nowrap"
              >
                <RotateCcw size={12} /> Limpiar Filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {filteredStock.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredStock.map((item) => {
              const bfOffer = getBlackFridayOffer(item);
              const temporadasList = parseTemporadas(item.temporada);
              const tallas = item.tallas || 'A consultar';
              const pesoVal = item.pesoKg || item.peso;
              const peso = pesoVal ? `${pesoVal} KG APROX` : 'A consultar';
              const genero = item.generoSegmento || item.estilo || 'A consultar';
              const calidad = item.calidad || 'A consultar';
              const descripcion = item.descripcion;

              return (
                <article
                  key={item.id}
                  className={`bg-white rounded-3xl overflow-hidden flex flex-col justify-between transition-all ${
                    bfOffer
                      ? 'border-2 border-zinc-900 shadow-lg shadow-zinc-900/10 ring-1 ring-amber-400/40'
                      : 'border border-slate-200/90 shadow-sm'
                  }`}
                >
                  <div>
                    {/* Black Friday Card Banner Strip */}
                    {bfOffer && (
                      <div className="bg-zinc-950 px-5 py-2.5 flex items-center justify-between gap-3 border-b border-amber-400/35">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <BlackFridayLogo size="xs" />
                          <div className="flex flex-col leading-none">
                            <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest">
                              Oferta Black Friday
                            </span>
                            <span className="text-[10px] font-semibold text-zinc-400 mt-0.5 tabular-nums">
                              Ahorras ${bfOffer.ahorro.toLocaleString('es-CL')}
                            </span>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 bg-amber-400 text-zinc-950 rounded-lg text-xs font-black tracking-tight tabular-nums whitespace-nowrap shrink-0">
                          -{bfOffer.porcentajeDescuento}% OFF
                        </span>
                      </div>
                    )}

                    <div className="p-5 sm:p-6 flex flex-col space-y-4">
                      {/* Top Row: Code, Unit, Season */}
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <Hash size={11} className="shrink-0" />
                            <span className="truncate">
                              {item.codigo} · {item.proveedor}
                            </span>
                          </div>
                          <h3 className="text-lg font-black text-slate-900 uppercase italic leading-snug">
                            {item.tipo}
                          </h3>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {temporadasList.length > 0 && (
                            <div className="flex flex-wrap gap-1 justify-end">
                              {temporadasList.map((t) => {
                                const st = getSeasonBadgeStyle(t);
                                return (
                                  <span
                                    key={t}
                                    className={`text-[10px] font-bold uppercase tracking-wide ${st.text}`}
                                  >
                                    {t}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {item.unidad}
                          </span>
                        </div>
                      </div>

                      {/* Characteristics Summary Grid */}
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex flex-col">
                          <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                            <Ruler size={11} className="text-purple-500 shrink-0" /> Tallas / Edades
                          </span>
                          <span className="text-slate-900 uppercase mt-0.5 font-bold truncate">
                            {tallas}
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex flex-col">
                          <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                            <Scale size={11} className="text-emerald-600 shrink-0" /> Peso Real
                          </span>
                          <span className="text-slate-900 uppercase mt-0.5 font-bold tabular-nums">
                            {peso}
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex flex-col">
                          <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                            <Users size={11} className="text-amber-600 shrink-0" /> Género / Segmento
                          </span>
                          <span className="text-slate-900 uppercase mt-0.5 font-bold truncate">
                            {genero}
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex flex-col">
                          <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                            <Tag size={11} className="text-indigo-500 shrink-0" /> Calidad
                          </span>
                          <span className="text-slate-900 uppercase mt-0.5 font-bold truncate">
                            {calidad}
                          </span>
                        </div>
                      </div>

                      {/* Descripción de qué trae realmente el producto */}
                      {descripcion && (
                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                            <Sparkles size={12} className="text-indigo-600 shrink-0" />
                            <span>¿Qué trae realmente este fardo?</span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed">
                            {descripcion}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    {/* Price & Stock Block */}
                    <div
                      className={`px-5 sm:px-6 py-4 border-t flex items-end justify-between gap-3 ${
                        bfOffer
                          ? 'bg-amber-50/60 border-amber-200/80'
                          : 'bg-white border-slate-100'
                      }`}
                    >
                      <div className="min-w-0">
                        {bfOffer ? (
                          <>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-extrabold text-zinc-700 uppercase tracking-wider">
                                Antes
                              </span>
                              <span className="text-base font-bold text-slate-400 line-through decoration-red-500/80 decoration-2 tabular-nums">
                                ${bfOffer.precioOriginal.toLocaleString('es-CL')}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
                              <p className="text-3xl sm:text-4xl font-black text-red-600 tracking-tighter leading-none tabular-nums">
                                ${bfOffer.precioOferta.toLocaleString('es-CL')}
                              </p>
                              <span className="text-[11px] font-extrabold text-zinc-900 uppercase">
                                Black Friday
                              </span>
                            </div>
                            {bfOffer.promoExtra && (
                              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-zinc-950 text-amber-300 rounded-lg border border-amber-400/40 text-xs font-black uppercase tracking-wide">
                                <span>Promo Pack</span>
                                <span className="text-white tabular-nums">{bfOffer.promoExtra}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                              Precio Sugerido
                            </p>
                            <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none tabular-nums">
                              ${item.precioSugerido.toLocaleString('es-CL')}
                            </p>
                          </>
                        )}
                      </div>

                      <div
                        className={`flex flex-col items-center px-3.5 py-2 rounded-2xl shrink-0 tabular-nums ${
                          item.stockActual > 5
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-orange-50 text-orange-700 border border-orange-200/60'
                        }`}
                      >
                        <span className="text-xl font-black leading-none">{item.stockActual}</span>
                        <span className="text-[9px] font-bold uppercase mt-1">Disponibles</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 divide-x divide-slate-200/80 border-t border-slate-200/80">
                      <button
                        type="button"
                        onClick={() => setSelectedFichaItem(item)}
                        className="py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        <FileText size={14} className="text-indigo-600 shrink-0" /> Ver Ficha
                      </button>

                      <button
                        type="button"
                        onClick={() => handleWhatsAppInquiry(item)}
                        className={`py-3.5 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                          bfOffer
                            ? 'bg-zinc-950 hover:bg-zinc-800 text-amber-300'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <MessageCircle size={15} className="shrink-0" /> Consultar WhatsApp
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center px-6">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-6">
              <Package size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase italic mb-2">
              No se encontraron productos
            </h3>
            <p className="text-slate-500 text-sm font-medium">
              Intenta buscando con otros términos o limpiando los filtros activos.
            </p>
          </div>
        )}

        {/* Inline Policies Section */}
        <PoliticasSectionInline />
      </main>

      {/* Modal Ficha Técnica (Vista para Clientes: sin tips internos de venta) */}
      <ProductFichaModal
        item={selectedFichaItem}
        isOpen={Boolean(selectedFichaItem)}
        onClose={() => setSelectedFichaItem(null)}
        isPublic={true}
        hideSellerGuide={true}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-10 px-6 text-center">
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.35em] mb-3">
          EL MUNDO DEL FARDO · CHILE
        </p>
        <div className="flex items-center justify-center gap-2 text-slate-400 mb-3">
          <AlertCircle size={15} />
          <p className="text-xs font-medium">
            Los precios Black Friday y el stock están sujetos a disponibilidad en bodega
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsPoliticasOpen(true)}
          className="text-xs font-bold text-emerald-700 hover:underline uppercase tracking-wider"
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
