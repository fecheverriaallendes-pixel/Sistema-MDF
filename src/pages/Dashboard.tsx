import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  Package, 
  DollarSign,
  AlertCircle,
  ArrowRight,
  Zap,
  RefreshCw,
  Cloud,
  PieChart,
  BarChart3,
  Users,
  ArrowUpRight,
  LayoutDashboard
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { useStore } from '../store/GlobalContext';
import { formatUSD, formatARS } from '../utils/currency';

const StatCard = ({ title, value, usdValue, icon: Icon, color, subtitle, trend }: any) => (
  <div className="bg-white p-7 rounded-[40px] border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.03)] relative overflow-hidden group hover:shadow-xl transition-all duration-500">
    <div className={`absolute -right-6 -top-6 w-28 h-28 bg-${color}-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 scale-150`}></div>
    <div className={`w-14 h-14 rounded-2xl bg-${color}-50 text-${color}-600 flex items-center justify-center mb-6 relative z-10 transition-transform group-hover:rotate-6`}>
      <Icon size={28} />
    </div>
    <div className="relative z-10">
      <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">{title}</p>
      <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
      {usdValue && <p className="text-xs font-bold text-slate-400 mt-1">≈ {usdValue}</p>}
      <div className="flex items-center justify-between mt-3">
        <p className="text-[10px] text-slate-400 font-bold uppercase">{subtitle}</p>
        {trend && (
          <span className="flex items-center text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
            <ArrowUpRight size={12} className="mr-1" /> {trend}
          </span>
        )}
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const { getStats, syncWithCloud, isSyncing, settings, sales } = useStore();
  const stats = getStats();

  const chartData = useMemo(() => {
    const days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString();
    });

    return days.map(day => {
      const daySales = sales.filter(s => s.fecha === day);
      const total = daySales.reduce((acc, s) => acc + s.total, 0);
      return { name: day.split('/')[0], total };
    });
  }, [sales]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-4">
            <LayoutDashboard size={14} /> Sistema Inteligente v2.5
          </div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tight uppercase">Dashboard <span className="text-amber-600 italic">El Garage del Fardo</span></h2>
          <p className="text-slate-500 font-medium italic mt-2">Inteligencia de negocios y control operativo centralizado</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={() => syncWithCloud()}
            disabled={isSyncing}
            className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-[24px] font-black text-xs uppercase tracking-widest hover:border-slate-300 transition-all shadow-sm active:scale-95"
          >
            <RefreshCw className={isSyncing ? 'animate-spin text-amber-500' : 'text-slate-400'} size={18} /> 
            {isSyncing ? 'Actualizando Datos...' : 'Refrescar Nube'}
          </button>

          {stats.stockCritico > 0 && (
            <Link 
              to="/stock"
              className="flex items-center gap-3 bg-red-500 text-white px-8 py-4 rounded-[24px] font-black animate-pulse shadow-xl shadow-red-500/20 text-xs uppercase tracking-widest"
            >
              <AlertCircle size={18} />
              {stats.stockCritico} Alertas Stock
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          title="Ventas de Hoy" 
          value={formatARS(stats.ventasHoy)} 
          usdValue={formatUSD(stats.ventasHoy, settings.dolarBlueRate)}
          icon={TrendingUp} 
          color="blue" 
          subtitle={`${stats.countHoy} órdenes cerradas`}
          trend="+12%"
        />
        <StatCard 
          title="Utilidad Neta Est." 
          value={formatARS(stats.utilidadTotal)} 
          usdValue={formatUSD(stats.utilidadTotal, settings.dolarBlueRate)}
          icon={DollarSign} 
          color="indigo" 
          subtitle="Margen después de costos"
        />
        <StatCard 
          title="Valor Bodega" 
          value={formatARS(stats.valorInventarioVenta)} 
          usdValue={formatUSD(stats.valorInventarioVenta, settings.dolarBlueRate)}
          icon={Package} 
          color="amber" 
          subtitle={`${stats.disponibles} fardos en stock`}
        />
        <StatCard 
          title="Eficiencia TikTok" 
          value={stats.pendientesDatos > 0 ? `${stats.pendientesDatos} Pend.` : 'Óptima'} 
          icon={Zap} 
          color="purple" 
          subtitle="Datos de envío faltantes"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl overflow-hidden relative">
           <div className="flex items-center justify-between mb-8">
             <div>
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Tendencia de Ventas</h3>
               <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Últimos 7 días de operación</p>
             </div>
             <div className="flex gap-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase"><div className="w-1.5 h-1.5 rounded-full bg-amber-600"></div> Ingresos</div>
             </div>
           </div>
           <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold', fontSize: 10}} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-slate-900 p-10 rounded-[48px] text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Users size={120} /></div>
          <h3 className="text-xl font-black uppercase tracking-tighter mb-8 relative z-10">Leaderboard Ventas</h3>
          <div className="space-y-6 relative z-10">
            {stats.topSellers.map(([name, total]: any, idx: number) => (
              <div key={name} className="flex items-center gap-4 bg-white/5 p-5 rounded-[28px] border border-white/10 hover:bg-white/10 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${idx === 0 ? 'bg-amber-400 text-slate-900 shadow-[0_0_20px_rgba(251,191,36,0.5)]' : 'bg-slate-700 text-white'}`}>
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black uppercase tracking-tight">{name}</p>
                  <p className="text-amber-400 font-bold text-sm tracking-tight">{formatARS(total)}</p>
                </div>
                <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-600" style={{ width: `${(total / stats.totalVendido) * 100}%` }}></div>
                </div>
              </div>
            ))}
            {stats.topSellers.length === 0 && (
               <div className="text-center py-10 opacity-30">
                 <p className="text-xs font-black uppercase italic">Sin datos de venta registrados hoy</p>
               </div>
            )}
          </div>
          <Link to="/ventas" className="mt-8 w-full py-4 bg-white/10 hover:bg-white/20 rounded-[20px] flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all">
            Ver Detalle Completo <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <div className="bg-gradient-to-br from-amber-600 to-amber-800 rounded-[56px] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden shadow-2xl">
        <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[150%] bg-white/10 blur-[80px] rounded-full rotate-12 pointer-events-none"></div>
        <div className="space-y-6 text-center md:text-left relative z-10">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-black/20 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-full">
            <Zap size={16} /> Alta Disponibilidad
          </div>
          <h3 className="text-5xl font-black uppercase tracking-tighter leading-none">Aumenta tu Margen <br/>con Estrategia</h3>
          <p className="text-white/80 font-medium max-w-lg text-xl italic leading-relaxed">El sistema El Garage del Fardo ha detectado que los fardos de "Polerones Premium" tienen el mejor retorno de inversión este mes.</p>
        </div>
        <div className="flex flex-col gap-4 relative z-10">
          <Link 
            to="/registrar" 
            className="bg-white text-amber-600 px-12 py-7 rounded-[32px] font-black text-2xl transition-all shadow-2xl hover:scale-105 active:scale-95 flex items-center gap-4"
          >
            <Zap size={32} />
            NUEVO LIVE
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 text-[10px] font-black text-slate-300 uppercase tracking-widest pt-4">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></div>
        Sincronizado vía Cloud Protocol <Cloud size={12} className="text-amber-400" />
      </div>
    </div>
  );
}
