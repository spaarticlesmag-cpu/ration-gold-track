// AI Auditor Service - Intelligent fraud detection, compliance monitoring, and demand prediction for PDS system

export interface AuditReport {
  id: string;
  timestamp: string;
  period: string;
  store_id: string;
  total_orders: number;
  total_quantity: Record<string, number>;
  total_amount: number;
  flagged_orders: AuditIssue[];
  risk_score: 'low' | 'medium' | 'high' | 'critical';
  compliance_rate: number;
  recommendations: string[];
  summary: string;
}

export interface DemandForecast {
  store_id: string;
  item_id: string;
  forecasted_demand: number;
  confidence_level: number;
  prediction_basis: 'historical' | 'seasonal' | 'trend' | 'external_factors';
  forecast_period: string; // e.g., '2026-02'
  historical_data: Array<{
    period: string;
    actual_demand: number;
    factors: string[];
  }>;
  recommended_stock: number;
  risk_assessment: 'understock' | 'optimal' | 'overstock';
}

export interface StoreDemandReport {
  store_id: string;
  store_name: string;
  location: {
    latitude: number;
    longitude: number;
    district: string;
  };
  generated_at: string;
  forecast_period: string;
  total_monthly_demand: Record<string, number>;
  item_forecasts: DemandForecast[];
  recommendations: {
    immediate_actions: string[];
    procurement_plan: string[];
    risk_mitigations: string[];
  };
  summary: {
    overall_risk: 'low' | 'medium' | 'high';
    confidence_score: number;
    key_insights: string[];
  };
}

export interface AuditIssue {
  order_id: string;
  user_id: string;
  issue_type: 'eligibility' | 'quota_excess' | 'unusual_pattern' | 'duplicate' | 'suspicious_amount';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string;
  risk_score: number;
}

export interface BeneficiaryProfile {
  user_id: string;
  ration_card_type: 'pink' | 'yellow' | 'blue' | 'white';
  household_members: number;
  monthly_income?: number;
  address: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  last_order_date?: string;
  total_orders_this_month: number;
  total_quantity_this_month: Record<string, number>;
}

export interface StoreInventory {
  store_id: string;
  current_stock: Record<string, number>;
  monthly_distribution: Record<string, number>;
  flagged_transactions: string[];
}

// AI Audit Rules Engine
class AuditRulesEngine {
  // Rule 1: Beneficiary Eligibility Check
  checkEligibility(profile: BeneficiaryProfile, orderItems: Array<{name: string, quantity: number}>): AuditIssue | null {
    const issues: string[] = [];

    // Check ration card type eligibility
    if (profile.ration_card_type === 'white') {
      return {
        order_id: 'N/A',
        user_id: profile.user_id,
        issue_type: 'eligibility',
        severity: 'high',
        description: 'White ration card holder attempting to purchase subsidized items',
        evidence: `Card type: ${profile.ration_card_type}, Items ordered: ${orderItems.map(i => i.name).join(', ')}`,
        risk_score: 85
      };
    }

    // Check verification status
    if (profile.verification_status !== 'verified') {
      issues.push(`Unverified beneficiary (status: ${profile.verification_status})`);
    }

    // Check household size vs ordered quantities
    const riceOrdered = orderItems.find(i => i.name.toLowerCase().includes('rice'))?.quantity || 0;
    const expectedMaxRice = profile.ration_card_type === 'pink' ? 35 : profile.household_members * 5;

    if (riceOrdered > expectedMaxRice) {
      issues.push(`Rice quantity (${riceOrdered}kg) exceeds household entitlement (${expectedMaxRice}kg)`);
    }

    if (issues.length > 0) {
      return {
        order_id: 'N/A',
        user_id: profile.user_id,
        issue_type: 'eligibility',
        severity: issues.length > 1 ? 'high' : 'medium',
        description: `Eligibility issues: ${issues.join('; ')}`,
        evidence: `Household: ${profile.household_members} members, Card: ${profile.ration_card_type}`,
        risk_score: Math.min(issues.length * 25, 90)
      };
    }

    return null;
  }

