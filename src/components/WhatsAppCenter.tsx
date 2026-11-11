import React, { useState } from 'react';
import { ProductBatch, WhatsAppConfig, WhatsAppNotificationLog } from '../types/inventory';
import {
  generateDailyDigestMessage,
  generateSingleBatchAlertMessage,
  createWhatsAppWebLink,
  sanitizeWhatsAppPhone
} from '../utils/whatsappHelper';
import {
  MessageSquare,
  Send,
  ExternalLink,
  Copy,
  Check,
  Settings,
  BellRing,
  Smartphone,
  CheckCheck,
  Sparkles,
  RefreshCw,
  Clock,
  Radio,
  FileText
} from 'lucide-react';

interface WhatsAppCenterProps {
  config: WhatsAppConfig;
  onUpdateConfig: (newConfig: WhatsAppConfig) => void;
  batches: ProductBatch[];
  logs: WhatsAppNotificationLog[];
  onAddLog: (log: WhatsAppNotificationLog) => void;
  onApplyDiscountToBatch: (batchId: string, discount: number) => void;
}

export const WhatsAppCenter: React.FC<WhatsAppCenterProps> = ({
  config,
  onUpdateConfig,
  batches,
  logs,
  onAddLog,
  onApplyDiscountToBatch,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedBatchForSingle, setSelectedBatchForSingle] = useState<string>(
    batches[0]?.id || ''
  );
  const [activeMessageMode, setActiveMessageMode] = useState<'DIGEST' | 'SINGLE'>('DIGEST');
  const [isSendingSimulated, setIsSendingSimulated] = useState(false);
  const [simulatedReplyReceived, setSimulatedReplyReceived] = useState<string | null>(null);

  const selectedBatch = batches.find(b => b.id === selectedBatchForSingle) || batches[0];

  // Current preview message text
  const currentMessageText = activeMessageMode === 'DIGEST'
    ? generateDailyDigestMessage(batches, config)
    : selectedBatch
    ? generateSingleBatchAlertMessage(selectedBatch, config.storeName)
    : '';

  // Direct WA.me URL
  const whatsappUrl = createWhatsAppWebLink(config.ownerPhone, currentMessageText);

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(currentMessageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simulate automated broadcast trigger
  const handleTriggerBroadcast = () => {
    setIsSendingSimulated(true);
    setTimeout(() => {
      const newLog: WhatsAppNotificationLog = {
        id: 'log-' + Date.now(),
        timestamp: new Date().toISOString(),
        recipientPhone: sanitizeWhatsAppPhone(config.ownerPhone),
        recipientName: config.ownerName,
        type: activeMessageMode === 'DIGEST' ? 'DAILY_DIGEST' : 'SINGLE_ALERT',
        batchIds: activeMessageMode === 'DIGEST' ? batches.filter(b => b.stock > 0).map(b => b.id) : [selectedBatch.id],
        productNames: activeMessageMode === 'DIGEST' ? batches.slice(0, 3).map(b => b.productName) : [selectedBatch.productName],
        message: currentMessageText.slice(0, 160) + '...',
        status: 'DELIVERED',
        channel: 'WA_GATEWAY_API',
      };
      onAddLog(newLog);
      setIsSendingSimulated(false);
      setSimulatedReplyReceived('Notifikasi WhatsApp berhasil terkirim ke ' + config.ownerPhone);
      setTimeout(() => setSimulatedReplyReceived(null), 4000);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <span>Pusat Notifikasi Otomatis WhatsApp (Early Warning System)</span>
            </h2>
            <p className="text-xs text-neutral-600 mt-1 max-w-3xl leading-relaxed">
              Mencegah kerugian finansial akibat barang kedaluwarsa dengan mengirimkan pesan peringatan WhatsApp terjadwal langsung ke ponsel pemilik toko atau kepala gudang UMKM.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              Gateway: Siap Aktif
            </span>
          </div>
        </div>
      </div>

      {simulatedReplyReceived && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
          <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{simulatedReplyReceived}</span>
        </div>
      )}

      {/* Main Grid: Config on left, Smartphone simulator on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Configuration & Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Settings Card */}
          <div className="bg-white p-5 rounded-xl border border-neutral-200 space-y-4">
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-neutral-100">
              <Settings className="w-4 h-4 text-neutral-500" />
              <span>Pengaturan Nomor & Automasi Toko</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nomor WhatsApp Penerima
                </label>
                <input
                  type="text"
                  value={config.ownerPhone}
                  onChange={(e) => onUpdateConfig({ ...config, ownerPhone: e.target.value })}
                  placeholder="081234567890"
                  className="w-full text-xs font-mono py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
                />
                <span className="text-[11px] text-neutral-400 mt-0.5 block">
                  Format: 08xx atau 628xx (Nomor aktif WA)
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nama Penerima (Owner/Gudang)
                </label>
                <input
                  type="text"
                  value={config.ownerName}
                  onChange={(e) => onUpdateConfig({ ...config, ownerName: e.target.value })}
                  placeholder="Budi Santoso"
                  className="w-full text-xs py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nama Usaha / Toko UMKM
                </label>
                <input
                  type="text"
                  value={config.storeName}
                  onChange={(e) => onUpdateConfig({ ...config, storeName: e.target.value })}
                  placeholder="Berkah Mart Mandiri"
                  className="w-full text-xs py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Jadwal Otomatis Harian
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={config.dailyCheckTime}
                    onChange={(e) => onUpdateConfig({ ...config, dailyCheckTime: e.target.value })}
                    className="text-xs font-mono py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-neutral-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enableDailyCheck}
                      onChange={(e) => onUpdateConfig({ ...config, enableDailyCheck: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Aktif</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Threshold triggers */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Kirim Peringatan Otomatis Pada Sisa Hari:
              </label>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { days: 30, label: 'H-30 (Awal)' },
                  { days: 14, label: 'H-14 (Persiapan)' },
                  { days: 7, label: 'H-7 (Mendesak)' },
                  { days: 3, label: 'H-3 (Kritis)' },
                  { days: 1, label: 'H-1 (Terakhir)' },
                  { days: 0, label: 'H-0 (Kedaluwarsa)' },
                ].map(item => {
                  const isChecked = config.notifyOnCriticalDays.includes(item.days);
                  return (
                    <button
                      key={item.days}
                      type="button"
                      onClick={() => {
                        const nextDays = isChecked
                          ? config.notifyOnCriticalDays.filter(d => d !== item.days)
                          : [...config.notifyOnCriticalDays, item.days];
                        onUpdateConfig({ ...config, notifyOnCriticalDays: nextDays });
                      }}
                      className={`px-2.5 py-1 rounded-md border font-mono transition-colors ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-500'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Message Generator & Mode Selector */}
          <div className="bg-white p-5 rounded-xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-neutral-500" />
                <span>Pilihan Pesan & Aksi Cepat</span>
              </h3>
              <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg text-xs font-medium">
                <button
                  onClick={() => setActiveMessageMode('DIGEST')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeMessageMode === 'DIGEST'
                      ? 'bg-white text-neutral-900 font-semibold shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Rekap Seluruh Toko
                </button>
                <button
                  onClick={() => setActiveMessageMode('SINGLE')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeMessageMode === 'SINGLE'
                      ? 'bg-white text-neutral-900 font-semibold shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Per Batch Produk
                </button>
              </div>
            </div>

            {activeMessageMode === 'SINGLE' && (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Pilih Batch Produk:
                </label>
                <select
                  value={selectedBatchForSingle}
                  onChange={(e) => setSelectedBatchForSingle(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.productName} ({b.batchNumber}) - ED: {b.expiryDate} (Stok: {b.stock})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {/* Trigger broadcast simulation */}
              <button
                onClick={handleTriggerBroadcast}
                disabled={isSendingSimulated}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:bg-neutral-300"
              >
                {isSendingSimulated ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Kirim Notifikasi via WhatsApp API</span>
              </button>

              {/* Real WhatsApp Web link */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Langsung di WhatsApp Web</span>
              </a>

              {/* Copy Formatted Text */}
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Smartphone Bezel Chat Simulator (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[340px] bg-neutral-900 rounded-[36px] p-3 shadow-xl border-4 border-neutral-800">
            {/* Phone Top Notch */}
            <div className="w-full flex items-center justify-between px-6 pt-1 pb-2">
              <span className="text-[10px] text-white font-mono font-medium">08:00</span>
              <div className="w-16 h-4 bg-neutral-950 rounded-full"></div>
              <div className="flex items-center gap-1 text-[10px] text-white">
                <span>4G</span>
                <span>100%</span>
              </div>
            </div>

            {/* Screen Area */}
            <div className="bg-[#efeae2] rounded-[26px] overflow-hidden flex flex-col h-[520px]">
              {/* WhatsApp Chat Header */}
              <div className="bg-[#075e54] text-white px-3 py-2.5 flex items-center gap-2.5 shrink-0">
                <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs border border-white/20">
                  FG
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold leading-tight truncate">
                    FEFOGuard Notifikasi Toko
                  </div>
                  <div className="text-[10px] text-emerald-100/90 leading-none">
                    Online · Notifikasi Otomatis
                  </div>
                </div>
              </div>

              {/* Chat Message Scrollable Area */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
                {/* System security bubble */}
                <div className="text-center">
                  <span className="bg-[#ffeecd] text-neutral-700 text-[10px] px-2.5 py-1 rounded-md inline-block shadow-xs">
                    🔒 Pesan ini dienkripsi secara end-to-end oleh FEFOGuard UMKM.
                  </span>
                </div>

                {/* Actual Incoming Chat Bubble */}
                <div className="bg-white rounded-lg p-3 shadow-xs border border-neutral-200/50 max-w-[94%] space-y-1.5 relative">
                  <pre className="whitespace-pre-wrap font-sans text-[11px] text-neutral-800 leading-relaxed">
                    {currentMessageText}
                  </pre>

                  {/* Timestamp and Blue ticks */}
                  <div className="flex items-center justify-end gap-1 text-[10px] text-neutral-400 mt-1 font-mono">
                    <span>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                </div>

                {/* Interactive In-Chat Quick Action Responses */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] text-neutral-500 font-semibold px-1">
                    Respons Cepat Karyawan / Pemilik:
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => {
                        if (selectedBatch) {
                          onApplyDiscountToBatch(selectedBatch.id, 50);
                          setSimulatedReplyReceived(`Diskon 50% berhasil diterapkan ke batch ${selectedBatch.batchNumber}!`);
                        }
                      }}
                      className="text-left bg-white/90 hover:bg-white text-emerald-800 text-[11px] font-semibold p-2 rounded-lg border border-emerald-200 shadow-xs transition"
                    >
                      ⚡ Pasang Diskon 50% ke Rak
                    </button>
                    <button
                      onClick={() => {
                        setSimulatedReplyReceived('Konfirmasi diterima: Karyawan telah memindahkan stok ke rak paling depan.');
                      }}
                      className="text-left bg-white/90 hover:bg-white text-neutral-800 text-[11px] font-medium p-2 rounded-lg border border-neutral-200 shadow-xs transition"
                    >
                      ✅ Sudah Dipindah ke Barisan Depan
                    </button>
                  </div>
                </div>
              </div>

              {/* Chat Input Bar */}
              <div className="p-2 bg-neutral-100 flex items-center gap-2 border-t border-neutral-200 shrink-0">
                <input
                  type="text"
                  disabled
                  placeholder="Ketik balasan..."
                  className="flex-1 bg-white px-3 py-1.5 text-[11px] rounded-full border border-neutral-300 text-neutral-400 cursor-not-allowed"
                />
                <div className="w-7 h-7 rounded-full bg-[#128c7e] text-white flex items-center justify-center">
                  <Send className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Log Riwayat Pengiriman Notifikasi WhatsApp */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 space-y-3">
        <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-neutral-500" />
          <span>Riwayat Pengiriman Notifikasi WhatsApp</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 font-medium uppercase tracking-wider border-b border-neutral-200">
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3">Penerima & Nomor</th>
                <th className="py-2.5 px-3">Tipe Peringatan</th>
                <th className="py-2.5 px-3">Produk Terkait</th>
                <th className="py-2.5 px-3">Kanal Pengiriman</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-neutral-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-neutral-400">
                    Belum ada notifikasi yang terkirim. Klik tombol kirim di atas untuk menguji.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-neutral-50">
                    <td className="py-2.5 px-3 font-mono text-neutral-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })},{' '}
                      {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-neutral-900">{log.recipientName}</div>
                      <div className="text-[11px] font-mono text-neutral-500">+{log.recipientPhone}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-neutral-800">
                        {log.type === 'DAILY_DIGEST' ? 'Rekap Harian FEFO' : 'Peringatan Batch Kritis'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="truncate max-w-[200px] text-neutral-600">
                        {log.productNames.join(', ')}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[11px] font-mono bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded">
                        {log.channel === 'WA_GATEWAY_API' ? 'Fonnte API Gateway' : 'WhatsApp Web'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        <CheckCheck className="w-3 h-3" />
                        Terkirim
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
