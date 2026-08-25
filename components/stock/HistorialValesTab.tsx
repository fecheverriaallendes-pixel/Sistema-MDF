import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Printer, 
  Truck, 
  User, 
  Calendar, 
  Package, 
  Boxes, 
  Trash2, 
  Eye, 
  ChevronRight, 
  AlertTriangle,
  ArrowUpRight,
  Filter,
  Plus
} from 'lucide-react';
import { useStore } from '../../store/GlobalContext';
import { ValeEntrada, StaffRole } from '../../types';
import { ValeEntradaPrintModal } from './ValeEntradaPrintModal';

interface HistorialValesTabProps {
  onOpenNewVale: () => void;
}

export const HistorialValesTab: React.FC<HistorialValesTabProps> = ({ onOpenNewVale }) => {
  const { valesEntrada, deleteValeEntrada, currentUser, playSound } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedValeToPrint, setSelectedValeToPrint] = useState<ValeEntrada | null>(null);
  const [deletingValeId, setDeletingValeId] = useState<string | null>(null);
  const [revertStockOnDelete, setRevertStockOnDelete] = useState(true);

  const canManage = currentUser?.rol === StaffRole.ADMIN || currentUser?.rol === StaffRole.BODEGA;
  const isAdmin = currentUser?.rol === StaffRole.ADMIN;

  // Filtrado de Vales
  const filteredVales = useMemo(() => {
    const list = [...(valesEntrada || [])].sort((a, b) => {
      return new Date(b.createdAt || b.fecha).getTime() - new Date(a.createdAt || a.fecha).getTime();
    });

    if (!searchTerm.trim()) return list;
    const q = searchTerm.trim().toUpperCase();

    return list.filter(v => 
      (v.folio && v.folio.toUpperCase().includes(q)) ||
      (v.responsable && v.responsable.toUpperCase().includes(q)) ||
      (v.numeroContenedor && v.numeroContenedor.toUpperCase().includes(q)) ||
      (v.proveedor && v.proveedor.toUpperCase().includes(q)) ||
      (v.descripcion && v.descripcion.toUpperCase().includes(q)) ||
      (v.fecha && v.fecha.includes(q)) ||
      (v.items && v.items.some(it => it.codigo?.toUpperCase().includes(q) || it.tipo?.toUpperCase().includes(q)))
    );
  }, [valesEntrada, searchTerm]);

  // KPIs
  const totalVales = valesEntrada?.length || 0;
  const totalBultosHistoricos = useMemo(() => {
    return (valesEntrada || []).reduce((acc, v) => acc + (Number(v.totalUnidades) || 0), 0);
  }, [valesEntrada]);
  const totalContenedores = useMemo(() => {
    return (valesEntrada || []).filter(v => Boolean(v.numeroContenedor && v.numeroContenedor.trim())).length;
  }, [valesEntrada]);

  const handleDeleteVale = async () => {
    if (!deletingValeId || !isAdmin) return;
    try {
      await deleteValeEntrada(deletingValeId, revertStockOnDelete);
      setDeletingValeId(null);
      playSound('success');
    } catch (err: any) {
      alert("Error al anular vale: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-[32px] p-6 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">Total Vales Emitidos</span>
            <h3 className="text-4xl font-black tracking-tight mt-1">{totalVales}</h3>
            <span className="text-[9px] text-slate-400 font-bold uppercase mt-1 block">Comprobantes de ingreso</span>
          </div>
          <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center">
            <FileText size={28} />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Bultos / Fardos Recibidos</span>
            <h3 className="text-4xl font-black text-slate-900 tracking-tight mt-1">+{totalBultosHistoricos}</h3>
            <span className="text-[9px] text-emerald-600 font-bold uppercase mt-1 block">Ingresados a stock físico</span>
          </div>
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <Package size={28} />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Contenedores Registrados</span>
            <h3 className="text-4xl font-black text-blue-600 tracking-tight mt-1">{totalContenedores}</h3>
            <span className="text-[9px] text-slate-400 font-bold uppercase mt-1 block">Cargamentos identificados</span>
          </div>
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Truck size={28} />
          </div>
        </div>
      </div>

      {/* Action and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative group flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Buscar por Folio (VE-0001), Contenedor, Responsable o Producto..."
            className="w-full pl-16 pr-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-emerald-500 outline-none transition-all shadow-sm font-bold text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {canManage && (
          <button
            onClick={onOpenNewVale}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all active:scale-95 shrink-0"
          >
            <Plus size={18} /> + Nuevo Vale de Entrada
          </button>
        )}
      </div>

      {/* Table of Vales */}
      <div className="bg-white rounded-[36px] border border-slate-100 shadow-xl overflow-hidden">
        {filteredVales.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <FileText size={32} />
            </div>
            <h4 className="text-lg font-black text-slate-800 uppercase">Sin Vales de Entrada Registrados</h4>
            <p className="text-slate-400 text-xs font-medium max-w-md mx-auto">
              No se encontraron registros de Vales de Entrada con los criterios actuales. Utiliza el botón superior para ingresar tu primer cargamento o contenedor.
            </p>
            {canManage && (
              <button
                onClick={onOpenNewVale}
                className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-wider"
              >
                + Crear Primer Vale de Entrada
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-5">Folio</th>
                  <th className="px-6 py-5">Fecha / Hora</th>
                  <th className="px-6 py-5">Responsable</th>
                  <th className="px-6 py-5">N° Contenedor / Camión</th>
                  <th className="px-6 py-5">Proveedor</th>
                  <th className="px-6 py-5 text-center">Artículos</th>
                  <th className="px-6 py-5 text-center">Total Fardos</th>
                  <th className="px-6 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold">
                {filteredVales.map((vale) => (
                  <tr key={vale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5 font-mono font-black text-slate-900 text-sm">
                      <span className="px-2.5 py-1 bg-slate-900 text-white rounded-xl">
                        {vale.folio}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-slate-800 font-extrabold">{vale.fecha}</span>
                        {vale.hora && <span className="text-[10px] text-slate-400 font-normal">{vale.hora}</span>}
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-black text-[10px] flex items-center justify-center">
                          {vale.responsable ? vale.responsable.charAt(0) : 'R'}
                        </div>
                        <div>
                          <span className="uppercase text-slate-900 font-black text-xs block">{vale.responsable}</span>
                          <span className="text-[8px] font-bold text-emerald-600 uppercase">Responsable Bodega</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      {vale.numeroContenedor ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-mono text-[11px] font-black uppercase">
                          <Truck size={12} />
                          {vale.numeroContenedor}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-normal text-xs italic">Sin contenedor</span>
                      )}
                    </td>

                    <td className="px-6 py-5 uppercase text-slate-700">
                      {vale.proveedor || <span className="text-slate-400 italic">Varios</span>}
                    </td>

                    <td className="px-6 py-5 text-center">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-xl text-slate-700 font-black text-xs">
                        {vale.totalArticulos || vale.items?.length || 0}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-black text-sm">
                        +{vale.totalUnidades}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelectedValeToPrint(vale); playSound('click'); }}
                          className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all"
                          title="Ver e Imprimir Comprobante"
                        >
                          <Printer size={13} /> Comprobante
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => setDeletingValeId(vale.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Anular Vale de Entrada"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Impresión */}
      {selectedValeToPrint && (
        <ValeEntradaPrintModal
          vale={selectedValeToPrint}
          onClose={() => setSelectedValeToPrint(null)}
        />
      )}

      {/* Confirmación de Anulación */}
      {deletingValeId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[36px] p-8 max-w-md w-full text-center space-y-5 shadow-2xl animate-in zoom-in">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase text-slate-900">¿Anular Vale de Entrada?</h3>
              <p className="text-slate-500 text-xs mt-2 font-medium">
                Esta acción eliminará el registro de recepción. Puedes elegir si deseas descontar/revertir automáticamente el stock que fue ingresado en este vale.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl text-left">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={revertStockOnDelete}
                  onChange={(e) => setRevertStockOnDelete(e.target.checked)}
                  className="w-5 h-5 rounded-lg text-emerald-600 accent-emerald-600"
                />
                <span className="text-xs font-black text-slate-800 uppercase">
                  Revertir y restar las unidades ingresadas del stock
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeletingValeId(null)}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteVale}
                className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-rose-600/20"
              >
                Confirmar Anulación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
