import { Sale, DispatchType } from '../types';

/**
 * Standard carrier mappings based on destination agency and Chilean logistics routes.
 */
export const DEFAULT_CARRIERS = [
  'Anthony Mendez',
  'Transportes Tamarindo',
  'Augusto',
  'transportes tpam',
  'Retiro local',
  'TRANSPORTES JUAN NUÑEZ',
  'TRANSPORTES BS'
];

/**
 * Automatically suggests the correct carrier according to agency, dispatch type, and address.
 */
export function suggestCarrierForSale(
  agencia?: string | null,
  tipoDespacho?: string | null,
  direccion?: string | null
): string | null {
  const ag = (agencia || '').trim().toUpperCase();
  const dir = (direccion || '').trim().toUpperCase();
  const tipo = (tipoDespacho || '').trim().toUpperCase();

  // Local pickup
  if (
    tipo.includes('RETIRO') ||
    ag.includes('RETIRO') ||
    ag.includes('LOCAL') ||
    dir.includes('RETIRO LOCAL') ||
    dir.includes('RETIRADO LOCAL')
  ) {
    return 'Retiro local';
  }

  // Transportes Tamarindo (Santiago Metropolitan deliveries & Tamarindo routes)
  if (
    ag === 'SANTIAGO' ||
    ag.includes('TAMARINDO') ||
    ag.includes('SAANTIAGO') ||
    ag.includes('SANYIAGO') ||
    dir.includes('TAMARINDO')
  ) {
    return 'Transportes Tamarindo';
  }

  // Augusto (Chevalier, Blue Express, Cruz del Sur, Barrios, Transcargo, Bus Norte, Mena, etc.)
  if (
    ag.includes('AUGUSTO') ||
    ag.includes('CHEVALIER') ||
    ag.includes('CHEVALLIER') ||
    ag.includes('CHEEVALIER') ||
    ag.includes('CHAVELIER') ||
    ag.includes('BLUE') ||
    ag.includes('CRUZ DEL SUR') ||
    ag.includes('BARRIOS') ||
    ag.includes('TRANSCARGO') ||
    ag.includes('BUS NORTE') ||
    ag.includes('MENA') ||
    ag.includes('ALTAS CUMBRES') ||
    ag.includes('5 SUR') ||
    ag.includes('5SUR') ||
    ag.includes('TRANSMAX')
  ) {
    return 'Augusto';
  }

  // Anthony Mendez (TVP, CYC, Dibama, Castro, Cacem, Envias Cargo, Andimar, Villa Prat, Vílchez, Santa María, etc.)
  if (
    ag.includes('TVP') ||
    ag.includes('CYC') ||
    ag.includes('DIBAMA') ||
    ag.includes('CASTRO') ||
    ag.includes('CACEM') ||
    ag.includes('ENVIAS') ||
    ag.includes('ENVÍAS') ||
    ag.includes('ANDIMAR') ||
    ag.includes('VILLA PRAT') ||
    ag.includes('VILCHEZ') ||
    ag.includes('VILCHES') ||
    ag.includes('SANTA MARIA') ||
    ag.includes('ZONA SUR') ||
    ag.includes('VARMONTT') ||
    ag.includes('FÉNIX') ||
    ag.includes('FENIX')
  ) {
    return 'Anthony Mendez';
  }

  // TPAM
  if (ag.includes('TPAM') || ag.includes('TTPAM')) {
    return 'transportes tpam';
  }

  // BS
  if (ag.includes('BS')) {
    return 'TRANSPORTES BS';
  }

  // Domicilio in Santiago/RM communes defaults to Transportes Tamarindo
  if (tipo.includes('DOMICILIO')) {
    const santiagoCommunes = [
      'SANTIAGO', 'PUENTE ALTO', 'MAIPU', 'MAIPÚ', 'LA FLORIDA', 'SAN BERNARDO',
      'QUINTA NORMAL', 'CONCHALI', 'RECOLETA', 'PROVIDENCIA', 'ÑUÑOA', 'NUNOA',
      'LAS CONDES', 'PEÑALOLEN', 'PEÑALOLÉN', 'SAN MIGUEL', 'LA CISTERNA',
      'EL BOSQUE', 'PUDAHUEL', 'LO PRADO', 'CERRO NAVIA', 'RENCA',
      'INDEPENDENCIA', 'ESTACION CENTRAL', 'ESTACIÓN CENTRAL', 'HUECHURABA',
      'LO ESPEJO', 'LO BARNECHEA', 'VITACURA', 'MACUL', 'SAN JOAQUIN', 'SAN JOAQUÍN',
      'LA GRANJA', 'LA PINTANA', 'PEDRO AGUIRRE CERDA', 'SAN RAMON', 'SAN RAMÓN'
    ];
    if (santiagoCommunes.some(com => dir.includes(com))) {
      return 'Transportes Tamarindo';
    }
  }

  return null;
}

