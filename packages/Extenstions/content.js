// Detect forms and set up autofill buttons
function detectForms() {
  // Look for credit card forms
  const cardNumberInputs = document.querySelectorAll('input[autocomplete="cc-number"], input[name*="card_number"], input[name*="cardNumber"], input[id*="card-number"], input[id*="cardNumber"]');
  
  // Look for username/login inputs
  const usernameInputs = document.querySelectorAll('input[type="email"], input[type="text"][name*="username"], input[type="text"][name*="user"], input[type="text"][name*="login"], input[type="text"][id*="username"], input[type="text"][id*="user"], input[type="text"][id*="login"], input[name*="email"], input[id*="email"]');
  
  // Process card number inputs
  cardNumberInputs.forEach(input => {
    setupAutofillButton(input, 'card');
  });
  
  // Process username inputs
  usernameInputs.forEach(input => {
    setupAutofillButton(input, 'account');
  });
}

// Create and position an autofill button next to an input
function setupAutofillButton(input, type) {
  // Check if button already exists for this input
  const existingButton = input.nextElementSibling;
  if (existingButton && existingButton.classList.contains('zecrypt-autofill-btn')) {
    return;
  }
  
  // Create button
  const button = document.createElement('button');
  button.innerText = 'Zecrypt';
  button.classList.add('zecrypt-autofill-btn');
  button.style.cssText = 'position: absolute; z-index: 9999; padding: 3px 8px; margin-left: 5px; background-color: #4f46e5; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;';
  
  // Position button
  const inputRect = input.getBoundingClientRect();
  const inputStyle = window.getComputedStyle(input);
  
  // Insert button after input
  input.parentNode.insertBefore(button, input.nextSibling);
  
  // Add click handler
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fetchAndFillData(type, input);
  });
}

// Fetch data from Zecrypt and fill the form
function fetchAndFillData(type, input) {
  // Request data from background script
  chrome.runtime.sendMessage({
    type: 'GET_DATA',
    dataType: type
  }, (response) => {
    if (response && response.success) {
      if (type === 'card') {
        // Always show card selector for user confirmation
        showCardSelector(input, response.data);
      } else if (type === 'account') {
        // Always show account selector for user confirmation
        showAccountSelector(input, response.data);
      }
    } else {
      // Show error or prompt to log in
      console.error('Failed to get data:', response?.error || 'Unknown error');
    }
  });
}

// Show account selector UI when multiple accounts are available
function showAccountSelector(input, accounts) {
  // Remove any existing selector
  removeAccountSelector();
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'zecrypt-account-selector-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999999;
    display: flex;
    justify-content: center;
    align-items: center;
  `;
  
  // Create modal
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white;
    border-radius: 8px;
    padding: 20px;
    max-width: 400px;
    min-width: 300px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;
  
  // Create header
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 12px;
  `;
  
  const title = document.createElement('h3');
  title.textContent = 'Select Account';
  title.style.cssText = `
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  `;
  
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #6b7280;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  closeBtn.addEventListener('click', removeAccountSelector);
  
  header.appendChild(title);
  header.appendChild(closeBtn);
  
  // Create account list
  const accountList = document.createElement('div');
  accountList.style.cssText = `
    max-height: 300px;
    overflow-y: auto;
  `;
  
  accounts.forEach((account, index) => {
    const accountItem = document.createElement('div');
    accountItem.style.cssText = `
      padding: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: all 0.2s;
      background: #f9fafb;
    `;
    
    accountItem.addEventListener('mouseenter', () => {
      accountItem.style.backgroundColor = '#f3f4f6';
      accountItem.style.borderColor = '#4f46e5';
    });
    
    accountItem.addEventListener('mouseleave', () => {
      accountItem.style.backgroundColor = '#f9fafb';
      accountItem.style.borderColor = '#e5e7eb';
    });
    
    accountItem.addEventListener('click', () => {
      fillAccountData(input, account);
      removeAccountSelector();
    });
    
    const accountUsername = document.createElement('div');
    accountUsername.textContent = account.username || 'No username';
    accountUsername.style.cssText = `
      font-weight: 500;
      color: #1f2937;
      margin-bottom: 4px;
    `;
    
    const accountTitle = document.createElement('div');
    const website = account.website || account.url || '';
    let displayText = account.title || account.name || 'Untitled Account';
    if (website) {
      try {
        const domain = new URL(website).hostname.replace('www.', '');
        displayText += ` • ${domain}`;
      } catch (e) {
        displayText += ` • ${website}`;
      }
    }
    accountTitle.textContent = displayText;
    accountTitle.style.cssText = `
      font-size: 14px;
      color: #6b7280;
    `;
    
    accountItem.appendChild(accountUsername);
    accountItem.appendChild(accountTitle);
    accountList.appendChild(accountItem);
  });
  
  // Assemble modal
  modal.appendChild(header);
  modal.appendChild(accountList);
  overlay.appendChild(modal);
  
  // Add to page
  document.body.appendChild(overlay);
  
  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      removeAccountSelector();
    }
  });
  
  // Close on escape key
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      removeAccountSelector();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);
}

