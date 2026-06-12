import * as path from 'path';
import { register } from 'ts-node';
import 'tsconfig-paths/register.js';

register({
    project: path.resolve('tsconfig.json'),
    transpileOnly: true,
});

export const testConfig = {
    rootDir: path.resolve('./src'),
    match: ['**/*.spec.ts', '**/*.e2e-spec.ts'],
    timeout: 10000,
    verbose: true,
    coverage: {
        enabled: true,
        dir: './coverage',
        include: ['src/**/*.ts'],
        exclude: [
            '**/__tests__/**',
            '**/*.spec.ts',
            '**/*.e2e-spec.ts',
            '**/*.module.ts',
            '**/*.config.ts',
            '**/*.dto.ts',
            '**/*.d.ts',
            '**/*.response.ts',
            '**/*.decorator.ts',
            '**/main.ts',
            '**/*.index.ts',
        ],
        reporter: ['text', 'html', 'lcov'],
        sourceMap: true,
        excludeAfterRemap: true,
        clean: true,
    },
};
