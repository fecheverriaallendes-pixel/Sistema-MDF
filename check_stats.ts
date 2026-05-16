
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

async function calculateStats() {
  const stockCol = collection(db, 'stock');
  const salesCol = collection(db, 'sales');
  
  const stockSnap = await getDocs(stockCol);
  const salesSnap = await getDocs(salesCol);
  
  const stock = stockSnap.docs.map(d => d.data());
  const sales = salesSnap.docs.map(d => d.data());
  
  const totales = {
      stockItems: stock.length,
      disponibles: stock.reduce((acc, i) => acc + (i.stockActual || 0), 0),
      totalVendido: sales.reduce((acc, s) => acc + (s.total || 0), 0),
      valorInventarioVenta: stock.reduce((acc, i) => acc + ((i.precioSugerido || 0) * (i.stockActual || 0)), 0),
  };
  
  console.log('Stats:', totales);
  
  if (totales.disponibles > 0) {
      const topStock = [...stock].sort((a, b) => (b.stockActual || 0) - (a.stockActual || 0)).slice(0, 5);
      console.log('Top Stock items:');
      topStock.forEach(i => console.log(`${i.codigo}: ${i.tipo} - ${i.stockActual}`));
  }
}
calculateStats();
