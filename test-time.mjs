import fs from "fs";
import {years} from "./tree.mjs";

let x0 = 7, dx = 6, y0 = 1;
let x = x0, y = y0;

console.log(" ".repeat(x0 + 1) + years.map(year => `${year.name}`).join("  "));
for (let i = 1; i <= 25; i++)
  console.log(`Day ${i < 10 ? " " : ""}${i}`);
process.stdout.cursorTo(x0);
process.stdout.moveCursor(0, -25);

for (let year of years) {
  if (process.argv[2] == undefined || year.name == process.argv[2]) {
    for (let day of year.days) {
      if (day.disabled != true) {
        let code = new (await import(day.path + "/code.mjs")).default();
        let input = (await fs.promises.readFile(day.path + "/puzzleInput.txt")).toString();
        
        let timeString = "";
        if (!code.isMD5Calculation) {
          let start = performance.now();
          await code.solve(1, input, false);
          if (code.noPart2 != true)
            await code.solve(2, input, false);
          let time = Math.ceil(performance.now() - start);
          timeString = `${time > 5000 ? "\x1b[31m" : (time > 1000 ? "\x1b[33m" : "\x1b[32m")}${time.toString().padStart(4)}\x1b[0m`;
        }
        else
          timeString = " MD5";

        process.stdout.write(` ${timeString}`);
        process.stdout.cursorTo(x);
        process.stdout.moveCursor(0, 1);
        y++;
      }
    }
  }

  x += dx;
  process.stdout.cursorTo(x);
  process.stdout.moveCursor(0, y0 - y);
  y = y0;
}

process.stdout.cursorTo(0);
process.stdout.moveCursor(0, 25);