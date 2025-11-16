'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { EyeIcon, EyeOffIcon, LogIn } from 'lucide-react';
import Image from 'next/image';
import { apiUrl } from '@/lib/config';

export default function DoctorLoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setStatusMessage('Signing in...');
    
    try {
      setStatusMessage('Connecting to server...');
      const res = await fetch(`${apiUrl}/api/auth/doctor/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.msg || 'Login failed. Please check your credentials.');
      }

      setStatusMessage('Login successful! Preparing your dashboard...');

      console.log('Doctor login response:', data);

      // Ensure we have a token
      if (!data.token) {
        throw new Error('No token received from server. Please try again.');
      }

      // Store token consistently with all possible naming conventions
      localStorage.setItem('token', data.token);
      localStorage.setItem('mindguard_token', data.token);
      localStorage.setItem('doctor_token', data.token); // Add specific doctor token

      // Store user type
      localStorage.setItem('userType', 'doctor');
      localStorage.setItem('mindguard_user_type', 'doctor');
      
      // Store the whole doctor object
      localStorage.setItem('doctor', JSON.stringify(data.doctor));
      
      // Store doctor ID in multiple formats for compatibility
      if (data.doctor && data.doctor.id) {
        localStorage.setItem('mindguard_user_id', data.doctor.id);
        localStorage.setItem('doctor_id', data.doctor.id);
        localStorage.setItem('doctorId', data.doctor.id);
        console.log('Stored doctor ID in localStorage:', data.doctor.id);
      } else {
        console.error('Doctor ID missing from response!', data);
      }
      
      // Store doctor name and email for profile display
      if (data.doctor) {
        // Extract and store doctor name
        const doctorName = data.doctor.name || data.doctor.fullName || '';
        localStorage.setItem('username', doctorName);
        
        // Store email for profile
        localStorage.setItem('email', data.doctor.email || '');
        
        console.log('Stored doctor name for profile:', doctorName);
      }
      
      // Also store in sessionStorage as fallback
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('doctor_token', data.token);
      
      // Set cookie for additional compatibility
      document.cookie = `token=${data.token}; path=/; max-age=86400`; // 24 hours
      document.cookie = `doctor_token=${data.token}; path=/; max-age=86400`; // 24 hours
      
      console.log('Doctor login successful, token and ID stored in multiple formats');
      
      // Short delay for better UX
      setTimeout(() => {
        router.push('/doctor');
      }, 1000);
    } catch (err: any) {
      console.error('Doctor login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
      setIsLoading(false);
      setStatusMessage('');
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
          <h2 className="text-3xl font-bold text-foreground font-poppins">Doctor Login</h2>
          <p className="text-primary text-sm mt-2">Welcome back to your professional dashboard</p>
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

        {statusMessage && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 bg-primary/10 text-primary p-3 rounded-lg flex items-center"
          >
            <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {statusMessage}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-foreground font-medium mb-2">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-ring text-foreground transition-all duration-200"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-foreground font-medium mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-ring text-foreground transition-all duration-200"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors duration-200"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
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
                disabled={isLoading}
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
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            type="submit"
            className={`w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg transition-all duration-300 shadow-md flex items-center justify-center space-x-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <LogIn size={20} />
                <span>Login</span>
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-foreground">
            Don't have an account?{' '}
            <Link href="/doctor-signup" className="text-primary hover:text-primary/80 font-medium transition-colors duration-200">
              Register as Doctor
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
} 