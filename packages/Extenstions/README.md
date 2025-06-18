# Zecrypt Chrome Extension

This Chrome extension allows users to autofill card and email details from their Zecrypt account into web forms.

## Features

- Autofill credit card information in payment forms
- Autofill email addresses in login and registration forms
- Secure authentication with the Zecrypt web app
- Encrypted storage of sensitive data

## Setup

### Development Setup

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the `packages/Extenstions` directory
5. Note the Extension ID assigned by Chrome (you'll need it for the next step)
6. Update the `EXTENSION_ID` constant in `packages/frontend-web/app/extension-login/page.tsx` with your extension ID

### Frontend Setup

The extension requires the Zecrypt web app to have an extension-login route for authentication. This route has been added to the frontend-web package.

## Usage

### Authentication

1. Click on the Zecrypt extension icon in the Chrome toolbar
2. Click "Login to Zecrypt"
3. If you're not already logged in, the web app will prompt you to log in
4. After logging in, the web app will send your authentication token to the extension
5. You will see a success message when authentication is complete

### Autofilling Forms

#### Card Information

1. When on a page with a credit card form, the extension will detect the form fields
2. Click on the "Zecrypt" button next to the card number field
3. The extension will fill in your card details

#### Email Addresses

1. When on a page with an email field, the extension will detect the field
2. Click on the "Zecrypt" button next to the email field
3. The extension will fill in your email address

## Security Considerations

- The extension stores your authentication token securely using `chrome.storage.local`
- No credentials are stored in the extension; only the authentication token
- API requests to fetch data are made directly from the extension to the Zecrypt API
- Data is only fetched when needed and not stored persistently in the extension

## Development Notes

### Extension Structure

- `manifest.json`: Chrome extension configuration
- `background.js`: Background service worker for handling authentication and API requests
- `content.js`: Content script for detecting forms and handling autofill
- `popup.html` & `popup.js`: Extension popup UI
- `api-service.js`: Service for making API requests to the Zecrypt backend

### Adding Icons

Before publishing, add your icon files to the `icons` directory:
- icon16.png (16x16)
- icon48.png (48x48)
- icon128.png (128x128)

### Publishing

1. Update the version number in `manifest.json`
2. Zip the contents of the `Extenstions` directory
3. Upload to the Chrome Web Store Developer Dashboard
4. After publishing, update the `EXTENSION_ID` in the web app with the published extension ID 