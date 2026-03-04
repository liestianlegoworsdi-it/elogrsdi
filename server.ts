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
    console.log(`[Server] ${req.method} ${req.url}`);
    next();
  });

  // Health check
  app.get("/api/health", async (req, res) => {
    console.log("[Health] Check received");
    
    let googleStatus = "unknown";
    try {
      // Use a shorter timeout for the connectivity check
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const googleRes = await fetch("https://script.google.com", { 
        method: 'HEAD',
        signal: controller.signal 
      });
      googleStatus = googleRes.ok || googleRes.status === 405 ? "reachable" : `error-${googleRes.status}`;
      clearTimeout(timeoutId);
    } catch (e: any) {
      googleStatus = `unreachable-${e.message}`;
    }

    res.json({ 
      status: "ok", 
      env: process.env.NODE_ENV || "development", 
      time: new Date().toISOString(),
      googleConnectivity: googleStatus,
      nodeVersion: process.version
    });
  });

  // Proxy endpoint for Google Apps Script
  app.all("/api/proxy", async (req, res) => {
    const targetUrl = req.query.url as string;
    
    if (!targetUrl) {
      console.warn("[Proxy] Missing target URL");
      return res.status(400).json({ success: false, message: "Missing target URL" });
    }

    console.log(`[Proxy] ${req.method} -> ${targetUrl}`);

    try {
      const method = req.method;
      const headers: any = {
        "Accept": "application/json",
      };

      // Forward relevant headers if needed, but be careful with host/origin
      if (req.headers["content-type"]) {
        headers["Content-Type"] = req.headers["content-type"];
      }

      const options: RequestInit = {
        method,
        headers,
        redirect: "follow",
      };

      if (method !== "GET" && method !== "HEAD") {
        // For Apps Script, we often need to send as text/plain to avoid CORS issues on their end
        // even though we are proxying from the server.
        headers["Content-Type"] = "text/plain;charset=utf-8";
        options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      }

      const response = await fetch(targetUrl, options);
      const data = await response.text();

      console.log(`[Proxy] Target responded: ${response.status}`);
      
      // Set some headers to avoid caching
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.status(response.status).send(data);
    } catch (error: any) {
      console.error("[Proxy] Critical Error:", error);
      res.status(500).json({ 
        success: false, 
        message: `Proxy Error: ${error.message}`,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
      });
    }
  });

  // Specific API 404 to prevent falling through to SPA
  app.all("/api/*", (req, res) => {
    console.warn(`[API] 404 - Not Found: ${req.url}`);
    res.status(404).json({ success: false, message: `API route ${req.url} not found` });
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
