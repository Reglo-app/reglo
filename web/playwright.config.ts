import { defineConfig } from "@playwright/test";

// E2E_BASE_URL lets you target a server on another port (default: 3000).
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
    testDir: "./e2e",
    use: { baseURL },
    webServer: {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: true,
    },
});
