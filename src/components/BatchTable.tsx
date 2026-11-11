import React, { useState, useMemo } from 'react';
import { ProductBatch, ExpiryStatus } from '../types/inventory';
import {
  calculateDaysRemaining,
  formatIndoDate,
  formatRupiah,
  getExpiryStatus,
  getStatusMeta,
  sortBatchesByFefo
} from '../utils/fefoHelper';
import {
  Search,
  Filter,
  Send,
  Printer,
  Tag,
  AlertCircle,
  Trash2,
  MapPin,
  Clock,
  ArrowUpDown
} from 'lucide-react';

interface BatchTableProps {
  batches: ProductBatch[];
  onSendSingleWhatsApp: (batch: ProductBatch) => void;
  onUpdateDiscount: (batchId: string, discount: number) => void;
  onRemoveOrReturBatch: (batchId: string) => void;
  onPrintLabel: (batch: ProductBatch) => void;
  onOpenAddBatch: () => void;
  initialFilter?: string;
}

export const BatchTable: React.FC<BatchTableProps> = ({
  batches,
  onSendSingleWhatsApp,
  onUpdateDiscount,
  onRemoveOrReturBatch,
  onPrintLabel,
  onOpenAddBatch,
  initialFilter = 'ALL',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'FEFO' | 'STOCK' | 'NAME'>('FEFO');

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    batches.forEach(b => {
      if (b.category) set.add(b.category);
    });
    return Array.from(set);
  }, [batches]);

  // Filter and sort
  const processedBatches = useMemo(() => {
    let result = batches.filter(batch => {
      // Search
      const query = searchQuery.toLowerCase();
      const matchSearch =
        batch.productName.toLowerCase().includes(query) ||
        batch.batchNumber.toLowerCase().includes(query) ||
        batch.sku.toLowerCase().includes(query) ||
        batch.shelfLocation.toLowerCase().includes(query);

      if (!matchSearch) return false;

      // Status
      const days = calculateDaysRemaining(batch.expiryDate);
      const status = getExpiryStatus(days);

      if (statusFilter === 'CRITICAL_EXPIRED') {
        if (status !== 'CRITICAL' && status !== 'EXPIRED') return false;
      } else if (statusFilter === 'WARNING') {
        if (status !== 'WARNING') return false;
      } else if (statusFilter === 'ATTENTION') {
        if (status !== 'ATTENTION') return false;
      } else if (statusFilter === 'SAFE') {
        if (status !== 'SAFE') return false;
      }

      // Category
      if (categoryFilter !== 'ALL' && batch.category !== categoryFilter) {
        return false;
      }

      return true;
    });

    if (sortBy === 'FEFO') {
      result = sortBatchesByFefo(result);
    } else if (sortBy === 'STOCK') {
      result.sort((a, b) => b.stock - a.stock);
    } else if (sortBy === 'NAME') {
      result.sort((a, b) => a.productName.localeCompare(b.productName));
    }

    return result;
  }, [batches, searchQuery, statusFilter, categoryFilter, sortBy]);

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      {/* Top Controls: Search, Filters & Tabular Sort */}
      <div className="p-4 sm:p-5 border-b border-neutral-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari produk, kode batch, SKU, atau lokasi rak..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs text-neutral-900 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white transition"
          />
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter('CRITICAL_EXPIRED')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                statusFilter === 'CRITICAL_EXPIRED'
                  ? 'bg-white text-red-700 shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Kritis / Expired
            </button>
            <button
              onClick={() => setStatusFilter('WARNING')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                statusFilter === 'WARNING'
                  ? 'bg-white text-amber-700 shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              H-14
            </button>
            <button
              onClick={() => setStatusFilter('ATTENTION')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                statusFilter === 'ATTENTION'
                  ? 'bg-white text-yellow-700 shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              H-30
            </button>
            <button
              onClick={() => setStatusFilter('SAFE')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                statusFilter === 'SAFE'
                  ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Aman
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs text-neutral-700 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="ALL">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Sort selection */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 pl-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-1 px-2 text-xs text-neutral-700 bg-white border border-neutral-200 rounded-md focus:outline-none"
            >
              <option value="FEFO">Urutan FEFO (ED Terdekat)</option>
              <option value="STOCK">Stok Terbanyak</option>
              <option value="NAME">Nama Produk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-neutral-50/80 text-neutral-500 font-medium uppercase tracking-wider border-b border-neutral-200">
              <th className="py-3 px-4 w-12 text-center">FEFO</th>
              <th className="py-3 px-4">Nama Produk & Batch</th>
              <th className="py-3 px-4">Kategori & Lokasi Rak</th>
              <th className="py-3 px-4 text-center">Kedaluwarsa (ED)</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Stok</th>
              <th className="py-3 px-4 text-right">Nilai Risiko</th>
              <th className="py-3 px-4 text-center">Diskon FEFO</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 text-neutral-700">
            {processedBatches.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-neutral-400">
                  <div className="max-w-xs mx-auto space-y-2">
                    <p className="text-sm font-medium text-neutral-600">Tidak ada batch stok yang sesuai.</p>
                    <p className="text-xs text-neutral-400">Ubah filter pencarian atau tambahkan batch produk baru.</p>
                    <button
                      onClick={onOpenAddBatch}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                    >
                      + Tambah Batch Sekarang
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              processedBatches.map((batch, index) => {
                const days = calculateDaysRemaining(batch.expiryDate);
                const status = getExpiryStatus(days);
                const meta = getStatusMeta(status);
                const totalRisk = batch.stock * batch.costPrice;

                return (
                  <tr
                    key={batch.id}
                    className={`hover:bg-neutral-50/70 transition-colors ${
                      status === 'EXPIRED' ? 'bg-rose-50/30' : status === 'CRITICAL' ? 'bg-red-50/20' : ''
                    }`}
                  >
                    {/* FEFO Priority Rank */}
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono text-xs font-bold text-neutral-500">
                        #{index + 1}
                      </span>
                    </td>

                    {/* Product & Batch Info */}
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-semibold text-neutral-900">
                          {batch.productName}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono mt-0.5">
                          <span>{batch.batchNumber}</span>
                          <span aria-hidden="true">·</span>
                          <span>SKU: {batch.sku}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category & Shelf Location */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="text-neutral-700 font-medium block">
                          {batch.category}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-neutral-500">
                          <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{batch.shelfLocation}</span>
                        </div>
                      </div>
                    </td>

                    {/* Expiry Date & Days Remaining */}
                    <td className="py-3 px-4 text-center">
                      <div className="font-mono font-medium text-neutral-900">
                        {formatIndoDate(batch.expiryDate)}
                      </div>
                      <div className={`text-xs font-mono font-semibold mt-0.5 ${meta.textClass}`}>
                        {days <= 0
                          ? `Lewat ${Math.abs(days)} hari`
                          : days === 0
                          ? 'Hari Ini!'
                          : `Sisa ${days} hari`}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${meta.badgeClass}`}>
                        {meta.label}
                      </span>
                    </td>

                    {/* Stock Available */}
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono font-bold text-neutral-900 text-sm tabular-nums">
                        {batch.stock}
                      </span>
                      <span className="text-xs text-neutral-500 ml-1">
                        {batch.unit}
                      </span>
                    </td>

                    {/* Risk Value (Stock * HPP) */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-neutral-900">
                      {formatRupiah(totalRisk)}
                    </td>

                    {/* Discount Editor */}
                    <td className="py-3 px-4 text-center">
                      <select
                        value={batch.discountPercentage}
                        onChange={(e) => onUpdateDiscount(batch.id, Number(e.target.value))}
                        className={`text-xs py-1 px-1.5 font-mono font-medium rounded border ${
                          batch.discountPercentage > 0
                            ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold'
                            : 'bg-white border-neutral-200 text-neutral-700'
                        }`}
                        title="Terapkan diskon FEFO untuk mempercepat perputaran"
                      >
                        <option value={0}>Normal (0%)</option>
                        <option value={10}>Diskon 10%</option>
                        <option value={20}>Diskon 20%</option>
                        <option value={30}>Diskon 30%</option>
                        <option value={40}>Diskon 40%</option>
                        <option value={50}>Diskon 50%</option>
                        <option value={70}>Diskon 70%</option>
                      </select>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* WhatsApp single alert */}
                        <button
                          onClick={() => onSendSingleWhatsApp(batch)}
                          title="Kirim Notifikasi Peringatan via WhatsApp"
                          className="p-1.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>

                        {/* Print Shelf Label */}
                        <button
                          onClick={() => onPrintLabel(batch)}
                          title="Cetak Label Tag Rak FEFO"
                          className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Action: Pull / Return */}
                        <button
                          onClick={() => onRemoveOrReturBatch(batch.id)}
                          title={status === 'EXPIRED' ? 'Tarik Barang Kedaluwarsa dari Rak' : 'Retur / Hapus Batch'}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Summary */}
      <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-2">
        <div className="flex items-center gap-2">
          <span>Menampilkan <strong>{processedBatches.length}</strong> dari {batches.length} batch</span>
          <span aria-hidden="true">·</span>
          <span>Sistem FEFO memprioritaskan urutan kedaluwarsa terdekat</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> Kritis (&le;7h)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> Peringatan (8-14h)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Aman (&gt;30h)
          </span>
        </div>
      </div>
    </div>
  );
};
