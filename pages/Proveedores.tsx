import React, { useState } from 'react';
import { 
  Globe, 
  FileText, 
  Coins, 
  Search, 
  Ship, 
  Building2, 
  DollarSign, 
  ArrowRightLeft 
} from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import UsaPurchasesTab from '../components/proveedores/UsaPurchasesTab';
import DomesticPurchasesTab from '../components/proveedores/DomesticPurchasesTab';
import UsaSupplierStatement from '../components/proveedores/UsaSupplierStatement';

type TabType = 'USA_CONTAINERS' | 'STATEMENT_USA' | 'DOMESTIC_CLP';

export default function Proveedores() {
  const { usaPurchases, purchases } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('USA_CONTAINERS');
  const [searchTerm, setSearchTerm] = useState('');

  // Quick summary counts
  const usaPendingCount = usaPurchases.filter(p => p.saldoPendienteUsd > 0.01).length;
  const domesticPendingCount = purchases.filter(p => p.estado === 'PENDIENTE').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-lg text-[10px] font-black uppercase tracking-wider">
              Finanzas & Pagos
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Importaciones USA & Proveedores Nacionales
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">
            Pago a Proveedores
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm font-medium">
            Control de cuentas en Dólares (USD $), Contenedores de importación USA, Estados de Cuenta (Statements) y Facturación Local en CLP.
          </p>
        </div>
      </div>

      {/* Tabs Selector Navigation */}
      <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('USA_CONTAINERS')}
          className={`flex-1 min-w-[200px] flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${
            activeTab === 'USA_CONTAINERS'
              ? 'bg-slate-900 text-white shadow-lg'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Ship size={16} className={activeTab === 'USA_CONTAINERS' ? 'text-blue-400' : 'text-slate-400'} />
          <span>Importaciones USA (USD $)</span>
          {usaPendingCount > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
              activeTab === 'USA_CONTAINERS' ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-800'
            }`}>
              {usaPendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('STATEMENT_USA')}
          className={`flex-1 min-w-[200px] flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${
            activeTab === 'STATEMENT_USA'
              ? 'bg-slate-900 text-white shadow-lg'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText size={16} className={activeTab === 'STATEMENT_USA' ? 'text-emerald-400' : 'text-slate-400'} />
          <span>Statement & Estado de Cuenta USA</span>
        </button>

        <button
          onClick={() => setActiveTab('DOMESTIC_CLP')}
          className={`flex-1 min-w-[200px] flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${
            activeTab === 'DOMESTIC_CLP'
              ? 'bg-slate-900 text-white shadow-lg'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Coins size={16} className={activeTab === 'DOMESTIC_CLP' ? 'text-amber-400' : 'text-slate-400'} />
          <span>Proveedores Nacionales (CLP $)</span>
          {domesticPendingCount > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
              activeTab === 'DOMESTIC_CLP' ? 'bg-red-400 text-white' : 'bg-red-100 text-red-700'
            }`}>
              {domesticPendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Search Input (For Tabs that list purchases) */}
      {activeTab !== 'STATEMENT_USA' && (
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder={activeTab === 'USA_CONTAINERS' ? "Buscar por proveedor USA, N° Contenedor, Invoice, notas en pesos..." : "Buscar por proveedor nacional o descripción..."}
            className="w-full pl-13 pr-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-slate-300 outline-none transition-all shadow-sm text-sm font-bold bg-white text-slate-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {/* Tab Content Rendering */}
      {activeTab === 'USA_CONTAINERS' && (
        <UsaPurchasesTab searchTerm={searchTerm} />
      )}

      {activeTab === 'STATEMENT_USA' && (
        <UsaSupplierStatement />
      )}

      {activeTab === 'DOMESTIC_CLP' && (
        <DomesticPurchasesTab searchTerm={searchTerm} />
      )}
    </div>
  );
}
