import { useState, useEffect } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Search, Plus, Edit2, Trash2, X, Check, Filter, ArchiveRestore, ChevronLeft, ChevronRight, AlertCircle, Tags } from 'lucide-react';
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
  const canForceDelete = Boolean(user.can?.force_delete);
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
    if (!canForceDelete) return;
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
    if (!canForceDelete) return;
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

  const totalActive = categories.filter(c => !c.deleted_at).length;
  const totalArchived = categories.filter(c => !!c.deleted_at).length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/70 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Tags className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Manage Categories
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                {categories.length} Total
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                {totalActive} Active
              </span>
              {totalArchived > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                  {totalArchived} Archived
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Define procurement product categories and taxonomy codes.
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Category
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
                placeholder="Search categories by name or code..."
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
                <option value="all">All Categories</option>
                <option value="active">Active Categories</option>
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
                {selectedIds.length} category/categories selected
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
                    {canForceDelete && (
                      <button
                        onClick={handleBulkForceDelete}
                        className="px-2.5 py-1 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
                      >
                        Permanently Delete
                      </button>
                    )}
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
                    checked={filteredCategories.length > 0 && selectedIds.length === filteredCategories.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-2.5 px-3.5 font-semibold">Category Name</th>
                <th className="py-2.5 px-3.5 font-semibold w-44">Category Code</th>
                <th className="py-2.5 px-3.5 font-semibold">Description</th>
                <th className="py-2.5 px-3.5 font-semibold w-28">Items</th>
                <th className="py-2.5 px-3.5 font-semibold w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
              {paginatedCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Tags className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-medium">No categories found matching your search.</p>
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
                paginatedCategories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors group"
                  >
                    <td className="py-2.5 px-3.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(cat.id)}
                        onChange={() => toggleSelect(cat.id)}
                        className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2.5 px-3.5 font-semibold text-slate-900 dark:text-slate-100">
                      {cat.name}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-600/70">
                        {cat.cat_code}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                      {cat.description || '-'}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                        {cat.items_count ?? 0} items
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {cat.deleted_at ? (
                          <>
                            <button
                              onClick={() => promptRestore(cat)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                              title="Restore"
                            >
                              <ArchiveRestore className="w-3.5 h-3.5" />
                            </button>
                            {canForceDelete && (
                              <button
                                onClick={() => promptForceDelete(cat)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                                title="Permanently Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => openEditModal(cat)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                              title="Edit Category"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => promptDelete(cat)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredCategories.length > 0 && (
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
              Showing {(currentPage - 1) * perPage + 1} to {Math.min(currentPage * perPage, filteredCategories.length)} of {filteredCategories.length} entries
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

      {/* Streamlined Add/Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full ${editingCategory ? 'max-w-lg' : 'max-w-2xl'} overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700 animate-in fade-in duration-150`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Tags className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {editingCategory ? 'Edit Category' : 'Add New Categories'}
                  </h3>
                  {!editingCategory ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Enter one or more categories to add to the project taxonomy.
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Update category title, slug code, or description.
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
                {errors.categories && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errors.categories}</span>
                  </div>
                )}

                {editingCategory ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Category Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        value={data.name}
                        onChange={(e) => {
                          setData('name', e.target.value);
                          setData('cat_code', e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                        }}
                        className={`w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 ${
                          errors.name ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
                        }`}
                        placeholder="e.g. Laboratory Equipment"
                      />
                      {errors.name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Category Code <span className="text-rose-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        value={data.cat_code}
                        onChange={(e) => setData('cat_code', e.target.value)}
                        className={`w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-mono ${
                          errors.cat_code ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
                        }`}
                        placeholder="e.g. laboratory-equipment"
                      />
                      {errors.cat_code && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.cat_code}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Description (Optional)
                      </label>
                      <textarea
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                        placeholder="Brief summary of what items belong to this category..."
                      />
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
                          <div
                            key={index}
                            className="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-700 relative transition-all"
                          >
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
                                  onChange={(e) => updateCategoryRow(index, 'name', e.target.value)}
                                  placeholder="e.g. Laboratory Equipment"
                                  className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${
                                    nameError ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'
                                  }`}
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
                                  onChange={(e) => updateCategoryRow(index, 'cat_code', e.target.value)}
                                  placeholder="e.g. laboratory-equipment"
                                  className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${
                                    codeError ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'
                                  }`}
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
                                onChange={(e) => updateCategoryRow(index, 'description', e.target.value)}
                                placeholder="Optional brief description"
                                className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${
                                  descError ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'
                                }`}
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
                      className="w-full py-2.5 px-4 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add more categories
                    </button>
                  </div>
                )}
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
                form="category-form"
                disabled={processing || (editingCategory && isDuplicate)}
                className="px-5 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
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
