/**
 * OpenAI-backed rubric decomposer.
 *
 * Calls the OpenAI (or compatible) API to decompose subjective instructions
 * into weighted rubrics of concrete checks. Reuses the same API key and
 * config as the OpenAI extraction provider.
 */

import type { DecompositionResult } from './rubric-types.js';
import type { RubricDecomposer } from './rubric-types.js';
import { buildRubricPrompt, parseRubricResponse } from './rubric-decompose.js';

/** Configuration for the OpenAI rubric decomposer. */
export interface OpenAiRubricConfig {
  /** API key. Defaults to OPENAI_API_KEY env var. */
  apiKey?: string;
  /** Model to use. Defaults to 'gpt-4o-mini'. */
  model?: string;
  /** Base URL for the API. Defaults to 'https://api.openai.com/v1'. */
  baseUrl?: string;
  /** Request timeout in milliseconds. Defaults to 30000. */
  timeoutMs?: number;
}

/**
 * OpenAI-backed implementation of RubricDecomposer.
 *
 * Uses native fetch to call the chat completions API, sends the
 * rubric decomposition prompt, and parses the response.
 */
export class OpenAiRubricDecomposer implements RubricDecomposer {
  readonly name: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(config: OpenAiRubricConfig = {}) {
    const apiKey = config.apiKey ?? process.env['OPENAI_API_KEY'];
    if (!apiKey) {
      throw new Error(
        'OpenAI API key required. Set OPENAI_API_KEY env var or pass apiKey in config.',
      );
    }
    this.apiKey = apiKey;
    this.model = config.model ?? 'gpt-4o-mini';
    this.baseUrl = (config.baseUrl ?? 'https://api.openai.com/v1').replace(/\/$/, '');
    this.timeoutMs = config.timeoutMs ?? 30000;
    this.name = `openai-rubric/${this.model}`;
  }

  /**
   * Decompose subjective lines into rubrics via the OpenAI API.
   *
   * @param lines - Subjective instruction lines
   * @param knownPatternTypes - Available pattern types
   * @returns Decomposed rubrics and remaining undecomposable lines
   */
  async decompose(
    lines: string[],
    knownPatternTypes: string[],
  ): Promise<DecompositionResult> {
    if (lines.length === 0) {
      return { rubrics: [], remaining: [] };
    }

    const prompt = buildRubricPrompt(lines, knownPatternTypes);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: prompt.system },
            { role: 'user', content: prompt.user },
          ],
          temperature: 0,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `OpenAI API error ${response.status}: ${body.slice(0, 200)}`,
        );
      }

      const data = await response.json() as {
        choices: Array<{ message: { content: string } }>;
      };

      const content = data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI API');
      }

      return parseRubricResponse(content, lines, knownPatternTypes);
    } finally {
      clearTimeout(timer);
    }
  }
}
