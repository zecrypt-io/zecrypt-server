document.addEventListener('DOMContentLoaded', () => {
  // UI elements
  const loginSection = document.getElementById('loginSection');
  const contentSection = document.getElementById('contentSection');
  const loadingSection = document.getElementById('loadingSection');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const cardsList = document.getElementById('cardsList');
  const accountsList = document.getElementById('accountsList');
  
  // Configuration will be loaded when needed
  let BASE_URL = null;
  
  // Function to get web app base URL
  function getWebAppBaseUrl() {
    if (!BASE_URL) {
      try {
        // Try to get from extension config
        if (chrome.extension.getBackgroundPage() && 
            chrome.extension.getBackgroundPage().ExtensionConfig && 
            chrome.extension.getBackgroundPage().ExtensionConfig.isConfigLoaded()) {
          BASE_URL = chrome.extension.getBackgroundPage().ExtensionConfig.getWebAppBaseUrl();
        } else {
          // Fallback to production URL
          BASE_URL = 'https://app.zecrypt.io';
        }
      } catch (error) {
        console.warn('Could not load config, using fallback URL:', error);
        BASE_URL = 'https://app.zecrypt.io';
      }
    }
    return BASE_URL;
  }
  // Listen for messages from the extension login page
  window.addEventListener('message', (event) => {
    // Verify origin for security (in production, be more specific)
    if (event.data && (event.data.type === 'LOGIN' || event.data.type === 'ZECRYPT_LOGIN')) {
      // Store the authentication data
      chrome.runtime.sendMessage({
        type: 'LOGIN',
        token: event.data.token,
        workspaceId: event.data.workspaceId,
        projectId: event.data.projectId
      }, (response) => {
        if (response && response.success) {
          // Refresh the popup UI
          showAuthenticatedUI();
          fetchData();
        }
      });
    }
  });

  // Listen for auth success from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'AUTH_SUCCESS') {
      // Refresh the popup UI
      checkAuthAndUpdateUI();
    }
  });

  function checkAuthAndUpdateUI() {
    chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }, (response) => {
      if (response && response.isAuthenticated) {
        showAuthenticatedUI();
        fetchData();
      } else {
        showUnauthenticatedUI();
      }
    });
  }    // Check authentication status when popup opens
  checkAuthAndUpdateUI();
  
  // Handle auth status updates (for future use)
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'AUTH_STATUS') {
      if (message.isAuthenticated) {
        showAuthenticatedUI();
        fetchData();
      } else {
        showUnauthenticatedUI();
      }
    }
  });  // Configuration for development vs production
  const isDevelopment = false; // Set to false for production
  // Login button click handler
  loginBtn.addEventListener('click', () => {
    // Start auth checking in background
    chrome.runtime.sendMessage({ type: 'START_AUTH_CHECK' });
    
    // Open the extension login page in a new tab (with locale prefix)
    chrome.tabs.create({ url: `${getWebAppBaseUrl()}/en/extension-login?from=extension` });
  });
    // Logout button click handler
  logoutBtn.addEventListener('click', () => {
    // Stop any ongoing auth check
    chrome.runtime.sendMessage({ type: 'STOP_AUTH_CHECK' });
    
    chrome.runtime.sendMessage({ type: 'LOGOUT' }, (response) => {
      if (response && response.success) {
        showUnauthenticatedUI();
      }
    });
  });
  
  // Show UI for authenticated users
  function showAuthenticatedUI() {
    loginSection.style.display = 'none';
    loadingSection.style.display = 'block';
    contentSection.style.display = 'none';
    logoutBtn.style.display = 'flex';
  }
  
  // Show UI for unauthenticated users
  function showUnauthenticatedUI() {
    loginSection.style.display = 'block';
    loadingSection.style.display = 'none';
    contentSection.style.display = 'none';
    logoutBtn.style.display = 'none';
    
    // Clear any existing data
    cardsList.innerHTML = '';
    accountsList.innerHTML = '';
  }
    // Fetch cards and accounts data
  function fetchData() {
    // Show loading indicator
    loadingSection.style.display = 'block';
    contentSection.style.display = 'none';
    
    // Fetch cards and accounts in parallel
    Promise.all([
      new Promise((resolve) => {
        chrome.runtime.sendMessage({ 
          type: 'FETCH_DATA',
          dataType: 'cards'
        }, (response) => {
          resolve(response || { success: false, error: 'No response' });
        });
      }),
      new Promise((resolve) => {
        chrome.runtime.sendMessage({ 
          type: 'FETCH_DATA',
          dataType: 'accounts'
        }, (response) => {
          resolve(response || { success: false, error: 'No response' });
        });
      })
    ]).then(([cardsResponse, accountsResponse]) => {
      // Hide loading indicator
      loadingSection.style.display = 'none';
      contentSection.style.display = 'block';
      
      // Render data
      if (cardsResponse && cardsResponse.success) {
        renderCards(cardsResponse.data);
      } else {
        renderCards([]);
        console.error('Failed to fetch cards:', cardsResponse?.error);
      }
      
      if (accountsResponse && accountsResponse.success) {
        renderAccounts(accountsResponse.data);
      } else {
        renderAccounts([]);
        console.error('Failed to fetch accounts:', accountsResponse?.error);
      }
    });
  }
  
  // Render card items
  function renderCards(cards) {
    cardsList.innerHTML = '';
    
    if (!cards || cards.length === 0) {
      cardsList.innerHTML = '<div class="empty-state">No credit cards found</div>';
      return;
    }
    
    cards.forEach(card => {
      const cardItem = document.createElement('div');
      cardItem.className = 'item';
      
      const cardName = card.title || 'Unknown Card';
      const last4 = card.last4 || '****';
      const expiry = (card.expMonth && card.expYear) ? `${card.expMonth}/${card.expYear}` : 'N/A';
      
      cardItem.innerHTML = `
        <div class="item-primary">${cardName}</div>
        <div class="item-secondary">•••• •••• •••• ${last4} • ${expiry}</div>
      `;
      
      cardsList.appendChild(cardItem);
    });
  }
  
  // Render account items
  function renderAccounts(accounts) {
    accountsList.innerHTML = '';
    
    if (!accounts || accounts.length === 0) {
      accountsList.innerHTML = '<div class="empty-state">No accounts found</div>';
      return;
    }
    
    accounts.forEach(account => {
      const accountItem = document.createElement('div');
      accountItem.className = 'item';
      
      const accountName = account.title || account.name || 'Unknown Account';
      const username = account.username || 'No username';
      const website = account.website || account.url || '';
      
      // Show website domain if available
      let displayText = username;
      if (website) {
        try {
          const domain = new URL(website).hostname.replace('www.', '');
          displayText = `${username} • ${domain}`;
        } catch (e) {
          displayText = `${username} • ${website}`;
        }
      }
      
      accountItem.innerHTML = `
        <div class="item-primary">${accountName}</div>
        <div class="item-secondary">${displayText}</div>
      `;
      
      accountsList.appendChild(accountItem);
    });
  }
}); 