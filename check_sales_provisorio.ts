
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

async function checkSales() {
  const salesCol = collection(db, 'sales');
  const snap = await getDocs(salesCol);
  
  snap.docs.forEach(d => {
      const data = d.data();
      const items = data.items || [];
      const hasProvisorio = items.some(i => (i.tipo || '').toUpperCase().includes('PROVISORIO') || (i.codigoFardo || '').toUpperCase().includes('PROVISORIO'));
      const mainProvisorio = (data.codigoFardo || '').toUpperCase().includes('PROVISORIO') || (data.tipo || '').toUpperCase().includes('PROVISORIO');
      
      if (hasProvisorio || mainProvisorio) {
          console.log(`Sale ${d.id} (${data.numeroVenta}) has PROVISORIO`);
      }
  });
  console.log('Sales check done.');
}
checkSales();
