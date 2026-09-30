'use client';

/* eslint-disable react-hooks/immutability -- three.js-Uniforms und Texturen werden pro Frame
   imperativ verändert. Das ist das vorgesehene R3F-Muster; React rendert dabei nichts neu. */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { heightAt, insideRing, randomGenerator } from './terrain';
import { earthVertex, mountainVertex, particleFragment } from './shaders';

type Land = { features: { geometry: { type: string; coordinates: number[][][] | number[][][][] } }[] };
type Input = { pointer: THREE.Vector2; velocity: THREE.Vector2; active: number; scroll: number; wind: number };
const damping = (a: number, b: number, speed: number, dt: number) => THREE.MathUtils.damp(a,b,speed,dt);

function makeGeometry(positions: number[], seeds: number[], lights: number[]) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('aSeed',new THREE.Float32BufferAttribute(seeds,1));
  geometry.setAttribute('aLight',new THREE.Float32BufferAttribute(lights,1));
  return geometry;
}
function mountainGeometry(mobile: boolean) {
  const random=randomGenerator(73), positions:number[]=[], seeds:number[]=[], lights:number[]=[];
  const nx=mobile?235:390, nz=mobile?128:205;
  for(let i=0;i<nx;i++) for(let j=0;j<nz;j++) {
    const gx=i/(nx-1)*2-1,gz=j/(nz-1)*2-1;
    const x=Math.sign(gx)*Math.pow(Math.abs(gx),1.35)*8+(random()-.5)*.032;
    const z=Math.sign(gz)*Math.pow(Math.abs(gz),1.2)*4+(random()-.5)*.032;
    const h=heightAt(x,z);
    const slope=(heightAt(x+.035,z)-h)/.035;
    const ridge=Math.max(0,Math.min(1,(h-(heightAt(x-.08,z)+heightAt(x+.08,z))/2)*45));
    const float=random()>.988 ? random()*.55 : 0;
    positions.push(x,h-1.45+float,z);
    seeds.push(random());
    lights.push((.12+random()*.4+ridge*.34+Math.max(0,-slope)*.11)*(float>0?.35:1));
  }
  return makeGeometry(positions,seeds,lights);
}
function earthGeometry(land: Land, mobile: boolean) {
  const polygons=land.features.flatMap(f=>f.geometry.type==='Polygon'?[f.geometry.coordinates as number[][][]]:f.geometry.coordinates as number[][][][]).map(rings=>({rings,minX:Math.min(...rings[0].map(p=>p[0])),maxX:Math.max(...rings[0].map(p=>p[0])),minY:Math.min(...rings[0].map(p=>p[1])),maxY:Math.max(...rings[0].map(p=>p[1]))}));
  const positions:number[]=[],seeds:number[]=[],lights:number[]=[],random=randomGenerator(144);
  const step=mobile?1.02:.72;
  for(let lat=-85;lat<86;lat+=step) {
    const latitude=lat*Math.PI/180;
    const count=Math.floor(360*Math.cos(latitude)/step);
    for(let j=0;j<count;j++) {
      const lon=j/count*360-180;
      const isLand=polygons.some(p=>lon>=p.minX&&lon<=p.maxX&&lat>=p.minY&&lat<=p.maxY&&insideRing(lon,lat,p.rings[0])&&!p.rings.slice(1).some(r=>insideRing(lon,lat,r)));
      // Keep a quiet ocean lattice for the scan to uncover.
      if(!isLand&&random()>.65) continue;
      if(isLand&&random()<.035) continue;
      const lng=(lon+(random()-.5)*step*.22)*Math.PI/180;
      const phi=latitude+(random()-.5)*step*.18*Math.PI/180;
      const radius=2.65+(random()-.5)*.012;
      positions.push(radius*Math.cos(phi)*Math.sin(lng),radius*Math.sin(phi),radius*Math.cos(phi)*Math.cos(lng));
      seeds.push(random()); lights.push(isLand?.38+random()*.52:.025+random()*.035);
    }
  }
  return makeGeometry(positions,seeds,lights);
}

