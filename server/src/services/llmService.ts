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
   * Cleans markdown wrapper formatting (e.g. ```json ... ```) and parses JSON.
   */
  private static parseAndCleanJson(content: string): any {
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
   * Helper to request JSON output from the LLM, supporting both native Gemini and standard OpenAI.
   */
  private static async requestJson(promptText: string): Promise<any> {
    const apiKey = process.env.OPENAI_API_KEY || '';

    // Automatically route to native Gemini REST API if using a Gemini key or base URL
    const isGemini =
      apiKey.startsWith('AQ.') ||
      apiKey.startsWith('AIzaSy') ||
      (process.env.OPENAI_BASE_URL && process.env.OPENAI_BASE_URL.includes('generativelanguage.googleapis.com'));

    if (isGemini) {
      const model = process.env.OPENAI_MODEL || 'gemini-3.6-flash';
      // Strip trailing slash if present to avoid double-slashes
      const cleanBase = 'https://generativelanguage.googleapis.com/v1beta';
      const url = `${cleanBase}/models/${model}:generateContent?key=${apiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { temperature: 0.1 },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`Gemini Native API error: ${res.status} - ${JSON.stringify(errorData)}`);
      }

      const data: any = await res.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new Error('Received empty response from Gemini Native API.');
      }

      return this.parseAndCleanJson(content);
    }

    // Default: Fallback to standard OpenAI SDK
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

    return this.parseAndCleanJson(content);
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