  // Rule 2: Quota Excess Detection
  checkQuotaExcess(profile: BeneficiaryProfile, orderItems: Array<{name: string, quantity: number}>): AuditIssue | null {
    const monthlyLimits = {
      pink: { rice: 35, wheat: 35 }, // AAY
      yellow: { rice: 5 * profile.household_members, wheat: 5 * profile.household_members }, // PHH
      blue: { rice: 3, wheat: 3 }, // APL
      white: { rice: 0, wheat: 0 } // Non-priority
    };

    const limits = monthlyLimits[profile.ration_card_type];
    const currentMonthUsage = profile.total_quantity_this_month;

    for (const item of orderItems) {
      const itemKey = item.name.toLowerCase().includes('rice') ? 'rice' :
                     item.name.toLowerCase().includes('wheat') ? 'wheat' : null;

      if (itemKey && limits[itemKey]) {
        const remainingQuota = limits[itemKey] - (currentMonthUsage[itemKey] || 0);
        if (item.quantity > remainingQuota) {
          return {
            order_id: 'N/A',
            user_id: profile.user_id,
            issue_type: 'quota_excess',
            severity: 'high',
            description: `Quota exceeded for ${item.name}: ${item.quantity}kg ordered, only ${remainingQuota}kg remaining`,
            evidence: `Monthly limit: ${limits[itemKey]}kg, Used: ${currentMonthUsage[itemKey] || 0}kg`,
            risk_score: 75
          };
        }
      }
    }

    return null;
  }

