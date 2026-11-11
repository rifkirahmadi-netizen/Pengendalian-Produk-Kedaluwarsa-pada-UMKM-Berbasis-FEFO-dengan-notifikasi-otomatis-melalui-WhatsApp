import { ProductBatch, ExpiryStatus, FefoAllocationItem } from '../types/inventory';

// Current reference date (defaults to today or simulated business date)
export function getReferenceDate(): Date {
  return new Date();
}

/**
 * Calculate difference in whole days between today and expiry date.
 * Positive = remaining days until expiry.
 * 0 = expires today.
 * Negative = already expired.
 */
export function calculateDaysRemaining(expiryDateStr: string, refDate: Date = getReferenceDate()): number {
  const [year, month, day] = expiryDateStr.split('-').map(Number);
  const expiry = new Date(year, month - 1, day);
  
  const today = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Determine classification status based on days remaining.
 */
export function getExpiryStatus(daysRemaining: number): ExpiryStatus {
  if (daysRemaining <= 0) return 'EXPIRED';
  if (daysRemaining <= 7) return 'CRITICAL';
  if (daysRemaining <= 14) return 'WARNING';
  if (daysRemaining <= 30) return 'ATTENTION';
  return 'SAFE';
}

export interface ExpiryStatusMeta {
  label: string;
  badgeClass: string;
  textClass: string;
  borderClass: string;
  actionAdvice: string;
}

export function getStatusMeta(status: ExpiryStatus): ExpiryStatusMeta {
  switch (status) {
    case 'EXPIRED':
      return {
        label: 'Kedaluwarsa',
        badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
        textClass: 'text-rose-600 dark:text-rose-400',
        borderClass: 'border-rose-300 dark:border-rose-900',
        actionAdvice: 'Segera tarik dari rak & retur/musnahkan untuk mencegah komplain konsumen.'
      };
    case 'CRITICAL':
      return {
        label: 'Kritis (H-7)',
        badgeClass: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300',
        textClass: 'text-red-600 dark:text-red-400',
        borderClass: 'border-red-300 dark:border-red-900',
        actionAdvice: 'Prioritas FEFO Utama! Obral cepat, diskon 40-50%, atau jadikan bundle gratis.'
      };
    case 'WARNING':
      return {
        label: 'Peringatan (H-14)',
        badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
        textClass: 'text-amber-600 dark:text-amber-400',
        borderClass: 'border-amber-300 dark:border-amber-900',
        actionAdvice: 'Letakkan di rak paling depan. Pasang promo diskon 15-25% atau tawarkan ke pelanggan tetap.'
      };
    case 'ATTENTION':
      return {
        label: 'Perhatian (H-30)',
        badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300',
        textClass: 'text-yellow-600 dark:text-yellow-400',
        borderClass: 'border-yellow-300 dark:border-yellow-900',
        actionAdvice: 'Pastikan display mengikuti FEFO (stok lama di depan, stok baru di belakang).'
      };
    case 'SAFE':
    default:
      return {
        label: 'Aman (>30 Hari)',
        badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
        textClass: 'text-emerald-600 dark:text-emerald-400',
        borderClass: 'border-emerald-300 dark:border-emerald-900',
        actionAdvice: 'Kondisi stok prima. Lakukan penyimpanan sesuai standar suhu dan kelembaban.'
      };
  }
}

/**
 * Sort batches strictly according to FEFO (Earliest Expired first).
 */
export function sortBatchesByFefo(batches: ProductBatch[]): ProductBatch[] {
  return [...batches].sort((a, b) => {
    // 1. Primary: Expiration date ascending
    const timeA = new Date(a.expiryDate).getTime();
    const timeB = new Date(b.expiryDate).getTime();
    if (timeA !== timeB) {
      return timeA - timeB;
    }
    // 2. Secondary: Received date ascending (FIFO fallback)
    const recvA = new Date(a.receivedDate).getTime();
    const recvB = new Date(b.receivedDate).getTime();
    return recvA - recvB;
  });
}

/**
 * Format IDR Rupiah
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format date into Indonesian readable format (e.g. 15 Nov 2026)
 */
export function formatIndoDate(dateStr: string): string {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Allocate stock according to FEFO rules
 */
export function allocateStockFefo(
  productBatches: ProductBatch[],
  quantityNeeded: number
): {
  allocations: FefoAllocationItem[];
  fulfilledQuantity: number;
  shortage: number;
} {
  // Filter batches with stock > 0, then sort by FEFO
  const availableBatches = sortBatchesByFefo(
    productBatches.filter(b => b.stock > 0)
  );

  const allocations: FefoAllocationItem[] = [];
  let remainingNeeded = quantityNeeded;

  for (const batch of availableBatches) {
    if (remainingNeeded <= 0) break;

    const qtyToTake = Math.min(batch.stock, remainingNeeded);
    const daysRemaining = calculateDaysRemaining(batch.expiryDate);
    const discountMultiplier = 1 - (batch.discountPercentage / 100);
    const effectivePrice = Math.round(batch.sellingPrice * discountMultiplier);

    allocations.push({
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate,
      daysRemaining,
      shelfLocation: batch.shelfLocation,
      quantityTaken: qtyToTake,
      remainingStockAfter: batch.stock - qtyToTake,
      sellingPrice: batch.sellingPrice,
      discountPercentage: batch.discountPercentage,
      effectivePrice
    });

    remainingNeeded -= qtyToTake;
  }

  return {
    allocations,
    fulfilledQuantity: quantityNeeded - remainingNeeded,
    shortage: remainingNeeded
  };
}
