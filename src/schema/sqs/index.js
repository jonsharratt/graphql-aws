import AWS from 'aws-sdk';
import Promise from 'bluebird';
import merge from 'merge';
import helpers from '../../utils/helpers';
import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLString,
  GraphQLInputObjectType
} from 'graphql/lib/type';

const sqs = new Promise.promisifyAll(new AWS.SQS());

const attributeFields = {
  DelaySeconds: {
    type: GraphQLString,
    description: `The time in seconds that the delivery of
                  all messages in the queue will be delayed.
                  An integer from 0 to 900 (15 minutes).
                  The default for this attribute is 0 (zero).`
  },
  MaximumMessageSize: {
    type: GraphQLString,
    description: `The limit of how many bytes a message can
                  contain before Amazon SQS rejects it. An
                  integer from 1024 bytes (1 KiB) up to 262144
                  bytes (256 KiB). The default for this attribute
                  is 262144 (256 KiB).`
  },
  MessageRetentionPeriod: {
    type: GraphQLString,
    description: `The number of seconds Amazon SQS retains a message.
                  Integer representing seconds, from 60 (1 minute) to
                  1209600 (14 days). The default for this attribute
                  is 345600 (4 days).`
  },
  Policy: {
    type: GraphQLString,
    description: `The queue's policy. A valid AWS policy.`
  },
  ReceiveMessageWaitTimeSeconds: {
    type: GraphQLString,
    description: `The time for which a ReceiveMessage call will wait
                  for a message to arrive. An integer from 0 to 20
                  (seconds). The default for this attribute is 0.`
  },
  VisibilityTimeout: {
    type: GraphQLString,
    description: `The visibility timeout for the queue.
                  An integer from 0 to 43200 (12 hours).
                  The default for this attribute is 30.`
  }
};

const type = new GraphQLObjectType({
  name: 'Queue',
  description: 'Represents an Amazon SQS message queue.',
  fields: () => ({
    QueueUrl: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The url for the message queue.',
      resolve: (root) => { return root.QueueUrl || root; }
    },
    Attributes: {
      type: attributesType,
      resolve: (root) => {
        const params = {
          QueueUrl: root.QueueUrl,
          AttributeNames: ['All']
        };
        return sqs.getQueueAttributesAsync(params)
                .then(result => result.Attributes);
      }
    }
  })
});

const attributesType = new GraphQLObjectType({
  name: 'Queue Attributes',
  fields: () => (attributeFields)
});

const attributesInputType = new GraphQLInputObjectType({
  name: 'Queue Attributes Input',
  fields: () => (attributeFields)
});

const messageType = new GraphQLObjectType({
  name: 'Message',
  description: 'Represents an Amazon SQS message queue.',
  fields: () => ({
    MessageId: {
      type: GraphQLString,
      description: `An element containing the message ID
                    of the message sent to the queue.`
    },
    MD5OfMessageBody: {
      type: GraphQLString,
      description: `An MD5 digest of the non-URL-encoded
                    message body string. This can be used to
                    verify that Amazon SQS received the message
                    correctly. Amazon SQS first URL decodes the
                    message before creating the MD5 digest`,
      resolve: (root) => { return root.MD5OfMessageBody || root.MD5OfBody; }
    },
    MD5OfMessageAttributes: {
      type: GraphQLString,
      description: `An MD5 digest of the non-URL-encoded message
                    attribute string. This can be used to verify
                    that Amazon SQS received the message correctly.
                    Amazon SQS first URL decodes the message before
                    creating the MD5 digest.`
    },
    Body: {
      type: GraphQLString,
      description: `The message's contents (not URL-encoded).`
    },
    ReceiptHandle: {
      type: GraphQLString,
      description: `An identifier associated with the act of
                    receiving the message. A new receipt handle
                    is returned every time you receive a message.
                    When deleting a message, you provide the
                    last received receipt handle to delete the message.`
    }
  })
});

exports.queries = {
  listQueues: {
    type: new GraphQLList(GraphQLString),
    args: {
      QueueNamePrefix: {
        name: 'QueueNamePrefix',
        type: GraphQLString,
        description: `Only those queues whose name begins
                      with the specified string are returned.`
      }
    },
    resolve: (root, {QueueNamePrefix}) => {
      return sqs.listQueuesAsync(QueueNamePrefix)
              .then(result => result.QueueUrls);
    }
  }
};

exports.mutations = {
  sendMessage: {
    type: messageType,
    args: {
      QueueUrl: {
        description: 'The URL of the Amazon SQS queue to take action on.',
        type: new GraphQLNonNull(GraphQLString)
      },
      MessageBody: {
        description: 'The message to send. String maximum 256 KB in size.',
        type: new GraphQLNonNull(GraphQLString)
      }
    },
    resolve: (obj, {QueueUrl, MessageBody}) => {
      const params = {
        QueueUrl: QueueUrl,
        MessageBody: MessageBody
      };
      return sqs.sendMessageAsync(params);
    }
  },
  receiveMessage: {
    type: new GraphQLList(messageType),
    args: {
      QueueUrl: {
        description: 'The URL of the Amazon SQS queue to take action on.',
        type: new GraphQLNonNull(GraphQLString)
      }
    },
    resolve: (obj, {QueueUrl}) => {
      const params = {
        QueueUrl: QueueUrl
      };
      return sqs.receiveMessageAsync(params)
              .then(result => result.Messages);
    }
  },
  deleteQueue: {
    type: new GraphQLNonNull(GraphQLString),
    args: {
      QueueUrl: {
        description: 'The URL of the Amazon SQS queue to take action on.',
        type: new GraphQLNonNull(GraphQLString)
      }
    },
    resolve: (obj, {QueueUrl}) => {
      const params = {
        QueueUrl: QueueUrl
      };
      return sqs.deleteQueueAsync(params);
    }
  },
  createQueue: {
    type: type,
    description: 'Creates a new queue, or returns the URL of an existing one.',
    args: {
      QueueName: {
        name: 'QueueName',
        type: new GraphQLNonNull(GraphQLString),
        description: 'The name for the queue to be created.'
      },
      Attributes: {
        name: 'Attributes',
        type: attributesInputType,
        description: 'An attributes object with corresponding values.'
      }
    },
    resolve: (obj, {QueueName, Attributes}) => {
      const params = {
        QueueName: QueueName
      };
      if (Attributes) {
        merge(params, { Attributes: helpers.removeUndefinedKeys(Attributes) });
      }
      return sqs.createQueueAsync(params)
        .then((result) => { return { QueueUrl: result.QueueUrl }; });
    }
  }
};
