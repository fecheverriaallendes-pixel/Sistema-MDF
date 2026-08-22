import React, { useState, useEffect } from 'react';
import {
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  User,
  Sparkles,
  Save,
  RotateCcw
} from 'lucide-react';
import { DayAttendance, WeeklyAttendance } from '../../types';

interface AsistenciaSemanalModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerId: string;
  workerName: string;
  cargo: string;
  sueldoBaseSemanal: number;
  semanaInicio: string; // Lunes DD/MM/YYYY
  semanaFin: string; // Sábado DD/MM/YYYY
  startDateObj: Date; // Monday Date object
  currentAttendance?: WeeklyAttendance;
  onSave: (attendance: Omit<WeeklyAttendance, 'id' | 'updatedAt'>) => Promise<void>;
}

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function AsistenciaSemanalModal({
  isOpen,
  onClose,
  workerId,
  workerName,
  cargo,
  sueldoBaseSemanal,
  semanaInicio,
  semanaFin,
  startDateObj,
  currentAttendance,
  onSave
}: AsistenciaSemanalModalProps) {
  const [dias, setDias] = useState<DayAttendance[]>([]);
  const [notas, setNotas] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    const baseDates: DayAttendance[] = DIAS_SEMANA.map((diaNombre, idx) => {
      const d = new Date(startDateObj);
      d.setDate(startDateObj.getDate() + idx);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const isoDate = `${yyyy}-${mm}-${dd}`;

      const existing = currentAttendance?.diasDetalle?.find(
        x => x.diaNombre === diaNombre || x.fecha === isoDate
      );

      if (existing) {
        return {
          diaNombre,
          fecha: isoDate,
          estado: existing.estado,
          valorFraccion: existing.valorFraccion,
          observacion: existing.observacion || ''
        };
      }

      return {
        diaNombre,
        fecha: isoDate,
        estado: 'COMPLETO',
        valorFraccion: 1.0,
        observacion: ''
      };
    });

    if (
      currentAttendance &&
      currentAttendance.diasTrabajados !== undefined &&
      currentAttendance.diasTrabajados < 6 &&
      (!currentAttendance.diasDetalle || currentAttendance.diasDetalle.length === 0)
    ) {
      let remaining = currentAttendance.diasTrabajados;
      for (let i = 0; i < 6; i++) {
        if (remaining >= 1.0) {
          baseDates[i].estado = 'COMPLETO';
          baseDates[i].valorFraccion = 1.0;
          remaining -= 1.0;
        } else if (remaining >= 0.5) {
          baseDates[i].estado = 'MEDIO_DIA';
          baseDates[i].valorFraccion = 0.5;
          remaining -= 0.5;
        } else {
          baseDates[i].estado = 'FALTA';
          baseDates[i].valorFraccion = 0.0;
        }
      }
    }

    setDias(baseDates);
    setNotas(currentAttendance?.notas || '');
  }, [isOpen, currentAttendance, startDateObj]);

  if (!isOpen) return null;

  const diasPactados = 6;
  const sueldoBasePactado = Number(sueldoBaseSemanal) || 120000;
  const valorDia = sueldoBasePactado > 0 ? Math.round(sueldoBasePactado / diasPactados) : 0;
  const valorMedioDia = Math.round(valorDia / 2);

  const diasTrabajados = dias.reduce((acc, d) => acc + (d.valorFraccion || 0), 0);
  const diasFaltas = Math.max(0, diasPactados - diasTrabajados);
  const descuentoFaltas = Math.round(diasFaltas * valorDia);
  const sueldoBaseAPagar = Math.max(0, Math.round(diasTrabajados * valorDia));

  const handleStateChange = (index: number, estado: 'COMPLETO' | 'MEDIO_DIA' | 'FALTA' | 'PERMISO_PAGADO') => {
    const updated = [...dias];
    let valorFraccion = 1.0;
    if (estado === 'MEDIO_DIA') valorFraccion = 0.5;
    if (estado === 'FALTA') valorFraccion = 0.0;
    if (estado === 'PERMISO_PAGADO') valorFraccion = 1.0;

    updated[index] = {
      ...updated[index],
      estado,
      valorFraccion
    };
    setDias(updated);
  };

  const handleNoteChange = (index: number, text: string) => {
    const updated = [...dias];
    updated[index] = {
      ...updated[index],
      observacion: text
    };
    setDias(updated);
  };

  const applyPreset = (presetDays: number) => {
    const updated = dias.map((d, i) => {
      let frac = 1.0;
      let est: 'COMPLETO' | 'MEDIO_DIA' | 'FALTA' = 'COMPLETO';
      if (presetDays === 6.0) {
        frac = 1.0;
        est = 'COMPLETO';
      } else if (presetDays === 5.5) {
        if (i === 5) {
          frac = 0.5;
          est = 'MEDIO_DIA';
        } else {
          frac = 1.0;
          est = 'COMPLETO';
        }
      } else if (presetDays === 5.0) {
        if (i === 5) {
          frac = 0.0;
          est = 'FALTA';
        } else {
          frac = 1.0;
          est = 'COMPLETO';
        }
      } else if (presetDays === 4.5) {
        if (i === 5) {
          frac = 0.0;
          est = 'FALTA';
        } else if (i === 4) {
          frac = 0.5;
          est = 'MEDIO_DIA';
        } else {
          frac = 1.0;
          est = 'COMPLETO';
        }
      } else if (presetDays === 4.0) {
        if (i >= 4) {
          frac = 0.0;
          est = 'FALTA';
        } else {
          frac = 1.0;
          est = 'COMPLETO';
        }
      }
      return {
        ...d,
        estado: est,
        valorFraccion: frac
      };
    });
    setDias(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        workerId,
        workerName,
        semanaInicio,
        semanaFin,
        fechaPago: semanaFin,
        diasTrabajados,
        diasFaltas,
        diasPactados,
        sueldoBasePactado,
        valorDia,
        descuentoFaltas,
        sueldoBaseAPagar,
        diasDetalle: dias,
        notas: notas.trim()
      });
      onClose();
    } catch (e) {
      console.error('Error al guardar asistencia:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black">
              <Calendar size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black uppercase tracking-tight">Registro de Asistencia Semanal</h3>
                <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-300 text-[10px] font-black rounded-full uppercase">
                  Base 6 Días
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Trabajador: <strong className="text-white uppercase">{workerName}</strong> ({cargo}) · Periodo: {semanaInicio} al {semanaFin}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-6 max-h-[80vh] overflow-y-auto bg-slate-50/50">
          
          {/* Base Rate Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-indigo-50/80 border border-indigo-100 rounded-2xl">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Sueldo Base Semanal (6 Días)</p>
              <p className="text-xl font-black text-slate-900">${sueldoBasePactado.toLocaleString('es-CL')}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Valor Día Completo (1.0)</p>
              <p className="text-lg font-black text-slate-800">${valorDia.toLocaleString('es-CL')} <span className="text-xs text-slate-500 font-normal">/ día</span></p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Valor Medio Día (0.5)</p>
              <p className="text-lg font-black text-slate-800">${valorMedioDia.toLocaleString('es-CL')} <span className="text-xs text-slate-500 font-normal">/ 0.5 día</span></p>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
              Atajos Rápidos de Jornada Semanal:
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPreset(6.0)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  diasTrabajados === 6
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 ring-2 ring-emerald-600'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                🟢 Semana Completa (6 días)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(5.5)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  diasTrabajados === 5.5
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20 ring-2 ring-amber-600'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                🟡 Faltó Medio Día (5.5 días)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(5.0)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  diasTrabajados === 5.0
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20 ring-2 ring-rose-600'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                🔴 Faltó 1 Día Completo (5.0 días)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(4.5)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  diasTrabajados === 4.5
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 ring-2 ring-purple-600'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                🟣 4.5 Días Trabajados
              </button>
              <button
                type="button"
                onClick={() => applyPreset(4.0)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  diasTrabajados === 4.0
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 ring-2 ring-purple-600'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                🟣 4.0 Días Trabajados
              </button>
            </div>
          </div>

          {/* 6-Day Interactive Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Detalle Diario de Asistencia (Lunes a Sábado):
              </label>
              <span className="text-[11px] font-bold text-slate-500">
                Total Acumulado: <strong className="text-slate-900 font-black">{diasTrabajados} / 6 días</strong>
              </span>
            </div>

            <div className="space-y-2.5">
              {dias.map((d, index) => {
                const subtotalDia = Math.round(d.valorFraccion * valorDia);

                return (
                  <div
                    key={d.diaNombre}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      d.estado === 'COMPLETO' || d.estado === 'PERMISO_PAGADO'
                        ? 'bg-white border-slate-200 shadow-sm'
                        : d.estado === 'MEDIO_DIA'
                        ? 'bg-amber-50/50 border-amber-200'
                        : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-[170px]">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                          d.estado === 'COMPLETO' || d.estado === 'PERMISO_PAGADO'
                            ? 'bg-emerald-100 text-emerald-700'
                            : d.estado === 'MEDIO_DIA'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {d.diaNombre.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{d.diaNombre}</p>
                        <p className="text-[10px] font-medium text-slate-400 font-mono">
                          {d.fecha ? d.fecha.split('-').reverse().slice(0, 2).join('/') : ''}
                        </p>
                      </div>
                    </div>

                    {/* Radio-style Buttons for State */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleStateChange(index, 'COMPLETO')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                          d.estado === 'COMPLETO'
                            ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-700'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        🟢 Completo (1.0)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStateChange(index, 'MEDIO_DIA')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                          d.estado === 'MEDIO_DIA'
                            ? 'bg-amber-500 text-white shadow-sm ring-1 ring-amber-600'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        🟡 Medio Día (0.5)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStateChange(index, 'FALTA')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                          d.estado === 'FALTA'
                            ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-700'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        🔴 Falta (0.0)
                      </button>
                    </div>

                    {/* Daily value & optional quick comment */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:min-w-[150px]">
                      <input
                        type="text"
                        placeholder="Nota (opcional)"
                        value={d.observacion || ''}
                        onChange={e => handleNoteChange(index, e.target.value)}
                        className="text-xs px-2.5 py-1 bg-slate-100/80 border border-slate-200 rounded-lg max-w-[130px] focus:bg-white outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <div className="text-right">
                        <span className={`text-xs font-black ${
                          d.valorFraccion === 1.0
                            ? 'text-emerald-700'
                            : d.valorFraccion === 0.5
                            ? 'text-amber-700'
                            : 'text-rose-600'
                        }`}>
                          ${subtotalDia.toLocaleString('es-CL')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
              Observaciones Generales de la Semana:
            </label>
            <input
              type="text"
              placeholder="Ej: Justificó falta del viernes por trámite personal / Acuerdo de medio día el sábado"
              value={notas}
              onChange={e => setNotas(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Liquid Summary Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" />
                Resumen de Cálculo de Sueldo Base
              </span>
              <span className="text-xs font-bold text-slate-400">
                Pactado: 6 Días Semanales
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                <p className="text-[10px] text-slate-400 uppercase font-black">Días Trabajados</p>
                <p className="text-lg font-black text-emerald-400">{diasTrabajados} <span className="text-xs text-slate-400 font-normal">/ 6 d</span></p>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                <p className="text-[10px] text-slate-400 uppercase font-black">Faltas / Ausencias</p>
                <p className="text-lg font-black text-rose-400">{diasFaltas} <span className="text-xs text-slate-400 font-normal">días</span></p>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                <p className="text-[10px] text-slate-400 uppercase font-black">Descuento Faltas</p>
                <p className="text-lg font-black text-rose-300">
                  {descuentoFaltas > 0 ? `-$${descuentoFaltas.toLocaleString('es-CL')}` : '$0'}
                </p>
              </div>
              <div className="p-3 bg-indigo-950/60 rounded-xl border border-indigo-500/30">
                <p className="text-[10px] text-indigo-300 uppercase font-black">Sueldo Base a Pagar</p>
                <p className="text-xl font-black text-white">${sueldoBaseAPagar.toLocaleString('es-CL')}</p>
              </div>
            </div>

            {diasFaltas > 0 && (
              <p className="text-[11px] text-amber-300/90 font-medium flex items-center gap-1.5 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                <AlertCircle size={14} className="shrink-0 text-amber-400" />
                Se descontará automáticamente ${descuentoFaltas.toLocaleString('es-CL')} del sueldo base por las {diasFaltas} {diasFaltas === 1 ? 'falta' : 'faltas/fracciones'} registradas.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => applyPreset(6.0)}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-black uppercase rounded-xl hover:bg-slate-100 transition-colors"
          >
            <RotateCcw size={14} /> Restablecer 6 Días
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-slate-600 hover:text-slate-900 text-xs font-black uppercase rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              <Save size={16} />
              {isSaving ? 'Guardando...' : 'Aplicar Asistencia a Liquidación'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
