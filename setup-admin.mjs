import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read .env.local file manually
const envPath = join(__dirname, '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const mongoUriMatch = envContent.match(/MONGODB_URI=(.+)/)
const MONGODB_URI = mongoUriMatch ? mongoUriMatch[1].trim() : null

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local')
  process.exit(1)
}

console.log('📝 Using MongoDB URI from .env.local')

// User Schema (simplified)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['patient', 'admin', 'doctor'], default: 'patient' },
  firstName: String,
  lastName: String,
  dateOfBirth: String,
  gender: String,
  phone: String,
  address: String,
  city: String,
  state: String,
  zipCode: String,
  bloodType: String,
  emergencyContact: String,
  verified: { type: Boolean, default: false }
}, { timestamps: true })

const User = mongoose.models.User || mongoose.model('User', userSchema)

async function setupAdmin() {
  try {
    console.log('🔗 Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@healthportal.com' })
    
    if (existingAdmin) {
      console.log('📝 Updating existing user to admin role...')
      existingAdmin.role = 'admin'
      await existingAdmin.save()
      console.log('✅ Updated admin@healthportal.com to admin role!')
      console.log(`   Email: ${existingAdmin.email}`)
      console.log(`   Role: ${existingAdmin.role}`)
      console.log(`   Password: Admin123! (use this to login)\n`)
    } else {
      console.log('👤 Creating new admin user...')
      const hashedPassword = await bcrypt.hash('Admin123!', 12)
      
      const admin = await User.create({
        email: 'admin@healthportal.com',
        password: hashedPassword,
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        dateOfBirth: '1990-01-01',
        gender: 'other',
        phone: '1234567890',
        address: '123 Admin Street',
        city: 'Admin City',
        state: 'AC',
        zipCode: '12345',
        bloodType: 'O+',
        emergencyContact: 'Emergency Admin',
        verified: true
      })

      console.log('✅ Admin user created successfully!')
      console.log(`   Email: ${admin.email}`)
      console.log(`   Password: Admin123!`)
      console.log(`   Role: ${admin.role}\n`)
    }

    // Also check for demo user
    const demoUser = await User.findOne({ email: 'demo@example.com' })
    if (demoUser && demoUser.role !== 'admin') {
      console.log('📝 Demo user found with role:', demoUser.role)
      console.log('   Email: demo@example.com')
      console.log('   Password: password123\n')
    }

    console.log('🎉 Setup complete!')
    console.log('\n📋 LOGIN CREDENTIALS:')
    console.log('   Admin: admin@healthportal.com / Admin123!')
    console.log('   Demo: demo@example.com / password123')
    console.log('\n🔗 Login at: http://localhost:3000/auth/login\n')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await mongoose.connection.close()
    console.log('🔌 Database connection closed')
  }
}

setupAdmin()
