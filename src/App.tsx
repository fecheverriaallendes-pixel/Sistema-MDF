import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  Tags, 
  Menu, 
  X,
  PlusCircle,
  FileText,
  Settings,
  Home as HomeIcon,
  User as UserIcon,
  ShieldAlert,
  LogOut,
  Coins,
  Wallet,
  Activity,
  Cloud,
  BookOpen,
  LayoutGrid
} from 'lucide-react';

import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Ventas from './pages/Ventas';
import RegistrarVenta from './pages/RegistrarVenta';
import Stock from './pages/Stock';
import Despachos from './pages/Despachos';
import Etiquetas from './pages/Etiquetas';
import Configuracion from './pages/Configuracion';
import Comisiones from './pages/Comisiones';
import Catalogo from './pages/Catalogo';
import Proveedores from './pages/Proveedores';
import { useStore } from './store/GlobalContext';
import { StaffRole } from './types';

const Sidebar = ({ isOpen, toggle }: { isOpen: boolean; toggle: () => void }) => {
  const location = useLocation();
  const { currentUser, logout, playSound } = useStore();
  
  if (!currentUser) return null;

  const allMenuItems = [
    { name: 'Inicio', icon: HomeIcon, path: '/', roles: [StaffRole.ADMIN, StaffRole.VENDEDOR, StaffRole.BODEGA, StaffRole.DESPACHO] },
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: [StaffRole.ADMIN, StaffRole.VENDEDOR, StaffRole.BODEGA, StaffRole.DESPACHO] },
    { name: 'Ventas y Clientes', icon: FileText, path: '/ventas', roles: [StaffRole.ADMIN, StaffRole.VENDEDOR] },
    { name: 'Nómina Comisiones', icon: Coins, path: '/comisiones', roles: [StaffRole.ADMIN] },
    { name: 'Catálogo Maestro', icon: LayoutGrid, path: '/catalogo', roles: [StaffRole.ADMIN, StaffRole.VENDEDOR] },
    { name: 'Pagos Proveedores', icon: Wallet, path: '/proveedores', roles: [StaffRole.ADMIN] },
    { name: 'Inventario Stock', icon: Package, path: '/stock', roles: [StaffRole.ADMIN, StaffRole.BODEGA] },
    { name: 'Logística Despacho', icon: Truck, path: '/despachos', roles: [StaffRole.ADMIN, StaffRole.VENDEDOR, StaffRole.BODEGA, StaffRole.DESPACHO] },
    { name: 'Etiquetas Térmicas', icon: Tags, path: '/etiquetas', roles: [StaffRole.ADMIN, StaffRole.VENDEDOR, StaffRole.BODEGA, StaffRole.DESPACHO] },
    { name: 'Configuración', icon: Settings, path: '/configuracion', roles: [StaffRole.ADMIN] },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(currentUser.rol));

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={toggle} />}
      <aside className={`fixed top-0 left-0 z-50 h-screen w-64 bg-slate-900 text-white transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 shadow-2xl flex flex-col no-print`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <Link to="/" onClick={() => playSound('transition')} className="flex items-center gap-3">
            <img src="https://i.ibb.co/qMSczKZF/Whats-App-Image-2026-04-13-at-12-23-21.jpg" alt="Logo" className="w-12 h-12 rounded-xl object-cover shadow-lg" />
            <span className="text-lg font-black tracking-tighter leading-tight">
              El Garage <br/><span className="text-amber-500 italic">del Fardo</span>
            </span>
          </Link>
          <button onClick={toggle} className="lg:hidden p-1 text-slate-400 hover:text-white"><X size={24} /></button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                onClick={() => {
                  playSound('transition');
                  if (window.innerWidth < 1024) toggle();
                }}
                className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${isActive ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <Icon size={18} /><span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-800 space-y-4">
          <div className="bg-slate-800/50 p-4 rounded-3xl border border-slate-700/50">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Usuario Activo</p>
            <p className="text-xs font-black text-white truncate uppercase">{currentUser.nombre}</p>
            <p className="text-[8px] text-amber-500 font-black uppercase mt-0.5">{currentUser.rol}</p>
          </div>
          <button 
            onClick={() => { logout(); window.location.hash = '#/'; }}
            className="w-full flex items-center gap-2 px-4 py-4 rounded-2xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all font-black text-[10px] uppercase tracking-widest"
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
};

const Header = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  const { currentUser, settings } = useStore();
  if (!currentUser) return null;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30 no-print">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
          <Menu size={24} />
        </button>
        <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
           <div className="w-2 h-2 rounded-full bg-amber-600 animate-pulse"></div>
           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
             Firebase Activo
             <Activity size={12} className="text-amber-600" />
           </span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-black text-slate-900 leading-none uppercase">{currentUser.nombre}</p>
          <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-1">{currentUser.rol}</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
          <UserIcon size={18} />
        </div>
      </div>
    </header>
  );
};

