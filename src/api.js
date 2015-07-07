import restify from 'restify';
import { graphql } from 'graphql';

import schema from './schema';

const port = process.env.PORT || 3000;

const info = {
  name: 'Amazon AWS GraphQL Server',
  version: '0.0.1'
};

const server = restify.createServer(info);
server.use(restify.bodyParser());

// Root
server.get('/', (req, res) => {
  res.json(200, info);
});

// Query
server.post('/query', (req, res) => {
  const query = req.body;
  graphql(schema, query).then( (result) => {
    res.json(result);
  });
});

server.listen(port);
console.log('Amazon GraphQL Server running.');
