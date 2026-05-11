import React, { useState } from 'react';
import { Truck, CheckCircle2, AlertCircle, Camera, Trash2 } from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { DispatchStatus, Sale, StaffRole } from '../types';

export default function TransportistaView() {
  const { sales, updateDispatchStatus, currentUser, deleteSale } = useStore();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'FINISHED'>('PENDING');

  if (!currentUser) return null;

  const isAdmin = currentUser.rol === StaffRole.ADMIN || currentUser.rol === StaffRole.VENDEDOR;
  const filteredSales = sales.filter(s => (isAdmin || s.transportista?.toLowerCase() === currentUser.nombre.toLowerCase()) && s.enviado);
  
  const assignedSales = activeTab === 'PENDING' 
    ? filteredSales.filter(s => s.estadoDespacho !== DispatchStatus.ENTREGADO)
    : filteredSales.filter(s => s.estadoDespacho === DispatchStatus.ENTREGADO);

  const handleUpdateStatus = async (saleId: string, status: DispatchStatus) => {
    if (confirm(`¿Cambiar estado a ${status}?`)) {
        updateDispatchStatus(saleId, status);
        setSelectedSale(null);
        alert("Estado actualizado correctamente.");
    }
  };


  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-black text-slate-900 uppercase">Mis Despachos</h1>
      
      <div className="flex bg-slate-100 p-1 rounded-full">
         <button onClick={() => setActiveTab('PENDING')} className={`flex-1 py-3 text-xs font-black rounded-full uppercase ${activeTab === 'PENDING' ? 'bg-white shadow' : ''}`}>Pendientes</button>
         <button onClick={() => setActiveTab('FINISHED')} className={`flex-1 py-3 text-xs font-black rounded-full uppercase ${activeTab === 'FINISHED' ? 'bg-white shadow' : ''}`}>Entregados</button>
      </div>
      
      <div className="space-y-4">
        {assignedSales.map(sale => (
          <div key={sale.id} className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-lg">Venta #{sale.numeroVenta}</h2>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full">{sale.estadoDespacho}</span>
                <button 
                    onClick={() => {
                        if(confirm("¿Estás seguro de que quieres eliminar este despacho?")) {
                            deleteSale(sale.id);
                        }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <Trash2 size={16} />
                </button>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-2">Cliente: {sale.cliente} - {sale.telefono}</p>
            <p className="text-sm font-bold text-slate-700 mb-2">Transportista: {sale.transportista || 'No asignado'}</p>
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${sale.direccion}, Chile`)}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-blue-600 font-bold underline block mb-4"
            >
              🚩 {sale.direccion}
            </a>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setSelectedSale(sale)}
                className="col-span-2 flex items-center justify-center gap-2 p-4 bg-emerald-500 text-white rounded-xl font-black text-sm"
              >
                <CheckCircle2 size={20} /> Gestionar Entrega
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl w-full max-w-sm space-y-4">
            <h2 className="font-black text-xl">Venta #{selectedSale.numeroVenta}</h2>
            

            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => handleUpdateStatus(selectedSale.id, DispatchStatus.ENTREGADO)}
                className="flex items-center justify-center gap-2 p-3 bg-emerald-500 text-white rounded-xl font-bold text-xs"
              >
                <CheckCircle2 size={16} /> ENTREGADO
              </button>
              <button 
                onClick={() => handleUpdateStatus(selectedSale.id, DispatchStatus.EN_RUTA)}
                className="flex items-center justify-center gap-2 p-3 bg-blue-500 text-white rounded-xl font-bold text-xs"
              >
                <Truck size={16} /> EN RUTA
              </button>
              <button 
                onClick={() => handleUpdateStatus(selectedSale.id, DispatchStatus.CLIENTE_NO_RECIBIO)}
                className="flex items-center justify-center gap-2 p-3 bg-amber-500 text-white rounded-xl font-bold text-xs"
              >
                <AlertCircle size={16} /> NO RECIBIÓ
              </button>
              <button 
                onClick={() => handleUpdateStatus(selectedSale.id, DispatchStatus.DIRECCION_NO_ENCONTRADA)}
                className="flex items-center justify-center gap-2 p-3 bg-red-500 text-white rounded-xl font-bold text-xs"
              >
                <AlertCircle size={16} /> NO ENCONTRADA
              </button>
              <button 
                onClick={() => setSelectedSale(null)}
                className="col-span-2 p-3 bg-slate-200 text-slate-600 rounded-xl font-bold text-xs"
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
