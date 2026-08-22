export interface Job {
  id: string;
  title: string;
  description: string;
  requirements: JobRequirements | null;
  createdAt: string;
  updatedAt: string;
  candidateCount?: number;
}

export interface JobRequirements {
  title?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  minimumExperience?: number | null;
  educationRequirements?: string[];
  responsibilities?: string[];
  keywords?: string[];
}

export interface Candidate {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  resumeFileName: string;
  resumeText: string;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
  education?: Education[];
  experience?: Experience[];
  skills?: CandidateSkill[];
  screenings?: ScreeningResult[];
}

export interface Education {
  id: string;
  candidateId: string;
  institution: string;
  degree: string | null;
  field: string | null;
  startYear: number | null;
  endYear: number | null;
}

export interface Experience {
  id: string;
  candidateId: string;
  company: string;
  role: string;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
}

export interface Skill {
  id: string;
  name: string;
}

export interface CandidateSkill {
  candidateId: string;
  skillId: string;
  skill: Skill;
  proficiency: string | null;
}

export interface ScoreBreakdown {
  skills: number;
  experience: number;
  education: number;
  alignment: number;
}

export interface ScreeningResult {
  id: string;
  candidateId: string;
  candidate?: Candidate;
  jobId: string;
  job?: {
    title: string;
    description: string;
  };
  score: number;
  recommendation: 'Strong Match' | 'Good Match' | 'Partial Match' | 'Weak Match';
  summary: string;
  strengths: string[];
  missingSkills: string[];
  relevantExperience: string[];
  concerns: string[];
  scoreBreakdown: ScoreBreakdown;
  createdAt: string;
}
