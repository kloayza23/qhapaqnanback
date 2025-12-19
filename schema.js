const { gql } = require('apollo-server-express');
const { insertRegistration, getDbTime, listRegistrations } = require('./model');

const typeDefs = gql`
  type Registration {
    id: ID!
    fullName: String!
    email: String!
    institution: String
    city: String
    nationalId: String
    message: String
    createdAt: String!
  }

  input RegistrationInput {
    fullName: String!
    email: String!
    institution: String
    city: String
    nationalId: String
    message: String
  }

  input RegistrationFilterInput {
    fullName: String
    dateFrom: String
    dateTo: String
  }

  input PaginationInput {
    page: Int
    pageSize: Int
  }

  type RegistrationPage {
    items: [Registration!]!
    total: Int!
    page: Int!
    pageSize: Int!
  }

  type Query {
    dbTime: String!
    registrations(filter: RegistrationFilterInput, pagination: PaginationInput): RegistrationPage!
  }

  type Mutation {
    submitRegistration(input: RegistrationInput!): Registration!
  }
`;

const resolvers = {
  Query: {
    dbTime: async () => {
      const now = await getDbTime();
      return now.toISOString();
    },
    registrations: async (_, { filter = {}, pagination = {} }) => {
      const result = await listRegistrations(filter, pagination);

      return {
        items: result.items.map((row) => ({
          id: row.id,
          fullName: row.full_name,
          email: row.email,
          institution: row.institution,
          city: row.city,
          nationalId: row.national_id,
          message: row.message,
          createdAt: row.created_at.toISOString(),
        })),
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      };
    },
  },
  Mutation: {
    submitRegistration: async (_, { input }) => {
      const row = await insertRegistration(input);

      return {
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        institution: row.institution,
        city: row.city,
        nationalId: row.national_id,
        message: row.message,
        createdAt: row.created_at.toISOString(),
      };
    },
  },
};

module.exports = {
  typeDefs,
  resolvers,
};
