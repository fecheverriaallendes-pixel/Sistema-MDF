import { Sale, SaleStatus, DispatchStatus } from '../types';
import { cleanRut, exactMatchRut } from './rutUtils';
import { getTotalBultos } from './labelUtils';

/**
 * Utility functions for identifying, analyzing, and grouping multiple pending/undispatched sales 
 * for the same client across different WhatsApp sellers, preventing partial shipments and missing goods.
 */

export interface ClientMatchResult {
  isMatch: boolean;
  reason?: 'RUT' | 'TELEFONO' | 'NOMBRE';
  detail?: string;
}

export interface RelatedPendingSale {
  sale: Sale;
  matchReason: 'RUT' | 'TELEFONO' | 'NOMBRE';
  bultos: number;
  esMismaVendedora: boolean;
}

export interface PendingSalesAnalysis {
  hasPendingPurchases: boolean;
  totalPendingCount: number;
  totalPendingBultos: number;
  totalPendingMonto: number;
  relatedSales: RelatedPendingSale[];
  distinctVendedoras: string[];
  hasDifferentVendedora: boolean;
  matchReasons: Array<'RUT' | 'TELEFONO' | 'NOMBRE'>;
  alreadyPrintedSalesCount: number;
  unprintedSalesCount: number;
  allGroupSales: Sale[];
  totalGroupBultos: number;
  totalGroupMonto: number;
  isAlreadyConsolidated: boolean;
}

/**
 * Cleans phone number for Chilean WhatsApp comparisons.
 * Extracts last 8 or 9 digits, ignoring prefixes like +56, 56, etc.
 * Rejects dummy numbers (all identical digits, too short, etc.)
 */
export const cleanPhoneForComparison = (rawPhone?: string): string => {
  if (!rawPhone) return '';
  const digits = rawPhone.toString().replace(/\D/g, '');
  if (digits.length < 8) return '';
  
  // Extract last 8 digits (Chilean local mobile number without initial 9 or with 9)
  const last8 = digits.slice(-8);
  
  // Check if it's a dummy number like 00000000, 11111111, 12345678, etc.
  if (/^(\d)\1+$/.test(last8)) return '';
  if (last8 === '12345678' || last8 === '87654321') return '';
  
  return last8;
};

/**
 * Normalizes client name for comparison.
 */
