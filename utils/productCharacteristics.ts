import { StockItem } from '../types';

export const TEMPORADAS_OPTIONS = [
  'Media Temporada',
  'Invierno',
  'Verano',
  'Todo el Año'
] as const;

export const GENEROS_SEGMENTOS_OPTIONS = [
  'INFANTIL',
  'MIXTO',
  'MUJER',
  'HOMBRE',
  'OTROS'
] as const;

// Alias para compatibilidad con código existente
export const ESTILOS_OPTIONS = GENEROS_SEGMENTOS_OPTIONS;

export const CALIDADES_OPTIONS = [
  'premium/ crema',
  'primera',
  'primera / segunda',
  'segunda',
  'Std'
] as const;

export const PESOS_COMUNES = [45, 40, 25, 20, 10];

export const TALLAS_COMUNES = [
  '0 a 2 años (Bebé)',
  '2 a 8 años (Infantil)',
  '4 a 14 años (Niño Mixto)',
  '8 a 16 años (Juvenil)',
  'S a L (Adulto)',
  'M a XL (Adulto)',
  'S a XXL (Mixto Adulto)',
  'Plus Size / Tallas Grandes',
  'Estándar / Talla Única'
];

/**
 * Retorna campos vacíos por defecto para que el usuario pueda
 * ingresar todas las características a mano sin prellenados automáticos.
 */
export function inferCharacteristicsFromTitle(_item?: Partial<StockItem>): {
  temporada: string;
  generoSegmento: string;
  estilo: string;
  calidad: string;
  tallas: string;
  pesoKg: number | string;
  descripcion: string;
  consejoVenta: string;
} {
  return {
    temporada: '',
    generoSegmento: '',
    estilo: '',
    calidad: '',
    tallas: '',
    pesoKg: '',
    descripcion: '',
    consejoVenta: ''
  };
}

/**
 * Formatea texto listo para compartir con clientes vía WhatsApp
 * solo con los datos que hayan sido ingresados manualmente.
 */
export function formatFardoPitchWhatsApp(item: StockItem): string {
  const temporada = item.temporada ? `• 🌦️ *Temporada:* ${item.temporada}\n` : '';
  const genero = (item.generoSegmento || item.estilo) ? `• 👥 *Género / Segmento:* ${item.generoSegmento || item.estilo}\n` : '';
  const tallas = item.tallas ? `• 📏 *Tallas / Rango de Edad:* ${item.tallas}\n` : '';
  const pesoVal = item.pesoKg || item.peso;
  const peso = pesoVal ? `• ⚖️ *Peso:* ${pesoVal} KG\n` : '';
  const calidad = item.calidad ? `• ⭐ *Calidad:* ${item.calidad}\n` : '';
  const piezas = item.piezasAprox ? `• 👕 *Cantidad aprox:* ${item.piezasAprox}\n` : '';
  const detalles = item.detallesPrendas ? `• 🔍 *Prendas que trae:* ${item.detallesPrendas}\n` : '';
  const desc = item.descripcion ? `\n📝 *DESCRIPCIÓN REAL DEL PRODUCTO:*\n${item.descripcion}\n` : '';

  const specs = `${temporada}${genero}${tallas}${peso}${calidad}${piezas}${detalles}`;

  return `📦 *FICHA TÉCNICA OFICIAL - CUADERNO MDF* 📦
━━━━━━━━━━━━━━━━━━━━
🏷️ *Producto:* ${item.tipo}
🔢 *Código:* ${item.codigo}
💰 *Valor:* $${item.precioSugerido?.toLocaleString('es-CL')}
📦 *Formato:* ${item.unidad || 'FARDO'}${pesoVal ? ` • ${pesoVal} KG` : ''}

${specs ? `📋 *DETALLES Y CARACTERÍSTICAS:*\n${specs}` : ''}${desc}
⚠️ *Políticas Cuaderno MDF:* Ropa americana seleccionada en origen. Te brindamos información 100% transparente para que tu inversión sea segura.
━━━━━━━━━━━━━━━━━━━━
¿Te gustaría reservarlo o tienes alguna consulta adicional? 😊`;
}

/**
 * Badge color styling based on Season
 */
export function getSeasonBadgeStyle(temporada?: string): { bg: string; text: string; border: string; icon: string } {
  const norm = (temporada || '').toLowerCase();
  if (norm.includes('invierno')) {
    return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: '❄️' };
  }
  if (norm.includes('verano')) {
    return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: '☀️' };
  }
  if (norm.includes('media')) {
    return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: '🍃' };
  }
  return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: '🔄' };
}

/**
 * Badge color styling based on Quality
 */
export function getQualityBadgeStyle(calidad?: string): { bg: string; text: string; border: string } {
  const norm = (calidad || '').toLowerCase().trim();
  if (norm.includes('crema') || norm.includes('premium')) {
    return { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300' };
  }
  if (norm.includes('primera / segunda') || norm.includes('primera/segunda') || norm.includes('1ra / 2da')) {
    return { bg: 'bg-teal-100', text: 'text-teal-900', border: 'border-teal-300' };
  }
  if (norm.includes('primera') || norm.includes('1ra')) {
    return { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300' };
  }
  if (norm.includes('segunda') || norm.includes('2da')) {
    return { bg: 'bg-orange-100', text: 'text-orange-900', border: 'border-orange-300' };
  }
  return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' };
}
