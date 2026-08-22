import React from 'react';
import { Printer, X, FileSpreadsheet, Building2, Calendar } from 'lucide-react';

interface NominaConsolidadaItem {
  workerName: string;
  cargo: string;
  rut?: string;
  banco?: string;
  numeroCuenta?: string;
  diasTrabajados?: number;
  diasFaltas?: number;
  sueldoBasePactado?: number;
  sueldoBase: number;
  comisionesTotal: number;
  tiktokLivesTotal?: number;
  tiktokLivesCount?: number;
  extrasTotal: number;
  otrosBonosTotal: number;
  totalHaberes: number;
  adelantosTotal: number;
  cuotaPrestamoTotal: number;
  otrosDescuentosTotal: number;
  totalDescuentos: number;
  liquidoPagar: number;
  estado: string;
  metodoPago?: string;
}

interface NominaConsolidadaModalProps {
  isOpen: boolean;
  onClose: () => void;
  semanaInicio: string;
  semanaFin: string;
  fechaPago: string;
  items: NominaConsolidadaItem[];
}

export default function NominaConsolidadaModal({
  isOpen,
  onClose,
  semanaInicio,
  semanaFin,
  fechaPago,
  items
}: NominaConsolidadaModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalBase = items.reduce((acc, i) => acc + (i.sueldoBase || 0), 0);
  const totalComisiones = items.reduce((acc, i) => acc + (i.comisionesTotal || 0), 0);
  const totalTikTokLives = items.reduce((acc, i) => acc + (i.tiktokLivesTotal || 0), 0);
  const totalExtras = items.reduce((acc, i) => acc + (i.extrasTotal || 0), 0);
  const totalHaberes = items.reduce((acc, i) => acc + (i.totalHaberes || 0), 0);
  const totalAdelantos = items.reduce((acc, i) => acc + (i.adelantosTotal || 0), 0);
  const totalPrestamos = items.reduce((acc, i) => acc + (i.cuotaPrestamoTotal || 0), 0);
  const totalDescuentos = items.reduce((acc, i) => acc + (i.totalDescuentos || 0), 0);
  const totalLiquido = items.reduce((acc, i) => acc + (i.liquidoPagar || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header (No Print) */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between no-print border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">Planilla Consolidada de Sueldos Semanales</h3>
              <p className="text-xs text-slate-400 font-medium">Periodo: {semanaInicio} al {semanaFin} · Pago Sábado: {fechaPago}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <Printer size={16} /> Imprimir Planilla General
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50 printable-area">
          <div className="bg-white p-8 md:p-10 rounded-[24px] border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
            
            <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-black text-slate-900 uppercase">CUADERNO MDF - NÓMINA GENERAL SEMANAL</h1>
                <p className="text-xs font-bold text-slate-500 uppercase mt-0.5">Periodo: {semanaInicio} al {semanaFin} | Pago: Sábado {fechaPago}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase">Total Desembolso Semanal</p>
                <p className="text-2xl font-black text-slate-900">${totalLiquido.toLocaleString('es-CL')}</p>
              </div>
            </div>

            {/* Tabla Consolidada */}
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-900 bg-slate-100 font-black text-slate-900 uppercase">
                    <th className="py-2.5 px-3 text-left">N°</th>
                    <th className="py-2.5 px-3 text-left">Trabajador</th>
                    <th className="py-2.5 px-3 text-left">Cargo</th>
                    <th className="py-2.5 px-2 text-center">Días Trab.</th>
                    <th className="py-2.5 px-3 text-right">Sueldo Base</th>
                    <th className="py-2.5 px-3 text-right">Comisiones</th>
                    <th className="py-2.5 px-3 text-right text-rose-700 bg-rose-50/60">Lives TikTok</th>
                    <th className="py-2.5 px-3 text-right">Descargas/Extras</th>
                    <th className="py-2.5 px-3 text-right bg-emerald-50 text-emerald-900">Total Haberes</th>
                    <th className="py-2.5 px-3 text-right text-red-600">Adelantos</th>
                    <th className="py-2.5 px-3 text-right text-red-600">Préstamo</th>
                    <th className="py-2.5 px-3 text-right bg-red-50 text-red-900">Total Dscto</th>
                    <th className="py-2.5 px-3 text-right bg-slate-900 text-white">Líquido a Pagar</th>
                    <th className="py-2.5 px-3 text-center print:table-cell">Firma Conforme</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-black text-slate-900 uppercase">
                        {item.workerName}
                        {item.rut && <span className="block text-[9px] font-normal text-slate-500 font-mono">RUT: {item.rut}</span>}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{item.cargo}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-black ${
                          (item.diasTrabajados ?? 6) === 6
                            ? 'bg-emerald-100 text-emerald-800'
                            : (item.diasTrabajados ?? 6) >= 5
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {item.diasTrabajados ?? 6} / 6 d
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                        ${item.sueldoBase.toLocaleString('es-CL')}
                        {item.sueldoBasePactado && item.sueldoBasePactado !== item.sueldoBase && (
                          <span className="block text-[9px] text-rose-500 line-through">${item.sueldoBasePactado.toLocaleString('es-CL')}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-700">${item.comisionesTotal.toLocaleString('es-CL')}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-700 bg-rose-50/30">
                        {item.tiktokLivesTotal && item.tiktokLivesTotal > 0 ? (
                          <span>+${item.tiktokLivesTotal.toLocaleString('es-CL')} {item.tiktokLivesCount ? <span className="text-[9px] font-normal text-slate-500">({item.tiktokLivesCount}n)</span> : ''}</span>
                        ) : (
                          <span className="text-slate-300 font-normal">$0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-700">${item.extrasTotal.toLocaleString('es-CL')}</td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-700 bg-emerald-50/50">${item.totalHaberes.toLocaleString('es-CL')}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-red-600">{item.adelantosTotal > 0 ? `-$${item.adelantosTotal.toLocaleString('es-CL')}` : '$0'}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-red-600">{item.cuotaPrestamoTotal > 0 ? `-$${item.cuotaPrestamoTotal.toLocaleString('es-CL')}` : '$0'}</td>
                      <td className="py-2.5 px-3 text-right font-black text-red-700 bg-red-50/50">-${item.totalDescuentos.toLocaleString('es-CL')}</td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900 bg-slate-100 text-xs">${item.liquidoPagar.toLocaleString('es-CL')}</td>
                      <td className="py-2.5 px-3 text-center border-l border-slate-200">
                        <div className="w-28 h-6 border-b border-dashed border-slate-400 mx-auto"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-900 bg-slate-900 text-white font-black text-xs uppercase">
                    <td colSpan={4} className="py-3 px-3">TOTALES CONSOLIDADOS ({items.length} Trabajadores)</td>
                    <td className="py-3 px-3 text-right">${totalBase.toLocaleString('es-CL')}</td>
                    <td className="py-3 px-3 text-right">${totalComisiones.toLocaleString('es-CL')}</td>
                    <td className="py-3 px-3 text-right text-rose-300">${totalTikTokLives.toLocaleString('es-CL')}</td>
                    <td className="py-3 px-3 text-right">${totalExtras.toLocaleString('es-CL')}</td>
                    <td className="py-3 px-3 text-right text-emerald-400">${totalHaberes.toLocaleString('es-CL')}</td>
                    <td className="py-3 px-3 text-right text-red-300">-${totalAdelantos.toLocaleString('es-CL')}</td>
                    <td className="py-3 px-3 text-right text-red-300">-${totalPrestamos.toLocaleString('es-CL')}</td>
                    <td className="py-3 px-3 text-right text-red-300">-${totalDescuentos.toLocaleString('es-CL')}</td>
                    <td className="py-3 px-3 text-right text-emerald-300 text-sm">${totalLiquido.toLocaleString('es-CL')}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-300 grid grid-cols-3 gap-8 text-center text-[10px]">
              <div>
                <div className="w-44 mx-auto border-t border-slate-900 pt-2 font-black uppercase">
                  Revisado y Aprobado
                </div>
                <p className="text-slate-400 mt-0.5">Jefatura de Operaciones</p>
              </div>

              <div>
                <div className="w-44 mx-auto border-t border-slate-900 pt-2 font-black uppercase">
                  Caja Pagadora
                </div>
                <p className="text-slate-400 mt-0.5">Tesorería / Pagos</p>
              </div>

              <div>
                <div className="w-44 mx-auto border-t border-slate-900 pt-2 font-black uppercase">
                  Gerencia General
                </div>
                <p className="text-slate-400 mt-0.5">MDF Importadora</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
