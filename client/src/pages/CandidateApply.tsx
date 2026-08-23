import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Briefcase, UploadCloud, CheckCircle, AlertCircle, Loader2, Mail, Phone } from 'lucide-react';
import { Job } from '../types/index.js';
import API_BASE from '../services/api.js';

export default function CandidateApply() {
  const { id } = useParams<{ id: string }>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  // 1. Fetch Job description details
  const { data: jobResponse, isLoading: isLoadingJob, error: jobError } = useQuery({
    queryKey: ['job-public', id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/jobs/${id}`);
      if (!res.ok) throw new Error('Failed to fetch job description.');
      return res.json();
    },
  });

  const job: Job | null = jobResponse?.data || null;

  // 2. Mutation for application upload
  const applyMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(`${API_BASE}/api/jobs/${id}/screen`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to submit application.');
      }

      return res.json();
    },
    onSuccess: (data) => {
      // The backend returns the list of screening results.
      // We'll find the candidate we just uploaded in the result set or read their extracted profile.
      const candidateInfo = data.data?.[0]?.candidate || {};
      setSuccessData(candidateInfo);
    },
    onError: (err: any) => {
      setUploadError(err.message);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setUploadError('Only PDF files are supported.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a resume file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('resumes', selectedFile);
    applyMutation.mutate(formData);
  };

  if (isLoadingJob) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500 font-medium">Loading job details...</p>
      </div>
    );
  }

  if (jobError || !job) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-lg font-semibold text-slate-900">Job Listing Not Found</h2>
        <p className="mt-2 text-sm text-slate-500">The link you followed may be invalid or the job description has been removed.</p>
      </div>
    );
  }

  // Render Success Screen
  if (successData) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-100/50">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
            Application Submitted!
          </h2>
          <p className="mt-2 text-slate-500">
            Thank you for applying to the <span className="font-semibold text-slate-700">{job.title}</span> position. Our recruiting team has successfully received and parsed your profile.
          </p>

          <div className="my-8 rounded-xl bg-slate-50 p-6 text-left border border-slate-100">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Extracted Profile Details</h3>
            <div className="space-y-3">
              <div>
                <span className="block text-xs font-medium text-slate-400">Name</span>
                <span className="text-sm font-semibold text-slate-800">{successData.name || 'Not extracted'}</span>
              </div>
              {successData.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-600">{successData.email}</span>
                </div>
              )}
              {successData.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-600">{successData.phone}</span>
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-400">
            We will contact you via email or phone if your profile aligns with our requirements.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-6">
        <div className="flex items-center space-x-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Briefcase className="h-5 w-5" />
          </div>
          <span className="font-semibold text-lg text-slate-900">Careers Portal</span>
        </div>
        <Link to="/login" className="text-xs font-medium text-slate-500 hover:text-blue-600 transition">
          Recruiter Login
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Job Details Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 border border-blue-100">
              Active Job Listing
            </span>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">{job.title}</h1>
            <p className="mt-1 text-xs text-slate-400">Posted on {new Date(job.createdAt).toLocaleDateString()}</p>
            
            <div className="mt-6 border-t border-slate-100 pt-6">
              <h3 className="font-semibold text-slate-800 text-sm mb-3">Job Description</h3>
              <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{job.description}</p>
            </div>
          </div>
        </div>

        {/* Upload Form Side */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Submit Application</h2>
            <p className="mt-1 text-xs text-slate-500">Upload your resume to instantly apply for this role.</p>

            <form onSubmit={handleFormSubmit} className="mt-6 space-y-4">
              {uploadError && (
                <div className="flex items-start space-x-2 rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-100">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Upload Box */}
              <div className="flex justify-center rounded-xl border border-dashed border-slate-200 px-4 py-8 bg-slate-50/50 hover:bg-slate-50/80 transition duration-150 relative">
                <input
                  type="file"
                  id="resume"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 cursor-pointer opacity-0 w-full h-full"
                  disabled={applyMutation.isPending}
                />
                <div className="text-center space-y-2">
                  <UploadCloud className="mx-auto h-8 w-8 text-slate-400" />
                  <div className="text-xs text-slate-600 font-medium">
                    {selectedFile ? (
                      <span className="text-blue-600 underline font-semibold block max-w-[200px] truncate">{selectedFile.name}</span>
                    ) : (
                      <>
                        <span className="text-blue-600 underline font-semibold">Select PDF</span> or drag and drop
                      </>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">PDF Resumes up to 5MB</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={applyMutation.isPending || !selectedFile}
                className="flex w-full justify-center items-center rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition duration-150"
              >
                {applyMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting Application...
                  </>
                ) : (
                  'Apply Now'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
