import React, { useState, useMemo } from 'react';
import { 
  RotateCcw, 
  Plus, 
  Search, 
  Filter, 
  Copy, 
  Check, 
  Printer, 
  Trash2, 
  Edit3, 
  ShieldAlert, 
  Calendar, 
  User, 
  Truck, 
  Package, 
  Scale, 
  DollarSign, 
  ArrowDownCircle, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
  FileSpreadsheet,
  Hash
} from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { SaleReturn, StaffRole } from '../types';
import { DevolucionModal } from '../components/devoluciones/DevolucionModal';

export default function Devoluciones() {
  const { saleReturns, deleteSaleReturn, currentUser, playSound, staff } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReturn, setEditingReturn] = useState<SaleReturn | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeller, setSelectedSeller] = useState('ALL');
  const [discountFilter, setDiscountFilter] = useState<'ALL' | 'WITH_DISCOUNT' | 'NO_DISCOUNT'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [printReturn, setPrintReturn] = useState<SaleReturn | null>(null);

  // Verificación de rol administrativo
  const isAdmin = currentUser?.rol === StaffRole.ADMIN;

  // Filtrado de devoluciones
  const filteredReturns = useMemo(() => {
    return (saleReturns || []).filter(item => {
      // Filtro de búsqueda
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesClient = item.cliente?.toLowerCase().includes(query);
        const matchesSeller = item.vendedor?.toLowerCase().includes(query);
        const matchesProduct = item.producto?.toLowerCase().includes(query);
        const matchesCode = item.codigoDevolucion?.toLowerCase().includes(query);
        const matchesAgency = item.agencia?.toLowerCase().includes(query);
        const matchesReason = item.motivo?.toLowerCase().includes(query);
        const matchesSaleNum = item.numeroVenta !== undefined && String(item.numeroVenta).includes(query);

        if (!matchesClient && !matchesSeller && !matchesProduct && !matchesCode && !matchesAgency && !matchesReason && !matchesSaleNum) {
          return false;
        }
      }

      // Filtro de vendedor
      if (selectedSeller !== 'ALL' && item.vendedor !== selectedSeller) {
        return false;
      }

      // Filtro de descuento
      if (discountFilter === 'WITH_DISCOUNT' && !item.aplicaDescuentoComision) {
        return false;
      }
      if (discountFilter === 'NO_DISCOUNT' && item.aplicaDescuentoComision) {
        return false;
      }

      return true;
    }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [saleReturns, searchTerm, selectedSeller, discountFilter]);

  // Estadísticas KPI
  const stats = useMemo(() => {
    const totalCount = saleReturns.length;
    const withDiscount = saleReturns.filter(r => r.aplicaDescuentoComision);
    const noDiscount = saleReturns.filter(r => !r.aplicaDescuentoComision);
    const totalDiscountAmount = withDiscount.reduce((acc, r) => acc + (Number(r.montoDescuentoComision) || 0), 0);
    const restockedCount = saleReturns.filter(r => r.reingresaStock).length;

    return {
      totalCount,
      withDiscountCount: withDiscount.length,
      noDiscountCount: noDiscount.length,
      totalDiscountAmount,
      restockedCount
    };
  }, [saleReturns]);

  // Generador de formato WhatsApp exacto
  const handleCopyWhatsApp = (item: SaleReturn) => {
    const text = `📋 DEVOLUCIÓN DE VENTA.  

📅 Fecha: ${item.fecha || 'Sin fecha'}
${item.numeroVenta ? `🧾 N° Venta: #${item.numeroVenta}\n` : ''}👤 Cliente:  ${item.cliente || 'No especificado'}
👨‍💼 Vendedor:  ${item.vendedor || 'No especificado'}
🚚 Agencia: ${item.agencia || 'Cliente'} 
📦 Producto: ${item.producto || 'No especificado'}
🔢 kilos : ${item.kilos || 'N/A'}
❌ Motivo de la devolución: ${item.motivo || 'No especificado'}
💲 Costo:  ${item.costo || 0}
${item.aplicaDescuentoComision ? `⚖️ Descuento Comisión: -$${item.montoDescuentoComision?.toLocaleString('es-CL')} (Descontado automáticamente a ${item.vendedor})` : '⚖️ Descuento Comisión: No aplica (Mal etiquetado de origen / Sin culpa de vendedor)'}
📝 Observaciones: ${item.observaciones || 'Ninguna'}`;

    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    playSound('success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handlePrint = (item: SaleReturn) => {
    setPrintReturn(item);
    playSound('click');
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleDelete = async (id: string, code: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el registro de devolución ${code}? Si tenía descuento de comisión asociado, también será revertido automáticamente en el sistema.`)) {
      return;
    }
    try {
      await deleteSaleReturn(id);
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[36px] border border-slate-100 shadow-2xl text-center max-w-md space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Acceso Restringido</h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Las devoluciones y sus deducciones de comisión sólo pueden ser administradas por cuentas con rol de <b>Administrador</b>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full py-8 px-4 sm:px-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-br from-rose-500 to-amber-500 text-white rounded-3xl shadow-xl shadow-rose-500/20">
            <RotateCcw size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-rose-100 text-rose-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                Solo Administrador
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Control de Calidad y Comisión
              </span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase mt-0.5">
              Devoluciones de Venta
            </h1>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingReturn(null);
            setIsModalOpen(true);
            playSound('click');
          }}
          className="px-6 py-4 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2.5"
        >
          <Plus size={18} />
          <span>Nueva Devolución</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Total Devoluciones */}
        <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Devoluciones</span>
            <p className="text-3xl font-black text-slate-900">{stats.totalCount}</p>
            <p className="text-[10px] font-bold text-slate-400">Casos registrados</p>
          </div>
          <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center">
            <RotateCcw size={22} />
          </div>
        </div>

        {/* Card 2: Con Descuento a Vendedora */}
        <div className="bg-gradient-to-br from-rose-900 to-slate-900 text-white p-6 rounded-[28px] shadow-xl relative overflow-hidden flex items-center justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/20 rounded-full blur-xl pointer-events-none"></div>
          <div className="space-y-1 z-10">
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-300">Descuentos Comisión</span>
            <p className="text-3xl font-black text-white">-${stats.totalDiscountAmount.toLocaleString('es-CL')}</p>
            <p className="text-[10px] font-bold text-rose-200">{stats.withDiscountCount} casos con deducción</p>
          </div>
          <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center z-10">
            <ArrowDownCircle size={24} />
          </div>
        </div>

        {/* Card 3: Por Mal Etiquetado / Origen */}
        <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Por Origen / Sin Descuento</span>
            <p className="text-3xl font-black text-emerald-600">{stats.noDiscountCount}</p>
            <p className="text-[10px] font-bold text-emerald-500/80">Mal etiquetado de fábrica</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
        </div>

        {/* Card 4: Reingresados a Bodega */}
        <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Reingresos Bodega</span>
            <p className="text-3xl font-black text-slate-900">{stats.restockedCount}</p>
            <p className="text-[10px] font-bold text-amber-600">Retornados a stock físico</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <Package size={22} />
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-xl flex flex-col md:flex-row items-center gap-4">
        {/* Buscador */}
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por #Venta, cliente, vendedor, producto (ej: blusas), código DEV..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:border-rose-500 outline-none transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtro por Vendedor */}
        <div className="w-full md:w-48">
          <select
            value={selectedSeller}
            onChange={(e) => setSelectedSeller(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none cursor-pointer focus:bg-white focus:border-rose-500"
          >
            <option value="ALL">Todos los Vendedores</option>
            {staff.map(s => (
              <option key={s.id} value={s.nombre}>{s.nombre}</option>
            ))}
          </select>
        </div>

        {/* Filtro por Descuento */}
        <div className="w-full md:w-56">
          <select
            value={discountFilter}
            onChange={(e) => setDiscountFilter(e.target.value as any)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none cursor-pointer focus:bg-white focus:border-rose-500"
          >
            <option value="ALL">Todos los Motivos</option>
            <option value="WITH_DISCOUNT">Con Descuento Comisión</option>
            <option value="NO_DISCOUNT">Sin Descuento (Origen)</option>
          </select>
        </div>
      </div>

      {/* Listado de Devoluciones */}
      {filteredReturns.length === 0 ? (
        <div className="bg-white p-14 rounded-[36px] border border-slate-100 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <RotateCcw size={28} />
          </div>
          <h3 className="text-lg font-black uppercase tracking-tight text-slate-800">
            No se encontraron devoluciones
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchTerm || selectedSeller !== 'ALL' || discountFilter !== 'ALL'
              ? 'Prueba ajustando los filtros de búsqueda para ver otros registros.'
              : 'Aún no hay devoluciones de venta ingresadas en el sistema. Puedes registrar una haciendo clic en el botón superior.'}
          </p>
          <button
            onClick={() => {
              setEditingReturn(null);
              setIsModalOpen(true);
            }}
            className="px-6 py-3 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
          >
            + Registrar Primera Devolución
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReturns.map((item) => {
            const isNoDiscountOrigin = item.motivo?.includes('Mal etiquetado de origen');
            
            return (
              <div 
                key={item.id}
                className="bg-white rounded-[32px] border border-slate-100 shadow-xl p-6 relative overflow-hidden flex flex-col justify-between hover:shadow-2xl transition-all duration-300"
              >
                {/* Indicador lateral */}
                <div className={`absolute top-0 left-0 w-2 h-full ${
                  item.aplicaDescuentoComision ? 'bg-rose-500' : 'bg-emerald-500'
                }`}></div>

                {/* Encabezado de la Tarjeta */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black rounded-full uppercase tracking-wider">
                        {item.codigoDevolucion || 'DEV'}
                      </span>
                      {item.numeroVenta && (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1">
                          <Hash size={11} className="text-amber-700" />
                          Venta #{item.numeroVenta}
                        </span>
                      )}
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <Calendar size={13} className="text-rose-500" />
                        {item.fecha}
                      </span>
                    </div>

                    {/* Badge de Descuento de Comisión */}
                    {item.aplicaDescuentoComision ? (
                      <span className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        <ArrowDownCircle size={12} />
                        -${item.montoDescuentoComision?.toLocaleString('es-CL')} Comisión
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Sin Descuento ({isNoDiscountOrigin ? 'Origen' : 'Exento'})
                      </span>
                    )}
                  </div>

                  {/* Detalle en formato limpio */}
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                        <User size={12} className="text-slate-500" /> Cliente
                      </span>
                      <span className="font-extrabold text-slate-900 text-sm text-right">
                        {item.cliente}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                        👨‍💼 Vendedor
                      </span>
                      <span className="font-bold text-slate-700 text-right">
                        {item.vendedor}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                        <Truck size={12} className="text-slate-500" /> Agencia
                      </span>
                      <span className="font-bold text-slate-700 text-right">
                        {item.agencia}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between gap-2 bg-slate-50 p-3 rounded-2xl">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                          <Package size={12} className="text-amber-500" /> Producto
                        </span>
                        <p className="font-black text-slate-900 uppercase mt-0.5">{item.producto}</p>
                        {item.codigoFardo && (
                          <span className="text-[9px] font-mono text-slate-400">Fardo: {item.codigoFardo}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-end gap-1">
                          <Scale size={12} className="text-slate-500" /> Kilos
                        </span>
                        <p className="font-black text-slate-900 text-sm mt-0.5">
                          {item.kilos ? `${item.kilos} kg` : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Motivo */}
                    <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-rose-600 block">
                        ❌ Motivo de la Devolución
                      </span>
                      <p className="font-bold text-slate-800 leading-snug">
                        {item.motivo}
                      </p>
                    </div>

                    {/* Costo & Observaciones */}
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-400 font-bold">
                        💲 Costo Asumido: <b className="text-slate-700 font-black">${(item.costo || 0).toLocaleString('es-CL')}</b>
                      </span>
                      {item.reingresaStock && (
                        <span className="text-amber-600 font-extrabold text-[10px] uppercase">
                          ✓ Reingresó a Bodega
                        </span>
                      )}
                    </div>

                    {item.observaciones && (
                      <div className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        📝 <b>Obs:</b> {item.observaciones}
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones Rápidas */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  
                  {/* Botón WhatsApp */}
                  <button
                    onClick={() => handleCopyWhatsApp(item)}
                    className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                      copiedId === item.id 
                        ? 'bg-emerald-500 text-white shadow-md' 
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-95'
                    }`}
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check size={14} /> Copiado WhatsApp
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Formato WhatsApp
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Imprimir */}
                    <button
                      onClick={() => handlePrint(item)}
                      title="Imprimir Comprobante"
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-95"
                    >
                      <Printer size={15} />
                    </button>

                    {/* Editar */}
                    <button
                      onClick={() => {
                        setEditingReturn(item);
                        setIsModalOpen(true);
                        playSound('click');
                      }}
                      title="Editar Devolución"
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-95"
                    >
                      <Edit3 size={15} />
                    </button>

                    {/* Eliminar */}
                    <button
                      onClick={() => handleDelete(item.id, item.codigoDevolucion)}
                      title="Eliminar Devolución"
                      className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all active:scale-95"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Registro / Edición */}
      <DevolucionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingReturn(null);
        }}
        initialData={editingReturn}
      />

      {/* Plantilla de Impresión Oculta / Solo en modo Print */}
      {printReturn && (
        <div className="hidden print:block fixed inset-0 bg-white p-8 z-[9999]">
          <div className="max-w-md mx-auto border border-black p-6 rounded-2xl space-y-4 font-mono text-xs">
            <div className="text-center border-b pb-3 border-dashed border-black">
              <h2 className="text-base font-black uppercase">MDF CHILE - DEVOLUCIÓN DE VENTA</h2>
              <p className="text-[10px] text-gray-600">Comprobante de Recepción y Control</p>
              <p className="font-bold mt-1 text-sm">{printReturn.codigoDevolucion}</p>
            </div>

            <div className="space-y-1.5 leading-relaxed">
              <p><b>FECHA:</b> {printReturn.fecha}</p>
              {printReturn.numeroVenta && <p><b>N° VENTA ASOCIADA:</b> #{printReturn.numeroVenta}</p>}
              <p><b>CLIENTE:</b> {printReturn.cliente}</p>
              <p><b>VENDEDOR:</b> {printReturn.vendedor}</p>
              <p><b>AGENCIA:</b> {printReturn.agencia}</p>
              <p><b>PRODUCTO:</b> {printReturn.producto}</p>
              <p><b>KILOS:</b> {printReturn.kilos || 'N/A'} kg</p>
              <p><b>MOTIVO:</b> {printReturn.motivo}</p>
              <p><b>COSTO ASUMIDO:</b> ${printReturn.costo?.toLocaleString('es-CL')}</p>
              <p><b>DESCUENTO COMISIÓN:</b> {printReturn.aplicaDescuentoComision ? `-$${printReturn.montoDescuentoComision?.toLocaleString('es-CL')}` : 'NO APLICA (ERROR ORIGEN)'}</p>
              <p><b>OBSERVACIONES:</b> {printReturn.observaciones || 'Sin observaciones'}</p>
              <p><b>REGISTRADO POR:</b> {printReturn.registradoPor}</p>
            </div>

            <div className="border-t border-dashed border-black pt-6 mt-6 flex justify-between gap-4 text-center text-[10px]">
              <div className="w-1/2">
                <div className="border-b border-black mb-1 h-8"></div>
                <p>Firma Bodega / Recepción</p>
              </div>
              <div className="w-1/2">
                <div className="border-b border-black mb-1 h-8"></div>
                <p>Firma Vendedor / Admin</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
