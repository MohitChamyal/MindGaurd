'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { EyeIcon, EyeOffIcon, LogIn, Shield } from 'lucide-react';
import Image from 'next/image';
import { apiUrl } from '@/lib/config';

export default function AdminLoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/auth/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.msg || 'Login failed');
      }

      // Store token and admin info using multiple storage methods for compatibility
      localStorage.setItem('token', data.token);
      localStorage.setItem('mindguard_token', data.token);
      localStorage.setItem('userType', 'admin');
      localStorage.setItem('mindguard_user_type', 'admin');
      localStorage.setItem('admin', JSON.stringify(data.admin));
      
      // Store admin ID for API calls
      if (data.admin && data.admin._id) {
        localStorage.setItem('mindguard_user_id', data.admin._id);
      }
      
      // Also store in sessionStorage as fallback
      sessionStorage.setItem('token', data.token);
      
      // Set cookie for additional compatibility
      document.cookie = `token=${data.token}; path=/`;
      
      console.log('Admin login successful, token stored');
      
      router.push('/admin');
    } catch (err: any) {
      console.error('Admin login error:', err);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-card p-8 rounded-2xl shadow-2xl border border-border"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image 
              src="/mindguard_logo.png" 
              alt="MindGuard Logo" 
              width={64} 
              height={64}
              className="rounded-lg"
            />
          </div>
          <h2 className="text-3xl font-bold text-foreground font-poppins">Admin Login</h2>
          <p className="text-primary text-sm mt-2">Secure access to administrative dashboard</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 bg-destructive text-destructive-foreground p-3 rounded-lg flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </motion.div>
        )}

        <div className="mb-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Default Admin Credentials:</strong><br />
            Email: admin@mindguard.com<br />
            Password: admin@123
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-foreground font-medium mb-2">Admin Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-ring text-foreground transition-all duration-200"
              placeholder="Enter admin email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-foreground font-medium mb-2">Admin Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-ring text-foreground transition-all duration-200"
                placeholder="Enter admin password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors duration-200"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-primary border-input rounded focus:ring-ring"
              />
              <label className="ml-2 block text-sm text-foreground">
                Remember me
              </label>
            </div>
            <Link href="/forgot-password" className="text-sm text-primary hover:text-primary/80 font-medium transition-colors duration-200">
              Forgot password?
            </Link>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg transition-all duration-300 shadow-md flex items-center justify-center space-x-2"
          >
            <Shield size={20} />
            <span>Login as Admin</span>
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-foreground">
            Return to{' '}
            <Link href="/" className="text-primary hover:text-primary/80 font-medium transition-colors duration-200">
              Home Page
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
} 