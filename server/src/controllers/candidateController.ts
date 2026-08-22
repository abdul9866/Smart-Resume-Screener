import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { PdfService } from '../services/pdfService.js';
import { LlmService } from '../services/llmService.js';
import { ScoringEngine } from '../services/scoringEngine.js';
import { candidateParseSchema, matchExplanationSchema } from '../schemas/validation.js';

export class CandidateController {
  private static formatScreening(s: any) {
    if (!s) return null;
    return {
      ...s,
      strengths: JSON.parse(s.strengths as string || '[]'),
      missingSkills: JSON.parse(s.missingSkills as string || '[]'),
      relevantExperience: JSON.parse(s.relevantExperience as string || '[]'),
      concerns: JSON.parse(s.concerns as string || '[]'),
      scoreBreakdown: JSON.parse(s.scoreBreakdown as string || '{}'),
    };
  }

  /**
   * Screen candidates against a job description.
   */
  public static async screenCandidates(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: jobId } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No resume PDF files uploaded.',
        });
      }

      // 1. Verify that the target Job description exists
      const job = await prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Target job description not found.',
        });
      }

      // Parse SQLite requirements JSON string
      const jobRequirements = job.requirements
        ? JSON.parse(job.requirements as string)
        : {
            requiredSkills: [],
            preferredSkills: [],
            minimumExperience: null,
            educationRequirements: [],
          };

      const screeningResults = [];

      for (const file of files) {
        try {
          console.log(`[Screening] Processing file: ${file.originalname}`);

          // 2. Extract and clean resume text
          const rawText = await PdfService.extractText(file.buffer);
          const cleanedText = PdfService.cleanText(rawText);

          // 3. Extract structured profile using LLM
          const rawParsedProfile = await LlmService.parseResume(cleanedText);
          const structuredProfile = candidateParseSchema.parse(rawParsedProfile);

          const { name, email, phone } = structuredProfile.candidate;

          // 4. Relational Database Transaction
          let candidateId: string;
          let existingCandidate = null;

          if (email) {
            existingCandidate = await prisma.candidate.findFirst({
              where: { email },
            });
          }

          if (existingCandidate) {
            candidateId = existingCandidate.id;
            console.log(`[Screening] Updating existing candidate: ${name} (${email})`);

            await prisma.candidate.update({
              where: { id: candidateId },
              data: {
                name,
                phone,
                resumeFileName: file.originalname,
                resumeText: cleanedText,
                summary: structuredProfile.summary,
              },
            });

            await prisma.education.deleteMany({ where: { candidateId } });
            await prisma.experience.deleteMany({ where: { candidateId } });
            await prisma.candidateSkill.deleteMany({ where: { candidateId } });
          } else {
            console.log(`[Screening] Creating new candidate: ${name}`);
            const newCandidate = await prisma.candidate.create({
              data: {
                name,
                email,
                phone,
                resumeFileName: file.originalname,
                resumeText: cleanedText,
                summary: structuredProfile.summary,
              },
            });
            candidateId = newCandidate.id;
          }

          // Insert Education records
          if (structuredProfile.education && structuredProfile.education.length > 0) {
            await prisma.education.createMany({
              data: structuredProfile.education.map((edu) => ({
                candidateId,
                institution: edu.institution,
                degree: edu.degree,
                field: edu.field,
                startYear: edu.startYear,
                endYear: edu.endYear,
              })),
            });
          }

          // Insert Experience records
          if (structuredProfile.experience && structuredProfile.experience.length > 0) {
            await prisma.experience.createMany({
              data: structuredProfile.experience.map((exp) => ({
                candidateId,
                company: exp.company,
                role: exp.role,
                startDate: exp.startDate,
                endDate: exp.endDate,
                description: exp.description,
              })),
            });
          }

          // Insert Skills and link to candidate
          if (structuredProfile.skills && structuredProfile.skills.length > 0) {
            for (const skillName of structuredProfile.skills) {
              const cleanedSkillName = skillName.trim();
              if (cleanedSkillName.length === 0) continue;

              const skill = await prisma.skill.upsert({
                where: { name: cleanedSkillName },
                update: {},
                create: { name: cleanedSkillName },
              });

              await prisma.candidateSkill.upsert({
                where: {
                  candidateId_skillId: {
                    candidateId,
                    skillId: skill.id,
                  },
                },
                update: {},
                create: {
                  candidateId,
                  skillId: skill.id,
                  proficiency: 'Intermediate',
                },
              });
            }
          }

          // 5. Calculate preliminary deterministic scores
          const baseSkillsScore = ScoringEngine.calculateBaseSkillsScore(
            structuredProfile.skills,
            jobRequirements.requiredSkills || [],
            jobRequirements.preferredSkills || []
          );

          const totalExpYears = ScoringEngine.estimateExperienceYears(structuredProfile.experience);
          const baseExpScore = ScoringEngine.calculateBaseExperienceScore(
            totalExpYears,
            jobRequirements.minimumExperience
          );

          const baseEduScore = ScoringEngine.calculateBaseEducationScore(
            structuredProfile.education,
            jobRequirements.educationRequirements || []
          );

          // 6. Get Semantic evaluation and adjustments from LLM
          const rawMatchResponse = await LlmService.matchCandidateToJob(
            structuredProfile,
            jobRequirements,
            cleanedText,
            job.description,
            baseSkillsScore,
            baseExpScore,
            baseEduScore
          );

          const validatedMatch = matchExplanationSchema.parse(rawMatchResponse);

          // 7. Compute final scoring metrics
          const finalResult = ScoringEngine.computeFinalResult(
            baseSkillsScore,
            baseExpScore,
            baseEduScore,
            validatedMatch,
            totalExpYears
          );

          // Delete any existing screening result for this specific candidate + job pair
          await prisma.screeningResult.deleteMany({
            where: {
              candidateId,
              jobId,
            },
          });

          // 8. Save screening results to database (Stringified JSON fields for SQLite)
          const screeningResult = await prisma.screeningResult.create({
            data: {
              candidateId,
              jobId,
              score: finalResult.score,
              recommendation: finalResult.recommendation,
              summary: validatedMatch.summary,
              strengths: JSON.stringify(validatedMatch.strengths),
              missingSkills: JSON.stringify(validatedMatch.missingSkills),
              relevantExperience: JSON.stringify(validatedMatch.relevantExperience),
              concerns: JSON.stringify(validatedMatch.concerns),
              scoreBreakdown: JSON.stringify(finalResult.scoreBreakdown),
            },
            include: {
              candidate: true,
            },
          });

          screeningResults.push(CandidateController.formatScreening(screeningResult));
        } catch (fileError: any) {
          console.error(`Error processing file ${file.originalname}:`, fileError);
          screeningResults.push({
            success: false,
            fileName: file.originalname,
            error: fileError.message || 'Failed to process resume.',
          });
        }
      }

      return res.status(200).json({
        success: true,
        data: screeningResults,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all candidates.
   */
  public static async getCandidates(req: Request, res: Response, next: NextFunction) {
    try {
      const candidates = await prisma.candidate.findMany({
        orderBy: { name: 'asc' },
        include: {
          skills: {
            include: { skill: true },
          },
          screenings: {
            include: { job: { select: { title: true } } },
          },
        },
      });

      // Parse JSON strings in screening histories before returning
      const formattedCandidates = candidates.map((candidate) => ({
        ...candidate,
        screenings: candidate.screenings.map(s => CandidateController.formatScreening(s)),
      }));

      return res.status(200).json({
        success: true,
        data: formattedCandidates,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get candidate details including education, experience, skills, and screening history.
   */
  public static async getCandidateById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const candidate = await prisma.candidate.findUnique({
        where: { id },
        include: {
          education: true,
          experience: true,
          skills: {
            include: { skill: true },
          },
          screenings: {
            include: {
              job: {
                select: {
                  title: true,
                  description: true,
                },
              },
            },
          },
        },
      });

      if (!candidate) {
        return res.status(404).json({
          success: false,
          error: 'Candidate profile not found.',
        });
      }

      // Parse JSON strings in screenings
      const formattedCandidate = {
        ...candidate,
        screenings: candidate.screenings.map(s => CandidateController.formatScreening(s)),
      };

      return res.status(200).json({
        success: true,
        data: formattedCandidate,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete candidate and all relations.
   */
  public static async deleteCandidate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const candidate = await prisma.candidate.findUnique({
        where: { id },
      });

      if (!candidate) {
        return res.status(404).json({
          success: false,
          error: 'Candidate profile not found.',
        });
      }

      await prisma.candidate.delete({
        where: { id },
      });

      return res.status(200).json({
        success: true,
        message: 'Candidate profile deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}