  // Rule 3: Unusual Pattern Detection
  checkUnusualPatterns(profile: BeneficiaryProfile, orderHistory: any[]): AuditIssue | null {
    const recentOrders = orderHistory.filter(order =>
      new Date(order.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    // Check for excessive ordering frequency
    if (recentOrders.length > 10) {
      return {
        order_id: 'N/A',
        user_id: profile.user_id,
        issue_type: 'unusual_pattern',
        severity: 'medium',
        description: `Unusually high order frequency: ${recentOrders.length} orders in 30 days`,
        evidence: `Average beneficiary orders: 2-4 per month`,
        risk_score: 60
      };
    }

    // Check for large orders at unusual times
    const largeOrders = recentOrders.filter(order => order.total_amount > 2000);
    if (largeOrders.length > 2) {
      return {
        order_id: 'N/A',
        user_id: profile.user_id,
        issue_type: 'unusual_pattern',
        severity: 'medium',
        description: `Multiple large orders detected: ${largeOrders.length} orders > ₹2000`,
        evidence: `Large order amounts: ${largeOrders.map(o => `₹${o.total_amount}`).join(', ')}`,
        risk_score: 55
      };
    }

    return null;
  }

  // Rule 4: Suspicious Amount Detection
  checkSuspiciousAmounts(order: any, profile: BeneficiaryProfile): AuditIssue | null {
    const amount = order.total_amount;
    const items = order.items || [];

    // Check for round number amounts (potential fraud indicator)
    if (amount % 100 === 0 && amount > 500) {
      return {
        order_id: order.id,
        user_id: profile.user_id,
        issue_type: 'suspicious_amount',
        severity: 'low',
        description: `Round number amount: ₹${amount} (potential manipulation)`,
        evidence: `Items: ${items.join(', ')}`,
        risk_score: 40
      };
    }

    // Check for unusually high amounts for household size
    const expectedMax = profile.household_members * 800; // Rough estimate
    if (Number(amount) > expectedMax) {
      return {
        order_id: order.id,
        user_id: profile.user_id,
        issue_type: 'suspicious_amount',
        severity: 'medium',
        description: `Unusually high order amount: ₹${amount} for ${profile.household_members} member household`,
        evidence: `Expected max: ₹${expectedMax}`,
        risk_score: 65
      };
    }

    return null;
  }

  // Rule 5: Duplicate Order Detection
  checkDuplicateOrders(order: any, recentOrders: any[]): AuditIssue | null {
    const similarOrders = recentOrders.filter(existingOrder => {
      // Check if same items in similar timeframe
      const timeDiff = Math.abs(new Date(order.created_at) - new Date(existingOrder.created_at));
      const sameDay = timeDiff < 24 * 60 * 60 * 1000; // Within 24 hours

      if (!sameDay) return false;

      // Check if items are similar
      const orderItems = order.items || [];
      const existingItems = existingOrder.items || [];
      const commonItems = orderItems.filter(item => existingItems.includes(item));

      return commonItems.length >= Math.min(orderItems.length, existingItems.length) * 0.8; // 80% similarity
    });

    if (similarOrders.length > 0) {
      return {
        order_id: order.id,
        user_id: order.customer_id,
        issue_type: 'duplicate',
        severity: 'medium',
        description: `Potential duplicate order detected`,
        evidence: `Similar order ${similarOrders[0].id} placed ${Math.round((new Date(order.created_at) - new Date(similarOrders[0].created_at)) / (1000 * 60))} minutes ago`,
        risk_score: 50
      };
    }

    return null;
  }
}

// Main AI Auditor Class
export class AIAuditor {
  private rulesEngine: AuditRulesEngine;
  private auditHistory: AuditReport[];

  constructor() {
    this.rulesEngine = new AuditRulesEngine();
    this.auditHistory = [];
  }

  // Perform comprehensive audit on orders for a store
  async auditStoreOrders(storeId: string, orders: any[], beneficiaries: BeneficiaryProfile[]): Promise<AuditReport> {
    console.log(`🤖 AI Auditor: Starting audit for store ${storeId}, ${orders.length} orders, ${beneficiaries.length} beneficiaries`);

    const flaggedOrders: AuditIssue[] = [];
    let totalRiskScore = 0;

    // Process each order
    for (const order of orders) {
      const beneficiary = beneficiaries.find(b => b.user_id === order.customer_id);

      if (!beneficiary) {
        flaggedOrders.push({
          order_id: order.id,
          user_id: order.customer_id,
          issue_type: 'eligibility',
          severity: 'critical',
          description: 'Order from unknown beneficiary',
          evidence: 'Beneficiary profile not found in system',
          risk_score: 100
        });
        totalRiskScore += 100;
        continue;
      }

      // Run all audit checks
      const checks = [
        this.rulesEngine.checkEligibility(beneficiary, order.items || []),
        this.rulesEngine.checkQuotaExcess(beneficiary, order.items || []),
        this.rulesEngine.checkUnusualPatterns(beneficiary, orders.filter(o => o.customer_id === beneficiary.user_id)),
        this.rulesEngine.checkSuspiciousAmounts(order, beneficiary),
        this.rulesEngine.checkDuplicateOrders(order, orders.filter(o => o.customer_id === beneficiary.user_id && o.id !== order.id))
      ];

      for (const issue of checks) {
        if (issue) {
          flaggedOrders.push(issue);
          totalRiskScore += issue.risk_score;
        }
      }
    }

    // Calculate overall risk score
    const avgRiskScore = orders.length > 0 ? totalRiskScore / orders.length : 0;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (avgRiskScore >= 80) riskLevel = 'critical';
    else if (avgRiskScore >= 60) riskLevel = 'high';
    else if (avgRiskScore >= 40) riskLevel = 'medium';
    else riskLevel = 'low';

    // Calculate compliance rate
    const complianceRate = orders.length > 0 ? ((orders.length - flaggedOrders.length) / orders.length) * 100 : 100;

    // Generate recommendations
    const recommendations = this.generateRecommendations(flaggedOrders, riskLevel, complianceRate);

    // Calculate totals
    const totalQuantity: Record<string, number> = {};
    let totalAmount = 0;

    orders.forEach(order => {
      totalAmount += order.total_amount || 0;
      (order.items || []).forEach((item: string) => {
        // Extract quantity from item string (e.g., "Premium Rice (10kg)" -> 10)
        const match = item.match(/\((\d+)(kg|L)\)/);
        if (match) {
          const quantity = parseInt(match[1]);
          const itemType = item.toLowerCase().includes('rice') ? 'rice' :
                          item.toLowerCase().includes('wheat') ? 'wheat' :
                          item.toLowerCase().includes('sugar') ? 'sugar' : 'other';
          totalQuantity[itemType] = (totalQuantity[itemType] || 0) + quantity;
        }
      });
    });

    const report: AuditReport = {
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      period: `${new Date().toISOString().slice(0, 7)}-01 to ${new Date().toISOString().slice(0, 10)}`,
      store_id: storeId,
      total_orders: orders.length,
      total_quantity: totalQuantity,
      total_amount: totalAmount,
      flagged_orders: flaggedOrders,
      risk_score: riskLevel,
      compliance_rate: complianceRate,
      recommendations: recommendations,
      summary: this.generateSummary(flaggedOrders, riskLevel, complianceRate, orders.length)
    };

    // Store audit report
    this.auditHistory.push(report);
    this.saveAuditReport(report);

    console.log(`🤖 AI Auditor: Audit completed for store ${storeId}`, {
      riskLevel,
      flaggedOrders: flaggedOrders.length,
      complianceRate: `${complianceRate.toFixed(1)}%`
    });

    return report;
  }

  // Generate recommendations based on audit findings
  private generateRecommendations(issues: AuditIssue[], riskLevel: string, complianceRate: number): string[] {
    const recommendations: string[] = [];

    if (complianceRate < 80) {
      recommendations.push('Immediate review of beneficiary verification process required');
    }

    if (issues.filter(i => i.issue_type === 'quota_excess').length > 0) {
      recommendations.push('Strengthen quota monitoring and enforcement systems');
    }

    if (issues.filter(i => i.issue_type === 'eligibility').length > 0) {
      recommendations.push('Implement stricter beneficiary eligibility checks');
    }

    if (issues.filter(i => i.issue_type === 'unusual_pattern').length > 0) {
      recommendations.push('Monitor high-frequency ordering patterns for potential abuse');
    }

    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('Escalate to fraud investigation unit for detailed analysis');
      recommendations.push('Consider temporary suspension of suspicious accounts');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue monitoring - no immediate action required');
    }

    return recommendations;
  }

  // Generate audit summary
  private generateSummary(issues: AuditIssue[], riskLevel: string, complianceRate: number, totalOrders: number): string {
    const issueCount = issues.length;
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;

    let summary = `Audit completed for ${totalOrders} orders. `;

    if (complianceRate >= 95) {
      summary += `Excellent compliance rate of ${complianceRate.toFixed(1)}%. `;
    } else if (complianceRate >= 85) {
      summary += `Good compliance rate of ${complianceRate.toFixed(1)}%. `;
    } else {
      summary += `Concerning compliance rate of ${complianceRate.toFixed(1)}%. `;
    }

    if (criticalIssues > 0) {
      summary += `${criticalIssues} critical issues require immediate attention. `;
    }

    if (highIssues > 0) {
      summary += `${highIssues} high-priority issues need review. `;
    }

    summary += `Overall risk assessment: ${riskLevel.toUpperCase()}.`;

    return summary;
  }

  // Save audit report to localStorage (in real app, this would go to database)
  private saveAuditReport(report: AuditReport): void {
    try {
      const existing = JSON.parse(localStorage.getItem('audit_reports') || '[]');
      existing.push(report);
      // Keep only last 50 reports
      if (existing.length > 50) {
        existing.splice(0, existing.length - 50);
      }
      localStorage.setItem('audit_reports', JSON.stringify(existing));
    } catch (error) {
      console.error('Failed to save audit report:', error);
    }
  }

  // Get audit history
  getAuditHistory(): AuditReport[] {
    try {
      return JSON.parse(localStorage.getItem('audit_reports') || '[]');
    } catch {
      return [];
    }
  }

  // Get latest audit report for a store
  getLatestAuditForStore(storeId: string): AuditReport | null {
    const history = this.getAuditHistory();
    return history.filter(report => report.store_id === storeId)
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] || null;
  }

