import React, { useContext } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Login from './Login.jsx'
import './index.css'
import { AuthProvider, AuthContext } from './contexts/AuthContext.jsx' 

const originalFetch = window.fetch;

const PUBLIC_ROUTES = ['/api/login', '/api/register'];

window.fetch = async (resource, config) => {
  const url = typeof resource === 'string' ? resource : resource.url;

  // Only attach token to our own API calls (relative /api/ paths)
  const isOwnApi = url.startsWith('/api/') || url.startsWith(window.location.origin + '/api/');
  const isPublicRoute = PUBLIC_ROUTES.some(route => url.includes(route));

  if (isOwnApi && !isPublicRoute) {
    const token = localStorage.getItem('deskhub_token');

    if (token) {
      config = {
        ...(config || {}),
        headers: {
          ...(config?.headers || {}),
          'Authorization': `Bearer ${token}`,
        },
      };
    }
  }

  return originalFetch(resource, config);
};

function RootComponent() {
  const { loading, user } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return user ? <App /> : <Login />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <RootComponent />
  </AuthProvider>,
)