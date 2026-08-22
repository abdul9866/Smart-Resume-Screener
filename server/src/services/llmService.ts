import OpenAI from 'openai';
import dotenv from 'dotenv';
import { resumeExtractionPrompt, jobExtractionPrompt, matchingExplanationPrompt } from './prompts.js';

dotenv.config();

export class LlmService {
  private static openaiClient: OpenAI | null = null;
  private static modelName: string = 'gpt-4o-mini';

  private static getClient(): OpenAI {
    if (this.openaiClient) {
      return this.openaiClient;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    if (!apiKey || apiKey === 'your-api-key-here' || apiKey.trim() === '') {
      throw new Error('OPENAI_API_KEY is not configured. Please set a valid API key in your server .env file.');
    }

    this.openaiClient = new OpenAI({
      apiKey,
      baseURL,
    });

    return this.openaiClient;
  }

  /**
   * Helper to request JSON output from the LLM, cleansing markdown wrappers if present.
   */
  private static async requestJson(promptText: string): Promise<any> {
    const client = this.getClient();
    const response = await client.chat.completions.create({
      model: this.modelName,
      messages: [{ role: 'user', content: promptText }],
      temperature: 0.1, // low temperature for consistent JSON structured outputs
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Received empty response from the LLM.');
    }

    // Clean any markdown wrapper formatting (e.g. ```json ... ```)
    const cleanedContent = content
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/```\s*$/, '')
      .trim();

    try {
      return JSON.parse(cleanedContent);
    } catch (error: any) {
      console.error('Failed to parse JSON response from LLM:', content);
      throw new Error(`LLM did not return valid JSON: ${error.message}`);
    }
  }

  /**
   * Parses candidate resume text into structured JSON.
   */
  public static async parseResume(resumeText: string): Promise<any> {
    const prompt = resumeExtractionPrompt(resumeText);
    return this.requestJson(prompt);
  }

  /**
   * Parses a job description into structured JSON requirements.
   */
  public static async parseJobDescription(jobDescription: string): Promise<any> {
    const prompt = jobExtractionPrompt(jobDescription);
    return this.requestJson(prompt);
  }

  /**
   * Compares structured candidate information and job description semantically.
   */
  public static async matchCandidateToJob(
    candidateData: any,
    jobRequirements: any,
    resumeText: string,
    jobText: string,
    baseSkillsScore: number,
    baseExpScore: number,
    baseEduScore: number
  ): Promise<any> {
    const candidateJson = JSON.stringify(candidateData, null, 2);
    const jobJson = JSON.stringify(jobRequirements, null, 2);
    const prompt = matchingExplanationPrompt(
      candidateJson,
      jobJson,
      resumeText,
      jobText,
      baseSkillsScore,
      baseExpScore,
      baseEduScore
    );
    return this.requestJson(prompt);
  }
}
