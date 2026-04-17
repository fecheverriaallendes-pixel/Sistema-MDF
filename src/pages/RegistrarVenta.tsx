import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Zap, ClipboardList, CheckCircle2, User, Phone, DollarSign, Package, MapPin, Tag, Truck, CreditCard, FileText, ChevronRight, Coins, Building2, Home } from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { SaleType, SaleStatus, StaffRole, CommissionType, DispatchType } from '../types';
import { formatUSD } from '../utils/currency';

export default function RegistrarVenta() {
  const { stock, staff, addSale, playSound, settings } = useStore();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'QUICK' | 'NORMAL'>('QUICK');
  const [success, setSuccess] = useState(false);
  
  const vendedores = staff.filter(m => m.rol === StaffRole.VENDEDOR);
  const quickNameRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<{
    cliente: string;
    vendedor: string;
    telefono: string;
    rut: string;
    codigoFardo: string;
    variante: string;
    valorUnitario: number;
    cantidad: number;
    direccion: string;
    estadoPago: string;
    tipoComision: CommissionType;
    juntaCompra: string;
    observaciones: string;
    tipoDespacho?: DispatchType;
  }>({
    cliente: '',
    vendedor: '',
    telefono: '',
    rut: '',
    codigoFardo: '',
    variante: '',
    valorUnitario: 0,
    cantidad: 1,
    direccion: '',
    estadoPago: 'Pendiente',
    tipoComision: CommissionType.FARDO_NORMAL,
    juntaCompra: 'DESPACHO INMEDIATO',
    observaciones: '',
    tipoDespacho: undefined
  });

  useEffect(() => {
    if (mode === 'QUICK') quickNameRef.current?.focus();
  }, [mode, success]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isQuick = mode === 'QUICK';
    
    const finalData = {
      ...formData,
      tipoVenta: isQuick ? SaleType.LIVE : SaleType.NORMAL,
      total: formData.valorUnitario * formData.cantidad,
      status: SaleStatus.PENDIENTE,
      datosCompletos: !isQuick,
      variante: isQuick ? '' : formData.variante,
      tipoDespacho: isQuick ? undefined : (formData.tipoDespacho || DispatchType.AGENCIA)
    };

    addSale(finalData);
    setSuccess(true);
    playSound('success');
    
    setFormData({
      cliente: '', vendedor: formData.vendedor, telefono: '', rut: '',
      codigoFardo: '', variante: isQuick ? '' : 'Fardo', valorUnitario: 0, cantidad: 1,
      direccion: '', estadoPago: 'Pendiente', tipoComision: CommissionType.FARDO_NORMAL,
      juntaCompra: 'DESPACHO INMEDIATO', observaciones: '', tipoDespacho: undefined
    });
    
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Terminal de Ventas</h2>
          <p className="text-slate-500 font-medium italic">Selecciona el flujo operativo Fardos Aaron</p>
        </div>
        <div className="flex bg-slate-200 p-1.5 rounded-[24px] shadow-inner w-full sm:w-auto">
          <button 
            onClick={() => { setMode('QUICK'); playSound('click'); }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all ${mode === 'QUICK' ? 'bg-amber-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <Zap size={20} /> Modo Live
          </button>
          <button 
            onClick={() => { setMode('NORMAL'); playSound('click'); }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all ${mode === 'NORMAL' ? 'bg-amber-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <ClipboardList size={20} /> Venta Normal
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-amber-600 text-white px-8 py-6 rounded-[32px] flex items-center gap-4 animate-bounce shadow-2xl shadow-amber-600/30">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"><CheckCircle2 size={32} /></div>
          <div>
            <p className="font-black text-xl uppercase italic">¡Operación Exitosa!</p>
            <p className="text-amber-100 text-sm font-bold">Venta registrada en el sistema central.</p>
          </div>
        </div>
      )}

      <div className={`bg-white rounded-[48px] border-2 transition-all shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] overflow-hidden ${mode === 'QUICK' ? 'border-amber-100' : 'border-amber-100'}`}>
        <div className={`p-8 border-b flex items-center justify-between ${mode === 'QUICK' ? 'bg-amber-50/30 border-amber-100' : 'bg-amber-50/30 border-amber-100'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${mode === 'QUICK' ? 'bg-amber-600' : 'bg-amber-600'}`}>
              {mode === 'QUICK' ? <Zap size={24} /> : <FileText size={24} />}
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase">{mode === 'QUICK' ? 'Captura Rápida TikTok' : 'Venta con Detalle Completo'}</h3>
              <p className="text-slate-500 text-xs font-medium italic">{mode === 'QUICK' ? 'Campos mínimos para fluidez del Live' : 'Información completa para logística y facturación'}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">
                <User size={14} className="text-amber-500" /> Cliente
              </label>
              <input ref={quickNameRef} required type="text" className="w-full px-7 py-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] text-xl font-black focus:border-amber-500 outline-none transition-all uppercase" placeholder="NOMBRE" value={formData.cliente} onChange={(e) => setFormData({...formData, cliente: e.target.value.toUpperCase()})}/>
            </div>
            
            <div className="md:col-span-1">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">
                <Phone size={14} className="text-amber-500" /> WhatsApp / Teléfono
              </label>
              <input required type="tel" className="w-full px-7 py-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] text-xl font-black focus:border-amber-500 outline-none transition-all" placeholder="+54 9..." value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})}/>
            </div>

            <div className="md:col-span-1">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Vendedor</label>
              <select required className="w-full px-7 py-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] text-lg font-black focus:border-slate-900 outline-none transition-all appearance-none" value={formData.vendedor} onChange={(e) => setFormData({...formData, vendedor: e.target.value})}>
                <option value="">ELEGIR...</option>
                {vendedores.map(v => ( <option key={v.id} value={v.nombre}>{v.nombre}</option> ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="relative">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-4"><Package size={18} className="text-amber-500" /> Código de Fardo</label>
              <input required list="stock-suggestions" type="text" className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[28px] text-2xl font-black focus:border-amber-500 outline-none transition-all uppercase" placeholder="F-XXX" value={formData.codigoFardo} onChange={(e) => setFormData({...formData, codigoFardo: e.target.value.toUpperCase()})}/>
              <datalist id="stock-suggestions">
                {stock.filter(s => s.disponible).map(s => ( <option key={s.id} value={s.codigo}>{s.tipo}</option> ))}
              </datalist>
            </div>

            <div>
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-4"><Coins size={18} className="text-amber-500" /> Tipo de Pago / Comisión</label>
              <select 
                required 
                className="w-full px-8 py-6 bg-amber-50 border-2 border-amber-200 text-amber-900 rounded-[28px] text-xl font-black outline-none focus:border-amber-500 appearance-none"
                value={formData.tipoComision}
                onChange={(e) => setFormData({...formData, tipoComision: e.target.value as CommissionType})}
              >
                {Object.values(CommissionType).map(type => (
                  <option key={type} value={type}>{type.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          {mode === 'NORMAL' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-10 bg-amber-50/30 rounded-[40px] border-2 border-amber-100 animate-in fade-in slide-in-from-top duration-500">
               <div className="md:col-span-1">
                <label className="flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3 ml-2"><CreditCard size={14} /> DNI Cliente</label>
                <input required type="text" className="w-full px-7 py-5 bg-white border-2 border-amber-100 rounded-[24px] font-black" placeholder="12.345.678" value={formData.rut} onChange={(e) => setFormData({...formData, rut: e.target.value})}/>
              </div>
              <div className="md:col-span-1">
                <label className="flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3 ml-2"><MapPin size={14} /> Dirección Despacho</label>
                <input required type="text" className="w-full px-7 py-5 bg-white border-2 border-amber-100 rounded-[24px] font-black uppercase" placeholder="CALLE, COMUNA" value={formData.direccion} onChange={(e) => setFormData({...formData, direccion: e.target.value.toUpperCase()})}/>
              </div>
              
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3 ml-2"><Truck size={14} /> Tipo de Entrega</label>
                <div className="flex bg-white p-1.5 rounded-[24px] border-2 border-amber-100 shadow-sm">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, tipoDespacho: DispatchType.AGENCIA})}
                    className={`flex-1 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${formData.tipoDespacho === DispatchType.AGENCIA ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    <Building2 size={16} /> Agencia
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, tipoDespacho: DispatchType.DOMICILIO})}
                    className={`flex-1 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${formData.tipoDespacho === DispatchType.DOMICILIO ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    <Home size={16} /> Domicilio
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, tipoDespacho: DispatchType.RETIRO})}
                    className={`flex-1 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${formData.tipoDespacho === DispatchType.RETIRO ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    <Package size={16} /> Retiro
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-4"><DollarSign size={18} className="text-amber-400" /> Valor Final Venta ($)</label>
            <input required type="number" onWheel={(e) => e.currentTarget.blur()} className="w-full px-8 py-6 bg-slate-800 border-2 border-slate-700 rounded-[28px] text-5xl font-black text-amber-400 focus:border-amber-500 outline-none" value={formData.valorUnitario || ''} onChange={(e) => setFormData({...formData, valorUnitario: Number(e.target.value)})} placeholder="0"/>
            {formData.valorUnitario > 0 && settings.dolarBlueRate > 0 && (
              <p className="text-amber-500 font-bold ml-4 mt-4 italic">≈ {formatUSD(formData.valorUnitario, settings.dolarBlueRate)}</p>
            )}
          </div>

          <button type="submit" className={`group w-full py-8 rounded-[32px] text-white font-black text-3xl flex items-center justify-center gap-4 shadow-2xl transition-all active:scale-[0.97] ${mode === 'QUICK' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'}`}>
            <Save size={32} /> {mode === 'QUICK' ? 'REGISTRAR LIVE' : 'REGISTRAR VENTA COMPLETA'}
            <ChevronRight size={28} className="group-hover:translate-x-2 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
}
