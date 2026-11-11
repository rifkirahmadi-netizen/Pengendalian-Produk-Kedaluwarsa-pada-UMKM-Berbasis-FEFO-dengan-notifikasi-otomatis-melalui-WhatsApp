export type ExpiryStatus = 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'ATTENTION' | 'SAFE';

export interface ProductBatch {
  id: string;
  productId: string;
  productName: string;
  category: string;
  sku: string;
  batchNumber: string;
  stock: number;
  initialStock: number;
  unit: string;
  costPrice: number; // HPP (Harga Pokok Penjualan)
  sellingPrice: number; // Harga Jual Normal
  receivedDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  shelfLocation: string; // e.g. Rak Depan A-1, Chiller 2
  supplierName: string;
  supplierContact?: string;
  discountPercentage: number; // 0, 10, 20, 50%
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  unit: string;
  minStockAlert: number;
  description?: string;
}

export interface FefoAllocationItem {
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  daysRemaining: number;
  shelfLocation: string;
  quantityTaken: number;
  remainingStockAfter: number;
  sellingPrice: number;
  discountPercentage: number;
  effectivePrice: number;
}

export interface OutboundRecord {
  id: string;
  timestamp: string;
  productId: string;
  productName: string;
  requestedQuantity: number;
  totalAmount: number;
  purpose: 'PENJUALAN_KASIR' | 'PRODUKSI' | 'REDUCE_DAMAGE' | 'SAMPLE';
  allocations: FefoAllocationItem[];
  isFefoCompliant: boolean;
  notes?: string;
}

export interface WhatsAppNotificationLog {
  id: string;
  timestamp: string;
  recipientPhone: string;
  recipientName: string;
  type: 'SINGLE_ALERT' | 'DAILY_DIGEST' | 'CRITICAL_BROADCAST';
  batchIds: string[];
  productNames: string[];
  message: string;
  status: 'DELIVERED' | 'SENT' | 'SIMULATED';
  channel: 'WA_WEB' | 'WA_GATEWAY_API';
}

export interface WhatsAppConfig {
  ownerPhone: string;
  ownerName: string;
  storeName: string;
  enableDailyCheck: boolean;
  dailyCheckTime: string; // e.g. "08:00"
  notifyOnCriticalDays: number[]; // e.g. [30, 14, 7, 3, 1, 0]
  apiGatewayName: string; // e.g. "Fonnte / Wablas API"
  webhookUrl?: string;
  apiKey?: string;
  autoMarkdownRecommendation: boolean;
}
