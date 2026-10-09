import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir:'./tests', testMatch:['browser.spec.ts','branch.spec.ts'], fullyParallel:true, use:{ headless:true, launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args:['--no-sandbox']}, viewport:{width:1440,height:1000}, reducedMotion:'reduce' }, reporter:'list' });
