import { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, Users, Check, X, ShieldAlert } from 'lucide-react';
import { Signatory, AuthUser } from '../types';
import ConfirmationModal from './ConfirmationModal';

interface SignatoriesSettingsProps {
  signatories: Signatory[];
  user: AuthUser;
}

export default function SignatoriesSettings({ signatories = [], user }: SignatoriesSettingsProps) {
  const canManage = user.role === 'administrator' || user.role === 'developer';

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSignatory, setEditingSignatory] = useState<Signatory | null>(null);
  const [signatoryToDelete, setSignatoryToDelete] = useState<Signatory | null>(null);

  const addForm = useForm({
    name: '',
    designation: '',
  });

  const editForm = useForm({
    name: '',
    designation: '',
    order: 0,
    is_active: true,
  });

  if (!canManage) {
    return null;
  }

  const handleOpenAdd = () => {
    addForm.reset();
    addForm.clearErrors();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (sig: Signatory) => {
    editForm.setData({
      name: sig.name,
      designation: sig.designation,
      order: sig.order,
      is_active: sig.is_active,
    });
    editForm.clearErrors();
    setEditingSignatory(sig);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addForm.post('/settings/signatories', {
      preserveScroll: true,
      onSuccess: () => {
        setIsAddModalOpen(false);
        addForm.reset();
      },
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSignatory) return;
    editForm.put(`/settings/signatories/${editingSignatory.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setEditingSignatory(null);
      },
    });
  };

  const handleDeleteConfirm = () => {
    if (!signatoryToDelete) return;
    router.delete(`/settings/signatories/${signatoryToDelete.id}`, {
      preserveScroll: true,
      onSuccess: () => setSignatoryToDelete(null),
    });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === signatories.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...signatories];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    const payload = reordered.map((item, idx) => ({
      id: item.id,
      order: idx + 1,
    }));

    router.post(
      '/settings/signatories/reorder',
      { signatories: payload },
      { preserveScroll: true }
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Official Report Signatories</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure BAC & TWG signatories rendered in the 3-column grid at the bottom of the Abstract of Bids report.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Signatory
        </button>
      </div>

      <div className="p-6">
        {signatories.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No signatories configured yet.</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">Add the BAC committee and TWG members who will sign the official report.</p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm inline-flex items-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add First Signatory
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4 w-16 text-center">Order</th>
                  <th className="py-3 px-4">Full Name & Title</th>
                  <th className="py-3 px-4">Designation / Role</th>
                  <th className="py-3 px-4 text-center w-28">Position</th>
                  <th className="py-3 px-4 text-right w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {signatories.map((sig, index) => (
                  <tr key={sig.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-4 text-center font-bold text-slate-400 dark:text-slate-500 text-xs">
                      #{index + 1}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {sig.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                        {sig.designation}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMove(index, 'up')}
                          title="Move Up"
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={index === signatories.length - 1}
                          onClick={() => handleMove(index, 'down')}
                          title="Move Down"
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(sig)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Edit Signatory"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSignatoryToDelete(sig)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                          title="Delete Signatory"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Signatory Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add New Signatory</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Full Name & Titles
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AILEEN C. MERIOLES, MD, FPCP"
                  value={addForm.data.name}
                  onChange={e => addForm.setData('name', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
                {addForm.errors.name && (
                  <p className="text-xs text-rose-500 mt-1">{addForm.errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Designation / Committee Role
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BAC Chairperson, BAC Member, TWG Member"
                  value={addForm.data.designation}
                  onChange={e => addForm.setData('designation', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
                {addForm.errors.designation && (
                  <p className="text-xs text-rose-500 mt-1">{addForm.errors.designation}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addForm.processing}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-sm transition-colors disabled:opacity-50"
                >
                  Add Signatory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Signatory Modal */}
      {editingSignatory && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Signatory</h3>
              <button
                type="button"
                onClick={() => setEditingSignatory(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Full Name & Titles
                </label>
                <input
                  type="text"
                  required
                  value={editForm.data.name}
                  onChange={e => editForm.setData('name', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
                {editForm.errors.name && (
                  <p className="text-xs text-rose-500 mt-1">{editForm.errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Designation / Committee Role
                </label>
                <input
                  type="text"
                  required
                  value={editForm.data.designation}
                  onChange={e => editForm.setData('designation', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
                {editForm.errors.designation && (
                  <p className="text-xs text-rose-500 mt-1">{editForm.errors.designation}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingSignatory(null)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editForm.processing}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-sm transition-colors disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!signatoryToDelete}
        onClose={() => setSignatoryToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Signatory"
        message={`Are you sure you want to remove '${signatoryToDelete?.name}' from the official report signatories?`}
        confirmLabel="Delete Signatory"
        isDanger={true}
      />
    </div>
  );
}
