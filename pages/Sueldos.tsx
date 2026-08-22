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
  ArrowRight,
  Video,
  Moon,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import {
  StaffMember,
  StaffRole,
  CommissionType,
  SalaryAdvance,
  EmployeeLoan,
  WorkExtra,
  WeeklyPayrollRecord,
  TikTokLiveRecord
} from '../types';

import LiquidacionIndividualModal from '../components/sueldos/LiquidacionIndividualModal';
import NominaConsolidadaModal from '../components/sueldos/NominaConsolidadaModal';
import TransferListModal from '../components/sueldos/TransferListModal';
import AdelantoModal from '../components/sueldos/AdelantoModal';
import PrestamoModal from '../components/sueldos/PrestamoModal';
import TrabajoExtraModal from '../components/sueldos/TrabajoExtraModal';
import TikTokLiveModal from '../components/sueldos/TikTokLiveModal';
import TrabajadorModal from '../components/sueldos/TrabajadorModal';
import AsistenciaSemanalModal from '../components/sueldos/AsistenciaSemanalModal';

const DEFAULT_COMMISSION_VALUES: Record<string, number> = {
  [CommissionType.FARDO_NORMAL]: 3000,
  [CommissionType.FARDO_PROMO]: 1500,
  [CommissionType.MEDIO_FARDO]: 1500,
  [CommissionType.LOTE]: 1000,
};

