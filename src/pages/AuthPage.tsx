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
        {/* Animated Lifeline EKG background */}
        <div className="pulse-bg" aria-hidden="true">
          <div className="pulse-track">
            <svg viewBox="0 0 1800 200" preserveAspectRatio="none">
              <path
                className="pulse-base"
                d="M0,100 L140,100 L165,30 L195,170 L225,60 L255,100 L420,100 L445,30 L475,170 L505,60 L535,100 L700,100 L725,30 L755,170 L785,60 L815,100 L900,100 L1040,100 L1065,30 L1095,170 L1125,60 L1155,100 L1320,100 L1345,30 L1375,170 L1405,60 L1435,100 L1600,100 L1625,30 L1655,170 L1685,60 L1715,100 L1800,100"
              />
              <path
                className="pulse-highlight"
                pathLength="1000"
                d="M0,100 L140,100 L165,30 L195,170 L225,60 L255,100 L420,100 L445,30 L475,170 L505,60 L535,100 L700,100 L725,30 L755,170 L785,60 L815,100 L900,100 L1040,100 L1065,30 L1095,170 L1125,60 L1155,100 L1320,100 L1345,30 L1375,170 L1405,60 L1435,100 L1600,100 L1625,30 L1655,170 L1685,60 L1715,100 L1800,100"
              />
            </svg>
          </div>
        </div>

        {/* Sliding stage container */}
        <div className={`stage ${isRegister ? 'is-register' : ''}`} id="stage">
          {/* TEXT PANEL */}
          <section className="panel panel--text">
            <div className="text-content">
              <div className="brand">
                <svg className="brand__mark" viewBox="0 0 24 24">
                  <path d="M3 12h4l2 6 4-14 2 8h6" />
                </svg>
                <span className="brand__name">MedTrace</span>
              </div>

              <div className="copy-stack">
                <div className="copy copy--login" data-copy="login">
                  <h1>Every appointment, prescription, and result — kept in one place.</h1>
                  <p>
                    Sign in to pick up where you left off. Your records stay private,
                    organized, and yours.
                  </p>
                  <ul className="features">
                    <li>Timeline of every visit, synced automatically</li>
                    <li>Share records with a doctor in one tap</li>
                    <li>Encrypted end-to-end, always</li>
                  </ul>
                </div>

                <div className="copy copy--register" data-copy="register">
                  <h1>Start keeping a real record of your health.</h1>
                  <p>
                    One account holds your entire history — no digging through folders
                    or asking the front desk to fax anything.
                  </p>
                  <ul className="features">
                    <li>Free to start, no card required</li>
                    <li>Import past records anytime</li>
                    <li>You control who sees what</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* AUTH PANEL */}
          <section className="panel panel--auth">
            <div className="auth-card">
              <div className="card__face">
                {/* LOGIN FORM */}
                <form
                  className="auth-form form--login"
                  data-form="login"
                  onSubmit={handleLoginSubmit}
                  noValidate
                >
                  <h2>Welcome back</h2>
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
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
