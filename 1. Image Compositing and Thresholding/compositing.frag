#ifdef GL_ES
precision mediump float;
#endif

#define BLACK vec3(0.0)
#define WHITE vec3(1.0)
#define ORIGIN_2 vec2(0.0)
#define SKYLINE_RES vec2(2000.0, 1125.0)
#define BANANA_RES vec2(468.0, 414.0)

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform vec2 u_bounds;
uniform float u_blend_mode;
uniform sampler2D u_skyline;
uniform sampler2D u_buildings;
uniform sampler2D u_banana;

float map(float val, float inMin, float inMax, float outMin, float outMax) {
  return (val - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

vec2 flipY(vec2 st) { return vec2(st.x, 1.0 - st.y); }

vec2 centerImage(vec2 st, vec2 imageRes) {
  st -= 0.5;
  st *= u_resolution / imageRes;
  st += 0.5;
  return st;
}

vec2 scaleImage(vec2 st, float scale) {
  st -= 0.5;
  st *= scale;
  st += 0.5;
  return st;
}

bool inBounds(float value, vec2 bounds) {
  return clamp(value, bounds.x, bounds.y) == value;
}

bool coordInBounds(vec2 st) {
  vec2 bounds = vec2(0.0, 1.0);
  return inBounds(st.x, bounds) && inBounds(st.y, bounds);
}

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

vec4 colorFromSampler(vec2 st, sampler2D sampler, vec2 imageRes, vec2 offset,
                      float scale) {
  st += offset;
  st = flipY(st);

  vec2 imageSt = scaleImage(imageRes, scale);
  imageSt = centerImage(st, imageSt);

  if (!coordInBounds(imageSt))
    return vec4(0.0);

  return texture2D(sampler, imageSt);
}

vec4 normal(vec4 background, vec4 foreground) {
  return mix(background, foreground, foreground.a);
}

vec4 multiply(vec4 background, vec4 foreground) {
  vec3 color = background.rgb * foreground.rgb;
  return vec4(color, background.a);
}

// Similar to projecting multiple image on top of each other
// The color will be at least as light as the color of either image.
vec4 screen(vec4 background, vec4 foreground) {
  vec4 multiplied = multiply(background, foreground);
  vec3 color = (background.rgb + foreground.rgb) - multiplied.rgb;
  return vec4(color, background.a);
}

// Multiplies or screens the background color depending on the foreground color
vec4 hardLight(vec4 background, vec4 foreground) {
  if (length(foreground) <= 0.5)
    return multiply(background, foreground * 2.0);
  return screen(background, (foreground * 2.0) - 1.0);
}

vec3 softDarken(vec4 background) {
  float a = 16.0 / 255.0;
  float b = 12.0 / 255.5;
  float c = 4.0 / 255.0;
  if (length(background) <= 0.25) {
    return ((a * background.rgb - b) * background.rgb + c) * background.rgb;
  }
  return sqrt(background.rgb);
}

// Darkens or lightness the background color depending on the foreground color
vec4 softLight(vec4 background, vec4 foreground) {
  vec3 color = background.rgb;
  if (length(foreground) <= 0.5) {
    color = background.rgb - (1.0 - (2.0 * foreground.rgb)) * background.rgb *
                                 (1.0 - background.rgb);
  } else {
    color = background.rgb + ((2.0 * foreground.rbg) - 1.0) *
                                 (softDarken(background) - background.rgb);
  }
  return vec4(color, background.a);
}

// The background color is mixed with the foreground color
// depending on its lightness.
vec4 overlay(vec4 background, vec4 foreground) {
  // background and foreground are reversed when passed to hardLight
  return hardLight(foreground, background);
}

// Uses the darker of the two colors
vec4 darken(vec4 background, vec4 foreground) {
  return min(background, foreground);
}

// Uses the lighter of the two colors
vec4 lighten(vec4 background, vec4 foreground) {
  return max(background, foreground);
}

float colorDodge(float bgVal, float fgVal) {
  return min(1.0, bgVal / (1.0 - fgVal));
}

// Lightens the background color based on the foreground color
vec4 colorDodge(vec4 background, vec4 foreground) {
  float bgLightness = length(background);
  if (bgLightness == 0.0)
    return vec4(BLACK, background.a);
  if (bgLightness == 1.0)
    return vec4(WHITE, background.a);
  return vec4(colorDodge(background.r, foreground.r),
              colorDodge(background.g, foreground.g),
              colorDodge(background.b, foreground.b), background.a);
}

float colorBurn(float bgVal, float fgVal) {
  return 1.0 - min(1.0, (1.0 - bgVal) / fgVal);
}

// Darkens the background color based on the foreground color
vec4 colorBurn(vec4 background, vec4 foreground) {
  float bgLightness = length(background);
  if (bgLightness == 0.0)
    return vec4(BLACK, background.a);
  if (bgLightness == 1.0)
    return vec4(WHITE, background.a);
  return vec4(colorBurn(background.r, foreground.r),
              colorBurn(background.g, foreground.g),
              colorBurn(background.b, foreground.b), background.a);
}

// Subtracts the darker color form the lighter color
vec4 difference(vec4 background, vec4 foreground) {
  return vec4(abs(background.rgb - foreground.rgb), background.a);
}

// Lower contrast difference
vec4 exclusion(vec4 background, vec4 foreground) {
  vec3 color =
      background.rgb + foreground.rgb - 2.0 * background.rgb * foreground.rgb;
  return vec4(color, background.a);
}

// Foreground hue and background hue and luminosity
vec4 hue(vec4 background, vec4 foreground) {
  vec3 bgHsl = rgbTohsl(background.rgb);
  vec3 fgHsl = rgbTohsl(foreground.rgb);
  vec3 colorHsl = vec3(fgHsl.r, bgHsl.g, bgHsl.b);
  return vec4(hslTorgb(colorHsl), background.a);
}

// Foreground saturation and background saturation and luminosity
vec4 saturation(vec4 background, vec4 foreground) {
  vec3 bgHsl = rgbTohsl(background.rgb);
  vec3 fgHsl = rgbTohsl(foreground.rgb);
  vec3 colorHsl = vec3(bgHsl.r, fgHsl.g, bgHsl.b);
  return vec4(hslTorgb(colorHsl), background.a);
}

// Foreground hue and saturation and background luminosity
vec4 color(vec4 background, vec4 foreground) {
  vec3 bgHsl = rgbTohsl(background.rgb);
  vec3 fgHsl = rgbTohsl(foreground.rgb);
  vec3 colorHsl = vec3(fgHsl.r, fgHsl.g, bgHsl.b);
  return vec4(hslTorgb(colorHsl), background.a);
}

// Foreground luminosity and background hue and saturation
vec4 luminosity(vec4 background, vec4 foreground) {
  vec3 bgHsl = rgbTohsl(background.rgb);
  vec3 fgHsl = rgbTohsl(foreground.rgb);
  vec3 colorHsl = vec3(bgHsl.r, bgHsl.g, fgHsl.b);
  return vec4(hslTorgb(colorHsl), background.a);
}

// Enums in GLSL are often represented as integers.
// Here we use a integer for blend modes where:
// 0: Normal
// 1: Multiply
// 2: Screen
// 3: Overlay
// 4: Darken
// 5: Lighten
// 6: Color Dodge
// 7: Color Burn
// 8: Hard Light
// 9: Soft Light
// 10: Difference
// 11: Exclusion
// 12: Hue
// 13: Saturation
// 14: Color
// 15: Luminosity
vec4 composite(vec4 background, vec4 foreground, int blendMode) {
  // Ignore foreground colors if they are outside image bounds
  vec4 composite;

  if (blendMode == 0) {
    composite = normal(background, foreground);
  }

  if (blendMode == 1) {
    composite = multiply(background, foreground);
  }

  if (blendMode == 2) {
    composite = screen(background, foreground);
  }

  if (blendMode == 3) {
    composite = overlay(background, foreground);
  }

  if (blendMode == 4) {
    composite = darken(background, foreground);
  }

  if (blendMode == 5) {
    composite = lighten(background, foreground);
  }

  if (blendMode == 6) {
    composite = colorDodge(background, foreground);
  }

  if (blendMode == 7) {
    composite = colorBurn(background, foreground);
  }

  if (blendMode == 8) {
    composite = hardLight(background, foreground);
  }

  if (blendMode == 9) {
    composite = softLight(background, foreground);
  }

  if (blendMode == 10) {
    composite = difference(background, foreground);
  }

  if (blendMode == 11) {
    composite = exclusion(background, foreground);
  }

  if (blendMode == 12) {
    composite = hue(background, foreground);
  }

  if (blendMode == 13) {
    composite = saturation(background, foreground);
  }

  if (blendMode == 14) {
    composite = color(background, foreground);
  }

  if (blendMode == 15) {
    composite = luminosity(background, foreground);
  }

  return mix(background, composite,
             clamp(map(foreground.a, 0.5, 1.0, 0.0, 1.0), 0.0, 1.0));
}

vec4 occludeWithClouds(vec2 st, vec4 skyWithBanana, vec4 skyline) {
  float skyLightness = rgbTohsl(skyline.rgb).b;
  if (st.x > 0.6 && st.y > 0.5 && st.y < .77 && skyLightness < .65) {
    return mix(skyWithBanana, composite(skyWithBanana, skyline, 4),
               clamp(map(skyLightness, 0.0, 0.55, 0.0, 1.0), 0.0, 1.0));
  }
  return skyWithBanana;
}

vec4 compositeIntoSky(vec2 st, vec4 skyline, vec4 buildings, vec4 banana) {
  // Use lighten blend mode for atmospheric perspective
  vec4 color = composite(skyline, banana, 5);
  color = occludeWithClouds(st, color, skyline);
  color = mix(color, buildings, buildings.a); // Occlude with buildings
  color.rgb = mix(BLACK, color.rgb,
                  color.a); // Use a black background if color is transparent
  return color;
}

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution;
  vec4 skyline = colorFromSampler(st, u_skyline, SKYLINE_RES, ORIGIN_2,
                                  u_resolution.x / SKYLINE_RES.x);
  vec4 banana =
      colorFromSampler(st, u_banana, BANANA_RES, vec2(-0.125, -0.225), 0.750);
  vec4 buildings = colorFromSampler(st, u_buildings, SKYLINE_RES, ORIGIN_2,
                                    u_resolution.x / SKYLINE_RES.x);
  gl_FragColor = compositeIntoSky(st, skyline, buildings, banana);
}