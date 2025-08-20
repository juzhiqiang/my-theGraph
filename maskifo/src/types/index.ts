export interface TokenData {
  id: string;
  name: string;
  symbol: string;
  decimals: string;
  totalSupply: string;
  txCount: string;
  volume: string;
  volumeUSD: string;
  totalValueLocked: string;
  totalValueLockedUSD: string;
  tokenDayData: TokenDayData[];
}

export interface TokenDayData {
  date: number;
  volume: string;
  volumeUSD: string;
  totalValueLocked: string;
  totalValueLockedUSD: string;
  priceUSD: string;
}

export interface Transfer {
  id: string;
  timestamp: string;
  token: {
    symbol: string;
  };
  amount: string;
  amountUSD: string;
  transaction: {
    id: string;
  };
}