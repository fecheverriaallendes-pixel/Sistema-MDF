import React from 'react';
import { Sale } from '../types';

const LOGO_URL = "https://i.ibb.co/qMyZQHYg/logo-sin-fondo-1.png";

export const Label = ({ sale, stock, item }: { sale: Sale, stock: any[], item?: {codigoFardo: string, cantidad: number} }) => {
  const displayItem = item || { codigoFardo: sale.codigoFardo || 'N/A', cantidad: sale.cantidad || 1 };
  
  return (
    <div className="w-[100mm] h-[150mm] box-border bg-white border-2 border-black p-4 flex flex-col items-stretch overflow-hidden print:m-0 print:w-[100mm] print:h-[150mm]">
      <div className="flex flex-row border-b-2 border-dashed border-black pb-2 mb-2 justify-between items-center">
        <div className="flex flex-row items-center gap-2">
          <img src={LOGO_URL} alt="Logo" className="w-[20mm] object-contain grayscale" />
          <div className="font-mono text-xl font-black">#{sale.numeroVenta}</div>
        </div>
        <div className="text-center border-l border-dashed border-black pl-1 flex flex-col justify-between h-full">
          <div className="flex flex-col gap-0.5">
            <p className="text-[6px] font-black uppercase tracking-tighter text-slate-600">Origen</p>
            <p className="text-[7px] font-bold uppercase">{sale.tipoVenta}</p>
          </div>
          <div className="border-t border-dashed border-black pt-0.5">
            <p className="text-[6px] font-black uppercase tracking-tighter text-slate-600">Contacto</p>
            <p className="text-[10px] font-black leading-tight break-all">{sale.telefono}</p>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <div className="mb-1">
            <p className="text-[7px] font-black uppercase text-slate-500 mb-0.2">Destinatario</p>
            <p className="text-md font-black uppercase leading-tight line-clamp-2">{sale.cliente}</p>
            <p className="text-[9px] font-bold text-slate-700 mt-0.2">RUT: {sale.rut || 'PENDIENTE'}</p>
          </div>
          <div className="mb-1">
            <p className="text-[7px] font-black uppercase text-slate-500 mb-0.2">Dirección de Entrega</p>
            <div className="bg-slate-50 p-1 rounded-md border border-slate-200">
              <p className="text-[9px] font-black uppercase leading-snug line-clamp-3 italic">{sale.direccion || 'SIN DIRECCIÓN REGISTRADA'}</p>
            </div>
          </div>
          <div className="mb-2">
            <p className="text-[8px] font-black uppercase text-slate-500 mb-0.5">Agencia</p>
            <p className="text-xs font-black uppercase">{sale.agencia || 'NO ESPECIFICADO'}</p>
            <p className="text-[8px] font-black uppercase text-slate-500 mt-2 mb-0.5">Producto</p>
            <p className="text-lg font-black uppercase leading-tight">
              { (() => {
                const stockItem = stock.find(i => i.codigo === displayItem.codigoFardo);
                return stockItem ? `${stockItem.tipo}` : (sale.tipo || 'Producto');
              })()}
            </p>
            <p className="text-[9px] font-bold text-slate-500 mt-0.5">SKU: {displayItem.codigoFardo || 'N/A'}</p>
            <p className="text-[8px] font-black uppercase text-slate-500 mt-2 mb-0.5">Cantidad</p>
            <p className="text-lg font-black uppercase leading-none">{displayItem.cantidad || 1}</p>
            <p className="text-[8px] font-black uppercase text-slate-500 mt-2 mb-0.5">Variante</p>
            <p className="text-md font-bold uppercase leading-none">{sale.variante || 'N/A'}</p>

            <div className="mt-4 p-2 bg-slate-100 border-l-4 border-slate-900">
              <p className="text-[10px] font-bold leading-tight">🔄 Para cambios, debe grabar un video de inicio a fin SIN EXCEPCIÓN</p>
              <p className="text-[9px] text-slate-600 mt-1">Grabe su video al recibir y abrir su compra, de inicio a fin ante problemas de etiquetado o error de entregas.</p>
            </div>
            <p className="text-[8px] text-slate-500 uppercase mt-4 text-center">Vendedor: {sale.vendedor || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
