/***************************************************
 * Javascript Calculator Functions
 ***************************************************/

 function JSgCalc (element) {
    this.graph = document.getElementById('graph');
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
    this.calcCache = []; //to be used with MongoDB to make processes easier
    this.quality = 1.0;
    this.zoomFactor = 0.1;
    this.lines = [];
    this.lineColors = {
         "#FF0000": -1, "#0000FF": -1, "#00FF00": -1, "#FF00FF": -1, "#00FFFF": -1,
         "#000000": -1, "#990000": -1, "#000099": -1, "#009900": -1, "#999900": -1, "#990099": -1, "#009999": -1
     };
    this.fillareapath;

    


    /***************************************************
    * smaller helper functions
    ***************************************************/
    this.arbFloor = function (value, roundTo) {
        return Math.floor(value/roundTo) * roundTo;
    };

    this.arbRound = function(value, roundTo) {
        return Math.round(value/roundTo) * roundTo;
    };

    this.copyCoordinate = function (currentCoordinate) {
        return {x1: currentCoordinate.x1, y1: currentCoordinate.y1, x2: currentCoordinate.x2, y2: currentCoordinate.y2};
    };

    this.getScale = function () {
        return {x: this.width / Math.abs(this.startCoordinate.x2 - this.startCoordinate.x1),
                y: this.height / Math.abs(this.startCoordinate.y2 - this.startCoordinate.y1)};
    };

    this.float_fix = function (num) {
        return Math.round(num * 10000000) / 10000000;
    };

    this.getRange = function () {
        return {x: Math.abs(this.startCoordinate.x2 - this.startCoordinate.x1),
                y: Math.abs(this.startCoordinate.y2 - this.startCoordinate.y1)};
    };

    /***************************************************
    * equation handling functions
    ***************************************************/

    this.variablesInExpression = function (expr) {
        //i don't know enough about how math parses equations, so I am going to trust this
        var obj = {};
        expr.traverse(function (node) {
            if ((node.type === 'SymbolNode') && (math[node.name] === undefined)) {
                obj[node.name] = true;
            }
        });
        return Object.keys(obj).sort();
    };

    this.makeFunction = function (equation) {
        var expr = math.parse(equation);
        var code = expr.compile(math);
        var variables = this.variablesInExpression(expr);

        return function(x) {
            var scope = {};

            variables.forEach(function (name) {
                scope[name] = x;
            });

            return code.eval(scope);
        }
    };

    /***************************************************
    * mouse functions
    ***************************************************
    this.checkMove = function (x, y) {
        //if no change in mouse position
        if(x === this.prevDrag.x && y === this.prevDrag.y) {
            return;
        }

        var scale = this.getScale();
        if(this.mouseButton === 1) {
            if(0) {
                //zoom
            } else { //click and drag
                this.currentCoordinate.x1 = this.startCoordinate.x1 - ((x - this.startDrag.x) / scale.x);
                this.currentCoordinate.x2 = this.startCoordinate.x2 - ((x - this.startDrag.x) / scale.x);
                this.currentCoordinate.y1 = this.startCoordinate.y1 - ((y - this.startDrag.y) / scale.y);
                this.currentCoordinate.x1 = this.startCoordinate.y2 - ((x - this.startDrag.y) / scale.y);
                this.draw();
            }
            this.prevDrag = {x : x, y: y};
        }
    };

    this.mouseDown = function(event) {
        document.body.style.cursor = "hand";
        if(this.mouseButton == 0) {
            //if(zoom)
            this.startDrag.x = event.pageX - this.canvasX;
            this.startDrag.y = event.pageY - this.canvasY;
            this.startCoordinate = this.copyCoordinate(this.currentCoordinate);
        }
        this.mouseButton = 1;
    };

    this.mouseUp = function(event) {
        //if(zoom)
        this.mouseButton = 0;
        this.startCoordinate = this.copyCoordinate(this.currentCoordinate);
    };

    this.mouseWheel = function(event, deltaX, deltaY) {
        if(deltaX > 0) {
            this.zoom(this.zoomFactor, event);
        } else {
            this.zoom(-this.zoomFactor, event);
        }
    };

    this.zoom = function (scale, event) {
        var range = this.getRange();
        if(event) {
            var mousex = event.pageX - this.canvasX;
            var mousey = event.pageY - this.canvasY;
            var mousetop = 1 - (mousey / this.height);
            var mouseleft = mousex / this.width;
            this.currentCoordinate.x1 += range.x * scale * mouseleft;
            this.currentCoordinate.y1 += range.y * scale * mousetop;
            this.currentCoordinate.x2 -= range.x * scale * (1 - mouseleft);
            this.currentCoordinate.y2 -= range.y * scale * (1 - mousetop);
        } else {
            this.currentCoordinate.x1 += range.x * scale;
            this.currentCoordinate.y1 += range.y * scale;
            this.currentCoordinate.x2 -= range.x * scale;
            this.currentCoordinate.y2 -= range.y * scale;
        }
        this.startCoordinate = this.copyCoordinate(this.currentCoordinate);
        this.draw();
    }
    
    /***************************************************
    * clears canvas
    ***************************************************/
    this.clearScreen = function () {
        this.lines = [];
        this.ctx.fillStyle = "rgb(255,255,255)";
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.draw();
    };

    /***************************************************
     * sets background grid
    ***************************************************/
    this.drawGrid = function () {
        this.ctx.fillStyle = "rgb(255,255,255)";
        this.ctx.fillRect(0, 0, this.width, this.height);

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
        for (i = 0.000000000001, c = 0; xRange/i > this.maxGridLines.x - 1; c++) {
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
        for (i = 0.000000000001, c = 0; yRange / i > this.maxGridLines.y - 1; c++) {
            if (c % 3 == 1) {
                i *= 2.5; //alternationg between 2, 5, and 10
            } else {
                i *= 2;
            }
            //prevent infinite loop
            if (c > 10000) {
                break;
            }
        }
        
        this.ygridscale = i;

        this.ctx.font = "10pt 'open sans'"; //set font
        this.ctx.textAlign = "center";

        var xaxis = yaxis = null;

        //currX is the current gridline being drawn as a numerical value
        var currX = this.arbFloor(x1, this.xgridscale); //set it to lowest x value on screen
        var currY = this.arbFloor(y1, this.ygridscale);

        var xMainAxis = this.charHeight * 1.5; //axis text will be displayed on
        var yMainAxis = -1;

        //fix floating point values
        currX = this.float_fix(currX);
        currY = this.float_fix(currY);

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

        //draw vertical lines
        for(var i = 0; i < this.maxGridLines.x; i++) {
            var xpos = ((currX-x1)/xRange) * this.width //position of line in pixels
            //make sure it is on the screen
            if(xpos - 0.5 > this.width + 1 || xpos < 0) {
                currX += this.xgridscale;
                continue;
            }

            //just in case
            currX = this.float_fix(currX);

            if(currX === 0) {
                xaxis = xpos;
            }

            this.ctx.fillStyle = "rgb(190,190,190)";//grey lines
            this.ctx.fillRect(xpos - 0.5, 0, 1, this.height);

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

        //draw horizontal lines
        for (var i = 0; i < this.maxGridLines.y; i++) {
            var ypos = this.height - ((currY - y1) / yRange) * this.height; //position of line in pixels
            //make sure it is on the screen
            if (ypos - 0.5 > this.height + 1 || ypos < 0) {
                currY += this.ygridscale;
                continue;
            }

            //just in case
            currY = this.float_fix(currY);

            if (currY == 0) {
                yaxis = ypos;
            }

            this.ctx.fillStyle = "rgb(190,190,190)";//draw grey lines
            this.ctx.fillRect(0, ypos-0.5, this.width, 1);

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

            currY += this.ygridscale;

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
    * draw is called every time the canvas margins / 
    * functions change
    ****************************************************/
    this.draw = function () {
        this.drawGrid();
        for(var i = 0; i < this.lines.length; i++) {
            var equation = this.lines[i].equation;
            var color = this.lines[i].color;
            this.drawCurve(equation, color, 5);
        }
    };

    /****************************************************
    * This function resizes the graph
    ***************************************************/
    this.resizeGraph = function () {
        var oldHeight = this.height;
        var oldWidth = this.width;
        var graphWrapper = document.getElementById("graph-wrapper");
        var sidebarWrapper = document.getElementById("sidebar-wrapper");
        var header = document.getElementById("header-wrapper");
        graphWrapper.width = (graphWrapper.offsetWidth - sidebarWrapper.offsetWidth);
        graphWrapper.height = (window.innerHeight - header.offsetHeight);

        
        graph.width = graphWrapper.width;
        graph.height = graphWrapper.height;
        this.ctx.height = graphWrapper.height;
        this.ctx.width = graphWrapper.width;
        this.graph.height = graphWrapper.height;
        this.graph.width = graphWrapper.width;
        this.height = graphWrapper.height;
        this.width = graphWrapper.width;
        console.log("Resized to " + graphWrapper.width + "x" + graphWrapper.height);

        //compute new boundaries of graph
        this.currentCoordinate.x1 *= (graphWrapper.width / oldWidth);
        this.currentCoordinate.x2 *= (graphWrapper.width / oldWidth);
        this.currentCoordinate.y1 *= (graphWrapper.height / oldHeight);
        this.currentCoordinate.y2 *= (graphWrapper.height / oldHeight);
        this.startCoordinate = this.copyCoordinate(this.currentCoordinate);

        //compute grid lines to draw
        this.maxGridLines.x = 0.015 * graphWrapper.width;
        this.maxGridLines.y = 0.015 * graphWrapper.height;
        this.draw();
    }

    /****************************************************
    * This function pulls equations from the mongo-storage
    *  element into the calcCache 
    ***************************************************/
    this.loadDBToCache = function() {
        var mongoStorage = document.getElementById("mongo-storage").childNodes;
        var self = this;
        console.log(mongoStorage);
        for(var i = 0; i < mongoStorage.length; i++) {
            console.log(element);
            if (self.calcCache.indexOf(element) == -1)
                self.calcCache.push(element);
        }
        console.log(this.calcCache);
    }

    /****************************************************
    * This function pushes equations from calcCache into
    * MongoDB
    ***************************************************/

    this.pushToDB = function (equation) {
        var postRequest = new XMLHttpRequest();
        var requestURL = '/push-equation';
        postRequest.open('POST', requestURL);
        
        var requestBody = JSON.stringify({ 
            func: equation
        });

        postRequest.addEventListener('load', function (event) {
            if(event.target.status === 200) {
                var storedFunctionHTML = Handlebars.templates.storedFunction({
                    func: equation
                });
                var storedFunctionContainer = document.getElementById("mongo-storage");
                storedFunctionContainer.insertAdjacentHTML('beforeend', storedFunctionHTML);
                this.calcCache.push(equation);
            } else {
                alert("Error storing function: " + event.target.response);
            }
        });

        postRequest.setRequestHeader('Content-Type', 'application/json');
        postRequest.send(requestBody);
    }

    /****************************************************
    * This function draws the equation
    ***************************************************/
    this.drawCurve = function (equation, color, thickness) {
        if(!equation)
            return false;

        var x1 = this.currentCoordinate.x1;
        var x2 = this.currentCoordinate.x2;
        var y1 = this.currentCoordinate.y1;
        var y2 = this.currentCoordinate.y2;

        var xRange = x2 - x1;
        var yRange = y2 - y1;

        var scale = this.getScale();

        if(!this.calcCache[equation]) {
            this.calcCache[equation] = {equation};
            this.pushToDB(equation);
        }

        this.ctx.strokeStyle = color;
        var old_linewidth = this.ctx.linewidth;
        if(thickness) {
            this.ctx.linewidth = thickness;
        }
        this.ctx.beginPath();

        //keep track of how many times we've gone off screen
        var lineExists = 2;
        var lastPoint = 0;

        this.fillareapath = [];
        this.fillareapath.push([0, this.height - ((-y1) * scale.y)]);

        var inverseQuality = 1.0 / this.quality;
        var inverseScaleX = 1.0 / scale.x;

        var maxXVal = this.width + inverseQuality;
        var minXVal = x1;

        var graphedFunction = this.makeFunction(equation);

        /*//this method starts from 0 then goes up with respect to x,
        //when it hits maxXVal, it starts at 0 and goes down with respct to x to minXVal
        console.log(this.height);

        for(var i = this.width / 2; i < maxXVal; i += inverseQuality) {
            var xVal = i * inverseScaleX;
            var yVal = graphedFunction(xVal);
            
            var ypos = this.height - ((yVal - y1) * scale.y);
            
            console.log(i, xVal, yVal, ypos);


            //the line is on the canvas
            if(ypos >= (this.height * -1) && ypos <= (this.height * 2)) {
                if(lineExists > 1) {
                    this.ctx.beginPath();
                    console.log("begin");
                }

                if(lastPoint !== false && ((lastPoint > 0 && yVal < 0) || (lastPoint < 0 && yVal > 0))) {
                    this.ctx.moveTo(i, ypos);
                } else {
                    this.ctx.lineTo(i, ypos);
                }

                lineExists = 0;
                lastPoint = false;
            } else if(lineExists <= 1) { //line is off the screen
                this.ctx.lineTo(i, ypos);
                lastPoint = yVal;
                this.ctx.stroke(); //end of line
                lineExists++;
            }
        }
    }*/


        //this method starts at the far end of the x-axis

        for(var i = 0; i < maxXVal; i += inverseQuality) {
                var xVal = i * inverseScaleX + x1; //calculate x for a given pixel
                var yVal = graphedFunction(xVal);

                var ypos = this.height - ((yVal - y1) * scale.y);
            //the line is on the screen
            if(ypos >= (this.height * -1) && ypos <= this.height * 2) {
                if(lineExists > 1) {
                    this.ctx.beginPath();
                }

                if(lastPoint !== false && ((lastPoint > 0 && yVal < 0) || (lastPoint < 0 && yVal > 0))) {
                    this.ctx.moveTo(i, ypos);
                } else {
                    this.ctx.lineTo(i, ypos);
                }

                lineExists = 0;
                lastPoint = false;
            } else if(lineExists <= 1) {//the line is off the screen
                this.ctx.lineTo(i, ypos);
                lastPoint = yVal;
                this.ctx.stroke(); //end the line
                lineExists++;
            }
        }
        this.fillareapath.push([maxXVal, this.height - ((-y1) * scale.y)]);
        this.ctx.stroke();
        this.ctx.linewidth = old_linewidth;
        console.log(equation + " drawn");
    };

    /****************************************************
    * This adds a new input field to the sidebar
    ***************************************************/
    this.insertNewInput = function () {
        //decide on color
        //the function is called after the new
        var newColor = -1;
        for (var color in this.lineColors) {
            if (this.lineColors[color] == -1) {
                newColor = color;
                break;
            }
        }

        if (newColor == -1) {
            alert("There are no available colors left for the new input field");
        } else {
            var newInputHTML = Handlebars.templates.inputField({
                color: newColor,
                lineNumber: this.lines.length
            }); 
            var inputContainer = document.getElementById('sidebar');
            inputContainer.insertAdjacentHTML('beforeend', newInputHTML);
        }
    }

    /****************************************************
    * This adds a new line to the lines array to be 
    * graphed
    ***************************************************/
    this.newLine = function() {
        var equationInputFields = document.getElementsByClassName('input-field');
        var currentLineNumber = this.lines.length;
        
        if(equationInputFields[currentLineNumber].value == "") {
            return;
        }

        //decide on color
        var newColor = -1;
        for(var color in this.lineColors) {
            if(this.lineColors[color] == -1){
                newColor = color;
                break;
            }
        }

        if(newColor == -1) {
            alert("There are no available colors left for the new function");
        } else {
            this.lineColors[newColor] = currentLineNumber;
            var newLine = {
                equation: equationInputFields[currentLineNumber].value,
                color: newColor
            };

            this.lines.push(newLine);
            this.insertNewInput();
            this.draw();
        }        
    };

    /****************************************************
    * This function removes inputs, and if the input has
    * a graphed line, removes it as well. keeps order of
    * used colors as well
    ***************************************************/

    this.removeInput = function() {
        var inputWrappers = document.getElementsByClassName('input-wrapper');
        var inputField = document.getElementsByClassName('input-field');
        var fieldColor = inputField[inputWrappers.length - 1].getAttribute('data-color');
        var currentLineNumber = this.lines.length - 1;

        //default input field
        if(inputWrappers.length == 1) {
            inputField[currentLineNumber].value = "";
            this.lineColors[fieldColor] = -1;
            this.lines.splice(0, 1);
            this.draw();
            return;
        }

        //additional input fields
        if(inputWrappers.length > 1) {
            if (inputField[inputWrappers.length - 1].value != "" && this.lines.length == inputWrappers.length) {
                this.lines.splice(currentLineNumber, 1);
            } 
            this.lineColors[fieldColor] = -1;
            inputWrappers[inputWrappers.length - 1].remove();
            this.draw();
        }
    };

    /****************************************************
    * This function initializes the canvas
    ***************************************************/
    this.initCanvas = function () {
        if(this.graph.getContext) {
            this.ctx = graph.getContext('2d');
            this.resizeGraph();
            
            this.currentCoordinate = {x1: -5 * (this.width / this.height), y1: -5, x2: 5 * (this.width / this.height), y2: 5};
            this.startCoordinate = this.copyCoordinate(this.currentCoordinate);
            
            this.draw();

            var self = this;
            graph.addEventListener('mousemove', function(event) {
                self.canvasX = self.graph.offsetLeft;
                self.canvasY = self.graph.offsetTop;
                self.checkMove(event.pageX - self.canvasX, event.pageY - self.canvasY);
            });
            graph.addEventListener('mousedown', function(event) {
                self.mouseDown(event);
            });
            graph.addEventListener('wheel', function(event, delta) {
                self.mouseWheel(event, delta); 
                return false;
            });
            graph.addEventListener('mouseup', function(event) {
                self.mouseUp(event);
            });

            window.onresize = function () {
                self.resizeGraph();
            };
        }
        else {
            alert("Sorry, your browser is not supported");
        }
    }
 };

 /* 
  * wait until DOM is loaded to add event liseners
  */
 window.addEventListener('DOMContentLoaded', function () {

    var newFunctionButton = document.getElementById('new-function-button');
    var removeInputButton = document.getElementById('remove-function-button');
    var clearButton = document.getElementById('clear-button');
    var context = graph.getContext('2d');

    //click update button to graph new functions
    jsCalc = new JSgCalc("graph");
    jsCalc.initCanvas();
    jsCalc.loadDBToCache();
    
    newFunctionButton.addEventListener('click', function (event) {
        jsCalc.newLine();
    });

    removeInputButton.addEventListener('click', function (event) {
        jsCalc.removeInput();
    });
 });
