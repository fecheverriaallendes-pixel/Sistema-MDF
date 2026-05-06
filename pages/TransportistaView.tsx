import React, { useState } from 'react';
import { Truck, CheckCircle2, AlertCircle, Package } from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { DispatchStatus } from '../types';

export default function TransportistaView() {
  const { sales, updateDispatchStatus, currentUser } = useStore();
  
  if (!currentUser) return null;

  const assignedSales = sales.filter(s => s.transportista?.toLowerCase() === currentUser.nombre.toLowerCase() && s.enviado);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-black text-slate-900 uppercase">Mis Despachos</h1>
      
      <div className="space-y-4">
        {assignedSales.map(sale => (
          <div key={sale.id} className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-lg">Venta #{sale.numeroVenta}</h2>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full">{sale.estadoDespacho}</span>
            </div>
            <p className="text-sm text-slate-600 mb-4">{sale.direccion}</p>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => updateDispatchStatus(sale.id, DispatchStatus.ENTREGADO)}
                className="flex items-center justify-center gap-2 p-3 bg-emerald-500 text-white rounded-xl font-bold text-xs"
              >
                <CheckCircle2 size={16} /> Entregado
              </button>
              <button 
                onClick={() => updateDispatchStatus(sale.id, DispatchStatus.EN_RUTA)}
                className="flex items-center justify-center gap-2 p-3 bg-blue-500 text-white rounded-xl font-bold text-xs"
              >
                <Truck size={16} /> En Ruta
              </button>
              <button 
                onClick={() => updateDispatchStatus(sale.id, DispatchStatus.CLIENTE_NO_RECIBIO)}
                className="flex items-center justify-center gap-2 p-3 bg-amber-500 text-white rounded-xl font-bold text-xs"
              >
                <AlertCircle size={16} /> No Recibió
              </button>
              <button 
                onClick={() => updateDispatchStatus(sale.id, DispatchStatus.DIRECCION_NO_ENCONTRADA)}
                className="flex items-center justify-center gap-2 p-3 bg-red-500 text-white rounded-xl font-bold text-xs"
              >
                <AlertCircle size={16} /> No Encontrada
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
