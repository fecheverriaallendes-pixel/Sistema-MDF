import React, { useState, useMemo } from 'react';
import { 
  X, 
  Trash2, 
  Lock, 
  Search, 
  Calendar, 
  User, 
  DollarSign, 
  Package, 
  AlertTriangle, 
  ShieldAlert,
  Clock
} from 'lucide-react';
import { DeletedSaleRecord } from '../types';

interface VentasEliminadasModalProps {
  isOpen: boolean;
  onClose: () => void;
  deletedSales: DeletedSaleRecord[];
}

export const VentasEliminadasModal: React.FC<VentasEliminadasModalProps> = ({
  isOpen,
  onClose,
  deletedSales
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSales = useMemo(() => {
    if (!searchTerm.trim()) return deletedSales;
    const term = searchTerm.toLowerCase().trim();

    return deletedSales.filter(item => {
      const saleNum = String(item.numeroVenta || '');
      const client = (item.cliente || '').toLowerCase();
      const seller = (item.vendedor || '').toLowerCase();
      const by = (item.deletedBy || '').toLowerCase();
      const motive = (item.motivo || '').toLowerCase();

      return (
        saleNum.includes(term) ||
        client.includes(term) ||
        seller.includes(term) ||
        by.includes(term) ||
        motive.includes(term)
      );
    });
  }, [deletedSales, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300 no-print">
      <div className="bg-white rounded-[36px] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg">
              <ShieldAlert size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  Registro de Ventas Eliminadas
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-rose-100 text-rose-800">
                  {deletedSales.length} {deletedSales.length === 1 ? 'número bloqueado' : 'números bloqueados'}
                </span>
              </div>
              <p className="text-slate-500 text-xs font-semibold mt-0.5">
                Auditoría de números de venta retirados para evitar confusiones en bodega
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-6 py-3 bg-amber-50 border-b border-amber-200/80 flex items-center gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0" />
          <p className="text-xs text-amber-900 font-medium">
            <span className="font-black uppercase">Garantía de secuencia:</span> Cuando se elimina una venta, su número queda <span className="font-bold underline">bloqueado y retirado definitivamente</span>. Ninguna nueva venta podrá volver a usar estos números, asegurando que el equipo de bodega no confunda fardos ni despachos.
          </p>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar por N° Venta, cliente, vendedor, motivo de anulación..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
            />
          </div>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {filteredSales.map((item) => (
            <div 
              key={item.id}
              className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200 hover:border-slate-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-black text-sm px-3 py-1 bg-rose-600 text-white rounded-xl flex items-center gap-1.5 shadow-2xs">
                    <Lock size={13} />
                    Venta #{item.numeroVenta}
                  </span>

                  <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                    Bloqueado / No Disponible
                  </span>

                  <span className="text-slate-400 text-xs font-medium ml-auto flex items-center gap-1">
                    <Clock size={12} />
                    {item.deletedAt ? new Date(item.deletedAt).toLocaleString('es-CL') : 'Fecha no registrada'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <span className="font-black text-slate-900">{item.cliente || 'Cliente sin nombre'}</span>
                  {item.vendedor && (
                    <span className="text-slate-500">
                      Vendedor: <strong className="text-slate-700">{item.vendedor}</strong>
                    </span>
                  )}
                  {item.total ? (
                    <span className="text-slate-500">
                      Total: <strong className="text-slate-900 font-mono">${item.total.toLocaleString('es-CL')}</strong>
                    </span>
                  ) : null}
                  {item.fechaVenta && (
                    <span className="text-slate-400">
                      Fecha Venta: {item.fechaVenta}
                    </span>
                  )}
                </div>

                {item.motivo && (
                  <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/80 font-medium italic">
                    <span className="font-black text-slate-700 not-italic uppercase text-[10px] mr-1.5">Motivo:</span>
                    "{item.motivo}"
                  </p>
                )}
              </div>

              <div className="text-left md:text-right shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 w-full md:w-auto">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Eliminado por</span>
                <span className="text-xs font-black text-slate-800">{item.deletedBy || 'ADMIN'}</span>
              </div>
            </div>
          ))}

          {filteredSales.length === 0 && (
            <div className="py-16 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                <Lock size={26} />
              </div>
              <h4 className="text-base font-black text-slate-800">No hay ventas eliminadas registradas</h4>
              <p className="text-xs text-slate-500 font-medium max-w-sm mt-1">
                {searchTerm
                  ? 'No hay resultados que coincidan con la búsqueda.'
                  : 'Aún no se ha eliminado ninguna venta. Cuando se anule una venta, aparecerá aquí con su número permanentemente reservado.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Total de números protegidos: <strong className="text-slate-800">{deletedSales.length}</strong>
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
