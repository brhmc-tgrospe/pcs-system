import { useState, useMemo } from 'react';
import { Search, X, Box, Tag, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Item, Category } from '../types';

interface StatDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any[];
  type: 'items' | 'categories';
  onViewItem?: (item: Item) => void;
}

export default function StatDetailsModal({ isOpen, onClose, title, data, type, onViewItem }: StatDetailsModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const totalContract = useMemo(() => {
    if (title !== 'Awarded Items') return 0;
    return (data as Item[]).reduce((sum, item) => sum + (Number(item.awarded_abc) || 0), 0);
  }, [data, title]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (type === 'items') {
        const i = item as Item;
        const baseMatch = (
          i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          i.item_code.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (title === 'Awarded Items') {
          const bidder = i.awarded_bidder || i.bidders?.find(b => b.id === i.awarded_bidder_id);
          const bidderMatch = bidder && (
            bidder.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bidder.bidder_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bidder.brand_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bidder.country_of_origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bidder.origin?.toLowerCase().includes(searchTerm.toLowerCase())
          );
          return Boolean(baseMatch || bidderMatch);
        }
        return baseMatch;
      } else {
        const c = item as Category;
        return (
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
    });
  }, [data, searchTerm, type, title]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${type === 'items' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'}`}>
              {type === 'items' ? <Box className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {title}
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {filteredData.length}
                </span>
                {title === 'Awarded Items' && totalContract > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                    Total Contract: ₱{totalContract.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Detailed listing of {type === 'items' ? 'procurement items' : 'categories'}.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Toolbar */}
        <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-800/40">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${type === 'items' ? 'by item code, name, or bidder' : 'by category name'}...`}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-1.5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* High-density Table */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider sticky top-0 backdrop-blur-md border-b border-slate-100 dark:border-slate-700 z-10">
                {title === 'Awarded Items' ? (
                  <>
                    <th className="py-2.5 px-3.5 font-semibold w-28">Item Code</th>
                    <th className="py-2.5 px-3.5 font-semibold">Item Title</th>
                    <th className="py-2.5 px-3.5 font-semibold">Winning Bidder</th>
                    <th className="py-2.5 px-3.5 font-semibold text-right w-32">Winning Cost</th>
                    <th className="py-2.5 px-3.5 font-semibold text-right w-36">Winning ABC</th>
                    {onViewItem && <th className="py-2.5 px-3.5 font-semibold text-right w-16">Action</th>}
                  </>
                ) : type === 'items' ? (
                  <>
                    <th className="py-2.5 px-3.5 font-semibold w-32">Item Code</th>
                    <th className="py-2.5 px-3.5 font-semibold">Name & Details</th>
                    <th className="py-2.5 px-3.5 font-semibold w-28">Unit Type</th>
                    <th className="py-2.5 px-3.5 font-semibold w-32 text-right">Unit Cost</th>
                  </>
                ) : (
                  <>
                    <th className="py-2.5 px-3.5 font-semibold">Category Name</th>
                    <th className="py-2.5 px-3.5 font-semibold">Description</th>
                    <th className="py-2.5 px-3.5 font-semibold w-32 text-right">Items Count</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={title === 'Awarded Items' ? (onViewItem ? 6 : 5) : 4} className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                    No records found matching "{searchTerm}".
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                    {title === 'Awarded Items' ? (
                      <>
                        <td className="py-2.5 px-3.5 text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
                          {(item as Item).item_code}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {(item as Item).name}
                          </div>
                          {(item as Item).description && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                              {(item as Item).description}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 text-xs font-medium text-slate-800 dark:text-slate-200">
                          {(() => {
                            const winningBidder = (item as Item).awarded_bidder || (item as Item).bidders?.find(b => b.id === (item as Item).awarded_bidder_id);
                            if (!winningBidder) return <span className="text-slate-400 dark:text-slate-500 italic">No bidder selected</span>;
                            return (
                              <div className="space-y-0.5">
                                <div className="font-semibold text-slate-900 dark:text-slate-100">{winningBidder.name}</div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {winningBidder.bidder_code && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300">
                                      {winningBidder.bidder_code}
                                    </span>
                                  )}
                                  {winningBidder.brand_name && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                                      {winningBidder.brand_name}
                                    </span>
                                  )}
                                  {(winningBidder.country_of_origin || winningBidder.origin) && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                                      {winningBidder.country_of_origin || winningBidder.origin}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-2.5 px-3.5 text-xs font-semibold text-slate-900 dark:text-slate-100 text-right">
                          {(item as Item).awarded_unit_cost !== null && (item as Item).awarded_unit_cost !== undefined
                            ? '₱' + Number((item as Item).awarded_unit_cost).toLocaleString('en-PH', { minimumFractionDigits: 2 })
                            : '-'}
                        </td>
                        <td className="py-2.5 px-3.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 text-right">
                          {(item as Item).awarded_abc !== null && (item as Item).awarded_abc !== undefined
                            ? '₱' + Number((item as Item).awarded_abc).toLocaleString('en-PH', { minimumFractionDigits: 2 })
                            : '-'}
                        </td>
                        {onViewItem && (
                          <td className="py-2.5 px-3.5 text-right">
                            <button
                              onClick={() => {
                                onViewItem(item as Item);
                                onClose();
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
                              title="View Item Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </>
                    ) : type === 'items' ? (
                      <>
                        <td className="py-2.5 px-3.5 text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
                          {(item as Item).item_code}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {(item as Item).name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                            {(item as Item).description}
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5 text-xs text-slate-600 dark:text-slate-300">
                          {(item as Item).unit_type}
                        </td>
                        <td className="py-2.5 px-3.5 text-xs font-semibold text-slate-900 dark:text-slate-100 text-right">
                          ₱{Number((item as Item).unit_cost).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2.5 px-3.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {(item as Category).name}
                        </td>
                        <td className="py-2.5 px-3.5 text-xs text-slate-500 dark:text-slate-400">
                          {(item as Category).description || '-'}
                        </td>
                        <td className="py-2.5 px-3.5 text-xs text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                            {(item as Category).items_count ?? 0} items
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span>Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-lg text-xs py-0.5 pl-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div>
              Showing {filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
