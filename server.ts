import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON and text
  app.use(express.json());
  app.use(express.text());

  // Logging middleware
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API Request] ${req.method} ${req.path}`);
    }
    next();
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV, time: new Date().toISOString() });
  });

  // Proxy endpoint for Google Apps Script
  app.all("/api/proxy", async (req, res) => {
    const targetUrl = req.query.url as string;
    
    if (!targetUrl) {
      return res.status(400).json({ success: false, message: "Missing target URL" });
    }

    try {
      const method = req.method;
      const headers: any = {
        "Accept": "application/json",
      };

      const options: RequestInit = {
        method,
        headers,
        redirect: "follow",
      };

      if (method === "POST") {
        headers["Content-Type"] = "text/plain;charset=utf-8";
        options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      }

      const response = await fetch(targetUrl, options);
      const data = await response.text();

      res.status(response.status).send(data);
    } catch (error: any) {
      console.error("Proxy error:", error);
      res.status(500).json({ success: false, message: `Proxy Error: ${error.message}` });
    }
  });

  // API 404 handler - prevents falling through to SPA HTML fallback
  app.all("/api/*", (req, res) => {
    res.status(404).json({ success: false, message: `API route ${req.path} not found` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
