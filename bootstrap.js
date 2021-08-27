const { createServer } = require('http');
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { execute, subscribe } = require('graphql');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const mongoose = require('mongoose');

const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const config = require('./config');

module.exports = {
    init: async () => {
        try {
            await mongoose.connect(config.MONGODB, { useNewUrlParser: true, useUnifiedTopology: true });

            console.log('MongoDB Connected!');
        } catch (error) {
            console.error('Failed to connect to MongoDB', error)
        }
        const PORT = process.env.PORT || config.PORT;
        const app = express();
        const httpServer = createServer(app);

        const schema = makeExecutableSchema({ typeDefs, resolvers });
        const server = new ApolloServer({
            context: ({ req }) => ({ req }),
            schema
        });
        await server.start();
        server.applyMiddleware({ app, path: '/' });

        SubscriptionServer.create(
            { schema, execute, subscribe },
            { server: httpServer, path: server.graphqlPath }
        );

        httpServer.listen(PORT, () => {
            console.log(
                `🚀 Server running at http://localhost:${PORT}${server.graphqlPath}`
            );
            console.log(
                `🚀 Subscription endpoint ready at ws://localhost:${PORT}${server.graphqlPath}`
            );
        });
    }
}