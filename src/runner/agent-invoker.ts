/**
 * Agent invocation via the Claude Agent SDK.
 *
 * Dynamically imports @anthropic-ai/claude-agent-sdk so it is only
 * required when the run command is actually used. If the package is
 * not installed, a clear install instruction is shown.
 */

import { mkdtempSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { AgentInvocationConfig } from './agent-configs.js';

/** Result of an agent invocation attempt. */
export interface InvocationResult {
  /** Whether the agent completed successfully. */
  success: boolean;
  /** Directory containing the agent's output files. */
  outputDir: string;
  /** Duration in seconds, or null if not measured. */
  durationSeconds: number | null;
  /** Error message if the invocation failed. */
  error?: string;
}

/**
 * Invoke an agent using the Claude Agent SDK.
 *
 * Dynamically imports the SDK. If it is not installed, throws
 * with a clear install instruction. Creates a temp directory
 * for agent output unless outputDir is provided.
 *
 * @param config - Agent configuration
 * @param taskPrompt - The full task prompt to give the agent
 * @param outputDir - Optional directory for agent output
 * @returns Invocation result with output directory and timing
 * @throws Error if SDK is not installed or API key is missing
 */
export async function invokeAgent(
  config: AgentInvocationConfig,
  taskPrompt: string,
  outputDir?: string,
): Promise<InvocationResult> {
  const apiKey = process.env[config.apiKeyEnvVar];
  if (!apiKey) {
    throw new Error(
      `${config.apiKeyEnvVar} is not set. ` +
      `Set it in your environment to use agent invocation.`,
    );
  }

  const workDir = outputDir ?? mkdtempSync(join(tmpdir(), 'ruleprobe-run-'));

  let queryFn: (opts: Record<string, unknown>) => AsyncIterable<unknown>;
  try {
    // Dynamic import: SDK is optional, so no static type import
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const sdk: Record<string, unknown> = await (Function('return import("@anthropic-ai/claude-agent-sdk")')() as Promise<Record<string, unknown>>);
    queryFn = sdk['query'] as typeof queryFn;
  } catch {
    throw new Error(
      'Agent invocation requires @anthropic-ai/claude-agent-sdk. ' +
      'Install it with: npm install @anthropic-ai/claude-agent-sdk',
    );
  }

  const startTime = Date.now();

  try {
    const stream = queryFn({
      prompt: taskPrompt,
      options: {
        model: config.model,
        allowedTools: config.allowedTools,
        settingSources: [],
        workingDir: workDir,
        permissionMode: 'acceptEdits',
      },
    });

    for await (const _msg of stream) {
      // Consume the stream; SDK handles file writes to workDir
    }

    const durationSeconds = (Date.now() - startTime) / 1000;

    return {
      success: true,
      outputDir: workDir,
      durationSeconds,
    };
  } catch (err) {
    const durationSeconds = (Date.now() - startTime) / 1000;
    return {
      success: false,
      outputDir: workDir,
      durationSeconds,
      error: (err as Error).message,
    };
  }
}

/**
 * Check whether the Claude Agent SDK is importable.
 *
 * @returns true if the SDK is available, false otherwise
 */
export async function isAgentSdkAvailable(): Promise<boolean> {
  try {
    await (Function('return import("@anthropic-ai/claude-agent-sdk")')() as Promise<unknown>);
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify that the agent output directory contains files.
 *
 * @param outputDir - Directory to check
 * @returns true if the directory exists and is non-empty
 */
export function hasAgentOutput(outputDir: string): boolean {
  return existsSync(outputDir);
}
