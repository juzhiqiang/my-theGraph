import { gql } from '@apollo/client';

export const GET_TRANSFERS = gql`
  query GetTransfers($first: Int = 10) {
    transfers(
      first: $first
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      from
      to
      value
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

export const GET_BURNS = gql`
  query GetBurns($first: Int = 10) {
    burns(
      first: $first
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      from
      value
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

export const GET_FREEZES = gql`
  query GetFreezes($first: Int = 10) {
    freezes(
      first: $first
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      from
      value
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

export const GET_UNFREEZES = gql`
  query GetUnfreezes($first: Int = 10) {
    unfreezes(
      first: $first
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      from
      value
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;