import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Sale, StockItem, SaleStatus, SaleType, StaffMember, StaffRole, Purchase, PurchaseType, Abono, DispatchType, DispatchStatus, CommissionAdjustment } from '../types';
import { db } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch, getDocs } from 'firebase/firestore';

const INITIAL_MASTER_STOCK: Omit<StockItem, 'id' | 'disponible'>[] = [
  { codigo: 'MDF-001', tipo: 'Abrigo Corto Mujer CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-002', tipo: 'Abrigo Lana Hombre Corto IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 90000, stockActual: 6, unidad: 'FARDO' },
  { codigo: 'MDF-003', tipo: 'Abrigo Lana Mujer Corto IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 90000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-004', tipo: 'Abrigo largo CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 130000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-005', tipo: 'Abrigo Moderno BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-006', tipo: 'Abrigo mujer JK', proveedor: 'JK', precioCosto: 0, precioSugerido: 90000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-007', tipo: 'Accesorios Navidad IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 140000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-008', tipo: 'Artes Marciales CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 80000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-009', tipo: 'Baby Platinium IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-010', tipo: 'Banana Republic IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 150000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-011', tipo: 'Blazer Invierno CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-012', tipo: 'Blazer Juvenil IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-013', tipo: 'Blazer verano', proveedor: 'General', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-014', tipo: 'Blusa Fancy BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-015', tipo: 'Blusa Fanella BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 100000, stockActual: 10, unidad: 'FARDO' },
  { codigo: 'MDF-016', tipo: 'Blusa Invierno IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-017', tipo: 'Blusa m/l FE', proveedor: 'FE', precioCosto: 0, precioSugerido: 80000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-018', tipo: 'Blusa Media Estación FE', proveedor: 'FE', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-019', tipo: 'Blusa Media Temporada MDF', proveedor: 'MDF', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-020', tipo: 'Blusa poly BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-021', tipo: 'Blusa Poly IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-022', tipo: 'Blusa verano canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-023', tipo: 'Blusa Verano Plus Size CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-024', tipo: 'Blusas BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-025', tipo: 'Buzo A CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-026', tipo: 'Buzo algodon  TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-027', tipo: 'BUZO ALGODON CANADA 2.0', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-028', tipo: 'BUZO ALGODON CANADA 2.0 1RA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-029', tipo: 'Buzo Algodon Im', proveedor: 'IM', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-030', tipo: 'Buzo algodon O/S Tom y jerry', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-031', tipo: 'Buzo Canada SPL', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-032', tipo: 'Buzo JK', proveedor: 'JK', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-033', tipo: 'Buzo Juvenil BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-034', tipo: 'Buzo Marca 25 KG ALGODON TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 240000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-035', tipo: 'Buzo Marca nylon 25 kg TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 260000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-036', tipo: 'Buzo Niño', proveedor: 'General', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-037', tipo: 'Buzo Nylon TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-038', tipo: 'Buzo Old Navy', proveedor: 'OLD NAVY', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-039', tipo: 'Buzo Poly', proveedor: 'General', precioCosto: 0, precioSugerido: 260000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-040', tipo: 'Buzo polyester BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 260000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-041', tipo: 'Buzo y chaqueta de nylon prem beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-042', tipo: 'Buzo y Chaqueta Entrenamiento', proveedor: 'General', precioCosto: 0, precioSugerido: 220000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-043', tipo: 'Buzo y Chaqueta Poliester Premium BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-044', tipo: 'Calcetin  ZT', proveedor: 'ZT', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-045', tipo: 'Calcetin Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-046', tipo: 'Calcetin Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-047', tipo: 'Calvin Klein y algo de Guess invierno  25KG', proveedor: 'General', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: '25 KILOS' },
  { codigo: 'MDF-048', tipo: 'Calza 3/4 CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 250000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-049', tipo: 'Calza Corta Deportiva CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 330000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-050', tipo: 'Calza deportiva', proveedor: 'RT', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-051', tipo: 'Calza Deportiva BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 280000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-052', tipo: 'Calza deportiva CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 280000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-053', tipo: 'Calza Deportiva IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-054', tipo: 'Calza Deportiva Marca 25 kg TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-055', tipo: 'Calza Invierno CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-056', tipo: 'Calza Moderna Leggins', proveedor: 'General', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-057', tipo: 'Calzon', proveedor: 'General', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-058', tipo: 'Camisa De Hombre M/C CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-059', tipo: 'Camisa De Hombre TIGRE.', proveedor: 'TIGRE', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-060', tipo: 'Camisa Franella BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 160000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-061', tipo: 'Camisa Mezclilla CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-062', tipo: 'Camisa ML Hombre Premiun BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-063', tipo: 'Camisas Hombre M/L y M/C', proveedor: 'General', precioCosto: 0, precioSugerido: 250000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-064', tipo: 'Capri BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-065', tipo: 'Capri CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 70000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-066', tipo: 'Chamarra BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 250000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-067', tipo: 'Chamarra Niño BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-068', tipo: 'Chaqueta Atletica (Poleron Deportivo) BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 250000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-069', tipo: 'Chaqueta De Cuero 1RA IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-070', tipo: 'Chaqueta De Cuero 2DA IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-071', tipo: 'Chaqueta De Entrenamiento CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-072', tipo: 'Chaqueta Fashion CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-073', tipo: 'Chaqueta Gamuza 20 kg IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 80000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-074', tipo: 'Chaqueta Invierno CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-075', tipo: 'Chaqueta Jeans  B CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-076', tipo: 'Chaqueta Jeans 1 Y 2 TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 80000, stockActual: 93, unidad: 'FARDO' },
  { codigo: 'MDF-077', tipo: 'Chaqueta Jeans BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 210000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-078', tipo: 'Chaqueta Liviana CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-079', tipo: 'CHAQUETA LIVIANA CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 300000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-080', tipo: 'Chaqueta Moderna BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-081', tipo: 'Chaqueta moderna IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 120000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-082', tipo: 'Chaqueta Mujer Marca 25 kg TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-083', tipo: 'Chaqueta Polar BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 140000, stockActual: 5, unidad: 'FARDO' },
  { codigo: 'MDF-084', tipo: 'Chic Pant ( jogger mujer) CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 220000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-085', tipo: 'CK/ GUESS 25 KILOS', proveedor: 'General', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-086', tipo: 'Clinico CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-087', tipo: 'Clinico im', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-088', tipo: 'Cobertor CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 160000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-089', tipo: 'Cojin CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-090', tipo: 'Colcha Lana CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 130000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-091', tipo: 'Columbia  25 KG Media Temporada Verano', proveedor: 'General', precioCosto: 0, precioSugerido: 260000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-092', tipo: 'Columbia 50 PRENDAS', proveedor: 'General', precioCosto: 0, precioSugerido: 320000, stockActual: 0, unidad: '20 KILOS' },
  { codigo: 'MDF-093', tipo: 'Columbia Jacket 25 KG TOMY JERRY', proveedor: 'General', precioCosto: 0, precioSugerido: 300000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-094', tipo: 'Conjunto Zara 25 unidades RETORNO', proveedor: 'ZARA', precioCosto: 0, precioSugerido: 250000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-095', tipo: 'Corderito Polar  TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-096', tipo: 'Cortaviento', proveedor: 'RT', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-097', tipo: 'Cortaviento  A CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-098', tipo: 'CORTAVIENTO 1RA  CNADA 2.0', proveedor: 'RT', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-099', tipo: 'CORTAVIENTO 2DA CANADA 2.0', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-100', tipo: 'Cortaviento B', proveedor: 'RT', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-101', tipo: 'Cortaviento Marca  25 KLS', proveedor: 'RT', precioCosto: 0, precioSugerido: 400000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-102', tipo: 'Cortaviento TOM Y JERRY  40 KG', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-103', tipo: 'Cortaviento Vintage  POMS 25 KILOS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-104', tipo: 'Cortavientos beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-105', tipo: 'COTELE DE HOMBRE CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-106', tipo: 'Cotsco Hombre', proveedor: 'General', precioCosto: 0, precioSugerido: 6000, stockActual: 0, unidad: 'PIEZA' },
  { codigo: 'MDF-107', tipo: 'Crip Crop Top CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 9, unidad: 'FARDO' },
  { codigo: 'MDF-108', tipo: 'Crop Top  Invierno IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 140000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-109', tipo: 'Cubre colchon #1 IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 13, unidad: 'FARDO' },
  { codigo: 'MDF-110', tipo: 'Deportivo 1RA IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 280000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-111', tipo: 'Deportivo A', proveedor: 'RT', precioCosto: 0, precioSugerido: 330000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-112', tipo: 'Deportivo Adulto BETA 1RA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 300000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-113', tipo: 'Deportivo B', proveedor: 'RT', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-114', tipo: 'Deportivo Crema F', proveedor: 'RT', precioCosto: 0, precioSugerido: 400000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-115', tipo: 'Deportivo Economico Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 300000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-116', tipo: 'Deportivo Invierno Nylon  TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 180000, stockActual: 23, unidad: 'FARDO' },
  { codigo: 'MDF-117', tipo: 'Deportivo Niño BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 280000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-118', tipo: 'Deportivo O/S', proveedor: 'RT', precioCosto: 0, precioSugerido: 100000, stockActual: 5, unidad: 'FARDO' },
  { codigo: 'MDF-119', tipo: 'Deportivo Plus Size Crema IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 200000, stockActual: 25, unidad: 'FARDO' },
  { codigo: 'MDF-120', tipo: 'Deportivo Plus SIze Track Suite IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-121', tipo: 'Deportivo Premium Im', proveedor: 'IM', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-122', tipo: 'Deportivo Verano', proveedor: 'RT', precioCosto: 0, precioSugerido: 300000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-123', tipo: 'Disfraz 2da', proveedor: 'General', precioCosto: 0, precioSugerido: 80000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-124', tipo: 'Disfraz adulto im', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-125', tipo: 'Disfraz Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 160000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-126', tipo: 'Disfraz niño im', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-127', tipo: 'Disfraz niño im p1', proveedor: 'IM', precioCosto: 0, precioSugerido: 140000, stockActual: 5, unidad: 'FARDO' },
  { codigo: 'MDF-128', tipo: 'Enterito Bebe Pijama Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 0, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-129', tipo: 'Enterito canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 280000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-130', tipo: 'enterito fe', proveedor: 'FE', precioCosto: 0, precioSugerido: 250000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-131', tipo: 'Enterito mameluco niño JK', proveedor: 'JK', precioCosto: 0, precioSugerido: 140000, stockActual: 10, unidad: 'FARDO' },
  { codigo: 'MDF-132', tipo: 'Falda de Cuero IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 160000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-133', tipo: 'Falda Invierno CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 160000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-134', tipo: 'Falda Verano CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 160000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-135', tipo: 'Fashion Brand Exotico IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-136', tipo: 'Fashion Brand IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 210000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-137', tipo: 'FF Exotico IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 140000, stockActual: 12, unidad: 'FARDO' },
  { codigo: 'MDF-138', tipo: 'Frazada BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 140000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-139', tipo: 'Frazada CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 140000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-140', tipo: 'GAP 25 KLS', proveedor: 'General', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-141', tipo: 'Gorro Y Bufanda CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 80000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-142', tipo: 'Halloween', proveedor: 'General', precioCosto: 0, precioSugerido: 100000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-143', tipo: 'Halloween disfraz nuevo', proveedor: 'General', precioCosto: 0, precioSugerido: 2800, stockActual: 0, unidad: 'PIEZA' },
  { codigo: 'MDF-144', tipo: 'Jardinera Mezclilla beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-145', tipo: 'Jardinera short IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 80000, stockActual: 10, unidad: 'FARDO' },
  { codigo: 'MDF-146', tipo: 'Jean levis mujer', proveedor: 'General', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-147', tipo: 'Jeans Fashion 50 PIEZAS', proveedor: 'General', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-148', tipo: 'Jeans Hombre BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-149', tipo: 'Jeans hombre canada b', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-150', tipo: 'Jeans Loco TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 360000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-151', tipo: 'Jeans Mujer  CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-152', tipo: 'Jeans Mujer BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 160000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-153', tipo: 'Jeans Mujer O/S CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 140000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-154', tipo: 'Jordan y And One  25 KG', proveedor: 'General', precioCosto: 0, precioSugerido: 240000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-155', tipo: 'Jumper Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 300000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-156', tipo: 'Jumper Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 300000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-157', tipo: 'Ladies Fashion Sweater CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-158', tipo: 'lenceria beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 400000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-159', tipo: 'Lenceria CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-160', tipo: 'Leñadora CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-161', tipo: 'Lino BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-162', tipo: 'Mamemluco bebé TIGRE', proveedor: 'TIGRE', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-163', tipo: 'Mantel BETA.', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-164', tipo: 'Marca #2 CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 280000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-165', tipo: 'Marca Invierno Talla Grande TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 250000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-166', tipo: 'Mix Chaqueta MDF', proveedor: 'MDF', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-167', tipo: 'Mix Mujer Verano Premium BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 280000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-168', tipo: 'Mixta Hombre invierno Premiun BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 330000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-169', tipo: 'Mixta mujer invierno premiun beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 250000, stockActual: 5, unidad: 'FARDO' },
  { codigo: 'MDF-170', tipo: 'Mixta Mujer Invierno Talla Grande TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 260000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-171', tipo: 'Mixta mujer verano premiun poms', proveedor: 'POMS', precioCosto: 0, precioSugerido: 300000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-172', tipo: 'Mixta Verano IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 250000, stockActual: 16, unidad: 'FARDO' },
  { codigo: 'MDF-173', tipo: 'Mixto Invierno 1RA BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 120000, stockActual: 17, unidad: 'FARDO' },
  { codigo: 'MDF-174', tipo: 'Musculosa Mujer CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 120000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-175', tipo: 'New Brand #1 IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-176', tipo: 'New brand exotico', proveedor: 'General', precioCosto: 0, precioSugerido: 250000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-177', tipo: 'New Brand STD IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-178', tipo: 'Niño Frio Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-179', tipo: 'niño inv 0/14 1y2 beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 110000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-180', tipo: 'Niño INV 1RA CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-181', tipo: 'Niño invierno B CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 150000, stockActual: 15, unidad: 'FARDO' },
  { codigo: 'MDF-182', tipo: 'Niño Invierno Premiun BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 280000, stockActual: 9, unidad: 'FARDO' },
  { codigo: 'MDF-183', tipo: 'Niño verano B CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-184', tipo: 'Niño Verano IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 160000, stockActual: 36, unidad: 'FARDO' },
  { codigo: 'MDF-185', tipo: 'niño verano p1', proveedor: 'General', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-186', tipo: 'Niño Verano Premiu BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 350000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-187', tipo: 'North Face  Columbia A STD IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 380000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-188', tipo: 'North Face Jacket 25 KG', proveedor: 'RT', precioCosto: 0, precioSugerido: 320000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-189', tipo: 'Old Navi Niño', proveedor: 'General', precioCosto: 0, precioSugerido: 2800, stockActual: 0, unidad: 'PIEZA' },
  { codigo: 'MDF-190', tipo: 'Original Short POMS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 80000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-191', tipo: 'Oversize  Premium Verano POMS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-192', tipo: 'Oversize Mixta Invierno Premium IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 130000, stockActual: 5, unidad: 'FARDO' },
  { codigo: 'MDF-193', tipo: 'Oversize Mixta Verano  Premium IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 120000, stockActual: 17, unidad: 'FARDO' },
  { codigo: 'MDF-194', tipo: 'Palazo BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 300000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-195', tipo: 'Pantalon Cargo 1 Y 2 CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-196', tipo: 'Pantalon Cotele BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 130000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-197', tipo: 'Pantalon Cotele Mujer CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 140000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-198', tipo: 'Pantalon de trabajo', proveedor: 'General', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-199', tipo: 'Pantalon de Vestir Hombre CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 120000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-200', tipo: 'Pantalon Deportivo BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 300000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-201', tipo: 'Pantalon Deportivo Marca POMS 25 KILOS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 260000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-202', tipo: 'Pantalon deportivo TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 150000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-203', tipo: 'Pantalon Eco - Cuero IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 180000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-204', tipo: 'Pantalon Palazo IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 240000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-205', tipo: 'Pantalon Rayon Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 300000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-206', tipo: 'Pantalón Rayon CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 280000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-207', tipo: 'Pantalon Rayon IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 240000, stockActual: 6, unidad: 'FARDO' },
  { codigo: 'MDF-208', tipo: 'Pantalon Secado Rapido IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 250000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-209', tipo: 'Pantalon Skinny CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 150000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-210', tipo: 'Pantalon Vestir CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 120000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-211', tipo: 'Parka A', proveedor: 'General', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-212', tipo: 'Parka Adulto Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-213', tipo: 'Parka Adulto MDF', proveedor: 'MDF', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-214', tipo: 'Parka Adulto Primera IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-215', tipo: 'Parka B', proveedor: 'General', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-216', tipo: 'Parka coreana corta', proveedor: 'RT', precioCosto: 0, precioSugerido: 150000, stockActual: 23, unidad: '20 KILOS' },
  { codigo: 'MDF-217', tipo: 'Parka coreana corta y larga', proveedor: 'RT', precioCosto: 0, precioSugerido: 230000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-218', tipo: 'Parka COREANA larga', proveedor: 'General', precioCosto: 0, precioSugerido: 150000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-219', tipo: 'Parka DE NIÑO 2DA', proveedor: 'General', precioCosto: 0, precioSugerido: 50000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-220', tipo: 'Parka Italiana 40 kg', proveedor: 'General', precioCosto: 0, precioSugerido: 200000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-221', tipo: 'Parka Larga IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 150000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-222', tipo: 'Parka Niño 1ra IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 70000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-223', tipo: 'Parka Niño BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-224', tipo: 'Parka Niño COREANA', proveedor: 'General', precioCosto: 0, precioSugerido: 200000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-225', tipo: 'Parka STD IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 150000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-226', tipo: 'ParkaSin Manga CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 240000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-227', tipo: 'Peto deportivo beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 280000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-228', tipo: 'Peto Deportivo CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 350000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-229', tipo: 'Pijama Invierno CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-230', tipo: 'Pijama Invierno Premium BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-231', tipo: 'Pijama Polar', proveedor: 'General', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-232', tipo: 'Pijama Polar CANADA 2.0', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 80000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-233', tipo: 'Pijama Polar IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 50000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-234', tipo: 'Pijama Polar zt', proveedor: 'ZT', precioCosto: 0, precioSugerido: 90000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-235', tipo: 'Pink  POMS 25 KG', proveedor: 'POMS', precioCosto: 0, precioSugerido: 150000, stockActual: 0, unidad: '20 KILOS' },
  { codigo: 'MDF-236', tipo: 'Pink  TOM Y JERRY 25 KG', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 260000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-237', tipo: 'Plus size  Hombre Invierno P1 IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 200000, stockActual: 14, unidad: 'FARDO' },
  { codigo: 'MDF-238', tipo: 'Plus Size  Mujer Invierno Crema IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 220000, stockActual: 9, unidad: 'FARDO' },
  { codigo: 'MDF-239', tipo: 'Plus Size Blusa beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-240', tipo: 'Plus Size Blusa IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 160000, stockActual: 10, unidad: 'FARDO' },
  { codigo: 'MDF-241', tipo: 'Plus Size Hombre Verano Crema IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 200000, stockActual: 17, unidad: 'FARDO' },
  { codigo: 'MDF-242', tipo: 'Plus Size Invierno Premium BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 200000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-243', tipo: 'Plus Size Mixto POMS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-244', tipo: 'Plus Size Mujer Verano P1 IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 220000, stockActual: 19, unidad: 'FARDO' },
  { codigo: 'MDF-245', tipo: 'Plus Size Polera Mujer Manga Corta Verano Premium', proveedor: 'RT', precioCosto: 0, precioSugerido: 100000, stockActual: 82, unidad: 'FARDO' },
  { codigo: 'MDF-246', tipo: 'Plus Size Polera Musculosa Mujer  IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 150000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-247', tipo: 'Plus Size Sumer Brand (Marca Verano ) IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 250000, stockActual: 37, unidad: 'FARDO' },
  { codigo: 'MDF-248', tipo: 'Plus Size Traje De Baño TARGET', proveedor: 'TARGET', precioCosto: 0, precioSugerido: 250000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-249', tipo: 'Plus size Vestido BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-250', tipo: 'Plus Size Vestido Media Estacion IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 150000, stockActual: 13, unidad: 'FARDO' },
  { codigo: 'MDF-251', tipo: 'Plus Size Vestido Verano CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-252', tipo: 'Plus Size Vestido Verano IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-253', tipo: 'Plus Size Winter Brand IM (Marca invierno)', proveedor: 'IM', precioCosto: 0, precioSugerido: 250000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-254', tipo: 'polar canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 130000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-255', tipo: 'Polar Corderito IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-256', tipo: 'polar dubai', proveedor: 'General', precioCosto: 0, precioSugerido: 100000, stockActual: 8, unidad: 'FARDO' },
  { codigo: 'MDF-257', tipo: 'Polar IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 130000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-258', tipo: 'Polar Marca 25 Kg', proveedor: 'General', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-259', tipo: 'Polar Moderno Premium BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 260000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-260', tipo: 'Polar POMS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 80000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-261', tipo: 'Polar S.A', proveedor: 'S.A', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-262', tipo: 'Polar TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 80000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-263', tipo: 'Polar Top IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 60000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-264', tipo: 'POLERA ATLETICA BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 220000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-265', tipo: 'Polera Atletica primeras y segunda capa BETA', proveedor: 'IM', precioCosto: 0, precioSugerido: 250000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-266', tipo: 'Polera Cuello De Tortuga CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 120000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-267', tipo: 'Polera Deportiva B CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-268', tipo: 'Polera Deportiva Manga Corta IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 150000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-269', tipo: 'Polera Deportiva Premium', proveedor: 'RT', precioCosto: 0, precioSugerido: 330000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-270', tipo: 'Polera Hombre M/C BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 210000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-271', tipo: 'Polera Hombre M/C Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 210000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-272', tipo: 'Polera Hombre M/C IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 200000, stockActual: 13, unidad: 'FARDO' },
  { codigo: 'MDF-273', tipo: 'Polera Hombre M/C POMS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-274', tipo: 'Polera Hombre m/l', proveedor: 'General', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-275', tipo: 'Polera Hombre M/L CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 150000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-276', tipo: 'Polera Hombre m/l IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-277', tipo: 'Polera Hombre M/L TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 130000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-278', tipo: 'Polera Hombre Plus Size CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-279', tipo: 'Polera M/C Hombre Plus Size  FE', proveedor: 'FE', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-280', tipo: 'Polera M/C Mujer Plus Size POMS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 80000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-281', tipo: 'Polera m/l mujer JK', proveedor: 'JK', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-282', tipo: 'Polera Manga Corta Mujer IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 30, unidad: 'FARDO' },
  { codigo: 'MDF-283', tipo: 'Polera Manga Corta Mujer IM P1', proveedor: 'IM', precioCosto: 0, precioSugerido: 150000, stockActual: 16, unidad: 'FARDO' },
  { codigo: 'MDF-284', tipo: 'Polera Marca m/c 25 KG TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 240000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-285', tipo: 'Polera Mujer  M/L Premium', proveedor: 'General', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-286', tipo: 'Polera Mujer M/C Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 150000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-287', tipo: 'Polera Mujer M/L / S.A', proveedor: 'S.A', precioCosto: 0, precioSugerido: 70000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-288', tipo: 'Polera Mujer M/L BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 100000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-289', tipo: 'Polera Mujer m/l ZT', proveedor: 'ZT', precioCosto: 0, precioSugerido: 80000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-290', tipo: 'Polera Mujer Manga Corta B', proveedor: 'RT', precioCosto: 0, precioSugerido: 90000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-291', tipo: 'Polera Mujer Manga corta FE', proveedor: 'FE', precioCosto: 0, precioSugerido: 100000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-292', tipo: 'Polera Niño M/L TIGRE', proveedor: 'TIGRE', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-293', tipo: 'Polera Plus Size Hombre m/c IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 110000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-294', tipo: 'Poleron  Con Gorro Premium BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 280000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-295', tipo: 'Poleron C/G  IM 1Y2', proveedor: 'IM', precioCosto: 0, precioSugerido: 60000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-296', tipo: 'Poleron C/G Delgado Fashion IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-297', tipo: 'Poleron C/G Niño TOP', proveedor: 'General', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-298', tipo: 'Poleron C/G Primera BETA', proveedor: 'IM', precioCosto: 0, precioSugerido: 180000, stockActual: 25, unidad: 'FARDO' },
  { codigo: 'MDF-299', tipo: 'Poleron Con Cierre IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 90000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-300', tipo: 'Poleron con gorro 1ra im', proveedor: 'IM', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-301', tipo: 'Poleron Con Gorro 2DA', proveedor: 'General', precioCosto: 0, precioSugerido: 50000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-302', tipo: 'Poleron Con Gorro CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 120000, stockActual: 13, unidad: 'FARDO' },
  { codigo: 'MDF-303', tipo: 'Poleron con gorro marca 2da 25 kg', proveedor: 'General', precioCosto: 0, precioSugerido: 150000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-304', tipo: 'Poleron Con Gorro Niño BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-305', tipo: 'Poleron Con Gorro Plus Size  CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-306', tipo: 'Poleron con gorro S.A o/s', proveedor: 'S.A', precioCosto: 0, precioSugerido: 80000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-307', tipo: 'Poleron Con Gorro TIGRE 2da', proveedor: 'TIGRE', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-308', tipo: 'Poleron Con Gorro Top CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-309', tipo: 'Poleron Con y Sin Gorro Poms', proveedor: 'POMS', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-310', tipo: 'Poleron crop top', proveedor: 'General', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-311', tipo: 'POLERON MARCA ALGODON 25 KG TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 250000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-312', tipo: 'Poleron Marca Deportivo TOM Y JERRY 25 KG', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 280000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-313', tipo: 'Poleron S/G BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 100000, stockActual: 21, unidad: 'FARDO' },
  { codigo: 'MDF-314', tipo: 'Poleron S/G CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 90000, stockActual: 12, unidad: 'FARDO' },
  { codigo: 'MDF-315', tipo: 'Poleron S/G Canada 2,0', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 70000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-316', tipo: 'Poleron S/G TIGRE', proveedor: 'TIGRE', precioCosto: 0, precioSugerido: 55000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-317', tipo: 'Poleron S/G TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 80000, stockActual: 17, unidad: 'FARDO' },
  { codigo: 'MDF-318', tipo: 'Poleron Sin Gorro Marca  25 KG TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 240000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-319', tipo: 'PROVISORIO', proveedor: 'General', precioCosto: 0, precioSugerido: 0, stockActual: 198637, unidad: 'FARDO' },
  { codigo: 'MDF-320', tipo: 'Ravanas BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 140000, stockActual: 10, unidad: 'FARDO' },
  { codigo: 'MDF-321', tipo: 'Retorno Traje de Baño Target', proveedor: 'TARGET', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-322', tipo: 'Ropa Clinica TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-323', tipo: 'Ropa de Casa "B" CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 110000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-324', tipo: 'Ropa de Casa A CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 150000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-325', tipo: 'Ropa de casa BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 140000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-326', tipo: 'Ropa De Casa Navidad CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-327', tipo: 'Ropa De Casa TIGRE', proveedor: 'TIGRE', precioCosto: 0, precioSugerido: 90000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-328', tipo: 'Ropa De Perro BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-329', tipo: 'Ropa De Trabajo', proveedor: 'General', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-330', tipo: 'Ropa ejercio premium beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-331', tipo: 'Ropa Mascota FE 20KG', proveedor: 'FE', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-332', tipo: 'Ropa Mascota IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-333', tipo: 'Ropa Sky Niño', proveedor: 'General', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-334', tipo: 'Sabana beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-335', tipo: 'Sabana Blanca CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 150000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-336', tipo: 'Sabana Franella CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-337', tipo: 'Sabanas bajeras', proveedor: 'General', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-338', tipo: 'Sabanas Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-339', tipo: 'Sabanas Franella BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-340', tipo: 'Saco Mantel', proveedor: 'General', precioCosto: 0, precioSugerido: 70000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-341', tipo: 'Shein Brand IM de', proveedor: 'IM', precioCosto: 0, precioSugerido: 150000, stockActual: 8, unidad: 'FARDO' },
  { codigo: 'MDF-342', tipo: 'Short 2da', proveedor: 'RT', precioCosto: 0, precioSugerido: 60000, stockActual: 14, unidad: 'FARDO' },
  { codigo: 'MDF-343', tipo: 'Short Boxer IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 170000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-344', tipo: 'Short Cargo CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-345', tipo: 'Short Cargo O/S 1', proveedor: 'RT', precioCosto: 0, precioSugerido: 140000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-346', tipo: 'Short Deportivo  Niño BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 250000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-347', tipo: 'Short deportivo Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 280000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-348', tipo: 'Short Deportivo Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-349', tipo: 'Short Hombre Plus Size IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-350', tipo: 'Short Juvenil Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 190000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-351', tipo: 'Short Mezclilla Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-352', tipo: 'Short Mixto IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-353', tipo: 'Short Original canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-354', tipo: 'Short Sexy BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-355', tipo: 'Short Sexy Tigre', proveedor: 'TIGRE', precioCosto: 0, precioSugerido: 130000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-356', tipo: 'Shorts sexi canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-357', tipo: 'Skinny  Jeans CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-358', tipo: 'Sky Adulto IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-359', tipo: 'Sky Nieve Niño IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-360', tipo: 'Sky Niño JK', proveedor: 'JK', precioCosto: 0, precioSugerido: 140000, stockActual: 9, unidad: 'FARDO' },
  { codigo: 'MDF-361', tipo: 'Summer Brand 2DA IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 300000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-362', tipo: 'Summer Brand STD (Marca Verano) IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-363', tipo: 'Super niño invierno P1 IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-364', tipo: 'Surf  20 KG IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 90000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-365', tipo: 'Surtido Crema niño y adulto 1ra RT', proveedor: 'RT', precioCosto: 0, precioSugerido: 120000, stockActual: 17, unidad: 'FARDO' },
  { codigo: 'MDF-366', tipo: 'Surtido Crema Premium RT', proveedor: 'RT', precioCosto: 0, precioSugerido: 150000, stockActual: 100, unidad: '20 KILOS, 25 KILOS, PIEZA, FARDO' },
  { codigo: 'MDF-367', tipo: 'Surtido Juvenil Invierno P1 IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 180000, stockActual: 18, unidad: 'FARDO' },
  { codigo: 'MDF-368', tipo: 'Surtido Plush CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 100000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-369', tipo: 'Sweater  CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 60000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-370', tipo: 'Sweater Cardigan IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 50000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-371', tipo: 'Sweater Fashion Mujer POMS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-372', tipo: 'Sweater Hombre CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 150000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-373', tipo: 'Sweater Hombre POMS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 120000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-374', tipo: 'Sweater juvenil  BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 100000, stockActual: 12, unidad: 'FARDO' },
  { codigo: 'MDF-375', tipo: 'Sweater Largo BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 90000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-376', tipo: 'Sweater Mujer Moderno Premium BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-377', tipo: 'Sweater Niño CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 80000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-378', tipo: 'Sweater Pesado EMOJI', proveedor: 'General', precioCosto: 0, precioSugerido: 50000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-379', tipo: 'Sweater Pesado IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 50000, stockActual: 14, unidad: 'FARDO' },
  { codigo: 'MDF-380', tipo: 'Sweater Vestido 1RA IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-381', tipo: 'Sweter hombre Premiun BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-382', tipo: 'Talla Grande Invierno 1ra BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-383', tipo: 'Toallas Nuevas  POMS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 220000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-384', tipo: 'Traje De Baño', proveedor: 'General', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-385', tipo: 'Traje De Baño Hombre Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 320000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-386', tipo: 'Traje De Baño Mujer  IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-387', tipo: 'Traje de Baño p1', proveedor: 'General', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-388', tipo: 'Traje De Baño POMS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 80000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-389', tipo: 'Vestido De Novia CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 250000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-390', tipo: 'Vestido Fiesta TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 320000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-391', tipo: 'Vestido Invierno CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-392', tipo: 'Vestido invierno premium BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 8, unidad: 'FARDO' },
  { codigo: 'MDF-393', tipo: 'Vestido Media Estacion IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 140000, stockActual: 41, unidad: 'FARDO' },
  { codigo: 'MDF-394', tipo: 'vestido mini beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-395', tipo: 'Vestido Niña', proveedor: 'General', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-396', tipo: 'Vestido Poliester', proveedor: 'General', precioCosto: 0, precioSugerido: 220000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-397', tipo: 'Vestido Polo', proveedor: 'General', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-398', tipo: 'Vestido Polo FE', proveedor: 'FE', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-399', tipo: 'Vestido Verano BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-400', tipo: 'Vestido Verano CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 220000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-401', tipo: 'VESTIDOS POLO FE 2DA', proveedor: 'FE', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-402', tipo: 'Winter Mix JK', proveedor: 'JK', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-403', tipo: 'Winter Premium Platinium CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 280000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-404', tipo: 'Zara  Invierno 25 KG', proveedor: 'ZARA', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: '25 KILOS' }
];

interface StoreContextType {
  currentUser: { nombre: string; rol: StaffRole } | null;
  settings: { soundEnabled: boolean; cloudUrl: string; lastSync: string | null; dbConnected: boolean; lastError: string | null };
  updateSettings: (newSettings: any) => void;
  playSound: (type: 'click' | 'success' | 'transition') => void;
  login: (nombre: string, rol: StaffRole) => void;
  logout: () => void;
  sales: Sale[];
  stock: StockItem[];
  staff: StaffMember[];
  purchases: Purchase[];
  carriers: string[];
  adjustments: CommissionAdjustment[];
  addSale: (saleData: Partial<Sale>) => Sale;
  updateSale: (id: string, updatedData: Partial<Sale>) => void;
  markAsSent: (saleId: string) => void;
  updateDispatchStatus: (saleId: string, status: DispatchStatus) => void;
  updateDispatchItems: (saleId: string, quantity: number) => void;
  assignCarrier: (saleId: string, carrier: string) => void;
  addCarrier: (name: string) => void;
  removeCarrier: (name: string) => void;
  addAdjustment: (adj: Omit<CommissionAdjustment, 'id'>) => void;
  removeAdjustment: (id: string) => void;
  clearAllSales: () => void;
  addStockItem: (item: Omit<StockItem, 'id' | 'disponible'>) => void;
  updateStockItem: (id: string, updatedData: Partial<StockItem>) => void;
  removeStockItem: (id: string) => void;
  bulkAddStock: (items: Omit<StockItem, 'id' | 'disponible'>[]) => void;
  resetToMasterStock: () => void;
  addStaff: (member: Omit<StaffMember, 'id' | 'activo'>) => void;
  removeStaff: (id: string) => void;
  addPurchase: (p: Omit<Purchase, 'id' | 'saldoPendiente' | 'abonos' | 'estado'>) => void;
  removePurchase: (id: string) => void;
  addAbono: (purchaseId: string, monto: number, metodo: string, observacion: string) => void;
  removeAbono: (purchaseId: string, abonoId: string) => void;
  getStats: () => any;
  syncWithCloud: (silent?: boolean) => Promise<boolean>;
  pushToCloud: (curSales: Sale[], curStock: StockItem[], curStaff: StaffMember[], curPurchases: Purchase[]) => Promise<void>;
  isSyncing: boolean;
  lastSync: string | null;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('mdf_settings');
    return saved ? JSON.parse(saved) : { soundEnabled: true, cloudUrl: '', lastSync: null, dbConnected: false, lastError: null };
  });

  const [sales, setSales] = useState<Sale[]>(() => JSON.parse(localStorage.getItem('mdf_sales') || '[]'));
  
  const [stock, setStock] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem('mdf_stock');
    if (saved && JSON.parse(saved).length > 0) return JSON.parse(saved);
    
    return INITIAL_MASTER_STOCK.map(item => ({
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      disponible: item.stockActual > 0
    }));
  });

  const [staff, setStaff] = useState<StaffMember[]>(() => JSON.parse(localStorage.getItem('mdf_staff') || '[]'));
  const [purchases, setPurchases] = useState<Purchase[]>(() => JSON.parse(localStorage.getItem('mdf_purchases') || '[]'));
  
  const [carriers, setCarriers] = useState<string[]>(() => {
    const saved = localStorage.getItem('mdf_carriers');
    return saved ? JSON.parse(saved) : [
      'Isaias Peralta',
      'Anthony Mendez',
      'Ariel Echeverria',
      'Gonzalo Duarte',
      'Transportes Tamarindo',
      'Transportes Runn'
    ];
  });
  
  const [adjustments, setAdjustments] = useState<CommissionAdjustment[]>(() => JSON.parse(localStorage.getItem('mdf_adjustments') || '[]'));

  const isSyncingRef = useRef(false);

  const calculatePurchaseState = (purchase: Purchase) => {
    const totalAbonado = purchase.abonos.reduce((acc, a) => acc + a.monto, 0);
    const saldoPendiente = Math.max(0, purchase.montoTotal - totalAbonado);
    return {
      ...purchase,
      saldoPendiente,
      estado: saldoPendiente <= 0 ? 'PAGADO' : 'PENDIENTE' as 'PAGADO' | 'PENDIENTE'
    };
  };

  const updateSettings = (newSettings: any) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('mdf_settings', JSON.stringify(updated));
  };

  const playSound = useCallback((type: 'click' | 'success' | 'transition') => {
    if (!settings.soundEnabled) return;
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      const now = ctx.currentTime;
      if (type === 'click') {
        osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.1, now); osc.start(now); osc.stop(now + 0.1);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, now); osc.frequency.setValueAtTime(659.25, now + 0.1);
        gain.gain.setValueAtTime(0.1, now); osc.start(now); osc.stop(now + 0.3);
      } else if (type === 'transition') {
        osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
        gain.gain.setValueAtTime(0.05, now); osc.start(now); osc.stop(now + 0.15);
      }
    } catch (e) {}
  }, [settings.soundEnabled]);

  const pushToCloud = async (curSales: Sale[], curStock: StockItem[], curStaff: StaffMember[], curPurchases: Purchase[], curCarriers?: string[], curAdjustments?: CommissionAdjustment[]) => {
    setIsSyncing(true);
    try {
      const batch = writeBatch(db);
      
      curSales.forEach(s => batch.set(doc(db, 'sales', s.id), s));
      curStock.forEach(s => batch.set(doc(db, 'stock', s.id), s));
      curStaff.forEach(s => batch.set(doc(db, 'staff', s.id), s));
      curPurchases.forEach(p => batch.set(doc(db, 'purchases', p.id), p));
      (curAdjustments || adjustments).forEach(a => batch.set(doc(db, 'adjustments', a.id), a));
      
      batch.set(doc(db, 'config', 'carriers'), { list: curCarriers || carriers });
      
      await batch.commit();
      
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      updateSettings({ dbConnected: true, lastError: null, lastSync: timeString });
    } catch (error: any) {
      updateSettings({ dbConnected: false, lastError: error.message });
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const syncWithCloud = async (silent = false) => {
    return true;
  };

  useEffect(() => {
    let unsubSales: any;
    let unsubStock: any;
    let unsubStaff: any;
    let unsubPurchases: any;
    let unsubAdjustments: any;
    let unsubConfig: any;

    const initFirebase = async () => {
      try {
        const salesSnap = await getDocs(collection(db, 'sales'));
        const stockSnap = await getDocs(collection(db, 'stock'));
        
        const cloudHasData = !salesSnap.empty || !stockSnap.empty;
        const localHasData = sales.length > 0 || stock.length > 0;

        if (!cloudHasData && localHasData) {
          console.log("Migrando datos locales a Firebase...");
          await pushToCloud(sales, stock, staff, purchases, carriers, adjustments);
        }

        unsubSales = onSnapshot(collection(db, 'sales'), (snap) => {
          setSales(snap.docs.map(d => d.data() as Sale));
        });
        unsubStock = onSnapshot(collection(db, 'stock'), (snap) => {
          setStock(snap.docs.map(d => d.data() as StockItem));
        });
        unsubStaff = onSnapshot(collection(db, 'staff'), (snap) => {
          setStaff(snap.docs.map(d => d.data() as StaffMember));
        });
        unsubPurchases = onSnapshot(collection(db, 'purchases'), (snap) => {
          setPurchases(snap.docs.map(d => d.data() as Purchase));
        });
        unsubAdjustments = onSnapshot(collection(db, 'adjustments'), (snap) => {
          setAdjustments(snap.docs.map(d => d.data() as CommissionAdjustment));
        });
        unsubConfig = onSnapshot(doc(db, 'config', 'carriers'), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.list) setCarriers(data.list);
          }
        });
      } catch (error) {
        console.error("Error inicializando Firebase:", error);
      }
    };

    initFirebase();

    return () => {
      if (unsubSales) unsubSales();
      if (unsubStock) unsubStock();
      if (unsubStaff) unsubStaff();
      if (unsubPurchases) unsubPurchases();
      if (unsubAdjustments) unsubAdjustments();
      if (unsubConfig) unsubConfig();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('mdf_sales', JSON.stringify(sales));
    localStorage.setItem('mdf_stock', JSON.stringify(stock));
    localStorage.setItem('mdf_staff', JSON.stringify(staff));
    localStorage.setItem('mdf_purchases', JSON.stringify(purchases));
    localStorage.setItem('mdf_carriers', JSON.stringify(carriers));
    localStorage.setItem('mdf_adjustments', JSON.stringify(adjustments));
    localStorage.setItem('mdf_settings', JSON.stringify(settings));
  }, [sales, stock, staff, purchases, carriers, adjustments, settings]);

  const [currentUser, setCurrentUser] = useState<{ nombre: string; rol: StaffRole } | null>(() => {
    const saved = sessionStorage.getItem('mdf_session');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (nombre: string, rol: StaffRole) => {
    const user = { nombre, rol };
    setCurrentUser(user);
    sessionStorage.setItem('mdf_session', JSON.stringify(user));
    playSound('success');
    syncWithCloud();
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('mdf_session');
    playSound('click');
  };

  const addSale = (saleData: Partial<Sale>) => {
    const now = new Date();
    const newSale: Sale = {
      ...saleData,
      id: Math.random().toString(36).substr(2, 9),
      numeroVenta: sales.length > 0 ? Math.max(...sales.map(s => s.numeroVenta || 0)) + 1 : 2000,
      fecha: now.toLocaleDateString(),
      hora: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: SaleStatus.PENDIENTE,
      enviado: false,
      datosCompletos: saleData.tipoVenta === SaleType.NORMAL,
      estadoDespacho: DispatchStatus.PREPARACION,
      itemsDespachados: 0,
      tipoDespacho: saleData.tipoDespacho || '' // Avoid undefined for Firestore
    } as Sale;
    
    // Remove undefined values to prevent Firestore errors
    const cleanSale = Object.fromEntries(Object.entries(newSale).filter(([_, v]) => v !== undefined));
    
    setDoc(doc(db, 'sales', newSale.id), cleanSale);

    const stockItem = stock.find(item => item.codigo === saleData.codigoFardo);
    if (stockItem) {
      const nuevoStockVal = Math.max(0, stockItem.stockActual - (saleData.cantidad || 1));
      setDoc(doc(db, 'stock', stockItem.id), { ...stockItem, stockActual: nuevoStockVal, disponible: nuevoStockVal > 0 });
    }

    return newSale;
  };

  const updateSale = (id: string, updatedData: Partial<Sale>) => {
    const sale = sales.find(s => s.id === id);
    if (sale) setDoc(doc(db, 'sales', id), { ...sale, ...updatedData });
  };

  const markAsSent = (saleId: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (sale) {
      setDoc(doc(db, 'sales', saleId), { ...sale, status: SaleStatus.ENVIADO, enviado: true, fechaDespacho: new Date().toISOString(), estadoDespacho: DispatchStatus.EN_RUTA });
      playSound('success');
    }
  };

  const updateDispatchStatus = (saleId: string, status: DispatchStatus) => {
    const sale = sales.find(s => s.id === saleId);
    if (sale) setDoc(doc(db, 'sales', saleId), { ...sale, estadoDespacho: status });
  };

  const updateDispatchItems = (saleId: string, quantity: number) => {
    const sale = sales.find(s => s.id === saleId);
    if (sale) setDoc(doc(db, 'sales', saleId), { ...sale, itemsDespachados: quantity });
  };

  const assignCarrier = (saleId: string, carrier: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (sale) setDoc(doc(db, 'sales', saleId), { ...sale, transportista: carrier });
  };

  const assignAgency = (saleId: string, agency: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (sale) setDoc(doc(db, 'sales', saleId), { ...sale, agencia: agency });
  };

  const addCarrier = (name: string) => {
    if (!carriers.includes(name)) {
      const newCarriers = [...carriers, name];
      setDoc(doc(db, 'config', 'carriers'), { list: newCarriers });
    }
  };

  const removeCarrier = (name: string) => {
    const newCarriers = carriers.filter(c => c !== name);
    setDoc(doc(db, 'config', 'carriers'), { list: newCarriers });
  };

  const addAdjustment = (adj: Omit<CommissionAdjustment, 'id'>) => {
    const newAdj = { ...adj, id: Math.random().toString(36).substr(2, 9) };
    setDoc(doc(db, 'adjustments', newAdj.id), newAdj);
  };

  const removeAdjustment = (id: string) => {
    deleteDoc(doc(db, 'adjustments', id));
  };

  const clearAllSales = () => {
    sales.forEach(s => deleteDoc(doc(db, 'sales', s.id)));
  };

  const addStockItem = (item: Omit<StockItem, 'id' | 'disponible'>) => {
    const newId = Math.random().toString(36).substr(2, 9);
    setDoc(doc(db, 'stock', newId), { ...item, id: newId, disponible: item.stockActual > 0 });
  };

  const updateStockItem = (id: string, updatedData: Partial<StockItem>) => {
    const item = stock.find(i => i.id === id);
    if (item) setDoc(doc(db, 'stock', id), { ...item, ...updatedData, disponible: (updatedData.stockActual ?? item.stockActual) > 0 });
  };

  const removeStockItem = (id: string) => {
    deleteDoc(doc(db, 'stock', id));
  };

  const bulkAddStock = (items: Omit<StockItem, 'id' | 'disponible'>[]) => {
    const batch = writeBatch(db);
    items.forEach(i => {
      const newId = Math.random().toString(36).substr(2, 9);
      batch.set(doc(db, 'stock', newId), { ...i, id: newId, disponible: i.stockActual > 0 });
    });
    batch.commit();
  };

  const resetToMasterStock = async () => {
    try {
      // First, delete all existing stock
      const stockDocs = await getDocs(collection(db, 'stock'));
      let deleteBatch = writeBatch(db);
      let deleteCount = 0;
      
      for (const document of stockDocs.docs) {
        deleteBatch.delete(document.ref);
        deleteCount++;
        if (deleteCount === 400) {
          await deleteBatch.commit();
          deleteBatch = writeBatch(db);
          deleteCount = 0;
        }
      }
      if (deleteCount > 0) await deleteBatch.commit();

      // Then, add the master stock
      let addBatch = writeBatch(db);
      let addCount = 0;
      
      for (const item of INITIAL_MASTER_STOCK) {
        const newId = Math.random().toString(36).substr(2, 9);
        addBatch.set(doc(db, 'stock', newId), { ...item, id: newId, disponible: item.stockActual > 0 });
        addCount++;
        if (addCount === 400) {
          await addBatch.commit();
          addBatch = writeBatch(db);
          addCount = 0;
        }
      }
      if (addCount > 0) await addBatch.commit();
      
    } catch (error) {
      console.error("Error resetting stock:", error);
    }
  };

  const addStaff = (member: Omit<StaffMember, 'id' | 'activo'>) => {
    const newId = Math.random().toString(36).substr(2, 9);
    setDoc(doc(db, 'staff', newId), { ...member, id: newId, activo: true });
  };

  const removeStaff = (id: string) => {
    deleteDoc(doc(db, 'staff', id));
  };

  const addPurchase = (p: Omit<Purchase, 'id' | 'saldoPendiente' | 'abonos' | 'estado'>) => {
    const newId = Math.random().toString(36).substr(2, 9);
    setDoc(doc(db, 'purchases', newId), {
      ...p,
      id: newId,
      saldoPendiente: p.montoTotal,
      abonos: [],
      estado: 'PENDIENTE'
    });
  };

  const removePurchase = (id: string) => {
    deleteDoc(doc(db, 'purchases', id));
  };

  const addAbono = (purchaseId: string, monto: number, metodo: string, observacion: string) => {
    const p = purchases.find(p => p.id === purchaseId);
    if (p) {
      const newAbono: Abono = {
        id: Math.random().toString(36).substr(2, 9),
        fecha: new Date().toLocaleDateString(),
        monto, metodo, observacion
      };
      const tempPurchase = { ...p, abonos: [...p.abonos, newAbono] };
      setDoc(doc(db, 'purchases', purchaseId), calculatePurchaseState(tempPurchase));
    }
  };

  const removeAbono = (purchaseId: string, abonoId: string) => {
    const p = purchases.find(p => p.id === purchaseId);
    if (p) {
      const filteredAbonos = p.abonos.filter(a => a.id !== abonoId);
      const tempPurchase = { ...p, abonos: filteredAbonos };
      setDoc(doc(db, 'purchases', purchaseId), calculatePurchaseState(tempPurchase));
    }
  };

  const getStats = () => {
    const today = new Date().toLocaleDateString();
    const todaySales = sales.filter(s => s.fecha === today);
    let totalCosto = 0;
    sales.forEach(sale => {
      const product = stock.find(p => p.codigo === sale.codigoFardo);
      if (product) totalCosto += (product.precioCosto * sale.cantidad);
    });
    const totalIngresos = sales.reduce((acc, s) => acc + (s.total || 0), 0);
    const sellerStats: Record<string, number> = {};
    sales.forEach(s => { if (s.vendedor) sellerStats[s.vendedor] = (sellerStats[s.vendedor] || 0) + s.total; });
    const topSellers = Object.entries(sellerStats).sort((a, b) => b[1] - a[1]).slice(0, 3);

    return {
      ventasHoy: todaySales.reduce((acc, s) => acc + (s.total || 0), 0),
      countHoy: todaySales.length,
      totalVendido: totalIngresos,
      utilidadTotal: totalIngresos - totalCosto,
      disponibles: stock.reduce((acc, i) => acc + i.stockActual, 0),
      pendientesDatos: sales.filter(s => !s.datosCompletos).length,
      topSellers,
      stockCritico: stock.filter(i => i.stockActual < 3 && i.stockActual > 0).length,
      valorInventarioVenta: stock.reduce((acc, i) => acc + (i.precioSugerido * i.stockActual), 0),
      deudaTotalProveedores: purchases.reduce((acc, p) => acc + p.saldoPendiente, 0),
      faltaCompletar: sales.filter(s => !s.datosCompletos).length,
      faltaPagar: sales.filter(s => s.estadoPago === 'Pendiente').length,
      faltaDespachar: sales.filter(s => s.datosCompletos && s.status === 'Pendiente').length
    };
  };

  const getReportData = (type: 'weekly' | 'monthly' | 'custom', startDate?: Date, endDate?: Date) => {
    const now = new Date();
    
    return sales.filter(s => {
      const [day, month, year] = s.fecha.split('/').map(Number);
      const saleDate = new Date(year, month - 1, day);
      
      if (type === 'custom' && startDate && endDate) {
        return saleDate >= startDate && saleDate <= endDate;
      } else if (type === 'weekly') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return saleDate >= oneWeekAgo;
      } else {
        return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
      }
    });
  };

  return (
    <StoreContext.Provider value={{
      currentUser, login, logout, settings, updateSettings, playSound,
      sales, stock, staff, purchases, carriers, adjustments, addSale, updateSale, markAsSent, updateDispatchStatus, updateDispatchItems, assignCarrier, assignAgency, addCarrier, removeCarrier, addAdjustment, removeAdjustment, clearAllSales,
      addStockItem, updateStockItem, removeStockItem, bulkAddStock, resetToMasterStock, addStaff, removeStaff, 
      addPurchase, removePurchase, addAbono, removeAbono, getStats, getReportData, syncWithCloud, pushToCloud, isSyncing, lastSync: settings.lastSync
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error();
  return context;
};