import React, { useState, useMemo } from 'react';
import { useStore } from '../store/GlobalContext';
import { jsPDF } from 'jspdf';
import { Ticket, Download, Plus, AlertCircle, Search, ArrowUpDown, Calendar } from 'lucide-react';
import { StaffRole, Coupon } from '../types';

export default function PostVenta() {
  const { coupons, addCoupon, redeemCoupon, redeemCouponByCode, deleteCoupon, currentUser } = useStore();
  const [amount, setAmount] = useState('');
  const [validDays, setValidDays] = useState('30');
  const [customerName, setCustomerName] = useState('');
  const [redeemCode, setRedeemCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const normalizeText = (text: string) => 
    (text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredAndSortedCoupons = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm);
    
    let result = coupons.filter(c => 
      normalizeText(c.customerName).includes(normalizedSearch) || 
      normalizeText(c.code).includes(normalizedSearch)
    );

    return result.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [coupons, searchTerm, sortOrder]);

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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="font-bold text-lg">Historial de Cupones</h2>
          
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por cliente o código..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-2xl text-sm w-full md:w-64 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
              />
            </div>
            
            <div className="relative min-w-[160px]">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <select 
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as any)}
                className="pl-9 pr-8 py-2 bg-slate-50 border-none rounded-2xl text-sm w-full appearance-none focus:ring-2 focus:ring-emerald-500 transition-all outline-none cursor-pointer font-medium"
              >
                <option value="newest">Más recientes</option>
                <option value="oldest">Más antiguos</option>
              </select>
              <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
              <thead>
                  <tr className="border-b">
                      <th className="p-4 uppercase text-[10px] text-slate-400">Fecha</th>
                      <th className="p-4 uppercase text-[10px] text-slate-400">Código</th>
                      <th className="p-4 uppercase text-[10px] text-slate-400">Cliente</th>
                      <th className="p-4 uppercase text-[10px] text-slate-400">Valor</th>
                      <th className="p-4 uppercase text-[10px] text-slate-400">Estado</th>
                      <th className="p-4 uppercase text-[10px] text-slate-400">Acciones</th>
                  </tr>
              </thead>
              <tbody>
                  {filteredAndSortedCoupons.length > 0 ? (
                    filteredAndSortedCoupons.map(c => (
                      <tr key={c.id} className="border-b hover:bg-slate-50 transition-colors">
                          <td className="p-4 text-xs text-slate-500">
                            {new Date(c.createdAt || "").toLocaleDateString('es-CL')}
                          </td>
                          <td className="p-4 font-bold text-slate-700">{c.code}</td>
                          <td className="p-4 text-slate-600">{c.customerName}</td>
                          <td className="p-4 font-black text-emerald-600">
                            ${c.value?.toLocaleString('es-CL')}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                              c.used ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                              {c.used ? 'Canjeado' : 'Pendiente'}
                            </span>
                          </td>
                          <td className="p-4 flex gap-2">
                              {!c.used && (
                                  <>
                                      <button 
                                        onClick={() => downloadPDFEnhanced(c)} 
                                        title="Descargar cupón"
                                        className="p-2 hover:bg-emerald-50 text-emerald-500 rounded-lg transition-colors"
                                      >
                                        <Download size={16}/>
                                      </button>
                                      <button 
                                        onClick={() => handleRedeem(c)} 
                                        className="px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors shadow-sm"
                                      >
                                        Canjear
                                      </button>
                                  </>
                              )}
                              {isAdmin && (
                                <button 
                                  onClick={() => {
                                    if(confirm("¿Estás seguro de eliminar este cupón?")) deleteCoupon(c.id);
                                  }} 
                                  className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                                  title="Eliminar"
                                >
                                  <AlertCircle size={16}/>
                                </button>
                              )}
                          </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                        No se encontraron cupones que coincidan con la búsqueda.
                      </td>
                    </tr>
                  )}
              </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
