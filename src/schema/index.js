import { GraphQLSchema, GraphQLObjectType } from 'graphql';
import sqsSchema from './sqs';
import snsSchema from './sns';

const queries = Object.assign(
  snsSchema.queries,
  sqsSchema.queries
);
const mutations = Object.assign(
  snsSchema.mutations,
  sqsSchema.mutations
);

const schema = new GraphQLSchema({
  mutation: new GraphQLObjectType({
    name: 'Mutation',
    fields: () => (mutations)
  }),
  query: new GraphQLObjectType({
    name: 'Query',
    fields: () => (queries)
  })
});

export default schema;
