import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

const httpLink = createHttpLink({
  uri: 'https://api.studio.thegraph.com/query/119163/my-first/v0.0.3',
});

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});