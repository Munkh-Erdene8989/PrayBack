import { supabaseAdmin } from "@/lib/supabase/admin";
import type { GraphQLContext } from "@/types";
import { invalidateTenantCache } from "@/lib/tenant/resolve";

export const tenantResolvers = {
  Query: {
    tenant: async (
      _parent: unknown,
      { slug }: { slug: string }
    ) => {
      const { data, error } = await supabaseAdmin
        .from("tenants")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw new Error(error.message);
      return data;
    },

    tenants: async () => {
      const { data, error } = await supabaseAdmin
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data;
    },
  },

  Mutation: {
    createTenant: async (
      _parent: unknown,
      { name, slug }: { name: string; slug: string },
      context: GraphQLContext
    ) => {
      if (!context.user || context.user.role !== "superadmin") {
        throw new Error("Unauthorized: superadmin only");
      }

      const { data, error } = await supabaseAdmin
        .from("tenants")
        .insert({ name, slug })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },

    updateTenantTheme: async (
      _parent: unknown,
      { tenantId, theme }: { tenantId: string; theme: Record<string, unknown> },
      context: GraphQLContext
    ) => {
      // Only admin/superadmin of this tenant (or any superadmin) can update theme
      if (!context.user) {
        throw new Error("Unauthorized");
      }

      const isSuper = context.user.role === "superadmin";
      const isAdmin =
        context.user.role === "admin" && context.tenantId === tenantId;

      if (!isSuper && !isAdmin) {
        throw new Error("Unauthorized: admin of this tenant or superadmin only");
      }

      const { data, error } = await supabaseAdmin
        .from("tenants")
        .update({ theme_config: theme })
        .eq("id", tenantId)
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Bust the server-side tenant cache so the new theme takes effect
      if (data?.slug) {
        invalidateTenantCache(data.slug);
      }

      return data;
    },
  },
};
