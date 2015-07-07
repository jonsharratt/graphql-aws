import AWS from 'aws-sdk';
import Promise from 'bluebird';
import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLSchema,
  GraphQLString
} from 'graphql/lib/type';

const sns = new Promise.promisifyAll(new AWS.SNS());

const topicType = new GraphQLObjectType({
  name: 'Topic',
  description: 'Represents an Amazon SNS topic.',
  fields: () => ({
    arn: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The topic arn.',
      resolve: (root) => { return root.TopicArn; }
    }
  })
});

exports.queries = {
  topics: {
    type: new GraphQLList(topicType),
    args: {
      nextToken: {
        name: 'Next token',
        type: GraphQLString
      }
    },
    resolve: (root, {nextToken}) => {
      return sns.listTopicsAsync({ NextToken: nextToken }).then((result) => {
        return result.Topics;
      });
    }
  }
}

exports.mutations = {
  createTopic: {
    type: topicType,
    args: {
      name: {
        name: 'name',
        type: new GraphQLNonNull(GraphQLString)
      }
    },
    resolve: (obj, {name}) => {
      return sns.createTopicAsync({ Name: name });
    }
  }
};
