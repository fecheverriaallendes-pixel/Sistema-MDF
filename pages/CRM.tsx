import React, { useState, useMemo } from 'react';
import { useStore } from '../store/GlobalContext';
import { Customer } from '../types';
import { 
  Phone, 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  MessageSquare, 
  Clock, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  MapPin, 
  Mail, 
  ShoppingBag, 
  Calendar,
  Sparkles,
  RefreshCw,
  Filter,
  Users
} from 'lucide-react';
import { 
  cleanRut, 
  formatRut, 
  validateRut, 
  matchRut, 
  getUnifiedClients, 
  UnifiedClient 
} from '../utils/rutUtils';

export default function CRM() {
  const { customers, sales, addCustomer, updateCustomer, removeCustomer, playSound } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState<'ALL' | 'RUT' | 'NOMBRE' | 'TELEFONO'>('ALL');
  const [rutFilter, setRutFilter] = useState<'ALL' | 'CON_RUT' | 'SIN_RUT'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [newNote, setNewNote] = useState('');
  const [copiedRut, setCopiedRut] = useState<string | null>(null);
  const [modalRut, setModalRut] = useState('');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const normalizeText = (text: string) => 
    (text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  // Combine CRM customers and sales clients to show a complete, rich directory
  const unifiedList = useMemo(() => {
    return getUnifiedClients(customers, sales);
  }, [customers, sales]);

  // Statistics
  const totalCount = unifiedList.length;
  const conRutCount = unifiedList.filter(c => Boolean(c.rut && c.rut.trim())).length;
  const sinRutCount = totalCount - conRutCount;

  // Filtered list
  const filteredCustomers = useMemo(() => {
    const rawSearch = searchTerm.trim();
    const normalizedSearch = normalizeText(rawSearch);

    return unifiedList.filter(c => {
      // 1. RUT Filter
      const hasRut = Boolean(c.rut && c.rut.trim());
      if (rutFilter === 'CON_RUT' && !hasRut) return false;
      if (rutFilter === 'SIN_RUT' && hasRut) return false;

      // 2. Search Term Filter
      if (!rawSearch) return true;

      if (searchMode === 'RUT') {
        return Boolean(c.rut && matchRut(c.rut, rawSearch));
      }

      if (searchMode === 'NOMBRE') {
        return normalizeText(c.nombre).includes(normalizedSearch);
      }

      if (searchMode === 'TELEFONO') {
        return (c.telefono || '').includes(rawSearch);
      }

      // Default 'ALL': Matches RUT, Name, Phone, Address
      const matchesRutField = Boolean(c.rut && matchRut(c.rut, rawSearch));
      const matchesName = normalizeText(c.nombre).includes(normalizedSearch);
      const matchesPhone = (c.telefono || '').includes(rawSearch);
      const matchesAddress = normalizeText(c.direccion || '').includes(normalizedSearch);

      return matchesRutField || matchesName || matchesPhone || matchesAddress;
    });
  }, [unifiedList, searchTerm, searchMode, rutFilter]);

  const handleWhatsApp = (telefono: string) => {
    const formattedPhone = telefono.replace(/\D/g, ''); 
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  const handleCopyRut = (rut: string) => {
    navigator.clipboard.writeText(formatRut(rut));
    setCopiedRut(rut);
    playSound('click');
    setTimeout(() => setCopiedRut(null), 2000);
  };

  const addNota = (customer: UnifiedClient) => {
    if (!newNote.trim()) return;
    const noteText = `${new Date().toLocaleDateString('es-CL')}: ${newNote.trim()}`;

    if (customer.originalCustomer) {
      updateCustomer({
        ...customer.originalCustomer,
        notas: [...(customer.originalCustomer.notas || []), noteText],
        lastContacted: new Date().toISOString()
      });
    } else {
      // Create as new customer with this note
      addCustomer({
        nombre: customer.nombre,
        telefono: customer.telefono,
        rut: customer.rut || '',
        direccion: customer.direccion || '',
        email: customer.email || '',
      });
    }
    setNewNote('');
    playSound('pop');
  };

  const openNewCustomerModal = () => {
    setEditingCustomer(null);
    setModalRut('');
    setIsModalOpen(true);
  };

  const openEditCustomerModal = (client: UnifiedClient) => {
    if (client.originalCustomer) {
      setEditingCustomer(client.originalCustomer);
      setModalRut(client.originalCustomer.rut || '');
    } else {
      // Mock an existing record so we can save it to CRM
      const dummyCustomer: Customer = {
        id: client.id.replace('sale_client_', ''),
        nombre: client.nombre,
        telefono: client.telefono,
        rut: client.rut || '',
        direccion: client.direccion || '',
        email: client.email || '',
        notas: client.notas || [],
        lastContacted: new Date().toISOString()
      };
      setEditingCustomer(dummyCustomer);
      setModalRut(dummyCustomer.rut || '');
    }
    setIsModalOpen(true);
  };

  const handleSyncHistoricalSales = () => {
    playSound('click');
    let imported = 0;
    // Find clients in sales that are not yet in customers collection
    const existingRutMap = new Set(customers.map(c => cleanRut(c.rut)));
    const existingNameMap = new Set(customers.map(c => c.nombre.trim().toLowerCase()));

    sales.forEach(s => {
      if (!s.cliente) return;
      const cRut = cleanRut(s.rut);
      const cName = s.cliente.trim().toLowerCase();

      const alreadyExists = (cRut && existingRutMap.has(cRut)) || existingNameMap.has(cName);
      if (!alreadyExists) {
        addCustomer({
          nombre: s.cliente.trim().toUpperCase(),
          telefono: s.telefono || '',
          rut: s.rut ? formatRut(s.rut) : '',
          direccion: s.direccion || '',
          email: ''
        });
        if (cRut) existingRutMap.add(cRut);
        existingNameMap.add(cName);
        imported++;
      }
    });

    setSyncStatus(imported > 0 ? `¡Se sincronizaron ${imported} clientes a la base de datos!` : 'Todos los clientes ya se encontraban sincronizados.');
    setTimeout(() => setSyncStatus(null), 4000);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
              <Users size={22} className="text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">CRM de Clientes</h1>
              <p className="text-xs text-slate-500 font-medium">
                Gestión integral de clientes con búsqueda por RUT, historial y datos de despacho
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={handleSyncHistoricalSales}
            title="Importar clientes desde historial de ventas"
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center gap-1.5 font-bold text-xs transition-colors"
          >
            <RefreshCw size={14} className="text-slate-500" />
            <span>Sincronizar Ventas</span>
          </button>

          <button 
            onClick={openNewCustomerModal} 
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center gap-2 font-bold text-xs shadow-md transition-colors"
          >
            <Plus size={16} className="text-amber-400" /> 
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {syncStatus && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{syncStatus}</span>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder={
                searchMode === 'RUT'
                  ? "Escribe o pega el RUT (ej: 12.345.678-9 o 12345678-9)..."
                  : searchMode === 'NOMBRE'
                  ? "Buscar por nombre del cliente..."
                  : searchMode === 'TELEFONO'
                  ? "Buscar por teléfono / WhatsApp..."
                  : "Buscar por RUT, nombre, teléfono o dirección..."
              }
              className="w-full pl-11 pr-10 py-3 bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium text-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search Mode Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl self-start">
            <button
              onClick={() => setSearchMode('ALL')}
              className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                searchMode === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSearchMode('RUT')}
              className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                searchMode === 'RUT'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <CreditCard size={13} />
              <span>Por RUT</span>
            </button>
            <button
              onClick={() => setSearchMode('NOMBRE')}
              className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                searchMode === 'NOMBRE'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Nombre
            </button>
            <button
              onClick={() => setSearchMode('TELEFONO')}
              className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                searchMode === 'TELEFONO'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Teléfono
            </button>
          </div>
        </div>

        {/* Filter Pills and Counter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
              <Filter size={12} /> Filtro RUT:
            </span>
            <button
              onClick={() => setRutFilter('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                rutFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({totalCount})
            </button>
            <button
              onClick={() => setRutFilter('CON_RUT')}
              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                rutFilter === 'CON_RUT'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <CreditCard size={12} />
              Con RUT ({conRutCount})
            </button>
            <button
              onClick={() => setRutFilter('SIN_RUT')}
              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                rutFilter === 'SIN_RUT'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              Sin RUT ({sinRutCount})
            </button>
          </div>

          <div className="text-xs text-slate-500 font-semibold">
            Mostrando <span className="font-black text-slate-900">{filteredCustomers.length}</span> de {totalCount} clientes
          </div>
        </div>
      </div>

      {/* Customer Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <form 
            className="bg-white p-6 sm:p-8 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                nombre: (formData.get('nombre') as string || '').toUpperCase().trim(),
                telefono: (formData.get('telefono') as string || '').trim(),
                rut: formatRut(modalRut),
                email: (formData.get('email') as string || '').trim(),
                direccion: (formData.get('direccion') as string || '').toUpperCase().trim(),
              };
              if (editingCustomer) {
                updateCustomer({ ...editingCustomer, ...data });
              } else {
                addCustomer(data);
              }
              setIsModalOpen(false);
              playSound('success');
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <CreditCard size={20} />
                </div>
                <h2 className="text-lg font-black text-slate-900">
                  {editingCustomer ? 'Editar Datos del Cliente' : 'Registrar Nuevo Cliente'}
                </h2>
              </div>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                Nombre Completo *
              </label>
              <input 
                name="nombre" 
                defaultValue={editingCustomer?.nombre} 
                placeholder="Ej: Romina Fuenzalida" 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm uppercase focus:bg-white focus:border-blue-500 outline-none" 
                required 
              />
            </div>

            {/* RUT Field with Chilean format guidance */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                  RUT del Cliente (Chile)
                </label>
                {modalRut.trim().length >= 7 && (
                  <span className={`text-[10px] font-bold ${validateRut(modalRut) ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {validateRut(modalRut) ? '✓ Dígito verificador válido' : '⚠️ Verifica el RUT'}
                  </span>
                )}
              </div>
              <div className="relative">
                <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  value={modalRut} 
                  onChange={(e) => setModalRut(e.target.value.toUpperCase())}
                  onBlur={() => setModalRut(formatRut(modalRut))}
                  placeholder="12.345.678-9 (o sin puntos ni guión)" 
                  className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm uppercase focus:bg-white focus:border-blue-500 outline-none" 
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Puedes escribir con o sin puntos y guión. Se dará formato automáticamente.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                  Teléfono / WhatsApp *
                </label>
                <input 
                  name="telefono" 
                  defaultValue={editingCustomer?.telefono} 
                  placeholder="+56912345678" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:bg-white focus:border-blue-500 outline-none" 
                  required 
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                  Correo Electrónico
                </label>
                <input 
                  name="email" 
                  type="email"
                  defaultValue={editingCustomer?.email} 
                  placeholder="cliente@correo.cl" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:bg-white focus:border-blue-500 outline-none" 
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                Dirección Completa de Despacho
              </label>
              <textarea 
                name="direccion" 
                defaultValue={editingCustomer?.direccion} 
                placeholder="Calle, Número, Depto, Comuna, Ciudad..." 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs uppercase h-20 resize-none focus:bg-white focus:border-blue-500 outline-none" 
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs shadow-md"
              >
                Guardar Cliente
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full py-16 px-4 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Search size={24} />
            </div>
            <h3 className="text-base font-black text-slate-800">No se encontraron clientes</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No hay resultados que coincidan con la búsqueda por RUT o nombre. Intenta ajustar el término o agrega un nuevo cliente.
            </p>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSearchMode('ALL');
                  setRutFilter('ALL');
                }}
                className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        ) : (
          filteredCustomers.map(c => {
            const hasRut = Boolean(c.rut && c.rut.trim());
            const formattedR = formatRut(c.rut || '');
            const isValidR = hasRut ? validateRut(c.rut) : false;

            return (
              <div 
                key={c.id} 
                className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Client Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-black text-base text-slate-900 truncate uppercase">
                        {c.nombre}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold text-slate-500">
                          {c.telefono || 'Sin teléfono'}
                        </span>
                        {c.totalCompras > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShoppingBag size={10} />
                            {c.totalCompras} compra{c.totalCompras > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => openEditCustomerModal(c)} 
                        title="Editar cliente"
                        className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
                      >
                        <Edit2 size={15} />
                      </button>
                      {c.originalCustomer && (
                        <button 
                          onClick={() => {
                            if (window.confirm(`¿Seguro que deseas eliminar a ${c.nombre}?`)) {
                              removeCustomer(c.originalCustomer!.id);
                            }
                          }} 
                          title="Eliminar cliente"
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* RUT Highlight Badge */}
                  {hasRut ? (
                    <div className="flex items-center justify-between bg-blue-50/70 border border-blue-200/80 rounded-2xl px-3 py-2">
                      <div className="flex items-center gap-2">
                        <CreditCard size={15} className="text-blue-600" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-blue-900 tracking-wide">
                              {formattedR}
                            </span>
                            {isValidR ? (
                              <span title="Dígito verificador válido">
                                <CheckCircle2 size={12} className="text-emerald-600" />
                              </span>
                            ) : (
                              <span title="Revisar formato de RUT">
                                <AlertCircle size={12} className="text-amber-500" />
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider block">
                            RUT Registrado
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyRut(c.rut!)}
                        title="Copiar RUT"
                        className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-blue-700 border border-blue-200 shadow-2xs transition-all flex items-center gap-1 text-[11px] font-bold"
                      >
                        {copiedRut === c.rut ? (
                          <>
                            <Check size={12} className="text-emerald-600" />
                            <span className="text-emerald-600 text-[10px]">Listo</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span className="text-[10px]">Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-amber-50/60 border border-amber-200/60 rounded-2xl px-3 py-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                        <AlertCircle size={13} className="text-amber-600" />
                        <span>Sin RUT asignado</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openEditCustomerModal(c)}
                        className="text-[11px] font-black text-amber-700 hover:text-amber-900 underline"
                      >
                        + Agregar RUT
                      </button>
                    </div>
                  )}

                  {/* Address and details */}
                  {c.direccion && (
                    <div className="flex items-start gap-1.5 text-xs text-slate-600">
                      <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate uppercase font-medium">{c.direccion}</span>
                    </div>
                  )}

                  {/* Notes / Interaction History */}
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Historial & Notas ({c.notas.length})
                    </p>
                    <div className="max-h-24 overflow-y-auto mb-2 space-y-1">
                      {c.notas.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">Sin notas registradas</p>
                      ) : (
                        c.notas.map((n, i) => (
                          <p key={i} className="text-xs text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-100">
                            {n}
                          </p>
                        ))
                      )}
                    </div>
                    
                    <div className="flex gap-1.5">
                      <input 
                        value={newNote} 
                        onChange={e => setNewNote(e.target.value)} 
                        className="text-xs p-2 bg-slate-50 flex-grow border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-medium" 
                        placeholder="Nueva nota para este cliente..." 
                      />
                      <button 
                        onClick={() => addNota(c)} 
                        title="Guardar nota"
                        className="bg-slate-900 hover:bg-slate-800 text-white p-2 rounded-xl transition-colors"
                      >
                        <Plus size={14} className="text-amber-400" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Card Footer Actions */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                  {c.telefono && (
                    <button 
                      onClick={() => handleWhatsApp(c.telefono)} 
                      className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <MessageSquare size={14} />
                      <span>WhatsApp</span>
                    </button>
                  )}
                  <button 
                    onClick={() => openEditCustomerModal(c)} 
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
                  >
                    Detalles
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
