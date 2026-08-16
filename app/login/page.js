'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
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
            // Stop loading state when popup closes
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
    <main className="lp relative min-h-screen flex flex-col justify-between p-5 sm:p-8 overflow-hidden">
      {/* Editorial Noise & Grid */}
      <div className="lp-noise" aria-hidden="true" />
      <div className="lp-grid-lines pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-24 -left-24 h-[380px] w-[380px] rounded-full bg-ember/10 blur-[100px]"
        aria-hidden="true"
      />

      {/* Top Header */}
      <header className="relative z-10 mx-auto w-full max-w-[1400px] flex items-center justify-between">
        <Link href="/" className="group inline-flex items-center gap-2 text-ink hover:text-ember transition-colors">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span className="lp-display text-2xl font-bold">Native</span>
          <span className="lp-mono text-ink-faint">/ home</span>
        </Link>
        <div className="lp-mono hidden sm:flex items-center gap-2 text-ink-soft">
          <span className="h-2 w-2 rounded-full bg-jade animate-pulse" />
          Console Auth Gateway
        </div>
      </header>

      {/* Center Box */}
      <div className="relative z-10 my-auto flex w-full items-center justify-center py-10">
        <Reveal delay={100} className="w-full max-w-[460px]">
          <div className="border border-ink bg-white shadow-[8px_8px_0_#111111]">
            
            {/* Terminal-like Window Bar */}
            <div className="flex items-center justify-between border-b border-ink bg-paper-2 px-5 py-3.5">
              <span className="lp-mono text-ink">
                {isSignUp ? 'auth.provision' : 'auth.console'}
              </span>
              <span className="lp-mono flex items-center gap-2 text-ember">
                <span className="h-1.5 w-1.5 animate-pulse bg-ember" />
                secure
              </span>
            </div>

            <div className="p-7 sm:p-9">
              <h1 className="lp-display text-3xl text-ink">
                {isSignUp ? 'Create your operator account' : 'Sign in to the fleet'}
              </h1>
              <p className="mt-2 text-[14px] text-ink-soft">
                {isSignUp
                  ? 'Get 1 concurrent bot free forever. Zero credit card required.'
                  : 'Enter your credentials to access live telemetry and bot consoles.'}
              </p>

              {/* OAuth Providers */}
              <div className="mt-8 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={oauthLoading}
                  onClick={() => handleOAuth('google')}
                  className="flex items-center justify-center gap-2.5 border border-ink bg-paper p-3 text-[13px] font-mono font-bold text-ink uppercase tracking-wider shadow-[2px_2px_0_#111111] hover:bg-white hover:shadow-[4px_4px_0_#111111] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg className="h-4 w-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  Google
                </button>

                <button
                  type="button"
                  disabled={oauthLoading}
                  onClick={() => handleOAuth('github')}
                  className="flex items-center justify-center gap-2.5 border border-ink bg-paper p-3 text-[13px] font-mono font-bold text-ink uppercase tracking-wider shadow-[2px_2px_0_#111111] hover:bg-white hover:shadow-[4px_4px_0_#111111] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg className="h-4 w-4 fill-ink" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  GitHub
                </button>
              </div>

              {/* Divider */}
              <div className="relative my-7 flex items-center justify-center">
                <span className="absolute inset-x-0 h-px bg-rule" />
                <span className="relative bg-white px-3 lp-mono text-ink-faint text-[10px]">
                  OR EMAIL PROTOCOL
                </span>
              </div>

              {/* Email Form */}
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block lp-mono text-ink-soft mb-2 text-[11px]">
                    Email Address
                  </label>
                  <input
                    className="w-full border border-ink bg-paper px-4 py-3 font-mono text-[14px] text-ink focus:bg-white focus:border-ember focus:outline-none focus:ring-1 focus:ring-ember transition-colors"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    placeholder="operator@native.fleet"
                    autoComplete="username"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block lp-mono text-ink-soft text-[11px]">
                      Password
                    </label>
                    {!isSignUp && (
                      <span className="lp-mono text-[10px] text-ink-faint">
                        Encrypted SHA-256
                      </span>
                    )}
                  </div>
                  <input
                    className="w-full border border-ink bg-paper px-4 py-3 font-mono text-[14px] text-ink focus:bg-white focus:border-ember focus:outline-none focus:ring-1 focus:ring-ember transition-colors"
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    required
                  />
                </div>

                {error && (
                  <div className="border border-ember bg-ember/10 p-3.5 text-ember text-[13px] font-mono">
                    <p className="font-bold">// ERR:</p>
                    <p className="mt-0.5">{error}</p>
                  </div>
                )}

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="lp-btn w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Authorizing...
                      </>
                    ) : (
                      <>
                        {isSignUp ? 'Create Operator Account' : 'Authenticate Console'}
                        <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Bottom Toggle Bar */}
            <div className="border-t border-ink bg-paper-2 px-7 py-4 text-center">
              <p className="text-[13px] text-ink-soft">
                {isSignUp ? 'Already registered?' : 'New fleet operator?'}{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                  className="font-bold text-ember hover:underline ml-1"
                >
                  {isSignUp ? 'Sign in here' : 'Provision 1 Bot Free'}
                </button>
              </p>
            </div>

          </div>
        </Reveal>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mx-auto w-full max-w-[1400px] flex items-center justify-between text-ink-faint lp-mono text-[11px]">
        <p>© {new Date().getFullYear()} Native Infrastructure</p>
        <p>Zero-latency bot telemetry</p>
      </footer>
    </main>
  );
}