export function Scene({onError}:{onError:()=>void}) {
  const {size,gl,camera}=useThree();
  const mobile=size.width<700;
  // The mobile canvas height is locked in CSS; track its actual dimensions.
  const stableViewport=useRef({width:size.width,height:size.height});
  const [land,setLand]=useState<Land|null>(null);
  const mountain=useMemo(()=>mountainGeometry(mobile),[mobile]);
  const earth=useMemo(()=>land?earthGeometry(land,mobile):null,[land,mobile]);
  const mountainRef=useRef<THREE.Points>(null),earthRef=useRef<THREE.Points>(null);
  const input=useRef<Input>({pointer:new THREE.Vector2(3,3),velocity:new THREE.Vector2(),active:0,scroll:0,wind:0});
  const reduced=useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const motion=useRef({earthTime:0,scroll:0,touch:false,touchDown:false,lastTouch:0});
  // A small persistent screen-space height field retains the entire swipe.
  const cloth=useMemo(()=>{
    const width=96,height=64,data=new Uint8Array(width*height);
    const texture=new THREE.DataTexture(data,width,height,THREE.RedFormat);
    texture.minFilter=texture.magFilter=THREE.LinearFilter;
    texture.needsUpdate=true;
    return {width,height,data,heights:new Float32Array(width*height),texture};
  },[]);
  const trailTarget=useMemo(()=>new THREE.Vector3(),[]);
  const uniforms=useMemo(()=>({uTime:{value:0},uProgress:{value:0},uWind:{value:0},uDpr:{value:1},uActive:{value:0},uPointer:{value:new THREE.Vector2(3,3)},uVelocity:{value:new THREE.Vector2()},uResolution:{value:new THREE.Vector2()},uReveal:{value:0},uTrail:{value:Array.from({length:8},()=>new THREE.Vector3(3,3,0))},uCloth:{value:cloth.texture}}),[cloth]);
  useEffect(()=>{const controller=new AbortController(); fetch('/land.geojson',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('Land data unavailable');return r.json()}).then(setLand).catch(e=>{if(e.name!=='AbortError')onError()});return()=>controller.abort()},[onError]);
  useEffect(()=>()=>mountain.dispose(),[mountain]);
  useEffect(()=>()=>earth?.dispose(),[earth]);
  useEffect(()=>()=>cloth.texture.dispose(),[cloth]);
  useEffect(()=>{
    camera.position.set(0,3.2,12.8); camera.lookAt(0,.65,0);
    stableViewport.current={width:size.width,height:size.height};
    uniforms.uResolution.value.set(stableViewport.current.width,stableViewport.current.height);
    uniforms.uDpr.value=gl.getPixelRatio();
  },[camera,size.width,size.height,gl,uniforms,mobile]);
  useEffect(()=>{
    let lastY=window.scrollY,lastTime=performance.now(),lastPointer=performance.now();
    const scroll=()=>{const now=performance.now(),dt=Math.max(16,now-lastTime);input.current.wind=THREE.MathUtils.clamp((window.scrollY-lastY)/dt*.7,-3.5,3.5);lastY=window.scrollY;lastTime=now;const track=document.querySelector<HTMLElement>('.scene-track');input.current.scroll=window.scrollY/Math.max(1,track?track.offsetHeight-window.innerHeight*2:document.documentElement.scrollHeight-window.innerHeight);if(motion.current.touch){motion.current.lastTouch=now;input.current.active=1}};
    const position=(clientX:number,clientY:number)=>{const now=performance.now(),dt=Math.max(16,now-lastPointer);const rect=gl.domElement.getBoundingClientRect();const x=(clientX-rect.left)/Math.max(1,rect.width)*2-1,y=1-(clientY-rect.top)/Math.max(1,rect.height)*2;const old=input.current.pointer;if(old.x<2)input.current.velocity.set(THREE.MathUtils.clamp((x-old.x)*100/dt,-2,2),THREE.MathUtils.clamp((y-old.y)*100/dt,-2,2));old.set(x,y);input.current.active=1;lastPointer=now;};
    const pointer=(event:PointerEvent)=>{if(event.pointerType==='touch')return;motion.current.touch=false;position(event.clientX,event.clientY)};
    // Touch events keep arriving after the browser cancels pointer events for native scrolling.
    const touch=(event:TouchEvent)=>{const point=event.touches[0];if(!point)return;motion.current.touch=true;motion.current.touchDown=true;motion.current.lastTouch=performance.now();position(point.clientX,point.clientY)};
    const leave=()=>{input.current.active=0;motion.current.touchDown=false};
    const up=(e:PointerEvent)=>{if(e.pointerType!=='mouse')leave()};
    const visibility=()=>{if(document.hidden){input.current.wind=0;input.current.active=0}};
    const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
    const motionChange=()=>{reduced.current=motionPreference.matches};
    window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',scroll,{passive:true});window.addEventListener('touchstart',touch,{passive:true});window.addEventListener('touchmove',touch,{passive:true});window.addEventListener('touchend',leave,{passive:true});window.addEventListener('touchcancel',leave,{passive:true});window.addEventListener('pointermove',pointer,{passive:true});window.addEventListener('pointerdown',pointer,{passive:true});window.addEventListener('pointerup',up,{passive:true});document.addEventListener('pointerleave',leave);window.addEventListener('blur',leave);document.addEventListener('visibilitychange',visibility);motionPreference.addEventListener('change',motionChange);scroll();
    return()=>{window.removeEventListener('scroll',scroll);window.removeEventListener('resize',scroll);window.removeEventListener('touchstart',touch);window.removeEventListener('touchmove',touch);window.removeEventListener('touchend',leave);window.removeEventListener('touchcancel',leave);window.removeEventListener('pointermove',pointer);window.removeEventListener('pointerdown',pointer);window.removeEventListener('pointerup',up);document.removeEventListener('pointerleave',leave);window.removeEventListener('blur',leave);document.removeEventListener('visibilitychange',visibility);motionPreference.removeEventListener('change',motionChange)};
  },[gl]);
  useFrame((_,rawDt)=>{
    const dt=Math.min(rawDt,.05),u=uniforms,i=input.current;
    if(document.hidden)return;
    u.uTime.value+=dt*(reduced.current?.12:1);
    motion.current.scroll=damping(motion.current.scroll,THREE.MathUtils.clamp(i.scroll,0,1),8,dt);
    u.uProgress.value=damping(u.uProgress.value,motion.current.scroll,5,dt);
    if(motion.current.touch&&!motion.current.touchDown&&performance.now()-motion.current.lastTouch>180)i.active=0;
    u.uWind.value=damping(u.uWind.value,reduced.current?0:i.wind,1.8,dt);i.wind=damping(i.wind,0,.55,dt);
    u.uPointer.value.lerp(i.pointer,1-Math.exp(-dt*6));
    u.uVelocity.value.lerp(i.velocity,1-Math.exp(-dt*5));i.velocity.multiplyScalar(Math.exp(-dt*4));
    u.uActive.value=damping(u.uActive.value,i.active,i.active?4:.8,dt);
    // Frames can run before the resolution effect: never poison the persistent
    // height field with 0 / 0 on a cold load.
    const aspect=Math.max(1,size.width)/Math.max(1,size.height);
    const rise=1-Math.exp(-dt*12),fall=1-Math.exp(-dt*(reduced.current?8:1.25));
    for(let y=0;y<cloth.height;y++)for(let x=0;x<cloth.width;x++){
      const dx=((x+.5)/cloth.width*2-1-u.uPointer.value.x)*aspect;
      const dy=(y+.5)/cloth.height*2-1-u.uPointer.value.y;
      const target=Math.exp(-(dx*dx+dy*dy)*16)*i.active*(reduced.current?.25:1);
      const index=y*cloth.width+x,current=cloth.heights[index];
      cloth.heights[index]=current+(target-current)*(target>current?rise:fall);
      cloth.data[index]=Math.round(cloth.heights[index]*255);
    }
    cloth.texture.needsUpdate=true;
    const trail=u.uTrail.value;
    for(let j=7;j>0;j--)trail[j].lerp(trail[j-1],1-Math.exp(-dt*5));
    trailTarget.set(i.pointer.x,i.pointer.y,Math.max(i.active,motion.current.touch?Math.min(1,Math.abs(u.uWind.value)*.7):0));
    // The active scan point is immediate; only the trailing history is damped.
    trail[0].copy(trailTarget);
    u.uReveal.value=THREE.MathUtils.smoothstep(u.uProgress.value,.88,1);
    if(mountainRef.current){mountainRef.current.visible=u.uProgress.value<.99;mountainRef.current.scale.set(mobile?.80:1,mobile?.96:1,1)}
    if(u.uProgress.value>.59)motion.current.earthTime+=dt*(reduced.current?.12:1);
    if(earthRef.current){earthRef.current.visible=u.uProgress.value>.88;earthRef.current.rotation.y=-.18+motion.current.earthTime*Math.PI*2/100;earthRef.current.rotation.x=.11;const viewWidth=2*Math.tan(THREE.MathUtils.degToRad(24))*13*stableViewport.current.width/stableViewport.current.height;const scale=mobile?viewWidth*.90/5.3:Math.min(1.15,viewWidth*.56/5.3);earthRef.current.scale.setScalar(scale);earthRef.current.position.y=.65-(reduced.current?0:.65)*(1-u.uReveal.value);}
    document.documentElement.style.setProperty('--progress',String(u.uProgress.value));
    document.documentElement.style.setProperty('--mountain-label',String(1-THREE.MathUtils.smoothstep(u.uProgress.value,.08,.30)));
    const titleShift=THREE.MathUtils.smoothstep(u.uProgress.value,.04,.86);
    document.documentElement.style.setProperty('--mountain-shift',String(titleShift));
    document.documentElement.style.setProperty('--mountain-title-shift',`${-titleShift*stableViewport.current.height*.18}px`);
    document.documentElement.style.setProperty('--earth-label',String(THREE.MathUtils.smoothstep(u.uProgress.value,.90,.99)));
  });
  // Fast Refresh replaces memoized uniforms; remount materials to clear Three's uniform cache.
  return <>
    <points ref={mountainRef} geometry={mountain} frustumCulled={false}><shaderMaterial key={cloth.texture.uuid} uniforms={uniforms} vertexShader={mountainVertex} fragmentShader={particleFragment} transparent depthWrite={false} blending={THREE.AdditiveBlending}/></points>
    {earth&&<points ref={earthRef} geometry={earth} frustumCulled={false}><shaderMaterial key={cloth.texture.uuid} uniforms={uniforms} vertexShader={earthVertex} fragmentShader={particleFragment} transparent depthWrite={false} blending={THREE.AdditiveBlending}/></points>}
  </>;
}


