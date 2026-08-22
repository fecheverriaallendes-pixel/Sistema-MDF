import React, { useState } from 'react';
import { X, DollarSign, Calendar, User, FileText, CreditCard } from 'lucide-react';
import { StaffMember, SalaryAdvance } from '../../types';

interface AdelantoModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffMember[];
  onSave: (advance: Omit<SalaryAdvance, 'id' | 'createdAt'>) => Promise<void>;
  defaultWorkerId?: string;
  defaultSemanaPago?: string;
}

export default function AdelantoModal({
  isOpen,
  onClose,
  staffList,
  onSave,
  defaultWorkerId,
  defaultSemanaPago
}: AdelantoModalProps) {
  const [workerId, setWorkerId] = useState(defaultWorkerId || '');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [metodo, setMetodo] = useState<'Transferencia' | 'Efectivo' | 'Cheque'>('Transferencia');
  const [motivo, setMotivo] = useState('');
  const [comprobante, setComprobante] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
      alert('Por favor ingresa un monto válido superior a 0.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        workerId: selectedStaff.id,
        workerName: selectedStaff.nombre,
        fecha,
        monto: montoNum,
        metodo,
        motivo: motivo.trim() || 'Adelanto de sueldo semanal',
        comprobante: comprobante.trim() || undefined,
        descontado: false,
        semanaPago: defaultSemanaPago
      });
      onClose();
    } catch (err: any) {
      console.error('Error al guardar adelanto:', err);
      alert('Error al guardar adelanto: ' + err.message);
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
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
              <DollarSign size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">Registrar Adelanto de Sueldo</h3>
              <p className="text-xs text-slate-400 font-medium">Se descontará en el pago del sábado correspondiente</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Trabajador */}
          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Trabajador / Personal *
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                required
                value={workerId}
                onChange={e => setWorkerId(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:border-amber-500 outline-none text-sm"
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

          {/* Monto */}
          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Monto a Adelantar ($ CLP) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-base">$</span>
              <input
                required
                type="number"
                min="1000"
                step="500"
                placeholder="50000"
                value={monto}
                onChange={e => setMonto(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-900 focus:bg-white focus:border-amber-500 outline-none text-base"
              />
            </div>
            {monto && Number(monto) > 0 && (
              <p className="text-[10px] text-emerald-600 font-bold mt-1 pl-1">
                ${Number(monto).toLocaleString('es-CL')} CLP a descontar este sábado
              </p>
            )}
          </div>

          {/* Fecha y Método */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                Fecha del Adelanto *
              </label>
              <div className="relative">
                <Calendar size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  type="date"
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  className="w-full pl-11 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:border-amber-500 outline-none text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                Método de Entrega *
              </label>
              <select
                value={metodo}
                onChange={e => setMetodo(e.target.value as any)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:border-amber-500 outline-none text-xs"
              >
                <option value="Transferencia">Transferencia Bancaria</option>
                <option value="Efectivo">Efectivo de Caja</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Motivo u Observación
            </label>
            <input
              type="text"
              placeholder="Ej: Urgencia médica, pasajes, anticipo personal..."
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-slate-800 focus:bg-white focus:border-amber-500 outline-none text-xs"
            />
          </div>

          {/* Comprobante */}
          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              N° Comprobante / Transferencia (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Transf #849204"
              value={comprobante}
              onChange={e => setComprobante(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-slate-800 focus:bg-white focus:border-amber-500 outline-none text-xs"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : 'Registrar Adelanto'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
