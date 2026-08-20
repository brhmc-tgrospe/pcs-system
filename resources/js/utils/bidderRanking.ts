import { Item, Bidder } from '../types';

export interface RankedBidderEntry {
  bidder: Bidder;
  unitCost: number;
  totalCost: number;
  rank: number;
}

export type RankedTier = RankedBidderEntry[];

/**
 * Calculates dense rankings for an item's bidders based on total bid amount.
 * The lower the total cost, the higher the rank (Rank 1 is lowest price).
 * Bidders with the same total cost share the same rank and are grouped in the same tier.
 */
export function calculateItemRankings(item: Item): RankedTier[] {
  if (!item.bidders || item.bidders.length === 0) {
    return [];
  }

  const validBidders = item.bidders
    .filter(b => b.pivot && Number(b.pivot.unit_cost) > 0)
    .map(b => {
      const unitCost = Number(b.pivot!.unit_cost);
      const totalCost = Number(item.quantity) * unitCost;
      return {
        bidder: b,
        unitCost,
        totalCost,
      };
    });

  if (validBidders.length === 0) {
    return [];
  }

  // Sort ascending by total cost
  validBidders.sort((a, b) => a.totalCost - b.totalCost);

  // Group into dense tiers
  const tiers: RankedTier[] = [];
  let currentTier: RankedBidderEntry[] = [];
  let currentPrice: number | null = null;
  let currentRank = 0;

  for (const entry of validBidders) {
    if (currentPrice === null || Math.abs(entry.totalCost - currentPrice) > 0.001) {
      if (currentTier.length > 0) {
        tiers.push(currentTier);
      }
      currentRank++;
      currentPrice = entry.totalCost;
      currentTier = [{ ...entry, rank: currentRank }];
    } else {
      currentTier.push({ ...entry, rank: currentRank });
    }
  }

  if (currentTier.length > 0) {
    tiers.push(currentTier);
  }

  return tiers;
}

/**
 * Computes the maximum number of rank columns needed across a set of items,
 * with a minimum floor (default 5).
 */
export function getMaxRankColumns(items: Item[], minColumns: number = 5): number {
  if (!items || items.length === 0) {
    return minColumns;
  }

  const maxItemRanks = Math.max(
    ...items.map(item => calculateItemRankings(item).length),
    0
  );

  return Math.max(minColumns, maxItemRanks);
}
