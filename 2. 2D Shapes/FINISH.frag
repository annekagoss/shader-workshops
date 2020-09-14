#ifdef GL_ES
precision mediump float;
#endif

#define CENTER vec2(0.5)

#define LIGHT_GRAY vec3(0.898, 0.894, 0.878)
#define DARK_GREEN vec3(0.004, 0.294, 0.188)
#define TEAL vec3(0.007, 0.498, 0.505)
#define GRAY vec3(0.615, 0.631, 0.627)
#define GOLD vec3(0.843, 0.721, 0.356)

#define SIZE_STEP 0.2
#define OFFSET_STEP vec2(0.0, 0.03)

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

float sizeForLayer(int layer) { return (1.0 - SIZE_STEP * float(layer)); }

vec2 offsetForLayer(int layer) { return OFFSET_STEP * float(layer); }

float ease(float time) {
  // Smoothstep creates a smooth curve between the first to parameters
  // This acts like an ease-in-out timing function, where the distance
  // between the two parameters acts like an inverse exponent.
  // The smaller the distance, the more jarring the transition.
  return smoothstep(0.1, .9, time);
}

float morphSDFs(float SDFA, float SDFB, float offset) {
  // Use sin to oscillate linear time between -1 and 1
  // We can offset each animation by adding to time within the sin function
  // This acts as a phase offset for the sine wave
  // Then convert the output to a range of 0 to 1
  float sinewave = sin(u_time + offset) / 2.0 + 0.5;

  // Add an easing function
  float interpolator = ease(sinewave);

  // Use this animated value to interpolate between the two distance fields
  return mix(SDFA, SDFB, interpolator);
}

float createShape(vec2 st, vec2 center, int index) {
  // Translate the shape by adding to the coordinate system
  st = st + offsetForLayer(index);
  // Scale the shape by multiplying the coordinate system
  float size = sizeForLayer(index);

  // Create SDFs using this new transformed coordinate system
  float rectSDF = SDFRectangle(st, u_rect_size * size, center);
  float circleSDF = SDFcircle(st, u_circle_radius * size, center);

  // Morph the SDFs and offset each layer
  float SDF = morphSDFs(rectSDF, circleSDF, float(index) / 2.0);
  return threshold(SDF);
}

// GLSL supports arrays and switch statements,
// but only for some graphics cards and graphics APIs.
// As a workaround you can create branching logic
// with if statements and early returns.
vec3 getColorForIndex(int index) {
  if (index == 0) {
    return DARK_GREEN;
  }
  if (index == 1) {
    return TEAL;
  }
  if (index == 2) {
    return GRAY;
  }
  if (index == 3) {
    return GOLD;
  }
  return LIGHT_GRAY;
}

vec3 klee(vec2 st, vec2 center) {
  // Initialize the color with the background color.
  // We'll layer colors on top of this one.
  vec3 color = LIGHT_GRAY;

  for (int i = 0; i < 4; i++) {
    float shape = createShape(st, center, i);

    // If the pixel is within the shape
    // we overwrite the background color.
    color = mix(color, getColorForIndex(i), shape);
  }
  return color;
}

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution;
  vec3 klee = klee(st, CENTER);
  gl_FragColor = vec4(klee, 1.0);
}