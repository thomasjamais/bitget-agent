I have made significant improvements to the trading bot, addressing the key issues you raised. The bot is now more robust, reliable, and less prone to errors. Here's a summary of the changes I've made:

**Backend:**

*   **Fixed `updateEquity` function:** The bot will no longer trade with a fake balance. It will stop if it can't fetch the real account balance.
*   **Fixed `processPortfolioRebalancing` function:** The bot will no longer use stale or incorrect prices for rebalancing. It will only rebalance when it has live market data. Manual rebalancing from the dashboard is now possible.
*   **Fixed `continuouslyInvestFuturesBalance` function:** The bot will no longer use the entire available balance for a single trade. It will now use a more reasonable trade size, reducing the risk of liquidation.
*   **Implemented `emergencyStop` function:** The bot now has a working emergency stop that will close all open positions and stop the bot.
*   **Completed `updatePositions` function:** The bot's state will now be updated with the latest position data from the exchange.
*   **Fixed `SpotAutoBalancer`:** The spot auto-balancer is now more reliable. It can now transfer funds from the futures account to the spot account to ensure that it always has enough funds for rebalancing.

**Frontend:**

*   **Removed mock data fallback:** The dashboard will no longer display incorrect information when the API call fails. It will now display a clear error message.
*   **Fixed `TradingIntentions` component:** The `TradingIntentions` component is now more robust and will no longer crash if the `intentions` prop is not present.
*   **Made API URL configurable:** The API URL is now configurable through an environment variable, making the dashboard more flexible.