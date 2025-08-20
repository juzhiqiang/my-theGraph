# USDT Wallet Dashboard

A React + TypeScript application that displays USDT token data using The Graph Protocol API.

## Features

- Real-time USDT token data visualization
- Token statistics (Total Supply, TVL, Volume, Transactions)
- Recent transfer activity
- Responsive design
- Integration with The Graph Protocol

## Tech Stack

- React 18 with TypeScript
- Vite for development
- Apollo Client for GraphQL queries
- The Graph Protocol API

## Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:5173 in your browser

## Data Source

The application fetches USDT data from The Graph Protocol using the Uniswap V3 subgraph. The displayed data includes:

- Token overview (name, symbol, total supply)
- Total Value Locked (TVL) in USD
- 24h trading volume
- Transaction count
- Recent transfer activities with timestamps

## Components

- `WalletDashboard`: Main dashboard component
- `GraphQL Client`: Apollo client configuration
- `Queries`: GraphQL queries for token data
- `Types`: TypeScript interfaces for data structures