import React, { useState } from 'react';
import { 
  History, 
  Trash2, 
  Edit3, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Container, 
  X, 
  BadgeDollarSign 
} from 'lucide-react';
import { useStore } from '../../store/GlobalContext';
import { PurchaseType, Purchase, Abono } from '../../types';

interface DomesticPurchasesTabProps {
  searchTerm: string;
}

export default function DomesticPurchasesTab({ searchTerm }: DomesticPurchasesTabProps) {
  const { purchases, addPurchase, updatePurchase, removePurchase, addAbono, updateAbono, removeAbono, playSound } = useStore();
  
  const [showAdd, setShowAdd] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [showAbonoForm, setShowAbonoForm] = useState(false);
  const [editingAbono, setEditingAbono] = useState<{ purchaseId: string; abono: Abono } | null>(null);

  const [purchaseForm, setPurchaseForm] = useState({
    proveedor: '',
    tipo: PurchaseType.NOTA_VENTA,
    descripcion: '',
    montoTotal: 0,
    fecha: new Date().toISOString().split('T')[0],
    notas: ''
  });

  const [abonoForm, setAbonoForm] = useState({
    monto: 0,
    metodo: 'Transferencia',
    observacion: '',
    fecha: new Date().toISOString().split('T')[0]
  });

  const handleOpenAdd = () => {
    setEditingPurchase(null);
    setPurchaseForm({
      proveedor: '',
      tipo: PurchaseType.NOTA_VENTA,
      descripcion: '',
      montoTotal: 0,
      fecha: new Date().toISOString().split('T')[0],
      notas: ''
    });
    setShowAdd(true);
  };

  const handleOpenEdit = (p: Purchase) => {
    setEditingPurchase(p);
    setPurchaseForm({
      proveedor: p.proveedor,
      tipo: p.tipo,
      descripcion: p.descripcion,
      montoTotal: p.montoTotal,
      fecha: p.fecha,
      notas: p.notas || ''
    });
    setShowAdd(true);
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPurchase) {
      await updatePurchase(editingPurchase.id, {
        proveedor: purchaseForm.proveedor.trim().toUpperCase(),
        tipo: purchaseForm.tipo,
        descripcion: purchaseForm.descripcion,
        montoTotal: Number(purchaseForm.montoTotal) || 0,
        fecha: purchaseForm.fecha,
        notas: purchaseForm.notas
      });
    } else {
      addPurchase({
        proveedor: purchaseForm.proveedor.trim().toUpperCase(),
        tipo: purchaseForm.tipo,
        descripcion: purchaseForm.descripcion,
        montoTotal: Number(purchaseForm.montoTotal) || 0,
        fecha: purchaseForm.fecha,
        notas: purchaseForm.notas
      });
    }
    setShowAdd(false);
    setEditingPurchase(null);
  };

  const handleRemovePurchase = (id: string, proveedor: string) => {
    if (confirm(`⚠️ ¿Estás seguro de eliminar la compra de ${proveedor}? Esto también borrará todos sus abonos asociados.`)) {
      removePurchase(id);
    }
  };

  const handleSaveAbono = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAbono) {
      await updateAbono(editingAbono.purchaseId, editingAbono.abono.id, {
        monto: Number(abonoForm.monto) || 0,
        metodo: abonoForm.metodo,
        observacion: abonoForm.observacion,
        fecha: abonoForm.fecha
      });
      setEditingAbono(null);
    } else if (selectedPurchase) {
      addAbono(selectedPurchase.id, abonoForm.monto, abonoForm.metodo, abonoForm.observacion, abonoForm.fecha);
      setShowAbonoForm(false);
    }
    setAbonoForm({ monto: 0, metodo: 'Transferencia', observacion: '', fecha: new Date().toISOString().split('T')[0] });
  };

  const handleRemoveAbono = (purchaseId: string, abonoId: string) => {
    if (confirm("¿Estás seguro de eliminar este abono? El saldo pendiente se recalculará automáticamente.")) {
      removeAbono(purchaseId, abonoId);
      const updated = purchases.find(p => p.id === purchaseId);
      if (updated) setSelectedPurchase(updated);
    }
  };

  const filteredPurchases = purchases.filter(p => 
    p.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deudaTotal = purchases.reduce((acc, p) => acc + (p.saldoPendiente || 0), 0);
  const totalFacturado = purchases.reduce((acc, p) => acc + (p.montoTotal || 0), 0);
  const totalAbonado = totalFacturado - deudaTotal;

  return (
    <div className="space-y-6">
      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Deuda Total Nacional</p>
          <h3 className="text-3xl font-black text-red-600 tracking-tight">${deudaTotal.toLocaleString('es-CL')}</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-2">Saldo pendiente en pesos chilenos</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pagado / Abonado</p>
          <h3 className="text-3xl font-black text-emerald-600 tracking-tight">${totalAbonado.toLocaleString('es-CL')}</h3>
          <p className="text-[10px] text-emerald-600 font-bold mt-2">Abonos realizados con éxito</p>
        </div>
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Compras CLP</p>
            <button 
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-[10px] uppercase rounded-xl tracking-wider transition-all flex items-center gap-1.5 active:scale-95"
            >
              <PlusCircle size={14} /> Nueva Compra
            </button>
          </div>
          <h3 className="text-3xl font-black tracking-tight text-white mt-3">${totalFacturado.toLocaleString('es-CL')}</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-2">{purchases.length} operaciones registradas</p>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Proveedor / Tipo</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalle & Notas</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total CLP</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Saldo Pendiente</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.map((p) => (
                <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 uppercase tracking-tight text-sm">{p.proveedor}</span>
                      <span className={`flex items-center gap-1.5 text-[9px] font-black uppercase mt-1 ${p.tipo === PurchaseType.CONTENEDOR ? 'text-blue-600' : 'text-amber-600'}`}>
                        {p.tipo === PurchaseType.CONTENEDOR ? <Container size={12} /> : <FileText size={12} />} {p.tipo}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-bold text-slate-600 uppercase italic line-clamp-1">{p.descripcion || 'Sin descripción'}</p>
                    {p.notas && <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">Nota: {p.notas}</p>}
                    <p className="text-[9px] font-black text-slate-400 mt-1 uppercase">Fecha: {p.fecha}</p>
                  </td>
                  <td className="px-6 py-5 text-right font-black text-slate-500 text-sm">
                    ${(p.montoTotal || 0).toLocaleString('es-CL')}
                  </td>
                  <td className="px-6 py-5 text-right font-black text-slate-900 text-lg tracking-tight">
                    ${(p.saldoPendiente || 0).toLocaleString('es-CL')}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${p.estado === 'PAGADO' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {p.estado === 'PAGADO' ? <CheckCircle2 size={12} /> : <Clock size={12} />} {p.estado}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={() => setSelectedPurchase(p)}
                        title="Ver Historial de Abonos"
                        className="p-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                      >
                        <History size={16} />
                      </button>
                      <button 
                        onClick={() => handleOpenEdit(p)}
                        title="Editar Compra"
                        className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      >
                        <Edit3 size={16} />
                      </button>
                      {p.estado === 'PENDIENTE' && (
                        <button 
                          onClick={() => { setSelectedPurchase(p); setShowAbonoForm(true); }}
                          className="px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-wider transition-all shadow-sm"
                        >
                          ABONAR
                        </button>
                      )}
                      <button 
                        onClick={() => handleRemovePurchase(p.id, p.proveedor)}
                        title="Eliminar Compra"
                        className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPurchases.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 italic font-medium">
                    No se encontraron compras nacionales registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Purchase */}
      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-7 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-1">Proveedores Locales</p>
                <h3 className="text-2xl font-black uppercase tracking-tight">
                  {editingPurchase ? 'Editar Compra Nacional' : 'Nueva Compra Nacional'}
                </h3>
              </div>
              <button onClick={() => setShowAdd(false)} className="p-2 text-slate-400 hover:text-white rounded-full">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSavePurchase} className="p-7 space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-2">Proveedor</label>
                <input 
                  required 
                  type="text" 
                  className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black uppercase outline-none focus:border-emerald-500 text-slate-800"
                  placeholder="NOMBRE DEL PROVEEDOR"
                  value={purchaseForm.proveedor}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, proveedor: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-2">Tipo de Compra</label>
                  <select 
                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none text-slate-800"
                    value={purchaseForm.tipo}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, tipo: e.target.value as PurchaseType })}
                  >
                    <option value={PurchaseType.NOTA_VENTA}>NOTA DE VENTA</option>
                    <option value={PurchaseType.CONTENEDOR}>CONTENEDOR CERRADO</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-2">Fecha</label>
                  <input 
                    required 
                    type="date" 
                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none text-slate-800"
                    value={purchaseForm.fecha}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, fecha: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-2">Descripción</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none text-slate-800"
                  placeholder="Ej: 15 Fardos Polerones y Chaquetas"
                  value={purchaseForm.descripcion}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, descripcion: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-2">Notas Adicionales</label>
                <textarea 
                  className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium outline-none text-slate-800 text-sm"
                  rows={2}
                  placeholder="Observaciones de pago, acuerdos o cheques pendientes..."
                  value={purchaseForm.notas}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, notas: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-2">Monto Total Pactado (CLP $)</label>
                <input 
                  required 
                  type="number" 
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full px-6 py-4 bg-slate-900 text-emerald-400 text-2xl font-black rounded-2xl outline-none"
                  placeholder="0"
                  value={purchaseForm.montoTotal || ''}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, montoTotal: Number(e.target.value) })}
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl transition-all"
              >
                {editingPurchase ? 'Guardar Cambios' : 'Registrar Compra Nacional'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Historial de Abonos */}
      {selectedPurchase && !showAbonoForm && !editingAbono && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-7 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest mb-1">Historial de Pagos</p>
                <h3 className="text-2xl font-black uppercase tracking-tight">{selectedPurchase.proveedor}</h3>
              </div>
              <button onClick={() => setSelectedPurchase(null)} className="p-2 text-slate-400 hover:text-white rounded-full">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-7 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monto Total</p>
                  <p className="text-xl font-black text-slate-900">${(selectedPurchase.montoTotal || 0).toLocaleString('es-CL')}</p>
                </div>
                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Pagado a la Fecha</p>
                  <p className="text-xl font-black text-emerald-600">
                    ${((selectedPurchase.montoTotal || 0) - (selectedPurchase.saldoPendiente || 0)).toLocaleString('es-CL')}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <History size={15} /> Detalle de Abonos
                  </h4>
                  {selectedPurchase.estado === 'PENDIENTE' && (
                    <button 
                      onClick={() => setShowAbonoForm(true)}
                      className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase flex items-center gap-1"
                    >
                      <PlusCircle size={14} /> Nuevo Abono
                    </button>
                  )}
                </div>
                <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                  {(selectedPurchase.abonos || []).map((abono) => (
                    <div key={abono.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group">
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase">{abono.metodo}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{abono.fecha}</p>
                        {abono.observacion && <p className="text-[10px] italic text-slate-600 mt-0.5 font-medium">"{abono.observacion}"</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-base font-black text-emerald-600">+ ${(abono.monto || 0).toLocaleString('es-CL')}</p>
                        <button 
                          onClick={() => {
                            setEditingAbono({ purchaseId: selectedPurchase.id, abono });
                            setAbonoForm({
                              monto: abono.monto,
                              metodo: abono.metodo,
                              observacion: abono.observacion,
                              fecha: abono.fecha
                            });
                          }}
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
                    <div className="text-center py-8 text-slate-400 italic text-sm">No hay abonos registrados para esta compra.</div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Restante</p>
                  <p className="text-2xl font-black text-red-600">${(selectedPurchase.saldoPendiente || 0).toLocaleString('es-CL')}</p>
                </div>
                {selectedPurchase.estado === 'PENDIENTE' && (
                  <button 
                    onClick={() => setShowAbonoForm(true)}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-wider text-xs shadow-lg transition-all"
                  >
                    REGISTRAR ABONO
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Abono */}
      {(showAbonoForm || editingAbono) && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-emerald-600 text-white flex justify-between items-center">
              <div>
                <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-1">Cuentas por Pagar</p>
                <h3 className="text-2xl font-black uppercase tracking-tight">
                  {editingAbono ? 'Editar Abono CLP' : 'Registrar Abono CLP'}
                </h3>
              </div>
              <button 
                onClick={() => { setShowAbonoForm(false); setEditingAbono(null); }} 
                className="p-2 text-white/80 hover:text-white rounded-full"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveAbono} className="p-6 space-y-4">
              <div className="bg-emerald-50 p-4 rounded-2xl text-center border border-emerald-200">
                <p className="text-[10px] font-black text-emerald-700 uppercase mb-0.5">Saldo Pendiente Actual</p>
                <p className="text-3xl font-black text-emerald-800">
                  ${((selectedPurchase?.saldoPendiente || 0) + (editingAbono ? editingAbono.abono.monto : 0)).toLocaleString('es-CL')}
                </p>
              </div>
              
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-2">Monto del Abono (CLP $)</label>
                <input 
                  required 
                  type="number" 
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full px-6 py-4 bg-slate-100 border-2 border-emerald-100 rounded-2xl text-3xl font-black text-center outline-none focus:border-emerald-500 text-slate-900"
                  placeholder="0"
                  value={abonoForm.monto || ''}
                  onChange={(e) => setAbonoForm({ ...abonoForm, monto: Number(e.target.value) })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-2">Método</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none text-xs text-slate-800"
                    value={abonoForm.metodo}
                    onChange={(e) => setAbonoForm({ ...abonoForm, metodo: e.target.value })}
                  >
                    <option value="Transferencia">TRANSFERENCIA</option>
                    <option value="Efectivo">EFECTIVO / CAJA</option>
                    <option value="Cheque">CHEQUE</option>
                    <option value="Tarjeta">TARJETA</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-2">Fecha</label>
                  <input 
                    required 
                    type="date" 
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none text-xs text-slate-800"
                    value={abonoForm.fecha}
                    onChange={(e) => setAbonoForm({ ...abonoForm, fecha: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-2">Observación / Detalle</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium outline-none text-slate-800 text-sm"
                  placeholder="Ej: Pago cuota 1 fardos, ref transferencia..."
                  value={abonoForm.observacion}
                  onChange={(e) => setAbonoForm({ ...abonoForm, observacion: e.target.value })}
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <BadgeDollarSign size={18} /> {editingAbono ? 'Guardar Cambios Abono' : 'Confirmar Abono'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
