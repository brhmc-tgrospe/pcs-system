import { useState, useEffect, useRef } from 'react';
import { usePage, router, Head } from '@inertiajs/react';
import {
  FileCheck,
  Search,
  Printer,
  Download,
  Trash2,
  RotateCcw,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Clock,
  Layers,
  X,
  CheckSquare,
  Square,
  MinusSquare,
} from 'lucide-react';
import Sidebar from '../Components/Sidebar';
import Header from '../Components/Header';
import Toast from '../Components/Toast';
import ConfirmationModal from '../Components/ConfirmationModal';
import ImpersonationBanner from '../Components/ImpersonationBanner';
import { SavedReportsProps, SavedReport } from '../types';

export default function SavedReports({ reports, filters, counts, auth }: SavedReportsProps) {
  const user = auth.user;
  const isDeveloper = user.role === 'developer';
  const isAdministrative = user.role === 'administrator' || user.role === 'superadmin';
  const canDelete = isAdministrative || isDeveloper;
  const canRestore = isDeveloper;
  const canForceDelete = isDeveloper;
  const isStaff = user.role === 'user';

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [search, setSearch] = useState(filters.search || '');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'delete' | 'restore' | 'force_delete' | 'bulk_delete' | 'bulk_restore' | 'bulk_force_delete';
    report?: SavedReport;
    isProcessing: boolean;
  }>({
    isOpen: false,
    type: 'delete',
    isProcessing: false,
  });

  // Debounced search (300ms)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      router.get(
        '/saved-reports',
        {
          ...filters,
          search: search.trim(),
          page: 1,
        },
        {
          preserveState: true,
          preserveScroll: true,
          replace: true,
        }
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Clear selections when status tab or page changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [filters.status, reports.current_page]);

  const handleTabChange = (status: 'active' | 'trashed') => {
    if (filters.status === status) return;
    router.get(
      '/saved-reports',
      {
        ...filters,
        status,
        page: 1,
      },
      {
        preserveState: true,
        preserveScroll: true,
      }
    );
  };

  const handleSort = (field: string) => {
    const isCurrentField = filters.sort_field === field;
    const direction = isCurrentField && filters.sort_direction === 'asc' ? 'desc' : 'asc';

    router.get(
      '/saved-reports',
      {
        ...filters,
        sort_field: field,
        sort_direction: direction,
      },
      {
        preserveState: true,
        preserveScroll: true,
      }
    );
  };

  const handlePerPageChange = (perPage: number) => {
    router.get(
      '/saved-reports',
      {
        ...filters,
        per_page: perPage,
        page: 1,
      },
      {
        preserveState: true,
        preserveScroll: true,
      }
    );
  };

  // Selection logic
  const allCurrentIds = reports.data.map(r => r.id);
  const isAllSelected = allCurrentIds.length > 0 && allCurrentIds.every(id => selectedIds.has(id));
  const isPartiallySelected = allCurrentIds.some(id => selectedIds.has(id)) && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allCurrentIds));
    }
  };

  const handleToggleItem = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Modal confirm action
  const handleModalConfirm = () => {
    setModalState(prev => ({ ...prev, isProcessing: true }));

    const onSuccess = () => {
      setModalState({ isOpen: false, type: 'delete', isProcessing: false });
      setSelectedIds(new Set());
    };

    const onError = () => {
      setModalState(prev => ({ ...prev, isProcessing: false }));
    };

    const options = {
      preserveScroll: true,
      onSuccess,
      onError,
    };

    switch (modalState.type) {
      case 'delete':
        if (modalState.report) {
          router.delete(`/saved-reports/${modalState.report.id}`, options);
        }
        break;

      case 'restore':
        if (modalState.report) {
          router.post(`/saved-reports/${modalState.report.id}/restore`, {}, options);
        }
        break;

      case 'force_delete':
        if (modalState.report) {
          router.delete(`/saved-reports/${modalState.report.id}/force`, options);
        }
        break;

      case 'bulk_delete':
        router.post('/saved-reports/bulk/delete', { ids: Array.from(selectedIds) }, options);
        break;

      case 'bulk_restore':
        router.post('/saved-reports/bulk/restore', { ids: Array.from(selectedIds) }, options);
        break;

      case 'bulk_force_delete':
        router.post('/saved-reports/bulk/force', { ids: Array.from(selectedIds) }, options);
        break;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (isoStr: string): string => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Head title="Saved Reports - PCS" />
      <Toast />

      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {user.is_impersonating && <ImpersonationBanner user={user} />}

      <Sidebar
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        user={user}
        currentView="saved_reports"
        onNavigate={(view) => {
          router.visit(view === 'dashboard' ? '/catalog' : `/catalog?view=${view}`);
        }}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onOpenMobile={() => setIsMobileOpen(true)} user={user} />

        <main className={`flex-1 overflow-y-auto relative ${user.is_impersonating ? 'mt-10' : ''} p-4 sm:p-6`}>
          <div className="max-w-7xl mx-auto space-y-5">

            {/* Header Title Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                  <FileCheck className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                  Saved Reports
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Archived official PDF Abstract of Bids reports. Anyone logged in can view and print.
                </p>
              </div>

              {/* Status Tabs: Active vs Trashed */}
              {canDelete && (
                <div className="flex items-center gap-2 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
                  <button
                    onClick={() => handleTabChange('active')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      filters.status === 'active'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Active ({counts.active})
                  </button>
                  <button
                    onClick={() => handleTabChange('trashed')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      filters.status === 'trashed'
                        ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Trash ({counts.trashed})
                  </button>
                </div>
              )}
            </div>

            {/* 30-Day Auto Delete Notice (visible in trash tab) */}
            {filters.status === 'trashed' && (
              <div className="flex items-center gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-xs text-amber-800 dark:text-amber-200">
                <Clock className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  <strong>Soft-Delete Notice:</strong> Reports in trash are automatically purged permanently after 30 days.
                  {canRestore ? ' Only developers can restore or permanently delete them.' : ''}
                </span>
              </div>
            )}

            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-slate-950 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by contract name, ref no, or creator..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Show</span>
                  <select
                    value={filters.per_page}
                    onChange={(e) => handlePerPageChange(Number(e.target.value))}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>entries</span>
                </div>
              </div>
            </div>

            {/* Bulk Actions Floating Banner */}
            {!isStaff && selectedIds.size > 0 && (
              <div className="bg-blue-600 dark:bg-blue-700 text-white rounded-2xl p-3 px-5 shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-lg">
                    {selectedIds.size} Selected
                  </span>
                  <span className="text-xs text-blue-100 hidden sm:inline">
                    Choose a bulk action for selected reports:
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {filters.status === 'active' && canDelete && (
                    <button
                      onClick={() =>
                        setModalState({
                          isOpen: true,
                          type: 'bulk_delete',
                          isProcessing: false,
                        })
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Move Selected to Trash
                    </button>
                  )}

                  {filters.status === 'trashed' && canRestore && (
                    <button
                      onClick={() =>
                        setModalState({
                          isOpen: true,
                          type: 'bulk_restore',
                          isProcessing: false,
                        })
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Restore Selected
                    </button>
                  )}

                  {filters.status === 'trashed' && canForceDelete && (
                    <button
                      onClick={() =>
                        setModalState({
                          isOpen: true,
                          type: 'bulk_force_delete',
                          isProcessing: false,
                        })
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Permanently
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="text-xs text-blue-200 hover:text-white px-2 py-1 transition-colors"
                  >
                    Deselect
                  </button>
                </div>
              </div>
            )}

            {/* Main Data Table */}
            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      {/* Bulk Select Checkbox Header (only for users with permissions) */}
                      {!isStaff && (
                        <th className="p-3.5 w-10 text-center">
                          <button
                            type="button"
                            onClick={handleToggleSelectAll}
                            className="text-slate-400 hover:text-blue-600 transition-colors"
                            title="Select / Deselect all on this page"
                          >
                            {isAllSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : isPartiallySelected ? (
                              <MinusSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </th>
                      )}

                      {/* Contract Name */}
                      <th
                        onClick={() => handleSort('contract_name')}
                        className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Report / Contract Name</span>
                          {filters.sort_field === 'contract_name' ? (
                            filters.sort_direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          )}
                        </div>
                      </th>

                      {/* Project Ref */}
                      <th
                        onClick={() => handleSort('project_ref_no')}
                        className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Project Ref No.</span>
                          {filters.sort_field === 'project_ref_no' ? (
                            filters.sort_direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          )}
                        </div>
                      </th>

                      {/* Items Count */}
                      <th
                        onClick={() => handleSort('item_count')}
                        className="p-3.5 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-24"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span>Items</span>
                          {filters.sort_field === 'item_count' ? (
                            filters.sort_direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          )}
                        </div>
                      </th>

                      {/* File Size */}
                      <th
                        onClick={() => handleSort('file_size')}
                        className="p-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-24"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <span>Size</span>
                          {filters.sort_field === 'file_size' ? (
                            filters.sort_direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          )}
                        </div>
                      </th>

                      {/* Saved By */}
                      <th className="p-3.5">Saved By</th>

                      {/* Date */}
                      <th
                        onClick={() => handleSort('created_at')}
                        className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-40"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Date Saved</span>
                          {filters.sort_field === 'created_at' ? (
                            filters.sort_direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          )}
                        </div>
                      </th>

                      {/* Actions */}
                      <th className="p-3.5 text-right pr-6 w-44">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {reports.data.length === 0 ? (
                      <tr>
                        <td colSpan={isStaff ? 7 : 8} className="p-12 text-center text-slate-400">
                          <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No saved reports found</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {search
                              ? 'Try adjusting your search query.'
                              : filters.status === 'trashed'
                              ? 'The trash bin is currently empty.'
                              : 'Reports saved from the Print Project Report generator will show up here.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      reports.data.map((report) => {
                        const isSelected = selectedIds.has(report.id);

                        return (
                          <tr
                            key={report.id}
                            className={`hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors ${
                              isSelected ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                            }`}
                          >
                            {/* Checkbox (if non-staff) */}
                            {!isStaff && (
                              <td className="p-3.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleItem(report.id)}
                                  className="text-slate-400 hover:text-blue-600 transition-colors"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-blue-600" />
                                  ) : (
                                    <Square className="w-4 h-4" />
                                  )}
                                </button>
                              </td>
                            )}

                            {/* Contract Name */}
                            <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                                <span className="line-clamp-2" title={report.contract_name}>
                                  {report.contract_name}
                                </span>
                              </div>
                            </td>

                            {/* Project Ref */}
                            <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {report.project_ref_no || '—'}
                            </td>

                            {/* Item Count */}
                            <td className="p-3.5 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {report.item_count}
                              </span>
                            </td>

                            {/* File Size */}
                            <td className="p-3.5 text-right font-mono text-slate-500">
                              {formatFileSize(report.file_size)}
                            </td>

                            {/* Saved By */}
                            <td className="p-3.5 text-slate-700 dark:text-slate-300">
                              <div className="font-semibold">
                                {report.user ? report.user.full_name : 'System'}
                              </div>
                              {report.user?.role && (
                                <div className="text-[10px] text-slate-400 capitalize">
                                  {report.user.role}
                                </div>
                              )}
                            </td>

                            {/* Date Saved */}
                            <td className="p-3.5 text-slate-500 whitespace-nowrap">
                              {formatDate(report.created_at)}
                            </td>

                            {/* Action Buttons */}
                            <td className="p-3.5 text-right pr-6 whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* View / Print in Browser */}
                                <a
                                  href={`/saved-reports/${report.id}/view`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="View / Print PDF"
                                  className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                >
                                  <Printer className="w-4 h-4" />
                                </a>

                                {/* Direct Download PDF */}
                                <a
                                  href={`/saved-reports/${report.id}/download`}
                                  title="Download PDF File"
                                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                                >
                                  <Download className="w-4 h-4" />
                                </a>

                                {/* Soft Delete Action (Active tab) */}
                                {filters.status === 'active' && canDelete && (
                                  <button
                                    onClick={() =>
                                      setModalState({
                                        isOpen: true,
                                        type: 'delete',
                                        report,
                                        isProcessing: false,
                                      })
                                    }
                                    title="Move to Trash"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}

                                {/* Restore Action (Trash tab - Developer only) */}
                                {filters.status === 'trashed' && canRestore && (
                                  <button
                                    onClick={() =>
                                      setModalState({
                                        isOpen: true,
                                        type: 'restore',
                                        report,
                                        isProcessing: false,
                                      })
                                    }
                                    title="Restore Report"
                                    className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                )}

                                {/* Permanent Delete Action (Trash tab - Developer only) */}
                                {filters.status === 'trashed' && canForceDelete && (
                                  <button
                                    onClick={() =>
                                      setModalState({
                                        isOpen: true,
                                        type: 'force_delete',
                                        report,
                                        isProcessing: false,
                                      })
                                    }
                                    title="Delete Permanently"
                                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
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

              {/* Pagination Bar conforming to cmis-table-patterns */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                <div>
                  Showing <span className="font-semibold text-slate-900 dark:text-slate-100">{reports.from || 0}</span> to{' '}
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{reports.to || 0}</span> of{' '}
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{reports.total}</span> entries
                </div>

                <div className="flex items-center gap-1">
                  {reports.links.map((link, i) => {
                    if (!link.url && link.label.includes('Previous')) {
                      return (
                        <button key={i} disabled className="p-1.5 rounded text-slate-300 dark:text-slate-600 cursor-not-allowed">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      );
                    }
                    if (!link.url && link.label.includes('Next')) {
                      return (
                        <button key={i} disabled className="p-1.5 rounded text-slate-300 dark:text-slate-600 cursor-not-allowed">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      );
                    }

                    if (link.label.includes('Previous')) {
                      return (
                        <button
                          key={i}
                          onClick={() => link.url && router.visit(link.url, { preserveScroll: true })}
                          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      );
                    }

                    if (link.label.includes('Next')) {
                      return (
                        <button
                          key={i}
                          onClick={() => link.url && router.visit(link.url, { preserveScroll: true })}
                          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      );
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => link.url && router.visit(link.url, { preserveScroll: true })}
                        disabled={!link.url || link.active}
                        className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                          link.active
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {link.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        title={
          modalState.type === 'delete'
            ? 'Move Report to Trash?'
            : modalState.type === 'restore'
            ? 'Restore Report from Trash?'
            : modalState.type === 'force_delete'
            ? 'Permanently Delete Report?'
            : modalState.type === 'bulk_delete'
            ? `Move ${selectedIds.size} Reports to Trash?`
            : modalState.type === 'bulk_restore'
            ? `Restore ${selectedIds.size} Reports?`
            : `Permanently Delete ${selectedIds.size} Reports?`
        }
        message={
          modalState.type === 'delete'
            ? `Are you sure you want to move "${modalState.report?.contract_name}" to trash? It will be automatically purged after 30 days.`
            : modalState.type === 'restore'
            ? `Restore "${modalState.report?.contract_name}" back to active saved reports?`
            : modalState.type === 'force_delete'
            ? `Warning: This will permanently delete "${modalState.report?.contract_name}" and its PDF file from storage. This action cannot be undone.`
            : modalState.type === 'bulk_delete'
            ? `Are you sure you want to move the ${selectedIds.size} selected reports to trash? They will be automatically purged after 30 days.`
            : modalState.type === 'bulk_restore'
            ? `Restore the ${selectedIds.size} selected reports back to active status?`
            : `Warning: This will permanently delete ${selectedIds.size} reports and their PDF files from storage. This action cannot be undone.`
        }
        confirmText={
          modalState.type === 'restore' || modalState.type === 'bulk_restore'
            ? 'Restore'
            : modalState.type.includes('force')
            ? 'Delete Permanently'
            : 'Move to Trash'
        }
        confirmColor={
          modalState.type === 'restore' || modalState.type === 'bulk_restore'
            ? 'emerald'
            : 'rose'
        }
        isProcessing={modalState.isProcessing}
        onConfirm={handleModalConfirm}
        onCancel={() => setModalState({ isOpen: false, type: 'delete', isProcessing: false })}
      />
    </div>
  );
}
