
export interface Customer {
  id: string;
  nombre: string;
  telefono: string;
  rut?: string;
  email?: string;
  direccion?: string;
  notas: string[]; // History/interaction notes
  lastContacted: string; // ISO date
}

export enum SaleStatus {
  PENDIENTE = 'Pendiente',
  ENVIADO = 'Enviado'
}

export enum DispatchType {
  AGENCIA = 'Agencia',
  DOMICILIO = 'Domicilio',
  RETIRO = 'Retiro en Bodega'
}

export enum DispatchStatus {
  PREPARACION = 'En Preparación',
  LISTO_PARA_RETIRO = 'Listo para Retiro',
  EN_RUTA = 'En Ruta',
  ENTREGADO = 'Entregado',
  CLIENTE_AUSENTE = 'Cliente ausente',
  DIRECCION_NO_ENCONTRADA = 'Dirección no encontrada',
  CLIENTE_NO_RECIBIO = 'Cliente no recibió',
  AGENCIA_MAL_ASIGNADA = 'Agencia Mal Asignada',
  ERROR_ETIQUETADO = 'Error de Etiquetado'
}

export enum SaleType {
  NORMAL = 'Normal',
  LIVE = 'Live TikTok',
  NOTA_VENTA = 'Nota de Venta'
}

export interface SaleItem {
  codigoFardo: string;
  cantidad: number;
  valorUnitario: number;
  tipoComision?: CommissionType;
  esManual?: boolean;
}

export enum CommissionType {
  FARDO_NORMAL = 'Fardo Normal ($3.000)',
  FARDO_PROMO = 'Fardo Promoción ($1.500)',
  MEDIO_FARDO = 'Medio Fardo ($1.500)',
  LOTE = 'Lote ($1.000)'
}

export const COMMISSION_VALUES: Record<CommissionType, number> = {
  [CommissionType.FARDO_NORMAL]: 3000,
  [CommissionType.FARDO_PROMO]: 1500,
  [CommissionType.MEDIO_FARDO]: 1500,
  [CommissionType.LOTE]: 1000
};

export enum StaffRole {
  VENDEDOR = 'Vendedor',
  BODEGA = 'Jefe de Bodega',
  DESPACHO = 'Encargado de Despacho',
  ADMIN = 'Administrador',
  TRANSPORTISTA = 'Transportista',
  POST_VENTA = 'Post-Venta'
}

export enum PurchaseType {
  NOTA_VENTA = 'Nota de Venta',
  CONTENEDOR = 'Contenedor Cerrado'
}

export interface Abono {
  id: string;
  fecha: string;
  monto: number;
  metodo: string;
  observacion: string;
}

export interface Purchase {
  id: string;
  proveedor: string;
  fecha: string;
  tipo: PurchaseType;
  descripcion: string;
  montoTotal: number;
  saldoPendiente: number;
  abonos: Abono[];
  estado: 'PAGADO' | 'PENDIENTE';
  notas?: string;
}

export interface UsaAbono {
  id: string;
  fecha: string; // Fecha del abono / transferencia
  montoUsd: number; // Monto en Dólares (USD $)
  tipoCambio?: number; // Tipo de cambio CLP/USD (ej: 945)
  montoClp?: number; // Monto equivalente o pagado en CLP ($)
  metodo: string; // Transferencia SWIFT / Wire, Tarjeta USD, Remesa, Efectivo USD, etc.
  referencia?: string; // N° SWIFT, N° operación, comprobante
  observacion: string; // Observaciones / notas
  notaClp?: string; // Nota específica sobre conversión en pesos chilenos
  createdAt?: string;
}

export type UsaContainerStatus = 'PENDIENTE' | 'EN_TRANSITO' | 'EN_ADUANA' | 'RECIBIDO' | 'PAGADO';

