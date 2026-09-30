import { Sale, StockItem } from '../types';

export interface LabelItemData {
  codigoFardo: string;
  cantidad: number;
  bultoNumero?: number;      // ej: 1
  bultoTotal?: number;       // ej: 15
  itemIndex?: number;        // ej: 1 (de 10 de este producto)
  itemTotalQty?: number;     // ej: 10
  descripcionProducto?: string;
  variante?: string;
}

export interface GeneratedLabel {
  id: string;
  sale: Sale;
  item: LabelItemData;
  productDescription: string;
  itemCode: string;
  bultoNumero: number;
  bultoTotal: number;
  isIndividual: boolean;
}

/**
 * Calcula la cantidad total de bultos o fardos físicos en una venta.
 * En Nota de Venta suma las cantidades de cada artículo (ej: 10 + 5 = 15 bultos).
 */
export function getTotalBultos(sale: Sale): number {
  if (sale.items && sale.items.length > 0) {
    const total = sale.items.reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);
    return Math.max(1, total);
  }
  return Math.max(1, Number(sale.cantidad) || 1);
}

/**
 * Obtiene la lista normalizada de ítems de una venta.
 */
export function getSaleItemsList(sale: Sale): { codigoFardo: string; cantidad: number; valorUnitario?: number }[] {
  if (sale.items && sale.items.length > 0) {
    return sale.items.map(i => ({
      codigoFardo: (i.codigoFardo || '').trim().toUpperCase() || 'N/A',
      cantidad: Math.max(1, Number(i.cantidad) || 1),
      valorUnitario: i.valorUnitario
    }));
  }
  return [{
    codigoFardo: (sale.codigoFardo || '').trim().toUpperCase() || 'N/A',
    cantidad: Math.max(1, Number(sale.cantidad) || 1),
    valorUnitario: sale.valorUnitario
  }];
}

/**
 * Obtiene la descripción amigable de un producto desde el stock o el código.
 */
export function getProductDescription(codigo: string, stock: StockItem[] = []): string {
  if (!codigo || codigo === 'N/A') return 'PRODUCTO GENERAL';
  const found = stock.find(s => (s.codigo || '').trim().toUpperCase() === codigo.trim().toUpperCase());
  return found?.tipo || codigo;
}

/**
 * Genera etiquetas individuales para cada bulto/fardo físico de la venta.
 * Por ejemplo: Si la venta tiene 10 unidades del artículo A y 5 del artículo B,
 * genera 15 etiquetas individuales:
 * - Bultos 1 al 10: Artículo A (1 unidad por etiqueta, Bulto 1/15 a 10/15)
 * - Bultos 11 al 15: Artículo B (1 unidad por etiqueta, Bulto 11/15 a 15/15)
 */
export function generateIndividualLabels(sale: Sale, stock: StockItem[] = []): GeneratedLabel[] {
  const items = getSaleItemsList(sale);
  const totalBultos = items.reduce((sum, i) => sum + i.cantidad, 0);
  const result: GeneratedLabel[] = [];

  let currentBultoNum = 1;

  for (const it of items) {
    const qty = Math.max(1, it.cantidad);
    const prodDesc = getProductDescription(it.codigoFardo, stock);

    for (let itemIdx = 1; itemIdx <= qty; itemIdx++) {
      result.push({
        id: `${sale.id}-indiv-${currentBultoNum}-${it.codigoFardo}`,
        sale,
        productDescription: prodDesc,
        itemCode: it.codigoFardo,
        bultoNumero: currentBultoNum,
        bultoTotal: totalBultos,
        isIndividual: true,
        item: {
          codigoFardo: it.codigoFardo,
          cantidad: 1, // Cada etiqueta individual representa 1 fardo
          bultoNumero: currentBultoNum,
          bultoTotal: totalBultos,
          itemIndex: itemIdx,
          itemTotalQty: qty,
          descripcionProducto: prodDesc,
          variante: sale.variante || 'FARDO'
        }
      });
      currentBultoNum++;
    }
  }

  return result;
}

/**
 * Genera etiquetas agrupadas por producto (1 etiqueta por cada línea de producto).
 * Muestra la cantidad total del producto (ej: x10, x5) y el rango de bultos correspondiente.
 */
export function generateGroupedLabels(sale: Sale, stock: StockItem[] = []): GeneratedLabel[] {
  const items = getSaleItemsList(sale);
  const totalBultos = items.reduce((sum, i) => sum + i.cantidad, 0);
  const result: GeneratedLabel[] = [];

  let bultoStart = 1;

  items.forEach((it, idx) => {
    const qty = Math.max(1, it.cantidad);
    const prodDesc = getProductDescription(it.codigoFardo, stock);
    const bultoEnd = bultoStart + qty - 1;

    result.push({
      id: `${sale.id}-group-${idx}-${it.codigoFardo}`,
      sale,
      productDescription: prodDesc,
      itemCode: it.codigoFardo,
      bultoNumero: bultoStart,
      bultoTotal: totalBultos,
      isIndividual: false,
      item: {
        codigoFardo: it.codigoFardo,
        cantidad: qty,
        bultoNumero: totalBultos > 1 ? bultoStart : undefined,
        bultoTotal: totalBultos > 1 ? totalBultos : undefined,
        itemIndex: 1,
        itemTotalQty: qty,
        descripcionProducto: prodDesc,
        variante: sale.variante || 'FARDO'
      }
    });

    bultoStart = bultoEnd + 1;
  });

  return result;
}
