const { gql } = require('apollo-server-express');
const {
  insertRegistration,
  insertPonencia,
  updatePonencia,
  softDeletePonencia,
  getDbTime,
  listRegistrations,
  listPonencias,
} = require('./model');

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

  type Ponencia {
    id: ID!
    topic: String!
    fullName: String!
    affiliation: String
    cityCountry: String
    summary: String
    status: Int!
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

  input PonenciaInput {
    topic: String!
    fullName: String!
    affiliation: String
    cityCountry: String
    summary: String
  }

  input PonenciaFilterInput {
    topic: String
    fullName: String
    dateFrom: String
    dateTo: String
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

  type PonenciaPage {
    items: [Ponencia!]!
    total: Int!
    page: Int!
    pageSize: Int!
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
    ponencias(filter: PonenciaFilterInput, pagination: PaginationInput): PonenciaPage!
  }

  type Mutation {
    submitRegistration(input: RegistrationInput!): Registration!
    createPonencia(input: PonenciaInput!): Ponencia!
    updatePonencia(id: ID!, input: PonenciaInput!): Ponencia!
    deletePonencia(id: ID!): Ponencia!
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
    ponencias: async (_, { filter = {}, pagination = {} }) => {
      const result = await listPonencias(filter, pagination);

      return {
        items: result.items.map((row) => ({
          id: row.id,
          topic: row.topic,
          fullName: row.full_name,
          affiliation: row.affiliation,
          cityCountry: row.city_country,
          summary: row.summary,
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
    createPonencia: async (_, { input }) => {
      const row = await insertPonencia(input);

      return {
        id: row.id,
        topic: row.topic,
        fullName: row.full_name,
        affiliation: row.affiliation,
        cityCountry: row.city_country,
        summary: row.summary,
        status: row.status,
        createdAt: row.created_at.toISOString(),
      };
    },
    updatePonencia: async (_, { id, input }) => {
      const row = await updatePonencia(id, input);

      if (!row) {
        throw new Error('Ponencia not found');
      }

      return {
        id: row.id,
        topic: row.topic,
        fullName: row.full_name,
        affiliation: row.affiliation,
        cityCountry: row.city_country,
        summary: row.summary,
        status: row.status,
        createdAt: row.created_at.toISOString(),
      };
    },
    deletePonencia: async (_, { id }) => {
      const row = await softDeletePonencia(id);

      if (!row) {
        throw new Error('Ponencia not found');
      }

      return {
        id: row.id,
        topic: row.topic,
        fullName: row.full_name,
        affiliation: row.affiliation,
        cityCountry: row.city_country,
        summary: row.summary,
        status: row.status,
        createdAt: row.created_at.toISOString(),
      };
    },
  },
};

module.exports = {
  typeDefs,
  resolvers,
};
