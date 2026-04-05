const { gql } = require('apollo-server-express');
const {
  insertRegistration,
  insertPonencia,
  insertPonenciasBulk,
  insertSintesis,
  insertSintesisBulk,
  updatePonencia,
  updateSintesis,
  softDeletePonencia,
  softDeleteSintesis,
  getDbTime,
  listRegistrations,
  listPonencias,
  listSintesis,
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

  type Sintesis {
    id: ID!
    mesa: String!
    coordinacion: String
    fecha: String
    fechaFin: String
    sintesisGeneral: String
    lineasTrabajo: String
    cierre: String
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

  input SintesisInput {
    mesa: String!
    coordinacion: String
    fecha: String
    fechaFin: String
    sintesisGeneral: String
    lineasTrabajo: String
    cierre: String
  }

  input PonenciaFilterInput {
    topic: String
    fullName: String
    cityCountry: String
    dateFrom: String
    dateTo: String
  }

  input SintesisFilterInput {
    mesa: String
    date: String
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

  type PonenciaBulkResult {
    total: Int!
    ids: [ID!]!
  }

  type SintesisBulkResult {
    total: Int!
    ids: [ID!]!
  }

  type SintesisPage {
    items: [Sintesis!]!
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
    sintesis(filter: SintesisFilterInput, pagination: PaginationInput): SintesisPage!
  }

  type Mutation {
    submitRegistration(input: RegistrationInput!): Registration!
    createPonencia(input: PonenciaInput!): Ponencia!
    masivoPonencias(input: [PonenciaInput!]!): PonenciaBulkResult!
    updatePonencia(id: ID!, input: PonenciaInput!): Ponencia!
    deletePonencia(id: ID!): Ponencia!
    createSintesis(input: SintesisInput!): Sintesis!
    masivoSintesis(input: [SintesisInput!]!): SintesisBulkResult!
    updateSintesis(id: ID!, input: SintesisInput!): Sintesis!
    deleteSintesis(id: ID!): Sintesis!
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
    sintesis: async (_, { filter = {}, pagination = {} }) => {
      const result = await listSintesis(filter, pagination);

      return {
        items: result.items.map((row) => ({
          id: row.id,
          mesa: row.mesa,
          coordinacion: row.coordinacion,
          fecha: row.fecha ? row.fecha.toISOString() : null,
          fechaFin: row.fecha_fin ? row.fecha_fin.toISOString() : null,
          sintesisGeneral: row.sintesis_general,
          lineasTrabajo: row.lineas_trabajo ? JSON.stringify(row.lineas_trabajo) : null,
          cierre: row.cierre,
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
    masivoPonencias: async (_, { input }) => {
      const rows = await insertPonenciasBulk(input);
      return {
        total: rows.length,
        ids: rows.map((row) => row.id),
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
    createSintesis: async (_, { input }) => {
      const row = await insertSintesis(input);

      return {
        id: row.id,
        mesa: row.mesa,
        coordinacion: row.coordinacion,
        fecha: row.fecha ? row.fecha.toISOString() : null,
        fechaFin: row.fecha_fin ? row.fecha_fin.toISOString() : null,
        sintesisGeneral: row.sintesis_general,
        lineasTrabajo: row.lineas_trabajo ? JSON.stringify(row.lineas_trabajo) : null,
        cierre: row.cierre,
        status: row.status,
        createdAt: row.created_at.toISOString(),
      };
    },
    masivoSintesis: async (_, { input }) => {
      const rows = await insertSintesisBulk(input);
      return {
        total: rows.length,
        ids: rows.map((row) => row.id),
      };
    },
    updateSintesis: async (_, { id, input }) => {
      const row = await updateSintesis(id, input);

      if (!row) {
        throw new Error('Sintesis not found');
      }

      return {
        id: row.id,
        mesa: row.mesa,
        coordinacion: row.coordinacion,
        fecha: row.fecha ? row.fecha.toISOString() : null,
        fechaFin: row.fecha_fin ? row.fecha_fin.toISOString() : null,
        sintesisGeneral: row.sintesis_general,
        lineasTrabajo: row.lineas_trabajo ? JSON.stringify(row.lineas_trabajo) : null,
        cierre: row.cierre,
        status: row.status,
        createdAt: row.created_at.toISOString(),
      };
    },
    deleteSintesis: async (_, { id }) => {
      const row = await softDeleteSintesis(id);

      if (!row) {
        throw new Error('Sintesis not found');
      }

      return {
        id: row.id,
        mesa: row.mesa,
        coordinacion: row.coordinacion,
        fecha: row.fecha ? row.fecha.toISOString() : null,
        fechaFin: row.fecha_fin ? row.fecha_fin.toISOString() : null,
        sintesisGeneral: row.sintesis_general,
        lineasTrabajo: row.lineas_trabajo ? JSON.stringify(row.lineas_trabajo) : null,
        cierre: row.cierre,
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
