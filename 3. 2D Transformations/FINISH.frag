#ifdef GL_ES
precision mediump float;
#endif

#define CENTER vec2(0.5)
#define SIZE vec2(0.5)
#define SCALE 0.5

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

// Thresholds across both axes, and then
// combines them with multiplication
float rectangle(vec2 st){
    vec2 sides = step(abs(st), SIZE/2.0);
    return sides.x*sides.y;
}

vec2 translateInCircle(vec2 st){
    vec2 translation=vec2(cos(u_time),sin(u_time))*.25;
    return st + translation;
}

float translatedRectangle(vec2 st){
    vec2 translatedSt=translateInCircle(st);
    return rectangle(translatedSt);
}

float scaledRectangle(vec2 st){
    vec2 scaledSt = st * (1.0/SCALE);
    return rectangle(scaledSt);
}

vec2 cartesianToPolar(vec2 st) {
    float dist = length(st);
    float angle = atan(st.y/st.x);
    return vec2(
        dist,
        angle
    );
}

vec2 polarToCartesian(vec2 st) {
    float dist = st.x;
    float angle = st.y;
    return vec2(
        dist * cos(angle),
        dist * sin(angle)
    );
}

vec2 polarRotate(vec2 st) {
    vec2 polarCoord = cartesianToPolar(st);
    vec2 rotatedPolarCoord = vec2(polarCoord.x, polarCoord.y + u_time);
    return polarToCartesian(rotatedPolarCoord);
}

vec2 rotateCoord(vec2 st, vec2 origin) {
   	vec2 polarCoord = cartesianToPolar(st);
    vec2 rotatedPolarCoord = vec2(polarCoord.x, polarCoord.y + u_time);
    return polarToCartesian(rotatedPolarCoord);
}

float rotatedRect(vec2 st) {
    vec2 rotatedSt = rotateCoord(st, CENTER);
    return rectangle(rotatedSt);
}

float transformedRectangle(vec2 st) {
    vec2 translatedSt = translateInCircle(st);
    vec2 scaledSt = translatedSt * (1.0/SCALE);
    vec2 rotatedSt = rotateCoord(scaledSt, CENTER);
    return rectangle(rotatedSt);
}

void main(){
    vec2 st=gl_FragCoord.xy/u_resolution;
    
    // Center the coordinate system
    st-=CENTER;
    
    float val=transformedRectangle(st);
    vec3 color=vec3(val);
    gl_FragColor=vec4(color,1.);
}