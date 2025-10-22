import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { BotConfig, InvestmentInstruction } from "../types/index.js";
import { logger } from "../utils/logger.js";

/**
 * JSON schema for configuration validation
 */
const configSchema = {
  type: "object",
  required: [
    "api",
    "instructions",
    "globalRisk",
    "marketData",
    "ai",
    "logging",
  ],
  properties: {
    api: {
      type: "object",
      required: ["key", "secret", "passphrase"],
      properties: {
        key: { type: "string", minLength: 1 },
        secret: { type: "string", minLength: 1 },
        passphrase: { type: "string", minLength: 1 },
        useTestnet: { type: "boolean" }, // Optional - managed dynamically by runtime
        baseUrl: { type: "string", format: "uri" },
      },
    },
    instructions: {
      type: "array",
      items: {
        type: "object",
        required: [
          "id",
          "name",
          "enabled",
          "symbols",
          "timeframes",
          "direction",
          "risk",
          "signals",
        ],
        properties: {
          id: { type: "string", minLength: 1 },
          name: { type: "string", minLength: 1 },
          description: { type: "string" },
          enabled: { type: "boolean" },
          symbols: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
          },
          timeframes: {
            type: "array",
            items: {
              type: "string",
              enum: [
                "1m",
                "3m",
                "5m",
                "15m",
                "30m",
                "1h",
                "2h",
                "4h",
                "6h",
                "12h",
                "1d",
              ],
            },
            minItems: 1,
          },
          direction: {
            type: "string",
            enum: ["long", "short", "both"],
          },
          risk: {
            type: "object",
            required: [
              "maxRiskPerTrade",
              "maxLeverage",
              "maxPositionsPerSymbol",
              "maxTotalPositions",
            ],
            properties: {
              maxRiskPerTrade: { type: "number", minimum: 0.1, maximum: 10 },
              maxLeverage: { type: "number", minimum: 1, maximum: 125 },
              maxPositionsPerSymbol: { type: "integer", minimum: 1 },
              maxTotalPositions: { type: "integer", minimum: 1 },
              stopLossPercent: { type: "number", minimum: 0.1, maximum: 50 },
              takeProfitPercent: { type: "number", minimum: 0.1, maximum: 100 },
            },
          },
          signals: {
            type: "object",
            required: ["minConfidence", "cooldownMs"],
            properties: {
              minConfidence: { type: "number", minimum: 0, maximum: 1 },
              requiredSources: {
                type: "array",
                items: { type: "string" },
              },
              cooldownMs: { type: "number", minimum: 0 },
            },
          },
          schedule: {
            type: "object",
            properties: {
              daysOfWeek: {
                type: "array",
                items: { type: "integer", minimum: 0, maximum: 6 },
              },
              startTime: {
                type: "string",
                pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$",
              },
              endTime: {
                type: "string",
                pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$",
              },
              timezone: { type: "string" },
            },
          },
          parameters: { type: "object" },
        },
      },
    },
    globalRisk: {
      type: "object",
      required: [
        "maxEquityRisk",
        "maxDailyLoss",
        "maxConsecutiveLosses",
        "sizingMethod",
      ],
      properties: {
        maxEquityRisk: { type: "number", minimum: 1, maximum: 50 },
        maxDailyLoss: { type: "number", minimum: 0.5, maximum: 20 },
        maxConsecutiveLosses: { type: "integer", minimum: 1, maximum: 20 },
        sizingMethod: {
          type: "string",
          enum: ["fixed", "percent", "kelly", "volatility"],
        },
      },
    },
    marketData: {
      type: "object",
      required: ["symbols", "defaultTimeframe", "reconnect"],
      properties: {
        symbols: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
        },
        defaultTimeframe: {
          type: "string",
          enum: [
            "1m",
            "3m",
            "5m",
            "15m",
            "30m",
            "1h",
            "2h",
            "4h",
            "6h",
            "12h",
            "1d",
          ],
        },
        reconnect: {
          type: "object",
          required: ["maxAttempts", "delayMs"],
          properties: {
            maxAttempts: { type: "integer", minimum: 1 },
            delayMs: { type: "integer", minimum: 1000 },
          },
        },
      },
    },
    ai: {
      type: "object",
      required: ["engines", "consensusThreshold"],
      properties: {
        engines: {
          type: "array",
          items: {
            type: "object",
            required: ["name", "enabled"],
            properties: {
              name: { type: "string", minLength: 1 },
              enabled: { type: "boolean" },
              modelPath: { type: "string" },
              parameters: { type: "object" },
            },
          },
        },
        consensusThreshold: { type: "integer", minimum: 1 },
      },
    },
    logging: {
      type: "object",
      required: ["level"],
      properties: {
        level: {
          type: "string",
          enum: ["trace", "debug", "info", "warn", "error"],
        },
        file: { type: "string" },
        maxFiles: { type: "integer", minimum: 1 },
        maxSize: { type: "string" },
      },
    },
    notifications: {
      type: "object",
      required: ["enabled"],
      properties: {
        enabled: { type: "boolean" },
        webhooks: {
          type: "array",
          items: { type: "string", format: "uri" },
        },
        email: {
          type: "object",
          required: ["enabled", "smtp", "to"],
          properties: {
            enabled: { type: "boolean" },
            smtp: {
              type: "object",
              required: ["host", "port", "user", "password"],
              properties: {
                host: { type: "string" },
                port: { type: "integer" },
                user: { type: "string" },
                password: { type: "string" },
              },
            },
            to: {
              type: "array",
              items: { type: "string", format: "email" },
            },
          },
        },
      },
    },
  },
};

/**
 * Configuration loader and validator
 */
