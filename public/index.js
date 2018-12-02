//trying to load images

/****************************************************
 * global variables: DOM Objects
 ***************************************************/
var updateButton = document.getElementById('update-button');
var equationInputField = document.getElementById('inputField');
var clearButton = document.getElementById('clear-button');
var graph = document.getElementById('graph');
var context = canvas.getContext('2d');
var i; //iterator used throughout calculations, reset at the beginning of each for-loop

/****************************************************
 * common function buttons:
 * these functions add common functions and their 
 * correct syntaxes
 ***************************************************/

var sinButton = document.getElementById('sin-button');
sinButton.addEventListener('click', function (event) {
    if (equationInputField.value === "") {
        equationInputField.value = 'sin(x)';
    } else {
        equationInputField.value = equationInputField.value + " sin(x)";
    }
});


/***************************************************
 * Javascrip Calculator Functions
 ***************************************************/

 function JSgCalc (element) {
    this.graph = graph;
    this.ctx = graph.getContext('2d');
    this.width = document.getElementById('graph-wrapper').width;
    this.height = document.getElementById('graph-wrapper').height;
    this.maxGridLines = {x: 13, y: 13};
    this.charHeight = 8;
    this.startDrag = {x: 0, y: 0};
    this.prevDrag = {x: 0, y: 0};
    this.startCoordinate = {x1: 0, y1: 0, x2: 0, y2: 0};
    this.currentCoordinate = {x1 : -5, y1: -5, x2: 5, y2: 5};
    this.mouseButton = 0;
    this.canvasX = this.graph.offsetLeft;
    this.canvasY = this.graph.offsetTop;
    this.calcCache = new Object;
    this.quality = 1;
    this.zoomFactor = 0.1;
    this.lines = [];
    this.fillareapath;

    


    /***************************************************
    * helper math functions
    ***************************************************/
    this.arbFloor = function (value, roundTo) {
        return Math.floor(value/roundTo) * roundTo;
    }

    this.arbRound = function(value, roundTo) {
        return Math.round(value/roundTo) * roundTo;
    }

    /***************************************************
    * clears canvas
    ***************************************************/
    this.clearScreen = function () {
        this.ctx.fillStyle = "rgb(255, 255, 255)";
        this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    /***************************************************
     * sets background grid
    ***************************************************/
    this.drawGrid = function () {
        this.clearScreen();

        var x1 = this.currentCoordinate.x1;
        var x2 = this.currentCoordinate.x2;
        var y1 = this.currentCoordinate.y1;
        var y2 = this.currentCoordinate.y2;

        var xRange = x2 - x1;
        var yRange = y2 - y1;

        //calculate numeric value of each pixel
        var xscale = Math.max(xRange/this.width, 1E-20);
        var yscale = Math.max(yRange/this.height, 1E-20);

        //calculate the scale of gridlines (scale of graph)
        for(i = 0.0000000000001, c = 0; xRange/i > this.maxGridLines.x - 1; c++) {
            if(c % 3 === 1) {
                i *= 2.5; //alternationg between 2, 5, and 10
            } else {
                i *= 2;
            }
            //prevent infinite loop
            if (c > 10000) {
                break;
            }
        }

        this.xgridscale = i;

        //same as above but for y
        for (i = 0.0000000000001, c = 0; yRange / i > this.maxGridLines.y - 1; c++) {
            if (c % 3 === 1) {
                i *= 2.5; //alternationg between 2, 5, and 10
            } else {
                i *= 2;
            }
            //prevent infinite loop
            if (c > 10000) {
                break;
            }
        }
        
        this.ygridscale = 1;

        this.ctx.font = "10pt 'open sans'"; //set font
        this.ctx.textAlign = "center";

        var xaxis = yaxis = null;

        //currX is the current gridline being drawn as a numerical value
        var currX = this.arbFloor(x1, this.xgridscale); //set it to lowest x value on screen
        var currY = this.arbFloor(y1, this.ygridscale);

        var xMainAxis = this.charHeight * 1.5; //axis text will be displayed on
        var yMainAxis = -1;

        //fix floating point values
        currX = float_fix(currX);
        currY = float_fix(currY);

        //y=0 appears on the screen, move text to follow
        if(y2 >= 0 && y1 <= 0) {
            xMainAxis = this.height - ((0-y1)/yRange) * this.height + (this.charHeight * 1.5);
        } else if (y1 > 0) {
            xMainAxis = this.height - 5;
        }

        //the x-axis labesl have to be a certain distance from the bottom of the screen for visibilit 
        if(xMainAxis > this.height - (this.charHeight / 2)) {
            xMainAxis = this.height - 5;
        }

        //do the same as above with y-axis
        if(x2 >= 0 && x1 <= 0) {
            yMainAxis = ((0-x1)/xRange) * this.width - 2;
        } else if(x2 < 0) {
            yMainAxis = this.width - 6;
        }

        if(yMainAxis < (this.ctx.measureText(currY).width + 1)) {
            yMainAxis = -1;
        }

        var significantDigits = String(currX).length + 3;

        //draw vertical lines
        for(i = 0; i < this.maxGridLines.x; i++) {
            var xpos = ((currX-x1)/xRange) * this.width //position of line in pixels
            //make sure it is on the screen
            if(xpos - 0.5 > this.width + 1 || xpos < 0) {
                currX += this.xgridscale;
                continue;
            }

            //just in case
            currX = float_fix(currX);

            if(currX === 0) {
                xaxis = xpos;
            }

            this.ctx.fillStyle = "rgb(0,0,0)"; //black lines

            //draw label
            if(currX != 0) {
                var xTextWidth = this.ctx.measureText(currX).width;

                //cannot overflow the screen
                if(xpos + xTextWidth * 0.5 > this.width) {
                    xpos = this.width - xTextWidth * 0.5 + 1;
                } else {
                    if(xpos - xTextWidth * 0.5 < 0) {
                        xpos = xTextWidth * 0.5 + 1;
                    }
                    this.ctx.fillText(currX, xpos, xMainAxis);
                }
            }

            currX += this.xgridscale;

        }//end of vertical lines
        this.ctx.textAlign = "right";
        significantDigits = String(currY).length + 3;

        //draw horizontal lines
        for (i = 0; i < this.maxGridLines.y; i++) {
            var ypos = ((curry - y1) / yRange) * this.height //position of line in pixels
            //make sure it is on the screen
            if (ypos - 0.5 > this.height + 1 || ypos < 0) {
                currY += this.ygridscale;
                continue;
            }

            //just in case
            currY = float_fix(currY);

            if (currY === 0) {
                yaxis = ypos;
            }

            this.ctx.fillStyle = "rgb(0,0,0)"; //black lines

            //draw label
            if (currX != 0) {
                var yTextWidth = this.ctx.measureText(currY).width;

                //cannot overflow the screen
                if (ypos + (this.charHeight / 2) > this.height) {
                    ypos = this.height - (this.charHeight / 2) - 1;
                }
                if (ypos - 4 < 0) {
                    ypos = 4;
                }
                var xAxisPosition = yMainAxis;
                if(yMainAxis == -1) {
                    xAxisPosition = yTextWidth + 1;
                }
                this.ctx.fillText(currY, xAxisPosition, ypos + 3);
            }

            curry += this.ygridscale;

        }//end of horizontal lines

        //draw the axis
        if(xaxis) {
            this.ctx.fillRect(xaxis - 0.5, 0, 1, this.height);
        }
        if(yaxis) {
            this.ctx.fillRect(0, yaxis - 0.5, this.width, 1);
        }
     };

    /****************************************************
    * This function takes the input from the input field
    * and parses it. Then it clears the canvas and runs
    * the drawCurve function
    ****************************************************/

    this.updateCanvas = function () {

        var equation = math.parse(equationInputField.value);
        console.log(equationInputField.value);
        console.log(equation);

        //graph.clearRect(0, 0, canvas.width, canvas.height);
        this.drawCurve(equation);
    };

    /****************************************************
    * This function draws the function
    ***************************************************/
    this.drawCurve = function (equation) {
        if(!equation)
            return false;

        var i, n = 100; //iterator and max iterations
        var xPixel, yPixel; //ith value between xMin/xMax and yMin/yMax respectively
        var xMax = 10, yMax = 10;
        var xMin = -10, yMin = -10;
        var mathX, mathY; //values in math coordinates
        var percentX, percentY; //these values vary between 0 and 1
        var expression = equation.compile();

        //defines variables inside the math expression
        var scope = {
            x: 0,
            y: 0,
            t: 0
        };

        //t variable in function
        var time = 0;
        var timeIncrement = 0.1;

        graph.beginPath();

        for (i = 0; i < n; i++) {
            percentX = i / (n - 1);

            mathX = percentX * (xMax - xMin) + xMin;

            //evaluate expression
            scope.x = mathX;
            scope.t = time;
            time += timeIncrement;
            mathY = expression.eval(scope);

            //project mathY into percentY
            percentY = (mathY - yMin) / (yMax - yMin);

            //flip Y to match canvas coordinates
            percentY = 1 - percentY;

            //project percents to pixels
            xPixel = percentX * canvas.width;
            yPixel = percentY * canvas.width;

            graph.lineTo(xPixel, yPixel);
        }

        //draws the line plotted in the above for-loop
        graph.stroke();
    }
 };

 /* 
  * wait until DOM is loaded to add event liseners
  */
 window.addEventListener('DOMContentLoaded', function () {

    //click update button to graph new functions
    jsCalc = new JSgCalc("graph");
    jsCalc.drawGrid();
    
    updateButton.addEventListener('click', function (event) {
        JSgCalc.updateCanvas();
    });

    clearButton.addEventListener('click', function (event) {
        JSgCalc.clearScreen();
    });
 });
