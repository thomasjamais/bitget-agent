import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from, to, amount, currency } = body;

    // Validate request
    if (!from || !to || !amount || !currency) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    if (from === to) {
      return NextResponse.json(
        { error: "Cannot transfer to the same wallet" },
        { status: 400 }
      );
    }

    console.log("Transfer request:", { from, to, amount, currency });

    // Call the bot's WebSocket server to handle the transfer
    try {
      const response = await fetch("http://localhost:8080/api/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to, amount, currency }),
      });

      if (response.ok) {
        const result = await response.json();
        return NextResponse.json({
          success: true,
          message: result.message || `Transfer completed: ${amount} ${currency} from ${from} to ${to}`,
          transferId: result.transferId || `transfer_${Date.now()}`,
        });
      } else {
        const errorData = await response.json();
        return NextResponse.json(
          { error: errorData.error || "Transfer failed" },
          { status: response.status }
        );
      }
    } catch (botError) {
      console.error("Bot communication error:", botError);
      return NextResponse.json(
        { error: "Failed to communicate with trading bot" },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Transfer API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
