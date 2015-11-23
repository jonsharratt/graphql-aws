import { GraphQLSchema, GraphQLObjectType } from 'graphql';
import { aws } from './aws';

const schema = new GraphQLSchema({
  mutation: aws.Mutations,
  query: aws.Queries
});

export default schema;
