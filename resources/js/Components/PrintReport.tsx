import { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { ArrowLeft, Printer, X, Plus, CheckSquare, Layers } from 'lucide-react';
import { Item, Category, ReportMetadata } from '../types';
import { calculateItemRankings, getMaxRankColumns } from '../utils/bidderRanking';
import GenerateReportModal from './GenerateReportModal';

interface PrintReportProps {
  items: Item[];
  categories: Category[];
  onBack: () => void;
}

export default function PrintReport({ items, categories, onBack }: PrintReportProps) {
  const activeItems = useMemo(() => items.filter(item => !item.deleted_at), [items]);

  const [selectedCategories, setSelectedCategories] = useState<number[]>(() => {
    return categories.length > 0 ? [categories[0].id] : [];
  });

  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(() => {
    const initialIds = new Set<number>();
    if (categories.length > 0) {
      activeItems.filter(i => i.category_id === categories[0].id).forEach(i => initialIds.add(i.id));
    }
    return initialIds;
  });

  const [isParamModalOpen, setIsParamModalOpen] = useState(false);

  const isAllProjectsSelected = activeItems.length > 0 && selectedItemIds.size === activeItems.length;

  const handleToggleAllProjects = () => {
    if (isAllProjectsSelected) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedCategories(categories.map(c => c.id));
      setSelectedItemIds(new Set(activeItems.map(i => i.id)));
    }
  };

  // Selected items list
  const selectedItemsList = useMemo(() => {
    return activeItems.filter(item => selectedItemIds.has(item.id));
  }, [activeItems, selectedItemIds]);

  const rankColumnsCount = useMemo(() => {
    return getMaxRankColumns(selectedItemsList, 5);
  }, [selectedItemsList]);

  const rankHeaders = useMemo(() => {
    return Array.from({ length: rankColumnsCount }, (_, i) => `RANK ${i + 1}`);
  }, [rankColumnsCount]);

  const defaultContractName = useMemo(() => {
    if (selectedCategories.length === 1) {
      const cat = categories.find(c => c.id === selectedCategories[0]);
      if (cat) return `Procurement of ${cat.name}`;
    }
    if (selectedCategories.length === categories.length && categories.length > 1) {
      return 'Procurement of All Project Supplies';
    }
    return 'Procurement of Medical Supplies';
  }, [selectedCategories, categories]);

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
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
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

  const handleOpenGenerateModal = () => {
    if (selectedItemIds.size === 0) return;
    setIsParamModalOpen(true);
  };

  const handleGenerateConfirm = (metadata: ReportMetadata) => {
    setIsParamModalOpen(false);

    const selectedCategoryNames = selectedCategories
      .map(id => categories.find(c => c.id === id)?.name)
      .filter(Boolean) as string[];

    router.post(
      '/report/log',
      {
        categories: selectedCategoryNames,
        item_count: selectedItemIds.size,
        contract_name: metadata.contract_name,
        project_ref_no: metadata.project_ref_no,
      },
      {
        preserveState: true,
        onSuccess: () => {
          openReportWindow(metadata);
        },
        onError: () => {
          openReportWindow(metadata);
        },
      }
    );
  };

  const openReportWindow = (metadata: ReportMetadata) => {
    const itemIds = Array.from(selectedItemIds).join(',');
    const params = new URLSearchParams({
      items: itemIds,
      project_ref_no: metadata.project_ref_no,
      contract_name: metadata.contract_name,
      contract_location: metadata.contract_location,
      implementing_office: metadata.implementing_office,
      report_date: metadata.report_date,
      report_time: metadata.report_time,
    });
    window.open(`/report/view?${params.toString()}`, '_blank');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 print:block print:bg-white text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Sidebar for filtering */}
      <div className="w-80 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0 flex flex-col print:hidden overflow-hidden shrink-0">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={onBack}
            className="text-slate-600 dark:text-slate-400 flex items-center gap-2 hover:text-slate-900 dark:hover:text-white font-medium transition-colors mb-3 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Master Projects
          </button>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Report Filters</h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {selectedItemIds.size} / {activeItems.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Select categories & items for Abstract of Bids</p>

          {/* Quick Select All Toggle Button */}
          <button
            type="button"
            onClick={handleToggleAllProjects}
            className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
              isAllProjectsSelected
                ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            {isAllProjectsSelected ? 'Deselect All Projects' : `Select All Projects (${activeItems.length} Items)`}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {selectedCategories.map((categoryId, index) => {
            const categoryItems = activeItems.filter(item => item.category_id === categoryId);
            const allSelected =
              categoryItems.every(item => selectedItemIds.has(item.id)) && categoryItems.length > 0;
            const someSelected = categoryItems.some(item => selectedItemIds.has(item.id));

            return (
              <div
                key={index}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <select
                    value={categoryId}
                    onChange={e => handleCategoryChange(index, Number(e.target.value))}
                    className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                  >
                    {categories.map(c => (
                      <option
                        key={c.id}
                        value={c.id}
                        disabled={selectedCategories.includes(c.id) && c.id !== categoryId}
                      >
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleRemoveCategory(index)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {categoryItems.length > 0 && (
                  <div
                    className="flex items-center gap-2 px-2 py-1.5 mb-2 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                    onClick={() => handleToggleAllCategoryItems(categoryId, allSelected)}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        allSelected
                          ? 'bg-blue-600 border-blue-600'
                          : someSelected
                          ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-600'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {allSelected && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                            d="M5 13l4 4L19 7"
                          ></path>
                        </svg>
                      )}
                      {!allSelected && someSelected && (
                        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-sm" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Select All Items ({categoryItems.length})
                    </span>
                  </div>
                )}

                <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                  {categoryItems.length === 0 ? (
                    <p className="text-xs text-slate-400 px-2 py-1">No items in this category.</p>
                  ) : (
                    categoryItems.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        onClick={() => handleToggleItem(item.id)}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-colors shrink-0 ${
                            selectedItemIds.has(item.id)
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                          }`}
                        >
                          {selectedItemIds.has(item.id) && (
                            <svg
                              className="w-2.5 h-2.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                d="M5 13l4 4L19 7"
                              ></path>
                            </svg>
                          )}
                        </div>
                        <span className="truncate w-full block font-medium" title={item.name}>
                          {item.name}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}

          <div className="space-y-2 pt-2">
            {selectedCategories.length < categories.length && (
              <button
                type="button"
                onClick={handleAddCategory}
                className="w-full py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 font-bold text-xs hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Category Filter
              </button>
            )}

            {!isAllProjectsSelected && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategories(categories.map(c => c.id));
                  setSelectedItemIds(new Set(activeItems.map(i => i.id)));
                }}
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Layers className="w-3.5 h-3.5" /> Include All {categories.length} Categories
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-slate-100 dark:bg-slate-900">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between p-4 md:px-8 md:py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-10 shadow-sm">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Abstract of Bids Preview
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {selectedItemIds.size} of {activeItems.length} item(s) selected • Dynamic Ranking ({rankColumnsCount} Rank Columns)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleAllProjects}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <CheckSquare className="w-4 h-4" />
              {isAllProjectsSelected ? 'Deselect All' : 'Select All Projects'}
            </button>
            <button
              onClick={handleOpenGenerateModal}
              disabled={selectedItemIds.size === 0}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm shadow-sm hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="w-4 h-4" /> Generate Official Report ({selectedItemIds.size})
            </button>
          </div>
        </div>

        {/* Preview Sheet Area */}
        <div className="flex-1 p-6 md:p-8">
          <div className="max-w-6xl mx-auto bg-white p-8 md:p-10 shadow-md border border-slate-200 text-black">
            
            {/* Header: Hospital Left, Ref & Logo Far-Right */}
            <div className="flex justify-between items-start mb-4 pb-2">
              <div className="text-left text-xs leading-tight text-black">
                <div className="font-bold text-sm">Bicol Regional Hospital and Medical Center</div>
                <div className="text-slate-600">Daraga, Albay</div>
              </div>
              <div className="flex items-center gap-4 text-right">
                <div className="text-xs font-bold text-black">
                  Project Reference No.: <span className="font-mono text-blue-700">PB 22-2026</span>
                </div>
                <img
                  src="/brhmc-logo.png"
                  alt="BRHMC Logo"
                  className="h-14 w-14 object-contain shrink-0"
                />
              </div>
            </div>

            {/* Title */}
            <div className="text-center my-3">
              <h1 className="text-base font-black tracking-wider uppercase text-black">
                ABSTRACT OF BIDS AS CALCULATED
              </h1>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 text-[11px] leading-snug mb-5 text-black">
              <div className="space-y-0.5">
                <div>
                  <span className="font-semibold text-slate-600 inline-block w-32">Contract Name:</span>
                  <span className="font-bold uppercase">{defaultContractName}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-600 inline-block w-32">Contract Location:</span>
                  <span>BRHMC-Daraga, Albay</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-600 inline-block w-32">Implementing Office:</span>
                  <span>Bicol Regional Hospital and Medical Center</span>
                </div>
              </div>
              <div className="text-right space-y-0.5 self-start">
                <div>
                  <span className="font-semibold text-slate-600 inline-block w-16 text-left">Date:</span>
                  <span className="font-medium">
                    {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-600 inline-block w-16 text-left">Time:</span>
                  <span className="font-medium">
                    {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </span>
                </div>
              </div>
            </div>

            {/* Table */}
            {selectedItemsList.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                <p className="text-sm font-semibold">No items selected to display in preview.</p>
                <p className="text-xs mt-1">Select items or categories from the left filter panel.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[10px] leading-tight border-2 border-black">
                  <thead>
                    <tr className="border-b-2 border-black bg-white text-black font-bold">
                      <th className="border border-black p-1 text-center w-10">Item<br />No.</th>
                      <th className="border border-black p-1.5 text-center min-w-[180px]">Item Description</th>
                      <th className="border border-black p-1 text-center w-10">Qty</th>
                      <th className="border border-black p-1 text-center w-12">Unit</th>
                      <th className="border border-black p-1 text-center w-20 whitespace-nowrap">unit cost</th>
                      <th className="border border-black p-1 text-center w-20 whitespace-nowrap">ABC</th>
                      {rankHeaders.map((header, idx) => (
                        <th
                          key={idx}
                          className="border border-black p-1 text-center min-w-[100px] uppercase whitespace-nowrap"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItemsList.map((item, idx) => {
                      const rankedTiers = calculateItemRankings(item);
                      const isNoBid = rankedTiers.length === 0;

                      return (
                        <tr
                          key={item.id}
                          className={`border-b border-black ${
                            isNoBid ? 'bg-[#ffff00]' : 'bg-white'
                          }`}
                        >
                          <td className="border border-black p-1 text-center font-bold align-middle">
                            {idx + 1}
                          </td>
                          <td className="border border-black p-1.5 text-left align-top">
                            <div className="font-semibold text-black leading-snug">{item.name}</div>
                            {item.description && item.description !== item.name && (
                              <div className="text-[9px] text-slate-700 mt-0.5 leading-snug line-clamp-3">
                                {item.description}
                              </div>
                            )}
                          </td>
                          <td className="border border-black p-1 text-center align-middle font-medium">
                            {item.quantity}
                          </td>
                          <td className="border border-black p-1 text-center align-middle font-medium uppercase">
                            {item.unit_type}
                          </td>
                          <td className="border border-black p-1 text-right align-middle font-medium whitespace-nowrap">
                            {Number(item.unit_cost).toLocaleString('en-PH', {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="border border-black p-1 text-right align-middle font-bold whitespace-nowrap">
                            {Number(item.abc).toLocaleString('en-PH', {
                              minimumFractionDigits: 2,
                            })}
                          </td>

                          {isNoBid ? (
                            <td
                              colSpan={rankColumnsCount}
                              className="border border-black p-2 text-center font-bold text-xs uppercase align-middle text-black"
                            >
                              NO BIDDER
                            </td>
                          ) : (
                            rankHeaders.map((_, colIdx) => {
                              const tier = rankedTiers[colIdx];
                              if (!tier || tier.length === 0) {
                                return (
                                  <td key={colIdx} className="border border-black p-1 text-center">
                                    &nbsp;
                                  </td>
                                );
                              }

                              return (
                                <td
                                  key={colIdx}
                                  className="border border-black p-1 text-center align-top space-y-1.5"
                                >
                                  {tier.map((entry, bIdx) => (
                                    <div
                                      key={bIdx}
                                      className={`text-[9.5px] leading-tight ${
                                        bIdx > 0 ? 'pt-1 border-t border-slate-200' : ''
                                      }`}
                                    >
                                      <div className="font-bold text-right mb-0.5">
                                        {entry.totalCost.toLocaleString('en-PH', {
                                          minimumFractionDigits: 2,
                                        })}
                                      </div>
                                      <div className="font-semibold text-center text-black">
                                        {entry.bidder.name}
                                      </div>
                                      {(entry.bidder.location || entry.bidder.address) && (
                                        <div className="text-[8.5px] text-slate-600 text-center">
                                          {entry.bidder.location || entry.bidder.address}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </td>
                              );
                            })
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Parameter Prompt Modal */}
      <GenerateReportModal
        isOpen={isParamModalOpen}
        onClose={() => setIsParamModalOpen(false)}
        onGenerate={handleGenerateConfirm}
        itemCount={selectedItemIds.size}
        defaultContractName={defaultContractName}
      />
    </div>
  );
}
