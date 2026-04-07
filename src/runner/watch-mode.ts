/**
 * Watch mode for non-SDK agent invocation.
 *
 * Watches a directory for file changes and triggers verification
 * when a .done marker file appears or a timeout elapses. Designed
 * for agents that write output to a directory without an SDK
 * (Copilot, Cursor, etc).
 */

import { existsSync, readdirSync, statSync, watchFile, unwatchFile } from 'node:fs';
import { join, extname } from 'node:path';

/** Options for watch mode. */
export interface WatchOptions {
  /** Directory to watch for agent output. */
  watchDir: string;
  /** Timeout in seconds. 0 means no timeout. */
  timeoutSeconds: number;
  /** How often to poll for the .done marker, in milliseconds. */
  pollIntervalMs?: number;
}

/** Result of watch mode completion. */
export interface WatchResult {
  /** Whether the watch completed (vs timed out). */
  completed: boolean;
  /** How the watch ended: .done marker found, timeout, or error. */
  reason: 'done-marker' | 'timeout' | 'error';
  /** Duration in seconds from start to completion. */
  durationSeconds: number;
  /** Error message if reason is 'error'. */
  error?: string;
}

/**
 * Watch a directory for agent output completion.
 *
 * Polls for a .done marker file in the watch directory. Returns
 * when the marker appears or the timeout elapses.
 *
 * @param options - Watch configuration
 * @returns Watch result indicating how the watch ended
 */
export function watchForCompletion(options: WatchOptions): Promise<WatchResult> {
  const { watchDir, timeoutSeconds, pollIntervalMs = 1000 } = options;
  const startTime = Date.now();

  return new Promise((resolve) => {
    const doneMarkerPath = join(watchDir, '.done');

    const checkDone = (): boolean => {
      return existsSync(doneMarkerPath);
    };

    // Check immediately
    if (checkDone()) {
      resolve({
        completed: true,
        reason: 'done-marker',
        durationSeconds: (Date.now() - startTime) / 1000,
      });
      return;
    }

    let timerHandle: ReturnType<typeof setTimeout> | null = null;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    const cleanup = (): void => {
      if (timerHandle !== null) {
        clearTimeout(timerHandle);
      }
      if (timeoutHandle !== null) {
        clearTimeout(timeoutHandle);
      }
    };

    const poll = (): void => {
      if (checkDone()) {
        cleanup();
        resolve({
          completed: true,
          reason: 'done-marker',
          durationSeconds: (Date.now() - startTime) / 1000,
        });
        return;
      }
      timerHandle = setTimeout(poll, pollIntervalMs);
    };

    // Start polling
    timerHandle = setTimeout(poll, pollIntervalMs);

    // Set timeout if non-zero
    if (timeoutSeconds > 0) {
      timeoutHandle = setTimeout(() => {
        cleanup();
        resolve({
          completed: false,
          reason: 'timeout',
          durationSeconds: timeoutSeconds,
        });
      }, timeoutSeconds * 1000);
    }
  });
}

/**
 * Count code files in a directory (non-recursive for quick check).
 *
 * @param dir - Directory to scan
 * @returns Number of code files found
 */
export function countCodeFiles(dir: string): number {
  if (!existsSync(dir)) {
    return 0;
  }

  const codeExts = new Set(['.ts', '.tsx', '.js', '.jsx', '.py', '.go']);
  let count = 0;

  const scan = (scanDir: string): void => {
    const entries = readdirSync(scanDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }
      const fullPath = join(scanDir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (codeExts.has(extname(entry.name))) {
        count++;
      }
    }
  };

  scan(dir);
  return count;
}
