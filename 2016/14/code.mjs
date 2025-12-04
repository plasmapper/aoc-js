import { delay, Console } from "../../utility.mjs";

export default class  {
  /**
   * @param {Console} solConsole Solution console.
   * @param {HTMLElement} visContainer Visualization container.
   */
  constructor(solConsole, visContainer) {
    this.isSolving = false;
    this.isStopping = false;
    this.solConsole = typeof solConsole !== "undefined" ? solConsole : new Console();
    this.visContainer = visContainer;
    this.isMD5Calculation = true;
  }
  
 /**
   * Parses the puzzle input.
   * @param {string} input Puzzle input.
   * @returns {string} Salt.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let salt = input.trim();

    consoleLine.innerHTML += " done.";
    return salt;
  }

  /**
   * Finds the index that produces 64th one-time pad key.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Index that produces 64th one-time pad key.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let salt = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let numberOfKeysToFind = 64;
      let numberOfMd5Iterations = part == 1 ? 1 : 2017;
      let possibleKeyMap = {};
      let keys = [];
      
      for (let index = 0; keys.length < numberOfKeysToFind; index++) {
        if (this.isStopping)
          return;

        let md5 = salt + index;
        for (let i = 0; i < numberOfMd5Iterations; i++)
          md5 = CryptoJS.MD5(md5).toString();

        // Check if the hash contains 5 consecutive characters
        for (let i = 0; i < md5.length - 4; i++) {
          if (md5[i] == md5[i + 1] && md5[i] == md5[i + 2] && md5[i] == md5[i + 3] && md5[i] == md5[i + 4]) {
            let possibleKeys = possibleKeyMap[md5[i]];
            if (possibleKeys != undefined) {
              for (let possibleKey of possibleKeys) {
                if (index - possibleKey.threeCharacterIndex <= 1000)
                  keys.push(new Key(possibleKey.threeCharacterIndex, possibleKey.threeCharacterIndexHash, possibleKey.threeCharacterIndexHashShift, index, md5, i));
              }

              keys.sort((a, b) => a.threeCharacterIndex - b.threeCharacterIndex);
              if (visualization) {
                visConsole.clear();
                for (let keyIndex = 0; keyIndex < keys.length && keyIndex < numberOfKeysToFind; keyIndex++) {
                  let key = keys[keyIndex];
                  visConsole.addLine(`Key ${keyIndex + 1}:`);
                  let md5TitleString = part == 1 ? "MD5 hash" : `${numberOfMd5Iterations} MD5 iterations`;
                  visConsole.addLine(`${md5TitleString} of ${salt}<span${keyIndex == numberOfKeysToFind - 1 ? " class='strongly-highlighted'" : ""}>${key.threeCharacterIndex}</span>:`);
                  visConsole.addLine(key.threeCharacterIndexHash.substring(0, key.threeCharacterIndexHashShift)
                    + `<span class="weakly-highlighted">${key.threeCharacterIndexHash.substring(key.threeCharacterIndexHashShift, key.threeCharacterIndexHashShift + 3)}</span>`
                    + key.threeCharacterIndexHash.substring(key.threeCharacterIndexHashShift + 3));
                  visConsole.addLine(`${md5TitleString} of ${salt + key.fiveCharacterIndex}:`);
                  visConsole.addLine(key.fiveCharacterIndexHash.substring(0, key.fiveCharacterIndexHashShift)
                    + `<span class="highlighted">${key.fiveCharacterIndexHash.substring(key.fiveCharacterIndexHashShift, key.fiveCharacterIndexHashShift + 5)}</span>`
                    + key.fiveCharacterIndexHash.substring(key.fiveCharacterIndexHashShift + 3));
                  visConsole.addLine();
                }
                visConsole.container.scrollTop = visConsole.lines[visConsole.lines.length - 1].offsetTop - visConsole.container.offsetHeight / 2;

                await delay(1);
              }

              possibleKeyMap[md5[i]] = [];
            }
          }
        }
        
        // Check if the hash contains 3 consecutive characters
        for (let i = 0, threeCharactersFound = false; i < md5.length - 2 && !threeCharactersFound; i++) {
          if (md5[i] == md5[i + 1] && md5[i] == md5[i + 2]) {
            threeCharactersFound = true;
            if (!(md5[i] in possibleKeyMap))
              possibleKeyMap[md5[i]] = [new Key(index, md5, i)];
            else
              possibleKeyMap[md5[i]].push(new Key(index, md5, i));
          }
        }
      }

      return keys[numberOfKeysToFind - 1].threeCharacterIndex;
    }
    
    finally {
      this.isSolving = false;
    }
  }

  /**
   * Stops solving the puzzle.
   */
  async stopSolving() {
    this.isStopping = true;
    while (this.isSolving)
      await(delay(10));
    this.isStopping = false;
  }
}

/**
 * Puzzle key class.
 */
class Key {
  /**
   * @param {number} threeCharacterIndex Three character index.
   * @param {string} threeCharacterIndexHash Three character index hash.
   * @param {number} threeCharacterIndexHashShift Three character index hash shift.
   * @param {number} fiveCharacterIndex Five character index.
   * @param {string} fiveCharacterIndexHash Five character index hash.
   * @param {number} fiveCharacterIndexHashShift Five character index hash shift.
   */
  constructor(threeCharacterIndex, threeCharacterIndexHash, threeCharacterIndexHashShift, fiveCharacterIndex = null, fiveCharacterIndexHash = null, fiveCharacterIndexHashShift = null) {
    /**
     * Three character index.
     * @type {number}
     */
    this.threeCharacterIndex = threeCharacterIndex;
    /**
     * Three character index hash.
     * @type {string}
     */
    this.threeCharacterIndexHash = threeCharacterIndexHash;
    /**
     * Three character index hash shift.
     * @type {number}
     */
    this.threeCharacterIndexHashShift = threeCharacterIndexHashShift;
    /**
     * Five character index.
     * @type {number}
     */
    this.fiveCharacterIndex = fiveCharacterIndex;
    /**
     * Five character index hash.
     * @type {string}
     */
    this.fiveCharacterIndexHash = fiveCharacterIndexHash;
    /**
     * Five character index hash shift.
     * @type {number}
     */
    this.fiveCharacterIndexHashShift = fiveCharacterIndexHashShift;
  }
}