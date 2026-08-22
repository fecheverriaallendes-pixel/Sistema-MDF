import React, { useState, useMemo } from 'react';
import {
  Coins,
  Calendar,
  User,
  PlusCircle,
  Printer,
  FileCheck,
  Building,
  CreditCard,
  Search,
  Filter,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  Handshake,
  Truck,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  Edit2,
  Copy,
  Users,
  Percent,
  Check,
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import {
  StaffMember,
  StaffRole,
  CommissionType,
  SalaryAdvance,
  EmployeeLoan,
  WorkExtra,
  WeeklyPayrollRecord
} from '../types';

import LiquidacionIndividualModal from '../components/sueldos/LiquidacionIndividualModal';
import NominaConsolidadaModal from '../components/sueldos/NominaConsolidadaModal';
import TransferListModal from '../components/sueldos/TransferListModal';
import AdelantoModal from '../components/sueldos/AdelantoModal';
import PrestamoModal from '../components/sueldos/PrestamoModal';
import TrabajoExtraModal from '../components/sueldos/TrabajoExtraModal';
import TrabajadorModal from '../components/sueldos/TrabajadorModal';

const DEFAULT_COMMISSION_VALUES: Record<string, number> = {
  [CommissionType.FARDO_NORMAL]: 3000,
  [CommissionType.FARDO_PROMO]: 1500,
  [CommissionType.MEDIO_FARDO]: 1500,
  [CommissionType.LOTE]: 1000,
};

type ActiveTab = 'liquidaciones' | 'adelantos' | 'prestamos' | 'extras' | 'personal' | 'historial';

export default function Sueldos() {
  const {
    sales,
    staff,
    addStaff,
    updateStaff,
    removeStaff,
    commissionValues,
    salaryAdvances,
    addSalaryAdvance,
    updateSalaryAdvance,
    deleteSalaryAdvance,
    employeeLoans,
    addEmployeeLoan,
    updateEmployeeLoan,
    deleteEmployeeLoan,
    addLoanPayment,
    workExtras,
    addWorkExtra,
    bulkAddWorkExtras,
    updateWorkExtra,
    deleteWorkExtra,
    payrollRecords,
    savePayrollRecord,
    updatePayrollRecord,
    deletePayrollRecord,
    adjustments,
    addAdjustment,
    removeAdjustment,
    playSound,
    stock
  } = useStore();

  const effectiveCommissionValues = commissionValues || DEFAULT_COMMISSION_VALUES;

  // Navigation & State
  const [activeTab, setActiveTab] = useState<ActiveTab>('liquidaciones');
  const [selectedWeekOffset, setSelectedWeekOffset] = useState<number>(0);
  const [roleFilter, setRoleFilter] = useState<string>('TODOS');
  const [searchWorker, setSearchWorker] = useState<string>('');

  // Modals state
  const [isLiquidacionModalOpen, setIsLiquidacionModalOpen] = useState(false);
  const [selectedLiquidacionData, setSelectedLiquidacionData] = useState<any>(null);

  const [isNominaModalOpen, setIsNominaModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const [isAdelantoModalOpen, setIsAdelantoModalOpen] = useState(false);
  const [isPrestamoModalOpen, setIsPrestamoModalOpen] = useState(false);
  const [isExtraModalOpen, setIsExtraModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  const [quickExtraTargetWorker, setQuickExtraTargetWorker] = useState<string | undefined>(undefined);
  const [copiedWorkerId, setCopiedWorkerId] = useState<string | null>(null);

  // Manual payment statuses in current view if not saved in payrollRecords yet
  const [localStatuses, setLocalStatuses] = useState<Record<string, { estado: string; metodo?: string; comprobante?: string }>>({});

  // ----------------------------------------------------
  // DATE RANGE CALCULATOR (Semanal con cierre el Sábado)
  // ----------------------------------------------------
  const weekRange = useMemo(() => {
    try {
      const now = new Date();
      // currentDay: 0 is Sunday, 1 is Monday ... 6 is Saturday
      const currentDay = now.getDay() === 0 ? 7 : now.getDay();

      // Monday of the week
      const start = new Date(now);
      start.setDate(now.getDate() - currentDay + 1 + (selectedWeekOffset * 7));
      start.setHours(0, 0, 0, 0);

      // Saturday of the week (Payment Day)
      const saturday = new Date(start);
      saturday.setDate(start.getDate() + 5);
      saturday.setHours(23, 59, 59, 999);

      // Sunday end of technical week
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      const formatChile = (d: Date) => {
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
      };

      const formatIso = (d: Date) => {
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${yyyy}-${mm}-${dd}`;
      };

      return {
        start,
        saturday,
        end,
        startStr: formatChile(start),
        saturdayStr: formatChile(saturday),
        endStr: formatChile(end),
        isoSaturday: formatIso(saturday),
        label: `Semana del ${formatChile(start)} al ${formatChile(saturday)}`
      };
    } catch (e) {
      console.error('Error calculando rango de fechas:', e);
      const today = new Date();
      return {
        start: today,
        saturday: today,
        end: today,
        startStr: today.toLocaleDateString(),
        saturdayStr: today.toLocaleDateString(),
        endStr: today.toLocaleDateString(),
        isoSaturday: today.toISOString().split('T')[0],
        label: 'Semana Actual'
      };
    }
  }, [selectedWeekOffset]);

  // Helper to parse dates safely
  const parseDateSafely = (dateStr?: string): Date | null => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    try {
      if (dateStr.includes('/')) {
        const [d, m, y] = dateStr.split('/');
        return new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
      }
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts[0].length === 4) {
          const [y, m, d] = parts;
          return new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
        } else {
          const [d, m, y] = parts;
          return new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
        }
      }
      const parsed = new Date(dateStr);
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch {
      return null;
    }
  };

  // ----------------------------------------------------
  // WEEKLY SALES & COMMISSIONS CALCULATION
  // ----------------------------------------------------
  const weeklySales = useMemo(() => {
    if (!Array.isArray(sales)) return [];
    return sales.filter(s => {
      if (!s || !s.fecha) return false;
      const saleDate = parseDateSafely(s.fecha);
      if (!saleDate) return false;
      return saleDate >= weekRange.start && saleDate <= weekRange.end;
    });
  }, [sales, weekRange]);

  const sellerCommissionsMap = useMemo(() => {
    const report: Record<
      string,
      {
        total: number;
        count: number;
        details: { type: CommissionType; qty: number; subtotal: number }[];
        entries: any[];
      }
    > = {};

    weeklySales.forEach(s => {
      const vendedorName = s.vendedor || 'Sin Vendedor';
      if (!report[vendedorName]) {
        report[vendedorName] = { total: 0, count: 0, details: [], entries: [] };
      }

      const processEntry = (
        tipo: CommissionType | undefined,
        qty: number,
        codigo: string,
        esManual: boolean = false,
        saleVariante?: string
      ) => {
        let finalTipo = tipo;
        const uppercaseCode = (codigo || '').toUpperCase();
        const variantUpper = (saleVariante || '').toUpperCase();

        if (uppercaseCode.startsWith('L') || variantUpper.includes('LOTE')) {
          finalTipo = CommissionType.LOTE;
        } else if (variantUpper.includes('MEDIO')) {
          finalTipo = CommissionType.MEDIO_FARDO;
        }

        if (!finalTipo) {
          finalTipo = CommissionType.FARDO_NORMAL;
        }

        const commValue = (effectiveCommissionValues[finalTipo as string] || 0) * qty;
        report[vendedorName].total += commValue;
        report[vendedorName].count += qty;

        const existingType = report[vendedorName].details.find(d => d.type === finalTipo);
        if (existingType) {
          existingType.qty += qty;
          existingType.subtotal += commValue;
        } else {
          report[vendedorName].details.push({ type: finalTipo, qty, subtotal: commValue });
        }

        report[vendedorName].entries.push({
          id: `${s.id}-${codigo}`,
          fecha: s.fecha,
          vendedor: s.vendedor,
          tipo: finalTipo,
          qty,
          subtotal: commValue,
          codigo,
          saleNumber: s.numeroVenta,
          source: s.tipoVenta,
          esManual
        });
      };

      if (s.items && s.items.length > 0) {
        s.items.forEach(item => {
          processEntry(item.tipoComision, item.cantidad, item.codigoFardo, item.esManual || false, s.variante);
        });
      } else {
        processEntry(s.tipoComision, s.cantidad || 1, s.codigoFardo || '', s.esManual || false, s.variante);
      }
    });

    return report;
  }, [weeklySales, effectiveCommissionValues]);

  // ----------------------------------------------------
  // WEEKLY SALARY ADVANCES (Adelantos)
  // ----------------------------------------------------
  const weeklyAdvances = useMemo(() => {
    if (!Array.isArray(salaryAdvances)) return [];
    return salaryAdvances.filter(a => {
      if (!a.fecha) return false;
      const advDate = parseDateSafely(a.fecha);
      if (!advDate) return false;
      return advDate >= weekRange.start && advDate <= weekRange.end;
    });
  }, [salaryAdvances, weekRange]);

  // ----------------------------------------------------
  // WEEKLY WORK EXTRAS (Descargas, Cargas, Bonos)
  // ----------------------------------------------------
  const weeklyWorkExtras = useMemo(() => {
    if (!Array.isArray(workExtras)) return [];
    return workExtras.filter(e => {
      if (!e.fecha) return false;
      const extraDate = parseDateSafely(e.fecha);
      if (!extraDate) return false;
      return extraDate >= weekRange.start && extraDate <= weekRange.end;
    });
  }, [workExtras, weekRange]);

  // ----------------------------------------------------
  // WEEKLY MANUAL ADJUSTMENTS
  // ----------------------------------------------------
  const weeklyAdjustments = useMemo(() => {
    if (!Array.isArray(adjustments)) return [];
    return adjustments.filter(a => {
      const adjDate = parseDateSafely(a.fecha);
      if (!adjDate) return false;
      return adjDate >= weekRange.start && adjDate <= weekRange.end;
    });
  }, [adjustments, weekRange]);

  // ----------------------------------------------------
  // CONSOLIDATED WORKER PAYROLL CALCULATION
  // ----------------------------------------------------
  const calculatedPayrollList = useMemo(() => {
    const activeStaff = staff.filter(s => s.activo !== false);

    return activeStaff.map(member => {
      // 1. Sueldo base semanal pactado
      const sueldoBase = member.sueldoBaseSemanal !== undefined ? Number(member.sueldoBaseSemanal) : 120000;

      // 2. Comisiones si es vendedor o tiene ventas
      const commissionData = sellerCommissionsMap[member.nombre] || { total: 0, count: 0, details: [], entries: [] };
      const comisionesTotal = commissionData.total || 0;

      // 3. Extras de trabajo (Descargas de camión, cargas, reenfardado, etc.)
      const workerExtras = weeklyWorkExtras.filter(e => e.workerId === member.id || e.workerName === member.nombre);
      const extrasTotal = workerExtras.reduce((acc, e) => acc + (Number(e.total) || 0), 0);

      // 4. Otros bonos positivos desde adjustments
      const workerPositiveAdj = weeklyAdjustments.filter(a => a.vendedor === member.nombre && a.monto > 0);
      const otrosBonosTotal = workerPositiveAdj.reduce((acc, a) => acc + a.monto, 0);

      // TOTAL HABERES
      const totalHaberes = sueldoBase + comisionesTotal + extrasTotal + otrosBonosTotal;

      // 5. Adelantos de la semana
      const workerAdvances = weeklyAdvances.filter(a => a.workerId === member.id || a.workerName === member.nombre);
      const adelantosTotal = workerAdvances.reduce((acc, a) => acc + (Number(a.monto) || 0), 0);

      // 6. Préstamos activos y cuota semanal
      const activeLoans = employeeLoans.filter(
        l => (l.workerId === member.id || l.workerName === member.nombre) && l.estado === 'ACTIVO' && l.saldoPendiente > 0
      );
      const prestamosDetalle = activeLoans.map(l => {
        const cuota = Math.min(l.montoCuotaSemanal || 0, l.saldoPendiente);
        return {
          loanId: l.id,
          montoCuota: cuota,
          saldoRestante: Math.max(0, l.saldoPendiente - cuota),
          montoTotal: l.montoTotal,
          cuotasPagadas: l.cuotasPagadas,
          numeroCuotas: l.numeroCuotas
        };
      });
      const cuotaPrestamoTotal = prestamosDetalle.reduce((acc, p) => acc + p.montoCuota, 0);

      // 7. Otros descuentos negativos desde adjustments
      const workerNegativeAdj = weeklyAdjustments.filter(a => a.vendedor === member.nombre && a.monto < 0);
      const otrosDescuentosTotal = Math.abs(workerNegativeAdj.reduce((acc, a) => acc + a.monto, 0));

      // TOTAL DESCUENTOS
      const totalDescuentos = adelantosTotal + cuotaPrestamoTotal + otrosDescuentosTotal;

      // ALCANCE LÍQUIDO A PAGAR
      const liquidoPagar = Math.max(0, totalHaberes - totalDescuentos);

      // Check if already saved in payrollRecords
      const existingRecord = payrollRecords.find(
        r => (r.workerId === member.id || r.workerName === member.nombre) && r.fechaPago === weekRange.saturdayStr
      );

      const localStatus = localStatuses[member.id];
      const estado = existingRecord?.estado || localStatus?.estado || 'PENDIENTE';
      const metodoPago = existingRecord?.metodoPago || localStatus?.metodo || 'Transferencia';
      const comprobante = existingRecord?.comprobante || localStatus?.comprobante || '';

      return {
        member,
        workerId: member.id,
        workerName: member.nombre,
        cargo: member.rol,
        rut: member.rut,
        banco: member.banco,
        tipoCuenta: member.tipoCuenta,
        numeroCuenta: member.numeroCuenta,
        semanaInicio: weekRange.startStr,
        semanaFin: weekRange.saturdayStr,
        fechaPago: weekRange.saturdayStr,
        sueldoBase,
        comisionesTotal,
        comisionesDetalle: commissionData.details,
        commissionEntries: commissionData.entries,
        extrasTotal,
        workerExtras,
        otrosBonosTotal,
        totalHaberes,
        adelantosTotal,
        workerAdvances,
        cuotaPrestamoTotal,
        prestamosDetalle,
        otrosDescuentosTotal,
        otrosDescuentosDetalle: workerNegativeAdj.map(a => ({ motivo: a.motivo, monto: Math.abs(a.monto) })),
        totalDescuentos,
        liquidoPagar,
        estado,
        metodoPago,
        comprobante,
        existingRecordId: existingRecord?.id
      };
    });
  }, [
    staff,
    sellerCommissionsMap,
    weeklyWorkExtras,
    weeklyAdvances,
    weeklyAdjustments,
    employeeLoans,
    payrollRecords,
    weekRange,
    localStatuses
  ]);

  // Filtered by Search and Role
  const filteredPayrollList = useMemo(() => {
    return calculatedPayrollList.filter(item => {
      const matchRole = roleFilter === 'TODOS' || item.cargo === roleFilter;
      const matchSearch =
        searchWorker.trim() === '' ||
        item.workerName.toLowerCase().includes(searchWorker.toLowerCase()) ||
        (item.rut && item.rut.toLowerCase().includes(searchWorker.toLowerCase()));
      return matchRole && matchSearch;
    });
  }, [calculatedPayrollList, roleFilter, searchWorker]);

  // Overall totals for the week
  const weeklyTotals = useMemo(() => {
    return {
      totalLiquido: calculatedPayrollList.reduce((acc, i) => acc + i.liquidoPagar, 0),
      totalHaberes: calculatedPayrollList.reduce((acc, i) => acc + i.totalHaberes, 0),
      totalBase: calculatedPayrollList.reduce((acc, i) => acc + i.sueldoBase, 0),
      totalComisiones: calculatedPayrollList.reduce((acc, i) => acc + i.comisionesTotal, 0),
      totalExtras: calculatedPayrollList.reduce((acc, i) => acc + i.extrasTotal, 0),
      totalDescuentos: calculatedPayrollList.reduce((acc, i) => acc + i.totalDescuentos, 0),
      totalAdelantos: calculatedPayrollList.reduce((acc, i) => acc + i.adelantosTotal, 0),
      totalPrestamos: calculatedPayrollList.reduce((acc, i) => acc + i.cuotaPrestamoTotal, 0),
      pagadosCount: calculatedPayrollList.filter(i => i.estado === 'PAGADO' || i.estado === 'TRANSFERIDO').length,
      pendientesCount: calculatedPayrollList.filter(i => i.estado === 'PENDIENTE').length
    };
  }, [calculatedPayrollList]);

  // ----------------------------------------------------
  // ACTIONS & HANDLERS
  // ----------------------------------------------------
  const handleTogglePaymentStatus = async (item: typeof calculatedPayrollList[0], newStatus: 'PENDIENTE' | 'TRANSFERIDO' | 'PAGADO') => {
    try {
      setLocalStatuses(prev => ({
        ...prev,
        [item.workerId]: { ...prev[item.workerId], estado: newStatus }
      }));

      await savePayrollRecord({
        workerId: item.workerId,
        workerName: item.workerName,
        cargo: item.cargo,
        semanaInicio: item.semanaInicio,
        semanaFin: item.semanaFin,
        fechaPago: item.fechaPago,
        sueldoBase: item.sueldoBase,
        comisionesTotal: item.comisionesTotal,
        comisionesDetalle: item.comisionesDetalle,
        extrasTotal: item.extrasTotal,
        extrasDetalle: item.workerExtras.map(e => ({
          tipo: e.tipo,
          descripcion: e.descripcion,
          cantidad: e.cantidad,
          valorUnitario: e.valorUnitario,
          subtotal: e.total
        })),
        otrosBonosTotal: item.otrosBonosTotal,
        totalHaberes: item.totalHaberes,
        adelantosTotal: item.adelantosTotal,
        adelantosDetalle: item.workerAdvances.map(a => ({
          fecha: a.fecha,
          monto: a.monto,
          motivo: a.motivo
        })),
        cuotaPrestamoTotal: item.cuotaPrestamoTotal,
        prestamosDetalle: item.prestamosDetalle.map(p => ({
          loanId: p.loanId,
          montoCuota: p.montoCuota,
          saldoRestante: p.saldoRestante
        })),
        otrosDescuentosTotal: item.otrosDescuentosTotal,
        otrosDescuentosDetalle: item.otrosDescuentosDetalle,
        totalDescuentos: item.totalDescuentos,
        liquidoPagar: item.liquidoPagar,
        estado: newStatus,
        metodoPago: item.metodoPago || 'Transferencia',
        comprobante: item.comprobante || undefined,
        datosBancarios: {
          banco: item.banco,
          tipoCuenta: item.tipoCuenta,
          numeroCuenta: item.numeroCuenta,
          rut: item.rut
        }
      });

      // If marked as paid or transferred, record loan payment amortization if not already recorded
      if ((newStatus === 'PAGADO' || newStatus === 'TRANSFERIDO') && item.prestamosDetalle.length > 0) {
        for (const p of item.prestamosDetalle) {
          if (p.montoCuota > 0) {
            await addLoanPayment(p.loanId, {
              fecha: weekRange.saturdayStr,
              monto: p.montoCuota,
              payrollRecordId: `${item.workerId}_${item.fechaPago}`
            });
          }
        }
      }

      playSound('success');
    } catch (err: any) {
      console.error('Error al actualizar estado de pago:', err);
      alert('Error al actualizar estado de pago: ' + err.message);
    }
  };

  const handleOpenIndividualModal = (item: typeof calculatedPayrollList[0]) => {
    setSelectedLiquidacionData({
      staffMember: item.member,
      record: {
        workerName: item.workerName,
        cargo: item.cargo,
        semanaInicio: item.semanaInicio,
        semanaFin: item.semanaFin,
        fechaPago: item.fechaPago,
        sueldoBase: item.sueldoBase,
        comisionesTotal: item.comisionesTotal,
        comisionesDetalle: item.comisionesDetalle,
        commissionEntries: item.commissionEntries,
        extrasTotal: item.extrasTotal,
        extrasDetalle: item.workerExtras.map(e => ({
          tipo: e.tipo,
          descripcion: e.descripcion,
          cantidad: e.cantidad,
          valorUnitario: e.valorUnitario,
          subtotal: e.total
        })),
        otrosBonosTotal: item.otrosBonosTotal,
        totalHaberes: item.totalHaberes,
        adelantosTotal: item.adelantosTotal,
        adelantosDetalle: item.workerAdvances.map(a => ({
          fecha: a.fecha,
          monto: a.monto,
          motivo: a.motivo
        })),
        cuotaPrestamoTotal: item.cuotaPrestamoTotal,
        prestamosDetalle: item.prestamosDetalle,
        otrosDescuentosTotal: item.otrosDescuentosTotal,
        otrosDescuentosDetalle: item.otrosDescuentosDetalle,
        totalDescuentos: item.totalDescuentos,
        liquidoPagar: item.liquidoPagar,
        estado: item.estado,
        metodoPago: item.metodoPago,
        comprobante: item.comprobante,
        datosBancarios: {
          banco: item.banco,
          tipoCuenta: item.tipoCuenta,
          numeroCuenta: item.numeroCuenta,
          rut: item.rut
        }
      }
    });
    setIsLiquidacionModalOpen(true);
    playSound('click');
  };

  const handleCopyWorkerBankInfo = (item: typeof calculatedPayrollList[0]) => {
    const text = `Trabajador: ${item.workerName}\nRUT: ${item.rut || 'N/A'}\nBanco: ${item.banco || 'BancoEstado'}\n${item.tipoCuenta || 'Cuenta RUT'} N° ${item.numeroCuenta || 'S/N'}\nMonto Líquido: $${item.liquidoPagar.toLocaleString('es-CL')}`;
    navigator.clipboard.writeText(text);
    setCopiedWorkerId(item.workerId);
    playSound('click');
    setTimeout(() => setCopiedWorkerId(null), 2000);
  };

  const handleOpenQuickExtra = (workerId?: string) => {
    setQuickExtraTargetWorker(workerId);
    setIsExtraModalOpen(true);
    playSound('click');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1440px] mx-auto pb-24">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 no-print">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-3 shadow-lg shadow-emerald-500/20">
            <Coins size={14} /> Módulo Oficial de Remuneraciones
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight uppercase leading-none">
            Pago de <span className="text-emerald-500 italic">Sueldos</span> & Nómina
          </h1>
          <p className="text-slate-500 font-medium italic mt-3 flex items-center gap-2">
            <Calendar size={18} className="text-emerald-500" />
            Pagos Semanales los días Sábado · Periodo Activo:{' '}
            <span className="text-slate-900 font-black">{weekRange.startStr}</span> al{' '}
            <span className="text-slate-900 font-black">{weekRange.saturdayStr}</span> (Sábado)
          </p>
        </div>

        {/* NAVEGACIÓN RÁPIDA DE SEMANA Y ACCIONES GLOBALES */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Navegador de Semanas */}
          <div className="flex items-center bg-slate-200/80 p-1.5 rounded-2xl shadow-inner">
            <button
              onClick={() => {
                setSelectedWeekOffset(prev => prev - 1);
                playSound('click');
              }}
              title="Semana Anterior"
              className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white transition-all"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              onClick={() => {
                setSelectedWeekOffset(0);
                playSound('click');
              }}
              className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                selectedWeekOffset === 0
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Esta Semana (Sábado {weekRange.saturdayStr.slice(0, 5)})
            </button>

            <button
              onClick={() => {
                setSelectedWeekOffset(prev => prev + 1);
                playSound('click');
              }}
              title="Semana Siguiente"
              className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Botones de Nómina y Transferencias */}
          <button
            onClick={() => {
              setIsTransferModalOpen(true);
              playSound('click');
            }}
            className="flex items-center gap-2 px-5 py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            <CreditCard size={16} className="text-emerald-400" />
            <span className="hidden sm:inline">Lista</span> Transferencias
          </button>

          <button
            onClick={() => {
              setIsNominaModalOpen(true);
              playSound('click');
            }}
            className="flex items-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">Imprimir</span> Nómina General
          </button>
        </div>
      </div>

      {/* BARRA DE PESTAÑAS (TABS) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-print">
        <button
          onClick={() => { setActiveTab('liquidaciones'); playSound('click'); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'liquidaciones'
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Coins size={16} className={activeTab === 'liquidaciones' ? 'text-emerald-400' : 'text-slate-400'} />
          Liquidación Semanal (Sábados)
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400">
            {calculatedPayrollList.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('adelantos'); playSound('click'); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'adelantos'
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <DollarSign size={16} className={activeTab === 'adelantos' ? 'text-amber-400' : 'text-slate-400'} />
          Adelantos de Sueldo
          {weeklyAdvances.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-400">
              {weeklyAdvances.length}
            </span>
          )}
        </button>

        <button
          onClick={() => { setActiveTab('prestamos'); playSound('click'); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'prestamos'
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Handshake size={16} className={activeTab === 'prestamos' ? 'text-blue-400' : 'text-slate-400'} />
          Préstamos a Trabajadores
          {employeeLoans.filter(l => l.estado === 'ACTIVO').length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-400">
              {employeeLoans.filter(l => l.estado === 'ACTIVO').length}
            </span>
          )}
        </button>

        <button
          onClick={() => { setActiveTab('extras'); playSound('click'); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'extras'
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Truck size={16} className={activeTab === 'extras' ? 'text-emerald-400' : 'text-slate-400'} />
          Cargas, Descargas & Bonos
          {weeklyWorkExtras.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400">
              {weeklyWorkExtras.length}
            </span>
          )}
        </button>

        <button
          onClick={() => { setActiveTab('personal'); playSound('click'); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'personal'
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users size={16} className={activeTab === 'personal' ? 'text-purple-400' : 'text-slate-400'} />
          Ficha de Personal & Sueldos
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: LIQUIDACIONES SEMANALES (SÁBADOS) */}
      {/* ========================================================================= */}
      {activeTab === 'liquidaciones' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* KPI BANNER PRINCIPAL */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 rounded-[36px] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-[-30%] right-[-10%] w-[50%] h-[160%] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
              
              {/* Gran Total */}
              <div className="lg:col-span-2 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <Coins size={13} /> Desembolso Total Sábado {weekRange.saturdayStr}
                </div>
                <div className="flex items-baseline gap-3">
                  <h2 className="text-5xl md:text-6xl font-black tracking-tight leading-none text-white">
                    ${weeklyTotals.totalLiquido.toLocaleString('es-CL')}
                  </h2>
                  <span className="text-xl text-emerald-400 font-bold">CLP</span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  {weeklyTotals.pagadosCount} trabajadores liquidados / {weeklyTotals.pendientesCount} pendientes de pago.
                </p>
              </div>

              {/* Métricas Haberes y Descuentos */}
              <div className="grid grid-cols-2 gap-3 lg:col-span-2">
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Sueldos Base</p>
                  <p className="text-lg font-black text-white">${weeklyTotals.totalBase.toLocaleString('es-CL')}</p>
                </div>

                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-wider mb-1">Comisiones Ventas</p>
                  <p className="text-lg font-black text-emerald-300">${weeklyTotals.totalComisiones.toLocaleString('es-CL')}</p>
                </div>

                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-wider mb-1">Descargas & Extras</p>
                  <p className="text-lg font-black text-blue-300">${weeklyTotals.totalExtras.toLocaleString('es-CL')}</p>
                </div>

                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                  <p className="text-[9px] font-black text-red-400 uppercase tracking-wider mb-1">Total Descuentos</p>
                  <p className="text-lg font-black text-red-300">-${weeklyTotals.totalDescuentos.toLocaleString('es-CL')}</p>
                </div>
              </div>

            </div>
          </div>

          {/* BARRA DE ACCIÓN RÁPIDA Y FILTROS */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Buscador y Filtro por Rol */}
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[240px]">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar trabajador por nombre o RUT..."
                  value={searchWorker}
                  onChange={e => setSearchWorker(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-sm"
                />
              </div>

              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none shadow-sm cursor-pointer"
              >
                <option value="TODOS">Todos los Cargos ({staff.length})</option>
                <option value={StaffRole.VENDEDOR}>Vendedoras / Ventas</option>
                <option value={StaffRole.BODEGA}>Jefe / Personal de Bodega</option>
                <option value={StaffRole.DESPACHO}>Encargados de Despacho</option>
                <option value={StaffRole.TRANSPORTISTA}>Transportistas</option>
                <option value={StaffRole.ADMIN}>Administración</option>
              </select>
            </div>

            {/* Botones de Registro Rápido */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  setIsAdelantoModalOpen(true);
                  playSound('click');
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-2xl font-black text-xs uppercase tracking-wider transition-all"
              >
                <PlusCircle size={15} /> + Adelanto
              </button>

              <button
                onClick={() => handleOpenQuickExtra()}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-2xl font-black text-xs uppercase tracking-wider transition-all"
              >
                <Truck size={15} /> + Descarga / Extra
              </button>

              <button
                onClick={() => {
                  setIsPrestamoModalOpen(true);
                  playSound('click');
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-2xl font-black text-xs uppercase tracking-wider transition-all"
              >
                <Handshake size={15} /> + Préstamo
              </button>
            </div>

          </div>

          {/* LISTA DE FICHAS DE PAGO POR TRABAJADOR */}
          <div className="grid grid-cols-1 gap-6">
            {filteredPayrollList.map(item => {
              const isPaid = item.estado === 'PAGADO' || item.estado === 'TRANSFERIDO';
              const isTransferred = item.estado === 'TRANSFERIDO';

              return (
                <div
                  key={item.workerId}
                  className={`bg-white rounded-[32px] border transition-all overflow-hidden shadow-sm hover:shadow-md ${
                    isPaid ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-slate-100">
                    
                    {/* Identificación del Trabajador */}
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg ${
                        isPaid ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-900 text-white'
                      }`}>
                        {item.workerName.slice(0, 2).toUpperCase()}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                            {item.workerName}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                            {item.cargo}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1 font-medium">
                          {item.rut && <span>RUT: <span className="font-bold text-slate-700 font-mono">{item.rut}</span></span>}
                          <span>
                            {item.banco || 'BancoEstado'} · {item.tipoCuenta || 'Cuenta RUT'}
                            {item.numeroCuenta && <span className="font-mono font-bold text-slate-700 ml-1">N° {item.numeroCuenta}</span>}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Alcance Líquido y Botones de Acción */}
                    <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
                      
                      <div className="text-left lg:text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Líquido a Pagar</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-slate-900">${item.liquidoPagar.toLocaleString('es-CL')}</span>
                          <span className="text-xs font-bold text-slate-400">CLP</span>
                        </div>
                      </div>

                      {/* Selector de Estado de Pago */}
                      <div className="flex items-center gap-2">
                        {item.estado === 'PENDIENTE' && (
                          <button
                            onClick={() => handleTogglePaymentStatus(item, 'TRANSFERIDO')}
                            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                          >
                            ✓ Marcar Transferido
                          </button>
                        )}

                        {item.estado === 'TRANSFERIDO' && (
                          <span className="px-3.5 py-2 bg-emerald-100 text-emerald-800 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="text-emerald-600" /> Transferido
                          </span>
                        )}

                        {item.estado === 'PAGADO' && (
                          <span className="px-3.5 py-2 bg-emerald-100 text-emerald-800 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="text-emerald-600" /> Pagado Efectivo
                          </span>
                        )}

                        {/* Botón Copiar Transferencia */}
                        <button
                          onClick={() => handleCopyWorkerBankInfo(item)}
                          className={`p-2.5 rounded-xl border transition-all ${
                            copiedWorkerId === item.workerId
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-300'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                          title="Copiar datos para transferir en banco"
                        >
                          {copiedWorkerId === item.workerId ? <Check size={16} /> : <Copy size={16} />}
                        </button>

                        {/* Botón Ver / Imprimir Liquidación */}
                        <button
                          onClick={() => handleOpenIndividualModal(item)}
                          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 shadow-sm"
                        >
                          <Printer size={14} /> Liquidación
                        </button>
                      </div>

                    </div>

                  </div>

                  {/* DESGLOSE DETALLADO DE HABERES Y DESCUENTOS */}
                  <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50">
                    
                    {/* COLUMNA 1: HABERES (+) */}
                    <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200/80">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Haberes e Ingresos
                        </span>
                        <span className="text-xs font-black text-emerald-800">${item.totalHaberes.toLocaleString('es-CL')}</span>
                      </div>

                      {/* Sueldo Base */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">Sueldo Base Semanal:</span>
                        <span className="font-bold text-slate-900">${item.sueldoBase.toLocaleString('es-CL')}</span>
                      </div>

                      {/* Comisiones */}
                      {item.comisionesTotal > 0 && (
                        <div className="text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600 font-medium">Comisiones por Ventas:</span>
                            <span className="font-bold text-emerald-600">+${item.comisionesTotal.toLocaleString('es-CL')}</span>
                          </div>
                          {item.comisionesDetalle?.map((d, i) => (
                            <div key={i} className="flex items-center justify-between text-[10px] text-slate-400 pl-2">
                              <span>• {d.type.split(' (')[0]} (x{d.qty})</span>
                              <span>${d.subtotal.toLocaleString('es-CL')}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Descargas y Extras */}
                      {item.extrasTotal > 0 && (
                        <div className="text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600 font-medium">Descargas / Cargas / Extras:</span>
                            <span className="font-bold text-emerald-600">+${item.extrasTotal.toLocaleString('es-CL')}</span>
                          </div>
                          {item.workerExtras.map(e => (
                            <div key={e.id} className="flex items-center justify-between text-[10px] text-slate-500 pl-2">
                              <span>• {e.descripcion || e.tipo} (x{e.cantidad})</span>
                              <span>${e.total.toLocaleString('es-CL')}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Otros Bonos */}
                      {item.otrosBonosTotal > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-medium">Bonos Especiales / Metas:</span>
                          <span className="font-bold text-emerald-600">+${item.otrosBonosTotal.toLocaleString('es-CL')}</span>
                        </div>
                      )}

                      {/* Botón rápido para agregar descarga o bono a este trabajador */}
                      <button
                        onClick={() => handleOpenQuickExtra(item.workerId)}
                        className="w-full mt-2 py-1.5 text-center text-[10px] font-black text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-dashed border-emerald-200"
                      >
                        + Agregar Descarga / Bono a {item.workerName.split(' ')[0]}
                      </button>
                    </div>

                    {/* COLUMNA 2: DESCUENTOS (-) */}
                    <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200/80">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[10px] font-black text-red-700 uppercase tracking-widest flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span> Descuentos Aplicados
                        </span>
                        <span className="text-xs font-black text-red-600">-${item.totalDescuentos.toLocaleString('es-CL')}</span>
                      </div>

                      {/* Adelantos */}
                      {item.adelantosTotal > 0 ? (
                        <div className="text-xs space-y-1">
                          <div className="flex items-center justify-between font-medium text-slate-700">
                            <span>Adelantos de la Semana:</span>
                            <span className="font-bold text-red-600">-${item.adelantosTotal.toLocaleString('es-CL')}</span>
                          </div>
                          {item.workerAdvances.map(a => (
                            <div key={a.id} className="flex items-center justify-between text-[10px] text-slate-400 pl-2">
                              <span>• {a.fecha} ({a.motivo || 'Anticipo'})</span>
                              <span className="text-red-500">-${a.monto.toLocaleString('es-CL')}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Adelantos en la Semana:</span>
                          <span>$0</span>
                        </div>
                      )}

                      {/* Préstamos */}
                      {item.cuotaPrestamoTotal > 0 ? (
                        <div className="text-xs space-y-1">
                          <div className="flex items-center justify-between font-medium text-slate-700">
                            <span>Cuota de Préstamo Semanal:</span>
                            <span className="font-bold text-red-600">-${item.cuotaPrestamoTotal.toLocaleString('es-CL')}</span>
                          </div>
                          {item.prestamosDetalle.map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[10px] text-slate-400 pl-2">
                              <span>• Cuota {p.cuotasPagadas + 1} de {p.numeroCuotas} (Saldo rest: ${p.saldoRestante.toLocaleString('es-CL')})</span>
                              <span className="text-red-500">-${p.montoCuota.toLocaleString('es-CL')}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Préstamos Activos:</span>
                          <span>Sin deuda activa</span>
                        </div>
                      )}

                      {/* Otros Descuentos */}
                      {item.otrosDescuentosTotal > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-medium">Otros Descuentos / Ajustes:</span>
                          <span className="font-bold text-red-600">-${item.otrosDescuentosTotal.toLocaleString('es-CL')}</span>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}

            {filteredPayrollList.length === 0 && (
              <div className="py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-200">
                <Users size={48} className="mx-auto text-slate-300 mb-3" />
                <h3 className="text-lg font-black text-slate-700 uppercase">No hay trabajadores activos en este filtro</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Agrega trabajadores en la pestaña "Ficha de Personal" o modifica los filtros de búsqueda.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: ADELANTOS DE SUELDO (ANTICIPOS EN LA SEMANA) */}
      {/* ========================================================================= */}
      {activeTab === 'adelantos' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase">Gestión de Adelantos de Sueldo</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Anticipos solicitados por los trabajadores durante la semana para descontar en el pago del sábado.
              </p>
            </div>

            <button
              onClick={() => {
                setIsAdelantoModalOpen(true);
                playSound('click');
              }}
              className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <PlusCircle size={16} /> + Registrar Nuevo Adelanto
            </button>
          </div>

          {/* Tabla de Adelantos */}
          <div className="bg-white rounded-[28px] border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4 text-left">Fecha</th>
                    <th className="py-3.5 px-4 text-left">Trabajador</th>
                    <th className="py-3.5 px-4 text-left">Motivo / Detalle</th>
                    <th className="py-3.5 px-4 text-left">Método</th>
                    <th className="py-3.5 px-4 text-right">Monto Adelantado</th>
                    <th className="py-3.5 px-4 text-center">Estado Descuento</th>
                    <th className="py-3.5 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salaryAdvances.map(advance => (
                    <tr key={advance.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{advance.fecha}</td>
                      <td className="py-3.5 px-4 font-black text-slate-900 uppercase">{advance.workerName}</td>
                      <td className="py-3.5 px-4 text-slate-600">{advance.motivo || 'Anticipo de sueldo'}</td>
                      <td className="py-3.5 px-4 text-slate-600">{advance.metodo}</td>
                      <td className="py-3.5 px-4 text-right font-black text-red-600">
                        -${advance.monto.toLocaleString('es-CL')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          advance.descontado
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {advance.descontado ? 'Descontado' : 'Por Descontar'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={async () => {
                            if (confirm(`¿Eliminar adelanto de $${advance.monto.toLocaleString('es-CL')} a ${advance.workerName}?`)) {
                              await deleteSalaryAdvance(advance.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar adelanto"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {salaryAdvances.length === 0 && (
              <div className="py-16 text-center text-slate-400 italic">
                No hay adelantos registrados actualmente.
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 3: PRÉSTAMOS A TRABAJADORES (EN CUOTAS) */}
      {/* ========================================================================= */}
      {activeTab === 'prestamos' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase">Préstamos de Dinero a Trabajadores</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Préstamos amortizados automáticamente semana a semana según la cuota fijada.
              </p>
            </div>

            <button
              onClick={() => {
                setIsPrestamoModalOpen(true);
                playSound('click');
              }}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <PlusCircle size={16} /> + Otorgar Nuevo Préstamo
            </button>
          </div>

          {/* Cards de Préstamos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employeeLoans.map(loan => {
              const porcentajePagado = loan.montoTotal > 0 ? Math.round(((loan.montoTotal - loan.saldoPendiente) / loan.montoTotal) * 100) : 100;
              const isPagado = loan.estado === 'PAGADO' || loan.saldoPendiente <= 0;

              return (
                <div
                  key={loan.id}
                  className={`bg-white rounded-[28px] border p-6 space-y-4 shadow-sm transition-all ${
                    isPagado ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        isPagado ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isPagado ? 'Liquidado / Pagado' : `Activo (${loan.cuotasPagadas || 0}/${loan.numeroCuotas} Cuotas)`}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 uppercase mt-2">{loan.workerName}</h3>
                      <p className="text-xs text-slate-500">{loan.motivo || 'Préstamo personal'}</p>
                    </div>

                    <button
                      onClick={async () => {
                        if (confirm(`¿Eliminar registro de préstamo a ${loan.workerName}?`)) {
                          await deleteEmployeeLoan(loan.id);
                        }
                      }}
                      className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors"
                      title="Eliminar préstamo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Barra de Progreso */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span>Progreso de Pago</span>
                      <span>{porcentajePagado}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${isPagado ? 'bg-emerald-500' : 'bg-blue-500'}`}
                        style={{ width: `${porcentajePagado}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Cifras clave */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Monto Total</p>
                      <p className="font-black text-slate-900">${loan.montoTotal.toLocaleString('es-CL')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Saldo Restante</p>
                      <p className="font-black text-red-600">${loan.saldoPendiente.toLocaleString('es-CL')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Cuota Semanal</p>
                      <p className="font-bold text-slate-700">${loan.montoCuotaSemanal.toLocaleString('es-CL')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Fecha Inicio</p>
                      <p className="font-mono text-slate-600">{loan.fechaOtorgamiento}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {employeeLoans.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-400 italic bg-white rounded-[28px] border border-slate-200">
                No hay préstamos registrados actualmente.
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 4: CARGAS, DESCARGAS & PAGOS EXTRAS */}
      {/* ========================================================================= */}
      {activeTab === 'extras' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase">Descargas de Camión, Cargas y Trabajos Extras</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Registro de descargas de contenedor, cargas a transporte y bonos de bodega.
              </p>
            </div>

            <button
              onClick={() => handleOpenQuickExtra()}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <PlusCircle size={16} /> + Registrar Descarga / Trabajo Extra
            </button>
          </div>

          {/* Tabla de Extras */}
          <div className="bg-white rounded-[28px] border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4 text-left">Fecha</th>
                    <th className="py-3.5 px-4 text-left">Trabajador</th>
                    <th className="py-3.5 px-4 text-left">Tipo de Trabajo</th>
                    <th className="py-3.5 px-4 text-left">Detalle / Camión</th>
                    <th className="py-3.5 px-4 text-center">Cantidad</th>
                    <th className="py-3.5 px-4 text-right">Valor Unitario</th>
                    <th className="py-3.5 px-4 text-right">Total a Pagar</th>
                    <th className="py-3.5 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workExtras.map(extra => (
                    <tr key={extra.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{extra.fecha}</td>
                      <td className="py-3.5 px-4 font-black text-slate-900 uppercase">{extra.workerName}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-black text-[9px] rounded-md uppercase">
                          {extra.tipo}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{extra.descripcion || '-'}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">x{extra.cantidad}</td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-700">${extra.valorUnitario?.toLocaleString('es-CL')}</td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-600">
                        +${extra.total?.toLocaleString('es-CL')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={async () => {
                            if (confirm(`¿Eliminar trabajo extra de ${extra.workerName}?`)) {
                              await deleteWorkExtra(extra.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar registro"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {workExtras.length === 0 && (
              <div className="py-16 text-center text-slate-400 italic">
                No hay trabajos extras registrados actualmente.
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 5: FICHA DE PERSONAL & SUELDOS */}
      {/* ========================================================================= */}
      {activeTab === 'personal' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase">Fichas de Personal & Datos Bancarios</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Configuración del sueldo base semanal, tarifas de descargas y cuentas para transferencias.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingStaff(null);
                setIsStaffModalOpen(true);
                playSound('click');
              }}
              className="flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95"
            >
              <PlusCircle size={16} /> + Agregar Trabajador
            </button>
          </div>

          {/* Grid de Fichas de Trabajadores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staff.map(member => (
              <div
                key={member.id}
                className="bg-white rounded-[28px] border border-slate-200 p-6 space-y-4 shadow-sm hover:border-emerald-300 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black">
                      {member.nombre.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 uppercase text-base">{member.nombre}</h3>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase">
                        {member.rol}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingStaff(member);
                        setIsStaffModalOpen(true);
                        playSound('click');
                      }}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Editar ficha"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(`¿Eliminar de nómina al trabajador ${member.nombre}?`)) {
                          await removeStaff(member.id);
                        }
                      }}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar trabajador"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sueldo Base Semanal:</span>
                    <span className="font-black text-emerald-600">
                      ${(member.sueldoBaseSemanal || 120000).toLocaleString('es-CL')} CLP
                    </span>
                  </div>

                  {member.rut && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">RUT:</span>
                      <span className="font-mono font-bold text-slate-800">{member.rut}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-slate-500">Banco:</span>
                    <span className="font-bold text-slate-800">{member.banco || 'BancoEstado'}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Cuenta:</span>
                    <span className="font-mono text-slate-800">
                      {member.tipoCuenta || 'Cuenta RUT'} N° {member.numeroCuenta || 'S/N'}
                    </span>
                  </div>
                </div>

                {/* Tarifas de extras */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                  <div>
                    <span className="block font-bold text-slate-400">Descarga Camión:</span>
                    <span className="font-black text-slate-800">${(member.tarifaDescargaCamion || 25000).toLocaleString('es-CL')}</span>
                  </div>
                  <div>
                    <span className="block font-bold text-slate-400">Carga Camión:</span>
                    <span className="font-black text-slate-800">${(member.tarifaCargaCamion || 15000).toLocaleString('es-CL')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALES DEL SISTEMA DE REMUNERACIONES */}
      {/* ========================================================================= */}

      {/* Modal Liquidación Individual */}
      {isLiquidacionModalOpen && selectedLiquidacionData && (
        <LiquidacionIndividualModal
          isOpen={isLiquidacionModalOpen}
          onClose={() => setIsLiquidacionModalOpen(false)}
          staffMember={selectedLiquidacionData.staffMember}
          record={selectedLiquidacionData.record}
        />
      )}

      {/* Modal Planilla Consolidada General */}
      {isNominaModalOpen && (
        <NominaConsolidadaModal
          isOpen={isNominaModalOpen}
          onClose={() => setIsNominaModalOpen(false)}
          semanaInicio={weekRange.startStr}
          semanaFin={weekRange.saturdayStr}
          fechaPago={weekRange.saturdayStr}
          items={calculatedPayrollList.map(item => ({
            workerName: item.workerName,
            cargo: item.cargo,
            rut: item.rut,
            banco: item.banco,
            numeroCuenta: item.numeroCuenta,
            sueldoBase: item.sueldoBase,
            comisionesTotal: item.comisionesTotal,
            extrasTotal: item.extrasTotal,
            otrosBonosTotal: item.otrosBonosTotal,
            totalHaberes: item.totalHaberes,
            adelantosTotal: item.adelantosTotal,
            cuotaPrestamoTotal: item.cuotaPrestamoTotal,
            otrosDescuentosTotal: item.otrosDescuentosTotal,
            totalDescuentos: item.totalDescuentos,
            liquidoPagar: item.liquidoPagar,
            estado: item.estado,
            metodoPago: item.metodoPago
          }))}
        />
      )}

      {/* Modal Nómina Rápida Transferencias */}
      {isTransferModalOpen && (
        <TransferListModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          items={calculatedPayrollList
            .filter(i => i.liquidoPagar > 0)
            .map(item => ({
              workerName: item.workerName,
              rut: item.rut || 'N/A',
              banco: item.banco || 'BancoEstado',
              tipoCuenta: item.tipoCuenta || 'Cuenta RUT',
              numeroCuenta: item.numeroCuenta || 'S/N',
              monto: item.liquidoPagar
            }))}
        />
      )}

      {/* Modal Registrar Adelanto */}
      {isAdelantoModalOpen && (
        <AdelantoModal
          isOpen={isAdelantoModalOpen}
          onClose={() => setIsAdelantoModalOpen(false)}
          staffList={staff}
          defaultSemanaPago={weekRange.saturdayStr}
          onSave={async advance => {
            await addSalaryAdvance(advance);
          }}
        />
      )}

      {/* Modal Otorgar Préstamo */}
      {isPrestamoModalOpen && (
        <PrestamoModal
          isOpen={isPrestamoModalOpen}
          onClose={() => setIsPrestamoModalOpen(false)}
          staffList={staff}
          onSave={async loan => {
            await addEmployeeLoan(loan);
          }}
        />
      )}

      {/* Modal Registrar Descarga / Trabajo Extra */}
      {isExtraModalOpen && (
        <TrabajoExtraModal
          isOpen={isExtraModalOpen}
          onClose={() => {
            setIsExtraModalOpen(false);
            setQuickExtraTargetWorker(undefined);
          }}
          staffList={staff}
          defaultWorkerId={quickExtraTargetWorker}
          defaultSemanaPago={weekRange.saturdayStr}
          onSaveSingle={async extra => {
            await addWorkExtra(extra);
          }}
          onSaveMultiple={async extras => {
            await bulkAddWorkExtras(extras);
          }}
        />
      )}

      {/* Modal Crear / Editar Ficha Trabajador */}
      {isStaffModalOpen && (
        <TrabajadorModal
          isOpen={isStaffModalOpen}
          onClose={() => setIsStaffModalOpen(false)}
          staff={editingStaff}
          onSave={async staffData => {
            if (editingStaff) {
              await updateStaff(editingStaff.id, staffData);
            } else {
              await addStaff(staffData as StaffMember);
            }
          }}
        />
      )}

    </div>
  );
}
