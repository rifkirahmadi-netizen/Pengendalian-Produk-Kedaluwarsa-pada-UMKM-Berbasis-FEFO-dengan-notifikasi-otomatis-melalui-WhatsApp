import { ProductBatch, WhatsAppConfig, OutboundRecord, WhatsAppNotificationLog } from '../types/inventory';

function relativeDate(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const INITIAL_WHATSAPP_CONFIG: WhatsAppConfig = {
  ownerPhone: '081289123456',
  ownerName: 'Budi Santoso',
  storeName: 'Berkah Mart Mandiri',
  enableDailyCheck: true,
  dailyCheckTime: '08:00',
  notifyOnCriticalDays: [30, 14, 7, 3, 1, 0],
  apiGatewayName: 'Fonnte WhatsApp API Gateway',
  webhookUrl: 'https://api.fonnte.com/send',
  apiKey: 'FONNTE_DEMO_SECRET_KEY',
  autoMarkdownRecommendation: true,
};

export const INITIAL_BATCHES: ProductBatch[] = [
  // Susu UHT Cokelat 1L - Multiple batches showing FEFO in action
  {
    id: 'batch-001',
    productId: 'prod-susu-uht',
    productName: 'Susu UHT Cokelat 1000ml',
    category: 'Susu & Olahan',
    sku: 'DRK-UHT-101',
    batchNumber: 'BCH-202610-01',
    stock: 14,
    initialStock: 30,
    unit: 'kotak',
    costPrice: 15500,
    sellingPrice: 19500,
    receivedDate: relativeDate(-50),
    expiryDate: relativeDate(3), // 3 days remaining (CRITICAL)
    shelfLocation: 'Chiller Depan C-01 (Baris 1)',
    supplierName: 'PT Sumber Susu Nusantara',
    supplierContact: '081122334455',
    discountPercentage: 25,
    notes: 'Prioritas FEFO Utama! Beri diskon 25% dan posisikan di depan kaca pendingin.'
  },
  {
    id: 'batch-002',
    productId: 'prod-susu-uht',
    productName: 'Susu UHT Cokelat 1000ml',
    category: 'Susu & Olahan',
    sku: 'DRK-UHT-101',
    batchNumber: 'BCH-202610-02',
    stock: 24,
    initialStock: 40,
    unit: 'kotak',
    costPrice: 15500,
    sellingPrice: 19500,
    receivedDate: relativeDate(-30),
    expiryDate: relativeDate(18), // 18 days remaining (ATTENTION)
    shelfLocation: 'Chiller Depan C-01 (Baris 2)',
    supplierName: 'PT Sumber Susu Nusantara',
    supplierContact: '081122334455',
    discountPercentage: 0,
    notes: 'Letakkan di belakang Batch BCH-202610-01'
  },
  {
    id: 'batch-003',
    productId: 'prod-susu-uht',
    productName: 'Susu UHT Cokelat 1000ml',
    category: 'Susu & Olahan',
    sku: 'DRK-UHT-101',
    batchNumber: 'BCH-202611-03',
    stock: 50,
    initialStock: 50,
    unit: 'kotak',
    costPrice: 15500,
    sellingPrice: 19500,
    receivedDate: relativeDate(-5),
    expiryDate: relativeDate(95), // 95 days remaining (SAFE)
    shelfLocation: 'Gudang Belakang Rak G-3',
    supplierName: 'PT Sumber Susu Nusantara',
    supplierContact: '081122334455',
    discountPercentage: 0,
    notes: 'Stok baru. Simpan di gudang utama, jangan keluarkan sebelum stok rak habis.'
  },

  // Roti Tawar Gandum Kupas
  {
    id: 'batch-004',
    productId: 'prod-roti-tawar',
    productName: 'Roti Tawar Gandum Kupas',
    category: 'Roti & Bakery',
    sku: 'BKR-ROTI-201',
    batchNumber: 'BCH-202611-04',
    stock: 8,
    initialStock: 20,
    unit: 'bungkus',
    costPrice: 12000,
    sellingPrice: 16000,
    receivedDate: relativeDate(-5),
    expiryDate: relativeDate(2), // 2 days remaining (CRITICAL)
    shelfLocation: 'Rak Display Roti A-01',
    supplierName: 'Sari Roti Lestari',
    supplierContact: '081399887766',
    discountPercentage: 40,
    notes: 'Konsinyasi: jika tidak habis dalam 2 hari, bisa retur ke sales kanvas.'
  },
  {
    id: 'batch-005',
    productId: 'prod-roti-tawar',
    productName: 'Roti Tawar Gandum Kupas',
    category: 'Roti & Bakery',
    sku: 'BKR-ROTI-201',
    batchNumber: 'BCH-202611-05',
    stock: 15,
    initialStock: 15,
    unit: 'bungkus',
    costPrice: 12000,
    sellingPrice: 16000,
    receivedDate: relativeDate(-1),
    expiryDate: relativeDate(6), // 6 days remaining (CRITICAL)
    shelfLocation: 'Rak Display Roti A-02',
    supplierName: 'Sari Roti Lestari',
    supplierContact: '081399887766',
    discountPercentage: 0,
    notes: 'Jual setelah batch BCH-202611-04 laku.'
  },

  // Yogurt Drink Strawberry 250ml
  {
    id: 'batch-006',
    productId: 'prod-yogurt-str',
    productName: 'Yogurt Drink Strawberry 250ml',
    category: 'Susu & Olahan',
    sku: 'DRK-YOG-301',
    batchNumber: 'BCH-202610-09',
    stock: 19,
    initialStock: 30,
    unit: 'botol',
    costPrice: 7000,
    sellingPrice: 9500,
    receivedDate: relativeDate(-20),
    expiryDate: relativeDate(5), // 5 days remaining (CRITICAL)
    shelfLocation: 'Chiller Tengah B-02',
    supplierName: 'CV Segar Dairy',
    supplierContact: '081765432109',
    discountPercentage: 30,
    notes: 'Obral Beli 2 Diskon 30% untuk mempercepat habis stok.'
  },

  // Sosis Sapi Siap Makan (Expired sample to demonstrate pull from shelf)
  {
    id: 'batch-007',
    productId: 'prod-sosis-ready',
    productName: 'Sosis Sapi Siap Makan 30g',
    category: 'Camilan & Snack',
    sku: 'SNK-SOS-401',
    batchNumber: 'BCH-202609-12',
    stock: 6,
    initialStock: 50,
    unit: 'pcs',
    costPrice: 3200,
    sellingPrice: 4500,
    receivedDate: relativeDate(-65),
    expiryDate: relativeDate(-1), // Already expired 1 day ago (EXPIRED)
    shelfLocation: 'Rak Kasir Depan K-01',
    supplierName: 'PT Meat Prima',
    supplierContact: '081233445566',
    discountPercentage: 0,
    notes: 'PERINGATAN: Sudah lewat kedaluwarsa! Wajib ditarik ke kotak afkir hari ini.'
  },

  // Keju Cheddar Slice 10s
  {
    id: 'batch-008',
    productId: 'prod-keju-cheddar',
    productName: 'Keju Cheddar Slice Isi 10',
    category: 'Susu & Olahan',
    sku: 'CHZ-CHD-501',
    batchNumber: 'BCH-202610-15',
    stock: 22,
    initialStock: 35,
    unit: 'pack',
    costPrice: 11500,
    sellingPrice: 14800,
    receivedDate: relativeDate(-35),
    expiryDate: relativeDate(11), // 11 days remaining (WARNING)
    shelfLocation: 'Chiller Bawah B-03',
    supplierName: 'PT Sumber Pangan Sejahtera',
    discountPercentage: 15,
    notes: 'Berikan label kuning diskon 15% di rak.'
  },

  // Sosis Frozen Beef Cocktail 500g
  {
    id: 'batch-009',
    productId: 'prod-frozen-sausage',
    productName: 'Sosis Sapi Cocktail 500g',
    category: 'Frozen Food',
    sku: 'FRZ-SOS-601',
    batchNumber: 'BCH-202610-21',
    stock: 16,
    initialStock: 25,
    unit: 'pack',
    costPrice: 38000,
    sellingPrice: 47000,
    receivedDate: relativeDate(-25),
    expiryDate: relativeDate(13), // 13 days remaining (WARNING)
    shelfLocation: 'Freezer Utama Box 01',
    supplierName: 'CV Sejahtera Frozen',
    discountPercentage: 10,
    notes: 'Posisi paling atas freezer agar kasir mengambil batch ini dulu.'
  },
  {
    id: 'batch-010',
    productId: 'prod-frozen-sausage',
    productName: 'Sosis Sapi Cocktail 500g',
    category: 'Frozen Food',
    sku: 'FRZ-SOS-601',
    batchNumber: 'BCH-202611-30',
    stock: 30,
    initialStock: 30,
    unit: 'pack',
    costPrice: 38000,
    sellingPrice: 47000,
    receivedDate: relativeDate(-3),
    expiryDate: relativeDate(110), // SAFE
    shelfLocation: 'Freezer Cadangan Box 03',
    supplierName: 'CV Sejahtera Frozen',
    discountPercentage: 0,
    notes: 'Stok aman di dasar freezer.'
  },

  // Nugget Ayam Crispy 500g
  {
    id: 'batch-011',
    productId: 'prod-chicken-nugget',
    productName: 'Nugget Ayam Crispy 500g',
    category: 'Frozen Food',
    sku: 'FRZ-NUG-701',
    batchNumber: 'BCH-202610-28',
    stock: 20,
    initialStock: 30,
    unit: 'pack',
    costPrice: 34000,
    sellingPrice: 42000,
    receivedDate: relativeDate(-20),
    expiryDate: relativeDate(22), // 22 days remaining (ATTENTION)
    shelfLocation: 'Freezer Utama Box 02',
    supplierName: 'CV Sejahtera Frozen',
    discountPercentage: 0,
    notes: 'Pantau sisa stok menjelang akhir bulan.'
  },

  // Bumbu Rendang Siap Pakai 100g
  {
    id: 'batch-012',
    productId: 'prod-bumbu-rendang',
    productName: 'Bumbu Rendang Tradisional 100g',
    category: 'Bumbu & Saus',
    sku: 'BMB-RDG-801',
    batchNumber: 'BCH-202609-05',
    stock: 35,
    initialStock: 60,
    unit: 'sachet',
    costPrice: 5000,
    sellingPrice: 7500,
    receivedDate: relativeDate(-45),
    expiryDate: relativeDate(45), // SAFE
    shelfLocation: 'Rak Bumbu D-01',
    supplierName: 'UMKM Rempah Alami',
    discountPercentage: 0,
    notes: 'Kondisi kering dan tertutup rapat.'
  },

  // Biskuit Gandum Cokelat 250g
  {
    id: 'batch-013',
    productId: 'prod-biskuit-gandum',
    productName: 'Biskuit Gandum Cokelat 250g',
    category: 'Camilan & Snack',
    sku: 'SNK-BSK-901',
    batchNumber: 'BCH-202608-11',
    stock: 18,
    initialStock: 40,
    unit: 'pack',
    costPrice: 9500,
    sellingPrice: 13000,
    receivedDate: relativeDate(-40),
    expiryDate: relativeDate(28), // 28 days remaining (ATTENTION)
    shelfLocation: 'Rak Snack Depan S-02',
    supplierName: 'PT Mega Biskuit',
    discountPercentage: 0,
    notes: 'Taruh di depan sebelum stok batch baru dibuka.'
  }
];

export const INITIAL_OUTBOUND_RECORDS: OutboundRecord[] = [
  {
    id: 'out-101',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    productId: 'prod-susu-uht',
    productName: 'Susu UHT Cokelat 1000ml',
    requestedQuantity: 6,
    totalAmount: 87750,
    purpose: 'PENJUALAN_KASIR',
    isFefoCompliant: true,
    allocations: [
      {
        batchId: 'batch-001',
        batchNumber: 'BCH-202610-01',
        expiryDate: relativeDate(3),
        daysRemaining: 3,
        shelfLocation: 'Chiller Depan C-01 (Baris 1)',
        quantityTaken: 6,
        remainingStockAfter: 14,
        sellingPrice: 19500,
        discountPercentage: 25,
        effectivePrice: 14625
      }
    ],
    notes: 'Pelanggan membeli 6 pcs, sistem otomatis menarik dari Batch BCH-202610-01 (ED terdekat).'
  },
  {
    id: 'out-102',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    productId: 'prod-roti-tawar',
    productName: 'Roti Tawar Gandum Kupas',
    requestedQuantity: 5,
    totalAmount: 48000,
    purpose: 'PENJUALAN_KASIR',
    isFefoCompliant: true,
    allocations: [
      {
        batchId: 'batch-004',
        batchNumber: 'BCH-202611-04',
        expiryDate: relativeDate(2),
        daysRemaining: 2,
        shelfLocation: 'Rak Display Roti A-01',
        quantityTaken: 5,
        remainingStockAfter: 8,
        sellingPrice: 16000,
        discountPercentage: 40,
        effectivePrice: 9600
      }
    ],
    notes: 'Kasir mengikuti FEFO dan mengeluarkan roti dengan diskon clearance.'
  }
];

export const INITIAL_NOTIFICATION_LOGS: WhatsAppNotificationLog[] = [
  {
    id: 'log-001',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    recipientPhone: '6281289123456',
    recipientName: 'Budi Santoso',
    type: 'DAILY_DIGEST',
    batchIds: ['batch-001', 'batch-004', 'batch-006'],
    productNames: ['Susu UHT Cokelat 1000ml', 'Roti Tawar Gandum Kupas', 'Yogurt Drink Strawberry 250ml'],
    message: '🚨 LAPORAN RUTIN KEDALUWARSA (FEFO) - Berkah Mart Mandiri: Terdeteksi 3 batch kritis (ED ≤ 7 hari) yang wajib diprioritaskan...',
    status: 'DELIVERED',
    channel: 'WA_GATEWAY_API'
  },
  {
    id: 'log-002',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    recipientPhone: '6281289123456',
    recipientName: 'Budi Santoso',
    type: 'SINGLE_ALERT',
    batchIds: ['batch-004'],
    productNames: ['Roti Tawar Gandum Kupas'],
    message: '⚠️ PERINGATAN MENDESAK: Roti Tawar Gandum Kupas Batch BCH-202611-04 sisa 2 hari lagi...',
    status: 'SENT',
    channel: 'WA_WEB'
  }
];
