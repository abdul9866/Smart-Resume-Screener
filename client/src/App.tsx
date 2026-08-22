import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FileText, Briefcase, Users, LayoutDashboard } from 'lucide-react';
import Dashboard from './pages/Dashboard.tsx';
import CreateJob from './pages/CreateJob.tsx';
import JobScreen from './pages/JobScreen.tsx';
import CandidateDetails from './pages/CandidateDetails.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Navigation() {
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
      </div>
    </header>
  );
}

// Simple fallback for `/candidates` route listing all candidates
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
        {/* We can re-use the Candidate listing API or simply load dashboard. To keep it simple we list candidates. */}
        <p className="text-slate-600">To inspect candidate matches and resumes, please select a Job description from the <Link to="/" className="text-blue-600 font-semibold hover:underline">Dashboard</Link> and run candidate screenings.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col">
          <Navigation />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/jobs/create" element={<CreateJob />} />
              <Route path="/jobs/:id" element={<JobScreen />} />
              <Route path="/candidates/:id" element={<CandidateDetails />} />
              <Route path="/candidates" element={<CandidatesPagePlaceholder />} />
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
