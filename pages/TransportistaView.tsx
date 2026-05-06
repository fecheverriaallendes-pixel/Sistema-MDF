import React, { useState } from 'react';
import { Truck, CheckCircle2, AlertCircle, Camera } from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { DispatchStatus, Sale } from '../types';

export default function TransportistaView() {
  const { sales, updateDispatchStatus, uploadProofPhoto, currentUser } = useStore();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  if (!currentUser) return null;

  const assignedSales = sales.filter(s => s.transportista?.toLowerCase() === currentUser.nombre.toLowerCase() && s.enviado && s.estadoDespacho !== DispatchStatus.ENTREGADO);

  const handleUpdateStatus = async (saleId: string, status: DispatchStatus) => {
    if (confirm(`¿Cambiar estado a ${status}?`)) {
        let photoUrl = undefined;
        if (file) {
            setUploading(true);
            try {
                photoUrl = await uploadProofPhoto(file, saleId);
            } catch (e) {
                alert("Error al subir foto");
                setUploading(false);
                return;
            }
            setUploading(false);
        }
        
        updateDispatchStatus(saleId, status, photoUrl);
        setSelectedSale(null);
        setFile(null);
        if (status === DispatchStatus.ENTREGADO) {
            alert("Estado actualizado. El comprobante ha sido procesado.");
        }
    }
  };

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
            <p className="text-sm text-slate-600 mb-2">Cliente: {sale.cliente} - {sale.telefono}</p>
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
            
            {selectedSale.estadoDespacho !== DispatchStatus.ENTREGADO && (
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">Subir Foto Comprobante</label>
                    <input 
                        type="file" 
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="w-full p-2 border rounded-xl"
                    />
                </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => handleUpdateStatus(selectedSale.id, DispatchStatus.ENTREGADO)}
                disabled={uploading}
                className="flex items-center justify-center gap-2 p-3 bg-emerald-500 text-white rounded-xl font-bold text-xs disabled:bg-slate-300"
              >
                {uploading ? 'Subiendo...' : <><CheckCircle2 size={16} /> ENTREGADO</>}
              </button>
              <button 
                onClick={() => handleUpdateStatus(selectedSale.id, DispatchStatus.EN_RUTA)}
                disabled={uploading}
                className="flex items-center justify-center gap-2 p-3 bg-blue-500 text-white rounded-xl font-bold text-xs disabled:bg-slate-300"
              >
                <Truck size={16} /> EN RUTA
              </button>
              <button 
                onClick={() => handleUpdateStatus(selectedSale.id, DispatchStatus.CLIENTE_NO_RECIBIO)}
                disabled={uploading}
                className="flex items-center justify-center gap-2 p-3 bg-amber-500 text-white rounded-xl font-bold text-xs disabled:bg-slate-300"
              >
                <AlertCircle size={16} /> NO RECIBIÓ
              </button>
              <button 
                onClick={() => handleUpdateStatus(selectedSale.id, DispatchStatus.DIRECCION_NO_ENCONTRADA)}
                disabled={uploading}
                className="flex items-center justify-center gap-2 p-3 bg-red-500 text-white rounded-xl font-bold text-xs disabled:bg-slate-300"
              >
                <AlertCircle size={16} /> NO ENCONTRADA
              </button>
              <button 
                onClick={() => setSelectedSale(null)}
                disabled={uploading}
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
