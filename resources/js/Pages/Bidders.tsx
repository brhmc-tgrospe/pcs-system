import { useState, useEffect } from 'react';
import { usePage, router, useForm } from '@inertiajs/react';
import { Search, Plus, Edit2, Trash2, X, Check, ArrowLeft, Building, ChevronLeft, ChevronRight, AlertCircle, Upload } from 'lucide-react';
import Sidebar from '../Components/Sidebar';
import Header from '../Components/Header';
import ImpersonationBanner from '../Components/ImpersonationBanner';
import Toast from '../Components/Toast';
import ConfirmationModal from '../Components/ConfirmationModal';
import ImportBiddersModal from '../Components/ImportBiddersModal';
import { AuthUser, Bidder } from '../types';

interface BiddersProps {
  bidders: Bidder[];
  auth: { user: AuthUser };
  flash?: {
    success?: string;
    error?: string;
    import_errors?: string[];
  };
}

type BidderItemInput = {
  name: string;
  bidder_code: string;
  contact_person?: string;
  contact_number?: string;
  email?: string;
  address?: string;
  location?: string;
};

type BidderFormData = {
  name: string;
  contact_person: string;
  contact_number: string;
  email: string;
  address: string;
  location: string;
  bidder_code: string;
  bidders: BidderItemInput[];
};

