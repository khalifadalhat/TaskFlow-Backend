import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User';
import readline from 'readline';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI as string;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function resetAdminPassword() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const adminUsers = await User.find({ role: 'admin' }).select('email firstName lastName');

    if (adminUsers.length === 0) {
      console.log('❌ No admin users found in database');
      rl.close();
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('👑 Select an admin user to reset password:');
    adminUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} - ${user.firstName} ${user.lastName}`);
    });

    rl.question('\nEnter number (or email) of user to reset: ', async input => {
      let selectedUser;

      if (/^\d+$/.test(input)) {
        const index = parseInt(input) - 1;
        if (index >= 0 && index < adminUsers.length) {
          selectedUser = adminUsers[index];
        }
      } else {
        selectedUser = adminUsers.find(user => user.email === input);
      }

      if (!selectedUser) {
        console.log('❌ Invalid selection');
        rl.close();
        await mongoose.disconnect();
        process.exit(1);
      }

      const user = await User.findById(selectedUser._id);
      if (!user) {
        console.log('❌ User not found');
        rl.close();
        await mongoose.disconnect();
        process.exit(1);
      }

      rl.question(`\nReset password for ${user.email}? (yes/no): `, async confirm => {
        if (confirm.toLowerCase() !== 'yes') {
          console.log('⏭️  Operation cancelled');
          rl.close();
          await mongoose.disconnect();
          process.exit(0);
        }

        const newPassword = await new Promise<string>(resolve => {
          rl.question('Enter new password (min 6 chars): ', resolve);
        });

        if (newPassword.length < 6) {
          console.log('❌ Password must be at least 6 characters');
          rl.close();
          await mongoose.disconnect();
          process.exit(1);
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        console.log('\n✅ Password reset successfully!');
        console.log(`📧 Email: ${user.email}`);
        console.log(`🔐 New Password: ${newPassword}`);
        console.log(`👤 Name: ${user.firstName} ${user.lastName}`);
        console.log(`🆔 ID: ${user._id}`);
        console.log('\n⚠️  User must login with the new password immediately.');

        rl.close();
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('❌ Error:', error);
    rl.close();
    await mongoose.disconnect();
    process.exit(1);
  }
}

resetAdminPassword();
