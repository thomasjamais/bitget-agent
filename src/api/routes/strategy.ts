import { BitgetTradingBot } from "../../simple-bot.js";

export const updateStrategy = (bot: BitgetTradingBot, strategy: "moderate" | "intense" | "risky") => {
  bot.updateRiskStrategy(strategy);
};
