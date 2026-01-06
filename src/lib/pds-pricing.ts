// PDS (Public Distribution System) Pricing Engine
// Implements government subsidy and pricing policies for ration distribution

export type BeneficiaryCategory = 'AAY' | 'PHH' | 'APL' | 'NON_PRIORITY';

export type PDSItemType = 'rice' | 'wheat' | 'coarse_grains' | 'sugar' | 'other';

export interface BeneficiaryProfile {
  category: BeneficiaryCategory;
  state: string;
  ration_card_type: string;
  household_members: number;
  monthly_income?: number;
}

export interface PDSItem {
  id: string;
  name: string;
  type: PDSItemType;
  economic_cost: number; // Real MSP + procurement cost
  base_price: number; // Market price without subsidy
}

export interface PricingPolicy {
  free_grain_active: boolean;
  base_rates: {
    rice: number; // ₹3/kg normally, ₹0 when free
    wheat: number; // ₹2/kg normally, ₹0 when free
    coarse_grains: number; // ₹1/kg normally, ₹0 when free
  };
  state_overrides: Record<string, {
    rice?: number;
    wheat?: number;
    coarse_grains?: number;
    additional_subsidies?: Record<string, number>;
  }>;
  free_grain_end_date: string;
}

export interface PricingResult {
  subsidized_price: number;
  subsidy_amount: number;
  economic_cost: number;
  subsidy_gap: number;
  is_free: boolean;
  applied_policy: string;
}

// Current PDS Policy Configuration
const CURRENT_POLICY: PricingPolicy = {
  free_grain_active: true, // PMGKAY scheme active
  base_rates: {
    rice: 0, // Free under current scheme
    wheat: 0, // Free under current scheme
    coarse_grains: 0, // Free under current scheme
  },
  state_overrides: {
    'Kerala': {
      rice: 0, // Additional state free rice schemes
      additional_subsidies: {
        'sugar': 13, // State subsidized sugar price
      }
    },
    'Tamil Nadu': {
      rice: 0, // Anna Bhagya free rice
      wheat: 0,
    },
    'Karnataka': {
      rice: 0, // Anna Bhagya free rice
      additional_subsidies: {
        'pulses': 20, // State pulse schemes
      }
    },
  },
  free_grain_end_date: '2026-12-31', // Extended till end of 2026
};

// Beneficiary Category Mapping
const BENEFICIARY_MAPPING = {
  // AAY - Antyodaya Anna Yojana (Poorest households)
  AAY: {
    entitlement_multiplier: 1.0,
    priority_level: 1,
    monthly_allocation: {
      rice: 35, // kg per household
      wheat: 35,
      coarse_grains: 35,
      sugar: 5,
    }
  },

  // PHH - Priority Households
  PHH: {
    entitlement_multiplier: 1.0,
    priority_level: 2,
    monthly_allocation: {
      rice: 5, // kg per person
      wheat: 5,
      coarse_grains: 5,
      sugar: 2,
    }
  },

  // APL - Above Poverty Line (State-specific)
  APL: {
    entitlement_multiplier: 0.8,
    priority_level: 3,
    monthly_allocation: {
      rice: 3,
      wheat: 3,
      coarse_grains: 3,
      sugar: 1,
    }
  },

  // Non-Priority (Limited or no entitlement)
  NON_PRIORITY: {
    entitlement_multiplier: 0.5,
    priority_level: 4,
    monthly_allocation: {
      rice: 1,
      wheat: 1,
      coarse_grains: 1,
      sugar: 0.5,
    }
  },
};

// Economic Cost Data (MSP + Procurement costs)
const ECONOMIC_COSTS: Record<PDSItemType, number> = {
  rice: 45.00, // MSP + milling + transport + storage
  wheat: 32.00, // MSP + processing + transport + storage
  coarse_grains: 28.00, // MSP + processing + transport + storage
  sugar: 42.00, // Procurement + transport + storage
  other: 35.00, // Average cost
};

// Map ration card types to beneficiary categories
export function mapRationCardToBeneficiaryCategory(cardType: string): BeneficiaryCategory {
  switch (cardType?.toLowerCase()) {
    case 'pink':
      return 'AAY'; // Pink cards for poorest households
    case 'yellow':
      return 'PHH'; // Yellow cards for priority households
    case 'blue':
      return 'APL'; // Blue cards for above poverty line
    case 'white':
      return 'NON_PRIORITY'; // White cards for others
    default:
      return 'PHH'; // Default to priority household
  }
}

// Check if free grain period is active
export function isFreeGrainPeriodActive(): boolean {
  return CURRENT_POLICY.free_grain_active;
}

