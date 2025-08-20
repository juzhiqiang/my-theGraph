import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

const httpLink = createHttpLink({
  uri: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
});

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});