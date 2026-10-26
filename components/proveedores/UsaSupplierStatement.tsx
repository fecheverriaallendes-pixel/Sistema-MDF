import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Calendar, 
  Ship, 
  ArrowDownRight, 
  ArrowUpRight,
  Filter,
  Layers,
  FileSpreadsheet,
  ExternalLink,
  Eye,
  X,
  Coins,
  Compass
} from 'lucide-react';
import { useStore } from '../../store/GlobalContext';
import { UsaPurchase, Purchase } from '../../types';

interface StatementEntry {
  id: string;
  fecha: string;
  tipo: 'CARGO_FACTURA' | 'PAGO_ABONO';
  descripcion: string;
  referencia: string;
  notasClp: string;
  tipoCambio?: number;
  cargo: number;
  abono: number;
  saldo: number;
  moneda: 'USD' | 'CLP';
}

export default function UsaSupplierStatement() {
  const { usaPurchases, purchases, currentUser, playSound } = useStore();

  // Mode: USA (USD) or Nacional (CLP)
  const [statementScope, setStatementScope] = useState<'USA' | 'NACIONAL'>('USA');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('TODOS');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [exchangeRateRef, setExchangeRateRef] = useState<number>(950);
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  // Extract unique USA suppliers
  const usaSuppliers = useMemo(() => {
    const set = new Set<string>();
    usaPurchases.forEach(p => {
      if (p.proveedor) set.add(p.proveedor.trim().toUpperCase());
    });
    return Array.from(set).sort();
  }, [usaPurchases]);

  // Extract unique Domestic suppliers
  const domesticSuppliers = useMemo(() => {
    const set = new Set<string>();
    (purchases || []).forEach(p => {
      if (p.proveedor) set.add(p.proveedor.trim().toUpperCase());
    });
    return Array.from(set).sort();
  }, [purchases]);

  const currentSuppliersList = statementScope === 'USA' ? usaSuppliers : domesticSuppliers;

  // Build sorted chronological statement ledger
  const statementLedger = useMemo(() => {
    const rawEvents: Array<{
      id: string;
      fecha: string;
      tipo: 'CARGO_FACTURA' | 'PAGO_ABONO';
      descripcion: string;
      referencia: string;
      notasClp: string;
      tipoCambio?: number;
      cargo: number;
      abono: number;
      moneda: 'USD' | 'CLP';
    }> = [];

    if (statementScope === 'USA') {
      const filtered = usaPurchases.filter(p => {
        if (selectedSupplier !== 'TODOS' && p.proveedor.trim().toUpperCase() !== selectedSupplier) {
          return false;
        }
        return true;
      });

      filtered.forEach(p => {
        // Cargo por Factura / Contenedor
        rawEvents.push({
          id: `charge-${p.id}`,
          fecha: p.fecha || '2025-01-01',
          tipo: 'CARGO_FACTURA',
          descripcion: p.descripcion || `Contenedor ${p.numeroContenedor || ''}`,
          referencia: p.numeroContenedor ? `CONT: ${p.numeroContenedor}${p.facturaInvoice ? ` / INV: ${p.facturaInvoice}` : ''}` : (p.facturaInvoice || 'INVOICE'),
          notasClp: p.notasClp || (p.tipoCambioRef ? `TC Ref: $${p.tipoCambioRef}` : ''),
          tipoCambio: p.tipoCambioRef,
          cargo: Number(p.montoTotalUsd) || 0,
          abono: 0,
          moneda: 'USD'
        });

        // Abonos / Pagos SWIFT
        (p.abonos || []).forEach(a => {
          rawEvents.push({
            id: `payment-${a.id}`,
            fecha: a.fecha || p.fecha,
            tipo: 'PAGO_ABONO',
            descripcion: `Pago ${a.metodo}${a.observacion ? ` - ${a.observacion}` : ''}`,
            referencia: a.referencia ? `SWIFT/Ref: ${a.referencia}` : `Pago ${p.numeroContenedor || ''}`,
            notasClp: a.notaClp || (a.montoClp ? `$${a.montoClp.toLocaleString('es-CL')} CLP` : ''),
            tipoCambio: a.tipoCambio,
            cargo: 0,
            abono: Number(a.montoUsd) || 0,
            moneda: 'USD'
          });
        });
      });
    } else {
      // Nacional (CLP)
      const filtered = (purchases || []).filter(p => {
        if (selectedSupplier !== 'TODOS' && p.proveedor.trim().toUpperCase() !== selectedSupplier) {
          return false;
        }
        return true;
      });

      filtered.forEach(p => {
        // Compra / Factura nacional
        rawEvents.push({
          id: `charge-dom-${p.id}`,
          fecha: p.fecha || '2025-01-01',
          tipo: 'CARGO_FACTURA',
          descripcion: `${p.tipo || 'Nota de Venta'} - ${p.descripcion || 'Compra Local'}`,
          referencia: p.proveedor || 'Nacional',
          notasClp: p.notas || '',
          cargo: Number(p.montoTotal) || 0,
          abono: 0,
          moneda: 'CLP'
        });

        // Abonos
        (p.abonos || []).forEach(a => {
          rawEvents.push({
            id: `payment-dom-${a.id}`,
            fecha: a.fecha || p.fecha,
            tipo: 'PAGO_ABONO',
            descripcion: `Abono ${a.metodo}${a.observacion ? ` - ${a.observacion}` : ''}`,
            referencia: p.proveedor || 'Comprobante',
            notasClp: a.observacion || '',
            cargo: 0,
            abono: Number(a.monto) || 0,
            moneda: 'CLP'
          });
        });
      });
    }

    // Ordenar cronológicamente ascendente
    rawEvents.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    // Filtrar por fechas
    const dateFiltered = rawEvents.filter(ev => {
      if (startDate && ev.fecha < startDate) return false;
      if (endDate && ev.fecha > endDate) return false;
      return true;
    });

    // Calcular saldo acumulado en línea
    let runningBalance = 0;
    const ledgerWithBalance: StatementEntry[] = dateFiltered.map(ev => {
      runningBalance += (ev.cargo - ev.abono);
      return {
        ...ev,
        saldo: Number(runningBalance.toFixed(2))
      };
    });

    return ledgerWithBalance;
  }, [statementScope, usaPurchases, purchases, selectedSupplier, startDate, endDate]);

  const totalCargos = statementLedger.reduce((acc, ev) => acc + ev.cargo, 0);
  const totalAbonos = statementLedger.reduce((acc, ev) => acc + ev.abono, 0);
  const saldoFinal = Math.max(0, totalCargos - totalAbonos);
  const isUsd = statementScope === 'USA';
  const saldoFinalClpRef = isUsd ? Math.round(saldoFinal * exchangeRateRef) : saldoFinal;

  // Generador de HTML independiente y limpio para impresión 100% vectorial sin cortes
  const generateStandaloneHtml = (orientation: 'portrait' | 'landscape' = printOrientation, autoPrint = false) => {
    const isLandscape = orientation === 'landscape';
    const currencySymbol = isUsd ? 'USD $' : '$ CLP';
    const formatAmount = (val: number) => {
      if (isUsd) {
        return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      return '$' + Math.round(val).toLocaleString('es-CL');
    };

    const tableRows = statementLedger.map((item, idx) => {
      const isCharge = item.tipo === 'CARGO_FACTURA';
      const bgColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      const typeBadge = isCharge 
        ? `<span style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">${isUsd ? 'Factura / Contenedor' : 'Factura / Compra'}</span>`
        : `<span style="background: #dcfce7; color: #15803d; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">${isUsd ? 'Wire Transfer' : 'Abono / Pago'}</span>`;

      return `
        <tr style="background: ${bgColor}; border-bottom: 1px solid #e2e8f0; page-break-inside: avoid; break-inside: avoid;">
          <td style="padding: 7px 10px; font-weight: 700; white-space: nowrap; font-size: 11px; color: #334155;">${item.fecha}</td>
          <td style="padding: 7px 10px; font-size: 11px;">
            <div style="margin-bottom: 2px;">${typeBadge}</div>
            <strong style="color: #0f172a; font-size: 11px;">${item.descripcion}</strong>
          </td>
          <td style="padding: 7px 10px; font-family: monospace; font-size: 11px; color: #475569; font-weight: 700;">${item.referencia || '-'}</td>
          <td style="padding: 7px 10px; font-size: 10px; color: #64748b; font-style: italic;">${item.notasClp || '-'}</td>
          <td style="padding: 7px 10px; text-align: right; font-weight: 800; font-size: 11px; font-family: monospace; color: #0f172a;">${item.cargo > 0 ? formatAmount(item.cargo) : '-'}</td>
          <td style="padding: 7px 10px; text-align: right; font-weight: 800; font-size: 11px; font-family: monospace; color: #16a34a;">${item.abono > 0 ? '-' + formatAmount(item.abono) : '-'}</td>
          <td style="padding: 7px 10px; text-align: right; font-weight: 900; font-size: 12px; font-family: monospace; color: #0f172a; background: ${idx % 2 === 0 ? '#f1f5f9' : '#e2e8f0'};">${formatAmount(item.saldo)}</td>
        </tr>
      `;
    }).join('');

    const formattedDateRange = startDate && endDate 
      ? `Período: ${startDate} al ${endDate}` 
      : startDate 
        ? `Desde: ${startDate}` 
        : endDate 
          ? `Hasta: ${endDate}` 
          : 'Historial Completo de Movimientos';

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Statement_${selectedSupplier.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}</title>
  <style>
    @page {
      size: letter ${isLandscape ? 'landscape' : 'portrait'};
      margin: 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 10px;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.35;
      font-size: 11px;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .brand-title span {
      color: #059669;
      font-style: italic;
    }
    .badge {
      background: #0f172a;
      color: #ffffff;
      font-size: 9px;
      font-weight: 900;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      margin-left: 6px;
      vertical-align: middle;
    }
    .subtitle {
      font-size: 10px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 3px;
    }
    .meta-box {
      text-align: right;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 8px 14px;
      border-radius: 10px;
      min-width: 240px;
    }
    .meta-label {
      font-size: 8px;
      font-weight: 900;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .meta-supplier {
      font-size: 15px;
      font-weight: 900;
      text-transform: uppercase;
      color: #0f172a;
      margin: 2px 0;
    }
    .meta-date {
      font-size: 9px;
      font-weight: 700;
      color: #475569;
    }
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 14px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 10px 12px;
      border-radius: 10px;
    }
    .card.dark {
      background: #0f172a;
      color: #ffffff;
      border-color: #0f172a;
    }
    .card-label {
      font-size: 8px;
      font-weight: 900;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .card.dark .card-label {
      color: #34d399;
    }
    .card-value {
      font-size: 18px;
      font-weight: 900;
      font-family: monospace;
    }
    .card.dark .card-value {
      color: #ffffff;
    }
    .table-container {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    thead {
      display: table-header-group;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      padding: 8px 10px;
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    tfoot tr {
      background: #f1f5f9;
      border-top: 2px solid #0f172a;
      font-weight: 900;
    }
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 50px;
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px dashed #cbd5e1;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .sig-box {
      text-align: center;
    }
    .sig-line {
      border-bottom: 2px solid #0f172a;
      width: 70%;
      margin: 0 auto 6px;
    }
    .sig-title {
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
    }
    .sig-subtitle {
      font-size: 8px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .footer {
      margin-top: 15px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 8px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="brand-title">CUADERNO <span>MDF</span> <span class="badge">FINANZAS & COMEX</span></h1>
      <div class="subtitle">Estado de Cuenta Oficial de Proveedores &bull; ${isUsd ? 'Importaciones USA (USD $)' : 'Facturación Nacional (CLP $)'}</div>
      <div style="font-size: 9px; font-weight: 700; color: #64748b; margin-top: 2px;">${formattedDateRange}</div>
    </div>
    <div class="meta-box">
      <div class="meta-label">Proveedor / Contraparte</div>
      <div class="meta-supplier">${selectedSupplier === 'TODOS' ? (isUsd ? 'CONSOLIDADO GENERAL USA' : 'CONSOLIDADO GENERAL NACIONAL') : selectedSupplier}</div>
      <div class="meta-date">Fecha Emisión: ${new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>
  </div>

  <div class="cards-grid">
    <div class="card">
      <div class="card-label">Total Facturado / Compras</div>
      <div class="card-value" style="color: #0f172a;">${formatAmount(totalCargos)}</div>
    </div>
    <div class="card" style="background: #f0fdf4; border-color: #bbf7d0;">
      <div class="card-label" style="color: #166534;">Total Pagado / Abonos</div>
      <div class="card-value" style="color: #15803d;">${formatAmount(totalAbonos)}</div>
    </div>
    <div class="card" style="background: #fffbeb; border-color: #fde68a;">
      <div class="card-label" style="color: #92400e;">Saldo Pendiente Deudor</div>
      <div class="card-value" style="color: #b45309;">${formatAmount(saldoFinal)}</div>
    </div>
    <div class="card dark">
      <div class="card-label">${isUsd ? 'Equivalente en Pesos (CLP)' : 'Moneda Oficial'}</div>
      <div class="card-value" style="color: #34d399;">${isUsd ? '~$' + saldoFinalClpRef.toLocaleString('es-CL') : '$' + saldoFinal.toLocaleString('es-CL') + ' CLP'}</div>
      ${isUsd ? `<div style="font-size: 8px; color: #94a3b8; font-weight: 700; margin-top: 2px;">TC Referencia: $${exchangeRateRef} CLP/USD</div>` : ''}
    </div>
  </div>

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th style="width: 80px;">Fecha</th>
          <th>Tipo / Operación</th>
          <th>Referencia / B/L / Doc</th>
          <th>Notas / Detalle Conversión</th>
          <th style="text-align: right; width: 110px;">Cargo (+)</th>
          <th style="text-align: right; width: 110px;">Abono (-)</th>
          <th style="text-align: right; width: 120px;">Balance Acumulado</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows.length > 0 ? tableRows : `
          <tr>
            <td colspan="7" style="text-align: center; padding: 25px; color: #94a3b8; font-style: italic;">
              No se registran movimientos para los criterios seleccionados.
            </td>
          </tr>
        `}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="4" style="padding: 10px; text-align: right; text-transform: uppercase; font-size: 10px; color: #475569;">Totales Finales Consolidados:</td>
          <td style="padding: 10px; text-align: right; font-family: monospace; font-size: 12px; color: #0f172a;">${formatAmount(totalCargos)}</td>
          <td style="padding: 10px; text-align: right; font-family: monospace; font-size: 12px; color: #16a34a;">-${formatAmount(totalAbonos)}</td>
          <td style="padding: 10px; text-align: right; font-family: monospace; font-size: 13px; color: #b45309;">${formatAmount(saldoFinal)}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <div class="signatures">
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-title">Finanzas &amp; Operaciones MDF</div>
      <div class="sig-subtitle">Control Central de Pagos y Comercio Exterior</div>
    </div>
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-title">${selectedSupplier === 'TODOS' ? 'Contraparte Comercial' : selectedSupplier}</div>
      <div class="sig-subtitle">Conformidad de Estado de Cuenta &amp; Saldos</div>
    </div>
  </div>

  <div class="footer">
    <span>Documento Oficial Generado por Cuaderno MDF &bull; Usuario: ${(currentUser?.nombre || 'Administración').toUpperCase()}</span>
    <span>Impreso el ${new Date().toLocaleDateString('es-CL')} a las ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; Página 1 de 1</span>
  </div>

  ${autoPrint ? `
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 350);
    });
  </script>` : ''}
</body>
</html>`;
  };

  // 1. Método infalible de impresión aislada en iframe (nunca recorta, no es imagen, es 100% vectorial)
  const handlePrintIsolated = (orientation: 'portrait' | 'landscape' = printOrientation) => {
    playSound('click');
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.setAttribute('title', 'Impresión Statement Proveedor');
      document.body.appendChild(iframe);

      const htmlContent = generateStandaloneHtml(orientation, false);
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
        }, 350);
      } else {
        window.print();
      }
    } catch (e) {
      console.error('Error al imprimir statement:', e);
      window.print();
    }
  };

  // 2. Abrir en pestaña limpia (Ideal para guardar en PDF sin recortes del navegador)
  const handleOpenPdfTab = (orientation: 'portrait' | 'landscape' = printOrientation) => {
    playSound('click');
    try {
      const htmlContent = generateStandaloneHtml(orientation, true);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      console.warn('Error al abrir pestaña limpia:', e);
      handlePrintIsolated(orientation);
    }
  };

  // 3. Descargar archivo HTML listo para abrir o archivar
  const handleDownloadHtml = (orientation: 'portrait' | 'landscape' = printOrientation) => {
    playSound('click');
    const htmlContent = generateStandaloneHtml(orientation, false);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Statement_${selectedSupplier.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 4. Exportar tabla a formato Excel / CSV
  const handleExportCsv = () => {
    playSound('click');
    const headers = ['Fecha', 'Tipo Operacion', 'Descripcion', 'Referencia / Documento', 'Notas / CLP', 'Cargo', 'Abono', 'Saldo Acumulado', 'Moneda'];
    const rows = statementLedger.map(item => [
      `"${item.fecha}"`,
      `"${item.tipo}"`,
      `"${item.descripcion.replace(/"/g, '""')}"`,
      `"${item.referencia.replace(/"/g, '""')}"`,
      `"${(item.notasClp || '').replace(/"/g, '""')}"`,
      item.cargo,
      item.abono,
      item.saldo,
      `"${item.moneda}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Statement_${selectedSupplier.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Control Bar: Filters & Actions (hidden on print) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm no-print space-y-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-lg">
                Reporte Financiero Oficial
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-bold text-slate-500 uppercase">
                {isUsd ? 'Dólares (USD $) & Conversión' : 'Facturación Local (CLP $)'}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <FileText size={22} className="text-emerald-600" />
              Statement / Estado de Cuenta de Proveedores
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Extracto de balance, registro de transferencias, facturas y saldos deudores listos para imprimir o guardar en PDF.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Primary Print Button */}
            <button
              onClick={() => handlePrintIsolated(printOrientation)}
              className="flex-1 sm:flex-initial px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase rounded-2xl tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer"
              title="Imprimir directamente sin cortes de página"
            >
              <Printer size={16} /> Imprimir Statement
            </button>

            {/* Save as PDF / Clean Tab */}
            <button
              onClick={() => handleOpenPdfTab(printOrientation)}
              className="flex-1 sm:flex-initial px-4 py-3 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase rounded-2xl tracking-wider transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 cursor-pointer"
              title="Abrir en pestaña nueva limpia para Guardar como PDF"
            >
              <ExternalLink size={15} /> Guardar PDF
            </button>

            {/* Vista Previa Modal */}
            <button
              onClick={() => { playSound('click'); setShowPreviewModal(true); }}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase rounded-2xl tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              title="Vista previa y opciones de orientación"
            >
              <Eye size={15} /> Vista Previa
            </button>

            {/* Export CSV / Excel */}
            <button
              onClick={handleExportCsv}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase rounded-2xl tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              title="Descargar datos en formato Excel / CSV"
            >
              <FileSpreadsheet size={15} className="text-emerald-600" /> Excel
            </button>
          </div>
        </div>

        {/* Scope selector & filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
          {/* Scope Selector: USA (USD) vs Nacional (CLP) */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
              Tipo de Proveedor
            </label>
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => { setStatementScope('USA'); setSelectedSupplier('TODOS'); }}
                className={`flex-1 py-2 text-[11px] font-black uppercase rounded-xl transition-all ${
                  statementScope === 'USA' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                USA (USD $)
              </button>
              <button
                type="button"
                onClick={() => { setStatementScope('NACIONAL'); setSelectedSupplier('TODOS'); }}
                className={`flex-1 py-2 text-[11px] font-black uppercase rounded-xl transition-all ${
                  statementScope === 'NACIONAL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Nacional (CLP)
              </button>
            </div>
          </div>

          {/* Supplier selector */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
              Proveedor
            </label>
            <select
              className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xs text-slate-800 outline-none focus:border-emerald-500"
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
            >
              <option value="TODOS">
                {statementScope === 'USA' ? 'TODOS LOS PROVEEDORES USA' : 'TODOS LOS PROVEEDORES NACIONALES'}
              </option>
              {currentSuppliersList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Date from */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
              Fecha Desde
            </label>
            <input
              type="date"
              className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-xs text-slate-800 outline-none focus:border-emerald-500"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* Date to */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
              Fecha Hasta
            </label>
            <input
              type="date"
              className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-xs text-slate-800 outline-none focus:border-emerald-500"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Reference TC or Orientation */}
          <div>
            {isUsd ? (
              <>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  TC Ref. (CLP/USD)
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xs text-emerald-700 outline-none focus:border-emerald-500"
                  value={exchangeRateRef}
                  onChange={(e) => setExchangeRateRef(Number(e.target.value) || 1)}
                  placeholder="950"
                />
              </>
            ) : (
              <>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Orientación Impresión
                </label>
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setPrintOrientation('portrait')}
                    className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-xl ${
                      printOrientation === 'portrait' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Vertical
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintOrientation('landscape')}
                    className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-xl ${
                      printOrientation === 'landscape' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Horizontal
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Statement Document Card (Optimized for Screen & Print) */}
      <div className="statement-print-zone bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 space-y-6 print:p-0 print:border-none print:shadow-none print:w-full">
        {/* Official Statement Header */}
        <div className="border-b-2 border-slate-900 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500 text-white text-xs font-black px-2 py-0.5 rounded-lg">MDF</span>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                CUADERNO MDF <span className="text-emerald-600 italic">IMPORTS &amp; FINANZAS</span>
              </h2>
            </div>
            <p className="text-[11px] text-slate-600 font-bold uppercase mt-1">
              Estado de Cuenta Oficial de Proveedores &bull; {isUsd ? 'Comercio Exterior (USD $)' : 'Facturación Nacional (CLP $)'}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              Chile • Operaciones de Importación, Contenedores y Proveedores Locales
            </p>
          </div>

          <div className="text-left md:text-right bg-slate-50 p-4 rounded-2xl border border-slate-200 min-w-[240px]">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Proveedor Seleccionado</p>
            <p className="text-base font-black text-slate-900 uppercase mt-0.5">
              {selectedSupplier === 'TODOS' ? (isUsd ? 'Consolidado General USA' : 'Consolidado General Nacional') : selectedSupplier}
            </p>
            <p className="text-[10px] text-slate-500 font-bold mt-1">
              Fecha Emisión: {new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Statement Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
              {isUsd ? 'Total Facturado (USD)' : 'Total Compras (CLP)'}
            </p>
            <p className="text-xl font-black text-slate-900 font-mono">
              {isUsd 
                ? `$${totalCargos.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `$${Math.round(totalCargos).toLocaleString('es-CL')}`
              }
            </p>
          </div>

          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
            <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-1">
              {isUsd ? 'Total Pagado / Abonos (USD)' : 'Total Pagado / Abonos (CLP)'}
            </p>
            <p className="text-xl font-black text-emerald-700 font-mono">
              {isUsd 
                ? `$${totalAbonos.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `$${Math.round(totalAbonos).toLocaleString('es-CL')}`
              }
            </p>
          </div>

          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <p className="text-[9px] font-black text-amber-800 uppercase tracking-widest mb-1">
              Saldo Deudor Pendiente
            </p>
            <p className="text-xl font-black text-amber-800 font-mono">
              {isUsd 
                ? `$${saldoFinal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
                : `$${Math.round(saldoFinal).toLocaleString('es-CL')} CLP`
              }
            </p>
          </div>

          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
              {isUsd ? 'Equiv. Estimado (CLP)' : 'Estado General'}
            </p>
            <p className="text-xl font-black text-emerald-400 font-mono">
              {isUsd 
                ? `~$${saldoFinalClpRef.toLocaleString('es-CL')}`
                : (saldoFinal > 0 ? 'CON SALDO PENDIENTE' : 'AL DÍA')
              }
            </p>
            {isUsd && (
              <p className="text-[9px] text-slate-400 font-bold">TC Ref: ${exchangeRateRef}</p>
            )}
          </div>
        </div>

        {/* Chronological Ledger Table */}
        <div className="statement-scroll-wrapper overflow-x-auto print:overflow-visible">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white border-b border-slate-800">
                <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider">Tipo / Operación</th>
                <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider">Referencia / B/L</th>
                <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider">
                  {isUsd ? 'Notas / Detalle CLP' : 'Observaciones'}
                </th>
                <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-right">Cargo (+)</th>
                <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-right">Abono (-)</th>
                <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-right">Balance Acumulado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {statementLedger.map((item) => {
                const isCharge = item.tipo === 'CARGO_FACTURA';
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors print:hover:bg-transparent">
                    <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">
                      {item.fecha}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {isCharge ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-blue-100 text-blue-800">
                            <Ship size={10} /> {isUsd ? 'Factura Contenedor' : 'Factura / Compra'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                            <CheckCircle2 size={10} /> {isUsd ? 'Wire Transfer' : 'Abono'}
                          </span>
                        )}
                        <span className="font-bold text-slate-700">{item.descripcion}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-600 text-[11px]">
                      {item.referencia}
                    </td>
                    <td className="px-4 py-3 text-slate-600 italic">
                      {item.notasClp || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-slate-900 font-mono">
                      {item.cargo > 0 
                        ? (isUsd ? `$${item.cargo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$${Math.round(item.cargo).toLocaleString('es-CL')}`)
                        : '-'
                      }
                    </td>
                    <td className="px-4 py-3 text-right font-black text-emerald-600 font-mono">
                      {item.abono > 0 
                        ? (isUsd ? `-$${item.abono.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `-$${Math.round(item.abono).toLocaleString('es-CL')}`)
                        : '-'
                      }
                    </td>
                    <td className="px-4 py-3 text-right font-black text-slate-900 text-sm font-mono">
                      {isUsd 
                        ? `$${item.saldo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : `$${Math.round(item.saldo).toLocaleString('es-CL')}`
                      }
                    </td>
                  </tr>
                );
              })}

              {statementLedger.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 italic">
                    No se registran movimientos para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-300 font-black">
                <td colSpan={4} className="px-4 py-4 uppercase text-slate-800 text-right">
                  Totales Consolidados:
                </td>
                <td className="px-4 py-4 text-right text-slate-900 text-sm font-mono">
                  {isUsd 
                    ? `$${totalCargos.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : `$${Math.round(totalCargos).toLocaleString('es-CL')}`
                  }
                </td>
                <td className="px-4 py-4 text-right text-emerald-600 text-sm font-mono">
                  {isUsd 
                    ? `-$${totalAbonos.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : `-$${Math.round(totalAbonos).toLocaleString('es-CL')}`
                  }
                </td>
                <td className="px-4 py-4 text-right text-amber-700 text-base font-mono">
                  {isUsd 
                    ? `$${saldoFinal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
                    : `$${Math.round(saldoFinal).toLocaleString('es-CL')} CLP`
                  }
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Statement Footer */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-400 font-bold uppercase gap-2">
          <span>Statement emitido por Sistema Cuaderno MDF</span>
          <span>{isUsd ? 'Valores expresados en Dólares Americanos (USD $)' : 'Valores expresados en Pesos Chilenos (CLP $)'}</span>
        </div>
      </div>

      {/* Modal de Vista Previa / Opciones de Impresión */}
      {showPreviewModal && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPreviewModal(false);
          }}
        >
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Printer size={20} />
                </div>
                <div>
                  <h4 className="text-base font-black uppercase tracking-tight">
                    Impresión y Exportación de Statement
                  </h4>
                  <p className="text-xs text-slate-400">
                    Configuración de formato, orientación y descarga de documento oficial
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body / Settings */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Orientación de Página
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPrintOrientation('landscape')}
                      className={`py-3 px-3 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        printOrientation === 'landscape'
                          ? 'bg-slate-900 text-white shadow-md'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Compass size={14} className="rotate-90" /> Horizontal (Recomendado)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintOrientation('portrait')}
                      className={`py-3 px-3 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        printOrientation === 'portrait'
                          ? 'bg-slate-900 text-white shadow-md'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Compass size={14} /> Vertical
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Horizontal permite que todas las columnas (cargos, abonos, notas CLP) quepan holgadamente en una sola hoja sin cortar márgenes.
                  </p>
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                  <label className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">
                    Resumen del Documento
                  </label>
                  <div className="text-xs text-emerald-950 space-y-1 font-bold">
                    <p>• Proveedor: <span className="uppercase font-black">{selectedSupplier}</span></p>
                    <p>• Movimientos: <span>{statementLedger.length} registros</span></p>
                    <p>• Saldo Pendiente: <span className="font-mono font-black">{isUsd ? `$${saldoFinal.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD` : `$${saldoFinal.toLocaleString('es-CL')} CLP`}</span></p>
                    {isUsd && (
                      <p className="text-[11px] text-emerald-700">• Equiv. CLP: ~${saldoFinalClpRef.toLocaleString('es-CL')} (TC ${exchangeRateRef})</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-inner">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
                  <span>Previsualización del Documento Limpio</span>
                  <span>Formato Vectorial &bull; {printOrientation === 'landscape' ? 'Horizontal' : 'Vertical'}</span>
                </div>
                <div className="p-4 bg-slate-50 max-h-72 overflow-y-auto">
                  <div className="bg-white p-6 shadow-sm border border-slate-200 rounded-xl space-y-4 text-xs scale-[0.9] origin-top">
                    <div className="flex justify-between border-b pb-3">
                      <div>
                        <strong className="text-sm font-black uppercase">CUADERNO MDF IMPORTS</strong>
                        <div className="text-[10px] text-slate-400 uppercase">Estado de Cuenta de Proveedor</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black uppercase">{selectedSupplier}</div>
                        <div className="text-[10px] text-slate-400">{new Date().toLocaleDateString('es-CL')}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div className="bg-slate-50 p-2 rounded">Cargos: <strong className="font-mono">{isUsd ? `$${totalCargos.toFixed(2)}` : `$${Math.round(totalCargos)}`}</strong></div>
                      <div className="bg-emerald-50 p-2 rounded text-emerald-800">Abonos: <strong className="font-mono">{isUsd ? `$${totalAbonos.toFixed(2)}` : `$${Math.round(totalAbonos)}`}</strong></div>
                      <div className="bg-amber-50 p-2 rounded text-amber-800">Saldo: <strong className="font-mono">{isUsd ? `$${saldoFinal.toFixed(2)}` : `$${Math.round(saldoFinal)}`}</strong></div>
                    </div>
                    <div className="text-[10px] text-slate-500 italic text-center">
                      ... {statementLedger.length} movimientos ordenados cronológicamente con formato listo para imprimir ...
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleDownloadHtml(printOrientation)}
                className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-black text-xs uppercase rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={14} /> Guardar Archivo HTML
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs uppercase rounded-xl transition-all cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPreviewModal(false);
                    handleOpenPdfTab(printOrientation);
                  }}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase rounded-xl transition-all flex items-center gap-2 shadow cursor-pointer"
                >
                  <ExternalLink size={14} /> Abrir Pestaña PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPreviewModal(false);
                    handlePrintIsolated(printOrientation);
                  }}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  <Printer size={15} /> Imprimir Ahora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS overrides for Print Media specific to Statement */}
      <style>{`
        @media print {
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print, .no-print * {
            display: none !important;
            visibility: hidden !important;
          }
          .statement-print-zone {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          .statement-scroll-wrapper {
            overflow: visible !important;
            width: 100% !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          thead {
            display: table-header-group !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
