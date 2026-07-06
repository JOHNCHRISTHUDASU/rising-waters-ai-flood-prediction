import { Link } from '../lib/router';
import { Home, AlertCircle, RefreshCw } from 'lucide-react';

export default function ServerErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-error-50 via-white to-warning-50 px-4">
      <div className="text-center max-w-md animate-slide-up">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-error-50 mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-error-600" />
        </div>
        <p className="text-6xl font-bold text-gray-900 mb-2">500</p>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Server Error</h1>
        <p className="text-sm text-gray-500 mb-8">
          Something went wrong on our end. Please try again in a moment.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/dashboard" className="btn-primary">
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>
          <button onClick={() => window.location.reload()} className="btn-secondary">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
