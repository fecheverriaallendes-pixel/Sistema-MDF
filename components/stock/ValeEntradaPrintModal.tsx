import React, { useEffect } from 'react';
import { 
  X, 
  Printer, 
  CheckCircle, 
  Package, 
  Truck, 
  User, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  Download, 
  ExternalLink,
  ArrowLeft,
  Boxes
} from 'lucide-react';
import { ValeEntrada } from '../../types';

interface ValeEntradaPrintModalProps {
  vale: ValeEntrada;
  onClose: () => void;
}

export const ValeEntradaPrintModal: React.FC<ValeEntradaPrintModalProps> = ({ vale, onClose }) => {
  // Manejo de tecla Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const formattedDate = (() => {
    try {
      if (!vale.fecha) return new Date().toLocaleDateString('es-CL');
      if (vale.fecha.includes('-')) {
        const [y, m, d] = vale.fecha.split('-');
        return `${d}/${m}/${y}`;
      }
      return vale.fecha;
    } catch {
      return vale.fecha;
    }
  })();

  // Generador de HTML independiente y limpio para impresión infalible
  const generateStandaloneHtml = (autoPrint = false) => {
    const itemsRows = (vale.items || []).map((item, index) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px 10px; font-size: 11px; color: #64748b; font-family: monospace;">${index + 1}</td>
        <td style="padding: 8px 10px; font-size: 12px; font-weight: 800; font-family: monospace; text-transform: uppercase; color: #0f172a;">${item.codigo || '-'}</td>
        <td style="padding: 8px 10px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #0f172a;">${item.tipo || '-'}</td>
        <td style="padding: 8px 10px; font-size: 10px; text-transform: uppercase; color: #475569;">${item.categoria || 'FARDO'} &bull; ${item.unidad || 'FARDO'}</td>
        <td style="padding: 8px 10px; font-size: 10px; text-transform: uppercase; color: #475569;">${item.proveedor || vale.proveedor || 'GENERAL'}</td>
        <td style="padding: 8px 10px; font-size: 13px; font-weight: 900; text-align: center; color: #047857;">+${item.cantidad}</td>
        <td style="padding: 8px 10px; font-size: 11px; text-align: right; font-family: monospace; color: #475569;">${item.precioCosto ? '$' + Number(item.precioCosto).toLocaleString('es-CL') : '-'}</td>
        <td style="padding: 8px 10px; font-size: 11px; text-align: right; font-family: monospace; font-weight: 800; color: #0f172a;">${item.precioSugerido ? '$' + Number(item.precioSugerido).toLocaleString('es-CL') : '-'}</td>
      </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Vale de Entrada ${vale.folio || 'Comprobante'}</title>
  <style>
    @page { size: letter portrait; margin: 12mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 15px; color: #0f172a; background: #fff; line-height: 1.4; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
    .brand { font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; }
    .brand span { color: #059669; font-style: italic; }
    .badge { background: #0f172a; color: #fff; font-size: 9px; font-weight: 900; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; margin-left: 8px; vertical-align: middle; }
    .subtitle { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
    .folio-box { text-align: right; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 12px; }
    .folio-title { font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
    .folio-number { font-size: 24px; font-weight: 900; font-family: monospace; color: #0f172a; margin: 2px 0; }
    .folio-date { font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; }
    .grid-info { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 12px; }
    .card.dark { background: #0f172a; color: #fff; border-color: #0f172a; }
    .card-label { font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .card.dark .card-label { color: #34d399; }
    .card-value { font-size: 13px; font-weight: 900; text-transform: uppercase; }
    .card.dark .card-value { font-size: 18px; color: #fff; }
    .table-container { border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { background: #f1f5f9; padding: 10px; font-size: 9px; font-weight: 900; text-transform: uppercase; color: #475569; border-bottom: 1px solid #cbd5e1; letter-spacing: 0.5px; }
    tfoot tr { background: #f8fafc; border-top: 2px solid #94a3b8; font-weight: 900; font-size: 12px; }
    .obs-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 14px; border-radius: 12px; margin-bottom: 25px; font-size: 11px; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1; }
    .signature-box { text-align: center; }
    .signature-line { border-bottom: 2px solid #0f172a; width: 70%; margin: 0 auto 8px; }
    .sign-name { font-size: 12px; font-weight: 900; text-transform: uppercase; }
    .sign-role { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .footer { font-size: 8px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; display: flex; justify-content: space-between; border-top: 1px solid #f1f5f9; padding-top: 10px; margin-top: 25px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">CUADERNO <span>MDF</span> <span class="badge">RECEPCIÓN</span></div>
      <div class="subtitle">Control Central de Inventario y Bodega &bull; Vale de Entrada Oficial</div>
    </div>
    <div class="folio-box">
      <div class="folio-title">FOLIO DE INGRESO</div>
      <div class="folio-number">${vale.folio || 'VE-0000'}</div>
      <div class="folio-date">Fecha: ${formattedDate} ${vale.hora ? `&bull; ${vale.hora}` : ''}</div>
    </div>
  </div>

  <div class="grid-info">
    <div class="card">
      <div class="card-label">RESPONSABLE DE INGRESO</div>
      <div class="card-value">${vale.responsable || 'NO REGISTRADO'}</div>
    </div>
    <div class="card">
      <div class="card-label">N° CONTENEDOR / CAMIÓN</div>
      <div class="card-value" style="font-family: monospace; color: #2563eb;">${vale.numeroContenedor || 'Sin contenedor'}</div>
    </div>
    <div class="card">
      <div class="card-label">PROVEEDOR / ORIGEN</div>
      <div class="card-value">${vale.proveedor || 'MULTIPLE / GENERAL'}</div>
    </div>
    <div class="card dark">
      <div class="card-label">TOTAL INGRESADO</div>
      <div class="card-value">${vale.totalUnidades} BULTOS</div>
      <div style="font-size: 9px; color: #93c5fd; margin-top: 2px;">${vale.totalArticulos} artículos distintos</div>
    </div>
  </div>

  ${vale.descripcion ? `
  <div class="obs-box" style="background: #ecfdf5; border-color: #a7f3d0; margin-bottom: 15px;">
    <div style="font-size: 9px; font-weight: 900; color: #065f46; text-transform: uppercase; margin-bottom: 4px;">DESCRIPCIÓN DEL CARGAMENTO:</div>
    <div style="font-weight: 700; color: #064e3b; text-transform: uppercase;">${vale.descripcion}</div>
  </div>` : ''}

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Código</th>
          <th>Descripción del Artículo</th>
          <th>Categoría / Unidad</th>
          <th>Proveedor</th>
          <th style="text-align: center;">Cantidad</th>
          <th style="text-align: right;">P. Costo</th>
          <th style="text-align: right;">P. Venta</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="5" style="padding: 10px; text-align: right; text-transform: uppercase; color: #475569;">Total Unidades Ingresadas:</td>
          <td style="padding: 10px; text-align: center; color: #047857; font-size: 14px;">+${vale.totalUnidades}</td>
          <td style="padding: 10px; text-align: right; font-family: monospace; color: #475569;">${vale.totalCostoEstimado ? '$' + Number(vale.totalCostoEstimado).toLocaleString('es-CL') : '-'}</td>
          <td style="padding: 10px; text-align: right; font-family: monospace; color: #0f172a; font-size: 13px;">${vale.totalVentaEstimada ? '$' + Number(vale.totalVentaEstimada).toLocaleString('es-CL') : '-'}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  ${vale.observaciones ? `
  <div class="obs-box">
    <div style="font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">OBSERVACIONES / NOTAS:</div>
    <div style="color: #334155; font-style: italic;">${vale.observaciones}</div>
  </div>` : ''}

  <div class="signatures">
    <div class="signature-box">
      <div class="signature-line"></div>
      <div class="sign-name">${vale.responsable || 'Responsable'}</div>
      <div class="sign-role">Responsable de Ingreso de Mercadería</div>
    </div>
    <div class="signature-box">
      <div class="signature-line"></div>
      <div class="sign-name">Bodega Central &amp; Control</div>
      <div class="sign-role">Recepción y Verificación Física</div>
    </div>
  </div>

  <div class="footer">
    <span>Sistema Cuaderno MDF &bull; Registro ID: ${vale.id || 'N/A'}</span>
    <span>Impreso el ${new Date().toLocaleDateString('es-CL')} a las ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
  </div>

  ${autoPrint ? `
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 300);
    });
  </script>` : ''}
</body>
</html>`;
  };

  // 1. Método de impresión infalible usando un iframe temporal aislado (resuelve bloqueos de iframe)
  const handlePrint = () => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.setAttribute('title', 'Impresión Comprobante Vale de Entrada');
      document.body.appendChild(iframe);

      const htmlContent = generateStandaloneHtml(false);
      const iframeDoc = iframe.contentWindow?.document;

      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (err) {
            console.warn('Iframe print falló, usando window.print():', err);
            window.print();
          } finally {
            setTimeout(() => {
              try {
                document.body.removeChild(iframe);
              } catch {}
            }, 3000);
          }
        }, 300);
      } else {
        window.print();
      }
    } catch (e) {
      console.error('Error al imprimir:', e);
      window.print();
    }
  };

  // 2. Método alternativo: Descargar comprobante HTML listo para abrir e imprimir en cualquier dispositivo
  const handleDownload = () => {
    const htmlContent = generateStandaloneHtml(false);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Comprobante_Vale_Entrada_${vale.folio || 'VE'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 3. Método alternativo: Abrir en pestaña limpia (por si el navegador bloquea modales en iframe)
  const handleOpenNewTab = () => {
    try {
      const htmlContent = generateStandaloneHtml(true);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      console.warn('No se pudo abrir nueva pestaña, usando impresión directa:', e);
      handlePrint();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[100] flex items-start justify-center p-2 sm:p-6 overflow-y-auto"
      onClick={(e) => {
        // Cerrar al hacer clic en el fondo oscuro fuera de la tarjeta
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-[32px] sm:rounded-[40px] shadow-2xl max-w-4xl w-full my-4 sm:my-8 border border-slate-200 print:m-0 print:border-0 print:shadow-none print:rounded-none print:w-full print:max-w-none flex flex-col relative">
        
        {/* HEADER PERMANENTE Y FIJO (NUNCA DESAPARECE NI SE PIERDE AL HACER SCROLL) */}
        <div className="sticky top-0 z-30 p-4 sm:p-6 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 shadow-md rounded-t-[32px] sm:rounded-t-[40px] no-print">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl shrink-0">
              <FileText size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest block">
                Comprobante Oficial de Ingreso
              </span>
              <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                Vale de Entrada #{vale.folio}
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Botón Principal: Imprimir */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
              title="Imprimir Comprobante Oficial"
            >
              <Printer size={16} /> Imprimir Comprobante
            </button>

            {/* Botón Alternativo: Abrir en pestaña limpia */}
            <button
              onClick={handleOpenNewTab}
              className="hidden sm:flex items-center gap-1.5 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
              title="Abrir en pestaña nueva limpia para imprimir"
            >
              <ExternalLink size={14} /> Nueva Pestaña
            </button>

            {/* Botón Alternativo: Descargar HTML / PDF */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
              title="Descargar comprobante en archivo HTML imprimible"
            >
              <Download size={14} /> Descargar
            </button>

            {/* Botón de Cerrar con etiqueta clara y atajo Esc */}
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-3 bg-rose-600/90 hover:bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
              title="Cerrar esta ventana (Tecla Escape)"
            >
              <X size={18} /> Cerrar (Esc)
            </button>
          </div>
        </div>

        {/* CONTENIDO DEL COMPROBANTE (ÁREA OFICIAL IMPRIMIBLE) */}
        <div className="vale-printable-content p-6 sm:p-12 space-y-8 text-slate-900 font-sans bg-white">
          {/* Cabecera del Documento */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b-2 border-slate-900 gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black tracking-tighter text-slate-900 uppercase">
                  CUADERNO <span className="text-emerald-600 italic">MDF</span>
                </span>
                <span className="px-2.5 py-0.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                  RECEPCIÓN
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                Control Central de Inventario y Bodega &bull; Vale de Entrada
              </p>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto bg-slate-50 sm:bg-transparent p-4 sm:p-0 rounded-2xl border sm:border-0 border-slate-200">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">FOLIO DE INGRESO</span>
              <span className="font-mono text-3xl font-black text-slate-900 tracking-wider block">{vale.folio}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase mt-0.5 block">
                Fecha: {formattedDate} {vale.hora ? `• ${vale.hora}` : ''}
              </span>
            </div>
          </div>

          {/* Información Principal en Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                <User size={12} className="text-emerald-600" /> RESPONSABLE DEL INGRESO
              </span>
              <p className="font-black text-slate-900 text-sm uppercase tracking-tight">{vale.responsable || 'NO REGISTRADO'}</p>
              <span className="text-[8px] font-black text-emerald-700 uppercase bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-1">
                Responsable Oficial
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                <Truck size={12} className="text-blue-600" /> N° CONTENEDOR / CAMIÓN
              </span>
              <p className="font-mono font-black text-slate-900 text-sm uppercase tracking-tight">
                {vale.numeroContenedor ? vale.numeroContenedor : <span className="text-slate-400 italic">Sin Contenedor Asignado</span>}
              </p>
              <span className="text-[8px] font-bold text-slate-500 uppercase mt-1 block">
                {vale.numeroContenedor ? 'Cargamento Identificado' : 'Ingreso Local / Directo'}
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                <Package size={12} className="text-purple-600" /> PROVEEDOR / ORIGEN
              </span>
              <p className="font-black text-slate-900 text-sm uppercase tracking-tight">
                {vale.proveedor || 'MULTIPLE / GENERAL'}
              </p>
              <span className="text-[8px] font-bold text-slate-500 uppercase mt-1 block">Origen de Mercadería</span>
            </div>

            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md">
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                <CheckCircle size={12} /> TOTAL INGRESADO
              </span>
              <p className="font-black text-2xl tracking-tight text-white">
                {vale.totalUnidades} <span className="text-xs font-normal text-slate-300">bultos/fardos</span>
              </p>
              <span className="text-[8px] font-bold text-emerald-300 uppercase mt-1 block">
                {vale.totalArticulos} artículos distintos
              </span>
            </div>
          </div>

          {vale.descripcion && (
            <div className="bg-emerald-50/60 border border-emerald-200/60 p-4 rounded-2xl">
              <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest block mb-1">
                Descripción del Cargamento:
              </span>
              <p className="text-xs font-bold text-slate-800 uppercase leading-relaxed">{vale.descripcion}</p>
            </div>
          )}

          {/* Tabla de Artículos Ingresados */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                <Package size={14} className="text-emerald-600" /> Detalle de Artículos y Fardos Ingresados ({vale.items?.length || 0})
              </h4>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-[9px] font-black text-slate-600 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Descripción del Artículo</th>
                    <th className="py-3 px-4">Categoría / Unidad</th>
                    <th className="py-3 px-4">Proveedor</th>
                    <th className="py-3 px-4 text-center">Cantidad</th>
                    <th className="py-3 px-4 text-right">P. Costo</th>
                    <th className="py-3 px-4 text-right">P. Venta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold">
                  {(vale.items || []).map((item, index) => (
                    <tr key={item.id || index} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-slate-400 text-[10px]">{index + 1}</td>
                      <td className="py-3 px-4 font-mono font-black text-slate-900 uppercase text-[11px]">{item.codigo}</td>
                      <td className="py-3 px-4 uppercase text-slate-900 font-extrabold">{item.tipo}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[9px] font-black uppercase text-slate-700">
                          {item.categoria || 'FARDO'} • {item.unidad || 'FARDO'}
                        </span>
                      </td>
                      <td className="py-3 px-4 uppercase text-slate-600 text-[10px]">{item.proveedor || vale.proveedor || 'GENERAL'}</td>
                      <td className="py-3 px-4 text-center font-black text-slate-900 text-sm">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-xl">
                          +{item.cantidad}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {item.precioCosto ? `$${Number(item.precioCosto).toLocaleString('es-CL')}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-900 font-black">
                        {item.precioSugerido ? `$${Number(item.precioSugerido).toLocaleString('es-CL')}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-300 font-black text-xs">
                    <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider text-slate-600">Total Unidades Ingresadas:</td>
                    <td className="py-3 px-4 text-center text-sm font-black text-emerald-700">+{vale.totalUnidades}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {vale.totalCostoEstimado ? `$${vale.totalCostoEstimado.toLocaleString('es-CL')}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-900 text-sm">
                      {vale.totalVentaEstimada ? `$${vale.totalVentaEstimada.toLocaleString('es-CL')}` : '-'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {vale.observaciones && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                Observaciones / Notas Adicionales:
              </span>
              <p className="text-slate-700 italic">{vale.observaciones}</p>
            </div>
          )}

          {/* Firmas de Recepción y Control */}
          <div className="grid grid-cols-2 gap-8 sm:gap-12 pt-14 mt-8 border-t border-dashed border-slate-300">
            <div className="text-center space-y-2">
              <div className="border-b-2 border-slate-900 pb-2 w-3/4 mx-auto"></div>
              <p className="text-xs font-black uppercase text-slate-900 tracking-tight">{vale.responsable}</p>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Responsable de Ingreso de Mercadería</p>
            </div>

            <div className="text-center space-y-2">
              <div className="border-b-2 border-slate-900 pb-2 w-3/4 mx-auto"></div>
              <p className="text-xs font-black uppercase text-slate-900 tracking-tight">Bodega Central & Inventario</p>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Recepción y Verificación Física</p>
            </div>
          </div>

          {/* Pie de Página */}
          <div className="flex justify-between items-center text-[8px] font-bold text-slate-400 uppercase tracking-widest pt-4 border-t border-slate-100">
            <span>Sistema Central de Cuaderno MDF • Registro ID: {vale.id}</span>
            <span>Generado el {new Date().toLocaleDateString('es-CL')} a las {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* FOOTER PERMANENTE Y FIJO: GARANTIZA QUE SIEMPRE HAYA BOTONES ACCESIBLES EN LA PARTE INFERIOR */}
        <div className="sticky bottom-0 z-30 p-4 sm:p-5 bg-slate-900/95 backdrop-blur-md text-white flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 shadow-2xl rounded-b-[32px] sm:rounded-b-[40px] no-print">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-300">
              Comprobante listo &bull; Folio #{vale.folio} ({vale.totalUnidades} unidades)
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
            >
              <Printer size={16} /> Imprimir Comprobante
            </button>

            <button
              onClick={handleDownload}
              className="hidden sm:flex items-center gap-1.5 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              <Download size={14} /> Guardar Copia
            </button>

            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              <X size={16} /> Cerrar
            </button>
          </div>
        </div>

      </div>

      {/* ESTILOS GLOBALES DE IMPRESIÓN PARA EL VALE DE ENTRADA */}
      <style>{`
        @media print {
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            visibility: hidden !important;
          }
          .vale-printable-content, .vale-printable-content * {
            visibility: visible !important;
          }
          .vale-printable-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 12mm !important;
            background: white !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .no-print, .no-print * {
            display: none !important;
            visibility: hidden !important;
          }
          html, body, #root, #root > div, main {
            height: auto !important;
            overflow: visible !important;
            max-height: none !important;
          }
        }
      `}</style>
    </div>
  );
};
