import { useState, useRef } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import { Search, Plus, Edit2, Trash2, X, Check, Eye, Filter, ArchiveRestore, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { Item, Category, AuthUser, Bidder } from '../types';
import ConfirmationModal from './ConfirmationModal';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append('csv_file', file);

    router.post('/catalog/items/import', formData, {
      preserveScroll: true,
      onSuccess: () => {
        setIsImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      onError: () => {
        setIsImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
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

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Manage Items</h1>
          <p className="text-slate-500 dark:text-slate-400">Add, edit, or remove procurement items.</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept=".csv"
            onChange={handleFileSelect}
          />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isImporting}
            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-60"
          >
            <Upload className="w-5 h-5" /> {isImporting ? 'Importing...' : 'Import CSV'}
          </button>
          <button onClick={openAddModal} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
            <Plus className="w-5 h-5" /> Add Item
          </button>
        </div>
      </div>

      {flash?.import_errors?.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex items-start">
            <div className="shrink-0">
              <X className="h-5 w-5 text-rose-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-rose-800 dark:text-rose-300">
                CSV Import encountered {flash.import_errors.length} error(s)
              </h3>
              <div className="mt-2 text-sm text-rose-700 dark:text-rose-200 max-h-40 overflow-y-auto">
                <ul className="list-disc space-y-1 pl-5">
                  {flash.import_errors.map((err: string, idx: number) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search items by code or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-slate-100 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative w-full max-w-xs">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full pl-10 pr-8 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="all">All Items</option>
              <option value="active">Active Items</option>
              <option value="archived">Deleted (Archived)</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {selectedIds.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border-b border-blue-100 dark:border-blue-800 px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">{selectedIds.length} item(s) selected</span>
              <div className="flex gap-2">
                {statusFilter !== 'archived' && (
                  <button onClick={handleBulkDelete} className="px-3 py-1.5 bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-rose-50 dark:hover:bg-slate-600 transition-colors shadow-sm">
                    Delete Selected
                  </button>
                )}
                {statusFilter === 'archived' && (
                  <>
                    <button onClick={handleBulkRestore} className="px-3 py-1.5 bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-emerald-50 dark:hover:bg-slate-600 transition-colors shadow-sm">
                      Restore Selected
                    </button>
                    <button onClick={handleBulkForceDelete} className="px-3 py-1.5 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors shadow-sm">
                      Permanently Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider sticky top-0 backdrop-blur-sm z-10 border-b border-slate-200 dark:border-slate-700">
                <th className="p-4 w-10">
                  <input type="checkbox" 
                    checked={filteredItems.length > 0 && selectedIds.length === filteredItems.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-blue-600 focus:ring-blue-500" />
                </th>
                <th className="p-4 font-semibold">Code</th>
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Unit Cost</th>
                <th className="p-4 font-semibold">Quantity</th>
                <th className="p-4 font-semibold">ABC</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {paginatedItems.length === 0 ? (
                <tr><td colSpan={9} className="p-8 text-center text-slate-500 dark:text-slate-400">No items found.</td></tr>
              ) : (
                paginatedItems.map(item => {
                  const cat = categories.find(c => c.id === item.category_id);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="p-4">
                        <input type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-blue-600 focus:ring-blue-500" />
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-sm">{item.item_code}</td>
                      <td className="p-4 font-bold text-slate-900 dark:text-slate-100">{item.name}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-300 text-sm">
                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">{cat?.name || 'Unknown'}</span>
                      </td>
                      <td className="p-4 text-slate-900 dark:text-slate-100 font-semibold text-sm">
                        ₱{Number(item.unit_cost).toLocaleString()} <span className="text-slate-400 dark:text-slate-500 font-normal">/{item.unit_type}</span>
                      </td>
                      <td className="p-4 text-slate-900 dark:text-slate-100 font-semibold text-sm">
                        {item.quantity}
                      </td>
                      <td className="p-4 text-slate-900 dark:text-slate-100 font-bold text-sm">
                        ₱{Number(item.abc).toLocaleString()}
                      </td>
                      <td className="p-4">
                        {!item.deleted_at ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">Active</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">Archived</span>
                        )}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <button onClick={() => onViewItem(item)} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        {item.deleted_at ? (
                          <>
                            <button onClick={() => promptRestore(item)} className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" title="Restore">
                              <ArchiveRestore className="w-4 h-4" />
                            </button>
                            <button onClick={() => promptForceDelete(item)} className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors" title="Permanently Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => openEditModal(item)} className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Edit">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => promptDelete(item)} className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
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
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-2 font-medium">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              <form id="item-form" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {editingItem && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Item Code</label>
                      <input disabled type="text" value={data.item_code}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none font-mono text-sm dark:text-slate-400 cursor-not-allowed"
                        placeholder="Auto-generated" />
                    </div>
                  )}
                  <div className={!editingItem ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                    <select required value={data.category_id} onChange={e => setData('category_id', e.target.value)}
                      className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-white ${errors.category_id ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`}>
                      <option value="" disabled>Select category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {errors.category_id && <p className="mt-1 text-xs text-red-600">{errors.category_id}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Name</label>
                  <input required type="text" value={data.name} onChange={e => setData('name', e.target.value)}
                    className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${errors.name ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`}
                    placeholder="Item name" />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <textarea required value={data.description} onChange={e => setData('description', e.target.value)}
                    rows={5} className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${errors.description ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`}
                    placeholder="Item description" />
                  {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit Type</label>
                    <input required type="text" value={data.unit_type} onChange={e => setData('unit_type', e.target.value)}
                      className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${errors.unit_type ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`}
                      placeholder="e.g. Box, Piece" />
                    {errors.unit_type && <p className="mt-1 text-xs text-red-600">{errors.unit_type}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Baseline Unit Cost (₱)</label>
                    <input required type="number" step="0.01" min="0" value={data.unit_cost} onChange={e => setData('unit_cost', e.target.value)}
                      className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${errors.unit_cost ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`}
                      placeholder="e.g. 1500.00" />
                    {errors.unit_cost && <p className="mt-1 text-xs text-red-600">{errors.unit_cost}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Quantity</label>
                    <input required type="number" min="1" value={data.quantity} onChange={e => setData('quantity', e.target.value)}
                      className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${errors.quantity ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`}
                      placeholder="e.g. 100" />
                    {errors.quantity && <p className="mt-1 text-xs text-red-600">{errors.quantity}</p>}
                  </div>
                </div>
                
                <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Calculated ABC:</span>
                    <span className="text-lg font-bold text-blue-700 dark:text-blue-400">
                      ₱{(Number(data.unit_cost || 0) * Number(data.quantity || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Bidders</label>
                  <p className="text-xs text-slate-500 mb-3">Select bidders and specify their respective unit costs for this item.</p>
                  
                  <div className="space-y-3">
                    {data.bidders.map((bidderInput, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <select required value={bidderInput.id} onChange={e => {
                              const updated = [...data.bidders];
                              updated[index].id = e.target.value;
                              setData('bidders', updated);
                            }}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="" disabled>Select Bidder</option>
                            {bidders.map(b => (
                              <option key={b.id} value={b.id.toString()}>{b.name}</option>
                            ))}
                          </select>
                          {(errors as any)[`bidders.${index}.id`] && <p className="mt-1 text-xs text-red-600">{(errors as any)[`bidders.${index}.id`]}</p>}
                        </div>
                        
                        <div className="w-1/3">
                          <input required type="number" step="0.01" min="0" value={bidderInput.unit_cost} onChange={e => {
                              const updated = [...data.bidders];
                              updated[index].unit_cost = e.target.value;
                              setData('bidders', updated);
                            }}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            placeholder="Bidder's Unit Cost" />
                          {(errors as any)[`bidders.${index}.unit_cost`] && <p className="mt-1 text-xs text-red-600">{(errors as any)[`bidders.${index}.unit_cost`]}</p>}
                        </div>
                        
                        <button type="button" onClick={() => {
                            const updated = data.bidders.filter((_, i) => i !== index);
                            setData('bidders', updated);
                          }} 
                          className="p-2 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors mt-0.5">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    
                    <button type="button" onClick={() => setData('bidders', [...data.bidders, { id: '', unit_cost: '' }])}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium inline-flex items-center mt-2 gap-1">
                      <Plus className="w-4 h-4" /> Add Bidder
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex gap-3 justify-end">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:text-slate-800 dark:hover:text-white transition-colors">
                Cancel
              </button>
              <button type="submit" form="item-form" disabled={processing}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-60">
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
    </div>
  );
}
