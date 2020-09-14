#ifdef GL_ES
precision mediump float;
#endif

#define BLUE vec4(0, 0, 1, 1)
#define MASK vec4(0.44, 0.98, 0.0, 1)

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform sampler2D u_rex;
uniform float u_threshold;
uniform float u_gradient_width;
uniform sampler2D u_background;

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

float thresholdX(vec2 st, float threshold) {
    return step(st.x, threshold);
}

float smoothThresholdX(vec2 st, float threshold, float gradientWidth) {
    return smoothstep(threshold - gradientWidth, threshold + gradientWidth, st.x);
}

vec4 colorFromSampler(vec2 st, sampler2D sampler) {
    st.y = 1.0 - st.y;
    return texture2D(sampler, st);
}

vec4 createForeground(vec2 st, sampler2D sampler) {
    vec4 color = colorFromSampler(st, sampler);
    vec3 hsl = rgbTohsl(color.rgb);
    vec3 maskHsl = rgbTohsl(MASK.rgb);
    vec3 diff = hsl - maskHsl;
    
    //float alpha = step(color.g, u_threshold);
//    float alpha = smoothstep(u_threshold - u_gradient_width, u_threshold + u_gradient_width, 1.0 - color.g);
    float alpha = smoothstep(u_threshold - u_gradient_width, u_threshold + u_gradient_width, length(diff));
    
    color.a = alpha;
    return color;
}

vec4 multiplyBlend(vec4 background, vec4 foreground) {
    vec3 color = background.rgb * foreground.rgb;
    vec4 blended = vec4(color, background.a);
    return mix(background, blended, foreground.a);
}

vec4 screenBlend(vec4 background, vec4 foreground) {
    vec4 multipliedColor = multiplyBlend(background, foreground);
    vec3 color = (background.rgb + foreground.rgb) - multipliedColor.rgb;
    vec4 blended = vec4(color, background.a);
    return mix(background, blended, foreground.a);
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution;
    //float x = thresholdX(st, u_threshold);
    
    //float x = smoothThresholdX(st, u_threshold, u_gradient_width);
    //vec4 color = vec4(vec3(x), 1.0);
    
    vec4 background = colorFromSampler(st, u_background);
    vec4 foreground = createForeground(st, u_rex);
//    vec4 color = mix(background, foreground, foreground.a);
    //vec4 color = multiplyBlend(background, foreground);
    vec4 color = screenBlend(background, foreground);
    gl_FragColor = color;
}