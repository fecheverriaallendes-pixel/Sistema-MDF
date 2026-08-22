import React from 'react';
import { Printer, X, Download, User, Building, Calendar, DollarSign, CheckCircle2, ShieldCheck } from 'lucide-react';
import { StaffMember, WeeklyPayrollRecord } from '../../types';

interface LiquidacionIndividualModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffMember?: StaffMember;
  record: {
    workerName: string;
    cargo: string;
    semanaInicio: string;
    semanaFin: string;
    fechaPago: string;
    sueldoBase: number;
    comisionesTotal: number;
    comisionesDetalle?: { tipo: string; cantidad: number; subtotal: number }[];
    commissionEntries?: {
      saleId: string;
      saleNumber?: string | number;
      date?: string;
      clientName?: string;
      codigo?: string;
      tipo: string;
      subtotal: number;
    }[];
    extrasTotal: number;
    extrasDetalle?: { tipo: string; descripcion: string; cantidad: number; valorUnitario: number; subtotal: number }[];
    otrosBonosTotal: number;
    totalHaberes: number;
    adelantosTotal: number;
    adelantosDetalle?: { fecha: string; monto: number; motivo?: string }[];
    cuotaPrestamoTotal: number;
    prestamosDetalle?: { loanId: string; montoCuota: number; saldoRestante: number }[];
    otrosDescuentosTotal: number;
    otrosDescuentosDetalle?: { motivo: string; monto: number }[];
    totalDescuentos: number;
    liquidoPagar: number;
    estado: string;
    metodoPago?: string;
    comprobante?: string;
    datosBancarios?: {
      banco?: string;
      tipoCuenta?: string;
      numeroCuenta?: string;
      rut?: string;
    };
  };
}

