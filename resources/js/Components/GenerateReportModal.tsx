import { useState, useEffect } from 'react';
import { X, FileSpreadsheet, Calendar, Clock, MapPin, Building, Hash, FileText } from 'lucide-react';
import { ReportMetadata } from '../types';

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (metadata: ReportMetadata) => void;
  itemCount: number;
  defaultContractName?: string;
}

const STORAGE_KEY = 'pcs_last_report_metadata';

export default function GenerateReportModal({
  isOpen,
  onClose,
  onGenerate,
  itemCount,
  defaultContractName = 'Procurement of Medical Supplies',
}: GenerateReportModalProps) {
  const getInitialDate = () => {
    return new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getInitialTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const [formData, setFormData] = useState<ReportMetadata>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          project_ref_no: parsed.project_ref_no || 'PB 22-2026',
          contract_name: parsed.contract_name || defaultContractName,
          contract_location: parsed.contract_location || 'BRHMC-Daraga, Albay',
          implementing_office: parsed.implementing_office || 'Bicol Regional Hospital and Medical Center',
          report_date: parsed.report_date || getInitialDate(),
          report_time: parsed.report_time || getInitialTime(),
        };
      }
    } catch (e) {
      // Ignore localStorage read errors
    }

    return {
      project_ref_no: 'PB 22-2026',
      contract_name: defaultContractName,
      contract_location: 'BRHMC-Daraga, Albay',
      implementing_office: 'Bicol Regional Hospital and Medical Center',
      report_date: getInitialDate(),
      report_time: getInitialTime(),
    };
  });

  useEffect(() => {
    if (isOpen) {
      // Update date and time if empty or needed
      setFormData(prev => ({
        ...prev,
        contract_name: prev.contract_name || defaultContractName,
        report_date: prev.report_date || getInitialDate(),
        report_time: prev.report_time || getInitialTime(),
      }));
    }
  }, [isOpen, defaultContractName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (err) {
      // Ignore localStorage errors
    }
    onGenerate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-xl w-full p-7 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Official Report Parameters
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generating Abstract of Bids for <span className="font-bold text-blue-600 dark:text-blue-400">{itemCount}</span> selected item(s)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Contract Name
              </label>
              <input
                type="text"
                required
                value={formData.contract_name}
                onChange={e => setFormData({ ...formData, contract_name: e.target.value })}
                placeholder="e.g. Procurement of Medical Supplies"
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-slate-400" /> Project Reference No.
              </label>
              <input
                type="text"
                required
                value={formData.project_ref_no}
                onChange={e => setFormData({ ...formData, project_ref_no: e.target.value })}
                placeholder="e.g. PB 22-2026"
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Contract Location
              </label>
              <input
                type="text"
                required
                value={formData.contract_location}
                onChange={e => setFormData({ ...formData, contract_location: e.target.value })}
                placeholder="e.g. BRHMC-Daraga, Albay"
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" /> Implementing Office
                </label>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  Fixed
                </span>
              </div>
              <input
                type="text"
                readOnly
                disabled
                value={formData.implementing_office}
                className="w-full bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 cursor-not-allowed opacity-90 select-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Report Date
              </label>
              <input
                type="text"
                required
                value={formData.report_date}
                onChange={e => setFormData({ ...formData, report_date: e.target.value })}
                placeholder="e.g. July 20, 2026"
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Report Time
              </label>
              <input
                type="text"
                required
                value={formData.report_time}
                onChange={e => setFormData({ ...formData, report_time: e.target.value })}
                placeholder="e.g. 01:30PM"
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-700 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" /> Open Official Report View
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
