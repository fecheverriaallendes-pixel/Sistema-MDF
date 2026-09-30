import React from 'react';
import { Sale, DispatchType } from '../types';
import { LabelItemData } from '../utils/labelUtils';

export type { LabelItemData };

const LOGO_URL = "https://i.ibb.co/qMyZQHYg/logo-sin-fondo-1.png";

export const formatRut = (rawRut?: string): string => {
  if (!rawRut || !rawRut.trim()) return 'PENDIENTE';
  const upper = rawRut.trim().toUpperCase();
  if (['PENDIENTE', 'N/A', 'SIN RUT', 'EXTRANJERO', 'PASAPORTE', 'NO APLICA'].includes(upper)) {
    return upper;
  }
  
  // Extract alphanumeric digits (Chilean RUT is digits plus optional K)
  const clean = upper.replace(/[^0-9K]/g, '');
  if (clean.length >= 7 && clean.length <= 10) {
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);
    // Add thousands dots separator
    const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formattedBody}-${dv}`;
  }
  
  return upper;
};

export const getAgenciaODestino = (sale: Sale): string => {
  const agencia = (sale.agencia || '').trim().toUpperCase();
  const junta = (sale.juntaCompra || '').trim().toUpperCase();
  const tipoDespachoRaw = (sale.tipoDespacho || '').toString().trim().toUpperCase();

  // 1. If juntaCompra or tipoDespacho or agencia is a Retiro
  if (
    junta.includes('RETIRO') || 
    sale.tipoDespacho === DispatchType.RETIRO || 
    tipoDespachoRaw.includes('RETIRO') || 
    agencia.includes('RETIRO')
  ) {
    return 'RETIRO EN BODEGA';
  }

  // 2. If agencia is explicitly set and not 'DOMICILIO'
  if (agencia && agencia !== 'DOMICILIO') {
    return agencia;
  }

  // 3. If tipoDespacho is AGENCIA
  if (sale.tipoDespacho === DispatchType.AGENCIA || tipoDespachoRaw === 'AGENCIA') {
    return 'AGENCIA';
  }

  // 4. Default fallback for domicilio
  return 'DOMICILIO';
};

export const Label = ({ 
  sale, 
  stock, 
  item 
}: { 
  sale: Sale; 
  stock: any[]; 
  item?: LabelItemData;
}) => {
  const displayItem: LabelItemData = item || { 
    codigoFardo: sale.codigoFardo || 'N/A', 
    cantidad: sale.cantidad || 1,
    variante: sale.variante
  };
  const destinoText = getAgenciaODestino(sale);
  const isRetiro = destinoText.includes('RETIRO');
  const hasMultipleBultos = Boolean(displayItem.bultoTotal && displayItem.bultoTotal > 1);
  const isIndividualBulto = hasMultipleBultos && displayItem.cantidad === 1;
  
  return (
    <div 
      className={`w-[100mm] h-[150mm] box-border bg-white border-4 border-black ${hasMultipleBultos ? 'p-2.5 gap-1.5' : 'p-3'} flex flex-col justify-between overflow-hidden print:m-0 print:w-[100mm] print:h-[150mm] select-none text-black`}
      style={{ color: '#000000' }}
    >
      {/* 1. Header: Logo, N° Venta, Canal y Teléfono */}
      <div className="flex flex-row border-b-2 border-black pb-1.5 justify-between items-center gap-2">
        <div className="flex flex-row items-center gap-2">
          <img src={LOGO_URL} alt="Logo" className="w-[15mm] object-contain grayscale" />
          <div className="flex flex-col">
            <span className="text-[8.5px] font-black uppercase tracking-wider text-black leading-none">N° ENVÍO / VENTA</span>
            <span 
              className="thermal-num text-3xl font-extrabold tracking-tight text-black leading-none mt-1"
              style={{ fontFamily: "Arial, Helvetica, 'Inter', sans-serif" }}
            >
              #{sale.numeroVenta}
            </span>
          </div>
        </div>
        <div className="text-right border-l-2 border-black pl-2.5 flex flex-col justify-between py-0.5">
          <div className="flex flex-col items-end">
            <span className="text-[8.5px] font-black uppercase tracking-wider text-black">ORIGEN</span>
            <span className="text-[9.5px] font-black uppercase text-black bg-white px-2 py-0.5 rounded border border-black leading-tight">
              {sale.tipoVenta}
            </span>
          </div>
          <div className="border-t border-black pt-1 mt-1 text-right">
            <span className="text-[8.5px] font-black uppercase tracking-wider text-black block">TELÉFONO</span>
            <span 
              className="thermal-num text-[16px] font-extrabold leading-none tracking-wider text-black"
              style={{ fontFamily: "Arial, Helvetica, 'Inter', sans-serif" }}
            >
              {sale.telefono || 'SIN TELÉFONO'}
            </span>
          </div>
        </div>
      </div>

      {/* 1.5. Banner Destacado de Bulto para Transportistas (Si aplica) */}
      {hasMultipleBultos && (
        <div className="bg-black text-white px-2.5 py-1 rounded flex items-center justify-between border-2 border-black">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider">📦 BULTO / FARDO:</span>
            <span 
              className="thermal-num text-[19px] font-extrabold tracking-widest leading-none"
              style={{ fontFamily: "Arial, Helvetica, 'Inter', sans-serif" }}
            >
              {displayItem.bultoNumero || 1} DE {displayItem.bultoTotal}
            </span>
          </div>
          <span className="text-[9px] font-black uppercase bg-white text-black px-2 py-0.5 rounded leading-tight">
            TOTAL {displayItem.bultoTotal} BULTOS
          </span>
        </div>
      )}

      {/* 2. Destinatario y RUT */}
      <div className="border-2 border-black rounded-md p-1.5 bg-white flex flex-col gap-1">
        <div>
          <span className="text-[9px] font-black uppercase tracking-wider text-black block mb-0.5">
            DESTINATARIO
          </span>
          <p className="text-[17px] font-black uppercase leading-tight text-black tracking-tight line-clamp-1">
            {sale.cliente}
          </p>
        </div>

        {/* Caja Destacada para el RUT con tipografía clara anti-confusión */}
        <div className="border-2 border-black rounded p-1 bg-white flex items-center justify-between">
          <span className="bg-black text-white text-[11px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
            RUT
          </span>
          <span 
            className="thermal-num text-[22px] font-extrabold tracking-[0.12em] text-black leading-none"
            style={{ 
              fontFamily: "Arial, Helvetica, 'Inter', sans-serif",
              fontVariantNumeric: 'normal tabular-nums',
              fontFeatureSettings: '"zero" 0, "tnum" 1'
            }}
          >
            {formatRut(sale.rut)}
          </span>
        </div>
      </div>

      {/* 3. Dirección de Entrega */}
      <div>
        <span className="text-[9px] font-black uppercase tracking-wider text-black block mb-0.5">
          DIRECCIÓN DE ENTREGA
        </span>
        <div className="bg-white p-1.5 rounded-md border-2 border-black min-h-[38px] flex items-center">
          <p className={`font-black uppercase leading-snug break-words text-black ${
            !sale.direccion ? 'text-[12px]' :
            sale.direccion.length > 90 ? 'text-[11px]' :
            sale.direccion.length > 50 ? 'text-[12px]' : 
            'text-[14px]'
          }`}>
            {sale.direccion || (isRetiro ? `SUCURSAL / ${destinoText}` : 'SIN DIRECCIÓN REGISTRADA')}
          </p>
        </div>
      </div>

      {/* 4. Agencia / Tipo de Despacho y Peso */}
      <div className="border-2 border-black rounded-md p-1.5 bg-white flex justify-between items-center gap-2">
        <div className="flex-1">
          <span className="text-[8.5px] font-black uppercase tracking-wider text-black block mb-0.5">
            DESTINO / TIPO DESPACHO
          </span>
          <span className="text-[15px] font-black uppercase tracking-wide px-2.5 py-0.5 rounded inline-block bg-black text-white leading-tight">
            {destinoText}
          </span>
        </div>
        {(() => {
          const stockItem = stock.find(i => i.codigo === displayItem.codigoFardo);
          if (stockItem?.categoria === 'LOTE' && stockItem?.peso) {
            return (
              <div className="text-right border-2 border-black px-2 py-0.5 rounded bg-white">
                <span className="text-[8.5px] font-black uppercase tracking-wider text-black block leading-none">PESO</span>
                <span 
                  className="thermal-num text-[16px] font-extrabold text-black leading-none"
                  style={{ fontFamily: "Arial, Helvetica, 'Inter', sans-serif" }}
                >
                  {stockItem.peso} KG
                </span>
              </div>
            );
          }
          return null;
        })()}
      </div>

      {/* 5. Producto / SKU y Cantidad */}
      <div className="border-2 border-black rounded-md p-1.5 bg-white grid grid-cols-2 gap-2">
        <div>
          <span className="text-[8.5px] font-black uppercase tracking-wider text-black block mb-0.5">
            PRODUCTO / SKU
          </span>
          <p className="text-[12.5px] font-black uppercase leading-tight text-black line-clamp-2">
            { (() => {
              if (displayItem.descripcionProducto) return displayItem.descripcionProducto;
              const stockItem = stock.find(i => i.codigo === displayItem.codigoFardo);
              return stockItem ? stockItem.tipo : (displayItem.codigoFardo || 'SIN CÓDIGO');
            })()}
          </p>
          <span 
            className="thermal-num text-[12px] font-extrabold tracking-wider text-black border border-black px-1.5 py-0.2 rounded bg-white inline-block mt-0.5 leading-none"
            style={{ fontFamily: "Arial, Helvetica, 'Inter', sans-serif" }}
          >
            {displayItem.codigoFardo || 'N/A'}
          </span>
        </div>
        <div className="text-right flex flex-col justify-between items-end">
          <span className="text-[8.5px] font-black uppercase tracking-wider text-black block">
            {isIndividualBulto ? 'ESTE FARDO' : 'CANTIDAD'}
          </span>
          {isIndividualBulto ? (
            <div className="flex flex-col items-end">
              <p 
                className="thermal-num text-[17px] font-extrabold leading-none uppercase text-black"
                style={{ fontFamily: "Arial, Helvetica, 'Inter', sans-serif" }}
              >
                1 FARDO
              </p>
              <span className="text-[10px] font-black bg-black text-white px-1.5 py-0.5 rounded mt-0.5 leading-none">
                BULTO {displayItem.bultoNumero}/{displayItem.bultoTotal}
              </span>
              {displayItem.itemTotalQty && displayItem.itemTotalQty > 1 ? (
                <span className="text-[8.5px] font-bold text-slate-800 mt-0.5">
                  ({displayItem.itemIndex || 1} de {displayItem.itemTotalQty} de este tipo)
                </span>
              ) : null}
            </div>
          ) : hasMultipleBultos ? (
            <div className="flex flex-col items-end">
              <p 
                className="thermal-num text-[17px] font-extrabold leading-none uppercase text-black"
                style={{ fontFamily: "Arial, Helvetica, 'Inter', sans-serif" }}
              >
                x{displayItem.cantidad || 1} {displayItem.variante || sale.variante || 'FARDOS'}
              </p>
              <span className="text-[8.5px] font-bold text-slate-800 mt-0.5">
                Bultos {displayItem.bultoNumero} al {(displayItem.bultoNumero || 1) + displayItem.cantidad - 1}
              </span>
            </div>
          ) : (
            <p 
              className="thermal-num text-[18px] font-extrabold leading-none uppercase text-black"
              style={{ fontFamily: "Arial, Helvetica, 'Inter', sans-serif" }}
            >
              x{displayItem.cantidad || 1} {sale.variante || ''}
            </p>
          )}
        </div>
      </div>

      {/* 6. Advertencia Obligatoria */}
      <div className="p-1 border-2 border-black rounded-md bg-white">
        <p className="text-[9.5px] font-black leading-tight uppercase text-black">
          ⚠️ VIDEO OBLIGATORIO PARA CAMBIOS Y RECLAMOS
        </p>
        <p className="text-[8px] text-black mt-0.5 leading-tight font-bold">
          Grabe la apertura del paquete desde el inicio sin cortes ni ediciones.
        </p>
      </div>

      {/* 7. Footer: Metadatos */}
      <div className="border-t-2 border-black pt-1 flex justify-between items-center text-[8.5px] font-black uppercase text-black leading-none">
        <span>VENDEDOR: {sale.vendedor || 'SISTEMA'}</span>
        {hasMultipleBultos && (
          <span className="font-extrabold bg-black text-white px-1.5 py-0.5 rounded">
            BULTO {displayItem.bultoNumero} DE {displayItem.bultoTotal}
          </span>
        )}
        {sale.etiquetador && (
          <span>ETIQUETÓ: {sale.etiquetador}</span>
        )}
        {sale.tipoVenta === 'Live TikTok' && (
          <span className="border border-black px-1 py-0.2 rounded font-mono">TIKTOK LIVE</span>
        )}
      </div>
    </div>
  );
};