export class ConfigManager {
  private ajv: Ajv;
  private config: BotConfig | null = null;

  constructor() {
    this.ajv = new Ajv({ allErrors: true, verbose: true });
    addFormats(this.ajv);
  }

  /**
   * Load configuration from file
   */
  async loadConfig(configPath: string): Promise<BotConfig> {
    try {
      const absolutePath = path.resolve(configPath);

      if (!fs.existsSync(absolutePath)) {
        throw new Error(`Configuration file not found: ${absolutePath}`);
      }

      const content = fs.readFileSync(absolutePath, "utf-8");
      const ext = path.extname(absolutePath).toLowerCase();

      let config: any;

      if (ext === ".json") {
        config = JSON.parse(content);
      } else if (ext === ".yaml" || ext === ".yml") {
        config = yaml.load(content);
      } else {
        throw new Error(`Unsupported configuration file format: ${ext}`);
      }

      // Expand environment variables in API credentials if present
      if (config?.api) {
        const expand = (val: unknown): string => {
          if (typeof val !== "string") return "";
          const match = val.match(/^\$\{([A-Z0-9_]+)\}$/i);
          if (match && match[1]) {
            const envVal = process.env[match[1]];
            if (!envVal) {
              logger.warn(`Environment variable ${match[1]} is not set.`);
              return "";
            }
            return envVal;
          }
          return val;
        };

        config.api.key = expand(config.api.key);
        config.api.secret = expand(config.api.secret);
        config.api.passphrase = expand(config.api.passphrase);
      }

      // Validate configuration
      const validate = this.ajv.compile(configSchema);
      const valid = validate(config);

      if (!valid) {
        const errors = validate.errors
          ?.map(
            (err) =>
              `${err.instancePath}: ${err.message} (${JSON.stringify(
                err.data
              )})`
          )
          .join("\n");
        throw new Error(`Configuration validation failed:\n${errors}`);
      }

      // Additional validation
      this.validateInstructions(config.instructions);

      this.config = config as BotConfig;
      logger.info(`Configuration loaded successfully from ${configPath}`);

      return this.config;
    } catch (error) {
      logger.error(`Failed to load configuration: ${error}`);
      throw error;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): BotConfig {
    if (!this.config) {
      throw new Error("Configuration not loaded. Call loadConfig() first.");
    }
    return this.config;
  }

  /**
   * Get investment instructions for a symbol
   */
  getInstructionsForSymbol(symbol: string): InvestmentInstruction[] {
    if (!this.config) return [];

    return this.config.instructions.filter(
      (instruction: InvestmentInstruction) =>
        instruction.enabled && instruction.symbols.includes(symbol)
    );
  }

  /**
   * Get active investment instructions
   */
  getActiveInstructions(): InvestmentInstruction[] {
    if (!this.config) return [];

    const now = new Date();

    return this.config.instructions.filter(
      (instruction: InvestmentInstruction) => {
        if (!instruction.enabled) return false;

        // Check schedule if defined
        if (instruction.schedule) {
          const { daysOfWeek, startTime, endTime } = instruction.schedule;

          if (daysOfWeek && !daysOfWeek.includes(now.getDay())) {
            return false;
          }

          if (startTime && endTime) {
            const currentTime = `${now
              .getHours()
              .toString()
              .padStart(2, "0")}:${now
              .getMinutes()
              .toString()
              .padStart(2, "0")}`;
            if (currentTime < startTime || currentTime > endTime) {
              return false;
            }
          }
        }

        return true;
      }
    );
  }

  /**
   * Validate investment instructions
   */
  private validateInstructions(instructions: InvestmentInstruction[]): void {
    const ids = new Set<string>();

    for (const instruction of instructions) {
      // Check for duplicate IDs
      if (ids.has(instruction.id)) {
        throw new Error(`Duplicate instruction ID: ${instruction.id}`);
      }
      ids.add(instruction.id);

      // Validate symbol format (basic check)
      for (const symbol of instruction.symbols) {
        if (!symbol.match(/^[A-Z0-9]+USDT$/)) {
          logger.warn(`Potentially invalid symbol format: ${symbol}`);
        }
      }

      // Validate risk parameters
      const { risk } = instruction;
      if (risk.stopLossPercent && risk.takeProfitPercent) {
        if (risk.stopLossPercent >= risk.takeProfitPercent) {
          throw new Error(
            `Stop loss must be less than take profit for instruction: ${instruction.id}`
          );
        }
      }

      // Validate schedule
      if (instruction.schedule?.startTime && instruction.schedule?.endTime) {
        const start = instruction.schedule.startTime;
        const end = instruction.schedule.endTime;
        if (start >= end) {
          throw new Error(
            `Start time must be before end time for instruction: ${instruction.id}`
          );
        }
      }
    }
  }

  /**
   * Reload configuration from file
   */
  async reloadConfig(configPath: string): Promise<BotConfig> {
    logger.info("Reloading configuration...");
    return this.loadConfig(configPath);
  }

  /**
   * Update runtime configuration (in-memory only)
   */
  updateInstruction(
    instructionId: string,
    updates: Partial<InvestmentInstruction>
  ): void {
    if (!this.config) {
      throw new Error("Configuration not loaded");
    }

    const instruction = this.config.instructions.find(
      (i: InvestmentInstruction) => i.id === instructionId
    );
    if (!instruction) {
      throw new Error(`Instruction not found: ${instructionId}`);
    }

    Object.assign(instruction, updates);
    logger.info(`Instruction updated: ${instructionId}`);
  }
}

/**
 * Global configuration manager instance
 */
export const configManager = new ConfigManager();
