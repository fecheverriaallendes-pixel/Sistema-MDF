import { StockItem } from '../types';

export const TEMPORADAS_OPTIONS = [
  'Invierno',
  'Media Temporada',
  'Verano',
  'Todo el Año'
] as const;

export type TemporadaOption = typeof TEMPORADAS_OPTIONS[number];

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
 * Parsea una o más temporadas desde una cadena o arreglo.
 * Soporta formatos como "Invierno, Media Temporada", "Invierno / Media Temporada",
 * "Invierno y Media Estación", etc.
 */
export function parseTemporadas(temporada?: string | string[]): string[] {
  if (!temporada) return [];
  if (Array.isArray(temporada)) {
    return Array.from(new Set(temporada.map(s => String(s).trim()).filter(Boolean)));
  }
  const str = String(temporada).trim();
  if (!str) return [];

  // Dividir por comas, barras, guiones o conectores ("y", "e")
  const rawParts = str
    .split(/,|\/|\-|\by\b|\be\b/i)
    .map(p => p.trim())
    .filter(Boolean);

  const matched: string[] = [];

  for (const part of rawParts) {
    const norm = part.toLowerCase();
    if (norm.includes('invierno')) {
      if (!matched.includes('Invierno')) matched.push('Invierno');
    } else if (norm.includes('verano')) {
      if (!matched.includes('Verano')) matched.push('Verano');
    } else if (
      norm.includes('media') || 
      norm.includes('estacion') || 
      norm.includes('estación') || 
      norm.includes('otono') || 
      norm.includes('otoño') || 
      norm.includes('primavera')
    ) {
      if (!matched.includes('Media Temporada')) matched.push('Media Temporada');
    } else if (norm.includes('todo') || norm.includes('año')) {
      if (!matched.includes('Todo el Año')) matched.push('Todo el Año');
    } else if (part.length > 0) {
      if (!matched.includes(part)) matched.push(part);
    }
  }

  // Verificación adicional de la cadena completa si no coincidió en partes
  const normFull = str.toLowerCase();
  if (normFull.includes('invierno') && !matched.includes('Invierno')) matched.push('Invierno');
  if (normFull.includes('verano') && !matched.includes('Verano')) matched.push('Verano');
  if (
    (normFull.includes('media') || normFull.includes('estacion') || normFull.includes('estación')) && 
    !matched.includes('Media Temporada')
  ) {
    matched.push('Media Temporada');
  }
  if ((normFull.includes('todo el') || normFull.includes('año')) && !matched.includes('Todo el Año')) {
    matched.push('Todo el Año');
  }

  return matched.length > 0 ? matched : [str];
}

/**
 * Alterna una temporada seleccionada permitiendo selección múltiple.
 * Retorna la cadena resultante separada por comas (ej: "Invierno, Media Temporada").
 */
export function toggleTemporada(currentTemporada: string | undefined, option: string): string {
  const currentList = parseTemporadas(currentTemporada);

  if (option === 'Todo el Año') {
    // Si ya tiene únicamente 'Todo el Año', se desmarca
    if (currentList.length === 1 && currentList[0] === 'Todo el Año') {
      return '';
    }
    // Si se activa 'Todo el Año', reemplaza las temporadas puntuales
    return 'Todo el Año';
  }

  // Si tenía 'Todo el Año' y se selecciona una temporada específica, quitamos 'Todo el Año'
  const withoutTodoAno = currentList.filter(s => s !== 'Todo el Año');

  if (withoutTodoAno.includes(option)) {
    // Quitar la opción
    const remaining = withoutTodoAno.filter(s => s !== option);
    return remaining.join(', ');
  } else {
    // Agregar la opción conservando el orden de TEMPORADAS_OPTIONS
    const updated = [...withoutTodoAno, option];
    const ordered = (TEMPORADAS_OPTIONS as readonly string[]).filter(t => updated.includes(t));
    // Agregar cualquier custom que no esté en la lista predefinida
    updated.forEach(u => {
      if (!ordered.includes(u)) ordered.push(u);
    });
    return ordered.join(', ');
  }
}

/**
 * Formato amigable para el usuario (ej: "Invierno y Media Temporada" o "Invierno, Media Temporada y Verano")
 */
export function formatSeasonDisplay(temporada?: string | string[]): string {
  const list = parseTemporadas(temporada);
  if (list.length === 0) return 'Sin especificar';
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} y ${list[1]}`;
  const last = list[list.length - 1];
  const rest = list.slice(0, list.length - 1).join(', ');
  return `${rest} y ${last}`;
}

/**
 * Verifica si un producto coincide con un filtro de temporada (considerando que puede tener varias).
 */
export function matchesSeason(itemTemporada?: string, filterTemporada?: string): boolean {
  if (!filterTemporada || filterTemporada === 'TODOS') return true;
  if (!itemTemporada) return false;

  const normFilter = filterTemporada.toLowerCase().trim();
  const seasons = parseTemporadas(itemTemporada);

  // Un producto de "Todo el Año" aplica para cualquier temporada que busque el cliente
  if (seasons.some(s => s.toLowerCase().includes('todo el año'))) {
    return true;
  }

  return seasons.some(s => {
    const normS = s.toLowerCase();
    if (normFilter.includes('invierno')) return normS.includes('invierno');
    if (normFilter.includes('verano')) return normS.includes('verano');
    if (normFilter.includes('media') || normFilter.includes('estacion') || normFilter.includes('estación')) {
      return normS.includes('media') || normS.includes('estacion') || normS.includes('estación');
    }
    if (normFilter.includes('todo')) return normS.includes('todo') || normS.includes('año');
    return normS === normFilter;
  });
}

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
  const seasons = parseTemporadas(item.temporada);
  const seasonText = seasons.length > 0 ? formatSeasonDisplay(item.temporada) : '';
  const temporada = seasonText ? `• 🌦️ *Temporada:* ${seasonText}\n` : '';
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
  if (norm.includes('media') || norm.includes('estacion') || norm.includes('estación') || norm.includes('otoño') || norm.includes('primavera')) {
    return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: '🍃' };
  }
  if (norm.includes('todo') || norm.includes('año')) {
    return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: '🔄' };
  }
  return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: '🌦️' };
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
