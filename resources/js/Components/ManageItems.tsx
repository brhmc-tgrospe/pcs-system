import { useState, useEffect } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Search, Plus, Edit2, Trash2, X, Check, Eye, Filter, ArchiveRestore, ChevronLeft, ChevronRight } from 'lucide-react';
import { Item, Category, AuthUser } from '../types';
import ConfirmationModal from './ConfirmationModal';

interface ManageItemsProps {
  items: Item[];
  categories: Category[];
  onViewItem: (item: Item) => void;
  user: AuthUser;
}

type ItemFormData = {
  item_code: string;
  name: string;
  description: string;
  category_id: string;
  unit_type: string;
  unit_price: string;
  price_referral: string;
  is_active: boolean;
  specifications: { k: string; v: string }[];
};

export default function ManageItems({ items, categories, onViewItem, user }: ManageItemsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'archived'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [itemToRestore, setItemToRestore] = useState<Item | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    confirmColor: 'rose' | 'emerald' | 'blue';
    action: () => void;
  } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, perPage]);

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<ItemFormData>({
    item_code: '',
    name: '',
    description: '',
    category_id: '',
    unit_type: '',
    unit_price: '',
    price_referral: '',
    is_active: true,
    specifications: [{ k: '', v: '' }],
  });

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.item_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'all') matchesStatus = !item.deleted_at;
    if (statusFilter === 'active') matchesStatus = item.is_active && !item.deleted_at;
    if (statusFilter === 'inactive') matchesStatus = !item.is_active && !item.deleted_at;
    if (statusFilter === 'archived') matchesStatus = !!item.deleted_at;
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredItems.length / perPage) || 1;
  const paginatedItems = filteredItems.slice((currentPage - 1) * perPage, currentPage * perPage);

  const openAddModal = () => {
    clearErrors();
    reset();
    setData('specifications', [{ k: '', v: '' }]);
    setData('category_id', categories[0]?.id.toString() || '');
    setData('price_referral', '');
    setData('is_active', true);
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Item) => {
    clearErrors();
    const specsArray = Object.entries(item.specifications || {}).map(([k, v]) => ({ k, v }));
    setData({
      item_code: item.item_code,
      name: item.name,
      description: item.description || '',
      category_id: item.category_id.toString(),
      unit_type: item.unit_type,
      unit_price: item.unit_price.toString(),
      price_referral: item.price_referral || '',
      is_active: item.is_active,
      specifications: specsArray.length ? specsArray : [{ k: '', v: '' }],
    });
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Build specifications object
    const specificationsObj: Record<string, string> = {};
    data.specifications.forEach(({ k, v }) => {
      if (k.trim()) specificationsObj[k.trim()] = v.trim();
    });

    const payload = {
      item_code: data.item_code,
      name: data.name,
      description: data.description,
      category_id: data.category_id,
      unit_type: data.unit_type,
      unit_price: data.unit_price,
      price_referral: data.price_referral,
      is_active: data.is_active,
      specifications: specificationsObj,
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

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(i => i.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const execAction = () => {
    if (modalConfig) {
      modalConfig.action();
    }
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
      message: `Are you sure you want to restore "${item.name}"? It will become active again.`,
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

  const updateSpec = (index: number, field: 'k' | 'v', value: string) => {
    const updated = [...data.specifications];
    updated[index][field] = value;
    setData('specifications', updated);
  };

  const removeSpec = (index: number) => {
    const updated = data.specifications.filter((_, i) => i !== index);
    setData('specifications', updated.length ? updated : [{ k: '', v: '' }]);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Manage Items</h1>
          <p className="text-slate-500 dark:text-slate-400">Add, edit, or remove procurement items.</p>
        </div>
        <button onClick={openAddModal} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
          <Plus className="w-5 h-5" /> Add Item
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm flex-1 flex flex-col overflow-hidden">
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
              <option value="inactive">Inactive Items</option>
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
                <th className="p-4 font-semibold">Price</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {paginatedItems.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">No items found.</td></tr>
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
                        ₱{Number(item.unit_price).toLocaleString()} <span className="text-slate-400 dark:text-slate-500 font-normal">/{item.unit_type}</span>
                      </td>
                      <td className="p-4">
                        {item.is_active ? (
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              <form id="item-form" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Item Code</label>
                    <input required type="text" value={data.item_code} onChange={e => setData('item_code', e.target.value)}
                      className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm dark:text-white ${errors.item_code ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`}
                      placeholder="e.g. IT-102" />
                    {errors.item_code && <p className="mt-1 text-xs text-red-600">{errors.item_code}</p>}
                  </div>
                  <div>
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
                    rows={3} className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${errors.description ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`}
                    placeholder="Item description" />
                  {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit Type</label>
                    <input required type="text" value={data.unit_type} onChange={e => setData('unit_type', e.target.value)}
                      className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${errors.unit_type ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`}
                      placeholder="e.g. Box of 50, Piece" />
                    {errors.unit_type && <p className="mt-1 text-xs text-red-600">{errors.unit_type}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit Price (₱)</label>
                    <input required type="number" step="0.01" min="0" value={data.unit_price} onChange={e => setData('unit_price', e.target.value)}
                      className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${errors.unit_price ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`}
                      placeholder="e.g. 1500.00" />
                    {errors.unit_price && <p className="mt-1 text-xs text-red-600">{errors.unit_price}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Price Referral</label>
                    <input type="text" value={data.price_referral} onChange={e => setData('price_referral', e.target.value)}
                      className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${errors.price_referral ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`}
                      placeholder="e.g. Lazada, DOH, Supplier" />
                    {errors.price_referral && <p className="mt-1 text-xs text-red-600">{errors.price_referral}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_active" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 focus:ring-blue-500" />
                  <label htmlFor="is_active" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Active in Catalog</label>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Specifications</label>
                  <div className="space-y-2">
                    {data.specifications.map((spec, index) => (
                      <div key={index} className="flex gap-2">
                        <input type="text" value={spec.k} onChange={e => updateSpec(index, 'k', e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-white dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Key (e.g. Resolution)" />
                        <input type="text" value={spec.v} onChange={e => updateSpec(index, 'v', e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-white dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Value (e.g. 1080p)" />
                        <button type="button" onClick={() => removeSpec(index)} className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setData('specifications', [...data.specifications, { k: '', v: '' }])}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium inline-flex items-center mt-2 gap-1">
                      <Plus className="w-4 h-4" /> Add Specification
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
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-60">
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
