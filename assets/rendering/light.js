// Analytic ray tracing: sphere intersections, shadow rays and one reflection bounce.
// This is a small WebGL fragment shader, not hardware ray-tracing / RTX.
const fragment=`precision highp float;
uniform vec2 resolution;uniform vec2 pointer;uniform vec3 background;uniform vec3 accent;
float hit(vec3 ro,vec3 rd,vec3 c,float r){vec3 o=ro-c;float b=dot(o,rd),d=b*b-dot(o,o)+r*r;if(d<0.)return -1.;float t=-b-sqrt(d);return t>.001?t:-1.;}
vec3 center(int i){if(i==0)return vec3(-.75,-.1,0.);if(i==1)return vec3(.65,.12,-.45);return vec3(0.,-.78,-.15);}
float radius(int i){return i==2?.22:.64;}
vec3 trace(vec3 ro,vec3 rd){vec3 result=vec3(0.);float weight=1.;for(int bounce=0;bounce<2;bounce++){float near=100.;int id=-1;for(int i=0;i<3;i++){float t=hit(ro,rd,center(i),radius(i));if(t>0.&&t<near){near=t;id=i;}}if(id<0){result+=weight*background;break;}vec3 p=ro+rd*near,n=normalize(p-center(id)),ld=normalize(vec3(-3.,4.,5.)-p);float shadow=1.;for(int i=0;i<3;i++){if(i!=id&&hit(p+n*.005,ld,center(i),radius(i))>0.)shadow=.32;}vec3 base=id==1?mix(accent,background,.65):accent;float diffuse=max(dot(n,ld),0.)*shadow;float spec=pow(max(dot(reflect(-ld,n),-rd),0.),48.)*.2;result+=weight*(base*(.35+.65*diffuse)+spec)*.78;weight*=.22;ro=p+n*.005;rd=reflect(rd,n);}return result;}
void main(){vec2 uv=(gl_FragCoord.xy/resolution-.5)*vec2(resolution.x/resolution.y,1.);vec3 ro=vec3(pointer*.3,4.);vec3 rd=normalize(vec3(uv*2.9,-4.));gl_FragColor=vec4(trace(ro,rd),1.);}`;
export function create(canvas){
 const gl=canvas.getContext('webgl',{alpha:false,antialias:false});if(!gl)throw new Error('WebGL unavailable');
 const shaders=[];let program,buffer;
 try {
 const compile=(type,source)=>{const s=gl.createShader(type);shaders.push(s);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
 program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Shader link failed');
 gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const p=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);
 } catch(e){shaders.forEach(s=>gl.deleteShader(s));if(program)gl.deleteProgram(program);throw e;}
 const uniform=n=>gl.getUniformLocation(program,n);const sample=document.createElement('canvas').getContext('2d');
 const rgb=color=>{sample.clearRect(0,0,1,1);sample.fillStyle=color;sample.fillRect(0,0,1,1);return [...sample.getImageData(0,0,1,1).data].slice(0,3).map(v=>v/255);};
 let x=0,y=0;canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();canvas.closest('.rendering-stage')?.removeAttribute('data-ready');});
 return {backend:'webgl-raytrace',resize(w,h){const d=Math.min(devicePixelRatio||1,1.5);canvas.width=w*d;canvas.height=h*d;gl.viewport(0,0,canvas.width,canvas.height);},pointer(a,b){x=a;y=-b;},draw(t){if(gl.isContextLost())return;gl.uniform2f(uniform('resolution'),canvas.width,canvas.height);gl.uniform2f(uniform('pointer'),x,y);gl.uniform3fv(uniform('background'),rgb(t.bg));gl.uniform3fv(uniform('accent'),rgb(t.accent));gl.drawArrays(gl.TRIANGLES,0,6);},dispose(){gl.deleteBuffer(buffer);shaders.forEach(s=>gl.deleteShader(s));gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext();}};
}
