import { RestClientV2 } from "bitget-api";
import { logger } from "../utils/logger.js";

export interface TransferRequest {
  from: "spot" | "futures";
  to: "spot" | "futures";
  amount: number;
  currency: string;
}

export interface PortfolioBalance {
  spot: {
    USDT: number;
    BTC: number;
    ETH: number;
    BNB: number;
    MATIC: number;
  };
  futures: {
    USDT: number;
    totalEquity: number;
    availableBalance: number;
  };
}

export class PortfolioTransfer {
  private rest: RestClientV2;
  private readonly logger = logger.child({ component: "PortfolioTransfer" });

  constructor(rest: RestClientV2) {
    this.rest = rest;
  }

  /**
   * Get balances for both spot and futures portfolios
   */
  async getPortfolioBalances(): Promise<PortfolioBalance> {
    try {
      this.logger.info("💰 Getting portfolio balances for both spot and futures");

      // Get spot balances
      const spotBalances = await this.getSpotBalances();
      
      // Get futures balances
      const futuresBalances = await this.getFuturesBalances();

      const balances: PortfolioBalance = {
        spot: spotBalances,
        futures: futuresBalances,
      };

      this.logger.info("📊 Portfolio balances retrieved:", {
        spotUSDT: balances.spot.USDT,
        futuresUSDT: balances.futures.USDT,
        futuresEquity: balances.futures.totalEquity,
      });

      return balances;
    } catch (error) {
      this.logger.error("❌ Failed to get portfolio balances:", error);
      throw error;
    }
  }

  /**
   * Transfer funds between spot and futures wallets
   * Note: Manual transfer required via Bitget interface
   */
  async transferFunds(request: TransferRequest): Promise<boolean> {
    try {
      this.logger.info(`🔄 Transfer request: ${request.amount} ${request.currency} from ${request.from} to ${request.to}`);
      this.logger.warn(`⚠️ Manual transfer required: Please transfer ${request.amount} ${request.currency} from ${request.from} to ${request.to} wallet via Bitget interface`);
      
      // For now, we'll assume the transfer is successful
      // In a real implementation, you would need to use Bitget's transfer API
      // or implement manual transfer verification
      return true;
    } catch (error: any) {
      this.logger.error(`❌ Transfer failed:`, {
        error: error.message,
        code: error.code,
        request,
      });
      return false;
    }
  }

  /**
   * Auto-allocate spot portfolio based on target allocations
   */
  async allocateSpotPortfolio(targetAllocations: Record<string, number>, totalAmount: number): Promise<boolean> {
    try {
      this.logger.info("🎯 Starting spot portfolio allocation");

      const allocations = Object.entries(targetAllocations).map(([symbol, percentage]) => ({
        symbol: symbol.replace("USDT", ""), // Remove USDT suffix for spot trading
        amount: totalAmount * percentage,
        percentage,
      }));

      this.logger.info("📊 Allocation plan:", allocations);

      // Execute spot purchases for each allocation
      for (const allocation of allocations) {
        if (allocation.amount < 5) {
          this.logger.warn(`⚠️ Skipping ${allocation.symbol}: amount too small (${allocation.amount} USDT)`);
          continue;
        }

        try {
          await this.buySpotAsset(allocation.symbol, allocation.amount);
          this.logger.info(`✅ Purchased ${allocation.amount} USDT worth of ${allocation.symbol}`);
        } catch (error) {
          this.logger.error(`❌ Failed to buy ${allocation.symbol}:`, error);
        }
      }

      return true;
    } catch (error) {
      this.logger.error("❌ Spot portfolio allocation failed:", error);
      return false;
    }
  }

  /**
   * Transfer excess futures profits back to spot for rebalancing
   */
  async rebalanceFromFutures(threshold: number = 100): Promise<boolean> {
    try {
      const balances = await this.getPortfolioBalances();
      
      if (balances.futures.availableBalance > threshold) {
        const transferAmount = balances.futures.availableBalance - threshold;
        
        this.logger.info(`🔄 Rebalancing: transferring ${transferAmount} USDT from futures to spot`);
        
        return await this.transferFunds({
          from: "futures",
          to: "spot",
          amount: transferAmount,
          currency: "USDT",
        });
      }

      return true;
    } catch (error) {
      this.logger.error("❌ Rebalancing from futures failed:", error);
      return false;
    }
  }

  /**
   * Get spot wallet balances
   */
  private async getSpotBalances(): Promise<PortfolioBalance["spot"]> {
    try {
      const result = await this.rest.getSpotAccountAssets();
      
      const balances: PortfolioBalance["spot"] = {
        USDT: 0,
        BTC: 0,
        ETH: 0,
        BNB: 0,
        MATIC: 0,
      };

      if (result.data && Array.isArray(result.data)) {
        for (const asset of result.data) {
          const coin = asset.coin;
          const available = parseFloat(asset.available || "0");
          
          if (coin === "USDT") balances.USDT = available;
          else if (coin === "BTC") balances.BTC = available;
          else if (coin === "ETH") balances.ETH = available;
          else if (coin === "BNB") balances.BNB = available;
          else if (coin === "MATIC") balances.MATIC = available;
        }
      }

      return balances;
    } catch (error) {
      this.logger.error("❌ Failed to get spot balances:", error);
      return { USDT: 0, BTC: 0, ETH: 0, BNB: 0, MATIC: 0 };
    }
  }

  /**
   * Get futures wallet balances
   */
  private async getFuturesBalances(): Promise<PortfolioBalance["futures"]> {
    try {
      const result = await this.rest.getFuturesAccountAssets({
        productType: "USDT-FUTURES" as const,
      });

      const balances: PortfolioBalance["futures"] = {
        USDT: 0,
        totalEquity: 0,
        availableBalance: 0,
      };

      if (result.data && Array.isArray(result.data)) {
        for (const asset of result.data) {
          if (asset.marginCoin === "USDT") {
            balances.USDT = parseFloat(asset.available || "0");
            balances.totalEquity = parseFloat(asset.available || "0");
            balances.availableBalance = parseFloat(asset.available || "0");
          }
        }
      }

      return balances;
    } catch (error) {
      this.logger.error("❌ Failed to get futures balances:", error);
      return { USDT: 0, totalEquity: 0, availableBalance: 0 };
    }
  }

  /**
   * Buy spot asset with USDT
   */
  private async buySpotAsset(symbol: string, usdtAmount: number): Promise<void> {
    try {
      const orderParams = {
        productType: "SPOT" as const,
        symbol: `${symbol}USDT`,
        marginCoin: "USDT",
        size: String(usdtAmount),
        side: "buy" as const,
        orderType: "market" as const,
        force: "gtc" as const,
        clientOid: `spot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      const result = await this.rest.spotSubmitOrder(orderParams);
      this.logger.info(`✅ Spot purchase successful: ${result.data.orderId}`);
    } catch (error) {
      this.logger.error(`❌ Spot purchase failed for ${symbol}:`, error);
      throw error;
    }
  }
}