  // Run automated audit (can be called periodically)
  async runAutomatedAudit(storeId: string): Promise<AuditReport | null> {
    try {
      // Get orders from last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const orders = JSON.parse(localStorage.getItem('orders') || '[]')
        .filter((order: any) => {
          const orderDate = new Date(order.created_at);
          return orderDate >= thirtyDaysAgo;
        });

      // Get beneficiary profiles (mock data for demo)
      const beneficiaries: BeneficiaryProfile[] = orders.map((order: any) => ({
        user_id: order.customer_id,
        ration_card_type: 'yellow', // Default for demo
        household_members: 4,
        address: 'Sample Address',
        verification_status: 'verified',
        total_orders_this_month: 2,
        total_quantity_this_month: { rice: 10, wheat: 8 }
      }));

      return await this.auditStoreOrders(storeId, orders, beneficiaries);
    } catch (error) {
      console.error('Automated audit failed:', error);
      return null;
    }
  }

  // ==========================================
  // DEMAND PREDICTION AND FORECASTING METHODS
  // ==========================================

  // Generate demand forecast for a specific store and item
  generateDemandForecast(
    storeId: string,
    itemId: string,
    forecastMonths: number = 3
  ): DemandForecast {
  console.log(`🔮 AI Auditor: Generating demand forecast for ${storeId} - ${itemId}`);

  // Get historical data (last 12 months)
  const historicalData = this.getHistoricalDemandData(storeId, itemId, 12);

  // Apply multiple prediction algorithms
  const algorithms = [
    this.simpleMovingAverage(historicalData, 3),
    this.exponentialSmoothing(historicalData, 0.3),
    this.linearRegression(historicalData),
    this.seasonalAdjustment(historicalData)
  ];

  // Ensemble prediction (weighted average)
  const weights = [0.3, 0.3, 0.2, 0.2];
  const predictions = algorithms.map((algo, index) => ({
    value: algo.prediction,
    weight: weights[index],
    confidence: algo.confidence
  }));

  const weightedPrediction = predictions.reduce((sum, pred) =>
    sum + (pred.value * pred.weight), 0
  );

  const averageConfidence = predictions.reduce((sum, pred) =>
    sum + (pred.confidence * pred.weight), 0
  );

  // Determine prediction basis
  const maxConfidence = Math.max(...predictions.map(p => p.confidence));
  let predictionBasis: 'historical' | 'seasonal' | 'trend' | 'external_factors' = 'historical';

  if (maxConfidence > 0.8) {
    const bestAlgoIndex = predictions.findIndex(p => p.confidence === maxConfidence);
    predictionBasis = ['historical', 'seasonal', 'trend', 'external_factors'][bestAlgoIndex] as any;
  }

  // Calculate recommended stock (prediction + 20% buffer)
  const recommendedStock = Math.ceil(weightedPrediction * 1.2);

  // Risk assessment
  const currentStock = this.getCurrentStockLevel(storeId, itemId);
  let riskAssessment: 'understock' | 'optimal' | 'overstock' = 'optimal';

  if (currentStock < weightedPrediction * 0.8) {
    riskAssessment = 'understock';
  } else if (currentStock > weightedPrediction * 1.5) {
    riskAssessment = 'overstock';
  }

  // Next month forecast period
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const forecastPeriod = nextMonth.toISOString().slice(0, 7);

  return {
    store_id: storeId,
    item_id: itemId,
    forecasted_demand: Math.round(weightedPrediction),
    confidence_level: Math.round(averageConfidence * 100),
    prediction_basis: predictionBasis,
    forecast_period: forecastPeriod,
    historical_data: historicalData.slice(-6), // Last 6 months for display
    recommended_stock: recommendedStock,
    risk_assessment: riskAssessment
  };
}

// Generate comprehensive demand report for a store
async generateStoreDemandReport(storeId: string): Promise<StoreDemandReport> {
  console.log(`📊 AI Auditor: Generating comprehensive demand report for store ${storeId}`);

  const store = this.getStoreInfo(storeId);
  const items = ['rice', 'wheat', 'sugar', 'dal', 'oil', 'salt', 'tea'];

  // Generate forecasts for all items
  const itemForecasts: DemandForecast[] = [];
  const totalMonthlyDemand: Record<string, number> = {};

  for (const itemId of items) {
    const forecast = this.generateDemandForecast(storeId, itemId);
    itemForecasts.push(forecast);

    // Aggregate total demand
    totalMonthlyDemand[itemId] = forecast.forecasted_demand;
  }

  // Generate recommendations
  const recommendations = this.generateProcurementRecommendations(itemForecasts, storeId);

  // Calculate overall risk
  const riskLevels = itemForecasts.map(f => f.risk_assessment);
  const understockCount = riskLevels.filter(r => r === 'understock').length;
  const overstockCount = riskLevels.filter(r => r === 'overstock').length;

  let overallRisk: 'low' | 'medium' | 'high' = 'low';
  if (understockCount > items.length / 2 || overstockCount > items.length / 2) {
    overallRisk = 'high';
  } else if (understockCount > 0 || overstockCount > 0) {
    overallRisk = 'medium';
  }

  // Calculate confidence score
  const avgConfidence = itemForecasts.reduce((sum, f) => sum + f.confidence_level, 0) / items.length;

  // Key insights
  const keyInsights = this.generateDemandInsights(itemForecasts, storeId);

  return {
    store_id: storeId,
    store_name: store.name,
    location: {
      latitude: store.latitude,
      longitude: store.longitude,
      district: store.district
    },
    generated_at: new Date().toISOString(),
    forecast_period: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7),
    total_monthly_demand: totalMonthlyDemand,
    item_forecasts: itemForecasts,
    recommendations,
    summary: {
      overall_risk: overallRisk,
      confidence_score: Math.round(avgConfidence),
      key_insights: keyInsights
    }
  };
}

