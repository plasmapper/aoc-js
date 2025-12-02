import { delay, Console, Vector2D } from "../../utility.mjs";

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
  }
  
  /**
   * Parses the puzzle input.
   * @param {string} input Puzzle input.
   * @returns {Room[]} Rooms.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let rooms = input.trim().split(/\r?\n/).map((line, index) => {
      let match = line.match(/^([a-z\-]+)\-(\d+)\[([a-z][a-z][a-z][a-z][a-z])\]$/);
      if (match == null)
        throw new Error(`Invalid data in line ${index + 1}`);
      return new Room(match[1], parseInt(match[2]), match[3]);
    });

    consoleLine.innerHTML += " done.";
    return rooms;
  }

  /**
   * Finds the sum of the sector IDs of the real rooms (part 1) or the sector ID of the room where North Pole objects are stored (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Sum of the sector IDs of the real rooms (part 1) or the sector ID of the room where North Pole objects are stored (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let rooms = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      // Finds the sum of the sector IDs of the real rooms (part 1)
      if (part == 1) {
        let sumOfSectorIdsForValidRooms = 0;

        for (let room of rooms) {
          if (visualization)
            visConsole.addLine(`${room.name}-${room.sectorId}[${room.checksum}]`);

          let numbersOfLettersObject = {};
          for (let letter of room.name.split("")) {
            if (letter != "-") {
              if (!(letter in numbersOfLettersObject))
                numbersOfLettersObject[letter] = 1;
              else
                numbersOfLettersObject[letter]++;
            }
          }

          let numbersOfLettersArray = Object.keys(numbersOfLettersObject).map(letter => ({letter: letter, number: numbersOfLettersObject[letter]}))
            .sort((a, b) => b.number - a.number != 0 ? b.number - a.number : a.letter.localeCompare(b.letter));

          if (numbersOfLettersArray.length >= room.checksum.length && room.checksum.split("").reduce((acc, e, i) => acc && e == numbersOfLettersArray[i].letter, true)) {
            sumOfSectorIdsForValidRooms += room.sectorId;
            if (visualization)
              visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
          }
        }

        return sumOfSectorIdsForValidRooms;
      }

      // Finds the sector ID of the room where North Pole objects are stored (part 2)
      else {
        let northPoleObjectStorageName = "northpole object storage";

        for (let room of rooms) {
          room.name = room.name.split("")
            .map(e => e == "-" ? " " : String.fromCharCode(((e.charCodeAt(0) - "a".charCodeAt(0)) + room.sectorId) % 26 + "a".charCodeAt(0)))
            .join("");

          if (visualization)
            visConsole.addLine(`${room.name} - ${room.sectorId}`);
        }

        let northPoleObjectStorageIndex = rooms.findIndex(e => e.name == northPoleObjectStorageName);

        if (northPoleObjectStorageIndex < 0)
          throw new Error(`The room where North Pole objects are stored not found`);

        if (visualization) {
          visConsole.lines[northPoleObjectStorageIndex].classList.add("highlighted");
          visConsole.container.scrollTop = visConsole.lines[northPoleObjectStorageIndex].offsetTop - visConsole.container.offsetHeight / 2;
        }

        return rooms[northPoleObjectStorageIndex].sectorId;
      }
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
 * Puzzle room class.
 */
class Room  {
  /**
   * @param {string} name Name.
   * @param {number} sectorId Sector ID.
   * @param {string} checksum Checksum.
   */
  constructor(name, sectorId, checksum) {
    /**
     * Name.
     * @type {string}
     */
    this.name = name;
    /**
     * Sector ID.
     * @type {number}
     */
    this.sectorId = sectorId;
    /**
     * Checksum.
     * @type {string}
     */
    this.checksum = checksum;
  }
}