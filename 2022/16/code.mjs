import { delay, Console, PriorityQueue } from "../../utility.mjs";

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
   * @returns {Valve[]} Valves.
   */
 parse(input) {
  let consoleLine = this.solConsole.addLine("Parsing...");

  let valves = [];
  
  input.trim().split(/\r?\n/).forEach((line, index) => {
    let match;
    if ((match = line.match(/^Valve ([A-Z][A-Z]) has flow rate=(\d+); tunnels? leads? to valves? ([A-Z][A-Z](, [A-Z][A-Z])*)$/)) == null)
      throw new Error(`Invalid data in line ${index + 1}`);
    let valve = valves.find(valve => valve.name == match[1]);
    if (valve == undefined)
      valves.push(valve = new Valve(match[1]));
    valve.flowRate = parseInt(match[2]);

    for (let neighborValveName of match[3].split(", ")) {
      let neighborValve = valves.find(valve => valve.name == neighborValveName);
      if (neighborValve == undefined) {
        neighborValve = new Valve(neighborValveName);
        valves.push(neighborValve);
      }
      valve.neighbors.push(neighborValve);
    }
  });

  consoleLine.innerHTML += " done.";
  return valves;
}

  /**
   * Finds the maximum released pressure.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Maximum released pressure.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let valves = this.parse(input);
      let startValve = valves.find(valve => valve.name == "AA");
      if (startValve == undefined)
        throw new Error("Valve AA not found");
      let numberOfMinutes = part == 1 ? 30 : 26;

      // Find all routes
      for (let valve of valves) {
        let neighbors = valve.neighbors;
        for (let neighbor of neighbors)
          valve.routes.set(neighbor, [neighbor]);

        let destinations = neighbors;
        while (destinations.length > 0) {
          let newDestinations = [];
          for (let destination of destinations) {
            for (let neighbor of destination.neighbors) {
              if (valve != neighbor && !valve.routes.has(neighbor)) {
                valve.routes.set(neighbor, [...valve.routes.get(destination), neighbor]);
                newDestinations.push(neighbor);
              }
            }
          }
          destinations = newDestinations;
        }
      }

      // Remove valves with 0 flow rate
      for (let valve of valves) {
        for (let destination of [...valve.routes.keys()]) {
          if (destination.flowRate == 0)
            valve.routes.delete(destination);
        }
      }
      valves = valves.filter(valve => valve.flowRate > 0);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let maxPressureReleaseRoutes;
      let maxPressureRelease = 0;

      // Find single route
      if (part == 1) {
        maxPressureReleaseRoutes = [this.findRoute(startValve, new Set(valves), numberOfMinutes)];
        maxPressureRelease = maxPressureReleaseRoutes[0].pressureRelease;
      }
      
      // Find double route
      else {
        // Find routes for all sets of valves
        let singleRoutes = [];
        let numberOfSingleRoutes = 1 << valves.length;
        for (let routeIndex = 0; routeIndex < numberOfSingleRoutes; routeIndex++) {
          let unvisitedValves = new Set();
          for (let ri = routeIndex, vi = 0; ri > 0; ri >>= 1, vi++)
          {
            if (ri & 1)
              unvisitedValves.add(valves[vi]);
          }
          singleRoutes.push(this.findRoute(startValve, unvisitedValves, numberOfMinutes));
        }

        // Find optimal combination of single routes
        let numberOfDoubleRoutes = numberOfSingleRoutes / 2;
        maxPressureReleaseRoutes = [new Route([startValve], new Set(valves), 0, numberOfMinutes), new Route([startValve], new Set(valves), 0, numberOfMinutes)];
        for (let firstRouteIndex = 0; firstRouteIndex < numberOfDoubleRoutes; firstRouteIndex++) {
          let secondRouteIndex = firstRouteIndex ^ (numberOfSingleRoutes - 1);
          let firstRoute = singleRoutes[firstRouteIndex];
          let secondRoute = singleRoutes[secondRouteIndex];
          if (firstRoute.pressureRelease + secondRoute.pressureRelease > maxPressureReleaseRoutes[0].pressureRelease + maxPressureReleaseRoutes[1].pressureRelease)
            maxPressureReleaseRoutes = [firstRoute, secondRoute];
        }

        maxPressureRelease = maxPressureReleaseRoutes[0].pressureRelease + maxPressureReleaseRoutes[1].pressureRelease;
      }

      if (visualization) {
        let moveSteps = [];
        let openSteps = [];
        for (let route of maxPressureReleaseRoutes) {
          moveSteps.push([]);
          openSteps.push([]);

          for (let i = 0; i < route.visitedValves.length - 1; i++) {
            moveSteps[moveSteps.length - 1].push(...(route.visitedValves[i].routes.get(route.visitedValves[i + 1])), route.visitedValves[i + 1]);
            openSteps[openSteps.length - 1].push(...(new Array(moveSteps[moveSteps.length - 1].length - openSteps[openSteps.length - 1].length - 1).fill(0)), 1);
          }
        }

        let openValveNames = [];
        let flowRate = 0;
        for (let minute = 1; minute <= numberOfMinutes; minute++) {
          visConsole.addLine(`== Minute ${minute} ==`);
          visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");

          if (openValveNames.length == 0)            
            visConsole.addLine("No valves are open.");
          else if (openValveNames.length == 1)
            visConsole.addLine(`Valve ${openValveNames[0]} is open, releasing ${flowRate} pressure.`);
          else if (openValveNames.length == 2)
            visConsole.addLine(`Valves ${openValveNames[0]} and ${openValveNames[1]} are open, releasing ${flowRate} pressure.`);
          else 
            visConsole.addLine(`Valves ${openValveNames.slice(0, openValveNames.length - 1).join(", ")}, and ${openValveNames[openValveNames.length - 1]} are open, releasing ${flowRate} pressure.`);

          for (let person = 0; person < moveSteps.length; person++) {
            if (moveSteps[person].length > 0) {
              if (openSteps[person][0]) {
                visConsole.addLine(`${person == 0 ? "You open" : "The elephant opens"} valve ${moveSteps[person][0].name}.`);
                openValveNames.push(moveSteps[person][0].name);
                flowRate += moveSteps[person][0].flowRate;
                openValveNames.sort()
              }
              else
                visConsole.addLine(`${person == 0 ? "You move" : "The elephant moves"} to valve ${moveSteps[person][0].name}.`);
  
              moveSteps[person].shift();
              openSteps[person].shift();
            }
          }

          visConsole.addLine();
        }
      }

      return maxPressureRelease;
    }
    
    finally {
      this.isSolving = false;
    }
  }

  /**
   * Finds the route with maximum pressure release.
   * @param {Valve} startValve Start valve.
   * @param {Set<Valve>} unvisitedValves Unvisited valves.
   * @param {number} numberOfMinutes Number of minutes.
   * @returns {Route} Route with maximum pressure release.
   */
  findRoute(startValve, unvisitedValves, numberOfMinutes) {
    let initialRoute = new Route([startValve], unvisitedValves, 0, numberOfMinutes);
    let maxPressureReleaseRoute = initialRoute;
    let maxPressureRelease = initialRoute.pressureRelease;
    let routes = new PriorityQueue();
    routes.enqueue(initialRoute, -initialRoute.pressureRelease);

    while (routes.getSize()) {
      let route = routes.dequeue();
      let endValve = route.visitedValves[route.visitedValves.length - 1];

      for (let destination of route.unvisitedValves) {
        let destinationRoute = endValve.routes.get(destination);
        let minutesLeft = route.minutesLeft - destinationRoute.length - 1;
        
        // If valve will have time to release pressure
        if (minutesLeft > 1) {
          let pressureRelease = route.pressureRelease + destination.flowRate * minutesLeft;

          let maxPossiblePressureRelease = pressureRelease;
          for (let unvisitedValve of route.unvisitedValves) {
            if (unvisitedValve != destination)
              maxPossiblePressureRelease += unvisitedValve.flowRate * Math.max(0, minutesLeft - destination.routes.get(unvisitedValve).length - 1);
          }

          // If max possible pressure release of the route is greater than already found max pressure release  
          if (maxPossiblePressureRelease > maxPressureRelease) {
            let newVisitedValves = route.visitedValves.slice();
            newVisitedValves.push(destination);
            let newUnvisitedValves = new Set(route.unvisitedValves);
            newUnvisitedValves.delete(destination);
  
            let newRoute = new Route(newVisitedValves, newUnvisitedValves, pressureRelease, minutesLeft);
            routes.enqueue(newRoute, -newRoute.pressureRelease)
  
            // If pressure release is greater than max pressure release
            if (pressureRelease > maxPressureRelease) {
              maxPressureReleaseRoute = newRoute;
              maxPressureRelease = pressureRelease;
            }
          }
        }
      }
    }

    return maxPressureReleaseRoute;
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
 * Puzzle valve class.
 */
class Valve {
  /**
   * @param {string} name Name.
   * @param {number} flowRate Flow rate.
   */
  constructor(name) {
    /**
     * Name.
     * @type {string}
     */
    this.name = name;
    /**
     * Flow rate.
     * @type {number}
     */
    this.flowRate = 0;
    /**
     * Neighbors.
     * @type {Valve[]}
     */
    this.neighbors = [];
    /**
     * Routes to other valves.
     * @type {Map<Valve, Valve[]>}
     */
    this.routes = new Map();
  }
}

/**
 * Puzzle route class.
 */
class Route {
  /**
   * @param {Valve[]} visitedValves Array of visited valves (in order).
   * @param {Set<Valve>} unvisitedValves Set of unvisited valves.
   * @param {number} pressureRelease Pressure release at the end.
   * @param {number} minutesLeft Minutes left.
   */
  constructor(visitedValves, unvisitedValves, pressureRelease, minutesLeft) {
    /**
     * Array of visited valves (in order).
     * @type {Valve[]}
     */
    this.visitedValves = visitedValves;
    /**
     * Set of unvisited valves.
     * @type {Set<Valve>}
     */
    this.unvisitedValves = unvisitedValves;
    /**
     * Pressure release at the end.
     * @type {number}
     */
    this.pressureRelease = pressureRelease;
    /**
     * Minutes left.
     * @type {number}
     */
    this.minutesLeft = minutesLeft;
  }
}