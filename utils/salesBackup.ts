import * as XLSX from 'xlsx';
import { Sale, SaleType } from '../types';

export function normalizeDateToISO(dateStr?: string | null): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  
  // Format YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.substring(0, 10);
  }
  
  // Format DD/MM/YYYY or DD-MM-YYYY
  const slashParts = trimmed.split(/[/.-]/);
  if (slashParts.length === 3) {
    if (slashParts[0].length === 4) {
      // YYYY/MM/DD
      return `${slashParts[0]}-${slashParts[1].padStart(2, '0')}-${slashParts[2].padStart(2, '0')}`;
    } else if (slashParts[2].length === 4) {
      // DD/MM/YYYY
      return `${slashParts[2]}-${slashParts[1].padStart(2, '0')}-${slashParts[0].padStart(2, '0')}`;
    }
  }
  
  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  } catch (e) {}
  
  return trimmed;
}

export function partitionSalesByDate(sales: Sale[], cutoffDate: string) {
  const normCutoff = normalizeDateToISO(cutoffDate);
  
  const toKeep: Sale[] = [];
  const toArchive: Sale[] = [];
  
  for (const s of sales) {
    if (!s) continue;
    const saleDateIso = normalizeDateToISO(s.fecha);
    
    // If date cannot be parsed or is greater or equal to cutoff date, keep it active
    if (!saleDateIso || saleDateIso >= normCutoff) {
      toKeep.push(s);
    } else {
      toArchive.push(s);
    }
  }
  
  return { toKeep, toArchive, normCutoff };
}

export function exportSalesToExcel(sales: Sale[], fileName: string, sheetTitle = 'Ventas_Respaldadas') {
  const data = sales.map(s => {
    let itemsDesglose = '';
    if (s.tipoVenta === SaleType.NOTA_VENTA && s.items && s.items.length > 0) {
      itemsDesglose = s.items.map(i => `${i.codigoFardo} (${i.cantidad} un. x $${i.valorUnitario})`).join(', ');
    } else if (s.codigoFardo) {
      itemsDesglose = `${s.codigoFardo} (${s.cantidad || 1} un. x $${s.valorUnitario || s.total})`;
    }

    return {
      'N_Venta': s.numeroVenta || '',
      'Fecha': s.fecha || '',
      'Hora': s.hora || '',
      'Vendedor': s.vendedor || '',
      'Cliente': s.cliente || '',
      'Telefono': s.telefono || '',
      'RUT': s.rut || '',
      'Tipo_Venta': s.tipoVenta || '',
      'Detalle_Productos': itemsDesglose,
      'Total_CLP': s.total || 0,
      'Estado_Pago': s.estadoPago || 'Pendiente',
      'Tipo_Despacho': s.tipoDespacho || '',
      'Estado_Despacho': s.estadoDespacho || '',
      'Transportista': s.transportista || '',
      'Agencia': s.agencia || '',
      'Fecha_Despacho': s.fechaDespacho || '',
      'Direccion': s.direccion || '',
      'Comprobante': s.comprobante || '',
      'ID_Interno': s.id || ''
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  
  // Set column widths
  const colWidths = [
    { wch: 10 }, // N_Venta
    { wch: 12 }, // Fecha
    { wch: 8 },  // Hora
    { wch: 18 }, // Vendedor
    { wch: 22 }, // Cliente
    { wch: 14 }, // Telefono
    { wch: 14 }, // RUT
    { wch: 14 }, // Tipo_Venta
    { wch: 40 }, // Detalle_Productos
    { wch: 14 }, // Total_CLP
    { wch: 12 }, // Estado_Pago
    { wch: 16 }, // Tipo_Despacho
    { wch: 16 }, // Estado_Despacho
    { wch: 18 }, // Transportista
    { wch: 18 }, // Agencia
    { wch: 18 }, // Fecha_Despacho
    { wch: 30 }, // Direccion
    { wch: 25 }, // Comprobante
    { wch: 15 }  // ID_Interno
  ];
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetTitle.substring(0, 31));

  // Summary sheet
  const totalMonto = sales.reduce((acc, s) => acc + (s.total || 0), 0);
  const summaryData = [
    { 'Métrica': 'Total Registros de Venta', 'Valor': sales.length },
    { 'Métrica': 'Monto Total Acumulado ($CLP)', 'Valor': totalMonto },
    { 'Métrica': 'Fecha de Generación del Respaldo', 'Valor': new Date().toLocaleString('es-CL') }
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen_Totales');

  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

export function exportSalesToJSON(sales: Sale[], fileName: string) {
  const jsonContent = JSON.stringify(sales, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
