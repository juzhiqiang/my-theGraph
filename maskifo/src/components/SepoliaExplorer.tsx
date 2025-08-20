import React, { useState } from 'react';
import { ethers } from 'ethers';
import * as CryptoJS from 'crypto-js';
import type { SepoliaTransaction, DecodedData } from '../types';
import { WalletService, type WalletData } from '../services/walletService';
import './SepoliaExplorer.css';

const SepoliaExplorer: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [transactions, setTransactions] = useState<SepoliaTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<SepoliaTransaction | null>(null);
  const [decodedData, setDecodedData] = useState<DecodedData | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [decryptInput, setDecryptInput] = useState('');
  const [decryptOutput, setDecryptOutput] = useState('');
  const [decryptError, setDecryptError] = useState('');

  // 使用WalletService
  const walletService = new WalletService('sepolia');

  // 检查是否为有效的16进制字符串
  const isHexString = (str: string): boolean => {
    return /^[0-9a-fA-F]+$/.test(str);
  };

  // 显示成功消息
  const showSuccess = (type: string, message: string) => {
    setDecryptError('');
    console.log(`${type}: ${message}`);
  };

  // 显示错误消息
  const showError = (type: string, message: string) => {
    setDecryptError(message);
    setDecryptOutput('');
    console.error(`${type}: ${message}`);
  };

  // 数据解密方法
  const decryptData = (input: string, key: string, algorithm: string) => {
    try {
      // 处理16进制输入
      let hexStr = input.replace(/^0x/, '');
      if (!isHexString(hexStr)) {
        throw new Error('输入的数据不是有效的16进制格式');
      }

      // 转换为Base64格式以供CryptoJS解密
      const base64Data = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Hex.parse(hexStr));

      let decrypted;
      switch (algorithm) {
        case 'AES':
          decrypted = CryptoJS.AES.decrypt(base64Data, key);
          break;
        case 'DES':
          decrypted = CryptoJS.DES.decrypt(base64Data, key);
          break;
        case 'TripleDES':
          decrypted = CryptoJS.TripleDES.decrypt(base64Data, key);
          break;
        case 'Rabbit':
          decrypted = CryptoJS.Rabbit.decrypt(base64Data, key);
          break;
        case 'RC4':
          decrypted = CryptoJS.RC4.decrypt(base64Data, key);
          break;
        default:
          throw new Error('不支持的解密算法');
      }

      const result = decrypted.toString(CryptoJS.enc.Utf8);
      if (!result) {
        throw new Error('解密失败，请检查密钥是否正确');
      }

      setDecryptOutput(result);
      showSuccess('decryptSuccess', '解密成功！');
    } catch (error) {
      showError('decryptError', '解密失败: ' + (error as Error).message);
    }
  };

  // 处理解密按钮点击
  const handleDecryptClick = () => {
    if (!decryptInput.trim()) {
      showError('decryptError', '请输入需要解密的数据');
      return;
    }
    decryptData(decryptInput, '1', 'AES'); // 使用密钥1和AES算法
  };

  // 添加到搜索历史
  const addToHistory = (address: string) => {
    if (ethers.isAddress(address)) {
      setSearchHistory(prev => {
        const filtered = prev.filter(addr => addr.toLowerCase() !== address.toLowerCase());
        return [address, ...filtered].slice(0, 5); // 最多保存5个历史记录
      });
    }
  };

  const formatNumber = (value: string, decimals: number = 6): string => {
    const num = parseFloat(value);
    const ethValue = num / Math.pow(10, 18);
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    }).format(ethValue);
  };

  const formatGwei = (value: string): string => {
    const num = parseFloat(value);
    const gweiValue = num / Math.pow(10, 9); // Convert wei to gwei
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(gweiValue);
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN');
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const decodeHexData = (data: string): DecodedData => {
    if (!data || data === '0x') {
      return { decodedHex: '空数据 (简单ETH转账)' };
    }

    try {
      // 尝试解码为UTF-8文本
      const hexString = data.slice(2); // 移除0x前缀
      let utf8Text = '';
      let asciiText = '';
      
      try {
        const bytes = hexString.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [];
        
        // UTF-8 解码
        utf8Text = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
        // eslint-disable-next-line no-control-regex
        utf8Text = utf8Text.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
        
        // ASCII 解码
        asciiText = bytes.map(byte => 
          (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.'
        ).join('');
        
      } catch {
        utf8Text = '无法解码为文本';
        asciiText = '无法解码为ASCII';
      }

      // 16进制数据分析
      const analysis = {
        dataLength: hexString.length / 2,
        hexChunks: hexString.match(/.{1,64}/g) || [],
        isCalldata: data.length >= 10,
      };

      // 尝试解析函数调用
      if (data.length >= 10) {
        const functionSelector = data.slice(0, 10);
        const parameterData = data.slice(10);
        
        // 扩展的函数选择器映射 (支持更多MetaMask常用功能)
        const knownSelectors: { [key: string]: string } = {
          // ERC20 标准函数
          '0xa9059cbb': 'transfer(address,uint256)',
          '0x23b872dd': 'transferFrom(address,address,uint256)',
          '0x095ea7b3': 'approve(address,uint256)',
          '0x70a08231': 'balanceOf(address)',
          '0x18160ddd': 'totalSupply()',
          '0x313ce567': 'decimals()',
          '0x95d89b41': 'symbol()',
          '0x06fdde03': 'name()',
          '0xdd62ed3e': 'allowance(address,address)',
          
          // Uniswap V2/V3
          '0x38ed1739': 'swapExactTokensForTokens(uint256,uint256,address[],address,uint256)',
          '0x8803dbee': 'swapTokensForExactTokens(uint256,uint256,address[],address,uint256)',
          '0x7ff36ab5': 'swapExactETHForTokens(uint256,address[],address,uint256)',
          '0x02751cec': 'removeLiquidity(address,address,uint256,uint256,uint256,address,uint256)',
          
          // 其他常见功能
          '0x3ccfd60b': 'withdraw()',
          '0xa0712d68': 'mint(uint256)',
          '0x42842e0e': 'safeTransferFrom(address,address,uint256)',
          '0x2e1a7d4d': 'withdraw(uint256)',
          '0xd0e30db0': 'deposit()',
          
          // MetaMask 交互常见
          '0x40c10f19': 'mint(address,uint256)',
          '0x9dc29fac': 'burn(address,uint256)',
          '0xa457c2d7': 'decreaseAllowance(address,uint256)',
          '0x39509351': 'increaseAllowance(address,uint256)',
        };

        const functionName = knownSelectors[functionSelector];
        if (functionName) {
          // 解析参数
          const parameters: Array<{ name: string; type: string; value: string }> = [];
          
          // Transfer function 解析
          if (functionSelector === '0xa9059cbb' && parameterData.length >= 128) {
            const toAddress = '0x' + parameterData.slice(24, 64);
            const amount = ethers.getBigInt('0x' + parameterData.slice(64, 128)).toString();
            const amountFormatted = ethers.formatEther(amount);
            parameters.push(
              { name: 'to', type: 'address', value: toAddress },
              { name: 'amount', type: 'uint256', value: `${amount} (${amountFormatted} ETH)` }
            );
          }
          // Approve function 解析
          else if (functionSelector === '0x095ea7b3' && parameterData.length >= 128) {
            const spenderAddress = '0x' + parameterData.slice(24, 64);
            const amount = ethers.getBigInt('0x' + parameterData.slice(64, 128)).toString();
            const amountFormatted = ethers.formatEther(amount);
            parameters.push(
              { name: 'spender', type: 'address', value: spenderAddress },
              { name: 'amount', type: 'uint256', value: `${amount} (${amountFormatted} ETH)` }
            );
          }
          // TransferFrom function 解析
          else if (functionSelector === '0x23b872dd' && parameterData.length >= 192) {
            const fromAddress = '0x' + parameterData.slice(24, 64);
            const toAddress = '0x' + parameterData.slice(88, 128);
            const amount = ethers.getBigInt('0x' + parameterData.slice(128, 192)).toString();
            const amountFormatted = ethers.formatEther(amount);
            parameters.push(
              { name: 'from', type: 'address', value: fromAddress },
              { name: 'to', type: 'address', value: toAddress },
              { name: 'amount', type: 'uint256', value: `${amount} (${amountFormatted} ETH)` }
            );
          }

          return {
            functionName,
            parameters,
            decodedHex: `智能合约调用: ${functionName}`,
            utf8Text: utf8Text || undefined,
            analysis: {
              selector: functionSelector,
              parameterData: parameterData,
              dataSize: analysis.dataLength,
              chunks: analysis.hexChunks.slice(0, 3), // 显示前3个64字节块
            }
          };
        } else {
          // 未知函数选择器
          return {
            functionName: `未知函数 (${functionSelector})`,
            decodedHex: `未识别的智能合约调用`,
            utf8Text: utf8Text || undefined,
            analysis: {
              selector: functionSelector,
              parameterData: parameterData,
              dataSize: analysis.dataLength,
              rawHex: hexString.slice(0, 200), // 显示前100字节
            }
          };
        }
      }

      // 非函数调用数据的通用解析
      return {
        decodedHex: `原始数据 (${analysis.dataLength} 字节)`,
        utf8Text: utf8Text || undefined,
        analysis: {
          dataSize: analysis.dataLength,
          asciiRepresentation: asciiText.slice(0, 100),
          chunks: analysis.hexChunks.slice(0, 5),
          possibleTypes: [
            analysis.dataLength === 32 ? '可能是uint256/bytes32' : null,
            analysis.dataLength === 20 ? '可能是address' : null,
            analysis.dataLength % 32 === 0 ? '可能是ABI编码数据' : null,
          ].filter((type): type is string => type !== null)
        }
      };
    } catch (error) {
      return { 
        error: `解码失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  };

  // 处理RPC响应数据
  const processRpcTransaction = (txData: Record<string, unknown>): SepoliaTransaction => {
    return {
      hash: txData.hash as string,
      blockNumber: parseInt(txData.blockNumber as string, 16),
      blockHash: (txData.blockHash as string) || '',
      timestamp: Date.now() / 1000, // 临时时间戳，需要从区块获取
      from: txData.from as string,
      to: (txData.to as string) || '',
      value: ethers.getBigInt(txData.value as string).toString(),
      gasPrice: ethers.getBigInt(txData.gasPrice as string).toString(),
      gasUsed: ethers.getBigInt(txData.gas as string).toString(), // 这是gas limit，实际使用需要receipt
      gasLimit: ethers.getBigInt(txData.gas as string).toString(),
      data: (txData.input as string) || '0x',
      nonce: parseInt(txData.nonce as string, 16),
      status: 1, // 默认成功，需要从receipt获取
    };
  };

  // 获取钱包基本数据
  const fetchWalletData = async (address: string) => {
    if (!address || !ethers.isAddress(address)) {
      return;
    }

    setWalletLoading(true);
    try {
      const data = await walletService.getWalletData(address);
      setWalletData(data);
    } catch (error) {
      console.warn('获取钱包数据失败:', error);
    } finally {
      setWalletLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      setError('请输入有效的以太坊地址');
      return;
    }

    setLoading(true);
    setError(null);
    setTransactions([]);
    setSelectedTx(null);
    setDecodedData(null);
    
    // 添加到搜索历史
    addToHistory(walletAddress);
    
    // 同时获取钱包基本数据
    await fetchWalletData(walletAddress);

    try {
      console.log(`开始获取地址 ${walletAddress} 的交易记录...`);
      
      // 直接使用WalletService获取交易记录
      const recentTransactions = await walletService.getRecentTransactions(walletAddress, 50);
      
      if (recentTransactions.length > 0) {
        const convertedTransactions = recentTransactions.map(tx => ({
          hash: tx.hash,
          blockNumber: tx.blockNumber,
          blockHash: '',
          timestamp: tx.timestamp,
          from: tx.from,
          to: tx.to || '',
          value: tx.value,
          gasPrice: tx.gasPrice,
          gasUsed: tx.gasUsed,
          gasLimit: '0',
          data: tx.data || '0x',
          nonce: 0,
          status: tx.status,
        }));
        
        const sortedTransactions = convertedTransactions.sort((a, b) => b.timestamp - a.timestamp);
        setTransactions(sortedTransactions);
        console.log(`通过WalletService找到 ${sortedTransactions.length} 笔交易`);
      } else {
        setError('未找到该地址的交易记录。请确认地址正确，或该地址在近期没有交易活动。');
        console.log('WalletService未找到任何交易记录');
      }

    } catch (error) {
      console.error('获取交易失败:', error);
      setError(`获取交易失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionClick = (tx: SepoliaTransaction) => {
    setSelectedTx(tx);
    setDecodedData(decodeHexData(tx.data));
    
    // Auto-populate decrypt input if transaction has data
    if (tx.data && tx.data !== '0x' && tx.data.length > 10) {
      setDecryptInput(tx.data);
      setDecryptOutput('');
      setDecryptError('');
    }
  };

  // 使用真实RPC数据测试
  const loadRealRpcData = () => {
    console.log('=== 加载真实RPC数据 ===');
    const realRpcData = {
      "blockHash": "0x3638ad6d0bd2ebde17c13dac5d1eb12755091e21116a26209b92efc564c4a4cd",
      "blockNumber": "0x89b1fd",
      "chainId": "0xaa36a7",
      "from": "0xc6392ad8a14794ea57d237d12017e7295bea2363",
      "gas": "0x5208",
      "gasPrice": "0x6fc23ac00",
      "hash": "0x59d7dcfe37ef2ff4587b1cf70194e1d21501211977592f9ba2d7558e7aebfa14",
      "input": "0x",
      "nonce": "0x222e87",
      "to": "0xab805b4f0cfdd42f3f4873b996b09f96fdd34d6a",
      "transactionIndex": "0x1",
      "type": "0x0",
      "value": "0x11c37937e08000"
    };

    const processedTransaction = processRpcTransaction(realRpcData);
    console.log('处理后的交易:', processedTransaction);
    
    setTransactions([processedTransaction]);
    setError(null);
    console.log('已设置真实RPC数据');
  };

  // 测试功能：使用模拟数据
  const loadTestData = () => {
    console.log('=== 开始加载测试数据 ===');
    const testTransactions: SepoliaTransaction[] = [
      {
        hash: "0x08ef8242125b307f49a2e55280ee4204cdbc20badffa5f234bfad518af429c21",
        blockNumber: 9023997,
        blockHash: "0x4680a6b93245bf7033631eca82f3475ae954ef71a4120b00cf4eeb6a33aa83a7",
        timestamp: 1755455364,
        from: "0x742d35Cc6634C0532925a3b8D34e8a9A7Dc6C0dA",
        to: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
        value: "1000000000000000000", // 1 ETH
        gasPrice: "20000000000", // 20 Gwei
        gasUsed: "21000",
        gasLimit: "21000",
        data: "0x",
        nonce: 42,
        status: 1,
      },
      {
        hash: "0x2d4b2cbb31bbe1db5165e9a1c16f28fa39a859bfedc545a4c4063172b72ca078",
        blockNumber: 9023997,
        blockHash: "0x4680a6b93245bf7033631eca82f3475ae954ef71a4120b00cf4eeb6a33aa83a7",
        timestamp: 1755455364,
        from: "0x8ba1f109551bD432803012645aac136c89FBa4BE",
        to: "0x742d35Cc6634C0532925a3b8D34e8a9A7Dc6C0dA",
        value: "500000000000000000", // 0.5 ETH
        gasPrice: "25000000000", // 25 Gwei
        gasUsed: "51000",
        gasLimit: "60000",
        data: "0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b8d34e8a9a7dc6c0da0000000000000000000000000000000000000000000000000de0b6b3a7640000",
        nonce: 15,
        status: 1,
      },
      {
        hash: "0xf58b2d0b2438187fcb3e568d3f28ec2e82038333cf23085a0f04f6e4b9595f7f",
        blockNumber: 9023996,
        blockHash: "0x4680a6b93245bf7033631eca82f3475ae954ef71a4120b00cf4eeb6a33aa83a7",
        timestamp: 1755455300,
        from: "0x742d35Cc6634C0532925a3b8D34e8a9A7Dc6C0dA",
        to: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
        value: "0", // 代币转账
        gasPrice: "30000000000", // 30 Gwei
        gasUsed: "45000",
        gasLimit: "50000",
        data: "0xa9059cbb0000000000000000000000008ba1f109551bd432803012645aac136c89fba4be0000000000000000000000000000000000000000000000001bc16d674ec80000",
        nonce: 43,
        status: 1,
      }
    ];

    console.log('=== 设置交易状态前 ===');
    console.log('当前交易数组长度:', transactions.length);
    console.log('新交易数据:', testTransactions);
    
    setTransactions(testTransactions);
    setError(null);
    
    console.log('=== 设置交易状态后 ===');
    console.log('已加载测试数据，数量:', testTransactions.length);
  };

  return (
    <div className="sepolia-explorer">
      <div className="explorer-header">
        <h2>Sepolia 测试网浏览器</h2>
        <div className="address-input">
          <input
            type="text"
            placeholder="输入钱包地址 (0x...)"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="address-input-field"
            onKeyDown={(e) => e.key === 'Enter' && !loading && fetchTransactions()}
          />
          <button onClick={fetchTransactions} disabled={loading || !walletAddress} className="fetch-btn">
            {loading ? '获取中...' : '获取交易'}
          </button>
          <button onClick={loadTestData} className="test-btn">
            加载测试数据
          </button>
          <button onClick={loadRealRpcData} className="rpc-btn">
            真实RPC数据
          </button>
        </div>

        {/* 钱包基本信息显示 */}
        {walletData && (
          <div className="wallet-info">
            <h3>钱包信息</h3>
            <div className="api-notice" style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              padding: '8px 12px',
              borderRadius: '4px',
              marginBottom: '12px',
              fontSize: '12px',
              color: '#856404'
            }}>
              💡 提示：由于 API Key 限制，当前显示演示数据。要查看真实数据，请配置有效的 Etherscan API Key。
            </div>
            <div className="wallet-details">
              <div className="wallet-item">
                <span className="label">地址:</span>
                <span className="value mono">{walletData.address}</span>
              </div>
              <div className="wallet-item">
                <span className="label">余额:</span>
                <span className="value">{walletData.formattedBalance} ETH</span>
              </div>
              <div className="wallet-item">
                <span className="label">交易次数:</span>
                <span className="value">{walletData.transactionCount}</span>
              </div>
              <div className="wallet-item">
                <span className="label">网络:</span>
                <span className="value">{walletData.network}</span>
              </div>
            </div>
            {walletLoading && <div className="wallet-loading">🔄 更新钱包数据中...</div>}
          </div>
        )}

        {/* 数据解密工具 */}
        <div className="decrypt-tool">
          <h3>数据解密工具</h3>
          <div className="decrypt-input-section">
            <div className="input-group">
              <label htmlFor="decrypt-input">加密数据 (16进制):</label>
              <textarea
                id="decrypt-input"
                className="decrypt-input-field"
                value={decryptInput}
                onChange={(e) => setDecryptInput(e.target.value)}
                placeholder="输入16进制加密数据 (支持0x前缀)"
                rows={3}
              />
            </div>
            <div className="decrypt-controls">
              <button 
                onClick={handleDecryptClick}
                className="decrypt-btn"
                disabled={!decryptInput.trim()}
              >
                🔓 解密数据 (AES, 密钥: 1)
              </button>
            </div>
            {decryptError && (
              <div className="decrypt-error">
                ❌ {decryptError}
              </div>
            )}
            {decryptOutput && (
              <div className="decrypt-result">
                <label>解密结果:</label>
                <textarea
                  className="decrypt-output-field"
                  value={decryptOutput}
                  readOnly
                  rows={4}
                />
              </div>
            )}
          </div>
        </div>

        {searchHistory.length > 0 && (
          <div className="search-history">
            <h4>搜索历史</h4>
            <div className="history-buttons">
              {searchHistory.map((address, index) => (
                <button
                  key={index}
                  className="history-button"
                  onClick={() => {
                    setWalletAddress(address);
                    fetchWalletData(address);
                  }}
                  title={address}
                >
                  {formatAddress(address)}
                </button>
              ))}
              <button
                className="clear-history-button"
                onClick={() => setSearchHistory([])}
                title="清除历史"
              >
                🗑️ 清除
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      <div className="explorer-content">
        <div className="transactions-panel">
          <h3>交易记录 ({transactions.length})</h3>
          {loading && (
            <div className="loading">
              <div className="loading-spinner">⏳</div>
              <div>正在扫描区块链数据，请稍候...</div>
            </div>
          )}
          
          {!loading && transactions.length === 0 && !error && walletAddress && (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <div className="empty-text">
                <p>未找到该地址的交易记录</p>
                <p>请确认地址正确，或该地址在近期没有交易活动</p>
              </div>
            </div>
          )}

          {!loading && transactions.length === 0 && !walletAddress && (
            <div className="empty-state">
              <div className="empty-icon">👆</div>
              <div className="empty-text">
                <p>请输入钱包地址开始查询</p>
              </div>
            </div>
          )}
          
          <div className="transactions-list">
{/* 交易列表渲染 */}
            {transactions.map((tx) => (
              <div 
                key={tx.hash} 
                className={`transaction-item ${selectedTx?.hash === tx.hash ? 'selected' : ''}`}
                onClick={() => handleTransactionClick(tx)}
              >
                <div className="transaction-info">
                  <div className="transaction-hash">
                    🔗 {formatAddress(tx.hash)}
                  </div>
                  <div className="transaction-addresses">
                    📍 {formatAddress(tx.from)} → {tx.to ? formatAddress(tx.to) : '合约创建'}
                  </div>
                  <div className="transaction-value">
                    💰 {formatNumber(tx.value, 8)} ETH
                  </div>
                  <div className="transaction-status">
                    {tx.status === 1 ? '✅ 成功' : '❌ 失败'}
                  </div>
                  {tx.data && tx.data !== '0x' && (
                    <div className="transaction-data-indicator">
                      📄 包含数据
                    </div>
                  )}
                </div>
                <div className="transaction-meta">
                  <div className="transaction-block">区块: {tx.blockNumber.toLocaleString()}</div>
                  <div className="transaction-time">{formatDate(tx.timestamp)}</div>
                  <div className="transaction-gas">Gas: {parseInt(tx.gasUsed).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedTx && (
          <div className="transaction-details">
            <h3>交易详情</h3>
            <div className="details-content">
              <div className="detail-section">
                <h4>基本信息</h4>
                <div className="detail-item">
                  <span className="label">交易哈希:</span>
                  <span className="value mono">{selectedTx.hash}</span>
                </div>
                <div className="detail-item">
                  <span className="label">状态:</span>
                  <span className={`value ${selectedTx.status === 1 ? 'success' : 'failed'}`}>
                    {selectedTx.status === 1 ? '✅ 成功' : '❌ 失败'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">区块:</span>
                  <span className="value">{selectedTx.blockNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="label">时间:</span>
                  <span className="value">{formatDate(selectedTx.timestamp)}</span>
                </div>
              </div>

              <div className="detail-section">
                <h4>地址信息</h4>
                <div className="detail-item">
                  <span className="label">发送方:</span>
                  <span className="value mono">{selectedTx.from}</span>
                </div>
                <div className="detail-item">
                  <span className="label">接收方:</span>
                  <span className="value mono">{selectedTx.to}</span>
                </div>
              </div>

              <div className="detail-section">
                <h4>金额与Gas</h4>
                <div className="detail-item">
                  <span className="label">转账金额:</span>
                  <span className="value">{formatNumber(selectedTx.value, 8)} ETH</span>
                </div>
                <div className="detail-item">
                  <span className="label">Gas 价格:</span>
                  <span className="value">{formatGwei(selectedTx.gasPrice)} Gwei</span>
                </div>
                <div className="detail-item">
                  <span className="label">Gas 使用:</span>
                  <span className="value">{parseInt(selectedTx.gasUsed).toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Gas 限制:</span>
                  <span className="value">{parseInt(selectedTx.gasLimit).toLocaleString()}</span>
                </div>
              </div>

              {selectedTx.data && selectedTx.data !== '0x' && (
                <div className="detail-section">
                  <h4>数据解码</h4>
                  {decodedData && (
                    <>
                      {decodedData.functionName && (
                        <div className="detail-item">
                          <span className="label">函数调用:</span>
                          <span className="value function">{decodedData.functionName}</span>
                        </div>
                      )}
                      {decodedData.parameters && decodedData.parameters.length > 0 && (
                        <div className="detail-item">
                          <span className="label">参数:</span>
                          <div className="parameters">
                            {decodedData.parameters.map((param, index) => (
                              <div key={index} className="parameter">
                                <span className="param-name">{param.name}</span>
                                <span className="param-type">({param.type})</span>
                                <span className="param-value">{param.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="detail-item">
                        <span className="label">原始数据:</span>
                        <div className="raw-data-container">
                          <textarea 
                            className="value mono raw-data" 
                            value={selectedTx.data}
                            readOnly
                            rows={4}
                          />
                          <button 
                            className="decrypt-auto-btn"
                            onClick={() => {
                              setDecryptInput(selectedTx.data);
                              decryptData(selectedTx.data, '1', 'AES');
                            }}
                            title="使用AES算法和密钥1解密此数据"
                          >
                            🔓 尝试解密
                          </button>
                        </div>
                      </div>
                      {decryptOutput && (
                        <div className="detail-item">
                          <span className="label">解密结果:</span>
                          <span className="value decrypt-result-value">{decryptOutput}</span>
                        </div>
                      )}
                      {decodedData.analysis && (
                        <>
                          {decodedData.analysis.selector && (
                            <div className="detail-item">
                              <span className="label">函数选择器:</span>
                              <span className="value mono">{decodedData.analysis.selector}</span>
                            </div>
                          )}
                          {decodedData.analysis.dataSize && (
                            <div className="detail-item">
                              <span className="label">数据大小:</span>
                              <span className="value">{decodedData.analysis.dataSize} 字节</span>
                            </div>
                          )}
                          {decodedData.analysis.asciiRepresentation && (
                            <div className="detail-item">
                              <span className="label">ASCII表示:</span>
                              <span className="value mono">{decodedData.analysis.asciiRepresentation}</span>
                            </div>
                          )}
                          {decodedData.analysis.possibleTypes && decodedData.analysis.possibleTypes.length > 0 && (
                            <div className="detail-item">
                              <span className="label">可能类型:</span>
                              <span className="value">{decodedData.analysis.possibleTypes.join(', ')}</span>
                            </div>
                          )}
                          {decodedData.analysis.chunks && decodedData.analysis.chunks.length > 0 && (
                            <div className="detail-item">
                              <span className="label">数据块:</span>
                              <div className="value">
                                {decodedData.analysis.chunks.map((chunk, i) => (
                                  <div key={i} className="hex-chunk">
                                    <span className="chunk-index">块 {i + 1}:</span>
                                    <span className="chunk-data mono">{chunk}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {decodedData.analysis.rawHex && (
                            <div className="detail-item">
                              <span className="label">原始16进制:</span>
                              <span className="value mono raw-hex">{decodedData.analysis.rawHex}</span>
                            </div>
                          )}
                        </>
                      )}
                      {decodedData.error && (
                        <div className="detail-item">
                          <span className="label">解码错误:</span>
                          <span className="value error">{decodedData.error}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="detail-section">
                <h4>链上验证</h4>
                <a
                  href={`https://sepolia.etherscan.io/tx/${selectedTx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="etherscan-link"
                >
                  🔍 在 Etherscan 上查看
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SepoliaExplorer;