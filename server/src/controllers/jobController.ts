import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { jobCreateSchema, jobParseSchema } from '../schemas/validation.js';
import { LlmService } from '../services/llmService.js';

export class JobController {
  /**
   * Create a job description & extract structured requirements using the LLM.
   */
  public static async createJob(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Validate request body
      const validatedBody = jobCreateSchema.parse(req.body);
      const { title, description } = validatedBody;

      // 2. Extract structured requirements using LLM service
      let structuredRequirements = {};
      try {
        const rawExtraction = await LlmService.parseJobDescription(description);
        structuredRequirements = jobParseSchema.parse(rawExtraction);
      } catch (llmError: any) {
        console.error('[JobController] AI extraction failed, fallback to basic parsing:', llmError.message);
        // Fallback: create empty requirements so the system remains functional
        structuredRequirements = jobParseSchema.parse({
          title: title,
          requiredSkills: [],
          preferredSkills: [],
          minimumExperience: null,
          educationRequirements: [],
          responsibilities: [],
          keywords: [],
        });
        
        if (llmError.message.includes('OPENAI_API_KEY')) {
          throw llmError;
        }
      }

      // 3. Store in database
      const job = await prisma.job.create({
        data: {
          title,
          description,
          requirements: JSON.stringify(structuredRequirements),
        },
      });

      return res.status(201).json({
        success: true,
        data: {
          ...job,
          requirements: structuredRequirements,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all jobs with count of screened candidates.
   */
  public static async getJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const jobs = await prisma.job.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { screeningResults: true },
          },
        },
      });

      // Format counts and parse requirements JSON for response
      const formattedJobs = jobs.map((job: any) => ({
        id: job.id,
        title: job.title,
        description: job.description,
        requirements: JSON.parse(job.requirements as string || '{}'),
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        candidateCount: job._count.screeningResults,
      }));

      return res.status(200).json({
        success: true,
        data: formattedJobs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single job details.
   */
  public static async getJobById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const job = await prisma.job.findUnique({
        where: { id },
      });

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job description not found.',
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          ...job,
          requirements: JSON.parse(job.requirements as string || '{}'),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get ranked screening results for a job.
   */
  public static async getJobResults(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const job = await prisma.job.findUnique({
        where: { id },
      });

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job description not found.',
        });
      }

      const results = await prisma.screeningResult.findMany({
        where: { jobId: id },
        orderBy: { score: 'desc' },
        include: {
          candidate: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              resumeFileName: true,
              education: true,
              experience: true,
              skills: {
                include: {
                  skill: true
                }
              }
            },
          },
        },
      });

      // Parse JSON strings back into JS arrays/objects before returning
      const formattedResults = results.map((result: any) => ({
        ...result,
        strengths: JSON.parse(result.strengths as string || '[]'),
        missingSkills: JSON.parse(result.missingSkills as string || '[]'),
        relevantExperience: JSON.parse(result.relevantExperience as string || '[]'),
        concerns: JSON.parse(result.concerns as string || '[]'),
        scoreBreakdown: JSON.parse(result.scoreBreakdown as string || '{}'),
      }));

      return res.status(200).json({
        success: true,
        data: formattedResults,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export job screening results as a CSV file.
   */
  public static async exportJobResults(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const job = await prisma.job.findUnique({
        where: { id },
      });

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job description not found.',
        });
      }

      const results = await prisma.screeningResult.findMany({
        where: { jobId: id },
        orderBy: { score: 'desc' },
        include: {
          candidate: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      let csv = '\uFEFFRank,Candidate Name,Email,Phone,Match Score %,Recommendation,Strengths,Key Concerns,Missing Skills\n';
      results.forEach((r: any, idx: number) => {
        const strengths = JSON.parse(r.strengths as string || '[]').map((s: string) => s.replace(/"/g, '""')).join('; ');
        const concerns = JSON.parse(r.concerns as string || '[]').map((c: string) => c.replace(/"/g, '""')).join('; ');
        const missing = JSON.parse(r.missingSkills as string || '[]').map((m: string) => m.replace(/"/g, '""')).join('; ');
        
        const name = r.candidate.name.replace(/"/g, '""');
        const email = r.candidate.email.replace(/"/g, '""');
        const phone = (r.candidate.phone || '').replace(/"/g, '""');
        
        csv += `${idx + 1},"${name}","${email}","${phone}",${r.score},"${r.recommendation}","${strengths}","${concerns}","${missing}"\n`;
      });

      const fileName = `${job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-candidates.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      return res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
}
