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
  ENTREGADO = 'Entregado'
}

export enum SaleType {
  NORMAL = 'Normal',
  LIVE = 'Live TikTok'
}

export enum CommissionType {
  FARDO_NORMAL = 'Fardo Normal ($3.000)',
  FARDO_PROMO = 'Fardo Promoción ($1.500)',
  LOTE_SACO = 'Lote/Saco ($1.000)'
}

export enum StaffRole {
  VENDEDOR = 'Vendedor',
  BODEGA = 'Jefe de Bodega',
  DESPACHO = 'Encargado de Despacho',
  ADMIN = 'Administrador'
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
  tipo: string; // Nombre Producto
  categoria: string;
  presentacion: string;
  calidad: string; // Nuevo campo
  etiqueta: string;
  detalle?: string;
  precioCosto: number;
  precioSugerido: number; // Precio
  stockActual: number; 
  disponible: boolean;
  unidad: 'FARDO' | 'PIEZA';
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
  codigoFardo: string; 
  variante?: string;
  valorUnitario: number;
  cantidad: number;
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
  
  tipoDespacho?: DispatchType;
  estadoDespacho?: DispatchStatus;
  itemsDespachados?: number;
  agencia?: string;
  transportista?: string;
}

export interface CommissionAdjustment {
  id: string;
  fecha: string;
  vendedor: string;
  monto: number;
  motivo: string;
}
