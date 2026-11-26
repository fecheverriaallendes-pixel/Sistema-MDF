import { StockItem } from '../types';

export interface BlackFridayOfferConfig {
  codigo: string;
  nombreLista: string;
  precioOriginal: number;
  precioOferta: number;
  promoExtra?: string;
}

export interface BlackFridayOfferMatch extends BlackFridayOfferConfig {
  ahorro: number;
  porcentajeDescuento: number;
}

export const BLACK_FRIDAY_ACTIVE = true;
export const BLACK_FRIDAY_LOGO_SRC = '/black-friday-logo.jpg';
export const BLACK_FRIDAY_OG_IMAGE_SRC = '/og-black-friday-mdf.jpg';

export const BLACK_FRIDAY_OFFERS: BlackFridayOfferConfig[] = [
  { codigo: 'MDF-489', nombreLista: 'ABC PREMIUM WINTER MIX DUBAI', precioOriginal: 240000, precioOferta: 180000 },
  { codigo: 'MDF-901', nombreLista: 'ABRIGO MIXTO PREMIUM FJ', precioOriginal: 160000, precioOferta: 120000 },
  { codigo: 'MDF-956', nombreLista: 'accesorio halloween', precioOriginal: 100000, precioOferta: 30000 },
  { codigo: 'MDF-491', nombreLista: 'ADULT WINTER ZIPPER JACKET 23H', precioOriginal: 150000, precioOferta: 100000 },
  { codigo: 'MDF-882', nombreLista: 'BABY NEST IM', precioOriginal: 40000, precioOferta: 20000 },
  { codigo: 'MDF-903', nombreLista: 'BATA POLAR ADULTO EXOTICA FJ', precioOriginal: 100000, precioOferta: 80000 },
  { codigo: 'MDF-1057', nombreLista: 'Brand Winter (Marca invierno) 25 kg', precioOriginal: 200000, precioOferta: 170000 },
  { codigo: 'MDF-891', nombreLista: 'CHAQUETA COREANA MIXTA 230', precioOriginal: 220000, precioOferta: 180000 },
  { codigo: 'MDF-705', nombreLista: 'COLUMBIA 50 PIEZAS', precioOriginal: 300000, precioOferta: 240000 },
  { codigo: 'MDF-1075', nombreLista: 'Crop Top Invierno 45 KG', precioOriginal: 180000, precioOferta: 150000 },
  { codigo: 'MDF-963', nombreLista: 'DEPORTIVO MIXTO ZT', precioOriginal: 150000, precioOferta: 140000 },
  { codigo: 'MDF-549', nombreLista: 'DEPORTIVO PLUS SIZE CREMA IM', precioOriginal: 180000, precioOferta: 140000 },
  { codigo: 'MDF-042', nombreLista: 'DEPORTIVO PLUS SIZE TRACK SUITE IM', precioOriginal: 140000, precioOferta: 120000 },
  { codigo: 'MDF-791', nombreLista: 'eco frio LOBO', precioOriginal: 140000, precioOferta: 100000 },
  { codigo: 'MDF-778', nombreLista: 'frio mixta x/l', precioOriginal: 200000, precioOferta: 160000 },
  { codigo: 'MDF-1154', nombreLista: 'Gap Verano', precioOriginal: 180000, precioOferta: 130000 },
  { codigo: 'MDF-917', nombreLista: 'HOMBRE INVIERNO EXOTICO FJ', precioOriginal: 200000, precioOferta: 160000 },
  { codigo: 'MDF-1004', nombreLista: 'JUV INVIERNO *** PONY', precioOriginal: 120000, precioOferta: 100000 },
  { codigo: 'MDF-1003', nombreLista: 'JUV INVIERNO PRIMERA PONY', precioOriginal: 140000, precioOferta: 120000 },
  { codigo: 'MDF-707', nombreLista: 'MIX ADULTO WINTER PREMIUM 25 KG RT', precioOriginal: 120000, precioOferta: 70000 },
  { codigo: 'MDF-920', nombreLista: 'MUJER INVIERNO EXOTICO FJ', precioOriginal: 140000, precioOferta: 110000 },
  { codigo: 'MDF-919', nombreLista: 'MUJER INVIERNO PRIMERA FJ', precioOriginal: 180000, precioOferta: 160000 },
  { codigo: 'MDF-921', nombreLista: 'MUJER INVIERNO PREMIUM FJ', precioOriginal: 250000, precioOferta: 220000 },
  { codigo: 'MDF-922', nombreLista: 'NIÑO INVIERNO EXOTICO FJ', precioOriginal: 160000, precioOferta: 120000 },
  { codigo: 'MDF-923', nombreLista: 'NIÑO INVIERNO PREMIUM FJ', precioOriginal: 250000, precioOferta: 220000 },
  { codigo: 'MDF-1162', nombreLista: 'Old navy verano adulto 25 kg', precioOriginal: 200000, precioOferta: 180000 },
  { codigo: 'MDF-193', nombreLista: 'Oversize Mixta Verano Premium IM', precioOriginal: 150000, precioOferta: 100000 },
  { codigo: 'MDF-1156', nombreLista: 'pantalon cargo hombre retorno 50 pcs', precioOriginal: 450000, precioOferta: 400000 },
  { codigo: 'MDF-736', nombreLista: 'pantalon sky niño', precioOriginal: 120000, precioOferta: 50000 },
  { codigo: 'MDF-926', nombreLista: 'PARKA ADULTO FJ', precioOriginal: 200000, precioOferta: 170000 },
  { codigo: 'MDF-391', nombreLista: 'PARKA NIÑO COREANA', precioOriginal: 200000, precioOferta: 160000 },
  { codigo: 'MDF-927', nombreLista: 'PARKA NIÑO EXOTICO FJ', precioOriginal: 120000, precioOferta: 100000 },
  { codigo: 'MDF-928', nombreLista: 'PARKA SIN MANGA EXOTICA FJ', precioOriginal: 160000, precioOferta: 130000 },
  { codigo: 'MDF-828', nombreLista: 'PARKA Y PANTALON COREANO NIÑO', precioOriginal: 140000, precioOferta: 100000 },
  { codigo: 'MDF-929', nombreLista: 'PIJAMA ADULTO ENTERITO FJ', precioOriginal: 140000, precioOferta: 120000 },
  { codigo: 'MDF-930', nombreLista: 'PIJAMA INVIERNO FJ', precioOriginal: 120000, precioOferta: 80000 },
  { codigo: 'MDF-932', nombreLista: 'PLUS SIZE HOMBRE INVIERNO EXOTICO FJ', precioOriginal: 180000, precioOferta: 150000 },
  { codigo: 'MDF-933', nombreLista: 'PLUS SIZE HOMBRE INVIERNO PREMIUM FJ', precioOriginal: 220000, precioOferta: 200000 },
  { codigo: 'MDF-400', nombreLista: 'PLUS SIZE HOMBRE VERANO CREMA IM', precioOriginal: 200000, precioOferta: 160000 },
  { codigo: 'MDF-1017', nombreLista: 'PLUS SIZE JUVENIL INVIERNO *** PONY', precioOriginal: 140000, precioOferta: 100000 },
  { codigo: 'MDF-934', nombreLista: 'PLUS SIZE MUJER INVIERNO EXOTICO FJ', precioOriginal: 180000, precioOferta: 150000 },
  { codigo: 'MDF-935', nombreLista: 'PLUS SIZE MUJER INVIERNO PREMIUM FJ', precioOriginal: 250000, precioOferta: 200000 },
  { codigo: 'MDF-244', nombreLista: 'Plus Size Mujer Verano P1 IM', precioOriginal: 200000, precioOferta: 160000 },
  { codigo: 'MDF-245', nombreLista: 'Plus Size Polera Mujer Manga Corta Verano Premium', precioOriginal: 90000, precioOferta: 60000 },
  { codigo: 'MDF-938', nombreLista: 'POLAR ADULTO PREMIUM FJ', precioOriginal: 200000, precioOferta: 150000 },
  { codigo: 'MDF-939', nombreLista: 'POLAR CORDERITO EXOTICO FJ', precioOriginal: 140000, precioOferta: 110000 },
  { codigo: 'MDF-410', nombreLista: 'POLAR CORDERITO IM', precioOriginal: 140000, precioOferta: 100000 },
  { codigo: 'MDF-940', nombreLista: 'POLAR LIVIANO EXOTICO FJ', precioOriginal: 100000, precioOferta: 80000 },
  { codigo: 'MDF-261', nombreLista: 'Polar S.A', precioOriginal: 80000, precioOferta: 60000 },
  { codigo: 'MDF-413', nombreLista: 'polar top im', precioOriginal: 60000, precioOferta: 40000, promoExtra: 'o 3x $100.000' },
  { codigo: 'MDF-1160', nombreLista: 'polera hombre estampada de colores m/c primera', precioOriginal: 200000, precioOferta: 180000 },
  { codigo: 'MDF-416', nombreLista: 'POLERA HOMBRE M/C IM', precioOriginal: 180000, precioOferta: 150000 },
  { codigo: 'MDF-287', nombreLista: 'Polera Mujer M/L / S.A', precioOriginal: 90000, precioOferta: 65000 },
  { codigo: 'MDF-943', nombreLista: 'Polera Mujer M/L FJ', precioOriginal: 100000, precioOferta: 70000 },
  { codigo: 'MDF-944', nombreLista: 'POLERA MUJER M/L PREMIUM FJ', precioOriginal: 140000, precioOferta: 120000 },
  { codigo: 'MDF-967', nombreLista: 'POLERON CON CIERRE CANADA 2.0', precioOriginal: 120000, precioOferta: 100000 },
  { codigo: 'MDF-300', nombreLista: 'Poleron con gorro 1ra im', precioOriginal: 120000, precioOferta: 80000 },
  { codigo: 'MDF-1094', nombreLista: 'Poleron con gorro 2da 45 kg S.A', precioOriginal: 90000, precioOferta: 70000 },
  { codigo: 'MDF-947', nombreLista: 'POLERON CON GORRO MIXTO FJ', precioOriginal: 120000, precioOferta: 100000 },
  { codigo: 'MDF-611', nombreLista: 'POLERON ESTAMPADOS GRAFICOS TOM Y JERRY', precioOriginal: 180000, precioOferta: 140000 },
  { codigo: 'MDF-313', nombreLista: 'Poleron S/G BETA', precioOriginal: 100000, precioOferta: 80000 },
  { codigo: 'MDF-949', nombreLista: 'POLERON SIN GORRO MIXTO EXOTICO FJ', precioOriginal: 110000, precioOferta: 90000 },
  { codigo: 'MDF-945', nombreLista: 'POLERON Y BUZO NIÑO EXOTICO FJ', precioOriginal: 140000, precioOferta: 120000 },
  { codigo: 'MDF-951', nombreLista: 'ROPA DE CASA PREMIUM FJ', precioOriginal: 140000, precioOferta: 100000 },
  { codigo: 'MDF-1055', nombreLista: 'Saco ASOS Retorno Verano 20 kg', precioOriginal: 200000, precioOferta: 180000 },
  { codigo: 'MDF-957', nombreLista: 'SHORT HOMBRE RETORNO', precioOriginal: 250000, precioOferta: 220000 },
  { codigo: 'MDF-455', nombreLista: 'SKY NIEVE NIÑO IM', precioOriginal: 180000, precioOferta: 100000 },
  { codigo: 'MDF-375', nombreLista: 'Sweater Largo BETA', precioOriginal: 90000, precioOferta: 60000 },
  { codigo: 'MDF-953', nombreLista: 'SWEATER LIVIANO EXOTICO FJ', precioOriginal: 60000, precioOferta: 40000, promoExtra: '3x $100.000' },
  { codigo: 'MDF-955', nombreLista: 'SWEATER PESADO EXOTICO FJ', precioOriginal: 60000, precioOferta: 40000, promoExtra: '3x $100.000' },
  { codigo: 'MDF-565', nombreLista: 'WINTER MIX PREMIUM 20KG RT', precioOriginal: 120000, precioOferta: 70000 },
];

