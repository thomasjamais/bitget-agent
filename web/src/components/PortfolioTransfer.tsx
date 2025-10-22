"use client";

import { useState } from "react";

interface TransferRequest {
  from: "spot" | "futures";
  to: "spot" | "futures";
  amount: number;
  currency: string;
}

interface PortfolioTransferProps {
  onTransfer: (request: TransferRequest) => Promise<boolean>;
  spotBalance: number;
  futuresBalance: number;
}

export function PortfolioTransfer({ onTransfer, spotBalance, futuresBalance }: PortfolioTransferProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleTransfer = async (from: "spot" | "futures", to: "spot" | "futures") => {
    if (!amount || parseFloat(amount) <= 0) {
      setMessage({ type: "error", text: "Veuillez entrer un montant valide" });
      return;
    }

    const transferAmount = parseFloat(amount);
    const availableBalance = from === "spot" ? spotBalance : futuresBalance;

    if (transferAmount > availableBalance) {
      setMessage({ 
        type: "error", 
        text: `Montant insuffisant. Disponible: ${formatCurrency(availableBalance)}` 
      });
      return;
    }

    setIsLoading(true);
    setMessage({ type: "info", text: "Transfert en cours..." });

    try {
      const success = await onTransfer({
        from,
        to,
        amount: transferAmount,
        currency: "USDT",
      });

      if (success) {
        setMessage({ 
          type: "success", 
          text: `Transfert réussi: ${formatCurrency(transferAmount)} de ${from} vers ${to}` 
        });
        setAmount("");
      } else {
        setMessage({ 
          type: "error", 
          text: "Échec du transfert. Vérifiez votre solde et réessayez." 
        });
      }
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: "Erreur lors du transfert. Veuillez réessayer." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setMaxAmount = (from: "spot" | "futures") => {
    const maxAmount = from === "spot" ? spotBalance : futuresBalance;
    setAmount(maxAmount.toString());
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          🔄 Transfert de Portefeuille
        </h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {isOpen ? "▼" : "▶"}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-4">
          {/* Balances Display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-400">Portefeuille Spot</div>
              <div className="text-lg font-semibold text-white">
                {formatCurrency(spotBalance)}
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-400">Portefeuille Futures</div>
              <div className="text-lg font-semibold text-white">
                {formatCurrency(futuresBalance)}
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Montant à transférer (USDT)
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                onClick={() => setMaxAmount("futures")}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                disabled={isLoading}
              >
                Max
              </button>
            </div>
          </div>

          {/* Transfer Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleTransfer("futures", "spot")}
              disabled={isLoading || futuresBalance <= 0}
              className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>📤</span>
                  <span>Futures → Spot</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleTransfer("spot", "futures")}
              disabled={isLoading || spotBalance <= 0}
              className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>📥</span>
                  <span>Spot → Futures</span>
                </>
              )}
            </button>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-3 rounded-lg ${
              message.type === "success" ? "bg-green-900 text-green-300" :
              message.type === "error" ? "bg-red-900 text-red-300" :
              "bg-blue-900 text-blue-300"
            }`}>
              {message.text}
            </div>
          )}

          {/* Info */}
          <div className="text-xs text-gray-400 bg-gray-700 p-3 rounded-lg">
            <div className="font-medium mb-1">ℹ️ Information:</div>
            <ul className="space-y-1">
              <li>• Les transferts peuvent prendre quelques minutes</li>
              <li>• Vérifiez votre solde après le transfert</li>
              <li>• Gardez un minimum pour les frais de trading</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
