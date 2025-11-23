$(function () {
  var canvas = $("#c");
  var canvasHeight;
  var canvasWidth;
  var ctx;
  var dt = 0.1;
  var hueIncrement = -5;

    var pointCollection;

  function init() {
    canvas.attr({ height: $(window).height(), width: $(window).width() });
    canvasWidth = canvas.width() || $(window).width();
    canvasHeight = canvas.height() || $(window).height();

    pointCollection = new PointCollection();
    pointCollection.points = generatePointsFromText("gayballs");

    initEventListeners();
    timeout();
  }

  function initEventListeners() {
    $(window).bind("resize", updateCanvasDimensions).bind("mousemove", onMove);

    canvas.get(0).ontouchmove = function (e) {
      e.preventDefault();
      onTouchMove(e);
    };

    canvas.get(0).ontouchstart = function (e) {
      e.preventDefault();
    };
  }

  function updateCanvasDimensions() {
    canvas.attr({ height: $(window).height(), width: $(window).width() });
    canvasWidth = canvas.width();
    canvasHeight = canvas.height();

    recenterPoints();
    draw();
  }

  function recenterPoints() {
    if (!pointCollection || pointCollection.points.length === 0) return;

    let offsetX = canvasWidth / 2 - 180;
    let offsetY = canvasHeight / 2 - 65;

    for (let point of pointCollection.points) {
      if (!point.curPosInitialized) continue;

      let relX = point.originalPos.x - point.originalCanvasCenterX;
      let relY = point.originalPos.y - point.originalCanvasCenterY;

      point.originalPos.x = offsetX + relX;
      point.originalPos.y = offsetY + relY;

      point.curPos.x += offsetX - point.originalCanvasCenterX;
      point.curPos.y += offsetY - point.originalCanvasCenterY;

      point.originalCanvasCenterX = offsetX;
      point.originalCanvasCenterY = offsetY;
    }
  }

  function onMove(e) {
    if (pointCollection) pointCollection.mousePos.set(e.pageX, e.pageY);
  }

  function onTouchMove(e) {
    if (pointCollection)
      pointCollection.mousePos.set(
        e.targetTouches[0].pageX,
        e.targetTouches[0].pageY,
      );
  }

  function timeout() {
    draw();
    update();

    setTimeout(function () {
      timeout();
    }, 30);
  }

  function draw() {
    var tmpCanvas = canvas.get(0);

    if (tmpCanvas.getContext == null) {
      return;
    }

    ctx = tmpCanvas.getContext("2d");
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (pointCollection) pointCollection.draw();
  }

  function update() {
    if (pointCollection) pointCollection.update();
  }

  function Vector(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;

    this.addX = function (x) {
      this.x += x;
    };

    this.addY = function (y) {
      this.y += y;
    };

    this.addZ = function (z) {
      this.z += z;
    };

    this.set = function (x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
    };
  }

  function PointCollection() {
    this.mousePos = new Vector(0, 0);
    this.points = new Array();

    this.newPoint = function (x, y, z) {
      var point = new Point(x, y, z);
      this.points.push(point);
      return point;
    };

    this.update = function () {
      var pointsLength = this.points.length;

      for (var i = 0; i < pointsLength; i++) {
        var point = this.points[i];

        if (point == null) continue;

        var dx = this.mousePos.x - point.curPos.x;
        var dy = this.mousePos.y - point.curPos.y;
        var dd = dx * dx + dy * dy;
        var d = Math.sqrt(dd);

        if (d < 150) {
          point.targetPos.x = point.curPos.x - dx;
          point.targetPos.y = point.curPos.y - dy;
        } else {
          point.targetPos.x = point.originalPos.x;
          point.targetPos.y = point.originalPos.y;
        }

        point.update();
      }
    };

    this.draw = function () {
      var pointsLength = this.points.length;
      for (var i = 0; i < pointsLength; i++) {
        var point = this.points[i];

        if (point == null) continue;

        point.draw();
      }
    };
  }

  let globalHue = 0;

  function Point(x, y, z, size) {
    this.curPos = new Vector(x, y, z);
    this.friction = 0.8;
    this.originalPos = new Vector(x, y, z);
    this.radius = size;
    this.size = size;
    this.springStrength = 0.1;
    this.targetPos = new Vector(x, y, z);
    this.velocity = new Vector(0.0, 0.0, 0.0);

    this.update = function () {
      let dx = this.targetPos.x - this.curPos.x;
      let ax = dx * this.springStrength;
      this.velocity.x += ax;
      this.velocity.x *= this.friction;
      this.curPos.x += this.velocity.x;

      let dy = this.targetPos.y - this.curPos.y;
      let ay = dy * this.springStrength;
      this.velocity.y += ay;
      this.velocity.y *= this.friction;
      this.curPos.y += this.velocity.y;

      let dox = this.originalPos.x - this.curPos.x;
      let doy = this.originalPos.y - this.curPos.y;
      let dd = dox * dox + doy * doy;
      let d = Math.sqrt(dd);

      this.targetPos.z = d / 100 + 1;
      let dz = this.targetPos.z - this.curPos.z;
      let az = dz * this.springStrength;
      this.velocity.z += az;
      this.velocity.z *= this.friction;
      this.curPos.z += this.velocity.z;

      this.radius = this.size * this.curPos.z;
      if (this.radius < 1) this.radius = 1;
    };

    this.draw = function () {
      let hue = (globalHue + (this.curPos.x / canvasWidth) * 360) % 360;
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      ctx.beginPath();
      ctx.arc(this.curPos.x, this.curPos.y, this.radius, 0, Math.PI * 2, true);
      ctx.fill();
    };
  }

  function draw() {
    var tmpCanvas = canvas.get(0);
    if (!tmpCanvas.getContext) return;

    ctx = tmpCanvas.getContext("2d");
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (pointCollection) {
      let total = pointCollection.points.length;
      for (let i = 0; i < total; i++) {
        pointCollection.points[i].draw(i, total);
      }
    }

    globalHue += hueIncrement;
    if (globalHue > 360) globalHue -= 360;
    if (globalHue < 0) globalHue += 360;
  }

  function generatePointsFromText(text) {
    let offCanvas = document.createElement("canvas");
    let offCtx = offCanvas.getContext("2d");

    let fontSize = 120;
    offCtx.font = `bold ${fontSize}px Arial`;

    let textWidth = offCtx.measureText(text).width;
    offCanvas.width = Math.ceil(textWidth) + 50;
    offCanvas.height = 200;
    offCtx.font = `bold ${fontSize}px Arial`;
    offCtx.fillStyle = "#ffffff";

    offCtx.fillText(text, 0, fontSize);

    let imageData = offCtx.getImageData(
      0,
      0,
      offCanvas.width,
      offCanvas.height,
    );
    let points = [];

    for (let y = 0; y < imageData.height; y += 2) {
      for (let x = 0; x < imageData.width; x += 2) {
        let i = (y * imageData.width + x) * 4;
        if (imageData.data[i + 3] > 80) {
          points.push(new Point(x, y, 0.0, 3, "#555555"));
        }
      }
    }

    let scale = Math.min(1, (canvasWidth * 0.9) / textWidth);
    let offsetX = canvasWidth / 2 - (textWidth / 2) * scale;
    let offsetY = canvasHeight / 2 - 60;

    for (let i = 0; i < points.length; i++) {
      points[i].curPos.x = points[i].curPos.x * scale + offsetX;
      points[i].curPos.y = points[i].curPos.y * scale + offsetY;
      points[i].originalPos.x = points[i].curPos.x;
      points[i].originalPos.y = points[i].curPos.y;
      points[i].radius *= scale;
      points[i].size *= scale;
      points[i].curPosInitialized = true;
      points[i].originalCanvasCenterX = offsetX;
      points[i].originalCanvasCenterY = offsetY;
    }

    return points;
  }

  function getQueryParam(name) {
    let params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function updatePointsFromText(text) {
    let newPoints = generatePointsFromText(text);
    if (!pointCollection) pointCollection = new PointCollection();
    pointCollection.points = newPoints;
    draw();
  }

  function applyText() {
    let text = $("#wordInput").val().trim();
    if (!text) return alert("Please type a word!");
    let newPoints = generatePointsFromText(text);
    if (!pointCollection) pointCollection = new PointCollection();
    pointCollection.points = newPoints;
    draw();
  }

  function applyHue() {
    let hueValue = parseInt($("#hueInput").val().trim());
    if (isNaN(hueValue)) return alert("Please enter a number!");
    if (hueValue < -1000) hueValue = -1000;
    if (hueValue > 1000) hueValue = 1000;
    hueIncrement = hueValue;
    $("#hueInput").val(hueValue);
  }

  $("#wordInput").on("keyup", function (e) {
    if (e.key === "Enter") {
      applyText();
    }
  });

  $("#hueInput").on("keyup", function (e) {
    if (e.key === "Enter") {
      applyHue();
    }
  });

  init();

  let textFromURL = getQueryParam("t");

  if (textFromURL) {
    textFromURL = textFromURL.replace(/-/g, " ");
    let newPoints = generatePointsFromText(textFromURL);
    if (!pointCollection) pointCollection = new PointCollection();
    pointCollection.points = newPoints;
    draw();
  }

});
