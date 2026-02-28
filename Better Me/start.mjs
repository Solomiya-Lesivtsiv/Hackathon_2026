// start.mjs — launches backend (Python) and frontend (Vite) together
import { spawn } from "child_process";

const isWindows = process.platform === "win32";
const pythonCmd = isWindows ? "python" : "python3";

console.log("🚀 Starting BetterMe Tax Admin...\n");

// Start backend
const backend = spawn(pythonCmd, ["api/main.py"], {
  stdio: "pipe",
  shell: isWindows,
});

backend.stdout.on("data", (data) => {
  process.stdout.write(`[API] ${data}`);
});

backend.stderr.on("data", (data) => {
  process.stderr.write(`[API] ${data}`);
});

backend.on("error", (err) => {
  console.error(`❌ Backend failed to start: ${err.message}`);
  console.error("   Make sure Python is installed and run: pip install -r api/requirements.txt");
});

// Wait 1.5s for backend to start, then launch frontend
setTimeout(() => {
  const frontend = spawn("npx", ["vite"], {
    stdio: "inherit",
    shell: isWindows,
  });

  frontend.on("error", (err) => {
    console.error(`❌ Frontend failed to start: ${err.message}`);
  });

  // Cleanup on exit
  process.on("SIGINT", () => {
    backend.kill();
    frontend.kill();
    process.exit();
  });

  process.on("exit", () => {
    backend.kill();
    frontend.kill();
  });
}, 1500);
