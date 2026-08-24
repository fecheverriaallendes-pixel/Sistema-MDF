import React, { useState } from 'react';
import { 
  X, 
  Truck, 
  Package, 
  MapPin, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Home, 
  Boxes, 
  Copy, 
  Check, 
  MessageSquare, 
  User, 
  Send,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Sale, SaleStatus, DispatchType, StockItem } from '../types';

interface SaleTrackingModalProps {
  sale: Sale | null;
  stock?: StockItem[];
  onClose: () => void;
  onLiberarJuntaCompra?: (sale: Sale) => void;
}

export function formatShippingStatus(sale: Sale): {
  badgeText: string;
  badgeBg: string;
  badgeTextColor: string;
  title: string;
  description: string;
  step: number; // 1: Recibido/Preparación, 2: En ruta/Listo, 3: Entregado
  isJunta: boolean;
} {
  const isJunta = Boolean(sale.juntaCompra && sale.juntaCompra.trim().toUpperCase().includes('JUNTA') && sale.status === SaleStatus.PENDIENTE);
  
  if (isJunta) {
    return {
      badgeText: '📦 Custodia Junta Compra',
      badgeBg: 'bg-indigo-100 border-indigo-300',
      badgeTextColor: 'text-indigo-800',
      title: 'Custodia Temporal (Junta Compra)',
      description: 'El fardo está reservado y custodiado en bodega a la espera de que el cliente acumule más compras o dé la orden de despacho.',
      step: 1,
      isJunta: true
    };
  }

  if (sale.status === SaleStatus.ENVIADO) {
    const isRetiro = sale.tipoDespacho === DispatchType.RETIRO;
    return {
      badgeText: isRetiro ? '✅ Retirado por Cliente' : (sale.estadoDespacho || '✅ Despachado / Entregado'),
      badgeBg: 'bg-emerald-100 border-emerald-300',
      badgeTextColor: 'text-emerald-800',
      title: isRetiro ? 'Retiro Completado' : 'Envío Despachado',
      description: isRetiro 
        ? 'La mercadería ya fue retirada por el cliente o su representante en bodega.'
        : `El pedido fue despachado de bodega ${sale.transportista ? `con ${sale.transportista}` : (sale.agencia ? `vía ${sale.agencia}` : '')}.`,
      step: 3,
      isJunta: false
    };
  }

  // Pending statuses
  if (sale.tipoDespacho === DispatchType.RETIRO) {
    return {
      badgeText: '🏢 Listo para Retiro',
      badgeBg: 'bg-amber-100 border-amber-300',
      badgeTextColor: 'text-amber-800',
      title: 'Listo para Retiro en Bodega / Local',
      description: 'El fardo ya está apartado en bodega y disponible para que el cliente pase a retirarlo.',
      step: 2,
      isJunta: false
    };
  }

  if (sale.transportista) {
    return {
      badgeText: `🚚 Asignado: ${sale.transportista}`,
      badgeBg: 'bg-blue-100 border-blue-300',
      badgeTextColor: 'text-blue-800',
      title: 'En Preparación de Carga',
      description: `Asignado al transportista ${sale.transportista}. En proceso de carga y salida.`,
      step: 2,
      isJunta: false
    };
  }

  return {
    badgeText: '⏳ En Preparación en Bodega',
    badgeBg: 'bg-amber-100 border-amber-300',
    badgeTextColor: 'text-amber-800',
    title: 'En Preparación en Bodega',
    description: 'El pedido fue recibido y el equipo de bodega está alistando, etiquetando y embalando la mercadería.',
    step: 1,
    isJunta: false
  };
}

