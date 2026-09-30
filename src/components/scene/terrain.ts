const fract = (n: number) => n - Math.floor(n);
const hash = (x: number, y: number) => fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);
function noise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y);
  let fx = fract(x), fy = fract(y);
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return a + (b-a)*fx + (c-a)*fy*(1-fx) + (d-b)*fx*fy;
}
export function heightAt(x: number, z: number) {
  const peak = (cx: number, cz: number, h: number, w: number) => h * Math.exp(-Math.sqrt((x-cx)**2 + (z-cz)**2 * 1.7) * w);
  const mass = peak(-.6,-.45,3.9,.85) + peak(1.15,-.85,3.1,1.1) + peak(-2.3,.15,1.85,1.25) + peak(2.9,.5,1.3,1.35);
  const envelope = Math.exp(-x*x/28-z*z/11);
  let detail = 0, amplitude = .55, frequency = .9;
  for (let i=0;i<5;i++) { detail += (1-Math.abs(noise(x*frequency+12,z*frequency+8)*2-1))*amplitude; amplitude *= .48; frequency *= 2.1; }
  const gullies = Math.abs(Math.sin(Math.atan2(z+.5,x+.6)*7 + noise(x*1.5,z*1.5)*2));
  return Math.max(0, mass*.85 + envelope*(detail*.85 - gullies*.34) + .07*Math.sin(x*1.3+z*2));
}
export function insideRing(x: number, y: number, ring: number[][]) {
  let inside = false;
  for (let i=0,j=ring.length-1;i<ring.length;j=i++) {
    const a=ring[i],b=ring[j];
    if ((a[1]>y)!==(b[1]>y) && x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) inside=!inside;
  }
  return inside;
}
export function randomGenerator(seed: number) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