// Remove account selector UI
function removeAccountSelector() {
  const overlay = document.getElementById('zecrypt-account-selector-overlay');
  if (overlay) {
    overlay.remove();
  }
}

// Show card selector UI when multiple cards are available
function showCardSelector(input, cards) {
  // Remove any existing selector
  removeCardSelector();
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'zecrypt-card-selector-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999999;
    display: flex;
    justify-content: center;
    align-items: center;
  `;
  
  // Create modal
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white;
    border-radius: 8px;
    padding: 20px;
    max-width: 450px;
    min-width: 350px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;
  
  // Create header
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 12px;
  `;
  
  const title = document.createElement('h3');
  title.textContent = 'Select Payment Card';
  title.style.cssText = `
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  `;
  
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #6b7280;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  closeBtn.addEventListener('click', removeCardSelector);
  
  header.appendChild(title);
  header.appendChild(closeBtn);
  
  // Create card list
  const cardList = document.createElement('div');
  cardList.style.cssText = `
    max-height: 350px;
    overflow-y: auto;
  `;
  
  cards.forEach((card, index) => {
    const cardItem = document.createElement('div');
    cardItem.style.cssText = `
      padding: 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: all 0.2s;
      background: #f9fafb;
      position: relative;
    `;
    
    cardItem.addEventListener('mouseenter', () => {
      cardItem.style.backgroundColor = '#f3f4f6';
      cardItem.style.borderColor = '#4f46e5';
      cardItem.style.transform = 'translateY(-1px)';
    });
    
    cardItem.addEventListener('mouseleave', () => {
      cardItem.style.backgroundColor = '#f9fafb';
      cardItem.style.borderColor = '#e5e7eb';
      cardItem.style.transform = 'translateY(0)';
    });
    
    cardItem.addEventListener('click', () => {
      fillCardData(input, card);
      removeCardSelector();
    });
    
    // Card title
    const cardTitle = document.createElement('div');
    cardTitle.textContent = card.title || 'Untitled Card';
    cardTitle.style.cssText = `
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
      font-size: 16px;
    `;
    
    // Card number (masked)
    const cardNumber = document.createElement('div');
    const maskedNumber = card.last4 ? 
      `•••• •••• •••• ${card.last4}` : 
      (card.cardNumber ? `•••• •••• •••• ${card.cardNumber.slice(-4)}` : '•••• •••• •••• ••••');
    cardNumber.textContent = maskedNumber;
    cardNumber.style.cssText = `
      font-family: 'Courier New', monospace;
      font-size: 16px;
      color: #374151;
      margin-bottom: 8px;
      letter-spacing: 1px;
    `;
    
    // Card details row
    const cardDetails = document.createElement('div');
    cardDetails.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    
    // Cardholder name
    const cardName = document.createElement('div');
    cardName.textContent = card.name || 'Cardholder Name';
    cardName.style.cssText = `
      font-size: 14px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `;
    
    // Expiry date
    const cardExpiry = document.createElement('div');
    cardExpiry.textContent = card.expiry || 'MM/YY';
    cardExpiry.style.cssText = `
      font-size: 14px;
      color: #6b7280;
      font-family: 'Courier New', monospace;
    `;
    
    cardDetails.appendChild(cardName);
    cardDetails.appendChild(cardExpiry);
    
    cardItem.appendChild(cardTitle);
    cardItem.appendChild(cardNumber);
    cardItem.appendChild(cardDetails);
    cardList.appendChild(cardItem);
  });
  
  // Assemble modal
  modal.appendChild(header);
  modal.appendChild(cardList);
  overlay.appendChild(modal);
  
  // Add to page
  document.body.appendChild(overlay);
  
  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      removeCardSelector();
    }
  });
  
  // Close on escape key
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      removeCardSelector();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);
}

// Remove card selector UI
function removeCardSelector() {
  const overlay = document.getElementById('zecrypt-card-selector-overlay');
  if (overlay) {
    overlay.remove();
  }
}

