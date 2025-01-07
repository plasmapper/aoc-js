import fs from "fs";
import assert from "assert";
import {years} from "./tree.mjs";

describe("AoC solutions", () =>
  years.forEach(year =>
    describe(year.name, () =>
      year.days.forEach(day =>
        describe(day.name, () => {
          if (day.disabled != true) {
            if (day.answers.part1 != undefined) {
              it("Part 1", () =>
                import(day.path + "/code.mjs").then(dayCode =>
                  fs.promises.readFile(day.path + "/testInput.txt").then(input =>
                    (new dayCode.default()).solve(1, input.toString(), false).then(answer => {
                      assert.equal(answer, day.answers.part1);
                    })
                  )
                )
              );
            }
  
            if (day.answers.part2 != undefined) {
              it("Part 2", () =>
                import(day.path + "/code.mjs").then(dayCode =>
                  fs.promises.readFile(day.path + "/testInput.txt").then(input =>
                    (new dayCode.default()).solve(2, input.toString(), false).then(answer => {
                      assert.equal(answer, day.answers.part2);
                    })
                  )
                )
              );
            }
          }
        })
      )
    )
  )
);
