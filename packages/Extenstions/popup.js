document.addEventListener('DOMContentLoaded', () => {
  // UI elements
  const loginSection = document.getElementById('loginSection');
  const contentSection = document.getElementById('contentSection');
  const loadingSection = document.getElementById('loadingSection');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const cardsList = document.getElementById('cardsList');
  const emailsList = document.getElementById('emailsList');
    // Check authentication status when popup opens
  chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }, (response) => {
    if (response && response.isAuthenticated) {
      showAuthenticatedUI();
      fetchData();
    } else {
      showUnauthenticatedUI();
    }
  });
  
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
  });
  // Configuration for development vs production
  const isDevelopment = true; // Set to false for production
  const BASE_URL = isDevelopment 
    ? 'http://localhost:3000' 
    : 'https://app.zecrypt.com';
  
  // Login button click handler
  loginBtn.addEventListener('click', () => {
    // Open the extension login page in a new tab (with locale prefix)
    chrome.tabs.create({ url: `${BASE_URL}/en/extension-login?from=extension` });
  });
  
  // Logout button click handler
  logoutBtn.addEventListener('click', () => {
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
    logoutBtn.style.display = 'block';
  }
  
  // Show UI for unauthenticated users
  function showUnauthenticatedUI() {
    loginSection.style.display = 'block';
    loadingSection.style.display = 'none';
    contentSection.style.display = 'none';
    logoutBtn.style.display = 'none';
    
    // Clear any existing data
    cardsList.innerHTML = '';
    emailsList.innerHTML = '';
  }
    // Fetch cards and emails data
  function fetchData() {
    // Show loading indicator
    loadingSection.style.display = 'block';
    contentSection.style.display = 'none';
    
    // Fetch cards and emails in parallel
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
          dataType: 'emails'
        }, (response) => {
          resolve(response || { success: false, error: 'No response' });
        });
      })
    ]).then(([cardsResponse, emailsResponse]) => {
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
      
      if (emailsResponse && emailsResponse.success) {
        renderEmails(emailsResponse.data);
      } else {
        renderEmails([]);
        console.error('Failed to fetch emails:', emailsResponse?.error);
      }
    });
  }
  
  // Render card items
  function renderCards(cards) {
    cardsList.innerHTML = '';
    
    if (!cards || cards.length === 0) {
      cardsList.innerHTML = '<p>No cards found</p>';
      return;
    }
    
    cards.forEach(card => {
      const cardItem = document.createElement('div');
      cardItem.className = 'card-item';
      cardItem.innerHTML = `
        <div><strong>${card.name || 'Card'}</strong></div>
        <div>**** **** **** ${card.last4}</div>
        <div>${card.expMonth}/${card.expYear}</div>
      `;
      
      // Add click handler
      cardItem.addEventListener('click', () => {
        // Send message to active tab to autofill this card
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'FILL_DATA',
            dataType: 'card',
            data: card
          });
          window.close(); // Close popup after selection
        });
      });
      
      cardsList.appendChild(cardItem);
    });
  }
  
  // Render email items
  function renderEmails(emails) {
    emailsList.innerHTML = '';
    
    if (!emails || emails.length === 0) {
      emailsList.innerHTML = '<p>No emails found</p>';
      return;
    }
    
    emails.forEach(email => {
      const emailItem = document.createElement('div');
      emailItem.className = 'email-item';
      emailItem.innerHTML = `
        <div><strong>${email.email}</strong></div>
        <div>${email.name || ''}</div>
      `;
      
      // Add click handler
      emailItem.addEventListener('click', () => {
        // Send message to active tab to autofill this email
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'FILL_DATA',
            dataType: 'email',
            data: email
          });
          window.close(); // Close popup after selection
        });
      });
      
      emailsList.appendChild(emailItem);
    });
  }
}); 