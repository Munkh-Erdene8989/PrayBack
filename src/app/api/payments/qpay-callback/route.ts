import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { checkPayment } from "@/lib/qpay/client";

/**
 * QPay payment callback handler.
 * QPay calls this endpoint after a user completes (or attempts) payment.
 * We verify the payment with QPay's API, then update the order accordingly.
 *
 * Note: Stock is already decremented when the order is created (in the
 * createOrder mutation), so we only update the order/payment status here.
 */
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get("order_id");

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing order_id" },
        { status: 400 }
      );
    }

    // Fetch the order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Already paid — idempotent response
    if (order.payment_status === "paid") {
      return NextResponse.json({ success: true, status: "paid" });
    }

    if (!order.qpay_invoice_id) {
      return NextResponse.json(
        { error: "No QPay invoice linked" },
        { status: 400 }
      );
    }

    // Check payment status with QPay
    const paymentResult = await checkPayment(order.qpay_invoice_id);

    if (
      paymentResult.count > 0 &&
      paymentResult.paid_amount >= order.total_amount
    ) {
      // Update order status to paid
      await supabaseAdmin
        .from("orders")
        .update({
          status: "paid",
          payment_status: "paid",
        })
        .eq("id", orderId);

      return NextResponse.json({ success: true, status: "paid" });
    }

    return NextResponse.json({ success: true, status: "pending" });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
