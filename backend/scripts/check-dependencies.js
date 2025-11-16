/**
 * Check Dependencies Script for MindGuard
 * 
 * This script checks for missing dependencies and suggests fixes.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define required modules for different components
const requiredBackendModules = [
  { name: 'express', version: '^4.17.1' },
  { name: 'mongoose', version: '^7.0.0' },
  { name: 'bcryptjs', version: '^2.4.3' },
  { name: 'jsonwebtoken', version: '^9.0.0' },
  { name: 'dotenv', version: '^16.0.0' },
  { name: 'cors', version: '^2.8.5' },
  { name: 'express-validator', version: '^7.0.0' }
];

const requiredFrontendModules = [
  { name: 'jsonwebtoken', version: '^9.0.0' },
  { name: '@types/jsonwebtoken', version: '^9.0.0' }
];

// Terminal colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function checkPackageJson(packagePath, requiredModules) {
  try {
    // Read package.json
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const missingModules = [];
    
    // Check for missing modules
    for (const module of requiredModules) {
      if (!dependencies[module.name]) {
        missingModules.push(module);
      }
    }
    
    return missingModules;
  } catch (error) {
    console.error(`${colors.red}Error reading package.json: ${error.message}${colors.reset}`);
    return null;
  }
}

function installModules(directory, modules) {
  try {
    if (modules.length === 0) return true;
    
    // Format modules as npm install arguments
    const moduleArgs = modules.map(m => `${m.name}@${m.version}`).join(' ');
    
    console.log(`${colors.cyan}Installing missing modules: ${moduleArgs}${colors.reset}`);
    
    // Execute npm install command
    execSync(`cd "${directory}" && npm install ${moduleArgs}`, { stdio: 'inherit' });
    
    return true;
  } catch (error) {
    console.error(`${colors.red}Error installing modules: ${error.message}${colors.reset}`);
    return false;
  }
}

function checkFrontendNextConfig() {
  // Determine path to frontend directory
  const rootDir = path.resolve(__dirname, '../..');
  const frontendDir = path.join(rootDir, 'frontend');
  const nextConfigPath = path.join(frontendDir, 'next.config.js');
  
  try {
    // First check if frontend directory exists
    if (!fs.existsSync(frontendDir)) {
      console.log(`${colors.yellow}WARNING: Frontend directory not found at ${frontendDir}${colors.reset}`);
      return false;
    }
    
    // Check if next.config.js exists
    if (!fs.existsSync(nextConfigPath)) {
      console.log(`${colors.yellow}WARNING: next.config.js not found. Creating...${colors.reset}`);
      
      const nextConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Resolve jsonwebtoken and other Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer'),
    };
    
    return config;
  },
};

module.exports = nextConfig;
`;
      
      fs.writeFileSync(nextConfigPath, nextConfigContent);
      console.log(`${colors.green}Created next.config.js with proper fallbacks${colors.reset}`);
      
      // Also need to install the fallback packages
      installModules(frontendDir, [
        { name: 'crypto-browserify', version: '^3.12.0' },
        { name: 'stream-browserify', version: '^3.0.0' },
        { name: 'buffer', version: '^6.0.3' }
      ]);
      
      return true;
    }
    
    // Next config exists, check if it has proper fallbacks
    const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
    
    if (!nextConfigContent.includes('crypto-browserify') || 
        !nextConfigContent.includes('stream-browserify') || 
        !nextConfigContent.includes('buffer')) {
      
      console.log(`${colors.yellow}WARNING: next.config.js is missing proper fallbacks for JWT${colors.reset}`);
      
      // Install the fallback packages if needed
      installModules(frontendDir, [
        { name: 'crypto-browserify', version: '^3.12.0' },
        { name: 'stream-browserify', version: '^3.0.0' },
        { name: 'buffer', version: '^6.0.3' }
      ]);
      
      console.log(`${colors.yellow}Please update your next.config.js to include proper fallbacks:${colors.reset}`);
      console.log(`
config.resolve.fallback = {
  ...config.resolve.fallback,
  fs: false,
  net: false,
  tls: false,
  crypto: require.resolve('crypto-browserify'),
  stream: require.resolve('stream-browserify'),
  buffer: require.resolve('buffer'),
};
      `);
    }
    
    return true;
  } catch (error) {
    console.error(`${colors.red}Error checking next.config.js: ${error.message}${colors.reset}`);
    return false;
  }
}

function main() {
  console.log(`${colors.bright}${colors.blue}===== MindGuard Dependency Checker =====${colors.reset}`);
  
  // Get root directory
  const rootDir = path.resolve(__dirname, '../..');
  const backendDir = path.join(rootDir, 'backend');
  const frontendDir = path.join(rootDir, 'frontend');
  
  // Check backend dependencies
  console.log(`\n${colors.bright}Checking backend dependencies...${colors.reset}`);
  const backendPackagePath = path.join(backendDir, 'package.json');
  const missingBackendModules = checkPackageJson(backendPackagePath, requiredBackendModules);
  
  if (missingBackendModules === null) {
    console.log(`${colors.red}Failed to check backend dependencies${colors.reset}`);
  } else if (missingBackendModules.length === 0) {
    console.log(`${colors.green}Backend dependencies: All required modules are installed!${colors.reset}`);
  } else {
    console.log(`${colors.yellow}Missing backend modules: ${missingBackendModules.map(m => m.name).join(', ')}${colors.reset}`);
    
    // Install missing backend modules
    console.log(`${colors.bright}Installing missing backend modules...${colors.reset}`);
    installModules(backendDir, missingBackendModules);
  }
  
  // Check frontend dependencies
  console.log(`\n${colors.bright}Checking frontend dependencies...${colors.reset}`);
  const frontendPackagePath = path.join(frontendDir, 'package.json');
  
  if (!fs.existsSync(frontendPackagePath)) {
    console.log(`${colors.yellow}Frontend package.json not found at ${frontendPackagePath}${colors.reset}`);
  } else {
    const missingFrontendModules = checkPackageJson(frontendPackagePath, requiredFrontendModules);
    
    if (missingFrontendModules === null) {
      console.log(`${colors.red}Failed to check frontend dependencies${colors.reset}`);
    } else if (missingFrontendModules.length === 0) {
      console.log(`${colors.green}Frontend dependencies: All required modules are installed!${colors.reset}`);
    } else {
      console.log(`${colors.yellow}Missing frontend modules: ${missingFrontendModules.map(m => m.name).join(', ')}${colors.reset}`);
      
      // Install missing frontend modules
      console.log(`${colors.bright}Installing missing frontend modules...${colors.reset}`);
      installModules(frontendDir, missingFrontendModules);
    }
    
    // Check Next.js config
    console.log(`\n${colors.bright}Checking Next.js configuration...${colors.reset}`);
    checkFrontendNextConfig();
  }
  
  console.log(`\n${colors.bright}${colors.green}Dependency check completed!${colors.reset}`);
}

main(); 