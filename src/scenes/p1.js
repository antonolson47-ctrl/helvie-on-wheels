import * as T from 'three';import * as K from '../brik/brik.js';import * as W from '../brik/world.js';import {andy} from '../brik/chars.js';
export async function build({scene,cam}){K.sky(scene,['#140a3a','#4a1a7a','#c8407a','#ff8a4a','#ffd27a']);
 W.lights(scene,{dir:[-400,200,-300],sun:0xffb080,si:2.8,ext:200,hi:0.9,rim:0xff7ac8,target:[0,0,0]});
 // far ground below: water + city + mountain
 const low=new T.Group();scene.add(low);
 W.water({add:o=>low.add(o)}.add?scene:scene,{x0:-400,z0:-500,w:800,l:300,step:8,amp:1,y:-2600});
 W.terrain(scene,{x0:-400,z0:-560,w:800,l:80,step:10,y0:-2600,colors:['#3a5a3a','#4a5a6a','#6a6a8a'],snow:30,hf:(x,z)=>Math.max(0,700*Math.exp(-((x-500)**2)/(2*400**2))+200+K.noise(x,z)*150)});
 for(let i=0;i<22;i++)W.tower(scene,-1400+i*90,-2600,8,8,14+((i*37)%30),['#5a5a7a','#6a5a6a','#4a5a6a'][i%3],0.65,i+3).position.y=-2600;
 // jet
 const j=W.jet();j.position.set(40,210,-560);j.rotation.set(0.1,-1.75,-0.15);scene.add(j);
 // contrail
 for(let i=0;i<10;i++){const c=new T.Mesh(new T.SphereGeometry(16+i*2,12,10),new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.25-i*0.02}));c.position.set(40+240+i*70,210+20,-560-30-i*10);scene.add(c)}
 // Andy freefalling
 const a=andy({suit:true,armRot:[[0.6,1.5],[0.9,1.3]],legRot:[0.5,-0.3]});a.rotation.set(-0.35,-0.35,0.3);a.position.set(0,0,0);scene.add(a);
 const pack=K.brick(3,2,5,'#4a5a2a');pack.position.set(0,14,-7);a.add(pack);const rip=new T.Mesh(new T.TorusGeometry(2,0.6,8,16),K.plastic('#e01b24'));rip.position.set(6,22,4.5);a.add(rip);
 // briefcase open with bonds pouring
 const bc=new T.Group();const base=K.brick(4,2,3,'#6a4320',{tile:true});bc.add(base);const lid=K.brick(4,1,3,'#6a4320',{tile:true});lid.position.set(0,9,-10);lid.rotation.x=-1.2;bc.add(lid);const hd=new T.Mesh(new T.TorusGeometry(3,0.7,8,16,Math.PI),K.plastic('#222'));hd.position.set(0,10,0);bc.add(hd);
 bc.position.set(75,30,-90);bc.rotation.set(0.5,0.3,-0.6);scene.add(bc);
 let r=3;const rn=()=>{r=(r*16807)%2147483647;return r/2147483647};
 for(let i=0;i<70;i++){const b=W.bond();const a2=rn()*Math.PI*2,d=35+rn()*170;b.position.set(Math.cos(a2)*d+30,20+(rn()-0.4)*200,-30-rn()*120);b.rotation.set(rn()*6,rn()*6,rn()*6);b.scale.setScalar(0.9);scene.add(b)}
 // clouds of bricks
 for(let i=0;i<8;i++){const cg=new T.Group();for(let k=0;k<6;k++){const b=K.brick(4+Math.floor(rn()*4),3+Math.floor(rn()*3),3,'#fbe8f0');b.position.set((rn()-.5)*80,(rn()-.5)*14,(rn()-.5)*40);cg.add(b)}cg.position.set(-500+i*160,-260-rn()*200,-600-rn()*400);scene.add(cg);K.bankStuds(cg)}
 cam.position.set(-25,75,115);cam.lookAt(15,12,-20);cam.fov=46;cam.updateProjectionMatrix();cam.updateMatrixWorld();{const d=new T.Vector3(0.05,0.62,0.5).unproject(cam).sub(cam.position).normalize();j.position.copy(cam.position).addScaledVector(d,1500);j.rotation.set(0.15,-2.0,-0.2);}
 return {bloom:0.55,bloomTh:0.92,overlay:[
  {k:'bubble',x:40,y:50,w:480,lines:['ALL THE BONDS IN THE','OVERHEAD BIN, PLEASE.','AND THE PRETZELS.'],tx:300,ty:520,fs:36},
  {k:'burst',x:840,y:980,r:95,t:'ZOWIE!',c1:'#7af0ff',c2:'#e0103a',rot:12,fs:66},
  {k:'caption',x:600,y:60,w:440,lines:['10,000 FT OVER SEATTLE-ISH.','$12,000,000 IN BEARER BONDS.','ZERO PARACHUTE LESSONS.'],fs:28},
  {k:'title',t:'PROLOGUE: FLIGHT 305-ISH',sub:'Andy cashes out at 10,000 ft • the chili "bomb" worked'}]}}
