import React, { useState } from 'react';
import { useStore } from '../store/GlobalContext';
import { jsPDF } from 'jspdf';
import { Ticket, Download, Plus, AlertCircle } from 'lucide-react';
import { StaffRole } from '../types';

export default function PostVenta() {
  const { coupons, addCoupon, redeemCoupon, redeemCouponByCode, deleteCoupon, currentUser } = useStore();
  const [amount, setAmount] = useState('');
  const [validDays, setValidDays] = useState('30');
  const [customerName, setCustomerName] = useState('');
  const [redeemCode, setRedeemCode] = useState('');

  const handleRedeemByCode = () => {
      try {
          redeemCouponByCode(redeemCode);
          alert("Cupón canjeado exitosamente");
          setRedeemCode('');
      } catch (e: any) {
          alert(e.message);
      }
  };
  const isAdmin = currentUser?.rol === StaffRole.ADMIN;

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
    doc.setDrawColor(250, 204, 21); // Yellow
    doc.setLineWidth(2);
    doc.rect(5, 5, 200, 150); // Border

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(180, 83, 9);
    doc.text(`CUPÓN DE COMPENSACIÓN`, 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);
    doc.text(`Cliente: ${coupon.customerName}`, 20, 40);
    doc.text(`Cupón: ${coupon.code}`, 20, 50);
    
    // Monto
    doc.setFillColor(22, 163, 74);
    doc.rect(70, 70, 70, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(`CLP $${coupon.value.toLocaleString('es-CL')}`, 105, 80, { align: 'center' });
    
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(12);
    doc.text(`Estado: ${coupon.used ? 'USADO' : 'PENDIENTE'}`, 20, 100);
    doc.text(`Emitido: ${new Date(coupon.createdAt).toLocaleDateString()}`, 20, 110);
    
    doc.save(`cupon_${coupon.code}.pdf`);
  };
  
  const downloadPDFEnhanced = (coupon: any) => {
    // Explicitly set orientation to portrait 'p'
    const doc = new jsPDF('p', 'mm', [100, 150]);

    // Background and Border with a slight margin to avoid cut-offs on thermal printers
    doc.setDrawColor(250, 204, 21); // Yellow
    doc.setLineWidth(1);
    doc.rect(5, 5, 90, 140);

    // Brand "Watermark"
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(240, 240, 240); // Even lighter
    doc.text(`EL MUNDO`, 50, 80, { align: 'center', angle: 45 });
    doc.text(`DEL FARDO`, 50, 95, { align: 'center', angle: 45 });

    // Title
    doc.setFontSize(14);
    doc.setTextColor(180, 83, 9);
    doc.text(`CUPÓN DE COMPENSACIÓN`, 50, 15, { align: 'center' });

    // Details Section
    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55);
    doc.text(`Cliente:`, 10, 25);
    doc.setFont("Helvetica", "normal");
    // Wrap the customer name
    const customerLines = doc.splitTextToSize(coupon.customerName || 'N/A', 60);
    doc.text(customerLines, 30, 25);
    
    doc.setFont("Helvetica", "bold");
    doc.text(`Cupón:`, 10, 35);
    doc.setFont("Helvetica", "normal");
    doc.text(coupon.code, 30, 35);

    // Value Section
    doc.setFillColor(22, 163, 74);
    doc.rect(10, 50, 80, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`CLP $${coupon.value.toLocaleString('es-CL')}`, 50, 63, { align: 'center' });

    // Footer/Info
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(9);
    doc.setFont("Helvetica", "bold");
    doc.text(`Estado: ${coupon.used ? 'USADO' : 'PENDIENTE'}`, 10, 85);
    doc.text(`Emitido: ${new Date(coupon.createdAt).toLocaleDateString()}`, 10, 95);

    doc.setFont("Helvetica", "bolditalic");
    doc.text(`Válido por 1 mes`, 50, 110, { align: 'center' });

    // Bottom Branding
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(180, 83, 9);
    doc.text(`EL MUNDO DEL FARDO`, 50, 135, { align: 'center' });
    
    doc.save(`cupon_${coupon.code}.pdf`);
  };

  const handleRedeem = (coupon: Coupon) => {
      try {
          if (new Date(coupon.validUntil) < new Date()) {
              throw new Error("El cupón ha expirado");
          }
          redeemCoupon(coupon.id);
          alert("Cupón canjeado exitosamente");
      } catch (e: any) {
          alert(e.message);
      }
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

      <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-4">
        <h2 className="font-bold text-lg">Canje Rápido de Cupón</h2>
        <div className="flex gap-4">
          <input type="text" placeholder="Código del cupón" value={redeemCode} onChange={e => setRedeemCode(e.target.value)} className="p-2 border rounded-xl flex-grow"/>
          <button onClick={handleRedeemByCode} className="px-6 py-3 bg-amber-500 text-white rounded-xl font-bold">Canjear</button>
        </div>
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
                            {!c.used && (
                                <>
                                    <button onClick={() => downloadPDF(c)} className="text-emerald-500"><Download size={16}/></button>
                                    <button onClick={() => handleRedeem(c)} className="px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold">Canjear</button>
                                </>
                            )}
                            {c.used && <span className="text-xs text-slate-400">Canjeado</span>}
                            {isAdmin && <button onClick={() => deleteCoupon(c.id)} className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-bold">Eliminar</button>}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}
