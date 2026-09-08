import express from "express";
import cors from "cors";
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const DRAFT = join(ROOT, "content", "draft.json");
const PUBLISHED = join(ROOT, "content", "published.json");
const FLUTTER_ASSET = join(ROOT, "apps", "liga_app", "assets", "content", "published.json");
const PORT = Number(process.env.PORT || 5173);
const isProd = process.env.NODE_ENV === "production";

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf-8"));
}

function writeJson(file, data) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

async function main() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "5mb" }));

  app.get("/api/draft", (_req, res) => {
    try { res.json(readJson(DRAFT)); }
    catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.put("/api/draft", (req, res) => {
    try { writeJson(DRAFT, req.body); res.json({ ok: true }); }
    catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.get("/api/published", (_req, res) => {
    try { res.json(readJson(PUBLISHED)); }
    catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.post("/api/publish", (_req, res) => {
    try {
      copyFileSync(DRAFT, PUBLISHED);
      mkdirSync(dirname(FLUTTER_ASSET), { recursive: true });
      copyFileSync(PUBLISHED, FLUTTER_ASSET);
      res.json({ ok: true, message: "Rascunho publicado e sincronizado com o Flutter." });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  if (!isProd) {
    const vite = await createViteServer({
      root: __dirname,
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    // Fallback HTML for SPA (garantia no Windows / middleware mode)
    app.use(async (req, res, next) => {
      if (req.method !== "GET" && req.method !== "HEAD") return next();
      if (req.originalUrl.startsWith("/api")) return next();
      try {
        const url = req.originalUrl;
        let template = readFileSync(join(__dirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const dist = join(__dirname, "dist");
    app.use(express.static(dist));
    app.get("*", (_req, res) => {
      res.sendFile(join(dist, "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log("LAUEM Editor em http://localhost:" + PORT);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
