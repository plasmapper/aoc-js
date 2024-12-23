import { delay, Console, leastCommonMultiple } from "../../utility.mjs";

export default class {
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
   * @returns {Module[]} Modules.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let modules = [];
    let outputNames = [];

    input.trim().split(/\r?\n/).forEach((line, index) => {
      let match = line.match(/^(broadcaster|[&%].+) -> (.*)$/);
      if (match == null)
        throw new Error(`Invalid data in line ${index + 1}`);
      
      if (match[1] == "broadcaster")
        modules.push(new Broadcaster());
      if (match[1].substring(0, 1) == "%")
        modules.push(new FlipFlop(match[1].substring(1)));
      if (match[1].substring(0, 1) == "&")
        modules.push(new Conjunction(match[1].substring(1)));

      outputNames.push(match[2].split(", "));
    });

    let modulesWithoutOutputs = [];
    for (let i = 0; i < modules.length; i++) {
      for (let outputName of outputNames[i]) {
        let output = modules.find(m => m.name == outputName);
        if (output == undefined) {
          output = new Module(outputName);
          modulesWithoutOutputs.push(output);
        }
        modules[i].addOutput(output);
      }
    }

    consoleLine.innerHTML += " done.";
    return modules.concat(modulesWithoutOutputs);
  }

  /**
   * Calculates the number of pulses.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of pulses.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let modules = this.parse(input);
      let button = new Module("button");
      let broadcaster = modules.find(m => m instanceof Broadcaster);
      if (broadcaster == undefined)
        throw new Error("Broadcaster module not found");
      for (let module of modules) {
        if (module instanceof Conjunction)
          module.inputLevels = new Array(module.inputs.length).fill(0);
      }

      let solConsole = this.solConsole;
      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      // Calculate number of low and high pulses for 1000 button presses
      if (part == 1) {
        solConsole.addLine(`Number of button presses: 1000.`);

        let numberOfLowPulses = 0;
        let numberOfHighPulses = 0;
        
        for (let i = 0; i < 1000; i++) {
          let pulses = [new Pulse(button, broadcaster, 0)];
    
          if (visualization) {
            visConsole.addLine(`Button press ${i + 1}:`);
            visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
          }

          while (pulses.length) {
            let newPulses = [];
            for (let pulse of pulses) {
              if (pulse.level == 0)
                numberOfLowPulses++;
              else
                numberOfHighPulses++;

              if (visualization)
                visConsole.addLine(`${pulse.source.name} -${pulse.level == 0 ? "low" : "high"}-> ${pulse.destination.name}`);
              newPulses = newPulses.concat(pulse.destination.analyzePulse(pulse));
            }

            pulses = newPulses;
          }
          if (visualization)
            visConsole.addLine();
        }
  
        return numberOfLowPulses * numberOfHighPulses;
      }
      // Calculate the periods of high pulses for main conjunction inputs
      else {
        if (visualization) {
          visConsole.addLine("Solution is based on the assumption that \"rx\" module is triggered by a conjunction with periodic inputs.")
          visConsole.addLine("It is also assumed that these inputs are in high state synchronously and their period is equal to the number of the first button press that generates high level.")
        }

        let rxModule = modules.find(m => m.name == "rx");
        if (rxModule == undefined) {
          solConsole.addLine(`"rx" module not found`);
          return;
        }
        if (rxModule.inputs.length != 1 || !(rxModule.inputs[0] instanceof Conjunction)) {
          solConsole.addLine(`Puzzle input assumptions are not met :)`);
          return;
        }
        
        let mainConjunctionInputs = rxModule.inputs[0].inputs;
        let periods = [];
        
        for (let input of mainConjunctionInputs) {
          for (let module of modules) {
            if (module instanceof FlipFlop)
              module.isOn = false;
            if (module instanceof Conjunction)
              module.inputLevels.fill(0);
          }

          let period = 0;
          for (let i = 1; period == 0; i++) {
            let pulses = [new Pulse(button, broadcaster, 0)];

            while (pulses.length) {
              let newPulses = [];
              for (let pulse of pulses) {
                if (pulse.source == input && pulse.level == 1)
                  period = i;
                newPulses = newPulses.concat(pulse.destination.analyzePulse(pulse));
              }
              pulses = newPulses;
            }
          }
          
          periods.push(period)
        }

        if (visualization)
          visConsole.addLine(`These inputs ${mainConjunctionInputs.map(m => `"${m.name}"`).join(", ")} have periods ${periods.join(", ")}.`)

        return periods.reduce((acc, e) => leastCommonMultiple(acc, e), 1);
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
 * Puzzle module.
 */
class Module {
  /**
   * @param {string} name Module name. 
   */
  constructor(name) {
    /**
     * Module name.
     * @type {string}
     */
    this.name = name;
    /**
     * Inputs.
     * @type {Module[]}
     */
    this.inputs = [];
    /**
     * Outputs.
     * @type {Module[]}
     */
    this.outputs = [];

    /**
     * Input pulse cycles.
     * @type {PulseCycle}
     */
    this.inputPulseCycles = [];
  }

