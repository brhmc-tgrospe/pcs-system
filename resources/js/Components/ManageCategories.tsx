import { useState, useEffect } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Search, Plus, Edit2, Trash2, X, Check, Filter, ArchiveRestore, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Category, AuthUser } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { useDataTable } from '../hooks/useDataTable';

interface ManageCategoriesProps {
  categories: Category[];
  user: AuthUser;
}

type CategoryItemInput = {
  name: string;
  cat_code: string;
  description: string;
};

type CategoryFormData = {
  name: string;
  cat_code: string;
  description: string;
  categories: CategoryItemInput[];
};

export default function ManageCategories({ categories, user }: ManageCategoriesProps) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const {
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    isModalOpen, setIsModalOpen,
    selectedIds, setSelectedIds,
    modalConfig, setModalConfig,
    currentPage, setCurrentPage,
    perPage, setPerPage,
    filteredItems: filteredCategories,
    totalPages,
    paginatedItems: paginatedCategories,
    toggleSelectAll,
    toggleSelect,
    execAction
  } = useDataTable(categories, (cat, search, status) => {
    const matchesSearch = cat.name.toLowerCase().includes(search.toLowerCase()) ||
                          cat.cat_code.toLowerCase().includes(search.toLowerCase());
    
    let matchesStatus = true;
    if (status === 'active') matchesStatus = !cat.deleted_at;
    if (status === 'archived') matchesStatus = !!cat.deleted_at;
    if (status === 'all') matchesStatus = true;

    return matchesSearch && matchesStatus;
  }, 'active');

  const createEmptyCategory = (): CategoryItemInput => ({
    name: '',
    cat_code: '',
    description: '',
  });

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<CategoryFormData>({
    name: '',
    cat_code: '',
    description: '',
    categories: [createEmptyCategory()],
  });

  const openAddModal = () => {
    clearErrors();
    reset();
    setData({
      name: '',
      cat_code: '',
      description: '',
      categories: [createEmptyCategory()],
    });
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    clearErrors();
    setData({
      name: cat.name,
      cat_code: cat.cat_code,
      description: cat.description || '',
      categories: [],
    });
    setEditingCategory(cat);
    setIsModalOpen(true);
  };

  const addCategoryRow = () => {
    setData('categories', [...data.categories, createEmptyCategory()]);
  };

  const removeCategoryRow = (index: number) => {
    if (data.categories.length <= 1) return;
    const updated = data.categories.filter((_, i) => i !== index);
    setData('categories', updated);
  };

  const updateCategoryRow = (index: number, field: keyof CategoryItemInput, value: string) => {
    const updated = [...data.categories];
    const current = updated[index];

    if (field === 'name') {
      const autoCode = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const prevAutoCode = current.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const shouldUpdateCode = !current.cat_code || current.cat_code === prevAutoCode;

      updated[index] = {
        ...current,
        name: value,
        cat_code: shouldUpdateCode ? autoCode : current.cat_code,
      };
    } else {
      updated[index] = { ...current, [field]: value };
    }

    setData('categories', updated);
  };

  const isDuplicate = editingCategory ? categories.some(cat => 
    cat.id !== editingCategory.id && 
    cat.name.trim().toLowerCase() === data.name.trim().toLowerCase()
  ) : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      if (isDuplicate) return;
      router.put(`/catalog/categories/${editingCategory.id}`, {
        name: data.name,
        cat_code: data.cat_code,
        description: data.description,
      }, {
        preserveScroll: true,
        onSuccess: () => setIsModalOpen(false),
      });
    } else {
      router.post('/catalog/categories', {
        categories: data.categories,
      }, {
        preserveScroll: true,
        onSuccess: () => setIsModalOpen(false),
      });
    }
  };



  const handleBulkDelete = () => {
    setModalConfig({
      isOpen: true,
      title: 'Bulk Delete Categories',
      message: `Are you sure you want to delete ${selectedIds.length} category/categories? Categories with items will fail to delete.`,
      confirmText: 'Delete',
      confirmColor: 'rose',
      action: () => {
        router.post('/catalog/categories/bulk/delete', { ids: selectedIds }, {
          preserveScroll: true,
          onSuccess: () => { setModalConfig(null); setSelectedIds([]); }
        });
      }
    });
  };

  const handleBulkRestore = () => {
    setModalConfig({
      isOpen: true,
      title: 'Bulk Restore Categories',
      message: `Are you sure you want to restore ${selectedIds.length} category/categories?`,
      confirmText: 'Restore',
      confirmColor: 'emerald',
      action: () => {
        router.post('/catalog/categories/bulk/restore', { ids: selectedIds }, {
          preserveScroll: true,
          onSuccess: () => { setModalConfig(null); setSelectedIds([]); }
        });
      }
    });
  };

  const handleBulkForceDelete = () => {
    setModalConfig({
      isOpen: true,
      title: 'Bulk Permanently Delete Categories',
      message: `Are you sure you want to PERMANENTLY delete ${selectedIds.length} category/categories? This cannot be undone.`,
      confirmText: 'Permanently Delete',
      confirmColor: 'rose',
      action: () => {
        router.post('/catalog/categories/bulk/force', { ids: selectedIds }, {
          preserveScroll: true,
          onSuccess: () => { setModalConfig(null); setSelectedIds([]); }
        });
      }
    });
  };

  const promptDelete = (cat: Category) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Category',
      message: `Are you sure you want to delete category "${cat.name}"?`,
      confirmText: 'Delete',
      confirmColor: 'rose',
      action: () => {
        router.delete(`/catalog/categories/${cat.id}`, {
          preserveScroll: true,
          onSuccess: () => setModalConfig(null)
        });
      }
    });
  };

  const promptRestore = (cat: Category) => {
    setModalConfig({
      isOpen: true,
      title: 'Restore Category',
      message: `Are you sure you want to restore category "${cat.name}"? It will become active again.`,
      confirmText: 'Restore',
      confirmColor: 'emerald',
      action: () => {
        router.post(`/catalog/categories/${cat.id}/restore`, {}, {
          preserveScroll: true,
          onSuccess: () => setModalConfig(null)
        });
      }
    });
  };

  const promptForceDelete = (cat: Category) => {
    setModalConfig({
      isOpen: true,
      title: 'Permanently Delete Category',
      message: `Are you sure you want to PERMANENTLY delete category "${cat.name}"? This cannot be undone.`,
      confirmText: 'Permanently Delete',
      confirmColor: 'rose',
      action: () => {
        router.delete(`/catalog/categories/${cat.id}/force`, {
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Manage Categories</h1>
          <p className="text-slate-500 dark:text-slate-400">Add, edit, or remove catalog categories.</p>
        </div>
        <button onClick={openAddModal} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
          <Plus className="w-5 h-5" /> Add Category
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input type="text" placeholder="Search categories..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500" />
          </div>
          <div className="relative w-full max-w-xs">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full pl-10 pr-8 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="all">All Categories</option>
              <option value="active">Active Categories</option>
              <option value="archived">Deleted (Archived)</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {selectedIds.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border-b border-blue-100 dark:border-blue-800 px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">{selectedIds.length} category/categories selected</span>
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
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-4 w-10 border-b border-slate-200 dark:border-slate-800">
                  <input type="checkbox" 
                    checked={filteredCategories.length > 0 && selectedIds.length === filteredCategories.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-blue-600 focus:ring-blue-500" />
                </th>
                <th className="p-4 font-semibold border-b border-slate-200 dark:border-slate-800">Name</th>
                <th className="p-4 font-semibold border-b border-slate-200 dark:border-slate-800">Category Code</th>
                <th className="p-4 font-semibold border-b border-slate-200 dark:border-slate-800">Description</th>
                <th className="p-4 font-semibold border-b border-slate-200 dark:border-slate-800">Items</th>
                <th className="p-4 font-semibold border-b border-slate-200 dark:border-slate-800 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {paginatedCategories.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">No categories found.</td></tr>
              ) : (
                paginatedCategories.map(cat => (
                  <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4">
                      <input type="checkbox"
                        checked={selectedIds.includes(cat.id)}
                        onChange={() => toggleSelect(cat.id)}
                        className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-blue-600 focus:ring-blue-500" />
                    </td>
                    <td className="p-4 font-medium text-slate-900 dark:text-slate-100">{cat.name}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-sm">{cat.cat_code}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 text-sm truncate max-w-xs">{cat.description || '-'}</td>
                    <td className="p-4 text-sm">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded text-xs font-medium">{cat.items_count ?? 0} items</span>
                    </td>
                    <td className="p-4 text-right">
                      {cat.deleted_at ? (
                        <>
                          <button onClick={() => promptRestore(cat)} className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" title="Restore">
                            <ArchiveRestore className="w-4 h-4" />
                          </button>
                          <button onClick={() => promptForceDelete(cat)} className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors" title="Permanently Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => openEditModal(cat)} className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => promptDelete(cat)} className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredCategories.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
            </div>
            <div>
              Showing {(currentPage - 1) * perPage + 1} to {Math.min(currentPage * perPage, filteredCategories.length)} of {filteredCategories.length} entries
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full ${editingCategory ? 'max-w-lg' : 'max-w-2xl'} overflow-hidden flex flex-col max-h-[90vh]`}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingCategory ? 'Edit Category' : 'Add New Categories'}
                </h3>
                {!editingCategory && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Enter one or more categories to add to the catalog.
                  </p>
                )}
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
                {errors.categories && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errors.categories}</span>
                  </div>
                )}

                {editingCategory ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Name</label>
                      <input required type="text" value={data.name}
                        onChange={e => {
                          setData('name', e.target.value);
                          setData('cat_code', e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                        }}
                        className={`w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 ${errors.name ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'}`}
                        placeholder="e.g. Laboratory Equipment" />
                      {errors.name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Category Code</label>
                      <input required type="text" value={data.cat_code} onChange={e => setData('cat_code', e.target.value)}
                        className={`w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 font-mono text-sm ${errors.cat_code ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'}`}
                        placeholder="e.g. laboratory-equipment" />
                      {errors.cat_code && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.cat_code}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                      <textarea value={data.description} onChange={e => setData('description', e.target.value)}
                        rows={3} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                        placeholder="Optional description" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {data.categories.map((cat, index) => {
                        const nameError = (errors as Record<string, string>)[`categories.${index}.name`];
                        const codeError = (errors as Record<string, string>)[`categories.${index}.cat_code`];
                        const descError = (errors as Record<string, string>)[`categories.${index}.description`];

                        return (
                          <div key={index} className="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-700 relative transition-all">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                                  {index + 1}
                                </span>
                                Category #{index + 1}
                              </span>
                              {data.categories.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeCategoryRow(index)}
                                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                                  title="Remove this category"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                  Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                  required
                                  type="text"
                                  value={cat.name}
                                  onChange={e => updateCategoryRow(index, 'name', e.target.value)}
                                  placeholder="e.g. Laboratory Equipment"
                                  className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${nameError ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`}
                                />
                                {nameError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{nameError}</p>}
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                  Category Code <span className="text-rose-500">*</span>
                                </label>
                                <input
                                  required
                                  type="text"
                                  value={cat.cat_code}
                                  onChange={e => updateCategoryRow(index, 'cat_code', e.target.value)}
                                  placeholder="e.g. laboratory-equipment"
                                  className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${codeError ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`}
                                />
                                {codeError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{codeError}</p>}
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Description (Optional)
                              </label>
                              <input
                                type="text"
                                value={cat.description}
                                onChange={e => updateCategoryRow(index, 'description', e.target.value)}
                                placeholder="Optional brief description"
                                className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${descError ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`}
                              />
                              {descError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{descError}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={addCategoryRow}
                      className="w-full py-2.5 px-4 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add more categories
                    </button>
                  </div>
                )}
              </form>
            </div>

            <div className="p-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex gap-3 justify-end items-center">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:text-slate-800 dark:hover:text-white transition-colors">
                Cancel
              </button>
              <button type="submit" form="category-form" disabled={processing || (editingCategory && isDuplicate)}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
                <Check className="w-4 h-4" />
                {processing
                  ? 'Saving...'
                  : editingCategory
                  ? 'Save Category'
                  : data.categories.length > 1
                  ? `Add ${data.categories.length} Categories`
                  : 'Add Category'}
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
