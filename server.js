const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;

http
  .createServer((req, res) => {
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
  .listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
