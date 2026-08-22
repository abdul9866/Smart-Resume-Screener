export interface ScoringBreakdown {
  skills: number;
  experience: number;
  education: number;
  alignment: number;
}

export interface HybridScoringResult {
  score: number;
  recommendation: string;
  scoreBreakdown: ScoringBreakdown;
  baseSkillsScore: number;
  baseExperienceScore: number;
  baseEducationScore: number;
  totalExperienceYears: number;
}

export class ScoringEngine {
  /**
   * Helper to normalize strings for comparison (lowercasing, trimming, removing non-alphanumeric chars)
   */
  private static normalize(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  }

  /**
   * Calculate baseline skills score (max 45)
   */
  public static calculateBaseSkillsScore(
    candidateSkills: string[],
    requiredSkills: string[],
    preferredSkills: string[]
  ): number {
    if (requiredSkills.length === 0 && preferredSkills.length === 0) {
      return 45; // No skills specified, give baseline maximum
    }

    const candidateNormalized = new Set(candidateSkills.map(this.normalize));
    const requiredNormalized = requiredSkills.map(this.normalize);
    const preferredNormalized = preferredSkills.map(this.normalize);

    let matchedRequired = 0;
    requiredNormalized.forEach((req) => {
      if (candidateNormalized.has(req)) {
        matchedRequired++;
      }
    });

    let matchedPreferred = 0;
    preferredNormalized.forEach((pref) => {
      if (candidateNormalized.has(pref)) {
        matchedPreferred++;
      }
    });

    const hasRequired = requiredSkills.length > 0;
    const hasPreferred = preferredSkills.length > 0;

    let requiredWeight = 45;
    let preferredWeight = 0;

    if (hasRequired && hasPreferred) {
      requiredWeight = 35;
      preferredWeight = 10;
    } else if (hasPreferred) {
      requiredWeight = 0;
      preferredWeight = 45;
    }

    const requiredScore = hasRequired ? (matchedRequired / requiredSkills.length) * requiredWeight : requiredWeight;
    const preferredScore = hasPreferred ? (matchedPreferred / preferredSkills.length) * preferredWeight : preferredWeight;

    return Math.round(requiredScore + preferredScore);
  }

  /**
   * Estimates total years of experience from parsed candidate work history.
   */
  public static estimateExperienceYears(experience: Array<{ startDate?: string | null; endDate?: string | null }>): number {
    const currentYear = new Date().getFullYear();
    let totalYears = 0;

    for (const exp of experience) {
      const startStr = exp.startDate?.trim();
      const endStr = exp.endDate?.trim();

      if (!startStr) continue;

      // Extract 4-digit years using regex
      const startYearMatch = startStr.match(/\b(19\d{2}|20\d{2})\b/);
      if (!startYearMatch) continue;
      const startYear = parseInt(startYearMatch[0], 10);

      let endYear = currentYear;
      if (endStr) {
        const isPresent = /present|current|now|active/i.test(endStr);
        if (!isPresent) {
          const endYearMatch = endStr.match(/\b(19\d{2}|20\d{2})\b/);
          if (endYearMatch) {
            endYear = parseInt(endYearMatch[0], 10);
          }
        }
      }

      let diff = endYear - startYear;
      if (diff < 0) diff = 0;
      if (diff === 0) diff = 0.5; // Count same-year roles as 6 months

      totalYears += diff;
    }

    // Round to 1 decimal place
    return Math.round(totalYears * 10) / 10;
  }

  /**
   * Calculate baseline experience score (max 30)
   */
  public static calculateBaseExperienceScore(totalYears: number, minimumYears: number | null): number {
    if (minimumYears === null || minimumYears <= 0) {
      return 30; // No requirement specified
    }

    if (totalYears >= minimumYears) {
      return 30;
    }

    // Ratio scale
    return Math.round((totalYears / minimumYears) * 30);
  }

  /**
   * Calculates education score based on degree relevance (max 10)
   */
  public static calculateBaseEducationScore(
    candidateEducation: Array<{ degree?: string | null }>,
    requiredDegrees: string[]
  ): number {
    if (!requiredDegrees || requiredDegrees.length === 0) {
      return 10; // No requirements specified
    }

    const degreesHierarchy: Record<string, number> = {
      'phd': 5,
      'doctorate': 5,
      'master': 4,
      'ms': 4,
      'msc': 4,
      'mba': 4,
      'mtech': 4,
      'bachelor': 3,
      'bs': 3,
      'bsc': 3,
      'ba': 3,
      'btech': 3,
      'be': 3,
      'associate': 2,
      'diploma': 2,
      'highschool': 1,
    };

    let maxCandidateRank = 0;
    candidateEducation.forEach((edu) => {
      if (!edu.degree) return;
      const degNormalized = edu.degree.toLowerCase();
      
      // Find matching rank
      for (const [key, rank] of Object.entries(degreesHierarchy)) {
        if (degNormalized.includes(key)) {
          if (rank > maxCandidateRank) {
            maxCandidateRank = rank;
          }
          break;
        }
      }
    });

    let maxRequiredRank = 0;
    requiredDegrees.forEach((req) => {
      const reqNormalized = req.toLowerCase();
      for (const [key, rank] of Object.entries(degreesHierarchy)) {
        if (reqNormalized.includes(key)) {
          if (rank > maxRequiredRank) {
            maxRequiredRank = rank;
          }
          break;
        }
      }
    });

    if (maxCandidateRank >= maxRequiredRank && maxRequiredRank > 0) {
      return 10; // Meets or exceeds requirements
    } else if (maxCandidateRank > 0) {
      return 5; // Has some lesser degree
    }

    return 2; // No matching degree
  }

  /**
   * Clamp numbers between min and max
   */
  private static clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
  }

  /**
   * Combines baseline scores and LLM semantic adjustments to get the final score and category.
   */
  public static computeFinalResult(
    baseSkillsScore: number,
    baseExpScore: number,
    baseEduScore: number,
    llmResponseJson: any,
    totalExperienceYears: number
  ): HybridScoringResult {
    const skillsAdjustment = parseInt(llmResponseJson.skillsAdjustment || '0', 10);
    const experienceAdjustment = parseInt(llmResponseJson.experienceAdjustment || '0', 10);
    const educationAdjustment = parseInt(llmResponseJson.educationAdjustment || '0', 10);
    const domainAlignmentScore = parseInt(llmResponseJson.domainAlignmentScore || '0', 10);

    const skillsScore = this.clamp(baseSkillsScore + skillsAdjustment, 0, 45);
    const experienceScore = this.clamp(baseExpScore + experienceAdjustment, 0, 30);
    const educationScore = this.clamp(baseEduScore + educationAdjustment, 0, 10);
    const alignmentScore = this.clamp(domainAlignmentScore, 0, 15);

    const totalScore = skillsScore + experienceScore + educationScore + alignmentScore;
    const finalScore = this.clamp(Math.round(totalScore), 0, 100);

    // Score recommendation mapping
    let recommendation = 'Weak Match';
    if (finalScore >= 85) {
      recommendation = 'Strong Match';
    } else if (finalScore >= 70) {
      recommendation = 'Good Match';
    } else if (finalScore >= 50) {
      recommendation = 'Partial Match';
    }

    return {
      score: finalScore,
      recommendation,
      scoreBreakdown: {
        skills: skillsScore,
        experience: experienceScore,
        education: educationScore,
        alignment: alignmentScore,
      },
      baseSkillsScore,
      baseExperienceScore: baseExpScore,
      baseEducationScore: baseEduScore,
      totalExperienceYears,
    };
  }
}
