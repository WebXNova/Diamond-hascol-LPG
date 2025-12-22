/**
 * Fix .env File Script
 * Automatically fixes Cloudinary environment variable formatting
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');

console.log('🔧 Fixing .env file...\n');

try {
  // Read current .env file
  let envContent = fs.readFileSync(envPath, 'utf8');
  const originalContent = envContent;
  
  console.log('Current .env content:');
  console.log('─────────────────────────────────────────');
  console.log(envContent);
  console.log('─────────────────────────────────────────\n');
  
  // Fix Cloudinary variables
  const fixes = [];
  
  // Fix CLOUDINARY_CLOUD_NAME (remove spaces around =)
  if (envContent.includes('CLOUDINARY_CLOUD_NAME =')) {
    envContent = envContent.replace(/CLOUDINARY_CLOUD_NAME\s*=\s*(.+)/, (match, value) => {
      fixes.push('Fixed CLOUDINARY_CLOUD_NAME: removed spaces around =');
      return `CLOUDINARY_CLOUD_NAME=${value.trim()}`;
    });
  }
  
  // Fix CLOUDINARY_API_KEY (remove spaces around =)
  if (envContent.includes('CLOUDINARY_API_KEY =')) {
    envContent = envContent.replace(/CLOUDINARY_API_KEY\s*=\s*(.+)/, (match, value) => {
      fixes.push('Fixed CLOUDINARY_API_KEY: removed spaces around =');
      return `CLOUDINARY_API_KEY=${value.trim()}`;
    });
  }
  
  // Fix CLOUDINARY_API_SECRET (remove spaces and extract secret from malformed value)
  if (envContent.includes('CLOUDINARY_API_SECRET')) {
    const secretMatch = envContent.match(/CLOUDINARY_API_SECRET\s*=\s*(.+)/);
    if (secretMatch) {
      let secretValue = secretMatch[1].trim();
      
      // Check if it contains CLOUDINARY_URL format
      if (secretValue.includes('cloudinary://')) {
        // Extract secret from URL format: cloudinary://api_key:secret@cloud_name
        const urlMatch = secretValue.match(/cloudinary:\/\/[^:]+:([^@]+)@/);
        if (urlMatch) {
          secretValue = urlMatch[1];
          fixes.push('Fixed CLOUDINARY_API_SECRET: extracted secret from CLOUDINARY_URL format');
        } else {
          // Try to extract from CLOUDINARY_URL= format
          const urlFormatMatch = secretValue.match(/CLOUDINARY_URL=cloudinary:\/\/[^:]+:([^@]+)@/);
          if (urlFormatMatch) {
            secretValue = urlFormatMatch[1];
            fixes.push('Fixed CLOUDINARY_API_SECRET: extracted secret from CLOUDINARY_URL= format');
          } else {
            console.warn('⚠️  Could not extract secret from malformed value. Please set it manually.');
            console.warn(`   Current value: ${secretValue.substring(0, 50)}...`);
            console.warn('   Expected format: CLOUDINARY_API_SECRET=your_secret_here');
            return secretMatch[0]; // Keep original, user must fix manually
          }
        }
      }
      
      envContent = envContent.replace(/CLOUDINARY_API_SECRET\s*=\s*.+/, `CLOUDINARY_API_SECRET=${secretValue.trim()}`);
    }
  }
  
  // Fix other variables with spaces (PORT, DB_NAME, etc.)
  envContent = envContent.replace(/(\w+)\s*=\s*(.+)/g, (match, key, value) => {
    if (key !== 'CLOUDINARY_CLOUD_NAME' && key !== 'CLOUDINARY_API_KEY' && key !== 'CLOUDINARY_API_SECRET') {
      const trimmed = value.trim();
      if (match !== `${key}=${trimmed}`) {
        fixes.push(`Fixed ${key}: removed spaces around =`);
        return `${key}=${trimmed}`;
      }
    }
    return match;
  });
  
  if (fixes.length > 0) {
    // Write fixed content
    fs.writeFileSync(envPath, envContent, 'utf8');
    
    console.log('✅ Fixed .env file!');
    console.log('\nChanges made:');
    fixes.forEach(fix => console.log(`   • ${fix}`));
    
    console.log('\n📝 Fixed .env content:');
    console.log('─────────────────────────────────────────');
    console.log(envContent);
    console.log('─────────────────────────────────────────\n');
    
    console.log('⚠️  IMPORTANT: Restart your backend server for changes to take effect!');
    console.log('   Run: cd backend && npm start\n');
  } else {
    console.log('✅ .env file appears to be correctly formatted already.');
    console.log('   If you\'re still getting errors, check:');
    console.log('   1. CLOUDINARY_API_SECRET contains ONLY the secret (not CLOUDINARY_URL=...)');
    console.log('   2. No spaces around = signs');
    console.log('   3. Backend server was restarted after .env changes\n');
  }
  
} catch (error) {
  console.error('❌ Error fixing .env file:', error.message);
  console.error('\nPlease fix manually:');
  console.error('1. Open backend/.env');
  console.error('2. Remove spaces around = signs');
  console.error('3. Fix CLOUDINARY_API_SECRET to contain ONLY the secret value');
  console.error('4. Restart backend server\n');
  process.exit(1);
}

