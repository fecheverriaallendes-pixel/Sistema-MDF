import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Archive, Download, RefreshCw, Database, ShieldAlert, CheckCircle2, 
  AlertTriangle, Calendar, FileSpreadsheet, FileJson, ArrowRight, 
  Search, RotateCcw, Trash2, HardDrive, Smartphone, Zap, Eye, Check
} from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { Sale, StaffRole } from '../types';
import { 
  normalizeDateToISO, 
  partitionSalesByDate, 
  exportSalesToExcel, 
  exportSalesToJSON 
} from '../utils/salesBackup';
import { smartTextMatch } from '../utils/search';

interface VentasArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VentasArchiveModal: React.FC<VentasArchiveModalProps> = ({ isOpen, onClose }) => {
  const { 
    sales, 
    currentUser, 
    playSound, 
    archiveSalesBeforeDate, 
    fetchArchivedSales, 
    restoreArchivedSales, 
    deleteArchivedSales,
    isSyncing
  } = useStore();

  const [activeTab, setActiveTab] = useState<'ARCHIVE' | 'EXPLORER'>('ARCHIVE');
  
  // Cutoff date default: July 1st
  // Detect current year or default to 2024-07-01 / current year July 1st
  const defaultCutoff = useMemo(() => {
    // Check years present in current sales
    const years = sales
      .map(s => {
        const iso = normalizeDateToISO(s.fecha);
        return iso ? parseInt(iso.substring(0, 4), 10) : null;
      })
      .filter(Boolean) as number[];
    
    const year = years.length > 0 ? Math.min(...years) : new Date().getFullYear();
    // If multiple years, pick the year of the oldest sales or current year
    return `${year}-07-01`;
  }, [sales]);

  const [cutoffDate, setCutoffDate] = useState<string>(defaultCutoff);
  const [archivingProgress, setArchivingProgress] = useState<{ current: number; total: number } | null>(null);
  const [archiveSuccessMsg, setArchiveSuccessMsg] = useState<string | null>(null);

  // Explorer states
  const [archivedList, setArchivedList] = useState<Sale[]>([]);
  const [isLoadingArchive, setIsLoadingArchive] = useState(false);
  const [explorerSearch, setExplorerSearch] = useState('');
  const [selectedArchivedIds, setSelectedArchivedIds] = useState<string[]>([]);
  const [restoringProgress, setRestoringProgress] = useState<{ current: number; total: number } | null>(null);

  // Update cutoffDate when defaultCutoff changes if unedited
  useEffect(() => {
    if (defaultCutoff && !cutoffDate) {
      setCutoffDate(defaultCutoff);
    }
  }, [defaultCutoff]);

  // Real-time partitioned sales
  const { toKeep, toArchive, normCutoff } = useMemo(() => {
    return partitionSalesByDate(sales, cutoffDate || '2024-07-01');
  }, [sales, cutoffDate]);

  const totalKeepAmount = useMemo(() => toKeep.reduce((acc, s) => acc + (s.total || 0), 0), [toKeep]);
  const totalArchiveAmount = useMemo(() => toArchive.reduce((acc, s) => acc + (s.total || 0), 0), [toArchive]);

