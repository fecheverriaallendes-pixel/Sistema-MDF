import React from 'react';
import { X, Printer, CheckCircle, Package, Truck, User, Calendar, FileText, Hash, ShieldCheck } from 'lucide-react';
import { ValeEntrada } from '../../types';

interface ValeEntradaPrintModalProps {
  vale: ValeEntrada;
  onClose: () => void;
}

export const ValeEntradaPrintModal: React.FC<ValeEntradaPrintModalProps> = ({ vale, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const formattedDate = (() => {
    try {
      if (!vale.fecha) return new Date().toLocaleDateString('es-CL');
      if (vale.fecha.includes('-')) {
        const [y, m, d] = vale.fecha.split('-');
        return `${d}/${m}/${y}`;
      }
      return vale.fecha;
    } catch {
      return vale.fecha;
    }
  })();

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:static overflow-y-auto">
      <div className="bg-white rounded-[40px] shadow-2xl max-w-4xl w-full overflow-hidden my-8 print:my-0 print:shadow-none print:rounded-none print:w-full print:max-w-none">
        {/* Header no imprimible */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl">
              <FileText size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Documento Oficial de Bodega</span>
              <h3 className="text-xl font-black uppercase tracking-tight">Comprobante de Vale de Entrada #{vale.folio}</h3>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
            >
              <Printer size={16} /> Imprimir Comprobante
            </button>
            <button
              onClick={onClose}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Formato Imprimible */}
        <div className="p-8 sm:p-12 space-y-8 print:p-6 print:space-y-6 text-slate-900 font-sans">
          {/* Cabecera del Documento */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b-2 border-slate-900 gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black tracking-tighter text-slate-900 uppercase">CUADERNO <span className="text-emerald-600 italic">MDF</span></span>
                <span className="px-2.5 py-0.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-full">RECEPCIÓN</span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Control Central de Inventario y Bodega</p>
            </div>
            <div className="text-right sm:text-right w-full sm:w-auto bg-slate-50 sm:bg-transparent p-4 sm:p-0 rounded-2xl border sm:border-0 border-slate-200">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">FOLIO DE INGRESO</span>
              <span className="font-mono text-3xl font-black text-slate-900 tracking-wider block">{vale.folio}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase mt-0.5 block">Fecha: {formattedDate} {vale.hora ? `• ${vale.hora}` : ''}</span>
            </div>
          </div>

          {/* Información Principal en Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                <User size={12} className="text-emerald-600" /> RESPONSABLE DEL INGRESO
              </span>
              <p className="font-black text-slate-900 text-sm uppercase tracking-tight">{vale.responsable || 'NO REGISTRADO'}</p>
              <span className="text-[8px] font-black text-emerald-700 uppercase bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-1">
                Dato Obligatorio
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                <Truck size={12} className="text-blue-600" /> N° CONTENEDOR / CAMIÓN
              </span>
              <p className="font-mono font-black text-slate-900 text-sm uppercase tracking-tight">
                {vale.numeroContenedor ? vale.numeroContenedor : <span className="text-slate-400 italic">Sin Contenedor Asignado</span>}
              </p>
              <span className="text-[8px] font-bold text-slate-500 uppercase mt-1 block">
                {vale.numeroContenedor ? 'Cargamento Identificado' : 'Ingreso Local / Directo'}
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                <Package size={12} className="text-purple-600" /> PROVEEDOR / ORIGEN
              </span>
              <p className="font-black text-slate-900 text-sm uppercase tracking-tight">
                {vale.proveedor || 'MULTIPLE / GENERAL'}
              </p>
              <span className="text-[8px] font-bold text-slate-500 uppercase mt-1 block">Origen de Mercadería</span>
            </div>

            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md">
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                <CheckCircle size={12} /> TOTAL INGRESADO
              </span>
              <p className="font-black text-2xl tracking-tight text-white">{vale.totalUnidades} <span className="text-xs font-normal text-slate-300">bultos/fardos</span></p>
              <span className="text-[8px] font-bold text-emerald-300 uppercase mt-1 block">{vale.totalArticulos} artículos distintos</span>
            </div>
          </div>

          {vale.descripcion && (
            <div className="bg-emerald-50/60 border border-emerald-200/60 p-4 rounded-2xl">
              <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest block mb-1">Descripción del Cargamento:</span>
              <p className="text-xs font-bold text-slate-800 uppercase leading-relaxed">{vale.descripcion}</p>
            </div>
          )}

          {/* Tabla de Artículos Ingresados */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                <Package size={14} className="text-emerald-600" /> Detalle de Artículos y Fardos Ingresados ({vale.items?.length || 0})
              </h4>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-[9px] font-black text-slate-600 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Descripción del Artículo</th>
                    <th className="py-3 px-4">Categoría / Unidad</th>
                    <th className="py-3 px-4">Proveedor</th>
                    <th className="py-3 px-4 text-center">Cantidad</th>
                    <th className="py-3 px-4 text-right">P. Costo</th>
                    <th className="py-3 px-4 text-right">P. Venta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold">
                  {(vale.items || []).map((item, index) => (
                    <tr key={item.id || index} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-slate-400 text-[10px]">{index + 1}</td>
                      <td className="py-3 px-4 font-mono font-black text-slate-900 uppercase text-[11px]">{item.codigo}</td>
                      <td className="py-3 px-4 uppercase text-slate-900 font-extrabold">{item.tipo}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[9px] font-black uppercase text-slate-700">
                          {item.categoria || 'FARDO'} • {item.unidad || 'FARDO'}
                        </span>
                      </td>
                      <td className="py-3 px-4 uppercase text-slate-600 text-[10px]">{item.proveedor || vale.proveedor || 'GENERAL'}</td>
                      <td className="py-3 px-4 text-center font-black text-slate-900 text-sm">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-xl">
                          +{item.cantidad}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {item.precioCosto ? `$${Number(item.precioCosto).toLocaleString('es-CL')}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-900 font-black">
                        {item.precioSugerido ? `$${Number(item.precioSugerido).toLocaleString('es-CL')}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-300 font-black text-xs">
                    <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider text-slate-600">Total Unidades Ingresadas:</td>
                    <td className="py-3 px-4 text-center text-sm font-black text-emerald-700">+{vale.totalUnidades}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {vale.totalCostoEstimado ? `$${vale.totalCostoEstimado.toLocaleString('es-CL')}` : ''}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-900 text-sm">
                      {vale.totalVentaEstimada ? `$${vale.totalVentaEstimada.toLocaleString('es-CL')}` : ''}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {vale.observaciones && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Observaciones / Notas Adicionales:</span>
              <p className="text-slate-700 italic">{vale.observaciones}</p>
            </div>
          )}

          {/* Firmas de Recepción y Control */}
          <div className="grid grid-cols-2 gap-12 pt-16 mt-8 border-t border-dashed border-slate-300">
            <div className="text-center space-y-2">
              <div className="border-b-2 border-slate-900 pb-2 w-3/4 mx-auto"></div>
              <p className="text-xs font-black uppercase text-slate-900 tracking-tight">{vale.responsable}</p>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Responsable de Ingreso de Mercadería</p>
            </div>

            <div className="text-center space-y-2">
              <div className="border-b-2 border-slate-900 pb-2 w-3/4 mx-auto"></div>
              <p className="text-xs font-black uppercase text-slate-900 tracking-tight">Bodega Central & Inventario</p>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Recepción y Verificación Física</p>
            </div>
          </div>

          {/* Pie de Página */}
          <div className="flex justify-between items-center text-[8px] font-bold text-slate-400 uppercase tracking-widest pt-4 border-t border-slate-100">
            <span>Sistema Central de Cuaderno MDF • Registro ID: {vale.id}</span>
            <span>Generado el {new Date().toLocaleDateString('es-CL')} a las {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
