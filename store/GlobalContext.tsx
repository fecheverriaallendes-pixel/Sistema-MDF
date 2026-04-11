import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Sale, StockItem, SaleStatus, SaleType, StaffMember, StaffRole, Purchase, PurchaseType, Abono, DispatchType, DispatchStatus, CommissionAdjustment } from '../types';
import { db } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch, getDocs } from 'firebase/firestore';

const INITIAL_MASTER_STOCK: Omit<StockItem, 'id' | 'disponible'>[] = [
  { codigo: 'MDF-001', tipo: 'Abrigo Lana Hombre Corto IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 120000, stockActual: 37, unidad: 'FARDO' },
  { codigo: 'MDF-002', tipo: 'Abrigo Lana Mujer Corto IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 80000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-003', tipo: 'BABY PLATINIUM', proveedor: 'PLATINIUM', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-004', tipo: 'Blazer Juvenil', proveedor: 'General', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-005', tipo: 'Blazer verano', proveedor: 'General', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-006', tipo: 'BLUSA FANCY BETA', proveedor: 'BETA', precioCosto: 1, precioSugerido: 200000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-007', tipo: 'Blusa fanella', proveedor: 'General', precioCosto: 0, precioSugerido: 100000, stockActual: 6, unidad: 'FARDO' },
  { codigo: 'MDF-008', tipo: 'Blusa Invierno IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 38, unidad: 'FARDO' },
  { codigo: 'MDF-009', tipo: 'Blusa m/l FE', proveedor: 'FE', precioCosto: 0, precioSugerido: 80000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-010', tipo: 'Blusa Media Estación FE', proveedor: 'FE', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-011', tipo: 'BLUSA MEDIA TEMPORADA MDF', proveedor: 'MDF', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-012', tipo: 'blusa poly beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-013', tipo: 'Blusa Poly IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-014', tipo: 'Blusa verano canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-015', tipo: 'blusa verano plussise canada', proveedor: 'CANADA', precioCosto: 1, precioSugerido: 180000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-016', tipo: 'bluzas beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-017', tipo: 'Buzo Algodon Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 200000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-018', tipo: 'Buzo Algodon Im', proveedor: 'IM', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-019', tipo: 'Buzo canada A', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 220000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-020', tipo: 'Buzo Canada SPL', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-021', tipo: 'Buzo Deportivo CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 280000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-022', tipo: 'Buzo JK', proveedor: 'JK', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-023', tipo: 'Buzo Juvenil BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-024', tipo: 'Buzo Niño', proveedor: 'General', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-025', tipo: 'BUZO NYLON BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 280000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-026', tipo: 'Buzo Poly', proveedor: 'General', precioCosto: 0, precioSugerido: 260000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-027', tipo: 'Buzo polyester BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 260000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-028', tipo: 'buzo y chaqueta de nylon prem beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-029', tipo: 'Buzo y Chaqueta Entrenamiento', proveedor: 'General', precioCosto: 0, precioSugerido: 220000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-030', tipo: 'Buzo y Chaqueta Poliester Premium BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 350000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-031', tipo: 'CHAQUETA CUERO 1RA IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 120000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-032', tipo: 'Calcetin Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 160000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-033', tipo: 'Calcetin Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-034', tipo: 'Calza 3/4', proveedor: 'General', precioCosto: 0, precioSugerido: 250000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-035', tipo: 'CALZA CORTA DEPORTIVA CANADA BIKER', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 330000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-036', tipo: 'Calza Deportiva BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 280000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-037', tipo: 'Calza deportiva canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 280000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-038', tipo: 'Calza Deportiva IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-039', tipo: 'Calzon', proveedor: 'General', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-040', tipo: 'CAMISA DE HOMBRE TIGRE.', proveedor: 'TIGRE', precioCosto: 0, precioSugerido: 100000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-041', tipo: 'Camisa De Hombre M/C CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-042', tipo: 'Camisa Franella Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 160000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-043', tipo: 'CAMISA MEZCLILLA CANADA HOMBRE', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 0, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-044', tipo: 'Camisas Hombre M/L y M/C', proveedor: 'General', precioCosto: 0, precioSugerido: 250000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-045', tipo: 'Capri BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-046', tipo: 'Capri canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 70000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-047', tipo: 'Chaqueta Atletica (Poleron Deportivo)', proveedor: 'General', precioCosto: 0, precioSugerido: 250000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-048', tipo: 'CHAQUETA CUERO 2DA IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-049', tipo: 'CHAQUETA CUERO PREMIUN IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-050', tipo: 'Chaqueta Gamuza IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 80000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-051', tipo: 'CHAQUETA INV CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-052', tipo: 'chaqueta jeans B', proveedor: 'General', precioCosto: 0, precioSugerido: 180000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-053', tipo: 'Chaqueta Jeans Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 210000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-054', tipo: 'COBERTOR CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 160000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-055', tipo: 'CORTAVIENTO A', proveedor: 'General', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-056', tipo: 'Cortaviento B', proveedor: 'General', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-057', tipo: 'Cortavientos beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-058', tipo: 'Cosco Hombre', proveedor: 'General', precioCosto: 0, precioSugerido: 6000, stockActual: 3, unidad: 'PIEZA' },
  { codigo: 'MDF-059', tipo: 'Crip Crop Top', proveedor: 'General', precioCosto: 0, precioSugerido: 180000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-060', tipo: 'Crop Top Invierno IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 120000, stockActual: 15, unidad: 'FARDO' },
  { codigo: 'MDF-061', tipo: 'Cubrecolchon IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 6, unidad: 'FARDO' },
  { codigo: 'MDF-062', tipo: 'DEPORTIVO 1RA IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 280000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-063', tipo: 'Deportivo A', proveedor: 'General', precioCosto: 0, precioSugerido: 330000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-064', tipo: 'Deportivo B', proveedor: 'General', precioCosto: 0, precioSugerido: 220000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-065', tipo: 'Deportivo Economico Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 300000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-066', tipo: 'DEPORTIVO NIÑO BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 280000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-067', tipo: 'Deportivo Plus Size Crema IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-068', tipo: 'Deportivo Plus SIze Traack Suite IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 140000, stockActual: 5, unidad: 'FARDO' },
  { codigo: 'MDF-069', tipo: 'Deportivo Premium Im', proveedor: 'IM', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-070', tipo: 'Disfraz Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 160000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-071', tipo: 'Enterito canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 280000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-072', tipo: 'enterito fe', proveedor: 'FE', precioCosto: 0, precioSugerido: 250000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-073', tipo: 'Falda de Cuero IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-074', tipo: 'Falda Verano CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 160000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-075', tipo: 'Fashion Brand Exotico IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 180000, stockActual: 9, unidad: 'FARDO' },
  { codigo: 'MDF-076', tipo: 'Fashion Brand IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 200000, stockActual: 18, unidad: 'FARDO' },
  { codigo: 'MDF-077', tipo: 'FF EXOTICO', proveedor: 'General', precioCosto: 0, precioSugerido: 140000, stockActual: 16, unidad: 'FARDO' },
  { codigo: 'MDF-078', tipo: 'halloween', proveedor: 'General', precioCosto: 0, precioSugerido: 2800, stockActual: 47, unidad: 'PIEZA' },
  { codigo: 'MDF-079', tipo: 'GORRO Y BUFANDA CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 80000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-080', tipo: 'Halloween', proveedor: 'General', precioCosto: 0, precioSugerido: 100000, stockActual: 5, unidad: 'FARDO' },
  { codigo: 'MDF-081', tipo: 'Jardinera Mezclilla beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-082', tipo: 'Jardinera short IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 80000, stockActual: 6, unidad: 'FARDO' },
  { codigo: 'MDF-083', tipo: 'Jean levis mujer', proveedor: 'General', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-084', tipo: 'JEANS HOMBRE BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-085', tipo: 'jeans hombre canada b', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-086', tipo: 'Jeans Mujer CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-087', tipo: 'Jeans Mujer BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 160000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-088', tipo: 'Jumper Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 300000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-089', tipo: 'Jumper Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 300000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-090', tipo: 'KARATE', proveedor: 'General', precioCosto: 0, precioSugerido: 80000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-091', tipo: 'LADIES FASHIONS SWEATER', proveedor: 'General', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-092', tipo: 'LENCERIA CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-093', tipo: 'LINO BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-094', tipo: 'MANTEL BETA.', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-095', tipo: 'Marca #2 Canada SURTIDO MARCA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 280000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-096', tipo: 'Mix Chaqueta MDF', proveedor: 'MDF', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-097', tipo: 'Mix Mujer Plus Size Premium BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-098', tipo: 'Mix Mujer Verano Premium BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 280000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-099', tipo: 'MIXTA MUJER INVIERNO 1RA BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 120000, stockActual: 7, unidad: 'FARDO' },
  { codigo: 'MDF-100', tipo: 'mixta mujer invierno premiun beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 250000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-101', tipo: 'mixta mujer verano premiun poms', proveedor: 'POMS', precioCosto: 0, precioSugerido: 300000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-102', tipo: 'Mixta Verano IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 250000, stockActual: 6, unidad: 'FARDO' },
  { codigo: 'MDF-103', tipo: 'musculosa canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 120000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-104', tipo: 'New Brand #1 IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-105', tipo: 'new brand exotico', proveedor: 'General', precioCosto: 0, precioSugerido: 250000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-106', tipo: 'New Brand STD IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-107', tipo: 'Niño inv 1era 2da', proveedor: 'General', precioCosto: 0, precioSugerido: 50000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-108', tipo: 'Niño invierno 2da', proveedor: 'General', precioCosto: 0, precioSugerido: 150000, stockActual: 7, unidad: 'FARDO' },
  { codigo: 'MDF-109', tipo: 'Niño verano B', proveedor: 'General', precioCosto: 0, precioSugerido: 140000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-110', tipo: 'Niño Verano IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 150000, stockActual: 16, unidad: 'FARDO' },
  { codigo: 'MDF-111', tipo: 'Niño Verano P1 can', proveedor: 'General', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-112', tipo: 'NIÑO VERANO PREMIUN BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 350000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-113', tipo: 'NORTHFACE COLUMBIA STD IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 380000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-114', tipo: 'Old Navi Niño', proveedor: 'General', precioCosto: 0, precioSugerido: 2800, stockActual: 254, unidad: 'PIEZA' },
  { codigo: 'MDF-115', tipo: 'ORIGINAL SHORT POMS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 80000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-116', tipo: 'OVERSAY PREMIUN VERANO POMS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-117', tipo: 'Oversize Mixta Invierno Premium IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 130000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-118', tipo: 'Oversize Mixta Verano premium IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 120000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-119', tipo: 'PALAZO BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 300000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-120', tipo: 'Pantalon Cuero IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 180000, stockActual: 6, unidad: 'FARDO' },
  { codigo: 'MDF-121', tipo: 'Pantalon de trabajo', proveedor: 'General', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-122', tipo: 'pantalon de vestir hombre', proveedor: 'General', precioCosto: 0, precioSugerido: 120000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-123', tipo: 'PANTALON DEPORTIVO BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 300000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-124', tipo: 'Pantalon Palazo IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 240000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-125', tipo: 'Pantalon Rayon Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 300000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-126', tipo: 'Pantalón Rayon CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 280000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-127', tipo: 'Pantalon Rayon IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 240000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-128', tipo: 'PANTALON SECADO RAPIDO IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 250000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-129', tipo: 'Pantalon Skinny Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 150000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-130', tipo: 'Pantalon vestir Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 120000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-131', tipo: 'Parka A', proveedor: 'General', precioCosto: 0, precioSugerido: 200000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-132', tipo: 'PARKA ADULTO BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 200000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-133', tipo: 'Parka Adulto MDF', proveedor: 'MDF', precioCosto: 0, precioSugerido: 200000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-134', tipo: 'Parka Adulto Primera IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 180000, stockActual: 5, unidad: 'FARDO' },
  { codigo: 'MDF-135', tipo: 'PARKA B', proveedor: 'General', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-136', tipo: 'parka koreana', proveedor: 'General', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-137', tipo: 'PARKA NIÑO BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 200000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-138', tipo: 'PARKA NIÑO IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 70000, stockActual: 45, unidad: 'FARDO' },
  { codigo: 'MDF-139', tipo: 'Parka STD IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 150000, stockActual: 5, unidad: 'FARDO' },
  { codigo: 'MDF-140', tipo: 'Peto deportivo beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 280000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-141', tipo: 'PETO DEPORTIVO CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 350000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-142', tipo: 'pijama inv canada .', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-143', tipo: 'Pijama Polar', proveedor: 'General', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-144', tipo: 'Pijama Polar IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 50000, stockActual: 47, unidad: 'FARDO' },
  { codigo: 'MDF-145', tipo: 'Plus size Hombre Invierno P1 IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 200000, stockActual: 6, unidad: 'FARDO' },
  { codigo: 'MDF-146', tipo: 'Plus Size Blusa beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-147', tipo: 'Plus Size Blusa IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 160000, stockActual: 5, unidad: 'FARDO' },
  { codigo: 'MDF-148', tipo: 'Plus Size Hombre Verano Crema IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 200000, stockActual: 8, unidad: 'FARDO' },
  { codigo: 'MDF-149', tipo: 'Plus Size Mix Mujer Verano P1 IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 220000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-150', tipo: 'Plus Size Polera Mujer Manga Corta Verano Premium', proveedor: 'General', precioCosto: 0, precioSugerido: 120000, stockActual: 18, unidad: 'FARDO' },
  { codigo: 'MDF-151', tipo: 'Plus Size Polera Musculosa Mujer IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 150000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-152', tipo: 'Plus Size Sumer Brand (Marca Verano ) IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 260000, stockActual: 15, unidad: 'FARDO' },
  { codigo: 'MDF-153', tipo: 'PLUS SIZE TRAJE DE BAÑO TARGER', proveedor: 'TARGER', precioCosto: 0, precioSugerido: 250000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-154', tipo: 'Plus size Vestido BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-155', tipo: 'Plus Size Vestido Media Estacion IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 150000, stockActual: 10, unidad: 'FARDO' },
  { codigo: 'MDF-156', tipo: 'Plus Size Vestido Verano CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-157', tipo: 'Plus Size Vestido Verano IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-158', tipo: 'Plus Size Winter Brand IM (Marca invierno)', proveedor: 'IM', precioCosto: 0, precioSugerido: 250000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-159', tipo: 'PLUS ZISE MIXTO POMS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-160', tipo: 'PLUSZISE MUJER INV CREMA IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 180000, stockActual: 10, unidad: 'FARDO' },
  { codigo: 'MDF-161', tipo: 'Polar Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 130000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-162', tipo: 'Polar Corderito IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 120000, stockActual: 13, unidad: 'FARDO' },
  { codigo: 'MDF-163', tipo: 'POLAR IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 130000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-164', tipo: 'Polar Top IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 60000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-165', tipo: 'POLERA DEPORTIVA B CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-166', tipo: 'Polera Deportiva Manga Corta IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 150000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-167', tipo: 'Polera deportiva premium', proveedor: 'General', precioCosto: 0, precioSugerido: 330000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-168', tipo: 'Polera Hombre M/C "B" Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 140000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-169', tipo: 'Polera Hombre M/C BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 210000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-170', tipo: 'Polera Hombre M/C Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 210000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-171', tipo: 'POLERA HOMBRE M/C IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 200000, stockActual: 6, unidad: 'FARDO' },
  { codigo: 'MDF-172', tipo: 'Polera hombre m/l', proveedor: 'General', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-173', tipo: 'Polera hombre m/l IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 8, unidad: 'FARDO' },
  { codigo: 'MDF-174', tipo: 'POLERA HOMBRE MC POMS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-175', tipo: 'POLERA HOMBRE PLUSZIZE CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-176', tipo: 'POLERA M/C HOMBRE PLUS SIZE FE', proveedor: 'FE', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-177', tipo: 'Polera Manga Corta Mujer IM 120.000', proveedor: 'IM', precioCosto: 0, precioSugerido: 90000, stockActual: 6, unidad: 'FARDO' },
  { codigo: 'MDF-178', tipo: 'Polera Manga Corta Mujer IM P1', proveedor: 'IM', precioCosto: 0, precioSugerido: 150000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-179', tipo: 'POLERA MC MUJER TG POMS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 80000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-180', tipo: 'POLERA ML MUJER IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-181', tipo: 'Polera Mujer M/C Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 150000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-182', tipo: 'POLERA MUJER M/L BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 100000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-183', tipo: 'Polera mujer manga corta B', proveedor: 'General', precioCosto: 0, precioSugerido: 90000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-184', tipo: 'polera mujer manga corta fe', proveedor: 'FE', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-185', tipo: 'Polera Plus Size Hombre m/c IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 110000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-186', tipo: 'Poleron Con Gorro Premium BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 280000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-187', tipo: 'Poleron C/G IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 50000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-188', tipo: 'Poleron C/G B Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 100000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-189', tipo: 'Poleron C/G Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 14, unidad: 'FARDO' },
  { codigo: 'MDF-190', tipo: 'Poleron C/G DELGADO Fashion IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-191', tipo: 'Poleron C/G Niño TOP', proveedor: 'General', precioCosto: 0, precioSugerido: 160000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-192', tipo: 'Poleron C/G Primera IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 21, unidad: 'FARDO' },
  { codigo: 'MDF-193', tipo: 'Poleron Con Cierre IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 60000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-194', tipo: 'POLERON CON GORRO NIÑO BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 160000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-195', tipo: 'Poleron con gorro P1 IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-196', tipo: 'Poleron Con Gorro Plus Size CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-197', tipo: 'Poleron con gorro tigre 2da', proveedor: 'General', precioCosto: 0, precioSugerido: 100000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-198', tipo: 'Poleron con gorro top Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 220000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-199', tipo: 'Poleron Con y Sin Gorro Poms', proveedor: 'POMS', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-200', tipo: 'Poleron crip crop top', proveedor: 'General', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-201', tipo: 'Poleron S/G Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 90000, stockActual: 10, unidad: 'FARDO' },
  { codigo: 'MDF-202', tipo: 'Poleron S/G Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 70000, stockActual: 17, unidad: 'FARDO' },
  { codigo: 'MDF-203', tipo: 'Poleron S/G tigre', proveedor: 'General', precioCosto: 0, precioSugerido: 55000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-204', tipo: 'Poleron Sin Gorro Poms', proveedor: 'POMS', precioCosto: 0, precioSugerido: 80000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-205', tipo: 'PROVISORIO', proveedor: 'General', precioCosto: 0, precioSugerido: 0, stockActual: 9268, unidad: 'PIEZA' },
  { codigo: 'MDF-206', tipo: 'Retorno Traje de Baño Target', proveedor: 'TARGET', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-207', tipo: 'Ropa clinica im', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-208', tipo: 'Ropa de Casa "B" Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 110000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-209', tipo: 'Ropa de Casa A CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 150000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-210', tipo: 'ropa de casa beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-211', tipo: 'Ropa De Casa Navidad CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 200000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-212', tipo: 'ROPA DE CASA TIGRE', proveedor: 'TIGRE', precioCosto: 0, precioSugerido: 90000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-213', tipo: 'ROPA DE PERRO BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-214', tipo: 'Ropa De Trabajo', proveedor: 'General', precioCosto: 0, precioSugerido: 0, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-215', tipo: 'Ropa ejercio premium beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-216', tipo: 'Ropa Mascota FE 20KG', proveedor: 'FE', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-217', tipo: 'ROPA MASCOTA IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-218', tipo: 'Ropa Sky Niño', proveedor: 'General', precioCosto: 0, precioSugerido: 180000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-219', tipo: 'Sabana beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-220', tipo: 'SABANA FRANELA CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-221', tipo: 'sabanas bajeras', proveedor: 'General', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-222', tipo: 'SABANAS BLANCAS CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 150000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-223', tipo: 'Sabanas Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-224', tipo: 'Saco Mantel', proveedor: 'General', precioCosto: 0, precioSugerido: 70000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-225', tipo: 'SHEIN BRAND IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 150000, stockActual: 9, unidad: 'FARDO' },
  { codigo: 'MDF-226', tipo: 'SHEIN NIÑO', proveedor: 'General', precioCosto: 0, precioSugerido: 2800, stockActual: 61, unidad: 'PIEZA' },
  { codigo: 'MDF-227', tipo: 'Short Boxer IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 170000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-228', tipo: 'SHORT CARGO CAN', proveedor: 'General', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-229', tipo: 'Short deportivo Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 280000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-230', tipo: 'Short Deportivo Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-231', tipo: 'Short Hombre Plus Size IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-232', tipo: 'Short Juvenil Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 190000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-233', tipo: 'Short Mezclilla Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-234', tipo: 'Short Mixto IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-235', tipo: 'Short Original canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-236', tipo: 'SHORT SEXY BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 140000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-237', tipo: 'Short Sexy Tigre', proveedor: 'TIGRE', precioCosto: 0, precioSugerido: 130000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-238', tipo: 'SHORTS NIÑO BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 250000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-239', tipo: 'shorts sexi canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-240', tipo: 'SKI NIÑO IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 140000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-241', tipo: 'SKINY JEANS CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 140000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-242', tipo: 'Sky Adulto IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 160000, stockActual: 12, unidad: 'FARDO' },
  { codigo: 'MDF-243', tipo: 'SUETER VESTIDO 1RA IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 6, unidad: 'FARDO' },
  { codigo: 'MDF-244', tipo: 'SUMMER BRAND 2DA IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 300000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-245', tipo: 'Summer Brand STD (Marca Verano) IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 220000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-246', tipo: 'super niño invierno', proveedor: 'General', precioCosto: 0, precioSugerido: 140000, stockActual: 50, unidad: 'FARDO' },
  { codigo: 'MDF-247', tipo: 'SURF 20 KG IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 90000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-248', tipo: 'Surtido adulto economico', proveedor: 'General', precioCosto: 0, precioSugerido: 50000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-249', tipo: 'Surtido Chaqueta Invierno', proveedor: 'General', precioCosto: 0, precioSugerido: 180000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-250', tipo: 'Surtido Juvenil Invierno P1', proveedor: 'General', precioCosto: 0, precioSugerido: 180000, stockActual: 19, unidad: 'FARDO' },
  { codigo: 'MDF-251', tipo: 'SURTIDO PLUSH', proveedor: 'General', precioCosto: 0, precioSugerido: 100000, stockActual: 5, unidad: 'FARDO' },
  { codigo: 'MDF-252', tipo: 'Sweater CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 60000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-253', tipo: 'Sweater Cardigan IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 50000, stockActual: 42, unidad: 'FARDO' },
  { codigo: 'MDF-254', tipo: 'SWEATER FASHON MUJER POMS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-255', tipo: 'SWEATER HOMBRE CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 150000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-256', tipo: 'Sweater Hombre POMS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-257', tipo: 'Sweater juvenil BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 100000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-258', tipo: 'Sweater Largo BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 90000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-259', tipo: 'Sweater Pesado IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 50000, stockActual: 41, unidad: 'FARDO' },
  { codigo: 'MDF-260', tipo: 'TOALLAS POMS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 220000, stockActual: 6, unidad: 'FARDO' },
  { codigo: 'MDF-261', tipo: 'TRAJE DE BAÑO', proveedor: 'General', precioCosto: 0, precioSugerido: 120000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-262', tipo: 'Traje De Baño Hombre Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 320000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-263', tipo: 'Traje De Baño Mujer IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-264', tipo: 'Traje de Baño p1', proveedor: 'General', precioCosto: 0, precioSugerido: 220000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-265', tipo: 'TRAJE DE BAÑO POMS UNA PIEZA', proveedor: 'POMS', precioCosto: 0, precioSugerido: 80000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-266', tipo: 'Unidad Accsesorio Halloween', proveedor: 'General', precioCosto: 0, precioSugerido: 1000, stockActual: 97, unidad: 'PIEZA' },
  { codigo: 'MDF-267', tipo: 'Unidad Cosco Mujer', proveedor: 'General', precioCosto: 0, precioSugerido: 5500, stockActual: 30, unidad: 'PIEZA' },
  { codigo: 'MDF-268', tipo: 'Unidad Cosco Niño', proveedor: 'General', precioCosto: 0, precioSugerido: 7000, stockActual: 42, unidad: 'PIEZA' },
  { codigo: 'MDF-269', tipo: 'Unidad Jeans Old Navy', proveedor: 'OLD NAVY', precioCosto: 0, precioSugerido: 5000, stockActual: 27, unidad: 'PIEZA' },
  { codigo: 'MDF-270', tipo: 'Unidad Jeans Old Navy Niño', proveedor: 'OLD NAVY', precioCosto: 0, precioSugerido: 5000, stockActual: 18, unidad: 'PIEZA' },
  { codigo: 'MDF-271', tipo: 'Unidad Jenniffer', proveedor: 'JENNIFFER', precioCosto: 0, precioSugerido: 5000, stockActual: 33, unidad: 'PIEZA' },
  { codigo: 'MDF-272', tipo: 'Unidad Shein Lenceria', proveedor: 'SHEIN', precioCosto: 0, precioSugerido: 2000, stockActual: 616, unidad: 'PIEZA' },
  { codigo: 'MDF-273', tipo: 'Unidad Shein mixto Verano', proveedor: 'SHEIN', precioCosto: 0, precioSugerido: 2500, stockActual: 0, unidad: 'PIEZA' },
  { codigo: 'MDF-274', tipo: 'Unidad Shein Mujer Verano', proveedor: 'SHEIN', precioCosto: 0, precioSugerido: 2800, stockActual: 20, unidad: 'PIEZA' },
  { codigo: 'MDF-275', tipo: 'Unidas Champion', proveedor: 'CHAMPION', precioCosto: 0, precioSugerido: 7000, stockActual: 84, unidad: 'PIEZA' },
  { codigo: 'MDF-276', tipo: 'VESTIDO DE NOVIA CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 250000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-277', tipo: 'Vestido Meda Estacion IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 140000, stockActual: 11, unidad: 'FARDO' },
  { codigo: 'MDF-278', tipo: 'vestido mini beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-279', tipo: 'Vestido Niña', proveedor: 'General', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-280', tipo: 'Vestido Polo', proveedor: 'General', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-281', tipo: 'VESTIDO VERANO BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-282', tipo: 'Vestido Verano CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 220000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-283', tipo: 'VESTIDOS POLO FE 1ERA', proveedor: 'FE', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-284', tipo: 'VESTIDOS POLO FE 2DA', proveedor: 'FE', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-285', tipo: 'WINTER MIX JK', proveedor: 'JK', precioCosto: 0, precioSugerido: 180000, stockActual: 7, unidad: 'FARDO' },
  { codigo: 'MDF-286', tipo: 'PARKA DE NIÑO 2DA', proveedor: 'General', precioCosto: 0, precioSugerido: 50000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-287', tipo: 'BANANA REPUBLIC IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 150000, stockActual: 31, unidad: 'FARDO' },
  { codigo: 'MDF-288', tipo: 'VESTIDO INVIERNO CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 200000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-289', tipo: 'CALZA INV CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-290', tipo: 'FALDA INV CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 160000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-291', tipo: 'PANTALON CARGO 1 Y 2 CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 200000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-292', tipo: 'POLERA NIÑO ML TIGRE', proveedor: 'TIGRE', precioCosto: 0, precioSugerido: 120000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-293', tipo: 'JEANS MUJER O/S CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 140000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-294', tipo: 'CHAQUETA LIVIANA CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 140000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-295', tipo: 'MAMELUCO BB DEL TIGRE', proveedor: 'TIGRE', precioCosto: 0, precioSugerido: 140000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-296', tipo: 'CHAQUETA POLAR BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 140000, stockActual: 7, unidad: 'FARDO' },
  { codigo: 'MDF-297', tipo: 'CHAQUETA MODERNA BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 140000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-298', tipo: 'LENCERIA PREMIUN BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 400000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-299', tipo: 'ABRIGO CORTO CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 130000, stockActual: 5, unidad: 'FARDO' },
  { codigo: 'MDF-300', tipo: 'COLCHA LANA CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 130000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-301', tipo: 'PANTALON DE COTELE MUJER CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 140000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-302', tipo: 'SWEATER NIÑO CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 80000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-303', tipo: 'WINTER PREMIUN PLATINIUM CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 280000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-304', tipo: 'CANGURO CON GORRO PREMIUN BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 280000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-305', tipo: 'POLAR MODERNO PREMIUN BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 260000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-306', tipo: 'CHAMARRA NIÑO BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-307', tipo: 'NIÑO INV BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 100000, stockActual: 5, unidad: 'FARDO' },
  { codigo: 'MDF-308', tipo: 'SL JEANS FASHIONS 50 PIEZAS', proveedor: 'General', precioCosto: 0, precioSugerido: 350000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-309', tipo: 'CORTAVIENTO VINTAGE POMS 25 KILOS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 180000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-310', tipo: 'PANTALON DEPORTIVO MARCA POMS 25 KILOS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 260000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-311', tipo: 'CHAQUETA JEANS 1 Y 2 POMS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 100000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-312', tipo: 'POLAR POMS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 80000, stockActual: 10, unidad: 'FARDO' },
  { codigo: 'MDF-313', tipo: 'CONJUNTO ZARA 25 KILOS', proveedor: 'ZARA', precioCosto: 0, precioSugerido: 250000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-314', tipo: 'CALZA DEPORTIVA MARCA POMS 25 KILOS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-315', tipo: 'CHAQUETA ENTRENAMIENTO', proveedor: 'General', precioCosto: 0, precioSugerido: 200000, stockActual: 1, unidad: 'FARDO' },
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

  const resetToMasterStock = () => {
    const batch = writeBatch(db);
    INITIAL_MASTER_STOCK.forEach(item => {
      const newId = Math.random().toString(36).substr(2, 9);
      batch.set(doc(db, 'stock', newId), { ...item, id: newId, disponible: item.stockActual > 0 });
    });
    batch.commit();
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
      deudaTotalProveedores: purchases.reduce((acc, p) => acc + p.saldoPendiente, 0)
    };
  };

  return (
    <StoreContext.Provider value={{
      currentUser, login, logout, settings, updateSettings, playSound,
      sales, stock, staff, purchases, carriers, adjustments, addSale, updateSale, markAsSent, updateDispatchStatus, updateDispatchItems, assignCarrier, addCarrier, removeCarrier, addAdjustment, removeAdjustment, clearAllSales,
      addStockItem, updateStockItem, removeStockItem, bulkAddStock, resetToMasterStock, addStaff, removeStaff, 
      addPurchase, removePurchase, addAbono, removeAbono, getStats, syncWithCloud, pushToCloud, isSyncing, lastSync: settings.lastSync
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