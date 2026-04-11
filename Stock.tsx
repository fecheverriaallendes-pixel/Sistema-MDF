
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PackagePlus, Search, Package, FileUp, X, Download, Tag, Boxes, Edit3, Trash2, Save, AlertTriangle, Layers, Square, Filter } from 'lucide-react';
import { useStore } from '../store/AppContext';
import { StaffRole, StockItem } from '../types';

export default function Stock() {
  const { stock, addStockItem, updateStockItem, removeStockItem, bulkAddStock, currentUser, playSound } = useStore();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState('TODOS');
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'add') {
      setIsAdding(true);
    }
  }, [location]);
  
  const [newBale, setNewBale] = useState({ 
    codigo: '', 
    tipo: '', 
    proveedor: '', 
    precioCosto: 0, 
    precioSugerido: 0, 
    stockActual: 1,
    unidad: 'FARDO' as 'FARDO' | 'PIEZA'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canModify = currentUser?.rol === StaffRole.ADMIN || currentUser?.rol === StaffRole.BODEGA;

  // Obtener lista única de proveedores para el filtro
  const uniqueProviders = useMemo(() => {
    const providers = stock.map(item => item.proveedor.toUpperCase());
    return ['TODOS', ...Array.from(new Set(providers))].sort();
  }, [stock]);

  const filteredStock = useMemo(() => {
    return stock.filter(item => {
      const matchesSearch = item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           item.tipo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProvider = providerFilter === 'TODOS' || item.proveedor.toUpperCase() === providerFilter;
      return matchesSearch && matchesProvider;
    });
  }, [stock, searchTerm, providerFilter]);

  const downloadFormat = () => {
    const csvContent = "codigo,tipo,proveedor,precioCosto,precioSugerido,stockActual,unidad\nF-101,Polerones Premium,Bale Center,100000,150000,10,FARDO\nU-102,Jeans Unitario,USA Direct,8000,15000,50,PIEZA";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formato_carga_mdf_pro.csv';
    a.click();
    playSound('success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const items: any[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const [codigo, tipo, proveedor, costo, precio, stockCant, unidad] = line.split(',');
        if (codigo && tipo && !isNaN(Number(precio))) {
          items.push({
            codigo: codigo.trim().toUpperCase(),
            tipo: tipo.trim(),
            proveedor: proveedor?.trim().toUpperCase() || 'GENERAL',
            precioCosto: Number(costo) || 0,
            precioSugerido: Number(precio),
            stockActual: Number(stockCant) || 1,
            unidad: (unidad?.trim().toUpperCase() === 'PIEZA' ? 'PIEZA' : 'FARDO')
          });
        }
      }
      if (items.length > 0) bulkAddStock(items);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canModify) return;
    addStockItem({ ...newBale, proveedor: newBale.proveedor.toUpperCase() });
    setNewBale({ codigo: '', tipo: '', proveedor: '', precioCosto: 0, precioSugerido: 0, stockActual: 1, unidad: 'FARDO' });
    setIsAdding(false);
    playSound('success');
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !canModify) return;
    updateStockItem(editingItem.id, { ...editingItem, proveedor: editingItem.proveedor.toUpperCase() });
    setEditingItem(null);
    playSound('success');
  };

  const handleDelete = () => {
    if (!deletingId || !canModify) return;
    removeStockItem(deletingId);
    setDeletingId(null);
    playSound('click');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-20">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tight uppercase">Inventario Central</h2>
          <p className="text-slate-500 font-medium italic mt-2">Control maestro de Fardos y Piezas Unitarias</p>
        </div>
        {canModify && (
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={downloadFormat}
              className="flex items-center gap-2 px-8 py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-[24px] font-black text-xs uppercase hover:bg-slate-50 transition-all shadow-sm"
            >
              <Download size={18} /> CSV Pro
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-8 py-4 bg-emerald-500 text-white rounded-[24px] font-black text-xs uppercase hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20"
            >
              <FileUp size={18} /> Carga Masiva
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".csv" />
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-[24px] font-black text-sm uppercase shadow-2xl hover:bg-black transition-all active:scale-95"
            >
              <PackagePlus size={24} /> Registrar Entrada
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative group flex-1">
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={24} />
          <input 
            type="text" 
            placeholder="Buscar por código o producto..."
            className="w-full pl-20 pr-10 py-6 rounded-[32px] border-2 border-slate-100 focus:border-blue-400 outline-none transition-all shadow-sm text-xl font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative min-w-[280px]">
          <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <select 
            className="w-full pl-16 pr-8 py-6 rounded-[32px] border-2 border-slate-100 bg-white font-black text-sm uppercase tracking-widest outline-none focus:border-blue-400 appearance-none shadow-sm cursor-pointer"
            value={providerFilter}
            onChange={(e) => { setProviderFilter(e.target.value); playSound('click'); }}
          >
            {uniqueProviders.map(p => (
              <option key={p} value={p}>{p === 'TODOS' ? 'Filtrar: TODOS LOS PROVEEDORES' : `Proveedor: ${p}`}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[48px] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidad</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Código</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción Producto</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Precio Venta</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Cant.</th>
                {canModify && <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Gestión</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStock.map((item) => (
                <tr key={item.id} className={`group hover:bg-slate-50 transition-colors ${item.stockActual < 3 && item.stockActual > 0 ? 'bg-red-50/30' : ''}`}>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item.unidad === 'FARDO' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                      {item.unidad === 'FARDO' ? <Layers size={12} /> : <Square size={12} />} {item.unidad}
                    </span>
                  </td>
                  <td className="px-8 py-6 font-mono font-black text-slate-400 uppercase text-xs tracking-widest">{item.codigo}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${item.stockActual < 3 ? 'bg-red-100 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                        <Package size={22} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 uppercase text-sm tracking-tighter leading-none">{item.tipo}</span>
                        <span className="text-[9px] font-bold text-blue-500 uppercase mt-1 tracking-widest">{item.proveedor}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-slate-900 text-xl tracking-tighter">
                    ${item.precioSugerido.toLocaleString()}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className={`inline-flex flex-col items-center justify-center w-14 h-14 rounded-2xl ${item.stockActual > 3 ? 'bg-emerald-50 text-emerald-600' : item.stockActual > 0 ? 'bg-amber-50 text-amber-600 animate-pulse border border-amber-200' : 'bg-red-50 text-red-600'}`}>
                      <span className="text-xl font-black leading-none">{item.stockActual}</span>
                      <span className="text-[8px] font-black uppercase mt-1">{item.unidad === 'FARDO' ? 'Uds' : 'Piezas'}</span>
                    </div>
                  </td>
                  {canModify && (
                    <td className="px-8 py-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setEditingItem(item)} className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"><Edit3 size={16} /></button>
                        <button onClick={() => setDeletingId(item.id)} className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Agregar */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[56px] shadow-[0_50px_100px_rgba(0,0,0,0.5)] w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-12 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Registro de Inventario</p>
                <h3 className="text-4xl font-black uppercase tracking-tighter italic">Entrada de Mercancía</h3>
              </div>
              <button onClick={() => setIsAdding(false)} className="p-4 hover:bg-white/10 rounded-full transition-colors"><X size={36} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-12 space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Tipo de Ingreso</label>
                <div className="flex bg-slate-100 p-2 rounded-[28px] shadow-inner">
                  <button 
                    type="button"
                    onClick={() => setNewBale({...newBale, unidad: 'FARDO'})}
                    className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[22px] font-black text-xs uppercase tracking-widest transition-all ${newBale.unidad === 'FARDO' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    <Layers size={20} /> Es un Fardo
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNewBale({...newBale, unidad: 'PIEZA'})}
                    className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[22px] font-black text-xs uppercase tracking-widest transition-all ${newBale.unidad === 'PIEZA' ? 'bg-amber-500 text-white shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    <Square size={20} /> Es una Pieza
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Código Identificador</label>
                  <input required className="w-full px-7 py-5 bg-slate-50 rounded-[28px] border-2 border-transparent focus:border-emerald-500 outline-none font-black text-xl uppercase" placeholder="F-XXX" value={newBale.codigo} onChange={(e) => setNewBale({...newBale, codigo: e.target.value.toUpperCase()})}/>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Cant. Inicial ({newBale.unidad === 'FARDO' ? 'Fardos' : 'Unidades'})</label>
                  <input required type="number" className="w-full px-7 py-5 bg-slate-50 rounded-[28px] border-2 border-transparent focus:border-emerald-500 outline-none font-black text-xl" value={newBale.stockActual} onChange={(e) => setNewBale({...newBale, stockActual: Number(e.target.value)})}/>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Descripción del Producto</label>
                <input required className="w-full px-7 py-5 bg-slate-50 rounded-[28px] border-2 border-transparent focus:border-emerald-500 outline-none font-bold text-lg" placeholder="Ej: Abrigo Lana Hombre..." value={newBale.tipo} onChange={(e) => setNewBale({...newBale, tipo: e.target.value})}/>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-1 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Proveedor (IM, CANADA...)</label>
                  <input required className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold uppercase focus:border-emerald-500 outline-none" value={newBale.proveedor} onChange={(e) => setNewBale({...newBale, proveedor: e.target.value.toUpperCase()})}/>
                </div>
                <div className="col-span-1 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Costo ($)</label>
                  <input type="number" className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-black text-slate-500 outline-none focus:border-emerald-500 border-2 border-transparent transition-all" value={newBale.precioCosto || ''} onChange={(e) => setNewBale({...newBale, precioCosto: Number(e.target.value)})}/>
                </div>
                <div className="col-span-1 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Precio Venta ($)</label>
                  <input required type="number" className="w-full px-6 py-4 bg-emerald-500 text-white rounded-2xl font-black" value={newBale.precioSugerido || ''} onChange={(e) => setNewBale({...newBale, precioSugerido: Number(e.target.value)})}/>
                </div>
              </div>
              <button type="submit" className="w-full py-7 bg-slate-900 text-white rounded-[32px] font-black text-2xl shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4 active:scale-95">
                <Boxes size={32} /> CONFIRMAR EN BODEGA
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[56px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-12 bg-blue-600 text-white flex items-center justify-between">
              <div>
                <p className="text-white/80 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Control de Inventario</p>
                <h3 className="text-4xl font-black uppercase tracking-tighter italic">Editar Fardo/Pieza</h3>
              </div>
              <button onClick={() => setEditingItem(null)} className="p-4 hover:bg-white/10 rounded-full transition-colors"><X size={36} /></button>
            </div>
            <form onSubmit={handleUpdate} className="p-12 space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Cambiar Tipo de Unidad</label>
                <div className="flex bg-slate-100 p-2 rounded-[28px] shadow-inner">
                  <button 
                    type="button"
                    onClick={() => setEditingItem({...editingItem, unidad: 'FARDO'})}
                    className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[22px] font-black text-xs uppercase tracking-widest transition-all ${editingItem.unidad === 'FARDO' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500'}`}
                  >
                    <Layers size={20} /> Fardo
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditingItem({...editingItem, unidad: 'PIEZA'})}
                    className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[22px] font-black text-xs uppercase tracking-widest transition-all ${editingItem.unidad === 'PIEZA' ? 'bg-amber-500 text-white shadow-xl' : 'text-slate-500'}`}
                  >
                    <Square size={20} /> Pieza
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Código Identificador</label>
                  <input required className="w-full px-7 py-5 bg-slate-50 rounded-[28px] font-black text-xl uppercase outline-none focus:border-blue-500 border-2 border-transparent" value={editingItem.codigo} onChange={(e) => setEditingItem({...editingItem, codigo: e.target.value.toUpperCase()})}/>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Stock Físico Actual</label>
                  <input required type="number" className="w-full px-7 py-5 bg-slate-50 rounded-[28px] font-black text-xl outline-none focus:border-blue-500 border-2 border-transparent" value={editingItem.stockActual} onChange={(e) => setEditingItem({...editingItem, stockActual: Number(e.target.value)})}/>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Proveedor de Origen</label>
                <input required className="w-full px-7 py-5 bg-slate-50 rounded-[28px] font-black text-xl uppercase outline-none focus:border-blue-500 border-2 border-transparent" placeholder="IM, BETA, CANADA..." value={editingItem.proveedor} onChange={(e) => setEditingItem({...editingItem, proveedor: e.target.value.toUpperCase()})}/>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Costo ($)</label>
                  <input type="number" className="w-full px-7 py-5 bg-slate-50 rounded-[28px] font-bold outline-none focus:border-blue-500 border-2 border-transparent" value={editingItem.precioCosto || ''} onChange={(e) => setEditingItem({...editingItem, precioCosto: Number(e.target.value)})}/>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Venta Sugerida ($)</label>
                  <input required type="number" className="w-full px-7 py-5 bg-slate-50 rounded-[28px] font-black text-blue-600 outline-none focus:border-blue-500 border-2 border-transparent" value={editingItem.precioSugerido} onChange={(e) => setEditingItem({...editingItem, precioSugerido: Number(e.target.value)})}/>
                </div>
              </div>
              <button type="submit" className="w-full py-7 bg-blue-600 text-white rounded-[32px] font-black text-2xl shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-4 active:scale-95">
                <Save size={32} /> ACTUALIZAR REGISTRO
              </button>
            </form>
          </div>
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white p-12 rounded-[56px] shadow-2xl w-full max-md text-center animate-in zoom-in">
            <div className="w-28 h-28 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <AlertTriangle size={56} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tighter">¿Eliminar Item?</h3>
            <p className="text-slate-500 font-medium mb-10 leading-relaxed italic">Esta operación purgará el fardo/pieza de la base de datos centralizada. <br/>¿Estás seguro de continuar?</p>
            <div className="flex gap-4">
              <button onClick={() => setDeletingId(null)} className="flex-1 py-5 bg-slate-100 text-slate-900 rounded-[24px] font-black uppercase text-xs tracking-widest">Abortar</button>
              <button onClick={handleDelete} className="flex-1 py-5 bg-red-600 text-white rounded-[24px] font-black shadow-2xl shadow-red-600/30 uppercase text-xs tracking-widest">Confirmar Purga</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
