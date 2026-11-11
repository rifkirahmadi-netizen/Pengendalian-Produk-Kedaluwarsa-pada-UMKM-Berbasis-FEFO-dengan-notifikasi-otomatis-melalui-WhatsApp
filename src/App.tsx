import React, { useState, useEffect, useMemo } from 'react';
import { ProductBatch, WhatsAppConfig, OutboundRecord, WhatsAppNotificationLog } from './types/inventory';
import {
  INITIAL_BATCHES,
  INITIAL_WHATSAPP_CONFIG,
  INITIAL_OUTBOUND_RECORDS,
  INITIAL_NOTIFICATION_LOGS,
} from './data/mockData';
import { Header } from './components/Header';
import { DashboardStats } from './components/DashboardStats';
import { BatchTable } from './components/BatchTable';
import { FefoDispatcher } from './components/FefoDispatcher';
import { WhatsAppCenter } from './components/WhatsAppCenter';
import { ShelfPlanner } from './components/ShelfPlanner';
import { ActionRecommendations } from './components/ActionRecommendations';
import { AddBatchModal } from './components/AddBatchModal';
import { PrintableLabelModal } from './components/PrintableLabelModal';
import {
  calculateDaysRemaining,
  formatRupiah,
  getExpiryStatus,
  sortBatchesByFefo
} from './utils/fefoHelper';
import {
  generateDailyDigestMessage,
  generateSingleBatchAlertMessage,
  sanitizeWhatsAppPhone
} from './utils/whatsappHelper';
import {
  Download,
  RotateCcw,
  Store,
  Layers,
  Sparkles,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function App() {
  // Navigation tab
  const [currentTab, setCurrentTab] = useState<
    'dashboard' | 'batches' | 'dispatcher' | 'whatsapp' | 'shelf' | 'strategy'
  >('dashboard');

  // Persistence in localStorage
  const [batches, setBatches] = useState<ProductBatch[]>(() => {
    try {
      const saved = localStorage.getItem('fefo_batches');
      return saved ? JSON.parse(saved) : INITIAL_BATCHES;
    } catch {
      return INITIAL_BATCHES;
    }
  });

  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig>(() => {
    try {
      const saved = localStorage.getItem('fefo_wa_config');
      return saved ? JSON.parse(saved) : INITIAL_WHATSAPP_CONFIG;
    } catch {
      return INITIAL_WHATSAPP_CONFIG;
    }
  });

  const [outboundRecords, setOutboundRecords] = useState<OutboundRecord[]>(() => {
    try {
      const saved = localStorage.getItem('fefo_outbound');
      return saved ? JSON.parse(saved) : INITIAL_OUTBOUND_RECORDS;
    } catch {
      return INITIAL_OUTBOUND_RECORDS;
    }
  });

  const [notificationLogs, setNotificationLogs] = useState<WhatsAppNotificationLog[]>(() => {
    try {
      const saved = localStorage.getItem('fefo_wa_logs');
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATION_LOGS;
    } catch {
      return INITIAL_NOTIFICATION_LOGS;
    }
  });

  // Modal states
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
  const [printingBatch, setPrintingBatch] = useState<ProductBatch | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('fefo_batches', JSON.stringify(batches));
  }, [batches]);

  useEffect(() => {
    localStorage.setItem('fefo_wa_config', JSON.stringify(whatsappConfig));
  }, [whatsappConfig]);

  useEffect(() => {
    localStorage.setItem('fefo_outbound', JSON.stringify(outboundRecords));
  }, [outboundRecords]);

  useEffect(() => {
    localStorage.setItem('fefo_wa_logs', JSON.stringify(notificationLogs));
  }, [notificationLogs]);

  // Show toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Critical batch count for badge
  const criticalCount = useMemo(() => {
    return batches.filter(
      b => b.stock > 0 && calculateDaysRemaining(b.expiryDate) <= 7
    ).length;
  }, [batches]);

  // FEFO compliance score (calculated from outbound records)
  const fefoComplianceRate = useMemo(() => {
    if (outboundRecords.length === 0) return 100;
    const compliant = outboundRecords.filter(r => r.isFefoCompliant).length;
    return Math.round((compliant / outboundRecords.length) * 100);
  }, [outboundRecords]);

  // Action: Add new batch
  const handleAddBatch = (newBatch: ProductBatch) => {
    setBatches(prev => [newBatch, ...prev]);
    showToast(`Batch ${newBatch.batchNumber} (${newBatch.productName}) berhasil didaftarkan ke sistem FEFO!`);
  };

  // Action: Update discount for a batch
  const handleUpdateDiscount = (batchId: string, discount: number) => {
    setBatches(prev =>
      prev.map(b => (b.id === batchId ? { ...b, discountPercentage: discount } : b))
    );
    showToast(`Diskon batch diperbarui menjadi ${discount}%.`);
  };

  // Action: Bulk update discounts
  const handleBulkApplyDiscounts = (updates: { batchId: string; discount: number }[]) => {
    const map = new Map(updates.map(u => [u.batchId, u.discount]));
    setBatches(prev =>
      prev.map(b => {
        if (map.has(b.id)) {
          return { ...b, discountPercentage: map.get(b.id)! };
        }
        return b;
      })
    );
  };

  // Action: Remove or return batch
  const handleRemoveOrReturBatch = (batchId: string) => {
    const target = batches.find(b => b.id === batchId);
    if (!target) return;
    if (window.confirm(`Konfirmasi penarikan/retur batch ${target.batchNumber} (${target.productName})?`)) {
      setBatches(prev => prev.filter(b => b.id !== batchId));
      showToast(`Batch ${target.batchNumber} telah ditarik dari sistem.`);
    }
  };

  // Action: Dispatch stock via FEFO Cashier
  const handleDispatchStock = (
    productId: string,
    quantity: number,
    purpose: 'PENJUALAN_KASIR' | 'PRODUKSI' | 'REDUCE_DAMAGE',
    notes?: string
  ) => {
    // 1. Sort product batches by FEFO
    const productBatches = sortBatchesByFefo(batches.filter(b => b.productId === productId && b.stock > 0));
    let remainingNeeded = quantity;
    const allocations: any[] = [];
    let totalSaleAmount = 0;

    const updatedBatches = batches.map(batch => {
      if (batch.productId !== productId || batch.stock <= 0 || remainingNeeded <= 0) {
        return batch;
      }

      const take = Math.min(batch.stock, remainingNeeded);
      const days = calculateDaysRemaining(batch.expiryDate);
      const effPrice = Math.round(batch.sellingPrice * (1 - batch.discountPercentage / 100));

      allocations.push({
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        daysRemaining: days,
        shelfLocation: batch.shelfLocation,
        quantityTaken: take,
        remainingStockAfter: batch.stock - take,
        sellingPrice: batch.sellingPrice,
        discountPercentage: batch.discountPercentage,
        effectivePrice: effPrice,
      });

      totalSaleAmount += take * effPrice;
      remainingNeeded -= take;

      return {
        ...batch,
        stock: batch.stock - take,
      };
    });

    setBatches(updatedBatches);

    // Save record
    const targetProduct = batches.find(b => b.productId === productId);
    const newRecord: OutboundRecord = {
      id: 'out-' + Date.now(),
      timestamp: new Date().toISOString(),
      productId,
      productName: targetProduct?.productName || 'Produk',
      requestedQuantity: quantity,
      totalAmount: totalSaleAmount,
      purpose,
      allocations,
      isFefoCompliant: true,
      notes: notes || 'Pengeluaran kasir berbasis FEFO otomatis',
    };

    setOutboundRecords(prev => [newRecord, ...prev]);
    showToast(`Pengeluaran ${quantity} unit ${targetProduct?.productName} berhasil dicatat.`);
  };

  // Action: Send single WhatsApp alert
  const handleSendSingleWhatsApp = (batch: ProductBatch) => {
    const message = generateSingleBatchAlertMessage(batch, whatsappConfig.storeName);
    const newLog: WhatsAppNotificationLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      recipientPhone: sanitizeWhatsAppPhone(whatsappConfig.ownerPhone),
      recipientName: whatsappConfig.ownerName,
      type: 'SINGLE_ALERT',
      batchIds: [batch.id],
      productNames: [batch.productName],
      message: message.slice(0, 160) + '...',
      status: 'DELIVERED',
      channel: 'WA_WEB',
    };

    setNotificationLogs(prev => [newLog, ...prev]);
    setCurrentTab('whatsapp');
    showToast(`Notifikasi WhatsApp untuk batch ${batch.batchNumber} disiapkan!`);
  };

  // Action: Send bulk broadcast alert
  const handleSendBroadcast = () => {
    const message = generateDailyDigestMessage(batches, whatsappConfig);
    const newLog: WhatsAppNotificationLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      recipientPhone: sanitizeWhatsAppPhone(whatsappConfig.ownerPhone),
      recipientName: whatsappConfig.ownerName,
      type: 'DAILY_DIGEST',
      batchIds: batches.filter(b => b.stock > 0).map(b => b.id),
      productNames: batches.slice(0, 3).map(b => b.productName),
      message: message.slice(0, 160) + '...',
      status: 'DELIVERED',
      channel: 'WA_GATEWAY_API',
    };

    setNotificationLogs(prev => [newLog, ...prev]);
    setCurrentTab('whatsapp');
    showToast(`Peringatan rekap harian WhatsApp telah dibuat & dicatat ke log.`);
  };

  // Export data as JSON
  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(
      JSON.stringify({ batches, whatsappConfig, outboundRecords, notificationLogs }, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `fefo_inventory_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Data inventaris & riwayat notifikasi berhasil diunduh!');
  };

  // Reset to initial demo data
  const handleResetData = () => {
    if (window.confirm('Kembalikan semua data ke sampel awal UMKM Berkah Mart?')) {
      localStorage.removeItem('fefo_batches');
      localStorage.removeItem('fefo_wa_config');
      localStorage.removeItem('fefo_outbound');
      localStorage.removeItem('fefo_wa_logs');
      setBatches(INITIAL_BATCHES);
      setWhatsappConfig(INITIAL_WHATSAPP_CONFIG);
      setOutboundRecords(INITIAL_OUTBOUND_RECORDS);
      setNotificationLogs(INITIAL_NOTIFICATION_LOGS);
      showToast('Data telah direset ke set awal.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col text-neutral-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-neutral-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-medium animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Navigation Contract */}
      <Header
        currentTab={currentTab}
        onTabChange={(tab: any) => setCurrentTab(tab)}
        onOpenAddBatch={() => setIsAddBatchOpen(true)}
        criticalCount={criticalCount}
        storeName={whatsappConfig.storeName}
      />

      {/* Secondary Sub-bar for Mobile Navigation & Business Data Controls */}
      <div className="bg-white border-b border-neutral-200 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Breadcrumb / Title Context */}
          <div className="flex items-center gap-2 text-neutral-600 font-medium">
            <span className="text-neutral-400">SOP Persediaan</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-neutral-900">
              {currentTab === 'dashboard' && 'Monitoring Kedaluwarsa FEFO'}
              {currentTab === 'batches' && 'Daftar Batch & Stok Rak'}
              {currentTab === 'dispatcher' && 'Kasir & Pengeluaran Stok FEFO'}
              {currentTab === 'whatsapp' && 'Pusat Automasi WhatsApp'}
              {currentTab === 'shelf' && 'Tata Letak Rak & Label Stiker'}
              {currentTab === 'strategy' && 'Strategi Penyelamatan Stok'}
            </span>
          </div>

          {/* Quick Utility Actions (Export & Reset) */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportData}
              className="flex items-center gap-1.5 text-neutral-600 hover:text-neutral-900 font-medium transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Data</span>
            </button>
            <span className="text-neutral-300">|</span>
            <button
              onClick={handleResetData}
              className="flex items-center gap-1.5 text-neutral-500 hover:text-rose-600 font-medium transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Tab Pills for Small Screens */}
      <div className="md:hidden flex overflow-x-auto py-2 px-4 bg-neutral-100 gap-1 border-b border-neutral-200 text-xs">
        {[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'batches', label: `Batch (${criticalCount})` },
          { id: 'dispatcher', label: 'Kasir FEFO' },
          { id: 'whatsapp', label: 'WhatsApp' },
          { id: 'shelf', label: 'Tata Rak' },
          { id: 'strategy', label: 'Penyelamatan' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentTab(item.id as any)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
              currentTab === item.id
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-neutral-600 bg-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <div className="space-y-6">
            <DashboardStats
              batches={batches}
              fefoComplianceRate={fefoComplianceRate}
              onSendBroadcast={handleSendBroadcast}
              onViewCritical={() => setCurrentTab('batches')}
            />

            {/* Quick Priority Queue Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-neutral-900">
                  Antrean Pengeluaran Stok Prioritas FEFO (ED Terdekat)
                </h3>
                <button
                  onClick={() => setCurrentTab('batches')}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Kelola Semua Batch &rarr;
                </button>
              </div>

              <BatchTable
                batches={batches}
                onSendSingleWhatsApp={handleSendSingleWhatsApp}
                onUpdateDiscount={handleUpdateDiscount}
                onRemoveOrReturBatch={handleRemoveOrReturBatch}
                onPrintLabel={(batch) => setPrintingBatch(batch)}
                onOpenAddBatch={() => setIsAddBatchOpen(true)}
                initialFilter="CRITICAL_EXPIRED"
              />
            </div>
          </div>
        )}

        {currentTab === 'batches' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-neutral-900">
                  Katalog Batch Persediaan UMKM
                </h2>
                <p className="text-xs text-neutral-500">
                  Semua batch terurut secara otomatis dari kedaluwarsa paling awal (FEFO).
                </p>
              </div>
              <button
                onClick={() => setIsAddBatchOpen(true)}
                className="self-start sm:self-auto px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
              >
                + Tambah Batch Baru
              </button>
            </div>

            <BatchTable
              batches={batches}
              onSendSingleWhatsApp={handleSendSingleWhatsApp}
              onUpdateDiscount={handleUpdateDiscount}
              onRemoveOrReturBatch={handleRemoveOrReturBatch}
              onPrintLabel={(batch) => setPrintingBatch(batch)}
              onOpenAddBatch={() => setIsAddBatchOpen(true)}
            />
          </div>
        )}

        {currentTab === 'dispatcher' && (
          <FefoDispatcher
            batches={batches}
            onDispatchStock={handleDispatchStock}
            outboundRecords={outboundRecords}
          />
        )}

        {currentTab === 'whatsapp' && (
          <WhatsAppCenter
            config={whatsappConfig}
            onUpdateConfig={setWhatsappConfig}
            batches={batches}
            logs={notificationLogs}
            onAddLog={(log) => setNotificationLogs(prev => [log, ...prev])}
            onApplyDiscountToBatch={handleUpdateDiscount}
          />
        )}

        {currentTab === 'shelf' && (
          <ShelfPlanner
            batches={batches}
            onPrintBatchLabel={(batch) => setPrintingBatch(batch)}
          />
        )}

        {currentTab === 'strategy' && (
          <ActionRecommendations
            batches={batches}
            onApplyDiscount={handleUpdateDiscount}
            onBulkApplyDiscounts={handleBulkApplyDiscounts}
            storeName={whatsappConfig.storeName}
          />
        )}
      </main>

      {/* Modals */}
      <AddBatchModal
        isOpen={isAddBatchOpen}
        onClose={() => setIsAddBatchOpen(false)}
        onAddBatch={handleAddBatch}
        existingBatches={batches}
      />

      <PrintableLabelModal
        batch={printingBatch}
        onClose={() => setPrintingBatch(null)}
        storeName={whatsappConfig.storeName}
      />

      {/* Quiet Footer adhering to Anti-Slop Discipline */}
      <footer className="bg-white border-t border-neutral-200 py-6 px-4 sm:px-6 lg:px-8 mt-12 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-800">FEFOGuard</span>
            <span aria-hidden="true">·</span>
            <span>Sistem Pengendalian Produk Kedaluwarsa Berbasis FEFO untuk UMKM</span>
          </div>
          <div className="flex items-center gap-4 text-neutral-400">
            <span>Metode FEFO (First Expired, First Out)</span>
            <span>Integrasi Otomatis WhatsApp</span>
            <span>Zero Waste UMKM</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