export function generateWhatsAppTrackingMessage(sale: Sale, stock?: StockItem[]): string {
  const isJunta = Boolean(sale.juntaCompra && sale.juntaCompra.trim().toUpperCase().includes('JUNTA') && sale.status === SaleStatus.PENDIENTE);
  const statusInfo = formatShippingStatus(sale);

  // Products description
  let productsSummary = '';
  if (sale.items && sale.items.length > 0) {
    productsSummary = sale.items.map(it => {
      const stockItem = stock?.find(s => s.codigo === it.codigoFardo);
      const name = stockItem?.tipo || it.codigoFardo;
      return `• ${it.cantidad}x ${name} (${it.codigoFardo})`;
    }).join('\n');
  } else {
    const stockItem = stock?.find(s => s.codigo === sale.codigoFardo);
    const name = stockItem?.tipo || sale.codigoFardo || 'Fardo';
    productsSummary = `• ${sale.cantidad || 1}x ${name} (${sale.codigoFardo || 'MDF'})`;
  }

  const deliveryType = sale.tipoDespacho === DispatchType.DOMICILIO 
    ? '🏠 Despacho a Domicilio'
    : sale.tipoDespacho === DispatchType.AGENCIA 
      ? `🏢 Envío por Agencia (${sale.agencia || 'Por confirmar'})`
      : '🏬 Retiro en Bodega / Local';

  let message = `📦 *ESTADO DE TU COMPRA - CUADERNO MDF* 🚚\n\n`;
  message += `¡Hola *${sale.cliente}*! Te compartimos la información y el estado actual de tu compra *Venta #${sale.numeroVenta}*:\n\n`;
  message += `📋 *PRODUCTO(S):*\n${productsSummary}\n\n`;
  message += `📍 *MODALIDAD:* ${deliveryType}\n`;
  
  if (sale.direccion && sale.tipoDespacho !== DispatchType.RETIRO) {
    message += `🗺️ *DIRECCIÓN DE DESTINO:* ${sale.direccion}\n`;
  }

  if (sale.transportista) {
    message += `🚚 *TRANSPORTISTA ASIGNADO:* ${sale.transportista}\n`;
  } else if (sale.agencia && sale.tipoDespacho === DispatchType.AGENCIA) {
    message += `🏢 *AGENCIA:* ${sale.agencia}\n`;
  }

  message += `\n⚡ *ESTADO ACTUAL:* ${statusInfo.badgeText.toUpperCase()}\n`;
  message += `ℹ️ _${statusInfo.description}_\n`;

  if (sale.fechaDespacho) {
    const d = new Date(sale.fechaDespacho);
    const dateFormatted = !isNaN(d.getTime()) 
      ? d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : sale.fechaDespacho;
    message += `📅 *FECHA DE DESPACHO:* ${dateFormatted}\n`;
  }

  if (isJunta) {
    message += `\n💡 *Recuerda:* Tu fardo se encuentra seguro en bodega. Avísanos cuando desees enviarlo junto a tus próximas compras.\n`;
  }

  message += `\n¡Muchas gracias por tu confianza! Si tienes cualquier consulta, estamos atentos para ayudarte. ✨`;

  return message;
}

