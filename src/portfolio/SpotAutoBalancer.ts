import { RestClientV2 } from "bitget-api";
import { logger } from "../utils/logger.js";
import { PortfolioTransfer } from "./PortfolioTransfer.js";

export interface AutoBalancerConfig {
  enabled: boolean;
  minUsdtThreshold: number; // Minimum USDT balance to trigger auto-balancing
  checkIntervalMs: number; // How often to check for balancing (default 60s)
  targetAllocations: Record<string, number>; // Symbol -> allocation percentage
  force: "gtc" | "ioc" | "fok"; // Order type
}

export class SpotAutoBalancer {
  private rest: RestClientV2;
  private portfolioTransfer: PortfolioTransfer;
  private config: AutoBalancerConfig;
  private checkInterval: NodeJS.Timeout | null = null;
  private isBalancing = false;
  private lastBalanceTime = 0;
  private wsAdapter: any = null; // Will be set by the bot
  private readonly logger = logger.child({ component: "SpotAutoBalancer" });

  constructor(
    restClient: RestClientV2,
    portfolioTransfer: PortfolioTransfer,
    config: AutoBalancerConfig
  ) {
    this.rest = restClient;
    this.portfolioTransfer = portfolioTransfer;
    this.config = config;
    this.logger.info("🏗️ SpotAutoBalancer constructor called");
    this.logger.info("📊 Config:", this.config);
  }

  /**
   * Set WebSocket adapter for broadcasting events
   */
  setWebSocketAdapter(wsAdapter: any): void {
    this.wsAdapter = wsAdapter;
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
    this.logger.info(
      `📊 Auto-Balancer config: enabled=${this.config.enabled}, threshold=${this.config.minUsdtThreshold}, interval=${this.config.checkIntervalMs}ms`
    );

    // Initial check
    this.logger.info("🔍 Performing initial balance check...");
    await this.checkAndBalance();

    // Force immediate check for testing
    this.logger.info("🚀 Forcing immediate auto-balance check for testing...");
    setTimeout(async () => {
      this.logger.info("⏰ Forced auto-balance check triggered");
      await this.checkAndBalance();
    }, 5000); // Check after 5 seconds

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

  private async ensureSpotBalance(): Promise<void> {
    try {
      const spotAssets = await this.rest.getSpotAccountAssets();
      const usdtAsset = spotAssets.data?.find((a: any) => a.coin === "USDT");
      const usdtBalance = usdtAsset ? parseFloat(usdtAsset.available) : 0;

      if (usdtBalance < 10) {
        this.logger.info(
          `💡 Spot USDT balance is low (${usdtBalance.toFixed(
            2
          )} USDT). Transferring funds from futures...`
        );
        const transferSuccess = await this.portfolioTransfer.transferFunds({
          from: "futures",
          to: "spot",
          amount: 50, // Transfer 50 USDT
          currency: "USDT",
        });

        if (transferSuccess) {
          this.logger.info("✅ Transferred 50 USDT from futures to spot");
        } else {
          this.logger.error("❌ Failed to transfer funds from futures to spot");
        }
      }
    } catch (error: any) {
      this.logger.error("❌ Failed to ensure spot balance:", error);
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

    await this.ensureSpotBalance();

    try {
      // Fetch the real spot account balance
      const spotAssets = await this.rest.getSpotAccountAssets();
      this.logger.debug('Raw spot assets received:', spotAssets.data);

      const usdtAsset = spotAssets.data?.find((a: any) => a.coin === "USDT");
      const usdtBalance = usdtAsset ? parseFloat(usdtAsset.available) : 0;

      this.logger.info(`💰 Fetched Spot USDT balance: ${usdtBalance.toFixed(2)} USDT`);

      // Check if we should trigger balancing
      if (usdtBalance >= this.config.minUsdtThreshold) {
        this.logger.info(
          `🚀 USDT balance (${usdtBalance.toFixed(2)}) exceeds threshold (${
            this.config.minUsdtThreshold
          }), triggering auto-balance`
        );

        // Broadcast trigger event
        if (this.wsAdapter) {
          this.wsAdapter.broadcastBotData({
            type: "auto_balance_triggered",
            message: `Auto-balancing triggered: ${usdtBalance.toFixed(
              2
            )} USDT detected`,
            details: {
              usdtBalance,
              threshold: this.config.minUsdtThreshold,
              timestamp: Date.now(),
            },
          });
        }

        await this.executeBalancing(usdtBalance);
      } else {
        this.logger.debug(
          `✅ USDT balance (${usdtBalance.toFixed(2)}) below threshold (${
            this.config.minUsdtThreshold
          }), no action needed`
        );
      }
    } catch (error: any) {
      this.logger.error("❌ Failed to check and balance. Raw error below:");
      this.logger.error(error);

      // Also log a more structured version if possible
      if (error && typeof error === "object") {
        this.logger.error("Structured error details:", {
          message: error.message,
          code: error.code,
          status: error.status,
          stack: error.stack,
          fullError: JSON.stringify(error, null, 2),
        });
      }
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
          symbol,
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
            }] Purchased: ${allocation.amount.toFixed(2)} USDT worth of ${
              allocation.symbol
            }`
          );
        } catch (error: any) {
          failCount++;
          this.logger.error(
            `❌ [${failCount} failed] Failed to simulate buy ${allocation.symbol}:`,
            error.message || error
          );
        }
      }

      this.logger.info(
        `✅ Auto-balancing completed: ${successCount} successful, ${failCount} failed`
      );

      // Broadcast completion event
      if (this.wsAdapter) {
        if (successCount > 0 && failCount === 0) {
          this.wsAdapter.broadcast({
            type: "auto_balance_success",
            message: `Auto-balancing completed successfully: ${successCount} assets purchased`,
            details: {
              successCount,
              failCount,
              totalUsdtAmount,
              timestamp: Date.now(),
            },
          });
        } else if (failCount > 0) {
          this.wsAdapter.broadcast({
            type: "auto_balance_error",
            message: `Auto-balancing failed: ${failCount} assets failed to purchase`,
            details: {
              successCount,
              failCount,
              totalUsdtAmount,
              timestamp: Date.now(),
            },
          });
        }
      }
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
        symbol,
        size: String(usdtAmount),
        side: "buy" as const,
        orderType: "market" as const,
        force: this.config.force || "gtc",
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
      this.logger.error(`❌ Spot purchase failed for ${symbol}:`, {
        message: error.message,
        code: error.code,
        data: error.data,
        response: error.response?.data,
      });
      if (error.response?.data?.msg) {
        this.logger.error(`Bitget API Error: ${error.response.data.msg}`);
      }
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
