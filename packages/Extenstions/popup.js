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
  chrome.runtime.sendMessage({ type: 'CHECK_AUTH' });
  
  // Handle auth status updates
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
  
  // Login button click handler
  loginBtn.addEventListener('click', () => {
    // Open the extension login page in a new tab
    chrome.tabs.create({ url: 'https://app.zecrypt.com/extension-login?from=extension' });
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
    
    // First fetch cards
    chrome.runtime.sendMessage({ 
      type: 'FETCH_DATA',
      dataType: 'cards'
    }, (cardsResponse) => {
      // Then fetch emails
      chrome.runtime.sendMessage({ 
        type: 'FETCH_DATA',
        dataType: 'emails'
      }, (emailsResponse) => {
        // Hide loading indicator
        loadingSection.style.display = 'none';
        contentSection.style.display = 'block';
        
        // Render data
        if (cardsResponse && cardsResponse.success) {
          renderCards(cardsResponse.data);
        }
        
        if (emailsResponse && emailsResponse.success) {
          renderEmails(emailsResponse.data);
        }
      });
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