/****************************************************
 * global variables: DOM Objects
 ***************************************************/
var updateButton = document.getElementById('update-button');
var equationInputField = document.getElementById('inputField');
var canvas = document.getElementById('graph');
var graph = canvas.getContext('2d');

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
 


/****************************************************
 * This function takes the input from the input field
 * and parses it. Then it clears the canvas and runs
 * the drawCurve function
 ****************************************************/

function updateCanvas() {

    var equation = math.parse(equationInputField.value);
    console.log(equationInputField.value);
    console.log(equation);

    //graph.clearRect(0, 0, canvas.width, canvas.height);
    drawCurve(equation);
};


/****************************************************
 * This function draws the function
 ***************************************************/
function drawCurve(equation) {
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

    for(i = 0; i < n; i++) {
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

 /* 
  * wait until DOM is loaded to add event liseners
  */
 window.addEventListener('DOMContentLoaded', function () {

    //click update button to graph new functions
    
    updateButton.addEventListener('click', function (event) {
        updateCanvas();
    });

    sinButton
 });


//sample js for free
(function (window, document) {

    var layout = document.getElementById('layout'),
        menu = document.getElementById('menu'),
        menuLink = document.getElementById('menuLink'),
        content = document.getElementById('main');

    function toggleClass(element, className) {
        var classes = element.className.split(/\s+/),
            length = classes.length,
            i = 0;

        for (; i < length; i++) {
            if (classes[i] === className) {
                classes.splice(i, 1);
                break;
            }
        }
        // The className is not found
        if (length === classes.length) {
            classes.push(className);
        }

        element.className = classes.join(' ');
    }

    function toggleAll(e) {
        var active = 'active';

        e.preventDefault();
        toggleClass(layout, active);
        toggleClass(menu, active);
        toggleClass(menuLink, active);
    }

    menuLink.onclick = function (e) {
        toggleAll(e);
    };

    content.onclick = function (e) {
        if (menu.className.indexOf('active') !== -1) {
            toggleAll(e);
        }
    };

}(this, this.document));