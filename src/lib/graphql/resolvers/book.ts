import { supabaseAdmin } from "@/lib/supabase/admin";
import type { GraphQLContext } from "@/types";

export const bookResolvers = {
  Query: {
    books: async (
      _parent: unknown,
      {
        tenantId,
        limit = 20,
        offset = 0,
        search,
      }: {
        tenantId: string;
        limit?: number;
        offset?: number;
        search?: string;
      }
    ) => {
      let query = supabaseAdmin
        .from("books")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (search) {
        query = query.or(
          `title.ilike.%${search}%,author.ilike.%${search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data;
    },

    adminBooks: async (
      _parent: unknown,
      {
        tenantId,
        limit = 50,
        offset = 0,
        search,
      }: {
        tenantId: string;
        limit?: number;
        offset?: number;
        search?: string;
      },
      context: GraphQLContext
    ) => {
      if (!context.user || (context.user.role !== "admin" && context.user.role !== "superadmin")) {
        throw new Error("Unauthorized: admin only");
      }

      let query = supabaseAdmin
        .from("books")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (search) {
        query = query.or(
          `title.ilike.%${search}%,author.ilike.%${search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data;
    },

    book: async (_parent: unknown, { id }: { id: string }) => {
      const { data, error } = await supabaseAdmin
        .from("books")
        .select("*, categories(*)")
        .eq("id", id)
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
  },

  Mutation: {
    createBook: async (
      _parent: unknown,
      { input }: { input: Record<string, unknown> },
      context: GraphQLContext
    ) => {
      if (!context.user || context.user.role !== "admin") {
        throw new Error("Unauthorized: admin only");
      }

      const { data, error } = await supabaseAdmin
        .from("books")
        .insert({
          ...input,
          tenant_id: context.tenantId,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },

    updateBook: async (
      _parent: unknown,
      { id, input }: { id: string; input: Record<string, unknown> },
      context: GraphQLContext
    ) => {
      if (!context.user || context.user.role !== "admin") {
        throw new Error("Unauthorized: admin only");
      }

      const { data, error } = await supabaseAdmin
        .from("books")
        .update(input)
        .eq("id", id)
        .eq("tenant_id", context.tenantId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },

    deleteBook: async (
      _parent: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      if (!context.user || context.user.role !== "admin") {
        throw new Error("Unauthorized: admin only");
      }

      const { error } = await supabaseAdmin
        .from("books")
        .delete()
        .eq("id", id)
        .eq("tenant_id", context.tenantId);

      if (error) throw new Error(error.message);
      return true;
    },
  },

  Book: {
    category: async (parent: { category_id: string | null }) => {
      if (!parent.category_id) return null;

      const { data } = await supabaseAdmin
        .from("categories")
        .select("*")
        .eq("id", parent.category_id)
        .single();

      return data;
    },
  },
};
