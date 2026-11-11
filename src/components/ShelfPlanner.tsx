import React, { useState } from 'react';
import { ProductBatch } from '../types/inventory';
import { calculateDaysRemaining, formatIndoDate, formatRupiah, getExpiryStatus, getStatusMeta } from '../utils/fefoHelper';
import { Printer, MapPin, ArrowRight, LayoutGrid, CheckCircle2, QrCode } from 'lucide-react';

interface ShelfPlannerProps {
  batches: ProductBatch[];
  onPrintBatchLabel: (batch: ProductBatch) => void;
}

export const ShelfPlanner: React.FC<ShelfPlannerProps> = ({
  batches,
  onPrintBatchLabel,
}) => {
  const [selectedShelf, setSelectedShelf] = useState<string>('ALL');

  // Extract unique shelf zones
  const shelfZones = Array.from(
    new Set(batches.map(b => b.shelfLocation.split('(')[0].trim()))
  );

  const filteredBatches = selectedShelf === 'ALL'
    ? batches
    : batches.filter(b => b.shelfLocation.includes(selectedShelf));

  // Group by product to show Front (Old ED) vs Back (New ED) shelf placement
  const productsGrouped = filteredBatches.reduce((acc, curr) => {
    if (!acc[curr.productId]) {
      acc[curr.productId] = [];
    }
    acc[curr.productId].push(curr);
    return acc;
  }, {} as Record<string, ProductBatch[]>);

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-emerald-600" />
              <span>Panduan Tata Letak Rak Fisik FEFO & Cetak Label</span>
            </h2>
            <p className="text-xs text-neutral-600 mt-1 max-w-2xl leading-relaxed">
              Prinsip FEFO mewajibkan penataan barang di rak secara <strong>Depan-ke-Belakang</strong>: Produk dengan kedaluwarsa paling dekat wajib berada di baris terdepan jangkauan pembeli.
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors whitespace-nowrap shadow-sm no-print"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Seluruh Label Rak</span>
          </button>
        </div>
      </div>

      {/* Shelf Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2 no-print">
        <button
          onClick={() => setSelectedShelf('ALL')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            selectedShelf === 'ALL'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          Semua Rak Toko
        </button>
        {shelfZones.map(zone => (
          <button
            key={zone}
            onClick={() => setSelectedShelf(zone)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              selectedShelf === zone
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
            }`}
          >
            {zone}
          </button>
        ))}
      </div>

      {/* Visual Shelf Layout Representation */}
      <div className="space-y-4">
        {Object.entries(productsGrouped).map(([prodId, prodBatches]) => {
          // Sort by FEFO (Earliest ED first)
          const sorted = [...prodBatches].sort(
            (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
          );
          const firstBatch = sorted[0];

          return (
            <div
              key={prodId}
              className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4"
            >
              {/* Product Header */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    {firstBatch.productName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono mt-0.5">
                    <span>SKU: {firstBatch.sku}</span>
                    <span aria-hidden="true">·</span>
                    <span>Kategori: {firstBatch.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>Total Stok: {prodBatches.reduce((a, b) => a + b.stock, 0)} {firstBatch.unit}</span>
                  </div>
                </div>
                <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                  {prodBatches.length} Batch Aktif
                </span>
              </div>

              {/* Front to Back Visual Arrangement */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 mb-2">
                  <span className="flex items-center gap-1.5 text-amber-700">
                    <span>➡️ POSISI PALING DEPAN (Jangkauan Tangan Pembeli)</span>
                  </span>
                  <span className="text-neutral-400">
                    POSISI BELAKANG (Stok Baru) ⬅️
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {sorted.map((batch, index) => {
                    const days = calculateDaysRemaining(batch.expiryDate);
                    const status = getExpiryStatus(days);
                    const meta = getStatusMeta(status);
                    const isFrontRow = index === 0;

                    return (
                      <div
                        key={batch.id}
                        className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                          isFrontRow
                            ? 'border-emerald-500 ring-2 ring-emerald-500/10 bg-emerald-50/20'
                            : 'border-neutral-200 bg-neutral-50/50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-mono text-[11px] font-bold text-neutral-500">
                              Posisi Baris #{index + 1}
                            </span>
                            <span className={`text-[11px] px-2 py-0.2 rounded font-medium ${meta.badgeClass}`}>
                              {meta.label}
                            </span>
                          </div>

                          <div className="font-mono font-bold text-neutral-900 text-xs">
                            {batch.batchNumber}
                          </div>
                          
                          <div className="text-xs font-mono font-bold text-neutral-800 mt-1">
                            ED: {formatIndoDate(batch.expiryDate)}
                          </div>
                          <div className={`text-xs font-mono font-semibold ${meta.textClass}`}>
                            {days <= 0 ? 'Sudah Kedaluwarsa' : `Sisa ${days} hari lagi`}
                          </div>

                          <div className="flex items-center gap-1 text-[11px] text-neutral-500 mt-2">
                            <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                            <span className="truncate">{batch.shelfLocation}</span>
                          </div>
                        </div>

                        <div className="pt-3 mt-3 border-t border-neutral-200/60 flex items-center justify-between">
                          <span className="font-mono text-xs font-semibold text-neutral-900">
                            Stok: {batch.stock} {batch.unit}
                          </span>
                          <button
                            onClick={() => onPrintBatchLabel(batch)}
                            className="flex items-center gap-1 text-[11px] font-medium text-neutral-700 hover:text-neutral-900 bg-white hover:bg-neutral-100 px-2 py-1 rounded border border-neutral-200 shadow-2xs transition no-print"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Label Rak</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Printable Shelf Label Sticker Sheet Section (Shows live sticker previews) */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <div>
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-emerald-600" />
              <span>Preview Label Stiker Rak FEFO Toko (Format Siap Cetak)</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Label ini dapat dicetak dan ditempelkan pada wadah rak atau produk untuk kemudahan pemantauan visual staf.
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 text-xs font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors no-print"
          >
            Cetak Label Halaman Ini
          </button>
        </div>

        {/* Sticker Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {batches.slice(0, 8).map(batch => {
            const days = calculateDaysRemaining(batch.expiryDate);
            const status = getExpiryStatus(days);
            const meta = getStatusMeta(status);

            return (
              <div
                key={batch.id}
                className="border-2 border-dashed border-neutral-300 rounded-lg p-3 bg-white space-y-2 text-xs"
              >
                <div className="flex items-center justify-between border-b border-neutral-100 pb-1">
                  <span className="font-bold text-[10px] text-emerald-800 tracking-wider">
                    FEFO TAG
                  </span>
                  <span className={`text-[9px] font-mono font-bold px-1 rounded ${meta.badgeClass}`}>
                    {meta.label}
                  </span>
                </div>

                <div>
                  <div className="font-bold text-neutral-900 text-[11px] truncate leading-tight">
                    {batch.productName}
                  </div>
                  <div className="font-mono text-[10px] text-neutral-500">
                    {batch.batchNumber} · SKU: {batch.sku}
                  </div>
                </div>

                <div className="bg-neutral-50 p-1.5 rounded border border-neutral-200 text-center">
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                    EXPIRY DATE
                  </div>
                  <div className="text-sm font-mono font-bold text-neutral-900 tracking-tight">
                    {formatIndoDate(batch.expiryDate)}
                  </div>
                  <div className={`text-[10px] font-mono font-bold ${meta.textClass}`}>
                    {days <= 0 ? 'EXPIRED' : `${days} HARI LAGI`}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-1">
                  <span>Rak: {batch.shelfLocation.split('(')[0]}</span>
                  <span className="font-bold text-neutral-800 font-mono">
                    {batch.discountPercentage > 0 ? `Diskon ${batch.discountPercentage}%` : formatRupiah(batch.sellingPrice)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
