import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { WebSocketDocsGenerator } from "./generator";

const PORT = 3000;

const server = http.createServer((req, res) => {
  if (req.url === "/") {
    // Generate fresh documentation
    const generator = new WebSocketDocsGenerator();
    const markdown = generator.generateMarkdown();

    // Convert markdown to HTML (you might want to use a markdown library here)
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>WebSocket API Documentation</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            pre { background: #f5f5f5; padding: 10px; border-radius: 5px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div id="content">${markdown}</div>
        </body>
      </html>
    `;

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`Documentation server running at http://localhost:${PORT}`);
});
