import React, { useState, useMemo } from 'react';
import { ProductBatch, OutboundRecord } from '../types/inventory';
import {
  allocateStockFefo,
  calculateDaysRemaining,
  formatIndoDate,
  formatRupiah,
  getExpiryStatus,
  getStatusMeta,
  sortBatchesByFefo
} from '../utils/fefoHelper';
import {
  ShoppingCart,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Package,
  Layers,
  History,
  ShieldCheck,
  Receipt
} from 'lucide-react';

interface FefoDispatcherProps {
  batches: ProductBatch[];
  onDispatchStock: (
    productId: string,
    quantity: number,
    purpose: 'PENJUALAN_KASIR' | 'PRODUKSI' | 'REDUCE_DAMAGE',
    notes?: string
  ) => void;
  outboundRecords: OutboundRecord[];
}

export const FefoDispatcher: React.FC<FefoDispatcherProps> = ({
  batches,
  onDispatchStock,
  outboundRecords,
}) => {
  // Unique products
  const products = useMemo(() => {
    const map = new Map<string, { id: string; name: string; category: string; totalStock: number }>();
    batches.forEach(b => {
      const existing = map.get(b.productId);
      if (existing) {
        existing.totalStock += b.stock;
      } else {
        map.set(b.productId, {
          id: b.productId,
          name: b.productName,
          category: b.category,
          totalStock: b.stock,
        });
      }
    });
    return Array.from(map.values());
  }, [batches]);

  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || ''
  );
  const [requestQty, setRequestQty] = useState<number>(5);
  const [purpose, setPurpose] = useState<'PENJUALAN_KASIR' | 'PRODUKSI' | 'REDUCE_DAMAGE'>('PENJUALAN_KASIR');
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);

  // Batches for the selected product
  const productBatches = useMemo(() => {
    return batches.filter(b => b.productId === selectedProductId);
  }, [batches, selectedProductId]);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Compute FEFO allocation preview
  const allocationPreview = useMemo(() => {
    if (!productBatches.length || requestQty <= 0) return null;
    return allocateStockFefo(productBatches, requestQty);
  }, [productBatches, requestQty]);

  // Total sales calculation
  const totalAmount = useMemo(() => {
    if (!allocationPreview) return 0;
    return allocationPreview.allocations.reduce((acc, curr) => acc + (curr.quantityTaken * curr.effectivePrice), 0);
  }, [allocationPreview]);

  const handleConfirmDispatch = () => {
    if (!allocationPreview || allocationPreview.fulfilledQuantity <= 0) return;
    onDispatchStock(
      selectedProductId,
      allocationPreview.fulfilledQuantity,
      purpose,
      `Pengeluaran stok otomatis FEFO: ${allocationPreview.allocations.map(a => `${a.batchNumber} (${a.quantityTaken} pcs)`).join(', ')}`
    );

    setDispatchSuccess(
      `Sukses mengeluarkan ${allocationPreview.fulfilledQuantity} unit ${selectedProduct?.name} sesuai prinsip FEFO!`
    );
    setTimeout(() => setDispatchSuccess(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Title & Introduction */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <span>Simulasi Kasir & Pengeluaran Stok Berbasis FEFO</span>
            </h2>
            <p className="text-xs text-neutral-600 mt-1 max-w-2xl leading-relaxed">
              Sistem FEFO secara otomatis mengarahkan kasir / tim gudang untuk mengambil stok dari batch dengan <strong>tanggal kedaluwarsa terdekat</strong>, mencegah penumpukan barang lama di rak belakang.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">Otomatisasi Alokasi FEFO Aktif</span>
          </div>
        </div>
      </div>

      {dispatchSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{dispatchSuccess}</span>
        </div>
      )}

      {/* Main interactive grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form (4 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-neutral-200 space-y-4">
          <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider pb-2 border-b border-neutral-100 flex items-center gap-1.5">
            <ShoppingCart className="w-4 h-4 text-neutral-500" />
            <span>Form Pengeluaran / Penjualan</span>
          </h3>

          {/* Product Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Pilih Produk
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.totalStock} unit tersedia)
                </option>
              ))}
            </select>
          </div>

          {/* Quantity Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-neutral-700">
                Jumlah yang Dikeluarkan / Dijual
              </label>
              <span className="text-xs text-neutral-500 font-mono">
                Total Stok: {selectedProduct?.totalStock || 0}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={selectedProduct?.totalStock || 100}
                value={requestQty}
                onChange={(e) => setRequestQty(Math.max(1, Number(e.target.value)))}
                className="w-full text-sm font-mono font-semibold py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
              />
              {/* Quick increment buttons */}
              <div className="flex gap-1">
                {[1, 5, 10, 20].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRequestQty(val)}
                    className="px-2 py-1.5 text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md font-mono"
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Keperluan Pengeluaran
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as any)}
              className="w-full text-xs py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="PENJUALAN_KASIR">Penjualan Pelanggan (Kasir Toko)</option>
              <option value="PRODUKSI">Pemakaian Bahan Baku / Dapur</option>
              <option value="REDUCE_DAMAGE">Afkir / Pemusnahan Produk Rusak</option>
            </select>
          </div>

          {/* Available Batches Breakdown preview for this product */}
          <div className="pt-2">
            <span className="text-xs font-medium text-neutral-500 block mb-2">
              Urutan Batch di Toko ({productBatches.length} batch terdaftar):
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {sortBatchesByFefo(productBatches).map((b, idx) => {
                const days = calculateDaysRemaining(b.expiryDate);
                const status = getExpiryStatus(days);
                const meta = getStatusMeta(status);

                return (
                  <div
                    key={b.id}
                    className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                      idx === 0
                        ? 'border-emerald-300 bg-emerald-50/50'
                        : 'border-neutral-200 bg-neutral-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-neutral-700">
                          #{idx + 1}
                        </span>
                        <span className="font-mono text-neutral-900 font-semibold">{b.batchNumber}</span>
                        {idx === 0 && (
                          <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-medium">
                            Prioritas 1
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        ED: {formatIndoDate(b.expiryDate)} ({days <= 0 ? 'Expired' : `${days} hari lagi`}) · {b.shelfLocation}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-neutral-800">{b.stock}</span>
                      <span className="text-neutral-500 ml-0.5">{b.unit}</span>
                      {b.discountPercentage > 0 && (
                        <div className="text-[10px] text-amber-700 font-semibold">
                          Diskon {b.discountPercentage}%
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: FEFO Real-time Allocation Result (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-neutral-200 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Hasil Alokasi FEFO Otomatis</span>
              </h3>
              <span className="text-xs text-neutral-500">
                Instruksi Pengambilan Fisik
              </span>
            </div>

            {/* Allocation breakdown */}
            {allocationPreview && allocationPreview.allocations.length > 0 ? (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-neutral-600">
                  Untuk memenuhi <strong>{requestQty} {selectedProduct?.name}</strong>, sistem FEFO menginstruksikan pengambilan dari batch berikut:
                </p>

                <div className="space-y-2">
                  {allocationPreview.allocations.map((item, idx) => (
                    <div
                      key={item.batchId}
                      className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-emerald-600 text-white rounded-full text-xs font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-neutral-900 text-xs font-mono">
                            {item.batchNumber}
                          </span>
                          <span className="text-xs text-neutral-500">
                            (ED: {formatIndoDate(item.expiryDate)})
                          </span>
                        </div>
                        <div className="text-xs text-neutral-600 flex items-center gap-1.5 pl-7">
                          <span>📍 Ambil di: <strong>{item.shelfLocation}</strong></span>
                        </div>
                      </div>

                      <div className="text-right pl-7 sm:pl-0">
                        <div className="text-sm font-bold text-emerald-700 font-mono">
                          Ambil: {item.quantityTaken} unit
                        </div>
                        <div className="text-xs text-neutral-500 font-mono">
                          {item.discountPercentage > 0 ? (
                            <span>
                              <s className="text-neutral-400">{formatRupiah(item.sellingPrice)}</s>{' '}
                              <strong className="text-amber-700">{formatRupiah(item.effectivePrice)}</strong>/unit
                            </span>
                          ) : (
                            <span>{formatRupiah(item.sellingPrice)}/unit</span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          Sisa batch nanti: {item.remainingStockAfter} unit
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {allocationPreview.shortage > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Peringatan: Stok kurang {allocationPreview.shortage} unit. Hanya dapat memenuhi {allocationPreview.fulfilledQuantity} unit.
                    </span>
                  </div>
                )}

                {/* Subtotal & Confirmation */}
                <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center justify-between mt-4">
                  <div>
                    <span className="text-xs text-neutral-500 block">Total Nilai Transaksi:</span>
                    <span className="text-lg font-bold text-neutral-900 font-mono">
                      {formatRupiah(totalAmount)}
                    </span>
                  </div>
                  <button
                    onClick={handleConfirmDispatch}
                    disabled={allocationPreview.fulfilledQuantity <= 0}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 rounded-lg transition-colors shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Konfirmasi Pengeluaran Stok (FEFO)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-neutral-400 text-xs">
                Pilih produk dan masukkan jumlah yang ingin dikeluarkan.
              </div>
            )}
          </div>

          {/* Audit Rule explanation */}
          <div className="text-[11px] text-neutral-500 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Kepatuhan SOP Toko:</strong> Sistem secara otomatis mengunci alokasi agar kasir tidak dapat melompati batch terlama, meminimalisir risiko barang basi/kedaluwarsa di etalase.
            </span>
          </div>
        </div>
      </div>

      {/* Outbound Transaction History Log */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200">
        <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <History className="w-4 h-4 text-neutral-500" />
          <span>Riwayat Transaksi Pengeluaran Stok Terakhir</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 font-medium uppercase tracking-wider border-b border-neutral-200">
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3">Produk</th>
                <th className="py-2.5 px-3">Jumlah</th>
                <th className="py-2.5 px-3">Batch Yang Ditarik</th>
                <th className="py-2.5 px-3">Keperluan</th>
                <th className="py-2.5 px-3 text-right">Total Transaksi</th>
                <th className="py-2.5 px-3 text-center">Status SOP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-neutral-700">
              {outboundRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-neutral-400">
                    Belum ada riwayat pengeluaran stok.
                  </td>
                </tr>
              ) : (
                outboundRecords.slice(0, 5).map(record => (
                  <tr key={record.id} className="hover:bg-neutral-50">
                    <td className="py-2.5 px-3 font-mono text-neutral-500">
                      {new Date(record.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-neutral-900">
                      {record.productName}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      {record.requestedQuantity} pcs
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {record.allocations.map((a, i) => (
                          <span key={i} className="font-mono text-[11px] bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-800">
                            {a.batchNumber} ({a.quantityTaken})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-neutral-600">
                        {record.purpose === 'PENJUALAN_KASIR' ? 'Penjualan Kasir' : record.purpose}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900">
                      {formatRupiah(record.totalAmount)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        <CheckCircle className="w-3 h-3" />
                        FEFO Patuh
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