/**
 * Checks if a sale matches a carrier filter (including special "__SIN_ASIGNAR__", alias matching, and inferred agency routes).
 */
export function matchesCarrierFilter(
  saleCarrier: string | undefined | null,
  filterCarrier: string,
  saleAgencia?: string | null,
  saleTipoDespacho?: string | null,
  saleDireccion?: string | null
): boolean {
  if (!filterCarrier) return true;

  // Unassigned filter
  if (filterCarrier === '__SIN_ASIGNAR__') {
    return !saleCarrier || saleCarrier.trim() === '';
  }

  const cleanFilter = filterCarrier.trim().toUpperCase();
  const cleanSaleCarrier = (saleCarrier || '').trim().toUpperCase();

  // 1. Direct or partial carrier name match
  if (cleanSaleCarrier) {
    if (cleanSaleCarrier === cleanFilter) return true;
    if (cleanSaleCarrier.includes(cleanFilter) || cleanFilter.includes(cleanSaleCarrier)) return true;

    // Common aliases
    if ((cleanFilter.includes('TAMARINDO')) && cleanSaleCarrier.includes('TAMARINDO')) return true;
    if ((cleanFilter.includes('AUGUSTO')) && cleanSaleCarrier.includes('AUGUSTO')) return true;
    if ((cleanFilter.includes('MENDEZ')) && cleanSaleCarrier.includes('MENDEZ')) return true;
    if ((cleanFilter.includes('TPAM')) && cleanSaleCarrier.includes('TPAM')) return true;
    if ((cleanFilter.includes('BS')) && cleanSaleCarrier.includes('BS')) return true;
    if ((cleanFilter.includes('RETIRO')) && cleanSaleCarrier.includes('RETIRO')) return true;
  }

  // 2. If carrier is not explicitly assigned yet, check inferred carrier route
  const inferred = suggestCarrierForSale(saleAgencia, saleTipoDespacho, saleDireccion);
  if (inferred) {
    const cleanInferred = inferred.trim().toUpperCase();
    if (cleanInferred === cleanFilter) return true;
    if (cleanFilter.includes('TAMARINDO') && cleanInferred.includes('TAMARINDO')) return true;
    if (cleanFilter.includes('AUGUSTO') && cleanInferred.includes('AUGUSTO')) return true;
    if (cleanFilter.includes('MENDEZ') && cleanInferred.includes('MENDEZ')) return true;
    if (cleanFilter.includes('TPAM') && cleanInferred.includes('TPAM')) return true;
    if (cleanFilter.includes('BS') && cleanInferred.includes('BS')) return true;
    if (cleanFilter.includes('RETIRO') && cleanInferred.includes('RETIRO')) return true;
  }

  return false;
}

/**
 * Enhances global search to recognize carrier names, alias searches, and unassigned status.
 */
export function matchesCarrierSearch(searchLower: string, sale: Sale): boolean {
  const tr = (sale.transportista || '').toLowerCase();
  const ag = (sale.agencia || '').toLowerCase();

  // Search by "tamarindo"
  if (searchLower.includes('tamarindo')) {
    if (tr.includes('tamarindo')) return true;
    if (ag === 'santiago' || ag.includes('tamarindo')) return true;
  }

  // Search by "augusto"
  if (searchLower.includes('augusto')) {
    if (tr.includes('augusto')) return true;
    if (
      ag.includes('chevalier') ||
      ag.includes('bluexpress') ||
      ag.includes('blue express') ||
      ag.includes('cruz del sur') ||
      ag.includes('barrios') ||
      ag.includes('transcargo') ||
      ag.includes('bus norte')
    ) {
      return true;
    }
  }

  // Search by "no asignado" or "sin asignar"
  if (searchLower.includes('no asignado') || searchLower.includes('sin asignar') || searchLower.includes('sin transportista')) {
    return !sale.transportista || sale.transportista.trim() === '';
  }

  return false;
}
