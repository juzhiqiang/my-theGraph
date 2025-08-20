export interface Transfer {
  id: string;
  from: string;
  to: string;
  value: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface Burn {
  id: string;
  from: string;
  value: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface Freeze {
  id: string;
  from: string;
  value: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface Unfreeze {
  id: string;
  from: string;
  value: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface SepoliaTransaction {
  hash: string;
  blockNumber: number;
  blockHash: string;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasUsed: string;
  gasLimit: string;
  data: string;
  nonce: number;
  status: number;
}

export interface DecodedData {
  functionName?: string;
  parameters?: Array<{
    name: string;
    type: string;
    value: string;
  }>;
  decodedHex?: string;
  utf8Text?: string;
  error?: string;
  analysis?: {
    selector?: string;
    parameterData?: string;
    dataSize?: number;
    chunks?: string[];
    rawHex?: string;
    asciiRepresentation?: string;
    possibleTypes?: string[];
  };
}