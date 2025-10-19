import { ref, computed } from 'vue';
import Web3 from 'web3';

const web3 = ref(null);
const account = ref('');
const chainId = ref(null);
const contract = ref(null);
const isConnected = ref(false);

// IMPORTANT: Replace this with your deployed contract address after deployment
const CONTRACT_ADDRESS = 'YOUR_CONTRACT_ADDRESS_HERE';

// Contract ABI - Will be loaded from artifacts
const TOKEN_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export function useWeb3() {
  const connectWallet = async () => {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('Please install MetaMask to use this DApp!');
      }

      // Request account access
      web3.value = new Web3(window.ethereum);
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      account.value = accounts[0];
      chainId.value = await web3.value.eth.getChainId();
      isConnected.value = true;

      // Initialize contract
      if (CONTRACT_ADDRESS && CONTRACT_ADDRESS !== 'YOUR_CONTRACT_ADDRESS_HERE') {
        contract.value = new web3.value.eth.Contract(TOKEN_ABI, CONTRACT_ADDRESS);
      }

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          account.value = accounts[0];
          window.location.reload();
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      return account.value;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    account.value = '';
    isConnected.value = false;
    contract.value = null;
  };

  const getBalance = async (address) => {
    try {
      if (!contract.value) {
        throw new Error('Contract not initialized. Please check CONTRACT_ADDRESS.');
      }
      const balance = await contract.value.methods.balanceOf(address).call();
      return web3.value.utils.fromWei(balance, 'ether');
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  };

  const transfer = async (to, amount) => {
    try {
      if (!contract.value || !account.value) {
        throw new Error('Wallet not connected or contract not initialized');
      }
      
      if (!web3.value.utils.isAddress(to)) {
        throw new Error('Invalid recipient address');
      }

      const amountWei = web3.value.utils.toWei(amount.toString(), 'ether');
      
      const tx = await contract.value.methods
        .transfer(to, amountWei)
        .send({ from: account.value });
      
      return tx;
    } catch (error) {
      console.error('Error transferring tokens:', error);
      throw error;
    }
  };

  const getTokenInfo = async () => {
    try {
      if (!contract.value) return null;
      
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.value.methods.name().call(),
        contract.value.methods.symbol().call(),
        contract.value.methods.decimals().call(),
        contract.value.methods.totalSupply().call()
      ]);

      return {
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: web3.value.utils.fromWei(totalSupply, 'ether')
      };
    } catch (error) {
      console.error('Error getting token info:', error);
      return null;
    }
  };

  const shortAddress = computed(() => {
    if (!account.value) return '';
    return `${account.value.slice(0, 6)}...${account.value.slice(-4)}`;
  });

  return {
    web3,
    account,
    chainId,
    contract,
    isConnected,
    shortAddress,
    connectWallet,
    disconnectWallet,
    getBalance,
    transfer,
    getTokenInfo
  };
}