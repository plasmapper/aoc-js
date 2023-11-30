import fs from "fs";
import assert from "assert";
import {years} from "./tree.mjs";

describe("AoC solutions", () =>
  years.forEach(year =>
    describe(year.name, () =>
      year.days.forEach(day =>
        describe(day.name, () => {
          it("Part 1 (test input)", () =>
            import(day.path + "/code.mjs").then(dayCode =>
              fs.promises.readFile(day.path + "/testInput.txt").then(input =>
                (new dayCode.default()).solve(1, input.toString(), false).then(answer => {
                  assert.equal(answer, day.answers.part1.testInput);
                })
              )
            )
          );

          it("Part 1 (puzzle input)", () =>
            import(day.path + "/code.mjs").then(dayCode =>
              fs.promises.readFile(day.path + "/puzzleInput.txt").then(input =>
                (new dayCode.default()).solve(1, input.toString(), false).then(answer => {
                  assert.equal(answer, day.answers.part1.puzzleInput);
                })
              )
            )
          );

          it("Part 2 (test input)", () =>
            import(day.path + "/code.mjs").then(dayCode =>
              fs.promises.readFile(day.path + "/testInput.txt").then(input =>
                (new dayCode.default()).solve(2, input.toString(), false).then(answer => {
                  assert.equal(answer, day.answers.part2.testInput);
                })
              )
            )
          );

          it("Part 2 (puzzle input)", () =>
            import(day.path + "/code.mjs").then(dayCode =>
              fs.promises.readFile(day.path + "/puzzleInput.txt").then(input =>
                (new dayCode.default()).solve(2, input.toString(), false).then(answer => {
                  assert.equal(answer, day.answers.part2.puzzleInput);
                })
              )
            )
          );
        })
      )
    )
  )
);
