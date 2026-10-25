import {defineConfig} from 'vitest/config';

export default defineConfig({
    resolve: {tsconfigPaths: true},
    test: {
        globals: true,
        include: ['test/**/*.integration.e2e-spec.ts'],
        fileParallelism: false,
        testTimeout: 30000,
        hookTimeout: 30000,
    },
});
