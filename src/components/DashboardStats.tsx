import React from 'react';
import { ProductBatch } from '../types/inventory';
import { calculateDaysRemaining, formatRupiah, getExpiryStatus } from '../utils/fefoHelper';
import { AlertTriangle, TrendingDown, CheckCircle2, Clock, Send, ShieldAlert, Sparkles } from 'lucide-react';

interface DashboardStatsProps {
  batches: ProductBatch[];
  fefoComplianceRate: number;
  onSendBroadcast: () => void;
  onViewCritical: () => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  batches,
  fefoComplianceRate,
  onSendBroadcast,
  onViewCritical,
}) => {
  // Aggregate stats
  let totalStockUnits = 0;
  let totalStockValuation = 0; // Total HPP
  let criticalUnits = 0;
  let criticalLossRisk = 0;
  let warningLossRisk = 0;
  let expiredUnits = 0;
  let expiredLossValue = 0;
  let criticalBatchCount = 0;
  let warningBatchCount = 0;

  batches.forEach(b => {
    if (b.stock <= 0) return;
    const days = calculateDaysRemaining(b.expiryDate);
    const status = getExpiryStatus(days);
    const cost = b.stock * b.costPrice;

    totalStockUnits += b.stock;
    totalStockValuation += cost;

    if (status === 'EXPIRED') {
      expiredUnits += b.stock;
      expiredLossValue += cost;
    } else if (status === 'CRITICAL') {
      criticalUnits += b.stock;
      criticalLossRisk += cost;
      criticalBatchCount += 1;
    } else if (status === 'WARNING') {
      warningLossRisk += cost;
      warningBatchCount += 1;
    }
  });

  const totalAtRisk = criticalLossRisk + expiredLossValue;

  return (
    <div className="space-y-6">
      {/* Critical Early Warning Banner if expired or critical items exist */}
      {(expiredUnits > 0 || criticalBatchCount > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-lg shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-amber-950">
                  Perhatian: Terdapat {criticalBatchCount} Batch Kritis & {expiredUnits > 0 ? `${expiredUnits} Item Kedaluwarsa` : ''}
                </h3>
                <span className="text-xs text-amber-800 font-mono">
                  Potensi Risiko: {formatRupiah(totalAtRisk)}
                </span>
              </div>
              <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                Sesuai prinsip <strong>First Expired, First Out (FEFO)</strong>, segera tempatkan batch ini di bagian paling depan etalase/rak kasir atau terapkan diskon cuci gudang hari ini.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onViewCritical}
              className="px-3.5 py-2 text-xs font-semibold text-amber-950 bg-amber-200 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap"
            >
              Lihat Batch Kritis
            </button>
            <button
              onClick={onSendBroadcast}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim Peringatan WA</span>
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Grid with strict tabular numerals and clean 1px borders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Nilai Kerugian Berisiko */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Potensi Kerugian Berisiko</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral-900 font-mono tabular-nums">
              {formatRupiah(totalAtRisk)}
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1.5">
              <span>{criticalBatchCount} batch H-7</span>
              <span aria-hidden="true">·</span>
              <span className="text-rose-600 font-medium">{expiredUnits} pcs expired</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Kepatuhan FEFO */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Indeks Kepatuhan FEFO</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral-900 font-mono tabular-nums">
              {fefoComplianceRate}%
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-600 mt-1.5">
              <span>SOP Pengeluaran Sesuai ED</span>
              <span aria-hidden="true">·</span>
              <span className="text-neutral-500">Zero Waste</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Stok Batch Kritis */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Batch Butuh Tindakan</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral-900 font-mono tabular-nums">
              {criticalBatchCount + warningBatchCount}{' '}
              <span className="text-sm font-normal text-neutral-500">Batch</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1.5">
              <span>{criticalUnits} unit H-7</span>
              <span aria-hidden="true">·</span>
              <span>{warningBatchCount} batch H-14</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Total Valuasi Stok Toko */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Nilai Stok (HPP)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral-900 font-mono tabular-nums">
              {formatRupiah(totalStockValuation)}
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1.5">
              <span>{totalStockUnits} total unit</span>
              <span aria-hidden="true">·</span>
              <span>{batches.length} batch aktif</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
