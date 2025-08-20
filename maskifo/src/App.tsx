import { ApolloProvider } from '@apollo/client';
import { client } from './graphql/client';
import WalletDashboard from './components/WalletDashboard';
import './App.css'

function App() {
  return (
    <ApolloProvider client={client}>
      <div className="App">
        <WalletDashboard />
      </div>
    </ApolloProvider>
  )
}

export default App
