import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Box, ChevronLeft, ChevronRight, Layers, Printer } from 'lucide-react';
import { Item, Category } from '../types';

interface MasterCatalogProps {
  items: Item[];
  categories: Category[];
  onViewItem: (item: Item) => void;
  onNavigate: (view: string) => void;
  initialCategory?: string;
}

export default function MasterCatalog({ items, categories, onViewItem, onNavigate, initialCategory }: MasterCatalogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, perPage]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || item.category_id === Number(selectedCategory);
      return matchesSearch && matchesCategory && !item.deleted_at;
    });
  }, [searchTerm, selectedCategory, items]);

  const totalPages = Math.ceil(filteredItems.length / perPage) || 1;
  const paginatedItems = filteredItems.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/70 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Master Catalog
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                {items.length} Total Items
              </span>
              {filteredItems.length !== items.length && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                  {filteredItems.length} Matching
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Browse, search, and inspect complete procurement specifications and vendor pricing.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('print_report')}
          className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Print Catalog Report
        </button>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-sm flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/60 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search catalog by name, item code, or specs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm dark:text-slate-100 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>
            <div className="relative w-full sm:w-56">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-sm cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium px-2 py-1"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Table Data */}
        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
          {paginatedItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">No items found</h3>
              <p className="text-xs text-slate-500 max-w-sm">We couldn't find any catalog items matching your search criteria.</p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2"
                >
                  Reset search filter
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider sticky top-0 backdrop-blur-md z-10 border-b border-slate-100 dark:border-slate-700">
                  <th className="py-2.5 px-3.5 font-semibold w-32">Item Code</th>
                  <th className="py-2.5 px-3.5 font-semibold">Item Title</th>
                  <th className="py-2.5 px-3.5 font-semibold w-40">Category</th>
                  <th className="py-2.5 px-3.5 font-semibold hidden md:table-cell">Technical Specifications</th>
                  <th className="py-2.5 px-3.5 font-semibold w-36 text-right">Unit Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
                {paginatedItems.map((item) => {
                  const category = categories.find((c) => c.id === item.category_id);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => onViewItem(item)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-2.5 px-3.5 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {item.item_code}
                      </td>
                      <td className="py-2.5 px-3.5 font-medium text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                        {item.name}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-600/60">
                          {category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs xl:max-w-md hidden md:table-cell">
                        {item.description}
                      </td>
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                          ₱{Number(item.unit_cost).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1">/ {item.unit_type.toLowerCase()}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {filteredItems.length > 0 && (
          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 shrink-0">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-lg text-xs py-1 pl-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
            </div>
            <div>
              Showing {(currentPage - 1) * perPage + 1} to {Math.min(currentPage * perPage, filteredItems.length)} of {filteredItems.length} entries
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