// ==========================================
// PREDICTION ALGORITHMS
// ==========================================

// Simple Moving Average
private simpleMovingAverage(historicalData: any[], window: number) {
  if (historicalData.length < window) {
    return { prediction: historicalData[historicalData.length - 1]?.actual_demand || 0, confidence: 0.5 };
  }

  const recentData = historicalData.slice(-window);
  const average = recentData.reduce((sum, d) => sum + d.actual_demand, 0) / window;

  // Calculate confidence based on data consistency
  const variance = recentData.reduce((sum, d) => sum + Math.pow(d.actual_demand - average, 2), 0) / window;
  const stdDev = Math.sqrt(variance);
  const confidence = Math.max(0.3, Math.min(0.9, 1 - (stdDev / average)));

  return { prediction: average, confidence };
}

// Exponential Smoothing
private exponentialSmoothing(historicalData: any[], alpha: number) {
  if (historicalData.length === 0) {
    return { prediction: 0, confidence: 0.3 };
  }

  let smoothed = historicalData[0].actual_demand;
  for (let i = 1; i < historicalData.length; i++) {
    smoothed = alpha * historicalData[i].actual_demand + (1 - alpha) * smoothed;
  }

  return { prediction: smoothed, confidence: 0.7 };
}

// Linear Regression Trend Analysis
private linearRegression(historicalData: any[]) {
  if (historicalData.length < 2) {
    return { prediction: historicalData[0]?.actual_demand || 0, confidence: 0.4 };
  }

  const n = historicalData.length;
  const x = historicalData.map((_, i) => i);
  const y = historicalData.map(d => d.actual_demand);

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const nextX = n;
  const prediction = slope * nextX + intercept;

  // Calculate R-squared for confidence
  const yMean = sumY / n;
  const ssRes = y.reduce((sum, yi, i) => {
    const predicted = slope * x[i] + intercept;
    return sum + Math.pow(yi - predicted, 2);
  }, 0);
  const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const rSquared = 1 - (ssRes / ssTot);

  return { prediction: Math.max(0, prediction), confidence: Math.max(0.2, rSquared) };
}

