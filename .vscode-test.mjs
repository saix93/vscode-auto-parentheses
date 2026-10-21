import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
    files: 'out/test/integration/**/*.test.js',
    launchArgs: ['--disable-extensions'],
    mocha: { timeout: 20000 },
});
