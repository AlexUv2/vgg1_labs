'use strict';

let gl;                         // The webgl context.
let surface, line;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let pointTr = [0.1, 0.1];

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iVertexNormalBuffer = gl.createBuffer();
    this.iTexCoordBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function(vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.count = vertices.length/3;
    }

    this.NormalBufferData = function (normals) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STREAM_DRAW);
    }
    this.TexCoordBufferData = function (textures){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTexCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textures), gl.STREAM_DRAW);
    }
    this.NormalBufferData = function (normals){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STREAM_DRAW);
    }

    this.Draw = function() {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertexNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertexNormal);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTexCoordBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTexCoord);
        gl.drawArrays(gl.TRIANGLES, 0, this.count);
    }

}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    // Location of the uniform specifying a color for the primitive.
    this.iColor = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;

    this.Use = function() {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    // let projection = m4.perspective(Math.PI/8, 1, 8, 12);
    let projection = m4.orthographic(-3, 3, -3, 3, -3, 3);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707,0.707,0], 0.7);
    let translateToPointZero = m4.translation(0,0,0);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView );
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0 );

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1 );

    let normalMatrix = m4.identity();
    m4.inverse(modelView, normalMatrix);
    normalMatrix = m4.transpose(normalMatrix, normalMatrix);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    gl.uniformMatrix4fv(shProgram.iNormalMatrix, false, normalMatrix);

    /* Draw the six faces of a cube, with different colors. */

    let color = hexToRgb(document.getElementById("color").value)
    gl.uniform4fv(shProgram.iColor, [color.r / 255.0, color.g / 255.0, color.b / 255.0, 1]);

    gl.uniform1f(shProgram.iScale,
        document.getElementById('scl').value)
    gl.uniform2fv(shProgram.iTranslate, pointTr)
    surface.Draw();
    gl.uniform4fv(shProgram.iLight, [1, 1, 1, 1]);
    gl.uniform1f(shProgram.iScale, -222)
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false,
        m4.multiply(modelViewProjection,
            m4.translation(...conical(map(pointTr[0], 0, 1, -Math.PI, Math.PI), map(pointTr[1], 0, 1, -a, 0))))
    );
    pointViz.Draw();
}

