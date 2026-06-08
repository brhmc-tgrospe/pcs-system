import { X, Box, Tag, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Item, Category } from '../types';

interface ItemSlideOverProps {
  item: Item | null;
  category?: Category;
  onClose: () => void;
}

export default function ItemSlideOver({ item, category, onClose }: ItemSlideOverProps) {
  if (!item) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 dark:bg-slate-900/60 backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-800 shadow-[auto_0_40px_rgba(0,0,0,0.1)] border-l border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out flex flex-col">
        <div className="h-20 px-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Item Details</div>
              <div className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100">{item.item_code}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              {item.is_active ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active in Catalog
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                  <AlertCircle className="w-3.5 h-3.5" /> Archived
                </span>
              )}
              {category && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  <Tag className="w-3 h-3" /> {category.name}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-3">{item.name}</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{item.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Unit Price</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">₱{Number(item.unit_price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Unit Type</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white capitalize">{item.unit_type}</div>
            </div>
            {Array.isArray(item.price_referral) && item.price_referral.length > 0 && (
              <div className="col-span-2 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Price Referrals</div>
                <div className="text-base font-bold text-slate-900 dark:text-white">
                  {item.price_referral.join(', ')}
                </div>
              </div>
            )}

          </div>

          {item.specifications && Object.keys(item.specifications).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-slate-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Technical Specifications</h3>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                <dl className="divide-y divide-slate-100 dark:divide-slate-700">
                  {Object.entries(item.specifications).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-3 gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <dt className="text-sm font-semibold text-slate-500 dark:text-slate-400">{key}</dt>
                      <dd className="text-sm text-slate-900 dark:text-slate-100 col-span-2 font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
