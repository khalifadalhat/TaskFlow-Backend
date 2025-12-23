import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI as string;

const adminData = {
  email: 'admin@taskflow.com',
  password: 'Admin123!',
  firstName: 'System',
  lastName: 'Administrator',
  role: 'admin' as const,
  isVerified: true,
  profilePicture: '',
  skills: ['management', 'administration'],
  availability: true,
};

async function seedAdmin() {
  try {
    console.log('🔗 Connecting to MongoDB...');

    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const existingAdmin = await User.findOne({ email: adminData.email });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`👤 Role: ${existingAdmin.role}`);
      console.log(`🆔 ID: ${existingAdmin._id}`);

      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      readline.question(
        'Do you want to reset admin password? (yes/no): ',
        async (answer: string) => {
          if (answer.toLowerCase() === 'yes') {
            const hashedPassword = await bcrypt.hash(adminData.password, 10);
            existingAdmin.password = hashedPassword;
            await existingAdmin.save();
            console.log('✅ Admin password reset successfully');
            console.log(`🔐 New password: ${adminData.password}`);
          }
          readline.close();
          await mongoose.disconnect();
          process.exit(0);
        }
      );

      return;
    }

    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    const adminUser = new User({
      ...adminData,
      password: hashedPassword,
    });

    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('📋 Admin Details:');
    console.log(`📧 Email: ${adminData.email}`);
    console.log(`🔐 Password: ${adminData.password}`);
    console.log(`👤 Name: ${adminData.firstName} ${adminData.lastName}`);
    console.log(`🎭 Role: ${adminData.role}`);
    console.log(`🆔 ID: ${adminUser._id}`);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedAdmin();
