import { Customer, Sale } from '../types';

/**
 * Utility functions for Chilean RUT parsing, formatting, validation, and flexible searching.
 */

const RUT_PLACEHOLDERS = new Set([
  'PENDIENTE',
  'N/A',
  'NA',
  'SIN RUT',
  'SINRUT',
  'EXTRANJERO',
  'PASAPORTE',
  'NO APLICA',
  'NOAPLICA',
  'S/R'
]);

export const cleanRut = (rawRut?: string): string => {
  if (!rawRut) return '';
  const upper = rawRut.toString().trim().toUpperCase();
  if (RUT_PLACEHOLDERS.has(upper)) return '';
  return upper.replace(/[^0-9K]/g, '');
};

export const formatRut = (rawRut?: string): string => {
  if (!rawRut || !rawRut.trim()) return '';
  const upper = rawRut.trim().toUpperCase();
  if (RUT_PLACEHOLDERS.has(upper)) {
    return upper;
  }
  const clean = cleanRut(upper);
  if (clean.length >= 7 && clean.length <= 10) {
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);
    const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formattedBody}-${dv}`;
  }
  return upper;
};

/**
 * Validates Chilean RUT using modulo 11 algorithm.
 */
export const validateRut = (rawRut?: string): boolean => {
  const clean = cleanRut(rawRut);
  if (clean.length < 7 || clean.length > 9) return false;
  
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  
  let sum = 0;
  let multiplier = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body.charAt(i), 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const expectedDvNumber = 11 - (sum % 11);
  let expectedDv = '';
  if (expectedDvNumber === 11) expectedDv = '0';
  else if (expectedDvNumber === 10) expectedDv = 'K';
  else expectedDv = expectedDvNumber.toString();
  
  return dv === expectedDv;
};

/**
 * Strict exact match between two RUTs.
 * Only returns true if both RUTs clean to the EXACT same digits + DV,
 * and length is between 7 and 10 characters.
 * NEVER does partial or substring matching!
 */
export const exactMatchRut = (rutA?: string, rutB?: string): boolean => {
  if (!rutA || !rutB) return false;
  const cleanA = cleanRut(rutA);
  const cleanB = cleanRut(rutB);
  if (cleanA.length < 7 || cleanB.length < 7) return false;
  if (cleanA.length > 10 || cleanB.length > 10) return false;
  return cleanA === cleanB;
};

/**
 * Flexible match for SEARCH BARS (CRM, list filters).
 * Requires at least 2 search characters to avoid false positive explosions.
 */
export const matchRut = (targetRut?: string, search?: string): boolean => {
  if (!targetRut || !search) return false;
  const cleanTarget = cleanRut(targetRut);
  const cleanSearch = cleanRut(search);

  if (cleanTarget.length < 3 || cleanSearch.length < 2) return false;
  return cleanTarget.includes(cleanSearch);
};

export interface UnifiedClient {
  id: string;
  nombre: string;
  telefono: string;
  rut?: string;
  email?: string;
  direccion?: string;
  notas: string[];
  lastContacted?: string;
  totalCompras: number;
  montoTotal: number;
  ultimaVentaFecha?: string;
  isRegisteredInCRM: boolean;
  originalCustomer?: Customer;
}

/**
 * Combines CRM customers and historical sales clients to provide a unified directory.
 * Safely deduplicates by exact cleaned RUT. Never transfers or guesses RUT across disparate records.
 */
export const getUnifiedClients = (customers: Customer[], sales: Sale[]): UnifiedClient[] => {
  const clientMap = new Map<string, UnifiedClient>();

  // 1. First add CRM customers
  customers.forEach(c => {
    const cleanR = cleanRut(c.rut);
    // Key by exact valid RUT if present, otherwise by unique CRM ID
    const key = cleanR.length >= 7 ? `rut_${cleanR}` : `crm_${c.id}`;
    
    clientMap.set(key, {
      id: c.id,
      nombre: c.nombre,
      telefono: c.telefono || '',
      rut: cleanR.length >= 7 ? formatRut(c.rut) : (c.rut || ''),
      email: c.email,
      direccion: c.direccion || '',
      notas: c.notas || [],
      lastContacted: c.lastContacted,
      totalCompras: 0,
      montoTotal: 0,
      isRegisteredInCRM: true,
      originalCustomer: c
    });
  });

  // 2. Aggregate sales data safely WITHOUT cross-polluting different clients
  sales.forEach(s => {
    if (!s.cliente || !s.cliente.trim()) return;
    const cleanR = s.rut ? cleanRut(s.rut) : '';
    const hasValidRut = cleanR.length >= 7;

    if (hasValidRut) {
      const rutKey = `rut_${cleanR}`;
      const entry = clientMap.get(rutKey);

      if (entry) {
        // Increment purchases
        entry.totalCompras += 1;
        entry.montoTotal += (s.total || 0);
        if (!entry.rut) entry.rut = formatRut(s.rut);
        if (!entry.direccion && s.direccion) entry.direccion = s.direccion;
        if (!entry.telefono && s.telefono) entry.telefono = s.telefono;
        if (!entry.ultimaVentaFecha || (s.fecha && s.fecha > entry.ultimaVentaFecha)) {
          entry.ultimaVentaFecha = s.fecha;
        }
      } else {
        // New client with valid unique RUT from sales
        clientMap.set(rutKey, {
          id: `sale_client_${s.id}`,
          nombre: s.cliente.trim(),
          telefono: s.telefono || '',
          rut: formatRut(s.rut),
          direccion: s.direccion || '',
          notas: [],
          totalCompras: 1,
          montoTotal: s.total || 0,
          ultimaVentaFecha: s.fecha,
          isRegisteredInCRM: false
        });
      }
    } else {
      // Sale WITHOUT a valid RUT:
      // Group by normalized name + phone ONLY if both exist, otherwise unique sale ID.
      // NEVER attach a RUT to this record, and NEVER merge into an existing RUT-bearing client!
      const cleanPhone = (s.telefono || '').replace(/\D/g, '');
      const nonRutKey = cleanPhone.length >= 8 
        ? `nonrut_${s.cliente.trim().toLowerCase()}_${cleanPhone}`
        : `sale_single_${s.id}`;

      const entry = clientMap.get(nonRutKey);
      if (entry) {
        entry.totalCompras += 1;
        entry.montoTotal += (s.total || 0);
        if (!entry.direccion && s.direccion) entry.direccion = s.direccion;
        if (!entry.ultimaVentaFecha || (s.fecha && s.fecha > entry.ultimaVentaFecha)) {
          entry.ultimaVentaFecha = s.fecha;
        }
      } else {
        clientMap.set(nonRutKey, {
          id: `sale_client_${s.id}`,
          nombre: s.cliente.trim(),
          telefono: s.telefono || '',
          rut: '', // Strictly empty! Never inherit someone else's RUT
          direccion: s.direccion || '',
          notas: [],
          totalCompras: 1,
          montoTotal: s.total || 0,
          ultimaVentaFecha: s.fecha,
          isRegisteredInCRM: false
        });
      }
    }
  });

  return Array.from(clientMap.values());
};
