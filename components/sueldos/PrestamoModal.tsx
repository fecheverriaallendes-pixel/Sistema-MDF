import React, { useState } from 'react';
import { X, Handshake, Calendar, User, DollarSign, Clock, FileText } from 'lucide-react';
import { StaffMember, EmployeeLoan } from '../../types';

interface PrestamoModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffMember[];
  onSave: (loan: Omit<EmployeeLoan, 'id' | 'saldoPendiente' | 'cuotasPagadas' | 'historialPagos' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  defaultWorkerId?: string;
}

export default function PrestamoModal({
  isOpen,
  onClose,
  staffList,
  onSave,
  defaultWorkerId
}: PrestamoModalProps) {
  const [workerId, setWorkerId] = useState(defaultWorkerId || '');
  const [montoTotal, setMontoTotal] = useState('');
  const [numeroCuotas, setNumeroCuotas] = useState('4');
  const [montoCuotaSemanal, setMontoCuotaSemanal] = useState('');
  const [fechaOtorgamiento, setFechaOtorgamiento] = useState(new Date().toISOString().split('T')[0]);
  const [motivo, setMotivo] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleMontoChange = (val: string) => {
    setMontoTotal(val);
    const num = Number(val);
    const cuotas = Number(numeroCuotas) || 1;
    if (num > 0 && cuotas > 0) {
      setMontoCuotaSemanal(String(Math.round(num / cuotas)));
    }
  };

  const handleCuotasChange = (val: string) => {
    setNumeroCuotas(val);
    const cuotas = Number(val) || 1;
    const num = Number(montoTotal);
    if (num > 0 && cuotas > 0) {
      setMontoCuotaSemanal(String(Math.round(num / cuotas)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedStaff = staffList.find(s => s.id === workerId);
    if (!selectedStaff) {
      alert('Por favor selecciona a un trabajador.');
      return;
    }
    const totalNum = Number(montoTotal);
    if (isNaN(totalNum) || totalNum <= 0) {
      alert('Por favor ingresa un monto válido superior a 0.');
      return;
    }
    const cuotasNum = Math.max(1, Number(numeroCuotas) || 1);
    const cuotaSemanalNum = Number(montoCuotaSemanal) > 0 ? Number(montoCuotaSemanal) : Math.round(totalNum / cuotasNum);

    setIsSaving(true);
    try {
      await onSave({
        workerId: selectedStaff.id,
        workerName: selectedStaff.nombre,
        fechaOtorgamiento,
        montoTotal: totalNum,
        numeroCuotas: cuotasNum,
        montoCuotaSemanal: cuotaSemanalNum,
        estado: 'ACTIVO',
        motivo: motivo.trim() || 'Préstamo de dinero al trabajador'
      });
      onClose();
    } catch (err: any) {
      console.error('Error al otorgar préstamo:', err);
      alert('Error al otorgar préstamo: ' + err.message);
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
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black">
              <Handshake size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">Otorgar Préstamo a Trabajador</h3>
              <p className="text-xs text-slate-400 font-medium">Se descontará semana a semana en cuotas programadas</p>
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
              Trabajador / Beneficiario *
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                required
                value={workerId}
                onChange={e => setWorkerId(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none text-sm"
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

          {/* Monto Total */}
          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Monto Total del Préstamo ($ CLP) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-base">$</span>
              <input
                required
                type="number"
                min="5000"
                step="1000"
                placeholder="200000"
                value={montoTotal}
                onChange={e => handleMontoChange(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-900 focus:bg-white focus:border-blue-500 outline-none text-base"
              />
            </div>
          </div>

          {/* Cuotas y Cuota Semanal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                Plazo (N° de Semanas) *
              </label>
              <div className="relative">
                <Clock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  type="number"
                  min="1"
                  max="52"
                  value={numeroCuotas}
                  onChange={e => handleCuotasChange(e.target.value)}
                  className="w-full pl-11 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                Cuota Semanal ($ CLP) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">$</span>
                <input
                  required
                  type="number"
                  min="1000"
                  step="500"
                  value={montoCuotaSemanal}
                  onChange={e => setMontoCuotaSemanal(e.target.value)}
                  className="w-full pl-8 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-900 focus:bg-white focus:border-blue-500 outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Cuadro Resumen del Plan de Pagos */}
          {Number(montoTotal) > 0 && (
            <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 space-y-1 text-xs">
              <p className="font-black text-blue-900 uppercase text-[10px] tracking-wider">Resumen del Plan:</p>
              <p className="text-blue-800">
                Se descontarán <span className="font-black">${Number(montoCuotaSemanal).toLocaleString('es-CL')} CLP</span> cada sábado durante <span className="font-black">{numeroCuotas} semanas</span> hasta completar los ${Number(montoTotal).toLocaleString('es-CL')} CLP.
              </p>
            </div>
          )}

          {/* Fecha Otorgamiento */}
          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Fecha de Entrega / Otorgamiento *
            </label>
            <div className="relative">
              <Calendar size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                required
                type="date"
                value={fechaOtorgamiento}
                onChange={e => setFechaOtorgamiento(e.target.value)}
                className="w-full pl-11 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none text-xs"
              />
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Motivo / Destino del Préstamo
            </label>
            <input
              type="text"
              placeholder="Ej: Ayuda familiar, reparación de vehículo, gastos médicos..."
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-slate-800 focus:bg-white focus:border-blue-500 outline-none text-xs"
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
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : 'Crear Préstamo'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
