import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  RotateCcw, 
  Calendar, 
  User, 
  UserCheck, 
  Truck, 
  Package, 
  Scale, 
  AlertCircle, 
  DollarSign, 
  FileText, 
  CheckCircle2, 
  Sparkles,
  Info,
  Layers,
  ArrowDownCircle,
  Hash,
  Search,
  Check,
  HelpCircle
} from 'lucide-react';
import { useStore } from '../../store/GlobalContext';
import { SaleReturn, StaffRole, Sale, CommissionType } from '../../types';

interface DevolucionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: SaleReturn | null;
}

const COMMON_REASONS = [
  {
    label: 'Mal etiquetado de origen (Sin culpa de bodega ni vendedor)',
    descuentaComision: false,
    montoSugerido: 0,
    desc: 'El fardo llegó rotulado erróneamente desde proveedor. No amerita descuento de comisión.'
  },
  {
    label: 'Calidad ofrecida no corresponde a la del producto',
    descuentaComision: true,
    montoSugerido: 3000,
    desc: 'Discrepancia entre lo ofrecido por el vendedor y el contenido real.'
  },
  {
    label: 'Error de vendedor en pedido / producto equivocado',
    descuentaComision: true,
    montoSugerido: 3000,
    desc: 'Se ofreció o despachó una prenda o código distinto al solicitado.'
  },
  {
    label: 'Producto en mal estado / dañado en traslado',
    descuentaComision: false,
    montoSugerido: 0,
    desc: 'Deterioro atribuible a transporte o agencia.'
  },
  {
    label: 'Cliente insatisfecho / arrepentimiento de compra',
    descuentaComision: true,
    montoSugerido: 3000,
    desc: 'Devolución comercial acordada con el cliente.'
  },
  {
    label: 'Otro motivo (especificar en observaciones)',
    descuentaComision: false,
    montoSugerido: 0,
    desc: 'Motivo personalizado'
  }
];

const COMMON_AGENCIES = [
  'Cliente',
  'Starken',
  'Chilexpress',
  'Blue Express',
  'Retiro en Bodega',
  'Transportes Tamarindo',
  'Transportes Runn',
  'Transportista Interno',
  'Varmontt',
  'Cruz del Sur',
  'Pullman Cargo'
];