export interface UsaPurchase {
  id: string;
  proveedor: string; // Nombre del proveedor o exportador en USA
  numeroContenedor?: string; // Ej: MSKU-9182312, CONT-2025-01
  facturaInvoice?: string; // Factura Comercial / Bill of Lading (B/L)
  fecha: string; // Fecha de compra / embarque
  fechaLlegadaEstimada?: string; // Fecha estimada de llegada a Chile (ETA)
  descripcion: string; // Descripción del contenido (ej: Contenedor 40ft Polerones y Chaquetas)
  montoTotalUsd: number; // Monto total acordado en USD ($)
  tipoCambioRef?: number; // Tipo de cambio de referencia (ej: 945 CLP)
  montoTotalClpRef?: number; // Valor de referencia en Pesos Chilenos
  saldoPendienteUsd: number; // Saldo pendiente en USD ($)
  abonos: UsaAbono[];
  estado: UsaContainerStatus;
  puertoOrigen?: string; // Ej: Houston, Miami, Los Angeles
  puertoDestino?: string; // Ej: San Antonio, Valparaíso, Iquique
  notasClp?: string; // Notas detalladas en Pesos Chilenos y Dólares
  observaciones?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StaffMember {
  id: string;
  nombre: string;
  rol: StaffRole;
  pin: string;
  activo: boolean;
}

export interface StockItem {
  id: string;
  codigo: string;
  tipo: string;
  proveedor: string; 
  precioCosto: number;
  precioSugerido: number;
  stockActual: number; 
  disponible: boolean;
  unidad: 'FARDO' | 'PIEZA' | 'MEDIO FARDO' | 'LOTE' | string;
  categoria?: 'FARDO' | 'LOTE' | string;
  peso?: number; // Para lotes (10 o 20 kgs)
  promocion?: boolean;
  observaciones?: string;
}

export interface Sale {
  id: string;
  numeroVenta: number;
  tipoVenta: SaleType;
  fecha: string;
  hora: string;
  vendedor: string;
  cliente: string;
  telefono: string;
  rut?: string;
  codigoFardo?: string; 
  variante?: string;
  valorUnitario?: number;
  cantidad?: number;
  items?: SaleItem[];
  total: number;
  direccion?: string;
  estadoPago: string;
  enviado: boolean;
  conductorFecha?: string;
  comprobante?: string;
  tipoComision: CommissionType;
  juntaCompra?: string;
  status: SaleStatus;
  observaciones: string;
  fechaDespacho?: string;
  datosCompletos: boolean;
  
  // Nuevos campos para gestión logística
  tipoDespacho?: DispatchType;
  estadoDespacho?: DispatchStatus;
  itemsDespachados?: number; // Cantidad verificada/escaneada
  agencia?: string; // Starken, Chilexpress, BlueExpress, etc.
  transportista?: string; // Nombre del transportista para despacho a domicilio
  timestamp?: string; // ISO date
  impresa?: boolean;
  etiquetador?: string;
  esManual?: boolean;
}

export interface CommissionAdjustment {
  id: string;
  fecha: string;
  vendedor: string;
  monto: number; // Negative for deductions, positive for bonuses
  motivo: string;
}

export interface Coupon {
  id: string;
  code: string;
  value: number;
  validUntil: string;
  used: boolean;
  createdAt: string;
  customerName?: string;
  saleId?: string;
  authorizedBy?: string;
  authorizedAt?: string;
}

export interface Cheque {
  id: string;
  fecha: string;
  numeroCheque: string;
  monto: number;
  nombre: string;
  tipo: 'Abierto' | 'Cruzado';
  pagado: boolean;
}

export interface ProductionRecord {
  id: string;
  fecha: string; // ISO date
  cantidad: number;
  totalPagar: number;
}

export interface StockHistoryEvent {
  id: string;
  productId: string;
  tipo: 'INGRESO' | 'AJUSTE' | 'VENTA' | 'ANULACION' | 'CARGA_MASIVA';
  cantidad: number;
  balanceAntes?: number;
  balanceDespues?: number;
  fecha: string; // ISO timestamp
  vendedor: string;
  observaciones: string;
}

export enum IncidentStatus {
  NUEVO = 'Nuevo',
  EN_REVISION = 'En revisión',
  ESPERANDO_CLIENTE = 'Esperando respuesta del cliente',
  ESPERANDO_APROBACION = 'Esperando aprobación',
  RESUELTO = 'Resuelto',
  CERRADO = 'Cerrado',
  ESCALADO = 'Escalado'
}

export enum IncidentPriority {
  BAJA = 'Baja',
  MEDIA = 'Media',
  ALTA = 'Alta',
  CRITICA = 'Crítica'
}

export interface IncidentHistoryEvent {
  timestamp: string; // ISO timestamp
  user: string;
  description: string;
}

export interface IncidentComment {
  id: string;
  timestamp: string; // ISO timestamp
  user: string;
  text: string;
}

export interface IncidentAttachment {
  name: string;
  url: string;
  type: string;
}

export interface Incident {
  id: string;
  codigoCaso: string; // PV-000001, PV-000002...
  numeroVenta?: string; // e.g. "V-12051"
  saleId?: string; // Firestore sale document ID
  cliente: string;
  telefono: string;
  canal: 'WhatsApp' | 'Instagram' | 'Llamada' | 'Otro' | string;
  motivo: string;
  prioridad: IncidentPriority;
  estado: IncidentStatus;
  responsable: string; // Carla, Andrea, etc.
  observaciones?: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  
  // Associated Coupon (for compensations)
  couponId?: string;
  couponCode?: string;
  couponValue?: number;
  
  // List of history / timeline events
  history: IncidentHistoryEvent[];
  
  // Internal comments (executive notes)
  comments: IncidentComment[];
  
  // Attachments
  attachments: IncidentAttachment[];
}


