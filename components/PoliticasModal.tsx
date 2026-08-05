import React from 'react';
import { 
  X, 
  ShieldAlert, 
  FileText, 
  Video, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Scale,
  Sparkles
} from 'lucide-react';

interface PoliticasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PoliticasModal: React.FC<PoliticasModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col my-auto">
        {/* Modal Header */}
        <div className="p-6 sm:p-8 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-20 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight italic">Políticas de Cambios y Devoluciones</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Cuaderno MDF • Términos y Garantías</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 rounded-2xl transition-all"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-700 text-sm font-medium leading-relaxed">
          
          {/* Garantía Comercial y Marco Legal */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wider">
              <Scale size={16} className="text-emerald-600" />
              <span>Garantía Comercial y Marco Legal</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Debido a que somos una empresa importadora de ropa usada y nuestros fardos vienen cerrados desde el extranjero, la garantía comercial se limita exclusivamente a errores de etiquetados, errores de envío y mermas superiores a las informadas en estas políticas. Destacamos que la garantía no asegura la devolución total del dinero, ya que el artículo 14 de la Ley N.º 19.496 establece que cuando se informa previamente al consumidor que el producto es usado, se eximirá al proveedor de las obligaciones derivadas del derecho de opción establecido en los artículos 19 y 20 (Ley N.º 19.496, 1997, art. 14).
            </p>
          </div>

          {/* Composición de Fardos */}
          <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200/70 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wider">
              <Sparkles size={16} className="text-amber-600" />
              <span>Composición Aleatoria (Sin cambios por gusto)</span>
            </div>
            <p className="text-xs text-amber-900/90 leading-relaxed">
              Cada saco, lote o fardo tiene una composición aleatoria: la variedad de tallas, modelos y marcas en su composición pueden variar y no hay un porcentaje exacto de las mismas. Por ende, esto <strong>no es un motivo de cambio ni devolución</strong>. Es decir, <strong>no hay cambios por gustos</strong>.
            </p>
          </div>

          {/* Porcentajes de Merma */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} className="text-emerald-600" />
              <span>Porcentaje de Merma Esperable según Calidad</span>
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-50 border border-emerald-200/80 p-3 rounded-2xl text-center">
                <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider block">Premium</span>
                <span className="text-xl font-black text-emerald-600 leading-tight">5%</span>
                <span className="text-[9px] text-emerald-800 font-bold block mt-0.5">Merma esperada</span>
              </div>
              <div className="bg-blue-50 border border-blue-200/80 p-3 rounded-2xl text-center">
                <span className="text-[10px] font-black uppercase text-blue-700 tracking-wider block">Primera</span>
                <span className="text-xl font-black text-blue-600 leading-tight">10%</span>
                <span className="text-[9px] text-blue-800 font-bold block mt-0.5">Merma esperada</span>
              </div>
              <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-2xl text-center">
                <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider block">Segunda</span>
                <span className="text-xl font-black text-amber-600 leading-tight">15%</span>
                <span className="text-[9px] text-amber-800 font-bold block mt-0.5">Merma esperada</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              Si la prenda excede el porcentaje esperado se valoriza cada prenda en exceso y se compensa a través de un ticket. Si esta excede el 50% se evalúa el caso y se llega a un acuerdo con el consumidor para realizar el cambio o devolución del producto como caso excepcional.
            </p>
          </div>

          {/* Requisito de Video de Apertura */}
          <div className="bg-indigo-50 border border-indigo-200/80 p-5 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-900 font-black text-xs uppercase tracking-wider">
              <Video size={16} className="text-indigo-600" />
              <span>Requisito Obligatorio: Video de Apertura</span>
            </div>
            <p className="text-xs text-indigo-950 leading-relaxed">
              La ropa usada ante la ley no tiene cambio ni devolución. Lo mínimo requerido para evaluar cualquier solicitud es el <strong>video abriendo el fardo de inicio a fin (sin excepciones)</strong>. Esto se solicita para corroborar que las prendas corresponden a nuestros fardos y evitar malos entendidos.
            </p>
          </div>

          {/* Causales de Anulación de Garantía */}
          <div className="bg-red-50/70 border border-red-200/80 p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-red-900 font-black text-xs uppercase tracking-wider">
              <AlertTriangle size={16} className="text-red-600" />
              <span>La Garantía Queda Sin Efecto Cuando:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                'Se lava la prenda',
                'Se interviene',
                'Se corta',
                'Se plancha industrialmente',
                'Se vende',
                'Se modifica'
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 bg-white/80 p-2.5 rounded-xl border border-red-100 text-xs text-red-950 font-bold">
                  <XCircle size={14} className="text-red-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Plazo de garantía */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest block">Plazo para Reclamos</span>
              <p className="text-xs font-bold leading-snug text-slate-200 mt-0.5">
                El plazo para hacer efectiva la garantía es de <strong className="text-white underline decoration-emerald-500 decoration-2">14 días posteriores a la entrega del fardo</strong>. Pasado ese plazo pierde el derecho a retracto.
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md active:scale-95"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export const PoliticasSectionInline: React.FC = () => {
  return (
    <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
          <ShieldAlert size={22} />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight italic">Políticas de Cambios y Devoluciones</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Información importante para nuestros clientes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium text-slate-700">
        
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
          <div className="flex items-center gap-2 font-black text-slate-900 uppercase text-[11px]">
            <Scale size={14} className="text-emerald-600" />
            <span>Garantía Comercial y Marco Legal</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Debido a que somos una empresa importadora de ropa usada y nuestros fardos vienen cerrados desde el extranjero, la garantía comercial se limita exclusivamente a errores de etiquetados, errores de envío y mermas superiores a las informadas en estas políticas. Destacando que la garantía no asegura la devolución total del dinero (Art. 14 de la Ley N.º 19.496).
          </p>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/60 space-y-2">
          <div className="flex items-center gap-2 font-black text-amber-900 uppercase text-[11px]">
            <Sparkles size={14} className="text-amber-600" />
            <span>Composición Aleatoria (Sin cambios por gustos)</span>
          </div>
          <p className="text-amber-900/90 leading-relaxed">
            Cada saco, lote o fardo tiene una composición aleatoria de tallas, modelos y marcas. Por ende esto <strong>no es un motivo de cambio ni devolución</strong> (no hay cambios por gustos).
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 md:col-span-2">
          <div className="flex items-center gap-2 font-black text-slate-900 uppercase text-[11px]">
            <FileText size={14} className="text-emerald-600" />
            <span>Porcentaje de Merma Esperable según Calidad</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 border border-emerald-200/60 p-2.5 rounded-xl text-center">
              <span className="text-[9px] font-black uppercase text-emerald-700 tracking-wider block">Premium</span>
              <span className="text-lg font-black text-emerald-600">5%</span>
            </div>
            <div className="bg-blue-50 border border-blue-200/60 p-2.5 rounded-xl text-center">
              <span className="text-[9px] font-black uppercase text-blue-700 tracking-wider block">Primera</span>
              <span className="text-lg font-black text-blue-600">10%</span>
            </div>
            <div className="bg-amber-50 border border-amber-200/60 p-2.5 rounded-xl text-center">
              <span className="text-[9px] font-black uppercase text-amber-700 tracking-wider block">Segunda</span>
              <span className="text-lg font-black text-amber-600">15%</span>
            </div>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Si la prenda excede el porcentaje esperado se valoriza cada prenda en exceso y se compensa a través de un ticket. Si excede el 50% se evalúa el caso para cambio o devolución excepcional.
          </p>
        </div>

        <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200/60 space-y-2">
          <div className="flex items-center gap-2 font-black text-indigo-900 uppercase text-[11px]">
            <Video size={14} className="text-indigo-600" />
            <span>Video de Apertura Obligatorio</span>
          </div>
          <p className="text-indigo-950 leading-relaxed">
            Se requiere obligatoriamente el <strong>video abriendo el fardo de inicio a fin (sin excepciones)</strong> para comprobar que las prendas corresponden a nuestros fardos.
          </p>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 font-black text-emerald-400 uppercase text-[11px]">
            <Clock size={14} />
            <span>Plazo de Garantía</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            El plazo para hacer efectiva la garantía es de <strong>14 días posteriores a la entrega del fardo</strong>. Pasado ese plazo se pierde el derecho a retracto.
          </p>
        </div>

        <div className="bg-red-50/70 p-4 rounded-2xl border border-red-200/60 space-y-2 md:col-span-2">
          <div className="flex items-center gap-2 font-black text-red-900 uppercase text-[11px]">
            <AlertTriangle size={14} className="text-red-600" />
            <span>Sin efecto de garantía si:</span>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            {['Se lava la prenda', 'Se interviene', 'Se corta', 'Se plancha industrialmente', 'Se vende', 'Se modifica'].map((item, i) => (
              <span key={i} className="px-2.5 py-1 bg-white border border-red-100 rounded-lg text-red-950 font-bold flex items-center gap-1">
                <XCircle size={12} className="text-red-500" /> {item}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
