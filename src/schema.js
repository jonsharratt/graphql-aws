import AWS from 'aws-sdk';
import Promise from 'bluebird';

import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLSchema,
  GraphQLString
} from 'graphql/lib/type';

const sqs = new Promise.promisifyAll(new AWS.SQS());

const queueType = new GraphQLObjectType({
  name: 'Queue',
  description: 'Represents an Amazon SQS message queue.',
  fields: () => ({
    url: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The url for the message queue.',
      resolve: (root) => { return root; }
    }
  })
});

const schema = new GraphQLSchema({
  // Mutations
  mutation: new GraphQLObjectType({
    name: 'Mutation',
    fields: {
      createQueue: {
        type: queueType,
        args: {
          name: {
            name: 'name',
            type: new GraphQLNonNull(GraphQLString)
          }
        },
        resolve: (obj, {name}) => {
          return sqs.createQueueAsync({ QueueName: name }).then((result) => {
            return result.QueueUrl;
          });
        }
      }
    }
  }),

  // Queries
  query: new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
      queues: {
        type: new GraphQLList(queueType),
        args: {
          prefix: {
            name: 'prefix',
            type: GraphQLString
          }
        },
        resolve: (root, {prefix}) => {
          return sqs.listQueuesAsync(prefix).then((result) => {
            return result.QueueUrls;
          });
        }
      }
    })
  })
});

export default schema;