type ActiveTab = 'liquidaciones' | 'asistencia' | 'adelantos' | 'prestamos' | 'extras' | 'tiktok' | 'personal' | 'historial';

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
    tiktokLives,
    addTikTokLive,
    bulkAddTikTokLives,
    updateTikTokLive,
    deleteTikTokLive,
    payrollRecords,
    savePayrollRecord,
    updatePayrollRecord,
    deletePayrollRecord,
    weeklyAttendance,
    saveWeeklyAttendance,
    deleteWeeklyAttendance,
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

  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedAttendanceStaff, setSelectedAttendanceStaff] = useState<StaffMember | null>(null);

  const [isNominaModalOpen, setIsNominaModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const [isAdelantoModalOpen, setIsAdelantoModalOpen] = useState(false);
  const [isPrestamoModalOpen, setIsPrestamoModalOpen] = useState(false);
  const [isExtraModalOpen, setIsExtraModalOpen] = useState(false);
  const [isTikTokModalOpen, setIsTikTokModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  const [quickExtraTargetWorker, setQuickExtraTargetWorker] = useState<string | undefined>(undefined);
  const [quickTikTokTargetWorker, setQuickTikTokTargetWorker] = useState<string | undefined>(undefined);
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
  // WEEKLY TIKTOK LIVES ($15.000 / Noche)
  // ----------------------------------------------------
  const weeklyTikTokLives = useMemo(() => {
    if (!Array.isArray(tiktokLives)) return [];
    return tiktokLives.filter(l => {
      if (!l.fecha) return false;
      const liveDate = parseDateSafely(l.fecha);
      if (!liveDate) return false;
      return liveDate >= weekRange.start && liveDate <= weekRange.end;
    });
  }, [tiktokLives, weekRange]);

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
  // WEEKLY ATTENDANCE FOR CURRENT WEEK
  // ----------------------------------------------------
  const currentWeekAttendance = useMemo(() => {
    if (!Array.isArray(weeklyAttendance)) return [];
    return weeklyAttendance.filter(a => {
      if (!a) return false;
      return a.fechaPago === weekRange.saturdayStr || (a.semanaInicio === weekRange.startStr && a.semanaFin === weekRange.saturdayStr);
    });
  }, [weeklyAttendance, weekRange]);

  // ----------------------------------------------------
  // CONSOLIDATED WORKER PAYROLL CALCULATION
  // ----------------------------------------------------
  const calculatedPayrollList = useMemo(() => {
    const activeStaff = staff.filter(s => s.activo !== false);

    return activeStaff.map(member => {
      // 1. Sueldo base semanal pactado (Base para 6 días de trabajo)
      const sueldoBasePactado = member.sueldoBaseSemanal !== undefined ? Number(member.sueldoBaseSemanal) : 120000;
      const valorDia = Math.round(sueldoBasePactado / 6);

      // Asistencia de la semana registrada
      const attendance = currentWeekAttendance.find(
        a => (a.workerId === member.id || a.workerName === member.nombre)
      );

      const diasTrabajados = attendance?.diasTrabajados !== undefined ? Number(attendance.diasTrabajados) : 6;
      const diasFaltas = attendance?.diasFaltas !== undefined ? Number(attendance.diasFaltas) : Math.max(0, 6 - diasTrabajados);
      const descuentoFaltas = attendance?.descuentoFaltas !== undefined ? Number(attendance.descuentoFaltas) : Math.round(diasFaltas * valorDia);
      const sueldoBase = attendance?.sueldoBaseAPagar !== undefined ? Number(attendance.sueldoBaseAPagar) : Math.max(0, sueldoBasePactado - descuentoFaltas);
      const detalleAsistencia = attendance?.diasDetalle;

      // 2. Comisiones si es vendedor o tiene ventas
      const commissionData = sellerCommissionsMap[member.nombre] || { total: 0, count: 0, details: [], entries: [] };
      const comisionesTotal = commissionData.total || 0;

      // 3. Extras de trabajo (Descargas de camión, cargas, reenfardado, etc.)
      const workerExtras = weeklyWorkExtras.filter(e => e.workerId === member.id || e.workerName === member.nombre);
      const extrasTotal = workerExtras.reduce((acc, e) => acc + (Number(e.total) || 0), 0);

      // 4. Noches de TikTok Live ($15.000 / noche)
      const workerTikTokLives = weeklyTikTokLives.filter(l => l.workerId === member.id || l.workerName === member.nombre);
      const tiktokLivesTotal = workerTikTokLives.reduce((acc, l) => acc + (Number(l.total) || 0), 0);
      const tiktokLivesCount = workerTikTokLives.reduce((acc, l) => acc + (Number(l.cantidadNoches) || 1), 0);
      const tiktokLivesDetalle = workerTikTokLives.map(l => ({
        fecha: l.fecha,
        cantidad: Number(l.cantidadNoches) || 1,
        valorNoche: Number(l.valorNoche) || 15000,
        subtotal: Number(l.total) || 15000,
        tema: l.tema,
        observacion: l.observacion
      }));

      // 5. Otros bonos positivos desde adjustments
      const workerPositiveAdj = weeklyAdjustments.filter(a => a.vendedor === member.nombre && a.monto > 0);
      const otrosBonosTotal = workerPositiveAdj.reduce((acc, a) => acc + a.monto, 0);

      // TOTAL HABERES
      const totalHaberes = sueldoBase + comisionesTotal + extrasTotal + tiktokLivesTotal + otrosBonosTotal;

      // 6. Adelantos de la semana
      const workerAdvances = weeklyAdvances.filter(a => a.workerId === member.id || a.workerName === member.nombre);
      const adelantosTotal = workerAdvances.reduce((acc, a) => acc + (Number(a.monto) || 0), 0);

      // 7. Préstamos activos y cuota semanal
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

      // 8. Otros descuentos negativos desde adjustments
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
        sueldoBasePactado,
        diasTrabajados,
        diasFaltas,
        descuentoFaltas,
        valorDia,
        detalleAsistencia,
        attendanceRecord: attendance,
        sueldoBase,
        comisionesTotal,
        comisionesDetalle: commissionData.details,
        commissionEntries: commissionData.entries,
        extrasTotal,
        workerExtras,
        tiktokLivesTotal,
        tiktokLivesCount,
        tiktokLivesDetalle,
        workerTikTokLives,
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
    currentWeekAttendance,
    sellerCommissionsMap,
    weeklyWorkExtras,
    weeklyTikTokLives,
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
      totalTikTokLives: calculatedPayrollList.reduce((acc, i) => acc + (i.tiktokLivesTotal || 0), 0),
      totalNochesTikTok: calculatedPayrollList.reduce((acc, i) => acc + (i.tiktokLivesCount || 0), 0),
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
        sueldoBasePactado: item.sueldoBasePactado,
        diasTrabajados: item.diasTrabajados,
        diasFaltas: item.diasFaltas,
        descuentoFaltas: item.descuentoFaltas,
        valorDia: item.valorDia,
        detalleAsistencia: item.detalleAsistencia,
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
        tiktokLivesTotal: item.tiktokLivesTotal,
        tiktokLivesCount: item.tiktokLivesCount,
        tiktokLivesDetalle: item.tiktokLivesDetalle,
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

  const handleOpenAttendanceModal = (memberOrId: StaffMember | string) => {
    if (typeof memberOrId === 'string') {
      const m = staff.find(s => s.id === memberOrId) || {
        id: memberOrId,
        nombre: memberOrId,
        rol: 'Personal',
        activo: true,
        sueldoBaseSemanal: 120000
      };
      setSelectedAttendanceStaff(m as StaffMember);
    } else {
      setSelectedAttendanceStaff(memberOrId);
    }
    setIsAttendanceModalOpen(true);
    playSound('click');
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
        sueldoBasePactado: item.sueldoBasePactado,
        diasTrabajados: item.diasTrabajados,
        diasFaltas: item.diasFaltas,
        descuentoFaltas: item.descuentoFaltas,
        valorDia: item.valorDia,
        detalleAsistencia: item.detalleAsistencia,
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
        tiktokLivesTotal: item.tiktokLivesTotal,
        tiktokLivesCount: item.tiktokLivesCount,
        tiktokLivesDetalle: item.tiktokLivesDetalle,
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

  const handleOpenQuickTikTok = (workerId?: string) => {
    setQuickTikTokTargetWorker(workerId);
    setIsTikTokModalOpen(true);
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
          onClick={() => { setActiveTab('asistencia'); playSound('click'); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'asistencia'
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Clock size={16} className={activeTab === 'asistencia' ? 'text-indigo-400' : 'text-slate-400'} />
          Asistencia & Faltas (6 Días)
          {currentWeekAttendance.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-400">
              {currentWeekAttendance.length} reg
            </span>
          )}
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
          onClick={() => { setActiveTab('tiktok'); playSound('click'); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'tiktok'
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Moon size={16} className={activeTab === 'tiktok' ? 'text-rose-400' : 'text-slate-400'} />
          Lives TikTok ($15.000)
          {weeklyTikTokLives.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-400 font-bold">
              {weeklyTikTokLives.length}
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
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:col-span-2">
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl backdrop-blur-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Sueldos Base</p>
                  <p className="text-base font-black text-white">${weeklyTotals.totalBase.toLocaleString('es-CL')}</p>
                </div>

                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl backdrop-blur-sm">
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-wider mb-1">Comisiones Ventas</p>
                  <p className="text-base font-black text-emerald-300">${weeklyTotals.totalComisiones.toLocaleString('es-CL')}</p>
                </div>

                <div className="bg-white/5 border border-rose-500/30 bg-rose-500/10 p-3.5 rounded-2xl backdrop-blur-sm">
                  <p className="text-[9px] font-black text-rose-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Moon size={11} /> Lives TikTok ($15k)
                  </p>
                  <p className="text-base font-black text-rose-300">
                    ${weeklyTotals.totalTikTokLives.toLocaleString('es-CL')} <span className="text-[10px] font-normal text-rose-200/80">({weeklyTotals.totalNochesTikTok}n)</span>
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl backdrop-blur-sm">
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-wider mb-1">Descargas & Extras</p>
                  <p className="text-base font-black text-blue-300">${weeklyTotals.totalExtras.toLocaleString('es-CL')}</p>
                </div>

                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl backdrop-blur-sm">
                  <p className="text-[9px] font-black text-amber-400 uppercase tracking-wider mb-1">Adelantos</p>
                  <p className="text-base font-black text-amber-300">-${weeklyTotals.totalAdelantos.toLocaleString('es-CL')}</p>
                </div>

                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl backdrop-blur-sm">
                  <p className="text-[9px] font-black text-red-400 uppercase tracking-wider mb-1">Total Descuentos</p>
                  <p className="text-base font-black text-red-300">-${weeklyTotals.totalDescuentos.toLocaleString('es-CL')}</p>
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
                  if (filteredPayrollList.length > 0) {
                    handleOpenAttendanceModal(filteredPayrollList[0].member);
                  } else if (staff.length > 0) {
                    handleOpenAttendanceModal(staff[0]);
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-2xl font-black text-xs uppercase tracking-wider transition-all"
              >
                <Clock size={15} /> + Asistencia (6 Días)
              </button>

              <button
                onClick={() => handleOpenQuickTikTok()}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-xs"
              >
                <Moon size={15} className="text-rose-600" /> + Live TikTok ($15.000)
              </button>

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
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                            {item.workerName}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                            {item.cargo}
                          </span>

                          {/* Badge interactivo de Asistencia Semanal (6 días) */}
                          <button
                            onClick={() => handleOpenAttendanceModal(item.member)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black transition-all border shadow-xs ${
                              item.diasTrabajados === 6
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                : item.diasTrabajados >= 5
                                ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                                : 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100'
                            }`}
                            title="Haga clic para editar la asistencia y faltas semanales de este trabajador"
                          >
                            <Clock size={12} className={item.diasTrabajados === 6 ? 'text-emerald-600' : 'text-amber-600'} />
                            <span>{item.diasTrabajados} / 6 Días</span>
                            {item.diasFaltas > 0 ? (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-md">
                                -{item.diasFaltas}d (-${item.descuentoFaltas.toLocaleString('es-CL')})
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-600 font-bold hidden sm:inline">Completa</span>
                            )}
                          </button>
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

                      {/* Sueldo Base con cálculo de 6 días y faltas */}
                      <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-700 font-bold flex items-center gap-1.5">
                            <Clock size={13} className="text-indigo-600" />
                            Sueldo Base ({item.diasTrabajados} / 6 días):
                          </span>
                          <span className="font-black text-slate-900 text-sm">${item.sueldoBase.toLocaleString('es-CL')}</span>
                        </div>
                        {item.diasFaltas > 0 ? (
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                            <span>Pactado 6d: ${item.sueldoBasePactado.toLocaleString('es-CL')} · Desc. {item.diasFaltas} {item.diasFaltas === 1 ? 'falta' : 'faltas'}:</span>
                            <span className="font-bold text-rose-600">-${item.descuentoFaltas.toLocaleString('es-CL')}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-emerald-700 font-medium flex items-center justify-between">
                            <span>Semana completa de 6 días trabajados (${item.valorDia.toLocaleString('es-CL')}/día)</span>
                            <button
                              onClick={() => handleOpenAttendanceModal(item.member)}
                              className="text-[10px] font-bold text-indigo-600 hover:underline"
                            >
                              Editar
                            </button>
                          </div>
                        )}
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

                      {/* Noches de TikTok Live ($15.000 / noche) */}
                      {item.tiktokLivesTotal > 0 && (
                        <div className="text-xs space-y-1 bg-rose-50/80 p-2.5 rounded-xl border border-rose-200">
                          <div className="flex items-center justify-between">
                            <span className="text-rose-950 font-bold flex items-center gap-1">
                              <Moon size={12} className="text-rose-600" />
                              Lives TikTok ({item.tiktokLivesCount} noche{item.tiktokLivesCount === 1 ? '' : 's'}):
                            </span>
                            <span className="font-black text-rose-700">+${item.tiktokLivesTotal.toLocaleString('es-CL')}</span>
                          </div>
                          {item.workerTikTokLives.map((l: TikTokLiveRecord) => (
                            <div key={l.id} className="flex items-center justify-between text-[10px] text-slate-600 pl-2">
                              <span>• {l.fecha}: {l.tema || 'Live Nocturno'} (x{l.cantidadNoches})</span>
                              <span className="font-bold text-rose-800">${l.total?.toLocaleString('es-CL')}</span>
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

                      {/* Botones rápidos para agregar extra o noche tiktok */}
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <button
                          onClick={() => handleOpenQuickTikTok(item.workerId)}
                          className="py-1.5 px-2 text-center text-[10px] font-black text-rose-700 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors border border-dashed border-rose-200 flex items-center justify-center gap-1"
                        >
                          <Moon size={11} /> + Live TikTok
                        </button>
                        <button
                          onClick={() => handleOpenQuickExtra(item.workerId)}
                          className="py-1.5 px-2 text-center text-[10px] font-black text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-dashed border-emerald-200 flex items-center justify-center gap-1"
                        >
                          <Truck size={11} /> + Descarga
                        </button>
                      </div>
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
      {/* PESTAÑA: ASISTENCIA Y FALTAS SEMANALES (BASE 6 DÍAS) */}
      {/* ========================================================================= */}
      {activeTab === 'asistencia' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* BANNER INFORMATIVO Y ACCIONES RÁPIDAS */}
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-6 md:p-8 rounded-[32px] shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none"></div>

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <Clock size={13} /> Sistema de Asistencia Semanal (6 Días)
                </div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                  Semana del Lunes {weekRange.startStr} al Sábado {weekRange.saturdayStr}
                </h2>
                <p className="text-xs text-indigo-200/80 leading-relaxed font-medium">
                  El sueldo base semanal de cada trabajador se pacta en base a <span className="text-white font-bold">6 días trabajados</span> (Lunes a Sábado). 
                  Si un trabajador falta o trabaja medio día, el sistema descuenta automáticamente el valor diario proporcional (<span className="text-white font-bold">Sueldo Base ÷ 6</span>).
                </p>
              </div>

              {/* Botón Acción Masiva */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={async () => {
                    const activeStaff = staff.filter(s => s.activo !== false);
                    for (const member of activeStaff) {
                      const pactado = member.sueldoBaseSemanal !== undefined ? Number(member.sueldoBaseSemanal) : 120000;
                      const valDia = Math.round(pactado / 6);
                      await saveWeeklyAttendance({
                        workerId: member.id,
                        workerName: member.nombre,
                        semanaInicio: weekRange.startStr,
                        semanaFin: weekRange.saturdayStr,
                        fechaPago: weekRange.saturdayStr,
                        diasTrabajados: 6,
                        diasFaltas: 0,
                        diasPactados: 6,
                        sueldoBasePactado: pactado,
                        valorDia: valDia,
                        descuentoFaltas: 0,
                        sueldoBaseAPagar: pactado,
                        notas: 'Semana completa 6 días (asignación rápida)'
                      });
                    }
                    playSound('success');
                  }}
                  className="flex items-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 active:scale-95 whitespace-nowrap"
                >
                  <CheckCircle2 size={16} /> Marcar Todos 6 Días
                </button>
              </div>
            </div>
          </div>

          {/* TABLA DE ASISTENCIA POR TRABAJADOR */}
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase">Control de Asistencia del Personal ({calculatedPayrollList.length})</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Selecciona los días trabajados o abre el modal para detallar día por día (Lunes a Sábado).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Filtrar:</span>
                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="TODOS">Todos los Cargos</option>
                  <option value={StaffRole.VENDEDOR}>Vendedoras</option>
                  <option value={StaffRole.BODEGA}>Bodega</option>
                  <option value={StaffRole.DESPACHO}>Despacho</option>
                  <option value={StaffRole.TRANSPORTISTA}>Transportistas</option>
                  <option value={StaffRole.ADMIN}>Administración</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-6 text-left">Trabajador & Cargo</th>
                    <th className="py-3.5 px-4 text-center">Sueldo Base Pactado</th>
                    <th className="py-3.5 px-4 text-center">Valor Día (÷ 6)</th>
                    <th className="py-3.5 px-6 text-center">Ajuste Rápido de Días</th>
                    <th className="py-3.5 px-4 text-center">Días Trab.</th>
                    <th className="py-3.5 px-4 text-right">Desc. Faltas</th>
                    <th className="py-3.5 px-4 text-right">Sueldo Base Neto</th>
                    <th className="py-3.5 px-6 text-center">Detalle Diario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayrollList.map(item => {
                    const pactado = item.sueldoBasePactado;
                    const valDia = item.valorDia;
                    const worked = item.diasTrabajados;
                    const faltas = item.diasFaltas;
                    const desc = item.descuentoFaltas;
                    const finalBase = item.sueldoBase;

                    const handleQuickSetDays = async (days: number) => {
                      const missing = Math.max(0, 6 - days);
                      const missingDiscount = Math.round(missing * valDia);
                      const baseToPay = Math.max(0, pactado - missingDiscount);

                      await saveWeeklyAttendance({
                        workerId: item.workerId,
                        workerName: item.workerName,
                        semanaInicio: weekRange.startStr,
                        semanaFin: weekRange.saturdayStr,
                        fechaPago: weekRange.saturdayStr,
                        diasTrabajados: days,
                        diasFaltas: missing,
                        diasPactados: 6,
                        sueldoBasePactado: pactado,
                        valorDia: valDia,
                        descuentoFaltas: missingDiscount,
                        sueldoBaseAPagar: baseToPay,
                        notas: `Ajuste rápido a ${days} días trabajados`
                      });
                      playSound('click');
                    };

                    return (
                      <tr key={item.workerId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                              {item.workerName.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 uppercase text-xs">{item.workerName}</p>
                              <span className="text-[10px] font-bold text-slate-500 uppercase">{item.cargo}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-center font-bold text-slate-800">
                          ${pactado.toLocaleString('es-CL')}
                        </td>

                        <td className="py-4 px-4 text-center font-mono text-slate-500 font-bold">
                          ${valDia.toLocaleString('es-CL')}/d
                        </td>

                        {/* Presets Rápidos */}
                        <td className="py-4 px-6 text-center">
                          <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                            {[6.0, 5.5, 5.0, 4.5, 4.0].map(d => (
                              <button
                                key={d}
                                onClick={() => handleQuickSetDays(d)}
                                className={`px-2 py-1 rounded-lg font-black text-[11px] transition-all ${
                                  worked === d
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                                }`}
                              >
                                {d.toFixed(1)}d
                              </button>
                            ))}
                          </div>
                        </td>

                        {/* Días Trabajados */}
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-xl font-black text-xs ${
                            worked === 6
                              ? 'bg-emerald-100 text-emerald-800'
                              : worked >= 5
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {worked} / 6
                          </span>
                        </td>

                        {/* Descuento por Faltas */}
                        <td className="py-4 px-4 text-right font-black">
                          {desc > 0 ? (
                            <span className="text-rose-600">-${desc.toLocaleString('es-CL')} <span className="text-[10px] text-slate-400 font-normal">(-{faltas}d)</span></span>
                          ) : (
                            <span className="text-emerald-600">$0</span>
                          )}
                        </td>

                        {/* Sueldo Base a Pagar */}
                        <td className="py-4 px-4 text-right font-black text-slate-900 text-sm">
                          ${finalBase.toLocaleString('es-CL')}
                        </td>

                        {/* Botón Modal Detalle */}
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => handleOpenAttendanceModal(item.member)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-xl font-black text-[11px] transition-all border border-slate-200"
                          >
                            <Calendar size={13} />
                            <span>Detalle Días</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
      {/* PESTAÑA 5: TRANSMISIONES / LIVES DE TIKTOK ($15.000 / NOCHE) */}
      {/* ========================================================================= */}
      {activeTab === 'tiktok' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                <Moon size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900 uppercase">Lives Nocturnos de TikTok</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800">
                    Tarifa Fija: $15.000 / Noche
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Registro de noches de transmisiones en vivo realizadas por trabajadores para sumar automáticamente a sus haberes semanales.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleOpenQuickTikTok()}
              className="flex items-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-rose-500/20 active:scale-95 whitespace-nowrap"
            >
              <PlusCircle size={16} /> + Registrar Noche Live TikTok
            </button>
          </div>

          {/* Tarjetas de Resumen TikTok */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Noches Totales (Semana)</p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {weeklyTikTokLives.reduce((acc, l) => acc + (Number(l.cantidadNoches) || 1), 0)} <span className="text-xs text-slate-400 font-normal">noches</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-black">
                <Moon size={20} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-wider">Total a Pagar por Lives</p>
                <p className="text-2xl font-black text-rose-600 mt-1 font-mono">
                  ${weeklyTikTokLives.reduce((acc, l) => acc + (Number(l.total) || 0), 0).toLocaleString('es-CL')}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
                <Coins size={20} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Trabajadores en Live</p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {new Set(weeklyTikTokLives.map(l => l.workerName)).size} <span className="text-xs text-slate-400 font-normal">participantes</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-black">
                <Users size={20} />
              </div>
            </div>
          </div>

          {/* Tabla de Lives TikTok */}
          <div className="bg-white rounded-[28px] border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4 text-left">Fecha</th>
                    <th className="py-3.5 px-4 text-left">Trabajador</th>
                    <th className="py-3.5 px-4 text-left">Tema / Detalle del Live</th>
                    <th className="py-3.5 px-4 text-center">Noches</th>
                    <th className="py-3.5 px-4 text-right">Tarifa x Noche</th>
                    <th className="py-3.5 px-4 text-right">Total a Pagar</th>
                    <th className="py-3.5 px-4 text-left">Observación</th>
                    <th className="py-3.5 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tiktokLives.map((live: TikTokLiveRecord) => (
                    <tr key={live.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{live.fecha}</td>
                      <td className="py-3.5 px-4 font-black text-slate-900 uppercase">{live.workerName}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 bg-rose-50 text-rose-800 font-black text-[10px] rounded-md uppercase inline-flex items-center gap-1">
                          <Moon size={11} className="text-rose-500" />
                          {live.tema || 'Live TikTok Nocturno'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">x{live.cantidadNoches || 1}</td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-700">${(live.valorNoche || 15000).toLocaleString('es-CL')}</td>
                      <td className="py-3.5 px-4 text-right font-black text-rose-600 font-mono">
                        +${live.total?.toLocaleString('es-CL')}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 italic max-w-xs truncate">{live.observacion || '-'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={async () => {
                            if (confirm(`¿Eliminar registro de Live TikTok de ${live.workerName} del ${live.fecha}?`)) {
                              await deleteTikTokLive(live.id);
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

            {tiktokLives.length === 0 && (
              <div className="py-16 text-center text-slate-400 italic">
                No hay transmisiones de TikTok Live registradas actualmente.
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 6: FICHA DE PERSONAL & SUELDOS */}
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
            sueldoBasePactado: item.sueldoBasePactado,
            diasTrabajados: item.diasTrabajados,
            diasFaltas: item.diasFaltas,
            sueldoBase: item.sueldoBase,
            comisionesTotal: item.comisionesTotal,
            tiktokLivesTotal: item.tiktokLivesTotal,
            tiktokLivesCount: item.tiktokLivesCount,
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

      {/* Modal Registrar Noches de TikTok Live */}
      {isTikTokModalOpen && (
        <TikTokLiveModal
          isOpen={isTikTokModalOpen}
          onClose={() => {
            setIsTikTokModalOpen(false);
            setQuickTikTokTargetWorker(undefined);
          }}
          staffList={staff}
          defaultWorkerId={quickTikTokTargetWorker}
          defaultSemanaPago={weekRange.saturdayStr}
          onSaveSingle={async live => {
            await addTikTokLive(live);
          }}
          onSaveMultiple={async lives => {
            await bulkAddTikTokLives(lives);
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

      {/* Modal Asistencia Semanal (6 días) */}
      {isAttendanceModalOpen && selectedAttendanceStaff && (
        <AsistenciaSemanalModal
          isOpen={isAttendanceModalOpen}
          onClose={() => {
            setIsAttendanceModalOpen(false);
            setSelectedAttendanceStaff(null);
          }}
          workerId={selectedAttendanceStaff.id}
          workerName={selectedAttendanceStaff.nombre}
          cargo={selectedAttendanceStaff.rol}
          sueldoBaseSemanal={
            selectedAttendanceStaff.sueldoBaseSemanal !== undefined
              ? Number(selectedAttendanceStaff.sueldoBaseSemanal)
              : 120000
          }
          semanaInicio={weekRange.startStr}
          semanaFin={weekRange.saturdayStr}
          startDateObj={weekRange.start}
          currentAttendance={currentWeekAttendance.find(
            a => a.workerId === selectedAttendanceStaff.id || a.workerName === selectedAttendanceStaff.nombre
          )}
          onSave={async attendanceData => {
            await saveWeeklyAttendance(attendanceData);
            setIsAttendanceModalOpen(false);
            setSelectedAttendanceStaff(null);
          }}
        />
      )}

    </div>
  );
}
