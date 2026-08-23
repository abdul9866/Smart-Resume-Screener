import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FileText, Briefcase, Users, LayoutDashboard, LogOut } from 'lucide-react';
import Dashboard from './pages/Dashboard.tsx';
import CreateJob from './pages/CreateJob.tsx';
import JobScreen from './pages/JobScreen.tsx';
import CandidateDetails from './pages/CandidateDetails.tsx';
import CandidateApply from './pages/CandidateApply.tsx';
import Login from './pages/Login.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

interface NavigationProps {
  onLogout: () => void;
}

function Navigation({ onLogout }: NavigationProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to="/" className="flex items-center space-x-2 text-slate-900 transition hover:opacity-90">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-500/30">
            <FileText className="h-5 w-5" />
          </div>
          <span className="font-semibold text-lg tracking-tight">Smart Resume Screener</span>
        </Link>

        {/* Links */}
        <div className="flex items-center space-x-4">
          <nav className="flex space-x-1 sm:space-x-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center space-x-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </NavLink>
            <NavLink
              to="/jobs/create"
              className={({ isActive }) =>
                `flex items-center space-x-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Briefcase className="h-4 w-4" />
              <span>Create Job</span>
            </NavLink>
            <NavLink
              to="/candidates"
              className={({ isActive }) =>
                `flex items-center space-x-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Candidates</span>
            </NavLink>
          </nav>

          <div className="h-6 w-px bg-slate-200" />

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center space-x-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}

// Simple placeholder listing all candidates for Admin
function CandidatesPagePlaceholder() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">All Candidates</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage all candidates registered in the platform database.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-slate-600">
          To inspect candidate matches and resumes, please select a Job description from the{' '}
          <Link to="/" className="text-blue-600 font-semibold hover:underline">
            Dashboard
          </Link>{' '}
          and run candidate screenings.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('isAdmin') === 'true');

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    setIsAdmin(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col">
          {isAdmin && <Navigation onLogout={handleLogout} />}
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/apply/:id" element={<CandidateApply />} />
              <Route
                path="/login"
                element={
                  isAdmin ? (
                    <Navigate to="/" replace />
                  ) : (
                    <Login onLoginSuccess={() => setIsAdmin(true)} />
                  )
                }
              />

              {/* Protected Recruiter/Admin Routes */}
              <Route
                path="/"
                element={isAdmin ? <Dashboard /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/jobs/create"
                element={isAdmin ? <CreateJob /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/jobs/:id"
                element={isAdmin ? <JobScreen /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/candidates/:id"
                element={isAdmin ? <CandidateDetails /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/candidates"
                element={isAdmin ? <CandidatesPagePlaceholder /> : <Navigate to="/login" replace />}
              />

              {/* Catch-all Redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <footer className="border-t border-slate-200 bg-white py-6 mt-12">
            <div className="mx-auto max-w-7xl px-4 text-center text-xs text-slate-400 sm:px-6 lg:px-8">
              Smart Resume Screener — Screening assistant for recruiting managers. Candidate evaluation scores are advisory only.
            </div>
          </footer>
        </div>
      </Router>
    </QueryClientProvider>
  );
}
