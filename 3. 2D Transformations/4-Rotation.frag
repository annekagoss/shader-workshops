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

// Scale
// =========================================================
mat3 createScaleMatrix(vec2 scale){
    return mat3(
        scale.x,0.,0.,
        0.,scale.y,0.,
        0.,0.,1.
    );
}

vec2 scaleCoord(vec2 st){
    // Invert the scale so the shape is larger
    // relative to the shrunk coordinate system
    
    // return st * 1.0/u_scale;
    
    float scale=1./u_scale;
    mat3 scaleMatrix=createScaleMatrix(vec2(scale));
    return(vec3(st,1.)*scaleMatrix).xy;
}

float scaledRectangle(vec2 st){
    vec2 scaledSt=scaleCoord(st);
    vec2 scaledCenter=scaleCoord(CENTER);
    return rectangle(scaledSt);
}

// Rotation
// =========================================================

//                / y
//               /
//         dist /
//             /  0 angle
//            /______ x

vec2 cartesianToPolar(vec2 st){
    float dist=length(st);
    float angle=atan(st.y/st.x);
    return vec2(dist,angle);
}

vec2 polarToCartesian(vec2 st){
    float dist=st.x;
    float angle=st.y;
    return vec2(
        dist*cos(angle),
        dist*sin(angle)
    );
}

vec2 polarRotate(vec2 st){
    vec2 polarCoord=cartesianToPolar(st);
    vec2 rotatedPolarCoord=vec2(polarCoord.x,polarCoord.y+u_time);
    return polarToCartesian(rotatedPolarCoord);
}

mat3 createRotationMatrix(float angle,float dist){
    return mat3(
        cos(u_time),-sin(u_time),dist,
        sin(u_time),cos(u_time),dist,
        0.,0.,1.
    );
}

vec2 rotate(vec2 st,vec2 center){
    // Here are two fairly complicated ways to rotate a coordinate system.
    // 1. Converting to a polar coordinate, then incrementing the angle, then
    // converting back to cartesian.
    // 2. Creating a transformation matrix.
    
    return polarRotate(st);
    
    mat3 rotationMatrix=createRotationMatrix(u_time,0.);
    return(vec3(st,1.)*rotationMatrix).xy;
}

float rotatedRect(vec2 st){
    vec2 rotatedSt=rotate(st,CENTER);
    return rectangle(rotatedSt);
}

void main(){
    vec2 st=gl_FragCoord.xy/u_resolution;
    
    // Center the coordinate system
    st-=CENTER;
    
    float val=scaledRectangle(st);
    vec3 color=mix(vec3(0.,0.,1.),vec3(1.,1.,1.),val);
    gl_FragColor=vec4(color,1.);
}