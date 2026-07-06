import { Navigate } from '../lib/router';
import { useAuth } from '../lib/auth';
import { Waves } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">  
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-600 animate-pulse">
            <Waves className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm text-gray-500">Loading Rising Waters...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
