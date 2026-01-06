// AI Auditor Service - Intelligent fraud detection and compliance monitoring for PDS system

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
}

// Export singleton instance
export const aiAuditor = new AIAuditor();

// Helper function to trigger audit from admin panel
export async function triggerAudit(storeId: string): Promise<AuditReport | null> {
  return await aiAuditor.runAutomatedAudit(storeId);
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
