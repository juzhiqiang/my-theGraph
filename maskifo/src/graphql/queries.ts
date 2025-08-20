import { gql } from '@apollo/client';

export const GET_TOKEN_DATA = gql`
  query GetTokenData($tokenAddress: String!) {
    token(id: $tokenAddress) {
      id
      name
      symbol
      decimals
      totalSupply
      txCount
      volume
      volumeUSD
      totalValueLocked
      totalValueLockedUSD
      tokenDayData(first: 7, orderBy: date, orderDirection: desc) {
        date
        volume
        volumeUSD
        totalValueLocked
        totalValueLockedUSD
        priceUSD
      }
    }
  }
`;

export const GET_TOKEN_TRANSFERS = gql`
  query GetTokenTransfers($tokenAddress: String!, $first: Int = 10) {
    transfers: mints(
      first: $first
      orderBy: timestamp
      orderDirection: desc
      where: { token: $tokenAddress }
    ) {
      id
      timestamp
      token {
        symbol
      }
      amount
      amountUSD
      transaction {
        id
      }
    }
  }
`;