import { tenantResolvers } from "./tenant";
import { bookResolvers } from "./book";
import { categoryResolvers } from "./category";
import { orderResolvers } from "./order";
import { userResolvers } from "./user";
import { adminResolvers } from "./admin";
import { GraphQLScalarType, Kind } from "graphql";

// Custom JSON scalar for theme_config etc.
const JSONScalar = new GraphQLScalarType({
  name: "JSON",
  description: "Arbitrary JSON value",
  serialize: (value) => value,
  parseValue: (value) => value,
  parseLiteral: (ast) => {
    if (ast.kind === Kind.STRING) {
      try {
        return JSON.parse(ast.value);
      } catch {
        return null;
      }
    }
    return null;
  },
});

/**
 * Merge all resolver maps into a single object.
 */
export const resolvers = {
  JSON: JSONScalar,

  Query: {
    ...tenantResolvers.Query,
    ...bookResolvers.Query,
    ...categoryResolvers.Query,
    ...orderResolvers.Query,
    ...userResolvers.Query,
    ...adminResolvers.Query,
  },

  Mutation: {
    ...tenantResolvers.Mutation,
    ...bookResolvers.Mutation,
    ...orderResolvers.Mutation,
  },

  // Field-level resolvers
  Book: bookResolvers.Book,
  Category: categoryResolvers.Category,
  Order: orderResolvers.Order,
  OrderItem: orderResolvers.OrderItem,
};
