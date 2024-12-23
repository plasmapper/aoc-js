import { Range } from "./range.mjs"

/**
 * Chart visualization class.
 */
export class Chart {
  constructor() {
    const screenWidth = 467;
    const screenHeight = 300;

    /**
     * HTML canvas.
     * @type {HTMLCanvasElement}
     */
    this.container;
    /**
     * Chart JS chart.
     * @type {Chart}
     */
    this.chartJS;
    /**
     * Chart type.
     * @type {string}
     */
    this.type = "scatter";
    /**
     * Point radius
     * @type {number}
     */
    this.pointRadius = 2;
    /**
     * Chart axes.
     * @type {Object}
     */
    this.axes = {x: new ChartAxis(), y: new ChartAxis()};
    /**
     * Chart datasets.
     * @type {ChartDataSet[]}
     */
    this.datasets = [];

    if (typeof document !== "undefined") {
      this.container = document.createElement("canvas");
      this.container.width = screenWidth;
      this.container.height = screenHeight;
    }
  }

  initialize() {
    let scales = {};
    Object.keys(this.axes).forEach(key => {
      scales[key] = {
        display: true,
        min: this.axes[key].autoscale ? undefined : this.axes[key].range.from,
        max: this.axes[key].autoscale ? undefined : this.axes[key].range.to,
        border: {
          color: this.axes[key].color
        },
        title: {
          display: true,
          color: this.axes[key].color,
          text: this.axes[key].label
        },
        ticks: {
          color: this.axes[key].color
        }
      }
    });

    this.chartJS = new ChartJs(this.container, {
      type: this.type,
      options: {
        responsive: false,
        maintainAspectRatio: false,
        animation: {duration: 0},
        plugins: {
          legend: {
            display: false
          },
        },
        elements: {
          point:{
              radius: this.pointRadius
          }
        },
        scales: scales          
      },
      data: {
        datasets: this.datasets.map(dataset => {
          return {
            label: dataset.label,
            data: dataset.points,
            showLine: dataset.showLine,
            borderColor: dataset.pointStrokeColor,
            pointBackgroundColor: dataset.pointFillColor
          };
        })
      }
    });
  }

  /**
   * Updates the chart.
   */
  update() {
    Object.keys(this.axes).forEach(key => {
      this.chartJS.options.scales[key].min = this.axes[key].autoscale ? undefined : this.axes[key].range.from;
      this.chartJS.options.scales[key].max = this.axes[key].autoscale ? undefined : this.axes[key].range.to;
    });
    
    this.chartJS.update();
  }
}

/**
 * Chart dataset class
 */
export class ChartDataSet {
  /**
   * @param {string} color Dataset color.
   */
  constructor() {
    /**
     * Dataset label.
     * @type {string}
     */
    this.label = "";
    /**
     * Data points.
     * @type {Vector2D[]}
     */
    this.points = [];
    /**
     * Dataset point stroke color.
     * @type {string}
     */
    this.pointStrokeColor = "#00aa00";
    /**
     * Dataset point fill color.
     * @type {string}
     */
    this.pointFillColor = "#00aa00";
    /**
     * Show dataset line.
     * @type {boolean}
     */
    this.showLine = false;
  }
}

/**
 * Chart axis class.
 */
export class ChartAxis {
  constructor() {
    /**
     * Axis label.
     * @type {string}
     */
    this.label = "";
    /**
     * Axis color.
     * @type {string}
     */
    this.color = "#ffffff"
    /**
     * Axis range.
     * @type {Range}
     */
    this.range = new Range(0, 1);
    /**
     * Axis scale is calculated based on data.
     * @type {boolean}
     */
    this.autoscale = true;
  }
}