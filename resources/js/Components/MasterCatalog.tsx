import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Box, ChevronLeft, ChevronRight } from 'lucide-react';
import { Item, Category } from '../types';

interface MasterCatalogProps {
  items: Item[];
  categories: Category[];
  onViewItem: (item: Item) => void;
  onNavigate: (view: string) => void;
}

export default function MasterCatalog({ items, categories, onViewItem, onNavigate }: MasterCatalogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

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
      return matchesSearch && matchesCategory && item.is_active;
    });
  }, [searchTerm, selectedCategory, items]);

  const totalPages = Math.ceil(filteredItems.length / perPage) || 1;
  const paginatedItems = filteredItems.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Master Catalog</h1>
          <p className="text-slate-500 dark:text-slate-400">Browse, search, and view complete procurement specifications.</p>
        </div>
        <button
          onClick={() => onNavigate('print_report')}
          className="hidden sm:flex items-center gap-2 bg-slate-800 dark:bg-blue-600 hover:bg-slate-900 dark:hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          Print Report
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, code, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm transition-shadow text-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-64 pl-10 pr-8 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none text-sm text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-[400px]">
        {paginatedItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No items found</h3>
            <p className="text-slate-500 text-sm max-w-sm">We couldn't find any items matching your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-8 rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Item Code</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Description</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Unit Price</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                {paginatedItems.map((item) => {
                  const category = categories.find((c) => c.id === item.category_id);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => onViewItem(item)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-slate-600 dark:text-slate-400">
                        {item.item_code}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {category?.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs xl:max-w-md hidden md:table-cell">
                        {item.description}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-slate-900 dark:text-slate-100">
                        ₱{Number(item.unit_price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        <span className="text-xs font-normal text-slate-500 ml-1">/ {item.unit_type.toLowerCase()}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredItems.length > 0 && (
        <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-2 font-medium">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
