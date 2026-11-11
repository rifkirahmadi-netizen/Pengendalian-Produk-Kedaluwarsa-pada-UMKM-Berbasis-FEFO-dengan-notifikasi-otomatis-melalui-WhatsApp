import React, { useState } from 'react';
import { ProductBatch } from '../types/inventory';
import { calculateDaysRemaining, formatIndoDate, formatRupiah, getExpiryStatus } from '../utils/fefoHelper';
import { sanitizeWhatsAppPhone } from '../utils/whatsappHelper';
import {
  Sparkles,
  Tag,
  Gift,
  RotateCcw,
  ChefHat,
  Send,
  CheckCircle,
  TrendingDown,
  ArrowRight
} from 'lucide-react';

interface ActionRecommendationsProps {
  batches: ProductBatch[];
  onApplyDiscount: (batchId: string, discount: number) => void;
  onBulkApplyDiscounts: (updates: { batchId: string; discount: number }[]) => void;
  storeName: string;
}

export const ActionRecommendations: React.FC<ActionRecommendationsProps> = ({
  batches,
  onApplyDiscount,
  onBulkApplyDiscounts,
  storeName,
}) => {
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  // Filter batches nearing expiration
  const criticalBatches = batches.filter(
    b => b.stock > 0 && calculateDaysRemaining(b.expiryDate) <= 7 && calculateDaysRemaining(b.expiryDate) > 0
  );

  const warningBatches = batches.filter(
    b => b.stock > 0 && calculateDaysRemaining(b.expiryDate) > 7 && calculateDaysRemaining(b.expiryDate) <= 14
  );

  // Total saved if discounted vs 100% loss
  const totalCriticalLoss = criticalBatches.reduce((a, b) => a + (b.stock * b.costPrice), 0);

  // Bulk apply recommended markdown
  const handleApplyAllRecommendedMarkdowns = () => {
    const updates: { batchId: string; discount: number }[] = [];
    
    // 50% for critical (<7 days)
    criticalBatches.forEach(b => {
      updates.push({ batchId: b.id, discount: 50 });
    });

    // 20% for warning (8-14 days)
    warningBatches.forEach(b => {
      updates.push({ batchId: b.id, discount: 20 });
    });

    onBulkApplyDiscounts(updates);
    setAppliedNotification(`Sukses menerapkan diskon bertahap pada ${updates.length} batch produk!`);
    setTimeout(() => setAppliedNotification(null), 4000);
  };

  // WhatsApp template to supplier for consignment return
  const generateSupplierReturnMessage = (batch: ProductBatch) => {
    return encodeURIComponent(`Halo Tim ${batch.supplierName || 'Supplier'},
Saya dari ${storeName}.

Mohon konfirmasi jadwal kanvas/retur untuk produk konsinyasi yang mendekati tanggal kedaluwarsa sesuai perjanjian retur:
• Produk: *${batch.productName}*
• Batch: *${batch.batchNumber}* (SKU: ${batch.sku})
• Tanggal Kedaluwarsa: *${formatIndoDate(batch.expiryDate)}*
• Sisa Stok di Toko: *${batch.stock} ${batch.unit}*

Mohon bantuannya untuk proses penggantian batch baru atau nota kredit saat kunjungan berikutnya. Terima kasih.`);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span>Strategi Penyelamatan Stok & Zero Waste UMKM</span>
            </h2>
            <p className="text-xs text-neutral-600 mt-1 max-w-2xl leading-relaxed">
              Daripada membiarkan produk kedaluwarsa menjadi 100% kerugian finansial, sistem memberikan rekomendasi aksi cepat: <strong>Diskon Bertahap (Markdown)</strong>, <strong>Bundling Promo</strong>, dan <strong>Retur Konsinyasi</strong>.
            </p>
          </div>
          {(criticalBatches.length > 0 || warningBatches.length > 0) && (
            <button
              onClick={handleApplyAllRecommendedMarkdowns}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors whitespace-nowrap shadow-sm"
            >
              <Tag className="w-4 h-4" />
              <span>Terapkan Diskon Bertahap Semua Batch</span>
            </button>
          )}
        </div>
      </div>

      {appliedNotification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{appliedNotification}</span>
        </div>
      )}

      {/* Grid of 4 Strategies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strategy 1: Diskon Bertahap (Markdown Automation) */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  1. Diskon Bertahap (Markdown)
                </h3>
                <span className="text-[11px] text-neutral-500">Mencegah total write-off kerugian</span>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              {criticalBatches.length + warningBatches.length} Batch Sasaran
            </span>
          </div>

          <p className="text-xs text-neutral-600 leading-relaxed">
            Menjual produk dengan margin impas (HPP) atau diskon 20-50% jauh lebih menguntungkan bagi arus kas UMKM dibanding membuang produk saat kedaluwarsa.
          </p>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {criticalBatches.concat(warningBatches).length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                Tidak ada produk yang perlu didiskon saat ini. Semua stok aman!
              </div>
            ) : (
              criticalBatches.concat(warningBatches).map(batch => {
                const days = calculateDaysRemaining(batch.expiryDate);
                const recommendedDiscount = days <= 7 ? 50 : 20;

                return (
                  <div
                    key={batch.id}
                    className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-neutral-900">
                        {batch.productName}
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono">
                        ED: {formatIndoDate(batch.expiryDate)} (Sisa {days} hari) · Stok: {batch.stock} {batch.unit}
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                        Harga Normal: {formatRupiah(batch.sellingPrice)} &rarr; Rekomendasi: Diskon {recommendedDiscount}%
                      </div>
                    </div>
                    <div>
                      {batch.discountPercentage === recommendedDiscount ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                          Diskon Aktif {batch.discountPercentage}%
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            onApplyDiscount(batch.id, recommendedDiscount);
                            setAppliedNotification(`Diskon ${recommendedDiscount}% aktif untuk ${batch.productName}!`);
                            setTimeout(() => setAppliedNotification(null), 3000);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-md transition"
                        >
                          Terapkan {recommendedDiscount}%
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Strategy 2: Retur Konsinyasi ke Supplier */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  2. Retur Konsinyasi Supplier
                </h3>
                <span className="text-[11px] text-neutral-500">Klaim jaminan ganti produk baru</span>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              SOP Kanvas
            </span>
          </div>

          <p className="text-xs text-neutral-600 leading-relaxed">
            Banyak distributor roti, susu, dan sosis UMKM memiliki perjanjian retur H-2 sampai H-7 sebelum kedaluwarsa. Kirimkan pesan konfirmasi via WhatsApp ke sales kanvas langsung.
          </p>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {batches.filter(b => b.supplierContact && calculateDaysRemaining(b.expiryDate) <= 14).map(batch => {
              const days = calculateDaysRemaining(batch.expiryDate);
              const waLink = `https://wa.me/${sanitizeWhatsAppPhone(batch.supplierContact!)}?text=${generateSupplierReturnMessage(batch)}`;

              return (
                <div
                  key={batch.id}
                  className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-neutral-900">
                      {batch.productName}
                    </div>
                    <div className="text-[11px] text-neutral-500 font-mono">
                      Supplier: <strong>{batch.supplierName}</strong> ({batch.supplierContact})
                    </div>
                    <div className="text-[11px] text-neutral-500 font-mono">
                      Stok retur: {batch.stock} {batch.unit} · ED: {formatIndoDate(batch.expiryDate)} ({days} hari)
                    </div>
                  </div>
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition"
                  >
                    <Send className="w-3 h-3 text-emerald-600" />
                    <span>Chat WA Sales</span>
                  </a>
                </div>
              );
            })}
          </div>
        </div>

        {/* Strategy 3: Bundling & Hadiah Pembelian */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                3. Bundling "Beli A Gratis B"
              </h3>
              <span className="text-[11px] text-neutral-500">Meningkatkan rata-rata belanja toko</span>
            </div>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Jadikan produk mendekati ED (seperti susu atau roti) sebagai hadiah gratis untuk pembelian produk margin tinggi (contoh: "Beli Kopi/Susu Formula Rp 100.000 Gratis Roti Tawar Gandum").
          </p>
          <div className="p-3 bg-purple-50/60 rounded-lg border border-purple-200 text-xs text-purple-900 space-y-1">
            <div className="font-bold">Ide Bundle Efektif Pekan Ini:</div>
            <ul className="list-disc pl-4 space-y-1 text-purple-800">
              <li>Paket Sarapan Hemat: Beli Susu UHT 1L + Potongan Roti Gandum Diskon 40%</li>
              <li>Paket Frozen Komplit: Beli Sosis Sapi + Gratis Sosis Siap Makan</li>
            </ul>
          </div>
        </div>

        {/* Strategy 4: Pengolahan Bahan Dapur (Kitchen Repurposing) */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ChefHat className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                4. Alokasi Produksi & Dapur Olahan
              </h3>
              <span className="text-[11px] text-neutral-500">Untuk UMKM Bakery, Kafe, & Rumah Makan</span>
            </div>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Jika UMKM memiliki dapur kafe/resto sendiri, alihkan bahan baku sebelum ED ke menu olahan langsung (Fresh-to-Cook) dengan nilai jual baru.
          </p>
          <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200 text-xs text-emerald-900 space-y-1">
            <div className="font-bold">Contoh Konversi Nilai:</div>
            <ul className="list-disc pl-4 space-y-1 text-emerald-800">
              <li>Roti Tawar H-2 &rarr; Diolah jadi <strong>Roti Kering Bagelen / Bread Pudding</strong> (Tahan 30 hari lagi)</li>
              <li>Susu UHT H-5 &rarr; Dijadikan bahan baku <strong>Saus Keju Pasta / Dessert Milk</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
