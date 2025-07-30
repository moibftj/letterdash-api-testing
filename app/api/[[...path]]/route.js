import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import OpenAI from 'openai'
import { Resend } from 'resend'

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// MongoDB connection
let client
let db

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  return db
}

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// Helper function to verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    return null
  }
}

// Helper function to generate random coupon code
function generateCouponCode() {
  return Math.random().toString(36).substr(2, 9).toUpperCase()
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()

    // Root endpoint
    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ message: "Talk To My Lawyer API is running!" }))
    }

    // AUTH ROUTES
    // Register - POST /api/auth/register
    if (route === '/auth/register' && method === 'POST') {
      const { email, password, name, role = 'user' } = await request.json()
      
      // Check if user already exists
      const existingUser = await db.collection('users').findOne({ email })
      if (existingUser) {
        return handleCORS(NextResponse.json({ error: 'User already exists' }, { status: 400 }))
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)
      
      // Create user
      const user = {
        id: uuidv4(),
        email,
        password: hashedPassword,
        name,
        role,
        subscription_status: 'free',
        created_at: new Date()
      }

      await db.collection('users').insertOne(user)

      // Create role-specific profile
      if (role === 'contractor') {
        await db.collection('contractors').insertOne({
          id: uuidv4(),
          user_id: user.id,
          points: 0,
          total_signups: 0,
          created_at: new Date()
        })
      } else if (role === 'admin') {
        await db.collection('admins').insertOne({
          id: uuidv4(),
          user_id: user.id,
          permissions: ['manage_users', 'manage_contractors', 'manage_letters'],
          created_at: new Date()
        })
      }

      const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })
      
      return handleCORS(NextResponse.json({ 
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        token 
      }))
    }

    // Login - POST /api/auth/login
    if (route === '/auth/login' && method === 'POST') {
      const { email, password } = await request.json()
      
      const user = await db.collection('users').findOne({ email })
      if (!user || !await bcrypt.compare(password, user.password)) {
        return handleCORS(NextResponse.json({ error: 'Invalid credentials' }, { status: 401 }))
      }

      const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })
      
      return handleCORS(NextResponse.json({ 
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        token 
      }))
    }

    // Get current user - GET /api/auth/me
    if (route === '/auth/me' && method === 'GET') {
      const authHeader = request.headers.get('authorization')
      if (!authHeader) {
        return handleCORS(NextResponse.json({ error: 'No token provided' }, { status: 401 }))
      }

      const token = authHeader.split(' ')[1]
      const decoded = verifyToken(token)
      
      if (!decoded) {
        return handleCORS(NextResponse.json({ error: 'Invalid token' }, { status: 401 }))
      }

      const user = await db.collection('users').findOne({ id: decoded.userId })
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'User not found' }, { status: 404 }))
      }

      return handleCORS(NextResponse.json({ 
        user: { id: user.id, email: user.email, name: user.name, role: user.role, subscription_status: user.subscription_status }
      }))
    }

    // LETTER ROUTES
    // Generate letter - POST /api/letters/generate
    if (route === '/letters/generate' && method === 'POST') {
      const authHeader = request.headers.get('authorization')
      if (!authHeader) {
        return handleCORS(NextResponse.json({ error: 'No token provided' }, { status: 401 }))
      }

      const token = authHeader.split(' ')[1]
      const decoded = verifyToken(token)
      
      if (!decoded) {
        return handleCORS(NextResponse.json({ error: 'Invalid token' }, { status: 401 }))
      }

      const { title, prompt, letterType = 'general', formData = {}, urgencyLevel = 'standard', totalPrice = 49.00 } = await request.json()

      // Enhanced system prompt for professional letter generation
      const systemPrompt = `You are a professional legal letter writer and paralegal assistant working for Talk To My Lawyer. Generate formal, professional, and legally appropriate letters based on the provided information. 
      
      Guidelines:
      - Use formal business letter format with proper headers and structure
      - Include sender and recipient information when provided
      - Be direct, professional, and clear in communication
      - Use appropriate legal language where applicable
      - Include relevant dates and specific details
      - Ensure the letter achieves the stated objective
      - Maintain a professional but firm tone when appropriate
      - Sign letters as coming from Talk To My Lawyer legal team`

      // Enhanced user prompt with structured information
      const enhancedPrompt = `
      Generate a professional ${letterType} letter with the following details:

      ${prompt}

      ${formData.fullName ? `Sender: ${formData.fullName}` : ''}
      ${formData.yourAddress ? `Sender Address: ${formData.yourAddress}` : ''}
      ${formData.recipientName ? `Recipient: ${formData.recipientName}` : ''}
      ${formData.recipientAddress ? `Recipient Address: ${formData.recipientAddress}` : ''}
      ${formData.briefDescription ? `Situation: ${formData.briefDescription}` : ''}
      ${formData.detailedInformation ? `Details: ${formData.detailedInformation}` : ''}
      ${formData.whatToAchieve ? `Desired Outcome: ${formData.whatToAchieve}` : ''}
      ${urgencyLevel !== 'standard' ? `Urgency: ${urgencyLevel}` : ''}

      Please format this as a complete, professional letter ready to send.
      `

      try {
        // Generate letter with OpenAI
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: enhancedPrompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.7
        });

        const generatedContent = completion.choices[0].message.content;

        // Save letter to database with enhanced data
        const letter = {
          id: uuidv4(),
          user_id: decoded.userId,
          title,
          content: generatedContent,
          letter_type: letterType,
          form_data: formData,
          urgency_level: urgencyLevel,
          total_price: totalPrice,
          status: 'generated',
          professional_generated: true,
          created_at: new Date(),
          updated_at: new Date()
        }

        await db.collection('letters').insertOne(letter)

        return handleCORS(NextResponse.json({ letter: { ...letter, _id: undefined } }))
      } catch (error) {
        console.error('OpenAI API Error:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to generate letter. Please try again.' }, { status: 500 }))
      }
    }

    // Get user letters - GET /api/letters
    if (route === '/letters' && method === 'GET') {
      const authHeader = request.headers.get('authorization')
      if (!authHeader) {
        return handleCORS(NextResponse.json({ error: 'No token provided' }, { status: 401 }))
      }

      const token = authHeader.split(' ')[1]
      const decoded = verifyToken(token)
      
      if (!decoded) {
        return handleCORS(NextResponse.json({ error: 'Invalid token' }, { status: 401 }))
      }

      const letters = await db.collection('letters')
        .find({ user_id: decoded.userId })
        .sort({ created_at: -1 })
        .toArray()

      const cleanedLetters = letters.map(({ _id, ...rest }) => rest)
      
      return handleCORS(NextResponse.json({ letters: cleanedLetters }))
    }

    // COUPON ROUTES
    // Create coupon - POST /api/coupons/create
    if (route === '/coupons/create' && method === 'POST') {
      const authHeader = request.headers.get('authorization')
      if (!authHeader) {
        return handleCORS(NextResponse.json({ error: 'No token provided' }, { status: 401 }))
      }

      const token = authHeader.split(' ')[1]
      const decoded = verifyToken(token)
      
      if (!decoded || decoded.role !== 'contractor') {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }

      const { discount_percent, max_uses = 100, expires_in_days = 30 } = await request.json()

      const coupon = {
        id: uuidv4(),
        contractor_id: decoded.userId,
        code: generateCouponCode(),
        discount_percent,
        max_uses,
        current_uses: 0,
        created_at: new Date(),
        expires_at: new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000)
      }

      await db.collection('coupons').insertOne(coupon)

      return handleCORS(NextResponse.json({ coupon: { ...coupon, _id: undefined } }))
    }

    // Get contractor coupons - GET /api/coupons
    if (route === '/coupons' && method === 'GET') {
      const authHeader = request.headers.get('authorization')
      if (!authHeader) {
        return handleCORS(NextResponse.json({ error: 'No token provided' }, { status: 401 }))
      }

      const token = authHeader.split(' ')[1]
      const decoded = verifyToken(token)
      
      if (!decoded || decoded.role !== 'contractor') {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }

      const coupons = await db.collection('coupons')
        .find({ contractor_id: decoded.userId })
        .sort({ created_at: -1 })
        .toArray()

      const cleanedCoupons = coupons.map(({ _id, ...rest }) => rest)
      
      return handleCORS(NextResponse.json({ coupons: cleanedCoupons }))
    }

    // Validate coupon - POST /api/coupons/validate
    if (route === '/coupons/validate' && method === 'POST') {
      const { code } = await request.json()

      const coupon = await db.collection('coupons').findOne({ code })
      
      if (!coupon) {
        return handleCORS(NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 }))
      }

      if (coupon.expires_at < new Date()) {
        return handleCORS(NextResponse.json({ error: 'Coupon has expired' }, { status: 400 }))
      }

      if (coupon.current_uses >= coupon.max_uses) {
        return handleCORS(NextResponse.json({ error: 'Coupon usage limit exceeded' }, { status: 400 }))
      }

      return handleCORS(NextResponse.json({ 
        valid: true,
        discount_percent: coupon.discount_percent,
        contractor_id: coupon.contractor_id
      }))
    }

    // CONTRACTOR ROUTES
    // Get contractor stats - GET /api/contractor/stats
    if (route === '/contractor/stats' && method === 'GET') {
      const authHeader = request.headers.get('authorization')
      if (!authHeader) {
        return handleCORS(NextResponse.json({ error: 'No token provided' }, { status: 401 }))
      }

      const token = authHeader.split(' ')[1]
      const decoded = verifyToken(token)
      
      if (!decoded || decoded.role !== 'contractor') {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }

      const contractor = await db.collection('contractors').findOne({ user_id: decoded.userId })
      if (!contractor) {
        return handleCORS(NextResponse.json({ error: 'Contractor profile not found' }, { status: 404 }))
      }

      const coupons = await db.collection('coupons')
        .find({ contractor_id: decoded.userId })
        .toArray()

      const totalCoupons = coupons.length
      const activeCoupons = coupons.filter(c => c.expires_at > new Date() && c.current_uses < c.max_uses).length

      return handleCORS(NextResponse.json({
        points: contractor.points,
        total_signups: contractor.total_signups,
        total_coupons: totalCoupons,
        active_coupons: activeCoupons
      }))
    }

    // ADMIN ROUTES
    // Get all users - GET /api/admin/users
    if (route === '/admin/users' && method === 'GET') {
      const authHeader = request.headers.get('authorization')
      if (!authHeader) {
        return handleCORS(NextResponse.json({ error: 'No token provided' }, { status: 401 }))
      }

      const token = authHeader.split(' ')[1]
      const decoded = verifyToken(token)
      
      if (!decoded || decoded.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }

      const users = await db.collection('users')
        .find({})
        .sort({ created_at: -1 })
        .toArray()

      const cleanedUsers = users.map(({ _id, password, ...rest }) => rest)
      
      return handleCORS(NextResponse.json({ users: cleanedUsers }))
    }

    // Get all letters - GET /api/admin/letters
    if (route === '/admin/letters' && method === 'GET') {
      const authHeader = request.headers.get('authorization')
      if (!authHeader) {
        return handleCORS(NextResponse.json({ error: 'No token provided' }, { status: 401 }))
      }

      const token = authHeader.split(' ')[1]
      const decoded = verifyToken(token)
      
      if (!decoded || decoded.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }

      const letters = await db.collection('letters')
        .find({})
        .sort({ created_at: -1 })
        .toArray()

      const cleanedLetters = letters.map(({ _id, ...rest }) => rest)
      
      return handleCORS(NextResponse.json({ letters: cleanedLetters }))
    }

    // Register with coupon - POST /api/auth/register-with-coupon
    if (route === '/auth/register-with-coupon' && method === 'POST') {
      const { email, password, name, coupon_code } = await request.json()
      
      // Validate coupon first
      const coupon = await db.collection('coupons').findOne({ code: coupon_code })
      if (!coupon || coupon.expires_at < new Date() || coupon.current_uses >= coupon.max_uses) {
        return handleCORS(NextResponse.json({ error: 'Invalid or expired coupon' }, { status: 400 }))
      }

      // Check if user already exists
      const existingUser = await db.collection('users').findOne({ email })
      if (existingUser) {
        return handleCORS(NextResponse.json({ error: 'User already exists' }, { status: 400 }))
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)
      
      // Create user
      const user = {
        id: uuidv4(),
        email,
        password: hashedPassword,
        name,
        role: 'user',
        subscription_status: 'free',
        coupon_used: coupon_code,
        created_at: new Date()
      }

      await db.collection('users').insertOne(user)

      // Update coupon usage
      await db.collection('coupons').updateOne(
        { code: coupon_code },
        { $inc: { current_uses: 1 } }
      )

      // Update contractor stats
      await db.collection('contractors').updateOne(
        { user_id: coupon.contractor_id },
        { $inc: { total_signups: 1 } }
      )

      const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })
      
      return handleCORS(NextResponse.json({ 
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        token,
        message: 'Registration successful with coupon!'
      }))
    }

    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` }, 
      { status: 404 }
    ))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    ))
  }
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute