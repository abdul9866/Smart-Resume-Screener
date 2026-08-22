import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Mail, Phone, BookOpen, Briefcase, Award, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { Candidate, ScreeningResult } from '../types/index.js';
import ScoreBreakdownCard from '../components/ScoreBreakdownCard.tsx';

export default function CandidateDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch Candidate Profile (includes education, experience, skills, and screenings)
  const { data: candidateResponse, isLoading, error } = useQuery({
    queryKey: ['candidate', id],
    queryFn: async () => {
      const res = await fetch(`/api/candidates/${id}`);
      if (!res.ok) throw new Error('Failed to load candidate profile.');
      return res.json();
    },
  });

  const candidate: Candidate | null = candidateResponse?.data || null;

  // Find the primary/latest screening result (or the one for the job they came from)
  // For simplicity, we choose the first screening result
  const screening: ScreeningResult | undefined = candidate?.screenings?.[0];

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <p className="mt-4 text-sm font-medium text-slate-500">Loading candidate profile...</p>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
          <h3 className="text-sm font-semibold text-rose-800">Profile Not Found</h3>
          <p className="mt-2 text-xs text-rose-600">{error ? (error as Error).message : 'Candidate profile does not exist.'}</p>
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to list</span>
        </button>
      </div>

      {/* Profile Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{candidate.name}</h1>
          <p className="text-xs text-slate-500 flex items-center gap-2">
            <span className="font-semibold">Source Resume:</span> {candidate.resumeFileName}
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-slate-600 pt-2">
            {candidate.email && (
              <span className="flex items-center space-x-1">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>{candidate.email}</span>
              </span>
            )}
            {candidate.phone && (
              <span className="flex items-center space-x-1">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>{candidate.phone}</span>
              </span>
            )}
          </div>
        </div>

        {screening && (
          <div className="flex items-center space-x-2 shrink-0 bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs">
            <Briefcase className="h-4 w-4 text-blue-600" />
            <div>
              <h4 className="font-semibold text-blue-900">Evaluation Context</h4>
              <p className="text-blue-700 font-medium mt-0.5">{screening.job?.title}</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Info Timeline vs Screening results */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        
        {/* Candidate Profile Details (Timelines) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Summary / About */}
          {candidate.summary && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                <span>Summary</span>
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {candidate.summary}
              </p>
            </div>
          )}

          {/* Technical Skills Badge list */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Technical Skills
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {candidate.skills && candidate.skills.length > 0 ? (
                candidate.skills.map((sk) => (
                  <span
                    key={sk.skillId}
                    className="bg-slate-100 text-slate-800 border border-slate-200/60 rounded-md px-2 py-0.5 text-xs font-medium"
                  >
                    {sk.skill.name}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No skills cataloged</span>
              )}
            </div>
          </div>

          {/* Experience Timeline */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
              <Briefcase className="h-4 w-4 text-slate-400" />
              <span>Work Experience History</span>
            </h2>

            {candidate.experience && candidate.experience.length > 0 ? (
              <div className="space-y-6 border-l-2 border-slate-100 pl-4 ml-2">
                {candidate.experience.map((exp) => (
                  <div key={exp.id} className="relative space-y-1">
                    {/* Timeline Node Icon */}
                    <div className="absolute -left-[25px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-slate-300"></div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs gap-1">
                      <h4 className="font-semibold text-slate-900">{exp.role}</h4>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">
                        {exp.startDate} - {exp.endDate || 'Present'}
                      </span>
                    </div>
                    <h5 className="text-[11px] font-medium text-slate-500">{exp.company}</h5>
                    {exp.description && (
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-line">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No work history listed</p>
            )}
          </div>

          {/* Education Timeline */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-slate-400" />
              <span>Education Credentials</span>
            </h2>

            {candidate.education && candidate.education.length > 0 ? (
              <div className="space-y-4">
                {candidate.education.map((edu) => (
                  <div key={edu.id} className="flex items-start space-x-3 text-xs">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-50 border border-slate-100 text-slate-500 shrink-0 mt-0.5">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-900">
                        {edu.degree || 'Degree'} {edu.field ? `in ${edu.field}` : ''}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{edu.institution}</p>
                      {(edu.startYear || edu.endYear) && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Timeline: {edu.startYear || '?'} - {edu.endYear || 'Present'}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No academic credentials listed</p>
            )}
          </div>

        </div>

        {/* Screening analysis details */}
        <div className="lg:col-span-1 space-y-6">
          
          {screening ? (
            <>
              {/* Breakdown Card */}
              <ScoreBreakdownCard
                breakdown={screening.scoreBreakdown}
                score={screening.score}
                recommendation={screening.recommendation}
              />

              {/* Justification summary */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                  Semantic Summary
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "{screening.summary}"
                </p>
              </div>

              {/* Match Factors: Strengths, Gaps, Experience, Concerns */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                  Matching Factors
                </h4>

                {/* Strengths */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">✓ Strengths</span>
                  {screening.strengths && (screening.strengths as string[]).length > 0 ? (
                    <ul className="space-y-1 text-xs text-slate-600 list-disc list-inside">
                      {(screening.strengths as string[]).map((st, i) => (
                        <li key={i} className="leading-relaxed pl-1 text-[11px] list-none flex items-start">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mr-1.5 shrink-0 mt-0.5" />
                          <span>{st}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs text-slate-400 italic">None highlighted</span>
                  )}
                </div>

                {/* Missing Skills */}
                <div className="space-y-2 border-t border-slate-50 pt-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">△ Gaps</span>
                  {screening.missingSkills && (screening.missingSkills as string[]).length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {(screening.missingSkills as string[]).map((gap, i) => (
                        <span key={i} className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded text-[10px] border border-rose-100 font-medium">
                          {gap}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No skill gaps identified</span>
                  )}
                </div>

                {/* Relevant Exp */}
                {screening.relevantExperience && (screening.relevantExperience as string[]).length > 0 && (
                  <div className="space-y-2 border-t border-slate-50 pt-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Relevant Experience</span>
                    <ul className="space-y-1 text-xs text-slate-600 list-disc list-inside">
                      {(screening.relevantExperience as string[]).map((rx, i) => (
                        <li key={i} className="leading-relaxed pl-1 text-[11px] list-none flex items-start">
                          <Award className="h-3.5 w-3.5 text-blue-500 mr-1.5 shrink-0 mt-0.5" />
                          <span>{rx}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Concerns */}
                <div className="space-y-2 border-t border-slate-50 pt-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Potential Concerns</span>
                  {screening.concerns && (screening.concerns as string[]).length > 0 ? (
                    <ul className="space-y-1 text-xs text-slate-600 list-disc list-inside">
                      {(screening.concerns as string[]).map((cn, i) => (
                        <li key={i} className="leading-relaxed pl-1 text-[11px] list-none flex items-start">
                          <AlertCircle className="h-3.5 w-3.5 text-amber-500 mr-1.5 shrink-0 mt-0.5" />
                          <span>{cn}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No red flags raised</span>
                  )}
                </div>

              </div>
            </>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <FileText className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-xs text-slate-500">
                This candidate profile is saved but has not been screened against a job description.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
