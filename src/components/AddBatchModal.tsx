import React, { useState } from 'react';
import { ProductBatch } from '../types/inventory';
import { calculateDaysRemaining, getExpiryStatus, getStatusMeta } from '../utils/fefoHelper';
import { X, Plus, Calendar, ShieldCheck } from 'lucide-react';

interface AddBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBatch: (batch: ProductBatch) => void;
  existingBatches: ProductBatch[];
}

export const AddBatchModal: React.FC<AddBatchModalProps> = ({
  isOpen,
  onClose,
  onAddBatch,
  existingBatches,
}) => {
  if (!isOpen) return null;

  // Extract existing products for quick selection
  const uniqueProducts = Array.from(
    new Map(existingBatches.map(b => [b.productId, b])).values()
  );

  const [isExistingProduct, setIsExistingProduct] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(uniqueProducts[0]?.productId || '');

  // Form states
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('Susu & Olahan');
  const [sku, setSku] = useState('SKU-' + Math.floor(100 + Math.random() * 900));
  const [batchNumber, setBatchNumber] = useState('BCH-' + new Date().toISOString().slice(0, 7).replace('-', '') + '-' + Math.floor(10 + Math.random() * 90));
  const [stock, setStock] = useState<number>(20);
  const [unit, setUnit] = useState('pcs');
  const [costPrice, setCostPrice] = useState<number>(10000);
  const [sellingPrice, setSellingPrice] = useState<number>(13500);
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  
  // Expiry date (default 30 days from now)
  const defaultExp = new Date();
  defaultExp.setDate(defaultExp.getDate() + 30);
  const [expiryDate, setExpiryDate] = useState(defaultExp.toISOString().slice(0, 10));

  const [shelfLocation, setShelfLocation] = useState('Rak Depan A-01');
  const [supplierName, setSupplierName] = useState('Distributor Pangan Sejahtera');
  const [supplierContact, setSupplierContact] = useState('081234567890');
  const [notes, setNotes] = useState('');

  // Handle existing product select
  const handleSelectExisting = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = uniqueProducts.find(p => p.productId === prodId);
    if (prod) {
      setProductName(prod.productName);
      setCategory(prod.category);
      setSku(prod.sku);
      setUnit(prod.unit);
      setCostPrice(prod.costPrice);
      setSellingPrice(prod.sellingPrice);
      setSupplierName(prod.supplierName || '');
      setSupplierContact(prod.supplierContact || '');
    }
  };

  const calculatedDays = calculateDaysRemaining(expiryDate);
  const status = getExpiryStatus(calculatedDays);
  const meta = getStatusMeta(status);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !expiryDate || stock <= 0) return;

    const newBatch: ProductBatch = {
      id: 'batch-' + Date.now(),
      productId: isExistingProduct && selectedProductId ? selectedProductId : 'prod-' + Date.now(),
      productName: productName.trim(),
      category,
      sku: sku.trim(),
      batchNumber: batchNumber.trim(),
      stock: Number(stock),
      initialStock: Number(stock),
      unit,
      costPrice: Number(costPrice),
      sellingPrice: Number(sellingPrice),
      receivedDate,
      expiryDate,
      shelfLocation: shelfLocation.trim(),
      supplierName: supplierName.trim(),
      supplierContact: supplierContact.trim(),
      discountPercentage: 0,
      notes: notes.trim(),
    };

    onAddBatch(newBatch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-neutral-200 max-w-xl w-full shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">
              Tambah Batch Stok Baru (SOP FEFO)
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Setiap batch dicatat tanggal kedaluwarsanya untuk memicu notifikasi otomatis WhatsApp.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Mode Switcher */}
          <div className="flex items-center gap-2 p-1 bg-neutral-100 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setIsExistingProduct(false)}
              className={`flex-1 py-1.5 rounded transition ${
                !isExistingProduct
                  ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              + Produk Baru
            </button>
            <button
              type="button"
              onClick={() => {
                setIsExistingProduct(true);
                if (uniqueProducts[0]) handleSelectExisting(uniqueProducts[0].productId);
              }}
              className={`flex-1 py-1.5 rounded transition ${
                isExistingProduct
                  ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Batch Baru dari Produk yang Sudah Ada
            </button>
          </div>

          {isExistingProduct && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Pilih Produk Terdaftar
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => handleSelectExisting(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                {uniqueProducts.map(p => (
                  <option key={p.productId} value={p.productId}>
                    {p.productName} ({p.category})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Product Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Nama Produk *
              </label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Contoh: Susu UHT Cokelat 1L"
                className="w-full text-xs py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Kategori Produk
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
              >
                <option value="Susu & Olahan">Susu & Olahan</option>
                <option value="Roti & Bakery">Roti & Bakery</option>
                <option value="Frozen Food">Frozen Food</option>
                <option value="Camilan & Snack">Camilan & Snack</option>
                <option value="Bumbu & Saus">Bumbu & Saus</option>
                <option value="Minuman Segar">Minuman Segar</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          {/* Batch Code & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Nomor Batch Pabrik *
              </label>
              <input
                type="text"
                required
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="BCH-202611-01"
                className="w-full text-xs font-mono py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                SKU / Barcode
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="DRK-UHT-101"
                className="w-full text-xs font-mono py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
              />
            </div>
          </div>

          {/* CRITICAL: Tanggal Kedaluwarsa & Kalkulasi Sisa Hari */}
          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Tanggal Kedaluwarsa (Expired Date) *</span>
              </label>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${meta.badgeClass}`}>
                {calculatedDays <= 0 ? 'Sudah Lewat' : `Sisa ${calculatedDays} Hari (${meta.label})`}
              </span>
            </div>
            <input
              type="date"
              required
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full text-xs font-mono font-semibold py-2 px-3 bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-emerald-800">
              Sistem akan memprioritaskan batch ini keluar sebelum batch yang tanggal kedaluwarsanya lebih lama.
            </p>
          </div>

          {/* Stock & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Jumlah Stok Masuk *
              </label>
              <input
                type="number"
                min={1}
                required
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full text-xs font-mono font-semibold py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Satuan Produk
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="pcs">pcs (buah)</option>
                <option value="kotak">kotak / botol</option>
                <option value="pack">pack / bungkus</option>
                <option value="box">box / karton</option>
                <option value="kg">kg (kilogram)</option>
              </select>
            </div>
          </div>

          {/* Cost Price & Selling Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Harga Beli / HPP (Rp)
              </label>
              <input
                type="number"
                min={0}
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                className="w-full text-xs font-mono py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Harga Jual Normal (Rp)
              </label>
              <input
                type="number"
                min={0}
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="w-full text-xs font-mono py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Shelf Location & Supplier Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Lokasi Rak Fisik di Toko
              </label>
              <input
                type="text"
                value={shelfLocation}
                onChange={(e) => setShelfLocation(e.target.value)}
                placeholder="Contoh: Chiller Depan C-01"
                className="w-full text-xs py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Kontak WA Sales Supplier (Konsinyasi)
              </label>
              <input
                type="text"
                value={supplierContact}
                onChange={(e) => setSupplierContact(e.target.value)}
                placeholder="081234567890"
                className="w-full text-xs font-mono py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Simpan Batch ke Sistem FEFO</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
