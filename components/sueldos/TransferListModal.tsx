import React, { useState } from 'react';
import { X, Copy, Check, Building, CreditCard, DollarSign } from 'lucide-react';
import { StaffMember } from '../../types';

interface TransferItem {
  workerName: string;
  rut: string;
  banco: string;
  tipoCuenta: string;
  numeroCuenta: string;
  monto: number;
}

interface TransferListModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: TransferItem[];
}

export default function TransferListModal({ isOpen, onClose, items }: TransferListModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  if (!isOpen) return null;

  const handleCopySingle = (item: TransferItem, idx: number) => {
    const text = `Trabajador: ${item.workerName}\nRUT: ${item.rut || 'N/A'}\nBanco: ${item.banco}\nTipo: ${item.tipoCuenta}\nCuenta: ${item.numeroCuenta}\nMonto: $${item.monto.toLocaleString('es-CL')}`;
    navigator.clipboard.writeText(text);
    setCopiedId(String(idx));
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    const allText = items
      .map(
        (i, idx) =>
          `${idx + 1}. ${i.workerName} | RUT: ${i.rut || 'N/A'} | ${i.banco} | ${i.tipoCuenta} N° ${i.numeroCuenta} | $${i.monto.toLocaleString('es-CL')}`
      )
      .join('\n');
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const totalTransfer = items.reduce((acc, i) => acc + (i.monto || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
              <CreditCard size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">Nómina Rápida de Transferencias Bancarias</h3>
              <p className="text-xs text-slate-400 font-medium">Copia y pega datos directos para tu portal bancario</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action bar */}
        <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs font-bold text-slate-700">
            Total a Transferir: <span className="font-black text-slate-900 text-base">${totalTransfer.toLocaleString('es-CL')} CLP</span> ({items.length} Destinatarios)
          </div>

          <button
            onClick={handleCopyAll}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            {copiedAll ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {copiedAll ? '¡Lista Copiada!' : 'Copiar Lista Completa'}
          </button>
        </div>

        {/* Body List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all flex items-center justify-between gap-4 shadow-sm"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 font-black text-[10px] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <p className="font-black text-slate-900 uppercase text-sm">{item.workerName}</p>
                  {item.rut && (
                    <span className="text-[10px] font-bold font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      {item.rut}
                    </span>
                  )}
                </div>
                
                <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="flex items-center gap-1 font-bold text-slate-800">
                    <Building size={13} className="text-slate-400" /> {item.banco || 'Banco Sin Definir'}
                  </span>
                  <span>{item.tipoCuenta || 'Cuenta RUT'}</span>
                  <span>N° <span className="font-mono font-bold text-slate-900">{item.numeroCuenta || 'S/N'}</span></span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-base font-black text-emerald-600">${item.monto.toLocaleString('es-CL')}</p>
                </div>

                <button
                  onClick={() => handleCopySingle(item, idx)}
                  className={`p-2.5 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 ${
                    copiedId === String(idx)
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-300 shadow-inner'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                  title="Copiar datos de este trabajador"
                >
                  {copiedId === String(idx) ? <Check size={14} /> : <Copy size={14} />}
                  <span className="hidden sm:inline">{copiedId === String(idx) ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="py-12 text-center text-slate-400 italic">
              No hay trabajadores con monto a transferir en este periodo.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