const ProtectedRoute = ({ children, roles }: React.PropsWithChildren<{ roles: StaffRole[] }>) => {
  const { currentUser } = useStore();
  if (!currentUser) return <Navigate to="/" />;
  if (!roles.includes(currentUser.rol)) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
        <ShieldAlert size={64} className="text-red-500" />
        <h2 className="text-2xl font-black text-slate-900 uppercase">Acceso Restringido</h2>
        <p className="text-slate-500">No tienes permisos para ver este módulo.</p>
        <Link to="/" className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase text-xs tracking-widest">Volver al Inicio</Link>
      </div>
    );
  }
  return <>{children}</>;
};

export default function App() {
  const { currentUser } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <HashRouter>
      <div className="h-screen bg-slate-50 overflow-hidden relative">
        {currentUser && <Sidebar isOpen={sidebarOpen} toggle={toggleSidebar} />}
        
        <div className={`flex flex-col h-full overflow-hidden transition-all duration-300 ${currentUser ? 'lg:ml-64' : ''}`}>
          {currentUser && <Header toggleSidebar={toggleSidebar} />}
          
          <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<ProtectedRoute roles={[StaffRole.ADMIN, StaffRole.VENDEDOR, StaffRole.BODEGA, StaffRole.DESPACHO]}><Dashboard /></ProtectedRoute>} />
              <Route path="/ventas" element={<ProtectedRoute roles={[StaffRole.ADMIN, StaffRole.VENDEDOR]}><Ventas /></ProtectedRoute>} />
              <Route path="/registrar-venta" element={<ProtectedRoute roles={[StaffRole.ADMIN, StaffRole.VENDEDOR]}><RegistrarVenta /></ProtectedRoute>} />
              <Route path="/stock" element={<ProtectedRoute roles={[StaffRole.ADMIN, StaffRole.BODEGA]}><Stock /></ProtectedRoute>} />
              <Route path="/despachos" element={<ProtectedRoute roles={[StaffRole.ADMIN, StaffRole.VENDEDOR, StaffRole.BODEGA, StaffRole.DESPACHO]}><Despachos /></ProtectedRoute>} />
              <Route path="/etiquetas" element={<ProtectedRoute roles={[StaffRole.ADMIN, StaffRole.VENDEDOR, StaffRole.BODEGA, StaffRole.DESPACHO]}><Etiquetas /></ProtectedRoute>} />
              <Route path="/configuracion" element={<ProtectedRoute roles={[StaffRole.ADMIN]}><Configuracion /></ProtectedRoute>} />
              <Route path="/comisiones" element={<ProtectedRoute roles={[StaffRole.ADMIN]}><Comisiones /></ProtectedRoute>} />
              <Route path="/catalogo" element={<ProtectedRoute roles={[StaffRole.ADMIN, StaffRole.VENDEDOR]}><Catalogo /></ProtectedRoute>} />
              <Route path="/proveedores" element={<ProtectedRoute roles={[StaffRole.ADMIN]}><Proveedores /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </div>
    </HashRouter>
  );
}
