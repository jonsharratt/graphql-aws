import { GraphQLSchema, GraphQLObjectType } from 'graphql/lib/type';
import sqsSchema from './sqs';
import snsSchema from './sns';
import merge from 'merge';

const queries = merge(
  snsSchema.queries,
  sqsSchema.queries
);
const mutations = merge(
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
