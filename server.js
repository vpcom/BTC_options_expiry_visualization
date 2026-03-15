const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const HOST = "127.0.0.1";
const PORT = 3000;
const BINANCE_BASE_URL = "https://eapi.binance.com";

http
  .createServer((req, res) => {
    console.log(`Serving file: ${req.url}`);

    // Proxy API requests to Binance (CORS)
    if (req.url.startsWith("/api/binance/")) {
      if (req.method === "OPTIONS") {
        res.writeHead(204, {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Accept",
        });
        return res.end();
      }
      const upstreamPath = req.url.replace("/api/binance", "");
      const upstreamUrl = new URL(upstreamPath, BINANCE_BASE_URL);
      https
        .get(upstreamUrl, (apiResponse) => {
          res.writeHead(apiResponse.statusCode || 500, {
            "Content-Type":
              apiResponse.headers["content-type"] || "application/json",
            "Access-Control-Allow-Origin": "*",
          });
          apiResponse.pipe(res);
        })
        .on("error", (err) => {
          res.writeHead(500);
          res.end(`Proxy error: ${err.message}`);
        });
      return;
    }

    let file = req.url === "/" ? "index.html" : req.url;
    const filePath = path.join(__dirname, file);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end("Not found");
      }

      // Content type specification
      const extension = path.extname(filePath);
      let contentType = "text/html";
      if (extension === ".js") {
        contentType = "text/javascript";
      } else if (extension === ".css") {
        contentType = "text/css";
      }

      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    });
  })
  .listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}`);
  });
