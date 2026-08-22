import React, { useState } from 'react';
import { X, Video, Moon, Sparkles, Calendar, Users, DollarSign, CheckCircle2, Tv, Flame } from 'lucide-react';
import { StaffMember, TikTokLiveRecord } from '../../types';

interface TikTokLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffMember[];
  onSaveSingle: (live: Omit<TikTokLiveRecord, 'id' | 'total' | 'createdAt'>) => Promise<void>;
  onSaveMultiple: (lives: Omit<TikTokLiveRecord, 'id' | 'total' | 'createdAt'>[]) => Promise<void>;
  defaultWorkerId?: string;
  defaultSemanaPago?: string;
}

const THEME_PRESETS = [
  { label: 'Live Nocturno Ventas & Fardos', desc: 'Transmisión nocturna regular de venta de fardos' },
  { label: 'Live Especial Remates TikTok', desc: 'Live de remates y promociones por pieza/fardo' },
  { label: 'Live Apertura de Contenedor / Nuevos Ingresos', desc: 'Transmisión en vivo mostrando mercadería recién llegada' },
  { label: 'Live VIP / Cierre de Semana', desc: 'Venta especial en vivo fin de semana' },
];

export default function TikTokLiveModal({
  isOpen,
  onClose,
  staffList,
  onSaveSingle,
  onSaveMultiple,
  defaultWorkerId,
  defaultSemanaPago
}: TikTokLiveModalProps) {
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>(defaultWorkerId ? [defaultWorkerId] : []);
  const [cantidadNoches, setCantidadNoches] = useState('1');
  const [valorNoche, setValorNoche] = useState('15000');
  const [tema, setTema] = useState('Live Nocturno Ventas & Fardos');
  const [observacion, setObservacion] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const toggleWorker = (id: string) => {
    if (selectedWorkers.includes(id)) {
      setSelectedWorkers(selectedWorkers.filter(w => w !== id));
    } else {
      setSelectedWorkers([...selectedWorkers, id]);
    }
  };

  const selectAllSellers = () => {
    const sellers = staffList.filter(s => s.rol === 'Vendedora' || s.rol === 'Vendedor' || s.rol === 'Administrador');
    setSelectedWorkers(sellers.map(s => s.id));
  };

  const selectAllActive = () => {
    const actives = staffList.filter(s => s.activo !== false);
    setSelectedWorkers(actives.map(s => s.id));
  };

  const clearSelection = () => {
    setSelectedWorkers([]);
  };

  const cantNum = Number(cantidadNoches) || 1;
  const valNum = Number(valorNoche) || 15000;
  const totalPerWorker = cantNum * valNum;
  const totalGeneral = totalPerWorker * selectedWorkers.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedWorkers.length === 0) {
      alert('Por favor selecciona al menos a un trabajador que participó en el Live.');
      return;
    }
    if (cantNum <= 0 || valNum <= 0) {
      alert('Por favor ingresa cantidad de noches y valor válidos.');
      return;
    }

    setIsSaving(true);
    try {
      if (selectedWorkers.length === 1) {
        const worker = staffList.find(s => s.id === selectedWorkers[0]);
        if (!worker) return;
        await onSaveSingle({
          workerId: worker.id,
          workerName: worker.nombre,
          fecha,
          cantidadNoches: cantNum,
          valorNoche: valNum,
          tema: tema.trim() || 'Live TikTok Nocturno',
          observacion: observacion.trim() || undefined,
          semanaPago: defaultSemanaPago,
          liquidado: false
        });
      } else {
        const lives = selectedWorkers.map(wid => {
          const worker = staffList.find(s => s.id === wid);
          return {
            workerId: wid,
            workerName: worker ? worker.nombre : 'Trabajador',
            fecha,
            cantidadNoches: cantNum,
            valorNoche: valNum,
            tema: tema.trim() || 'Live TikTok Nocturno',
            observacion: observacion.trim() || undefined,
            semanaPago: defaultSemanaPago,
            liquidado: false
          };
        });
        await onSaveMultiple(lives);
      }
      onClose();
    } catch (error) {
      console.error('Error al guardar noche de TikTok Live:', error);
      alert('Ocurrió un error al guardar la noche de TikTok Live.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white w-full max-w-2xl rounded-[32px] shadow-2xl border border-slate-700/60 overflow-hidden my-6">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950/60 p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Moon className="text-cyan-400 fill-cyan-400/20" size={22} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  TikTok Live Nocturno
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  $15.000 / noche
                </span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight mt-0.5">
                Registrar Noche de Live TikTok
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700/50"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* 1. SELECCIÓN DE TRABAJADORES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Users size={14} className="text-cyan-400" />
                1. Seleccionar Personal que participó ({selectedWorkers.length} seleccionado{selectedWorkers.length === 1 ? '' : 's'})
              </label>

              <div className="flex items-center gap-1.5 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={selectAllSellers}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
                >
                  Vendedoras
                </button>
                <button
                  type="button"
                  onClick={selectAllActive}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
                >
                  Todos Activos
                </button>
                {selectedWorkers.length > 0 && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="px-2 py-1 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* GRID DE TRABAJADORES */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-950/60 rounded-2xl border border-slate-800">
              {staffList
                .filter(s => s.activo !== false)
                .map(worker => {
                  const isSelected = selectedWorkers.includes(worker.id);
                  return (
                    <button
                      key={worker.id}
                      type="button"
                      onClick={() => toggleWorker(worker.id)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all border ${
                        isSelected
                          ? 'bg-gradient-to-r from-rose-950/80 to-purple-950/80 border-rose-500/60 text-white shadow-md'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                          isSelected ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isSelected ? <CheckCircle2 size={15} /> : worker.nombre.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black truncate text-slate-200 leading-tight">
                          {worker.nombre}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate uppercase">
                          {worker.rol}
                        </p>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* 2. PRESETS DE TEMA / TIPO DE LIVE */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Tv size={14} className="text-rose-400" />
              2. Tema o Concepto del Live TikTok
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {THEME_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTema(p.label)}
                  className={`p-2.5 rounded-xl text-left transition-all border text-xs ${
                    tema === p.label
                      ? 'bg-slate-800 border-rose-500/60 text-white'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <p className="font-black text-slate-200">{p.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{p.desc}</p>
                </button>
              ))}
            </div>
            <input
              type="text"
              value={tema}
              onChange={e => setTema(e.target.value)}
              placeholder="O escribe un concepto personalizado..."
              className="w-full mt-2 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          {/* 3. PARÁMETROS ECONÓMICOS & FECHA */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1 flex items-center gap-1.5">
                <Calendar size={13} className="text-slate-400" /> Fecha del Live
              </label>
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1 flex items-center gap-1.5">
                <Moon size={13} className="text-indigo-400" /> Cantidad Noches
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={cantidadNoches}
                onChange={e => setCantidadNoches(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1 flex items-center gap-1.5">
                <DollarSign size={13} className="text-emerald-400" /> Pago por Noche (CLP)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={valorNoche}
                onChange={e => setValorNoche(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-emerald-400 outline-none focus:border-rose-500 transition-colors"
              />
            </div>
          </div>

          {/* OBSERVACIÓN */}
          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1">
              Observaciones o Detalle Extra (Opcional)
            </label>
            <input
              type="text"
              value={observacion}
              onChange={e => setObservacion(e.target.value)}
              placeholder="Ej: Horario 21:00 a 01:00 hrs, cumplió meta de ventas en vivo..."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-slate-300 placeholder-slate-600 outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          {/* RESUMEN TOTAL */}
          <div className="bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-cyan-950/40 p-4 rounded-2xl border border-rose-500/30 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-black text-rose-300 flex items-center gap-1.5">
                <Flame size={14} className="text-rose-400 animate-pulse" />
                Resumen de Liquidación Live TikTok
              </p>
              <p className="text-xs text-slate-300 mt-0.5">
                {selectedWorkers.length} trabajador{selectedWorkers.length === 1 ? '' : 'es'} × {cantNum} noche{cantNum === 1 ? '' : 's'} a ${valNum.toLocaleString('es-CL')}/noche
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total a Liquidar</span>
              <span className="text-xl font-black text-emerald-400">
                ${totalGeneral.toLocaleString('es-CL')}
              </span>
            </div>
          </div>

          {/* ACCIONES */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-xs uppercase tracking-wider transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || selectedWorkers.length === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Video size={16} />
                  <span>
                    Guardar Live TikTok ({selectedWorkers.length > 1 ? `${selectedWorkers.length} Trabajadores` : '1 Trabajador'})
                  </span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
