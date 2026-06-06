import { useState, useMemo } from 'react';
import { Search, X, Box, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { Item, Category } from '../types';

interface StatDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any[];
  type: 'items' | 'categories';
}

export default function StatDetailsModal({ isOpen, onClose, title, data, type }: StatDetailsModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (type === 'items') {
        const i = item as Item;
        return (
          i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          i.item_code.toLowerCase().includes(searchTerm.toLowerCase())
        );
      } else {
        const c = item as Category;
        return (
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
    });
  }, [data, searchTerm, type]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {type === 'items' ? <Box className="w-5 h-5 text-blue-600 dark:text-blue-400" /> : <Tag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
            {title} ({filteredData.length})
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${type}...`}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider sticky top-0 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 z-10">
                {type === 'items' ? (
                  <>
                    <th className="p-4 font-semibold">Item Code</th>
                    <th className="p-4 font-semibold">Name</th>
                    <th className="p-4 font-semibold">Unit Type</th>
                    <th className="p-4 font-semibold">Unit Price</th>
                  </>
                ) : (
                  <>
                    <th className="p-4 font-semibold">Name</th>
                    <th className="p-4 font-semibold">Description</th>
                    <th className="p-4 font-semibold">Items Count</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    No records found matching "{searchTerm}".
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    {type === 'items' ? (
                      <>
                        <td className="p-4 text-sm font-mono font-medium text-slate-600 dark:text-slate-400">{(item as Item).item_code}</td>
                        <td className="p-4">
                          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{(item as Item).name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{(item as Item).description}</div>
                        </td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{(item as Item).unit_type}</td>
                        <td className="p-4 text-sm font-semibold text-slate-900 dark:text-slate-100">₱{Number((item as Item).unit_price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 text-sm font-bold text-slate-900 dark:text-slate-100">{(item as Category).name}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{(item as Category).description || '-'}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{(item as Category).items_count ?? '-'}</td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl">
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span>Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div>
                Showing <span className="font-semibold text-slate-900 dark:text-slate-100">{filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="font-semibold text-slate-900 dark:text-slate-100">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of <span className="font-semibold text-slate-900 dark:text-slate-100">{filteredData.length}</span>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-slate-300"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-slate-300"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