export default function Bidders() {
  const { bidders, auth, flash } = usePage<BiddersProps>().props;
  const user = auth.user;

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [editingBidder, setEditingBidder] = useState<Bidder | null>(null);
  const [bidderToDelete, setBidderToDelete] = useState<Bidder | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearchTerm(searchParam);
      window.history.replaceState({}, '', '/catalog/bidders');
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, perPage]);

  const createEmptyBidder = (): BidderItemInput => ({
    name: '',
    bidder_code: '',
    contact_person: '',
    contact_number: '',
    email: '',
    address: '',
    location: '',
  });

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<BidderFormData>({
    name: '',
    contact_person: '',
    contact_number: '',
    email: '',
    address: '',
    location: '',
    bidder_code: '',
    bidders: [createEmptyBidder()],
  });

  const filteredBidders = bidders.filter(b => {
    const term = searchTerm.toLowerCase();
    return b.name.toLowerCase().includes(term) || b.id.toString().includes(term) || (b.bidder_code && b.bidder_code.toLowerCase().includes(term)) || (b.location && b.location.toLowerCase().includes(term));
  });

  const totalPages = Math.ceil(filteredBidders.length / perPage) || 1;
  const paginatedBidders = filteredBidders.slice((currentPage - 1) * perPage, currentPage * perPage);

  const openAddModal = () => {
    clearErrors();
    reset();
    setData({
      name: '',
      contact_person: '',
      contact_number: '',
      email: '',
      address: '',
      location: '',
      bidder_code: '',
      bidders: [createEmptyBidder()],
    });
    setEditingBidder(null);
    setIsModalOpen(true);
  };

  const openEditModal = (b: Bidder) => {
    clearErrors();
    setData({
      name: b.name,
      contact_person: b.contact_person || '',
      contact_number: b.contact_number || '',
      email: b.email || '',
      address: b.address || '',
      location: b.location || '',
      bidder_code: b.bidder_code || '',
      bidders: [],
    });
    setEditingBidder(b);
    setIsModalOpen(true);
  };

  const addBidderRow = () => {
    setData('bidders', [...data.bidders, createEmptyBidder()]);
  };

  const removeBidderRow = (index: number) => {
    if (data.bidders.length <= 1) return;
    const updated = data.bidders.filter((_, i) => i !== index);
    setData('bidders', updated);
  };

  const updateBidderRow = (index: number, field: keyof BidderItemInput, value: string) => {
    const updated = [...data.bidders];
    updated[index] = { ...updated[index], [field]: value };
    setData('bidders', updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBidder) {
      put(`/catalog/bidders/${editingBidder.id}`, {
        preserveScroll: true,
        onSuccess: () => setIsModalOpen(false),
      });
    } else {
      post('/catalog/bidders', {
        preserveScroll: true,
        onSuccess: () => setIsModalOpen(false),
      });
    }
  };

  const handleImportCsv = (file: File) => {
    setIsImporting(true);
    const formData = new FormData();
    formData.append('csv_file', file);

    router.post('/catalog/bidders/import', formData, {
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

  const handleDelete = (b: Bidder) => {
    setBidderToDelete(b);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (bidderToDelete) {
      router.delete(`/catalog/bidders/${bidderToDelete.id}`, { 
        preserveScroll: true,
        onSuccess: () => setIsDeleteModalOpen(false)
      });
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Toast />
      {isMobileOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
      )}

      {user.is_impersonating && <ImpersonationBanner user={user} />}

      <Sidebar
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        user={user}
        currentView="bidders"
        onNavigate={(view) => {
          if (view !== 'bidders') router.visit('/catalog');
        }}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onOpenMobile={() => setIsMobileOpen(true)} user={user} />

        <main className={`flex-1 overflow-y-auto relative ${user.is_impersonating ? 'mt-10' : ''} p-4 sm:p-6`}>
          <div className="max-w-7xl mx-auto h-full flex flex-col gap-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.visit('/catalog')}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  title="Back to Catalog"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="p-2 bg-fuchsia-50 dark:bg-fuchsia-950/40 border border-fuchsia-200/70 dark:border-fuchsia-800/70 text-fuchsia-600 dark:text-fuchsia-400 rounded-xl">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                      Manage Bidders
                    </h1>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-fuchsia-50 dark:bg-fuchsia-950/50 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200/60 dark:border-fuchsia-800/60">
                      {bidders.length} {bidders.length === 1 ? 'Bidder' : 'Bidders'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Add, edit, or remove registered vendor bidders and company codes.
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
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition-all shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Bidder
                </button>
              </div>
            </div>

            {flash?.import_errors && flash.import_errors.length > 0 && (
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

            {/* Table Container */}
            <div className="bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-sm flex-1 flex flex-col overflow-hidden min-h-0">
              {/* Toolbar */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/60 flex items-center justify-between gap-3">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search bidders by code, name, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-1.5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm dark:text-slate-100 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
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
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider sticky top-0 backdrop-blur-md z-10 border-b border-slate-100 dark:border-slate-700">
                      <th className="py-2.5 px-4 font-semibold w-20">ID</th>
                      <th className="py-2.5 px-4 font-semibold w-36">Bidder Code</th>
                      <th className="py-2.5 px-4 font-semibold">Bidder Name</th>
                      <th className="py-2.5 px-4 font-semibold w-48">Location</th>
                      <th className="py-2.5 px-4 font-semibold w-28 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
                    {paginatedBidders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Building className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                            <p className="text-sm font-medium">No bidders found matching your search.</p>
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
                      paginatedBidders.map((b) => (
                        <tr
                          key={b.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors group"
                        >
                          <td className="py-2.5 px-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                            #{b.id}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-600/70">
                              {b.bidder_code || '-'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                            {b.name}
                          </td>
                          <td className="py-2.5 px-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                            {b.location || b.address || '-'}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditModal(b)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                title="Edit Bidder"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(b)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                                title="Delete Bidder"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredBidders.length > 0 && (
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
                    Showing {(currentPage - 1) * perPage + 1} to {Math.min(currentPage * perPage, filteredBidders.length)} of {filteredBidders.length} entries
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
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full ${editingBidder ? 'max-w-lg' : 'max-w-2xl'} overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700`}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-600 dark:text-fuchsia-400 rounded-xl">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {editingBidder ? 'Edit Bidder' : 'Add New Bidders'}
                  </h3>
                  {!editingBidder ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Enter one or more bidders to add to the system registry.
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Update bidder company name, code, or location.
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

            <div className="p-6 overflow-y-auto flex-1">
              <form id="bidder-form" onSubmit={handleSubmit} className="space-y-4">
                {errors.bidders && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errors.bidders}</span>
                  </div>
                )}

                {editingBidder ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Company / Bidder Name</label>
                      <input required type="text" value={data.name} onChange={e => setData('name', e.target.value)}
                        className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${errors.name ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`} />
                      {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Bidder Code</label>
                      <input required type="text" value={data.bidder_code} onChange={e => setData('bidder_code', e.target.value)}
                        className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-mono text-sm ${errors.bidder_code ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`}
                        placeholder="e.g. BDR-123" />
                      {errors.bidder_code && <p className="mt-1 text-xs text-red-600">{errors.bidder_code}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Location</label>
                      <input type="text" value={data.location} onChange={e => setData('location', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
                        placeholder="e.g. China / Philippines / Germany" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {data.bidders.map((bidder, index) => {
                        const nameError = (errors as Record<string, string>)[`bidders.${index}.name`];
                        const codeError = (errors as Record<string, string>)[`bidders.${index}.bidder_code`];

                        return (
                          <div key={index} className="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-700 relative transition-all">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                                  {index + 1}
                                </span>
                                Bidder #{index + 1}
                              </span>
                              {data.bidders.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeBidderRow(index)}
                                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                                  title="Remove this bidder"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                  Company / Bidder Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                  required
                                  type="text"
                                  value={bidder.name}
                                  onChange={e => updateBidderRow(index, 'name', e.target.value)}
                                  placeholder="e.g. Acme Supplies Corp."
                                  className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${nameError ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`}
                                />
                                {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                  Bidder Code <span className="text-rose-500">*</span>
                                </label>
                                <input
                                  required
                                  type="text"
                                  value={bidder.bidder_code}
                                  onChange={e => updateBidderRow(index, 'bidder_code', e.target.value)}
                                  placeholder="e.g. BDR-101"
                                  className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${codeError ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`}
                                />
                                {codeError && <p className="mt-1 text-xs text-red-600">{codeError}</p>}
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                  Location
                                </label>
                                <input
                                  type="text"
                                  value={bidder.location || ''}
                                  onChange={e => updateBidderRow(index, 'location', e.target.value)}
                                  placeholder="e.g. Philippines / China"
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={addBidderRow}
                      className="w-full py-2.5 px-4 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add more bidders
                    </button>
                  </div>
                )}
              </form>
            </div>

            <div className="p-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex gap-3 justify-end items-center">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:text-slate-800 dark:hover:text-white transition-colors">
                Cancel
              </button>
              <button type="submit" form="bidder-form" disabled={processing}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-60">
                <Check className="w-4 h-4" />
                {processing
                  ? 'Saving...'
                  : editingBidder
                  ? 'Save Changes'
                  : data.bidders.length > 1
                  ? `Add ${data.bidders.length} Bidders`
                  : 'Add Bidder'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Bidder"
        message={`Are you sure you want to delete bidder "${bidderToDelete?.name}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isProcessing={processing}
        confirmText="Delete"
        confirmColor="rose"
      />

      <ImportBiddersModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportCsv}
        isProcessing={isImporting}
      />
    </div>
  );
}
