import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Calendar, 
  Ship, 
  ArrowDownRight, 
  ArrowUpRight,
  Filter,
  Layers
} from 'lucide-react';
import { useStore } from '../../store/GlobalContext';
import { UsaPurchase } from '../../types';

interface StatementEntry {
  id: string;
  fecha: string;
  tipo: 'CARGO_FACTURA' | 'PAGO_ABONO';
  descripcion: string;
  referencia: string;
  notasClp: string;
  tipoCambio?: number;
  cargoUsd: number;
  abonoUsd: number;
  saldoUsd: number;
}

export default function UsaSupplierStatement() {
  const { usaPurchases, playSound } = useStore();

  const [selectedSupplier, setSelectedSupplier] = useState<string>('TODOS');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [exchangeRateRef, setExchangeRateRef] = useState<number>(950);

  // Extract unique USA suppliers
  const suppliers = useMemo(() => {
    const set = new Set<string>();
    usaPurchases.forEach(p => {
      if (p.proveedor) set.add(p.proveedor.trim().toUpperCase());
    });
    return Array.from(set).sort();
  }, [usaPurchases]);

  // Filter purchases by supplier
  const filteredPurchases = useMemo(() => {
    return usaPurchases.filter(p => {
      if (selectedSupplier !== 'TODOS' && p.proveedor.trim().toUpperCase() !== selectedSupplier) {
        return false;
      }
      return true;
    });
  }, [usaPurchases, selectedSupplier]);

  // Build sorted chronological statement ledger
  const statementLedger = useMemo(() => {
    const rawEvents: Array<{
      id: string;
      fecha: string;
      tipo: 'CARGO_FACTURA' | 'PAGO_ABONO';
      descripcion: string;
      referencia: string;
      notasClp: string;
      tipoCambio?: number;
      cargoUsd: number;
      abonoUsd: number;
    }> = [];

    filteredPurchases.forEach(p => {
      // Container Invoice Charge
      rawEvents.push({
        id: `charge-${p.id}`,
        fecha: p.fecha || '2025-01-01',
        tipo: 'CARGO_FACTURA',
        descripcion: p.descripcion || `Contenedor ${p.numeroContenedor || ''}`,
        referencia: p.numeroContenedor ? `CONT: ${p.numeroContenedor}${p.facturaInvoice ? ` / INV: ${p.facturaInvoice}` : ''}` : (p.facturaInvoice || 'INVOICE'),
        notasClp: p.notasClp || (p.tipoCambioRef ? `TC Ref: $${p.tipoCambioRef}` : ''),
        tipoCambio: p.tipoCambioRef,
        cargoUsd: Number(p.montoTotalUsd) || 0,
        abonoUsd: 0
      });

      // Payments / Wire Transfers
      (p.abonos || []).forEach(a => {
        rawEvents.push({
          id: `payment-${a.id}`,
          fecha: a.fecha || p.fecha,
          tipo: 'PAGO_ABONO',
          descripcion: `Pago ${a.metodo}${a.observacion ? ` - ${a.observacion}` : ''}`,
          referencia: a.referencia ? `SWIFT/Ref: ${a.referencia}` : `Pago ${p.numeroContenedor || ''}`,
          notasClp: a.notaClp || (a.montoClp ? `$${a.montoClp.toLocaleString('es-CL')} CLP` : ''),
          tipoCambio: a.tipoCambio,
          cargoUsd: 0,
          abonoUsd: Number(a.montoUsd) || 0
        });
      });
    });

    // Sort chronologically ascending
    rawEvents.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    // Filter by date range if provided
    const dateFiltered = rawEvents.filter(ev => {
      if (startDate && ev.fecha < startDate) return false;
      if (endDate && ev.fecha > endDate) return false;
      return true;
    });

    // Calculate running balance
    let runningBalance = 0;
    const ledgerWithBalance: StatementEntry[] = dateFiltered.map(ev => {
      runningBalance += (ev.cargoUsd - ev.abonoUsd);
      return {
        ...ev,
        saldoUsd: Number(runningBalance.toFixed(2))
      };
    });

    return ledgerWithBalance;
  }, [filteredPurchases, startDate, endDate]);

  const totalCargosUsd = statementLedger.reduce((acc, ev) => acc + ev.cargoUsd, 0);
  const totalAbonosUsd = statementLedger.reduce((acc, ev) => acc + ev.abonoUsd, 0);
  const saldoFinalUsd = Math.max(0, totalCargosUsd - totalAbonosUsd);
  const saldoFinalClpRef = Math.round(saldoFinalUsd * exchangeRateRef);

  const handlePrint = () => {
    playSound('click');
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Control Bar: Filters & Print (hidden on print) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm no-print space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <FileText size={20} className="text-blue-600" />
              Statement / Estado de Cuenta Proveedores USA
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Extracto financiero oficial, balance deudor y registro de transferencias en USD y notas CLP
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="px-5 py-3 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase rounded-2xl tracking-wider transition-all flex items-center gap-2 shadow-lg active:scale-95 shrink-0"
          >
            <Printer size={16} /> Imprimir / PDF Statement
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Supplier selector */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
              Proveedor USA
            </label>
            <select
              className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xs text-slate-800 outline-none focus:border-blue-500"
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
            >
              <option value="TODOS">TODOS LOS PROVEEDORES USA</option>
              {suppliers.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Date from */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
              Fecha Desde
            </label>
            <input
              type="date"
              className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-xs text-slate-800 outline-none focus:border-blue-500"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* Date to */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
              Fecha Hasta
            </label>
            <input
              type="date"
              className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-xs text-slate-800 outline-none focus:border-blue-500"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Reference TC */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
              TC Ref. (CLP/USD)
            </label>
            <input
              type="number"
              className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xs text-emerald-700 outline-none focus:border-blue-500"
              value={exchangeRateRef}
              onChange={(e) => setExchangeRateRef(Number(e.target.value) || 1)}
            />
          </div>
        </div>
      </div>

      {/* Statement Document Card (Optimized for Screen & Print) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6 print:p-0 print:border-none print:shadow-none">
        {/* Official Statement Header */}
        <div className="border-b-2 border-slate-900 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500 text-white text-xs font-black px-2 py-0.5 rounded-lg">MDF</span>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                CUADERNO MDF <span className="text-emerald-600 italic">IMPORTS</span>
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 font-bold uppercase mt-1">
              Estado de Cuenta de Proveedores & Importaciones USA (USD $)
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              Chile • Operaciones de Comercio Exterior & Contenedores
            </p>
          </div>

          <div className="text-left md:text-right bg-slate-50 p-4 rounded-2xl border border-slate-200 min-w-[240px]">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Proveedor Seleccionado</p>
            <p className="text-base font-black text-slate-900 uppercase mt-0.5">
              {selectedSupplier === 'TODOS' ? 'Consolidado General USA' : selectedSupplier}
            </p>
            <p className="text-[10px] text-slate-500 font-bold mt-1">
              Fecha Emisión: {new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Statement Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Facturado (USD)</p>
            <p className="text-xl font-black text-slate-900">
              ${totalCargosUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
            <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-1">Total Transferido (USD)</p>
            <p className="text-xl font-black text-emerald-700">
              ${totalAbonosUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <p className="text-[9px] font-black text-amber-800 uppercase tracking-widest mb-1">Saldo Deudor (USD)</p>
            <p className="text-xl font-black text-amber-800">
              ${saldoFinalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Equiv. Estimado (CLP)</p>
            <p className="text-xl font-black text-emerald-400">
              ~${saldoFinalClpRef.toLocaleString('es-CL')}
            </p>
            <p className="text-[9px] text-slate-400 font-bold">TC: ${exchangeRateRef}</p>
          </div>
        </div>

        {/* Chronological Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white border-b border-slate-800">
                <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider">Tipo / Operación</th>
                <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider">Referencia / B/L</th>
                <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider">Notas en Pesos Chilenos (CLP)</th>
                <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-right">Cargo USD (+)</th>
                <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-right">Abono USD (-)</th>
                <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-right">Balance USD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {statementLedger.map((item) => {
                const isCharge = item.tipo === 'CARGO_FACTURA';
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">
                      {item.fecha}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {isCharge ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-blue-100 text-blue-800">
                            <Ship size={10} /> Factura Contenedor
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                            <CheckCircle2 size={10} /> Wire Transfer
                          </span>
                        )}
                        <span className="font-bold text-slate-700">{item.descripcion}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-600 text-[11px]">
                      {item.referencia}
                    </td>
                    <td className="px-4 py-3 text-slate-600 italic">
                      {item.notasClp || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-slate-900">
                      {item.cargoUsd > 0 ? `$${item.cargoUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-emerald-600">
                      {item.abonoUsd > 0 ? `-$${item.abonoUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-slate-900 text-sm">
                      ${item.saldoUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}

              {statementLedger.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 italic">
                    No se registran movimientos para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-300 font-black">
                <td colSpan={4} className="px-4 py-4 uppercase text-slate-800 text-right">
                  Totales Consolidados:
                </td>
                <td className="px-4 py-4 text-right text-slate-900 text-sm">
                  ${totalCargosUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-4 text-right text-emerald-600 text-sm">
                  ${totalAbonosUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-4 text-right text-amber-700 text-base">
                  ${saldoFinalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Statement Footer */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-400 font-bold uppercase gap-2">
          <span>Statement emitido por Sistema Cuaderno MDF</span>
          <span>Valores expresados en Dólares Americanos (USD $)</span>
        </div>
      </div>
    </div>
  );
}
