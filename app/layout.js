import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Talk To My Lawyer - AI-Powered Legal Document Automation',
  description: 'Professional AI-powered legal letter generation platform. Streamline your legal correspondence with precision and efficiency.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white min-h-screen`}>
        {children}
        <Toaster position="top-right" theme="dark" />
      </body>
    </html>
  )
}