export const DevolucionModal: React.FC<DevolucionModalProps> = ({
  isOpen,
  onClose,
  initialData
}) => {
  const { sales, staff, stock, customers, addSaleReturn, updateSaleReturn, playSound, currentUser, commissionValues } = useStore();

  // Búsqueda / Vinculación con Nota de Venta
  const [numeroVentaInput, setNumeroVentaInput] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [autoFilledNotice, setAutoFilledNotice] = useState<string | null>(null);

  // Form Fields
  const [fecha, setFecha] = useState('');
  const [fechaIso, setFechaIso] = useState('');
  const [cliente, setCliente] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [vendedor, setVendedor] = useState('');
  const [agencia, setAgencia] = useState('Cliente');
  const [producto, setProducto] = useState('');
  const [codigoFardo, setCodigoFardo] = useState('');
  const [kilos, setKilos] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [motivo, setMotivo] = useState(COMMON_REASONS[0].label);
  const [costo, setCosto] = useState<number>(0);
  const [observaciones, setObservaciones] = useState('');
  
  // Comisión y Descuento
  const [aplicaDescuentoComision, setAplicaDescuentoComision] = useState(false);
  const [montoDescuentoComision, setMontoDescuentoComision] = useState<number>(3000);
  const [comisionCalculadaVenta, setComisionCalculadaVenta] = useState<number>(3000);
  
  // Stock
  const [reingresaStock, setReingresaStock] = useState(true);
  const [estadoProducto, setEstadoProducto] = useState<'BUENO' | 'MERMA' | 'REENFARDAR' | 'EN_REVISION'>('BUENO');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Inicializar campos cuando se abre o edita
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setNumeroVentaInput(initialData.numeroVenta !== undefined ? String(initialData.numeroVenta) : '');
        setFecha(initialData.fecha || '');
        setFechaIso(initialData.fechaIso || '');
        setCliente(initialData.cliente || '');
        setClienteTelefono(initialData.clienteTelefono || '');
        setVendedor(initialData.vendedor || '');
        setAgencia(initialData.agencia || 'Cliente');
        setProducto(initialData.producto || '');
        setCodigoFardo(initialData.codigoFardo || '');
        setKilos(initialData.kilos !== undefined ? String(initialData.kilos) : '');
        setCantidad(initialData.cantidad || 1);
        setMotivo(initialData.motivo || COMMON_REASONS[0].label);
        setCosto(initialData.costo || 0);
        setObservaciones(initialData.observaciones || '');
        setAplicaDescuentoComision(initialData.aplicaDescuentoComision ?? false);
        setMontoDescuentoComision(initialData.montoDescuentoComision ?? 3000);
        setReingresaStock(initialData.reingresaStock ?? true);
        setEstadoProducto(initialData.estadoProducto || 'BUENO');
        setAutoFilledNotice(null);
      } else {
        const today = new Date();
        const monthNames = [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        const formattedDate = `${today.getDate()} ${monthNames[today.getMonth()]}`;
        const formattedIso = today.toISOString().split('T')[0];

        setNumeroVentaInput('');
        setSelectedSale(null);
        setAutoFilledNotice(null);
        setFecha(formattedDate);
        setFechaIso(formattedIso);
        setCliente('');
        setClienteTelefono('');
        setVendedor(staff.length > 0 ? staff[0].nombre : '');
        setAgencia('Cliente');
        setProducto('');
        setCodigoFardo('');
        setKilos('');
        setCantidad(1);
        setMotivo(COMMON_REASONS[0].label);
        setCosto(0);
        setObservaciones('');
        setAplicaDescuentoComision(false);
        setMontoDescuentoComision(commissionValues?.fardoNormal || 3000);
        setComisionCalculadaVenta(commissionValues?.fardoNormal || 3000);
        setReingresaStock(true);
        setEstadoProducto('BUENO');
      }
      setErrorMsg('');
    }
  }, [isOpen, initialData, staff, commissionValues]);

  // Función para autocompletar buscando por número de venta
  const handleBuscarVenta = (queryNum: string) => {
    setNumeroVentaInput(queryNum);
    const cleanNum = queryNum.trim().replace(/^#/, '');
    if (!cleanNum) {
      setSelectedSale(null);
      setAutoFilledNotice(null);
      return;
    }

    const found = sales.find(s => String(s.numeroVenta) === cleanNum);
    if (found) {
      setSelectedSale(found);
      
      // Autorellenar Cliente
      if (found.cliente) setCliente(found.cliente);
      if (found.telefono) setClienteTelefono(found.telefono);

      // Autorellenar Vendedor
      if (found.vendedor) setVendedor(found.vendedor);

      // Autorellenar Agencia
      if (found.agencia) {
        setAgencia(found.agencia);
      } else if (found.tipoDespacho) {
        setAgencia(found.tipoDespacho === 'Retiro en Bodega' ? 'Retiro en Bodega' : (found.transportista || 'Cliente'));
      }

      // Autorellenar Fecha de la venta
      if (found.fecha) {
        try {
          const parts = found.fecha.split('-');
          if (parts.length === 3) {
            const day = parseInt(parts[2], 10);
            const monthIdx = parseInt(parts[1], 10) - 1;
            const monthNames = [
              'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
              'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
            ];
            if (!isNaN(day) && monthIdx >= 0 && monthIdx < 12) {
              setFecha(`${day} ${monthNames[monthIdx]}`);
            }
          }
        } catch (_) {
          // Ignorar fallback
        }
        setFechaIso(found.fecha);
      }

      // Autorellenar Producto y Códigos
      let productName = '';
      let fardoCode = '';
      let calculatedComm = commissionValues?.fardoNormal || 3000;

      if (found.items && found.items.length > 0) {
        const firstItem = found.items[0];
        fardoCode = firstItem.codigoFardo || '';
        const matchingStock = stock.find(st => st.codigo === fardoCode);
        productName = matchingStock?.tipo || fardoCode || 'Fardo de Ropa';

        // Calcular comisión por tipo de item
        if (firstItem.tipoComision) {
          if (firstItem.tipoComision === CommissionType.FARDO_PROMO) {
            calculatedComm = commissionValues?.fardoPromo || 1500;
          } else if (firstItem.tipoComision === CommissionType.MEDIO_FARDO) {
            calculatedComm = commissionValues?.medioFardo || 1500;
          } else if (firstItem.tipoComision === CommissionType.LOTE) {
            calculatedComm = commissionValues?.lote || 1000;
          } else {
            calculatedComm = commissionValues?.fardoNormal || 3000;
          }
        }
      } else if (found.codigoFardo) {
        fardoCode = found.codigoFardo;
        const matchingStock = stock.find(st => st.codigo === fardoCode);
        productName = matchingStock?.tipo || found.variante || fardoCode;
        
        if (found.tipoComision) {
          if (found.tipoComision === CommissionType.FARDO_PROMO) {
            calculatedComm = commissionValues?.fardoPromo || 1500;
          } else if (found.tipoComision === CommissionType.MEDIO_FARDO) {
            calculatedComm = commissionValues?.medioFardo || 1500;
          } else if (found.tipoComision === CommissionType.LOTE) {
            calculatedComm = commissionValues?.lote || 1000;
          } else {
            calculatedComm = commissionValues?.fardoNormal || 3000;
          }
        }
      }

      if (productName) setProducto(productName);
      if (fardoCode) setCodigoFardo(fardoCode);

      // Kilos del fardo o producto si existen
      const matchingStock = stock.find(st => st.codigo === fardoCode);
      if (matchingStock?.peso) {
        setKilos(String(matchingStock.peso));
      }

      setComisionCalculadaVenta(calculatedComm);

      // Ajustar descuento según el motivo actual
      const matchedReason = COMMON_REASONS.find(r => r.label === motivo);
      if (matchedReason?.descuentaComision) {
        setMontoDescuentoComision(calculatedComm);
      }

      setAutoFilledNotice(`✓ Venta #${found.numeroVenta} cargada con éxito. Datos del cliente, vendedor (${found.vendedor}) y producto autorellenados.`);
      playSound('click');
    } else {
      setSelectedSale(null);
      setAutoFilledNotice(null);
    }
  };

  // Manejar cambio de motivo y sugerir descuento automáticamente
  const handleMotivoChange = (newMotivo: string) => {
    setMotivo(newMotivo);
    const matched = COMMON_REASONS.find(r => r.label === newMotivo);
    if (matched) {
      setAplicaDescuentoComision(matched.descuentaComision);
      if (matched.descuentaComision) {
        setMontoDescuentoComision(comisionCalculadaVenta || matched.montoSugerido || 3000);
      } else {
        setMontoDescuentoComision(0);
      }
    }
  };

  // Al seleccionar producto del catálogo manual
  const handleSelectProduct = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setCodigoFardo(code);
    if (code) {
      const p = stock.find(s => s.codigo === code);
      if (p) {
        setProducto(p.tipo);
        if (p.peso) setKilos(String(p.peso));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente.trim()) {
      setErrorMsg('Por favor ingresa el nombre del cliente.');
      return;
    }
    if (!vendedor.trim()) {
      setErrorMsg('Por favor selecciona o ingresa el vendedor.');
      return;
    }
    if (!producto.trim()) {
      setErrorMsg('Por favor ingresa o selecciona el producto devuelto.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const saleNumVal = numeroVentaInput.trim() ? parseInt(numeroVentaInput.trim().replace(/^#/, ''), 10) : undefined;
      const saleIdVal = selectedSale?.id || initialData?.saleId;

      if (initialData) {
        await updateSaleReturn(initialData.id, {
          numeroVenta: !isNaN(Number(saleNumVal)) ? saleNumVal : undefined,
          saleId: saleIdVal,
          fecha,
          fechaIso,
          cliente: cliente.trim(),
          clienteTelefono: clienteTelefono.trim(),
          vendedor: vendedor.trim(),
          agencia: agencia.trim(),
          producto: producto.trim(),
          codigoFardo: codigoFardo.trim() || undefined,
          kilos: kilos.trim() || undefined,
          cantidad: Number(cantidad) || 1,
          motivo: motivo.trim(),
          costo: Number(costo) || 0,
          observaciones: observaciones.trim() || undefined,
          aplicaDescuentoComision,
          montoDescuentoComision: aplicaDescuentoComision ? Number(montoDescuentoComision) || 0 : 0,
          reingresaStock,
          estadoProducto
        });
      } else {
        await addSaleReturn({
          numeroVenta: !isNaN(Number(saleNumVal)) ? saleNumVal : undefined,
          saleId: saleIdVal,
          fecha,
          fechaIso,
          cliente: cliente.trim(),
          clienteTelefono: clienteTelefono.trim(),
          vendedor: vendedor.trim(),
          agencia: agencia.trim(),
          producto: producto.trim(),
          codigoFardo: codigoFardo.trim() || undefined,
          kilos: kilos.trim() || undefined,
          cantidad: Number(cantidad) || 1,
          motivo: motivo.trim(),
          costo: Number(costo) || 0,
          observaciones: observaciones.trim() || undefined,
          aplicaDescuentoComision,
          montoDescuentoComision: aplicaDescuentoComision ? Number(montoDescuentoComision) || 0 : 0,
          reingresaStock,
          estadoProducto,
          registradoPor: currentUser?.nombre || 'ADMINISTRADOR'
        });
      }
      onClose();
    } catch (err: any) {
      console.error('Error al guardar devolución:', err);
      setErrorMsg(err.message || 'Error al procesar la devolución.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-[36px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-rose-600 to-amber-600 text-white flex items-center justify-between relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center gap-3 z-10">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
              <RotateCcw size={24} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-rose-200">Módulo Administrativo</span>
                {initialData && (
                  <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[10px] font-black">
                    {initialData.codigoDevolucion}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight">
                {initialData ? 'Editar Devolución de Venta' : '📋 DEVOLUCIÓN DE VENTA'}
              </h2>
            </div>
          </div>

          <button
            onClick={() => { playSound('click'); onClose(); }}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all z-10 active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in shake">
              <AlertCircle size={18} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Autorelleno por Número de Venta */}
          <div className="p-4 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 rounded-3xl border border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-amber-900 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-600" />
                ⚡ Autorellenar con N° de Nota de Venta
              </label>
              <span className="text-[9px] font-bold text-amber-700/80">Escribe el N° y autocompleta el formulario</span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-2.5 text-xs font-black text-amber-600">#</span>
                <input
                  type="text"
                  value={numeroVentaInput}
                  onChange={(e) => handleBuscarVenta(e.target.value)}
                  placeholder="Ej: 1042 (Autorellena cliente, vendedor, producto, fardo, etc.)"
                  className="w-full pl-8 pr-4 py-2.5 bg-white border border-amber-300 rounded-2xl text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {selectedSale && (
                <div className="px-3.5 py-2 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 animate-in fade-in">
                  <Check size={14} /> Venta Encontrada
                </div>
              )}
            </div>

            {autoFilledNotice && (
              <p className="text-[10px] font-bold text-emerald-700 animate-in fade-in flex items-center gap-1 pt-1">
                <CheckCircle2 size={13} className="shrink-0" />
                <span>{autoFilledNotice}</span>
              </p>
            )}
          </div>

          {/* Fila 1: Fecha y Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Calendar size={13} className="text-rose-500" />
                📅 Fecha
              </label>
              <input
                type="text"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                placeholder="Ej: 20 Agosto"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-1.5">
                <User size={13} className="text-rose-500" />
                👤 Cliente
              </label>
              <input
                type="text"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                list="clientes-list"
                placeholder="Ej: Romina Fuenzalida"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none"
                required
              />
              <datalist id="clientes-list">
                {customers.map((c) => (
                  <option key={c.id} value={c.nombre} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Fila 2: Vendedor y Agencia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-1.5">
                <UserCheck size={13} className="text-rose-500" />
                👨‍💼 Vendedor
              </label>
              <select
                value={vendedor}
                onChange={(e) => setVendedor(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none cursor-pointer"
                required
              >
                <option value="">Seleccionar Vendedor...</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.nombre}>
                    {s.nombre} ({s.rol})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Truck size={13} className="text-rose-500" />
                🚚 Agencia
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={agencia}
                  onChange={(e) => setAgencia(e.target.value)}
                  list="agencias-list"
                  placeholder="Ej: Cliente, Starken, etc."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none"
                  required
                />
                <datalist id="agencias-list">
                  {COMMON_AGENCIES.map((ag) => (
                    <option key={ag} value={ag} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Fila 3: Producto, Fardo y Kilos */}
          <div className="bg-slate-50/80 p-4 rounded-3xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 flex items-center gap-1.5">
                <Package size={13} className="text-amber-500" />
                Detalle del Producto Retornado
              </span>
              <span className="text-[9px] font-bold text-slate-400">Selecciona o escribe el artículo</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">
                  📦 Producto (Nombre / Descripción)
                </label>
                <input
                  type="text"
                  value={producto}
                  onChange={(e) => setProducto(e.target.value)}
                  placeholder="Ej: blusas, Sweater Cardigan IM, etc."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-rose-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">
                  🔢 Kilos
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={kilos}
                    onChange={(e) => setKilos(e.target.value)}
                    placeholder="Ej: 46,6"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-rose-500 outline-none pr-8"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] font-black text-slate-400">kg</span>
                </div>
              </div>
            </div>

            {/* Selector opcional de catálogo de bodega */}
            <div className="pt-2 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">
                  Vincular con Código en Stock (Opcional)
                </label>
                <select
                  value={codigoFardo}
                  onChange={handleSelectProduct}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none"
                >
                  <option value="">-- Sin código específico --</option>
                  {stock.map((s) => (
                    <option key={s.id} value={s.codigo}>
                      [{s.codigo}] {s.tipo} (Stock: {s.stockActual})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-3 sm:pt-0">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={reingresaStock}
                    onChange={(e) => setReingresaStock(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600 cursor-pointer"
                  />
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-800 block">¿Reingresa a Bodega?</span>
                    <span className="text-[9px] text-slate-400 font-medium block">Suma stock y registra trazabilidad</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Fila 4: Motivo de la Devolución */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-1.5">
              <AlertCircle size={13} className="text-rose-500" />
              ❌ Motivo de la Devolución
            </label>
            <div className="space-y-2">
              <select
                value={motivo}
                onChange={(e) => handleMotivoChange(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:border-rose-500 outline-none cursor-pointer"
                required
              >
                {COMMON_REASONS.map((r, i) => (
                  <option key={i} value={r.label}>
                    {r.label}
                  </option>
                ))}
              </select>

              {/* Caja explicativa de la política interna */}
              {motivo.includes('Mal etiquetado de origen') ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-emerald-800 font-bold leading-relaxed">
                    ✨ <b>Política de Origen:</b> No es culpa del vendedor ni de nadie en la bodega, ya que el producto llega así desde origen. <b>NO amerita descuento de comisión</b> a la vendedora.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5">
                  <Info size={16} className="text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-amber-800 font-bold leading-relaxed">
                    ⚖️ <b>Devolución con Descuento:</b> Este motivo califica para descuento de comisión al vendedor responsable. El sistema descuenta el valor de forma automática de la liquidación semanal.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Fila 5: PREGUNTA EXPLÍCITA DE DESCUENTO AL ADMINISTRADOR */}
          <div className={`p-5 rounded-3xl border transition-all ${
            aplicaDescuentoComision 
              ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-500/10' 
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-start sm:items-center gap-3">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                  aplicaDescuentoComision ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30' : 'bg-slate-200 text-slate-500'
                }`}>
                  <ArrowDownCircle size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-tight text-slate-900 flex items-center gap-1.5">
                    ¿Corresponde Descontar la Comisión al Vendedor?
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {vendedor ? (
                      <span>Vendedora: <b>{vendedor}</b> • Descuenta automáticamente de su liquidación semanal</span>
                    ) : (
                      <span>Selecciona el vendedor para asociar el descuento</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Botones Sí / No Claros para el Administrador */}
              <div className="flex items-center gap-2 shrink-0 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                <button
                  type="button"
                  onClick={() => {
                    setAplicaDescuentoComision(false);
                    setMontoDescuentoComision(0);
                    playSound('click');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                    !aplicaDescuentoComision 
                      ? 'bg-slate-800 text-white shadow' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  NO DESCONTAR
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAplicaDescuentoComision(true);
                    if (!montoDescuentoComision) {
                      setMontoDescuentoComision(comisionCalculadaVenta || 3000);
                    }
                    playSound('click');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                    aplicaDescuentoComision 
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 animate-pulse' 
                      : 'text-rose-600 hover:bg-rose-50'
                  }`}
                >
                  SÍ, DESCONTAR
                </button>
              </div>
            </div>

            {aplicaDescuentoComision && (
              <div className="pt-3 border-t border-rose-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-rose-700 mb-1">
                    Monto a Descontar Automáticamente ($ CLP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-black text-rose-600">$</span>
                    <input
                      type="number"
                      value={montoDescuentoComision || ''}
                      onChange={(e) => setMontoDescuentoComision(Number(e.target.value))}
                      placeholder="3000"
                      min="0"
                      step="500"
                      className="w-full pl-8 pr-4 py-2.5 bg-white border border-rose-300 rounded-xl text-xs font-black text-rose-700 outline-none focus:ring-2 focus:ring-rose-500/20"
                      required={aplicaDescuentoComision}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-rose-600/90 block mt-1">
                    ⚡ Se creará un ajuste negativo de -${(montoDescuentoComision || 0).toLocaleString('es-CL')} para {vendedor}
                  </span>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                    Atajos Rápidos de Comisión
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setMontoDescuentoComision(3000)}
                      className="px-2 py-1.5 bg-white hover:bg-rose-100 border border-rose-200 rounded-xl text-[10px] font-black text-rose-700 transition-all flex-1 text-center"
                    >
                      $3.000 (Normal)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMontoDescuentoComision(1500)}
                      className="px-2 py-1.5 bg-white hover:bg-rose-100 border border-rose-200 rounded-xl text-[10px] font-black text-rose-700 transition-all flex-1 text-center"
                    >
                      $1.500 (Promo)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMontoDescuentoComision(1000)}
                      className="px-2 py-1.5 bg-white hover:bg-rose-100 border border-rose-200 rounded-xl text-[10px] font-black text-rose-700 transition-all flex-1 text-center"
                    >
                      $1.000 (Lote)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fila 6: Costo y Observaciones */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-1.5">
                <DollarSign size={13} className="text-emerald-500" />
                💲 Costo
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-xs font-black text-slate-400">$</span>
                <input
                  type="number"
                  value={costo}
                  onChange={(e) => setCosto(Number(e.target.value))}
                  placeholder="0"
                  min="0"
                  className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:border-rose-500 outline-none"
                />
              </div>
              <span className="text-[9px] text-slate-400 font-medium block mt-1">Costo de flete o reparación (default 0)</span>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-1.5">
                <FileText size={13} className="text-slate-400" />
                📝 Observaciones
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Detalles adicionales sobre el estado de las prendas, acuerdos o seguimiento..."
                rows={2}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:bg-white focus:border-rose-500 outline-none resize-none"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4 shrink-0">
          <button
            type="button"
            onClick={() => { playSound('click'); onClose(); }}
            className="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200/70 transition-all active:scale-95"
            disabled={saving}
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-white bg-gradient-to-r from-rose-600 to-amber-600 shadow-xl shadow-rose-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
          >
            {saving ? (
              <span>Guardando...</span>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>{initialData ? 'Actualizar Devolución' : 'Guardar Devolución'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
