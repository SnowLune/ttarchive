import * as fs from "node:fs/promises";
import path from "node:path";
import { exit } from "process";

var output = process.env.ttarchiveOutput;
if (!output) exit();

const userDir = path.join(output, "user");
var users = [];

function createVideoJSON(userDirectory) {
   var user = { videos: [] };

   fs.readdir(path.join(userDir, userDirectory, "video"), (err, files) => {
      if (err) throw err;
      else return files;
   })
      .then((files) => {
         return files.filter((fileName) => fileName.endsWith("json")).reverse();
      })
      .then((jsonFiles) => {
         jsonFiles.forEach((jsonFilename) => {
            let jsonPath = path.join(
               userDir,
               userDirectory,
               "video",
               jsonFilename
            );
            console.log(jsonPath);
            fs.readFile(jsonPath, { encoding: "utf8" })
               .then((data) => {
                  user.videos.push(JSON.parse(data));
               })
               .catch((err) => {
                  throw err;
               });
         });
      })
      .then((user) => {
         console.dir(user);
      });
}

fs.readdir(userDir, (err, files) => {
   if (err) throw err;
   else return files;
})
   .then((files) => (users = files.filter((dirname) => dirname.at(0) === "@")))
   .then(() => {
      users.forEach(createVideoJSON);
   });
