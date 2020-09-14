#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

uniform sampler2D u_flames;
uniform vec2 u_flames_res;

uniform sampler2D u_singing_elmo;

uniform sampler2D u_elmo_dark;

uniform sampler2D u_shocked_elmo;

uniform vec2 u_elmo_res;
uniform vec2 u_elmo_sat_threshold;
uniform vec2 u_elmo_lightness_threshold;
uniform vec2 u_elmo_hue_threshold;

#define BLACK vec4(0.0, 0.0, 0.0, 1.0)

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

// The inout specifies that st is mutable here
vec4 colorFromSampler(inout vec2 st, sampler2D sampler, vec2 imageRes,
                      vec2 offset, float scale) {

  // push coordinate transformation
  st += offset;
  st = flipY(st);

  vec2 imageSt = scaleImage(imageRes, scale);
  imageSt = centerImage(st, imageSt);

  // pop coordinate transformation
  st = flipY(st);
  st -= offset;

  return texture2D(sampler, imageSt);
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

// Color adjustment functions
vec4 adjustSaturation(vec4 color, float multiplier) {
  vec3 hsl = rgbTohsl(color.rgb);
  hsl.g *= multiplier;
  vec3 rgb = hslTorgb(hsl);
  return vec4(rgb, color.a);
}

vec4 adjustContrast(vec4 color, float exponent) {
  return vec4(pow(color.r, exponent), pow(color.g, exponent),
              pow(color.b, exponent), color.a);
}

vec4 adjustBrightness(vec4 color, float multiplier) {
  return vec4(color.rgb * multiplier, color.a);
}

bool withinBounds(float value, vec2 bounds) {
  return clamp(value, bounds.x, bounds.y) == value;
}

// Color thresholding functions
vec4 thresholdLightness(vec4 color, vec2 threshold) {
  vec3 hsl = rgbTohsl(color.rgb);
  float lightness = clamp(hsl.b, 0.0, 1.0);
  float alpha = withinBounds(lightness, threshold) ? color.a : 0.0;
  return vec4(color.rgb, alpha);
}

vec4 thresholdSat(vec4 color, vec2 threshold) {
  vec3 hsl = rgbTohsl(color.rgb);
  float sat = clamp(hsl.g, 0.0, 1.0);
  float alpha = withinBounds(sat, threshold) ? color.a : 0.0;
  return vec4(color.rgb, alpha);
}

vec4 thresholdHue(vec4 color, vec2 threshold) {
  vec3 hsl = rgbTohsl(color.rgb);
  float hue = clamp(hsl.r, 0.0, 1.0);
  float alpha = withinBounds(hue, threshold) ? color.a : 0.0;
  return vec4(color.rgb, alpha);
}

vec4 addFrame(vec2 st, vec2 size, vec4 color, vec4 frameColor) {
  float hiddenX = step(abs(0.5 - st.x), (1.0 - size.x) / 2.0);
  float hiddenY = step(abs(0.5 - st.y), (1.0 - size.y) / 2.0);
  float hidden = min(hiddenX, hiddenY);
  return mix(frameColor, color, hidden);
}

vec4 singingElmo(vec2 st) {
  vec4 color =
      colorFromSampler(st, u_singing_elmo, vec2(320), vec2(0.15, 0.0), 0.85);
  vec4 singingElmoBody = thresholdHue(color, vec2(0.95, 1.0));
  vec4 singingElmoFace = thresholdHue(color, vec2(0.0, 0.48));
  color = mix(singingElmoBody, singingElmoFace, singingElmoFace.a);
  color.a *= step(st.x, 0.5);
  return color;
}

vec4 darkElmo(vec2 st) {
  vec4 color = colorFromSampler(st, u_elmo_dark, vec2(3147, 2518),
                                vec2(-0.075, 0.0), 0.175);
  color = thresholdLightness(color, vec2(0.01, 1.0));
  color = adjustBrightness(color, 1.5);
  return color;
}

vec4 shockedElmo(vec2 st) {
  vec4 color =
      colorFromSampler(st, u_shocked_elmo, vec2(272., 268.), vec2(0.025), 1.2);
  vec4 elmoEyesAndNose = thresholdHue(color, vec2(0.0, 0.44));
  vec4 elmoBody = thresholdHue(color, vec2(0.952, 1.0));
  vec4 elmoMouth = thresholdLightness(color, vec2(0.0, 0.115));
  vec4 elmoFace = mix(elmoEyesAndNose, elmoMouth, elmoMouth.a);
  vec4 elmo = mix(elmoBody, elmoFace, elmoFace.a);
  elmo = adjustBrightness(elmo, 1.5);
  elmo = adjustContrast(elmo, 3.5);
  elmo = adjustSaturation(elmo, 0.0);
  return elmo;
}

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution;
  st = scaleImage(st, 0.75);

  vec4 flames = colorFromSampler(st, u_flames, u_flames_res, vec2(0.0), 1.25);
  vec4 singingElmo = singingElmo(st);
  vec4 darkElmo = darkElmo(st);
  vec4 shockedElmo = shockedElmo(st);

  vec4 background = mix(flames + darkElmo, flames + singingElmo, singingElmo.a);

  vec4 color = mix(background, shockedElmo, shockedElmo.a);
  color = addFrame(st, vec2(0.5, 0.5), color, BLACK);
  gl_FragColor = color;
}