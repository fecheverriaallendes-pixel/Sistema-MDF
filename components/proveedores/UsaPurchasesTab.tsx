import React, { useState } from 'react';
import { 
  PlusCircle, 
  History, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  Ship, 
  Anchor, 
  PackageCheck, 
  DollarSign, 
  ArrowRightLeft, 
  Globe, 
  X, 
  BadgeDollarSign, 
  HelpCircle,
  FileCheck,
  Building2
} from 'lucide-react';
import { useStore } from '../../store/GlobalContext';
import { UsaPurchase, UsaAbono, UsaContainerStatus } from '../../types';

interface UsaPurchasesTabProps {
  searchTerm: string;
}

const STATUS_CONFIG: Record<UsaContainerStatus, { label: string; bg: string; text: string; icon: any }> = {
  EN_TRANSITO: { label: 'En Tránsito Marítimo', bg: 'bg-blue-100', text: 'text-blue-700', icon: Ship },
  EN_ADUANA: { label: 'En Aduana / Puerto', bg: 'bg-purple-100', text: 'text-purple-700', icon: Anchor },
  RECIBIDO: { label: 'Recibido en Bodega', bg: 'bg-indigo-100', text: 'text-indigo-700', icon: PackageCheck },
  PENDIENTE: { label: 'Pago Pendiente', bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
  PAGADO: { label: 'Completamente Pagado', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 }
};

export default function UsaPurchasesTab({ searchTerm }: UsaPurchasesTabProps) {
  const { usaPurchases, addUsaPurchase, updateUsaPurchase, removeUsaPurchase, addUsaAbono, updateUsaAbono, removeUsaAbono, playSound } = useStore();

  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<UsaPurchase | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<UsaPurchase | null>(null);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [editingAbono, setEditingAbono] = useState<{ purchaseId: string; abono: UsaAbono } | null>(null);

  // Global calculator state
  const [calcUsd, setCalcUsd] = useState<number | ''>(1000);
  const [calcRate, setCalcRate] = useState<number>(950);
  const [calcClp, setCalcClp] = useState<number | ''>(950000);

  // Form states for Purchase
  const [formState, setFormState] = useState({
    proveedor: '',
    numeroContenedor: '',
    facturaInvoice: '',
    fecha: new Date().toISOString().split('T')[0],
    fechaLlegadaEstimada: '',
    descripcion: '',
    montoTotalUsd: 0,
    tipoCambioRef: 950,
    puertoOrigen: 'Miami, FL (USA)',
    puertoDestino: 'San Antonio (Chile)',
    estado: 'EN_TRANSITO' as UsaContainerStatus,
    notasClp: '',
    observaciones: ''
  });

  // Form states for Abono USD
  const [abonoForm, setAbonoForm] = useState({
    montoUsd: 0,
    tipoCambio: 950,
    montoClp: 0,
    metodo: 'Transferencia SWIFT / Wire',
    referencia: '',
    observacion: '',
    notaClp: '',
    fecha: new Date().toISOString().split('T')[0]
  });

  const handleOpenAdd = () => {
    setEditingPurchase(null);
    setFormState({
      proveedor: '',
      numeroContenedor: '',
      facturaInvoice: '',
      fecha: new Date().toISOString().split('T')[0],
      fechaLlegadaEstimada: '',
      descripcion: '',
      montoTotalUsd: 0,
      tipoCambioRef: calcRate || 950,
      puertoOrigen: 'Miami, FL (USA)',
      puertoDestino: 'San Antonio (Chile)',
      estado: 'EN_TRANSITO',
      notasClp: '',
      observaciones: ''
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (purchase: UsaPurchase) => {
    setEditingPurchase(purchase);
    setFormState({
      proveedor: purchase.proveedor,
      numeroContenedor: purchase.numeroContenedor || '',
      facturaInvoice: purchase.facturaInvoice || '',
      fecha: purchase.fecha,
      fechaLlegadaEstimada: purchase.fechaLlegadaEstimada || '',
      descripcion: purchase.descripcion || '',
      montoTotalUsd: purchase.montoTotalUsd,
      tipoCambioRef: purchase.tipoCambioRef || 950,
      puertoOrigen: purchase.puertoOrigen || 'Miami, FL (USA)',
      puertoDestino: purchase.puertoDestino || 'San Antonio (Chile)',
      estado: purchase.estado,
      notasClp: purchase.notasClp || '',
      observaciones: purchase.observaciones || ''
    });
    setShowAddModal(true);
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    const montoUsd = Number(formState.montoTotalUsd) || 0;
    const rate = Number(formState.tipoCambioRef) || 950;
    const montoClpRef = Math.round(montoUsd * rate);

    if (editingPurchase) {
      await updateUsaPurchase(editingPurchase.id, {
        proveedor: formState.proveedor.trim().toUpperCase(),
        numeroContenedor: formState.numeroContenedor.trim().toUpperCase(),
        facturaInvoice: formState.facturaInvoice.trim(),
        fecha: formState.fecha,
        fechaLlegadaEstimada: formState.fechaLlegadaEstimada,
        descripcion: formState.descripcion,
        montoTotalUsd: montoUsd,
        tipoCambioRef: rate,
        montoTotalClpRef: montoClpRef,
        puertoOrigen: formState.puertoOrigen,
        puertoDestino: formState.puertoDestino,
        estado: formState.estado,
        notasClp: formState.notasClp,
        observaciones: formState.observaciones
      });
    } else {
      await addUsaPurchase({
        proveedor: formState.proveedor.trim().toUpperCase(),
        numeroContenedor: formState.numeroContenedor.trim().toUpperCase(),
        facturaInvoice: formState.facturaInvoice.trim(),
        fecha: formState.fecha,
        fechaLlegadaEstimada: formState.fechaLlegadaEstimada,
        descripcion: formState.descripcion,
        montoTotalUsd: montoUsd,
        tipoCambioRef: rate,
        montoTotalClpRef: montoClpRef,
        puertoOrigen: formState.puertoOrigen,
        puertoDestino: formState.puertoDestino,
        estado: formState.estado,
        notasClp: formState.notasClp,
        observaciones: formState.observaciones
      });
    }
    setShowAddModal(false);
    setEditingPurchase(null);
  };

  const handleRemovePurchase = async (id: string, proveedor: string, contenedor?: string) => {
    const ident = contenedor ? `${proveedor} (${contenedor})` : proveedor;
    if (confirm(`⚠️ ¿Estás seguro de eliminar el registro de ${ident}? Se borrarán todos los pagos y el historial asociado.`)) {
      await removeUsaPurchase(id);
    }
  };

  const handleOpenAddAbono = (purchase: UsaPurchase) => {
    setSelectedPurchase(purchase);
    setEditingAbono(null);
    const defaultRate = purchase.tipoCambioRef || calcRate || 950;
    const defaultUsd = purchase.saldoPendienteUsd || 0;
    setAbonoForm({
      montoUsd: defaultUsd,
      tipoCambio: defaultRate,
      montoClp: Math.round(defaultUsd * defaultRate),
      metodo: 'Transferencia SWIFT / Wire',
      referencia: '',
      observacion: '',
      notaClp: `$${Math.round(defaultUsd * defaultRate).toLocaleString('es-CL')} CLP pagados al TC ${defaultRate}`,
      fecha: new Date().toISOString().split('T')[0]
    });
    setShowAbonoModal(true);
  };

  const handleOpenEditAbono = (purchaseId: string, abono: UsaAbono) => {
    setEditingAbono({ purchaseId, abono });
    setAbonoForm({
      montoUsd: abono.montoUsd,
      tipoCambio: abono.tipoCambio || 950,
      montoClp: abono.montoClp || (abono.tipoCambio ? Math.round(abono.montoUsd * abono.tipoCambio) : 0),
      metodo: abono.metodo || 'Transferencia SWIFT / Wire',
      referencia: abono.referencia || '',
      observacion: abono.observacion || '',
      notaClp: abono.notaClp || '',
      fecha: abono.fecha || new Date().toISOString().split('T')[0]
    });
    setShowAbonoModal(true);
  };

  const handleSaveAbono = async (e: React.FormEvent) => {
    e.preventDefault();
    const usd = Number(abonoForm.montoUsd) || 0;
    const rate = Number(abonoForm.tipoCambio) || 950;
    const clp = Number(abonoForm.montoClp) || Math.round(usd * rate);

    if (editingAbono) {
      await updateUsaAbono(editingAbono.purchaseId, editingAbono.abono.id, {
        montoUsd: usd,
        tipoCambio: rate,
        montoClp: clp,
        metodo: abonoForm.metodo,
        referencia: abonoForm.referencia,
        observacion: abonoForm.observacion,
        notaClp: abonoForm.notaClp || `$${clp.toLocaleString('es-CL')} CLP a tipo cambio ${rate}`,
        fecha: abonoForm.fecha
      });
      setEditingAbono(null);
    } else if (selectedPurchase) {
      await addUsaAbono(selectedPurchase.id, {
        montoUsd: usd,
        tipoCambio: rate,
        montoClp: clp,
        metodo: abonoForm.metodo,
        referencia: abonoForm.referencia,
        observacion: abonoForm.observacion,
        notaClp: abonoForm.notaClp || `$${clp.toLocaleString('es-CL')} CLP a tipo cambio ${rate}`,
        fecha: abonoForm.fecha
      });
    }

    setShowAbonoModal(false);
    // Refresh modal if history view is open
    if (selectedPurchase) {
      const refreshed = usaPurchases.find(p => p.id === selectedPurchase.id);
      if (refreshed) setSelectedPurchase(refreshed);
    }
  };

  const handleRemoveAbono = async (purchaseId: string, abonoId: string) => {
    if (confirm("¿Estás seguro de eliminar este pago en dólares? El saldo adeudado se recalculará automáticamente.")) {
      await removeUsaAbono(purchaseId, abonoId);
      const refreshed = usaPurchases.find(p => p.id === purchaseId);
      if (refreshed) setSelectedPurchase(refreshed);
    }
  };

  // Filter purchases
  const filteredPurchases = usaPurchases.filter(p => {
    const matchesSearch = 
      p.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.numeroContenedor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.facturaInvoice || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.notasClp || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'TODOS' || p.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const totalUsdFacturado = usaPurchases.reduce((acc, p) => acc + (Number(p.montoTotalUsd) || 0), 0);
  const totalUsdPendiente = usaPurchases.reduce((acc, p) => acc + (Number(p.saldoPendienteUsd) || 0), 0);
  const totalUsdPagado = Math.max(0, totalUsdFacturado - totalUsdPendiente);
  const totalClpPendienteRef = Math.round(totalUsdPendiente * calcRate);

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Deuda Pendiente USD */}
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign size={80} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Deuda Pendiente USA</p>
            <h3 className="text-3xl font-black text-amber-400 tracking-tight">
              ${totalUsdPendiente.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-white">USD</span>
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold">Equiv. Estimado:</span>
            <span className="text-xs font-black text-emerald-400">~${totalClpPendienteRef.toLocaleString('es-CL')} CLP</span>
          </div>
        </div>

        {/* Total Pagado USD */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pagado / Transferido</p>
            <h3 className="text-3xl font-black text-emerald-600 tracking-tight">
              ${totalUsdPagado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-slate-500">USD</span>
            </h3>
          </div>
          <p className="text-[10px] text-emerald-600 font-bold mt-4 flex items-center gap-1">
            <CheckCircle2 size={12} /> Abonos confirmados vía SWIFT/Wire
          </p>
        </div>

        {/* Total Compras Contenedores */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Comprado en USA</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              ${totalUsdFacturado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-slate-400">USD</span>
            </h3>
          </div>
          <p className="text-[10px] text-slate-400 font-bold mt-4">
            {usaPurchases.length} Contenedores / Invoices en registro
          </p>
        </div>

        {/* Contenedores Activos & Botón Agregar */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Contenedores Activos</p>
            <h3 className="text-3xl font-black tracking-tight">
              {usaPurchases.filter(p => p.estado === 'EN_TRANSITO' || p.estado === 'EN_ADUANA' || p.estado === 'PENDIENTE').length} En Curso
            </h3>
          </div>
          <button 
            onClick={handleOpenAdd}
            className="mt-4 w-full py-3 bg-white text-blue-900 hover:bg-blue-50 font-black text-xs uppercase rounded-2xl tracking-wider transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
          >
            <PlusCircle size={16} /> Nuevo Contenedor USA
          </button>
        </div>
      </div>

      {/* Live Exchange Rate & Currency Converter Widget */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
              <ArrowRightLeft size={18} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 uppercase">Calculadora & Tipo de Cambio Referencial</p>
              <p className="text-[10px] text-slate-500 font-medium">Convierte al instante entre Dólares (USD $) y Pesos Chilenos (CLP $)</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-black text-slate-400 uppercase">TC (CLP/USD):</span>
              <span className="text-xs font-black text-slate-800">$</span>
              <input 
                type="number" 
                value={calcRate} 
                onChange={(e) => {
                  const r = Number(e.target.value) || 1;
                  setCalcRate(r);
                  if (calcUsd !== '') setCalcClp(Math.round(calcUsd * r));
                }}
                className="w-20 font-black text-xs bg-transparent outline-none text-slate-900 text-right"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-black text-slate-400 uppercase">USD:</span>
              <span className="text-xs font-black text-blue-600">$</span>
              <input 
                type="number" 
                value={calcUsd} 
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Number(e.target.value);
                  setCalcUsd(val);
                  if (val !== '') setCalcClp(Math.round(val * calcRate));
                }}
                className="w-24 font-black text-xs bg-transparent outline-none text-blue-700 text-right"
                placeholder="USD"
              />
            </div>

            <span className="text-slate-400 font-black text-xs">=</span>

            <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-black text-slate-400 uppercase">CLP:</span>
              <span className="text-xs font-black text-emerald-600">$</span>
              <input 
                type="number" 
                value={calcClp} 
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Number(e.target.value);
                  setCalcClp(val);
                  if (val !== '' && calcRate > 0) setCalcUsd(Number((val / calcRate).toFixed(2)));
                }}
                className="w-28 font-black text-xs bg-transparent outline-none text-emerald-700 text-right"
                placeholder="CLP"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Filtrar Estado:</span>
        {['TODOS', 'EN_TRANSITO', 'EN_ADUANA', 'PENDIENTE', 'RECIBIDO', 'PAGADO'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
              statusFilter === st 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {st === 'TODOS' ? 'Todos los Estados' : STATUS_CONFIG[st as UsaContainerStatus]?.label || st}
          </button>
        ))}
      </div>

      {/* USA Purchases Cards / List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredPurchases.map((purchase) => {
          const StatusIcon = STATUS_CONFIG[purchase.estado]?.icon || Clock;
          const statusStyle = STATUS_CONFIG[purchase.estado] || STATUS_CONFIG.PENDIENTE;
          const pagadoUsd = Math.max(0, purchase.montoTotalUsd - purchase.saldoPendienteUsd);
          const percentPaid = purchase.montoTotalUsd > 0 ? Math.min(100, Math.round((pagadoUsd / purchase.montoTotalUsd) * 100)) : 0;
          const tcRef = purchase.tipoCambioRef || calcRate || 950;
          const saldoClpRef = Math.round(purchase.saldoPendienteUsd * tcRef);

          return (
            <div 
              key={purchase.id} 
              className="bg-white rounded-3xl border border-slate-100 shadow-lg hover:shadow-xl transition-all p-6 relative overflow-hidden"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                {/* Supplier & Container Header */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black shrink-0 shadow-md">
                    <Globe size={22} className="text-blue-400" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                        {purchase.proveedor}
                      </h4>
                      {purchase.numeroContenedor && (
                        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase border border-blue-200">
                          {purchase.numeroContenedor}
                        </span>
                      )}
                      {purchase.facturaInvoice && (
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold">
                          Inv: {purchase.facturaInvoice}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase mt-0.5">
                      {purchase.descripcion || 'Compra de Contenedor / Ropa USA'}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 mt-1 uppercase">
                      <span>Embarque: {purchase.fecha}</span>
                      {purchase.fechaLlegadaEstimada && <span>ETA Llegada: {purchase.fechaLlegadaEstimada}</span>}
                      {purchase.puertoOrigen && <span>Ruta: {purchase.puertoOrigen} ➔ {purchase.puertoDestino || 'Chile'}</span>}
                    </div>
                  </div>
                </div>

                {/* Status Badge & Actions */}
                <div className="flex items-center gap-2 self-end lg:self-center">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${statusStyle.bg} ${statusStyle.text}`}>
                    <StatusIcon size={13} /> {statusStyle.label}
                  </span>
                  
                  <button 
                    onClick={() => setSelectedPurchase(purchase)}
                    title="Ver Historial & Statement"
                    className="p-2.5 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 rounded-xl transition-all shadow-sm"
                  >
                    <History size={16} />
                  </button>
                  <button 
                    onClick={() => handleOpenEdit(purchase)}
                    title="Editar Contenedor"
                    className="p-2.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 rounded-xl transition-all shadow-sm"
                  >
                    <Edit3 size={16} />
                  </button>
                  {purchase.saldoPendienteUsd > 0.01 && (
                    <button 
                      onClick={() => handleOpenAddAbono(purchase)}
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-md flex items-center gap-1"
                    >
                      <DollarSign size={14} /> Abonar USD
                    </button>
                  )}
                  <button 
                    onClick={() => handleRemovePurchase(purchase.id, purchase.proveedor, purchase.numeroContenedor)}
                    title="Eliminar Compra"
                    className="p-2.5 bg-red-50 hover:bg-red-600 hover:text-white text-red-500 rounded-xl transition-all shadow-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Financial Breakdown & CLP Notes */}
              <div className="pt-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                {/* Total USD */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Pactado USD</p>
                  <p className="text-xl font-black text-slate-900">
                    ${purchase.montoTotalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-slate-400">USD</span>
                  </p>
                  <p className="text-[9px] font-bold text-slate-400">Ref: ~${(purchase.montoTotalClpRef || Math.round(purchase.montoTotalUsd * tcRef)).toLocaleString('es-CL')} CLP</p>
                </div>

                {/* Pagado USD */}
                <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100">
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Abonado a la Fecha</p>
                  <p className="text-xl font-black text-emerald-700">
                    ${pagadoUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-emerald-600">USD</span>
                  </p>
                  <p className="text-[9px] font-bold text-emerald-600">{purchase.abonos?.length || 0} Abonos registrados</p>
                </div>

                {/* Saldo Pendiente USD */}
                <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-100">
                  <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-0.5">Saldo Pendiente USD</p>
                  <p className="text-xl font-black text-amber-800">
                    ${purchase.saldoPendienteUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-amber-700">USD</span>
                  </p>
                  <p className="text-[9px] font-bold text-amber-700">Equiv: ~${saldoClpRef.toLocaleString('es-CL')} CLP (TC {tcRef})</p>
                </div>

                {/* Progress Bar */}
                <div className="flex flex-col justify-center">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase mb-1">
                    <span className="text-slate-400">Progreso de Pago</span>
                    <span className="text-emerald-600">{percentPaid}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-500 rounded-full" 
                      style={{ width: `${percentPaid}%` }}
                    />
                  </div>
                  {purchase.notasClp && (
                    <p className="text-[10px] text-slate-500 font-medium italic mt-2 line-clamp-1">
                      Nota CLP: {purchase.notasClp}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredPurchases.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
            <Ship size={48} className="mx-auto text-slate-300 mb-3" />
            <h4 className="text-base font-black text-slate-700 uppercase">No hay compras en USA registradas</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Comienza registrando tu primer contenedor de importación directa desde Estados Unidos haciendo clic en "Nuevo Contenedor USA".
            </p>
            <button 
              onClick={handleOpenAdd}
              className="mt-5 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-black transition-all shadow-lg"
            >
              <PlusCircle size={16} className="inline mr-1.5" /> Registrar Primer Contenedor
            </button>
          </div>
        )}
      </div>

      {/* Modal Add / Edit USA Purchase */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div>
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-0.5">Importaciones Internacionales</p>
                <h3 className="text-2xl font-black uppercase tracking-tight">
                  {editingPurchase ? 'Editar Contenedor / Compra USA' : 'Nuevo Contenedor / Compra USA'}
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-white rounded-full">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">Proveedor / Exportador USA *</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black uppercase outline-none focus:border-blue-500 text-slate-800 text-sm"
                    placeholder="EJ: TEXAS VINTAGE / MIAMI EXPORTS"
                    value={formState.proveedor}
                    onChange={(e) => setFormState({ ...formState, proveedor: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">N° Contenedor / Tracking B/L</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black uppercase outline-none focus:border-blue-500 text-slate-800 text-sm"
                    placeholder="EJ: MSKU-9482019 / MEDU-1029384"
                    value={formState.numeroContenedor}
                    onChange={(e) => setFormState({ ...formState, numeroContenedor: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">N° Factura / Invoice</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500 text-slate-800 text-sm"
                    placeholder="INV-2025-001"
                    value={formState.facturaInvoice}
                    onChange={(e) => setFormState({ ...formState, facturaInvoice: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">Fecha Embarque / Compra</label>
                  <input 
                    required 
                    type="date" 
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500 text-slate-800 text-sm"
                    value={formState.fecha}
                    onChange={(e) => setFormState({ ...formState, fecha: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">Fecha Llegada Est. (ETA)</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500 text-slate-800 text-sm"
                    value={formState.fechaLlegadaEstimada}
                    onChange={(e) => setFormState({ ...formState, fechaLlegadaEstimada: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">Puerto de Origen</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500 text-slate-800 text-xs"
                    placeholder="Miami / Houston / LA"
                    value={formState.puertoOrigen}
                    onChange={(e) => setFormState({ ...formState, puertoOrigen: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">Puerto de Destino</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500 text-slate-800 text-xs"
                    placeholder="San Antonio / Valparaíso"
                    value={formState.puertoDestino}
                    onChange={(e) => setFormState({ ...formState, puertoDestino: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">Estado de la Carga</label>
                  <select 
                    className="w-full px-3 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none focus:border-blue-500 text-slate-800 text-xs"
                    value={formState.estado}
                    onChange={(e) => setFormState({ ...formState, estado: e.target.value as UsaContainerStatus })}
                  >
                    <option value="EN_TRANSITO">EN TRÁNSITO MARÍTIMO</option>
                    <option value="EN_ADUANA">EN ADUANA / PUERTO</option>
                    <option value="RECIBIDO">RECIBIDO EN BODEGA</option>
                    <option value="PENDIENTE">PAGO PENDIENTE</option>
                    <option value="PAGADO">PAGADO TOTALMENTE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">Descripción del Contenedor</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500 text-slate-800 text-sm"
                  placeholder="Ej: Contenedor 40ft High Cube - 450 Fardos Mixtos Invierno / Polerones"
                  value={formState.descripcion}
                  onChange={(e) => setFormState({ ...formState, descripcion: e.target.value })}
                />
              </div>

              {/* Financials & Exchange Rate in USD and CLP */}
              <div className="bg-slate-900 text-white p-5 rounded-3xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Monto Total Pactado (USD $)*</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-amber-400">$</span>
                      <input 
                        required 
                        type="number" 
                        step="0.01"
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-full pl-9 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-2xl font-black text-amber-400 outline-none focus:border-amber-400"
                        placeholder="0.00"
                        value={formState.montoTotalUsd || ''}
                        onChange={(e) => setFormState({ ...formState, montoTotalUsd: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tipo de Cambio Ref. (CLP/USD)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-emerald-400">$</span>
                      <input 
                        type="number" 
                        className="w-full pl-9 pr-4 py-3.5 bg-slate-800 border border-slate-700 rounded-2xl text-lg font-black text-emerald-400 outline-none focus:border-emerald-400"
                        placeholder="950"
                        value={formState.tipoCambioRef || ''}
                        onChange={(e) => setFormState({ ...formState, tipoCambioRef: Number(e.target.value) })}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 font-bold">
                      Equivalente: ~${Math.round((formState.montoTotalUsd || 0) * (formState.tipoCambioRef || 950)).toLocaleString('es-CL')} CLP
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Notas en Pesos Chilenos (CLP) / Acuerdos de Pago</label>
                  <textarea 
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-2xl font-medium outline-none text-white text-xs"
                    rows={2}
                    placeholder="Ej: Se acordó pago inicial del 30% ($8.500.000 CLP transferidos a TC 945) y 70% contra entrega de B/L..."
                    value={formState.notasClp}
                    onChange={(e) => setFormState({ ...formState, notasClp: e.target.value })}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl transition-all"
              >
                {editingPurchase ? 'Guardar Cambios del Contenedor' : 'Registrar Contenedor USA'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Historial / Statement del Contenedor */}
      {selectedPurchase && !showAbonoModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div>
                <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest mb-0.5">Historial de Pagos & Statement</p>
                <h3 className="text-2xl font-black uppercase tracking-tight">
                  {selectedPurchase.proveedor} {selectedPurchase.numeroContenedor ? `- ${selectedPurchase.numeroContenedor}` : ''}
                </h3>
              </div>
              <button onClick={() => setSelectedPurchase(null)} className="p-2 text-slate-400 hover:text-white rounded-full">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Monto Total USD</p>
                  <p className="text-lg font-black text-slate-900">
                    ${selectedPurchase.montoTotalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Abonado USD</p>
                  <p className="text-lg font-black text-emerald-700">
                    ${(selectedPurchase.montoTotalUsd - selectedPurchase.saldoPendienteUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                  <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-0.5">Saldo Deudor USD</p>
                  <p className="text-lg font-black text-amber-800">
                    ${selectedPurchase.saldoPendienteUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {selectedPurchase.notasClp && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Notas en Pesos Chilenos</p>
                  <p className="text-xs font-medium text-slate-700">{selectedPurchase.notasClp}</p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <History size={15} /> Pagos / Wire Transfers Realizados
                  </h4>
                  {selectedPurchase.saldoPendienteUsd > 0.01 && (
                    <button 
                      onClick={() => handleOpenAddAbono(selectedPurchase)}
                      className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase flex items-center gap-1"
                    >
                      <PlusCircle size={14} /> Registrar Abono USD
                    </button>
                  )}
                </div>

                <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                  {(selectedPurchase.abonos || []).map((abono) => (
                    <div key={abono.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900 uppercase">{abono.metodo}</span>
                          {abono.referencia && (
                            <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                              Ref: {abono.referencia}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Fecha: {abono.fecha}</p>
                        {abono.notaClp && <p className="text-[10px] font-medium text-slate-600 mt-0.5">{abono.notaClp}</p>}
                        {abono.observacion && <p className="text-[10px] italic text-slate-500 mt-0.5">"{abono.observacion}"</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-base font-black text-emerald-600">
                            + ${abono.montoUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                          </p>
                          {abono.montoClp && (
                            <p className="text-[10px] font-bold text-slate-400">
                              ~${abono.montoClp.toLocaleString('es-CL')} CLP
                            </p>
                          )}
                        </div>
                        <button 
                          onClick={() => handleOpenEditAbono(selectedPurchase.id, abono)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          title="Editar Abono"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          onClick={() => handleRemoveAbono(selectedPurchase.id, abono.id)}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          title="Eliminar Abono"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!selectedPurchase.abonos || selectedPurchase.abonos.length === 0) && (
                    <div className="text-center py-8 text-slate-400 italic text-sm">
                      No se han registrado pagos para este contenedor.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Restante</p>
                  <p className="text-2xl font-black text-amber-700">
                    ${selectedPurchase.saldoPendienteUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </p>
                </div>
                {selectedPurchase.saldoPendienteUsd > 0.01 && (
                  <button 
                    onClick={() => handleOpenAddAbono(selectedPurchase)}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-wider text-xs shadow-lg transition-all"
                  >
                    REGISTRAR PAGO USD
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Abono USD */}
      {showAbonoModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-0.5">Pago de Contenedor USA</p>
                <h3 className="text-2xl font-black uppercase tracking-tight">
                  {editingAbono ? 'Editar Pago en Dólares' : 'Registrar Pago en Dólares (USD)'}
                </h3>
              </div>
              <button 
                onClick={() => { setShowAbonoModal(false); setEditingAbono(null); }}
                className="p-2 text-slate-400 hover:text-white rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveAbono} className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-200">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-0.5">Saldo Pendiente del Contenedor</p>
                <p className="text-3xl font-black text-amber-600">
                  ${((selectedPurchase?.saldoPendienteUsd || 0) + (editingAbono ? editingAbono.abono.montoUsd : 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </p>
              </div>

              {/* Monto USD */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">Monto del Pago (USD $)*</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-emerald-600">$</span>
                  <input 
                    required 
                    type="number" 
                    step="0.01"
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full pl-9 pr-4 py-3.5 bg-slate-100 border-2 border-emerald-200 rounded-2xl text-2xl font-black text-center text-slate-900 outline-none focus:border-emerald-500"
                    placeholder="0.00"
                    value={abonoForm.montoUsd || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      const clp = Math.round(val * abonoForm.tipoCambio);
                      setAbonoForm({
                        ...abonoForm,
                        montoUsd: val,
                        montoClp: clp,
                        notaClp: `$${clp.toLocaleString('es-CL')} CLP pagados a TC ${abonoForm.tipoCambio}`
                      });
                    }}
                  />
                </div>
              </div>

              {/* Tipo de Cambio y Equivalente CLP */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">Tipo de Cambio (CLP/USD)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-800 outline-none text-sm"
                    value={abonoForm.tipoCambio || ''}
                    onChange={(e) => {
                      const rate = Number(e.target.value) || 1;
                      const clp = Math.round(abonoForm.montoUsd * rate);
                      setAbonoForm({
                        ...abonoForm,
                        tipoCambio: rate,
                        montoClp: clp,
                        notaClp: `$${clp.toLocaleString('es-CL')} CLP pagados a TC ${rate}`
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">Monto en Pesos Chilenos (CLP $)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-emerald-700 outline-none text-sm"
                    value={abonoForm.montoClp || ''}
                    onChange={(e) => {
                      const clp = Number(e.target.value) || 0;
                      const rate = abonoForm.tipoCambio > 0 ? abonoForm.tipoCambio : 950;
                      setAbonoForm({
                        ...abonoForm,
                        montoClp: clp,
                        notaClp: `$${clp.toLocaleString('es-CL')} CLP pagados a TC ${rate}`
                      });
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">Método de Transferencia</label>
                  <select 
                    className="w-full px-3 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none text-xs text-slate-800"
                    value={abonoForm.metodo}
                    onChange={(e) => setAbonoForm({ ...abonoForm, metodo: e.target.value })}
                  >
                    <option value="Transferencia SWIFT / Wire">TRANSFERENCIA SWIFT / WIRE</option>
                    <option value="Tarjeta en USD">TARJETA CRÉDITO USD</option>
                    <option value="Remesa / Casa de Cambio">REMESA / CASA DE CAMBIO</option>
                    <option value="Efectivo USD">EFECTIVO DÓLARES</option>
                    <option value="Otro">OTRO</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">N° Operación / SWIFT Ref</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none text-xs text-slate-800"
                    placeholder="Ref SWIFT / Comprobante"
                    value={abonoForm.referencia}
                    onChange={(e) => setAbonoForm({ ...abonoForm, referencia: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">Nota Descriptiva en CLP & USD (Editable)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium outline-none text-slate-800 text-xs"
                  placeholder="Ej: $4.750.000 CLP transferidos desde Banco de Chile..."
                  value={abonoForm.notaClp}
                  onChange={(e) => setAbonoForm({ ...abonoForm, notaClp: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">Fecha</label>
                  <input 
                    required 
                    type="date" 
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none text-xs text-slate-800"
                    value={abonoForm.fecha}
                    onChange={(e) => setAbonoForm({ ...abonoForm, fecha: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">Observación adicional</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium outline-none text-slate-800 text-xs"
                    placeholder="Opcional..."
                    value={abonoForm.observacion}
                    onChange={(e) => setAbonoForm({ ...abonoForm, observacion: e.target.value })}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <BadgeDollarSign size={18} /> {editingAbono ? 'Guardar Cambios del Pago' : 'Confirmar Pago en Dólares'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
