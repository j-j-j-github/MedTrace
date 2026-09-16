import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth';
import './Auth.css';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
}

export default function AuthPage({ initialMode }: AuthPageProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isRegister = initialMode 
    ? initialMode === 'register' 
    : location.pathname.startsWith('/signup');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');

  const switchToRegister = () => {
    setLoginError('');
    navigate('/signup');
  };

  const switchToLogin = () => {
    setSignupError('');
    navigate('/login');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      await authService.signIn(loginEmail, loginPassword);
      navigate('/dashboard');
    } catch (err: any) {
      setLoginError(err?.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    setSignupLoading(true);

    try {
      await authService.signUp(signupEmail, signupPassword, signupName);
      navigate('/dashboard');
    } catch (err: any) {
      setSignupError(err?.message || 'Failed to create an account. Please try again.');
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-scene">
        {/* Sliding stage container */}
        <div className={`stage ${isRegister ? 'is-register' : ''}`} id="stage">
          {/* TEXT PANEL */}
          <section className="panel panel--text">
            {/* Animated Lifeline EKG background - 3 large spaced nodes */}
            <div className="pulse-bg" aria-hidden="true">
              <div className="pulse-track">
                <svg viewBox="0 0 1800 300" preserveAspectRatio="none">
                  <path
                    className="pulse-base"
                    d="M0,150 L180,150 L220,120 L250,150 L280,165 L325,25 L375,270 L410,150 L450,110 L490,150 L760,150 L800,120 L830,150 L860,165 L905,25 L955,270 L990,150 L1030,110 L1070,150 L1340,150 L1380,120 L1410,150 L1440,165 L1485,25 L1535,270 L1570,150 L1610,110 L1650,150 L1800,150"
                  />
                  <path
                    className="pulse-highlight"
                    pathLength="2400"
                    d="M0,150 L180,150 L220,120 L250,150 L280,165 L325,25 L375,270 L410,150 L450,110 L490,150 L760,150 L800,120 L830,150 L860,165 L905,25 L955,270 L990,150 L1030,110 L1070,150 L1340,150 L1380,120 L1410,150 L1440,165 L1485,25 L1535,270 L1570,150 L1610,110 L1650,150 L1800,150"
                  />
                </svg>
              </div>
            </div>

            <div className="text-content">
              <div className="brand">
                <svg className="brand__mark" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  <path d="M3 12h4l2 6 4-14 2 8h6" />
                </svg>
                <span className="brand__name">MedTrace</span>
              </div>

              <div className="copy-stack">
                <div className="copy copy--login" data-copy="login">
                  <h1>Welcome to MedTrace.</h1>
                  <p>
                    Your entire medical history, instantly digitized, parsed by AI, and securely stored. 
                    Everything you need to track your health in one beautiful place.
                  </p>
                  <ul className="features">
                    <li>AI-powered record parsing</li>
                    <li>Premium dashboard with health metrics</li>
                    <li>Secure end-to-end encryption</li>
                  </ul>
                </div>

                <div className="copy copy--register" data-copy="register">
                  <h1>Join MedTrace today.</h1>
                  <p>
                    Stop digging through file cabinets. Digitize your records, get actionable AI insights, and take absolute control of your health journey.
                  </p>
                  <ul className="features">
                    <li>Batch upload and instant analysis</li>
                    <li>Intelligent search and categorization</li>
                    <li>Free to get started</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* AUTH PANEL */}
          <section className="panel panel--auth">
            <div className="auth-content">
              {/* LOGIN FORM */}
                <form
                  className="auth-form form--login"
                  data-form="login"
                  onSubmit={handleLoginSubmit}
                  noValidate
                >
                  <h2>Access your vault</h2>
                  <p className="form__sub">Sign in to your MedTrace account</p>

                  {loginError && <div className="auth-error-badge">{loginError}</div>}

                  <label>
                    Email address
                    <input
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </label>

                  <label>
                    Password
                    <input
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </label>

                  <button
                    type="submit"
                    className="auth-btn"
                    disabled={loginLoading}
                  >
                    {loginLoading ? 'Signing in…' : 'Sign in'}
                  </button>

                  <p className="auth-switch">
                    New to MedTrace?
                    <button
                      type="button"
                      className="auth-link"
                      onClick={switchToRegister}
                    >
                      Create an account
                    </button>
                  </p>
                </form>

                {/* REGISTER FORM */}
                <form
                  className="auth-form form--register"
                  data-form="register"
                  onSubmit={handleSignupSubmit}
                  noValidate
                >
                  <h2>Create your vault</h2>
                  <p className="form__sub">Set up your MedTrace account</p>

                  {signupError && <div className="auth-error-badge">{signupError}</div>}

                  <label>
                    Full name
                    <input
                      type="text"
                      name="name"
                      placeholder="Jordan Blake"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                  </label>

                  <label>
                    Email address
                    <input
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </label>

                  <label>
                    Password
                    <input
                      type="password"
                      name="password"
                      placeholder="At least 6 characters"
                      minLength={6}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                    />
                  </label>

                  <button
                    type="submit"
                    className="auth-btn"
                    disabled={signupLoading}
                  >
                    {signupLoading ? 'Creating account…' : 'Create account'}
                  </button>

                  <p className="auth-switch">
                    Already have an account?
                    <button
                      type="button"
                      className="auth-link"
                      onClick={switchToLogin}
                    >
                      Sign in
                    </button>
                  </p>
                </form>
            </div>
          </section>

          {/* Mobile-only footer description */}
          <p className="mobile-desc">
            Your entire medical history, instantly digitized and securely stored. Everything you need to track your health in one place.
          </p>
        </div>
      </div>
    </div>
  );
}
