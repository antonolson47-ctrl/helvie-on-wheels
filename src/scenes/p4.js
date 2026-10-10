import * as T from 'three';import * as K from '../brik/brik.js';import * as W from '../brik/world.js';import {andy,julia,mountie,bob,jake} from '../brik/chars.js';
export async function build({scene,cam}){K.sky(scene,['#0c1a4a','#2a5aa8','#7ab8e8','#ffe0b0']);W.fog(scene,0x9ab8d8,2400,6000);
 W.lights(scene,{dir:[400,500,300],sun:0xfff0d8,si:2.6,ext:450,hi:0.8,target:[0,0,-100]});
 W.plate(scene,-120,-280,240,320,'#8a8a92',0,8);
 const road=[];for(let z=-280;z<40;z+=4)for(let x=-16;x<16;x+=4)road.push({x:(x+2)*8,y:1.6,z:(z+2)*8,sx:31.8,sy:3.2,sz:31.8,color:'#3a3a42',noStud:true});K.instBricks(scene,road);
 const dash=[];for(let z=-280;z<40;z+=10)dash.push({x:0,y:3.6,z:(z+2)*8,sx:4,sy:0.8,sz:30,color:'#f4f4f4',noStud:true});K.instBricks(scene,dash);
 // maple syrup puddles
 for(let i=0;i<9;i++){const p=new T.Mesh(new T.CylinderGeometry(14+((i*7)%14),14+((i*7)%14),1.2,24),K.plastic('#b8600a',{rough:.05,opacity:.85}));p.position.set(-110+((i*61)%220),3.8,-((i*137)%900));p.scale.z=0.6;scene.add(p)}
 // city: towers left & right, glassy greens (Vancouver)
 const cols=['#4a8a9a','#5a9aaa','#3a6a8a','#7aaab8','#c8d8e0'];
 for(let i=0;i<14;i++){W.tower(scene,-240-((i*53)%180),-80-i*140,8+(i%3)*2,8,20+((i*31)%40),cols[i%5],0.3,i+5);W.tower(scene,250+((i*41)%160),-80-i*140,8,8+(i%2)*2,18+((i*29)%44),cols[(i+2)%5],0.3,i+11)}
 // Canada-Place-ish sails at end
 for(let i=0;i<5;i++){const s=new T.Mesh(new T.ConeGeometry(40,110,4),K.plastic('#f4f4f4'));s.position.set(-200+i*90,55,-2300);scene.add(s)}
 // mountains backdrop
 W.terrain(scene,{x0:-500,z0:-480,w:1000,l:60,step:10,colors:['#1f3a2a','#2a4a3a','#3a4a55'],snow:60,hf:(x,z)=>Math.max(0,600*Math.exp(-((x+300)**2)/(2*700**2))+150+K.noise(x,z)*120)});
 // shop signs
 const s1=W.sign("TIM HORTOFF'S",120,24,'#c8102e','#fff');s1.position.set(-170,90,-60);s1.rotation.y=0.5;scene.add(s1);
 const s2=W.sign('SORRY WE\'RE OPEN • SORRY',140,18,'#fff','#c8102e','bold 80px Anton');s2.position.set(190,70,-150);s2.rotation.y=-0.6;scene.add(s2);
 const s3=W.sign('POUTINE ✚ PHARMACY',130,18,'#2a5aa8','#fff','bold 80px Anton');s3.position.set(-200,140,-400);s3.rotation.y=0.5;scene.add(s3);
 // semi 2 (black w/ flames)
 const sm=W.semi({color:'#14141a',brand:'FREEDOMLINER',trailerColor:'#1d2a6a',trailerInk:'#fff',trailerText:'EAGLE EXPRESS',trailerSub:'UNLIMITED ROCKETS • NO REFUNDS'});sm.position.set(-50,0,60);sm.rotation.y=-0.35;scene.add(sm);K.bankStuds(sm);
 const a=andy({armRot:[[1.3,0.1],[2.9,-0.5]]});a.position.set(-9,6,-2);sm.add(a);
 const wheelM=new T.Mesh(new T.TorusGeometry(7,1.2,10,24),K.plastic('#111'));wheelM.position.set(-9,31,7);wheelM.rotation.x=-0.5;sm.add(wheelM);
 // Julia on trailer roof with launcher
 const j=julia({armRot:[[1.5,0.0],[1.3,-0.3]],legRot:[0.4,-0.4],headRot:-0.8});j.position.set(4,73.2,-60);j.rotation.y=1.55;sm.add(j);
 const L=K.launcher(40,'#4f6b2e');L.position.set(-7,28,6);L.rotation.y=-Math.PI/2;j.add(L);const fl=new T.Mesh(new T.IcosahedronGeometry(6,1),new T.MeshBasicMaterial({color:new T.Color('#ffd040').multiplyScalar(3),toneMapped:false}));fl.position.set(-7,28,34);j.add(fl);
 // rocket trail + rack
 const rack=K.brick(4,2,6,'#4f6b2e');rack.position.set(-14,73.2,-120);sm.add(rack);for(let i=0;i<6;i++){const t=K.launcher(26,'#4f6b2e',false);t.position.set(-14+((i%3)-1)*9,95+Math.floor(i/3)*7,-120);t.rotation.y=Math.PI/2;sm.add(t)}
 const sign3=W.sign('∞',24,24,'#ffe14d','#111','bold 400px Arial');sign3.position.set(-14,121,-120);sm.add(sign3);
 // rockets in flight & targets behind (road -z = behind the truck? truck faces +z, pursuers behind at -z)
 const tgt=[[60,0,-420],[-60,0,-560],[100,0,-700]];
 tgt.forEach((p,i)=>{const mc=W.copCar({label:'RCMP-ISH • SORRY'});mc.position.set(...p);mc.rotation.y=0.1*(i-1);scene.add(mc);});
 K.explosion(scene,new T.Vector3(60,30,-420),55,11);K.explosion(scene,new T.Vector3(-60,30,-560),45,13);
 // flying mountie
 const m1=mountie({armRot:[[2.8,0.6],[2.6,0.6]],legRot:[0.8,-0.6]});m1.position.set(70,140,-380);m1.rotation.set(0.7,0.3,2.2);scene.add(m1);
 const m2=mountie({armRot:[[0.4,0],[0.4,0]],mood:'scared'});m2.position.set(120,3.2,-200);m2.rotation.y=-0.5;scene.add(m2);
 // rocket from julia
 const rk=new T.Group();const body=new T.Mesh(new T.CylinderGeometry(2.6,2.6,16,12),K.plastic('#d22'));body.rotation.x=Math.PI/2;const tip=new T.Mesh(new T.ConeGeometry(2.6,6,12),K.plastic('#d22'));tip.rotation.x=-Math.PI/2;tip.position.z=-11;rk.add(body,tip);
 for(let i=0;i<14;i++){const sm2=new T.Mesh(new T.IcosahedronGeometry(3+i*0.8,2),new T.MeshBasicMaterial({color:new T.Color(i<3?'#ffcc33':'#dddddd').multiplyScalar(i<3?3:1),transparent:true,opacity:i<3?1:0.6-i*0.03,toneMapped:i>=3}));sm2.position.z=10+i*9;rk.add(sm2)}
 rk.position.set(10,140,-250);rk.lookAt(60,40,-420);rk.rotateY(Math.PI);scene.add(rk);
 // moose cameo
 const mo=W.moose();mo.position.set(200,3.2,-60);mo.rotation.y=-1.0;scene.add(mo);
 cam.position.set(110,95,330);cam.lookAt(10,55,-120);cam.fov=46;cam.updateProjectionMatrix();
 return {bloom:0.6,bloomTh:0.9,overlay:[
  {k:'bubble',x:40,y:40,w:500,lines:["HONEY, I BROUGHT THE","ROCKETS! ALL OF 'EM!"],tx:430,ty:470,fs:38},
  {k:'bubble',x:610,y:250,w:430,lines:['SORRY! SORRY!','...SORRY!'],tx:860,ty:620,fs:36},
  {k:'caption',x:40,y:930,w:600,lines:['VANCOUVER: WHERE THE BLOOD','RUNS LIKE MAPLE SYRUP. (IT IS SYRUP.)'],fs:28},
  {k:'burst',x:770,y:520,r:85,t:'EH-BOOM!',c1:'#ffe14d',c2:'#c8102e',rot:-8,fs:52},
  {k:'title',t:'ACT 3: EAGLE EXPRESS',sub:'Julia joins with UNLIMITED rocket launchers • Andy drives'}]}}
