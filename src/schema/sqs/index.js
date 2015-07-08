import AWS from 'aws-sdk';
import Promise from 'bluebird';
import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLString
} from 'graphql/lib/type';

const sqs = new Promise.promisifyAll(new AWS.SQS());

const type = new GraphQLObjectType({
  name: 'Queue',
  description: 'Represents an Amazon SQS message queue.',
  fields: () => ({
    url: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The url for the message queue.',
      resolve: (root) => { return root.url || root; }
    }
  })
});

exports.queries = {
  queues: {
    type: new GraphQLList(type),
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
};

exports.mutations = {
  deleteQueue: {
    type: new GraphQLNonNull(GraphQLString),
    args: {
      url: {
        name: 'url',
        type: new GraphQLNonNull(GraphQLString)
      }
    },
    resolve: (obj, {url}) => {
      return sqs.deleteQueueAsync({ QueueUrl: url }).then((result) => {
        return result.ResponseMetadata.RequestId;
      });
    }
  },
  createQueue: {
    type: type,
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
};
