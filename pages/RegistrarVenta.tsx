
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Save, 
  Zap, 
  ClipboardList, 
  CheckCircle2, 
  User, 
  Phone, 
  DollarSign, 
  Package, 
  MapPin, 
  Tag, 
  Truck, 
  CreditCard, 
  FileText, 
  ChevronRight, 
  Coins, 
  Building2, 
  Home, 
  Boxes, 
  Sparkles, 
  MessageSquare, 
  Clock, 
  Info,
  Check
} from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { SaleType, SaleStatus, StaffRole, CommissionType, DispatchType } from '../types';

export default function RegistrarVenta() {
  const { stock, staff, customers, addSale, playSound } = useStore();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'QUICK' | 'NORMAL' | 'NOTA_VENTA'>('QUICK');
  const [success, setSuccess] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [items, setItems] = useState<{codigoFardo: string, cantidad: number, valorUnitario: number, esManual?: boolean, tipoComision?: CommissionType}[]>([]);
  const [newItem, setNewItem] = useState({codigoFardo: '', cantidad: 1, valorUnitario: 0, esManual: false, tipoComision: CommissionType.FARDO_NORMAL});
  
  const vendedores = staff.filter(m => m.rol === StaffRole.VENDEDOR);
  const quickNameRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<{
    cliente: string;
    vendedor: string;
    telefono: string;
    rut: string;
    codigoFardo: string;
    esManual: boolean;
    variante: string;
    valorUnitario: number;
    cantidad: number;
    direccion: string;
    estadoPago: string;
    tipoComision: CommissionType;
    juntaCompra: string;
    observaciones: string;
    tipoDespacho?: DispatchType;
    agencia?: string;
  }>({
    cliente: '',
    vendedor: '',
    telefono: '',
    rut: '',
    codigoFardo: '',
    esManual: true,
    variante: '', // Se completará después en ventas rápidas
    valorUnitario: 0,
    cantidad: 1,
    direccion: '',
    estadoPago: 'Pendiente',
    tipoComision: CommissionType.FARDO_NORMAL,
    juntaCompra: 'DESPACHO INMEDIATO',
    observaciones: '',
    tipoDespacho: undefined,
    agencia: ''
  });

  const handleClientChange = (name: string) => {
      setFormData(prev => ({...prev, cliente: name.toUpperCase()}));
      const found = customers.find(c => c.nombre.toLowerCase() === name.toLowerCase());
      if (found) {
          setFormData(prev => ({
              ...prev,
              telefono: found.telefono,
              rut: found.rut || '',
              direccion: found.direccion || ''
          }));
      }
  };

  const handleItemCodeChange = (code: string, isNotaVenta: boolean) => {
    const uppercaseCode = code.toUpperCase();
    const foundItem = stock.find(s => s.codigo === uppercaseCode);
    const price = foundItem ? foundItem.precioSugerido : 0;
    const esManual = !foundItem;
    
    // Determine commission type correctly
    let newCommissionType = CommissionType.FARDO_NORMAL;
    if (foundItem) {
        if (foundItem.categoria === 'LOTE' || foundItem.unidad === 'LOTE') {
            newCommissionType = CommissionType.LOTE;
        } else if (foundItem.unidad === 'MEDIO FARDO') {
            newCommissionType = CommissionType.MEDIO_FARDO;
        } else if (foundItem.promocion) {
            newCommissionType = CommissionType.FARDO_PROMO;
        }
    } else if (uppercaseCode.startsWith('L')) {
        newCommissionType = CommissionType.LOTE;
    }
    
    if (isNotaVenta) {
      setNewItem(prev => ({...prev, codigoFardo: uppercaseCode, valorUnitario: price, tipoComision: newCommissionType, esManual}));
    } else {
      setFormData(prev => ({
          ...prev, 
          codigoFardo: uppercaseCode, 
          valorUnitario: price,
          tipoComision: newCommissionType,
          esManual
      }));
    }
  };

  const calculatedTotal = mode === 'NOTA_VENTA' 
    ? items.reduce((acc, item) => acc + item.valorUnitario * item.cantidad, 0)
    : (formData.valorUnitario * (formData.cantidad || 1));

  useEffect(() => {
    if (mode === 'QUICK') quickNameRef.current?.focus();
  }, [mode, success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isQuick = mode === 'QUICK';
    const isNotaVenta = mode === 'NOTA_VENTA';
    
    if (isNotaVenta) {
      if (items.length === 0) {
        alert("⚠️ Por favor agrega al menos un producto a la lista antes de registrar la nota de venta.");
        return;
      }
      for (const item of items) {
        const foundStockItem = stock.find(s => s.codigo === item.codigoFardo.trim().toUpperCase());
        if (foundStockItem) {
          if (foundStockItem.stockActual <= 0) {
            alert(`⚠️ Error: El fardo ${foundStockItem.codigo} está agotado (Stock actual: ${foundStockItem.stockActual}). No se puede registrar la venta.`);
            return;
          }
          if (foundStockItem.stockActual < item.cantidad) {
            alert(`⚠️ Error: El fardo ${foundStockItem.codigo} no tiene stock suficiente (Stock actual: ${foundStockItem.stockActual}, Solicitado: ${item.cantidad}). No se puede registrar la venta.`);
            return;
          }
        }
      }
    } else {
      const selectedStockItem = formData.codigoFardo ? stock.find(s => s.codigo === formData.codigoFardo.trim().toUpperCase()) : null;
      if (selectedStockItem) {
        if (selectedStockItem.stockActual <= 0) {
          alert(`⚠️ Error: El fardo ${selectedStockItem.codigo} está agotado (Stock actual: ${selectedStockItem.stockActual}). No se puede registrar la venta.`);
          return;
        }
        if (selectedStockItem.stockActual < (formData.cantidad || 1)) {
          alert(`⚠️ Error: El fardo ${selectedStockItem.codigo} no tiene stock suficiente (Stock actual: ${selectedStockItem.stockActual}, Solicitado: ${formData.cantidad || 1}). No se puede registrar la venta.`);
          return;
        }
      }
    }
    
    // Determine dispatch fields cleanly
    let finalTipoDespacho = formData.tipoDespacho;
    let finalAgencia = formData.agencia;

    if (formData.juntaCompra && (formData.juntaCompra === 'RETIRO BODEGA' || formData.juntaCompra.includes('RETIRO'))) {
      finalTipoDespacho = DispatchType.RETIRO;
      finalAgencia = 'RETIRO BODEGA';
    } else if (!isQuick && !finalTipoDespacho) {
      finalTipoDespacho = DispatchType.AGENCIA;
    }

    const finalData = {
      ...formData,
      tipoVenta: isQuick ? SaleType.LIVE : isNotaVenta ? SaleType.NOTA_VENTA : SaleType.NORMAL,
      items: isNotaVenta ? items : undefined,
      total: isNotaVenta ? items.reduce((acc, item) => acc + item.valorUnitario * item.cantidad, 0) : formData.valorUnitario * (formData.cantidad || 1),
      status: SaleStatus.PENDIENTE,
      datosCompletos: !isQuick,
      variante: isQuick ? '' : formData.variante, 
      tipoDespacho: finalTipoDespacho,
      agencia: finalAgencia,
      juntaCompra: formData.juntaCompra || 'DESPACHO INMEDIATO',
      observaciones: formData.observaciones || ''
    };

    console.log("Final data to be saved:", finalData);
    console.log("Items to be saved:", items);

    await addSale(finalData);
    setSuccess(true);
    playSound('success');
    
    setFormData({
      cliente: '', 
      vendedor: formData.vendedor, 
      telefono: '', 
      rut: '',
      codigoFardo: '', 
      esManual: true, 
      variante: isQuick ? '' : 'FARDO', 
      valorUnitario: 0, 
      cantidad: 1,
      direccion: '', 
      estadoPago: 'Pendiente', 
      tipoComision: CommissionType.FARDO_NORMAL,
      juntaCompra: 'DESPACHO INMEDIATO', 
      observaciones: '', 
      tipoDespacho: undefined,
      agencia: ''
    });
    setItems([]);
    setNewItem({codigoFardo: '', cantidad: 1, valorUnitario: 0, esManual: false, tipoComision: CommissionType.FARDO_NORMAL});
    
    setTimeout(() => setSuccess(false), 2000);
  };

  const selectedStockItem = formData.codigoFardo ? stock.find(s => s.codigo === formData.codigoFardo.trim().toUpperCase()) : null;
  const selectedNewItemStock = newItem.codigoFardo ? stock.find(s => s.codigo === newItem.codigoFardo.trim().toUpperCase()) : null;
  const isJuntaSelected = formData.juntaCompra === 'JUNTA COMPRA';

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Terminal de Ventas</h2>
          <p className="text-slate-500 font-medium italic">Selecciona el flujo operativo Cuaderno MDF</p>
        </div>
        <div className="flex bg-slate-200 p-1.5 rounded-[24px] shadow-inner w-full sm:w-auto">
          <button 
            onClick={() => { setMode('QUICK'); playSound('click'); }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all ${mode === 'QUICK' ? 'bg-emerald-500 text-white shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <Zap size={20} /> Modo Live
          </button>
          <button 
            onClick={() => { setMode('NORMAL'); playSound('click'); }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all ${mode === 'NORMAL' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <ClipboardList size={20} /> Venta Normal
          </button>
          <button 
            onClick={() => { setMode('NOTA_VENTA'); playSound('click'); }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all ${mode === 'NOTA_VENTA' ? 'bg-amber-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <FileText size={20} /> Nota de Venta
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-500 text-white px-8 py-6 rounded-[32px] flex items-center gap-4 animate-bounce shadow-2xl shadow-emerald-500/30">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"><CheckCircle2 size={32} /></div>
          <div>
            <p className="font-black text-xl uppercase italic">¡Operación Exitosa!</p>
            <p className="text-emerald-100 text-sm font-bold">Venta registrada en el sistema central.</p>
          </div>
        </div>
      )}

      <div className={`bg-white rounded-[48px] border-2 transition-all shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] overflow-hidden ${mode === 'QUICK' ? 'border-emerald-100' : mode === 'NOTA_VENTA' ? 'border-amber-100' : 'border-blue-100'}`}>
        <div className={`p-8 border-b flex items-center justify-between ${mode === 'QUICK' ? 'bg-emerald-50/30 border-emerald-100' : mode === 'NOTA_VENTA' ? 'bg-amber-50/30 border-amber-100' : 'bg-blue-50/30 border-blue-100'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${mode === 'QUICK' ? 'bg-emerald-500' : mode === 'NOTA_VENTA' ? 'bg-amber-600' : 'bg-blue-600'}`}>
              {mode === 'QUICK' ? <Zap size={24} /> : mode === 'NOTA_VENTA' ? <FileText size={24} /> : <ClipboardList size={24} />}
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase">{mode === 'QUICK' ? 'Captura Rápida TikTok' : mode === 'NOTA_VENTA' ? 'Nota de Venta Múltiple' : 'Venta con Detalle Completo'}</h3>
              <p className="text-slate-500 text-xs font-medium italic">{mode === 'QUICK' ? 'Campos optimizados para fluidez del Live' : 'Información completa para logística y facturación'}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-8">
          {/* Cliente, WhatsApp, Vendedor */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="md:col-span-1">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">
                <User size={14} className="text-blue-500" /> Cliente
              </label>
              <input ref={quickNameRef} required list="customers-suggestions" type="text" className="w-full px-7 py-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] text-xl font-black focus:border-blue-500 outline-none transition-all uppercase" placeholder="NOMBRE CLIENTE" value={formData.cliente} onChange={(e) => handleClientChange(e.target.value)}/>
              <datalist id="customers-suggestions">
                  {customers.map(c => <option key={c.id} value={c.nombre} />)}
              </datalist>
            </div>
            
            <div className="md:col-span-1">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">
                <Phone size={14} className="text-emerald-500" /> WhatsApp / Teléfono
              </label>
              <input required type="tel" className="w-full px-7 py-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] text-xl font-black focus:border-emerald-500 outline-none transition-all" placeholder="+569..." value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})}/>
            </div>

            <div className="md:col-span-1">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Vendedora Asignada</label>
              <select required className="w-full px-7 py-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] text-lg font-black focus:border-slate-900 outline-none transition-all appearance-none" value={formData.vendedor} onChange={(e) => setFormData({...formData, vendedor: e.target.value})}>
                <option value="">ELEGIR VENDEDORA...</option>
                {vendedores.map(v => ( <option key={v.id} value={v.nombre}>{v.nombre}</option> ))}
              </select>
            </div>
          </div>
          
          {/* RUT y Dirección */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="md:col-span-1">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2"><CreditCard size={14} className="text-blue-500" /> RUT Cliente {mode === 'QUICK' ? '(Opcional en Live)' : ''}</label>
              <input required={mode !== 'QUICK'} type="text" className="w-full px-7 py-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black text-lg" placeholder="12.345.678-9" value={formData.rut} onChange={(e) => setFormData({...formData, rut: e.target.value})}/>
            </div>
            <div className="md:col-span-1">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2"><MapPin size={14} className="text-blue-500" /> Dirección Despacho {mode === 'QUICK' ? '(Opcional en Live)' : ''}</label>
              <textarea required={mode !== 'QUICK'} className="w-full px-7 py-4 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black text-lg uppercase resize-none h-24" placeholder="CALLE, NÚMERO, COMUNA, CIUDAD" value={formData.direccion} onChange={(e) => setFormData({...formData, direccion: e.target.value.toUpperCase()})}/>
            </div>
          </div>

          {/* Selector de Modalidad: JUNTA COMPRA / DESPACHO INMEDIATO / RETIRO */}
          <div className={`p-6 sm:p-7 rounded-[32px] border-2 transition-all ${isJuntaSelected ? 'bg-indigo-50/70 border-indigo-200 shadow-md' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Boxes size={20} className={isJuntaSelected ? 'text-indigo-600' : 'text-slate-600'} />
                <div>
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Modalidad de Despacho & Junta Compra</span>
                  <p className="text-[11px] text-slate-500 font-medium">¿La clienta despacha ahora o acumula sus compras de la semana?</p>
                </div>
              </div>
              <span className={`self-start sm:self-auto px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                isJuntaSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm animate-pulse'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}>
                {isJuntaSelected ? '📦 Modo Junta Compra Activo' : '🚚 Despacho Inmediato'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Opción 1: Despacho Inmediato */}
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev, 
                    juntaCompra: 'DESPACHO INMEDIATO',
                    tipoDespacho: prev.tipoDespacho === DispatchType.RETIRO ? DispatchType.AGENCIA : prev.tipoDespacho
                  }));
                  playSound('click');
                }}
                className={`p-4 rounded-[22px] font-black text-xs uppercase tracking-wider transition-all flex items-center gap-3 border-2 text-left ${
                  formData.juntaCompra === 'DESPACHO INMEDIATO'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${formData.juntaCompra === 'DESPACHO INMEDIATO' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  <Truck size={20} />
                </div>
                <div>
                  <div className="font-black">Despacho Inmediato</div>
                  <div className={`text-[10px] font-medium normal-case ${formData.juntaCompra === 'DESPACHO INMEDIATO' ? 'text-slate-200' : 'text-slate-500'}`}>
                    Enviar a bodega para salida
                  </div>
                </div>
              </button>

              {/* Opción 2: JUNTA COMPRA */}
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev, 
                    juntaCompra: 'JUNTA COMPRA'
                  }));
                  playSound('click');
                }}
                className={`p-4 rounded-[22px] font-black text-xs uppercase tracking-wider transition-all flex items-center gap-3 border-2 text-left relative overflow-hidden ${
                  isJuntaSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-600/30'
                    : 'bg-white text-indigo-900 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isJuntaSelected ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                  <Boxes size={20} />
                </div>
                <div>
                  <div className="font-black flex items-center gap-1.5">
                    JUNTA COMPRA
                    <span className="bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded text-[8px] font-black">
                      SEMANAL
                    </span>
                  </div>
                  <div className={`text-[10px] font-medium normal-case ${isJuntaSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                    Custodiar y acumular en bodega
                  </div>
                </div>
              </button>

              {/* Opción 3: Retiro */}
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev, 
                    juntaCompra: 'RETIRO BODEGA',
                    tipoDespacho: DispatchType.RETIRO,
                    agencia: 'RETIRO BODEGA'
                  }));
                  playSound('click');
                }}
                className={`p-4 rounded-[22px] font-black text-xs uppercase tracking-wider transition-all flex items-center gap-3 border-2 text-left ${
                  formData.juntaCompra.includes('RETIRO')
                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${formData.juntaCompra.includes('RETIRO') ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  <Package size={20} />
                </div>
                <div>
                  <div className="font-black">Retiro en Bodega</div>
                  <div className={`text-[10px] font-medium normal-case ${formData.juntaCompra.includes('RETIRO') ? 'text-slate-200' : 'text-slate-500'}`}>
                    Cliente retira en bodega
                  </div>
                </div>
              </button>
            </div>

            {/* Banner explicativo Junta Compra */}
            {isJuntaSelected && (
              <div className="mt-4 p-4 bg-indigo-100/90 border border-indigo-300/80 rounded-2xl flex items-start gap-3 animate-in fade-in duration-300">
                <Sparkles size={20} className="text-indigo-700 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-950">
                  <p className="font-black uppercase tracking-wide">📦 Opción Junta Compra Seleccionada:</p>
                  <p className="mt-0.5 font-medium leading-relaxed">
                    Esta venta quedará en <strong>Custodia Temporal en Bodega</strong>. Aparecerá en el indicador del <strong>Dashboard</strong> y en la pestaña <strong>Junta Compra</strong> de Despachos para consolidar todos los fardos que la clienta compre en la semana.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Productos y Códigos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
             <div className="relative">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-4"><Package size={18} className="text-blue-500" /> {mode === 'NOTA_VENTA' ? 'Agregar Producto a la Lista' : 'Código de Fardo'}</label>
              
              {mode === 'NOTA_VENTA' ? (
                <div>
                  <div className="flex flex-wrap gap-2">
                      <input list="stock-suggestions" type="text" className="w-[120px] px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-[20px] font-black outline-none" placeholder="CODIGO" value={newItem.codigoFardo} onChange={(e) => handleItemCodeChange(e.target.value, true)}/>
                      <input type="number" className="w-16 px-2 py-4 bg-slate-50 border-2 border-slate-100 rounded-[20px] font-black outline-none" placeholder="CANT" value={newItem.cantidad} onChange={(e) => setNewItem({...newItem, cantidad: Number(e.target.value)})}/>
                      <input type="number" className="w-24 px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-[20px] font-black outline-none" placeholder="VALOR" value={newItem.valorUnitario} onChange={(e) => setNewItem({...newItem, valorUnitario: Number(e.target.value)})}/>
                      <select className="px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-[20px] font-black outline-none text-[10px]" value={newItem.tipoComision} onChange={(e) => setNewItem({...newItem, tipoComision: e.target.value as CommissionType})}>
                          <option value={CommissionType.FARDO_NORMAL}>FARDO</option>
                          <option value={CommissionType.FARDO_PROMO}>PROMO</option>
                          <option value={CommissionType.MEDIO_FARDO}>MEDIO</option>
                          <option value={CommissionType.LOTE}>LOTE</option>
                      </select>
                      <button type="button" onClick={() => { 
                          if(newItem.codigoFardo && newItem.cantidad > 0 && newItem.valorUnitario > 0) {
                              const foundStockItem = stock.find(s => s.codigo === newItem.codigoFardo.trim().toUpperCase());
                              if (foundStockItem) {
                                  if (foundStockItem.stockActual <= 0) {
                                      alert(`⚠️ Error: El fardo ${foundStockItem.codigo} está agotado (Stock actual: ${foundStockItem.stockActual}). No se puede agregar.`);
                                      return;
                                  }
                                  if (foundStockItem.stockActual < newItem.cantidad) {
                                      alert(`⚠️ Error: El fardo ${foundStockItem.codigo} no tiene stock suficiente (Stock actual: ${foundStockItem.stockActual}, Solicitado: ${newItem.cantidad}). No se puede agregar.`);
                                      return;
                                  }
                              }
                              setItems([...items, newItem]);
                              setNewItem({codigoFardo: '', cantidad: 1, valorUnitario: 0, esManual: false, tipoComision: CommissionType.FARDO_NORMAL});
                          }
                      }} className="bg-amber-600 text-white rounded-2xl px-4 font-black text-lg hover:bg-amber-700">+</button>
                  </div>
                  {selectedNewItemStock && (
                    <div className="mt-3 text-[10px] font-black uppercase tracking-wider">
                      {selectedNewItemStock.stockActual <= 0 ? (
                        <span className="text-red-500 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-lg inline-block">
                          ⚠️ ¡Agotado! (Stock: {selectedNewItemStock.stockActual} {selectedNewItemStock.unidad}s)
                        </span>
                      ) : selectedNewItemStock.stockActual < 3 ? (
                        <span className="text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg inline-block">
                          ⚠️ Stock bajo: solo quedan {selectedNewItemStock.stockActual} {selectedNewItemStock.unidad}s
                        </span>
                      ) : (
                        <span className="text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg inline-block">
                          ✅ Stock disponible: {selectedNewItemStock.stockActual} {selectedNewItemStock.unidad}s
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                      <input required list="stock-suggestions" type="text" className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[28px] text-2xl font-black focus:border-blue-500 outline-none transition-all uppercase" placeholder="F-XXX" value={formData.codigoFardo} onChange={(e) => handleItemCodeChange(e.target.value, false)}/>
                      <input required type="number" className="w-32 px-4 py-6 bg-slate-50 border-2 border-slate-100 rounded-[28px] text-xl font-black outline-none transition-all" placeholder="VALOR" value={formData.valorUnitario || ''} onChange={(e) => setFormData({...formData, valorUnitario: Number(e.target.value)})}/>
                  </div>
                  {selectedStockItem && (
                    <div className="mt-3 text-[11px] font-black uppercase tracking-wider">
                      {selectedStockItem.stockActual <= 0 ? (
                        <span className="text-red-500 bg-red-50 border border-red-100 px-3 py-1.5 rounded-xl inline-block">
                          ⚠️ ¡Producto agotado! Stock: {selectedStockItem.stockActual} {selectedStockItem.unidad}s
                        </span>
                      ) : selectedStockItem.stockActual < 3 ? (
                        <span className="text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-xl inline-block">
                          ⚠️ Stock bajo: solo quedan {selectedStockItem.stockActual} {selectedStockItem.unidad}s
                        </span>
                      ) : (
                        <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl inline-block">
                          ✅ Stock disponible: {selectedStockItem.stockActual} {selectedStockItem.unidad}s
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
              <datalist id="stock-suggestions">
                {stock.filter(s => s.disponible).map(s => ( <option key={s.id} value={s.codigo}>{s.tipo}{s.proveedor ? ` (${s.proveedor})` : ''} [Stock: {s.stockActual}]</option> ))}
              </datalist>
            </div>
            
            {mode === 'NOTA_VENTA' ? (
              <div className="max-h-40 overflow-y-auto bg-slate-50 border-2 border-slate-100 rounded-[28px] p-4">
                {items.length === 0 ? (
                  <p className="text-xs text-slate-400 font-bold p-4 text-center">No hay productos agregados</p>
                ) : (
                  items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs font-bold p-1 border-b border-slate-100 last:border-0">
                          <span>{item.cantidad} x {stock.find(s => s.codigo === item.codigoFardo)?.tipo || item.codigoFardo}</span>
                          <span>${(item.valorUnitario * item.cantidad).toLocaleString()}</span>
                      </div>
                  ))
                )}
                <div className="border-t mt-2 pt-2 text-right font-black text-sm">
                    Total: ${calculatedTotal.toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">
                  <MessageSquare size={14} className="text-indigo-500" /> Observaciones / Notas Vendedora (Opcional)
                </label>
                <input 
                  type="text" 
                  className="w-full px-7 py-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-bold text-sm outline-none focus:border-indigo-500 transition-all" 
                  placeholder="Ej: Clienta junta fardos hasta el sábado, etc." 
                  value={formData.observaciones} 
                  onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                />
              </div>
            )}
          </div>

          {/* Opciones de Despacho Detalladas para NOTA DE VENTA */}
          {mode === 'NOTA_VENTA' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 sm:p-10 bg-amber-50/30 rounded-[40px] border-2 border-amber-100 animate-in fade-in slide-in-from-top duration-500">
              <div className="md:col-span-2 space-y-4">
                <label className="flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3 ml-2"><Truck size={14} /> Tipo de Transporte Final</label>
                <div className="flex bg-white p-1.5 rounded-[24px] border-2 border-amber-100 shadow-sm">
                  <button type="button" onClick={() => setFormData({...formData, tipoDespacho: DispatchType.AGENCIA, agencia: ''})} className={`flex-1 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest ${formData.tipoDespacho === DispatchType.AGENCIA ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400'}`}>Agencia</button>
                  <button type="button" onClick={() => setFormData({...formData, tipoDespacho: DispatchType.DOMICILIO, agencia: ''})} className={`flex-1 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest ${formData.tipoDespacho === DispatchType.DOMICILIO ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400'}`}>Domicilio</button>
                  <button type="button" onClick={() => setFormData({...formData, tipoDespacho: DispatchType.RETIRO, agencia: formData.agencia && formData.agencia.includes('RETIRO') ? formData.agencia : 'RETIRO BODEGA'})} className={`flex-1 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest ${formData.tipoDespacho === DispatchType.RETIRO ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400'}`}>Retiro</button>
                </div>
                {formData.tipoDespacho === DispatchType.AGENCIA && <input required type="text" className="w-full px-7 py-5 bg-white border-2 border-amber-100 rounded-[24px] font-black uppercase" placeholder="NOMBRE DE LA AGENCIA (EJ: STARKEN, CHILEXPRESS)" value={formData.agencia || ''} onChange={(e) => setFormData({...formData, agencia: e.target.value.toUpperCase()})}/>}
                {formData.tipoDespacho === DispatchType.RETIRO && (
                  <div className="p-3 bg-amber-100/70 border border-amber-300/80 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-amber-900 animate-in fade-in duration-300">
                    <Package size={16} className="text-amber-700 shrink-0" />
                    <span>El cliente retirará directamente en Bodega Central</span>
                  </div>
                )}
                <div>
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">
                    <MessageSquare size={14} className="text-amber-500" /> Observaciones / Notas
                  </label>
                  <input 
                    type="text" 
                    className="w-full px-7 py-4 bg-white border-2 border-amber-100 rounded-[24px] font-bold text-sm outline-none" 
                    placeholder="Notas o indicaciones adicionales..." 
                    value={formData.observaciones} 
                    onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Opciones de Despacho Detalladas para VENTA NORMAL */}
          {mode === 'NORMAL' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 sm:p-10 bg-blue-50/30 rounded-[40px] border-2 border-blue-100 animate-in fade-in slide-in-from-top duration-500">
               <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 ml-2"><Tag size={14} /> Variante</label>
                <select required className="w-full px-7 py-5 bg-white border-2 border-blue-100 rounded-[24px] font-black text-lg" value={formData.variante} onChange={(e) => {
                    const newVar = e.target.value;
                    let newComm = formData.tipoComision;
                    if (formData.esManual) {
                        if (newVar === 'LOTE') newComm = CommissionType.LOTE;
                        else if (newVar === 'MEDIO FARDO') newComm = CommissionType.MEDIO_FARDO;
                        else if (newVar === 'FARDO') newComm = CommissionType.FARDO_NORMAL;
                    }
                    setFormData({...formData, variante: newVar, tipoComision: newComm});
                }}>
                    <option value="">ELEGIR...</option>
                    <option value="FARDO">FARDO</option>
                    <option value="MEDIO FARDO">MEDIO FARDO</option>
                    <option value="SACO">SACO</option>
                    <option value="LOTE">LOTE</option>
                </select>
              </div>
              <div className="md:col-span-2 space-y-4">
                <label className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 ml-2"><Truck size={14} /> Tipo de Transporte Final</label>
                <div className="flex bg-white p-1.5 rounded-[24px] border-2 border-blue-100 shadow-sm">
                  <button type="button" onClick={() => setFormData({...formData, tipoDespacho: DispatchType.AGENCIA, agencia: ''})} className={`flex-1 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest ${formData.tipoDespacho === DispatchType.AGENCIA ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>Agencia</button>
                  <button type="button" onClick={() => setFormData({...formData, tipoDespacho: DispatchType.DOMICILIO, agencia: ''})} className={`flex-1 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest ${formData.tipoDespacho === DispatchType.DOMICILIO ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>Domicilio</button>
                  <button type="button" onClick={() => setFormData({...formData, tipoDespacho: DispatchType.RETIRO, agencia: formData.agencia && formData.agencia.includes('RETIRO') ? formData.agencia : 'RETIRO BODEGA'})} className={`flex-1 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest ${formData.tipoDespacho === DispatchType.RETIRO ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>Retiro</button>
                </div>
                {formData.tipoDespacho === DispatchType.AGENCIA && <input required type="text" className="w-full px-7 py-5 bg-white border-2 border-blue-100 rounded-[24px] font-black uppercase" placeholder="NOMBRE DE LA AGENCIA (EJ: STARKEN, CHILEXPRESS)" value={formData.agencia || ''} onChange={(e) => setFormData({...formData, agencia: e.target.value.toUpperCase()})}/>}
                {formData.tipoDespacho === DispatchType.RETIRO && (
                  <div className="p-3 bg-blue-100/70 border border-blue-300/80 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-blue-900 animate-in fade-in duration-300">
                    <Package size={16} className="text-blue-700 shrink-0" />
                    <span>El cliente retirará directamente en Bodega Central</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Valor Final Venta */}
          <div className="bg-slate-900 p-8 sm:p-10 rounded-[40px] text-white shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1"><DollarSign size={18} className="text-emerald-400" /> Valor Final Venta ($)</label>
                <div className="text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight">
                   ${calculatedTotal.toLocaleString()}
                </div>
              </div>
              {isJuntaSelected && (
                <div className="bg-indigo-950/80 border border-indigo-500/40 p-4 rounded-2xl text-left max-w-sm">
                  <div className="flex items-center gap-2 text-indigo-300 font-black text-xs uppercase">
                    <Boxes size={16} /> Junta Compra Activada
                  </div>
                  <p className="text-[11px] text-indigo-200/80 mt-1 font-medium">
                    El fardo se guardará en custodia hasta que la clienta ordene despachar el total de sus compras.
                  </p>
                </div>
              )}
            </div>
          </div>

          <button type="submit" className={`group w-full py-7 sm:py-8 rounded-[32px] text-white font-black text-2xl sm:text-3xl flex items-center justify-center gap-4 shadow-2xl transition-all active:scale-[0.97] ${mode === 'QUICK' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' : mode === 'NOTA_VENTA' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'}`}>
            <Save size={32} /> {mode === 'QUICK' ? 'REGISTRAR LIVE' : mode === 'NOTA_VENTA' ? 'REGISTRAR NOTA DE VENTA' : 'REGISTRAR VENTA COMPLETA'}
            <ChevronRight size={28} className="group-hover:translate-x-2 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
}
