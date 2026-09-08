import express from "express";
import cors from "cors";
import multer from "multer";
import {
  readFileSync, writeFileSync, copyFileSync, mkdirSync,
  readdirSync, existsSync,
} from "fs";
import { dirname, join, resolve, extname, basename } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { randomBytes } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const DRAFT = join(ROOT, "content", "draft.json");
const PUBLISHED = join(ROOT, "content", "published.json");
const MEDIA_DIR = join(ROOT, "content", "media");
const FLUTTER_ASSET = join(ROOT, "apps", "liga_app", "assets", "content", "published.json");
const FLUTTER_MEDIA = join(ROOT, "apps", "liga_app", "assets", "media");
const PORT = Number(process.env.PORT || 5173);
const isProd = process.env.NODE_ENV === "production";

const ALLOWED_EXT = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".ico",
]);

mkdirSync(MEDIA_DIR, { recursive: true });
mkdirSync(FLUTTER_MEDIA, { recursive: true });

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf-8"));
}

function writeJson(file, data) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function syncMediaToFlutter() {
  mkdirSync(FLUTTER_MEDIA, { recursive: true });
  if (!existsSync(MEDIA_DIR)) return;
  for (const name of readdirSync(MEDIA_DIR)) {
    if (name.startsWith(".")) continue;
    copyFileSync(join(MEDIA_DIR, name), join(FLUTTER_MEDIA, name));
  }
}

function safeFilename(original) {
  const ext = extname(original || "").toLowerCase();
  const base = basename(original || "file", ext)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 40) || "file";
  const id = randomBytes(4).toString("hex");
  const safeExt = ALLOWED_EXT.has(ext) ? ext : ".bin";
  return `${base}_${id}${safeExt}`;
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, MEDIA_DIR),
    filename: (_req, file, cb) => cb(null, safeFilename(file.originalname)),
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = extname(file.originalname || "").toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return cb(new Error("Tipo de arquivo não permitido. Use PNG, JPG, GIF, WEBP ou SVG."));
    }
    cb(null, true);
  },
});

async function main() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "5mb" }));

  // Arquivos de mídia enviados pelo editor
  app.use("/media", express.static(MEDIA_DIR));

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

  app.post("/api/media", (req, res) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || String(err) });
      }
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado (campo file)." });
      }
      const url = "/media/" + req.file.filename;
      res.json({ ok: true, url, filename: req.file.filename });
    });
  });

  app.post("/api/publish", (_req, res) => {
    try {
      copyFileSync(DRAFT, PUBLISHED);
      mkdirSync(dirname(FLUTTER_ASSET), { recursive: true });
      copyFileSync(PUBLISHED, FLUTTER_ASSET);
      syncMediaToFlutter();
      res.json({
        ok: true,
        message: "Rascunho publicado, mídia sincronizada e asset Flutter atualizado.",
      });
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
      if (req.originalUrl.startsWith("/media")) return next();
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
