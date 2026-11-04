import { StockItem } from '../types';

/**
 * Normalizes text removing accents, diacritics, and converting to lowercase.
 */
export const normalizeText = (text: string): string => {
  if (!text) return '';
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

/**
 * Intelligent multi-token search for stock items / catalog products.
 * Splits query by spaces and punctuation, ensuring ALL search tokens match somewhere in the item fields.
 */
export const smartSearchMatch = (item: StockItem, searchTerm: string): boolean => {
  if (!searchTerm || !searchTerm.trim()) return true;

  const normalizedSearch = normalizeText(searchTerm);
  
  // Split query into tokens by whitespace and common punctuation, filtering out empty strings
  const searchTokens = normalizedSearch
    .split(/[\s,.\-\_\/\\]+/)
    .filter(token => token.length > 0);

  if (searchTokens.length === 0) return true;

  const codigo = item.codigo || '';
  const codigoClean = codigo.replace(/[\s.-]/g, ''); // e.g. MDF102 for MDF-102
  const tipo = item.tipo || '';
  const proveedor = item.proveedor || '';
  const categoria = item.categoria || '';
  const unidad = item.unidad || '';
  const observaciones = item.observaciones || '';
  const descripcion = item.descripcion || '';
  const temporada = item.temporada || '';
  const tallas = item.tallas || '';
  const pesoKg = item.pesoKg !== undefined ? `${item.pesoKg}kg ${item.pesoKg}` : '';
  const generoSegmento = item.generoSegmento || '';
  const estilo = item.estilo || '';
  const calidad = item.calidad || '';
  const piezasAprox = item.piezasAprox || '';
  const consejoVenta = item.consejoVenta || '';

  const combinedText = normalizeText(
    `${codigo} ${codigoClean} ${tipo} ${proveedor} ${categoria} ${unidad} ${observaciones} ${descripcion} ${temporada} ${tallas} ${pesoKg} ${generoSegmento} ${estilo} ${calidad} ${piezasAprox} ${consejoVenta}`
  );

  // Every token must be present in the combined item text
  return searchTokens.every(token => combinedText.includes(token));
};

/**
 * General multi-token search for raw text strings or combined fields.
 */
export const smartTextMatch = (textToSearch: string, searchTerm: string): boolean => {
  if (!searchTerm || !searchTerm.trim()) return true;

  const normalizedSearch = normalizeText(searchTerm);
  const searchTokens = normalizedSearch
    .split(/[\s,.\-\_\/\\]+/)
    .filter(token => token.length > 0);

  if (searchTokens.length === 0) return true;

  const combinedText = normalizeText(textToSearch);
  return searchTokens.every(token => combinedText.includes(token));
};
