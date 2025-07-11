# Zecrypt Browser Extension Setup

## Environment Configuration

⚠️ **SECURITY NOTICE**: This extension requires proper environment configuration to work securely. Never commit sensitive keys to version control.

### Development Setup

1. **Create Environment File**
   
   Create a `.env` file in the `packages/Extenstions/` directory:
   
   ```bash
   cd packages/Extenstions/
   cp .env.example .env  # If example exists, or create manually
   ```

2. **Configure Environment Variables**
   
   Add the following to your `.env` file:
   
   ```
   INDEXED_DB_AES_KEY="HxmfPmPwqQZ3gHKwfHXi6TmPwVDppr0oDKyPwCdopDI="
   ```
   
   **Note**: The key should match the `NEXT_PUBLIC_INDEXED_DB_AES_KEY` from the frontend-web `.env.local` file.

3. **Verify Setup**
   
   - The `.env` file should NOT be committed to git (it's already in `.gitignore`)
   - Check that the extension loads without console errors
   - Verify that crypto operations work correctly

### Production Deployment

For production environments, consider:

1. **Build-time Injection**: Use a build script to inject environment variables
2. **Secure Key Management**: Use proper secrets management systems
3. **Key Rotation**: Implement regular key rotation procedures

### File Structure

```
packages/Extenstions/
├── .env                 # Your environment file (NOT committed)
├── .gitignore          # Ensures .env is ignored
├── config.js           # Configuration loader
├── crypto-utils.js     # Crypto utilities (uses config)
├── background.js       # Background script (initializes config)
└── ... other files
```

### Troubleshooting

**Error: "Extension configuration not loaded"**
- Ensure `.env` file exists in the extensions directory
- Check that `INDEXED_DB_AES_KEY` is properly set in `.env`
- Verify the key format (should be base64 encoded)

**Error: "Configuration key not found"**
- Check that the key in `.env` matches exactly: `INDEXED_DB_AES_KEY`
- Ensure there are no extra spaces or characters
- Verify the file is saved properly

**Error: "Invalid encryption key format"**
- The key should be a valid base64 string
- Check that the key length is correct (32 bytes when decoded)
- Ensure the key matches the one used in the web application

### Security Best Practices

1. **Never hardcode keys** in source code
2. **Use different keys** for different environments (dev/staging/prod)
3. **Rotate keys regularly** and update all environments
4. **Restrict access** to environment files and key management systems
5. **Monitor usage** and implement key usage auditing

### Getting the Key

The `INDEXED_DB_AES_KEY` should be obtained from:
1. Your development team's secure key management system
2. The frontend-web application's environment configuration
3. Your organization's secrets management platform

Contact your development team if you don't have access to the required keys. 