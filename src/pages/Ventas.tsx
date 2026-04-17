import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Phone, CheckCircle2, AlertCircle, X, Save, MapPin, CreditCard, UserCheck, Tag, Info, FileEdit, BadgeDollarSign, Truck, Building2, Home, Package, PlusCircle } from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { formatCurrencyWithUSD } from '../utils/currency';
import { SaleStatus, SaleType, Sale, DispatchType } from '../types';

export default function Ventas() {
  const { sales, updateSale, playSound, settings } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'READY'>('PENDING');
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const pendingLiveSales = sales.filter(s => !s.datosCompletos && s.tipoVenta === SaleType.LIVE);
  const readySales = sales.filter(s => s.datosCompletos || s.tipoVenta === SaleType.NORMAL);
  const currentSales = activeTab === 'PENDING' ? pendingLiveSales : readySales;

  const filteredSales = currentSales.filter(s => 
    s.cliente.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.codigoFardo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.numeroVenta.toString().includes(searchTerm)
  );

  const handleCompleteSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;
    
    const finalSale = {
      ...editingSale,
      datosCompletos: true,
      status: SaleStatus.PENDIENTE,
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
        <div className="flex items-center gap-4">
          <Link to="/registrar-venta" className="flex items-center gap-3 px-8 py-4 bg-amber-600 text-white rounded-[20px] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-amber-700 transition-all">
            <PlusCircle size={18} /> Registrar Venta
          </Link>
          <div className="flex bg-slate-200 p-1.5 rounded-[24px] shadow-inner">
            <button 
              onClick={() => { setActiveTab('PENDING'); playSound('click'); }}
              className={`flex items-center gap-3 px-8 py-3.5 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'PENDING' ? 'bg-amber-500 text-white shadow-xl' : 'text-slate-600'}`}
            >
              <AlertCircle size={18} /> Pendientes Live ({pendingLiveSales.length})
            </button>
            <button 
              onClick={() => { setActiveTab('READY'); playSound('click'); }}
              className={`flex items-center gap-3 px-8 py-3.5 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'READY' ? 'bg-amber-600 text-white shadow-xl' : 'text-slate-600'}`}
            >
              <CheckCircle2 size={18} /> Ventas Completas ({readySales.length})
            </button>
          </div>
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
                  <td className="px-8 py-6 font-mono font-black text-slate-900 text-lg">#{sale.numeroVenta}</td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 uppercase tracking-tight">{sale.cliente}</span>
                      <a 
                        href={`https://wa.me/${sale.telefono.replace(/\D/g, '')}`} 
                        target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs text-amber-600 font-black hover:underline"
                      >
                        <Phone size={14} /> {sale.telefono}
                      </a>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-3">
                        <Tag size={18} className="text-slate-400" />
                        <span className="font-black text-slate-700 uppercase">{sale.codigoFardo}</span>
                      </div>
                      <span className="text-[9px] font-black text-slate-400 uppercase ml-7">{sale.variante || 'Pendiente Clasificar'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-slate-900 text-2xl tracking-tighter">
                    {formatCurrencyWithUSD(sale.total, settings.dolarBlueRate)}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <button 
                      onClick={() => togglePaymentStatus(sale)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all shadow-sm ${sale.estadoPago === 'Pagado' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}
                    >
                      <BadgeDollarSign size={14} /> {sale.estadoPago}
                    </button>
                  </td>
                  <td className="px-8 py-6 text-center">
                    {activeTab === 'PENDING' ? (
                      <button 
                        onClick={() => setEditingSale(sale)}
                        className="px-6 py-3 bg-amber-500 text-white rounded-[18px] font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition-all flex items-center gap-2 mx-auto shadow-xl"
                      >
                        <FileEdit size={16} /> Completar Datos
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-400 rounded-full text-[10px] font-black uppercase">
                        <CheckCircle2 size={12} /> Datos OK
                      </div>
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
                <p className="text-amber-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Completar Datos de Venta Live</p>
                <h3 className="text-4xl font-black uppercase tracking-tighter">CLIENTE: {editingSale.cliente}</h3>
              </div>
              <button onClick={() => setEditingSale(null)} className="relative z-10 p-3 hover:bg-white/10 rounded-full transition-colors">
                <X size={36} />
              </button>
            </div>
            
            <form onSubmit={handleCompleteSale} className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block flex items-center gap-2">
                    <CreditCard size={14} className="text-amber-500" /> DNI Cliente
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
                  <Truck size={14} className="text-amber-500" /> Tipo de Entrega
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
                    className="w-full px-7 py-4 bg-amber-50 border-2 border-amber-200 text-amber-900 rounded-[24px] font-black text-lg outline-none appearance-none" 
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
                <button type="submit" className="flex-[2] py-6 bg-amber-600 text-white font-black rounded-[24px] shadow-2xl flex items-center justify-center gap-3 text-xl hover:bg-amber-700 transition-all active:scale-95">
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
