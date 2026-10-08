import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Search, 
  CreditCard, 
  User, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Calendar,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { 
  cleanRut, 
  formatRut, 
  validateRut, 
  matchRut, 
  exactMatchRut,
  getUnifiedClients, 
  UnifiedClient 
} from '../utils/rutUtils';

interface RutClientLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectClient?: (client: {
    nombre: string;
    rut: string;
    telefono: string;
    direccion: string;
  }) => void;
  initialRut?: string;
}

export default function RutClientLookupModal({
  isOpen,
  onClose,
  onSelectClient,
  initialRut = ''
}: RutClientLookupModalProps) {
  const { customers, sales, playSound } = useStore();
  const [searchTerm, setSearchTerm] = useState(initialRut);
  const [copiedRut, setCopiedRut] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm(initialRut || '');
    }
  }, [isOpen, initialRut]);

  const allClients = useMemo(() => {
    return getUnifiedClients(customers, sales);
  }, [customers, sales]);

  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) {
      // If empty, show first 15 clients with RUT
      return allClients
        .filter(c => Boolean(c.rut && c.rut.trim()))
        .slice(0, 15);
    }

    const term = searchTerm.trim().toLowerCase();
    const cleanTerm = cleanRut(term);

    const matches = allClients.filter(c => {
      // 1. Prioritize RUT match
      if (c.rut && matchRut(c.rut, term)) return true;
      // 2. Client name match
      if (c.nombre.toLowerCase().includes(term)) return true;
      // 3. Phone match
      if (c.telefono.toLowerCase().includes(term)) return true;
      return false;
    });

    return matches.sort((a, b) => {
      const aExactRut = exactMatchRut(a.rut, cleanTerm) ? 1 : 0;
      const bExactRut = exactMatchRut(b.rut, cleanTerm) ? 1 : 0;
      if (bExactRut !== aExactRut) return bExactRut - aExactRut;
      return 0;
    });
  }, [allClients, searchTerm]);

  if (!isOpen) return null;

  const handleCopy = (rut: string) => {
    navigator.clipboard.writeText(formatRut(rut));
    setCopiedRut(rut);
    playSound('click');
    setTimeout(() => setCopiedRut(null), 2000);
  };

  const handleSelect = (client: UnifiedClient) => {
    if (onSelectClient) {
      playSound('success');
      onSelectClient({
        nombre: client.nombre,
        rut: formatRut(client.rut || ''),
        telefono: client.telefono || '',
        direccion: client.direccion || ''
      });
      onClose();
    }
  };

  const isCurrentInputValidRut = searchTerm.trim().length >= 7 && validateRut(searchTerm);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                <CreditCard size={22} className="text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black tracking-tight">Buscador de Clientes por RUT</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-900">
                    Chile
                  </span>
                </div>
                <p className="text-xs text-blue-100 font-medium mt-0.5">
                  Busca por RUT (con o sin puntos/guión), nombre o teléfono para autocompletar datos
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search Box */}
          <div className="mt-5 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ingresa RUT (ej: 12.345.678-9, 12345678-9 o 123456789)..."
              className="w-full pl-12 pr-10 py-3.5 bg-white text-slate-900 placeholder:text-slate-400 rounded-2xl font-bold text-sm shadow-lg outline-none focus:ring-4 focus:ring-blue-300 transition-all uppercase"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Quick validation badge if user entered a RUT */}
          {searchTerm.trim().length >= 7 && (
            <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold">
              {isCurrentInputValidRut ? (
                <span className="flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 size={13} /> RUT con formato y dígito verificador válido: {formatRut(searchTerm)}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-200">
                  <AlertCircle size={13} /> Buscando coincidencias para RUT: {formatRut(searchTerm) || searchTerm}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Clients List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3 bg-slate-50">
          <div className="flex items-center justify-between text-xs font-black text-slate-500 uppercase tracking-wider px-1">
            <span>Resultados ({filteredClients.length})</span>
            {searchTerm && <span>Filtro activo: "{searchTerm}"</span>}
          </div>

          {filteredClients.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-2xl border border-dashed border-slate-200">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <CreditCard size={24} />
              </div>
              <h3 className="text-sm font-black text-slate-800">No se encontraron clientes</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No hay coincidencias para el RUT o nombre ingresado. Puedes registrarlo como nuevo cliente.
              </p>
            </div>
          ) : (
            filteredClients.map((client) => {
              const formattedR = formatRut(client.rut || '');
              const isValid = client.rut ? validateRut(client.rut) : false;
              const hasRut = Boolean(client.rut && client.rut.trim());

              return (
                <div
                  key={client.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-slate-900 text-sm truncate uppercase">
                          {client.nombre}
                        </span>
                        
                        {hasRut ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-black bg-blue-50 text-blue-700 border border-blue-200/80">
                            <CreditCard size={11} className="text-blue-600" />
                            {formattedR}
                            {isValid && (
                              <CheckCircle2 size={11} className="text-emerald-600" title="RUT Válido" />
                            )}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Sin RUT
                          </span>
                        )}

                        {client.totalCompras > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShoppingBag size={10} />
                            {client.totalCompras} compra{client.totalCompras > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 font-medium">
                        {client.telefono && (
                          <span className="flex items-center gap-1 text-slate-600">
                            <Phone size={12} className="text-slate-400" />
                            {client.telefono}
                          </span>
                        )}
                        {client.direccion && (
                          <span className="flex items-center gap-1 text-slate-600 truncate max-w-xs">
                            <MapPin size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate uppercase">{client.direccion}</span>
                          </span>
                        )}
                        {client.ultimaVentaFecha && (
                          <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                            <Calendar size={11} />
                            Última: {client.ultimaVentaFecha}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {hasRut && (
                        <button
                          type="button"
                          onClick={() => handleCopy(client.rut!)}
                          title="Copiar RUT"
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-1 transition-all"
                        >
                          {copiedRut === client.rut ? (
                            <>
                              <Check size={13} className="text-emerald-600" />
                              <span className="text-emerald-600">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      )}

                      {onSelectClient && (
                        <button
                          type="button"
                          onClick={() => handleSelect(client)}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <CheckCircle2 size={13} />
                          Usar Cliente
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles size={14} className="text-amber-500" />
            <span>Total clientes en sistema: {allClients.length}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
