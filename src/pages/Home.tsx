import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Zap, 
  Package, 
  PackagePlus,
  Settings, 
  LayoutDashboard,
  Truck,
  Lock,
  LogIn,
  ChevronRight,
  FileText,
  ShieldCheck,
  RefreshCw,
  Database,
  CloudOff,
  AlertTriangle,
  CheckCircle,
  Globe,
  Link as LinkIcon,
  BookOpen,
  LayoutGrid,
  List,
  FileCode2,
  HelpCircle,
  Coins,
  Wallet
} from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { StaffRole } from '../types';

const LOGO_URL = "https://i.ibb.co/qMSczKZF/Whats-App-Image-2026-04-13-at-12-23-21.jpg";

export default function Home() {
  const { staff, currentUser, login, playSound, settings, updateSettings, syncWithCloud, isSyncing } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ user: '', pin: '' });
  const [error, setError] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{status: 'idle' | 'success' | 'error', msg: string}>({status: 'idle', msg: ''});
  
  const [setupUrl, setSetupUrl] = useState('');

  const allAvailableUsers = [
    { id: 'master', nombre: 'ADMINISTRADOR MAESTRO', rol: StaffRole.ADMIN, pin: '2024' },
    ...staff.filter(u => u.activo)
  ];

  const handleManualSync = async () => {
      playSound('click');
      const success = await syncWithCloud();
      if (success) {
          setSyncFeedback({status: 'success', msg: '¡Sincronización Exitosa!'});
          playSound('success');
      } else {
          setSyncFeedback({status: 'error', msg: settings.lastError || 'Error de conexión'});
      }
      setTimeout(() => setSyncFeedback({status: 'idle', msg: ''}), 3000);
  };

  const handleInitialSetup = async () => {
    if (!setupUrl.includes('script.google.com')) {
      alert("⚠️ URL Inválida. Debe ser el link de tu Google Apps Script (terminado en /exec).");
      return;
    }
    setLoading(true);
    updateSettings({ cloudUrl: setupUrl, dbConnected: true });
    playSound('success');
    setTimeout(async () => {
      const success = await syncWithCloud();
      if (!success) {
        alert("❌ No se pudo conectar. Verifica que el script esté desplegado como 'Anyone' (Cualquiera).");
      }
      setLoading(false);
    }, 1000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    playSound('click');

    setTimeout(() => {
      const u = allAvailableUsers.find(u => u.nombre === loginForm.user);
      if (u && u.pin === loginForm.pin) {
        login(u.nombre, u.rol);
      } else {
        setError(true);
      }
      setLoading(false);
    }, 600);
  };

  const menuOptions = [
    { 
      name: 'Modo Live TikTok', 
      desc: 'Registro ultra-rápido de ventas en vivo', 
      icon: Zap, 
      path: '/registrar',
      color: 'bg-amber-600',
      shadow: 'shadow-amber-600/30',
      roles: [StaffRole.ADMIN, StaffRole.VENDEDOR]
    },
    { 
      name: 'Ventas y Clientes', 
      desc: 'Historial completo y base de datos', 
      icon: FileText, 
      path: '/ventas',
      color: 'bg-amber-600',
      shadow: 'shadow-amber-600/30',
      roles: [StaffRole.ADMIN, StaffRole.VENDEDOR]
    },
    { 
      name: 'Bodega y Stock', 
      desc: 'Inventario físico, crear productos y carga masiva', 
      icon: Package, 
      path: '/stock',
      color: 'bg-slate-900',
      shadow: 'shadow-slate-900/40',
      roles: [StaffRole.ADMIN, StaffRole.BODEGA]
    },
    { 
      name: 'Crear Producto', 
      desc: 'Añadir nuevo fardo o pieza al stock', 
      icon: PackagePlus, 
      path: '/stock?action=add',
      color: 'bg-amber-700',
      shadow: 'shadow-amber-700/30',
      roles: [StaffRole.ADMIN, StaffRole.BODEGA]
    },
    { 
      name: 'Logística Despacho', 
      desc: 'Control de envíos y etiquetado masivo', 
      icon: Truck, 
      path: '/despachos',
      color: 'bg-amber-500',
      shadow: 'shadow-amber-500/30',
      roles: [StaffRole.ADMIN, StaffRole.VENDEDOR, StaffRole.BODEGA, StaffRole.DESPACHO]
    },
    { 
      name: 'Nómina Comisiones', 
      desc: 'Gestión de pagos a vendedores', 
      icon: Coins, 
      path: '/comisiones',
      color: 'bg-purple-600',
      shadow: 'shadow-purple-600/30',
      roles: [StaffRole.ADMIN]
    },
    { 
      name: 'Pagos Proveedores', 
      desc: 'Control de pagos y abonos', 
      icon: Wallet, 
      path: '/proveedores',
      color: 'bg-indigo-600',
      shadow: 'shadow-indigo-600/30',
      roles: [StaffRole.ADMIN]
    },
    { 
      name: 'Dashboard', 
      desc: 'Métricas y estadísticas', 
      icon: LayoutDashboard, 
      path: '/dashboard',
      color: 'bg-pink-600',
      shadow: 'shadow-pink-600/30',
      roles: [StaffRole.ADMIN, StaffRole.VENDEDOR, StaffRole.BODEGA, StaffRole.DESPACHO]
    },
    { 
      name: 'Catálogo Maestro', 
      desc: 'Visualización y Precios', 
      icon: LayoutGrid, 
      path: '/catalogo',
      color: 'bg-indigo-600',
      shadow: 'shadow-indigo-600/30',
      roles: [StaffRole.ADMIN, StaffRole.VENDEDOR]
    },
    { 
      name: 'Configuración', 
      desc: 'Ajustes del sistema y base de datos', 
      icon: Settings, 
      path: '/configuracion',
      color: 'bg-slate-800',
      shadow: 'shadow-slate-800/30',
      roles: [StaffRole.ADMIN]
    }
  ];

  if (!currentUser) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-4 animate-gradient overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-400/30 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-400/30 blur-[150px] rounded-full animate-pulse delay-700"></div>

        <div className="w-full max-w-xl z-10 animate-in fade-in zoom-in duration-1000 flex flex-col items-center">
          <div className="text-center mb-10 drop-shadow-2xl transition-transform">
            <img src={LOGO_URL} alt="Logo" className="w-48 sm:w-64 mx-auto mb-6 drop-shadow-2xl" />
            <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tighter mb-2 uppercase">
              El Garage <span className="text-amber-400 italic">del Fardo</span>
            </h1>
            <p className="text-white font-black uppercase tracking-[0.6em] text-[9px] opacity-80">PLATAFORMA OPERATIVA MULTIUSUARIO</p>
          </div>

          <div className="w-full max-w-md bg-white/10 backdrop-blur-3xl p-10 rounded-[56px] shadow-2xl border border-white/20">
                <form onSubmit={handleLogin} className="space-y-6">
                  {staff.length === 0 && (
                    <div className="space-y-3">
                        <div className="p-4 bg-amber-600/20 border border-amber-600/30 rounded-3xl text-center">
                            <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest mb-1">Firebase Activo</p>
                            <p className="text-white/70 text-xs font-medium">Ingresa con el Administrador Maestro para comenzar a configurar el sistema.</p>
                        </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] ml-6">PERFIL PROFESIONAL</label>
                    <select 
                      required
                      className="w-full px-8 py-5 bg-white border-none rounded-[28px] font-black text-slate-900 focus:ring-4 focus:ring-amber-400/50 outline-none appearance-none transition-all shadow-xl"
                      value={loginForm.user}
                      onChange={(e) => setLoginForm({...loginForm, user: e.target.value})}
                    >
                      <option value="">ELIJA SU USUARIO...</option>
                      {allAvailableUsers.map(u => (
                        <option key={u.id} value={u.nombre}>{u.nombre} ({u.rol})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] ml-6">PIN DE SEGURIDAD</label>
                    <input 
                      required
                      type="password"
                      placeholder="••••"
                      maxLength={4}
                      className="w-full px-8 py-5 bg-white border-none rounded-[28px] text-center text-4xl font-black tracking-[0.5em] text-slate-900 focus:ring-4 focus:ring-amber-400/50 outline-none transition-all shadow-xl"
                      value={loginForm.pin}
                      onChange={(e) => setLoginForm({...loginForm, pin: e.target.value})}
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-red-600/90 text-white rounded-[24px] text-[10px] font-black text-center flex items-center justify-center gap-3 animate-shake">
                      <Lock size={14} /> PIN INCORRECTO
                    </div>
                  )}

                  <button 
                    type="submit" disabled={loading || isSyncing}
                    className="w-full py-6 bg-slate-900 text-white rounded-[28px] font-black text-xl flex items-center justify-center gap-4 hover:bg-black transition-all shadow-2xl disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="animate-spin" /> : <LogIn size={24} />} 
                    {loading ? 'VALIDANDO...' : 'ENTRAR AL SISTEMA'}
                  </button>
                </form>
          </div>
          
          <div className="mt-8 flex flex-col items-center gap-2">
              <div className="flex items-center gap-3 text-white/40 text-[9px] font-black uppercase tracking-widest">
                <Database size={12} /> Cloud SQL: MODO LOCAL
              </div>
          </div>
        </div>
      </div>
    );
  }

  const canSeeCatalogue = currentUser.rol === StaffRole.ADMIN || currentUser.rol === StaffRole.VENDEDOR;

  return (
    <div className="min-h-full flex flex-col items-center justify-center py-10 px-4">
      <div className="text-center mb-12">
        <img src={LOGO_URL} alt="Logo" className="w-24 mx-auto mb-6 drop-shadow-2xl" />
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2 uppercase">
          BIENVENIDO A <span className="text-gray-600 italic">El Garage del Fardo</span>
        </h1>
        <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[10px] mb-8">Central de Inteligencia Logística</p>
        
        <div className="inline-flex items-center gap-3 px-6 py-2 bg-white rounded-full shadow-sm border border-slate-100 mb-8">
          <div className="w-2 h-2 rounded-full bg-gray-600 animate-pulse"></div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {currentUser.nombre} • Firebase Activo
          </span>
        </div>
      </div>

      {canSeeCatalogue && (
        <div className="w-full max-w-6xl mb-12 animate-in slide-in-from-top duration-700">
           <Link 
             to="/catalogo"
             onClick={() => playSound('transition')}
             className="group flex items-center justify-between p-8 bg-indigo-600 rounded-[40px] text-white shadow-xl hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-95 text-left"
           >
              <div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4"><LayoutGrid size={24} /></div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">Catálogo Maestro</h3>
                <p className="text-indigo-100 text-[10px] font-bold uppercase italic mt-1 tracking-widest">Visualización y Precios</p>
              </div>
              <ChevronRight size={32} className="opacity-50 group-hover:opacity-100 transition-opacity" />
           </Link>
        </div>
      )}

      <div className="w-full max-w-6xl animate-in fade-in slide-in-from-bottom duration-1000">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {menuOptions
            .filter(opt => opt.roles.includes(currentUser.rol))
            .map((opt) => {
            const Icon = opt.icon;
            return (
              <Link 
                key={opt.path} 
                to={opt.path}
                onClick={() => playSound('transition')}
                className="group relative bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 ${opt.color} opacity-0 group-hover:opacity-10 rounded-full translate-x-10 -translate-y-10 transition-all duration-500`}></div>
                
                <div className={`w-14 h-14 ${opt.color} rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform duration-500 ${opt.shadow}`}>
                  <Icon size={24} />
                </div>
                
                <h3 className="text-xl font-black text-slate-900 mb-2 leading-none uppercase">{opt.name}</h3>
                <p className="text-slate-500 text-[10px] font-medium mb-8 leading-relaxed italic">{opt.desc}</p>
                
                <div className="flex items-center text-slate-900 font-black text-[11px] uppercase tracking-[0.2em]">
                  INGRESAR <ChevronRight size={16} className="ml-1 text-gray-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
