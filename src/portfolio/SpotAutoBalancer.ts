import { RestClientV2 } from "bitget-api";
import { logger } from "../utils/logger.js";
import { PortfolioTransfer } from "./PortfolioTransfer.js";

export interface AutoBalancerConfig {
  enabled: boolean;
  minUsdtThreshold: number; // Minimum USDT balance to trigger auto-balancing
  checkIntervalMs: number; // How often to check for balancing (default 60s)
  targetAllocations: Record<string, number>; // Symbol -> allocation percentage
}

export class SpotAutoBalancer {
  private rest: RestClientV2;
  private portfolioTransfer: PortfolioTransfer;
  private config: AutoBalancerConfig;
  private checkInterval: NodeJS.Timeout | null = null;
  private isBalancing = false;
  private lastBalanceTime = 0;
  private readonly logger = logger.child({ component: "SpotAutoBalancer" });

  constructor(
    restClient: RestClientV2,
    portfolioTransfer: PortfolioTransfer,
    config: AutoBalancerConfig
  ) {
    this.rest = restClient;
    this.portfolioTransfer = portfolioTransfer;
    this.config = config;
  }

  /**
   * Start automatic balancing monitoring
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      this.logger.info("⚠️ Auto-balancer is disabled in configuration");
      return;
    }

    this.logger.info(
      `🎯 Starting Spot Auto-Balancer (threshold: ${this.config.minUsdtThreshold} USDT)`
    );

    // Initial check
    await this.checkAndBalance();

    // Set up periodic checks
    this.checkInterval = setInterval(async () => {
      await this.checkAndBalance();
    }, this.config.checkIntervalMs);

    this.logger.info(
      `✅ Auto-balancer started (checking every ${
        this.config.checkIntervalMs / 1000
      }s)`
    );
  }

  /**
   * Stop automatic balancing
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      this.logger.info("🛑 Auto-balancer stopped");
    }
  }

  /**
   * Check spot balance and trigger balancing if needed
   */
  private async checkAndBalance(): Promise<void> {
    // Prevent concurrent balancing operations
    if (this.isBalancing) {
      this.logger.debug("⏳ Balancing already in progress, skipping check");
      return;
    }

    try {
      // Get current spot balances
      const balances = await this.portfolioTransfer.getPortfolioBalances();
      const usdtBalance = balances.spot.USDT;

      this.logger.debug(
        `💰 Current Spot USDT balance: ${usdtBalance.toFixed(2)} USDT`
      );

      // Check if we should trigger balancing
      if (usdtBalance >= this.config.minUsdtThreshold) {
        this.logger.info(
          `🚀 USDT balance (${usdtBalance.toFixed(2)}) exceeds threshold (${
            this.config.minUsdtThreshold
          }), triggering auto-balance`
        );
        await this.executeBalancing(usdtBalance);
      } else {
        this.logger.debug(
          `✅ USDT balance (${usdtBalance.toFixed(2)}) below threshold (${
            this.config.minUsdtThreshold
          }), no action needed`
        );
      }
    } catch (error: any) {
      this.logger.error("❌ Failed to check and balance:", {
        error: error.message,
        code: error.code,
        status: error.status,
        stack: error.stack,
      });
    }
  }

  /**
   * Execute the balancing operation
   */
  private async executeBalancing(totalUsdtAmount: number): Promise<void> {
    this.isBalancing = true;
    this.lastBalanceTime = Date.now();

    try {
      this.logger.info(
        `📊 Starting automatic portfolio balancing with ${totalUsdtAmount.toFixed(
          2
        )} USDT`
      );

      // Calculate allocations based on target percentages
      const allocations = Object.entries(this.config.targetAllocations).map(
        ([symbol, percentage]) => ({
          symbol: symbol.replace("USDT", ""), // Remove USDT suffix for spot trading
          amount: totalUsdtAmount * percentage,
          percentage,
        })
      );

      this.logger.info("📋 Allocation plan:", {
        total: totalUsdtAmount,
        allocations: allocations.map((a) => ({
          symbol: a.symbol,
          amount: a.amount.toFixed(2),
          percentage: (a.percentage * 100).toFixed(1) + "%",
        })),
      });

      // Execute each allocation
      let successCount = 0;
      let failCount = 0;

      for (const allocation of allocations) {
        if (allocation.amount < 5) {
          this.logger.warn(
            `⚠️ Skipping ${
              allocation.symbol
            }: amount too small (${allocation.amount.toFixed(
              2
            )} USDT, minimum 5 USDT)`
          );
          continue;
        }

        try {
          await this.buySpotAsset(allocation.symbol, allocation.amount);
          successCount++;
          this.logger.info(
            `✅ [${successCount}/${
              allocations.length
            }] Purchased ${allocation.amount.toFixed(2)} USDT worth of ${
              allocation.symbol
            }`
          );

          // Add delay between orders to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error: any) {
          failCount++;
          this.logger.error(
            `❌ [${failCount} failed] Failed to buy ${allocation.symbol}:`,
            error.message || error
          );
          // Continue with other allocations even if one fails
        }
      }

      this.logger.info(
        `✅ Auto-balancing completed: ${successCount} successful, ${failCount} failed`
      );
    } catch (error) {
      this.logger.error("❌ Auto-balancing failed:", error);
    } finally {
      this.isBalancing = false;
    }
  }

  /**
   * Buy spot asset with USDT
   */
  private async buySpotAsset(
    symbol: string,
    usdtAmount: number
  ): Promise<void> {
    try {
      const orderParams = {
        productType: "SPOT" as const,
        symbol: `${symbol}USDT`,
        marginCoin: "USDT",
        size: String(usdtAmount),
        side: "buy" as const,
        orderType: "market" as const,
        force: "gtc" as const,
        clientOid: `autobalance_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
      };

      this.logger.info(
        `📤 Placing spot market order: ${usdtAmount.toFixed(
          2
        )} USDT → ${symbol}`
      );

      const result = await this.rest.spotSubmitOrder(orderParams);

      if (result.data?.orderId) {
        this.logger.info(
          `✅ Order placed successfully: ${result.data.orderId}`
        );
      } else {
        throw new Error("No order ID in response");
      }
    } catch (error: any) {
      this.logger.error(
        `❌ Spot purchase failed for ${symbol}:`,
        error.message || error
      );
      throw error;
    }
  }

  /**
   * Get balancing status
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      isBalancing: this.isBalancing,
      lastBalanceTime: this.lastBalanceTime,
      minUsdtThreshold: this.config.minUsdtThreshold,
      checkIntervalMs: this.config.checkIntervalMs,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AutoBalancerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info("🔄 Auto-balancer configuration updated:", newConfig);

    // Restart if interval changed
    if (newConfig.checkIntervalMs && this.checkInterval) {
      this.stop();
      this.start();
    }
  }
}
