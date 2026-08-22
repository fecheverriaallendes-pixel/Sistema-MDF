import React, { useState } from 'react';
import { X, Truck, Package, RotateCcw, Award, Calendar, Users, DollarSign, Plus } from 'lucide-react';
import { StaffMember, WorkExtra, ExtraWorkType } from '../../types';

interface TrabajoExtraModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffMember[];
  onSaveSingle: (extra: Omit<WorkExtra, 'id' | 'total' | 'createdAt'>) => Promise<void>;
  onSaveMultiple: (extras: Omit<WorkExtra, 'id' | 'total' | 'createdAt'>[]) => Promise<void>;
  defaultWorkerId?: string;
  defaultSemanaPago?: string;
}

const TIPO_PRESETS: { tipo: ExtraWorkType; label: string; desc: string; defaultVal: number; icon: any }[] = [
  { tipo: 'DESCARGA_CAMION', label: 'Descarga de Camión / Contenedor', desc: 'Descarga completa de contenedor o camión en bodega', defaultVal: 25000, icon: Truck },
  { tipo: 'CARGA_CAMION', label: 'Carga de Camión a Regiones / Clientes', desc: 'Estiba y carga de fardos a transporte', defaultVal: 15000, icon: Package },
  { tipo: 'REENFARDADO', label: 'Armado / Reenfardado de Fardos', desc: 'Reenfardado y prensado por fardo producido', defaultVal: 4000, icon: RotateCcw },
  { tipo: 'BONO_META', label: 'Bono por Desempeño / Meta', desc: 'Cumplimiento de metas de bodega o ventas', defaultVal: 20000, icon: Award },
  { tipo: 'HORAS_EXTRAS', label: 'Horas Extras / Jornada Especial', desc: 'Trabajo en turnos especiales o días festivos', defaultVal: 15000, icon: Calendar },
  { tipo: 'OTRO', label: 'Otro Trabajo Extraordinario', desc: 'Concepto personalizado', defaultVal: 10000, icon: Plus }
];

