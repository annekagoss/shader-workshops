#ifdef GL_ES
precision mediump float;
#endif

#define CENTER vec2(0.5)

uniform vec2 u_resolution;
uniform vec2 u_rect_size;
uniform float u_circle_radius;
uniform float u_time;
uniform vec2 u_mouse;

float threshold(float distanceField) { return step(distanceField, 0.0); }

float SDFcircle(vec2 st, float radius, vec2 center) {
  // First we find the distance of the coordinate to the center
  // Then subtract the radius to create a smooth gradient from -Infinity to
  // Infinity
  return distance(st, center) - radius;
}

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution;
  vec3 color = vec3(threshold(SDFcircle(st, u_circle_radius, CENTER)));
  gl_FragColor = vec4(color, 1.0);
}