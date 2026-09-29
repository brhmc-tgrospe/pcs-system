import React from 'react';
import { Award } from 'lucide-react';
import { ItemStatus } from '../types';

export const ITEM_STATUSES: ItemStatus[] = [
  'Active',
  'No Bid',
  'Pending Award',
  'Failed Bid',
  'Awarded',
  'Closed',
];

export const ITEM_STATUS_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'Active': {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200/70 dark:border-emerald-800/70',
    dot: 'bg-emerald-500',
  },
  'No Bid': {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200/70 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
  'Pending Award': {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200/70 dark:border-amber-800/70',
    dot: 'bg-amber-500',
  },
  'Failed Bid': {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200/70 dark:border-rose-800/70',
    dot: 'bg-rose-500',
  },
  'Awarded': {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200/70 dark:border-blue-800/70',
    dot: 'bg-blue-500',
  },
  'Closed': {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200/70 dark:border-purple-800/70',
    dot: 'bg-purple-500',
  },
};

interface ItemStatusBadgeProps {
  status?: string | null;
  isArchived?: boolean;
  awardedBidderName?: string | null;
  showAwardee?: boolean;
  className?: string;
}

export default function ItemStatusBadge({
  status,
  isArchived,
  awardedBidderName,
  showAwardee = true,
  className = '',
}: ItemStatusBadgeProps) {
  if (isArchived) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
        Archived
      </span>
    );
  }

  const currentStatus = status || 'Active';
  const style = ITEM_STATUS_STYLES[currentStatus] || ITEM_STATUS_STYLES['Active'];

  const badgeElement = (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border ${style.bg} ${style.text} ${style.border} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot} shrink-0`} />
      {currentStatus}
    </span>
  );

  if (currentStatus === 'Awarded' && awardedBidderName && showAwardee) {
    return (
      <div className="inline-flex flex-col gap-0.5 items-start">
        {badgeElement}
        <span
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300 max-w-[170px] truncate"
          title={`Awarded to: ${awardedBidderName}`}
        >
          <Award className="w-3 h-3 text-amber-500 shrink-0" />
          <span className="truncate">{awardedBidderName}</span>
        </span>
      </div>
    );
  }

  return badgeElement;
}