// Calculate subsidized price based on PDS policies
export function calculatePDSPricing(
  item: PDSItem,
  beneficiary: BeneficiaryProfile,
  quantity: number = 1
): PricingResult {

  const isFree = isFreeGrainPeriodActive();
  const stateOverrides = CURRENT_POLICY.state_overrides[beneficiary.state] || {};
  const economicCost = ECONOMIC_COSTS[item.type];

  let subsidizedPrice = 0;
  let appliedPolicy = '';

    // 1. Check if free grain period is active
    if (isFree && (item.type === 'rice' || item.type === 'wheat' || item.type === 'coarse_grains' || item.type === 'sugar')) {
      subsidizedPrice = 0;
      appliedPolicy = 'PMGKAY Free Grain Scheme';
    } else {
    // 2. Apply base rates
    const baseRate = CURRENT_POLICY.base_rates[item.type] || 0;
    subsidizedPrice = baseRate;

    // 3. Apply state overrides
    if (stateOverrides[item.type] !== undefined) {
      subsidizedPrice = stateOverrides[item.type]!;
      appliedPolicy = `${beneficiary.state} State Override`;
    } else {
      appliedPolicy = 'Central Government CIP';
    }
  }

  // 4. Calculate subsidy amounts
  const totalEconomicCost = economicCost * quantity;
  const totalSubsidizedCost = subsidizedPrice * quantity;
  const subsidyGap = totalEconomicCost - totalSubsidizedCost;

  return {
    subsidized_price: subsidizedPrice,
    subsidy_amount: subsidyGap,
    economic_cost: economicCost,
    subsidy_gap: subsidyGap,
    is_free: subsidizedPrice === 0,
    applied_policy: appliedPolicy,
  };
}

// Get beneficiary entitlement for an item
export function getBeneficiaryEntitlement(
  beneficiary: BeneficiaryProfile,
  itemType: PDSItemType
): number {
  const categoryConfig = BENEFICIARY_MAPPING[beneficiary.category];

  // Base entitlement per household/person
  let baseEntitlement = categoryConfig.monthly_allocation[itemType] || 0;

  // For PHH, multiply by household members
  if (beneficiary.category === 'PHH') {
    baseEntitlement *= beneficiary.household_members;
  }

  return baseEntitlement;
}

// Validate purchase against entitlement
export function validateEntitlement(
  beneficiary: BeneficiaryProfile,
  itemType: PDSItemType,
  requestedQuantity: number,
  alreadyPurchased: number = 0
): {
  allowed: boolean;
  remaining: number;
  message: string;
} {
  const totalEntitlement = getBeneficiaryEntitlement(beneficiary, itemType);
  const remaining = Math.max(0, totalEntitlement - alreadyPurchased);

  if (requestedQuantity <= remaining) {
    return {
      allowed: true,
      remaining: remaining - requestedQuantity,
      message: `Within entitlement (${remaining.toFixed(1)} kg remaining)`
    };
  } else {
    return {
      allowed: false,
      remaining: remaining,
      message: `Exceeds monthly entitlement. Only ${remaining.toFixed(1)} kg available.`
    };
  }
}

// Log subsidy information for auditing
export function logSubsidyTransaction(
  beneficiaryId: string,
  itemType: PDSItemType,
  pricing: PricingResult,
  quantity: number
) {
  const subsidyData = {
    beneficiary_id: beneficiaryId,
    item_type: itemType,
    quantity,
    economic_cost_per_unit: pricing.economic_cost,
    subsidized_price_per_unit: pricing.subsidized_price,
    subsidy_per_unit: pricing.subsidy_amount / quantity,
    total_subsidy: pricing.subsidy_gap,
    policy_applied: pricing.applied_policy,
    timestamp: new Date().toISOString(),
  };

  // In a real system, this would be sent to audit logs
  console.log('Subsidy Transaction:', subsidyData);

  // Store in localStorage for demo (in real app, send to backend)
  const existing = JSON.parse(localStorage.getItem('subsidy_logs') || '[]');
  existing.push(subsidyData);
  localStorage.setItem('subsidy_logs', JSON.stringify(existing));
}

// Get pricing summary for cart/checkout
export function calculateCartPricing(
  cartItems: Array<{
    id: string;
    name: string;
    type: PDSItemType;
    quantity: number;
    basePrice: number;
  }>,
  beneficiary: BeneficiaryProfile
) {
  let totalSubsidized = 0;
  let totalSubsidy = 0;
  let totalEconomicCost = 0;
  const itemizedPricing: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    originalPrice: number;
    subsidizedPrice: number;
    savings: number;
    policy: string;
  }> = [];

  cartItems.forEach(item => {
    const pdsItem: PDSItem = {
      id: item.id,
      name: item.name,
      type: item.type,
      economic_cost: ECONOMIC_COSTS[item.type],
      base_price: item.basePrice,
    };

    const pricing = calculatePDSPricing(pdsItem, beneficiary, item.quantity);

    totalSubsidized += pricing.subsidized_price * item.quantity;
    totalSubsidy += pricing.subsidy_gap;
    totalEconomicCost += pricing.economic_cost * item.quantity;

    itemizedPricing.push({
      itemId: item.id,
      itemName: item.name,
      quantity: item.quantity,
      originalPrice: item.basePrice,
      subsidizedPrice: pricing.subsidized_price,
      savings: pricing.subsidy_gap,
      policy: pricing.applied_policy,
    });
  });

  return {
    totalSubsidized,
    totalSubsidy,
    totalEconomicCost,
    subsidyPercentage: totalEconomicCost > 0 ? (totalSubsidy / totalEconomicCost) * 100 : 0,
    itemizedPricing,
  };
}
