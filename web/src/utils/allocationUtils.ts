/**
 * Allocation calculation utilities
 */

export interface AllocationValidation {
  isValid: boolean;
  validCount: number;
  totalCount: number;
  coverage: number;
  minRequiredAmount: number;
  invalidAllocations: Array<{
    symbol: string;
    amount: number;
    required: number;
  }>;
}

/**
 * Calculate minimum required amount for full portfolio allocation
 */
export function calculateMinimumAllocation(
  targetAllocations: Record<string, number>,
  minTradeAmount: number = 10
): number {
  const percentages = Object.values(targetAllocations);
  if (percentages.length === 0) return minTradeAmount;
  
  const maxPercent = Math.max(...percentages);
  return Math.ceil(minTradeAmount / maxPercent);
}

/**
 * Validate allocation amounts against minimum requirements
 */
export function validateAllocation(
  totalAmount: number,
  targetAllocations: Record<string, number>,
  minTradeAmount: number = 10
): AllocationValidation {
  const allocations = Object.entries(targetAllocations);
  let validCount = 0;
  let totalValidPercent = 0;
  const invalidAllocations: AllocationValidation['invalidAllocations'] = [];

  allocations.forEach(([symbol, percent]) => {
    const amount = totalAmount * percent;
    const isValid = amount >= minTradeAmount;
    
    if (isValid) {
      validCount++;
      totalValidPercent += percent;
    } else {
      invalidAllocations.push({
        symbol,
        amount,
        required: minTradeAmount
      });
    }
  });

  const minRequiredAmount = calculateMinimumAllocation(targetAllocations, minTradeAmount);

  return {
    isValid: validCount === allocations.length,
    validCount,
    totalCount: allocations.length,
    coverage: totalValidPercent,
    minRequiredAmount,
    invalidAllocations
  };
}

/**
 * Format allocation validation for display
 */
export function formatAllocationMessage(validation: AllocationValidation): string {
  if (validation.isValid) {
    return `✅ All ${validation.totalCount} allocations are valid`;
  }

  const invalidCount = validation.totalCount - validation.validCount;
  return `⚠️ ${invalidCount}/${validation.totalCount} allocations below minimum (${(validation.coverage * 100).toFixed(1)}% coverage)`;
}

/**
 * Get allocation status color based on validation
 */
export function getAllocationStatusColor(validation: AllocationValidation): string {
  if (validation.isValid) return 'text-green-600 dark:text-green-400';
  if (validation.coverage >= 0.5) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}