function normalizeKey(value?: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const OFFERS_BY_CODE = new Map<string, BlackFridayOfferConfig>();
const OFFERS_BY_NAME = new Map<string, BlackFridayOfferConfig>();

// Códigos que comparten nombre con otros ítems de distinto proveedor/stock (se emparejan solo por código exacto)
const STRICT_CODE_ONLY_NAMES = new Set<string>([
  normalizeKey('pantalon sky niño'),
  normalizeKey('POLERON CON CIERRE CANADA 2.0'),
]);

for (const offer of BLACK_FRIDAY_OFFERS) {
  OFFERS_BY_CODE.set(offer.codigo.trim().toUpperCase(), offer);
  const normName = normalizeKey(offer.nombreLista);
  if (!STRICT_CODE_ONLY_NAMES.has(normName)) {
    OFFERS_BY_NAME.set(normName, offer);
  }
}

export function getBlackFridayOffer(item: StockItem | null | undefined): BlackFridayOfferMatch | null {
  if (!BLACK_FRIDAY_ACTIVE || !item) return null;

  const codeKey = (item.codigo || item.id || '').trim().toUpperCase();
  let matched = OFFERS_BY_CODE.get(codeKey);

  if (!matched && item.tipo) {
    const nameKey = normalizeKey(item.tipo);
    if (!STRICT_CODE_ONLY_NAMES.has(nameKey)) {
      matched = OFFERS_BY_NAME.get(nameKey);
    }
  }

  if (!matched) return null;

  const precioOriginal = matched.precioOriginal || item.precioSugerido;
  const precioOferta = matched.precioOferta;

  if (precioOferta >= precioOriginal) return null;

  const ahorro = Math.max(0, precioOriginal - precioOferta);
  const porcentajeDescuento = Math.round((ahorro / precioOriginal) * 100);

  return {
    ...matched,
    precioOriginal,
    precioOferta,
    ahorro,
    porcentajeDescuento,
  };
}

export function getBlackFridayStats(items: StockItem[]): {
  count: number;
  maxDiscountPercent: number;
} {
  let count = 0;
  let maxDiscountPercent = 0;

  for (const item of items) {
    const offer = getBlackFridayOffer(item);
    if (offer) {
      count++;
      if (offer.porcentajeDescuento > maxDiscountPercent) {
        maxDiscountPercent = offer.porcentajeDescuento;
      }
    }
  }

  return { count, maxDiscountPercent };
}