export function SaleTrackingModal({ sale, stock, onClose, onLiberarJuntaCompra }: SaleTrackingModalProps) {
  const [copied, setCopied] = useState(false);

  if (!sale) return null;

  const statusInfo = formatShippingStatus(sale);
  const waMessage = generateWhatsAppTrackingMessage(sale, stock);

  const handleCopy = () => {
    navigator.clipboard.writeText(waMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const phone = (sale.telefono || '').replace(/\D/g, '');
    if (!phone) {
      alert("El cliente no tiene teléfono registrado.");
      return;
    }
    const cleanPhone = phone.startsWith('56') ? phone : `56${phone}`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden my-8 border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-start justify-between relative shrink-0">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-xs uppercase rounded-xl tracking-wider shadow-sm">
                Venta #{sale.numeroVenta}
              </span>
              <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase border ${statusInfo.badgeBg} ${statusInfo.badgeTextColor}`}>
                {statusInfo.badgeText}
              </span>
            </div>
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white pt-1">
              Tracking de Envío
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Vendedora: <strong className="text-emerald-400 uppercase">{sale.vendedor || 'General'}</strong> • Fecha: {sale.fecha}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            title="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* Progress Timeline */}
          <div className="bg-slate-50 p-6 rounded-[28px] border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Progreso del Pedido</p>
            <div className="grid grid-cols-3 gap-2 relative">
              {/* Line connector */}
              <div className="absolute top-1/2 left-[15%] right-[15%] -translate-y-1/2 h-1 bg-slate-200 z-0">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: statusInfo.step === 1 ? '0%' : statusInfo.step === 2 ? '50%' : '100%' }}
                />
              </div>

              {/* Step 1 */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs transition-all ${
                  statusInfo.step >= 1 ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-slate-200 text-slate-500'
                }`}>
                  <Package size={18} />
                </div>
                <span className="text-[11px] font-black text-slate-800 uppercase mt-2">1. Preparación</span>
                <span className="text-[9px] text-slate-400 font-semibold">Bodega</span>
              </div>

              {/* Step 2 */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs transition-all ${
                  statusInfo.step >= 2 ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-slate-200 text-slate-500'
                }`}>
                  <Truck size={18} />
                </div>
                <span className="text-[11px] font-black text-slate-800 uppercase mt-2">2. En Ruta</span>
                <span className="text-[9px] text-slate-400 font-semibold">Transporte</span>
              </div>

              {/* Step 3 */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs transition-all ${
                  statusInfo.step >= 3 ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-slate-200 text-slate-500'
                }`}>
                  <CheckCircle2 size={18} />
                </div>
                <span className="text-[11px] font-black text-slate-800 uppercase mt-2">3. Entregado</span>
                <span className="text-[9px] text-slate-400 font-semibold">Cliente</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200/70">
              <h4 className="font-black text-slate-900 text-sm">{statusInfo.title}</h4>
              <p className="text-xs text-slate-600 font-medium mt-0.5">{statusInfo.description}</p>
            </div>
          </div>

          {/* Client & Destination Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-100 space-y-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <User size={12} className="text-amber-500" /> Cliente
              </span>
              <p className="font-black text-slate-900 text-base uppercase leading-snug">{sale.cliente}</p>
              <p className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Phone size={13} className="text-emerald-600" /> {sale.telefono || 'Sin teléfono'}
              </p>
              {sale.rut && <p className="text-[11px] font-medium text-slate-500">RUT: {sale.rut}</p>}
            </div>

            <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-100 space-y-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <MapPin size={12} className="text-blue-500" /> Destino y Modalidad
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-lg text-[10px] font-black uppercase">
                  {sale.tipoDespacho || 'Despacho'}
                </span>
                {sale.agencia && (
                  <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-lg text-[10px] font-black uppercase">
                    Agencia: {sale.agencia}
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-800 uppercase leading-snug">
                {sale.direccion || 'RETIRO EN BODEGA / TIENDA'}
              </p>
              {sale.transportista && (
                <p className="text-xs font-bold text-emerald-700 flex items-center gap-1 pt-1">
                  <Truck size={13} /> Transportista: <strong>{sale.transportista}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Products Included */}
          <div className="bg-white border-2 border-slate-100 p-5 rounded-[24px] space-y-3">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
              Productos en este Envío
            </span>
            {sale.items && sale.items.length > 0 ? (
              <div className="space-y-2">
                {sale.items.map((it, idx) => {
                  const stockItem = stock?.find(s => s.codigo === it.codigoFardo);
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center font-mono text-xs font-bold">
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase">
                            {stockItem?.tipo || it.codigoFardo}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">Código: {it.codigoFardo}</p>
                        </div>
                      </div>
                      <span className="text-xs font-black bg-white px-3 py-1 rounded-xl border border-slate-200 text-slate-800">
                        {it.cantidad} unidad(es)
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center font-mono text-xs font-bold">
                    #1
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 uppercase">
                      {stock?.find(s => s.codigo === sale.codigoFardo)?.tipo || sale.codigoFardo || 'Fardo'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">Código: {sale.codigoFardo || 'N/A'}</p>
                  </div>
                </div>
                <span className="text-xs font-black bg-white px-3 py-1 rounded-xl border border-slate-200 text-slate-800">
                  {sale.cantidad || 1} unidad(es)
                </span>
              </div>
            )}
          </div>

          {/* Quick WhatsApp Share Box */}
          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-[28px] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500 text-white rounded-xl">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h4 className="font-black text-emerald-950 text-sm uppercase">Mensaje de Estado para Cliente</h4>
                  <p className="text-[10px] text-emerald-700 font-medium">Listo para enviar por WhatsApp</p>
                </div>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
              </button>
            </div>

            <div className="bg-white/80 p-4 rounded-2xl border border-emerald-100 font-mono text-[11px] text-slate-700 whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
              {waMessage}
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {statusInfo.isJunta && onLiberarJuntaCompra && (
            <button
              onClick={() => {
                if (confirm(`¿Liberar Venta #${sale.numeroVenta} (${sale.cliente}) para Despacho Inmediato?`)) {
                  onLiberarJuntaCompra(sale);
                }
              }}
              className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <Sparkles size={16} /> Liberar a Despacho Inmediato
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-5 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
            >
              Cerrar
            </button>
            <button
              onClick={handleOpenWhatsApp}
              className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <Send size={16} /> Enviar WhatsApp al Cliente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
