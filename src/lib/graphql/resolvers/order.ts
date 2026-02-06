import { supabaseAdmin } from "@/lib/supabase/admin";
import { createInvoice, checkPayment } from "@/lib/qpay/client";
import type { GraphQLContext } from "@/types";

const QPAY_CALLBACK_URL =
  process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/qpay-callback`
    : "http://localhost:3000/api/payments/qpay-callback";

export const orderResolvers = {
  Query: {
    orders: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ) => {
      if (!context.user) throw new Error("Unauthorized");

      let query = supabaseAdmin
        .from("orders")
        .select("*, order_items(*, books(*))")
        .eq("tenant_id", context.tenantId!)
        .order("created_at", { ascending: false });

      // Customers see only their orders; admins see all tenant orders
      if (context.user.role === "customer") {
        query = query.eq("user_id", context.user.id);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data;
    },

    order: async (
      _parent: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      if (!context.user) throw new Error("Unauthorized");

      const { data, error } = await supabaseAdmin
        .from("orders")
        .select("*, order_items(*, books(*))")
        .eq("id", id)
        .single();

      if (error) throw new Error(error.message);

      // Ensure the user has access
      if (
        context.user.role === "customer" &&
        data.user_id !== context.user.id
      ) {
        throw new Error("Forbidden");
      }

      return data;
    },
  },

  Mutation: {
    createOrder: async (
      _parent: unknown,
      {
        input,
      }: {
        input: { items: Array<{ book_id: string; quantity: number }> };
      },
      context: GraphQLContext
    ) => {
      if (!context.user) throw new Error("Unauthorized");

      // Fetch book prices
      const bookIds = input.items.map((i) => i.book_id);
      const { data: books, error: booksError } = await supabaseAdmin
        .from("books")
        .select("id, price, stock")
        .in("id", bookIds);

      if (booksError) throw new Error(booksError.message);

      const bookMap = new Map(books!.map((b) => [b.id, b]));

      // Validate stock and calculate total
      let totalAmount = 0;
      const orderItems: Array<{
        book_id: string;
        quantity: number;
        unit_price: number;
      }> = [];

      for (const item of input.items) {
        const book = bookMap.get(item.book_id);
        if (!book) throw new Error(`Book ${item.book_id} not found`);
        if (book.stock < item.quantity) {
          throw new Error(`Insufficient stock for book ${item.book_id}`);
        }

        orderItems.push({
          book_id: item.book_id,
          quantity: item.quantity,
          unit_price: book.price,
        });
        totalAmount += book.price * item.quantity;
      }

      // Create order
      const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .insert({
          tenant_id: context.tenantId,
          user_id: context.user.id,
          status: "pending",
          total_amount: totalAmount,
          payment_status: "unpaid",
        })
        .select()
        .single();

      if (orderError) throw new Error(orderError.message);

      // Create order items
      const { error: itemsError } = await supabaseAdmin
        .from("order_items")
        .insert(
          orderItems.map((item) => ({
            ...item,
            order_id: order.id,
          }))
        );

      if (itemsError) throw new Error(itemsError.message);

      // Decrement stock for each ordered book
      for (const item of input.items) {
        const book = bookMap.get(item.book_id)!;
        const { error: stockError } = await supabaseAdmin
          .from("books")
          .update({ stock: book.stock - item.quantity })
          .eq("id", item.book_id);

        if (stockError) throw new Error(stockError.message);
      }

      // Re-fetch order with items for the response
      const { data: fullOrder, error: fetchError } = await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("id", order.id)
        .single();

      if (fetchError) throw new Error(fetchError.message);
      return fullOrder;
    },

    createQPayInvoice: async (
      _parent: unknown,
      { orderId }: { orderId: string },
      context: GraphQLContext
    ) => {
      if (!context.user) throw new Error("Unauthorized");

      // Fetch the order
      const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError || !order) throw new Error("Order not found");

      // Verify ownership
      if (
        context.user.role === "customer" &&
        order.user_id !== context.user.id
      ) {
        throw new Error("Forbidden");
      }

      // Don't create invoice if already paid
      if (order.payment_status === "paid") {
        throw new Error("Order is already paid");
      }

      // If there's already a QPay invoice, return its data
      // (re-create to get fresh QR in case of expiry)

      // Create QPay invoice
      const invoice = await createInvoice(
        orderId,
        order.total_amount,
        `Номын захиалга #${orderId.slice(0, 8)}`,
        QPAY_CALLBACK_URL
      );

      // Save invoice_id to order
      await supabaseAdmin
        .from("orders")
        .update({ qpay_invoice_id: invoice.invoice_id })
        .eq("id", orderId);

      return {
        invoice_id: invoice.invoice_id,
        qr_text: invoice.qr_text,
        qr_image: invoice.qr_image,
        qpay_short_url: invoice.qPay_shortUrl,
        urls: invoice.urls ?? [],
      };
    },

    checkOrderPayment: async (
      _parent: unknown,
      { orderId }: { orderId: string },
      context: GraphQLContext
    ) => {
      if (!context.user) throw new Error("Unauthorized");

      // Fetch the order
      const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError || !order) throw new Error("Order not found");

      // Verify ownership
      if (
        context.user.role === "customer" &&
        order.user_id !== context.user.id
      ) {
        throw new Error("Forbidden");
      }

      // Already paid — return immediately
      if (order.payment_status === "paid") {
        const { data: fullOrder } = await supabaseAdmin
          .from("orders")
          .select("*, order_items(*, books(*))")
          .eq("id", orderId)
          .single();
        return { paid: true, order: fullOrder };
      }

      // No invoice yet
      if (!order.qpay_invoice_id) {
        return { paid: false, order };
      }

      // Check with QPay
      const paymentResult = await checkPayment(order.qpay_invoice_id);

      if (
        paymentResult.count > 0 &&
        paymentResult.paid_amount >= order.total_amount
      ) {
        // Update order status
        const { data: updatedOrder } = await supabaseAdmin
          .from("orders")
          .update({
            status: "paid",
            payment_status: "paid",
          })
          .eq("id", orderId)
          .select("*, order_items(*, books(*))")
          .single();

        return { paid: true, order: updatedOrder };
      }

      return { paid: false, order };
    },

    updateOrderStatus: async (
      _parent: unknown,
      { id, status }: { id: string; status: string },
      context: GraphQLContext
    ) => {
      if (!context.user || (context.user.role !== "admin" && context.user.role !== "superadmin")) {
        throw new Error("Unauthorized: admin only");
      }

      const { data, error } = await supabaseAdmin
        .from("orders")
        .update({ status })
        .eq("id", id)
        .eq("tenant_id", context.tenantId!)
        .select("*, order_items(*, books(*))")
        .single();

      if (error) throw new Error(error.message);
      return data;
    },

    cancelOrder: async (
      _parent: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      if (!context.user) throw new Error("Unauthorized");

      // Fetch current order to verify it's pending
      const { data: existingOrder, error: fetchErr } = await supabaseAdmin
        .from("orders")
        .select("*, order_items(book_id, quantity)")
        .eq("id", id)
        .single();

      if (fetchErr) throw new Error(fetchErr.message);

      if (existingOrder.status !== "pending") {
        throw new Error("Only pending orders can be cancelled");
      }

      // Verify ownership (customers can only cancel their own orders)
      if (
        context.user.role === "customer" &&
        existingOrder.user_id !== context.user.id
      ) {
        throw new Error("Forbidden");
      }

      // Cancel the order
      const { data, error } = await supabaseAdmin
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Restore stock for each cancelled order item
      for (const item of existingOrder.order_items) {
        const { data: book } = await supabaseAdmin
          .from("books")
          .select("stock")
          .eq("id", item.book_id)
          .single();

        if (book) {
          await supabaseAdmin
            .from("books")
            .update({ stock: book.stock + item.quantity })
            .eq("id", item.book_id);
        }
      }

      return data;
    },
  },

  Order: {
    items: async (parent: { id: string }) => {
      const { data } = await supabaseAdmin
        .from("order_items")
        .select("*, books(*)")
        .eq("order_id", parent.id);

      return data ?? [];
    },

    user: async (parent: { user_id: string }) => {
      const { data } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("id", parent.user_id)
        .single();

      return data;
    },
  },

  OrderItem: {
    book: async (parent: { book_id: string }) => {
      const { data } = await supabaseAdmin
        .from("books")
        .select("*")
        .eq("id", parent.book_id)
        .single();

      return data;
    },
  },
};
