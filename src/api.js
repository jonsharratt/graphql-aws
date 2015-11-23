import express from 'express';
import { graphql } from 'graphql';
import graphqlHTTP from 'express-graphql';

import schema from './schema';

const app = express();
app.use('/', graphqlHTTP({ schema: schema, graphiql: true }));

const server = app.listen(3000, function () {
  const host = server.address().address;
  const port = server.address().port;
  console.log('Amazon GraphQL Server running.');
  console.log('http://%s:%s', host, port);
});

