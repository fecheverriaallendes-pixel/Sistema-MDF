/**
 * Utilidades para socios y partners comerciales externos
 * (ej: Lautaro Jofré / Fardolandia) que utilizan el catálogo e instalaciones
 * de Mundo del Fardo sin formar parte del personal ni de la nómina laboral/comisiones.
 */

export const FARDOLANDIA_LOGO_URL = "https://i.ibb.co/TCY43fH/Whats-App-Image-2026-10-19-at-16-43-47.jpg";
export const MDF_LOGO_URL = "https://i.ibb.co/qMyZQHYg/logo-sin-fondo-1.png";

/**
 * Normaliza cadenas de texto quitando tildes y pasando a mayúsculas
 */
const normalizeText = (text?: string | null): string => {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
};

/**
 * Determina de forma estricta e infalible si un vendedor, usuario o venta corresponde
 * a Lautaro Jofré o su empresa Fardolandia.
 */
export const isLautaroOrFardolandia = (
  entity?: string | { vendedor?: string; nombre?: string; esPartner?: boolean; nombreEmpresa?: string } | null
): boolean => {
  if (!entity) return false;

  if (typeof entity === 'string') {
    const norm = normalizeText(entity);
    return (
      norm.includes('LAUTARO') ||
      norm.includes('FARDOLANDIA') ||
      norm.includes('JOFRE')
    );
  }

  // Si es un objeto (Sale, StaffMember o similar)
  if (entity.esPartner === true) return true;
  if (entity.nombreEmpresa && normalizeText(entity.nombreEmpresa).includes('FARDOLANDIA')) return true;

  const vendedorNorm = normalizeText(entity.vendedor);
  if (
    vendedorNorm.includes('LAUTARO') ||
    vendedorNorm.includes('FARDOLANDIA') ||
    vendedorNorm.includes('JOFRE')
  ) {
    return true;
  }

  const nombreNorm = normalizeText(entity.nombre);
  if (
    nombreNorm.includes('LAUTARO') ||
    nombreNorm.includes('FARDOLANDIA') ||
    nombreNorm.includes('JOFRE')
  ) {
    return true;
  }

  return false;
};

/**
 * Retorna la información de identidad comercial y logotipo aplicable a la venta.
 */
export const getPartnerInfo = (
  entity?: string | { vendedor?: string; nombre?: string; esPartner?: boolean; nombreEmpresa?: string } | null
) => {
  const isPartner = isLautaroOrFardolandia(entity);

  if (isPartner) {
    return {
      isPartner: true,
      companyName: 'Fardolandia',
      partnerName: 'Lautaro Jofré',
      logoUrl: FARDOLANDIA_LOGO_URL,
      badgeLabel: 'FARDOLANDIA',
      badgeColor: 'purple',
      description: 'Partner Mayorista Externo'
    };
  }

  return {
    isPartner: false,
    companyName: 'Mundo del Fardo',
    partnerName: typeof entity === 'string' ? entity : entity?.vendedor || entity?.nombre || 'Mundo del Fardo',
    logoUrl: MDF_LOGO_URL,
    badgeLabel: 'MDF',
    badgeColor: 'emerald',
    description: 'Venta Directa Mundo del Fardo'
  };
};

/**
 * Obtiene la URL del logotipo correcto que debe imprimirse en la etiqueta térmica.
 */
export const getLogoForSale = (
  sale?: { vendedor?: string } | null
): string => {
  return isLautaroOrFardolandia(sale) ? FARDOLANDIA_LOGO_URL : MDF_LOGO_URL;
};
