#ifdef GL_ES
precision mediump float;
#endif

#define CENTER vec2(.5)

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform vec2 u_rect_size;

// 2D MATRICES
//  _________________________________
// |             |             |     |
// | s.x / r cos |   r -sine   | t.x |
// |_____________|_____________|_____|
// |             |             |     |
// |   r sine    | s.t / r cos | t.y |
// |_____________|_____________|_____|
// |             |             |     |
// |     0.0     |     0.0     | 1.0 |
// |_____________|_____________|_____|

// Thresholds across both axes, and then
// combines them with multiplication
float rectangle(vec2 st){
    vec2 sides=step(abs(st),u_rect_size/2.);
    return sides.x*sides.y;
}

// Translation
// =========================================================

mat3 createTranslationMatrix(vec2 translation){
    return mat3(
        1.,0.,translation.x,
        0.,1.,translation.y,
        0.,0.,1.
    );
}

vec2 translateInCircle(vec2 st){
    // Translation can be as simple as adding to the coordinate
    // or as complex as creating a transformation matrix.
    
    vec2 translation=vec2(cos(u_time),sin(u_time))*.25;
    // return st + translation;
    
    mat3 translationMatrix=createTranslationMatrix(translation);
    
    // This API doesn't support 3x2 matrices so we'll need to convert st to a vec3.
    return(vec3(st,1.)*translationMatrix).xy;
}

float translatedRectangle(vec2 st){
    vec2 translatedSt=translateInCircle(st);
    return rectangle(translatedSt);
}

void main(){
    vec2 st=gl_FragCoord.xy/u_resolution;
    
    // Center the coordinate system
    st-=CENTER;
    
    float val=translatedRectangle(st);
    vec3 color=mix(vec3(0.,0.,1.),vec3(1.,1.,1.),val);
    gl_FragColor=vec4(color,1.);
}