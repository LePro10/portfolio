import{g as h}from"./main-Dbt68BfR.js";import{W as E,S as T,P as B,a as S,A as b,V as I,G as L,b as A,c as H,B as W,d as w,C as k}from"./three.module-lSLBP-Qe.js";const P=`
uniform float uTime;
uniform float uSize;
uniform vec3 uMouse;
attribute float aScale;
attribute float aHue;
varying float vHue;
varying float vA;
void main() {
  vec3 p = position;
  float t = uTime * 0.55;
  p.x += sin(p.y * 1.6 + t + aHue * 6.2831) * 0.09;
  p.y += cos(p.z * 1.4 + t * 1.2 + aHue * 3.1415) * 0.09;
  p.z += sin(p.x * 1.8 + t * 0.8) * 0.07;
  vec2 d = p.xy - uMouse.xy;
  float dist = length(d);
  float push = smoothstep(1.1, 0.0, dist) * 0.45;
  p.xy += normalize(d + vec2(0.0001)) * push;
  p.z += push * 0.35 * sin(aHue * 40.0 + uTime);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * aScale * (1.0 / max(0.001, -mv.z));
  vHue = aHue;
  vA = 0.5 + 0.5 * sin(uTime * 1.3 + aHue * 40.0);
}
`,z=`
precision mediump float;
varying float vHue;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float alpha = smoothstep(0.5, 0.03, d);
  vec3 c1 = vec3(0.0, 0.94, 1.0);
  vec3 c2 = vec3(0.48, 0.36, 1.0);
  vec3 c3 = vec3(1.0, 0.18, 0.65);
  vec3 col = vHue < 0.5 ? mix(c1, c2, vHue / 0.5) : mix(c2, c3, (vHue - 0.5) / 0.5);
  gl_FragColor = vec4(col, alpha * (0.22 + 0.6 * vA));
}
`;function C(e,n,o,c,d){const t=new Float32Array(e*3),a=new Float32Array(e),r=new Float32Array(e);for(let i=0;i<e;i++){const p=n+Math.random()*(o-n),m=Math.random()*Math.PI*2,v=Math.acos(2*Math.random()-1);t[i*3]=p*Math.sin(v)*Math.cos(m),t[i*3+1]=p*Math.sin(v)*Math.sin(m),t[i*3+2]=p*Math.cos(v)*.72,a[i]=c+Math.random()*(d-c),r[i]=Math.random()}const l=new W;return l.setAttribute("position",new w(t,3)),l.setAttribute("aScale",new w(a,1)),l.setAttribute("aHue",new w(r,1)),l}function F(e,n){if(!e)return;let o;try{o=new E({antialias:!1,alpha:!0,powerPreference:"high-performance"})}catch{return}const c=window.matchMedia("(max-width: 768px)").matches;o.setClearColor(0,0),e.appendChild(o.domElement);const d=new T,t=new B(60,1,.1,100);t.position.z=4.4;const a={uTime:{value:0},uSize:{value:c?34:42},uMouse:{value:new I(999,999,0)}},r=new S({uniforms:a,vertexShader:P,fragmentShader:z,transparent:!0,depthWrite:!1,blending:b}),l=new L;l.add(new A(C(c?2600:5600,.85,2.4,.4,1.7),r));const i={...a,uSize:{value:c?90:120}},p=new S({uniforms:i,vertexShader:P,fragmentShader:z,transparent:!0,depthWrite:!1,blending:b});l.add(new A(C(c?60:110,.9,2.2,2,3.2),p)),d.add(l);function m(){const u=e.clientWidth||innerWidth,s=e.clientHeight||innerHeight;o.setPixelRatio(Math.min(devicePixelRatio||1,2)),o.setSize(u,s,!1),t.aspect=u/s,t.updateProjectionMatrix()}m(),addEventListener("resize",m);const v=new H(99,99),f=new H(999,999);e.addEventListener("pointermove",u=>{const s=e.getBoundingClientRect();v.x=(u.clientX-s.left)/s.width*2-1,v.y=-((u.clientY-s.top)/s.height*2-1)}),e.addEventListener("pointerleave",()=>v.set(99,99));let g=!0;"IntersectionObserver"in window&&new IntersectionObserver(([u])=>g=u.isIntersecting).observe(e);const y=new k,M=()=>Math.tan(t.fov*Math.PI/360)*t.position.z;function x(){if(requestAnimationFrame(x),!g||document.hidden)return;const u=Math.min(y.getDelta(),.05),s=y.elapsedTime;a.uTime.value=s,i.uTime.value=s,f.lerp(v,.07),a.uMouse.value.set(f.x*M()*t.aspect,f.y*M(),0),i.uMouse.value.copy(a.uMouse.value),l.rotation.y+=u*.06,l.rotation.x=Math.sin(s*.14)*.12,o.render(d,t)}if(n.reduced){a.uTime.value=8,i.uTime.value=8,o.render(d,t);return}x()}function _(e){F(document.getElementById("hero-canvas"),e),R(e)}function R(e){const n=document.getElementById("preview");if(!n)return;const o=!window.matchMedia("(hover: none), (pointer: coarse)").matches;if(e.reduced||!o)return;h.set(n,{xPercent:-50,yPercent:-50,scale:.85});let c=0,d=0,t=0,a=0;addEventListener("mousemove",r=>{c=r.clientX,d=r.clientY}),h.ticker.add(()=>{t+=(c-t)*.13,a+=(d-a)*.13,n.style.left=t+"px",n.style.top=a+"px"}),document.querySelectorAll("#chapters .row").forEach(r=>{r.addEventListener("mouseenter",()=>{n.style.background=r.dataset.bg||"",h.to(n,{opacity:1,scale:1,duration:.45,ease:"power3.out"})}),r.addEventListener("mouseleave",()=>{h.to(n,{opacity:0,scale:.85,duration:.35,ease:"power3.in"})})})}export{_ as default};
