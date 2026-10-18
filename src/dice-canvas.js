import * as THREE from 'three';

// CPU projection uses the same physical body's transform and numbered faces.
// Only drawing changes when WebGL is unavailable.
export class CanvasDiceRenderer {
  constructor(canvas, getItems, faces) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.getItems=getItems;this.faces=faces;
    this.shadowMap={};this.ratio=1;
  }
  setPixelRatio(r){this.ratio=r;}
  setSize(w,h){this.canvas.width=Math.round(w*this.ratio);this.canvas.height=Math.round(h*this.ratio);}
  dispose(){}
  render(scene,camera){
    const c=this.ctx,w=this.canvas.width,h=this.canvas.height;
    if(!c||!w||!h)return;
    c.clearRect(0,0,w,h);camera.updateMatrixWorld();camera.updateProjectionMatrix();
    const project=v=>{const p=v.clone().project(camera);return{x:(p.x+1)*w/2,y:(1-p.y)*h/2,z:p.z};};
    const dots={1:[[0,0]],2:[[-.23,-.23],[.23,.23]],3:[[-.23,-.23],[0,0],[.23,.23]],4:[[-.23,-.23],[-.23,.23],[.23,-.23],[.23,.23]],5:[[-.23,-.23],[-.23,.23],[0,0],[.23,-.23],[.23,.23]],6:[[-.23,-.23],[-.23,0],[-.23,.23],[.23,-.23],[.23,0],[.23,.23]]};
    for(const {mesh} of this.getItems()||[]){
      const shadow=project(new THREE.Vector3(mesh.position.x,0,mesh.position.z));
      c.fillStyle='#092b3d55';c.beginPath();c.ellipse(shadow.x,shadow.y,w*.075,h*.055,0,0,Math.PI*2);c.fill();
      const polys=[];
      for(const f of this.faces){
        const normal=new THREE.Vector3(...f.v),u=Math.abs(normal.y)>.5?new THREE.Vector3(1,0,0):new THREE.Vector3(0,1,0),v=new THREE.Vector3().crossVectors(normal,u);
        const point=(x,y)=>normal.clone().multiplyScalar(.5).addScaledVector(u,x).addScaledVector(v,y).applyQuaternion(mesh.quaternion).add(mesh.position);
        const center=point(0,0),worldNormal=normal.clone().applyQuaternion(mesh.quaternion);
        if(worldNormal.dot(camera.position.clone().sub(center))<=0)continue;
        const corners=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([x,y])=>project(point(x,y)));
        polys.push({f,point,center,corners,shade:worldNormal.dot(new THREE.Vector3(-.3,1,.5).normalize())});
      }
      polys.sort((a,b)=>b.center.distanceToSquared(camera.position)-a.center.distanceToSquared(camera.position));
      for(const {f,point,corners,shade} of polys){
        c.beginPath();corners.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();
        c.fillStyle=`hsl(43 65% ${76+shade*15}%)`;c.fill();c.strokeStyle='#9a7947';c.lineWidth=2*this.ratio;c.stroke();
        for(const [x,y] of dots[f.n]){const p=project(point(x,y)),edge=project(point(x+.055,y));c.fillStyle='#493523';c.beginPath();c.arc(p.x,p.y,Math.max(2*this.ratio,Math.hypot(edge.x-p.x,edge.y-p.y)),0,Math.PI*2);c.fill();}
      }
    }
  }
}
