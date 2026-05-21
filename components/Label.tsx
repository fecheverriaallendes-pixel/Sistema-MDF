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
            <p className="text-xl font-black leading-tight break-all">{sale.telefono}</p>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <div className="mb-1">
            <p className="text-[7px] font-black uppercase text-slate-500 mb-0.2">Destinatario</p>
            <p className="text-md font-black uppercase leading-tight">{sale.cliente}</p>
            <p className="text-xs font-bold text-slate-700 mt-0.2">RUT: {sale.rut || 'PENDIENTE'}</p>
          </div>
          <div className="mb-1">
            <p className="text-[7px] font-black uppercase text-slate-500 mb-0.2">Dirección de Entrega</p>
            <div className="bg-slate-50 p-1.5 rounded-md border border-slate-200">
              <p className={`font-black uppercase leading-tight italic ${sale.direccion && sale.direccion.length > 50 ? 'text-[8px]' : 'text-[10px]'}`}>
                {sale.direccion || 'SIN DIRECCIÓN REGISTRADA'}
              </p>
            </div>
          </div>
          <div className="mb-2">
            <div className="flex justify-between items-start gap-2 mb-2">
              <div className="flex-1">
                <p className="text-[8px] font-black uppercase text-slate-500 mb-0.5">Agencia / Destino</p>
                <p className="text-xs font-black uppercase leading-tight">{sale.agencia || 'DOMICILIO'}</p>
              </div>
              {(() => {
                const stockItem = stock.find(i => i.codigo === displayItem.codigoFardo);
                if (stockItem?.categoria === 'LOTE' && stockItem?.peso) {
                  return (
                    <div className="text-right">
                      <p className="text-[8px] font-black uppercase text-amber-600 mb-0.5">Peso</p>
                      <p className="text-lg font-black text-amber-600 leading-none">{stockItem.peso} KG</p>
                    </div>
                  )
                }
                return null;
              })()}
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-dashed border-slate-200 pt-2">
              <div>
                <p className="text-[8px] font-black uppercase text-slate-500 mb-0.5">Producto / SKU</p>
                <p className="text-[13px] font-black uppercase leading-tight">
                  { (() => {
                    const stockItem = stock.find(i => i.codigo === displayItem.codigoFardo);
                    return stockItem ? stockItem.tipo : (displayItem.codigoFardo || 'SIN CÓDIGO');
                  })()}
                </p>
                <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase leading-none italic">{displayItem.codigoFardo || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black uppercase text-slate-500 mb-0.5">Cantidad x Var.</p>
                <p className="text-lg font-black leading-none uppercase">x{displayItem.cantidad || 1} {sale.variante || 'N/A'}</p>
              </div>
            </div>

            <div className="mt-4 p-2 bg-slate-100 border-l-4 border-slate-900 rounded-r-md">
              <p className="text-[10px] font-bold leading-tight uppercase">🔄 VIDEO OBLIGATORIO PARA CAMBIOS</p>
              <p className="text-[8px] text-slate-600 mt-1 leading-snug">Grabe la apertura de su paquete de inicio a fin sin cortes ni ediciones.</p>
            </div>
            <div className="mt-4 text-center">
              <p className="text-[8px] text-slate-500 uppercase font-bold leading-none">Vendedor: {sale.vendedor || 'SISTEMA'}</p>
              {sale.etiquetador && (
                <p className="text-[7px] text-slate-400 uppercase font-medium mt-1 leading-none">Etiquetado por: {sale.etiquetador}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      {sale.tipoVenta === 'Live TikTok' && (
        <p className="text-[7px] font-black text-slate-200 absolute bottom-4 left-1/2 -translate-x-1/2 uppercase tracking-[0.3em] pointer-events-none">
          TikTok Live Session
        </p>
      )}
    </div>
  );
};
