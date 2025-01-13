import fs from "fs";
import {years} from "./tree.mjs";

let x0 = 6, dx = 10, y0 = 1;
let x = x0, y = y0;

console.log(" ".repeat(x0 + 6) + years.map(year => `${year.name}`).join("      "));
for (let i = 1; i <= 25; i++)
  console.log(`Day ${i < 10 ? " " : ""}${i}`);
process.stdout.cursorTo(x0);
process.stdout.moveCursor(0, -25);

for (let year of years) {
  for (let day of year.days) {
    if (day.disabled != true) {
      let code = new (await import(day.path + "/code.mjs")).default();
      let input = (await fs.promises.readFile(day.path + "/puzzleInput.txt")).toString();
      
      let start = performance.now();
      await code.solve(1, input, false);
      let part1Time = (Math.ceil(performance.now() - start)).toString().padStart(4);
      
      start = performance.now();
      let part2Time = 0;
      if (code.noPart2 != true) {
        await code.solve(2, input, false);
        part2Time = Math.ceil(performance.now() - start);
      }
      part2Time = part2Time.toString().padStart(4);

      part1Time = `${part1Time > 5000 ? "\x1b[31m" : (part1Time > 1000 ? "\x1b[33m" : "\x1b[32m")}${part1Time}\x1b[0m`;
      part2Time = `${part2Time > 5000 ? "\x1b[31m" : (part2Time > 1000 ? "\x1b[33m" : "\x1b[32m")}${part2Time}\x1b[0m`;

      process.stdout.write(` ${part1Time}/${part2Time}`);
      process.stdout.cursorTo(x);
      process.stdout.moveCursor(0, 1);
      y++;
    }
  }

  x += dx;
  process.stdout.cursorTo(x);
  process.stdout.moveCursor(0, y0 - y);
  y = y0;
}

process.stdout.cursorTo(0);
process.stdout.moveCursor(0, 25);