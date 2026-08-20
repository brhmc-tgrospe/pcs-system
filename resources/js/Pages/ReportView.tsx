import { useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { Printer, ArrowLeft } from 'lucide-react';
import { Item, Category, Signatory, ReportMetadata } from '../types';
import { calculateItemRankings, getMaxRankColumns } from '../utils/bidderRanking';

interface ReportViewProps {
  items: Item[];
  categories: Category[];
  signatories: Signatory[];
  metadata: ReportMetadata;
  timestamp: string;
}

export default function ReportView({
  items,
  categories,
  signatories,
  metadata,
  timestamp,
}: ReportViewProps) {
  // Determine dynamic rank column count across all selected items (minimum 5)
  const rankColumnsCount = useMemo(() => getMaxRankColumns(items, 5), [items]);

  const rankHeaders = useMemo(() => {
    return Array.from({ length: rankColumnsCount }, (_, i) => `RANK ${i + 1}`);
  }, [rankColumnsCount]);

  return (
    <div
      className="min-h-screen bg-slate-100 py-6 print:py-0 print:bg-white font-sans text-black"
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
    >
      <Head title={`Abstract of Bids - ${metadata.contract_name || 'Official Report'}`} />

      {/* Floating Action Bar (Hidden in Print) */}
      <div className="max-w-[340mm] mx-auto mb-4 flex justify-between items-center print:hidden px-4">
        <button
          onClick={() => window.close()}
          className="flex items-center gap-2 text-slate-700 hover:text-slate-900 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 text-sm font-semibold transition-all hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" /> Close Window
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">
            Landscape A4 / Widescreen • {items.length} Items Selected
          </span>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold shadow-md transition-all text-sm"
          >
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Main Printable Document Canvas */}
      <div className="report-sheet max-w-[340mm] mx-auto bg-white p-8 md:p-10 shadow-xl print:shadow-none print:p-0 print:max-w-none print:w-full">
        
        {/* Header: Hospital Info on Left, Project Ref on Right, BRHMC Logo at far-right */}
        <div className="flex justify-between items-start mb-4 pb-2">
          {/* Top Left: Hospital Name & Location */}
          <div className="text-left text-xs text-black leading-tight">
            <div className="font-bold text-sm">Bicol Regional Hospital and Medical Center</div>
            <div className="text-slate-700">Daraga, Albay</div>
          </div>

          {/* Top Right: Project Reference No. & Logo */}
          <div className="flex items-center gap-4 text-right">
            <div className="text-xs font-bold text-black">
              Project Reference No.: <span className="font-mono">{metadata.project_ref_no || 'PB 22-2026'}</span>
            </div>
            <img
              src="/brhmc-logo.png"
              alt="BRHMC Logo"
              className="h-16 w-16 object-contain shrink-0"
            />
          </div>
        </div>

        {/* Centered Document Title */}
        <div className="text-center my-3">
          <h1 className="text-base font-black tracking-wider uppercase text-black font-sans">
            ABSTRACT OF BIDS AS CALCULATED
          </h1>
        </div>

        {/* Metadata Details Row */}
        <div className="grid grid-cols-2 text-[11px] text-black leading-snug mb-5">
          <div className="space-y-0.5">
            <div>
              <span className="font-semibold text-slate-700 inline-block w-32">Contract Name:</span>
              <span className="font-bold uppercase">{metadata.contract_name || 'Procurement of Medical Supplies'}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-700 inline-block w-32">Contract Location:</span>
              <span>{metadata.contract_location || 'BRHMC-Daraga, Albay'}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-700 inline-block w-32">Implementing Office:</span>
              <span>{metadata.implementing_office || 'Bicol Regional Hospital and Medical Center'}</span>
            </div>
          </div>
          <div className="text-right space-y-0.5 self-start">
            <div>
              <span className="font-semibold text-slate-700 inline-block w-16 text-left">Date:</span>
              <span className="font-medium">{metadata.report_date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-700 inline-block w-16 text-left">Time:</span>
              <span className="font-medium">{metadata.report_time || '01:30PM'}</span>
            </div>
          </div>
        </div>

        {/* Abstract Table */}
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full border-collapse text-[10px] leading-tight border-2 border-black">
            <thead>
              <tr className="border-b-2 border-black bg-white text-black font-bold">
                <th className="border border-black p-1 text-center w-10 font-bold">
                  Item<br />No.
                </th>
                <th className="border border-black p-1.5 text-center min-w-[200px] font-bold">
                  Item Description
                </th>
                <th className="border border-black p-1 text-center w-12 font-bold">
                  Qty
                </th>
                <th className="border border-black p-1 text-center w-14 font-bold">
                  Unit
                </th>
                <th className="border border-black p-1 text-center w-20 font-bold whitespace-nowrap">
                  unit cost
                </th>
                <th className="border border-black p-1 text-center w-24 font-bold whitespace-nowrap">
                  ABC
                </th>
                {rankHeaders.map((header, idx) => (
                  <th
                    key={idx}
                    className="border border-black p-1 text-center min-w-[110px] font-bold uppercase whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, itemIdx) => {
                const rankedTiers = calculateItemRankings(item);
                const isNoBid = rankedTiers.length === 0;

                return (
                  <tr
                    key={item.id}
                    className={`break-inside-avoid border-b border-black ${
                      isNoBid ? 'bg-[#ffff00] print:bg-[#ffff00]' : 'bg-white'
                    }`}
                  >
                    {/* Item No. */}
                    <td className="border border-black p-1 text-center font-bold align-middle">
                      {itemIdx + 1}
                    </td>

                    {/* Item Description */}
                    <td className="border border-black p-1.5 text-left align-top">
                      <div className="font-semibold text-black leading-snug">
                        {item.name}
                      </div>
                      {item.description && item.description !== item.name && (
                        <div className="text-[9.5px] text-slate-800 mt-0.5 leading-snug whitespace-pre-line">
                          {item.description}
                        </div>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="border border-black p-1 text-center align-middle font-medium">
                      {item.quantity}
                    </td>

                    {/* Unit Type */}
                    <td className="border border-black p-1 text-center align-middle font-medium uppercase">
                      {item.unit_type}
                    </td>

                    {/* Unit Cost */}
                    <td className="border border-black p-1 text-right align-middle font-medium whitespace-nowrap">
                      {Number(item.unit_cost).toLocaleString('en-PH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* ABC */}
                    <td className="border border-black p-1 text-right align-middle font-bold whitespace-nowrap">
                      {Number(item.abc).toLocaleString('en-PH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* Rank Columns */}
                    {isNoBid ? (
                      /* If no bidders, show NO BIDDER centered across the rank columns */
                      <td
                        colSpan={rankColumnsCount}
                        className="border border-black p-2 text-center font-bold text-xs uppercase tracking-wider align-middle text-black"
                      >
                        NO BIDDER
                      </td>
                    ) : (
                      rankHeaders.map((_, colIdx) => {
                        const tier = rankedTiers[colIdx];
                        if (!tier || tier.length === 0) {
                          return (
                            <td
                              key={colIdx}
                              className="border border-black p-1 text-center align-top"
                            >
                              &nbsp;
                            </td>
                          );
                        }

                        return (
                          <td
                            key={colIdx}
                            className="border border-black p-1 text-center align-top space-y-2"
                          >
                            {tier.map((entry, bIdx) => (
                              <div
                                key={bIdx}
                                className={`text-[9.5px] leading-tight ${
                                  bIdx > 0 ? 'pt-1.5 border-t border-slate-300' : ''
                                }`}
                              >
                                <div className="font-bold text-[10px] text-right mb-0.5 whitespace-nowrap">
                                  {entry.totalCost.toLocaleString('en-PH', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>
                                <div className="font-semibold text-center text-black">
                                  {entry.bidder.name}
                                </div>
                                {(entry.bidder.location || entry.bidder.address) && (
                                  <div className="text-[8.5px] text-slate-700 text-center">
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

        {/* Signatories Section in 3-Column Pattern */}
        {signatories && signatories.length > 0 && (
          <div className="mt-12 pt-4 break-inside-avoid">
            <div className="grid grid-cols-3 gap-y-10 gap-x-6 text-center">
              {signatories.map(sig => (
                <div key={sig.id} className="flex flex-col items-center">
                  <div className="font-bold text-xs uppercase tracking-tight text-black border-b border-black/80 pb-0.5 min-w-[200px]">
                    {sig.name}
                  </div>
                  <div className="text-[10.5px] text-slate-700 font-medium mt-0.5">
                    {sig.designation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @page {
          size: landscape;
          margin: 6mm 8mm;
        }
        @media print {
          body {
            background-color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .report-sheet {
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: none !important;
          }
          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          thead {
            display: table-header-group !important;
          }
        }
      `}</style>
    </div>
  );
}