export default function TrabajoExtraModal({
  isOpen,
  onClose,
  staffList,
  onSaveSingle,
  onSaveMultiple,
  defaultWorkerId,
  defaultSemanaPago
}: TrabajoExtraModalProps) {
  const [tipo, setTipo] = useState<ExtraWorkType>('DESCARGA_CAMION');
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>(defaultWorkerId ? [defaultWorkerId] : []);
  const [cantidad, setCantidad] = useState('1');
  const [valorUnitario, setValorUnitario] = useState('25000');
  const [descripcion, setDescripcion] = useState('Descarga de contenedor en bodega');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleTipoSelect = (preset: typeof TIPO_PRESETS[0]) => {
    setTipo(preset.tipo);
    setValorUnitario(String(preset.defaultVal));
    setDescripcion(preset.desc);
  };

  const toggleWorker = (id: string) => {
    if (selectedWorkers.includes(id)) {
      setSelectedWorkers(selectedWorkers.filter(w => w !== id));
    } else {
      setSelectedWorkers([...selectedWorkers, id]);
    }
  };

  const selectAllBodega = () => {
    const bodegaWorkers = staffList.filter(s => s.rol === 'Jefe de Bodega' || s.rol === 'Encargado de Despacho' || s.rol === 'Bodeguero' || s.rol === 'Operario / Producción');
    setSelectedWorkers(bodegaWorkers.map(b => b.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedWorkers.length === 0) {
      alert('Por favor selecciona al menos a un trabajador.');
      return;
    }
    const cantNum = Number(cantidad);
    const valNum = Number(valorUnitario);
    if (isNaN(cantNum) || cantNum <= 0 || isNaN(valNum) || valNum <= 0) {
      alert('Por favor ingresa cantidad y valor válidos.');
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
          tipo,
          descripcion: descripcion.trim() || tipo,
          cantidad: cantNum,
          valorUnitario: valNum,
          semanaPago: defaultSemanaPago,
          liquidado: false
        });
      } else {
        const extras = selectedWorkers.map(wid => {
          const worker = staffList.find(s => s.id === wid);
          return {
            workerId: wid,
            workerName: worker ? worker.nombre : 'Trabajador',
            fecha,
            tipo,
            descripcion: descripcion.trim() || tipo,
            cantidad: cantNum,
            valorUnitario: valNum,
            semanaPago: defaultSemanaPago,
            liquidado: false
          };
        });
        await onSaveMultiple(extras);
      }
      onClose();
    } catch (err: any) {
      console.error('Error al registrar trabajo extra:', err);
      alert('Error al registrar trabajo extra: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const subtotalPorPersona = (Number(cantidad) || 0) * (Number(valorUnitario) || 0);
  const totalGeneral = subtotalPorPersona * selectedWorkers.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
              <Truck size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">Registrar Pago Extra / Descarga / Bono</h3>
              <p className="text-xs text-slate-400 font-medium">Asigna descargas de camión, cargas o bonos al personal</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Preset Buttons */}
          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Tipo de Trabajo Extra *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {TIPO_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = tipo === preset.tipo;
                return (
                  <button
                    key={preset.tipo}
                    type="button"
                    onClick={() => handleTipoSelect(preset)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-emerald-400'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Icon size={18} className={isSelected ? 'text-emerald-400 mb-2' : 'text-slate-400 mb-2'} />
                    <div>
                      <p className="font-black text-xs uppercase leading-tight line-clamp-1">{preset.label}</p>
                      <p className={`text-[10px] font-bold mt-1 ${isSelected ? 'text-emerald-300' : 'text-emerald-600'}`}>
                        ${preset.defaultVal.toLocaleString('es-CL')}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selección de Trabajadores (Individual o Múltiple) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">
                Personal Asignado ({selectedWorkers.length} seleccionados) *
              </label>
              <button
                type="button"
                onClick={selectAllBodega}
                className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase"
              >
                + Seleccionar Toda Bodega
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
              {staffList.filter(s => s.activo !== false).map(staff => {
                const isChecked = selectedWorkers.includes(staff.id);
                return (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => toggleWorker(staff.id)}
                    className={`p-2.5 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between border ${
                      isChecked
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <p className="font-black uppercase">{staff.nombre}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{staff.rol}</p>
                    </div>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                      isChecked ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-transparent'
                    }`}>
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cantidad y Valor Unitario */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                Cantidad de Eventos / Veces *
              </label>
              <input
                required
                type="number"
                min="1"
                step="1"
                value={cantidad}
                onChange={e => setCantidad(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-900 focus:bg-white focus:border-emerald-500 outline-none text-base"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                Valor por Evento ($ CLP c/u) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                <input
                  required
                  type="number"
                  min="500"
                  step="500"
                  value={valorUnitario}
                  onChange={e => setValorUnitario(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-900 focus:bg-white focus:border-emerald-500 outline-none text-base"
                />
              </div>
            </div>
          </div>

          {/* Fecha y Detalle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                Fecha del Trabajo *
              </label>
              <div className="relative">
                <Calendar size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  type="date"
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  className="w-full pl-11 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                Detalle / N° Contenedor / Camión
              </label>
              <input
                type="text"
                placeholder="Ej: Contenedor USA MSKU-98234"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none text-xs"
              />
            </div>
          </div>

          {/* Total Box */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Monto por Persona</p>
              <p className="text-xl font-black text-emerald-900">${subtotalPorPersona.toLocaleString('es-CL')} CLP</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Total Empresa ({selectedWorkers.length} pers.)</p>
              <p className="text-xl font-black text-slate-900">${totalGeneral.toLocaleString('es-CL')} CLP</p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || selectedWorkers.length === 0}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : `Registrar a ${selectedWorkers.length} Trabajador${selectedWorkers.length === 1 ? '' : 'es'}`}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
