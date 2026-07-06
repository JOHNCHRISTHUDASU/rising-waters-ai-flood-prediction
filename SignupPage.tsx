import { Link } from '../lib/router';
import { Home, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 px-4">
      <div className="text-center max-w-md animate-slide-up">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-warning-50 mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-warning-600" />
        </div>
        <p className="text-6xl font-bold text-gray-900 mb-2">404</p>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-sm text-gray-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/dashboard" className="btn-primary">
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>
          <button onClick={() => window.history.back()} className="btn-secondary">
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
