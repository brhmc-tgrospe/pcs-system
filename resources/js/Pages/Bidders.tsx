import { useState, useEffect } from 'react';
import { usePage, router, useForm } from '@inertiajs/react';
import { Search, Plus, Edit2, Trash2, X, Check, ArrowLeft, Building, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from '../Components/Sidebar';
import Header from '../Components/Header';
import ImpersonationBanner from '../Components/ImpersonationBanner';
import Toast from '../Components/Toast';
import ConfirmationModal from '../Components/ConfirmationModal';
import { AuthUser } from '../types';

interface Bidder {
  id: number;
  name: string;
  contact_person: string | null;
  contact_number: string | null;
  email: string | null;
  address: string | null;
}

interface BiddersProps {
  bidders: Bidder[];
  auth: { user: AuthUser };
}

type BidderFormData = {
  name: string;
  contact_person: string;
  contact_number: string;
  email: string;
  address: string;
};

export default function Bidders() {
  const { bidders, auth } = usePage<BiddersProps>().props;
  const user = auth.user;

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingBidder, setEditingBidder] = useState<Bidder | null>(null);
  const [bidderToDelete, setBidderToDelete] = useState<Bidder | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, perPage]);

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<BidderFormData>({
    name: '',
    contact_person: '',
    contact_number: '',
    email: '',
    address: '',
  });

  const filteredBidders = bidders.filter(b => {
    const term = searchTerm.toLowerCase();
    return b.name.toLowerCase().includes(term) || b.id.toString().includes(term);
  });

  const totalPages = Math.ceil(filteredBidders.length / perPage) || 1;
  const paginatedBidders = filteredBidders.slice((currentPage - 1) * perPage, currentPage * perPage);

  const openAddModal = () => {
    clearErrors();
    reset();
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
    });
    setEditingBidder(b);
    setIsModalOpen(true);
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

        <main className={`flex-1 overflow-y-auto relative ${user.is_impersonating ? 'mt-10' : ''} p-6`}>
          <div className="max-w-7xl mx-auto h-full flex flex-col">
            <div className="flex justify-between items-end mb-8">
              <div className="flex items-center gap-4">
                <button onClick={() => router.visit('/catalog')} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Building className="w-8 h-8 text-fuchsia-600" /> Manage Bidders
                  </h1>
                  <p className="text-slate-500">Add, edit, or remove bidders and their contact information.</p>
                </div>
              </div>
              <button onClick={openAddModal} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
                <Plus className="w-5 h-5" /> Add Bidder
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="text" placeholder="Search bidders by name, contact or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-slate-100 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider sticky top-0 backdrop-blur-sm z-10 border-b border-slate-200 dark:border-slate-700">
                      <th className="p-4 font-semibold w-24">ID</th>
                      <th className="p-4 font-semibold">Bidder Name</th>
                      <th className="p-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {paginatedBidders.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-slate-500">No bidders found.</td></tr>
                    ) : (
                      paginatedBidders.map(b => (
                        <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="p-4 text-slate-500 dark:text-slate-400 font-mono">
                            #{b.id}
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-900 dark:text-slate-100">{b.name}</div>
                          </td>
                          <td className="p-4 text-right">
                            <button onClick={() => openEditModal(b)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Edit">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(b)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredBidders.length > 0 && (
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
                    Showing {(currentPage - 1) * perPage + 1} to {Math.min(currentPage * perPage, filteredBidders.length)} of {filteredBidders.length} entries
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
          </div>
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{editingBidder ? 'Edit Bidder' : 'Add New Bidder'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="bidder-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Company / Bidder Name</label>
                  <input required type="text" value={data.name} onChange={e => setData('name', e.target.value)}
                    className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${errors.name ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`} />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                </div>
                {/* Contact details hidden for now as per requirements */}
                <div className="hidden">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Person</label>
                      <input type="text" value={data.contact_person} onChange={e => setData('contact_person', e.target.value)}
                        className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${errors.contact_person ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`} />
                      {errors.contact_person && <p className="mt-1 text-xs text-red-600">{errors.contact_person}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Number</label>
                      <input type="text" value={data.contact_number} onChange={e => setData('contact_number', e.target.value)}
                        className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${errors.contact_number ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`} />
                      {errors.contact_number && <p className="mt-1 text-xs text-red-600">{errors.contact_number}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                    <input type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                      className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${errors.email ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`} />
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Address</label>
                    <input type="text" value={data.address} onChange={e => setData('address', e.target.value)}
                      className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${errors.address ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`} />
                    {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
                  </div>
                </div>

              </form>
            </div>

            <div className="p-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex gap-3 justify-end">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:text-slate-800 dark:hover:text-white transition-colors">
                Cancel
              </button>
              <button type="submit" form="bidder-form" disabled={processing}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-60">
                <Check className="w-4 h-4" />
                {processing ? 'Saving...' : editingBidder ? 'Save Changes' : 'Add Bidder'}
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
    </div>
  );
}
