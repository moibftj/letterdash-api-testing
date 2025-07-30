'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { User, Users, Shield, PenTool, Gift, Star, Mail, LogOut, FileText, TrendingUp, Award, Crown, Scale, Gavel, CheckCircle } from 'lucide-react'

const App = () => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [letters, setLetters] = useState([])
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({})
  const [allUsers, setAllUsers] = useState([])
  const [allLetters, setAllLetters] = useState([])

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      setToken(savedToken)
      fetchCurrentUser(savedToken)
    }
  }, [])

  const fetchCurrentUser = async (authToken) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setUser(data.user)
        if (data.user.role === 'user') {
          fetchLetters(authToken)
        } else if (data.user.role === 'contractor') {
          fetchCoupons(authToken)
          fetchContractorStats(authToken)
        } else if (data.user.role === 'admin') {
          fetchAllUsers(authToken)
          fetchAllLetters(authToken)
        }
      } else {
        localStorage.removeItem('token')
        setToken(null)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      localStorage.removeItem('token')
      setToken(null)
    }
  }

  const fetchLetters = async (authToken) => {
    try {
      const response = await fetch('/api/letters', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setLetters(data.letters)
      }
    } catch (error) {
      console.error('Error fetching letters:', error)
    }
  }

  const fetchCoupons = async (authToken) => {
    try {
      const response = await fetch('/api/coupons', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setCoupons(data.coupons)
      }
    } catch (error) {
      console.error('Error fetching coupons:', error)
    }
  }

  const fetchContractorStats = async (authToken) => {
    try {
      const response = await fetch('/api/contractor/stats', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchAllUsers = async (authToken) => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setAllUsers(data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchAllLetters = async (authToken) => {
    try {
      const response = await fetch('/api/admin/letters', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setAllLetters(data.letters)
      }
    } catch (error) {
      console.error('Error fetching letters:', error)
    }
  }

  const handleAuth = async (formData, isLogin = true, withCoupon = false) => {
    setLoading(true)
    try {
      const endpoint = withCoupon ? '/api/auth/register-with-coupon' : (isLogin ? '/api/auth/login' : '/api/auth/register')
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setUser(data.user)
        setToken(data.token)
        localStorage.setItem('token', data.token)
        toast.success(data.message || (isLogin ? 'Welcome back!' : 'Registration successful!'))
        
        if (data.user.role === 'user') {
          fetchLetters(data.token)
        } else if (data.user.role === 'contractor') {
          fetchCoupons(data.token)
          fetchContractorStats(data.token)
        } else if (data.user.role === 'admin') {
          fetchAllUsers(data.token)
          fetchAllLetters(data.token)
        }
      } else {
        toast.error(data.error || 'Authentication failed')
      }
    } catch (error) {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    toast.success('Logged out successfully')
  }

  const generateLetter = async (letterData) => {
    setLoading(true)
    try {
      const response = await fetch('/api/letters/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(letterData),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setLetters(prev => [data.letter, ...prev])
        toast.success('Professional letter generated successfully!')
      } else {
        toast.error(data.error || 'Failed to generate letter')
      }
    } catch (error) {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  const createCoupon = async (couponData) => {
    setLoading(true)
    try {
      const response = await fetch('/api/coupons/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(couponData),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setCoupons(prev => [data.coupon, ...prev])
        toast.success('Coupon created successfully!')
      } else {
        toast.error(data.error || 'Failed to create coupon')
      }
    } catch (error) {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  const AuthForm = ({ isLogin, withCoupon = false }) => {
    const [formData, setFormData] = useState({
      email: '',
      password: '',
      name: '',
      role: 'user',
      coupon_code: ''
    })

    const handleSubmit = (e) => {
      e.preventDefault()
      handleAuth(formData, isLogin, withCoupon)
    }

    return (
      <Card className="w-full max-w-md mx-auto bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <User className="h-5 w-5 text-orange-500" />
            {withCoupon ? 'Register with Coupon' : (isLogin ? 'Login' : 'Register')}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {withCoupon ? 'Join using a contractor coupon' : (isLogin ? 'Welcome back to your legal assistant!' : 'Create your professional account')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="bg-gray-800 border-gray-600 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="bg-gray-800 border-gray-600 text-white"
                required
              />
            </div>
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-gray-800 border-gray-600 text-white"
                  required
                />
              </div>
            )}
            {!isLogin && !withCoupon && (
              <div className="space-y-2">
                <Label htmlFor="role" className="text-gray-300">Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {withCoupon && (
              <div className="space-y-2">
                <Label htmlFor="coupon_code" className="text-gray-300">Coupon Code</Label>
                <Input
                  id="coupon_code"
                  value={formData.coupon_code}
                  onChange={(e) => setFormData({...formData, coupon_code: e.target.value})}
                  placeholder="Enter coupon code"
                  className="bg-gray-800 border-gray-600 text-white"
                  required
                />
              </div>
            )}
            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white" disabled={loading}>
              {loading ? 'Processing...' : (withCoupon ? 'Register with Coupon' : (isLogin ? 'Login' : 'Register'))}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  const LetterGenerator = () => {
    const [letterData, setLetterData] = useState({
      letterType: '',
      briefDescription: '',
      fullName: '',
      yourAddress: '',
      recipientName: '',
      recipientAddress: '',
      detailedInformation: '',
      whatToAchieve: '',
      urgencyLevel: 'standard',
      supportingDocuments: null
    })
    const [showPreview, setShowPreview] = useState(false)
    const [showTimeline, setShowTimeline] = useState(false)
    const [previewContent, setPreviewContent] = useState('')
    const [currentStep, setCurrentStep] = useState(0)
    const [isUploading, setIsUploading] = useState(false)

    const letterTypes = [
      { value: 'complaint', label: 'Complaint Letter' },
      { value: 'demand', label: 'Demand Letter' },
      { value: 'cease-desist', label: 'Cease & Desist' },
      { value: 'debt-collection', label: 'Debt Collection' },
      { value: 'employment', label: 'Employment Issue' },
      { value: 'landlord-tenant', label: 'Landlord/Tenant' },
      { value: 'business', label: 'Business Letter' },
      { value: 'insurance', label: 'Insurance Claim' },
      { value: 'contract', label: 'Contract Dispute' },
      { value: 'other', label: 'Other Legal Matter' }
    ]

    const subscriptionPlans = [
      { letters: 4, price: 200, popular: false },
      { letters: 7, price: 350, popular: true },
      { letters: 8, price: 999, popular: false }
    ]

    const timelineSteps = [
      { id: 1, title: 'Letter Requested', description: 'Your request has been received', icon: '📝' },
      { id: 2, title: 'Attorney Review', description: 'Professional review in progress', icon: '👩‍💼' },
      { id: 3, title: 'First Draft', description: 'Your letter is ready', icon: '📄' }
    ]

    const handleFileUpload = (e) => {
      const file = e.target.files[0]
      if (file) {
        setIsUploading(true)
        const reader = new FileReader()
        reader.onload = (event) => {
          setLetterData({
            ...letterData,
            supportingDocuments: {
              name: file.name,
              type: file.type,
              data: event.target.result
            }
          })
          setIsUploading(false)
        }
        reader.readAsDataURL(file)
      }
    }

    const generatePreviewContent = () => {
      return `[Date]

${letterData.recipientName}
${letterData.recipientAddress}

Dear ${letterData.recipientName},

I am writing to formally address ${letterData.briefDescription.toLowerCase()}. 

${letterData.detailedInformation}

Based on the circumstances described above, I am seeking ${letterData.whatToAchieve.toLowerCase()}.

I look forward to your prompt response and resolution of this matter.

Sincerely,

${letterData.fullName}
${letterData.yourAddress}`
    }

    const handleSubmit = async (e) => {
      e.preventDefault()
      
      // Check if user has subscription (for demo, we'll assume they don't)
      const hasSubscription = user?.subscription_status === 'paid'
      
      if (!hasSubscription) {
        // Show blurred preview for non-subscribers
        const preview = generatePreviewContent()
        setPreviewContent(preview)
        setShowPreview(true)
      } else {
        // Show timeline for subscribers
        setShowTimeline(true)
        
        // Animate through timeline steps
        const steps = [0, 1, 2]
        for (let i = 0; i < steps.length; i++) {
          setTimeout(() => {
            setCurrentStep(i)
            if (i === steps.length - 1) {
              // Generate actual letter after timeline
              setTimeout(() => {
                const comprehensivePrompt = `
                  Letter Type: ${letterData.letterType}
                  Brief Description: ${letterData.briefDescription}
                  Sender Information: ${letterData.fullName}, ${letterData.yourAddress}
                  Recipient Information: ${letterData.recipientName}, ${letterData.recipientAddress}
                  Detailed Information: ${letterData.detailedInformation}
                  What to Achieve: ${letterData.whatToAchieve}
                  Urgency Level: ${letterData.urgencyLevel}
                `

                const enhancedLetterData = {
                  title: `${letterTypes.find(t => t.value === letterData.letterType)?.label || 'Professional Legal Letter'}`,
                  prompt: comprehensivePrompt,
                  letterType: letterData.letterType,
                  formData: letterData,
                  urgencyLevel: letterData.urgencyLevel
                }

                generateLetter(enhancedLetterData)
                setShowTimeline(false)
                setCurrentStep(0)
              }, 2000)
            }
          }, i * 2000)
        }
      }
    }

    const handleSubscribe = (plan) => {
      // Here you would implement actual subscription logic
      toast.success(`Subscribed to ${plan.letters} letters plan for $${plan.price}`)
      setShowPreview(false)
      // Update user subscription status
      // For demo, we'll just show the timeline
      setShowTimeline(true)
      setCurrentStep(0)
    }

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-orange-600 p-3 rounded-full">
              <PenTool className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Create New Letter</h2>
          <p className="text-gray-400">Professional legal correspondence by Talk To My Lawyer</p>
        </div>

        <Card className="bg-gray-900 border-gray-700 laser-orbit laser-glow">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-white">Order Your Professional Letter</CardTitle>
            <CardDescription className="text-center text-gray-400">
              Provide your details below and we'll craft a professional, lawyer-reviewed letter tailored to your situation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="letterType" className="text-gray-300 font-medium">Letter Type *</Label>
                <Select value={letterData.letterType} onValueChange={(value) => setLetterData({...letterData, letterType: value})}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select letter type..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {letterTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-white">{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="briefDescription" className="text-gray-300 font-medium">Brief Description of Your Situation *</Label>
                <Textarea
                  id="briefDescription"
                  value={letterData.briefDescription}
                  onChange={(e) => setLetterData({...letterData, briefDescription: e.target.value})}
                  placeholder="Briefly explain your situation (minimum 5 words for preview)..."
                  rows={3}
                  className="bg-gray-800 border-gray-600 text-white min-h-[100px]"
                  required
                />
                <div className="text-xs text-gray-500">Words: {letterData.briefDescription.split(' ').filter(w => w.length > 0).length}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Your Information</h3>
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-gray-300">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={letterData.fullName}
                      onChange={(e) => setLetterData({...letterData, fullName: e.target.value})}
                      className="bg-gray-800 border-gray-600 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yourAddress" className="text-gray-300">Your Address *</Label>
                    <Textarea
                      id="yourAddress"
                      value={letterData.yourAddress}
                      onChange={(e) => setLetterData({...letterData, yourAddress: e.target.value})}
                      placeholder="Street address, city, state, zip"
                      rows={3}
                      className="bg-gray-800 border-gray-600 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Recipient Information</h3>
                  <div className="space-y-2">
                    <Label htmlFor="recipientName" className="text-gray-300">Recipient Name/Company *</Label>
                    <Input
                      id="recipientName"
                      value={letterData.recipientName}
                      onChange={(e) => setLetterData({...letterData, recipientName: e.target.value})}
                      className="bg-gray-800 border-gray-600 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipientAddress" className="text-gray-300">Recipient Address *</Label>
                    <Textarea
                      id="recipientAddress"
                      value={letterData.recipientAddress}
                      onChange={(e) => setLetterData({...letterData, recipientAddress: e.target.value})}
                      placeholder="Street address, city, state, zip"
                      rows={3}
                      className="bg-gray-800 border-gray-600 text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="detailedInformation" className="text-gray-300 font-medium">Detailed Information *</Label>
                <Textarea
                  id="detailedInformation"
                  value={letterData.detailedInformation}
                  onChange={(e) => setLetterData({...letterData, detailedInformation: e.target.value})}
                  placeholder="Please provide all relevant details about your situation, including dates, amounts, previous communications, etc. The more information you provide, the better we can craft your letter (minimum 5 words for preview)"
                  rows={6}
                  className="bg-gray-800 border-gray-600 text-white min-h-[150px]"
                  required
                />
                <div className="text-xs text-gray-500">Words: {letterData.detailedInformation.split(' ').filter(w => w.length > 0).length}</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatToAchieve" className="text-gray-300 font-medium">What Do You Want to Achieve? *</Label>
                <Textarea
                  id="whatToAchieve"
                  value={letterData.whatToAchieve}
                  onChange={(e) => setLetterData({...letterData, whatToAchieve: e.target.value})}
                  placeholder="What specific outcome are you seeking? (e.g., return of security deposit, payment of owed money, stop harassment, etc.)"
                  rows={3}
                  className="bg-gray-800 border-gray-600 text-white"
                  required
                />
                <div className="text-xs text-gray-500">Words: {letterData.whatToAchieve.split(' ').filter(w => w.length > 0).length}</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supportingDocuments" className="text-gray-300 font-medium">Supporting Documents (Optional)</Label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center bg-gray-800">
                  <input
                    type="file"
                    id="supportingDocuments"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                  />
                  <label htmlFor="supportingDocuments" className="cursor-pointer">
                    <div className="space-y-2">
                      <div className="text-4xl">📄</div>
                      <div className="text-sm text-gray-400">
                        {isUploading ? 'Uploading...' : 'Upload any relevant documents (contracts, emails, photos, etc.)'}
                      </div>
                      {letterData.supportingDocuments && (
                        <div className="text-sm text-green-400 font-medium">
                          ✓ {letterData.supportingDocuments.name}
                        </div>
                      )}
                      <Button type="button" variant="outline" size="sm" disabled={isUploading} className="border-orange-600 text-orange-500 hover:bg-orange-600 hover:text-white">
                        Choose Files
                      </Button>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 text-lg font-medium" disabled={loading}>
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing Your Letter...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Gavel className="h-5 w-5" />
                      Generate Professional Letter
                    </div>
                  )}
                </Button>
              </div>

              <div className="text-center text-xs text-gray-500 mt-4">
                By placing your order, you agree to our Terms of Service and Privacy Policy
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Letter Preview Modal for Non-Subscribers */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-white text-center">Letter Preview</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="relative">
                <div className="bg-gray-800 p-6 rounded-lg text-sm font-mono leading-relaxed blur-sm select-none">
                  {previewContent}
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                  <div className="text-center p-6 bg-gray-900 rounded-lg border border-orange-600">
                    <h3 className="text-xl font-bold text-white mb-4">Subscribe to View Full Letter</h3>
                    <p className="text-gray-400 mb-6">Choose a subscription plan to access your professional letters</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {subscriptionPlans.map((plan, index) => (
                        <Card key={index} className={`bg-gray-800 border-gray-600 ${plan.popular ? 'ring-2 ring-orange-600' : ''}`}>
                          {plan.popular && (
                            <div className="bg-orange-600 text-white text-xs font-bold text-center py-1 rounded-t-lg">
                              MOST POPULAR
                            </div>
                          )}
                          <CardHeader className="text-center">
                            <CardTitle className="text-white">{plan.letters} Letters</CardTitle>
                            <CardDescription className="text-3xl font-bold text-orange-500">${plan.price}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Button 
                              onClick={() => handleSubscribe(plan)} 
                              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                            >
                              Subscribe Now
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Timeline Modal for Subscribers */}
        <Dialog open={showTimeline} onOpenChange={setShowTimeline}>
          <DialogContent className="max-w-2xl bg-gray-900 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-white text-center">Processing Your Letter</DialogTitle>
            </DialogHeader>
            <div className="space-y-8 py-6">
              {timelineSteps.map((step, index) => (
                <div key={step.id} className={`flex items-center space-x-4 ${index <= currentStep ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                    index < currentStep ? 'bg-green-600' : 
                    index === currentStep ? 'bg-orange-600 animate-pulse' : 'bg-gray-600'
                  }`}>
                    {index < currentStep ? '✓' : step.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                    <p className="text-gray-400">{step.description}</p>
                  </div>
                  {index === currentStep && (
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  const CouponCreator = () => {
    const [couponData, setCouponData] = useState({
      discount_percent: 10,
      max_uses: 100,
      expires_in_days: 30
    })

    const handleSubmit = (e) => {
      e.preventDefault()
      createCoupon(couponData)
      setCouponData({ discount_percent: 10, max_uses: 100, expires_in_days: 30 })
    }

    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Gift className="h-5 w-5 text-orange-500" />
            Create Coupon
          </CardTitle>
          <CardDescription className="text-gray-400">Generate discount coupons for user signups</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="discount" className="text-gray-300">Discount Percentage</Label>
              <Input
                id="discount"
                type="number"
                min="1"
                max="100"
                value={couponData.discount_percent}
                onChange={(e) => setCouponData({...couponData, discount_percent: parseInt(e.target.value)})}
                className="bg-gray-800 border-gray-600 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxUses" className="text-gray-300">Maximum Uses</Label>
              <Input
                id="maxUses"
                type="number"
                min="1"
                value={couponData.max_uses}
                onChange={(e) => setCouponData({...couponData, max_uses: parseInt(e.target.value)})}
                className="bg-gray-800 border-gray-600 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresIn" className="text-gray-300">Expires In (Days)</Label>
              <Input
                id="expiresIn"
                type="number"
                min="1"
                value={couponData.expires_in_days}
                onChange={(e) => setCouponData({...couponData, expires_in_days: parseInt(e.target.value)})}
                className="bg-gray-800 border-gray-600 text-white"
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700 text-white">
              {loading ? 'Creating...' : 'Create Coupon'}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Navigation Header */}
        <nav className="border-b border-gray-800 bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Crown className="h-8 w-8 text-orange-500" />
                  <div>
                    <h1 className="text-xl font-bold text-white">Talk To My Lawyer</h1>
                    <p className="text-xs text-gray-400">Professional Legal Letters</p>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-6">
                <Button variant="ghost" className="text-gray-300 hover:text-white">Home</Button>
                <Button variant="ghost" className="text-gray-300 hover:text-white">Letter Types</Button>
                <Button variant="ghost" className="text-gray-300 hover:text-white">How It Works</Button>
                <Button variant="ghost" className="text-gray-300 hover:text-white">About</Button>
                <Button variant="ghost" className="text-gray-300 hover:text-white">Contact</Button>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" className="text-gray-300 hover:text-white">
                  <User className="h-4 w-4 mr-2" />
                  Login
                </Button>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="relative bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            {/* Trust Badge */}
            <div className="flex justify-center mb-8">
              <div className="bg-orange-600 px-4 py-2 rounded-full flex items-center gap-2">
                <Crown className="h-4 w-4 text-white" />
                <span className="text-white text-sm font-medium">Trusted by 10,000+ clients nationwide</span>
              </div>
            </div>
            
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold">
                  <span className="text-white">Need a Lawyer's Voice</span>
                  <br />
                  <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                    Without the Legal Bill?
                  </span>
                </h1>
                <p className="text-xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
                  Get professional lawyer-drafted letters for tenant disputes, debt collection, HR issues,
                  and more. Resolve conflicts quickly and affordably with the power of legal
                  communication.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 text-lg">
                  Get Started Now →
                </Button>
                <Button variant="outline" size="lg" className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-4 text-lg">
                  View Letter Types
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-8 mt-12">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-300">No Legal Fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-300">24-48 Hrs Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-300">Lawyer Reviewed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-black py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
              <p className="text-xl text-gray-400">Get professional legal letters in three simple steps</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-orange-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Choose Letter Type</h3>
                <p className="text-gray-400">
                  Select from our library of professional legal letter templates
                </p>
              </div>

              <div className="text-center">
                <div className="bg-orange-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Fill Details</h3>
                <p className="text-gray-400">
                  Provide your situation details through our smart form
                </p>
              </div>

              <div className="text-center">
                <div className="bg-orange-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Get Your Letter</h3>
                <p className="text-gray-400">
                  Receive a lawyer-reviewed letter ready to send
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Auth Section */}
        <div className="bg-gray-900 py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
              <p className="text-xl text-gray-400">Join thousands of clients who resolved their legal issues</p>
            </div>
            
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
                <TabsTrigger value="login" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-orange-600">Login</TabsTrigger>
                <TabsTrigger value="register" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-orange-600">Register</TabsTrigger>
                <TabsTrigger value="coupon" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-orange-600">Register with Coupon</TabsTrigger>
                <TabsTrigger value="about" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-orange-600">About</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="mt-6">
                <AuthForm isLogin={true} />
              </TabsContent>
              
              <TabsContent value="register" className="mt-6">
                <AuthForm isLogin={false} />
              </TabsContent>
              
              <TabsContent value="coupon" className="mt-6">
                <AuthForm isLogin={false} withCoupon={true} />
              </TabsContent>
              
              <TabsContent value="about" className="mt-6">
                <Card className="w-full max-w-2xl mx-auto bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">About Talk To My Lawyer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-orange-500" />
                        <div>
                          <h3 className="font-semibold text-white">Users</h3>
                          <p className="text-sm text-gray-400">Generate professional legal letters for any purpose</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-orange-500" />
                        <div>
                          <h3 className="font-semibold text-white">Contractors</h3>
                          <p className="text-sm text-gray-400">Create discount coupons and earn points from user signups</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-orange-500" />
                        <div>
                          <h3 className="font-semibold text-white">Admins</h3>
                          <p className="text-sm text-gray-400">Manage users, contractors, and monitor platform activity</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Why Choose Section */}
        <div className="bg-black py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">Why Choose Talk To My Lawyer?</h2>
              <p className="text-xl text-gray-400">Professional legal communication that gets results</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
                  <div className="bg-orange-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">24-48 Hour Delivery</h3>
                  <p className="text-gray-400 text-sm">Fast turnaround on all letters</p>
                </div>
              </div>

              <div className="text-center">
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
                  <div className="bg-orange-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Scale className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Lawyer Reviewed</h3>
                  <p className="text-gray-400 text-sm">Every letter is reviewed by licensed attorneys</p>
                </div>
              </div>

              <div className="text-center">
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
                  <div className="bg-orange-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Proven Results</h3>
                  <p className="text-gray-400 text-sm">95% of our letters achieve desired outcomes</p>
                </div>
              </div>

              <div className="text-center">
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
                  <div className="bg-orange-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Professional Format</h3>
                  <p className="text-gray-400 text-sm">Proper legal formatting and language</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="bg-gray-900 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">What Our Clients Say</h2>
              <p className="text-xl text-gray-400">Real results from real people</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-orange-500 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-4">
                    "Got my security deposit back within a week of sending this letter. Saved me thousands in legal fees!"
                  </p>
                  <div className="text-sm">
                    <p className="font-semibold text-white">Sarah M.</p>
                    <p className="text-gray-400">Tenant</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-orange-500 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-4">
                    "The debt collection letter helped me recover $8,000 from a client. Professional and effective!"
                  </p>
                  <div className="text-sm">
                    <p className="font-semibold text-white">Mike R.</p>
                    <p className="text-gray-400">Business Owner</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-orange-500 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-4">
                    "Tenant dispute resolved quickly with their cease & desist letter. Highly recommend!"
                  </p>
                  <div className="text-sm">
                    <p className="font-semibold text-white">Jennifer L.</p>
                    <p className="text-gray-400">Landlord</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="bg-orange-600 py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-orange-100 mb-8">
              Join thousands of satisfied clients who resolved their legal issues with professional letters
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-4 text-lg font-medium">
                Generate Your First Letter →
              </Button>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-orange-600 px-8 py-4 text-lg">
                Get Started Today
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 py-12 border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="h-6 w-6 text-orange-500" />
                  <span className="text-lg font-bold text-white">Talk To My Lawyer</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Professional legal letters without the legal fees. Get lawyer-drafted letters for all your needs.
                </p>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-4">Services</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-gray-400 hover:text-white">Tenant Disputes</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Debt Collection</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Cease & Desist</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Property Disputes</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-4">Company</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-gray-400 hover:text-white">About Us</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Careers</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Contact</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">My Letters</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-4">Contact</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>support@talktomylawyer.com</li>
                  <li>1-800-LETTERS</li>
                  <li>Available 24/7</li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-8 pt-8 text-center">
              <p className="text-gray-400 text-sm">
                © 2025 Talk To My Lawyer. All rights reserved. | Privacy Policy | Terms of Service | Refund Policy
              </p>
            </div>
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="bg-gray-900 shadow-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-orange-500" />
              <div>
                <h1 className="text-2xl font-bold text-white">Talk To My Lawyer</h1>
                <p className="text-sm text-gray-400">Welcome back, {user.name}!</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="capitalize bg-orange-600 text-white">
                {user.role === 'user' ? <User className="h-4 w-4 mr-1" /> : 
                 user.role === 'contractor' ? <Users className="h-4 w-4 mr-1" /> : 
                 <Shield className="h-4 w-4 mr-1" />}
                {user.role}
              </Badge>
              <Button variant="outline" onClick={handleLogout} className="border-gray-600 text-gray-300 hover:bg-gray-800">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user.role === 'user' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
              <div className="xl:col-span-3">
                <LetterGenerator />
              </div>
              <div className="xl:col-span-2">
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <FileText className="h-5 w-5 text-orange-500" />
                      Your Letters ({letters.length})
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Generated professional letters ready for use
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {letters.slice(0, 3).map((letter) => (
                        <div key={letter.id} className="border border-gray-700 rounded-lg p-3 bg-gray-800">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm text-white">{letter.title}</h4>
                            <Badge variant="outline" className="text-xs border-orange-600 text-orange-500">{letter.letter_type}</Badge>
                          </div>
                          <p className="text-xs text-gray-400 mb-2">{letter.content.substring(0, 100)}...</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{new Date(letter.created_at).toLocaleDateString()}</span>
                            {letter.total_price && (
                              <span className="text-orange-500 font-medium">${letter.total_price.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {letters.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-sm">No letters generated yet</p>
                        </div>
                      )}
                      {letters.length > 3 && (
                        <div className="text-center">
                          <Button variant="outline" size="sm" className="border-orange-600 text-orange-500 hover:bg-orange-600 hover:text-white">
                            View All Letters ({letters.length})
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {letters.length > 0 && (
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <FileText className="h-5 w-5 text-orange-500" />
                    All Your Letters ({letters.length})
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Complete history of your generated letters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {letters.map((letter) => (
                    <Card key={letter.id} className="border-l-4 border-l-orange-500 mb-4 bg-gray-800 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-lg text-white">{letter.title}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize border-orange-600 text-orange-500">{letter.letter_type}</Badge>
                            {letter.urgency_level && letter.urgency_level !== 'standard' && (
                              <Badge variant="secondary" className="uppercase text-xs bg-orange-600 text-white">
                                {letter.urgency_level}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {letter.form_data && (
                          <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              {letter.form_data.fullName && (
                                <div>
                                  <span className="font-medium text-gray-300">From:</span>
                                  <span className="ml-2 text-white">{letter.form_data.fullName}</span>
                                </div>
                              )}
                              {letter.form_data.recipientName && (
                                <div>
                                  <span className="font-medium text-gray-300">To:</span>
                                  <span className="ml-2 text-white">{letter.form_data.recipientName}</span>
                                </div>
                              )}
                              {letter.total_price && (
                                <div>
                                  <span className="font-medium text-gray-300">Price:</span>
                                  <span className="ml-2 text-orange-500">${letter.total_price.toFixed(2)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 mb-4">
                          <p className="text-sm whitespace-pre-wrap text-gray-300">{letter.content.substring(0, 400)}...</p>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="mt-3 border-orange-600 text-orange-500 hover:bg-orange-600 hover:text-white">
                                View Full Letter
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-700 text-white">
                              <DialogHeader>
                                <DialogTitle className="text-white">{letter.title}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="bg-gray-800 p-4 rounded-lg">
                                  <h4 className="font-medium mb-2 text-white">Letter Details:</h4>
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="text-gray-300">Type: <span className="text-white">{letter.letter_type}</span></div>
                                    <div className="text-gray-300">Status: <span className="text-white">{letter.status}</span></div>
                                    <div className="text-gray-300">Created: <span className="text-white">{new Date(letter.created_at).toLocaleDateString()}</span></div>
                                    {letter.urgency_level && (
                                      <div className="text-gray-300">Urgency: <span className="text-white">{letter.urgency_level}</span></div>
                                    )}
                                  </div>
                                </div>
                                <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                                  <pre className="whitespace-pre-wrap text-sm font-mono text-gray-300">{letter.content}</pre>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-4">
                            <span>Generated: {new Date(letter.created_at).toLocaleDateString()}</span>
                            {letter.professional_generated && <Badge variant="secondary" className="text-xs bg-orange-600 text-white">Professionally Generated</Badge>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="border-orange-600 text-orange-500 hover:bg-orange-600 hover:text-white">
                              Download PDF
                            </Button>
                            <Button size="sm" variant="outline" className="border-orange-600 text-orange-500 hover:bg-orange-600 hover:text-white">
                              Send Email
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {user.role === 'contractor' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                    Your Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-300">Points</span>
                      <Badge variant="secondary" className="text-lg bg-orange-600 text-white">
                        <Award className="h-4 w-4 mr-1" />
                        {stats.points || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-300">Total Signups</span>
                      <span className="text-lg font-bold text-white">{stats.total_signups || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-300">Active Coupons</span>
                      <span className="text-lg font-bold text-white">{stats.active_coupons || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-300">Total Coupons</span>
                      <span className="text-lg font-bold text-white">{stats.total_coupons || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <CouponCreator />
            </div>
            <div className="lg:col-span-2">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Gift className="h-5 w-5 text-orange-500" />
                    Your Coupons ({coupons.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {coupons.map((coupon) => (
                      <div key={coupon.id} className="border border-gray-700 rounded-lg p-4 bg-gray-800">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-mono text-lg font-bold text-white">{coupon.code}</h3>
                          <Badge variant={coupon.expires_at > new Date().toISOString() ? 'default' : 'secondary'} className={coupon.expires_at > new Date().toISOString() ? 'bg-orange-600 text-white' : 'bg-gray-600 text-gray-300'}>
                            {coupon.expires_at > new Date().toISOString() ? 'Active' : 'Expired'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Discount:</span>
                            <span className="ml-2 font-semibold text-white">{coupon.discount_percent}%</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Usage:</span>
                            <span className="ml-2 font-semibold text-white">{coupon.current_uses}/{coupon.max_uses}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Created:</span>
                            <span className="ml-2 text-gray-300">{new Date(coupon.created_at).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Expires:</span>
                            <span className="ml-2 text-gray-300">{new Date(coupon.expires_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {coupons.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No coupons created yet. Create your first coupon!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {user.role === 'admin' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Users className="h-5 w-5 text-orange-500" />
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{allUsers.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <FileText className="h-5 w-5 text-orange-500" />
                    Total Letters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{allLetters.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Star className="h-5 w-5 text-orange-500" />
                    Active Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{allUsers.filter(u => u.role === 'user').length}</div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="users" className="w-full">
              <TabsList className="bg-gray-800 border-gray-700">
                <TabsTrigger value="users" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-orange-600">Users</TabsTrigger>
                <TabsTrigger value="letters" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-orange-600">Letters</TabsTrigger>
              </TabsList>
              
              <TabsContent value="users">
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">User Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {allUsers.map((user) => (
                        <div key={user.id} className="border border-gray-700 rounded-lg p-4 bg-gray-800">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-white">{user.name}</h3>
                              <p className="text-sm text-gray-400">{user.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="capitalize border-orange-600 text-orange-500">{user.role}</Badge>
                              <Badge variant={user.subscription_status === 'paid' ? 'default' : 'secondary'} className={user.subscription_status === 'paid' ? 'bg-orange-600 text-white' : 'bg-gray-600 text-gray-300'}>
                                {user.subscription_status}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Joined: {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="letters">
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Letter Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {allLetters.map((letter) => (
                        <div key={letter.id} className="border border-gray-700 rounded-lg p-4 bg-gray-800">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-white">{letter.title}</h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-orange-600 text-orange-500">{letter.letter_type}</Badge>
                              {letter.professional_generated && <Badge variant="secondary" className="bg-orange-600 text-white">Professionally Generated</Badge>}
                            </div>
                          </div>
                          <p className="text-sm text-gray-400 mb-3">{letter.content.substring(0, 150)}...</p>
                          <div className="text-xs text-gray-500">
                            Created: {new Date(letter.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  )
}

export default App