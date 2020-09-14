#ifdef GL_ES
precision mediump float;
#endif

#define AA 0.0025

uniform vec2 u_resolution;
uniform float u_exponent;
uniform float u_threshold;
uniform float u_start;
uniform float u_finish;

float plotY(vec2 st, float value) {
  return smoothstep(value - AA, value, st.y) -
         smoothstep(value, value + AA, st.y);
}

float plotX(vec2 st, float value) {
  return smoothstep(value - AA, value, st.x) -
         smoothstep(value, value + AA, st.x);
}

float horizontalLinearGradient(vec2 st) {
  float value = st.x;
  return value + plotY(st, value);
}

float verticalLinearGradient(vec2 st) {
  float value = st.y;
  return value + plotX(st, value);
}

float diagonalLinearGradient(vec2 st) {
  float value = (st.y - st.x) * .5 + .5; // Map gradient from -1 - 1 to 0 - 1
  // float value = (st.y + st.x) * .5; // Map gradient from 0 - 2 to 0 - 1
  return value + plotY(st, value);
}

float exponentialGradient(vec2 st, float exponent) {
  float value = pow(st.x, exponent);
  return value + plotY(st, value);
}

float thresholdX(vec2 st, float threshold) { return step(st.x, threshold); }

float thresholdY(vec2 st, float threshold) { return step(st.y, threshold); }

float smoothInterpolateX(vec2 st, float start, float finish) {
  float value = smoothstep(start, finish, st.x);
  return value + plotY(st, value);
}

float smoothInterpolateY(vec2 st, float start, float finish) {
  float value = smoothstep(start, finish, st.y);
  return value + plotX(st, value);
}

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution;
  float brightness = smoothInterpolateY(st, u_start, u_finish);
  gl_FragColor = vec4(vec3(brightness), 1.0);
}