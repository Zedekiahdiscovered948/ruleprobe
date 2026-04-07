/**
 * Agent configuration types for automated invocation.
 *
 * Defines the shape of agent configs used by the run command.
 * Each supported agent has an ID, SDK requirements, and
 * default model settings.
 */

/** Configuration for a specific agent invocation. */
export interface AgentInvocationConfig {
  /** Agent identifier matching CLI --agent values. */
  agentId: string;
  /** Model to use for this invocation. */
  model: string;
  /** Environment variable name for the API key. */
  apiKeyEnvVar: string;
  /** Tools the agent is allowed to use during invocation. */
  allowedTools: string[];
}

/** Options passed to the run command handler. */
export interface RunOptions {
  /** Task template ID to give the agent. */
  task: string;
  /** Agent identifier (e.g. "claude-code"). */
  agent: string;
  /** Model name (e.g. "sonnet"). */
  model: string;
  /** Report output format. */
  format: string;
  /** Directory to persist agent output. If omitted, uses a temp dir. */
  outputDir?: string;
  /** Watch mode: path to directory to watch for agent output. */
  watch?: string;
  /** Watch mode timeout in seconds. */
  timeout: number;
  /** Whether to allow symlinks outside the project. */
  allowSymlinks: boolean;
  /** Path to ruleprobe config file. */
  config?: string;
  /** Path to tsconfig.json for type-aware AST checks. */
  project?: string;
}

/**
 * Default agent configurations for known agents.
 *
 * @param agentId - Agent identifier
 * @param model - Model override
 * @returns Agent invocation config
 */
export function buildAgentConfig(
  agentId: string,
  model: string,
): AgentInvocationConfig {
  switch (agentId) {
    case 'claude-code':
      return {
        agentId: 'claude-code',
        model,
        apiKeyEnvVar: 'ANTHROPIC_API_KEY',
        allowedTools: ['Read', 'Write', 'Edit', 'Bash'],
      };
    default:
      return {
        agentId,
        model,
        apiKeyEnvVar: 'ANTHROPIC_API_KEY',
        allowedTools: ['Read', 'Write', 'Edit', 'Bash'],
      };
  }
}
