import fs from "fs";
import https from "https";
import readline from "readline"
import {years} from "./tree.mjs";

let readlineInterface = readline.createInterface({input: process.stdin, output: process.stdout});
readlineInterface.question("Session cookie: ", session => {
  readlineInterface.close();

  for (let year of years) {
    for (let day of year.days) {
      https.get(`${day.taskUrl}/input`, { headers : {Cookie: `session=${session}`}}, res => {
        let data = "";
        res.on("data", chunk => data += chunk);
        res.on("end", () => {
          fs.writeFile(`${day.path}/puzzleInput.txt`, data, err => {});
        });
      });
    }
  }
});