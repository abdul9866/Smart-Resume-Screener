import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Briefcase, Users, Award, TrendingUp, ChevronRight, Plus } from 'lucide-react';
import { Job, Candidate } from '../types/index.js';
import StatusBadge from '../components/StatusBadge.tsx';

export default function Dashboard() {
  // Fetch jobs
  const { data: jobsResponse, isLoading: isLoadingJobs, error: jobsError } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await fetch('/api/jobs');
      if (!res.ok) throw new Error('Failed to fetch jobs.');
      return res.json();
    },
  });

  // Fetch candidates
  const { data: candidatesResponse, isLoading: isLoadingCandidates } = useQuery({
    queryKey: ['candidates'],
    queryFn: async () => {
      const res = await fetch('/api/candidates');
      if (!res.ok) throw new Error('Failed to fetch candidates.');
      return res.json();
    },
  });

  const jobs: Job[] = jobsResponse?.data || [];
  const candidates: Candidate[] = candidatesResponse?.data || [];

  // Calculate statistics
  const totalJobs = jobs.length;
  const totalCandidates = candidates.length;

  // Flatten all screenings to find global stats
  const allScreenings = candidates.flatMap(c => c.screenings || []);
  const totalScreenings = allScreenings.length;
  
  const avgScore = totalScreenings > 0
    ? Math.round(allScreenings.reduce((sum, s) => sum + s.score, 0) / totalScreenings)
    : 0;

  // Shortlisted are Strong or Good Match candidates
  const shortlisted = allScreenings
    .filter(s => s.recommendation === 'Strong Match' || s.recommendation === 'Good Match')
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // top 5

  if (isLoadingJobs || isLoadingCandidates) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <p className="mt-4 text-sm font-medium text-slate-500">Loading recruiting dashboard...</p>
      </div>
    );
  }

  if (jobsError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
          <h3 className="text-sm font-semibold text-rose-800">Failed to load dashboard</h3>
          <p className="mt-2 text-xs text-rose-600">{(jobsError as Error).message || 'Server connection error.'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-500"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Recruiter Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Review candidate resume match statistics and manage active job listings.
          </p>
        </div>
        <Link
          to="/jobs/create"
          className="inline-flex items-center justify-center space-x-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-500 transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Job Description</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center space-x-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Jobs</p>
            <h3 className="text-xl font-bold text-slate-900">{totalJobs}</h3>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center space-x-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Candidates</p>
            <h3 className="text-xl font-bold text-slate-900">{totalCandidates}</h3>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center space-x-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Resumes Screened</p>
            <h3 className="text-xl font-bold text-slate-900">{totalScreenings}</h3>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center space-x-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Average Match Score</p>
            <h3 className="text-xl font-bold text-slate-900">{avgScore}%</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Active Jobs List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Active Job Postings</h2>
            <span className="text-xs font-medium text-slate-400">{totalJobs} job listings</span>
          </div>

          {jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
              <Briefcase className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-4 text-sm font-semibold text-slate-900">No job descriptions yet</h3>
              <p className="mt-2 text-xs text-slate-500">
                To start screening resumes, first create a job description.
              </p>
              <Link
                to="/jobs/create"
                className="mt-4 inline-flex items-center space-x-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Job</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <ul className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <li key={job.id} className="relative transition hover:bg-slate-50">
                    <Link to={`/jobs/${job.id}`} className="block p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-slate-900 truncate">
                            {job.title}
                          </h3>
                          <div className="mt-2 flex items-center space-x-4 text-xs text-slate-400">
                            <span className="flex items-center space-x-1">
                              <Users className="h-3.5 w-3.5" />
                              <span>{job.candidateCount || 0} candidates screened</span>
                            </span>
                            <span>Created {new Date(job.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div>
                          <ChevronRight className="h-5 w-5 text-slate-300" />
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Shortlisted Candidates sidebar */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Top Shortlisted</h2>

          {shortlisted.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <Award className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-xs text-slate-400">No candidates match the shortlist criteria yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">Screen candidates to view recommendations.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block border-b border-slate-100 pb-2">
                Highest Match Rankings
              </span>
              <div className="space-y-3">
                {shortlisted.map((screen) => (
                  <Link
                    key={screen.id}
                    to={`/candidates/${screen.candidateId}`}
                    className="flex items-center justify-between p-2.5 rounded-lg transition hover:bg-slate-50 border border-transparent hover:border-slate-100"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-slate-800 truncate">
                        {screen.candidate?.name || 'Unknown Candidate'}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {screen.job?.title || 'Job Match'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <StatusBadge recommendation={screen.recommendation} />
                      <span className="text-xs font-bold text-slate-800">{screen.score}%</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
