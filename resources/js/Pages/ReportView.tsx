import { Head } from '@inertiajs/react';
import { Printer, ArrowLeft } from 'lucide-react';
import { Item, Category } from '../types';

interface ReportViewProps {
  items: Item[];
  categories: Category[];
  timestamp: string;
}

export default function ReportView({ items, categories, timestamp }: ReportViewProps) {
  // Calculate overall grand total
  const grandTotal = items.reduce((sum, item) => sum + Number(item.unit_price), 0);

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:py-0 print:bg-white font-sans text-slate-900" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
      <Head title="Official Catalog Report" />
      
      {/* Floating Action Bar (Hidden when printing) */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden px-4">
        <button 
          onClick={() => window.close()} 
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Close Report
        </button>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold shadow-md transition-colors text-sm"
        >
          <Printer className="w-4 h-4" /> Print Document
        </button>
      </div>

      {/* A4 Document Container */}
      <div className="max-w-[210mm] min-h-[297mm] mx-auto bg-white p-[15mm] shadow-xl print:shadow-none print:p-0 print:max-w-none print:min-h-0 relative">
        
        {/* Header - Inline Logo and Text */}
        <div className="flex flex-col items-center mb-6 border-b-2 border-slate-900 pb-4">
          <div className="flex items-center justify-center gap-4 mb-2">
            <img src="/brhmc-logo.png" alt="BRHMC Logo" className="h-16 w-16 object-contain" />
            <div className="text-left">
              <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase font-serif leading-tight">
                Bicol Regional Hospital and Medical Center
              </h1>
              <h2 className="text-sm font-bold text-blue-800 tracking-[0.1em] uppercase">
                Procurement Master Catalog
              </h2>
            </div>
          </div>
          <p className="text-slate-600 font-semibold mt-1 bg-slate-100 px-3 py-1 rounded-md border border-slate-200 text-[11px] tracking-wide uppercase">
            Official Generated Report &nbsp;|&nbsp; {new Date(timestamp).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {categories.map(category => {
            const categoryItems = items.filter(item => item.category_id === category.id);
            if (categoryItems.length === 0) return null;
            
            const categorySubTotal = categoryItems.reduce((sum, item) => sum + Number(item.unit_price), 0);
            
            return (
              <div key={category.id} className="break-inside-avoid">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">{category.name}</h3>
                  <div className="h-px flex-1 bg-slate-200"></div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {categoryItems.length} Items
                  </span>
                </div>
                
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-y-2 border-slate-800 bg-slate-50 print:bg-transparent">
                      <th className="py-2 px-2 font-bold text-slate-900 text-[11px] uppercase tracking-wider w-20">Item Code</th>
                      <th className="py-2 px-2 font-bold text-slate-900 text-[11px] uppercase tracking-wider">Description & Specs</th>
                      <th className="py-2 px-2 font-bold text-slate-900 text-[11px] uppercase tracking-wider whitespace-nowrap w-24">Unit Type</th>
                      <th className="py-2 px-2 font-bold text-slate-900 text-[11px] uppercase tracking-wider text-right whitespace-nowrap w-28">Est. Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {categoryItems.map(item => (
                      <tr key={item.id} className="break-inside-avoid">
                        <td className="py-2.5 px-2 font-mono font-semibold text-slate-700 align-top uppercase text-[11px] w-20">
                          {item.item_code}
                        </td>
                        <td className="py-2.5 px-2 align-top">
                          <div className="font-bold text-slate-900 text-xs mb-0.5">{item.name}</div>
                          {item.description && <div className="text-slate-600 text-[11px] mb-1.5 leading-snug max-w-2xl">{item.description}</div>}
                          {item.specifications && Object.keys(item.specifications).length > 0 && (
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px] bg-slate-50/50 p-1.5 rounded border border-slate-200 print:border-slate-300 print:bg-transparent">
                              {Object.entries(item.specifications).map(([k, v]) => (
                                <div key={k} className="flex gap-1 items-baseline">
                                  <span className="font-semibold text-slate-400 uppercase tracking-tight text-[9px]">{k}:</span>
                                  <span className="font-medium text-slate-800">{v}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-2 align-top text-slate-800 font-medium text-[11px] whitespace-nowrap w-24">
                          {item.unit_type}
                        </td>
                        <td className="py-2.5 px-2 align-top text-right font-bold text-slate-900 whitespace-nowrap text-xs w-28">
                          ₱{Number(item.unit_price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-800 bg-slate-50 print:bg-transparent">
                      <td colSpan={3} className="py-2 px-2 text-right font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                        {category.name} Sub-Total:
                      </td>
                      <td className="py-2 px-2 text-right font-black text-slate-900 text-sm whitespace-nowrap">
                        ₱{categorySubTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            );
          })}
        </div>

        {/* Grand Total */}
        <div className="mt-8 border-y-4 border-slate-900 bg-slate-100/50 p-4 flex justify-between items-center print:bg-transparent break-inside-avoid">
          <div className="font-black text-slate-900 text-sm uppercase tracking-widest">
            Grand Total ({items.length} Items)
          </div>
          <div className="font-black text-blue-800 text-xl">
            ₱{grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-4 border-t-2 border-slate-900 text-center text-[11px] text-slate-500 font-medium break-inside-avoid">
          <p className="uppercase tracking-[0.2em] text-[10px] font-bold text-slate-400 mb-2">*** END OF OFFICIAL REPORT ***</p>
          <p className="font-bold text-slate-700">Generated by PCS Portal Admin Interface</p>
          <p className="mt-0.5">Bicol Regional Hospital and Medical Center • Legazpi City, Albay</p>
        </div>
      </div>
    </div>
  );
}
