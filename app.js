const express = require('express');
require('dotenv').config();
const { ApolloServer } = require('apollo-server-express');
const { typeDefs, resolvers } = require('./schema');
const {
  ensureRegistrationTable,
  testConnection,
  getDbTime,
} = require('./model');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Basic CORS so the frontend (e.g. Vite dev server) can reach the API
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

async function startServer() {
  await ensureRegistrationTable();
  await testConnection();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  app.get('/', (req, res) => {
    res.send('Express + GraphQL server is running');
  });

  // Simple DB health endpoint
  app.get('/db-health', async (req, res) => {
    try {
      const now = await getDbTime();
      res.json({ status: 'ok', dbTime: now });
    } catch (err) {
      console.error('DB health check failed', err);
      res
        .status(500)
        .json({ status: 'error', message: 'DB connection failed' });
    }
  });

  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
    console.log(`GraphQL endpoint ready at http://${HOST}:${PORT}${server.graphqlPath}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server', err);
});
