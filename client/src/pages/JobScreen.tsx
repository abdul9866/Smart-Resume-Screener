import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, UploadCloud, FileText, AlertCircle, Loader2, Sparkles, UserCheck, Briefcase } from 'lucide-react';
import { Job, ScreeningResult } from '../types/index.js';
import StatusBadge from '../components/StatusBadge.tsx';
import API_BASE from '../services/api.js';

export default function JobScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 1. Fetch Job description details
  const { data: jobResponse, isLoading: isLoadingJob, error: jobError } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/jobs/${id}`);
      if (!res.ok) throw new Error('Failed to fetch job description.');
      return res.json();
    },
  });

  // 2. Fetch Ranked screening results for this job
  const { data: resultsResponse, isLoading: isLoadingResults } = useQuery({
    queryKey: ['job-results', id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/jobs/${id}/results`);
      if (!res.ok) throw new Error('Failed to fetch ranked results.');
      return res.json();
    },
  });

  const job: Job | null = jobResponse?.data || null;
  const results: ScreeningResult[] = resultsResponse?.data || [];

  // 3. Mutation for screening upload
  const screenMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(`${API_BASE}/api/jobs/${id}/screen`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to parse and screen resumes.');
      }

      return res.json();
    },
    onSuccess: () => {
      setSelectedFiles(null);
      setUploadError(null);
      // Reset input element
      const fileInput = document.getElementById('resumes-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Invalidate queries to reload candidates and dashboard rankings
      queryClient.invalidateQueries({ queryKey: ['job-results', id] });
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (err: any) => {
      setUploadError(err.message || 'Error occurred during PDF upload.');
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(e.target.files);
      setUploadError(null);
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFiles || selectedFiles.length === 0) {
      setUploadError('Please select at least one resume PDF.');
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('resumes', selectedFiles[i]);
    }

    screenMutation.mutate(formData);
  };

  if (isLoadingJob) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <p className="mt-4 text-sm font-medium text-slate-500">Loading job details...</p>
      </div>
    );
  }

  if (jobError || !job) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
          <h3 className="text-sm font-semibold text-rose-800">Job description not found</h3>
          <p className="mt-2 text-xs text-rose-600">{jobError ? (jobError as Error).message : 'The job details do not exist.'}</p>
          <button 
            onClick={() => navigate('/')} 
            className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-500"
          >
            Go back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const reqs = job.requirements as any;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Back button */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Main Grid: Job description details vs uploads & results */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">
        
        {/* Job metadata sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-blue-600">
              <Briefcase className="h-5 w-5" />
              <span className="text-xs uppercase font-bold tracking-wider">Specifications</span>
            </div>
            
            <h1 className="text-xl font-bold text-slate-900 leading-tight">{job.title}</h1>
            
            {reqs && (
              <div className="border-t border-slate-100 pt-4 space-y-3 text-xs">
                {reqs.minimumExperience && (
                  <div>
                    <h4 className="font-semibold text-slate-500">Min Experience Required</h4>
                    <p className="text-slate-800 mt-0.5">{reqs.minimumExperience} years</p>
                  </div>
                )}
                {reqs.requiredSkills && reqs.requiredSkills.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-500">Key Required Skills</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {reqs.requiredSkills.map((s: string) => (
                        <span key={s} className="bg-slate-100 text-slate-800 rounded px-1.5 py-0.5 font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {reqs.preferredSkills && reqs.preferredSkills.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-500">Preferred Skills</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {reqs.preferredSkills.map((s: string) => (
                        <span key={s} className="bg-blue-50 text-blue-800 rounded px-1.5 py-0.5 font-medium border border-blue-100">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {reqs.educationRequirements && reqs.educationRequirements.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-500">Education Requirement</h4>
                    <p className="text-slate-800 mt-0.5">{reqs.educationRequirements.join(', ')}</p>
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-slate-100 pt-4 space-y-2">
              <h4 className="text-xs font-semibold text-slate-500">Public Application Link</h4>
              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/apply/${job.id}`}
                  className="block w-full rounded bg-slate-50 border border-slate-200 px-2 py-1 text-[10px] text-slate-600 focus:outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/apply/${job.id}`);
                    alert('Copied application link to clipboard!');
                  }}
                  className="rounded bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-blue-700 transition"
                >
                  Copy
                </button>
              </div>
              <p className="text-[10px] text-slate-400">Share this link with candidates. They can apply and upload resumes securely.</p>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-xs font-semibold text-slate-500 mb-1">Full Description</h4>
              <p className="text-[11px] text-slate-400 line-clamp-6 leading-relaxed whitespace-pre-line">
                {job.description}
              </p>
            </div>
          </div>
        </div>

        {/* Upload & Screening Area */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Upload card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Screen Candidate Resumes</h3>
            <p className="text-xs text-slate-500 mb-4">
              Upload PDF resumes. The system will extract text, parse achievements relationally, and score candidates transparently.
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="flex justify-center rounded-lg border border-dashed border-slate-300 px-6 py-8 bg-slate-50 hover:bg-slate-50/50 transition relative">
                <div className="text-center space-y-2">
                  <UploadCloud className="mx-auto h-8 w-8 text-slate-400" />
                  <div className="flex text-xs text-slate-600 justify-center">
                    <label
                      htmlFor="resumes-input"
                      className="relative cursor-pointer rounded bg-white font-semibold text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2"
                    >
                      <span>Upload files</span>
                      <input
                        id="resumes-input"
                        name="resumes"
                        type="file"
                        className="sr-only"
                        multiple
                        accept="application/pdf"
                        onChange={handleFileChange}
                        disabled={screenMutation.isPending}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-[10px] text-slate-400">PDF Resumes up to 5MB each (Max 10 files)</p>
                </div>
              </div>

              {/* Selected Files Preview */}
              {selectedFiles && selectedFiles.length > 0 && (
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Selected Resumes:</span>
                  <div className="space-y-1">
                    {Array.from(selectedFiles).map((file, idx) => (
                      <div key={idx} className="flex items-center space-x-1.5 text-xs text-slate-600">
                        <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{file.name}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors Display */}
              {uploadError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 flex items-start space-x-2 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center space-x-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-500/25 hover:bg-blue-500 transition disabled:opacity-75"
                  disabled={screenMutation.isPending || !selectedFiles || selectedFiles.length === 0}
                >
                  {screenMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Processing Resumes (AI parsing)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Upload & Screen Resumes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Results section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Ranked Match Results</h2>
              <div className="flex items-center space-x-3">
                <span className="text-xs font-medium text-slate-400">{results.length} candidates screened</span>
                {results.length > 0 && (
                  <a
                    href={`${API_BASE}/api/jobs/${id}/export`}
                    download
                    className="inline-flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 text-xs font-semibold shadow-sm transition"
                  >
                    <span>Export CSV</span>
                  </a>
                )}
              </div>
            </div>

            {isLoadingResults ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center flex flex-col items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <p className="mt-2 text-xs font-medium text-slate-500">Loading rankings...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
                <UserCheck className="mx-auto h-10 w-10 text-slate-300" />
                <h3 className="mt-4 text-sm font-semibold text-slate-900">No candidates screened yet</h3>
                <p className="mt-2 text-xs text-slate-500">
                  Select and upload candidate resumes to start evaluation.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result) => {
                  const highestEdu = result.candidate?.education?.[0]
                    ? `${result.candidate.education[0].degree || ''} in ${result.candidate.education[0].field || ''}`
                    : 'Not Specified';

                  // Extract sub-scores for summary visualization
                  const bd = result.scoreBreakdown;



                  return (
                    <div
                      key={result.id}
                      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md relative space-y-4"
                    >
                      {/* Card Header: Score, Name, status */}
                      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-slate-900">
                            {result.candidate?.name || 'Unknown Candidate'}
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate flex items-center">
                            <span className="font-medium mr-2">{result.candidate?.email || 'No Email'}</span>
                            <span>•</span>
                            <span className="ml-2">Resume: {result.candidate?.resumeFileName}</span>
                          </p>
                        </div>
                        <div className="flex items-center space-x-2.5 shrink-0">
                          <StatusBadge recommendation={result.recommendation} />
                          <div className="flex items-baseline space-x-0.5 font-bold text-slate-900">
                            <span className="text-lg leading-none">{result.score}</span>
                            <span className="text-[10px] text-slate-400 font-normal">/100</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Body: Gaps, Education, Justification */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-2">
                          {/* Matching Skills */}
                          <div>
                            <span className="font-semibold text-slate-500">Matching Skills:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {result.candidate?.skills && result.candidate.skills.length > 0 ? (
                                result.candidate.skills.slice(0, 4).map((sk) => (
                                  <span key={sk.skill.name} className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] border border-emerald-100 font-medium">
                                    {sk.skill.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400 italic">None detected</span>
                              )}
                              {result.candidate?.skills && result.candidate.skills.length > 4 && (
                                <span className="text-[10px] text-slate-400 font-medium self-center">+{result.candidate.skills.length - 4} more</span>
                              )}
                            </div>
                          </div>

                          {/* Gaps */}
                          <div>
                            <span className="font-semibold text-slate-500">Missing/Weak Skills:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(result.missingSkills as string[]).length > 0 ? (
                                (result.missingSkills as string[]).slice(0, 3).map((gap) => (
                                  <span key={gap} className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded text-[10px] border border-rose-100 font-medium">
                                    {gap}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400 italic">None identified</span>
                              )}
                              {(result.missingSkills as string[]).length > 3 && (
                                <span className="text-[10px] text-slate-400 font-medium self-center">+{(result.missingSkills as string[]).length - 3} more</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 border-slate-100 md:border-l md:pl-4">
                          <div>
                            <span className="font-semibold text-slate-500">Education:</span>
                            <p className="text-slate-700 mt-0.5 truncate">{highestEdu}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-500">Screening Justification:</span>
                            <p className="text-slate-600 mt-0.5 line-clamp-2 leading-relaxed italic">
                              "{result.summary}"
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Detail navigation */}
                      <div className="flex justify-between items-center border-t border-slate-100 pt-3 text-[11px]">
                        <div className="text-slate-400 flex items-center space-x-3">
                          <span>Skills Match: {bd?.skills || 0}/45</span>
                          <span>Experience Match: {bd?.experience || 0}/30</span>
                        </div>
                        <Link
                          to={`/candidates/${result.candidateId}`}
                          className="font-semibold text-blue-600 hover:text-blue-500 transition flex items-center"
                        >
                          <span>Detailed Candidate Analysis</span>
                          <span className="ml-0.5">&rarr;</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
