const fs = require('fs');
const path = require('path');

// Get the English translations as the source
const englishTranslationsPath = path.join(__dirname, 'messages', 'en', 'common.json');
const englishTranslations = JSON.parse(fs.readFileSync(englishTranslationsPath, 'utf8'));

// Get all language directories
const messagesDir = path.join(__dirname, 'messages');
const languageDirs = fs.readdirSync(messagesDir)
  .filter(dir => dir !== 'en' && fs.statSync(path.join(messagesDir, dir)).isDirectory());

console.log('Updating translation files for these languages:', languageDirs);

// Process each language
languageDirs.forEach(lang => {
  const langFilePath = path.join(messagesDir, lang, 'common.json');
  
  // Skip if the language doesn't have a common.json file
  if (!fs.existsSync(langFilePath)) {
    console.log(`${lang}: No common.json file found. Creating one...`);
    // Create directory if it doesn't exist
    if (!fs.existsSync(path.join(messagesDir, lang))) {
      fs.mkdirSync(path.join(messagesDir, lang));
    }
    // Copy the English file as a starting point
    fs.writeFileSync(langFilePath, JSON.stringify(englishTranslations, null, 2));
    console.log(`${lang}: Created new translation file with English as fallback.`);
    return;
  }
  
  try {
    // Read the current translations
    const langTranslations = JSON.parse(fs.readFileSync(langFilePath, 'utf8'));
    
    // Function to recursively update missing keys
    function updateMissingKeys(source, target, path = '') {
      let updated = false;
      
      for (const key in source) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (!(key in target)) {
          // Key is missing completely
          target[key] = source[key];
          console.log(`${lang}: Added missing key: ${currentPath}`);
          updated = true;
        } else if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
          // It's a nested object, recursively check
          if (typeof target[key] !== 'object' || Array.isArray(target[key])) {
            // The key exists but is not an object in the target
            target[key] = {};
            console.log(`${lang}: Replaced non-object value with object at: ${currentPath}`);
          }
          
          const nestedUpdated = updateMissingKeys(source[key], target[key], currentPath);
          updated = updated || nestedUpdated;
        }
      }
      
      return updated;
    }
    
    // Update the translations with missing keys
    const updated = updateMissingKeys(englishTranslations, langTranslations);
    
    if (updated) {
      // Write the updated translations back to the file
      fs.writeFileSync(langFilePath, JSON.stringify(langTranslations, null, 2));
      console.log(`${lang}: Updated translation file with missing keys.`);
    } else {
      console.log(`${lang}: No missing keys found.`);
    }
  } catch (error) {
    console.error(`${lang}: Error processing translation file:`, error);
  }
});

console.log('Translation update completed!'); 