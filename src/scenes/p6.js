import * as T from 'three';import * as K from '../brik/brik.js';import * as W from '../brik/world.js';import {mountie,bob,jake,andy,julia} from '../brik/chars.js';
export async function build({scene,cam}){K.sky(scene,['#0c1a4a','#2a5aa8','#7ab8e8','#ffe0b0']);W.fog(scene,0x9ab8d8,900,3000);
 W.lights(scene,{dir:[300,400,300],sun:0xfff0d8,si:2.6,ext:250,hi:0.8,target:[0,0,0]});
 W.plate(scene,-60,-120,120,160,'#8a8a92',0,8);
 const road=[];for(let z=-120;z<40;z+=4)for(let x=-12;x<12;x+=4)road.push({x:(x+2)*8,y:1.6,z:(z+2)*8,sx:31.8,sy:3.2,sz:31.8,color:'#3a3a42',noStud:true});K.instBricks(scene,road);
 for(let i=0;i<6;i++){const p=new T.Mesh(new T.CylinderGeometry(16+i*2,16+i*2,1.2,24),K.plastic('#b8600a',{rough:.05,opacity:.85}));p.position.set(-80+((i*61)%170),3.8,40-((i*97)%300));p.scale.z=0.6;scene.add(p)}
 const cols=['#4a8a9a','#5a9aaa','#3a6a8a','#7aaab8','#c8d8e0'];
 for(let i=0;i<8;i++){W.tower(scene,-170-((i*37)%60),-60-i*120,8+(i%3)*2,8,16+((i*31)%30),cols[i%5],0.3,i+3);W.tower(scene,170+((i*41)%60),-60-i*120,8,8,14+((i*29)%34),cols[(i+2)%5],0.3,i+9)}
 W.terrain(scene,{x0:-400,z0:-300,w:800,l:40,step:10,colors:['#1f3a2a','#2a4a3a','#3a4a55'],snow:60,hf:(x,z)=>Math.max(0,500*Math.exp(-((x+200)**2)/(2*600**2))+120+K.noise(x,z)*100)});
 const s1=W.sign("TIM HORTOFF'S",110,22,'#c8102e','#fff');s1.position.set(-120,80,-80);s1.rotation.y=0.5;scene.add(s1);
 const s2=W.sign('NO CATS • SORRY',100,18,'#fff','#c8102e','bold 80px Anton');s2.position.set(130,70,-120);s2.rotation.y=-0.5;scene.add(s2);
 // Mountie A: Bob on his face
 const mA=mountie({armRot:[[2.6,0.6],[2.4,-0.6]],legRot:[0.3,-0.4]});mA.position.set(-6,0,20);mA.rotation.set(-0.25,0.2,0.1);scene.add(mA);
 const B=bob({pounce:true,angry:true,mouthOpen:true});B.position.set(-2,40,28);B.rotation.set(0.2,-0.9,0.4);scene.add(B);
 // scratch marks (glowing)
 for(let i=0;i<3;i++){const sc=new T.Mesh(new T.BoxGeometry(1.2,16,0.6),new T.MeshBasicMaterial({color:new T.Color('#fff2a0').multiplyScalar(3),toneMapped:false}));sc.position.set(-30+i*4,40,30);sc.rotation.z=0.5;scene.add(sc)}
 // Mountie B on moose, Jake leaping with hairball
 const mo=W.moose();mo.position.set(70,0,-30);mo.rotation.y=-0.9;scene.add(mo);
 const mB=mountie({armRot:[[2.8,0.3],[0.4,0]],mood:'scared'});mB.position.set(70,40,-30);mB.rotation.y=-0.9;scene.add(mB);
 const J=jake({pounce:true,angry:true,mouthOpen:true});J.position.set(28,26,46);J.rotation.set(-0.2,-0.5,0);scene.add(J);
 const hb=new T.Mesh(new T.IcosahedronGeometry(6,1),K.plastic('#7a7e70',{rough:.9}));hb.position.set(52,40,8);scene.add(hb);
 for(let i=0;i<10;i++){const s=new T.Mesh(new T.IcosahedronGeometry(1.6+i*0.25,1),new T.MeshBasicMaterial({color:0xdddddd,transparent:true,opacity:.6-i*.05}));s.position.set(30+i*2.2,32+i*0.8,40-i*3.2);scene.add(s)}
 K.explosion(scene,new T.Vector3(95,50,-60),40,23);
 // Mountie C running away
 const mC=mountie({armRot:[[2.9,0.2],[2.9,-0.2]],legRot:[0.7,-0.7],mood:'scared'});mC.position.set(-70,0,-40);mC.rotation.y=2.5;scene.add(mC);
 // background semi w/ Andy & Julia cheering
 const sm=W.semi({color:'#14141a',brand:'FREEDOMLINER',trailerColor:'#1d2a6a',trailerInk:'#fff',trailerText:'EAGLE EXPRESS',trailerSub:'UNLIMITED ROCKETS • NO REFUNDS'});sm.position.set(-20,0,-200);sm.rotation.y=0.6;scene.add(sm);K.bankStuds(sm);
 const j=julia({armRot:[[2.9,0.3],[2.9,-0.3]]});j.position.set(4,73.2,-60);sm.add(j);
 cam.position.set(0,52,215);cam.lookAt(12,40,-10);cam.fov=45;cam.updateProjectionMatrix();
 return {bloom:0.6,bloomTh:0.9,overlay:[
  {k:'burst',x:200,y:380,r:120,t:'HISS-POW!',c1:'#ffe14d',c2:'#e0103a',rot:-10,fs:70},
  {k:'burst',x:880,y:760,r:110,t:'SORRY-SPLAT!',c1:'#7af0ff',c2:'#c2185b',rot:8,fs:46},
  {k:'bubble',x:580,y:60,w:440,lines:['SORRY! SORRY!','NICE KITTY, EH?!'],tx:830,ty:380,fs:34},
  {k:'bubble',x:640,y:900,w:330,lines:['HAIRBALL OUT!'],tx:650,ty:780,fs:34},
  {k:'title',t:'BOB & JAKE: CLAWS OUT, EH',sub:'The Helvie kitties take on the Mounties in Vancouver'}]}}
