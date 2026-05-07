
import React, { useState } from 'react';
import { Search, Phone, CheckCircle2, AlertCircle, X, Save, MapPin, CreditCard, UserCheck, Tag, Info, FileEdit, BadgeDollarSign, Truck, Building2, Home, Package, Trash2, Camera } from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { SaleStatus, SaleType, Sale, DispatchType } from '../types';

export default function Ventas() {
  const { sales, updateSale, playSound, deleteSale, deleteAllSales, currentUser, stock } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'READY'>('PENDING');
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const isAdmin = currentUser?.rol === 'Admin';

  const pendingLiveSales = sales.filter(s => !s.datosCompletos && s.tipoVenta === SaleType.LIVE);
  const readySales = sales.filter(s => {
    if (!(s.datosCompletos || s.tipoVenta === SaleType.NORMAL)) return false;
    
    // Attempt parsing; if it fails, default to today or skip
    const d = s.fecha ? new Date(s.fecha) : new Date();
    if (isNaN(d.getTime())) return false; // Invalid date
    
    return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
  });
  const currentSales = activeTab === 'PENDING' ? pendingLiveSales : readySales;

  const filteredSales = currentSales.filter(s => 
    s.cliente.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.codigoFardo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.numeroVenta.toString().includes(searchTerm)
  );

  const handleSaveSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;
    
    // Ensure dispatch type is set, default to AGENCIA if not selected
    const finalSale = {
      ...editingSale,
      datosCompletos: true,
      status: editingSale.status === SaleStatus.PENDIENTE ? SaleStatus.PENDIENTE : editingSale.status,
      tipoDespacho: editingSale.tipoDespacho || DispatchType.AGENCIA
    };

    updateSale(editingSale.id, finalSale);
    setEditingSale(null);
    playSound('success');
  };

  const togglePaymentStatus = (sale: Sale) => {
    const newStatus = sale.estadoPago === 'Pagado' ? 'Pendiente' : 'Pagado';
    updateSale(sale.id, { estadoPago: newStatus });
    playSound('success');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Historial de Ventas</h2>
          <p className="text-slate-500 italic font-medium">Gestión de clientes y recolección de datos pendientes</p>
        </div>
        <div className="flex bg-slate-200 p-1.5 rounded-[24px] shadow-inner">
          {isAdmin && (
            <button 
              onClick={() => { if(confirm('¿BORRAR TODO EL HISTORIAL?')) deleteAllSales(); playSound('click'); }}
              className="flex items-center gap-2 px-4 py-3.5 rounded-[20px] font-black text-xs uppercase tracking-widest text-red-600 hover:bg-red-100 transition-all"
            >
              <Trash2 size={16} /> Borrar Todo
            </button>
          )}
          <button 
            onClick={() => { setActiveTab('PENDING'); playSound('click'); }}
            className={`flex items-center gap-3 px-8 py-3.5 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'PENDING' ? 'bg-amber-500 text-white shadow-xl' : 'text-slate-600'}`}
          >
            <AlertCircle size={18} /> Pendientes Live ({pendingLiveSales.length})
          </button>
          <button 
            onClick={() => { setActiveTab('READY'); playSound('click'); }}
            className={`flex items-center gap-3 px-8 py-3.5 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'READY' ? 'bg-emerald-500 text-white shadow-xl' : 'text-slate-600'}`}
          >
            <CheckCircle2 size={18} /> Ventas Completas ({readySales.length})
          </button>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={28} />
        <input 
          type="text" 
          placeholder="Buscar por cliente, fardo o número de venta..."
          className="w-full pl-16 pr-8 py-5 rounded-[32px] border-2 border-slate-100 focus:border-slate-300 outline-none transition-all shadow-sm text-xl font-bold"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {activeTab === 'READY' && (
        <div className="flex gap-4 p-4 bg-slate-50 rounded-[24px]">
          <select className="px-6 py-3 rounded-xl border font-bold" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="px-6 py-3 rounded-xl border font-bold" value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
            {Array.from({length: 12}).map((_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('es-ES', { month: 'long' })}</option>)}
          </select>
        </div>
      )}

      <div className="bg-white rounded-[48px] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operación</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Producto / Mercadería</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Monto</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado Pago</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="group hover:bg-slate-50/80 transition-colors">
                  <td className="px-8 py-6 font-mono font-black text-slate-900 text-lg flex items-center gap-2">
                    #{sale.numeroVenta}
                    {sale.comprobante && (
                      <a href={sale.comprobante} target="_blank" rel="noreferrer" className="text-emerald-500 hover:text-emerald-700">
                        <Camera size={16} />
                      </a>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 uppercase tracking-tight">{sale.cliente}</span>
                      <a 
                        href={`https://wa.me/${sale.telefono.replace(/\D/g, '')}`} 
                        target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs text-emerald-600 font-black hover:underline"
                      >
                        <Phone size={14} /> {sale.telefono}
                      </a>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-3">
                        <Tag size={18} className="text-slate-400" />
                        <span className="font-black text-slate-700 uppercase">
                          {sale.tipoVenta === SaleType.NOTA_VENTA 
                            ? 'Nota de Venta (Varios)' 
                            : stock.find(item => item.codigo === sale.codigoFardo)?.tipo || sale.codigoFardo}
                        </span>
                      </div>
                      <span className="text-[9px] font-black text-slate-400 uppercase ml-7">
                        {sale.tipoVenta === SaleType.NOTA_VENTA 
                          ? sale.items?.map(i => i.codigoFardo).join(', ') 
                          : (sale.variante || 'Pendiente Clasificar')}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-slate-900 text-2xl tracking-tighter">
                    ${sale.total.toLocaleString()}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <button 
                      onClick={() => togglePaymentStatus(sale)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all shadow-sm ${sale.estadoPago === 'Pagado' ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-100'}`}
                    >
                      <BadgeDollarSign size={14} /> {sale.estadoPago}
                    </button>
                  </td>
                  <td className="px-8 py-6 text-center">
                      <button 
                        onClick={() => setEditingSale(sale)}
                        className={`px-6 py-3 rounded-[18px] font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 mx-auto shadow-xl ${activeTab === 'PENDING' ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                      >
                        <FileEdit size={16} /> {activeTab === 'PENDING' ? 'Completar' : 'Editar'}
                      </button>
                    {isAdmin && (
                      <button
                        onClick={() => { if(confirm('¿Borrar venta?')) deleteSale(sale.id); }}
                        className="mt-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingSale && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[56px] shadow-[0_50px_100px_rgba(0,0,0,0.5)] w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10 bg-slate-900 text-white flex justify-between items-center relative">
              <div className="relative z-10">
                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Completar Datos de Venta Live</p>
                <h3 className="text-4xl font-black uppercase tracking-tighter">CLIENTE: {editingSale.cliente}</h3>
              </div>
              <button onClick={() => setEditingSale(null)} className="relative z-10 p-3 hover:bg-white/10 rounded-full transition-colors">
                <X size={36} />
              </button>
            </div>
            
            <form onSubmit={handleSaveSale} className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block flex items-center gap-2">
                    <CreditCard size={14} className="text-blue-500" /> RUT Cliente
                  </label>
                  <input required type="text" className="w-full px-7 py-4 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black text-lg" placeholder="12.345.678-9" value={editingSale.rut || ''} onChange={(e) => setEditingSale({...editingSale, rut: e.target.value})}/>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Estado Pago Actual</label>
                  <select className="w-full px-7 py-4 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black text-lg" value={editingSale.estadoPago} onChange={(e) => setEditingSale({...editingSale, estadoPago: e.target.value})}>
                    <option value="Pendiente">PENDIENTE DE PAGO</option>
                    <option value="Pagado">YA PAGADO</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block flex items-center gap-2">
                  <MapPin size={14} className="text-amber-500" /> Dirección Completa Despacho
                </label>
                <input required type="text" className="w-full px-7 py-4 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black text-lg" placeholder="CALLE, N°, COMUNA, REGIÓN" value={editingSale.direccion || ''} onChange={(e) => setEditingSale({...editingSale, direccion: e.target.value.toUpperCase()})}/>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block flex items-center gap-2">
                  <Truck size={14} className="text-blue-500" /> Tipo de Entrega
                </label>
                <div className="flex bg-slate-50 p-1.5 rounded-[24px] border-2 border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setEditingSale({...editingSale, tipoDespacho: DispatchType.AGENCIA})}
                    className={`flex-1 py-3 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${editingSale.tipoDespacho === DispatchType.AGENCIA ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-200'}`}
                  >
                    <Building2 size={16} /> Agencia
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditingSale({...editingSale, tipoDespacho: DispatchType.DOMICILIO})}
                    className={`flex-1 py-3 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${editingSale.tipoDespacho === DispatchType.DOMICILIO ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-200'}`}
                  >
                    <Home size={16} /> Domicilio
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditingSale({...editingSale, tipoDespacho: DispatchType.RETIRO})}
                    className={`flex-1 py-3 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${editingSale.tipoDespacho === DispatchType.RETIRO ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-200'}`}
                  >
                    <Package size={16} /> Retiro
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Tipo de Mercadería (Obligatorio)</label>
                  <select 
                    required 
                    className="w-full px-7 py-4 bg-blue-50 border-2 border-blue-200 text-blue-900 rounded-[24px] font-black text-lg outline-none appearance-none" 
                    value={editingSale.variante} 
                    onChange={(e) => setEditingSale({...editingSale, variante: e.target.value})}
                  >
                    <option value="">SELECCIONAR TIPO...</option>
                    <option value="FARDO">FARDO COMPLETO</option>
                    <option value="MEDIO FARDO">MEDIO FARDO</option>
                    <option value="LOTE">LOTE</option>
                    <option value="SACO">SACO</option>
                    <option value="PACK">PACK</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Prioridad Envío</label>
                  <select className="w-full px-7 py-4 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black text-lg" value={editingSale.juntaCompra} onChange={(e) => setEditingSale({...editingSale, juntaCompra: e.target.value})}>
                    <option value="DESPACHO INMEDIATO">DESPACHO INMEDIATO</option>
                    <option value="JUNTA COMPRA">JUNTA COMPRA</option>
                    <option value="RETIRO BODEGA">RETIRO BODEGA</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 flex gap-6">
                <button type="button" onClick={() => setEditingSale(null)} className="flex-1 py-5 border-2 border-slate-100 text-slate-400 font-black rounded-[24px] hover:bg-slate-50 transition-all uppercase tracking-widest text-xs">Cerrar</button>
                <button type="submit" className="flex-[2] py-6 bg-emerald-500 text-white font-black rounded-[24px] shadow-2xl flex items-center justify-center gap-3 text-xl hover:bg-emerald-600 transition-all active:scale-95">
                  <Save size={24} /> GUARDAR Y FINALIZAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
