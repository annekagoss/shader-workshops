#ifdef GL_ES
precision mediump float;
#endif

#define RED vec3(1.0, 0.0, 0.0)
#define BLUE vec3(0.0, 0.0, 1.0)

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform sampler2D u_texture;

// vec2 {x: float, y: float}
// vec4 {r: float, g: float, b: float, a: float}
// vec4 {x: float, y: float, z: float, w: float}

vec3 horizontalGradient(vec2 st) { return mix(RED, BLUE, st.x); }

vec3 verticalGradient(vec2 st) { return mix(RED, BLUE, st.y); }

vec3 diagonalGradient(vec2 st) { return mix(RED, BLUE, (st.x + st.y) / 2.0); }

vec4 readTexture(vec2 st) {
  st.y = 1.0 - st.y;
  return texture2D(u_texture, st);
}

vec2 distortCoords(vec2 st) {
  float offset = sin(st.x * 30.0) * .05;
  st.y += offset;
  return st;
}

vec4 colorShift(vec2 st) {
  vec2 phaseOffset = vec2(0.0, 1.);
  float distortionR = sin(st.y * 30.0 + u_time + phaseOffset.r) * 0.01;
  float distortionB = sin(st.y * 30.0 + u_time + phaseOffset.g) * 0.01;
  st.y = 1.0 - st.y;
  vec2 distortR = vec2(st.x + distortionR, st.y);
  vec2 distortG = st;
  vec2 distortB = vec2(st.x + distortionB, st.y);
  float red = texture2D(u_texture, distortR).r;
  float green = texture2D(u_texture, distortG).g;
  float blue = texture2D(u_texture, distortB).b;
  return vec4(red, green, blue, 1.0);
}

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution;
  // vec3 color = verticalGradient(st);
  // vec3 color = diagonalGradient(st);
  // gl_FragColor = vec4(color, 1.0); // (0.75, 1.0, 0.0)

  //    st.x = fract(st.x*2.0);
  //    st.y = fract(st.y*4.0);
  // st = distortCoords(st);

  // vec4 color = readTexture(st);
  // color = color.grba;
  // color.r = 0.0;
  // color.g = 1.0 - color.g;
  // color.b *= 2.0;

  vec4 color = colorShift(st);
  gl_FragColor = color;
}