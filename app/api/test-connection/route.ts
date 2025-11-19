import { NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import mongoose from 'mongoose'

export async function GET() {
  try {
    console.log('🔍 Testing MongoDB connection...')
    
    // Attempt to connect
    await connectDB()
    
    // Get connection details
    const connection = mongoose.connection
    
    if (!connection.db) {
      throw new Error('Database connection not established')
    }
    
    // Get database stats
    const dbStats = await connection.db.stats()
    
    // List collections
    const collections = await connection.db.listCollections().toArray()
    
    // Count documents in each collection
    const collectionCounts: Record<string, number> = {}
    for (const col of collections) {
      const count = await connection.db.collection(col.name).countDocuments()
      collectionCounts[col.name] = count
    }
    
    const response = {
      success: true,
      message: '✅ MongoDB is connected and working!',
      connection: {
        status: 'Connected',
        readyState: connection.readyState,
        host: connection.host,
        port: connection.port,
        database: connection.db.databaseName
      },
      database: {
        collections: collections.length,
        totalSize: `${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`,
        collectionList: collections.map(c => c.name),
        documentCounts: collectionCounts
      },
      timestamp: new Date().toISOString()
    }
    
    console.log('✅ Database connection test passed!')
    
    return NextResponse.json(response)
    
  } catch (error: any) {
    console.error('❌ Database connection test failed:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: '❌ Database connection failed',
        error: error.message,
        details: {
          name: error.name,
          code: error.code,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        troubleshooting: [
          'Check MONGODB_URI in .env.local',
          'Verify IP address is whitelisted in MongoDB Atlas',
          'Ensure database credentials are correct',
          'Check network connectivity'
        ]
      },
      { status: 500 }
    )
  }
}
