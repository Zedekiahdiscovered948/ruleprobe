/**
 * Handler for the "run" CLI command.
 *
 * Orchestrates agent invocation (SDK or watch mode), then runs
 * verification on the agent's output. Combines the invoke and
 * verify steps into a single command.
 */

import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { parseInstructionFile } from '../parsers/index.js';
import { verifyOutput } from '../verifier/index.js';
import { generateReport } from '../index.js';
import { formatReport } from '../reporter/index.js';
import { currentTimestamp } from '../runner/index.js';
import { resolveSafePath } from '../utils/safe-path.js';
import { loadConfig, applyConfig } from '../config/index.js';
import { findTaskTemplate, loadTaskPrompt } from '../runner/task-templates.js';
import { buildAgentConfig } from '../runner/agent-configs.js';
import { invokeAgent } from '../runner/agent-invoker.js';
import { watchForCompletion, countCodeFiles } from '../runner/watch-mode.js';
import type { AgentRun, ReportFormat, RuleSet } from '../types.js';
import type { RunOptions } from '../runner/agent-configs.js';

/**
 * Execute the run command.
 *
 * In SDK mode: loads task template, invokes agent via SDK, verifies
 * output, and prints the report.
 *
 * In watch mode: watches a directory for agent output, then verifies.
 *
 * @param file - Path to the instruction file
 * @param opts - Run command options
 * @param exitWithError - Error handler that terminates the process
 */
export async function handleRun(
  file: string,
  opts: RunOptions,
  exitWithError: (msg: string) => never,
): Promise<void> {
  let filePath: string;
  try {
    filePath = resolveSafePath(file);
  } catch (err) {
    exitWithError((err as Error).message);
  }

  if (!existsSync(filePath)) {
    exitWithError(`Instruction file not found: ${filePath}`);
  }

  const validFormats: ReportFormat[] = ['text', 'json', 'markdown', 'rdjson'];
  if (!validFormats.includes(opts.format as ReportFormat)) {
    exitWithError(
      `Invalid format "${opts.format}". Use one of: ${validFormats.join(', ')}`,
    );
  }

  // Watch mode path
  if (opts.watch) {
    await handleWatchMode(filePath, opts, exitWithError);
    return;
  }

  // SDK invocation path
  const template = findTaskTemplate(opts.task);
  if (!template) {
    exitWithError(
      `Unknown task template: "${opts.task}". ` +
      'Run "ruleprobe tasks" to see available templates.',
    );
  }

  const taskPrompt = loadTaskPrompt(opts.task);
  if (!taskPrompt) {
    exitWithError(`Task template file not found for: "${opts.task}".`);
  }

  const agentConfig = buildAgentConfig(opts.agent, opts.model);
  const ruleSet = parseInstructionFile(filePath);

  let effectiveRuleSet: RuleSet = ruleSet;
  try {
    const config = await loadConfig(opts.config);
    if (config) {
      effectiveRuleSet = applyConfig(ruleSet, config);
    }
  } catch (err) {
    exitWithError(`Config error: ${(err as Error).message}`);
  }

  process.stderr.write(
    `Invoking ${agentConfig.agentId} (model: ${agentConfig.model})...\n`,
  );

  let invocationResult;
  try {
    invocationResult = await invokeAgent(
      agentConfig,
      taskPrompt,
      opts.outputDir,
    );
  } catch (err) {
    exitWithError((err as Error).message);
  }

  if (!invocationResult.success) {
    exitWithError(
      `Agent invocation failed: ${invocationResult.error ?? 'unknown error'}`,
    );
  }

  const outDir = invocationResult.outputDir;
  const codeFileCount = countCodeFiles(outDir);
  if (codeFileCount === 0) {
    exitWithError(
      `Agent completed but wrote no code files to ${outDir}`,
    );
  }

  process.stderr.write(
    `Agent completed in ${invocationResult.durationSeconds?.toFixed(1)}s. ` +
    `Found ${codeFileCount} code files. Running verification...\n`,
  );

  const results = await verifyOutput(effectiveRuleSet, outDir, {
    allowSymlinks: opts.allowSymlinks,
    projectPath: opts.project,
  });

  const run: AgentRun = {
    agent: opts.agent,
    model: opts.model,
    taskTemplateId: opts.task,
    outputDir: outDir,
    timestamp: currentTimestamp(),
    durationSeconds: invocationResult.durationSeconds,
  };

  const report = generateReport(run, effectiveRuleSet, results);
  const formatted = formatReport(report, opts.format as ReportFormat);
  process.stdout.write(formatted + '\n');

  // Clean up temp dir if we created one (no --output-dir)
  if (!opts.outputDir && existsSync(outDir)) {
    try {
      rmSync(outDir, { recursive: true, force: true });
    } catch {
      // Best-effort cleanup
    }
  }

  const hasViolations = report.summary.failed > 0;
  process.exit(hasViolations ? 1 : 0);
}

/**
 * Handle watch mode: wait for agent output, then verify.
 */
async function handleWatchMode(
  filePath: string,
  opts: RunOptions,
  exitWithError: (msg: string) => never,
): Promise<void> {
  const watchDir = opts.watch as string;

  if (!existsSync(watchDir)) {
    exitWithError(`Watch directory does not exist: ${watchDir}`);
  }

  process.stderr.write(
    `Watching ${watchDir} for .done marker (timeout: ${opts.timeout}s)...\n`,
  );

  const watchResult = await watchForCompletion({
    watchDir,
    timeoutSeconds: opts.timeout,
  });

  if (watchResult.reason === 'timeout') {
    process.stderr.write(
      `Watch timed out after ${opts.timeout}s. Running verification on current state...\n`,
    );
  } else {
    process.stderr.write(
      `Done marker detected after ${watchResult.durationSeconds.toFixed(1)}s.\n`,
    );
  }

  const codeFileCount = countCodeFiles(watchDir);
  if (codeFileCount === 0) {
    exitWithError(`No code files found in ${watchDir}`);
  }

  const ruleSet = parseInstructionFile(filePath);

  let effectiveRuleSet: RuleSet = ruleSet;
  try {
    const config = await loadConfig(opts.config);
    if (config) {
      effectiveRuleSet = applyConfig(ruleSet, config);
    }
  } catch (err) {
    exitWithError(`Config error: ${(err as Error).message}`);
  }

  const results = await verifyOutput(effectiveRuleSet, watchDir, {
    allowSymlinks: opts.allowSymlinks,
    projectPath: opts.project,
  });

  const run: AgentRun = {
    agent: opts.agent,
    model: opts.model,
    taskTemplateId: opts.task,
    outputDir: watchDir,
    timestamp: currentTimestamp(),
    durationSeconds: watchResult.durationSeconds,
  };

  const report = generateReport(run, effectiveRuleSet, results);
  const formatted = formatReport(report, opts.format as ReportFormat);
  process.stdout.write(formatted + '\n');

  const hasViolations = report.summary.failed > 0;
  process.exit(hasViolations ? 1 : 0);
}
