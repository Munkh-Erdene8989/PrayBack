import { supabaseAdmin } from "@/lib/supabase/admin";

export const categoryResolvers = {
  Query: {
    categories: async (
      _parent: unknown,
      { tenantId }: { tenantId: string }
    ) => {
      const { data, error } = await supabaseAdmin
        .from("categories")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("name", { ascending: true });

      if (error) throw new Error(error.message);
      return data;
    },
  },

  Category: {
    children: async (parent: { id: string; tenant_id: string }) => {
      const { data } = await supabaseAdmin
        .from("categories")
        .select("*")
        .eq("parent_id", parent.id)
        .order("name", { ascending: true });

      return data ?? [];
    },
  },
};
