import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../store/GlobalContext';
import { jsPDF } from 'jspdf';
import { 
  Ticket, 
  Download, 
  Plus, 
  AlertCircle, 
  Search, 
  ArrowUpDown, 
  Calendar, 
  Eye, 
  ShieldCheck, 
  ShieldAlert, 
  X, 
  Check, 
  Clipboard, 
  CheckCircle2,
  FileText,
  User,
  Phone,
  MessageSquare,
  AlertTriangle,
  Clock,
  Send,
  Paperclip,
  TrendingUp,
  Award,
  Filter,
  RefreshCw,
  Building2,
  Users,
  ChevronRight,
  Sparkles,
  Layers,
  CheckCircle
} from 'lucide-react';
import { StaffRole, Coupon, Incident, IncidentStatus, IncidentPriority, IncidentHistoryEvent, IncidentComment, IncidentAttachment } from '../types';

const LOGO_URL = "https://i.ibb.co/qMyZQHYg/logo-sin-fondo-1.png";

export default function PostVenta() {
  const { 
    coupons, 
    addCoupon, 
    redeemCoupon, 
    redeemCouponByCode, 
    deleteCoupon, 
    currentUser, 
    staff,
    sales,
    stock,
    incidents,
    addIncident,
    updateIncident,
    addIncidentComment,
    addIncidentAttachment,
    deleteIncident
  } = useStore();

  const [activeTab, setActiveTab] = useState<'casos' | 'dashboard' | 'cupones'>('casos');

  // Coupon Form States (Legacy compatible)
  const [amount, setAmount] = useState('');
  const [validDays, setValidDays] = useState('30');
  const [customerName, setCustomerName] = useState('');
  const [redeemCode, setRedeemCode] = useState('');
  const [searchTermCoupons, setSearchTermCoupons] = useState('');
  const [sortOrderCoupons, setSortOrderCoupons] = useState<'newest' | 'oldest'>('newest');

  // Incidents Filter States
  const [searchTermIncidents, setSearchTermIncidents] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [priorityFilter, setPriorityFilter] = useState<string>('todos');
  const [executiveFilter, setExecutiveFilter] = useState<string>('todos');

  // Selected Interactive States
  const [selectedPreviewCoupon, setSelectedPreviewCoupon] = useState<Coupon | null>(null);
  const [copiedCodeCode, setCopiedCodeCode] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // New Incident Form Modal State
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [newCaseForm, setNewCaseForm] = useState({
    numeroVenta: '',
    cliente: '',
    telefono: '',
    canal: 'WhatsApp',
    motivo: 'Fardo incompleto',
    prioridad: IncidentPriority.MEDIA,
    responsable: '',
    observaciones: ''
  });

  // Compensation Generation Inside Incident
  const [compAmount, setCompAmount] = useState('');
  const [compDays, setCompDays] = useState('30');

  // Internal Note Input
  const [newCommentText, setNewCommentText] = useState('');

  // Attachment Simulation Input
  const [mockAttachmentName, setMockAttachmentName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Admin PIN Authorization Modal State
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    couponId?: string;
    couponCode?: string;
    actionType: 'redeem' | 'redeemByCode';
    selectedAdminId: string;
    pin: string;
    error: string;
  }>({
    isOpen: false,
    actionType: 'redeem',
    selectedAdminId: 'master',
    pin: '',
    error: ''
  });

  const isAdmin = currentUser?.rol === StaffRole.ADMIN;

  // Active admins for PIN override
  const admins = useMemo(() => {
    return [
      { id: 'master', nombre: 'ADMINISTRADOR MAESTRO', pin: '2024', rol: StaffRole.ADMIN },
      ...(staff || []).filter(u => u.rol === StaffRole.ADMIN && u.activo)
    ];
  }, [staff]);

  const activeExecutives = useMemo(() => {
    const list = (staff || []).filter(s => s.activo).map(s => s.nombre);
    return list.length > 0 ? list : ['Carla', 'Andrea', 'Sonia'];
  }, [staff]);

  // Set default executive when staff list changes
  React.useEffect(() => {
    if (activeExecutives.length > 0 && !newCaseForm.responsable) {
      setNewCaseForm(prev => ({ ...prev, responsable: activeExecutives[0] }));
    }
  }, [activeExecutives, newCaseForm.responsable]);

  const normalizeText = (text: string) => 
    (text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  // Look up sale information dynamically for auto-fill
  const autoFillFromSale = (saleNumStr: string) => {
    const num = parseInt(saleNumStr, 10);
    if (isNaN(num)) return;
    const sale = sales.find(s => s.numeroVenta === num);
    if (sale) {
      setNewCaseForm(prev => ({
        ...prev,
        cliente: sale.cliente || '',
        telefono: sale.telefono || ''
      }));
    }
  };

  // Extract linked sale information
  const getLinkedSaleDetails = (saleNumStr?: string) => {
    if (!saleNumStr) return null;
    const num = parseInt(saleNumStr, 10);
    if (isNaN(num)) return null;
    const sale = sales.find(s => s.numeroVenta === num);
    if (!sale) return null;

    const products: { code: string; type: string; provider: string }[] = [];
    if (sale.codigoFardo) {
      const stockItem = stock.find(item => item.codigo === sale.codigoFardo);
      products.push({
        code: sale.codigoFardo,
        type: stockItem?.tipo || 'Fardo',
        provider: stockItem?.proveedor || 'General'
      });
    }
    if (sale.items) {
      sale.items.forEach(item => {
        const stockItem = stock.find(st => st.codigo === item.codigoFardo);
        products.push({
          code: item.codigoFardo,
          type: stockItem?.tipo || item.tipoVenta || 'Fardo',
          provider: stockItem?.proveedor || 'General'
        });
      });
    }

    return {
      sale,
      products,
      etiquetador: sale.etiquetador || 'No especificado',
      vendedor: sale.vendedor || 'No especificado'
    };
  };

  // --- FILTERS & SORTING ---
  const filteredAndSortedCoupons = useMemo(() => {
    const normalizedSearch = normalizeText(searchTermCoupons);
    
    let result = coupons.filter(c => 
      normalizeText(c.customerName || "").includes(normalizedSearch) || 
      normalizeText(c.code).includes(normalizedSearch)
    );

    return result.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return sortOrderCoupons === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [coupons, searchTermCoupons, sortOrderCoupons]);

  const filteredIncidents = useMemo(() => {
    const queryStr = normalizeText(searchTermIncidents);
    return incidents.filter(inc => {
      const matchesSearch = 
        normalizeStr(inc.codigoCaso).includes(queryStr) ||
        normalizeStr(inc.cliente).includes(queryStr) ||
        normalizeStr(inc.motivo).includes(queryStr) ||
        normalizeStr(inc.telefono).includes(queryStr) ||
        normalizeStr(inc.numeroVenta || '').includes(queryStr);
      
      const matchesStatus = statusFilter === 'todos' || inc.estado === statusFilter;
      const matchesPriority = priorityFilter === 'todos' || inc.prioridad === priorityFilter;
      const matchesExecutive = executiveFilter === 'todos' || inc.responsable === executiveFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesExecutive;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [incidents, searchTermIncidents, statusFilter, priorityFilter, executiveFilter]);

  function normalizeStr(t: string) {
    return (t || "").toLowerCase();
  }

  const isExpired = (coupon: Coupon) => {
    return new Date(coupon.validUntil) < new Date();
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeCode(code);
    setTimeout(() => setCopiedCodeCode(null), 2000);
  };

  // --- INCIDENT ACTIONS ---
  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseForm.cliente || !newCaseForm.telefono || !newCaseForm.responsable) {
      alert("Por favor complete los campos obligatorios.");
      return;
    }

    try {
      const incidentPayload = {
        numeroVenta: newCaseForm.numeroVenta || undefined,
        cliente: newCaseForm.cliente,
        telefono: newCaseForm.telefono,
        canal: newCaseForm.canal,
        motivo: newCaseForm.motivo,
        prioridad: newCaseForm.prioridad,
        estado: IncidentStatus.NUEVO,
        responsable: newCaseForm.responsable,
        observaciones: newCaseForm.observaciones || undefined
      };

      const created = await addIncident(incidentPayload);
      setIsNewCaseModalOpen(false);
      
      // Reset form (keep default assignee)
      setNewCaseForm(prev => ({
        numeroVenta: '',
        cliente: '',
        telefono: '',
        canal: 'WhatsApp',
        motivo: 'Fardo incompleto',
        prioridad: IncidentPriority.MEDIA,
        responsable: prev.responsable,
        observaciones: ''
      }));

      // Focus/open newly created incident
      if (created) {
        setSelectedIncident(created);
      }
    } catch (err: any) {
      alert("Error al crear el caso: " + err.message);
    }
  };

  const handleStatusChange = async (incidentId: string, newStatus: IncidentStatus) => {
    await updateIncident(incidentId, { estado: newStatus });
    // Keep local preview synchronized
    if (selectedIncident && selectedIncident.id === incidentId) {
      setSelectedIncident(prev => prev ? { ...prev, estado: newStatus } : null);
    }
  };

  const handleAssigneeChange = async (incidentId: string, newAssignee: string) => {
    await updateIncident(incidentId, { responsable: newAssignee });
    if (selectedIncident && selectedIncident.id === incidentId) {
      setSelectedIncident(prev => prev ? { ...prev, responsable: newAssignee } : null);
    }
  };

  const handleAddComment = async (incidentId: string) => {
    if (!newCommentText.trim()) return;
    await addIncidentComment(incidentId, newCommentText);
    setNewCommentText('');
    
    // Refresh modal focus snapshot
    const updated = incidents.find(i => i.id === incidentId);
    if (updated) {
      setSelectedIncident(updated);
    }
  };

  // Simulate an attachment being registered (with drag & drop hooks)
  const handleAddAttachment = async (incidentId: string) => {
    const nameToUse = mockAttachmentName.trim() || (fileInputRef.current?.files?.[0]?.name) || "evidencia_foto.jpg";
    const newAttach = {
      name: nameToUse,
      url: "https://images.unsplash.com/photo-1590247813693-5541f1c609fd?w=500&auto=format&fit=crop&q=60",
      type: "imagen/jpeg"
    };
    await addIncidentAttachment(incidentId, newAttach);
    setMockAttachmentName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    const updated = incidents.find(i => i.id === incidentId);
    if (updated) {
      setSelectedIncident(updated);
    }
  };

  // Associate compensation directly inside the incident modal
  const handleGenerateCompensationInCase = async (incident: Incident) => {
    if (!compAmount) return;
    const valueNum = parseInt(compAmount, 10);
    if (isNaN(valueNum) || valueNum <= 0) return;

    const couponCode = 'CP-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    const validUntilDate = new Date(Date.now() + parseInt(compDays, 10) * 24 * 60 * 60 * 1000).toISOString();

    const newCop = {
      code: couponCode,
      value: valueNum,
      validUntil: validUntilDate,
      used: false,
      customerName: incident.cliente
    };

    try {
      // 1. Add coupon to central system
      await addCoupon(newCop);
      
      // 2. Associate with incident
      await updateIncident(incident.id, {
        couponCode: couponCode,
        couponValue: valueNum
      });

      // Reset inputs
      setCompAmount('');
      
      // Update local preview state
      const updated = incidents.find(i => i.id === incident.id);
      if (updated) {
        setSelectedIncident(updated);
      }
      alert(`Cupón de compensación ${couponCode} generado y asociado al caso exitosamente.`);
    } catch (e: any) {
      alert("Error generating compensation: " + e.message);
    }
  };

  // --- REDEMPTION HANDLERS (ADMIN OVERRIDE PRESERVED) ---
  const handleRedeem = (coupon: Coupon) => {
    const expired = isExpired(coupon);
    if (expired) {
      if (isAdmin) {
        if (confirm(`El cupón ha expirado el ${new Date(coupon.validUntil).toLocaleDateString('es-CL')}. Como tienes rol de Administrador, ¿deseas autorizar su canje directamente?`)) {
          try {
            redeemCoupon(coupon.id, currentUser?.nombre || "Administrador");
            alert("Cupón canjeado exitosamente con autorización de administrador.");
            if (selectedPreviewCoupon?.id === coupon.id) {
              setSelectedPreviewCoupon(prev => prev ? { ...prev, used: true, authorizedBy: currentUser?.nombre || "Administrador" } : null);
            }
          } catch (e: any) {
            alert(e.message);
          }
        }
      } else {
        setAuthModal({
          isOpen: true,
          couponId: coupon.id,
          couponCode: coupon.code,
          actionType: 'redeem',
          selectedAdminId: admins[0]?.id || 'master',
          pin: '',
          error: ''
        });
      }
    } else {
      if (confirm(`¿Estás seguro de canjear el cupón ${coupon.code} por $${coupon.value.toLocaleString('es-CL')}?`)) {
        try {
          redeemCoupon(coupon.id);
          alert("Cupón canjeado exitosamente.");
          if (selectedPreviewCoupon?.id === coupon.id) {
            setSelectedPreviewCoupon(prev => prev ? { ...prev, used: true } : null);
          }
        } catch (e: any) {
          alert(e.message);
        }
      }
    }
  };

  const handleRedeemByCode = () => {
    const targetCode = redeemCode.trim().toUpperCase();
    if (!targetCode) return;

    const coupon = coupons.find(c => c.code.toUpperCase() === targetCode);
    if (!coupon) {
      alert("⚠️ Cupón no encontrado");
      return;
    }

    if (coupon.used) {
      alert("⚠️ Este cupón ya ha sido utilizado");
      return;
    }

    const expired = isExpired(coupon);
    if (expired) {
      if (isAdmin) {
        if (confirm(`El cupón ${coupon.code} ha expirado. Como tienes rol de Administrador, ¿deseas autorizar su canje directamente?`)) {
          try {
            redeemCouponByCode(coupon.code, currentUser?.nombre || "Administrador");
            alert("Cupón canjeado exitosamente con autorización de administrador.");
            setRedeemCode('');
          } catch (e: any) {
            alert(e.message);
          }
        }
      } else {
        setAuthModal({
          isOpen: true,
          couponId: coupon.id,
          couponCode: coupon.code,
          actionType: 'redeemByCode',
          selectedAdminId: admins[0]?.id || 'master',
          pin: '',
          error: ''
        });
      }
    } else {
      try {
        redeemCouponByCode(coupon.code);
        alert("Cupón canjeado exitosamente");
        setRedeemCode('');
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const admin = admins.find(a => a.id === authModal.selectedAdminId);
    if (!admin) {
      setAuthModal(prev => ({ ...prev, error: "Administrador no válido" }));
      return;
    }

    if (admin.pin !== authModal.pin) {
      setAuthModal(prev => ({ ...prev, error: "Código PIN de seguridad incorrecto" }));
      return;
    }

    try {
      if (authModal.actionType === 'redeem' && authModal.couponId) {
        redeemCoupon(authModal.couponId, admin.nombre);
        alert(`✅ Cupón expirado canjeado con autorización de: ${admin.nombre}`);
      } else if (authModal.actionType === 'redeemByCode' && authModal.couponCode) {
        redeemCouponByCode(authModal.couponCode, admin.nombre);
        alert(`✅ Cupón expirado canjeado con autorización de: ${admin.nombre}`);
        setRedeemCode('');
      }
      
      if (selectedPreviewCoupon && selectedPreviewCoupon.id === authModal.couponId) {
        setSelectedPreviewCoupon(prev => prev ? { ...prev, used: true, authorizedBy: admin.nombre } : null);
      }

      setAuthModal({
        isOpen: false,
        actionType: 'redeem',
        selectedAdminId: 'master',
        pin: '',
        error: ''
      });
    } catch (err: any) {
      setAuthModal(prev => ({ ...prev, error: err.message }));
    }
  };

  // --- KPI GENERATOR ---
  const kpis = useMemo(() => {
    const total = incidents.length;
    const active = incidents.filter(i => i.estado !== IncidentStatus.RESUELTO && i.estado !== IncidentStatus.CERRADO).length;
    const resolvedThisMonth = incidents.filter(i => {
      if (i.estado !== IncidentStatus.RESUELTO && i.estado !== IncidentStatus.CERRADO) return false;
      const date = new Date(i.updatedAt || i.createdAt);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;

    const compensations = incidents.reduce((acc, curr) => acc + (curr.couponValue || 0), 0);

    // Calculate average resolution time (in hours) based on timeline logs
    let totalHours = 0;
    let resolvedCount = 0;
    incidents.forEach(inc => {
      const resolvedLog = inc.history?.find(h => h.description.includes('RESUELTO') || h.description.includes('Resuelto') || h.description.includes('Cerrado'));
      if (resolvedLog) {
        const start = new Date(inc.createdAt).getTime();
        const end = new Date(resolvedLog.timestamp).getTime();
        const hrs = (end - start) / (1000 * 60 * 60);
        if (hrs > 0) {
          totalHours += hrs;
          resolvedCount++;
        }
      }
    });

    const averageResTime = resolvedCount > 0 ? (totalHours / resolvedCount).toFixed(1) : '0.0';

    // Grouping Trends for Suppliers (Proveedores) and Prepared Operators (Etiquetadores)
    const supplierFails: { [key: string]: number } = {};
    const operatorFails: { [key: string]: number } = {};
    const motiveFails: { [key: string]: number } = {};

    incidents.forEach(inc => {
      // Group by motive
      motiveFails[inc.motivo] = (motiveFails[inc.motivo] || 0) + 1;

      // Group by linked sale details
      const linked = getLinkedSaleDetails(inc.numeroVenta);
      if (linked) {
        if (linked.etiquetador && linked.etiquetador !== 'No especificado') {
          operatorFails[linked.etiquetador] = (operatorFails[linked.etiquetador] || 0) + 1;
        }
        linked.products.forEach(p => {
          if (p.provider) {
            supplierFails[p.provider] = (supplierFails[p.provider] || 0) + 1;
          }
        });
      }
    });

    return {
      total,
      active,
      resolvedThisMonth,
      compensations,
      averageResTime,
      supplierFails: Object.entries(supplierFails).map(([name, qty]) => ({ name, qty })).sort((a,b)=> b.qty - a.qty),
      operatorFails: Object.entries(operatorFails).map(([name, qty]) => ({ name, qty })).sort((a,b)=> b.qty - a.qty),
      motiveFails: Object.entries(motiveFails).map(([name, qty]) => ({ name, qty })).sort((a,b)=> b.qty - a.qty)
    };
  }, [incidents, sales, stock]);

  // Executive workloads
  const executiveStats = useMemo(() => {
    const stats: { [key: string]: { total: number; active: number; resolved: number } } = {};
    activeExecutives.forEach(exec => {
      stats[exec] = { total: 0, active: 0, resolved: 0 };
    });

    incidents.forEach(i => {
      const resp = i.responsable || 'Sin asignar';
      if (!stats[resp]) {
        stats[resp] = { total: 0, active: 0, resolved: 0 };
      }
      stats[resp].total += 1;
      if (i.estado === IncidentStatus.RESUELTO || i.estado === IncidentStatus.CERRADO) {
        stats[resp].resolved += 1;
      } else {
        stats[resp].active += 1;
      }
    });

    return Object.entries(stats).map(([name, data]) => ({ name, ...data }));
  }, [incidents, activeExecutives]);

  // --- PDF BUILDER FOR ENHANCED COMPENSATIONS ---
  const downloadPDFEnhanced = (coupon: Coupon) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      buildPDF(coupon, img);
    };
    img.onerror = () => {
      buildPDF(coupon, null);
    };
    img.src = LOGO_URL;
  };

  const buildPDF = (coupon: Coupon, img: HTMLImageElement | null) => {
    const doc = new jsPDF('p', 'mm', [100, 150]);

    // Slate Background
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 100, 150, 'F');

    // Container
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(6, 6, 88, 138, 4, 4, 'F');

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(6, 6, 88, 138, 4, 4, 'D');

    // Notches
    doc.setFillColor(248, 250, 252);
    doc.circle(6, 110, 4, 'F');
    doc.circle(94, 110, 4, 'F');

    // Header Logo
    if (img) {
      doc.addImage(img, 'PNG', 38, 12, 24, 15);
    } else {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(220, 38, 38);
      doc.text("EMF", 50, 20, { align: 'center' });
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("EL MUNDO DEL FARDO", 50, 25, { align: 'center' });
    }

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("CUPÓN DE COMPENSACIÓN", 50, 34, { align: 'center' });

    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(1);
    doc.line(15, 38, 85, 38);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("CÓDIGO DEL CUPÓN", 50, 44, { align: 'center' });

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(220, 38, 38);
    doc.text(coupon.code, 50, 51, { align: 'center' });

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("CLIENTE:", 15, 60);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(coupon.customerName || "Cliente General", 35, 60);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("EMISIÓN:", 15, 67);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(new Date(coupon.createdAt || Date.now()).toLocaleDateString('es-CL'), 35, 67);

    doc.setFont("Helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("VALIDEZ:", 15, 74);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    const validStr = new Date(coupon.validUntil).toLocaleDateString('es-CL');
    doc.text(validStr, 35, 74);

    doc.setFillColor(16, 185, 129);
    doc.roundedRect(15, 80, 70, 18, 2, 2, 'F');

    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "normal");
    doc.text("VALOR DE COMPENSACIÓN", 50, 85, { align: 'center' });

    doc.setFontSize(15);
    doc.setFont("Helvetica", "bold");
    doc.text(`CLP $${coupon.value.toLocaleString('es-CL')}`, 50, 93, { align: 'center' });

    if (coupon.authorizedBy) {
      doc.setFontSize(7.5);
      doc.setTextColor(13, 148, 136);
      doc.setFont("Helvetica", "bold");
      doc.text(`Canje Autorizado por Admin: ${coupon.authorizedBy}`, 50, 103, { align: 'center' });
    } else {
      doc.setDrawColor(203, 213, 225);
      doc.setLineDashPattern([1.5, 1.5], 0);
      doc.line(10, 110, 90, 110);
      doc.setLineDashPattern([], 0);
    }

    doc.setFillColor(15, 23, 42);
    const startX = 22;
    const barcodeY = 116;
    const barcodeHeight = 12;
    const barcodeLines = [1, 2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 1, 3, 1, 2, 2, 4, 1, 1, 3, 1, 2];
    let currentX = startX;
    barcodeLines.forEach((width) => {
      doc.rect(currentX, barcodeY, width * 0.8, barcodeHeight, 'F');
      currentX += width * 0.8 + 0.9;
    });

    doc.setFont("Helvetica", "bolditalic");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`¡Gracias por preferir El Mundo del Fardo!`, 50, 135, { align: 'center' });

    doc.save(`cupon_${coupon.code}.pdf`);
  };

  // Legacy compatibility generation
  const handleGenerateLegacy = () => {
    if (!amount || !customerName) return;
    addCoupon({
      code: 'CP-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      value: parseInt(amount),
      validUntil: new Date(Date.now() + parseInt(validDays) * 24 * 60 * 60 * 1000).toISOString(),
      used: false,
      customerName: customerName
    });
    setAmount('');
    setCustomerName('');
    alert("Cupón de compensación creado correctamente.");
  };

  // Status visual color maps
  const getStatusBadgeStyles = (status: IncidentStatus) => {
    switch (status) {
      case IncidentStatus.NUEVO:
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case IncidentStatus.EN_REVISION:
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case IncidentStatus.ESPERANDO_CLIENTE:
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case IncidentStatus.ESPERANDO_APROBACION:
        return 'bg-orange-50 text-orange-800 border-orange-200';
      case IncidentStatus.RESUELTO:
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case IncidentStatus.CERRADO:
        return 'bg-slate-50 text-slate-800 border-slate-200';
      case IncidentStatus.ESCALADO:
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getPriorityBadgeStyles = (priority: IncidentPriority) => {
    switch (priority) {
      case IncidentPriority.BAJA:
        return 'bg-slate-50 text-slate-600 border-slate-100';
      case IncidentPriority.MEDIA:
        return 'bg-sky-50 text-sky-700 border-sky-100';
      case IncidentPriority.ALTA:
        return 'bg-orange-50 text-orange-700 border-orange-100';
      case IncidentPriority.CRITICA:
        return 'bg-red-50 text-red-700 border-red-200 font-extrabold animate-pulse';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Banner & Tab Nav */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="text-slate-800" size={24} />
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Cuaderno MDF</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-slate-900 flex items-center gap-3">
            Gestión de Postventa
          </h1>
          <p className="text-slate-500 text-xs">Gestión y control de casos pendientes de WhatsApp, reclamos por lote y emisión de compensaciones.</p>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 self-stretch md:self-auto">
          <button 
            onClick={() => { setActiveTab('casos'); setSelectedIncident(null); }}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition-all flex items-center justify-center gap-1.5 ${activeTab === 'casos' ? 'bg-white text-slate-900 shadow-sm border border-slate-100/50' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <MessageSquare size={14} /> Casos
          </button>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition-all flex items-center justify-center gap-1.5 ${activeTab === 'dashboard' ? 'bg-white text-slate-900 shadow-sm border border-slate-100/50' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <TrendingUp size={14} /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('cupones')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition-all flex items-center justify-center gap-1.5 ${activeTab === 'cupones' ? 'bg-white text-slate-900 shadow-sm border border-slate-100/50' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Ticket size={14} /> Cupones
          </button>
        </div>
      </div>

      {/* --- SECTION 1: INCIDENTS MODULE --- */}
      {activeTab === 'casos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Incidents Master List Column (LHS) */}
          <div className={`${selectedIncident ? 'lg:col-span-7' : 'lg:col-span-12'} bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-200`}>
            
            {/* Table Controls */}
            <div className="p-6 border-b border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="font-extrabold text-lg text-slate-800">Casos Registrados</h2>
                  <p className="text-xs text-slate-500">Asigne ejecutivos responsables para asegurar que nunca se dupliquen las respuestas.</p>
                </div>
                <button 
                  onClick={() => setIsNewCaseModalOpen(true)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all self-stretch sm:self-auto justify-center"
                >
                  <Plus size={15} /> Nuevo Caso
                </button>
              </div>

              {/* Advanced filter matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input 
                    type="text" 
                    placeholder="Buscar cliente, PV o motivo..." 
                    value={searchTermIncidents}
                    onChange={e => setSearchTermIncidents(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs w-full focus:ring-2 focus:ring-slate-500/10 focus:border-slate-500 focus:bg-white transition-all outline-none"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-xl px-2">
                  <Filter size={11} className="text-slate-400 shrink-0" />
                  <select 
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="py-2 bg-transparent text-xs w-full appearance-none outline-none font-semibold text-slate-600 cursor-pointer"
                  >
                    <option value="todos">Estado: Todos</option>
                    {Object.values(IncidentStatus).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-xl px-2">
                  <AlertTriangle size={11} className="text-slate-400 shrink-0" />
                  <select 
                    value={priorityFilter}
                    onChange={e => setPriorityFilter(e.target.value)}
                    className="py-2 bg-transparent text-xs w-full appearance-none outline-none font-semibold text-slate-600 cursor-pointer"
                  >
                    <option value="todos">Prioridad: Todos</option>
                    {Object.values(IncidentPriority).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-xl px-2">
                  <User size={11} className="text-slate-400 shrink-0" />
                  <select 
                    value={executiveFilter}
                    onChange={e => setExecutiveFilter(e.target.value)}
                    className="py-2 bg-transparent text-xs w-full appearance-none outline-none font-semibold text-slate-600 cursor-pointer"
                  >
                    <option value="todos">Responsable: Todos</option>
                    {activeExecutives.map(exec => (
                      <option key={exec} value={exec}>{exec}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Incidents Table / Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="p-4 uppercase text-[9px] font-bold text-slate-400 tracking-wider">Código</th>
                    <th className="p-4 uppercase text-[9px] font-bold text-slate-400 tracking-wider">Cliente</th>
                    <th className="p-4 uppercase text-[9px] font-bold text-slate-400 tracking-wider">MDF Venta</th>
                    <th className="p-4 uppercase text-[9px] font-bold text-slate-400 tracking-wider">Canal</th>
                    <th className="p-4 uppercase text-[9px] font-bold text-slate-400 tracking-wider">Motivo</th>
                    <th className="p-4 uppercase text-[9px] font-bold text-slate-400 tracking-wider">Responsable</th>
                    <th className="p-4 uppercase text-[9px] font-bold text-slate-400 tracking-wider">Estado / Prioridad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredIncidents.length > 0 ? (
                    filteredIncidents.map(inc => {
                      const isFocused = selectedIncident?.id === inc.id;
                      return (
                        <tr 
                          key={inc.id} 
                          onClick={() => setSelectedIncident(inc)}
                          className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${isFocused ? 'bg-slate-50/80 font-medium border-l-4 border-slate-900' : ''}`}
                        >
                          <td className="p-4">
                            <span className="font-mono font-bold text-slate-700 tracking-wider text-xs block">
                              {inc.codigoCaso}
                            </span>
                            <span className="text-[9px] text-slate-400 block mt-0.5">
                              {new Date(inc.createdAt).toLocaleDateString('es-CL')}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="text-slate-800 text-xs font-semibold">{inc.cliente}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone size={10} /> {inc.telefono}
                            </div>
                          </td>
                          <td className="p-4 text-xs font-mono font-bold text-slate-600">
                            {inc.numeroVenta ? `V-${inc.numeroVenta}` : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="p-4 text-xs text-slate-600">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-medium">
                              {inc.canal}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="text-xs text-slate-800 line-clamp-1 font-medium">{inc.motivo}</div>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-bold bg-slate-50 border border-slate-100 px-2 py-1 rounded-xl">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              {inc.responsable || 'Sin asignar'}
                            </span>
                          </td>
                          <td className="p-4 space-y-1">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getStatusBadgeStyles(inc.estado)}`}>
                              {inc.estado}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${getPriorityBadgeStyles(inc.prioridad)}`}>
                                {inc.prioridad}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-400 italic text-xs">
                        No se encontraron casos con los filtros seleccionados. Presione "Nuevo Caso" para ingresar uno.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Incident Detail Column Panel (RHS - Displays when a case is clicked) */}
          {selectedIncident && (
            <div className="lg:col-span-5 space-y-6 animate-in slide-in-from-right duration-200">
              
              {/* Card Container */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                
                {/* Header detail */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-slate-800 text-base">{selectedIncident.codigoCaso}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getStatusBadgeStyles(selectedIncident.estado)}`}>
                        {selectedIncident.estado}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Creado el {new Date(selectedIncident.createdAt).toLocaleString('es-CL')}
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedIncident(null)}
                    className="p-1.5 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-600 shadow-sm"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Sub-body Details */}
                <div className="p-6 space-y-6">

                  {/* Case parameters edit matrix */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estado</label>
                      <select 
                        value={selectedIncident.estado}
                        onChange={e => handleStatusChange(selectedIncident.id, e.target.value as IncidentStatus)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-slate-500 cursor-pointer"
                      >
                        {Object.values(IncidentStatus).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Responsable</label>
                      <select 
                        value={selectedIncident.responsable}
                        onChange={e => handleAssigneeChange(selectedIncident.id, e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-slate-500 cursor-pointer"
                      >
                        {activeExecutives.map(exec => (
                          <option key={exec} value={exec}>{exec}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Customer Information Card */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Ficha de Reclamo</h3>
                    
                    <div className="space-y-2.5 text-xs text-slate-600 bg-white p-4 rounded-2xl border border-slate-100">
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="font-semibold text-slate-400">Cliente:</span>
                        <span className="font-bold text-slate-800">{selectedIncident.cliente}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="font-semibold text-slate-400">Teléfono:</span>
                        <span className="font-bold text-slate-800">{selectedIncident.telefono}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="font-semibold text-slate-400">Canal de Entrada:</span>
                        <span className="font-bold text-slate-800">{selectedIncident.canal}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="font-semibold text-slate-400">Motivo del Reclamo:</span>
                        <span className="font-bold text-slate-800">{selectedIncident.motivo}</span>
                      </div>
                      {selectedIncident.observaciones && (
                        <div className="pt-2">
                          <span className="font-semibold text-slate-400 block pb-1">Observaciones Iniciales:</span>
                          <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-600 leading-relaxed text-[11px] italic">
                            "{selectedIncident.observaciones}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Root-Cause Strategic Tracking (Linked Sale Products & Operator logs) */}
                  {selectedIncident.numeroVenta && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Venta Vinculada ({`V-${selectedIncident.numeroVenta}`})</h3>
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">Rastreo de Fallas</span>
                      </div>

                      {getLinkedSaleDetails(selectedIncident.numeroVenta) ? (
                        (() => {
                          const details = getLinkedSaleDetails(selectedIncident.numeroVenta)!;
                          return (
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs space-y-3">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-0.5">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Vendedor</span>
                                  <span className="font-bold text-slate-700">{details.vendedor}</span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Etiquetador (Operador)</span>
                                  <span className="font-bold text-slate-700 bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-100 w-fit block">
                                    {details.etiquetador}
                                  </span>
                                </div>
                              </div>

                              <div className="border-t border-slate-200/50 pt-2.5">
                                <span className="text-[10px] text-slate-400 font-bold uppercase block pb-1">Productos de la Venta (Fardos/Lotes)</span>
                                <div className="space-y-1.5">
                                  {details.products.map((p, index) => (
                                    <div key={index} className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-100">
                                      <div>
                                        <p className="font-bold text-slate-800">{p.type}</p>
                                        <p className="font-mono text-[9px] text-slate-400">{p.code}</p>
                                      </div>
                                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded border">
                                        Proveedor: <strong className="text-slate-700">{p.provider}</strong>
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center text-slate-400 italic text-[11px]">
                          La venta {selectedIncident.numeroVenta} está registrada pero no se encontraron detalles completos de stock.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Compensation & Coupon Generation Interface */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Integración de Compensación</h3>
                    
                    {selectedIncident.couponCode ? (
                      // Display associated Coupon
                      (() => {
                        const cop = coupons.find(c => c.code === selectedIncident.couponCode);
                        return (
                          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-4 rounded-2xl border border-emerald-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-1">
                                <Ticket size={12} /> Cupón Emitido
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-lg font-black text-slate-800 tracking-wider">
                                  {selectedIncident.couponCode}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${cop?.used ? 'bg-slate-100 text-slate-400' : 'bg-emerald-500 text-white'}`}>
                                  {cop?.used ? 'Canjeado' : 'Disponible'}
                                </span>
                              </div>
                              <p className="font-bold text-emerald-800 text-sm">
                                Monto: ${selectedIncident.couponValue?.toLocaleString('es-CL')}
                              </p>
                            </div>

                            <div className="flex gap-2 w-full md:w-auto self-end md:self-auto">
                              <button 
                                onClick={() => handleCopyCode(selectedIncident.couponCode!)}
                                className="flex-1 md:flex-none p-2 bg-white hover:bg-slate-50 text-slate-600 rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 font-bold text-[10px] active:scale-95 transition-all"
                              >
                                {copiedCodeCode === selectedIncident.couponCode ? <Check size={12} className="text-emerald-500" /> : <Clipboard size={12} />}
                                Copiar
                              </button>
                              {cop && (
                                <button 
                                  onClick={() => downloadPDFEnhanced(cop)}
                                  className="flex-1 md:flex-none p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center justify-center gap-1.5 font-bold text-[10px] active:scale-95 transition-all"
                                >
                                  <Download size={12} /> PDF
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      // Form to Issue compensation coupon instantly
                      <div className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-2xl space-y-4">
                        <p className="text-[11px] text-slate-500">¿Desea autorizar una compensación económica para este cliente? Se generará un cupón y se enlazará automáticamente a este caso.</p>
                        
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 block uppercase">Monto CLP ($)</label>
                            <input 
                              type="number" 
                              placeholder="Ej. 10000" 
                              value={compAmount}
                              onChange={e => setCompAmount(e.target.value)}
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 block uppercase">Validez (Días)</label>
                            <input 
                              type="number" 
                              value={compDays}
                              onChange={e => setCompDays(e.target.value)}
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        <button 
                          onClick={() => handleGenerateCompensationInCase(selectedIncident)}
                          disabled={!compAmount}
                          className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.99] transition-all shadow-sm"
                        >
                          <Plus size={14} /> Emitir Cupón de Compensación
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Internal Comments / Notes Feed */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare size={13} className="text-slate-400" />
                      Comentarios Internos
                    </h3>

                    {/* Feed */}
                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {selectedIncident.comments && selectedIncident.comments.length > 0 ? (
                        selectedIncident.comments.map(comm => (
                          <div key={comm.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mb-1">
                              <span>{comm.user}</span>
                              <span>{new Date(comm.timestamp).toLocaleString('es-CL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
                            </div>
                            <p className="text-slate-700 leading-normal">{comm.text}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-slate-400 italic text-[11px] py-2">No hay comentarios en este caso. Ingrese una nota interna abajo para que otros ejecutivos la vean.</p>
                      )}
                    </div>

                    {/* Input comment */}
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Escriba un comentario o nota interna..." 
                        value={newCommentText}
                        onChange={e => setNewCommentText(e.target.value)}
                        onKeyDown={e => { if(e.key === 'Enter') handleAddComment(selectedIncident.id); }}
                        className="flex-1 p-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-500 focus:bg-white transition-all"
                      />
                      <button 
                        onClick={() => handleAddComment(selectedIncident.id)}
                        className="p-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-all"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Attachment Management with Drag & Drop Hooks */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Archivos de Evidencia</h3>

                    {/* Upload layout */}
                    <div 
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        e.preventDefault();
                        if (e.dataTransfer.files.length > 0) {
                          setMockAttachmentName(e.dataTransfer.files[0].name);
                        }
                      }}
                      className="border-2 border-dashed border-slate-200 p-4 rounded-2xl text-center hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip size={20} className="text-slate-400 mx-auto mb-1.5" />
                      <p className="text-[10px] font-bold text-slate-500">Arrastre archivos aquí o haga clic para subir</p>
                      <p className="text-[8px] text-slate-400 mt-0.5">Capturas de WhatsApp, boletas o fotos de prendas (Max. 5MB)</p>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={() => {
                          if (fileInputRef.current?.files?.[0]) {
                            setMockAttachmentName(fileInputRef.current.files[0].name);
                          }
                        }}
                        className="hidden" 
                      />
                    </div>

                    {/* Pending file queue list */}
                    {mockAttachmentName && (
                      <div className="bg-slate-50 p-2 px-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5">
                          <FileText size={14} className="text-slate-400" />
                          <span className="font-medium text-slate-700 truncate max-w-[200px]">{mockAttachmentName}</span>
                        </div>
                        <button 
                          onClick={() => handleAddAttachment(selectedIncident.id)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[10px] uppercase"
                        >
                          Adjuntar
                        </button>
                      </div>
                    )}

                    {/* Existing Attachments list */}
                    <div className="flex flex-wrap gap-2">
                      {selectedIncident.attachments && selectedIncident.attachments.length > 0 ? (
                        selectedIncident.attachments.map((at, idx) => (
                          <a 
                            key={idx} 
                            href={at.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 border rounded-xl text-[10px] font-bold text-slate-600 transition-colors max-w-[150px] truncate"
                          >
                            <FileText size={12} className="text-slate-400" />
                            <span className="truncate">{at.name}</span>
                          </a>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">No hay archivos adjuntos en este caso.</p>
                      )}
                    </div>
                  </div>

                  {/* History / Action Logs Timeline */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Historial y Auditoría</h3>
                    
                    <div className="relative pl-4 border-l border-slate-200 space-y-4 text-xs">
                      {selectedIncident.history && selectedIncident.history.length > 0 ? (
                        selectedIncident.history.map((hist, index) => (
                          <div key={index} className="relative">
                            <span className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-white"></span>
                            <div className="space-y-0.5">
                              <p className="text-slate-700 leading-normal">
                                {hist.description}
                              </p>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-semibold">
                                <span>{hist.user}</span>
                                <span>•</span>
                                <span>{new Date(hist.timestamp).toLocaleString('es-CL')}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400 italic text-[11px]">No hay logs registrados para este caso.</p>
                      )}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* --- SECTION 2: ROOT-CAUSE TRENDS & KPIs --- */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* Top KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-slate-50 text-slate-800 rounded-2xl border">
                <MessageSquare size={22} />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Casos Totales</p>
                <p className="text-xl font-black text-slate-800">{kpis.total}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                <Clock size={22} />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Casos Activos</p>
                <p className="text-xl font-black text-slate-800">{kpis.active}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                <CheckCircle size={22} />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resueltos (Este Mes)</p>
                <p className="text-xl font-black text-slate-800">{kpis.resolvedThisMonth}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl border border-teal-100">
                <Ticket size={22} />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Compensaciones</p>
                <p className="text-xl font-black text-slate-800">${kpis.compensations.toLocaleString('es-CL')}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Executive Activity & workloads */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                <Users size={18} className="text-slate-500" />
                <h2 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Carga de Trabajo por Ejecutivo</h2>
              </div>

              <div className="space-y-4">
                {executiveStats.map(exec => {
                  const pct = exec.total > 0 ? Math.round((exec.resolved / exec.total) * 100) : 0;
                  return (
                    <div key={exec.name} className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">{exec.name}</span>
                        <span className="text-slate-500 font-medium">
                          <strong>{exec.active} activos</strong> / {exec.resolved} resueltos ({pct}% de efectividad)
                        </span>
                      </div>
                      
                      {/* Bar indicator */}
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                        <div 
                          className="bg-emerald-500 h-full" 
                          style={{ width: `${pct}%` }}
                        />
                        <div 
                          className="bg-amber-500 h-full" 
                          style={{ width: `${100 - pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Most frequent reasons */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                <AlertCircle size={18} className="text-slate-500" />
                <h2 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Motivos Frecuentes de Reclamos</h2>
              </div>

              <div className="space-y-4">
                {kpis.motiveFails.length > 0 ? (
                  kpis.motiveFails.map(mot => {
                    const pct = kpis.total > 0 ? Math.round((mot.qty / kpis.total) * 100) : 0;
                    return (
                      <div key={mot.name} className="space-y-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-700">{mot.name}</span>
                          <span className="text-slate-500 font-bold">{mot.qty} casos ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-slate-800 h-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 italic">No hay datos suficientes de motivos.</p>
                )}
              </div>
            </div>

          </div>

          {/* Root-cause correlations (Suppliers and Operators) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Suppliers (Proveedores) fault analysis */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                <Building2 size={18} className="text-slate-500" />
                <div>
                  <h2 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Proveedores con más Reclamos</h2>
                  <p className="text-[10px] text-slate-400">Identifique qué fardos están fallando más para cobrarles.</p>
                </div>
              </div>

              <div className="space-y-3.5">
                {kpis.supplierFails.length > 0 ? (
                  kpis.supplierFails.map((sup, idx) => (
                    <div key={sup.name} className="flex justify-between items-center text-xs p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-800">{sup.name}</span>
                      </div>
                      <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-xl font-black border border-red-100 text-[10px]">
                        {sup.qty} Reclamos
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-4">Fardos en perfecto estado, sin reclamos registrados.</p>
                )}
              </div>
            </div>

            {/* Operators (Etiquetadores) fault analysis */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                <Users size={18} className="text-slate-500" />
                <div>
                  <h2 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Etiquetadores con más Incidencias</h2>
                  <p className="text-[10px] text-slate-400">Monitoree la calidad de armado del equipo de empaque.</p>
                </div>
              </div>

              <div className="space-y-3.5">
                {kpis.operatorFails.length > 0 ? (
                  kpis.operatorFails.map((op, idx) => (
                    <div key={op.name} className="flex justify-between items-center text-xs p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-800">{op.name}</span>
                      </div>
                      <span className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded-xl font-black border border-amber-100 text-[10px]">
                        {op.qty} Incidentes
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-4">No hay operadores vinculados a incidentes.</p>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* --- SECTION 3: LEGACY COUPON MODULE --- */}
      {activeTab === 'cupones' && (
        <div className="space-y-6">
          
          {/* Legacy generation panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl border border-emerald-100">
                  <Plus size={18} />
                </div>
                <h2 className="font-bold text-base text-slate-800">Nueva Compensación Directa</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase">Nombre del Cliente</label>
                  <input 
                    type="text" 
                    placeholder="Ej. María González" 
                    value={customerName} 
                    onChange={e => setCustomerName(e.target.value)} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-slate-400 focus:bg-white"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase">Monto CLP ($)</label>
                  <input 
                    type="number" 
                    placeholder="Ej. 15000" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase">Días de Validez</label>
                  <input 
                    type="number" 
                    value={validDays} 
                    onChange={e => setValidDays(e.target.value)} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-slate-400 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button 
                  onClick={handleGenerateLegacy}
                  disabled={!amount || !customerName}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Plus size={15} /> Generar Cupón
                </button>
              </div>
            </div>

            {/* Quick redeem stub */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                  <div className="p-2 bg-amber-50 text-amber-500 rounded-xl border border-amber-100">
                    <Ticket size={18} />
                  </div>
                  <h2 className="font-bold text-base text-slate-800">Canje Rápido de Cupón</h2>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Ingrese el código impreso en el ticket (CP-XXXXXX) para realizar auditorías o canjes.</p>
              </div>

              <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="CP-K6HJ2S" 
                  value={redeemCode} 
                  onChange={e => setRedeemCode(e.target.value)} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-center font-mono font-bold tracking-widest focus:border-slate-400 focus:bg-white transition-all uppercase placeholder:normal-case placeholder:font-sans placeholder:tracking-normal outline-none"
                />
                
                <button 
                  onClick={handleRedeemByCode} 
                  disabled={!redeemCode}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  Canjear Cupón
                </button>
              </div>
            </div>

          </div>

          {/* Table history */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="font-bold text-base text-slate-800">Historial de Cupones Emitidos</h2>
                <p className="text-xs text-slate-400">Visualiza, audita y administra las compensaciones activas y canjeadas.</p>
              </div>
              
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative flex-grow sm:flex-grow-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input 
                    type="text" 
                    placeholder="Buscar cliente o código..." 
                    value={searchTermCoupons}
                    onChange={e => setSearchTermCoupons(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-slate-50 border border-transparent rounded-xl text-xs w-full sm:w-64 focus:bg-white focus:border-slate-200 transition-all outline-none"
                  />
                </div>
                
                <select 
                  value={sortOrderCoupons}
                  onChange={e => setSortOrderCoupons(e.target.value as any)}
                  className="px-3 py-2 bg-slate-50 border border-transparent rounded-xl text-xs font-semibold text-slate-600 focus:bg-white transition-all outline-none cursor-pointer"
                >
                  <option value="newest">Más recientes</option>
                  <option value="oldest">Más antiguos</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="p-4 uppercase text-[9px] font-bold text-slate-400 tracking-wider">Fecha</th>
                    <th className="p-4 uppercase text-[9px] font-bold text-slate-400 tracking-wider">Código</th>
                    <th className="p-4 uppercase text-[9px] font-bold text-slate-400 tracking-wider">Cliente</th>
                    <th className="p-4 uppercase text-[9px] font-bold text-slate-400 tracking-wider">Valor</th>
                    <th className="p-4 uppercase text-[9px] font-bold text-slate-400 tracking-wider">Vence el</th>
                    <th className="p-4 uppercase text-[9px] font-bold text-slate-400 tracking-wider">Estado</th>
                    <th className="p-4 uppercase text-[9px] font-bold text-slate-400 tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {filteredAndSortedCoupons.length > 0 ? (
                    filteredAndSortedCoupons.map(c => {
                      const expired = isExpired(c);
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 text-slate-500 font-medium">
                            {new Date(c.createdAt || "").toLocaleDateString('es-CL')}
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-700 tracking-wider">{c.code}</td>
                          <td className="p-4 text-slate-600 font-medium">{c.customerName || "Cliente General"}</td>
                          <td className="p-4 font-black text-emerald-600">
                            ${c.value?.toLocaleString('es-CL')}
                          </td>
                          <td className="p-4">
                            <span className={expired && !c.used ? 'text-red-500 font-bold' : 'text-slate-500 font-medium'}>
                              {new Date(c.validUntil).toLocaleDateString('es-CL')}
                            </span>
                          </td>
                          <td className="p-4">
                            {c.used ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-slate-100 text-slate-400">
                                  Canjeado
                                </span>
                                {c.authorizedBy && (
                                  <span className="text-[9px] text-teal-600 font-bold block mt-0.5">
                                    Autorizado por: {c.authorizedBy}
                                  </span>
                                )}
                              </div>
                            ) : expired ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-red-100 text-red-600 border border-red-200">
                                <ShieldAlert size={10} /> Expirado
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-100 text-emerald-600 border border-emerald-200">
                                Disponible
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex gap-1 justify-end items-center">
                              <button 
                                onClick={() => setSelectedPreviewCoupon(c)} 
                                className="p-2 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors"
                                title="Previsualizar"
                              >
                                <Eye size={15}/>
                              </button>
                              
                              <button 
                                onClick={() => downloadPDFEnhanced(c)} 
                                className="p-2 hover:bg-slate-100 text-emerald-500 rounded-xl transition-colors"
                                title="Descargar PDF"
                              >
                                <Download size={15}/>
                              </button>
                              
                              {!c.used && (
                                <button 
                                  onClick={() => handleRedeem(c)} 
                                  className={`ml-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                    expired 
                                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200' 
                                      : 'bg-emerald-500 hover:bg-emerald-600 text-white border-transparent shadow-sm'
                                  }`}
                                >
                                  Canjear
                                </button>
                              )}
                              
                              {isAdmin && (
                                <button 
                                  onClick={() => {
                                    if(confirm("¿Estás seguro de eliminar permanentemente este cupón?")) deleteCoupon(c.id);
                                  }} 
                                  className="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-xl transition-colors ml-1"
                                >
                                  <AlertCircle size={15}/>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                        No se encontraron cupones registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* --- FORM MODAL: CREATE NEW CASE SHEET --- */}
      {isNewCaseModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form 
            onSubmit={handleCreateIncident}
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xl max-w-lg w-full space-y-6 animate-in zoom-in-95 duration-150"
          >
            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-slate-100 text-slate-800 rounded-2xl border">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Nuevo Caso de Postventa</h3>
                  <p className="text-xs text-slate-400">Ingrese los datos para catalogar y asignar el incidente.</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsNewCaseModalOpen(false)}
                className="p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              
              {/* Linked sale with autofill hook */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Número de Venta (MDF)</label>
                <input 
                  type="text" 
                  placeholder="Ej. 2004 (Opcional)" 
                  value={newCaseForm.numeroVenta}
                  onChange={e => {
                    const val = e.target.value;
                    setNewCaseForm(prev => ({ ...prev, numeroVenta: val }));
                    autoFillFromSale(val);
                  }}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-slate-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Responsable (Asignado)</label>
                <select 
                  value={newCaseForm.responsable}
                  onChange={e => setNewCaseForm(prev => ({ ...prev, responsable: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 cursor-pointer"
                >
                  {activeExecutives.map(exec => (
                    <option key={exec} value={exec}>{exec}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nombre del Cliente *</label>
                <input 
                  type="text" 
                  placeholder="Ej. María Pérez" 
                  required
                  value={newCaseForm.cliente}
                  onChange={e => setNewCaseForm(prev => ({ ...prev, cliente: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-slate-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Teléfono / Celular *</label>
                <input 
                  type="text" 
                  placeholder="Ej. +56912345678" 
                  required
                  value={newCaseForm.telefono}
                  onChange={e => setNewCaseForm(prev => ({ ...prev, telefono: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-slate-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Canal de Entrada</label>
                <select 
                  value={newCaseForm.canal}
                  onChange={e => setNewCaseForm(prev => ({ ...prev, canal: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold cursor-pointer"
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Llamada">Llamada</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Motivo del Reclamo</label>
                <select 
                  value={newCaseForm.motivo}
                  onChange={e => setNewCaseForm(prev => ({ ...prev, motivo: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold cursor-pointer"
                >
                  <option value="Fardo incompleto">Fardo incompleto</option>
                  <option value="Lote defectuoso">Lote defectuoso</option>
                  <option value="Demora de despacho">Demora de despacho</option>
                  <option value="Prenda dañada">Prenda dañada</option>
                  <option value="Error de cobro">Error de cobro</option>
                  <option value="Error de etiquetado">Error de etiquetado</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Prioridad Inicial</label>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {Object.values(IncidentPriority).map(p => (
                    <button 
                      type="button"
                      key={p}
                      onClick={() => setNewCaseForm(prev => ({ ...prev, prioridad: p }))}
                      className={`p-2 rounded-xl text-[10px] font-bold border transition-all ${newCaseForm.prioridad === p ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Observaciones y Detalles</label>
                <textarea 
                  rows={3}
                  placeholder="Describa el reclamo del cliente de forma precisa..." 
                  value={newCaseForm.observaciones}
                  onChange={e => setNewCaseForm(prev => ({ ...prev, observaciones: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-slate-500 resize-none"
                />
              </div>

            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setIsNewCaseModalOpen(false)}
                className="flex-1 py-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-2xl text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              
              <button 
                type="submit"
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold uppercase tracking-wider shadow-sm"
              >
                Abrir Caso
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL: STUNNING INTERACTIVE VISUAL COUPON PREVIEW --- */}
      {selectedPreviewCoupon && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-3 border border-slate-100 max-w-2xl w-full animate-in fade-in duration-200">
            
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 w-6 h-6 rounded-full bg-slate-950 z-10 hidden md:block"></div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 w-6 h-6 rounded-full bg-slate-950 z-10 hidden md:block"></div>

            {/* Ticket body */}
            <div className="md:col-span-2 p-8 space-y-6 flex flex-col justify-between">
              
              <button 
                onClick={() => setSelectedPreviewCoupon(null)}
                className="absolute top-4 left-4 p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3">
                  <img 
                    src={LOGO_URL} 
                    alt="Logo" 
                    referrerPolicy="no-referrer"
                    className="h-10 object-contain"
                    onError={(e) => {
                      (e.target as any).style.display = 'none';
                    }}
                  />
                  <div>
                    <h3 className="font-black text-slate-800 tracking-tight text-sm">EL MUNDO DEL FARDO</h3>
                    <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Post-Venta Compensaciones</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Cupón de Compensación</p>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-2xl font-black text-slate-800 tracking-wider">
                      {selectedPreviewCoupon.code}
                    </span>
                    <button 
                      onClick={() => handleCopyCode(selectedPreviewCoupon.code)}
                      className="p-1 px-2 text-slate-400 hover:text-emerald-500 bg-slate-50 hover:bg-emerald-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      {copiedCodeCode === selectedPreviewCoupon.code ? <Check size={12} className="text-emerald-500" /> : <Clipboard size={12} />}
                      {copiedCodeCode === selectedPreviewCoupon.code ? '¡Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Cliente</p>
                    <p className="font-bold text-slate-700 mt-0.5">{selectedPreviewCoupon.customerName || "Cliente General"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Emisión</p>
                    <p className="font-bold text-slate-700 mt-0.5">{new Date(selectedPreviewCoupon.createdAt || Date.now()).toLocaleDateString('es-CL')}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button 
                  onClick={() => downloadPDFEnhanced(selectedPreviewCoupon)}
                  className="flex-1 py-2.5 px-4 bg-slate-900 border border-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 text-xs shadow hover:bg-slate-800 active:scale-95 transition-all"
                >
                  <Download size={14} /> Descargar PDF
                </button>
                
                {!selectedPreviewCoupon.used && (
                  <button 
                    onClick={() => handleRedeem(selectedPreviewCoupon)}
                    className="flex-1 py-2.5 px-4 bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 text-xs shadow shadow-emerald-500/10 hover:bg-emerald-600 active:scale-95 transition-all"
                  >
                    Canjear Ahora
                  </button>
                )}
              </div>
            </div>

            {/* Ticket stub */}
            <div className="md:col-span-1 p-8 bg-slate-50 flex flex-col justify-between items-center text-center relative border-t md:border-t-0 md:border-l border-dashed border-slate-200">
              
              <div className="space-y-4 w-full">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">Valor Cupón</p>
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-600">CLP</p>
                  <p className="text-xl font-black text-emerald-700">${selectedPreviewCoupon.value.toLocaleString('es-CL')}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Vencimiento</p>
                  <p className="text-xs font-bold text-slate-700">{new Date(selectedPreviewCoupon.validUntil).toLocaleDateString('es-CL')}</p>
                </div>

                <div className="pt-2">
                  {selectedPreviewCoupon.used ? (
                    <div className="flex flex-col items-center justify-center">
                      <CheckCircle2 className="text-slate-400 mb-1" size={20} />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Canjeado</span>
                      {selectedPreviewCoupon.authorizedBy && (
                        <p className="text-[9px] text-teal-600 font-bold mt-1 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                          Autorizado por:<br />{selectedPreviewCoupon.authorizedBy}
                        </p>
                      )}
                    </div>
                  ) : isExpired(selectedPreviewCoupon) ? (
                    <div className="flex flex-col items-center justify-center bg-red-50 p-2.5 rounded-2xl border border-red-100">
                      <ShieldAlert className="text-red-500 mb-1 animate-pulse" size={20} />
                      <span className="text-[10px] font-bold text-red-600 uppercase">Expirado</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center bg-emerald-50/50 p-2.5 rounded-2xl border border-emerald-100/30">
                      <CheckCircle2 className="text-emerald-500 mb-1" size={20} />
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">Válido</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Barcode */}
              <div className="w-full mt-4 space-y-1">
                <div className="flex gap-[1.5px] justify-center items-center h-10 w-full bg-white p-1.5 rounded border border-slate-200">
                  {[1, 2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 1, 3, 1, 2, 2, 4, 1, 1, 3, 1, 2].map((width, idx) => (
                    <div 
                      key={idx} 
                      className="bg-slate-900 h-7" 
                      style={{ width: `${width * 1.5}px` }}
                    />
                  ))}
                </div>
                <p className="text-[8px] font-mono text-slate-400 tracking-wider font-semibold uppercase">{selectedPreviewCoupon.code}</p>
              </div>

              <div className="absolute left-1/2 -bottom-3 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-950 z-10 block md:hidden"></div>
            </div>

          </div>
        </div>
      )}

      {/* --- SECURITY ACCESS CONTROL: ADMIN OVERRIDE PIN PASSWORD MODAL --- */}
      {authModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <form 
            onSubmit={handleAuthSubmit}
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xl max-w-sm w-full space-y-6 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
              <div className="p-2.5 bg-amber-50 text-amber-500 rounded-2xl">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Autorización Requerida</h3>
                <p className="text-xs text-slate-400 font-medium">El cupón {authModal.couponCode} ha expirado.</p>
              </div>
            </div>

            {authModal.error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs font-bold leading-relaxed rounded-2xl border border-red-100 flex items-start gap-2">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{authModal.error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Perfil de Administrador</label>
                <select 
                  value={authModal.selectedAdminId}
                  onChange={e => setAuthModal(prev => ({ ...prev, selectedAdminId: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 cursor-pointer"
                >
                  {admins.map(admin => (
                    <option key={admin.id} value={admin.id}>
                      {admin.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">PIN de Autorización</label>
                <input 
                  type="password" 
                  placeholder="••••" 
                  maxLength={4}
                  value={authModal.pin}
                  onChange={e => setAuthModal(prev => ({ ...prev, pin: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-center tracking-[1em] focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:tracking-normal placeholder:font-normal"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setAuthModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-2xl text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              
              <button 
                type="submit"
                disabled={authModal.pin.length < 4}
                className="flex-1 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold uppercase"
              >
                Autorizar
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
