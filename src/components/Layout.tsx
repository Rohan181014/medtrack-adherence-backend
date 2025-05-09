import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarIcon, FileIcon, HomeIcon, PlusIcon, AlertCircleIcon, LogOutIcon } from 'lucide-react';

type LayoutProps = {
  children: React.ReactNode;
  requireAuth?: boolean;
};

export default function Layout({ children, requireAuth = true }: LayoutProps) {
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && requireAuth && !user) {
      navigate('/login', { replace: true });
    }
    if (!isLoading && !requireAuth && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, isLoading, requireAuth, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-blue-50">
      {requireAuth && (
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-2xl font-bold text-blue-600">MedTrack</h1>
                </div>
                <nav className="ml-6 flex items-center space-x-4">
                  <Link 
                    to="/dashboard" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/dashboard' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'text-gray-600 hover:text-blue-800 hover:bg-blue-50'
                    }`}>
                    <HomeIcon className="w-5 h-5 inline-block mr-1" />
                    Dashboard
                  </Link>
                  <Link 
                    to="/regimen" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/regimen' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'text-gray-600 hover:text-blue-800 hover:bg-blue-50'
                    }`}>
                    <PlusIcon className="w-5 h-5 inline-block mr-1" />
                    Regimen
                  </Link>
                  <Link 
                    to="/log" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/log' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'text-gray-600 hover:text-blue-800 hover:bg-blue-50'
                    }`}>
                    <CalendarIcon className="w-5 h-5 inline-block mr-1" />
                    Log Doses
                  </Link>
                  <Link 
                    to="/reminders" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/reminders' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'text-gray-600 hover:text-blue-800 hover:bg-blue-50'
                    }`}>
                    <AlertCircleIcon className="w-5 h-5 inline-block mr-1" />
                    Reminders
                  </Link>
                  <Link 
                    to="/reports" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/reports' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'text-gray-600 hover:text-blue-800 hover:bg-blue-50'
                    }`}>
                    <FileIcon className="w-5 h-5 inline-block mr-1" />
                    Reports
                  </Link>
                </nav>
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => signOut()}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50"
                >
                  <LogOutIcon className="w-5 h-5 inline-block mr-1" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>
      )}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
