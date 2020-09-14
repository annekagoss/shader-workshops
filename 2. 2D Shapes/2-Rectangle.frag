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

// A simpler rectangle function
// This thresholds across both axes, and then
// combines them with multiplication
float rectangle(vec2 st, vec2 size) {
  vec2 rect = step(abs(st - vec2(0.5)), size);
  return rect.x * rect.y;
}

float SDFRectangle(vec2 st, vec2 size, vec2 center) {
  // Here we find the distance from our point to each edge of the rectangle.
  // The distance will be positive if outside of the rectange, and negative if
  // inside.
  vec2 distanceToEdge = abs(st - center) - (size / 2.0);

  // "Max" allows us to ignore the pixels that are inside.
  // Convert distance to each edge to Euclidean distance to corner with
  // Pythagorean theorem "length" Outside now stores the distance of pixels that
  // are outside of the rectangle. This is a distance field that ranges from 0
  // to Infinity
  float outside = length(max(distanceToEdge, 0.0));

  // Use "max" to find which edge the interior point is closer to (interior
  // points are negative) Use "min" keeps numbers negative in case a coordinate
  // is inside on one axis but outside on another
  float inside = min(max(distanceToEdge.x, distanceToEdge.y), 0.0);

  // Combine inside and outside to form a distance field between -Infinity and
  // Infinity.
  return inside + outside;
}

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution;
  vec3 color = vec3(threshold(SDFRectangle(st, u_rect_size, CENTER)));
  gl_FragColor = vec4(color, 1.0);
}
