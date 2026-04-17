import React, { useState, useMemo } from 'react';
import { 
  Coins, 
  Calendar, 
  User, 
  ArrowRight, 
  Printer, 
  FileCheck, 
  TrendingUp,
  ChevronDown,
  Info,
  BadgeDollarSign,
  Download,
  AlertTriangle,
  PlusCircle,
  Trash2
} from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { formatCurrencyWithUSD, formatARS } from '../utils/currency';
import { CommissionType, Sale, CommissionAdjustment } from '../types';

const COMMISSION_VALUES: Record<string, number> = {
  [CommissionType.FARDO_NORMAL]: 3000,
  [CommissionType.FARDO_PROMO]: 1500,
  [CommissionType.LOTE_SACO]: 1000,
};

export default function Comisiones() {
  const { sales, staff, adjustments, addAdjustment, removeAdjustment, playSound, settings } = useStore();
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [newAdjustment, setNewAdjustment] = useState({
    vendedor: '',
    monto: '',
    motivo: ''
  });

  const handleAddAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdjustment.vendedor || !newAdjustment.monto || !newAdjustment.motivo) {
      alert("Por favor completa todos los campos");
      return;
    }

    addAdjustment({
      fecha: new Date().toLocaleDateString(),
      vendedor: newAdjustment.vendedor,
      monto: Number(newAdjustment.monto),
      motivo: newAdjustment.motivo
    });

    setNewAdjustment({ vendedor: '', monto: '', motivo: '' });
    setShowAdjustmentForm(false);
    playSound('success');
  };

  const weekRange = useMemo(() => {
    try {
      const now = new Date();
      const currentDay = now.getDay() === 0 ? 7 : now.getDay();
      
      const start = new Date(now);
      start.setDate(now.getDate() - currentDay + 1 + (selectedWeekOffset * 7));
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      
      return { start, end };
    } catch (e) {
      console.error("Error calculando rango de fechas:", e);
      return { start: new Date(), end: new Date() };
    }
  }, [selectedWeekOffset]);

  const weeklySales = useMemo(() => {
    if (!Array.isArray(sales)) return [];

    return sales.filter(s => {
      if (!s || !s.fecha || typeof s.fecha !== 'string') return false;
      
      try {
        const parts = s.fecha.split('/');
        if (parts.length !== 3) return false;
        
        const [d, m, y] = parts;
        const saleDate = new Date(Number(y), Number(m) - 1, Number(d));
        
        if (isNaN(saleDate.getTime())) return false;
        
        return saleDate >= weekRange.start && saleDate <= weekRange.end;
      } catch (e) {
        return false;
      }
    });
  }, [sales, weekRange]);

  const weeklyAdjustments = useMemo(() => {
    if (!Array.isArray(adjustments)) return [];
    
    return adjustments.filter(a => {
      try {
        const parts = a.fecha.split('/');
        if (parts.length !== 3) return false;
        const [d, m, y] = parts;
        const adjDate = new Date(Number(y), Number(m) - 1, Number(d));
        return adjDate >= weekRange.start && adjDate <= weekRange.end;
      } catch (e) {
        return false;
      }
    });
  }, [adjustments, weekRange]);

  const sellerCommissions = useMemo(() => {
    const report: Record<string, { 
      total: number, 
      count: number, 
      details: { type: CommissionType, qty: number, subtotal: number }[],
      sales: Sale[],
      adjustments: CommissionAdjustment[]
    }> = {};

    weeklySales.forEach(s => {
      const vendedorName = s.vendedor || 'Sin Vendedor';
      
      if (!report[vendedorName]) {
        report[vendedorName] = { total: 0, count: 0, details: [], sales: [], adjustments: [] };
      }
      
      const tipo = s.tipoComision || CommissionType.FARDO_NORMAL;
      const commValue = COMMISSION_VALUES[tipo] || 0;
      
      report[vendedorName].total += commValue;
      report[vendedorName].count += 1;
      report[vendedorName].sales.push(s);

      const existingType = report[vendedorName].details.find(d => d.type === tipo);
      if (existingType) {
        existingType.qty += 1;
        existingType.subtotal += commValue;
      } else {
        report[vendedorName].details.push({ type: tipo, qty: 1, subtotal: commValue });
      }
    });

    weeklyAdjustments.forEach(a => {
      if (!report[a.vendedor]) {
        report[a.vendedor] = { total: 0, count: 0, details: [], sales: [], adjustments: [] };
      }
      report[a.vendedor].total += a.monto;
      report[a.vendedor].adjustments.push(a);
    });

    return Object.entries(report).sort((a, b) => b[1].total - a[1].total);
  }, [weeklySales, weeklyAdjustments]);

  const totalCommissionsToPay = useMemo(() => 
    sellerCommissions.reduce((acc, [_, data]) => acc + (data.total || 0), 0)
  , [sellerCommissions]);

  const handlePrint = () => {
    window.print();
    playSound('success');
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-[1400px] mx-auto pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 no-print">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-4 shadow-lg shadow-amber-500/20">
            <Coins size={14} /> Gestión de Nómina Semanal
          </div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tight uppercase leading-none">Cálculo de <span className="text-amber-500 italic">Comisiones</span></h2>
          <p className="text-slate-500 font-medium italic mt-4 flex items-center gap-2">
            <Calendar size={18} className="text-slate-400" /> 
            Periodo: <span className="text-slate-900 font-black">{weekRange.start.toLocaleDateString()}</span> al <span className="text-slate-900 font-black">{weekRange.end.toLocaleDateString()}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-slate-900 p-1.5 rounded-[24px] shadow-inner">
            <button 
              onClick={() => { setSelectedWeekOffset(-1); playSound('click'); }}
              className={`px-6 py-3 rounded-[18px] font-black text-[10px] uppercase tracking-widest transition-all ${selectedWeekOffset === -1 ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Semana Pasada
            </button>
            <button 
              onClick={() => { setSelectedWeekOffset(0); playSound('click'); }}
              className={`px-6 py-3 rounded-[18px] font-black text-[10px] uppercase tracking-widest transition-all ${selectedWeekOffset === 0 ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Esta Semana
            </button>
          </div>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-2xl active:scale-95"
          >
            <Printer size={18} /> Imprimir Nómina
          </button>
        </div>
      </div>

      <div className="no-print">
        <button 
          onClick={() => setShowAdjustmentForm(!showAdjustmentForm)}
          className="flex items-center gap-2 px-6 py-3 bg-red-100 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-200 transition-all"
        >
          <PlusCircle size={16} /> {showAdjustmentForm ? 'Cancelar Ajuste' : 'Agregar Descuento / Bono'}
        </button>

        {showAdjustmentForm && (
          <div className="mt-6 p-8 bg-white rounded-[32px] border-2 border-red-100 shadow-xl animate-in slide-in-from-top duration-300">
            <h3 className="text-lg font-black text-red-600 uppercase mb-6">Registrar Ajuste Manual</h3>
            <form onSubmit={handleAddAdjustment} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">Vendedor</label>
                <select 
                  required
                  className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700 outline-none"
                  value={newAdjustment.vendedor}
                  onChange={e => setNewAdjustment({...newAdjustment, vendedor: e.target.value})}
                >
                  <option value="">Seleccionar...</option>
                  {staff.filter(s => s.rol === 'Vendedor').map(s => (
                    <option key={s.id} value={s.nombre}>{s.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">Monto (Negativo para descuento)</label>
                <input 
                  required
                  type="number" onWheel={(e) => e.currentTarget.blur()}
                  placeholder="-5000"
                  className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700 outline-none"
                  value={newAdjustment.monto}
                  onChange={e => setNewAdjustment({...newAdjustment, monto: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">Motivo</label>
                <input 
                  required
                  type="text"
                  placeholder="Error en despacho, Bono meta, etc."
                  className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700 outline-none"
                  value={newAdjustment.motivo}
                  onChange={e => setNewAdjustment({...newAdjustment, motivo: e.target.value})}
                />
              </div>
              <button type="submit" className="py-4 bg-red-500 text-white rounded-xl font-black uppercase tracking-widest hover:bg-red-600 shadow-lg">
                Guardar Ajuste
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[56px] p-12 text-white relative overflow-hidden shadow-2xl no-print">
        <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[150%] bg-amber-600/20 blur-[100px] rounded-full rotate-12"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="space-y-4">
            <p className="text-amber-500 text-xs font-black uppercase tracking-[0.4em]">Total a Desembolsar este Sábado</p>
            <h3 className="text-7xl font-black tracking-tighter leading-none text-amber-200">{formatARS(totalCommissionsToPay || 0)}</h3>
            {settings.dolarBlueRate > 0 && <p className="text-amber-100 font-bold text-xl">≈ {formatCurrencyWithUSD(totalCommissionsToPay || 0, settings.dolarBlueRate).split('≈')[1]?.replace(')', '').trim()}</p>}
            <p className="text-slate-400 font-bold italic">Basado en {weeklySales.length} fardos/unidades procesadas.</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] backdrop-blur-md">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Ventas Brutas Periodo</p>
                <p className="text-2xl font-black">${weeklySales.reduce((acc, s) => acc + (s.total || 0), 0).toLocaleString()}</p>
             </div>
             <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] backdrop-blur-md">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Staff a Liquidar</p>
                <p className="text-2xl font-black">{sellerCommissions.length}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 no-print">
        {sellerCommissions.map(([name, data]) => (
          <div key={name} className="bg-white rounded-[48px] border border-slate-100 shadow-xl overflow-hidden group hover:border-amber-200 transition-all">
            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-1/3 p-10 bg-slate-50/50 border-r border-slate-100">
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-20 h-20 bg-slate-900 text-white rounded-[28px] flex items-center justify-center shadow-xl">
                    <User size={40} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{name}</h4>
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1">
                       <FileCheck size={14} /> Reporte Validado
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {data.details.map((d, i) => (
                    <div key={i} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase">{d.type ? d.type.split(' (')[0] : 'Normal'}</span>
                      <span className="font-black text-slate-900">x{d.qty}</span>
                    </div>
                  ))}

                  {data.adjustments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                      <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">Ajustes / Descuentos</p>
                      {data.adjustments.map(adj => (
                        <div key={adj.id} className="flex items-center justify-between bg-red-50 p-3 rounded-xl border border-red-100 group/adj">
                          <div>
                            <p className="text-[10px] font-bold text-red-800 uppercase">{adj.motivo}</p>
                            <p className="text-[9px] text-red-400">{adj.fecha}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-red-600">{adj.monto > 0 ? '+' : ''}{adj.monto.toLocaleString()}</span>
                            <button onClick={() => removeAdjustment(adj.id)} className="text-red-300 hover:text-red-600 opacity-0 group-hover/adj:opacity-100 transition-opacity">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Sábado</p>
                    <p className="text-3xl font-black text-slate-900">${(data.total || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-10">
                 <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                   <Info size={14} /> Detalle Individual de Ventas
                 </h5>
                 <div className="space-y-3 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                   {data.sales.map((s) => (
                     <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-[24px] border border-transparent hover:border-slate-200 transition-all">
                       <div className="flex items-center gap-6">
                         <span className="font-mono font-black text-slate-400 text-[10px]">#{s.numeroVenta}</span>
                         <div>
                            <p className="text-xs font-black text-slate-900 uppercase">{s.codigoFardo}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">{s.fecha}</p>
                         </div>
                       </div>
                       <div className="text-right">
                         <p className="text-sm font-black text-slate-900">+ ${((s.tipoComision && COMMISSION_VALUES[s.tipoComision]) || 3000).toLocaleString()}</p>
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          </div>
        ))}

        {sellerCommissions.length === 0 && (
          <div className="py-40 text-center bg-white rounded-[56px] border-4 border-dashed border-slate-100">
             <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                <BadgeDollarSign size={64} />
             </div>
             <h3 className="text-3xl font-black text-slate-300 uppercase tracking-tighter">Sin Movimientos</h3>
             <p className="text-slate-400 font-medium italic">No se han encontrado registros de comisión para esta semana.</p>
          </div>
        )}
      </div>

      <div className="hidden print:block p-10 bg-white">
        <h1 className="text-3xl font-black uppercase text-center mb-10 border-b-4 border-black pb-4">Nómina de Pago Semanal</h1>
        <p className="text-center font-bold mb-10 uppercase tracking-widest">Periodo: {weekRange.start.toLocaleDateString()} al {weekRange.end.toLocaleDateString()}</p>
        
        {sellerCommissions.map(([name, data]) => (
          <div key={name} className="mb-12 border-2 border-black p-8 rounded-xl page-break-inside-avoid">
             <div className="flex justify-between items-end border-b-2 border-black pb-4 mb-6">
               <h2 className="text-2xl font-black uppercase">{name}</h2>
               <div className="text-right">
                 <p className="text-xs font-bold uppercase">Monto a Liquidar:</p>
                 <p className="text-3xl font-black">${(data.total || 0).toLocaleString()}</p>
               </div>
             </div>
             <table className="w-full text-[10px]">
               <thead>
                 <tr className="border-b border-black">
                   <th className="text-left py-2 uppercase">Fecha</th>
                   <th className="text-left py-2 uppercase">Venta</th>
                   <th className="text-left py-2 uppercase">Producto</th>
                   <th className="text-right py-2 uppercase">Monto</th>
                 </tr>
               </thead>
               <tbody>
                 {data.sales.map(s => (
                   <tr key={s.id} className="border-b border-slate-200">
                     <td className="py-2">{s.fecha}</td>
                     <td className="py-2">#{s.numeroVenta}</td>
                     <td className="py-2 font-bold uppercase">{s.codigoFardo}</td>
                     <td className="py-2 text-right font-black">${((s.tipoComision && COMMISSION_VALUES[s.tipoComision]) || 3000).toLocaleString()}</td>
                   </tr>
                 ))}
                 {data.adjustments.map(adj => (
                   <tr key={adj.id} className="border-b border-red-100 bg-red-50/30">
                     <td className="py-2 text-red-600">{adj.fecha}</td>
                     <td className="py-2 text-red-600" colSpan={2}>AJUSTE: {adj.motivo}</td>
                     <td className="py-2 text-right font-black text-red-600">{adj.monto > 0 ? '+' : ''}{adj.monto.toLocaleString()}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
             <div className="mt-12 flex justify-between items-center px-10">
                <div className="w-48 border-t border-black pt-2 text-center text-[8px] font-black uppercase">Firma Vendedor</div>
                <div className="w-48 border-t border-black pt-2 text-center text-[8px] font-black uppercase">Timbre Caja / Autorizado</div>
             </div>
          </div>
        ))}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .page-break-inside-avoid { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
