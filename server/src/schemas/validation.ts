import { z } from 'zod';

// Schema for client job creation input
export const jobCreateSchema = z.object({
  title: z.string().min(3, 'Job title must be at least 3 characters long'),
  description: z.string().min(10, 'Job description must be at least 10 characters long'),
});

// Schema for parsed LLM Candidate Resume structure
export const candidateParseSchema = z.object({
  candidate: z.object({
    name: z.string().default('Unknown'),
    email: z.string().email().nullable().or(z.string().nullable()).default(null),
    phone: z.string().nullable().default(null),
  }),
  summary: z.string().nullable().default(''),
  skills: z.array(z.string()).default([]),
  experience: z.array(
    z.object({
      company: z.string().default('Unknown'),
      role: z.string().default('Unknown'),
      startDate: z.string().nullable().default(null),
      endDate: z.string().nullable().default(null),
      description: z.string().nullable().default(''),
      relevantSkills: z.array(z.string()).default([]),
    })
  ).default([]),
  education: z.array(
    z.object({
      institution: z.string().default('Unknown'),
      degree: z.string().nullable().default(null),
      field: z.string().nullable().default(null),
      startYear: z.number().nullable().default(null),
      endYear: z.number().nullable().default(null),
    })
  ).default([]),
});

// Schema for parsed LLM Job Description requirements structure
export const jobParseSchema = z.object({
  title: z.string().default('Job Position'),
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  minimumExperience: z.number().nullable().default(null),
  educationRequirements: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
});

// Schema for parsed LLM Matching result structure
export const matchExplanationSchema = z.object({
  recommendation: z.enum(['Strong Match', 'Good Match', 'Partial Match', 'Weak Match']),
  summary: z.string().default(''),
  strengths: z.array(z.string()).default([]),
  missingSkills: z.array(z.string()).default([]),
  relevantExperience: z.array(z.string()).default([]),
  concerns: z.array(z.string()).default([]),
  
  skillsAdjustment: z.number().min(-5).max(5).default(0),
  experienceAdjustment: z.number().min(-5).max(5).default(0),
  educationAdjustment: z.number().min(-2).max(2).default(0),
  domainAlignmentScore: z.number().min(0).max(15).default(0),
  
  skillsExplanation: z.string().default(''),
  experienceExplanation: z.string().default(''),
  educationExplanation: z.string().default(''),
  alignmentExplanation: z.string().default(''),
});