export const normalizeClientName = (rawName?: string): string => {
  if (!rawName) return '';
  return rawName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Determines whether a sale is pending dispatch (no despachada aún).
 */
export const isSaleUndispatched = (sale: Sale): boolean => {
  if (!sale) return false;
  if (sale.status === SaleStatus.ENVIADO || sale.enviado === true) return false;
  if (
    sale.estadoDespacho === DispatchStatus.ENTREGADO || 
    sale.estadoDespacho === DispatchStatus.EN_RUTA
  ) {
    return false;
  }
  return true;
};

/**
 * Checks if two client identifiers belong to the same client.
 * Priority: 1) Chilean RUT (strict exact match)
 *           2) Cleaned WhatsApp Phone Number
 *           3) Normalized Client Name (only if RUTs do not contradict)
 */
export const isSameClient = (
  clientA: { rut?: string; telefono?: string; cliente?: string },
  clientB: { rut?: string; telefono?: string; cliente?: string }
): ClientMatchResult => {
  // 1. RUT match (most reliable)
  const cleanA = cleanRut(clientA.rut);
  const cleanB = cleanRut(clientB.rut);
  const validRutA = cleanA.length >= 7 && cleanA.length <= 10;
  const validRutB = cleanB.length >= 7 && cleanB.length <= 10;

  if (validRutA && validRutB) {
    if (cleanA === cleanB) {
      return { isMatch: true, reason: 'RUT', detail: `Coincide RUT exacto: ${cleanA}` };
    } else {
      // Both have valid but DIFFERENT RUTs -> they are different people!
      return { isMatch: false };
    }
  }

  // 2. WhatsApp Phone Match
  const phoneA = cleanPhoneForComparison(clientA.telefono);
  const phoneB = cleanPhoneForComparison(clientB.telefono);
  if (phoneA && phoneB && phoneA === phoneB) {
    return { isMatch: true, reason: 'TELEFONO', detail: `Mismo teléfono WhatsApp (*${phoneA})` };
  }

  // 3. Client Name Match (if no contradicting valid RUTs)
  const nameA = normalizeClientName(clientA.cliente);
  const nameB = normalizeClientName(clientB.cliente);
  
  // Ignore very short or generic names
  const genericNames = new Set(['cliente', 'particular', 'comprador', 'venta', 'sin nombre', 'anonimo']);
  if (nameA.length >= 5 && nameB.length >= 5 && !genericNames.has(nameA) && !genericNames.has(nameB)) {
    if (nameA === nameB) {
      return { isMatch: true, reason: 'NOMBRE', detail: `Mismo nombre: "${clientA.cliente}"` };
    }
  }

  return { isMatch: false };
};

/**
 * Analyzes all sales in the system to find other pending undispatched purchases
 * for the same client as `currentSale`.
 */
export const getPendingSalesForClient = (
  currentSale: Sale | null | undefined,
  allSales: Sale[]
): PendingSalesAnalysis => {
  const emptyResult: PendingSalesAnalysis = {
    hasPendingPurchases: false,
    totalPendingCount: 0,
    totalPendingBultos: 0,
    totalPendingMonto: 0,
    relatedSales: [],
    distinctVendedoras: [],
    hasDifferentVendedora: false,
    matchReasons: [],
    alreadyPrintedSalesCount: 0,
    unprintedSalesCount: 0,
    allGroupSales: currentSale ? [currentSale] : [],
    totalGroupBultos: currentSale ? getTotalBultos(currentSale) : 0,
    totalGroupMonto: currentSale ? (currentSale.total || 0) : 0,
    isAlreadyConsolidated: false
  };

  if (!currentSale || !allSales || allSales.length === 0) {
    return emptyResult;
  }

  const currentVendedorNorm = (currentSale.vendedor || '').trim().toLowerCase();
  const relatedSales: RelatedPendingSale[] = [];
  const matchReasonSet = new Set<'RUT' | 'TELEFONO' | 'NOMBRE'>();
  const distinctVendedorasSet = new Set<string>();

  if (currentSale.vendedor?.trim()) {
    distinctVendedorasSet.add(currentSale.vendedor.trim());
  }

  let totalPendingBultos = 0;
  let totalPendingMonto = 0;
  let alreadyPrintedSalesCount = 0;
  let unprintedSalesCount = 0;

  for (const sale of allSales) {
    // Skip the current sale
    if (sale.id === currentSale.id) continue;

    // Must be an undispatched sale
    if (!isSaleUndispatched(sale)) continue;

    // Check if client matches
    const match = isSameClient(currentSale, sale);
    if (match.isMatch && match.reason) {
      const bultos = getTotalBultos(sale);
      const saleVendedorNorm = (sale.vendedor || '').trim().toLowerCase();
      const esMismaVendedora = currentVendedorNorm !== '' && currentVendedorNorm === saleVendedorNorm;

      if (sale.vendedor?.trim()) {
        distinctVendedorasSet.add(sale.vendedor.trim());
      }

      if (sale.impresa) {
        alreadyPrintedSalesCount++;
      } else {
        unprintedSalesCount++;
      }

      matchReasonSet.add(match.reason);
      totalPendingBultos += bultos;
      totalPendingMonto += (sale.total || 0);

      relatedSales.push({
        sale,
        matchReason: match.reason,
        bultos,
        esMismaVendedora
      });
    }
  }

  // Sort related sales by number descending (newest first)
  relatedSales.sort((a, b) => b.sale.numeroVenta - a.sale.numeroVenta);

  const totalPendingCount = relatedSales.length;
  const currentBultos = getTotalBultos(currentSale);
  const currentMonto = currentSale.total || 0;
  const allGroupSales = [currentSale, ...relatedSales.map(r => r.sale)];
  const hasDifferentVendedora = distinctVendedorasSet.size > 1;

  // Check if already consolidated (all have juntaCompra containing 'JUNTA')
  const isAlreadyConsolidated = allGroupSales.every(s => 
    Boolean(s.juntaCompra && s.juntaCompra.trim().toUpperCase().includes('JUNTA'))
  );

  return {
    hasPendingPurchases: totalPendingCount > 0,
    totalPendingCount,
    totalPendingBultos,
    totalPendingMonto,
    relatedSales,
    distinctVendedoras: Array.from(distinctVendedorasSet),
    hasDifferentVendedora,
    matchReasons: Array.from(matchReasonSet),
    alreadyPrintedSalesCount,
    unprintedSalesCount,
    allGroupSales,
    totalGroupBultos: currentBultos + totalPendingBultos,
    totalGroupMonto: currentMonto + totalPendingMonto,
    isAlreadyConsolidated
  };
};

/**
 * Helper to consolidate a group of sales under 'JUNTA COMPRA' so bodega dispatches them together.
 */
export const consolidateSales = (
  salesToConsolidate: Sale[],
  updateSaleFn: (id: string, data: Partial<Sale>) => void
): string => {
  const saleNumbers = salesToConsolidate.map(s => `#${s.numeroVenta}`).join(', ');
  const noteTag = `[DESPACHO CONSOLIDADO: Ventas ${saleNumbers}]`;

  salesToConsolidate.forEach(s => {
    const existingObs = s.observaciones || '';
    const newObs = existingObs.includes('DESPACHO CONSOLIDADO') 
      ? existingObs 
      : (existingObs ? `${existingObs} • ${noteTag}` : noteTag);

    updateSaleFn(s.id, {
      juntaCompra: 'JUNTA COMPRA',
      observaciones: newObs
    });
  });

  return saleNumbers;
};
