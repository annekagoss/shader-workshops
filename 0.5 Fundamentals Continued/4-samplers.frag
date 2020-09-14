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
uniform sampler2D u_image;
uniform float u_hue;
uniform vec3 spectrum2;

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

vec4 readImageColor(vec2 st, sampler2D sampler) {
  vec2 imageSt = st;
  imageSt.y = 1. - imageSt.y;
  return texture2D(sampler, imageSt);
}

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec4 grayscale(vec4 color) {
  float brightness = rgb2hsv(color.rgb).z;
  return vec4(vec3(brightness), color.a);
}

vec4 hueShift(vec4 color, float hue) {
  vec3 hsv = rgb2hsv(color.rgb);
  hsv.x = hue;
  return vec4(vec3(hsv2rgb(hsv)), 1.0);
}

vec2 distortCoords(vec2 st) {
  vec2 polarSt = st + vec2(distance(st, vec2(0.5)));
  float sinewave = sine(st, u_frequency, float(u_time) * SPEED);
  return mix(st, polarSt, sinewave);
}

vec2 repeat(vec2 st, vec2 grid) {
  return vec2(mod(st.x * grid.x, 1.), mod(st.y * grid.y, 1.));
}

vec4 readShiftedImageColor(vec2 st, sampler2D sampler) {
  vec2 imageSt = st;
  imageSt.y = 1. - imageSt.y;
  // imageSt.y += spectrum2.x * .5;

  // vec2 distortedImageSt = distortCoords(st);
  vec2 distortedImageSt = atan(vec2(
      distance(st, vec2(0.5)) * sin(0.5 - st.x + float(u_time) * SPEED * 0.5)));
  imageSt = mix(imageSt, distortedImageSt,
                (sine(st, 1.0, float(u_time) * SPEED) * .5 + .5) * .5);

  vec4 image = texture2D(sampler, imageSt);
  vec4 redImage =
      texture2D(sampler, imageSt + vec2(sine(st, 10.0, float(u_time) * SPEED) *
                                            (spectrum2.x * .1 + .01),
                                        0.0));
  vec4 blueImage = texture2D(
      sampler, imageSt - vec2(sine(st, 10.0, float(u_time) * -SPEED + .5) *
                                  (spectrum2.x * .1 + 0.01),
                              0.0));
  return vec4(vec3(redImage.r, image.g, blueImage.b), image.a);
}

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution;
  // vec4 color = readImageColor(st, u_image);
  // color = grayscale(color);
  // color = hueShift(color, u_hue);

  vec4 color = readShiftedImageColor(st, u_image);
  gl_FragColor = color;
}