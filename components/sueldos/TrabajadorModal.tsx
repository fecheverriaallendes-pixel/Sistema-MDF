import React, { useState, useEffect } from 'react';
import { X, User, Building, CreditCard, DollarSign, Phone, Mail, FileText, CheckCircle2, ShieldCheck, Key, Users, Truck } from 'lucide-react';
import { StaffMember, StaffRole } from '../../types';

interface TrabajadorModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff?: StaffMember | null;
  onSave: (staffData: Partial<StaffMember>) => Promise<void>;
}

const CHILEAN_BANKS = [
  'BancoEstado (Cuenta RUT)',
  'Banco Santander Chile',
  'Banco de Chile / Banco Edwards',
  'BCI (Banco de Crédito e Inversiones)',
  'Scotiabank Chile',
  'Banco Falabella',
  'Banco Itaú Chile',
  'Banco BICE',
  'Banco Security',
  'Banco Consorcio',
  'Tenpo Prepago',
  'Mach (BCI)',
  'Coopeuch',
  'Mercado Pago',
  'Otro Banco'
];

const ACCOUNT_TYPES = [
  'Cuenta RUT',
  'Cuenta Corriente',
  'Cuenta Vista',
  'Cuenta de Ahorro',
  'Prepago Digital'
];

const ROLES_LIST = [
  { value: StaffRole.OPERARIO_BODEGA, label: 'Bodeguero / Operario de Bodega', defaultAccess: false },
  { value: StaffRole.CHOFER, label: 'Chofer / Conductor', defaultAccess: false },
  { value: StaffRole.PEONETA, label: 'Peoneta / Cuadrilla de Carga', defaultAccess: false },
  { value: StaffRole.VENDEDOR, label: 'Vendedor / Vendedora', defaultAccess: true },
  { value: StaffRole.BODEGA, label: 'Jefe de Bodega', defaultAccess: true },
  { value: StaffRole.DESPACHO, label: 'Encargado de Despacho', defaultAccess: true },
  { value: StaffRole.TRANSPORTISTA, label: 'Transportista', defaultAccess: false },
  { value: StaffRole.POST_VENTA, label: 'Post-Venta', defaultAccess: true },
  { value: StaffRole.ADMIN, label: 'Administrador', defaultAccess: true },
  { value: StaffRole.OTRO_PERSONAL, label: 'Otro Personal / Apoyo', defaultAccess: false }
];

