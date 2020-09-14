// Pre-Processor directives

// Define float precision to ensure compatibility across widest range of devices
#ifdef GL_ES
precision mediump float;
#endif

// Define constants at compile time as optimization
#define RED vec3(1.0, 0.0, 0.0)
#define BLUE vec3(0.0, 0.0, 1.0)

// DATA TYPES
// vec2: a 2-component float vector
// properties can be accessed as: 
// xy: {x: float, y: float} position
// st: {s: float, t: float} texture coordinate
// rg: {r: float, g: float} color

// vec3: a 3-component float vector
// properties can be accessed as: 
// xyz: {x: float, y: float, z: float}
// rgb: {r: float, g: float, b: float}

// vec4: a 4-component float vector
// properties can be accessed as: 
// xyzw: {x: float, y: float, z: float, w: float}
// rgba: {r: float, float, b: float, a: float}


// You can also define constants at run time
//const float RED = vec2(u_time, 0.0, 0.0);

// Uniforms are inputs that the graphics API send in to the shader
uniform vec2 u_resolution;  
uniform vec2 u_mouse;
uniform float u_time;
uniform sampler2D texture1;

vec3 horizontalGradient(vec2 st) {
    return mix(RED, BLUE, st.y);
}

vec3 diagonalGradient(vec2 st) {
    float value = (st.y + st.x)  / 2.; // divide by 2 to normalize 0-2 to 0-1
    //float value = (st.x + st.y) / 2.; 
    return mix(RED, BLUE, value);
}

vec2 distortCoords(vec2 st) {
    float value = sin(st.x * 10.0 + u_time) * 0.1;
    st.y += value;
    return st;
}

vec4 colorShift(vec2 st) {
    //float distortion = .1;
    float distortion = sin(st.y * 10.0 + u_time) * .02;
    vec2 distortedStR = vec2(st.x + distortion, st.y);
    vec2 distortedStG = st;
    vec2 distortedStB = vec2(st.x - distortion, st.y);
    float red = texture2D(texture1, distortedStR).x;
     float green = texture2D(texture1, distortedStG).g;
     float blue = texture2D(texture1, distortedStB).b;
     return vec4(vec3(red, green, blue), 1.0);
}

// The main function is responsible for assigning a color (gl_FragColor)
// to the pixel at the given coordinate (gl_FragCoord).
void main() {
    vec2 st = gl_FragCoord.xy/u_resolution;
    st.y = 1.0 - st.g;
    
//  st = distortCoords(st);
//  st.x = fract(st.x * 1.);
//  st.y = fract(st.y * 2.);
//  vec4 color = vec4(diagonalGradient(st), 1.);
//  vec4 color = texture2D(texture1, st);
    vec4 color = colorShift(st);
    gl_FragColor = color;
}