import { X, Box, Tag, FileText, CheckCircle2, AlertCircle, Users, Award } from 'lucide-react';
import { Item, Category } from '../types';
import ItemStatusBadge from './ItemStatusBadge';

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
              <ItemStatusBadge 
                status={item.status} 
                isArchived={!!item.deleted_at} 
                awardedBidderName={item.awarded_bidder?.name}
                className="text-xs px-2.5 py-1" 
              />
              {category && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  <Tag className="w-3 h-3" /> {category.name}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-3">{item.name}</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{item.description}</p>
          </div>

          {item.status === 'Awarded' && item.awarded_bidder && (() => {
            const winningCost = item.awarded_unit_cost ?? (
              item.awarded_bidder_id && item.bidders
                ? (item.bidders.find(b => b.id === item.awarded_bidder_id)?.pivot?.unit_cost != null
                    ? Number(item.bidders.find(b => b.id === item.awarded_bidder_id)!.pivot!.unit_cost)
                    : null)
                : null
            );
            const winningAbc = item.awarded_abc ?? (
              winningCost !== null ? winningCost * Number(item.quantity) : null
            );
            const diffAbc = winningAbc !== null ? Number(item.abc) - winningAbc : null;

            return (
              <div className="mb-6 p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Award className="w-5 h-5 text-amber-300" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Awarded Winning Bidder</div>
                    <div className="text-base font-bold text-slate-900 dark:text-white">{item.awarded_bidder.name}</div>
                    {item.awarded_bidder.bidder_code && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{item.awarded_bidder.bidder_code}</div>
                    )}
                  </div>
                </div>

                {winningCost !== null && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2.5 border-t border-blue-200/70 dark:border-blue-800/70">
                    <div className="bg-white/90 dark:bg-slate-900/60 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/40">
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Winning Cost</div>
                      <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        ₱{Number(winningCost).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        <span className="text-[10px] text-slate-400 font-normal ml-1">/{item.unit_type}</span>
                      </div>
                    </div>
                    <div className="bg-white/90 dark:bg-slate-900/60 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/40">
                      <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Winning Total ABC</div>
                      <div className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        ₱{Number(winningAbc).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="bg-white/90 dark:bg-slate-900/60 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/40 col-span-2 sm:col-span-1">
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Variance</div>
                      <div className={`text-xs sm:text-sm font-bold ${
                        diffAbc !== null && diffAbc >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {diffAbc !== null && diffAbc >= 0
                          ? `₱${diffAbc.toLocaleString('en-PH', { minimumFractionDigits: 2 })} (Savings)`
                          : `₱${Math.abs(diffAbc || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })} (Over)`}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Pricing & Cost Details Grid */}
          {(() => {
            const isAwarded = item.status === 'Awarded';
            const winningCost = item.awarded_unit_cost ?? (
              isAwarded && item.awarded_bidder_id && item.bidders
                ? (item.bidders.find(b => b.id === item.awarded_bidder_id)?.pivot?.unit_cost != null
                    ? Number(item.bidders.find(b => b.id === item.awarded_bidder_id)!.pivot!.unit_cost)
                    : null)
                : null
            );
            const winningAbc = item.awarded_abc ?? (
              winningCost !== null ? winningCost * Number(item.quantity) : null
            );

            return (
              <div className="grid grid-cols-2 gap-3.5 mb-8">
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Baseline Unit Cost</div>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">₱{Number(item.unit_cost).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
                </div>

                {isAwarded && winningCost !== null ? (
                  <div className="bg-blue-50/70 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-800">
                    <div className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-1">Winning Unit Cost</div>
                    <div className="text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-300">₱{Number(winningCost).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Unit Type</div>
                    <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white capitalize">{item.unit_type}</div>
                  </div>
                )}

                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Baseline ABC (Budget)</div>
                  <div className="text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-400">₱{Number(item.abc).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
                </div>

                {isAwarded && winningAbc !== null ? (
                  <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                    <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-1">Winning Total ABC</div>
                    <div className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">₱{Number(winningAbc).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Quantity</div>
                    <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{item.quantity}</div>
                  </div>
                )}

                {isAwarded && winningCost !== null && (
                  <>
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Unit Type</div>
                      <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white capitalize">{item.unit_type}</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Quantity</div>
                      <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{item.quantity}</div>
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {item.bidders && item.bidders.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-slate-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Vendor Quotations</h3>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                <dl className="divide-y divide-slate-100 dark:divide-slate-700">
                  {item.bidders.map((bidder) => {
                    const isWinner = item.status === 'Awarded' && (bidder.id === item.awarded_bidder_id || bidder.id === item.awarded_bidder?.id);
                    return (
                      <div
                        key={bidder.id}
                        className={`grid grid-cols-3 gap-4 px-4 py-3 transition-colors items-center ${
                          isWinner
                            ? 'bg-blue-50/70 dark:bg-blue-950/40 border-l-4 border-l-blue-600'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <dt className="text-sm font-semibold text-slate-900 dark:text-slate-100 col-span-2 flex items-center gap-2">
                          <span>{bidder.name}</span>
                          {isWinner && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                              <Award className="w-3 h-3 text-amber-500 shrink-0" /> Winner
                            </span>
                          )}
                        </dt>
                        <dd className="text-sm text-slate-500 dark:text-slate-400 font-medium text-right">
                          ₱{Number(bidder.pivot?.unit_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
