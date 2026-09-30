export const mountainVertex = /* glsl */ `
uniform float uTime, uProgress, uWind, uDpr, uActive;
uniform vec2 uPointer, uVelocity, uResolution;
uniform sampler2D uCloth;
attribute float aSeed, aLight;
varying float vAlpha;
void main() {
  vec3 p = position;
  vec4 original = projectionMatrix * modelViewMatrix * vec4(p,1.);
  vec2 screen = original.xy / original.w;
  float local = texture2D(uCloth,clamp(screen*.5+.5,0.,1.)).r;
  // Coherent lift: the stored height at each location settles independently.
  p.y += local*.85;
  p.z += local*.16;
  vec3 scatter=vec3(sin(aSeed*731.),cos(aSeed*517.),sin(aSeed*931.+2.));
  float wave = sin(p.x*.8+p.z*1.3-uTime*2.);
  float wind=uWind*.35*smoothstep(.02,.3,uProgress)*(1.-smoothstep(.7,.98,uProgress));
  p.x += wind*(scatter.x*.3+wave*.16);
  // Keep ordinary scroll shear mostly horizontal; the strong lift belongs to breakup.
  p.y += wind*(.055+aSeed*.10)+abs(wind)*scatter.y*.035;
  p.z += wind*scatter.z*.3;
  // The first few wheel steps lift the terrain as a quiet gesture, followed
  // by a broad, individual particle breakup band.
  float prelift = smoothstep(.008,.20,uProgress);
  p.y += prelift*(.08 + aSeed*.10);
  p.x += prelift*sin(aSeed*24.)*.045;
  float earlySmear = smoothstep(.0,.11,uProgress);
  p += earlySmear*scatter*(.10 + aSeed*.14);
  float depart = smoothstep(aSeed*.06+.06,aSeed*.10+.92,uProgress);
  float force = depart*depart*(.78+.22*aSeed);
  p.x += force*(scatter.x*6.2+position.x*.24);
  p.y += force*(8.5+aSeed*10.5) + sin(depart*5.+aSeed*9.)*depart*.35;
  p.z += force*scatter.z*3.4;
  vec4 mv = modelViewMatrix*vec4(p,1.);
  gl_Position = projectionMatrix*mv;
  gl_PointSize = clamp((.75+aSeed*.85)*uDpr*9./(-mv.z),.65,3.2*uDpr);
  vAlpha = aLight * (1.-smoothstep(5.8,8.,abs(position.x))) * (.78+local*.55)
    * (1.-smoothstep(.65+aSeed*.12,.98,uProgress));
}`;
export const particleFragment = /* glsl */ `
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord-.5);
  float shape = 1.-smoothstep(.16,.5,d);
  if(d>.5) discard;
  gl_FragColor = vec4(vec3(.91,.925,.92),shape*vAlpha);
}`;
export const earthVertex = /* glsl */ `
uniform float uTime,uReveal,uDpr,uActive;
uniform vec2 uResolution;
uniform vec3 uTrail[8];
attribute float aSeed,aLight;
varying float vAlpha;
void main() {
  float group = fract(sin(floor(position.x*6.)*12.9898+floor(position.y*7.)*78.233+floor(position.z*6.)*31.7)*43758.5453);
  float visible = smoothstep(group*.65,group*.65+.28,uReveal);
  vec3 p=position*(1.+(1.-visible)*.11);
  vec4 mv = modelViewMatrix*vec4(p,1.);
  vec4 projected = projectionMatrix*mv;
  vec2 screen=projected.xy/projected.w;
  float light=0.;
  for(int i=0;i<8;i++) {
    vec2 d=(screen-uTrail[i].xy)*vec2(uResolution.x/uResolution.y,1.);
    float organic = 1.+.19*sin(p.y*23.+uTime*1.3)*sin(p.x*17.-uTime);
    light += exp(-dot(d,d)*30.*organic)*uTrail[i].z*(1.-float(i)*.085)*.28;
  }
  vec3 normal=normalize(mat3(modelViewMatrix)*normalize(position));
  float front=smoothstep(-.05,.25,normal.z);
  float sun=.34+.66*max(0.,dot(normal,normalize(vec3(-.65,.65,.8))));
  float scan=pow(max(0.,sin(p.y*13.+p.x*7.-uTime*.7)),18.)*.11;
  float land=step(.2,aLight);
  float contours=pow(.5+.5*sin(p.y*24.+sin(p.x*8.+p.z*6.)*2.),5.);
  float ocean=.0015+light*(.09+contours*.22)*(.7+aSeed*.3);
  float landLight=aLight*(sun*.72+light*1.4+scan)+.012;
  vAlpha=mix(ocean,landLight,land)*visible*front;
  gl_Position=projected;
  gl_PointSize=(1.+aSeed*.65)*uDpr*(.9+light*.25);
}`;
