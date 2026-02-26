import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  // Auto-redirect to home after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/', { replace: true });
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-[#E8312A] rounded-2xl mb-6">
          <span className="text-5xl font-bold text-white">404</span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Page Not Found</h1>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist. Redirecting you to the dashboard...
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/', { replace: true })}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#E8312A] text-white rounded-xl font-medium hover:bg-[#d12922] transition-colors"
          >
            <Home className="w-5 h-5" />
            Go to Dashboard
          </button>
          
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors border border-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          Auto-redirecting in 3 seconds...
        </div>
      </div>
    </div>
  );
}