export default function LiquidacionIndividualModal({
  isOpen,
  onClose,
  staffMember,
  record
}: LiquidacionIndividualModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const rut = staffMember?.rut || record.datosBancarios?.rut || 'Sin RUT registrado';
  const banco = staffMember?.banco || record.datosBancarios?.banco || 'No especificado';
  const tipoCuenta = staffMember?.tipoCuenta || record.datosBancarios?.tipoCuenta || 'Cuenta RUT';
  const numeroCuenta = staffMember?.numeroCuenta || record.datosBancarios?.numeroCuenta || 'No especificado';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header (No Print) */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between no-print border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
              MDF
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">Comprobante de Liquidación Semanal</h3>
              <p className="text-xs text-slate-400 font-medium">Trabajador: <span className="text-white font-bold">{record.workerName}</span> ({record.cargo})</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <Printer size={16} /> Imprimir Comprobante
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body / Printable Document */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50 printable-area">
          <div className="bg-white p-8 md:p-12 rounded-[24px] border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
            
            {/* Header Documento */}
            <div className="border-b-2 border-slate-900 pb-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-1 bg-slate-900 text-white text-[11px] font-black tracking-widest rounded-md uppercase">MDF CHILE</span>
                  <span className="text-xs font-bold text-slate-500 tracking-wider">IMPORTADORA & DISTRIBUIDORA</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">Liquidación de Sueldo Semanal</h1>
                <p className="text-xs text-slate-500 font-medium mt-1">Pago correspondiente al día Sábado {record.fechaPago}</p>
              </div>

              <div className="text-right sm:border-l-2 sm:border-slate-100 sm:pl-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Semana de Trabajo</p>
                <p className="text-sm font-black text-slate-900">{record.semanaInicio} al {record.semanaFin}</p>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-1 flex items-center justify-end gap-1">
                  <CheckCircle2 size={12} /> Pago Semanal: Sábado
                </p>
              </div>
            </div>

            {/* Ficha Empleado y Datos Bancarios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Datos del Trabajador</p>
                <p className="text-lg font-black text-slate-900 uppercase">{record.workerName}</p>
                <div className="text-xs text-slate-600 space-y-0.5">
                  <p><span className="font-bold text-slate-500">RUT:</span> {rut}</p>
                  <p><span className="font-bold text-slate-500">Cargo / Función:</span> {record.cargo}</p>
                  {staffMember?.telefono && <p><span className="font-bold text-slate-500">Teléfono:</span> {staffMember.telefono}</p>}
                </div>
              </div>

              <div className="space-y-1.5 md:border-l md:border-slate-200 md:pl-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Modalidad de Pago & Cuenta</p>
                <div className="text-xs text-slate-700 space-y-1">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Building size={14} className="text-slate-400" />
                    {banco}
                  </p>
                  <p><span className="font-bold text-slate-500">Tipo de Cuenta:</span> {tipoCuenta}</p>
                  <p><span className="font-bold text-slate-500">N° de Cuenta:</span> <span className="font-mono font-bold text-slate-900">{numeroCuenta}</span></p>
                  <p><span className="font-bold text-slate-500">Estado Pago:</span> <span className="font-black text-emerald-700 uppercase">{record.estado}</span> {record.comprobante && `(Comp: ${record.comprobante})`}</p>
                </div>
              </div>
            </div>

            {/* Tablas Haberes y Descuentos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              
              {/* HABERES */}
              <div className="border border-emerald-200 rounded-2xl p-5 bg-emerald-50/30">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-3 mb-4">
                  <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    1. Haberes e Ingresos Semanales
                  </h4>
                  <span className="text-[10px] font-black text-emerald-700 uppercase">Monto</span>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Sueldo Base */}
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="font-medium text-slate-700">Sueldo Base Semanal</span>
                    <span className="font-black text-slate-900">${record.sueldoBase.toLocaleString('es-CL')}</span>
                  </div>

                  {/* Comisiones */}
                  {record.comisionesTotal > 0 && (
                    <div className="py-2 border-b border-slate-100">
                      <div className="flex justify-between items-center font-medium text-slate-700 mb-1">
                        <span className="font-bold text-slate-800">Comisiones por Ventas</span>
                        <span className="font-black text-slate-900">${record.comisionesTotal.toLocaleString('es-CL')}</span>
                      </div>
                      {record.comisionesDetalle && record.comisionesDetalle.map((c, i) => (
                        <div key={i} className="flex justify-between items-center text-[10px] text-slate-600 pl-3">
                          <span>• {c.tipo} (x{c.cantidad})</span>
                          <span className="font-semibold text-slate-900">${c.subtotal.toLocaleString('es-CL')}</span>
                        </div>
                      ))}

                      {/* Detalle Ticket / Fardo */}
                      {record.commissionEntries && record.commissionEntries.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 pl-2">
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">
                            Detalle Ítems / Ventas Registradas ({record.commissionEntries.length}):
                          </p>
                          <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-[10px] print:max-h-none">
                            {record.commissionEntries.map((entry, idx) => (
                              <div key={idx} className="flex justify-between items-center text-slate-600 bg-slate-50 px-2 py-0.5 rounded">
                                <span className="truncate max-w-[200px]">
                                  <strong className="font-mono text-slate-800">{entry.codigo || 'S/C'}</strong> {entry.saleNumber ? `#${entry.saleNumber}` : ''} ({entry.tipo})
                                </span>
                                <span className="font-mono font-bold text-slate-900">
                                  +${entry.subtotal.toLocaleString('es-CL')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Extras / Cargas / Descargas */}
                  {record.extrasTotal > 0 && (
                    <div className="py-1.5 border-b border-slate-100">
                      <div className="flex justify-between items-center font-medium text-slate-700 mb-1">
                        <span>Descargas, Cargas y Trabajos Extras</span>
                        <span className="font-black text-slate-900">${record.extrasTotal.toLocaleString('es-CL')}</span>
                      </div>
                      {record.extrasDetalle && record.extrasDetalle.map((e, i) => (
                        <div key={i} className="flex justify-between items-center text-[10px] text-slate-500 pl-3">
                          <span>• {e.descripcion || e.tipo} (x{e.cantidad} @ ${e.valorUnitario?.toLocaleString('es-CL')})</span>
                          <span>${e.subtotal.toLocaleString('es-CL')}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Otros Bonos */}
                  {record.otrosBonosTotal > 0 && (
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                      <span className="font-medium text-slate-700">Bonos Adicionales / Metas</span>
                      <span className="font-black text-slate-900">${record.otrosBonosTotal.toLocaleString('es-CL')}</span>
                    </div>
                  )}

                  {/* Total Haberes */}
                  <div className="pt-3 flex justify-between items-center font-black text-sm text-emerald-950 border-t border-emerald-200">
                    <span className="uppercase">Total Haberes Brutos</span>
                    <span className="text-base text-emerald-700">${record.totalHaberes.toLocaleString('es-CL')}</span>
                  </div>
                </div>
              </div>

              {/* DESCUENTOS */}
              <div className="border border-red-200 rounded-2xl p-5 bg-red-50/30">
                <div className="flex items-center justify-between border-b border-red-200 pb-3 mb-4">
                  <h4 className="text-xs font-black text-red-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    2. Descuentos y Retenciones
                  </h4>
                  <span className="text-[10px] font-black text-red-700 uppercase">Monto</span>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Adelantos de la semana */}
                  {record.adelantosTotal > 0 ? (
                    <div className="py-1.5 border-b border-slate-100">
                      <div className="flex justify-between items-center font-medium text-slate-700 mb-1">
                        <span>Adelantos Solicitados en la Semana</span>
                        <span className="font-black text-red-600">-${record.adelantosTotal.toLocaleString('es-CL')}</span>
                      </div>
                      {record.adelantosDetalle && record.adelantosDetalle.map((a, i) => (
                        <div key={i} className="flex justify-between items-center text-[10px] text-slate-500 pl-3">
                          <span>• {a.fecha}: {a.motivo || 'Anticipo'}</span>
                          <span className="text-red-500">-${a.monto.toLocaleString('es-CL')}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100 text-slate-400">
                      <span>Adelantos de la Semana</span>
                      <span>$0</span>
                    </div>
                  )}

                  {/* Cuotas de Préstamo */}
                  {record.cuotaPrestamoTotal > 0 ? (
                    <div className="py-1.5 border-b border-slate-100">
                      <div className="flex justify-between items-center font-medium text-slate-700 mb-1">
                        <span>Amortización Préstamo de Personal</span>
                        <span className="font-black text-red-600">-${record.cuotaPrestamoTotal.toLocaleString('es-CL')}</span>
                      </div>
                      {record.prestamosDetalle && record.prestamosDetalle.map((p, i) => (
                        <div key={i} className="flex justify-between items-center text-[10px] text-slate-500 pl-3">
                          <span>• Cuota de Préstamo (Saldo restante: ${p.saldoRestante.toLocaleString('es-CL')})</span>
                          <span className="text-red-500">-${p.montoCuota.toLocaleString('es-CL')}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100 text-slate-400">
                      <span>Cuota de Préstamos</span>
                      <span>$0</span>
                    </div>
                  )}

                  {/* Otros Descuentos */}
                  {record.otrosDescuentosTotal > 0 && (
                    <div className="py-1.5 border-b border-slate-100">
                      <div className="flex justify-between items-center font-medium text-slate-700 mb-1">
                        <span>Otros Ajustes / Descuentos</span>
                        <span className="font-black text-red-600">-${record.otrosDescuentosTotal.toLocaleString('es-CL')}</span>
                      </div>
                      {record.otrosDescuentosDetalle && record.otrosDescuentosDetalle.map((o, i) => (
                        <div key={i} className="flex justify-between items-center text-[10px] text-slate-500 pl-3">
                          <span>• {o.motivo}</span>
                          <span className="text-red-500">-${o.monto.toLocaleString('es-CL')}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Total Descuentos */}
                  <div className="pt-3 flex justify-between items-center font-black text-sm text-red-950 border-t border-red-200">
                    <span className="uppercase">Total Descuentos</span>
                    <span className="text-base text-red-600">-${record.totalDescuentos.toLocaleString('es-CL')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* TOTAL LÍQUIDO A PAGAR */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 mb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Alcance Líquido a Pagar este Sábado</p>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight">${record.liquidoPagar.toLocaleString('es-CL')} <span className="text-sm font-normal text-slate-400">CLP</span></h2>
                <p className="text-[11px] text-slate-400 font-medium">Son: {record.liquidoPagar.toLocaleString('es-CL')} pesos chilenos</p>
              </div>

              <div className="text-right bg-slate-800/80 px-5 py-3 rounded-xl border border-slate-700">
                <p className="text-[9px] font-black text-slate-400 uppercase">Medio de Pago</p>
                <p className="text-sm font-black text-white">{record.metodoPago || 'Transferencia Bancaria'}</p>
                <p className="text-[10px] text-emerald-400 font-bold uppercase mt-0.5">Sábado {record.fechaPago}</p>
              </div>
            </div>

            {/* Declaración de conformidad y Firmas */}
            <div className="border-t-2 border-slate-200 pt-8 mt-12">
              <p className="text-[10px] text-slate-500 italic text-justify leading-relaxed mb-12">
                "Certifico que he recibido a mi entera y total satisfacción de parte de MDF la suma líquida indicada precedentemente, correspondiente a mi remuneración semanal y trabajos extraordinarios pactados, no teniendo cargo ni reclamo alguno que formular al respecto."
              </p>

              <div className="grid grid-cols-2 gap-12 text-center">
                <div>
                  <div className="w-48 mx-auto border-t-2 border-slate-900 pt-2">
                    <p className="text-xs font-black text-slate-900 uppercase">{record.workerName}</p>
                    <p className="text-[10px] text-slate-500 font-bold">RUT: {rut}</p>
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-1">Firma Trabajador</p>
                  </div>
                </div>

                <div>
                  <div className="w-48 mx-auto border-t-2 border-slate-900 pt-2">
                    <p className="text-xs font-black text-slate-900 uppercase">CUADERNO MDF</p>
                    <p className="text-[10px] text-slate-500 font-bold">Administración / Pagos</p>
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-1">Firma / Timbre Empleador</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .printable-area { padding: 0 !important; background: white !important; }
        }
      `}</style>
    </div>
  );
}
