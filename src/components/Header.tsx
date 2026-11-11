import React from 'react';
import { ShieldAlert, Bell, Plus, Store } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenAddBatch: () => void;
  criticalCount: number;
  storeName: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenAddBatch,
  criticalCount,
  storeName,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-neutral-900 block leading-tight">
              FEFOGuard
            </span>
            <span className="text-xs text-neutral-500 font-medium block leading-none">
              {storeName}
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (single-line, text links with clean hover & active states) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
              currentTab === 'dashboard'
                ? 'text-emerald-700 font-semibold border-b-2 border-emerald-600'
                : 'hover:text-neutral-900'
            }`}
          >
            Dashboard FEFO
          </button>
          <button
            onClick={() => onTabChange('batches')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 flex items-center gap-1.5 ${
              currentTab === 'batches'
                ? 'text-emerald-700 font-semibold border-b-2 border-emerald-600'
                : 'hover:text-neutral-900'
            }`}
          >
            <span>Daftar Stok Batch</span>
            {criticalCount > 0 && (
              <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-mono font-semibold">
                {criticalCount}
              </span>
            )}
          </button>
          <button
            onClick={() => onTabChange('dispatcher')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
              currentTab === 'dispatcher'
                ? 'text-emerald-700 font-semibold border-b-2 border-emerald-600'
                : 'hover:text-neutral-900'
            }`}
          >
            Kasir & Pengeluaran FEFO
          </button>
          <button
            onClick={() => onTabChange('whatsapp')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 flex items-center gap-1.5 ${
              currentTab === 'whatsapp'
                ? 'text-emerald-700 font-semibold border-b-2 border-emerald-600'
                : 'hover:text-neutral-900'
            }`}
          >
            <span>Notifikasi WhatsApp</span>
          </button>
          <button
            onClick={() => onTabChange('shelf')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
              currentTab === 'shelf'
                ? 'text-emerald-700 font-semibold border-b-2 border-emerald-600'
                : 'hover:text-neutral-900'
            }`}
          >
            Tata Rak & Label
          </button>
          <button
            onClick={() => onTabChange('strategy')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
              currentTab === 'strategy'
                ? 'text-emerald-700 font-semibold border-b-2 border-emerald-600'
                : 'hover:text-neutral-900'
            }`}
          >
            Penyelamatan Stok
          </button>
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenAddBatch}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Batch Baru</span>
          </button>
        </div>
      </div>
    </header>
  );
};
