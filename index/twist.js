'use strict';

var gl;
var program;
var points = [];
var numDivisions = 0;
var _gasket = false;

// http://math.stackexchange.com/questions/240169/how-to-find-the-other-vertices-of-an-equilateral-triangle-given-one-vertex-and-c
// equilateral triangle centered about the origin
var originalTriangle = [
  vec2(-(Math.sqrt(3) / 2), -0.5),   // bottom left
  vec2(0, 1),                      // top middle
  vec2((Math.sqrt(3) / 2), -0.5)     // bottom right
];
///////////////////////////////////////////////////////////////////////////////////
var originalTetragon_1 = [
  vec2(-0.7, 0.7),   // top right
  vec2(0.7, 0.7),    // top left
  vec2(-0.7, -0.7)   // bottom left
];
///////////////////////////////////////////////////////////////////////////////////
var originalTetragon_2 = [
  vec2(0.7, 0.7),   // top right
  vec2(0.7, -0.7),  // bottom left
  vec2(-0.7, -0.7)  // bottom right
];
///////////////////////////////////////////////////////////////////////////////////
var resetPoints = function () {
  points = [];
};
///////////////////////////////////////////////////////////////////////////////////
var addTriangle = function (bottomLeft, topMiddle, bottomRight) {
  points.push(bottomLeft, topMiddle, bottomRight);
};
///////////////////////////////////////////////////////////////////////////////////
var calculateMidPoint = function (vec2PointA, vec2PointB) {
  return mix(vec2PointA, vec2PointB, 0.5);
};
///////////////////////////////////////////////////////////////////////////////////
var calculateDistance = function (vec2Point) {
  var xSquared = Math.pow(vec2Point[0], 2);
  var ySquared = Math.pow(vec2Point[1], 2);
  return Math.sqrt(xSquared + ySquared);
};
///////////////////////////////////////////////////////////////////////////////////
var divideTriangle = function (a, b, c, count) {
  var ab,
    ac,
    bc;

  // check for end of recursion
  if (count === 0) {
    addTriangle(a, b, c);
  } else {
    // bisect
    ab = calculateMidPoint(a, b);
    ac = calculateMidPoint(a, c);
    bc = calculateMidPoint(b, c);

    // generate new triangles
    divideTriangle(a, ab, ac, count - 1);
    divideTriangle(c, ac, bc, count - 1);
    divideTriangle(b, bc, ab, count - 1);

    // don't fill in the middle triangle if user wants a gasket
    if (!_gasket) {
      divideTriangle(ac, ab, bc, count - 1);
    }
  }
};
///////////////////////////////////////////////////////////////////////////////////
var render = function () {
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, points.length);
};
///////////////////////////////////////////////////////////////////////////////////
var loadBuffer = function (data) {
  // load data onto gpu
  var bufferId = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STATIC_DRAW);

  // associate shader variables with data buffer
  var vPosition = gl.getAttribLocation(program, 'vPosition');
  gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);
};
///////////////////////////////////////////////////////////////////////////////////
var calculateRotation = function (vec2Point, theta) {
  var distance = calculateDistance(vec2Point);
  var originalX = vec2Point[0];
  var originalY = vec2Point[1];
  var newX = (originalX * Math.cos(distance * theta)) - (originalY * Math.sin(distance * theta));
  var newY = (originalX * Math.sin(distance * theta)) + (originalY * Math.cos(distance * theta));
  return vec2(newX, newY);
};
///////////////////////////////////////////////////////////////////////////////////
var doRotate = function (theta) {
  var radians = (Math.PI / 180) * theta;

  var rotatedPoints = points.map(function (vertex) {
    return calculateRotation(vertex, radians);
  });

  loadBuffer(rotatedPoints);
  render();
};
///////////////////////////////////////////////////////////////////////////////////
var doDivide = function (numDivisions, numOfSide) {
  resetPoints();
  if(numOfSide == 3){
    divideTriangle(originalTriangle[0], originalTriangle[1], originalTriangle[2], numDivisions);
    loadBuffer(points);
    render();
  }else{
    divideTriangle(originalTetragon_1[0], originalTetragon_1[1], originalTetragon_1[2], numDivisions);
    divideTriangle(originalTetragon_2[0], originalTetragon_2[1], originalTetragon_2[2], numDivisions);
    loadBuffer(points);
    render();
  }

};
///////////////////////////////////////////////////////////////////////////////////
var updateTriangle = function (evt) {
  evt.preventDefault();
  if (evt && evt.target) {
    if (document.getElementById('polygonShape').value === "3") {
      if (evt.target.id === 'angleSlider') {
        doRotate(document.getElementById('angleSlider').valueAsNumber, 3);
      }
      if (evt.target.id === 'numDivisions') {
        doDivide(document.getElementById('numDivisions').valueAsNumber, 3);
        doRotate(document.getElementById('angleSlider').valueAsNumber);
      }
      if (evt.target.id === 'radioBtnY' || evt.target.id === 'radioBtnN') {
        if (document.getElementById('radioBtnY').checked) {
          _gasket = true;
        } else {
          _gasket = false;
        }
        doDivide(document.getElementById('subdivisionsSlider').valueAsNumber, 3);
        doRotate(document.getElementById('angleSlider').valueAsNumber);
      }
    }else {
      if (evt.target.id === 'angleSlider') {
        doRotate(document.getElementById('angleSlider').valueAsNumber);
      }
      if (evt.target.id === 'numDivisions') {
        doDivide(document.getElementById('numDivisions').valueAsNumber, 4);
        doRotate(document.getElementById('angleSlider').valueAsNumber);
      }
      if (evt.target.id === 'radioBtnY' || evt.target.id === 'radioBtnN') {
        if (document.getElementById('radioBtnY').checked) {
          _gasket = true;
        } else {
          _gasket = false;
        }
        doDivide(document.getElementById('subdivisionsSlider').valueAsNumber, 4);
        doRotate(document.getElementById('angleSlider').valueAsNumber);
      }
    }
  } 
};
///////////////////////////////////////////////////////////////////////////////////
var doReset = function (evt) {
  evt.preventDefault();
  resetPoints();
  _gasket = false;
  divideTriangle(originalTriangle[0], originalTriangle[1], originalTriangle[2], numDivisions);
  loadBuffer(points);
  render();
  document.getElementById('angleSlider').value = 0;
  document.getElementById('nsubdivisionsSlider').value = 0;
  document.getElementById('radioBtnN').checked = false;
};
///////////////////////////////////////////////////////////////////////////////////
window.onload = function init() {

  // register event handlers
  document.getElementById('settings').addEventListener('change', updateTriangle);
  document.getElementById('reset').addEventListener('click', doReset);

  // init
  var canvas = document.getElementById('gl-canvas');
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) { alert('WebGL isn\'t available'); }

  // configure display
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.5019, 0.5019, 0.5019, 1.0);

  // load shaders
  program = initShaders(gl, 'vertex-shader', 'fragment-shader');
  gl.useProgram(program);

  // Generate tasselated triangle data (modifies global points array)
  if (document.getElementById("polygonShape").valueAsNumber = 3) {
    divideTriangle(originalTriangle[0], originalTriangle[1], originalTriangle[2], numDivisions);
  } else {
    divideTriangle(originalTetragon_1[0], originalTetragon_1[1], originalTetragon_1[2], numDivisions);
    divideTriangle(originalTetragon_2[0], originalTetragon_2[1], originalTetragon_2[2], numDivisions);
  }


  // load the data into the GPU
  var bufferId = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

  // associate shader variables with data buffer
  var vPosition = gl.getAttribLocation(program, 'vPosition');
  gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  render();
};
