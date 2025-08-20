import { useState } from 'react';
import { ApolloProvider } from '@apollo/client';
import { client } from './graphql/client';
import WalletDashboard from './components/WalletDashboard';
import SepoliaExplorer from './components/SepoliaExplorer';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<'graph' | 'sepolia'>('graph');

  return (
    <ApolloProvider client={client}>
      <div className="app">
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'graph' ? 'active' : ''}`}
            onClick={() => setActiveTab('graph')}
          >
            📊 The Graph 数据
          </button>
          <button
            className={`tab-button ${activeTab === 'sepolia' ? 'active' : ''}`}
            onClick={() => setActiveTab('sepolia')}
          >
            🔗 Sepolia 测试网
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'graph' && <WalletDashboard />}
          {activeTab === 'sepolia' && <SepoliaExplorer />}
        </div>
      </div>
    </ApolloProvider>
  );
}

export default App;
