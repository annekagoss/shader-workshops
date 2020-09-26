#ifdef GL_ES
precision mediump float;
#endif

#define EPSILON 0.0001

#define MAX_DIST 32.0

#define CAMERA_POSITION vec3(0.0, 0.0, 0.0)
#define CAMERA_TARGET vec3(0.0, 0.0, 1.0)

#define BACKGROUND_COLOR vec3(0.0, 0.0, 1.0)
#define LIGHT_POS_A vec3(4.0)
#define LIGHT_COLOR_A vec3(0.0, 0.0, 1.0)
#define LIGHT_POS_B vec3(-4.0, 4.0, 4.0)
#define LIGHT_COLOR_B vec3(1.0, 0.0, 0.25)

#define rot(a) mat2(cos(a), sin(a), -sin(a), cos(a))

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

float boxSDF(vec3 pos, vec3 size) {
  vec3 dimensions = abs(pos) - size;
  float maxDimensions = max(dimensions.x, max(dimensions.y, dimensions.z));
  return min(maxDimensions, length(max(dimensions, 0.0)));
}

float primitiveCombinationSDF(vec3 pos) {
  float ground = boxSDF(pos + vec3(0.0, 1.5, 0.0), vec3(4.0, 1.0, 4.0));
  pos += CAMERA_TARGET;
  pos.xz *= rot(u_time * 0.5);
  float sphere = sphereSDF(pos, 0.3);
  float cube = boxSDF(pos, vec3(0.3));
  float cube1 = boxSDF(pos, vec3(0.15, 0.15, 0.5));
  return min(
      ground,
      max(-cube1, sphere)); // Addition and subtraction primitive combinations
}

float sceneSDF(vec3 pos) { return primitiveCombinationSDF(pos); }

// Numerical normal calculation
// =========================================================
// Sample four points on the surface that surround the point in question
// and find their directional derivatives.
// Reference: https://www.iquilezles.org/www/articles/normalsSDF/normalsSDF.htm
vec3 calcNormal(vec3 position) {
  vec3 epsilon = vec3(0.001, 0.0, 0.0);
  return normalize(vec3(
      sceneSDF(position + epsilon.xyy) - sceneSDF(position - epsilon.xyy),
      sceneSDF(position + epsilon.yxy) - sceneSDF(position - epsilon.yxy),
      sceneSDF(position + epsilon.yyx) - sceneSDF(position - epsilon.yyx)));
}

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

// Lighting
// =========================================================
// This is a very simple implementation of phong lighting.
// More advanced lighting contains additional calculations, such as
// specular, reflecton, fresnel, subsurface scattering, roughness, and more.
vec3 calcLightColor(vec3 lightPosition, vec3 color, vec3 position,
                    vec3 normal) {
  vec3 angle = normalize(lightPosition - position);
  vec3 diffuse = vec3(max(0.0, dot(angle, normal)));
  return color * diffuse;
}

vec3 applyPhongLighting(vec3 position, vec3 normal, intersect i) {
  if (!i.hit)
    return BACKGROUND_COLOR;
  vec3 color = BACKGROUND_COLOR * 0.5;

  color += calcLightColor(LIGHT_POS_A, LIGHT_COLOR_A, position, normal);
  color += calcLightColor(LIGHT_POS_B, LIGHT_COLOR_B, position, normal);

  return color;
}

// For this scene we're faking the lighting entirely.
// The brightness of hte pixel is based entirely off of distance
// from the camera and number or boun
vec3 applyReflectedLighting(intersect i) {
  return vec3(i.dist / MAX_DIST * 1.1);
}

vec3 applyLighting(vec3 position, vec3 normal, intersect i) {
  return applyPhongLighting(position, normal, i);
}

void main() {
  // Point the ray so it will give us a distance for the current pixel
  vec2 pixelPosition =
      (2.0 * gl_FragCoord.xy - u_resolution.xy) / u_resolution.y;
  vec3 rayDirection = normalize(cameraMatrix * vec3(pixelPosition, -1.3));
  intersect i = rayMarch(CAMERA_POSITION, rayDirection);

  vec3 position = CAMERA_POSITION + rayDirection * i.dist;
  vec3 normal = calcNormal(position);
  vec3 color = applyLighting(position, normal, i);
  gl_FragColor = vec4(color, 1.0);
}