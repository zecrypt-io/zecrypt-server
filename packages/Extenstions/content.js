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
        fillCardData(input, response.data);
      } else if (type === 'email') {
        fillEmailData(input, response.data);
      }
    } else {
      // Show error or prompt to log in
      console.error('Failed to get data:', response?.error || 'Unknown error');
    }
  });
}

// Fill card data into form
function fillCardData(input, cardData) {
  // Fill card number
  input.value = cardData.cardNumber;
  triggerInputEvent(input);
  
  // Try to find and fill related fields
  const form = input.closest('form');
  if (form) {
    // Name on card
    const nameInputs = form.querySelectorAll('input[name*="name"], input[autocomplete="cc-name"]');
    if (nameInputs.length > 0) {
      nameInputs[0].value = cardData.name;
      triggerInputEvent(nameInputs[0]);
    }
    
    // Expiry date
    const expiryInputs = form.querySelectorAll('input[name*="expir"], input[autocomplete="cc-exp"]');
    if (expiryInputs.length > 0) {
      expiryInputs[0].value = cardData.expiry;
      triggerInputEvent(expiryInputs[0]);
    }
    
    // CVV
    const cvvInputs = form.querySelectorAll('input[name*="cvv"], input[name*="cvc"], input[autocomplete="cc-csc"]');
    if (cvvInputs.length > 0) {
      cvvInputs[0].value = cardData.cvv;
      triggerInputEvent(cvvInputs[0]);
    }
  }
}

// Fill email data into form
function fillEmailData(input, emailData) {
  input.value = emailData.email;
  triggerInputEvent(input);
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