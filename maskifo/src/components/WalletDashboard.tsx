import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_TOKEN_DATA, GET_TOKEN_TRANSFERS } from '../graphql/queries';
import { TokenData, Transfer } from '../types';
import './WalletDashboard.css';

const USDT_ADDRESS = '0xa0b86a33e6411c6e4dcf8bbe6b5f7c91373fd9c2';

const WalletDashboard: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState('');
  
  const { data: tokenData, loading: tokenLoading, error: tokenError } = useQuery(GET_TOKEN_DATA, {
    variables: { tokenAddress: USDT_ADDRESS.toLowerCase() },
  });

  const { data: transfersData, loading: transfersLoading } = useQuery(GET_TOKEN_TRANSFERS, {
    variables: { tokenAddress: USDT_ADDRESS.toLowerCase(), first: 10 },
  });

  const token: TokenData | null = tokenData?.token || null;
  const transfers: Transfer[] = transfersData?.transfers || [];

  const formatNumber = (value: string | number, decimals: number = 2): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const formatDate = (timestamp: string): string => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
  };

  if (tokenLoading) return <div className="loading">Loading USDT data...</div>;
  if (tokenError) return <div className="error">Error: {tokenError.message}</div>;

  return (
    <div className="wallet-dashboard">
      <header className="dashboard-header">
        <h1>USDT Wallet Dashboard</h1>
        <div className="wallet-input">
          <input
            type="text"
            placeholder="Enter wallet address"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="wallet-address-input"
          />
          <button className="connect-btn">Connect</button>
        </div>
      </header>

      {token && (
        <div className="token-overview">
          <div className="token-header">
            <h2>{token.name} ({token.symbol})</h2>
            <p className="token-address">{token.id}</p>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Supply</h3>
              <p className="stat-value">{formatNumber(token.totalSupply, 0)}</p>
            </div>
            
            <div className="stat-card">
              <h3>Total Value Locked</h3>
              <p className="stat-value">${formatNumber(token.totalValueLockedUSD)}</p>
            </div>
            
            <div className="stat-card">
              <h3>24h Volume</h3>
              <p className="stat-value">${formatNumber(token.volumeUSD)}</p>
            </div>
            
            <div className="stat-card">
              <h3>Total Transactions</h3>
              <p className="stat-value">{formatNumber(token.txCount, 0)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="recent-activity">
        <h3>Recent Activity</h3>
        {transfersLoading ? (
          <div className="loading">Loading transfers...</div>
        ) : (
          <div className="transfers-list">
            {transfers.map((transfer) => (
              <div key={transfer.id} className="transfer-item">
                <div className="transfer-info">
                  <span className="transfer-amount">
                    {formatNumber(transfer.amount)} {transfer.token.symbol}
                  </span>
                  <span className="transfer-usd">
                    ${formatNumber(transfer.amountUSD)}
                  </span>
                </div>
                <div className="transfer-details">
                  <span className="transfer-date">
                    {formatDate(transfer.timestamp)}
                  </span>
                  <a
                    href={`https://etherscan.io/tx/${transfer.transaction.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tx-link"
                  >
                    View TX
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletDashboard;