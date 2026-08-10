import { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { ArrowLeft, Printer, X, Plus } from 'lucide-react';
import { Item, Category } from '../types';

interface PrintReportProps {
  items: Item[];
  categories: Category[];
  onBack: () => void;
}

export default function PrintReport({ items, categories, onBack }: PrintReportProps) {
  const activeItems = useMemo(() => items.filter(item => !item.deleted_at), [items]);

  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());

  const handleCategoryChange = (index: number, newCategoryId: number) => {
    const oldCategoryId = selectedCategories[index];
    const newSelectedCategories = [...selectedCategories];
    newSelectedCategories[index] = newCategoryId;
    setSelectedCategories(newSelectedCategories);
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      activeItems.filter(i => i.category_id === oldCategoryId).forEach(i => next.delete(i.id));
      activeItems.filter(i => i.category_id === newCategoryId).forEach(i => next.add(i.id));
      return next;
    });
  };

  const handleRemoveCategory = (index: number) => {
    const catId = selectedCategories[index];
    setSelectedCategories(selectedCategories.filter((_, i) => i !== index));
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      activeItems.filter(i => i.category_id === catId).forEach(i => next.delete(i.id));
      return next;
    });
  };

  const handleAddCategory = () => {
    const available = categories.filter(c => !selectedCategories.includes(c.id));
    if (available.length === 0) return;
    const catToAdd = available[0].id;
    setSelectedCategories([...selectedCategories, catToAdd]);
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      activeItems.filter(i => i.category_id === catToAdd).forEach(i => next.add(i.id));
      return next;
    });
  };

  const handleToggleItem = (itemId: number) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
      return next;
    });
  };

  const handleToggleAllCategoryItems = (categoryId: number, isAllSelected: boolean) => {
    const catItems = activeItems.filter(i => i.category_id === categoryId);
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (isAllSelected) catItems.forEach(i => next.delete(i.id));
      else catItems.forEach(i => next.add(i.id));
      return next;
    });
  };

  const handlePrint = () => {
    // Log the print action
    const selectedCategoryNames = selectedCategories
      .map(id => categories.find(c => c.id === id)?.name)
      .filter(Boolean) as string[];

    router.post('/report/log', {
      categories: selectedCategoryNames,
      item_count: selectedItemIds.size,
    }, {
      preserveState: true,
      onSuccess: () => {
        const itemIds = Array.from(selectedItemIds).join(',');
        window.open(`/report/view?items=${itemIds}`, '_blank');
      },
      onError: () => {
        // Fallback in case of validation error
        const itemIds = Array.from(selectedItemIds).join(',');
        window.open(`/report/view?items=${itemIds}`, '_blank');
      }
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 print:block print:bg-white text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Sidebar for filtering */}
      <div className="w-80 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0 flex flex-col print:hidden overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <button onClick={onBack} className="text-slate-600 dark:text-slate-400 flex items-center gap-2 hover:text-slate-900 dark:hover:text-white font-medium transition-colors mb-4">
            <ArrowLeft className="w-5 h-5" /> Back to Application
          </button>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Report Filters</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Select items to include in print</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {selectedCategories.map((categoryId, index) => {
            const categoryItems = activeItems.filter(item => item.category_id === categoryId);
            const allSelected = categoryItems.every(item => selectedItemIds.has(item.id)) && categoryItems.length > 0;
            const someSelected = categoryItems.some(item => selectedItemIds.has(item.id));
            return (
              <div key={index} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <select value={categoryId} onChange={e => handleCategoryChange(index, Number(e.target.value))}
                    className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100">
                    {categories.map(c => (
                      <option key={c.id} value={c.id} disabled={selectedCategories.includes(c.id) && c.id !== categoryId}>{c.name}</option>
                    ))}
                  </select>
                  <button onClick={() => handleRemoveCategory(index)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {categoryItems.length > 0 && (
                  <div className="flex items-center gap-2 px-2 py-1.5 mb-2 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                    onClick={() => handleToggleAllCategoryItems(categoryId, allSelected)}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${allSelected ? 'bg-blue-600 border-blue-600' : someSelected ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-600' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}>
                      {allSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                      {!allSelected && someSelected && <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-sm" />}
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Select All Items</span>
                  </div>
                )}

                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {categoryItems.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 px-2">No active items in this category.</p>
                  ) : (
                    categoryItems.map(item => (
                      <div key={item.id} className="flex items-center gap-2 p-2 text-sm text-slate-600 cursor-pointer hover:bg-slate-100 rounded-lg transition-colors"
                        onClick={() => handleToggleItem(item.id)}>
                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-colors shrink-0 ${selectedItemIds.has(item.id) ? 'bg-blue-600 text-white border-blue-600' : 'border border-slate-300 bg-white'}`}>
                          {selectedItemIds.has(item.id) && <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                        </div>
                        <span className="truncate w-full block" title={item.name}>{item.name}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}

          {selectedCategories.length < categories.length && (
            <button onClick={handleAddCategory} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-semibold hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" /> Add Category
            </button>
          )}
        </div>
      </div>

      {/* Print Preview */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 dark:bg-slate-900 print:bg-white print:p-0 print:overflow-visible">
        
        {/* Top Action Bar */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-10 print:hidden shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Report Preview</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Select items on the left to include in the report</p>
          </div>
          <button onClick={handlePrint} disabled={selectedItemIds.size === 0}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <Printer className="w-5 h-5" /> Generate Official Report ({selectedItemIds.size})
          </button>
        </div>

        <div className="flex-1 p-8 print:p-0">
          <div className="max-w-4xl mx-auto bg-white p-12 shadow-sm border border-slate-200 print:max-w-none print:border-none print:shadow-none print:p-0">
            <div className="text-center mb-10 border-b-2 border-slate-200 pb-8 flex flex-col items-center">
            <img src="/brhmc-logo.png" alt="BRHMC Logo" className="h-24 mb-4 object-contain" />
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2 uppercase">Bicol Regional Hospital and Medical Center</h1>
            <h2 className="text-xl font-bold text-blue-700 tracking-widest uppercase">Procurement Catalog System Report</h2>
            <p className="text-slate-500 font-medium mt-3">Generated on {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          {categories.map(category => {
            if (!selectedCategories.includes(category.id)) return null;
            const categoryItems = activeItems.filter(item => item.category_id === category.id && selectedItemIds.has(item.id));
            if (categoryItems.length === 0) return null;
            return (
              <div key={category.id} className="mb-10">
                <h3 className="text-xl font-bold bg-slate-100 text-slate-800 p-3 mb-4 border-l-4 border-blue-600 flex items-center justify-between print:bg-slate-50">
                  {category.name}
                  <span className="text-sm font-medium text-slate-500">{categoryItems.length} items</span>
                </h3>
                <table className="w-full text-left border-collapse mb-4 text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-800">
                      <th className="py-2 px-3 font-bold text-slate-900">Item Code</th>
                      <th className="py-2 px-3 font-bold text-slate-900">Name & Description</th>
                      <th className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap">Unit Type</th>
                      <th className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap text-right">Unit Cost (₱)</th>
                      <th className="py-2 px-3 font-bold text-slate-900 text-right">Quantity</th>
                      <th className="py-2 px-3 font-bold text-slate-900 text-right whitespace-nowrap">ABC (₱)</th>

                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {categoryItems.map(item => (
                      <tr key={item.id} className="break-inside-avoid">
                        <td className="py-4 px-3 font-mono font-medium text-slate-700 align-top w-28 uppercase">{item.item_code}</td>
                        <td className="py-4 px-3 align-top">
                          <div className="font-bold text-slate-900 text-base">{item.name}</div>
                          <div className="text-slate-600 text-sm mt-1 mb-2 leading-relaxed">{item.description}</div>
                        </td>
                        <td className="py-4 px-3 align-top text-slate-700 font-medium">{item.unit_type}</td>
                        <td className="py-4 px-3 align-top text-right font-medium text-slate-900 whitespace-nowrap">₱{Number(item.unit_cost).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                        <td className="py-4 px-3 align-top text-right font-medium text-slate-900">{item.quantity}</td>
                        <td className="py-4 px-3 align-top text-right font-bold text-slate-900 whitespace-nowrap">₱{Number(item.abc).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}

          <div className="mt-16 pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
            <p>*** END OF REPORT ***</p>
            <p className="mt-1">Generated by PCS Portal Admin Interface</p>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