  // Load archive docs when opening explorer tab
  const handleLoadArchive = async () => {
    setIsLoadingArchive(true);
    try {
      const list = await fetchArchivedSales();
      setArchivedList(list);
    } catch (e: any) {
      alert("Error al cargar ventas archivadas: " + e.message);
    } finally {
      setIsLoadingArchive(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'EXPLORER') {
      handleLoadArchive();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const isAdmin = currentUser?.rol === StaffRole.ADMIN;

  const handleExecuteArchive = async () => {
    if (!isAdmin) {
      alert("Solo el administrador puede archivar ventas.");
      return;
    }

    if (toArchive.length === 0) {
      alert("No hay ventas anteriores a la fecha de corte seleccionada.");
      return;
    }

    const confirmMsg = `⚠️ CONFIRMACIÓN DE ARCHIVO:\n\n` +
      `• Se moverán ${toArchive.length} ventas anteriores al ${normCutoff} al Repositorio Histórico (sales_archive).\n` +
      `• Quedarán ${toKeep.length} ventas activas en los dispositivos (desde el ${normCutoff} en adelante).\n` +
      `• Esto liberará memoria RAM en celulares y agilizará la app.\n\n` +
      `¿Deseas descargar automáticamente una copia de seguridad en Excel antes de proceder?`;

    const downloadBackupFirst = confirm(confirmMsg);

    if (downloadBackupFirst) {
      exportSalesToExcel(
        toArchive, 
        `Respaldo_Ventas_Previas_${normCutoff}_${new Date().toISOString().substring(0, 10)}`,
        `Ventas_Previas_${normCutoff}`
      );
      exportSalesToJSON(
        toArchive,
        `Respaldo_JSON_Ventas_Previas_${normCutoff}_${new Date().toISOString().substring(0, 10)}`
      );
    }

    try {
      setArchivingProgress({ current: 0, total: toArchive.length });
      const result = await archiveSalesBeforeDate(normCutoff, (cur, tot) => {
        setArchivingProgress({ current: cur, total: tot });
      });

      setArchiveSuccessMsg(
        `✅ ÉXITO: Se han archivado ${result.archivedCount} ventas históricas. Quedan ${result.remainingCount} ventas activas en el sistema.`
      );
      playSound('success');
      setTimeout(() => {
        setArchivingProgress(null);
      }, 1000);
    } catch (error: any) {
      alert("Error al archivar: " + error.message);
      setArchivingProgress(null);
    }
  };

  const handleRestoreSelected = async (targetSales: Sale[]) => {
    if (!isAdmin) {
      alert("Solo el administrador puede restaurar ventas.");
      return;
    }
    if (targetSales.length === 0) return;

    if (confirm(`¿Restaurar ${targetSales.length} ventas seleccionadas al sistema activo?`)) {
      try {
        setRestoringProgress({ current: 0, total: targetSales.length });
        await restoreArchivedSales(targetSales, (cur, tot) => {
          setRestoringProgress({ current: cur, total: tot });
        });
        alert(`✅ Se restauraron ${targetSales.length} ventas exitosamente.`);
        setSelectedArchivedIds([]);
        await handleLoadArchive();
        setRestoringProgress(null);
      } catch (e: any) {
        alert("Error al restaurar: " + e.message);
        setRestoringProgress(null);
      }
    }
  };

  const handleDeleteSelectedArchived = async () => {
    if (!isAdmin) {
      alert("Solo el administrador puede borrar del archivo.");
      return;
    }
    if (selectedArchivedIds.length === 0) return;

    if (confirm(`🚨 ¿Eliminar PERMANENTEMENTE ${selectedArchivedIds.length} ventas del archivo histórico? Esta acción no se puede deshacer.`)) {
      const pin = prompt("Ingresa PIN Maestro:");
      if (pin === "2024") {
        try {
          await deleteArchivedSales(selectedArchivedIds);
          alert("Registros eliminados del archivo histórico.");
          setSelectedArchivedIds([]);
          await handleLoadArchive();
        } catch (e: any) {
          alert("Error: " + e.message);
        }
      } else {
        alert("PIN incorrecto.");
      }
    }
  };

  const filteredArchivedList = archivedList.filter(s => {
    const itemsStr = (s.items || []).map(i => i.codigoFardo).join(' ');
    const combined = `${s.numeroVenta || ''} ${s.cliente || ''} ${s.vendedor || ''} ${s.codigoFardo || ''} ${s.fecha || ''} ${itemsStr}`;
    return smartTextMatch(combined, explorerSearch);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 p-6 sm:p-8 text-white flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Archive size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                  Optimización de Rendimiento
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-slate-400 text-xs font-bold">Respaldo & Archivo</span>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-white mt-1">
                Repositorio de Respaldo y Archivo de Ventas
              </h2>
            </div>
          </div>
          <button 
            onClick={() => { onClose(); playSound('click'); }} 
            className="relative z-10 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 p-2 border-b border-slate-200 gap-2 px-6">
          <button
            onClick={() => { setActiveTab('ARCHIVE'); playSound('click'); }}
            className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'ARCHIVE' 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap size={16} className={activeTab === 'ARCHIVE' ? 'text-emerald-600' : ''} />
            1. Archivar y Liberar Espacio
          </button>
          <button
            onClick={() => { setActiveTab('EXPLORER'); playSound('click'); }}
            className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'EXPLORER' 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database size={16} className={activeTab === 'EXPLORER' ? 'text-blue-600' : ''} />
            2. Explorar Archivo Histórico ({archivedList.length > 0 ? archivedList.length : 'Nube'})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {activeTab === 'ARCHIVE' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Explicación amigable */}
              <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-3xl flex flex-col sm:flex-row items-start gap-4">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex-shrink-0 flex items-center justify-center shadow-md">
                  <Smartphone size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-emerald-950 text-sm uppercase">¿Por qué archivar ventas antiguas?</h4>
                  <p className="text-xs text-emerald-900/80 leading-relaxed font-medium">
                    Al acumular miles de ventas, los teléfonos celulares y tablets se vuelven lentos debido a la gran cantidad de datos cargados en memoria. 
                    Esta herramienta te permite <b>guardar ventas antiguas en un repositorio seguro en la nube</b> y descargar respaldos en <b>Excel y JSON</b>.
                    Tu sistema activo quedará <b>rápido y liviano</b> con las ventas vigentes desde la fecha de corte.
                  </p>
                </div>
              </div>

              {/* Selector de fecha de corte */}
              <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                      Fecha de Corte para el Archivo
                    </label>
                    <p className="text-xs font-bold text-slate-700">
                      Se mantendrán en los dispositivos las ventas desde esta fecha en adelante:
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="date"
                      value={cutoffDate}
                      onChange={(e) => setCutoffDate(e.target.value)}
                      className="px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-sm text-slate-800 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Botones rápidos de corte */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider py-1.5 mr-2">
                    Accesos Rápidos:
                  </span>
                  {[
                    { label: '⭐ 1 de Julio (Recomendado)', date: defaultCutoff },
                    { label: '1 de Enero', date: `${new Date().getFullYear()}-01-01` },
                    { label: 'Últimos 30 Días', date: new Date(Date.now() - 30 * 86400000).toISOString().substring(0, 10) },
                    { label: 'Últimos 60 Días', date: new Date(Date.now() - 60 * 86400000).toISOString().substring(0, 10) },
                    { label: 'Últimos 90 Días', date: new Date(Date.now() - 90 * 86400000).toISOString().substring(0, 10) }
                  ].map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => { setCutoffDate(preset.date); playSound('click'); }}
                      className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${
                        cutoffDate === preset.date 
                          ? 'bg-emerald-600 text-white shadow-sm' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Estadísticas de Partición en Vivo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Ventas a mantener activas */}
                <div className="bg-emerald-50/70 border-2 border-emerald-200 p-6 rounded-3xl space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-emerald-600 text-white font-black text-[9px] uppercase tracking-widest rounded-full">
                      Se Mantendrán Activas (App Rápida)
                    </span>
                    <Smartphone size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-emerald-950">{toKeep.length} <span className="text-sm font-bold text-emerald-700">ventas</span></p>
                    <p className="text-xs font-bold text-emerald-800 mt-1">
                      Monto: ${totalKeepAmount.toLocaleString('es-CL')} CLP
                    </p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-2">
                      Desde el {normCutoff} a la fecha
                    </p>
                  </div>
                </div>

                {/* Ventas a archivar */}
                <div className="bg-amber-50/70 border-2 border-amber-200 p-6 rounded-3xl space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-amber-600 text-white font-black text-[9px] uppercase tracking-widest rounded-full">
                      Se Moverán al Archivo Histórico
                    </span>
                    <Archive size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-amber-950">{toArchive.length} <span className="text-sm font-bold text-amber-700">ventas</span></p>
                    <p className="text-xs font-bold text-amber-800 mt-1">
                      Monto: ${totalArchiveAmount.toLocaleString('es-CL')} CLP
                    </p>
                    <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mt-2">
                      Anteriores al {normCutoff}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sección de Descarga de Respaldos Previo */}
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl space-y-4">
                <div className="flex items-center gap-3">
                  <Download size={20} className="text-slate-700" />
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase">Descargar Copias de Respaldo en Tu Computador</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Guarda una copia offline en Excel o JSON en cualquier momento</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      exportSalesToExcel(toArchive, `Respaldo_Ventas_Antiguas_${normCutoff}`);
                      playSound('success');
                    }}
                    disabled={toArchive.length === 0}
                    className="py-3.5 px-4 bg-white hover:bg-emerald-50 text-emerald-800 border-2 border-emerald-300 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 transition-all"
                  >
                    <FileSpreadsheet size={16} className="text-emerald-600" />
                    Excel Antiguas ({toArchive.length})
                  </button>

                  <button
                    onClick={() => {
                      exportSalesToJSON(toArchive, `Respaldo_JSON_Ventas_Antiguas_${normCutoff}`);
                      playSound('success');
                    }}
                    disabled={toArchive.length === 0}
                    className="py-3.5 px-4 bg-white hover:bg-blue-50 text-blue-800 border-2 border-blue-300 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 transition-all"
                  >
                    <FileJson size={16} className="text-blue-600" />
                    JSON Antiguas ({toArchive.length})
                  </button>

                  <button
                    onClick={() => {
                      exportSalesToExcel(sales, `Respaldo_TOTAL_Ventas_${new Date().toISOString().substring(0, 10)}`, 'Todas_Las_Ventas');
                      playSound('success');
                    }}
                    className="py-3.5 px-4 bg-white hover:bg-purple-50 text-purple-800 border-2 border-purple-300 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <Database size={16} className="text-purple-600" />
                    Excel Total ({sales.length})
                  </button>
                </div>
              </div>

              {/* Progress and Success alerts */}
              {archivingProgress && (
                <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-3 animate-in zoom-in duration-300">
                  <div className="flex items-center justify-between text-xs font-black uppercase">
                    <span>Archivando ventas en la nube...</span>
                    <span>{archivingProgress.current} / {archivingProgress.total}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${(archivingProgress.current / (archivingProgress.total || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {archiveSuccessMsg && (
                <div className="bg-emerald-500 text-white p-6 rounded-3xl font-black text-xs uppercase tracking-wide flex items-center justify-between animate-in zoom-in duration-300">
                  <span>{archiveSuccessMsg}</span>
                  <button onClick={() => setArchiveSuccessMsg(null)} className="p-1 hover:bg-emerald-600 rounded-lg">
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Botón de Acción Principal */}
              <div className="pt-2">
                <button
                  onClick={handleExecuteArchive}
                  disabled={toArchive.length === 0 || isSyncing}
                  className="w-full py-6 bg-slate-900 hover:bg-black text-white rounded-[32px] font-black text-sm uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all active:scale-[0.99]"
                >
                  <Archive size={20} className="text-emerald-400" />
                  {isSyncing ? 'PROCESANDO ARCHIVO EN LA NUBE...' : `EJECUTAR ARCHIVADO SEGURO (${toArchive.length} VENTAS ANTERIORES AL ${normCutoff})`}
                </button>
                <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-wider mt-3">
                  🔒 Las ventas archivadas se trasladan a "sales_archive". Podrás consultarlas o restaurarlas en cualquier momento desde la pestaña "Explorar Archivo".
                </p>
              </div>
            </div>
          )}

          {activeTab === 'EXPLORER' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Explorer Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar en ventas archivadas (Cliente, N° venta, código, fecha, vendedor)..."
                    value={explorerSearch}
                    onChange={(e) => setExplorerSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLoadArchive}
                    disabled={isLoadingArchive}
                    className="px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all"
                    title="Refrescar datos desde la nube"
                  >
                    <RefreshCw size={16} className={isLoadingArchive ? 'animate-spin' : ''} />
                    Actualizar
                  </button>

                  <button
                    onClick={() => {
                      exportSalesToExcel(archivedList, `Archivo_Historico_Ventas_${new Date().toISOString().substring(0, 10)}`, 'Archivo_Historico');
                      playSound('success');
                    }}
                    disabled={archivedList.length === 0}
                    className="px-4 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm disabled:opacity-50 transition-all"
                  >
                    <FileSpreadsheet size={16} />
                    Exportar Todo ({archivedList.length})
                  </button>
                </div>
              </div>

              {/* Acciones para seleccionados */}
              {selectedArchivedIds.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in zoom-in duration-200">
                  <div className="text-xs font-black text-blue-900 uppercase">
                    {selectedArchivedIds.length} ventas seleccionadas
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const targetSales = archivedList.filter(s => selectedArchivedIds.includes(s.id));
                        handleRestoreSelected(targetSales);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <RotateCcw size={14} /> Restaurar a Ventas Activas
                    </button>

                    <button
                      onClick={handleDeleteSelectedArchived}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Trash2 size={14} /> Eliminar Permanentemente
                    </button>
                  </div>
                </div>
              )}

              {/* Tabla de ventas archivadas */}
              {isLoadingArchive ? (
                <div className="py-20 text-center space-y-4">
                  <RefreshCw size={36} className="animate-spin text-slate-400 mx-auto" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cargando archivo histórico desde Firestore...</p>
                </div>
              ) : archivedList.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-3">
                  <Archive size={48} className="text-slate-300 mx-auto" />
                  <h4 className="text-sm font-black text-slate-700 uppercase">No hay ventas en el archivo histórico</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto font-medium">
                    Usa la pestaña "1. Archivar y Liberar Espacio" para transferir ventas antiguas y descongestionar los dispositivos.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm">
                  <div className="max-h-[380px] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-900 text-white uppercase text-[9px] font-black tracking-wider sticky top-0 z-10">
                        <tr>
                          <th className="p-3.5 text-center w-10">
                            <input 
                              type="checkbox"
                              checked={selectedArchivedIds.length === filteredArchivedList.length && filteredArchivedList.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedArchivedIds(filteredArchivedList.map(s => s.id));
                                } else {
                                  setSelectedArchivedIds([]);
                                }
                              }}
                              className="rounded cursor-pointer"
                            />
                          </th>
                          <th className="p-3.5">N° Venta</th>
                          <th className="p-3.5">Fecha</th>
                          <th className="p-3.5">Cliente</th>
                          <th className="p-3.5">Vendedor</th>
                          <th className="p-3.5">Detalle</th>
                          <th className="p-3.5 text-right">Total</th>
                          <th className="p-3.5 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-bold">
                        {filteredArchivedList.map(sale => {
                          const isSelected = selectedArchivedIds.includes(sale.id);
                          return (
                            <tr key={sale.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}>
                              <td className="p-3.5 text-center">
                                <input 
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    if (isSelected) {
                                      setSelectedArchivedIds(selectedArchivedIds.filter(id => id !== sale.id));
                                    } else {
                                      setSelectedArchivedIds([...selectedArchivedIds, sale.id]);
                                    }
                                  }}
                                  className="rounded cursor-pointer"
                                />
                              </td>
                              <td className="p-3.5 font-black text-slate-900">
                                #{sale.numeroVenta || 'S/N'}
                              </td>
                              <td className="p-3.5 text-slate-600 whitespace-nowrap">
                                {sale.fecha} {sale.hora ? `(${sale.hora})` : ''}
                              </td>
                              <td className="p-3.5 text-slate-800">
                                {sale.cliente}
                              </td>
                              <td className="p-3.5 text-slate-500 uppercase text-[10px]">
                                {sale.vendedor}
                              </td>
                              <td className="p-3.5 text-slate-600 max-w-[200px] truncate text-[11px]">
                                {sale.items && sale.items.length > 0 
                                  ? sale.items.map(i => `${i.codigoFardo} (${i.cantidad})`).join(', ')
                                  : (sale.codigoFardo || 'Venta directa')}
                              </td>
                              <td className="p-3.5 text-right font-black text-slate-900 whitespace-nowrap">
                                ${(sale.total || 0).toLocaleString('es-CL')}
                              </td>
                              <td className="p-3.5 text-center whitespace-nowrap">
                                <button
                                  onClick={() => handleRestoreSelected([sale])}
                                  className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all mr-1.5"
                                  title="Restaurar a ventas activas"
                                >
                                  Restaurar
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 px-6 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-500">
            Total en Sistema Activo: <b>{sales.length} ventas</b> | Archivo Histórico: <b>{archivedList.length} ventas</b>
          </span>
          <button 
            onClick={() => { onClose(); playSound('click'); }} 
            className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
