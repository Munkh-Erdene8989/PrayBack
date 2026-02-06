import { supabaseAdmin } from "@/lib/supabase/admin";
import type { GraphQLContext } from "@/types";

export const userResolvers = {
  Query: {
    me: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ) => {
      if (!context.user) return null;

      const { data, error } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("id", context.user.id)
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
  },
};
