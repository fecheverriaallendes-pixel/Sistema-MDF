import React, { useState, useMemo } from 'react';
import { 
  X, 
  Send, 
  Copy, 
  Check, 
  Truck, 
  Building2, 
  Clock, 
  Phone, 
  User, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ExternalLink,
  Filter,
  Globe
} from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { Sale, StaffRole, DispatchType } from '../types';
import { formatChileanWhatsAppUrl, generateDispatchDepartureWhatsAppMessage } from './SaleTrackingModal';
import { matchRut } from '../utils/rutUtils';

interface DepartureNotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DepartureNotificationCenterModal({ isOpen, onClose }: DepartureNotificationCenterModalProps) {
  const { sales, stock, currentUser, markDepartureNotificationAsSent, triggerDispatchWebhook, playSound, settings } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendedor, setSelectedVendedor] = useState<string>('TODOS');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendingWebhookId, setSendingWebhookId] = useState<string | null>(null);

  const isAdmin = currentUser?.rol === StaffRole.ADMIN;
  const isVendedor = currentUser?.rol === StaffRole.VENDEDOR;

  // Pending notifications: sales with notificacionSalidaPendiente === true
  const pendingSales = useMemo(() => {
    return (sales || []).filter(s => {
      if (!s.notificacionSalidaPendiente) return false;
      if (isVendedor && !isAdmin && currentUser?.nombre) {
        if (selectedVendedor === 'MIS_VENTAS') {
          return s.vendedor === currentUser.nombre;
        }
      }
      if (selectedVendedor !== 'TODOS' && selectedVendedor !== 'MIS_VENTAS') {
        return s.vendedor === selectedVendedor;
      }
      return true;
    });
  }, [sales, isVendedor, isAdmin, currentUser, selectedVendedor]);

  // Vendedoras list for filtering
  const allVendedoras = useMemo(() => {
    const set = new Set<string>();
    (sales || []).forEach(s => {
      if (s.notificacionSalidaPendiente && s.vendedor) {
        set.add(s.vendedor);
      }
    });
    return Array.from(set);
  }, [sales]);

  const filteredSales = useMemo(() => {
    if (!searchTerm.trim()) return pendingSales;
    const term = searchTerm.toLowerCase().trim();
    return pendingSales.filter(s => {
      return (
        String(s.numeroVenta || '').includes(term) ||
        (s.cliente || '').toLowerCase().includes(term) ||
        (s.rut ? matchRut(s.rut, term) : false) ||
        (s.telefono || '').toLowerCase().includes(term) ||
        (s.transportista || '').toLowerCase().includes(term) ||
        (s.agencia || '').toLowerCase().includes(term) ||
        (s.direccion || '').toLowerCase().includes(term) ||
        (s.vendedor || '').toLowerCase().includes(term)
      );
    });
  }, [pendingSales, searchTerm]);

  if (!isOpen) return null;

  const handleSendWhatsApp = (sale: Sale) => {
    playSound('click');
    const phone = (sale.telefono || '').replace(/\D/g, '');
    if (!phone) {
      alert(`La Venta #${sale.numeroVenta} de ${sale.cliente} no tiene número de teléfono registrado.`);
      return;
    }
    const message = sale.notificacionSalidaMensaje || generateDispatchDepartureWhatsAppMessage(sale, stock);
    const waUrl = formatChileanWhatsAppUrl(phone, message);
    if (!waUrl) {
      alert("El número de teléfono no es válido.");
      return;
    }
    window.open(waUrl, '_blank');
    markDepartureNotificationAsSent(sale.id);
    playSound('success');
  };

  const handleCopyMessage = (sale: Sale) => {
    const message = sale.notificacionSalidaMensaje || generateDispatchDepartureWhatsAppMessage(sale, stock);
    navigator.clipboard.writeText(message);
    setCopiedId(sale.id);
    playSound('success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleMarkAsNotified = async (sale: Sale) => {
    if (confirm(`¿Marcar la Venta #${sale.numeroVenta} de ${sale.cliente} como ya notificada al cliente?`)) {
      await markDepartureNotificationAsSent(sale.id);
      playSound('success');
    }
  };

  const handleTriggerWebhook = async (sale: Sale) => {
    const message = sale.notificacionSalidaMensaje || generateDispatchDepartureWhatsAppMessage(sale, stock);
    setSendingWebhookId(sale.id);
    playSound('click');
    try {
      const ok = await triggerDispatchWebhook(sale, message);
      if (ok) {
        await markDepartureNotificationAsSent(sale.id);
        alert(`¡Mensaje enviado con éxito vía Webhook para ${sale.cliente}!`);
        playSound('success');
      } else {
        alert("El webhook no respondió exitosamente. Por favor verifica la URL del webhook en Configuración.");
      }
    } catch (e) {
      alert("Error al intentar disparar el Webhook.");
    } finally {
      setSendingWebhookId(null);
    }
  };

  const formatHoraSalida = (isoDate?: string) => {
    if (!isoDate) return 'Hoy';
    try {
      const d = new Date(isoDate);
      if (isNaN(d.getTime())) return isoDate;
      return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' }) + ' a las ' + d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) + ' hrs';
    } catch {
      return isoDate;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-[36px] shadow-2xl w-full max-w-4xl overflow-hidden my-6 border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white flex items-start justify-between relative shrink-0">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-xs uppercase rounded-xl tracking-wider shadow-sm flex items-center gap-1.5">
                <Truck size={14} /> Salidas de Bodega
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-xl text-xs font-black uppercase flex items-center gap-1">
                <CheckCircle2 size={13} /> {pendingSales.length} {pendingSales.length === 1 ? 'Pendiente de Notificar' : 'Pendientes de Notificar'}
              </span>
            </div>
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white pt-1">
              Bandeja de Avisos al Cliente
            </h3>
            <p className="text-xs text-slate-300 font-medium max-w-2xl leading-relaxed">
              El <strong>Jefe de Bodega</strong> ya confirmó la salida física de estos pedidos. Como el personal de bodega no interactúa con WhatsApp, aquí puedes notificar a los clientes con <strong>1 solo clic</strong> o copiando el mensaje ya redactado.
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors ml-2 shrink-0"
            title="Cerrar bandeja"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 md:px-8 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, RUT, venta #, transportista, teléfono..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            {allVendedoras.length > 0 && (
              <select
                value={selectedVendedor}
                onChange={(e) => setSelectedVendedor(e.target.value)}
                className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 shadow-xs"
              >
                <option value="TODOS">Todas las Vendedoras ({pendingSales.length})</option>
                {isVendedor && currentUser?.nombre && (
                  <option value="MIS_VENTAS">Solo Mis Ventas</option>
                )}
                {allVendedoras.map(v => (
                  <option key={v} value={v}>Vendedora: {v}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Sales List Body */}
        <div className="p-4 md:p-8 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {filteredSales.length === 0 ? (
            <div className="text-center py-16 px-4 bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center font-black">
                <CheckCircle2 size={32} />
              </div>
              <h4 className="text-lg font-black text-slate-900 uppercase">¡Al día! No hay notificaciones pendientes</h4>
              <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                Todos los pedidos que han salido de bodega ya han sido notificados a los clientes o no hay nuevas salidas pendientes.
              </p>
            </div>
          ) : (
            filteredSales.map((sale) => {
              const isDomicilio = sale.tipoDespacho === DispatchType.DOMICILIO || (Boolean(sale.tipoDespacho) && sale.tipoDespacho.toUpperCase().includes('DOMICILIO'));
              const isAgencia = sale.tipoDespacho === DispatchType.AGENCIA || (Boolean(sale.tipoDespacho) && sale.tipoDespacho.toUpperCase().includes('AGENCIA'));
              const isCopied = copiedId === sale.id;
              const isSendingWebhook = sendingWebhookId === sale.id;
              const hasPhone = Boolean(sale.telefono && sale.telefono.trim().length >= 6);

              return (
                <div 
                  key={sale.id}
                  className="bg-white border-2 border-slate-100 hover:border-emerald-200 rounded-[28px] p-5 md:p-6 shadow-sm hover:shadow-md transition-all space-y-4"
                >
                  {/* Top Bar of Card */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 bg-slate-900 text-white font-black text-xs uppercase rounded-xl tracking-wider">
                        Venta #{sale.numeroVenta}
                      </span>
                      <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 ${
                        isDomicilio ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {isDomicilio ? <Truck size={12} /> : <Building2 size={12} />}
                        {isDomicilio ? 'Despacho Domicilio' : 'Envío Agencia'}
                      </span>
                      {sale.vendedor && (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-[10px] font-black uppercase">
                          Vendedora: {sale.vendedor}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                      <Clock size={13} className="text-amber-500" />
                      <span>Salida Bodega: {formatHoraSalida(sale.notificacionSalidaFecha || sale.fechaDespacho)}</span>
                    </div>
                  </div>

                  {/* Customer and Logistics Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                        <User size={12} className="text-amber-500" /> Cliente / Destinatario
                      </div>
                      <p className="font-black text-slate-900 uppercase text-sm leading-tight">{sale.cliente}</p>
                      <p className="font-mono font-bold text-slate-600 flex items-center gap-1">
                        <Phone size={12} className="text-emerald-500" />
                        {sale.telefono || <span className="text-red-500 italic">Sin teléfono registrado</span>}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                        <Truck size={12} className="text-blue-500" /> Logística de Salida
                      </div>
                      {sale.transportista && (
                        <p className="font-bold text-emerald-800 leading-tight">
                          Transporte/Chofer: <strong>{sale.transportista}</strong>
                        </p>
                      )}
                      {sale.agencia && (
                        <p className="font-bold text-purple-800 leading-tight">
                          Agencia: <strong>{sale.agencia}</strong>
                        </p>
                      )}
                      <p className="text-slate-600 truncate" title={sale.direccion}>
                        Destino: {sale.direccion || 'Domicilio registrado'}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyMessage(sale)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                        title="Copiar texto para WhatsApp"
                      >
                        {isCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        <span>{isCopied ? '¡Copiado!' : 'Copiar Texto'}</span>
                      </button>

                      {settings.webhookSalidaDespachoUrl && (
                        <button
                          onClick={() => handleTriggerWebhook(sale)}
                          disabled={isSendingWebhook}
                          className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                          title="Enviar mediante Webhook configurado"
                        >
                          <Globe size={14} />
                          <span>{isSendingWebhook ? 'Enviando Webhook...' : 'Enviar por Webhook'}</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleMarkAsNotified(sale)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
                        title="Marcar como ya notificado sin abrir WhatsApp"
                      >
                        Marcar como Notificado
                      </button>

                      <button
                        onClick={() => handleSendWhatsApp(sale)}
                        disabled={!hasPhone}
                        className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Send size={14} />
                        <span>Enviar WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-5 md:px-8 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 font-medium">
            💡 Al presionar <strong>"Enviar WhatsApp"</strong> se abrirá la conversación con el cliente y el pedido quedará marcado como notificado.
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
          >
            Entendido / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
