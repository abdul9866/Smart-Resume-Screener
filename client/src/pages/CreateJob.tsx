import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Briefcase, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import API_BASE from '../services/api.js';

const jobSchema = z.object({
  title: z.string().min(3, 'Job title must be at least 3 characters long'),
  description: z.string().min(30, 'Please write a more detailed description (at least 30 characters) to help the AI extract requirements accurately.'),
});

type JobFormValues = z.infer<typeof jobSchema>;

export default function CreateJob() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  // Mutation to create job
  const mutation = useMutation({
    mutationFn: async (values: JobFormValues) => {
      const res = await fetch(`${API_BASE}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create job.');
      }

      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate jobs queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      // Redirect to the newly created Job page for resume screening
      navigate(`/jobs/${data.data.id}`);
    },
  });

  const onSubmit = (values: JobFormValues) => {
    mutation.mutate(values);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back</span>
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Define Job Description</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create a job posting. Our semantic engine will analyze the requirements and match candidate resumes against it.
        </p>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {mutation.isError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 flex items-start space-x-2 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{(mutation.error as Error).message}</span>
            </div>
          )}

          {/* Job Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-slate-700">
              Job Title
            </label>
            <input
              id="title"
              type="text"
              placeholder="e.g. Senior Backend Engineer (Node.js)"
              className={`w-full rounded-lg border px-3.5 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                errors.title
                  ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                  : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-600'
              }`}
              {...register('title')}
            />
            {errors.title && (
              <span className="text-[11px] font-medium text-rose-600 block">{errors.title.message}</span>
            )}
          </div>

          {/* Job Description Textarea */}
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-slate-700">
              Job Details & Specifications
            </label>
            <textarea
              id="description"
              rows={12}
              placeholder="Paste the complete job description, including roles, responsibilities, technical stacks (React, SQL, AWS, etc.), degree requests, and minimum years of experience..."
              className={`w-full rounded-lg border px-3.5 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                errors.description
                  ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                  : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-600'
              }`}
              {...register('description')}
            />
            <span className="text-[10px] text-slate-400 block leading-normal">
              Tip: Include specific technical skills under a "Requirements" heading. Our parser will use these to evaluate matching coefficients.
            </span>
            {errors.description && (
              <span className="text-[11px] font-medium text-rose-600 block">{errors.description.message}</span>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              disabled={mutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center space-x-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-500/25 hover:bg-blue-500 transition disabled:opacity-75"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Extracting Specifications...</span>
                </>
              ) : (
                <>
                  <Briefcase className="h-4 w-4" />
                  <span>Create & Analyze Job</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
