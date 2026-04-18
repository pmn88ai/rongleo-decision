import { useState } from 'react';
import { MainLayout } from './layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { ToastContainer } from './components/ui/Toast';
import { StatusBar } from './components/ui/StatusBar';
import { useToast } from './hooks/useToast';
import { ThemeProvider, useTheme } from './theme/ThemeProvider';

function AppContent() {
  const { theme } = useTheme();
  const { toasts, showToast } = useToast();
  const [page, setPage] = useState('dashboard');
  const [activeProject, setActiveProject] = useState(null);
  const [listVersion, setListVersion] = useState(0);

  const handleSelectProject = (p) => {
    setActiveProject(p);
    setPage('dashboard');
  };

  const handleProjectCreated = (newProject) => {
    if (newProject?.id) setActiveProject(newProject);
    setListVersion((v) => v + 1);
    setPage('dashboard');
  };

  return (
    <div style={{ background: theme.bg, color: theme.text, minHeight: '100vh', transition: 'background 0.25s, color 0.25s' }}>
      {page === 'settings' ? (
        <Settings onBack={() => setPage('dashboard')} />
      ) : (
        <MainLayout
          activeProject={activeProject}
          setActiveProject={handleSelectProject}
          onSettings={() => setPage('settings')}
          showToast={showToast}
          refreshKey={listVersion}
        >
          <Dashboard activeProject={activeProject} showToast={showToast} onProjectCreated={handleProjectCreated} />
        </MainLayout>
      )}
      <ToastContainer toasts={toasts} />
      <StatusBar />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
