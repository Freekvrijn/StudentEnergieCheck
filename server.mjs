import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 8080);
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, `http://127.0.0.1:${port}`).pathname);
    const path = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!path.startsWith(root + sep) || pathname.split('/').some(part => part.startsWith('.'))) {
      res.writeHead(403).end('Geen toegang');
      return;
    }
    // Serve only the public application files, never local records or documentation.
    if (!['index.html', 'styles.css', 'app.js', 'logic.mjs'].includes(path.slice(root.length + 1))) {
      res.writeHead(404).end('Niet gevonden');
      return;
    }
    const body = await readFile(path);
    res.writeHead(200, { 'Content-Type': `${types[extname(path)] || 'application/octet-stream'}; charset=utf-8`, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    res.end(body);
  } catch {
    res.writeHead(404).end('Niet gevonden');
  }
});
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? `Poort ${port} is bezet. Kies een andere poort via PORT=8081 npm run dev.` : error.message);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => console.log(`Student Energy Check draait op http://127.0.0.1:${port}`));
