import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, User, FileText, AlertCircle, Tag, Scissors } from 'lucide-react';
import { StaffMember, SalaryDeduction } from '../../types';

interface DescuentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffMember[];
  onSave: (deduction: Omit<SalaryDeduction, 'id' | 'createdAt'>) => Promise<any>;
  onUpdate?: (id: string, updated: Partial<SalaryDeduction>) => Promise<void>;
  defaultWorkerId?: string;
  defaultSemanaPago?: string;
  editingDeduction?: SalaryDeduction | null;
}

const COMMON_REASONS = [
  { label: 'Ropa / Mercadería retirada', desc: 'Prendas o fardos retirados para uso personal' },
  { label: 'Daño o merma de mercadería', desc: 'Fardo o producto dañado durante manipulación' },
  { label: 'Faltante en caja o cobro erróneo', desc: 'Diferencia en cuadratura o cobro pendiente' },
  { label: 'Multa o infracción de tránsito', desc: 'Infracción cometida en vehículo de la empresa' },
  { label: 'Anticipo de compra personal', desc: 'Gasto pagado por la empresa a cuenta del trabajador' },
  { label: 'Ajuste manual acordado', desc: 'Descuento o arreglo convenido con el colaborador' },
  { label: 'Otro motivo', desc: 'Especificar concepto en el campo personalizado' },
];

export default function DescuentoModal({
  isOpen,
  onClose,
  staffList,
  onSave,
  onUpdate,
  defaultWorkerId,
  defaultSemanaPago,
  editingDeduction
}: DescuentoModalProps) {
  const [workerId, setWorkerId] = useState(defaultWorkerId || '');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [selectedReason, setSelectedReason] = useState<string>(COMMON_REASONS[0].label);
  const [customReason, setCustomReason] = useState('');
  const [observacion, setObservacion] = useState('');
  const [comprobante, setComprobante] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingDeduction) {
      setWorkerId(editingDeduction.workerId);
      setMonto(String(editingDeduction.monto || ''));
      setFecha(editingDeduction.fecha || new Date().toISOString().split('T')[0]);
      
      const foundPreset = COMMON_REASONS.find(r => r.label === editingDeduction.motivo);
      if (foundPreset) {
        setSelectedReason(foundPreset.label);
        setCustomReason('');
      } else {
        setSelectedReason('Otro motivo');
        setCustomReason(editingDeduction.motivo || '');
      }
      
      setObservacion(editingDeduction.observacion || '');
      setComprobante(editingDeduction.comprobante || '');
    } else {
      setWorkerId(defaultWorkerId || '');
      setMonto('');
      setFecha(new Date().toISOString().split('T')[0]);
      setSelectedReason(COMMON_REASONS[0].label);
      setCustomReason('');
      setObservacion('');
      setComprobante('');
    }
  }, [editingDeduction, defaultWorkerId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedStaff = staffList.find(s => s.id === workerId);
    if (!selectedStaff) {
      alert('Por favor selecciona a un trabajador.');
      return;
    }
    const montoNum = Number(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      alert('Por favor ingresa un monto válido superior a $0.');
      return;
    }

    const finalMotivo = selectedReason === 'Otro motivo'
      ? (customReason.trim() || 'Descuento manual')
      : selectedReason;

    setIsSaving(true);
    try {
      if (editingDeduction && onUpdate) {
        await onUpdate(editingDeduction.id, {
          workerId: selectedStaff.id,
          workerName: selectedStaff.nombre,
          fecha,
          monto: montoNum,
          motivo: finalMotivo,
          observacion: observacion.trim() || undefined,
          comprobante: comprobante.trim() || undefined,
          semanaPago: defaultSemanaPago
        });
      } else {
        await onSave({
          workerId: selectedStaff.id,
          workerName: selectedStaff.nombre,
          fecha,
          monto: montoNum,
          motivo: finalMotivo,
          observacion: observacion.trim() || undefined,
          comprobante: comprobante.trim() || undefined,
          descontado: false,
          semanaPago: defaultSemanaPago
        });
      }
      onClose();
    } catch (err: any) {
      console.error('Error al guardar descuento:', err);
      alert('Error al guardar el descuento: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-black">
              <Scissors size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">
                {editingDeduction ? 'Editar Descuento Manual' : 'Registrar Descuento Manual'}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Se aplicará automáticamente a la liquidación semanal del sábado
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Trabajador */}
          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Trabajador / Personal *
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                required
                value={workerId}
                onChange={e => setWorkerId(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:border-rose-500 outline-none text-sm appearance-none"
              >
                <option value="">Seleccionar trabajador...</option>
                {staffList.filter(s => s.activo !== false).map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} ({s.rol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Monto y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                Monto a Descontar ($ CLP) *
              </label>
              <div className="relative">
                <DollarSign size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-500 pointer-events-none" />
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  placeholder="Ej: 15000"
                  value={monto}
                  onChange={e => setMonto(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-900 focus:bg-white focus:border-rose-500 outline-none text-base"
                />
              </div>
              {Number(monto) > 0 && (
                <p className="text-[10px] text-rose-600 font-bold mt-1 pl-1">
                  -${Number(monto).toLocaleString('es-CL')} CLP
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                Fecha del Suceso / Registro *
              </label>
              <div className="relative">
                <Calendar size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:border-rose-500 outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Motivo / Concepto */}
          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Tag size={13} className="text-slate-400" /> Motivo / Concepto de Descuento *
            </label>
            
            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {COMMON_REASONS.map(r => (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => setSelectedReason(r.label)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all text-left ${
                    selectedReason === r.label
                      ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title={r.desc}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {selectedReason === 'Otro motivo' && (
              <input
                type="text"
                required
                placeholder="Escribe el motivo del descuento..."
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-rose-500 outline-none mt-1"
              />
            )}
          </div>

          {/* Observación / Detalle */}
          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Detalle u Observación (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ej: Fardo MDF-045 rasgado, mercadería retirada el día miércoles..."
              value={observacion}
              onChange={e => setObservacion(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:bg-white focus:border-rose-500 outline-none resize-none"
            />
          </div>

          {/* N° Comprobante / Folio */}
          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              N° Comprobante o Referencia (Opcional)
            </label>
            <div className="relative">
              <FileText size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Ej: REF-9843 o Nota Interna #12"
                value={comprobante}
                onChange={e => setComprobante(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:border-rose-500 outline-none"
              />
            </div>
          </div>

          {/* Aviso informativo */}
          <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-100 flex items-start gap-3">
            <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
            <div className="text-[11px] text-rose-800 leading-relaxed font-medium">
              Este descuento se restará del total líquido de la liquidación semanal del trabajador y figurará desglosado en su recibo de sueldo de los sábados.
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl font-bold text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all uppercase tracking-wider"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50"
            >
              <Scissors size={15} />
              {isSaving ? 'Guardando...' : editingDeduction ? 'Actualizar Descuento' : 'Aplicar Descuento'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
