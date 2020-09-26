#ifdef GL_ES
precision mediump float;
#endif

#define EPSILON 0.0001

#define MAX_DIST 32.0

#define CAMERA_POSITION vec3(0.0, 0.0, 0.0)
#define CAMERA_TARGET vec3(0.0, 0.0, 1.0)

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

struct intersect {
  float dist;
  bool hit;
};

// Projection View Matrix initialization
// =========================================================
// This builds information about the camera
// so we can cast line of sight rays from it.

mat3 initCameraMatrix(vec3 position, vec3 target, float rotation) {
  vec3 zDirection = normalize(position - target);
  vec3 zAxisRotation = vec3(sin(rotation), cos(rotation), 0.0);
  vec3 xDirection = normalize(cross(zDirection, zAxisRotation));
  vec3 yDirection = normalize(cross(xDirection, zDirection));
  return mat3(xDirection, yDirection, -zDirection);
}

mat3 cameraMatrix = initCameraMatrix(CAMERA_POSITION, CAMERA_TARGET, 0.0);

// Creating geometry with 3d Signed Distance Fields
// =========================================================
// Reference:
// https://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm

float sphereSDF(vec3 pos, float radius) { return length(pos) - radius; }

float primitiveCombinationSDF(vec3 pos) {
  pos += CAMERA_TARGET;
  return sphereSDF(pos, 0.5);
}

float sceneSDF(vec3 pos) { return primitiveCombinationSDF(pos); }

// Raymarching
// =========================================================
// A popular technique for procedurally rendering geometry.
// Cast rays from a camera, and step along the rays until a collision with an
// object. The resulting distance is used later to calculate lighitng.
// https://www.iquilezles.org/www/articles/raymarchingdf/raymarchingdf.htm
intersect rayMarch(vec3 rayOrigin, vec3 rayDirection) {
  float dist = 0.0;
  bool hit = false;
  vec3 position = rayOrigin + rayDirection * dist;

  // Step along ray
  for (int i = 0; i < 128; i++) {
    float scene = sceneSDF(position);

    // The distance between the current position and an object is negligible.
    if (scene < EPSILON)
      hit = true;

    // Flew off into the distance without hitting anything
    if (dist > MAX_DIST)
      break;

    dist += scene;

    // Step further down the ray
    position = rayOrigin + rayDirection * dist;
  }
  return intersect(dist, hit);
}

void main() {
  // Point the ray so it will give us a distance for the current pixel
  vec2 pixelPosition =
      (2.0 * gl_FragCoord.xy - u_resolution.xy) / u_resolution.y;
  vec3 rayDirection = normalize(cameraMatrix * vec3(pixelPosition, -1.3));
  intersect i = rayMarch(CAMERA_POSITION, rayDirection);

  vec3 color = vec3(0.0);
  if (i.hit)
    color = vec3(i.dist);

  gl_FragColor = vec4(color, 1.0);
}