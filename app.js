import express from "express";
import path from "node:path";
import { exit } from "node:process";

const app = express();

const output = process.env.ttarchiveOutput;

if (!output) exit();

const PORT = process.env.PORT || 3000;

// Remove trailing "/"
app.use((req, res, next) => {
   if (req.path.at(-1) === "/" && req.path.length > 1) {
      const query = req.url.slice(req.path.length);
      res.redirect(301, req.path.slice(0, -1) + query);
   } else {
      next();
   }
});

app.use(express.static(output, { redirect: false }));

app.get("/user/:username", (req, res) => {
   res.sendFile(output + "/user/" + req.params.username + "/index.html");
});

app.get("/", (req, res) => {
   res.sendFile("index.html");
});

app.listen(PORT, () => {
   console.log("Started server on port " + PORT);
});
