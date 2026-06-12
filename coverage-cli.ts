import { spawn } from 'child_process';
import { testConfig } from './node.test.config';

const INCLUDE_PATTERNS = testConfig.coverage.include;
const EXCLUDE_PATTERNS = testConfig.coverage.exclude;
const MATCH_PATTERNS = testConfig.match;

const args: string[] = [
    '--experimental-test-coverage',
    `--test-coverage-include=${INCLUDE_PATTERNS.join(',')}`,
];

EXCLUDE_PATTERNS.forEach((pattern) => {
    args.push(`--test-coverage-exclude=${pattern}`);
});

args.push('--test', '--require', './node.test.config.ts');
MATCH_PATTERNS.forEach((pattern) => {
    args.push(`src/${pattern}`);
});

const child = spawn('node', args, {
    stdio: 'inherit',
    shell: true,
});

child.on('error', (err) => {
    console.error('Failed to start Node process:', err);
});

child.on('close', (code) => {
    process.exit(code || 0);
});
