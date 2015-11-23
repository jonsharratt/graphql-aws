import AWS from 'aws-sdk';
import Promise from 'bluebird';
import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLString
} from 'graphql';

const sns = new Promise.promisifyAll(new AWS.SNS());
const sqs = new Promise.promisifyAll(new AWS.SQS());

export const aws = graphql`${`
type Topic {
  arn: String!
}

type QueueAttributes {
  DelaySeconds: String
  MaximumMessageSize: String
  MessageRetentionPeriod: String
  Policy: String
  ReceiveMessageWaitTimeSeconds: String
  VisibilityTimeout: String
}
type Queue {
  QueueUrl: String!
  Attributes: QueueAttributes
}
type Message {
  MessageId: String
  MD5OfMessageBody: String
  MD5OfMessageAttributes: String
  Body: String
  ReceiptHandle: String
}

type Queries {
  topics(nextToken: String): [Topic]

  listQueues(QueueNamePrefix: String!): [String]
  receiveMessage(QueueUrl: String!): [Message]
}

type Mutations {
  createTopic(name: String!): Topic
  deleteTopic(arn: String!): String

  sendMessage(QueueUrl: String!, MessageBody: String!): Message
  deleteMessage(QueueUrl: String!, ReceiptHandle: String!): String!
  deleteQueue(QueueUrl: String!): String!
  createQueue(QueueName: String!): Queue
}
`}

${{
  Queue: {
    QueueUrl: {
      resolve: (root) => { return root.QueueUrl || root; }
    },
    Attributes: {
      resolve: (root) => {
        const params = { QueueUrl: root.QueueUrl, AttributeNames: ['All'] };
        return sqs.getQueueAttributesAsync(params).then(result => result.Attributes);
      }
    }
  },
  Message: {
    MD5OfMessageBody: {
      resolve: (root) => { return root.MD5OfMessageBody || root.MD5OfBody; }
    }
  },
  Topic: {
    description: 'Represents an Amazon SNS topic.',
    arn: {
      description: 'The topic arn.',
      resolve: (root) => { return root.TopicArn; }
    }
  },

  Queries: {
    topics: {
      resolve: (root, {nextToken}) => {
        return sns.listTopicsAsync({ NextToken: nextToken }).then((result) => {
          return result.Topics;
        });
      }
    },
    listQueues: {
      resolve: (root, {QueueNamePrefix}) => {
        return sqs.listQueuesAsync(QueueNamePrefix).then(result => result.QueueUrls);
      }
    },
    receiveMessage: {
      resolve: (obj, {QueueUrl}) => {
        const params = { QueueUrl: QueueUrl };
        return sqs.receiveMessageAsync(params).then(result => result.Messages);
      }
    }
  },
  Mutations: {
    createTopic: {
      resolve: (obj, {name}) => {
        return sns.createTopicAsync({ Name: name });
      }
    },
    deleteTopic: {
      resolve: (obj, {arn}) => {
        return sns.deleteTopicAsync({ TopicArn: arn }).then((result) => {
          return result.ResponseMetadata.RequestId;
        });
      }
    },
    sendMessage: {
      resolve: (obj, {QueueUrl, MessageBody}) => {
        const params = { QueueUrl: QueueUrl, MessageBody: MessageBody };
        return sqs.sendMessageAsync(params);
      }
    },
    deleteMessage: {
      resolve: (obj, {QueueUrl, ReceiptHandle}) => {
        const params = { QueueUrl: QueueUrl, ReceiptHandle: ReceiptHandle };
        return sqs.deleteMessageAsync(params).then(result => result.ResponseMetadata.RequestId);
      }
    },
    deleteQueue: {
      resolve: (obj, {QueueUrl}) => {
        const params = { QueueUrl: QueueUrl };
        return sqs.deleteQueueAsync(params).then(result => result.ResponseMetadata.RequestId);
      }
   },
   createQueue: {
      resolve: (obj, {QueueName, Attributes}) => {
        const params = { QueueName: QueueName };
        if (Attributes) {
          Object.assign(params, { Attributes: helpers.removeUndefinedKeys(Attributes) });
        }
        return sqs.createQueueAsync(params).then((result) => { return { QueueUrl: result.QueueUrl }; });
      }
    }
  }
}}`;
