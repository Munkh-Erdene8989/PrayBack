import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { NextRequest, NextResponse } from "next/server";
import { typeDefs } from "@/lib/graphql/schema";
import { resolvers } from "@/lib/graphql/resolvers";
import { createContext } from "@/lib/graphql/context";
import type { GraphQLContext } from "@/types";

const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler<NextRequest, GraphQLContext>(server, {
  context: async (req) => createContext(req),
});

export async function GET(req: NextRequest): Promise<NextResponse | Response> {
  return handler(req) as Promise<NextResponse | Response>;
}

export async function POST(req: NextRequest): Promise<NextResponse | Response> {
  return handler(req) as Promise<NextResponse | Response>;
}
