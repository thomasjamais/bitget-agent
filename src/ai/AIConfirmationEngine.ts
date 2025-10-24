/**
 * AI Confirmation Engine for USDT Trading
 * Implements 40% AI decision weight for order confirmations
 */

import { Signal, Bar } from "../types/index.js";
import { logger } from "../utils/logger.js";
import { AIEngine } from "../signals/aiEngine.js";
import { EnhancedAIEngine } from "./EnhancedAIEngine.js";

export interface AIConfirmationResult {
  confirmed: boolean;
  confidence: number;
  aiWeight: number;
  humanWeight: number;
  reasoning: string;
  riskAssessment: "low" | "medium" | "high";
  recommendation: "proceed" | "wait" | "reject";
}

export interface OrderIntention {
  symbol: string;
  direction: "long" | "short";
  quantity: number;
  leverage: number;
  expectedReturn: number;
  riskScore: number;
  timestamp: number;
  source: string; // 'technical' | 'ai' | 'manual'
}

export class AIConfirmationEngine {
  private aiEngine: AIEngine;
  private readonly logger = logger.child({ component: "AIConfirmation" });
  private readonly AI_WEIGHT = 0.4; // 40% AI decision weight
  private readonly HUMAN_WEIGHT = 0.6; // 60% human/technical decision weight
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.6; // Minimum confidence for AI approval
  private readonly MAX_RISK_SCORE = 0.7; // Maximum risk score for approval

  constructor(aiEngine: AIEngine) {
    this.aiEngine = aiEngine;
    this.logger.info(
      "🤖 AI Confirmation Engine initialized with 40% decision weight"
    );
  }

  /**
   * Main method to confirm or reject a trading order intention
   */
  async confirmOrderIntention(
    intention: OrderIntention,
    marketData: Bar
  ): Promise<AIConfirmationResult> {
    try {
      this.logger.info(
        `🔍 AI Confirmation requested for ${intention.symbol} ${intention.direction} order`
      );

      // Generate AI signal for the same symbol and timeframe
      const aiSignal = this.aiEngine.generate(
        marketData,
        intention.symbol,
        "15m"
      );

      if (!aiSignal) {
        return this.createRejectionResult(
          "AI signal generation failed",
          "AI engine could not generate signal for analysis"
        );
      }

      // Analyze AI signal alignment with order intention
      const alignmentScore = this.calculateAlignmentScore(intention, aiSignal);

      // Calculate AI confidence in the proposed trade
      const aiConfidence = this.calculateAIConfidence(aiSignal, marketData);

      // Assess risk level
      const riskAssessment = this.assessRiskLevel(
        intention,
        aiSignal,
        marketData
      );

      // Calculate final decision weights
      const finalConfidence = this.calculateFinalConfidence(
        aiConfidence,
        alignmentScore,
        intention.expectedReturn,
        intention.riskScore
      );

      // Make final decision
      const confirmed = this.makeFinalDecision(
        finalConfidence,
        alignmentScore,
        riskAssessment,
        intention.riskScore
      );

      const recommendation = this.getRecommendation(
        confirmed,
        finalConfidence,
        riskAssessment,
        alignmentScore
      );

      const reasoning = this.generateReasoning(
        intention,
        aiSignal,
        alignmentScore,
        aiConfidence,
        riskAssessment
      );

      const result: AIConfirmationResult = {
        confirmed,
        confidence: finalConfidence,
        aiWeight: this.AI_WEIGHT,
        humanWeight: this.HUMAN_WEIGHT,
        reasoning,
        riskAssessment,
        recommendation,
      };

      this.logger.info(
        `🎯 AI Confirmation Result: ${confirmed ? "APPROVED" : "REJECTED"}`,
        {
          symbol: intention.symbol,
          direction: intention.direction,
          confidence: finalConfidence,
          alignmentScore,
          riskAssessment,
          recommendation,
        }
      );

      return result;
    } catch (error: any) {
      this.logger.error(`❌ AI Confirmation failed: ${error.message}`, {
        error,
      });
      return this.createRejectionResult(
        "AI confirmation system error",
        `System error: ${error.message}`
      );
    }
  }

  /**
   * Calculate how well the AI signal aligns with the order intention
   */
  private calculateAlignmentScore(
    intention: OrderIntention,
    aiSignal: Signal
  ): number {
    // Check direction alignment
    const directionMatch = intention.direction === aiSignal.direction;

    // Calculate alignment score (0-1)
    let alignmentScore = directionMatch ? 0.8 : 0.2;

    // Bonus for high AI confidence
    if (aiSignal.confidence > 0.7) {
      alignmentScore += 0.1;
    }

    // Bonus for strong signal strength
    if (aiSignal.confidence > 0.8) {
      alignmentScore += 0.1;
    }

    return Math.min(1.0, alignmentScore);
  }

  /**
   * Calculate AI confidence in the proposed trade
   */
  private calculateAIConfidence(aiSignal: Signal, marketData: Bar): number {
    let confidence = aiSignal.confidence;

    // Adjust confidence based on market conditions
    const priceVolatility =
      Math.abs(marketData.high - marketData.low) / marketData.close;

    if (priceVolatility > 0.05) {
      // High volatility
      confidence *= 0.9; // Reduce confidence in volatile markets
    } else if (priceVolatility < 0.01) {
      // Low volatility
      confidence *= 1.1; // Increase confidence in stable markets
    }

    return Math.min(1.0, confidence);
  }

