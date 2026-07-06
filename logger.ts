import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from '../../lib/router';
import { Waves, Mail, Lock, AlertCircle, Loader2, Check } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { logger } from '../../lib/logger';

export default function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordChecks = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'Contains a number', valid: /\d/.test(password) },
    { label: 'Passwords match', valid: password.length > 0 && password === confirmPassword },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    logger.info('Signup attempt', { email });
    const { error: signUpError } = await signUp(email, password);

    if (signUpError) {
      logger.error('Signup failed', { email, error: signUpError });
      setError(signUpError);
      setLoading(false);
      return;
    }

    logger.info('Signup successful', { email });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 shadow-lg shadow-primary-200 mb-4">
            <Waves className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Rising Waters</h1>
          <p className="text-sm text-gray-500 mt-1">AI Flood Prediction System</p>
        </div>

        <div className="card p-6 sm:p-8 animate-slide-up">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Create your account</h2>
          <p className="text-sm text-gray-500 mb-6">Start predicting flood risk in minutes</p>

          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-error-50 border border-error-200 px-3.5 py-3 text-sm text-error-700 animate-fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="confirmPassword">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              {passwordChecks.map((check) => (
                <div key={check.label} className="flex items-center gap-2 text-xs">
                  <div className={`flex items-center justify-center w-4 h-4 rounded-full ${check.valid ? 'bg-success-500' : 'bg-gray-200'}`}>
                    {check.valid && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={check.valid ? 'text-success-600' : 'text-gray-400'}>
                    {check.label}
                  </span>
                </div>
              ))}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
