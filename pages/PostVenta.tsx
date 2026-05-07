import React, { useState } from 'react';
import { useStore } from '../store/GlobalContext';
import { jsPDF } from 'jspdf';
import { Ticket, Download, Plus, AlertCircle } from 'lucide-react';

export default function PostVenta() {
  const { coupons, addCoupon, redeemCoupon } = useStore();
  const [amount, setAmount] = useState('');
  const [validDays, setValidDays] = useState('30');
  const [customerName, setCustomerName] = useState('');

  const handleGenerate = () => {
    if (!amount || !customerName) return;
    addCoupon({
      code: 'CP-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      value: parseInt(amount),
      validUntil: new Date(Date.now() + parseInt(validDays) * 24 * 60 * 60 * 1000).toISOString(),
      used: false,
      customerName: customerName
    });
    setAmount('');
    setCustomerName('');
  };

  const downloadPDF = (coupon: any) => {
    const doc = new jsPDF();
    doc.text(`Cupon de Compensaacion: ${coupon.code}`, 10, 10);
    doc.text(`Valor: $${coupon.value}`, 10, 20);
    doc.text(`Para: ${coupon.customerName}`, 10, 30);
    doc.save(`cupon_${coupon.code}.pdf`);
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-black uppercase tracking-widest text-slate-900">Post-Venta</h1>
      
      <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-4">
        <h2 className="font-bold text-lg">Nueva Compensación</h2>
        <div className="grid grid-cols-3 gap-4">
          <input type="text" placeholder="Nombre Cliente" value={customerName} onChange={e => setCustomerName(e.target.value)} className="p-2 border rounded-xl"/>
          <input type="number" placeholder="Monto" value={amount} onChange={e => setAmount(e.target.value)} className="p-2 border rounded-xl"/>
          <input type="number" placeholder="Días Validez" value={validDays} onChange={e => setValidDays(e.target.value)} className="p-2 border rounded-xl"/>
        </div>
        <button onClick={handleGenerate} className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2">
            <Plus size={16} /> Generar Cupón
        </button>
      </div>
      
      <div className="bg-white p-6 rounded-3xl border border-slate-100">
        <h2 className="font-bold text-lg mb-4">Historial de Cupones</h2>
        <table className="w-full text-left">
            <thead>
                <tr className="border-b">
                    <th className="p-4 uppercase text-[10px] text-slate-400">Código</th>
                    <th className="p-4 uppercase text-[10px] text-slate-400">Cliente</th>
                    <th className="p-4 uppercase text-[10px] text-slate-400">Valor</th>
                    <th className="p-4 uppercase text-[10px] text-slate-400">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {coupons.map(c => (
                    <tr key={c.id} className="border-b">
                        <td className="p-4 font-bold">{c.code}</td>
                        <td className="p-4">{c.customerName}</td>
                        <td className="p-4">${c.value}</td>
                        <td className="p-4 flex gap-2">
                            {!c.used && <button onClick={() => downloadPDF(c)} className="text-emerald-500"><Download size={16}/></button>}
                            {c.used && <span className="text-xs text-slate-400">Canjeado</span>}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}
