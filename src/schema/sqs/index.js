import AWS from 'aws-sdk';
import Promise from 'bluebird';
import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLSchema,
  GraphQLString,
  GraphQLInt,
  GraphQLEnumType
} from 'graphql/lib/type';

const sqs = new Promise.promisifyAll(new AWS.SQS());

const attributeNamesType = new GraphQLEnumType({
  name: 'Queue Attribute Names',
  description: 'Attribute names for the queue',
  values: {
    Policy: {
      value: 'Policy'
    },
    VisibilityTimeout: {
      value: 'VisibilityTimeout'
    },
    MaximumMessageSize: {
      value: 'MaximumMessageSize'
    },
    MessageRetentionPeriod: {
      value: 'MessageRetentionPeriod'
    },
    ApproximateNumberOfMessages: {
      value: 'ApproximateNumberOfMessages'
    },
    ApproximateNumberOfMessagesNotVisible: {
      value: 'ApproximateNumberOfMessagesNotVisible'
    },
    CreatedTimestamp: {
      value: 'CreatedTimestamp'
    },
    LastModifiedTimestamp: {
      value: 'LastModifiedTimestamp'
    },
    QueueArn: {
      value: 'QueueArn'
    },
    ApproximateNumberOfMessagesDelayed: {
      value: 'ApproximateNumberOfMessagesDelayed'
    },
    DelaySeconds: {
      value: 'DelaySeconds'
    },
    ReceiveMessageWaitTimeSeconds: {
      value: 'ReceiveMessageWaitTimeSeconds'
    },
    RedrivePolicy: {
      value: 'RedrivePolicy'
    }
  }
});

const type = new GraphQLObjectType({
  name: 'Queue',
  description: 'Represents an Amazon SQS message queue.',
  fields: () => ({
    url: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The url for the message queue.',
      resolve: (root) => { return root.url || root; }
    },
    visibilityTimeout: {
      type: new GraphQLNonNull(GraphQLInt),
      description: 'The visiblity timeout for the message queue.'
    }
  })
});

exports.queries = {
  // TODO: Not sure if you are meant / better off create queries
  // to do individual API calls to populate attributes
  queueAttributes: {
    type: type,
    args: {
      url: {
        name: 'url',
        type: new GraphQLNonNull(GraphQLString)
      },
      attributeNames: {
        name: 'attributeNames',
        type: new GraphQLList(attributeNamesType)
      }
    },
    // TODO: Unsure of best way to do this.
    // could create an attribute object type instead and map it.
    resolve: (root, {url, attributeNames}) => {
      return sqs.getQueueAttributesAsync({ QueueUrl: url, AttributeNames: attributeNames }).then((result) => {
        return {
          url: url,
          visibilityTimeout: result.Attributes['VisibilityTimeout']
        };
      });
    }
  },
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
}

exports.mutations = {
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