export default function TrabajadorModal({
  isOpen,
  onClose,
  staff,
  onSave
}: TrabajadorModalProps) {
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState<StaffRole | string>(StaffRole.OPERARIO_BODEGA);
  const [tieneAccesoSistema, setTieneAccesoSistema] = useState(false);
  const [pin, setPin] = useState('');
  const [rut, setRut] = useState('');
  const [sueldoBaseSemanal, setSueldoBaseSemanal] = useState('120000');
  const [banco, setBanco] = useState('BancoEstado (Cuenta RUT)');
  const [tipoCuenta, setTipoCuenta] = useState('Cuenta RUT');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [tarifaDescargaCamion, setTarifaDescargaCamion] = useState('25000');
  const [tarifaCargaCamion, setTarifaCargaCamion] = useState('15000');
  const [tarifaReenfardado, setTarifaReenfardado] = useState('4000');
  const [tarifaFlete, setTarifaFlete] = useState('0');
  const [activo, setActivo] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (staff) {
      setNombre(staff.nombre || '');
      setRol(staff.rol || StaffRole.OPERARIO_BODEGA);
      setTieneAccesoSistema(staff.tieneAccesoSistema ?? (Boolean(staff.pin) && staff.soloNomina !== true));
      setPin(staff.pin || '');
      setRut(staff.rut || '');
      setSueldoBaseSemanal(staff.sueldoBaseSemanal !== undefined ? String(staff.sueldoBaseSemanal) : '120000');
      setBanco(staff.banco || 'BancoEstado (Cuenta RUT)');
      setTipoCuenta(staff.tipoCuenta || 'Cuenta RUT');
      setNumeroCuenta(staff.numeroCuenta || '');
      setTelefono(staff.telefono || '');
      setEmail(staff.email || '');
      setTarifaDescargaCamion(staff.tarifaDescargaCamion !== undefined ? String(staff.tarifaDescargaCamion) : '25000');
      setTarifaCargaCamion(staff.tarifaCargaCamion !== undefined ? String(staff.tarifaCargaCamion) : '15000');
      setTarifaReenfardado(staff.tarifaReenfardado !== undefined ? String(staff.tarifaReenfardado) : '4000');
      setTarifaFlete(staff.tarifaFlete !== undefined ? String(staff.tarifaFlete) : '0');
      setActivo(staff.activo !== false);
    } else {
      setNombre('');
      setRol(StaffRole.OPERARIO_BODEGA);
      setTieneAccesoSistema(false);
      setPin('');
      setRut('');
      setSueldoBaseSemanal('120000');
      setBanco('BancoEstado (Cuenta RUT)');
      setTipoCuenta('Cuenta RUT');
      setNumeroCuenta('');
      setTelefono('');
      setEmail('');
      setTarifaDescargaCamion('25000');
      setTarifaCargaCamion('15000');
      setTarifaReenfardado('4000');
      setTarifaFlete('0');
      setActivo(true);
    }
  }, [staff, isOpen]);

  if (!isOpen) return null;

  const handleRoleChange = (newRole: string) => {
    setRol(newRole);
    const matched = ROLES_LIST.find(r => r.value === newRole);
    if (!staff && matched) {
      setTieneAccesoSistema(matched.defaultAccess);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      alert('Por favor ingresa el nombre del trabajador.');
      return;
    }

    if (tieneAccesoSistema && !pin.trim()) {
      alert('Si el usuario tiene acceso al sistema, debes asignarle un PIN de 4 dígitos.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        nombre: nombre.trim().toUpperCase(),
        rol,
        tieneAccesoSistema,
        soloNomina: !tieneAccesoSistema,
        pin: tieneAccesoSistema ? pin.trim() : '',
        rut: rut.trim(),
        sueldoBaseSemanal: Number(sueldoBaseSemanal) || 0,
        banco,
        tipoCuenta,
        numeroCuenta: numeroCuenta.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
        tarifaDescargaCamion: Number(tarifaDescargaCamion) || 0,
        tarifaCargaCamion: Number(tarifaCargaCamion) || 0,
        tarifaReenfardado: Number(tarifaReenfardado) || 0,
        tarifaFlete: Number(tarifaFlete) || 0,
        activo
      });
      onClose();
    } catch (err: any) {
      console.error('Error al guardar trabajador:', err);
      alert('Error al guardar trabajador: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">
                {staff ? 'Editar Ficha y Sueldo de Trabajador' : 'Nuevo Integrante del Equipo'}
              </h3>
              <p className="text-xs text-slate-400 font-medium">Personal de Bodega, Choferes, Vendedores y Operaciones</p>
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
          
          {/* TIPO DE PERFIL: ACCESO SISTEMA VS SOLO NÓMINA */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-widest">
              Modalidad de Integración en la Empresa
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTieneAccesoSistema(false)}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  !tieneAccesoSistema
                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`p-2 rounded-xl mt-0.5 ${!tieneAccesoSistema ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Truck size={18} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 uppercase">Solo Nómina / Operativo</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    Bodegueros, choferes, peonetas. <strong className="text-emerald-700">Sin acceso ni PIN al sistema.</strong>
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTieneAccesoSistema(true)}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  tieneAccesoSistema
                    ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`p-2 rounded-xl mt-0.5 ${tieneAccesoSistema ? 'bg-emerald-400 text-slate-900' : 'bg-slate-100 text-slate-500'}`}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className={`text-xs font-black uppercase ${tieneAccesoSistema ? 'text-white' : 'text-slate-900'}`}>
                    Usuario del Sistema
                  </p>
                  <p className={`text-[10px] font-medium mt-0.5 ${tieneAccesoSistema ? 'text-slate-300' : 'text-slate-500'}`}>
                    Vendedoras, administradores. Ingresan con su <strong>PIN de 4 dígitos</strong>.
                  </p>
                </div>
              </button>
            </div>

            {tieneAccesoSistema && (
              <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Key size={12} className="text-emerald-600" /> PIN de Acceso al Sistema (4 dígitos) *
                </label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  className="w-48 px-4 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-center text-lg font-black tracking-widest text-slate-900 focus:border-emerald-500 outline-none"
                />
              </div>
            )}
          </div>

          {/* Datos Personales */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
              1. Identificación y Cargo
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Nombre Completo *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ej: Juan Pérez González"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none text-sm uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Cargo / Rol en Empresa *
                </label>
                <select
                  value={rol}
                  onChange={e => handleRoleChange(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none text-sm"
                >
                  {ROLES_LIST.map(r => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  RUT del Trabajador
                </label>
                <input
                  type="text"
                  placeholder="Ej: 18.234.567-8"
                  value={rut}
                  onChange={e => setRut(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="+56 9 1234 5678"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Estado
                </label>
                <button
                  type="button"
                  onClick={() => setActivo(!activo)}
                  className={`w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider border transition-all ${
                    activo
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-red-50 text-red-700 border-red-300'
                  }`}
                >
                  {activo ? '✓ Activo en Nómina' : '✕ Inactivo'}
                </button>
              </div>
            </div>
          </div>

          {/* Sueldo Base y Tarifas */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
              2. Remuneración Base y Tarifas de Extras (Pagos Semanales)
            </h4>

            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                Sueldo Base Semanal ($ CLP / Sábado) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-lg">$</span>
                <input
                  required
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="120000"
                  value={sueldoBaseSemanal}
                  onChange={e => setSueldoBaseSemanal(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-black text-emerald-700 focus:bg-white focus:border-emerald-500 outline-none text-lg"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-bold mt-1 pl-1">
                Equivale a ${((Number(sueldoBaseSemanal) || 0) * 4).toLocaleString('es-CL')} CLP mensual aprox.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  Descarga Camión / Contenedor
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">$</span>
                  <input
                    type="number"
                    value={tarifaDescargaCamion}
                    onChange={e => setTarifaDescargaCamion(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  Carga de Camión
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">$</span>
                  <input
                    type="number"
                    value={tarifaCargaCamion}
                    onChange={e => setTarifaCargaCamion(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  Reenfardado (c/u)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">$</span>
                  <input
                    type="number"
                    value={tarifaReenfardado}
                    onChange={e => setTarifaReenfardado(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Datos Bancarios */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
              3. Datos Bancarios para Transferencias de los Sábados
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Institución Bancaria *
                </label>
                <select
                  value={banco}
                  onChange={e => setBanco(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none text-xs"
                >
                  {CHILEAN_BANKS.map(b => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Tipo de Cuenta *
                </label>
                <select
                  value={tipoCuenta}
                  onChange={e => setTipoCuenta(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none text-xs"
                >
                  {ACCOUNT_TYPES.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                Número de Cuenta Bancaria
              </label>
              <input
                type="text"
                placeholder="Ej: 18234567 (En Cuenta RUT corresponde al RUT sin dígito verificador)"
                value={numeroCuenta}
                onChange={e => setNumeroCuenta(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none text-sm"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
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
              className="px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : staff ? 'Guardar Cambios' : 'Registrar Trabajador'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
