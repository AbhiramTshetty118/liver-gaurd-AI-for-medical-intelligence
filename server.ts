import express from "express";
import path from "path";
import { spawn, ChildProcess } from "child_process";
import { createServer as createViteServer } from "vite";
import { apiRouter } from "./server/apiHandler.js";

const PORT = 3000;
const PYTHON_BACKEND_PORT = 8005;
const PYTHON_URL = `http://127.0.0.1:${PYTHON_BACKEND_PORT}`;

let pythonProcess: ChildProcess | null = null;

function startPythonBackend() {
  console.log(`Starting Python FastAPI backend on port ${PYTHON_BACKEND_PORT}...`);
  pythonProcess = spawn("python3", ["-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", String(PYTHON_BACKEND_PORT)], {
    stdio: "inherit",
    env: { ...process.env, PYTHONUNBUFFERED: "1" }
  });

  pythonProcess.on("error", (err) => {
    console.error("Failed to start Python backend:", err);
  });

  pythonProcess.on("exit", (code, signal) => {
    console.log(`Python backend exited with code ${code}, signal ${signal}`);
  });
}

async function startServer() {
  startPythonBackend();

  const app = express();
  app.use(express.json());

  // Mount versioned and unversioned API routes
  app.use("/api/v1", apiRouter);
  app.use("/api", apiRouter);

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`LiverGuard Unified Gateway running on http://0.0.0.0:${PORT}`);
    console.log(`Python FastAPI backend proxying to ${PYTHON_URL}`);
  });

  const cleanup = () => {
    console.log("Shutting down servers...");
    if (pythonProcess) {
      pythonProcess.kill("SIGTERM");
    }
    server.close();
    process.exit(0);
  };

  process.on("SIGTERM", cleanup);
  process.on("SIGINT", cleanup);
}

startServer();
