import http from "http";
import { promises as fs } from "fs";
import { extname, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PUBLIC_ROOT = resolve(__dirname, "public");
const NODE_MODULES_ROOT = resolve(__dirname, "node_modules");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".wasm": "application/wasm"
};

const PORT = Number(process.env.PORT || 3000);

const server = http.createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (urlPath === "/" || urlPath === "") {
      urlPath = "/index.html";
    }

    let baseDir = PUBLIC_ROOT;
    if (urlPath.startsWith("/node_modules/")) {
      baseDir = NODE_MODULES_ROOT;
      urlPath = urlPath.replace("/node_modules/", "");
    }

    const filePath = resolve(baseDir, ".", urlPath.replace(/^\/+/, ""));

    if (!filePath.startsWith(baseDir)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    const data = await fs.readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    console.error("[server]", error);
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Internal server error");
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
