import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Copy, 
  Check, 
  Truck, 
  Building2, 
  MapPin, 
  Phone, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Sale, DispatchType } from '../types';
import { formatChileanWhatsAppUrl } from './SaleTrackingModal';

interface DispatchDepartureNotificationModalProps {
  sale: Sale;
  message: string;
  wasAutoOpened: boolean;
  autoOpenPreference: boolean;
  onToggleAutoOpenPreference: (enabled: boolean) => void;
  onClose: () => void;
}

export function DispatchDepartureNotificationModal({
  sale,
  message,
  wasAutoOpened,
  autoOpenPreference,
  onToggleAutoOpenPreference,
  onClose
}: DispatchDepartureNotificationModalProps) {
  const [copied, setCopied] = useState(false);
  const [phone, setPhone] = useState(sale.telefono || '');
  const [openedOnce, setOpenedOnce] = useState(wasAutoOpened);

  const isDomicilio = sale.tipoDespacho === DispatchType.DOMICILIO || (Boolean(sale.tipoDespacho) && sale.tipoDespacho.toUpperCase().includes('DOMICILIO'));
  const isAgencia = sale.tipoDespacho === DispatchType.AGENCIA || (Boolean(sale.tipoDespacho) && sale.tipoDespacho.toUpperCase().includes('AGENCIA'));

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const waUrl = formatChileanWhatsAppUrl(phone, message);
    if (!waUrl) {
      alert("Por favor ingresa un número de teléfono válido para enviar por WhatsApp.");
      return;
    }
    window.open(waUrl, '_blank');
    setOpenedOnce(true);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden my-8 border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-start justify-between relative shrink-0">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-xs uppercase rounded-xl tracking-wider shadow-sm">
                Venta #{sale.numeroVenta}
              </span>
              <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 ${
                isDomicilio ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' : 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
              }`}>
                {isDomicilio ? <Truck size={13} /> : <Building2 size={13} />}
                {isDomicilio ? 'Salida a Domicilio' : 'Salida a Agencia'}
              </span>
              <span className="px-3 py-1 rounded-xl text-xs font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <CheckCircle2 size={13} /> Despacho Confirmado
              </span>
            </div>
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white pt-1">
              Notificación de Salida
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Cliente: <strong className="text-white uppercase">{sale.cliente}</strong> • Destino: <strong className="text-amber-400 uppercase">{sale.agencia || sale.direccion || 'Domicilio'}</strong>
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors ml-2"
            title="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* Status Alert */}
          {openedOnce ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500 text-white rounded-xl flex items-center justify-center font-black shrink-0">
                <Check size={18} />
              </div>
              <div className="flex-1 text-xs">
                <p className="font-black text-emerald-950 uppercase">Mensaje de WhatsApp Enviado / Abierto</p>
                <p className="text-emerald-700 font-medium">Se abrió la ventana de WhatsApp con el mensaje de salida listo para el cliente.</p>
              </div>
            </div>
          ) : !phone ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
              <AlertCircle size={24} className="text-amber-600 shrink-0" />
              <div className="flex-1 text-xs">
                <p className="font-black text-amber-950 uppercase">Sin Teléfono Registrado</p>
                <p className="text-amber-800 font-medium">Este cliente no tiene teléfono en la venta. Ingrésalo a continuación para enviar el WhatsApp de inmediato o copia el texto.</p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3">
              <Sparkles size={22} className="text-blue-600 shrink-0" />
              <div className="flex-1 text-xs">
                <p className="font-black text-blue-950 uppercase">Listo para Notificar al Cliente</p>
                <p className="text-blue-800 font-medium">El mensaje de confirmación de salida ha sido preparado con todos los detalles del transporte y productos.</p>
              </div>
            </div>
          )}

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <User size={12} className="text-amber-500" /> Receptor
              </span>
              <p className="font-black text-slate-900 text-sm uppercase leading-tight">{sale.cliente}</p>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Teléfono / WhatsApp:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+56 9 ..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Truck size={12} className="text-blue-500" /> Logística de Salida
              </span>
              <div className="text-xs font-bold text-slate-800 space-y-1">
                {sale.transportista && (
                  <p className="flex items-center gap-1 text-emerald-700">
                    <span>Chofer/Transporte:</span> <strong>{sale.transportista}</strong>
                  </p>
                )}
                {sale.agencia && (
                  <p className="flex items-center gap-1 text-purple-700">
                    <span>Agencia:</span> <strong>{sale.agencia}</strong>
                  </p>
                )}
                <p className="text-slate-600 line-clamp-1" title={sale.direccion}>
                  Destino: {sale.direccion || 'Retiro en Bodega'}
                </p>
              </div>
            </div>
          </div>

          {/* WhatsApp Message Preview Box */}
          <div className="bg-emerald-50/70 border border-emerald-200 p-5 rounded-[28px] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-xs">
                  <Send size={15} />
                </div>
                <div>
                  <h4 className="font-black text-emerald-950 text-xs uppercase">Mensaje de Salida Automático</h4>
                  <p className="text-[10px] text-emerald-700 font-medium">Texto formateado para WhatsApp</p>
                </div>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
              </button>
            </div>

            <div className="bg-white/90 p-4 rounded-2xl border border-emerald-100 font-mono text-[11px] text-slate-700 whitespace-pre-wrap max-h-44 overflow-y-auto leading-relaxed shadow-inner">
              {message}
            </div>
          </div>

          {/* Auto-open Preference Toggle */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="text-xs">
              <p className="font-black text-slate-800">Apertura Automática de WhatsApp</p>
              <p className="text-[11px] text-slate-500 font-medium">Abrir la ventana de WhatsApp directamente al hacer clic en "Confirmar Salida".</p>
            </div>
            <button
              type="button"
              onClick={() => onToggleAutoOpenPreference(!autoOpenPreference)}
              className={`w-14 h-8 rounded-full p-1 transition-all ${autoOpenPreference ? 'bg-emerald-500' : 'bg-slate-300'}`}
              title="Activar/Desactivar apertura automática"
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all transform ${autoOpenPreference ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
          >
            Cerrar
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-3.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95"
            >
              {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
            <button
              onClick={handleOpenWhatsApp}
              className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
            >
              <Send size={15} />
              <span>{openedOnce ? 'Reabrir WhatsApp' : 'Enviar por WhatsApp'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
