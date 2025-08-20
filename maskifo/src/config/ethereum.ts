import { ethers } from 'ethers';

export const NETWORKS = {
  sepolia: {
    name: 'Sepolia',
    chainId: 11155111,
    rpcUrl: 'https://sepolia.infura.io/v3/4522c2c01dce4532a23dd57f9c816286',
    blockExplorer: 'https://sepolia.etherscan.io',
    apiKey: 'XHABIWWXVBWMGVC2VI88S3SW6AP9XPTFMG', // 可用的免费 Etherscan API Key
    currency: {
      name: 'SepoliaETH',
      symbol: 'ETH',
      decimals: 18,
    }
  },
  bscTestnet: {
    name: 'BSC Testnet',
    chainId: 97,
    rpcUrl: 'https://data-seed-prebsc-1-s1.bnbchain.org:8545',
    blockExplorer: 'https://testnet.bscscan.com',
    apiKey: 'YourApiKeyToken',
    currency: {
      name: 'tBNB',
      symbol: 'tBNB',
      decimals: 18,
    }
  },
  polygonMumbai: {
    name: 'Polygon Mumbai',
    chainId: 80001,
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    blockExplorer: 'https://mumbai.polygonscan.com',
    apiKey: 'YourApiKeyToken',
    currency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    }
  }
};

export const DEFAULT_NETWORK = NETWORKS.sepolia;

export const createProvider = (networkKey: keyof typeof NETWORKS = 'sepolia') => {
  const network = NETWORKS[networkKey];
  return new ethers.JsonRpcProvider(network.rpcUrl);
};

export const formatEther = (wei: string | bigint): string => {
  return ethers.formatEther(wei);
};

export const parseEther = (ether: string): bigint => {
  return ethers.parseEther(ether);
};

export const isValidAddress = (address: string): boolean => {
  return ethers.isAddress(address);
};