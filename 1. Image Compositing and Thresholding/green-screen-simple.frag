#ifdef GL_ES
precision mediump float;
#endif

#define MASK vec3(0.44, 0.98, 0.0)
#define GRADIENT 0.275

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform sampler2D u_cloud;
uniform vec2 u_bounds;

vec3 rgbTohsl(vec3 c) {
  float h = 0.0;
  float s = 0.0;
  float l = 0.0;
  float r = c.r;
  float g = c.g;
  float b = c.b;
  float cMin = min(r, min(g, b));
  float cMax = max(r, max(g, b));

  l = (cMax + cMin) / 2.0;
  if (cMax > cMin) {
    float cDelta = cMax - cMin;

    s = l < .0 ? cDelta / (cMax + cMin) : cDelta / (2.0 - (cMax + cMin));

    if (r == cMax) {
      h = (g - b) / cDelta;
    } else if (g == cMax) {
      h = 2.0 + (b - r) / cDelta;
    } else {
      h = 4.0 + (r - g) / cDelta;
    }

    if (h < 0.0) {
      h += 6.0;
    }
    h = h / 6.0;
  }
  return vec3(h, s, l);
}

vec3 hslTorgb(vec3 c) {
  vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0,
                   0.0, 1.0);
  return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
}

vec4 createForeground(vec2 st) {
  st.y = 1.0 - st.y;
  vec4 cloud = texture2D(u_cloud, st);

  vec3 cloudHsl = rgbTohsl(cloud.rgb);
  vec3 maskHsl = rgbTohsl(MASK);
  vec3 diff = cloudHsl - maskHsl;

  float gradient = GRADIENT * pow(cloudHsl.b, 1.0);
  // Create a gradient at the green and lightness thresholds for a natural fade
  float green = smoothstep(0.8 - gradient, 0.8 + gradient, length(diff));
  float highlights = smoothstep(0.72 - gradient, 0.72 + gradient, cloudHsl.b);

  // desaturate to remove extra green
  cloudHsl.g *= 0.6;
  cloud.rgb = hslTorgb(cloudHsl);

  cloud.a = clamp(green + highlights, 0.0, 1.0);
  return cloud;
}

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution;
  vec4 background = vec4(st.x, st.y, .5, 1.0);
  vec4 foreground = createForeground(st);
  gl_FragColor = mix(background, foreground, foreground.a);
}