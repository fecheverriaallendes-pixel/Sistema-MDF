import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  Share2, 
  Layers, 
  Tag, 
  Scale, 
  Calendar, 
  Ruler, 
  Users, 
  Package, 
  MessageCircle,
  Edit3
} from 'lucide-react';
import { StockItem } from '../types';
import { 
  formatFardoPitchWhatsApp, 
  getSeasonBadgeStyle, 
  getQualityBadgeStyle,
  parseTemporadas,
  formatSeasonDisplay
} from '../utils/productCharacteristics';

interface ProductFichaModalProps {
  item: StockItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (item: StockItem) => void;
  canEdit?: boolean;
}

export const ProductFichaModal: React.FC<ProductFichaModalProps> = ({
  item,
  isOpen,
  onClose,
  onEdit,
  canEdit = false
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !item) return null;

  const seasonsList = parseTemporadas(item.temporada);
  const temporadaDisplay = seasonsList.length > 0 ? formatSeasonDisplay(item.temporada) : 'Sin especificar';
  const generoSegmento = item.generoSegmento || item.estilo || 'Sin especificar';
  const calidad = item.calidad || 'Sin especificar';
  const tallas = item.tallas || 'Sin especificar';
  const pesoVal = item.pesoKg || item.peso;
  const peso = pesoVal ? `${pesoVal} KG APROX` : 'Sin especificar';
  const descripcion = item.descripcion || 'Sin descripción registrada por ahora. Puedes agregarla editando el producto en Inventario Stock.';
  const consejo = item.consejoVenta || 'Sin advertencias específicas registradas.';
  const piezas = item.piezasAprox;
  const detalles = item.detallesPrendas;

  const qualityStyle = getQualityBadgeStyle(item.calidad);

  const handleCopy = () => {
    const pitch = formatFardoPitchWhatsApp(item);
    navigator.clipboard.writeText(pitch).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleWhatsAppShare = () => {
    const pitch = formatFardoPitchWhatsApp(item);
    const encoded = encodeURIComponent(pitch);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-[36px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 relative">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white/10 text-white text-[10px] font-black uppercase tracking-wider rounded-full border border-white/15">
                {item.codigo}
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider rounded-full border border-emerald-400/20">
                {item.proveedor}
              </span>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-wider rounded-full border border-blue-400/20">
                {item.unidad || 'FARDO'}
              </span>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full text-slate-300 hover:text-white transition-colors"
            >
              <X size={22} />
            </button>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight italic mt-3 leading-tight">
            {item.tipo}
          </h2>

          <div className="flex items-baseline gap-3 mt-3">
            <span className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tighter">
              ${item.precioSugerido?.toLocaleString('es-CL')}
            </span>
            <span className="text-xs text-slate-400 font-bold uppercase">
              • Stock: {item.stockActual} unidades disponibles
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          
          {/* Characteristic Chips Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            
            {/* Temporada */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <Calendar size={13} className="text-blue-500" /> {seasonsList.length > 1 ? 'Temporadas' : 'Temporada'}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {seasonsList.length > 0 ? (
                  seasonsList.map((s) => {
                    const st = getSeasonBadgeStyle(s);
                    return (
                      <span 
                        key={s} 
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider border shadow-xs ${st.bg} ${st.text} ${st.border}`}
                      >
                        <span>{st.icon}</span>
                        <span>{s}</span>
                      </span>
                    );
                  })
                ) : (
                  <span className="font-black text-xs text-slate-400 uppercase">Sin especificar</span>
                )}
              </div>
            </div>

            {/* Tallas / Rango de Edad */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <Ruler size={13} className="text-purple-500" /> Tallas / Edades
              </div>
              <span className="mt-1 font-black text-xs text-slate-900 uppercase leading-snug">
                {tallas}
              </span>
            </div>

            {/* Peso */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <Scale size={13} className="text-emerald-500" /> Peso Real
              </div>
              <span className="mt-1 font-black text-xs text-slate-900 uppercase">
                {peso}
              </span>
            </div>

            {/* Género / Segmento */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <Users size={13} className="text-amber-500" /> Género / Segmento
              </div>
              <span className="mt-1 font-black text-xs text-slate-900 uppercase">
                {generoSegmento}
              </span>
            </div>

            {/* Calidad */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <ShieldCheck size={13} className="text-indigo-500" /> Calidad
              </div>
              <span className="mt-1 font-black text-xs text-slate-900 uppercase">
                {calidad}
              </span>
            </div>

            {/* Cantidad aprox */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <Package size={13} className="text-teal-500" /> Prendas / Unidades
              </div>
              <span className="mt-1 font-black text-xs text-slate-900 uppercase">
                {piezas || 'Surtido Estándar'}
              </span>
            </div>

          </div>

          {/* Descripción Detallada del Fardo */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
              <Sparkles size={16} className="text-indigo-600" />
              <span>¿Qué trae realmente este producto? (Descripción)</span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-line">
              {descripcion}
            </p>
            {detalles && (
              <div className="pt-2 mt-2 border-t border-slate-200/70 text-xs text-slate-600">
                <strong className="text-slate-800">Prendas y detalles específicos: </strong>
                {detalles}
              </div>
            )}
          </div>

          {/* Guía y Tip para Vendedoras (Evitar Reclamos Postventa) */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-amber-900 uppercase tracking-wider">
              <AlertTriangle size={16} className="text-amber-600 shrink-0" />
              <span>Guía para la Vendedora (Evitar reclamos en Post-Venta)</span>
            </div>
            <p className="text-xs text-amber-800 font-medium leading-relaxed">
              {consejo}
            </p>
            <div className="pt-2 text-[10px] font-bold text-amber-700/90 italic">
              ℹ️ Vender con información transparente reduce devoluciones y fideliza al cliente.
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleCopy}
              className={`flex-1 w-full sm:w-auto py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
                copied 
                  ? 'bg-slate-900 text-white animate-bounce' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
              }`}
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              {copied ? '¡Ficha Copiada al Portapapeles!' : 'Copiar Ficha para Cliente'}
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="w-full sm:w-auto py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 active:scale-95"
            >
              <MessageCircle size={16} />
              Enviar por WhatsApp
            </button>

            {canEdit && onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(item);
                }}
                className="w-full sm:w-auto py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-slate-200"
              >
                <Edit3 size={16} />
                Editar Ficha
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default ProductFichaModal;
