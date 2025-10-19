<script setup>
import { ref, onMounted } from 'vue';
import { useWeb3 } from './composables/useWeb3';

const { 
  account, 
  isConnected, 
  shortAddress, 
  connectWallet, 
  disconnectWallet,
  getBalance,
  transfer,
  getTokenInfo
} = useWeb3();

const balance = ref('0');
const tokenInfo = ref(null);
const recipientAddress = ref('');
const transferAmount = ref('');
const loading = ref(false);
const error = ref('');
const success = ref('');

const handleConnect = async () => {
  try {
    loading.value = true;
    error.value = '';
    await connectWallet();
    await loadBalance();
    await loadTokenInfo();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const loadBalance = async () => {
  if (account.value) {
    try {
      balance.value = await getBalance(account.value);
    } catch (err) {
      console.error('Error loading balance:', err);
    }
  }
};

const loadTokenInfo = async () => {
  try {
    tokenInfo.value = await getTokenInfo();
  } catch (err) {
    console.error('Error loading token info:', err);
  }
};

const handleTransfer = async () => {
  try {
    loading.value = true;
    error.value = '';
    success.value = '';
    
    await transfer(recipientAddress.value, transferAmount.value);
    success.value = `Successfully transferred ${transferAmount.value} ${tokenInfo.value?.symbol || 'DN'}!`;
    
    await loadBalance();
    recipientAddress.value = '';
    transferAmount.value = '';
    
    // Clear success message after 5 seconds
    setTimeout(() => {
      success.value = '';
    }, 5000);
  } catch (err) {
    error.value = err.message || 'Transfer failed. Please try again.';
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  // Auto-connect if already connected
  if (window.ethereum && window.ethereum.selectedAddress) {
    await handleConnect();
  }
});
</script>

<template>
  <div class="min-h-screen p-4 sm:p-8">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <header class="text-center mb-12 animate-fade-in">
        <div class="mb-6">
          <div class="inline-block p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full backdrop-blur-sm border border-white/10 mb-4">
            <svg class="w-16 h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        <h1 class="text-5xl sm:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Web3 DApp
        </h1>
        <p class="text-gray-300 text-lg sm:text-xl">Modern Token Management System</p>
        <p v-if="tokenInfo" class="text-gray-400 text-sm mt-2">
          {{ tokenInfo.name }} ({{ tokenInfo.symbol }})
        </p>
      </header>

      <!-- Connect Wallet Card -->
      <div class="backdrop-blur-lg bg-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 mb-8 border border-white/20 hover:border-white/30 transition-all">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="text-center sm:text-left">
            <h2 class="text-2xl font-semibold mb-2">
              {{ isConnected ? '🟢 Connected' : '🔴 Not Connected' }}
            </h2>
            <p class="text-gray-300 text-sm sm:text-base">
              {{ isConnected ? 'Your wallet is connected' : 'Connect your MetaMask wallet to get started' }}
            </p>
          </div>
          
          <button
            @click="isConnected ? disconnectWallet() : handleConnect()"
            :disabled="loading"
            class="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <span v-if="loading">⏳ Loading...</span>
            <span v-else-if="isConnected">🔌 Disconnect {{ shortAddress }}</span>
            <span v-else>🔗 Connect Wallet</span>
          </button>
        </div>
      </div>

      <!-- Global Error Message -->
      <div v-if="error && !isConnected" class="mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-xl backdrop-blur-lg animate-shake">
        <div class="flex items-start gap-3">
          <span class="text-2xl">⚠️</span>
          <div class="flex-1">
            <p class="text-red-300 font-medium">{{ error }}</p>
          </div>
          <button @click="error = ''" class="text-red-300 hover:text-red-100">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Balance Card -->
      <div v-if="isConnected" class="backdrop-blur-lg bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-2xl shadow-2xl p-8 mb-8 border border-white/20 hover:border-white/30 transition-all">
        <div class="text-center">
          <p class="text-gray-300 mb-2 text-sm uppercase tracking-wider">Your Balance</p>
          <h3 class="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent mb-2">
            {{ balance }} {{ tokenInfo?.symbol || 'DN' }}
          </h3>
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg mt-4">
            <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <p class="text-xs text-gray-400 font-mono">{{ account }}</p>
          </div>
        </div>
      </div>

      <!-- Transfer Card -->
      <div v-if="isConnected" class="backdrop-blur-lg bg-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/20 hover:border-white/30 transition-all">
        <div class="flex items-center gap-3 mb-6">
          <div class="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
            <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <h2 class="text-2xl font-semibold">Transfer Tokens</h2>
        </div>
        
        <form @submit.prevent="handleTransfer" class="space-y-6">
          <div>
            <label class="block text-sm font-medium mb-2 text-gray-300">
              Recipient Address
            </label>
            <input
              v-model="recipientAddress"
              type="text"
              placeholder="0x..."
              class="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-500 font-mono text-sm"
              required
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2 text-gray-300">
              Amount ({{ tokenInfo?.symbol || 'DN' }})
            </label>
            <div class="relative">
              <input
                v-model="transferAmount"
                type="number"
                step="0.000001"
                placeholder="0.0"
                class="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-500"
                required
              />
              <button
                type="button"
                @click="transferAmount = balance"
                class="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-xs font-medium transition-all"
              >
                MAX
              </button>
            </div>
            <p class="text-xs text-gray-400 mt-2">Available: {{ balance }} {{ tokenInfo?.symbol || 'DN' }}</p>
          </div>

          <button
            type="submit"
            :disabled="loading || !recipientAddress || !transferAmount"
            class="w-full px-8 py-4 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl font-semibold hover:from-green-600 hover:to-blue-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
          >
            <svg v-if="loading" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ loading ? 'Processing Transaction...' : '🚀 Send Tokens' }}</span>
          </button>
        </form>

        <!-- Transaction Messages -->
        <div v-if="error" class="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl backdrop-blur-lg animate-shake">
          <div class="flex items-start gap-3">
            <span class="text-xl">❌</span>
            <p class="text-red-300 flex-1">{{ error }}</p>
          </div>
        </div>
        
        <div v-if="success" class="mt-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl backdrop-blur-lg animate-bounce-in">
          <div class="flex items-start gap-3">
            <span class="text-xl">✅</span>
            <p class="text-green-300 flex-1">{{ success }}</p>
          </div>
        </div>
      </div>

      <!-- Feature Cards -->
      <div class="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mt-12">
        <div class="backdrop-blur-lg bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group">
          <div class="text-4xl mb-4 group-hover:scale-110 transition-transform">🔒</div>
          <h3 class="font-semibold mb-2 text-lg">Secure</h3>
          <p class="text-sm text-gray-400">Built with industry-standard security practices and audited smart contracts</p>
        </div>
        
        <div class="backdrop-blur-lg bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group">
          <div class="text-4xl mb-4 group-hover:scale-110 transition-transform">⚡</div>
          <h3 class="font-semibold mb-2 text-lg">Fast</h3>
          <p class="text-sm text-gray-400">Lightning-fast transactions on the blockchain with minimal gas fees</p>
        </div>
        
        <div class="backdrop-blur-lg bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group">
          <div class="text-4xl mb-4 group-hover:scale-110 transition-transform">🌐</div>
          <h3 class="font-semibold mb-2 text-lg">Decentralized</h3>
          <p class="text-sm text-gray-400">Fully decentralized and transparent smart contract system</p>
        </div>
      </div>

      <!-- Footer -->
      <footer class="text-center mt-12 text-gray-400 text-sm">
        <p>Built with Vue.js, Web3.js, Hardhat & Tailwind CSS</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out;
}

.animate-shake {
  animation: shake 0.3s ease-in-out;
}

.animate-bounce-in {
  animation: bounce-in 0.5s ease-out;
}
</style>