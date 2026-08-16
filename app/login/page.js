'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers';
import { Reveal } from '@/components/reveal';
import { supabase, syncSupabaseUser, isSupabaseConfigured } from '@/lib/supabase';

const startRoutes = {
  overview: '/overview',
  bots: '/bots',
  proxies: '/network',
  commands: '/aliases',
  schedules: '/schedules',
  account: '/settings',
};

export default function LoginPage() {
  const { user, loading, login, refresh } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user) router.replace(startRoutes[user.preferences?.startPage] || '/overview');
  }, [loading, user, router]);

  // Handle Supabase OAuth session return
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && !user) {
        setOauthLoading(true);
        try {
          await syncSupabaseUser(session.user);
          await refresh();
          router.replace('/overview');
        } catch (err) {
          setError(err.message || 'OAuth session sync failed');
        } finally {
          setOauthLoading(false);
        }
      }
    });
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [user, refresh, router]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isSignUp) {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.reason || data.message || 'Registration failed');
        }
        await refresh();
      } else {
        await login(email.trim(), password);
      }
      router.replace('/overview');
      router.refresh();
    } catch (reason) {
      setError(reason.message || 'Authentication error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOAuth = async (provider) => {
    setError('');
    setOauthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { 
          redirectTo: window.location.origin + '/login',
          skipBrowserRedirect: true
        },
      });
      if (error) throw error;
      
      if (data?.url) {
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.innerWidth - width) / 2;
        const top = window.screenY + (window.innerHeight - height) / 2;
        const popup = window.open(data.url, 'oauth-popup', `width=${width},height=${height},left=${left},top=${top}`);
        
        const checkPopup = setInterval(() => {
          if (!popup || popup.closed) {
            clearInterval(checkPopup);
            // Stop the loading spinner when popup closes
            setOauthLoading(false);
          }
        }, 500);
      }
    } catch (err) {
      setError(err.message);
      setOauthLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 bg-white overflow-hidden">
      {/* Custom Stripe-like Angular Gradient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* The main sweeping ribbon */}
        <div 
          className="absolute inset-0 opacity-90"
          style={{
            background: 'linear-gradient(105deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 25%, transparent 28%, transparent 72%, rgba(255,255,255,1) 75%, rgba(255,255,255,1) 100%)',
            zIndex: 2
          }}
        ></div>
        <div 
          className="absolute w-[150%] h-[150%] -top-[25%] -left-[25%] -rotate-[15deg]"
          style={{
            background: 'linear-gradient(90deg, #3b82f6 0%, #ff5e3a 30%, #ff2a85 60%, #9030ff 100%)',
            filter: 'blur(160px)',
            opacity: 0.8,
            zIndex: 1
          }}
        ></div>
        <div 
          className="absolute w-[100%] h-[100%] top-[10%] left-[20%] -rotate-[25deg]"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, #ff8c00 40%, #ff007f 60%, transparent 100%)',
            filter: 'blur(120px)',
            opacity: 0.9,
            zIndex: 1
          }}
        ></div>
      </div>

      <Reveal delay={100} className="w-full max-w-[440px] relative z-10">
        <div className="bg-white rounded-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden flex flex-col">
          
          <div className="px-10 pt-10 pb-8">
            <h1 className="text-[22px] font-bold text-gray-900 mb-6 tracking-tight">
              {isSignUp ? 'Create your account' : 'Sign in to your account'}
            </h1>
            
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-[14px] text-gray-900 shadow-sm focus:border-blurple-500 focus:outline-none focus:ring-1 focus:ring-blurple-500 transition-colors"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="username"
                  autoFocus
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[13px] font-medium text-gray-700">
                    Password
                  </label>
                  {!isSignUp && (
                    <Link href="#" className="text-[13px] font-medium text-blurple-500 hover:text-blurple-600 transition-colors">
                      Forgot your password?
                    </Link>
                  )}
                </div>
                <input
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-[14px] text-gray-900 shadow-sm focus:border-blurple-500 focus:outline-none focus:ring-1 focus:ring-blurple-500 transition-colors"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                />
              </div>

              {!isSignUp && (
                <div className="flex items-center mt-4">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blurple-500 focus:ring-blurple-500 cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-[13px] text-gray-600 cursor-pointer">
                    Remember me on this device
                  </label>
                </div>
              )}

              {error && (
                <div className="rounded-md bg-red-50 p-3 text-[13px] text-red-600 border border-red-100">
                  {error}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-md bg-blurple-500 px-4 py-2.5 text-[15px] font-semibold text-white shadow-sm hover:bg-blurple-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blurple-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Please wait...' : (isSignUp ? 'Create account' : 'Sign In')}
                </button>
              </div>
            </form>

            <div className="relative mt-8 mb-6">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-[12px]">
                <span className="bg-white px-3 text-gray-500">Or {isSignUp ? 'sign up' : 'sign in'} with</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                disabled={oauthLoading}
                onClick={() => handleOAuth('google')}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-[14px] font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
              >
                {/* Full color Google Logo */}
                <svg className="h-4 w-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
                Google
              </button>
              
              <button
                type="button"
                disabled={oauthLoading}
                onClick={() => handleOAuth('github')}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-[14px] font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
              >
                {/* Full color GitHub Logo (Black/Dark Gray) */}
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#181717">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                GitHub
              </button>
            </div>
          </div>
          
          <div className="bg-[#f7f9fc] px-10 py-5 border-t border-gray-100 text-center">
            <p className="text-[13px] text-gray-500">
              {isSignUp ? 'Already have an account?' : 'New to Native?'}{' '}
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                className="font-medium text-blurple-500 hover:text-blurple-600 transition-colors"
              >
                {isSignUp ? 'Sign in' : 'Create account'}
              </button>
            </p>
          </div>
          
        </div>
      </Reveal>
    </main>
  );
}
