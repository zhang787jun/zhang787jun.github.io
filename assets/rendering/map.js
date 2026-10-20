export function create(canvas) {
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');
  let w=1,h=1,px=0,py=0;
  return {backend:'canvas2d',resize(width,height){w=width;h=height;const d=Math.min(devicePixelRatio||1,2);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);},pointer(x,y){px=x;py=y;},draw(t){
    ctx.clearRect(0,0,w,h);
    const labels=['计算机科学','数据科学','产品与应用','战略与管理'];
    const nodes=labels.map((label,i)=>({label,x:w*(i%2?.72:.28)+px*8,y:h*(i<2?.30:.72)+py*8}));
    ctx.strokeStyle=t.line;ctx.lineWidth=1;
    nodes.forEach((a,i)=>nodes.slice(i+1).forEach(b=>{ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}));
    nodes.forEach(a=>{ctx.fillStyle=t.bg;ctx.beginPath();ctx.arc(a.x,a.y,30,0,Math.PI*2);ctx.fill();ctx.strokeStyle=t.accent;ctx.stroke();ctx.fillStyle=t.accent;ctx.beginPath();ctx.arc(a.x,a.y,5,0,Math.PI*2);ctx.fill();ctx.fillStyle=t.ink;ctx.textAlign='center';ctx.font='13px system-ui, sans-serif';ctx.fillText(a.label,a.x,a.y+51);});
  },dispose(){canvas.width=1;canvas.height=1;}};
}