  /**
   * Assess risk level of the proposed trade
   */
  private assessRiskLevel(
    intention: OrderIntention,
    aiSignal: Signal,
    marketData: Bar
  ): "low" | "medium" | "high" {
    let riskScore = 0;

    // High leverage increases risk
    if (intention.leverage > 10) {
      riskScore += 0.3;
    } else if (intention.leverage > 5) {
      riskScore += 0.2;
    }

    // High risk score from intention
    if (intention.riskScore > 0.6) {
      riskScore += 0.3;
    }

    // Low AI confidence increases risk
    if (aiSignal.confidence < 0.6) {
      riskScore += 0.2;
    }

    // Market volatility
    const volatility =
      Math.abs(marketData.high - marketData.low) / marketData.close;
    if (volatility > 0.05) {
      riskScore += 0.2;
    }

    if (riskScore > 0.6) return "high";
    if (riskScore > 0.3) return "medium";
    return "low";
  }

  /**
   * Calculate final confidence score combining AI and human factors
   */
  private calculateFinalConfidence(
    aiConfidence: number,
    alignmentScore: number,
    expectedReturn: number,
    riskScore: number
  ): number {
    // AI contribution (40% weight)
    const aiContribution = aiConfidence * this.AI_WEIGHT;

    // Human/Technical contribution (60% weight)
    const humanContribution =
      (alignmentScore * 0.4 + // Signal alignment
        Math.min(expectedReturn / 10, 1) * 0.3 + // Expected return (capped at 10%)
        (1 - riskScore) * 0.3) * // Risk factor (inverted)
      this.HUMAN_WEIGHT;

    const finalConfidence = aiContribution + humanContribution;

    return Math.max(0, Math.min(1, finalConfidence));
  }

  /**
   * Make final decision based on all factors
   */
  private makeFinalDecision(
    finalConfidence: number,
    alignmentScore: number,
    riskAssessment: "low" | "medium" | "high",
    riskScore: number
  ): boolean {
    // Must meet minimum confidence threshold
    if (finalConfidence < this.MIN_CONFIDENCE_THRESHOLD) {
      return false;
    }

    // Must have reasonable alignment
    if (alignmentScore < 0.4) {
      return false;
    }

    // Risk-based rejection
    if (riskAssessment === "high" && riskScore > this.MAX_RISK_SCORE) {
      return false;
    }

    // High confidence with good alignment = approve
    if (finalConfidence > 0.7 && alignmentScore > 0.6) {
      return true;
    }

    // Medium confidence with low risk = approve
    if (finalConfidence > 0.6 && riskAssessment === "low") {
      return true;
    }

    return false;
  }

  /**
   * Get recommendation based on decision factors
   */
  private getRecommendation(
    confirmed: boolean,
    finalConfidence: number,
    riskAssessment: "low" | "medium" | "high",
    alignmentScore: number
  ): "proceed" | "wait" | "reject" {
    if (!confirmed) {
      if (finalConfidence < 0.4) return "reject";
      if (alignmentScore < 0.3) return "reject";
      return "wait";
    }

    if (riskAssessment === "high") return "wait";
    if (finalConfidence < 0.6) return "wait";

    return "proceed";
  }

  /**
   * Generate human-readable reasoning for the decision
   */
  private generateReasoning(
    intention: OrderIntention,
    aiSignal: Signal,
    alignmentScore: number,
    aiConfidence: number,
    riskAssessment: "low" | "medium" | "high"
  ): string {
    const parts: string[] = [];

    // AI alignment
    if (alignmentScore > 0.7) {
      parts.push(
        `AI strongly agrees with ${intention.direction} direction (${Math.round(
          alignmentScore * 100
        )}% alignment)`
      );
    } else if (alignmentScore > 0.4) {
      parts.push(
        `AI partially agrees with ${
          intention.direction
        } direction (${Math.round(alignmentScore * 100)}% alignment)`
      );
    } else {
      parts.push(
        `AI disagrees with ${intention.direction} direction (${Math.round(
          alignmentScore * 100
        )}% alignment)`
      );
    }

    // AI confidence
    parts.push(`AI confidence: ${Math.round(aiConfidence * 100)}%`);

    // Risk assessment
    parts.push(`Risk level: ${riskAssessment.toUpperCase()}`);

    // Leverage consideration
    if (intention.leverage > 10) {
      parts.push(`High leverage (${intention.leverage}x) increases risk`);
    }

    return parts.join(". ");
  }

  /**
   * Create a rejection result
   */
  private createRejectionResult(
    reason: string,
    details: string
  ): AIConfirmationResult {
    return {
      confirmed: false,
      confidence: 0,
      aiWeight: this.AI_WEIGHT,
      humanWeight: this.HUMAN_WEIGHT,
      reasoning: `${reason}: ${details}`,
      riskAssessment: "high",
      recommendation: "reject",
    };
  }

  /**
   * Get current AI weight percentage
   */
  getAIWeight(): number {
    return this.AI_WEIGHT;
  }

  /**
   * Get current human weight percentage
   */
  getHumanWeight(): number {
    return this.HUMAN_WEIGHT;
  }

  /**
   * Update AI weight (for dynamic adjustment)
   */
  setAIWeight(weight: number): void {
    if (weight < 0 || weight > 1) {
      throw new Error("AI weight must be between 0 and 1");
    }
    (this as any).AI_WEIGHT = weight;
    (this as any).HUMAN_WEIGHT = 1 - weight;
    this.logger.info(`🔄 AI weight updated to ${Math.round(weight * 100)}%`);
  }
}