  /**
   * Adds output to the module.
   * @param {Module} output Output.
   */
  addOutput(module) {
    this.outputs.push(module);
    module.inputs.push(this);
  }

  /**
   * Analyzes input pulse and returns output pulses.
   * @param {Pulse} pulse Input pulse.
   * @returns {Pulse[]} Output pulses.
   */
  analyzePulse(pulse) {
    return [];
  }

  /**
   * Analyzes input pulse cycle.
   * @param {PulseCycle} pulse Input pulse cycle.
   */
  analyzePulseCycle(pulseCycle) {
    this.inputPulseCycles.push(pulseCycle);
  }
}

/**
 * Puzzle broadcaster module.
 */
class Broadcaster extends Module {
  constructor() {
    super("broadcaster");
  }

  /**
   * Analyzes input pulse and returns output pulses.
   * @param {Pulse} pulse Input pulse.
   * @returns {Pulse[]} Output pulses.
   */
  analyzePulse(pulse) {
    return this.outputs.map(output => new Pulse(this, output, pulse.level));
  }

  /**
   * Analyzes input pulse cycle.
   * @param {PulseCycle} pulse Input pulse cycle.
   */
  analyzePulseCycle(pulseCycle) {
    super.analyzePulseCycle(pulseCycle);
    for (let output of this.outputs)
      output.analyzePulseCycle(new PulseCycle(this, pulseCycle.level, pulseCycle.step + 1, pulseCycle.cycle));
  }
}

/**
 * Puzzle flip-flop module.
 */
class FlipFlop extends Module {
  /**
   * @param {string} name Module name. 
   */
  constructor(name) {
    super(name);
    /**
     * Module is on.
     * @type {boolean}
     */
    this.isOn = false;
  }

  /**
   * Analyzes input pulse and returns output pulses.
   * @param {Pulse} pulse Input pulse.
   * @returns {Pulse[]} Output pulses.
   */
  analyzePulse(pulse) {
    if (pulse.level == 1)
      return [];
    this.isOn = !this.isOn;
    return this.outputs.map(output => new Pulse(this, output, this.isOn ? 1 : 0));
  }

  /**
   * Analyzes input pulse cycle.
   * @param {PulseCycle} pulse Input pulse cycle.
   */
  analyzePulseCycle(pulseCycle) {
    super.analyzePulseCycle(pulseCycle);
    if (pulseCycle.level == 0) {
      for (let output of this.outputs)
        output.analyzePulseCycle(new PulseCycle(this, pulseCycle.level, pulseCycle.step + 1, pulseCycle.cycle));
    }
  }
}

/**
 * Puzzle conjunction module.
 */
class Conjunction extends Module {
  /**
   * @param {string} name Module name. 
   */
  constructor(name) {
    super(name);
    /**
     * Recent pulse levels received from inputs (0 - low, 1 - high).
     * @type {number[]}
     */
    this.inputLevels = [];
  }

  /**
   * Analyzes input pulse and returns output pulses.
   * @param {Pulse} pulse Input pulse.
   * @returns {Pulse[]} Output pulses.
   */
  analyzePulse(pulse) {
    this.inputLevels[this.inputs.indexOf(pulse.source)] = pulse.level;
    let outputLevel = this.inputLevels.reduce((acc, e) => acc * e, 1) ? 0 : 1;
    return this.outputs.map(output => new Pulse(this, output, outputLevel));
  }
}

/**
 * Puzzle pulse class.
 */
class Pulse {
  /**
   * @param {Module} source Pulse source.
   * @param {Module} destination Pulse destination.
   * @param {number} level Pulse level (0 - low, 1 - high).
   */
  constructor(source, destination, level) {
    /**
     * Pulse source.
     * @type {Module}
     */
    this.source = source;
    /**
     * Pulse destination.
     * @type {Module}
     */
    this.destination = destination;
    /**
     * Pulse level (0 - low, 1 - high).
     * @type {number}
     */
    this.level = level;
  }
}

class PulseCycle {
  /**
   * @param {Module} source Pulse source.
   * @param {number} level Pulse level (0 - low, 1 - high).
   * @param {number} step Pulse propagation step.
   * @param {number} cycle Pulse generation cycle.
   */
  constructor(source, level, step, cycle) {
    /**
     * Pulse source.
     * @type {Module}
     */
    this.source = source;
    /**
     * Pulse level (0 - low, 1 - high).
     * @type {number}
     */
    this.level = level;  
    /**
     * Pulse propagation step.
     * @type {number}
     */
    this.step = step;
    /**
     * Pulse generation cycle.
     * @type {number}
     */
    this.cycle = cycle;
  }
}