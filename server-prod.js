import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import handler from './dist/server/server.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIR = path.join(__dirname, 'dist', 'client');
const PORT = process.env.PORT || 3000;

// Mime types map for serving static files
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.mjs': 'text/javascript',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
};

const server = http.createServer(async (req, res) => {
  // Parse URL to ignore query strings when matching static files
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. Try to serve static file from dist/client
  const safeSuffix = decodeURIComponent(pathname);
  const filePath = path.resolve(CLIENT_DIR, '.' + safeSuffix);
  
  if (!filePath.startsWith(CLIENT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }
  
  try {
    const stats = await fs.promises.stat(filePath);
    if (stats.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      });
      
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  } catch (err) {
    // File not found or is a directory, proceed to SSR handler
  }

  // 2. SSR: Convert Node req to Web Request and invoke fetch handler
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || `localhost:${PORT}`;
    const url = new URL(req.url, `${protocol}://${host}`);

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) {
        for (const v of value) {
          headers.append(key, v);
        }
      } else if (value !== undefined) {
        headers.set(key, value);
      }
    }

    let body = null;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      body = Buffer.concat(buffers);
    }

    const webRequest = new Request(url.href, {
      method: req.method,
      headers,
      body,
      duplex: body ? 'half' : undefined
    });

    const webResponse = await handler.fetch(webRequest);

    const resHeaders = {};
    webResponse.headers.forEach((value, key) => {
      resHeaders[key] = value;
    });

    res.writeHead(webResponse.status, webResponse.statusText, resHeaders);

    if (webResponse.body) {
      const reader = webResponse.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (ssrErr) {
    console.error('SSR Error:', ssrErr);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server running at http://0.0.0.0:${PORT}`);
});
