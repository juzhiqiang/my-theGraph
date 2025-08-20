import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_TRANSFERS, GET_BURNS, GET_FREEZES, GET_UNFREEZES } from '../graphql/queries';
import type { Transfer, Burn, Freeze, Unfreeze } from '../types';
import './WalletDashboard.css';

const WalletDashboard: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState('');
  
  const { data: transfersData, loading: transfersLoading, error: transfersError } = useQuery(GET_TRANSFERS, {
    variables: { first: 10 },
  });

  const { data: burnsData, loading: burnsLoading } = useQuery(GET_BURNS, {
    variables: { first: 5 },
  });

  const { data: freezesData, loading: freezesLoading } = useQuery(GET_FREEZES, {
    variables: { first: 5 },
  });

  const { data: unfreezesData, loading: unfreezesLoading } = useQuery(GET_UNFREEZES, {
    variables: { first: 5 },
  });

  const transfers: Transfer[] = transfersData?.transfers || [];
  const burns: Burn[] = burnsData?.burns || [];
  const freezes: Freeze[] = freezesData?.freezes || [];
  const unfreezes: Unfreeze[] = unfreezesData?.unfreezes || [];

  const formatNumber = (value: string | number, showAllDecimals: boolean = false): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    // 从wei转换为BNB (除以 10^18)
    const bnbValue = num / Math.pow(10, 18);
    
    if (showAllDecimals) {
      // 显示所有有效位数，去掉末尾的0
      return bnbValue.toString();
    } else {
      // 显示最多18位小数（BNB的最大精度）
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 18,
      }).format(bnbValue);
    }
  };

  const formatDate = (timestamp: string): string => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 计算统计信息
  const calculateStats = (data: Array<{value: string}>) => {
    if (!data || data.length === 0) {
      return {
        totalAmount: 0,
        avgAmount: 0,
        maxAmount: 0,
        minAmount: 0,
        count: 0
      };
    }

    const amounts = data.map(item => parseFloat(item.value));
    const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
    const avgAmount = totalAmount / amounts.length;
    const maxAmount = Math.max(...amounts);
    const minAmount = Math.min(...amounts);

    return {
      totalAmount,
      avgAmount,
      maxAmount,
      minAmount,
      count: data.length
    };
  };

  const transferStats = calculateStats(transfers);
  const burnStats = calculateStats(burns);
  const freezeStats = calculateStats(freezes);
  const unfreezeStats = calculateStats(unfreezes);

  // 统计信息组件
  const StatsSummary: React.FC<{
    stats: ReturnType<typeof calculateStats>;
    title: string;
    type: 'transfer' | 'burn' | 'freeze' | 'unfreeze';
  }> = ({ stats, title, type }) => (
    <div className="stats-summary">
      <div className="stats-header">
        <h4>{title}</h4>
        <span className={`stats-count ${type}`}>{stats.count} 笔</span>
      </div>
      <div className="stats-details">
        <div className="stat-item">
          <span className="stat-label">总计:</span>
          <span className="stat-value">{formatNumber(stats.totalAmount, true)} BNB</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">平均:</span>
          <span className="stat-value">{formatNumber(stats.avgAmount, true)} BNB</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">最大:</span>
          <span className="stat-value">{formatNumber(stats.maxAmount, true)} BNB</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">最小:</span>
          <span className="stat-value">{formatNumber(stats.minAmount, true)} BNB</span>
        </div>
      </div>
    </div>
  );

  if (transfersLoading && burnsLoading && freezesLoading && unfreezesLoading) {
    return <div className="loading">正在加载区块链数据...</div>;
  }
  if (transfersError) return <div className="error">错误: {transfersError.message}</div>;

  return (
    <div className="wallet-dashboard">
      <header className="dashboard-header">
        <h1>区块链活动监控面板</h1>
        <div className="wallet-input">
          <input
            type="text"
            placeholder="输入钱包地址"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="wallet-address-input"
          />
          <button className="connect-btn">连接</button>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>近期转账</h3>
          <p className="stat-value">{transfers.length}</p>
        </div>
        
        <div className="stat-card">
          <h3>近期销毁</h3>
          <p className="stat-value">{burns.length}</p>
        </div>
        
        <div className="stat-card">
          <h3>近期冻结</h3>
          <p className="stat-value">{freezes.length}</p>
        </div>
        
        <div className="stat-card">
          <h3>近期解冻</h3>
          <p className="stat-value">{unfreezes.length}</p>
        </div>
      </div>

      <div className="activity-sections">
        <div className="activity-section">
          <h3>最近转账记录</h3>
          <StatsSummary stats={transferStats} title="转账统计" type="transfer" />
          {transfersLoading ? (
            <div className="loading">正在加载转账数据...</div>
          ) : (
            <div className="activity-list">
              {transfers.map((transfer) => (
                <div key={transfer.id} className="activity-item">
                  <div className="activity-info">
                    <span className="activity-type">转账</span>
                    <span className="activity-amount">
                      {formatNumber(transfer.value, true)} BNB
                    </span>
                  </div>
                  <div className="activity-details">
                    <span className="activity-addresses">
                      {formatAddress(transfer.from)} → {formatAddress(transfer.to)}
                    </span>
                    <span className="activity-hash">
                      哈希: {transfer.transactionHash}
                    </span>
                    <span className="activity-date">
                      {formatDate(transfer.blockTimestamp)}
                    </span>
                    <a
                      href={`https://etherscan.io/tx/${transfer.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tx-link"
                    >
                      查看交易
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="activity-section">
          <h3>最近销毁记录</h3>
          <StatsSummary stats={burnStats} title="销毁统计" type="burn" />
          {burnsLoading ? (
            <div className="loading">正在加载销毁数据...</div>
          ) : (
            <div className="activity-list">
              {burns.map((burn) => (
                <div key={burn.id} className="activity-item">
                  <div className="activity-info">
                    <span className="activity-type burn">销毁</span>
                    <span className="activity-amount">
                      {formatNumber(burn.value, true)} BNB
                    </span>
                  </div>
                  <div className="activity-details">
                    <span className="activity-addresses">
                      销毁自: {formatAddress(burn.from)}
                    </span>
                    <span className="activity-hash">
                      哈希: {burn.transactionHash}
                    </span>
                    <span className="activity-date">
                      {formatDate(burn.blockTimestamp)}
                    </span>
                    <a
                      href={`https://etherscan.io/tx/${burn.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tx-link"
                    >
                      查看交易
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="activity-section">
          <h3>最近冻结记录</h3>
          <StatsSummary stats={freezeStats} title="冻结统计" type="freeze" />
          {freezesLoading ? (
            <div className="loading">正在加载冻结数据...</div>
          ) : (
            <div className="activity-list">
              {freezes.map((freeze) => (
                <div key={freeze.id} className="activity-item">
                  <div className="activity-info">
                    <span className="activity-type freeze">冻结</span>
                    <span className="activity-amount">
                      {formatNumber(freeze.value, true)} BNB
                    </span>
                  </div>
                  <div className="activity-details">
                    <span className="activity-addresses">
                      冻结自: {formatAddress(freeze.from)}
                    </span>
                    <span className="activity-hash">
                      哈希: {freeze.transactionHash}
                    </span>
                    <span className="activity-date">
                      {formatDate(freeze.blockTimestamp)}
                    </span>
                    <a
                      href={`https://etherscan.io/tx/${freeze.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tx-link"
                    >
                      查看交易
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="activity-section">
          <h3>最近解冻记录</h3>
          <StatsSummary stats={unfreezeStats} title="解冻统计" type="unfreeze" />
          {unfreezesLoading ? (
            <div className="loading">正在加载解冻数据...</div>
          ) : (
            <div className="activity-list">
              {unfreezes.map((unfreeze) => (
                <div key={unfreeze.id} className="activity-item">
                  <div className="activity-info">
                    <span className="activity-type unfreeze">解冻</span>
                    <span className="activity-amount">
                      {formatNumber(unfreeze.value, true)} BNB
                    </span>
                  </div>
                  <div className="activity-details">
                    <span className="activity-addresses">
                      解冻自: {formatAddress(unfreeze.from)}
                    </span>
                    <span className="activity-hash">
                      哈希: {unfreeze.transactionHash}
                    </span>
                    <span className="activity-date">
                      {formatDate(unfreeze.blockTimestamp)}
                    </span>
                    <a
                      href={`https://etherscan.io/tx/${unfreeze.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tx-link"
                    >
                      查看交易
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletDashboard;