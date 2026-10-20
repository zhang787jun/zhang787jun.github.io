import * as THREE from '../vendor/three/three.webgpu.js';
// TSL nodes compile to WGSL on WebGPU or GLSL on the WebGL2 fallback.
const {color, mix, positionLocal} = THREE.TSL;
export async function create(canvas) {
  let adapter=null;
  try {adapter=await navigator.gpu?.requestAdapter();} catch {}
  const options={canvas,alpha:true,antialias:true};
  if(!adapter){options.forceWebGL=true;options.context=canvas.getContext('webgl2',{alpha:true,antialias:true,preserveDrawingBuffer:true});if(!options.context)throw new Error('WebGL2 unavailable');}
  const renderer=new THREE.WebGPURenderer(options);
  try {await renderer.init();} catch(e){renderer.dispose();throw e;}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
  const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(32,1,.1,30);
  camera.position.set(0,0,8);
  const group=new THREE.Group();scene.add(group);
  const materials=[],geometries=[];
  for(let i=0;i<3;i++){
    const geometry=new THREE.BoxGeometry(2.05,1.45,.055);geometries.push(geometry);
    const material=new THREE.MeshStandardNodeMaterial({roughness:.85,metalness:0});
    material.colorNode=mix(color(i===1?'#809583':'#e7e4da'),color('#b6c4af'),positionLocal.y.add(.725).div(1.45));
    materials.push(material);const mesh=new THREE.Mesh(geometry,material);mesh.position.set((i-1)*.32,(i-1)*.17,(i-1)*.24);mesh.rotation.z=(i-1)*.13;group.add(mesh);
  }
  scene.add(new THREE.AmbientLight(0xffffff,2));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-3,4,6);scene.add(light);
  let lost=false;canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;canvas.closest('.rendering-stage')?.removeAttribute('data-ready');});
  return {backend:renderer.backend.isWebGPUBackend?'webgpu-tsl':'webgl2-tsl',resize(w,h){camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);},pointer(x,y){group.rotation.set(-.3+y*.25,-.35+x*.4,.05);},draw(){if(lost)return;group.rotation.x|| (group.rotation.x=-.3);group.rotation.y|| (group.rotation.y=-.35);renderer.render(scene,camera);},dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();}};
}
