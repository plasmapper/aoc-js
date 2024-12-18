let yearsContainer = document.getElementById("years-container");
let daysContainer = document.getElementById("days-container");
let taskTextLink = document.getElementById("task-text-link");
let taskInput = document.getElementById("task-input");
let part1Selector = document.getElementById("part1-selector");
let part2Selector = document.getElementById("part2-selector");
let visualizationSwitch = document.getElementById("visualization-switch");
let solveButton = document.getElementById("solve-button");
let stopButton = document.getElementById("stop-button");
let solutionConsole;
let visualizationContainer = document.getElementById("visualization-container");

let years = [];
let currentYearIndex = 0;
let currentDayIndex = 0;
let currentPart = 1;
let visualization = true;
let currentPuzzle;

initialize();

/**
 * Initializes the main page interface.
 */
async function initialize() {
  years = (await import("./tree.mjs")).years;
  solutionConsole = new (await import("./utility.mjs")).Console();
  solutionConsole.container = document.getElementById("solution-console")

  let url = new URL(window.location.href);
  let year = parseInt(url.searchParams.get("year"));
  let day = parseInt(url.searchParams.get("day"));
  let part = parseInt(url.searchParams.get("part"));
  
  yearsContainer.innerHTML = "";

  for (let i = 0; i < years.length; i++) {
    let yearSelector = document.createElement("span");
    yearSelector.classList.add("selector");
    yearSelector.onclick = () => setYearIndex(i);
    yearSelector.innerHTML = years[i].name;
    yearsContainer.append(yearSelector);
  }

  await setYearIndex(years.findIndex(e => e.name == year));
  await setDayIndex(day - 1);
  await setPart(part);
  visualization = false;
  await toggleVisualization();
}

/**
 * Sets the year index.
 * @param {number} index Year index.
 */
async function setYearIndex(index) {
  if (!Number.isInteger(index))
    index = 0;
  currentYearIndex = Math.max(0, Math.min(index, years.length - 1));

  let yearSelectors = yearsContainer.children;
  
  for (let i = 0; i < years.length; i++) {
    if (i == currentYearIndex)
      yearSelectors[i].classList.add("active");
    else
      yearSelectors[i].classList.remove("active");
  }

  daysContainer.innerHTML = "";

  for (let i = 0; i < years[currentYearIndex].days.length; i++) {
    let daySelector = document.createElement("span");
    if (years[currentYearIndex].days[i].disabled != true) {
      daySelector.classList.add("selector");
      daySelector.onclick = () => setDayIndex(i);
    }
    daySelector.innerHTML = years[currentYearIndex].days[i].name;
    daysContainer.append(daySelector);
  }

  await setDayIndex(0);
}

/**
 * Sets the day index.
 * @param {number} index Day index.
 */
async function setDayIndex(index) {
  await stopSolvingPuzzle();

  if (!Number.isInteger(index))
    index = 0;
  currentDayIndex = Math.max(0, Math.min(index, years[currentYearIndex].days.length - 1));

  let daySelectors = daysContainer.children;
  
  for (let i = 0; i < years[currentYearIndex].days.length; i++) {
    if (i == currentDayIndex)
      daySelectors[i].classList.add("active");
    else
      daySelectors[i].classList.remove("active");
  }

  taskTextLink.href = years[currentYearIndex].days[currentDayIndex].taskUrl;
  currentPuzzle = new (await import (`./${years[currentYearIndex].days[currentDayIndex].path}/code.mjs`)).default(solutionConsole, visualizationContainer);
  await setPart(1);
  await loadTestInput();
}

/**
 * Loads the test input for the current puzzle.
 */
async function loadTestInput() {
  await stopSolvingPuzzle();
  taskInput.value = await (await fetch(`${years[currentYearIndex].days[currentDayIndex].path}/testInput.txt`)).text();
  solutionConsole.clear();
  visualizationContainer.innerHTML = "";
}

/**
 * Selects the part of the current puzzle.
 * @param {number} part Puzzle part.
 */
async function setPart(part) {
  await stopSolvingPuzzle();

  part2Selector.style.visibility = currentPuzzle.noPart2 ? "hidden" : "visible";

  if ((part != 1 && part != 2) || currentPuzzle.noPart2)
    part = 1;

  currentPart = part;
  (part == 1 ? part1Selector : part2Selector).classList.add("active");
  (part == 1 ? part2Selector : part1Selector).classList.remove("active");

  solutionConsole.clear();
  visualizationContainer.innerHTML = "";

  window.history.replaceState('', '', `${location.protocol}//${location.host}${location.pathname}?year=${years[currentYearIndex].name}&day=${currentDayIndex + 1}&part=${currentPart}`);
}

/**
 * Toggles the visualization on and off.
 */
async function toggleVisualization() {
  await stopSolvingPuzzle();

  solutionConsole.clear();
  visualizationContainer.innerHTML = "";

  visualization = !visualization;
  if (visualization)
    visualizationSwitch.classList.add("active");
  else
    visualizationSwitch.classList.remove("active");
}

/**
 * Solves the current puzzle.
 */
async function solvePuzzle() {
  if (currentPuzzle.isSolving)
    return;

  solveButton.style.display = "none";
  stopButton.style.display = "inline-block";

  solutionConsole.clear();
  visualizationContainer.innerHTML = "";
  try {
    let answer = await currentPuzzle.solve(currentPart, taskInput.value, visualization);

    if (answer != undefined) {
      solutionConsole.addLine();
      solutionConsole.addLine().innerHTML = `Answer: ${answer}.`;
    }
  }
  catch (error) {
    solutionConsole.addLine();
    let errorLine = solutionConsole.addLine();
    errorLine.classList.add("error");
    errorLine.innerHTML = `${error}.`;
    throw(error);
  }
  finally {
    solveButton.style.display = "";
    stopButton.style.display = "";
  }
}

/**
 * Stops solving the current puzzle.
 */
async function stopSolvingPuzzle() {
  if (currentPuzzle != undefined)
    await currentPuzzle.stopSolving();
}