// Seasonal Adjustment
private seasonalAdjustment(historicalData: any[]) {
  if (historicalData.length < 12) {
    return { prediction: historicalData[historicalData.length - 1]?.actual_demand || 0, confidence: 0.4 };
  }

  // Simple seasonal adjustment (assuming monthly seasonality)
  const seasonalFactors = this.calculateSeasonalFactors(historicalData);
  const lastMonth = historicalData[historicalData.length - 1];
  const lastMonthIndex = new Date(lastMonth.period + '-01').getMonth();
  const seasonalFactor = seasonalFactors[lastMonthIndex];

  const deseasonalized = lastMonth.actual_demand / seasonalFactor;
  const trend = this.calculateTrend(historicalData);
  const nextMonthPrediction = (deseasonalized + trend) * seasonalFactors[(lastMonthIndex + 1) % 12];

  return { prediction: nextMonthPrediction, confidence: 0.6 };
}

// ==========================================
// HELPER METHODS FOR DEMAND PREDICTION
// ==========================================

private getHistoricalDemandData(storeId: string, itemId: string, months: number): Array<{period: string, actual_demand: number, factors: string[]}> {
  // Mock historical data - in real app, this would come from database
  const data = [];
  const now = new Date();

  for (let i = months; i >= 1; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const period = date.toISOString().slice(0, 7);

    // Generate realistic demand based on item type and seasonality
    let baseDemand = 0;
    const factors: string[] = [];

    switch (itemId) {
      case 'rice':
        baseDemand = 400 + Math.random() * 200;
        if ([5, 6, 7, 8, 9].includes(date.getMonth())) { // Monsoon season
          baseDemand *= 1.2;
          factors.push('Monsoon season increase');
        }
        break;
      case 'wheat':
        baseDemand = 300 + Math.random() * 150;
        if ([11, 12, 1, 2].includes(date.getMonth())) { // Winter
          baseDemand *= 1.1;
          factors.push('Winter demand');
        }
        break;
      case 'sugar':
        baseDemand = 150 + Math.random() * 100;
        break;
      case 'dal':
        baseDemand = 100 + Math.random() * 50;
        break;
      case 'oil':
        baseDemand = 80 + Math.random() * 40;
        break;
      case 'salt':
        baseDemand = 60 + Math.random() * 20;
        break;
      case 'tea':
        baseDemand = 40 + Math.random() * 20;
        break;
    }

    // Add growth trend
    const growthFactor = 1 + (i * 0.02); // 2% monthly growth
    baseDemand *= growthFactor;

    data.push({
      period,
      actual_demand: Math.round(baseDemand),
      factors
    });
  }

  return data;
}

