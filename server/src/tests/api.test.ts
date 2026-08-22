import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { LlmService } from '../services/llmService.js';
import { prisma } from '../lib/prisma.js';

describe('API Integration Tests', () => {
  beforeAll(() => {
    // Mock the LLM service to make API calls fast and local
    vi.spyOn(LlmService, 'parseJobDescription').mockResolvedValue({
      title: 'Mock Software Engineer',
      requiredSkills: ['Node.js', 'React'],
      preferredSkills: ['PostgreSQL'],
      minimumExperience: 3,
      educationRequirements: ["Bachelor's"],
      responsibilities: ['Write code'],
      keywords: ['Software'],
    });

    vi.spyOn(LlmService, 'parseResume').mockResolvedValue({
      candidate: {
        name: 'Mock Candidate',
        email: 'mock@candidate.com',
        phone: '123-456-7890',
      },
      summary: 'Experienced developer',
      skills: ['Node.js', 'React', 'MongoDB'],
      experience: [
        {
          company: 'Mock Corp',
          role: 'Fullstack Dev',
          startDate: '2022',
          endDate: 'Present',
          description: 'Working with React and Node',
          relevantSkills: ['React', 'Node.js'],
        },
      ],
      education: [
        {
          institution: 'Mock Univ',
          degree: "Bachelor's",
          field: 'CS',
          startYear: 2018,
          endYear: 2022,
        },
      ],
    });

    vi.spyOn(LlmService, 'matchCandidateToJob').mockResolvedValue({
      recommendation: 'Good Match',
      summary: 'Candidate fits the requirements moderately well.',
      strengths: ['Has required skills'],
      missingSkills: ['PostgreSQL'],
      relevantExperience: ['Built web services'],
      concerns: ['No direct PostgreSQL database exposure'],
      skillsAdjustment: 2,
      experienceAdjustment: 0,
      educationAdjustment: 0,
      domainAlignmentScore: 10,
      skillsExplanation: 'Slight positive due to MongoDB background',
      experienceExplanation: 'Experience aligns with role description',
      educationExplanation: 'CS degree holds validity',
      alignmentExplanation: 'Domain matches',
    });
  });

  describe('GET /api/health', () => {
    it('should return 200 ok status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('POST /api/jobs Validation', () => {
    it('should reject invalid payloads with 400', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .send({
          title: 'A', // too short
          description: 'Short', // too short
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation Error');
    });

    it('should successfully create a valid job', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .send({
          title: 'Mock Software Developer',
          description: 'We are seeking a senior React and Node developer with 3 years of experience. Must hold a Bachelor\'s degree.',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Mock Software Developer');
      
      // Cleanup the created job from the database
      if (res.body.data.id) {
        await prisma.job.delete({
          where: { id: res.body.data.id },
        });
      }
    });
  });
});
