import * as T from 'three';import * as K from '../brik/brik.js';import * as W from '../brik/world.js';import {andy,julia,bob,jake,cop} from '../brik/chars.js';
export async function build({scene,cam}){K.sky(scene,['#1a1240','#4a2a7a','#c06090','#ffb070','#ffe8a0']);W.fog(scene,0xc890a0,700,2600);
 W.lights(scene,{dir:[-200,400,200],sun:0xffe0b0,si:2.0,ext:300,hi:0.6,target:[0,0,0]});
 // cliff road on left, canyon drop right
 W.terrain(scene,{x0:-50,z0:-80,w:50,l:100,step:2,y0:-160,colors:['#6a5a4a','#7a6a52','#8a7a5a'],hf:(x,z)=>156+K.noise(x*4,z*4)*3});
 const road=[];for(let z=-80;z<20;z+=4)for(let x=-16;x<0;x+=4)road.push({x:(x+2)*8,y:1.6,z:(z+2)*8,sx:31.8,sy:3.2,sz:31.8,color:'#3a3a42',noStud:true});K.instBricks(scene,road);
 W.terrain(scene,{x0:-500,z0:-600,w:1000,l:80,step:12,y0:-500,colors:['#3a2a4a','#4a3a5a','#6a4a6a'],snow:60,hf:(x,z)=>Math.max(0,500+300*Math.sin(x*0.003)+K.noise(x,z)*150)});
 W.water(scene,{x0:0,z0:-80,w:80,l:100,y:-150,step:4,amp:1});
 // broken guardrail bricks flying
 let r=9;const rn=()=>{r=(r*16807)%2147483647;return r/2147483647};
 for(let i=0;i<14;i++){const b=K.brick(1+Math.floor(rn()*3),1,3,i%2?'#e8e8e8':'#c8102e');b.position.set(-10+rn()*120,0+rn()*80,-40+rn()*100);b.rotation.set(rn()*6,rn()*6,rn()*6);scene.add(b)}
 // semi lifted in beam
 const sm=W.semi({color:'#14141a',brand:'FREEDOMLINER',trailerColor:'#1d2a6a',trailerInk:'#fff',trailerText:'EAGLE EXPRESS',trailerSub:'UNLIMITED ROCKETS • NO REFUNDS'});sm.position.set(60,70,40);sm.rotation.set(0.1,0.35,-0.15);scene.add(sm);K.bankStuds(sm);
 const a=andy({armRot:[[2.9,0.3],[2.9,-0.3]],mood:'grin'});a.position.set(-9,6,-2);sm.add(a);
 const j=julia({armRot:[[2.9,0.4],[2.9,-0.4]]});j.position.set(4,73.2,-60);sm.add(j);
 const B=bob({});B.position.set(-8,73.2,-90);sm.add(B);const J=jake({});J.position.set(10,73.2,-100);sm.add(J);
 // golden beam
 const gold=new T.Color('#ffd86a');
 const beam=new T.Mesh(new T.CylinderGeometry(60,110,900,40,1,true),new T.MeshBasicMaterial({color:gold.clone().multiplyScalar(1.4),transparent:true,opacity:.06,side:2,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));beam.position.set(60,420,10);scene.add(beam);
 const core=new T.Mesh(new T.CylinderGeometry(25,55,900,32,1,true),new T.MeshBasicMaterial({color:gold.clone().multiplyScalar(1.6),transparent:true,opacity:.08,side:2,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));core.position.copy(beam.position);scene.add(core);
 const pl=new T.PointLight(0xffe0a0,9000,600,1.5);pl.position.set(60,200,80);scene.add(pl);
 // sparkles
 for(let i=0;i<80;i++){const s=new T.Mesh(new T.OctahedronGeometry(1+rn()*2),new T.MeshBasicMaterial({color:new T.Color('#fff4c0').multiplyScalar(3),toneMapped:false}));const ang=rn()*6.28,rad=rn()*90;s.position.set(60+Math.cos(ang)*rad,-40+rn()*360,10+Math.sin(ang)*rad);scene.add(s)}
 // glowing music notes (choir)
 for(let i=0;i<7;i++){const n=new T.Group();const hd=new T.Mesh(new T.SphereGeometry(4,16,12),new T.MeshBasicMaterial({color:new T.Color('#fff0a0').multiplyScalar(2.5),toneMapped:false}));hd.scale.set(1.3,1,0.6);const st=new T.Mesh(new T.BoxGeometry(1.2,16,1.2),hd.material);st.position.set(4.6,8,0);n.add(hd,st);n.position.set(-10+i*28,200+Math.sin(i)*30,40);n.rotation.z=0.2*Math.sin(i*2);scene.add(n)}
 // police car tumbling into the canyon
 const cc=W.copCar();cc.position.set(120,-80,-60);cc.rotation.set(0.6,0.8,2.4);scene.add(cc);K.bankStuds(cc);
 cam.position.set(170,130,430);cam.lookAt(45,85,0);cam.fov=50;cam.updateProjectionMatrix();
 return {bloom:0.8,bloomTh:0.85,overlay:[
  {k:'bubble',x:40,y:40,w:560,lines:['JESUS, TAKE THE WHEEL!'],tx:520,ty:560,fs:44},
  {k:'burst',x:800,y:250,r:140,t:'HALLELU-WHOOSH!',c1:'#fff3a0',c2:'#e0a010',rot:8,fs:46},
  {k:'bubble',x:40,y:200,w:400,lines:['AAAAAH-MEN!','(the choir, probably)'],tx:330,ty:400,fs:30},
  {k:'title',t:'RESCUE: JESUS, TAKE THE WHEEL!',sub:'Near-crash? Golden light lifts the rig back on the road'}]}}
