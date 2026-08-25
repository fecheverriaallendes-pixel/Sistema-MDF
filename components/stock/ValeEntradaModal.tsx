import React, { useState, useMemo } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Truck, 
  User, 
  Package, 
  Layers, 
  Boxes, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Sparkles, 
  Search, 
  Hash, 
  FileText,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { useStore } from '../../store/GlobalContext';
import { ValeEntrada, ValeEntradaItem, StockItem, StaffRole } from '../../types';
import { ValeEntradaPrintModal } from './ValeEntradaPrintModal';

interface ValeEntradaModalProps {
  onClose: () => void;
  onValeCreated?: (vale: ValeEntrada) => void;
}

export const ValeEntradaModal: React.FC<ValeEntradaModalProps> = ({ onClose, onValeCreated }) => {
  const { stock, staff, currentUser, addValeEntrada, addStockItem, playSound } = useStore();

  const [responsable, setResponsable] = useState(currentUser?.nombre || '');
  const [customResponsable, setCustomResponsable] = useState('');
  const [useCustomResponsable, setUseCustomResponsable] = useState(false);

  const [numeroContenedor, setNumeroContenedor] = useState('');
  const [proveedorGeneral, setProveedorGeneral] = useState('');
  const [fecha, setFecha] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [descripcion, setDescripcion] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Lista de items del vale
  const [items, setItems] = useState<ValeEntradaItem[]>([]);
  const [selectedStockId, setSelectedStockId] = useState('');
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [tempQty, setTempQty] = useState(1);

  // Modal submenú para crear nuevo artículo
  const [isCreatingNewProduct, setIsCreatingNewProduct] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    codigo: '',
    tipo: '',
    proveedor: '',
    precioCosto: 0,
    precioSugerido: 0,
    unidad: 'FARDO' as 'FARDO' | 'PIEZA' | 'MEDIO FARDO' | 'LOTE',
    categoria: 'FARDO' as 'FARDO' | 'LOTE',
    peso: 0,
    cantidadInicialVale: 1
  });

  // Estado de éxito tras guardar
  const [savedVale, setSavedVale] = useState<ValeEntrada | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Lista de staff disponible para responsable
  const availableStaff = useMemo(() => {
    const list = staff.filter(s => s.activo !== false).map(s => s.nombre);
    if (currentUser?.nombre && !list.includes(currentUser.nombre)) {
      list.unshift(currentUser.nombre);
    }
    return Array.from(new Set(list));
  }, [staff, currentUser]);

  // Lista de proveedores sugeridos
  const availableProviders = useMemo(() => {
    const set = new Set(stock.map(s => (s.proveedor || '').trim().toUpperCase()).filter(Boolean));
    ['CANADA', 'IM', 'BETA', 'JK', 'USA DIRECT', 'TOM Y JERRY', 'PREMIUM'].forEach(p => set.add(p));
    return Array.from(set).sort();
  }, [stock]);

  // Filtrar stock para el selector rápido
  const filteredProducts = useMemo(() => {
    if (!searchProductQuery.trim()) return stock.slice(0, 30);
    const q = searchProductQuery.trim().toUpperCase();
    return stock.filter(s => 
      s.codigo.toUpperCase().includes(q) || 
      s.tipo.toUpperCase().includes(q) ||
      (s.proveedor && s.proveedor.toUpperCase().includes(q))
    ).slice(0, 40);
  }, [stock, searchProductQuery]);

  // Cálculos de resumen
  const totalArticulos = items.length;
  const totalUnidades = useMemo(() => items.reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0), [items]);
  const totalCostoEstimado = useMemo(() => items.reduce((acc, it) => acc + ((Number(it.precioCosto) || 0) * (Number(it.cantidad) || 0)), 0), [items]);
  const totalVentaEstimada = useMemo(() => items.reduce((acc, it) => acc + ((Number(it.precioSugerido) || 0) * (Number(it.cantidad) || 0)), 0), [items]);

  // Agregar item existente al Vale
  const handleAddExistingProduct = () => {
    if (!selectedStockId) return;
    const stockItem = stock.find(s => s.id === selectedStockId || s.codigo === selectedStockId);
    if (!stockItem) return;

    // Verificar si ya existe en la lista para incrementar o añadir fila
    const existingIndex = items.findIndex(it => it.codigo.toUpperCase() === stockItem.codigo.toUpperCase());
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].cantidad += Math.max(1, tempQty);
      setItems(updated);
    } else {
      const newItem: ValeEntradaItem = {
        id: Math.random().toString(36).substr(2, 9),
        codigo: stockItem.codigo,
        tipo: stockItem.tipo,
        categoria: stockItem.categoria || 'FARDO',
        unidad: stockItem.unidad || 'FARDO',
        proveedor: stockItem.proveedor || proveedorGeneral || 'GENERAL',
        cantidad: Math.max(1, tempQty),
        precioCosto: stockItem.precioCosto || 0,
        precioSugerido: stockItem.precioSugerido || 0,
        peso: stockItem.peso || 0
      };
      setItems([newItem, ...items]);
    }

    setSelectedStockId('');
    setSearchProductQuery('');
    setTempQty(1);
    playSound('click');
  };

  // Abrir modal de creación de nuevo artículo
  const handleOpenCreateNewProduct = () => {
    // Generar código consecutivo sugerido
    const existingCodes = stock.map(s => s.codigo).filter(c => c.startsWith('MDF-'));
    let nextNum = 1;
    if (existingCodes.length > 0) {
      const numbers = existingCodes.map(c => {
        const parts = c.split('-');
        return parseInt(parts[1], 10) || 0;
      });
      nextNum = Math.max(...numbers, 0) + 1;
    }
    const suggestedCode = `MDF-${String(nextNum).padStart(3, '0')}`;

    setNewProductForm({
      codigo: suggestedCode,
      tipo: '',
      proveedor: proveedorGeneral || 'CANADA',
      precioCosto: 0,
      precioSugerido: 0,
      unidad: 'FARDO',
      categoria: 'FARDO',
      peso: 0,
      cantidadInicialVale: 1
    });
    setIsCreatingNewProduct(true);
    playSound('transition');
  };

  // Guardar nuevo artículo al catálogo y agregarlo inmediatamente al vale
  const handleSaveNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.tipo.trim()) {
      alert("Por favor ingresa la descripción o nombre del producto.");
      return;
    }

    const cleanCode = (newProductForm.codigo || '').trim().toUpperCase();
    if (!cleanCode) {
      alert("Por favor ingresa o genera un código válido.");
      return;
    }

    // Verificar si el código ya existe en catálogo
    const exists = stock.some(s => s.codigo.trim().toUpperCase() === cleanCode);
    if (exists) {
      alert(`El código ${cleanCode} ya existe en el inventario. Elige un código diferente o seleccionalo desde la lista.`);
      return;
    }

    // 1. Crear el artículo en stock (con stock 0 inicial, pues el vale sumará la cantidad)
    addStockItem({
      codigo: cleanCode,
      tipo: newProductForm.tipo.trim(),
      proveedor: (newProductForm.proveedor || proveedorGeneral || 'GENERAL').trim().toUpperCase(),
      precioCosto: Number(newProductForm.precioCosto) || 0,
      precioSugerido: Number(newProductForm.precioSugerido) || 0,
      stockActual: 0,
      unidad: newProductForm.unidad,
      categoria: newProductForm.categoria,
      peso: newProductForm.peso || 0
    });

    // 2. Agregar directamente como ítem al Vale de Entrada
    const valeItem: ValeEntradaItem = {
      id: Math.random().toString(36).substr(2, 9),
      codigo: cleanCode,
      tipo: newProductForm.tipo.trim(),
      categoria: newProductForm.categoria,
      unidad: newProductForm.unidad,
      proveedor: (newProductForm.proveedor || proveedorGeneral || 'GENERAL').trim().toUpperCase(),
      cantidad: Math.max(1, Number(newProductForm.cantidadInicialVale) || 1),
      precioCosto: Number(newProductForm.precioCosto) || 0,
      precioSugerido: Number(newProductForm.precioSugerido) || 0,
      peso: newProductForm.peso || 0
    };

    setItems([valeItem, ...items]);
    setIsCreatingNewProduct(false);
    playSound('success');
  };

  // Modificar cantidad o precios de una fila del vale
  const handleUpdateItem = (index: number, updates: Partial<ValeEntradaItem>) => {
    const updated = [...items];
    updated[index] = { ...updated[index], ...updates };
    setItems(updated);
  };

  // Eliminar un item del vale
  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    playSound('click');
  };

  // Confirmar y registrar Vale de Entrada
  const handleSubmitVale = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const finalResponsable = useCustomResponsable ? customResponsable.trim() : responsable.trim();
    
    // VALIDACIÓN ESTRICTA: Responsable es obligatorio
    if (!finalResponsable) {
      setErrorMessage("⚠️ El campo 'Nombre del Responsable' es OBLIGATORIO. Por favor selecciona o ingresa el nombre de la persona a cargo.");
      playSound('click');
      return;
    }

    if (items.length === 0) {
      setErrorMessage("⚠️ Debes agregar al menos un artículo al Vale de Entrada con cantidad mayor a 0.");
      playSound('click');
      return;
    }

    const invalidQtyItem = items.find(it => !it.cantidad || it.cantidad <= 0);
    if (invalidQtyItem) {
      setErrorMessage(`⚠️ El artículo ${invalidQtyItem.codigo} (${invalidQtyItem.tipo}) tiene una cantidad inválida. Debe ser mayor a 0.`);
      playSound('click');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const hora = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const newVale = await addValeEntrada({
        fecha,
        hora,
        responsable: finalResponsable.toUpperCase(),
        numeroContenedor: numeroContenedor.trim() ? numeroContenedor.trim().toUpperCase() : undefined,
        proveedor: proveedorGeneral.trim() ? proveedorGeneral.trim().toUpperCase() : undefined,
        descripcion: descripcion.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
        items,
        totalArticulos,
        totalUnidades,
        totalCostoEstimado,
        totalVentaEstimada
      });

      setSavedVale(newVale);
      if (onValeCreated) onValeCreated(newVale);
      playSound('success');
    } catch (err: any) {
      console.error("Error al registrar Vale de Entrada:", err);
      setErrorMessage("Ocurrió un error al guardar el vale: " + (err.message || 'Error desconocido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Vista de Éxito / Confirmación
  if (savedVale) {
    return (
      <>
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[44px] shadow-2xl max-w-xl w-full p-8 sm:p-10 text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-bounce">
              <CheckCircle2 size={48} />
            </div>

            <span className="px-3.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-2">
              Ingreso Registrado con Éxito
            </span>
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Vale de Entrada #{savedVale.folio}</h3>
            <p className="text-slate-500 font-medium text-xs mt-2 max-w-md mx-auto">
              Se han ingresado correctamente <b className="text-slate-900">{savedVale.totalUnidades} bultos/fardos</b> de <b className="text-slate-900">{savedVale.totalArticulos} artículos</b> al inventario de bodega.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 my-6 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase">Responsable:</span>
                <span className="font-black text-slate-900 uppercase">{savedVale.responsable}</span>
              </div>
              {savedVale.numeroContenedor && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold uppercase">Contenedor:</span>
                  <span className="font-mono font-black text-blue-600 uppercase">{savedVale.numeroContenedor}</span>
                </div>
              )}
              {savedVale.proveedor && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold uppercase">Proveedor / Origen:</span>
                  <span className="font-black text-slate-900 uppercase">{savedVale.proveedor}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-500 font-bold uppercase">Total Bultos/Unidades:</span>
                <span className="font-black text-emerald-600 text-sm">+{savedVale.totalUnidades} uds</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowPrintModal(true)}
                className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
              >
                <Printer size={16} /> Imprimir Comprobante
              </button>
              <button
                onClick={() => {
                  setSavedVale(null);
                  setItems([]);
                  setDescripcion('');
                  setObservaciones('');
                  setNumeroContenedor('');
                }}
                className="py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
              >
                + Otro Vale
              </button>
              <button
                onClick={onClose}
                className="py-4 px-6 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
              >
                Listo / Salir
              </button>
            </div>
          </div>
        </div>

        {showPrintModal && (
          <ValeEntradaPrintModal vale={savedVale} onClose={() => setShowPrintModal(false)} />
        )}
      </>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-[44px] shadow-2xl max-w-5xl w-full overflow-hidden my-6 animate-in zoom-in duration-300 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-6 sm:p-8 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 text-white">
              <Truck size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[9px] font-black uppercase tracking-widest">
                  Ingreso de Mercadería
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Cargamentos y Contenedores</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mt-0.5">Vale de Entrada</h3>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all"
          >
            <X size={22} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmitVale} className="p-6 sm:p-8 overflow-y-auto space-y-8 flex-grow">
          {errorMessage && (
            <div className="p-4 bg-rose-50 border-2 border-rose-200 text-rose-700 rounded-2xl flex items-center gap-3 text-xs font-black animate-shake">
              <AlertCircle size={20} className="shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. SECCIÓN: DATOS GENERALES DEL VALE */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <FileText size={16} className="text-emerald-600" /> 1. Datos Generales de la Recepción
              </h4>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Campos con * son obligatorios</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* RESPONSABLE (OBLIGATORIO) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <User size={12} className="text-emerald-600" /> Responsable del Ingreso <span className="text-rose-500 font-black">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseCustomResponsable(!useCustomResponsable)}
                    className="text-[9px] font-black text-emerald-600 hover:text-emerald-700 uppercase"
                  >
                    {useCustomResponsable ? 'Elegir del Personal' : 'Otro Nombre'}
                  </button>
                </div>

                {useCustomResponsable ? (
                  <input
                    required
                    type="text"
                    placeholder="Escribe el nombre completo..."
                    className="w-full px-4 py-3.5 bg-white rounded-2xl border-2 border-emerald-400 focus:border-emerald-600 outline-none font-bold text-sm uppercase shadow-sm"
                    value={customResponsable}
                    onChange={(e) => setCustomResponsable(e.target.value)}
                  />
                ) : (
                  <select
                    required
                    className="w-full px-4 py-3.5 bg-white rounded-2xl border-2 border-slate-200 focus:border-emerald-500 outline-none font-black text-xs uppercase tracking-wide shadow-sm"
                    value={responsable}
                    onChange={(e) => setResponsable(e.target.value)}
                  >
                    <option value="">-- SELECCIONE EL RESPONSABLE * --</option>
                    {availableStaff.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                )}
                <span className="text-[8px] font-black text-rose-500 uppercase tracking-wider block">
                  * Obligatorio para registrar el kárdex
                </span>
              </div>

              {/* NÚMERO DE CONTENEDOR (OPCIONAL) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Truck size={12} className="text-blue-600" /> N° Contenedor / Camión
                  </label>
                  <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-full">
                    Opcional
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Ej: MSKU-9182312, CONT-2026-01, CAMION-03..."
                  className="w-full px-4 py-3.5 bg-white rounded-2xl border-2 border-slate-200 focus:border-blue-500 outline-none font-bold text-sm uppercase shadow-sm"
                  value={numeroContenedor}
                  onChange={(e) => setNumeroContenedor(e.target.value.toUpperCase())}
                />
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">
                  Identificador de cargamento o embarque
                </span>
              </div>

              {/* PROVEEDOR GENERAL / ORIGEN */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Package size={12} className="text-purple-600" /> Proveedor / Origen
                  </label>
                  <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-full">
                    Opcional
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Ej: CANADA, IM, BETA, USA..."
                  list="providers-list"
                  className="w-full px-4 py-3.5 bg-white rounded-2xl border-2 border-slate-200 focus:border-purple-500 outline-none font-bold text-sm uppercase shadow-sm"
                  value={proveedorGeneral}
                  onChange={(e) => setProveedorGeneral(e.target.value.toUpperCase())}
                />
                <datalist id="providers-list">
                  {availableProviders.map(p => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">
                  Origen por defecto para los artículos
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={12} /> Fecha de Recepción
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-bold text-xs"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                  Descripción / Referencia del Cargamento (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Contenedor 40ft Polerones y Chaquetas Canadá..."
                  className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-bold text-xs uppercase"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 2. SECCIÓN: ARTÍCULOS Y FARDOS DEL CARGAMENTO */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Layers size={16} className="text-emerald-600" /> 2. Artículos del Cargamento ({items.length})
                </h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                  Agrega artículos existentes o crea un nuevo producto en catálogo
                </p>
              </div>

              {/* Botón de sub-menú para crear nuevo artículo al vuelo */}
              <button
                type="button"
                onClick={handleOpenCreateNewProduct}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
              >
                <Sparkles size={16} /> + Crear Artículo Nuevo
              </button>
            </div>

            {/* Barra de Búsqueda y Agregar rápido de catálogo existente */}
            <div className="bg-slate-100 p-4 rounded-3xl flex flex-col md:flex-row gap-3 items-center">
              <div className="relative flex-1 w-full">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar en catálogo por código o nombre..."
                  className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-slate-200 focus:border-emerald-500 outline-none font-bold text-xs"
                  value={searchProductQuery}
                  onChange={(e) => setSearchProductQuery(e.target.value)}
                />
              </div>

              <div className="flex-1 w-full">
                <select
                  className="w-full px-4 py-3 bg-white rounded-2xl border border-slate-200 focus:border-emerald-500 outline-none font-bold text-xs uppercase cursor-pointer"
                  value={selectedStockId}
                  onChange={(e) => setSelectedStockId(e.target.value)}
                >
                  <option value="">-- SELECCIONAR ARTÍCULO ({filteredProducts.length} disponibles) --</option>
                  {filteredProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.codigo}] {p.tipo} — {p.proveedor} (Stock Actual: {p.stockActual} {p.unidad})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="flex items-center bg-white rounded-2xl border border-slate-200 px-3 py-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase mr-2">Cant:</span>
                  <input
                    type="number"
                    min="1"
                    className="w-16 font-black text-sm text-center outline-none"
                    value={tempQty}
                    onChange={(e) => setTempQty(Math.max(1, Number(e.target.value)))}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddExistingProduct}
                  disabled={!selectedStockId}
                  className="flex-1 md:flex-none px-6 py-3 bg-slate-900 hover:bg-black disabled:opacity-40 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Añadir al Vale
                </button>
              </div>
            </div>

            {/* Tabla de Artículos en el Vale */}
            {items.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl space-y-3">
                <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                  <Package size={28} />
                </div>
                <h5 className="font-black text-slate-700 text-sm uppercase">El Vale de Entrada no tiene artículos aún</h5>
                <p className="text-slate-400 text-xs font-medium max-w-md mx-auto">
                  Selecciona productos existentes con el buscador superior o utiliza el botón <b className="text-emerald-600">+ Crear Artículo Nuevo</b> para registrar fardos recién llegados.
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/70 text-[9px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        <th className="py-3 px-4">Código</th>
                        <th className="py-3 px-4">Descripción del Artículo</th>
                        <th className="py-3 px-4">Proveedor</th>
                        <th className="py-3 px-4 text-center">Cantidad a Ingresar</th>
                        <th className="py-3 px-4 text-right">P. Costo</th>
                        <th className="py-3 px-4 text-right">P. Venta</th>
                        <th className="py-3 px-4 text-right">Subtotal Costo</th>
                        <th className="py-3 px-4 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-bold">
                      {items.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-black text-slate-900 uppercase">
                            {item.codigo}
                          </td>
                          <td className="py-3.5 px-4 uppercase text-slate-800">
                            <div>
                              <span>{item.tipo}</span>
                              <span className="text-[9px] font-extrabold text-slate-400 ml-2 uppercase">
                                ({item.categoria || 'FARDO'} • {item.unidad || 'FARDO'})
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <input
                              type="text"
                              className="px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200 text-xs uppercase font-bold w-24"
                              value={item.proveedor || ''}
                              onChange={(e) => handleUpdateItem(idx, { proveedor: e.target.value.toUpperCase() })}
                            />
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center bg-emerald-50 rounded-xl p-1 border border-emerald-200">
                              <button
                                type="button"
                                onClick={() => handleUpdateItem(idx, { cantidad: Math.max(1, item.cantidad - 1) })}
                                className="w-6 h-6 rounded-lg bg-white text-slate-700 font-black flex items-center justify-center hover:bg-emerald-100"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                className="w-12 bg-transparent text-center font-black text-emerald-800 text-sm outline-none"
                                value={item.cantidad}
                                onChange={(e) => handleUpdateItem(idx, { cantidad: Math.max(1, Number(e.target.value)) })}
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateItem(idx, { cantidad: item.cantidad + 1 })}
                                className="w-6 h-6 rounded-lg bg-white text-slate-700 font-black flex items-center justify-center hover:bg-emerald-100"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <input
                              type="number"
                              className="px-2 py-1 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono text-right font-bold w-24"
                              value={item.precioCosto || ''}
                              placeholder="0"
                              onChange={(e) => handleUpdateItem(idx, { precioCosto: Number(e.target.value) })}
                            />
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <input
                              type="number"
                              className="px-2 py-1 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono text-right font-black text-emerald-700 w-24"
                              value={item.precioSugerido || ''}
                              placeholder="0"
                              onChange={(e) => handleUpdateItem(idx, { precioSugerido: Number(e.target.value) })}
                            />
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-black text-slate-700">
                            ${((item.precioCosto || 0) * item.cantidad).toLocaleString('es-CL')}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              title="Quitar artículo"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* 3. RESUMEN Y TOTALES DEL CARGAMENTO */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Ítems Distintos</span>
              <p className="text-2xl font-black text-slate-800 tracking-tight mt-1">{totalArticulos}</p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
              <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest block">Total Bultos/Unidades</span>
              <p className="text-2xl font-black text-emerald-800 tracking-tight mt-1">+{totalUnidades}</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Costo Total Estimado</span>
              <p className="text-xl font-black text-slate-800 font-mono tracking-tight mt-1">
                ${totalCostoEstimado.toLocaleString('es-CL')}
              </p>
            </div>

            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md">
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block">Valorización Venta</span>
              <p className="text-xl font-black text-white font-mono tracking-tight mt-1">
                ${totalVentaEstimada.toLocaleString('es-CL')}
              </p>
            </div>
          </div>

          {/* Observaciones generales */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
              Observaciones Adicionales del Vale
            </label>
            <textarea
              rows={2}
              placeholder="Notas sobre el estado del contenedor, precinto, sellos, transportista..."
              className="w-full px-4 py-2.5 bg-slate-50 rounded-2xl border border-slate-200 focus:border-emerald-500 outline-none font-bold text-xs"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="w-full sm:w-auto px-10 py-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/30 transition-all active:scale-95"
            >
              <CheckCircle2 size={20} />
              {isSubmitting ? 'REGISTRANDO EN BODEGA...' : 'CONFIRMAR E INGRESAR VALE'}
            </button>
          </div>
        </form>
      </div>

      {/* SUB-MODAL: CREAR NUEVO ARTÍCULO AL CATÁLOGO (SUB-MENÚ SOLICITADO) */}
      {isCreatingNewProduct && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-xl w-full overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl">
                  <Sparkles size={22} />
                </div>
                <div>
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Sub-menú de Creación Rápida</span>
                  <h4 className="text-xl font-black uppercase tracking-tight">Crear Nuevo Artículo</h4>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsCreatingNewProduct(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveNewProduct} className="p-6 sm:p-8 space-y-5">
              {/* Categoría y Unidad */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Categoría</label>
                  <div className="flex bg-slate-100 p-1 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setNewProductForm({...newProductForm, categoria: 'FARDO', unidad: 'FARDO'})}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                        newProductForm.categoria === 'FARDO' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      Fardo
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewProductForm({...newProductForm, categoria: 'LOTE', unidad: 'LOTE'})}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                        newProductForm.categoria === 'LOTE' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      Lote
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Tipo de Unidad</label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-100 rounded-2xl text-xs font-black uppercase outline-none"
                    value={newProductForm.unidad}
                    onChange={(e) => setNewProductForm({...newProductForm, unidad: e.target.value as any})}
                  >
                    <option value="FARDO">FARDO</option>
                    <option value="MEDIO FARDO">MEDIO FARDO</option>
                    <option value="LOTE">LOTE</option>
                    <option value="PIEZA">PIEZA</option>
                  </select>
                </div>
              </div>

              {/* Código y Cantidad en Vale */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                    Código SKU *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="MDF-001"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm uppercase outline-none focus:border-emerald-500"
                    value={newProductForm.codigo}
                    onChange={(e) => setNewProductForm({...newProductForm, codigo: e.target.value.toUpperCase()})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                    Cant. a Ingresar en Vale *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    className="w-full px-4 py-3 bg-emerald-50 border border-emerald-300 rounded-2xl font-black text-sm text-emerald-900 outline-none focus:border-emerald-500 text-center"
                    value={newProductForm.cantidadInicialVale}
                    onChange={(e) => setNewProductForm({...newProductForm, cantidadInicialVale: Math.max(1, Number(e.target.value))})}
                  />
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                  Descripción / Nombre del Producto *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ej: Polerón Hoodie Premium Unisex..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm uppercase outline-none focus:border-emerald-500"
                  value={newProductForm.tipo}
                  onChange={(e) => setNewProductForm({...newProductForm, tipo: e.target.value})}
                />
              </div>

              {/* Proveedor y Precios */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-600 uppercase">Proveedor</label>
                  <input
                    type="text"
                    placeholder="CANADA"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase font-bold outline-none"
                    value={newProductForm.proveedor}
                    onChange={(e) => setNewProductForm({...newProductForm, proveedor: e.target.value.toUpperCase()})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-600 uppercase">P. Costo ($)</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none"
                    value={newProductForm.precioCosto || ''}
                    onChange={(e) => setNewProductForm({...newProductForm, precioCosto: Number(e.target.value)})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-emerald-600 uppercase">P. Venta ($)</label>
                  <input
                    required
                    type="number"
                    placeholder="0"
                    className="w-full px-3 py-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-mono font-black text-emerald-800 outline-none"
                    value={newProductForm.precioSugerido || ''}
                    onChange={(e) => setNewProductForm({...newProductForm, precioSugerido: Number(e.target.value)})}
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreatingNewProduct(false)}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20"
                >
                  Crear e Insertar al Vale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
