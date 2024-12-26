import fs from "fs";
import {years} from "./tree.mjs";

for (let year of years) {
  for (let day of year.days) {
    if (day.disabled != true) {
      let code = new (await import(day.path + "/code.mjs")).default();
      let input = (await fs.promises.readFile(day.path + "/puzzleInput.txt")).toString();
      
      let start = performance.now();
      await code.solve(1, input, false);
      let part1Time = (Math.ceil(performance.now() - start)).toString().padStart(5);
      
      start = performance.now();
      let part2Time = 0;
      if (code.noPart2 != true) {
        await code.solve(2, input, false);
        part2Time = Math.ceil(performance.now() - start);
      }
      part2Time = part2Time.toString().padStart(4);

      part1Time = `${part1Time > 5000 ? "\x1b[31m" : (part1Time > 1000 ? "\x1b[33m" : "\x1b[32m")}${part1Time}\x1b[0m`;
      part2Time = `${part2Time > 5000 ? "\x1b[31m" : (part2Time > 1000 ? "\x1b[33m" : "\x1b[32m")}${part2Time}\x1b[0m`;

      console.log(`${year.name} ${day.name.substring(0, 7)} ${part1Time} / ${part2Time} ms`);
    }
  }
}