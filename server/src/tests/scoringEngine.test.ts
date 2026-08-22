import { describe, it, expect } from 'vitest';
import { ScoringEngine } from '../services/scoringEngine.js';

describe('ScoringEngine Unit Tests', () => {
  describe('calculateBaseSkillsScore', () => {
    it('should return 45 if no skills are specified in the job', () => {
      const score = ScoringEngine.calculateBaseSkillsScore(
        ['React', 'TypeScript'],
        [],
        []
      );
      expect(score).toBe(45);
    });

    it('should calculate ratio score for required and preferred skills', () => {
      const score = ScoringEngine.calculateBaseSkillsScore(
        ['React', 'TypeScript', 'Tailwind CSS'],
        ['React', 'TypeScript', 'Node.js'], // 2 of 3 match = (2/3) * 35 = 23.33
        ['Tailwind CSS', 'Docker']          // 1 of 2 match = (1/2) * 10 = 5
      );
      expect(score).toBe(28); // 23.33 + 5 = 28.33 -> rounded to 28
    });

    it('should assign full weight of 45 to required skills if no preferred exist', () => {
      const score = ScoringEngine.calculateBaseSkillsScore(
        ['React', 'TypeScript'],
        ['React', 'TypeScript'], // 2 of 2 match = 45
        []
      );
      expect(score).toBe(45);
    });
  });

  describe('estimateExperienceYears', () => {
    it('should estimate experience correctly from start and end dates', () => {
      const experience = [
        { startDate: 'July 2022', endDate: 'Present' }, // 2026 - 2022 = 4 years
        { startDate: 'June 2020', endDate: 'June 2022' }, // 2022 - 2020 = 2 years
      ];
      const years = ScoringEngine.estimateExperienceYears(experience);
      expect(years).toBe(6);
    });

    it('should count same-year jobs as 0.5 years', () => {
      const experience = [
        { startDate: '2024', endDate: '2024' },
      ];
      const years = ScoringEngine.estimateExperienceYears(experience);
      expect(years).toBe(0.5);
    });
  });

  describe('calculateBaseExperienceScore', () => {
    it('should return 30 if no minimum experience is required', () => {
      const score = ScoringEngine.calculateBaseExperienceScore(5, null);
      expect(score).toBe(30);
    });

    it('should return 30 if candidate experience exceeds required', () => {
      const score = ScoringEngine.calculateBaseExperienceScore(5, 3);
      expect(score).toBe(30);
    });

    it('should return ratio score if candidate experience is below required', () => {
      const score = ScoringEngine.calculateBaseExperienceScore(1.5, 3); // 1.5/3 * 30 = 15
      expect(score).toBe(15);
    });
  });

  describe('calculateBaseEducationScore', () => {
    it('should return 10 if candidate degree matches requirement', () => {
      const score = ScoringEngine.calculateBaseEducationScore(
        [{ degree: "Bachelor's of Science" }],
        ["Bachelor's"]
      );
      expect(score).toBe(10);
    });

    it('should return 5 if candidate degree is below requirement but exists', () => {
      const score = ScoringEngine.calculateBaseEducationScore(
        [{ degree: "Associate Degree" }],
        ["Bachelor's"]
      );
      expect(score).toBe(5);
    });

    it('should return 2 if degree does not match hierarchy', () => {
      const score = ScoringEngine.calculateBaseEducationScore(
        [{ degree: "High School" }],
        ["Bachelor's"]
      );
      expect(score).toBe(2);
    });
  });

  describe('computeFinalResult', () => {
    it('should clamp values and return correct recommendation', () => {
      const baseSkills = 40;
      const baseExp = 25;
      const baseEdu = 10;
      const llmAdjustments = {
        skillsAdjustment: 5,         // 40+5 = 45 (max)
        experienceAdjustment: -5,     // 25-5 = 20
        educationAdjustment: 0,       // 10
        domainAlignmentScore: 12,    // 12
      };

      const result = ScoringEngine.computeFinalResult(
        baseSkills,
        baseExp,
        baseEdu,
        llmAdjustments,
        3.5
      );

      // Expected overall: 45 + 20 + 10 + 12 = 87
      expect(result.score).toBe(87);
      expect(result.recommendation).toBe('Strong Match');
      expect(result.scoreBreakdown.skills).toBe(45);
      expect(result.scoreBreakdown.experience).toBe(20);
    });
  });
});