// Fill card data into form
function fillCardData(input, cardData) {
  // Fill card number
  input.value = cardData.cardNumber;
  triggerInputEvent(input);
  
  // Define search scope: the form, or the whole document as a fallback
  const searchScope = input.closest('form') || document;
    
  // Name on card - enhanced selectors (optional field)
  const nameInputs = searchScope.querySelectorAll('input[name*="name" i], input[autocomplete="cc-name"], input[id*="card-holder" i], input[placeholder*="Name on Card" i], input[id*="cardholder" i], input[name*="holder" i]');
  if (nameInputs.length > 0 && cardData.name) {
    nameInputs[0].value = cardData.name;
    triggerInputEvent(nameInputs[0]);
  }
  
  // Handle expiry date - check for separate month/year dropdowns first
  const monthSelects = searchScope.querySelectorAll('select[name="month" i], select[name*="exp_month" i], select[name*="expiry_month" i], select[id*="month" i], select[autocomplete="cc-exp-month"]');
  const yearSelects = searchScope.querySelectorAll('select[name="year" i], select[name*="exp_year" i], select[name*="expiry_year" i], select[id*="year" i], select[autocomplete="cc-exp-year"]');
  
  if (monthSelects.length > 0 && yearSelects.length > 0 && cardData.expiry) {
    // Handle separate month/year dropdowns
    const expiryParts = cardData.expiry.split('/');
    if (expiryParts.length === 2) {
      const month = expiryParts[0].trim().padStart(2, '0');
      const year = expiryParts[1].trim();
      
      // Fill month dropdown
      const monthSelect = monthSelects[0];
      const monthOption = monthSelect.querySelector(`option[value="${month}"]`);
      if (monthOption) {
        monthSelect.value = month;
        triggerInputEvent(monthSelect);
      }
      
      // Fill year dropdown (try both 2-digit and 4-digit year formats)
      const yearSelect = yearSelects[0];
      let yearOption = yearSelect.querySelector(`option[value="${year}"]`);
      if (!yearOption && year.length === 2) {
        // Try with 20xx prefix for 2-digit years
        const fullYear = '20' + year;
        yearOption = yearSelect.querySelector(`option[value="${fullYear}"]`);
        if (yearOption) {
          yearSelect.value = fullYear;
          triggerInputEvent(yearSelect);
        }
      } else if (yearOption) {
        yearSelect.value = year;
        triggerInputEvent(yearSelect);
      }
    }
  } else {
    // Handle single expiry input field (fallback to original logic)
    const expiryInputs = searchScope.querySelectorAll('input[name*="expir" i], input[autocomplete="cc-exp"], input[id*="expiry" i], input[placeholder*="MM / YY" i], input[placeholder*="MM/YY" i], input[name*="exp" i], input[id*="exp" i]');
    if (expiryInputs.length > 0 && cardData.expiry) {
      expiryInputs[0].value = cardData.expiry;
      triggerInputEvent(expiryInputs[0]);
    }
  }
  
  // CVV - enhanced selectors
  const cvvInputs = searchScope.querySelectorAll('input[name*="cvv" i], input[name*="cvc" i], input[autocomplete="cc-csc"], input[id*="cvc" i], input[placeholder*="CVV" i], input[placeholder*="CVC" i], input[id*="cvv" i]');
  if (cvvInputs.length > 0 && cardData.cvv) {
    cvvInputs[0].value = cardData.cvv;
    triggerInputEvent(cvvInputs[0]);
  }
}

// Fill account data into form
function fillAccountData(input, accountData) {
  // Fill the username (could be email or username field)
  input.value = accountData.username;
  triggerInputEvent(input);

  // Define search scope: the form, or the whole document as a fallback
  const searchScope = input.closest('form') || document;
  
  // Find and fill the password field
  const passwordInputs = searchScope.querySelectorAll('input[type="password"], input[name="Passwd"], input[name*="password" i], input[autocomplete="current-password"], input[id*="password" i]');
  if (passwordInputs.length > 0) {
    // Find the first visible password input
    const visiblePasswordInput = Array.from(passwordInputs).find(el => el.offsetParent !== null);
    if (visiblePasswordInput && accountData.password) {
      visiblePasswordInput.value = accountData.password;
      triggerInputEvent(visiblePasswordInput);
    }
  }
}

// Trigger change and input events to ensure form validation recognizes the change
function triggerInputEvent(element) {
  const inputEvent = new Event('input', { bubbles: true });
  const changeEvent = new Event('change', { bubbles: true });
  
  // For select elements, focus first to ensure proper state
  if (element.tagName.toLowerCase() === 'select') {
    element.focus();
  }
  
  element.dispatchEvent(inputEvent);
  element.dispatchEvent(changeEvent);
  
  // For select elements, also trigger blur to ensure validation
  if (element.tagName.toLowerCase() === 'select') {
    const blurEvent = new Event('blur', { bubbles: true });
    element.dispatchEvent(blurEvent);
  }
}

// Run detection when page loads and on DOM changes
detectForms();

// Use MutationObserver to detect dynamically added forms
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length) {
      detectForms();
    }
  }
});

// Start observing
observer.observe(document.body, { childList: true, subtree: true });

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FILL_DATA' && message.data) {
    // Handle targeted fill requests
    if (message.dataType === 'card') {
      const cardInputs = document.querySelectorAll('input[autocomplete="cc-number"], input[name*="card_number"], input[name*="cardNumber"], input[id*="card-number"], input[id*="cardNumber"]');
      if (cardInputs.length > 0) {
        fillCardData(cardInputs[0], message.data);
      }
    } else if (message.dataType === 'account') {
      const usernameInputs = document.querySelectorAll('input[type="email"], input[type="text"][name*="username"], input[type="text"][name*="user"], input[type="text"][name*="login"], input[type="text"][id*="username"], input[type="text"][id*="user"], input[type="text"][id*="login"], input[name*="email"], input[id*="email"]');
      if (usernameInputs.length > 0) {
        fillAccountData(usernameInputs[0], message.data);
      }
    }
    
    sendResponse({ success: true });
  }
  return true;
}); 