private getCurrentStockLevel(storeId: string, itemId: string): number {
  // Get from store service
  const stores = JSON.parse(localStorage.getItem('ration_stores') || '[]');
  const store = stores.find((s: any) => s.id === storeId);
  return store?.inventory?.[itemId] || 0;
}

private getStoreInfo(storeId: string) {
  // Mock store info - in real app, get from store service
  const mockStores = [
    { id: 'store-001', name: 'Angamaly Ration Depot', latitude: 10.1965, longitude: 76.3912, district: 'Ernakulam' },
    { id: 'store-002', name: 'Aluva Civil Supplies', latitude: 10.1075, longitude: 76.3570, district: 'Ernakulam' },
    { id: 'store-003', name: 'Periyar Nagar Ration Shop', latitude: 9.9658, longitude: 76.2875, district: 'Ernakulam' }
  ];

  return mockStores.find(s => s.id === storeId) || mockStores[0];
}

private calculateSeasonalFactors(data: any[]): number[] {
  const monthlyTotals = new Array(12).fill(0);
  const monthlyCounts = new Array(12).fill(0);

  data.forEach(d => {
    const month = new Date(d.period + '-01').getMonth();
    monthlyTotals[month] += d.actual_demand;
    monthlyCounts[month]++;
  });

  const monthlyAverages = monthlyTotals.map((total, i) =>
    monthlyCounts[i] > 0 ? total / monthlyCounts[i] : 0
  );

  const overallAverage = monthlyAverages.reduce((a, b) => a + b, 0) / 12;

  return monthlyAverages.map(avg => avg / overallAverage);
}

private calculateTrend(data: any[]): number {
  if (data.length < 2) return 0;

  const recent = data.slice(-3);
  const trend = (recent[recent.length - 1].actual_demand - recent[0].actual_demand) / recent.length;

  return trend;
}

private generateProcurementRecommendations(forecasts: DemandForecast[], storeId: string) {
  const understockItems = forecasts.filter(f => f.risk_assessment === 'understock');
  const overstockItems = forecasts.filter(f => f.risk_assessment === 'overstock');

  const immediateActions = [];
  const procurementPlan = [];
  const riskMitigations = [];

  if (understockItems.length > 0) {
    immediateActions.push(`Urgent restocking needed for: ${understockItems.map(f => f.item_id).join(', ')}`);
    procurementPlan.push(`Procure additional ${understockItems.reduce((sum, f) => sum + f.recommended_stock, 0)} units this week`);
  }

  if (overstockItems.length > 0) {
    immediateActions.push(`Consider redistributing excess stock of: ${overstockItems.map(f => f.item_id).join(', ')}`);
    riskMitigations.push('Monitor overstock items for spoilage risk');
  }

  // Monthly procurement plan
  const totalMonthlyRequirement = forecasts.reduce((sum, f) => sum + f.recommended_stock, 0);
  procurementPlan.push(`Monthly procurement target: ${totalMonthlyRequirement} units across all items`);

  // Seasonal planning
  const currentMonth = new Date().getMonth();
  if ([5, 6, 7, 8, 9].includes(currentMonth)) { // Monsoon
    procurementPlan.push('Increase rice procurement by 20% for monsoon season');
  }

  riskMitigations.push('Maintain 15-20% buffer stock for demand fluctuations');
  riskMitigations.push('Implement automated reorder alerts when stock drops below 20%');

  return {
    immediate_actions: immediateActions,
    procurement_plan: procurementPlan,
    risk_mitigations: riskMitigations
  };
}

private generateDemandInsights(forecasts: DemandForecast[], storeId: string): string[] {
  const insights = [];

  // High confidence forecasts
  const highConfidence = forecasts.filter(f => f.confidence_level > 80);
  if (highConfidence.length > 0) {
    insights.push(`High confidence predictions for ${highConfidence.length} items with accuracy >80%`);
  }

  // Risk assessments
  const understockRisks = forecasts.filter(f => f.risk_assessment === 'understock');
  const overstockRisks = forecasts.filter(f => f.risk_assessment === 'overstock');

  if (understockRisks.length > 0) {
    insights.push(`${understockRisks.length} items at risk of stockout`);
  }

  if (overstockRisks.length > 0) {
    insights.push(`${overstockRisks.length} items may have excess inventory`);
  }

  // Seasonal patterns
  const seasonalItems = forecasts.filter(f => f.prediction_basis === 'seasonal');
  if (seasonalItems.length > 0) {
    insights.push(`${seasonalItems.length} items show seasonal demand patterns`);
  }

  // Trend analysis
  const trendingUp = forecasts.filter(f => f.prediction_basis === 'trend' && f.forecasted_demand > 100);
  if (trendingUp.length > 0) {
    insights.push(`${trendingUp.length} items showing upward demand trend`);
  }

  if (insights.length === 0) {
    insights.push('Demand patterns appear stable with no significant variations');
  }

  return insights;
}
}

