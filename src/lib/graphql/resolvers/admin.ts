import { supabaseAdmin } from "@/lib/supabase/admin";
import type { GraphQLContext } from "@/types";

export const adminResolvers = {
  Query: {
    dashboardStats: async (
      _parent: unknown,
      { tenantId }: { tenantId: string },
      context: GraphQLContext
    ) => {
      if (
        !context.user ||
        (context.user.role !== "admin" && context.user.role !== "superadmin")
      ) {
        throw new Error("Unauthorized: admin only");
      }

      // Fetch book counts
      const { count: totalBooks } = await supabaseAdmin
        .from("books")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId);

      const { count: activeBooks } = await supabaseAdmin
        .from("books")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("is_active", true);

      // Fetch order counts
      const { count: totalOrders } = await supabaseAdmin
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId);

      const { count: pendingOrders } = await supabaseAdmin
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "pending");

      const { count: paidOrders } = await supabaseAdmin
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("payment_status", "paid");

      // Calculate total revenue from paid orders
      const { data: revenueData } = await supabaseAdmin
        .from("orders")
        .select("total_amount")
        .eq("tenant_id", tenantId)
        .eq("payment_status", "paid");

      const totalRevenue =
        revenueData?.reduce(
          (sum: number, o: { total_amount: number }) => sum + o.total_amount,
          0
        ) ?? 0;

      // Recent orders (last 5)
      const { data: recentOrders } = await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(5);

      return {
        totalBooks: totalBooks ?? 0,
        activeBooks: activeBooks ?? 0,
        totalOrders: totalOrders ?? 0,
        pendingOrders: pendingOrders ?? 0,
        paidOrders: paidOrders ?? 0,
        totalRevenue,
        recentOrders: recentOrders ?? [],
      };
    },
  },
};
