import { useState, useRef } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import { Search, Plus, Edit2, Trash2, X, Check, Eye, Filter, ArchiveRestore, ChevronLeft, ChevronRight, Upload, Package, Boxes, DollarSign } from 'lucide-react';
import { Item, Category, AuthUser, Bidder } from '../types';
import ConfirmationModal from './ConfirmationModal';
import ImportItemsModal from './ImportItemsModal';
import { useDataTable } from '../hooks/useDataTable';

interface ManageItemsProps {
  items: Item[];
  categories: Category[];
  bidders: Bidder[];
  onViewItem: (item: Item) => void;
  user: AuthUser;
}

type BidderInput = {
  id: string;
  unit_cost: string;
};

type ItemFormData = {
  item_code: string;
  name: string;
  description: string;
  category_id: string;
  unit_type: string;
  unit_cost: string;
  quantity: string;
  bidders: BidderInput[];
};

export default function ManageItems({ items, categories, bidders, onViewItem, user }: ManageItemsProps) {
  const { flash } = usePage<any>().props;
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [itemToRestore, setItemToRestore] = useState<Item | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const {
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    isModalOpen, setIsModalOpen,
    selectedIds, setSelectedIds,
    modalConfig, setModalConfig,
    currentPage, setCurrentPage,
    perPage, setPerPage,
    filteredItems,
    totalPages,
    paginatedItems,
    toggleSelectAll,
    toggleSelect,
    execAction
  } = useDataTable(items, (item, search, status) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.item_code.toLowerCase().includes(search.toLowerCase());
    
    let matchesStatus = true;
    if (status === 'all') matchesStatus = !item.deleted_at;
    if (status === 'active') matchesStatus = !item.deleted_at;
    if (status === 'archived') matchesStatus = !!item.deleted_at;
    
    return matchesSearch && matchesStatus;
  }, 'all');

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<ItemFormData>({
    item_code: '',
    name: '',
    description: '',
    category_id: '',
    unit_type: '',
    unit_cost: '',
    quantity: '1',
    bidders: [],
  });

  const openAddModal = () => {
    clearErrors();
    reset();
    setData('category_id', categories[0]?.id.toString() || '');
    setData('quantity', '1');
    setData('bidders', []);
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Item) => {
    clearErrors();
    setData({
      item_code: item.item_code,
      name: item.name,
      description: item.description || '',
      category_id: item.category_id.toString(),
      unit_type: item.unit_type,
      unit_cost: item.unit_cost.toString(),
      quantity: item.quantity.toString(),
      bidders: item.bidders ? item.bidders.map(b => ({
        id: b.id.toString(),
        unit_cost: b.pivot?.unit_cost.toString() || '0'
      })) : [],
    });
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: data.name,
      description: data.description,
      category_id: data.category_id,
      unit_type: data.unit_type,
      unit_cost: data.unit_cost,
      quantity: data.quantity,
      bidders: data.bidders.filter(b => b.id).map(b => ({
        id: b.id,
        unit_cost: b.unit_cost
      })),
    };

    if (editingItem) {
      router.put(`/catalog/items/${editingItem.id}`, payload, {
        preserveScroll: true,
        onSuccess: () => setIsModalOpen(false),
      });
    } else {
      router.post('/catalog/items', payload, {
        preserveScroll: true,
        onSuccess: () => setIsModalOpen(false),
      });
    }
  };

  const handleImportCsv = (file: File) => {
    setIsImporting(true);
    const formData = new FormData();
    formData.append('csv_file', file);

    router.post('/catalog/items/import', formData, {
      preserveScroll: true,
      onSuccess: () => {
        setIsImporting(false);
        setIsImportModalOpen(false);
      },
      onError: () => {
        setIsImporting(false);
      },
    });
  };

  const handleBulkDelete = () => {
    setModalConfig({
      isOpen: true,
      title: 'Bulk Delete Items',
      message: `Are you sure you want to delete ${selectedIds.length} item(s)?`,
      confirmText: 'Delete',
      confirmColor: 'rose',
      action: () => {
        router.post('/catalog/items/bulk/delete', { ids: selectedIds }, {
          preserveScroll: true,
          onSuccess: () => { setModalConfig(null); setSelectedIds([]); }
        });
      }
    });
  };

  const handleBulkRestore = () => {
    setModalConfig({
      isOpen: true,
      title: 'Bulk Restore Items',
      message: `Are you sure you want to restore ${selectedIds.length} item(s)?`,
      confirmText: 'Restore',
      confirmColor: 'emerald',
      action: () => {
        router.post('/catalog/items/bulk/restore', { ids: selectedIds }, {
          preserveScroll: true,
          onSuccess: () => { setModalConfig(null); setSelectedIds([]); }
        });
      }
    });
  };

  const handleBulkForceDelete = () => {
    setModalConfig({
      isOpen: true,
      title: 'Bulk Permanently Delete Items',
      message: `Are you sure you want to PERMANENTLY delete ${selectedIds.length} item(s)? This cannot be undone.`,
      confirmText: 'Permanently Delete',
      confirmColor: 'rose',
      action: () => {
        router.post('/catalog/items/bulk/force', { ids: selectedIds }, {
          preserveScroll: true,
          onSuccess: () => { setModalConfig(null); setSelectedIds([]); }
        });
      }
    });
  };

  const promptDelete = (item: Item) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Item',
      message: `Are you sure you want to delete "${item.name}"?`,
      confirmText: 'Delete',
      confirmColor: 'rose',
      action: () => {
        router.delete(`/catalog/items/${item.id}`, {
          preserveScroll: true,
          onSuccess: () => setModalConfig(null)
        });
      }
    });
  };

  const promptRestore = (item: Item) => {
    setModalConfig({
      isOpen: true,
      title: 'Restore Item',
      message: `Are you sure you want to restore "${item.name}"?`,
      confirmText: 'Restore',
      confirmColor: 'emerald',
      action: () => {
        router.post(`/catalog/items/${item.id}/restore`, {}, {
          preserveScroll: true,
          onSuccess: () => setModalConfig(null)
        });
      }
    });
  };

  const promptForceDelete = (item: Item) => {
    setModalConfig({
      isOpen: true,
      title: 'Permanently Delete Item',
      message: `Are you sure you want to PERMANENTLY delete "${item.name}"? This cannot be undone.`,
      confirmText: 'Permanently Delete',
      confirmColor: 'rose',
      action: () => {
        router.delete(`/catalog/items/${item.id}/force`, {
          preserveScroll: true,
          onSuccess: () => setModalConfig(null)
        });
      }
    });
  };

  const totalActive = items.filter(i => !i.deleted_at).length;
  const totalArchived = items.filter(i => !!i.deleted_at).length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/70 text-blue-600 dark:text-blue-400 rounded-xl">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Manage Items
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                {items.length} Total
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                {totalActive} Active
              </span>
              {totalArchived > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                  {totalArchived} Archived
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Create, update, organize specifications, and attach vendor bidder quotations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Upload className="w-4 h-4 text-blue-500" /> Import CSV
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {flash?.import_errors?.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl p-3.5 shadow-sm shrink-0">
          <div className="flex items-start">
            <div className="shrink-0 mt-0.5">
              <X className="h-4 w-4 text-rose-500" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-xs font-bold text-rose-800 dark:text-rose-300">
                CSV Import encountered {flash.import_errors.length} error(s)
              </h3>
              <div className="mt-1 text-xs text-rose-700 dark:text-rose-200 max-h-32 overflow-y-auto">
                <ul className="list-disc space-y-0.5 pl-4">
                  {flash.import_errors.map((err: string, idx: number) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-sm flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/60 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search items by code or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm dark:text-slate-100 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>
            <div className="relative w-full sm:w-44">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-sm cursor-pointer"
              >
                <option value="all">All Items</option>
                <option value="active">Active Items</option>
                <option value="archived">Archived</option>
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
          {selectedIds.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-800/60 px-4 py-2 flex items-center justify-between sticky top-0 z-20">
              <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                {selectedIds.length} item(s) selected
              </span>
              <div className="flex gap-2">
                {statusFilter !== 'archived' && (
                  <button
                    onClick={handleBulkDelete}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shadow-sm cursor-pointer"
                  >
                    Delete Selected
                  </button>
                )}
                {statusFilter === 'archived' && (
                  <>
                    <button
                      onClick={handleBulkRestore}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors shadow-sm cursor-pointer"
                    >
                      Restore Selected
                    </button>
                    <button
                      onClick={handleBulkForceDelete}
                      className="px-2.5 py-1 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
                    >
                      Permanently Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider sticky top-0 backdrop-blur-md z-10 border-b border-slate-100 dark:border-slate-700">
                <th className="py-2.5 px-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={filteredItems.length > 0 && selectedIds.length === filteredItems.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-2.5 px-3.5 font-semibold w-28">Code</th>
                <th className="py-2.5 px-3.5 font-semibold">Item Title</th>
                <th className="py-2.5 px-3.5 font-semibold">Category</th>
                <th className="py-2.5 px-3.5 font-semibold">Unit Cost</th>
                <th className="py-2.5 px-3.5 font-semibold w-20">Qty</th>
                <th className="py-2.5 px-3.5 font-semibold">Calculated ABC</th>
                <th className="py-2.5 px-3.5 font-semibold w-24">Status</th>
                <th className="py-2.5 px-3.5 font-semibold w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Boxes className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-medium">No procurement items found.</p>
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                        >
                          Reset search filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const cat = categories.find((c) => c.id === item.category_id);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors group"
                    >
                      <td className="py-2.5 px-3.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-600/70">
                          {item.item_code}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-sm">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                          {cat?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                        ₱{Number(item.unit_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        <span className="text-slate-400 dark:text-slate-500 font-normal text-xs ml-1">/{item.unit_type}</span>
                      </td>
                      <td className="py-2.5 px-3.5 font-medium text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3.5 font-bold text-blue-600 dark:text-blue-400 text-xs sm:text-sm">
                        ₱{Number(item.abc).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3.5">
                        {!item.deleted_at ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            Archived
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onViewItem(item)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {item.deleted_at ? (
                            <>
                              <button
                                onClick={() => promptRestore(item)}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                                title="Restore"
                              >
                                <ArchiveRestore className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => promptForceDelete(item)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                                title="Permanently Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                                title="Edit Item"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => promptDelete(item)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                                title="Delete Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredItems.length > 0 && (
          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 shrink-0">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-lg text-xs py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Streamlined Add/Edit Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700 animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {editingItem ? 'Edit Catalog Item' : 'Add New Item'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {editingItem ? `Editing specifications for ${data.item_code}` : 'Enter item specifications and vendor bidder pricing.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <div className="overflow-y-auto flex-1 p-5 sm:p-6 custom-scrollbar">
              <form id="item-form" onSubmit={handleSubmit} className="space-y-4">
                {/* 2-Column: Code & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {editingItem && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Item Code
                      </label>
                      <input
                        disabled
                        type="text"
                        value={data.item_code}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl font-mono text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed"
                        placeholder="Auto-generated"
                      />
                    </div>
                  )}
                  <div className={!editingItem ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={data.category_id}
                      onChange={(e) => setData('category_id', e.target.value)}
                      className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm dark:text-white ${
                        errors.category_id ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      <option value="" disabled>Select category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.cat_code})
                        </option>
                      ))}
                    </select>
                    {errors.category_id && <p className="mt-1 text-xs text-red-600">{errors.category_id}</p>}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Item Title / Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm dark:text-white ${
                      errors.name ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'
                    }`}
                    placeholder="e.g. Surgical Gloves Box 100s"
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Technical Specifications / Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    rows={3}
                    className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm dark:text-white ${
                      errors.description ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'
                    }`}
                    placeholder="Provide full clinical or technical specifications for this procurement item..."
                  />
                  {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
                </div>

                {/* Specifications & Calculated ABC (Grouped Card) */}
                <div className="bg-slate-50/70 dark:bg-slate-700/30 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-700 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Unit Type <span className="text-rose-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        value={data.unit_type}
                        onChange={(e) => setData('unit_type', e.target.value)}
                        className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${
                          errors.unit_type ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'
                        }`}
                        placeholder="e.g. Box, Piece"
                      />
                      {errors.unit_type && <p className="mt-1 text-xs text-red-600">{errors.unit_type}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Unit Cost (₱) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.unit_cost}
                        onChange={(e) => setData('unit_cost', e.target.value)}
                        className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${
                          errors.unit_cost ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'
                        }`}
                        placeholder="0.00"
                      />
                      {errors.unit_cost && <p className="mt-1 text-xs text-red-600">{errors.unit_cost}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Quantity <span className="text-rose-500">*</span>
                      </label>
                      <input
                        required
                        type="number"
                        min="1"
                        value={data.quantity}
                        onChange={(e) => setData('quantity', e.target.value)}
                        className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${
                          errors.quantity ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'
                        }`}
                        placeholder="1"
                      />
                      {errors.quantity && <p className="mt-1 text-xs text-red-600">{errors.quantity}</p>}
                    </div>
                  </div>

                  {/* Highlighted ABC Pill */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700 text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      Calculated Budget (ABC):
                    </span>
                    <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2.5 py-1 rounded-lg border border-blue-200/60 dark:border-blue-800/60">
                      ₱{(Number(data.unit_cost || 0) * Number(data.quantity || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Bidder Quotations Section */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Vendor Bidder Quotations
                      </label>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Connect registered vendor bidders and their offered quotation prices.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {data.bidders.map((bidderInput, index) => (
                      <div
                        key={index}
                        className="p-3 bg-slate-50/90 dark:bg-slate-700/30 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row gap-2.5 sm:items-center"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[11px] font-bold shrink-0">
                            {index + 1}
                          </span>
                          <select
                            required
                            value={bidderInput.id}
                            onChange={(e) => {
                              const updated = [...data.bidders];
                              updated[index].id = e.target.value;
                              setData('bidders', updated);
                            }}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="" disabled>Select Bidder</option>
                            {bidders.map((b) => (
                              <option key={b.id} value={b.id.toString()}>
                                {b.name} ({b.bidder_code || 'No Code'})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-44">
                          <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">₱</span>
                            <input
                              required
                              type="number"
                              step="0.01"
                              min="0"
                              value={bidderInput.unit_cost}
                              onChange={(e) => {
                                const updated = [...data.bidders];
                                updated[index].unit_cost = e.target.value;
                                setData('bidders', updated);
                              }}
                              className="w-full pl-6 pr-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-semibold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Bidder Cost"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const updated = data.bidders.filter((_, i) => i !== index);
                              setData('bidders', updated);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                            title="Remove Bidder"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => setData('bidders', [...data.bidders, { id: '', unit_cost: '' }])}
                      className="w-full py-2 px-3 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Bidder Quotation
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 flex gap-3 justify-end items-center">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:text-slate-800 dark:hover:text-white text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="item-form"
                disabled={processing}
                className="px-5 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {processing ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={modalConfig !== null}
        title={modalConfig?.title || ''}
        message={modalConfig?.message || ''}
        confirmText={modalConfig?.confirmText}
        confirmColor={modalConfig?.confirmColor}
        onConfirm={execAction}
        onCancel={() => setModalConfig(null)}
        isProcessing={processing}
      />

      <ImportItemsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportCsv}
        isProcessing={isImporting}
        categories={categories}
        bidders={bidders}
      />
    </div>
  );
}
