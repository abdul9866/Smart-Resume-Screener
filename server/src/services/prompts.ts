export const resumeExtractionPrompt = (resumeText: string): string => {
  return `You are an expert AI resume parsing system.
Your job is to parse the raw resume text into structured candidate information.

Input Resume Text:
"""
${resumeText}
"""

Please extract and return a valid JSON object matching the following structure.
DO NOT include any markdown formatting wrappers (like \`\`\`json or \`\`\`), code blocks, or extra text. Return ONLY the raw JSON string.

Schema:
{
  "candidate": {
    "name": "Candidate's full name. Return 'Unknown' if not found.",
    "email": "Email address or null if not found.",
    "phone": "Phone number or null if not found."
  },
  "summary": "A brief 2-3 sentence summary of the candidate's professional profile.",
  "skills": ["List of all technical skills, programming languages, databases, cloud platforms, and tools explicitly mentioned in the resume as strings."],
  "experience": [
    {
      "company": "Company name.",
      "role": "Job title or role.",
      "startDate": "Start date (e.g. Month Year, or Year, or 'Present').",
      "endDate": "End date (e.g. Month Year, or Year, or 'Present').",
      "description": "Short summary of responsibilities and achievements.",
      "relevantSkills": ["Technical skills explicitly used in this specific job."]
    }
  ],
  "education": [
    {
      "institution": "School, college, or university name.",
      "degree": "Degree earned (e.g. Bachelor's, Master's, PhD, High School, or null).",
      "field": "Field of study (e.g. Computer Science, Business Admin, or null).",
      "startYear": "Start year as an integer, or null if not found.",
      "endYear": "End year as an integer, or null if not found."
    }
  ]
}

Strict Rules:
1. Do NOT invent, assume, or infer any information. If a field is not present in the text, use null or an empty array.
2. For startYear and endYear in education, output only valid numbers. If years are range strings (e.g., 2018-2022) parse them. If they cannot be parsed, use null.
3. The response must contain only the raw JSON. No prefix, no suffix. Must parse directly as JSON.`;
};

export const jobExtractionPrompt = (jobDescription: string): string => {
  return `You are an expert recruitment analyst.
Your job is to analyze a raw job description and extract structured requirements.

Input Job Description:
"""
${jobDescription}
"""

Please extract and return a valid JSON object matching the following structure.
DO NOT include any markdown formatting wrappers, code blocks, or extra text. Return ONLY the raw JSON string.

Schema:
{
  "title": "Cleaned Job Title.",
  "requiredSkills": ["Essential technical skills, programming languages, databases, or frameworks specified as mandatory/required."],
  "preferredSkills": ["Nice-to-have or preferred technical skills, frameworks, or certifications."],
  "minimumExperience": "Minimum years of professional experience required as a number (e.g. 3, 5). If none specified or 'entry-level', use null.",
  "educationRequirements": ["List of acceptable degree levels required (e.g. Bachelor's, Master's, PhD, or null if none)."],
  "responsibilities": ["Core duties or responsibilities listed for this position."],
  "keywords": ["Related domain keywords (e.g. Fullstack, Backend, Devops, QA, Cloud) used in the job description."]
}

Strict Rules:
1. Extract only what is explicitly specified.
2. The response must contain only the raw JSON. No prefix, no suffix. Must parse directly as JSON.`;
};

export const matchingExplanationPrompt = (
  candidateJson: string,
  jobJson: string,
  resumeText: string,
  jobText: string,
  baseSkillsScore: number,
  baseExpScore: number,
  baseEduScore: number
): string => {
  return `You are an expert senior recruiter assisting in screening and matching a candidate against a job description.

We have already computed some preliminary deterministic baseline scores:
- Base Skills Score: ${baseSkillsScore}/45 (based on raw keyword matching of required/preferred skills)
- Base Experience Score: ${baseExpScore}/30 (based on years of experience vs required)
- Base Education Score: ${baseEduScore}/10 (based on degree level match)

Input Candidate Profile:
${candidateJson}

Input Job Description Requirements:
${jobJson}

Full Raw Resume:
"""
${resumeText}
"""

Full Raw Job Description:
"""
${jobText}
"""

Please analyze the fit and provide a semantic assessment. Determine how the candidate matches the job's core technical focus, years of experience, and educational background. Return a JSON object matching this structure.
DO NOT include any markdown formatting wrappers, code blocks, or extra text. Return ONLY the raw JSON string.

Schema:
{
  "recommendation": "Strong Match" | "Good Match" | "Partial Match" | "Weak Match",
  "summary": "A 3-4 sentence logical summary explaining the candidate's alignment, detailing why they fit or where their major shortcomings lie.",
  "strengths": ["3-4 bullet points indicating candidate's top technical/professional strengths matching this job."],
  "missingSkills": ["Key technical skills or qualifications that are required/preferred by the job but missing or weak in the candidate's profile."],
  "relevantExperience": ["1-2 examples of highly relevant work experience, projects, or roles in the candidate's history that align with the job description."],
  "concerns": ["Any potential concerns, gaps in skillsets, experience levels, or lack of details in the candidate's resume."],
  
  "skillsAdjustment": "A small integer adjustment between -5 and 5 to reflect semantic skills fit (e.g., depth of React experience vs simple mention, or lack of alternative tools).",
  "experienceAdjustment": "A small integer adjustment between -5 and 5 to reflect quality of experience (e.g. senior roles, leadership vs simple tasks).",
  "educationAdjustment": "A small integer adjustment between -2 and 2 to reflect degree relevance (e.g., degree is in CS vs an unrelated field, or reputable certifications).",
  "domainAlignmentScore": "An integer between 0 and 15 evaluating the candidate's overall domain alignment (e.g., backend, frontend, devops, fintech) and responsibility fit.",
  
  "skillsExplanation": "Briefly explain why the skills adjustment was made.",
  "experienceExplanation": "Briefly explain why the experience adjustment was made.",
  "educationExplanation": "Briefly explain why the education adjustment was made.",
  "alignmentExplanation": "Briefly explain the domain alignment rating."
}

Scoring Reference and Constraints:
- Keep the adjustments objective and explainable from the text.
- Do not let the final score exceed 100.
- Return ONLY the raw JSON.`;
};
