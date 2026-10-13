import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./e2e',testMatch:'*.spec.js',workers:1,fullyParallel:false,timeout:30000,
  outputDir:process.env.E2E_OUTPUT_DIR||'/tmp/frontend-browser-results',
  reporter:[['list'],['json',{outputFile:process.env.E2E_JSON_FILE||'/tmp/frontend-browser-results/results.json'}]],
  use:{baseURL:'http://127.0.0.1:44018',headless:true,screenshot:'off',video:'off',trace:'off',
    launchOptions:process.env.BROWSER_EXECUTABLE_PATH?{executablePath:process.env.BROWSER_EXECUTABLE_PATH}:{}},
  webServer:{command:'node scripts/e2e-server.js',url:'http://127.0.0.1:44018',reuseExistingServer:false,timeout:30000},
});