// Export singleton instance
export const aiAuditor = new AIAuditor();

// Helper function to trigger audit from admin panel
export async function triggerAudit(storeId: string): Promise<AuditReport | null> {
  return await aiAuditor.runAutomatedAudit(storeId);
}

// Demand prediction helper functions
export async function generateStoreDemandReport(storeId: string): Promise<StoreDemandReport> {
  return await aiAuditor.generateStoreDemandReport(storeId);
}

export function generateItemDemandForecast(storeId: string, itemId: string): DemandForecast {
  return aiAuditor.generateDemandForecast(storeId, itemId);
}

// Get audit dashboard data
export function getAuditDashboardData() {
  const reports = aiAuditor.getAuditHistory();

  return {
    totalAudits: reports.length,
    averageCompliance: reports.length > 0 ?
      reports.reduce((sum, r) => sum + r.compliance_rate, 0) / reports.length : 0,
    criticalIssues: reports.reduce((sum, r) =>
      sum + r.flagged_orders.filter(i => i.severity === 'critical').length, 0),
    recentReports: reports.slice(-5).reverse(),
    riskDistribution: {
      low: reports.filter(r => r.risk_score === 'low').length,
      medium: reports.filter(r => r.risk_score === 'medium').length,
      high: reports.filter(r => r.risk_score === 'high').length,
      critical: reports.filter(r => r.risk_score === 'critical').length
    }
  };
}

// ==========================================
// DEMAND PREDICTION DEMO FUNCTIONS
// ==========================================

// Demo function to generate sample demand reports
export async function generateSampleDemandReports() {
  console.log('🔮 AI Auditor: Generating sample demand prediction reports...');

  const stores = ['store-001', 'store-002', 'store-003'];
  const reports = [];

  for (const storeId of stores) {
    try {
      const report = await generateStoreDemandReport(storeId);
      reports.push(report);
      console.log(`✅ Generated report for ${report.store_name}`);
    } catch (error) {
      console.error(`❌ Failed to generate report for ${storeId}:`, error);
    }
  }

  return reports;
}

// Demo function to show individual item forecasts
export function demonstrateForecastAlgorithms() {
  console.log('🔮 AI Auditor: Demonstrating forecast algorithms...');

  const storeId = 'store-001';
  const items = ['rice', 'wheat', 'sugar'];

  const results = items.map(itemId => {
    const forecast = generateItemDemandForecast(storeId, itemId);
    console.log(`${itemId.toUpperCase()}: ${forecast.forecasted_demand} units (${forecast.confidence_level}% confidence, ${forecast.prediction_basis})`);
    return forecast;
  });

  return results;
}

// Export comprehensive demand analytics
export function getDemandAnalyticsDashboard() {
  console.log('📊 AI Auditor: Generating demand analytics dashboard...');

  // Generate sample reports for demo
  const sampleReports = [
    // Mock data for demonstration
    {
      store_id: 'store-001',
      store_name: 'Angamaly Ration Depot',
      forecast_period: '2026-02',
      total_monthly_demand: { rice: 480, wheat: 330, sugar: 180 },
      summary: {
        overall_risk: 'medium' as const,
        confidence_score: 78,
        key_insights: ['Rice demand increasing due to monsoon season', 'Optimal stock levels for wheat']
      }
    }
  ];

  return {
    totalStoresAnalyzed: sampleReports.length,
    averageConfidence: 78,
    highRiskStores: sampleReports.filter((r: any) => r.summary.overall_risk === 'high').length,
    totalMonthlyDemand: sampleReports.reduce((acc, report) => {
      Object.entries(report.total_monthly_demand).forEach(([item, demand]) => {
        acc[item] = (acc[item] || 0) + demand;
      });
      return acc;
    }, {} as Record<string, number>),
    recentReports: sampleReports,
    procurementAlerts: [
      'Store-001 needs 480kg rice this month',
      'Store-002 wheat stock below optimal level',
      'Seasonal rice demand increase expected in June-September'
    ]
  };
}
