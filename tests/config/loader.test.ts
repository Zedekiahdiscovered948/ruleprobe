/**
 * Tests for config loader: findConfigFile, validateConfig, loadConfig.
 *
 * Uses temporary directories with JSON config files (no dynamic
 * imports needed). TS/JS config loading is integration-tested.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { findConfigFile, validateConfig, loadConfig } from '../../src/config/loader.js';
import type { RuleProbeConfig } from '../../src/config/types.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = join(tmpdir(), `ruleprobe-config-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(tmpDir, { recursive: true });
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('findConfigFile', () => {
  it('finds ruleprobe.config.json in the start directory', () => {
    writeFileSync(join(tmpDir, 'ruleprobe.config.json'), '{}');
    const result = findConfigFile(tmpDir);
    expect(result).toBe(join(tmpDir, 'ruleprobe.config.json'));
  });

  it('finds .ruleproberc.json in the start directory', () => {
    writeFileSync(join(tmpDir, '.ruleproberc.json'), '{}');
    const result = findConfigFile(tmpDir);
    expect(result).toBe(join(tmpDir, '.ruleproberc.json'));
  });

  it('prefers ruleprobe.config.ts over ruleprobe.config.json', () => {
    writeFileSync(join(tmpDir, 'ruleprobe.config.ts'), 'export default {}');
    writeFileSync(join(tmpDir, 'ruleprobe.config.json'), '{}');
    const result = findConfigFile(tmpDir);
    expect(result).toBe(join(tmpDir, 'ruleprobe.config.ts'));
  });

  it('searches parent directories', () => {
    const child = join(tmpDir, 'nested', 'deep');
    mkdirSync(child, { recursive: true });
    writeFileSync(join(tmpDir, 'ruleprobe.config.json'), '{}');
    const result = findConfigFile(child);
    expect(result).toBe(join(tmpDir, 'ruleprobe.config.json'));
  });

  it('returns null when no config file exists', () => {
    const result = findConfigFile(tmpDir);
    expect(result).toBeNull();
  });
});

describe('validateConfig', () => {
  it('accepts a valid config with rules, overrides, and exclude', () => {
    const config: RuleProbeConfig = {
      rules: [{
        id: 'custom-test',
        category: 'naming',
        description: 'test rule',
        verifier: 'ast',
        pattern: { type: 'test', target: '*.ts', expected: false, scope: 'file' },
      }],
      overrides: [{ ruleId: 'naming-camelcase', severity: 'warning' }],
      exclude: ['structure-named-exports'],
    };
    expect(() => validateConfig(config)).not.toThrow();
  });

  it('accepts an empty config', () => {
    expect(() => validateConfig({})).not.toThrow();
  });

  it('rejects a rule with missing id', () => {
    const config = {
      rules: [{ category: 'naming', description: 'test', verifier: 'ast', pattern: { type: 't', target: '*.ts', expected: false, scope: 'file' } }],
    } as unknown as RuleProbeConfig;
    expect(() => validateConfig(config)).toThrow('id must be');
  });

  it('rejects a rule with missing pattern.type', () => {
    const config = {
      rules: [{ id: 'test', category: 'naming', description: 'test', verifier: 'ast', pattern: { target: '*.ts' } }],
    } as unknown as RuleProbeConfig;
    expect(() => validateConfig(config)).toThrow('pattern.type');
  });

  it('rejects an override with missing ruleId', () => {
    const config = {
      overrides: [{ severity: 'warning' }],
    } as unknown as RuleProbeConfig;
    expect(() => validateConfig(config)).toThrow('ruleId');
  });

  it('rejects non-array rules', () => {
    const config = { rules: 'invalid' } as unknown as RuleProbeConfig;
    expect(() => validateConfig(config)).toThrow('must be an array');
  });

  it('rejects non-string exclude entries', () => {
    const config = { exclude: [123] } as unknown as RuleProbeConfig;
    expect(() => validateConfig(config)).toThrow('must be strings');
  });
});

describe('loadConfig', () => {
  it('loads a JSON config from an explicit path', async () => {
    const configPath = join(tmpDir, 'ruleprobe.config.json');
    const config: RuleProbeConfig = {
      exclude: ['naming-camelcase'],
    };
    writeFileSync(configPath, JSON.stringify(config));

    const result = await loadConfig(configPath);
    expect(result).toEqual(config);
  });

  it('auto-discovers a JSON config in the search directory', async () => {
    const configPath = join(tmpDir, 'ruleprobe.config.json');
    writeFileSync(configPath, JSON.stringify({ exclude: ['test'] }));

    const result = await loadConfig(undefined, tmpDir);
    expect(result).not.toBeNull();
    expect(result!.exclude).toEqual(['test']);
  });

  it('returns null when no config is found during auto-discovery', async () => {
    const result = await loadConfig(undefined, tmpDir);
    expect(result).toBeNull();
  });

  it('throws when an explicit config path does not exist', async () => {
    await expect(
      loadConfig(join(tmpDir, 'nonexistent.json')),
    ).rejects.toThrow('not found');
  });

  it('throws on invalid JSON', async () => {
    const configPath = join(tmpDir, 'ruleprobe.config.json');
    writeFileSync(configPath, 'not json');

    await expect(loadConfig(configPath)).rejects.toThrow();
  });

  it('throws when JSON root is an array', async () => {
    const configPath = join(tmpDir, 'ruleprobe.config.json');
    writeFileSync(configPath, '[]');

    await expect(loadConfig(configPath)).rejects.toThrow('must export an object');
  });

  it('validates the config after loading', async () => {
    const configPath = join(tmpDir, 'ruleprobe.config.json');
    writeFileSync(configPath, JSON.stringify({ rules: [{ id: '' }] }));

    await expect(loadConfig(configPath)).rejects.toThrow('id must be');
  });
});
