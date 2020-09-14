#ifdef GL_ES
precision mediump float;
#endif

#define CENTER vec2(.5)

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform vec2 u_rect_size;

// Thresholds across both axes, and then
// combines them with multiplication
float rectangle(vec2 st){
    vec2 sides=step(abs(st),u_rect_size/2.);
    return sides.x*sides.y;
}

void main(){
    vec2 st=gl_FragCoord.xy/u_resolution;
    
    // Center the coordinate system
    st-=CENTER;
    
    float val=rectangle(st);
    vec3 color=mix(vec3(0.,0.,1.),vec3(1.,1.,1.),val);
    gl_FragColor=vec4(color,1.);
}