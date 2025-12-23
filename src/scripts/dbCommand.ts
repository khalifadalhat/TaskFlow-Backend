#!/usr/bin/env node

import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('🗄️  Database Management Commands');
console.log('='.repeat(30));
console.log('1. Seed Admin User (single)');
console.log('2. Seed All Users (admin, manager, developer, designer)');
console.log('3. Interactive User Creation');
console.log('4. Reset Admin Password');
console.log('5. List All Users');
console.log('0. Exit');
console.log('');

rl.question('Select option (0-5): ', option => {
  switch (option) {
    case '1':
      console.log('\nRunning: npm run seed:admin');
      execSync('npm run seed:admin', { stdio: 'inherit' });
      break;
    case '2':
      console.log('\nRunning: npm run seed:users');
      execSync('npm run seed:users', { stdio: 'inherit' });
      break;
    case '3':
      console.log('\nRunning: npm run seed:interactive');
      execSync('npm run seed:interactive', { stdio: 'inherit' });
      break;
    case '4':
      console.log('\nRunning: npm run reset:admin');
      execSync('npm run reset:admin', { stdio: 'inherit' });
      break;
    case '5':
      console.log('\nRunning: List all users...');
      execSync(
        "npx ts-node -e \"import mongoose from 'mongoose'; import dotenv from 'dotenv'; import User from './src/models/User'; dotenv.config(); (async () => { await mongoose.connect(process.env.MONGO_URI!); const users = await User.find().select('email firstName lastName role isVerified createdAt'); console.log(users.map(u => ({ email: u.email, name: `${u.firstName} ${u.lastName}`, role: u.role, verified: u.isVerified, created: u.createdAt }))); await mongoose.disconnect(); })()\"",
        { stdio: 'inherit' }
      );
      break;
    case '0':
      console.log('Exiting...');
      break;
    default:
      console.log('❌ Invalid option');
  }

  rl.close();
});
