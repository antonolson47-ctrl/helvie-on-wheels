import * as T from 'three';import * as K from '../brik/brik.js';import * as W from '../brik/world.js';import {andy,cop} from '../brik/chars.js';
export async function build({scene,cam}){K.sky(scene,['#2a0814','#8a1a1a','#ff4a1a','#ffaa3a']);W.fog(scene,0x6a2a2a,900,3000);
 W.lights(scene,{dir:[200,300,-400],sun:0xff9a50,si:2.0,ext:400,hi:0.6,rim:0xffaa66,target:[0,0,-100]});
 W.water(scene,{x0:-80,z0:-40,w:160,l:110,step:2,amp:1.4,y:0,color:'#1a5a9a'});
 // dock
 const dk=[];for(let x=-60;x<60;x+=2)dk.push({x:x*8+8,y:8,z:-30*8,sx:15.8,sy:3.2,sz:96,color:'#7a4a22'});K.instBricks(scene,dk);
 for(let x=-56;x<60;x+=8){const p=K.brick(1,1,6,'#4a2a12');p.position.set(x*8,-12,-196);scene.add(p)}
 // land + station
 W.plate(scene,-80,-120,160,84,'#5a5a62',9.6,8);
 const st=new T.Group();scene.add(st);st.position.set(-60,9.6,-430);
 const canopy=K.brick(30,12,2,'#f4f4f4');canopy.position.y=72;st.add(canopy);const cs=W.sign("GAS 'N' GULP MARINE FUEL",240,22,'#ffe14d','#c8102e');cs.position.set(0,86,48);st.add(cs);
 [-100,100].forEach(x=>{const c=K.brick(2,2,22,'#c8102e');c.position.set(x,0,0);st.add(c)});
 [-60,0,60].forEach(x=>{const p=W.pump();p.position.set(x,0,10);st.add(p)});
 const shop=K.brick(14,8,18,'#2a6ab0');shop.position.set(260,0,-30);st.add(shop);K.bankStuds(st);
 const ss=W.sign('BAIT • BEER • BAZOOKAS',110,16,'#111','#ffe14d','bold 90px Anton');ss.position.set(260,62,34);st.add(ss);
 // explosions
 K.explosion(scene,new T.Vector3(-60,60,-410),70,3);K.explosion(scene,new T.Vector3(110,40,-390),50,9);K.explosion(scene,new T.Vector3(-260,30,-420),45,5);
 // fires along dock
 for(let i=0;i<14;i++){const f=new T.Mesh(new T.ConeGeometry(10+((i*7)%8),40+((i*13)%30),6),new T.MeshBasicMaterial({color:new T.Color(i%2?'#ffb11f':'#ff4d0d').multiplyScalar(2.5),toneMapped:false,transparent:true,opacity:.9}));f.position.set(-420+i*62,30,-260-((i*37)%60));scene.add(f)}
 for(let i=0;i<6;i++){const sm=new T.Mesh(new T.IcosahedronGeometry(60+i*10,3),K.plastic('#2a2026',{rough:1}));sm.position.set(-300+i*120,200+i*30,-700);scene.add(sm)}
 // cops on dock
 [[-170,-205,0.7],[-110,-210,0.5],[-40,-215,0.4],[40,-220,0.2]].forEach(([x,z,r],i)=>{const c=cop({armRot:[[1.5,0],[1.4,0]],mood:i%2?'scared':'yell'});c.position.set(x,9.6+3.2,z);c.rotation.y=r;scene.add(c);const g=W.copCar?null:null;const bl=K.blaster('#222',14);bl.position.set(-3,-14,1.2);bl.rotation.z=-Math.PI/2;c.userData.arms[0].sh.add(bl)});
 const flyer=cop({mood:'scared',armRot:[[2.8,0.5],[2.8,0.5]]});flyer.position.set(-30,120,-460);flyer.rotation.set(0.6,0.4,1.8);scene.add(flyer);
 // speedboat + Andy
 const b=W.speedboat();b.position.set(10,4,20);b.rotation.y=0.9;b.rotation.z=-0.08;b.rotation.x=-0.06;scene.add(b);
 const a=andy({armRot:[[0.4,0.3],[1.5,0.2]],legRot:[0,0]});a.position.set(0,22,-10);a.rotation.y=-0.5;b.add(a);
 const gun=K.blaster('#333',26);gun.position.set(3,-14,1.2);gun.rotation.set(0,0,-Math.PI/2);a.userData.arms[1].sh.add(gun);
 const flash=new T.Mesh(new T.IcosahedronGeometry(5,0),new T.MeshBasicMaterial({color:new T.Color('#ffee88').multiplyScalar(3),toneMapped:false}));flash.position.set(3,-44,1.2);a.userData.arms[1].sh.add(flash);
 // wake
 for(let i=0;i<30;i++){const w=new T.Mesh(new T.BoxGeometry(6,3,6),K.plastic('#ffffff',{opacity:.85}));const t=i/30;w.position.set(30+Math.sin(0.9)*(-90-t*300)+(i%2?20:-20)*(1+t*2),3,40+Math.cos(0.9)*(-90-t*300));w.rotation.y=i;scene.add(w)}
 cam.position.set(120,60,170);cam.lookAt(-30,40,-120);cam.fov=52;cam.updateProjectionMatrix();
 return {bloom:0.8,bloomTh:0.85,overlay:[
  {k:'bubble',x:40,y:40,w:470,lines:['UNLEADED? NOPE.','FULL-SERVICE CARNAGE!'],tx:300,ty:410,fs:38},
  {k:'bubble',x:580,y:40,w:440,lines:['OUR UNION REP','IS ON FIRE!'],tx:700,ty:470,fs:36},
  {k:'burst',x:820,y:760,r:95,t:'KA-BLAM!',c1:'#ffe14d',c2:'#e0103a',rot:-10,fs:58},
  {k:'burst',x:560,y:300,r:75,t:'KA-BOOM!',c1:'#7af0ff',c2:'#c2185b',rot:10,fs:44},
  {k:'title',t:"INTERLUDE: GAS 'N' BLAST",sub:'Auto-fire marina shootout • everything is flammable'}]}}
