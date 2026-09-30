import{W as G,S as N,P as B,I as L,a as I,A as T,G as W,M as _,e as D,f as F,B as j,d as Y,b as q,g as O,h as X,C as k}from"./three.module-lSLBP-Qe.js";const H=`
vec3 mod289(vec3 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 permute(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`,V=`
uniform float uTime;
varying vec3 vNormalV;
varying vec3 vViewPos;
${H}
void main() {
  float t = uTime * 0.32;
  float d = snoise(normalize(position) * 1.5 + t) * 0.42
          + snoise(normalize(position) * 3.2 - t * 1.7) * 0.15;
  vec3 p = position + normal * d;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vViewPos = mv.xyz;
  vNormalV = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mv;
}
`,U=`
precision highp float;
uniform float uTime;
varying vec3 vNormalV;
varying vec3 vViewPos;
void main() {
  vec3 N = normalize(vNormalV);
  vec3 V = normalize(-vViewPos);
  float fres = pow(1.0 - abs(dot(N, V)), 1.8);
  vec3 c1 = vec3(0.0, 0.94, 1.0);
  vec3 c2 = vec3(0.48, 0.36, 1.0);
  vec3 c3 = vec3(1.0, 0.18, 0.65);
  vec3 col = mix(c2, c1, smoothstep(0.0, 1.0, fres));
  col = mix(col, c3, pow(fres, 3.0));
  col += c3 * pow(fres, 7.0) * 1.1;
  gl_FragColor = vec4(col * 0.85, 1.0);
}
`,$=`
precision mediump float;
void main() {
  gl_FragColor = vec4(0.48, 0.36, 1.0, 0.08);
}
`;function J(){const t=document.createElement("canvas");t.width=t.height=256;const n=t.getContext("2d"),o=n.createRadialGradient(128,128,0,128,128,128);return o.addColorStop(0,"rgba(123,92,255,0.5)"),o.addColorStop(.45,"rgba(123,92,255,0.15)"),o.addColorStop(1,"rgba(123,92,255,0)"),n.fillStyle=o,n.fillRect(0,0,256,256),new X(t)}function K(t,n){if(!t)return;let o;try{o=new G({antialias:!0,alpha:!0})}catch{return}o.setClearColor(0,0),t.appendChild(o.domElement);const v=new N,l=new B(50,1,.1,100);l.position.z=4.6;const p=window.matchMedia("(max-width: 768px)").matches,d={uTime:{value:0}},w=new L(1.5,p?32:64),A=new I({uniforms:d,vertexShader:V,fragmentShader:U}),R=new I({uniforms:d,vertexShader:V,fragmentShader:$,wireframe:!0,transparent:!0,depthWrite:!1,blending:T}),a=new W;a.add(new _(w,A)),a.add(new _(w,R));const g=new D(new F({map:J(),blending:T,depthWrite:!1,transparent:!0,opacity:.9}));g.scale.setScalar(7.5),a.add(g),v.add(a);const z=p?260:520,x=new Float32Array(z*3);for(let e=0;e<z;e++){const r=6+Math.random()*7,i=Math.random()*Math.PI*2,h=Math.acos(2*Math.random()-1);x[e*3]=r*Math.sin(h)*Math.cos(i),x[e*3+1]=r*Math.sin(h)*Math.sin(i),x[e*3+2]=r*Math.cos(h)}const b=new j;b.setAttribute("position",new Y(x,3)),v.add(new q(b,new O({color:8423864,size:.02,transparent:!0,opacity:.7})));function M(){const e=t.clientWidth||innerWidth,r=t.clientHeight||innerHeight;o.setPixelRatio(Math.min(devicePixelRatio||1,2)),o.setSize(e,r,!1),l.aspect=e/r,l.updateProjectionMatrix();const i=e/r;a.position.x=i>1.05?Math.min(1.9,(i-1)*1.2+.5):0,a.scale.setScalar(p?.78:1)}M(),addEventListener("resize",M);let m=!1,y=0,f=0;const c={x:.15,y:.4},s={x:.15,y:.4};let u=0;t.addEventListener("pointerdown",e=>{m=!0,y=e.clientX,f=e.clientY,t.setPointerCapture(e.pointerId)}),t.addEventListener("pointermove",e=>{if(!m)return;const r=e.clientX-y,i=e.clientY-f;y=e.clientX,f=e.clientY,s.y+=r*.006,s.x=Math.max(-1.1,Math.min(1.1,s.x+i*.004)),u=r*.006});const S=()=>m=!1;t.addEventListener("pointerup",S),t.addEventListener("pointercancel",S);let C=!0;"IntersectionObserver"in window&&new IntersectionObserver(([e])=>C=e.isIntersecting).observe(t);const P=new k;function E(){if(requestAnimationFrame(E),!C||document.hidden)return;const e=Math.min(P.getDelta(),.05);d.uTime.value=P.elapsedTime,m||(u*=.94,s.y+=u+e*.1),c.x+=(s.x-c.x)*.08,c.y+=(s.y-c.y)*.08,a.rotation.x=c.x,a.rotation.y=c.y,o.render(v,l)}if(n.reduced){d.uTime.value=5,o.render(v,l);return}E()}function Z(t){K(document.getElementById("blob"),t);const n=document.getElementById("roadline");n&&(t.gsap.to(n,{scaleY:1,ease:"none",scrollTrigger:{trigger:".roadmap",start:"top 72%",end:"bottom 58%",scrub:.5}}),document.querySelectorAll(".roadmap__item").forEach(o=>{t.ScrollTrigger.create({trigger:o,start:"top 62%",once:!0,onEnter:()=>o.classList.add("is-lit")})}))}export{Z as default};