function draw_() {
    draw()
    window.requestAnimationFrame(draw_)
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function CreateSurfaceData() {
    let vertexList = [];

    // for (let i=0; i<360; i+=5) {
    //     vertexList.push( Math.sin(deg2rad(i)), 1, Math.cos(deg2rad(i)) );
    //     vertexList.push( Math.sin(deg2rad(i)), 0, Math.cos(deg2rad(i)) );
    // }

    // for (let u = -Math.PI * 100; u <= Math.PI * 100; u += 10) {
    //     for (let v = -a * 100; v <= 0 * 100; v += 10) {
    //         vertexList.push(...conical(u, v));
    //     }
    // }

    for (let v = -a; v <= 0; v += 0.1) {
        for (let u = -Math.PI; u <= Math.PI; u += 0.1) {
            vertexList.push(...conical(u, v));
            vertexList.push(...conical(u + 0.1, v));
            vertexList.push(...conical(u, v + 0.1));
            vertexList.push(...conical(u, v + 0.1));
            vertexList.push(...conical(u + 0.1, v));
            vertexList.push(...conical(u + 0.1, v + 0.1));
        }
    }
    return vertexList;
}
function CreateSurfaceNormals() {
    let vertexList = [];
    for (let v = -a; v <= 0; v += 0.1) {
        for (let u = -Math.PI; u <= Math.PI; u += 0.1) {
            vertexList.push(...conicalNormal(u, v));
            vertexList.push(...conicalNormal(u + 0.1, v));
            vertexList.push(...conicalNormal(u, v + 0.1));
            vertexList.push(...conicalNormal(u, v + 0.1));
            vertexList.push(...conicalNormal(u + 0.1, v));
            vertexList.push(...conicalNormal(u + 0.1, v + 0.1));
        }
    }
    return vertexList;
}
function CreateSurfaceTexCoords() {
    let vertexList = [];
    for (let v = -a; v <= 0; v += 0.1) {
        for (let u = -Math.PI; u <= Math.PI; u += 0.1) {
            vertexList.push(map(u, -Math.PI, Math.PI, 0, 1), map(v, -a, 0, 0, 1));
            vertexList.push(map(u + 0.1, -Math.PI, Math.PI, 0, 1), map(v, -a, 0, 0, 1));
            vertexList.push(map(u, -Math.PI, Math.PI, 0, 1), map(v + 0.1, -a, 0, 0, 1));
            vertexList.push(map(u, -Math.PI, Math.PI, 0, 1), map(v + 0.1, -a, 0, 0, 1));
            vertexList.push(map(u + 0.1, -Math.PI, Math.PI, 0, 1), map(v, -a, 0, 0, 1));
            vertexList.push(map(u + 0.1, -Math.PI, Math.PI, 0, 1), map(v + 0.1, -a, 0, 0, 1));
        }
    }
    return vertexList;
}

const delta = 0.0001;
let conicalNormal = (u, v) => {
    let uv = conical(u, v),
        uu = conical(u + delta, v),
        vv = conical(u, v + delta)
    const dU = [], dV = []
    for (let i = 0; i < 3; i++) {
        dU.push((uv[i] - uu[i]) / delta)
        dV.push((uv[i] - vv[i]) / delta)
    }
    const n = m4.normalize(m4.cross(dU, dV))
    return n
}
let a = 10;
let p = 1;
const multiplier = 10
function conical(u, v) {
    let w = (p * u);
    let x = (a + v) * Math.cos(w) * Math.cos(u);
    let y = (a + v) * Math.cos(w) * Math.sin(u);
    let z = (a + v) * Math.sin(w);
    return [x / multiplier, y / multiplier, z / multiplier]
}

function map(value, a, b, c, d) {
    value = (value - a) / (b - a);
    return c + value * (d - c);
}

function CreateSphereData() {
    let vertexList = [];

    let u = 0,
        v = 0;
    while (u < Math.PI * 2) {
        while (v < Math.PI) {
            let v1 = getSphereVertex(u, v);
            let v2 = getSphereVertex(u + 0.1, v);
            let v3 = getSphereVertex(u, v + 0.1);
            let v4 = getSphereVertex(u + 0.1, v + 0.1);
            vertexList.push(v1.x, v1.y, v1.z);
            vertexList.push(v2.x, v2.y, v2.z);
            vertexList.push(v3.x, v3.y, v3.z);
            vertexList.push(v3.x, v3.y, v3.z);
            vertexList.push(v2.x, v2.y, v2.z);
            vertexList.push(v4.x, v4.y, v4.z);
            v += 0.1;
        }
        v = 0;
        u += 0.1;
    }
    return vertexList
}

const radius = 0.1;
function getSphereVertex(long, lat) {
    return {
        x: radius * Math.cos(long) * Math.sin(lat),
        y: radius * Math.sin(long) * Math.sin(lat),
        z: radius * Math.cos(lat)
    }
}

let pointViz;
/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource );

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribVertexNormal = gl.getAttribLocation(prog, "normal");
    shProgram.iAttribTexCoord = gl.getAttribLocation(prog, "texture");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iNormalMatrix = gl.getUniformLocation(prog, "NormalMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");
    shProgram.iLight = gl.getUniformLocation(prog, "light");
    shProgram.iTranslate = gl.getUniformLocation(prog, "translate");
    shProgram.iScale = gl.getUniformLocation(prog, "scale");

    surface = new Model('Surface');
    surface.BufferData(CreateSurfaceData());
    surface.NormalBufferData(CreateSurfaceNormals());
    surface.TexCoordBufferData(CreateSurfaceTexCoords());
    pointViz = new Model('Surface');
    pointViz.BufferData(CreateSphereData());
    pointViz.NormalBufferData(CreateSphereData());
    pointViz.TexCoordBufferData(CreateSphereData());


    gl.enable(gl.DEPTH_TEST);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader( gl.VERTEX_SHADER );
    gl.shaderSource(vsh,vShader);
    gl.compileShader(vsh);
    if ( ! gl.getShaderParameter(vsh, gl.COMPILE_STATUS) ) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader( gl.FRAGMENT_SHADER );
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if ( ! gl.getShaderParameter(fsh, gl.COMPILE_STATUS) ) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog,vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if ( ! gl.getProgramParameter( prog, gl.LINK_STATUS) ) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if ( ! gl ) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);
    loadTexture()
    draw();
    draw_();
}
window.onkeydown = (e) => {
    if (e.keyCode == 87) {
        pointTr[0] = Math.min(pointTr[0] + 0.01, 1);
    }
    else if (e.keyCode == 83) {
        pointTr[0] = Math.max(pointTr[0] - 0.01, 0);
    }
    else if (e.keyCode == 65) {
        pointTr[1] = Math.max(pointTr[1] - 0.01, 0);
    }
    else if (e.keyCode == 68) {
        pointTr[1] = Math.min(pointTr[1] + 0.01, 1);
    }
    
    
}

function loadTexture() {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const image = new Image();
    image.crossOrigin = 'anonymus';
    image.src = "https://www.manytextures.com/thumbnail/5/512/dark+wood.jpg";
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        );
        console.log("imageLoaded")
        draw()
    }
}