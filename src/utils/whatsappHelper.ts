import { ProductBatch, WhatsAppConfig } from '../types/inventory';
import { calculateDaysRemaining, formatIndoDate, formatRupiah, getExpiryStatus } from './fefoHelper';

/**
 * Format clean WhatsApp phone number (e.g., converts '08123456789' or '+62 812-3456-789' to '628123456789')
 */
export function sanitizeWhatsAppPhone(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.startsWith('0')) {
    return '62' + digitsOnly.slice(1);
  }
  if (digitsOnly.startsWith('62')) {
    return digitsOnly;
  }
  return digitsOnly ? digitsOnly : '6281234567890';
}

/**
 * Generate a single product batch alert message for WhatsApp
 */
export function generateSingleBatchAlertMessage(
  batch: ProductBatch,
  storeName: string
): string {
  const days = calculateDaysRemaining(batch.expiryDate);
  const status = getExpiryStatus(days);
  const totalCost = batch.stock * batch.costPrice;

  let emojiHeader = '⚠️';
  let urgencyText = 'PERINGATAN STOK MENDEKATI KEDALUWARSA';
  let actionSuggestion = 'Pindahkan ke barisan depan rak sesuai prinsip FEFO.';

  if (status === 'EXPIRED') {
    emojiHeader = '⛔';
    urgencyText = 'PERINGATAN: PRODUK SUDAH KEDALUWARSA';
    actionSuggestion = 'SEGERA TARIK dari display rak toko dan lakukan retur/afkir.';
  } else if (status === 'CRITICAL') {
    emojiHeader = '🚨';
    urgencyText = 'PERINGATAN MENDESAK (KRITIS < 7 HARI)';
    actionSuggestion = 'Prioritas FEFO Utama: Pasang promo diskon 40-50% atau jadikan bonus belanja.';
  } else if (status === 'WARNING') {
    emojiHeader = '⚡';
    urgencyText = 'PERINGATAN KEDALUWARSA (H-14)';
    actionSuggestion = 'Pindahkan ke rak paling depan. Pasang diskon 15-20% untuk mempercepat perputaran.';
  }

  return `${emojiHeader} *${urgencyText}*
🏪 *Toko:* ${storeName}
📦 *Produk:* ${batch.productName}
🏷️ *Batch:* ${batch.batchNumber} (SKU: ${batch.sku})
📅 *Tanggal Kedaluwarsa:* ${formatIndoDate(batch.expiryDate)} (*${days <= 0 ? 'Sudah lewat ' + Math.abs(days) + ' hari' : 'Sisa ' + days + ' hari lagi'}*)
📊 *Sisa Stok Tersedia:* ${batch.stock} ${batch.unit}
📍 *Posisi Rak Fisik:* ${batch.shelfLocation}
💰 *Potensi Nilai Kerugian (HPP):* ${formatRupiah(totalCost)}
${batch.supplierName ? `🤝 *Supplier:* ${batch.supplierName}` : ''}

💡 *Tindakan FEFO Disarankan:*
${actionSuggestion}

_Sistem Monitoring Kedaluwarsa FEFO UMKM_`;
}

/**
 * Generate daily digest broadcast message summarizing all expiring batches
 */
export function generateDailyDigestMessage(
  batches: ProductBatch[],
  config: WhatsAppConfig
): string {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
  const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // Filter items that are either expired, critical (<7d), or warning (<14d)
  const sorted = [...batches].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  const criticalItems = sorted.filter(b => b.stock > 0 && calculateDaysRemaining(b.expiryDate) <= 7);
  const warningItems = sorted.filter(b => b.stock > 0 && calculateDaysRemaining(b.expiryDate) > 7 && calculateDaysRemaining(b.expiryDate) <= 14);

  const totalCriticalLoss = criticalItems.reduce((acc, curr) => acc + (curr.stock * curr.costPrice), 0);
  const totalWarningLoss = warningItems.reduce((acc, curr) => acc + (curr.stock * curr.costPrice), 0);
  const totalAtRisk = totalCriticalLoss + totalWarningLoss;

  let msg = `🚨 *LAPORAN RUTIN KEDALUWARSA (FEFO)*
🏪 *Toko:* ${config.storeName}
📅 *Waktu:* ${dateStr}, ${timeStr}

Halo *${config.ownerName}*, berikut rekap stok barang yang wajib diprioritaskan pengeluarannya hari ini sesuai prinsip *First Expired, First Out (FEFO)*:\n\n`;

  if (criticalItems.length > 0) {
    msg += `🔥 *PRIORITAS TINGGI (KRITIS ≤ 7 HARI):*\n`;
    criticalItems.slice(0, 5).forEach((item, idx) => {
      const days = calculateDaysRemaining(item.expiryDate);
      const totalVal = item.stock * item.costPrice;
      const daysText = days <= 0 ? '❌ EXPIRED' : `⏳ Sisa ${days} hari`;
      msg += `${idx + 1}. *${item.productName}*\n`;
      msg += `   • Batch: ${item.batchNumber} | Stok: ${item.stock} ${item.unit}\n`;
      msg += `   • ED: ${formatIndoDate(item.expiryDate)} (${daysText})\n`;
      msg += `   • Lokasi: ${item.shelfLocation} | Nilai: ${formatRupiah(totalVal)}\n`;
    });
    if (criticalItems.length > 5) {
      msg += `   _...dan ${criticalItems.length - 5} batch kritis lainnya._\n`;
    }
    msg += `\n`;
  }

  if (warningItems.length > 0) {
    msg += `⚠️ *PERINGATAN PERSIAPAN (8 - 14 HARI):*\n`;
    warningItems.slice(0, 4).forEach((item, idx) => {
      const days = calculateDaysRemaining(item.expiryDate);
      msg += `• *${item.productName}* (${item.stock} ${item.unit}) - Sisa ${days} hari (Rak: ${item.shelfLocation})\n`;
    });
    if (warningItems.length > 4) {
      msg += `   _...dan ${warningItems.length - 4} batch peringatan lainnya._\n`;
    }
    msg += `\n`;
  }

  if (criticalItems.length === 0 && warningItems.length === 0) {
    msg += `✅ *SEMUA STOK AMAN!*\nTidak ada produk yang mendekati tanggal kedaluwarsa dalam 14 hari ke depan. Pertahankan perputaran stok yang baik!\n\n`;
  } else {
    msg += `💰 *Ringkasan Nilai Risiko:*
• Potensi Kerugian Kritis: *${formatRupiah(totalCriticalLoss)}*
• Total Nilai Berisiko: *${formatRupiah(totalAtRisk)}*

🎯 *Instruksi Tim Toko:*
1. Geser barang ED terdekat ke posisi *paling depan rak*
2. Terapkan diskon/clearance untuk batch bertanda Kritis
3. Cek kembali barang konsinyasi untuk opsi retur ke supplier.\n\n`;
  }

  msg += `_Laporan otomatis FEFOGuard Monitoring UMKM_`;
  return msg;
}

/**
 * Generate click-to-chat WhatsApp link
 */
export function createWhatsAppWebLink(phone: string, text: string): string {
  const sanitized = sanitizeWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${sanitized}?text=${encodedText}`;
}
