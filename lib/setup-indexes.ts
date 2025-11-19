// MongoDB Database Indexes Setup
// Run this to create text indexes for search functionality

import connectDB from './db'
import { Appointment, MedicalRecord, Vaccination, HealthUpdate, User } from './models'

export async function setupDatabaseIndexes() {
  try {
    await connectDB()

    console.log('Creating database indexes...')

    // Appointment indexes
    try {
      await Appointment.collection.createIndex({ 
        doctorName: 'text', 
        specialty: 'text', 
        location: 'text',
        notes: 'text'
      }, { 
        name: 'appointment_search_index',
        weights: {
          doctorName: 10,
          specialty: 5,
          location: 3,
          notes: 1
        }
      })
      console.log('✓ Appointment text index created')
    } catch (err: any) {
      if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
        console.log('✓ Appointment text index already exists')
      } else {
        throw err
      }
    }

    // Additional indexes for sorting and filtering
    await Appointment.collection.createIndex({ userId: 1, date: -1 })
    await Appointment.collection.createIndex({ userId: 1, status: 1, date: -1 })
    console.log('✓ Appointment compound indexes created')

    // Medical Record indexes
    try {
      await MedicalRecord.collection.createIndex({ 
        title: 'text', 
        provider: 'text', 
        description: 'text'
      }, { 
        name: 'medical_record_search_index',
        weights: {
          title: 10,
          provider: 5,
          description: 1
        }
      })
      console.log('✓ Medical Record text index created')
    } catch (err: any) {
      if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
        console.log('✓ Medical Record text index already exists')
      } else {
        throw err
      }
    }

    await MedicalRecord.collection.createIndex({ userId: 1, date: -1 })
    await MedicalRecord.collection.createIndex({ userId: 1, type: 1, date: -1 })
    await MedicalRecord.collection.createIndex({ userId: 1, confidential: 1 })
    console.log('✓ Medical Record compound indexes created')

    // Vaccination indexes
    try {
      await Vaccination.collection.createIndex({ 
        vaccineName: 'text', 
        provider: 'text', 
        notes: 'text'
      }, { 
        name: 'vaccination_search_index',
        weights: {
          vaccineName: 10,
          provider: 5,
          notes: 1
        }
      })
      console.log('✓ Vaccination text index created')
    } catch (err: any) {
      if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
        console.log('✓ Vaccination text index already exists')
      } else {
        throw err
      }
    }

    await Vaccination.collection.createIndex({ userId: 1, date: -1 })
    await Vaccination.collection.createIndex({ userId: 1, nextDueDate: 1 })
    console.log('✓ Vaccination compound indexes created')

    // Health Update indexes
    try {
      await HealthUpdate.collection.createIndex({ 
        title: 'text', 
        content: 'text', 
        summary: 'text'
      }, { 
        name: 'health_update_search_index',
        weights: {
          title: 10,
          summary: 5,
          content: 1
        }
      })
      console.log('✓ Health Update text index created')
    } catch (err: any) {
      if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
        console.log('✓ Health Update text index already exists')
      } else {
        throw err
      }
    }

    await HealthUpdate.collection.createIndex({ publishedDate: -1 })
    await HealthUpdate.collection.createIndex({ category: 1, publishedDate: -1 })
    await HealthUpdate.collection.createIndex({ severity: 1, publishedDate: -1 })
    console.log('✓ Health Update compound indexes created')

    // User indexes (email index already exists from schema)
    await User.collection.createIndex({ role: 1 })
    console.log('✓ User indexes verified')

    console.log('\n✅ All database indexes created successfully!')
    console.log('Search performance is now optimized.')

    return { success: true, message: 'Indexes created successfully' }

  } catch (error: any) {
    console.error('❌ Error creating indexes:', error)
    throw error
  }
}

// Auto-run if executed directly
setupDatabaseIndexes()
  .then(() => {
    console.log('\nIndex setup complete. You can now close this.')
    process.exit(0)
  })
  .catch(err => {
    console.error('\nIndex setup failed:', err)
    process.exit(1)
  })

