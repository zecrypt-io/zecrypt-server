// Detect forms and set up autofill buttons
function detectForms() {
  // Look for credit card forms
  const cardNumberInputs = document.querySelectorAll('input[autocomplete="cc-number"], input[name*="card_number"], input[name*="cardNumber"], input[id*="card-number"], input[id*="cardNumber"]');
  
  // Look for email inputs
  const emailInputs = document.querySelectorAll('input[type="email"], input[name*="email"], input[id*="email"]');
  
  // Process card number inputs
  cardNumberInputs.forEach(input => {
    setupAutofillButton(input, 'card');
  });
  
  // Process email inputs
  emailInputs.forEach(input => {
    setupAutofillButton(input, 'email');
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
        // Check if there are multiple cards
        if (response.multiple && response.data.length > 1) {
          showCardSelector(input, response.data);
        } else {
          // Single card, fill directly
          fillCardData(input, response.data[0] || response.data);
        }
      } else if (type === 'email') {
        // Check if there are multiple emails
        if (response.multiple && response.data.length > 1) {
          showEmailSelector(input, response.data);
        } else {
          // Single email, fill directly
          fillEmailData(input, response.data[0] || response.data);
        }
      }
    } else {
      // Show error or prompt to log in
      console.error('Failed to get data:', response?.error || 'Unknown error');
    }
  });
}

// Show email selector UI when multiple emails are available
function showEmailSelector(input, emails) {
  // Remove any existing selector
  removeEmailSelector();
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'zecrypt-email-selector-overlay';
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
  title.textContent = 'Select Email Account';
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
  closeBtn.addEventListener('click', removeEmailSelector);
  
  header.appendChild(title);
  header.appendChild(closeBtn);
  
  // Create email list
  const emailList = document.createElement('div');
  emailList.style.cssText = `
    max-height: 300px;
    overflow-y: auto;
  `;
  
  emails.forEach((email, index) => {
    const emailItem = document.createElement('div');
    emailItem.style.cssText = `
      padding: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: all 0.2s;
      background: #f9fafb;
    `;
    
    emailItem.addEventListener('mouseenter', () => {
      emailItem.style.backgroundColor = '#f3f4f6';
      emailItem.style.borderColor = '#4f46e5';
    });
    
    emailItem.addEventListener('mouseleave', () => {
      emailItem.style.backgroundColor = '#f9fafb';
      emailItem.style.borderColor = '#e5e7eb';
    });
    
    emailItem.addEventListener('click', () => {
      fillEmailData(input, email);
      removeEmailSelector();
    });
    
    const emailAddress = document.createElement('div');
    emailAddress.textContent = email.email || 'No email address';
    emailAddress.style.cssText = `
      font-weight: 500;
      color: #1f2937;
      margin-bottom: 4px;
    `;
    
    const emailTitle = document.createElement('div');
    emailTitle.textContent = email.title || 'Untitled Email';
    emailTitle.style.cssText = `
      font-size: 14px;
      color: #6b7280;
    `;
    
    emailItem.appendChild(emailAddress);
    emailItem.appendChild(emailTitle);
    emailList.appendChild(emailItem);
  });
  
  // Assemble modal
  modal.appendChild(header);
  modal.appendChild(emailList);
  overlay.appendChild(modal);
  
  // Add to page
  document.body.appendChild(overlay);
  
  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      removeEmailSelector();
    }
  });
  
  // Close on escape key
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      removeEmailSelector();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);
}

// Remove email selector UI
function removeEmailSelector() {
  const overlay = document.getElementById('zecrypt-email-selector-overlay');
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
    
  // Name on card - enhanced selectors
  const nameInputs = searchScope.querySelectorAll('input[name*="name" i], input[autocomplete="cc-name"], input[id*="card-holder" i], input[placeholder*="Name on Card" i], input[id*="cardholder" i], input[name*="holder" i]');
  if (nameInputs.length > 0) {
    nameInputs[0].value = cardData.name;
    triggerInputEvent(nameInputs[0]);
  }
  
  // Expiry date - enhanced selectors
  const expiryInputs = searchScope.querySelectorAll('input[name*="expir" i], input[autocomplete="cc-exp"], input[id*="expiry" i], input[placeholder*="MM / YY" i], input[placeholder*="MM/YY" i], input[name*="exp" i], input[id*="exp" i]');
  if (expiryInputs.length > 0) {
    expiryInputs[0].value = cardData.expiry;
    triggerInputEvent(expiryInputs[0]);
  }
  
  // CVV - enhanced selectors
  const cvvInputs = searchScope.querySelectorAll('input[name*="cvv" i], input[name*="cvc" i], input[autocomplete="cc-csc"], input[id*="cvc" i], input[placeholder*="CVV" i], input[placeholder*="CVC" i], input[id*="cvv" i]');
  if (cvvInputs.length > 0) {
    cvvInputs[0].value = cardData.cvv;
    triggerInputEvent(cvvInputs[0]);
  }
}

// Fill email data into form
function fillEmailData(input, emailData) {
  // Fill the email address
  input.value = emailData.email;
  triggerInputEvent(input);

  // Define search scope: the form, or the whole document as a fallback
  const searchScope = input.closest('form') || document;
  
  // Find and fill the password field
  const passwordInputs = searchScope.querySelectorAll('input[type="password"], input[name="Passwd"], input[name*="password" i], input[autocomplete="current-password"], input[id*="password" i]');
  if (passwordInputs.length > 0) {
    // Find the first visible password input
    const visiblePasswordInput = Array.from(passwordInputs).find(el => el.offsetParent !== null);
    if (visiblePasswordInput) {
      visiblePasswordInput.value = emailData.password;
      triggerInputEvent(visiblePasswordInput);
    }
  }
}

// Trigger change and input events to ensure form validation recognizes the change
function triggerInputEvent(element) {
  const inputEvent = new Event('input', { bubbles: true });
  const changeEvent = new Event('change', { bubbles: true });
  
  element.dispatchEvent(inputEvent);
  element.dispatchEvent(changeEvent);
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
    } else if (message.dataType === 'email') {
      const emailInputs = document.querySelectorAll('input[type="email"], input[name*="email"], input[id*="email"]');
      if (emailInputs.length > 0) {
        fillEmailData(emailInputs[0], message.data);
      }
    }
    
    sendResponse({ success: true });
  }
  return true;
}); 