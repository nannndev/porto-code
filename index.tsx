import React, { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App/App'; // Path updated to new structure
import PublicLanding from './src/features/Landing/PublicLanding';

const isPublicRoute = () => {
  const route = window.location.hash.replace(/^#\/?/, '');
  return route === '' || route === 'home';
};

const PortoCodeRoot: React.FC = () => {
  const [showLanding, setShowLanding] = useState(isPublicRoute);

  useEffect(() => {
    const syncRoute = () => setShowLanding(isPublicRoute());
    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  }, []);

  const enterWorkspace = useCallback(() => {
    window.location.hash = '/explorer';
    setShowLanding(false);
  }, []);

  return showLanding ? <PublicLanding onEnterWorkspace={enterWorkspace} /> : <App />;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <PortoCodeRoot />
  </React.StrictMode>
);
