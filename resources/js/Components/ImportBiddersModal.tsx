import React, { useState, useRef } from 'react';
import { X, Upload, Download, FileText, CheckCircle2, AlertCircle, Users, HelpCircle, ArrowRight, ChevronDown, ChevronUp, Info, Building } from 'lucide-react';

interface ImportBiddersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => void;
  isProcessing: boolean;
}

export default function ImportBiddersModal({
  isOpen,
  onClose,
  onImport,
  isProcessing,
}: ImportBiddersModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const validateAndSetFile = (file: File) => {
    setErrorMessage(null);
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      setErrorMessage('Please upload a valid CSV file (.csv format).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 5MB limit.');
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = [
      'Bidder Code,Bidder Name,Contact Person,Contact Number,Email,Address,Location',
      'BDR-001,Alpha Medtech Corporation,Juan Dela Cruz,+63 912 345 6789,contact@alphamed.com,"123 Medical Drive, Manila",Manila City',
      'BDR-002,Beta Diagnostics Inc.,Maria Santos,+63 920 987 6543,sales@betadiag.com,"456 Science Ave, Quezon City",Quezon City',
      'BDR-003,Gamma Healthcare Solutions,Pedro Reyes,+63 933 111 2222,info@gammahealth.ph,"789 Pharma Road, Pasig City",Pasig City',
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'bidders_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please select or drop a CSV file to import.');
      return;
    }
    onImport(selectedFile);
  };

  const handleClose = () => {
    if (isProcessing) return;
    setSelectedFile(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-600 dark:text-fuchsia-400 rounded-xl border border-fuchsia-200/60 dark:border-fuchsia-800/60">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bulk Import Bidders via CSV</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Add multiple registered bidders and their contact information quickly using a spreadsheet.</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Step 1: Download Template */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold">1</span>
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Download Ready-to-Use Template</h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Get our pre-formatted CSV template with valid column headers and sample bidder entries.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl text-xs font-semibold shadow-sm transition-all shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download Template (.CSV)
            </button>
          </div>

          {/* Step 2: Input Instructions & Field Guide (Collapsible) */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900/40 shadow-sm transition-all">
            <button
              type="button"
              onClick={() => setIsGuideOpen(prev => !prev)}
              className="w-full flex items-center justify-between p-3.5 text-left bg-slate-50/90 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">2</span>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                    CSV Columns & Required Formats
                  </h4>
                  <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 border border-blue-200/60 dark:border-blue-800/60 px-2 py-0.5 rounded-full">
                    {isGuideOpen ? 'Click to collapse' : 'Click to view instructions & format guide'}
                  </span>
                </div>
              </div>
              <div className="p-1 rounded-md text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                {isGuideOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {isGuideOpen && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in duration-150">
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/75 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                        <th className="p-2.5">Column Header</th>
                        <th className="p-2.5">Requirement</th>
                        <th className="p-2.5">Data Type</th>
                        <th className="p-2.5">Description & Example</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-300">
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">Bidder Code</td>
                        <td className="p-2.5"><span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">Required</span></td>
                        <td className="p-2.5 font-mono text-[11px]">Text (Unique)</td>
                        <td className="p-2.5">Unique short code identifying the bidder (e.g. <code className="text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded">BDR-001</code>, <code className="text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded">ALPHA</code>)</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">Bidder Name</td>
                        <td className="p-2.5"><span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">Required</span></td>
                        <td className="p-2.5 font-mono text-[11px]">Text</td>
                        <td className="p-2.5">Full company or vendor name (e.g. <code className="text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded">Alpha Medtech Corporation</code>)</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">Contact Person</td>
                        <td className="p-2.5"><span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Optional</span></td>
                        <td className="p-2.5 font-mono text-[11px]">Text</td>
                        <td className="p-2.5">Representative or account officer (e.g. <code className="text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded">Juan Dela Cruz</code>)</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">Contact Number</td>
                        <td className="p-2.5"><span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Optional</span></td>
                        <td className="p-2.5 font-mono text-[11px]">Text</td>
                        <td className="p-2.5">Telephone or mobile phone number (e.g. <code className="text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded">+63 912 345 6789</code>)</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">Email</td>
                        <td className="p-2.5"><span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Optional</span></td>
                        <td className="p-2.5 font-mono text-[11px]">Valid Email</td>
                        <td className="p-2.5">Official company email address (e.g. <code className="text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded">contact@alphamed.com</code>)</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">Address</td>
                        <td className="p-2.5"><span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Optional</span></td>
                        <td className="p-2.5 font-mono text-[11px]">Text</td>
                        <td className="p-2.5">Physical or business address (e.g. <code className="text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded">123 Medical Drive, Manila</code>)</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">Location</td>
                        <td className="p-2.5"><span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Optional</span></td>
                        <td className="p-2.5 font-mono text-[11px]">Text</td>
                        <td className="p-2.5">City, municipality, or region (e.g. <code className="text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded">Manila City</code>, <code className="text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded">Quezon City</code>)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Information Note */}
                <div className="bg-fuchsia-50/70 dark:bg-fuchsia-950/30 border border-fuchsia-200 dark:border-fuchsia-800/60 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-fuchsia-900 dark:text-fuchsia-300">
                    <Building className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400 shrink-0" />
                    <h5 className="text-xs font-bold uppercase tracking-wider">Bidder Code Uniqueness</h5>
                  </div>
                  <p className="text-xs text-fuchsia-900/80 dark:text-fuchsia-300/80 leading-relaxed">
                    Each bidder must have a distinct <strong className="font-semibold text-fuchsia-950 dark:text-fuchsia-200">Bidder Code</strong>. If a code already exists in the system or appears more than once in the CSV file, that row will be reported as an error while all other valid rows will be imported safely.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Drag and Drop Upload Zone */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold">3</span>
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Upload Your Completed CSV</h4>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-6 transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-900/20 scale-[0.99]'
                  : selectedFile
                  ? 'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50/60 dark:hover:bg-slate-800/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,application/vnd.ms-excel"
                onChange={handleFileChange}
                className="hidden"
              />

              {!selectedFile ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Drag and drop your CSV file here, or <span className="text-blue-600 dark:text-blue-400 underline">browse files</span>
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Supports .csv files up to 5MB
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 shadow-sm w-full max-w-md">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {(selectedFile.size / 1024).toFixed(1)} KB &bull; Ready to import
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs bg-rose-50 dark:bg-rose-950/30 p-3 rounded-lg border border-rose-200 dark:border-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isProcessing}
            className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:text-slate-800 dark:hover:text-white transition-colors text-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedFile || isProcessing}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isProcessing ? 'Importing Bidders...' : 'Upload & Import CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}
