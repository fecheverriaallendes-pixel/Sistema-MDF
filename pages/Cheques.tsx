import React, { useState } from 'react';
import { useStore } from '../store/GlobalContext';
import { StaffRole } from '../types';

export default function Cheques() {
  const { cheques, addCheque, markChequeAsPaid, currentUser } = useStore();
  const [activeTab, setActiveTab] = useState<'pending' | 'paid'>('pending');
  const [fecha, setFecha] = useState('');
  const [numeroCheque, setNumeroCheque] = useState('');
  const [monto, setMonto] = useState('');
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'Abierto' | 'Cruzado'>('Abierto');

  const isAdmin = currentUser?.rol === StaffRole.ADMIN;

  if (!isAdmin) return <div>Acceso denegado</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addCheque({
      fecha,
      numeroCheque,
      monto: Number(monto),
      nombre,
      tipo
    });
    setFecha('');
    setNumeroCheque('');
    setMonto('');
    setNombre('');
  };

  const filteredCheques = cheques.filter(c => activeTab === 'pending' ? !c.pagado : c.pagado);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Gestión de Cheques</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-slate-100 space-y-4">
        <h2 className="font-bold text-lg">Ingresar Nuevo Cheque</h2>
        <div className="grid grid-cols-2 gap-4">
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} required className="p-2 border rounded-xl" />
            <input type="text" placeholder="Número de cheque" value={numeroCheque} onChange={e => setNumeroCheque(e.target.value)} required className="p-2 border rounded-xl" />
            <input type="number" placeholder="Monto" value={monto} onChange={e => setMonto(e.target.value)} required className="p-2 border rounded-xl" />
            <input type="text" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} required className="p-2 border rounded-xl" />
            <select value={tipo} onChange={e => setTipo(e.target.value as 'Abierto' | 'Cruzado')} className="p-2 border rounded-xl">
                <option value="Abierto">Abierto</option>
                <option value="Cruzado">Cruzado</option>
            </select>
        </div>
        <button type="submit" className="px-6 py-3 bg-amber-500 text-white rounded-xl font-bold">Ingresar Cheque</button>
      </form>

      <div className="flex gap-4">
        <button onClick={() => setActiveTab('pending')} className={`p-2 ${activeTab === 'pending' ? 'font-bold border-b-2 border-amber-500' : ''}`}>Pendientes</button>
        <button onClick={() => setActiveTab('paid')} className={`p-2 ${activeTab === 'paid' ? 'font-bold border-b-2 border-amber-500' : ''}`}>Pagados</button>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100">
        <table className="w-full border-collapse">
            <thead>
                <tr className="text-left border-b">
                    <th className="p-2">Fecha</th>
                    <th className="p-2">Número</th>
                    <th className="p-2">Nombre</th>
                    <th className="p-2">Monto</th>
                    <th className="p-2">Tipo</th>
                    <th className="p-2">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {filteredCheques.map(c => (
                    <tr key={c.id} className="border-b">
                        <td className="p-2">{c.fecha}</td>
                        <td className="p-2">{c.numeroCheque}</td>
                        <td className="p-2">{c.nombre}</td>
                        <td className="p-2">{c.monto.toLocaleString('es-CL')}</td>
                        <td className="p-2">{c.tipo}</td>
                         <td className="p-2">
                            {!c.pagado && <button onClick={() => markChequeAsPaid(c.id)} className="text-emerald-500 font-bold hover:text-emerald-700">Marcar como pagado</button>}
                         </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}
