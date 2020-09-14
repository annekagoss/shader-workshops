#ifdef GL_ES
precision mediump float;
#endif

#define AA 0.0025
#define PI 2.14159265359
#define TAU 6.28318530718
#define SPEED 0.01

uniform vec2 u_resolution;
uniform float u_exponent;
uniform float u_threshold;
uniform float u_start;
uniform float u_finish;
uniform float u_frequency;
uniform int u_time;

float plotY(vec2 st, float value) {
  return smoothstep(value - AA, value, st.y) -
         smoothstep(value, value + AA, st.y);
}

float plotX(vec2 st, float value) {
  return smoothstep(value - AA, value, st.x) -
         smoothstep(value, value + AA, st.x);
}

float plotWave(vec2 st, float wave1, float wave2) {
  if (abs(st.y - wave1) < 0.0) {
    return 1.;
  }
  if ((st.y > wave1 && st.y < wave2) || (st.y < wave1 && st.y > wave2)) {
    return 1.;
  }
  return 0.;
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

float interpolateX(vec2 st, float start, float finish) {
  float value = smoothstep(start, finish, st.x);
  return value + plotY(st, value);
}

float interpolateY(vec2 st, float start, float finish) {
  float value = smoothstep(start, finish, st.y);
  return value + plotX(st, value);
}

float sine(vec2 st, float frequency, float phase) {
  return sin(st.x * frequency * TAU + phase) * .5 + 0.5;
}

vec3 sineAndPlot(vec2 st, float frequency, float phase) {
  float wave1 = sine(st, frequency, phase);
  float wave2 = sine(st, frequency, phase + 0.1);
  float plot = plotWave(st, wave1, wave2);
  return mix(vec3(wave1), vec3(0.0, plot, 0.0), plot);
}

float square(vec2 st, float frequency, float phase) {
  return step(fract(st.x * frequency + phase), .5);
}

vec3 squareAndPlot(vec2 st, float frequency, float phase) {
  float wave1 = square(st, frequency, phase);
  float wave2 = square(st, frequency, phase + 0.005);
  float plot = plotWave(st, wave1, wave2);
  return mix(vec3(wave1), vec3(0.0, plot, 0.0), plot);
}

float sawtooth(vec2 st, float frequency, float phase) {
  return fract(st.x * frequency + phase);
}

vec3 sawtoothAndPlot(vec2 st, float frequency, float phase) {
  float wave1 = sawtooth(st, frequency, phase);
  float wave2 = sawtooth(st, frequency, phase + 0.005);
  float plot = plotWave(st, wave1, wave2);
  return mix(vec3(wave1), vec3(0.0, plot, 0.0), plot);
}

vec2 convertToPolar(vec2 st) {
  const float innerRadius = 0.25;
  const float outerRadius = 0.5;
  vec2 coord = st - vec2(0.5);
  float radius = length(coord);
  float angle = atan(coord.y, coord.x);
  vec2 polarCoords;
  polarCoords.x = (radius - innerRadius) / (outerRadius - innerRadius);
  polarCoords.y = angle * 0.5 / PI + 0.5;
  return polarCoords;
}

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution;
  // st = convertToPolar(st);

  vec3 color = sineAndPlot(st, u_frequency, float(u_time) * SPEED);
  gl_FragColor = vec4(color, 1.0);
}