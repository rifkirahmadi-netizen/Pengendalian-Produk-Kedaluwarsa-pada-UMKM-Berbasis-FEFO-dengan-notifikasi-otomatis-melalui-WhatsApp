import React from 'react';
import { ProductBatch } from '../types/inventory';
import { calculateDaysRemaining, formatIndoDate, formatRupiah, getExpiryStatus, getStatusMeta } from '../utils/fefoHelper';
import { X, Printer, QrCode, ShieldAlert } from 'lucide-react';

interface PrintableLabelModalProps {
  batch: ProductBatch | null;
  onClose: () => void;
  storeName: string;
}

export const PrintableLabelModal: React.FC<PrintableLabelModalProps> = ({
  batch,
  onClose,
  storeName,
}) => {
  if (!batch) return null;

  const days = calculateDaysRemaining(batch.expiryDate);
  const status = getExpiryStatus(days);
  const meta = getStatusMeta(status);

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-neutral-200 max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header (hidden in print) */}
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between no-print">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">
              Cetak Label Rak Fisik FEFO
            </h3>
            <p className="text-xs text-neutral-500">
              Format stiker rak toko dengan tanggal kedaluwarsa jelas.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Label Area */}
        <div className="p-6">
          <div className="border-4 border-neutral-900 rounded-xl p-5 bg-white text-neutral-900 space-y-4">
            {/* Store & FEFO Tag */}
            <div className="flex items-center justify-between border-b-2 border-neutral-900 pb-2">
              <div className="font-bold text-xs uppercase tracking-wider">
                {storeName}
              </div>
              <div className="font-mono text-xs font-bold bg-neutral-900 text-white px-2 py-0.5 rounded">
                SOP FEFO
              </div>
            </div>

            {/* Product Title */}
            <div>
              <div className="text-lg font-bold leading-tight">
                {batch.productName}
              </div>
              <div className="text-xs font-mono text-neutral-600 mt-0.5">
                Batch: {batch.batchNumber} · SKU: {batch.sku}
              </div>
            </div>

            {/* Huge Expiry Date Callout */}
            <div className="border-2 border-neutral-900 bg-neutral-100 p-3 rounded-lg text-center space-y-0.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                TANGGAL KEDALUWARSA (EXP)
              </div>
              <div className="text-2xl font-mono font-extrabold tracking-tight">
                {formatIndoDate(batch.expiryDate)}
              </div>
              <div className="text-xs font-mono font-bold text-neutral-700">
                {days <= 0 ? '❌ EXPIRED' : `⏳ SISA ${days} HARI`}
              </div>
            </div>

            {/* Shelf Location & Price */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-neutral-200">
              <div>
                <span className="text-neutral-500 block text-[10px]">LOKASI RAK:</span>
                <span className="font-bold">{batch.shelfLocation}</span>
              </div>
              <div className="text-right">
                <span className="text-neutral-500 block text-[10px]">HARGA JUAL:</span>
                <span className="font-bold font-mono text-sm">
                  {batch.discountPercentage > 0 ? (
                    <span className="text-amber-700 font-bold">
                      {formatRupiah(Math.round(batch.sellingPrice * (1 - batch.discountPercentage / 100)))}
                      <span className="text-[10px] block font-normal text-neutral-500">
                        Diskon {batch.discountPercentage}%
                      </span>
                    </span>
                  ) : (
                    formatRupiah(batch.sellingPrice)
                  )}
                </span>
              </div>
            </div>

            {/* Fake Barcode Representation */}
            <div className="pt-2 text-center">
              <div className="h-9 w-full flex items-center justify-center gap-[2px]">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-full ${
                      i % 3 === 0 ? 'w-1 bg-black' : i % 2 === 0 ? 'w-0.5 bg-black' : 'w-[1px] bg-neutral-400'
                    }`}
                  />
                ))}
              </div>
              <div className="font-mono text-[10px] text-neutral-600 tracking-widest mt-1">
                {batch.sku}-{batch.batchNumber}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions (hidden in print) */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between no-print">
          <span className="text-xs text-neutral-500">
            Dapat dicetak pada printer label thermal atau kertas A4.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-neutral-700 hover:bg-neutral-200 rounded-lg transition"
            >
              Tutup
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
