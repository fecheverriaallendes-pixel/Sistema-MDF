import { Customer, Sale } from '../types';

/**
 * Utility functions for Chilean RUT parsing, formatting, validation, and flexible searching.
 */

export const cleanRut = (rawRut?: string): string => {
  if (!rawRut) return '';
  return rawRut.toString().trim().toUpperCase().replace(/[^0-9K]/g, '');
};

export const formatRut = (rawRut?: string): string => {
  if (!rawRut || !rawRut.trim()) return '';
  const upper = rawRut.trim().toUpperCase();
  if (['PENDIENTE', 'N/A', 'SIN RUT', 'EXTRANJERO', 'PASAPORTE', 'NO APLICA'].includes(upper)) {
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
 * Checks if search query matches a target RUT.
 * Handles variations like:
 * - 12.345.678-9 vs 12345678-9 vs 123456789
 * - partial searches like "12345" or "12.345"
 */
export const matchRut = (targetRut?: string, search?: string): boolean => {
  if (!targetRut || !search) return false;
  const rawTarget = targetRut.trim().toLowerCase();
  const rawSearch = search.trim().toLowerCase();

  // Direct substring check
  if (rawTarget.includes(rawSearch)) return true;

  // Clean alphanumeric check (removes dots, dashes, spaces)
  const cleanTarget = cleanRut(targetRut);
  const cleanSearch = cleanRut(search);

  if (cleanSearch.length > 0 && cleanTarget.includes(cleanSearch)) {
    return true;
  }

  return false;
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
 * Deduplicates by cleaned RUT or normalized name.
 */
export const getUnifiedClients = (customers: Customer[], sales: Sale[]): UnifiedClient[] => {
  const clientMap = new Map<string, UnifiedClient>();

  // 1. First add CRM customers
  customers.forEach(c => {
    const key = c.rut && cleanRut(c.rut) ? `rut_${cleanRut(c.rut)}` : `name_${c.nombre.trim().toLowerCase()}`;
    clientMap.set(key, {
      id: c.id,
      nombre: c.nombre,
      telefono: c.telefono,
      rut: c.rut,
      email: c.email,
      direccion: c.direccion,
      notas: c.notas || [],
      lastContacted: c.lastContacted,
      totalCompras: 0,
      montoTotal: 0,
      isRegisteredInCRM: true,
      originalCustomer: c
    });
  });

  // 2. Aggregate sales data and add clients from sales if missing
  sales.forEach(s => {
    if (!s.cliente) return;
    const cleanR = s.rut ? cleanRut(s.rut) : '';
    const rutKey = cleanR ? `rut_${cleanR}` : '';
    const nameKey = `name_${s.cliente.trim().toLowerCase()}`;

    // Find existing entry by RUT key first, then by name key
    let entry: UnifiedClient | undefined;
    if (rutKey && clientMap.has(rutKey)) {
      entry = clientMap.get(rutKey);
    } else if (clientMap.has(nameKey)) {
      entry = clientMap.get(nameKey);
    }

    if (entry) {
      entry.totalCompras += 1;
      entry.montoTotal += (s.total || 0);
      if (!entry.rut && s.rut) entry.rut = s.rut;
      if (!entry.direccion && s.direccion) entry.direccion = s.direccion;
      if (!entry.telefono && s.telefono) entry.telefono = s.telefono;
      if (!entry.ultimaVentaFecha || (s.fecha && s.fecha > entry.ultimaVentaFecha)) {
        entry.ultimaVentaFecha = s.fecha;
      }
    } else {
      // New client found in sales
      const newKey = rutKey || nameKey;
      clientMap.set(newKey, {
        id: `sale_client_${s.id}`,
        nombre: s.cliente,
        telefono: s.telefono || '',
        rut: s.rut || '',
        direccion: s.direccion || '',
        notas: [],
        totalCompras: 1,
        montoTotal: s.total || 0,
        ultimaVentaFecha: s.fecha,
        isRegisteredInCRM: false
      });
    }
  });

  return Array.from(clientMap.values());
};
