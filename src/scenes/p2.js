import * as T from 'three';import * as K from '../brik/brik.js';import * as W from '../brik/world.js';import {andy,cop} from '../brik/chars.js';
export async function build({scene,cam}){K.sky(scene,['#1c0c44','#6a2080','#e0507a','#ff9a4a','#ffd27a']);W.fog(scene,0xc06080,1400,5000);
 W.lights(scene,{dir:[-300,260,-500],sun:0xffb070,si:2.6,ext:500,hi:0.8,rim:0xff9aff,target:[0,0,-100]});
 const fill=new T.DirectionalLight(0x9ab8ff,0.9);fill.position.set(300,200,600);scene.add(fill);
 // ground: grass plates + road
 W.plate(scene,-120,-260,240,300,'#3f7a3a',0,8);
 const road=[];for(let z=-260;z<40;z+=4)for(let x=-14;x<14;x+=4)road.push({x:(x+2)*8,y:1.6,z:(z+2)*8,sx:31.8,sy:3.2,sz:31.8,color:'#4a4a52',noStud:true});K.instBricks(scene,road);
 const dash=[];for(let z=-260;z<40;z+=10)dash.push({x:0,y:3.6,z:(z+2)*8,sx:4,sy:0.8,sz:30,color:'#ffd21a',noStud:true});[-1,1].forEach(s=>{for(let z=-260;z<40;z+=2)dash.push({x:s*110,y:3.6,z:z*8,sx:4,sy:0.8,sz:15,color:'#f4f4f4',noStud:true})});K.instBricks(scene,dash);
 // forests
 for(let i=0;i<70;i++){const s=i%2?1:-1;const x=s*(150+((i*53)%420));const z=-((i*97)%1900)+100;W.tree(scene,x,z,1.6+((i*7)%10)/10,i%3?'#1d5a2a':'#2a6a2a')}
 // mountains
 W.terrain(scene,{x0:-260,z0:-300,w:520,l:60,step:6,colors:['#4a5a3a','#5a5a6a','#6a6a7a','#7a7a8a'],snow:40,hf:(x,z)=>Math.max(0,300*Math.exp(-((x-200)**2)/(2*500**2))+160*(1+Math.sin(x*0.004))*0.6+K.noise(x,z)*60)});
 // city skyline left with needle tower
 for(let i=0;i<12;i++)W.tower(scene,-1300+i*70,-1900,6,6,10+((i*37)%25),['#5a5a7a','#6a5a6a','#4a5a6a'][i%3],0.55,i+2);
 const needle=new T.Group();const leg=new T.Mesh(new T.CylinderGeometry(6,14,320,8),K.plastic('#e8e8e8'));leg.position.y=160;const disc=new T.Mesh(new T.CylinderGeometry(60,30,24,24),K.plastic('#e8e8e8'));disc.position.y=330;const disc2=new T.Mesh(new T.CylinderGeometry(40,50,12,24),K.plastic('#ff8a3a'));disc2.position.y=348;const sp=new T.Mesh(new T.CylinderGeometry(2,4,80),K.plastic('#ddd'));sp.position.y=390;needle.add(leg,disc,disc2,sp);needle.position.set(-650,0,-1850);scene.add(needle);
 // semi (coming at camera)
 const s=W.semi({lights:0});s.position.set(-25,0,30);s.rotation.y=0.32;scene.add(s);K.bankStuds(s);
 const a=andy({armRot:[[1.3,0.1],[1.6,-0.2]],legRot:[-1.4,-1.4]});a.position.set(-9,6,-2);a.scale.setScalar(1);s.add(a);
 const wheel=new T.Mesh(new T.TorusGeometry(7,1.2,10,24),K.plastic('#111'));wheel.position.set(-9,31,7);wheel.rotation.x=-0.5;s.add(wheel);
 // cops
 const c1=W.copCar();c1.position.set(95,0,10);c1.rotation.y=-0.55;scene.add(c1);
 const c2=W.copCar();c2.position.set(-110,0,-120);c2.rotation.y=0.2;scene.add(c2);
 const c3=W.copCar();c3.position.set(40,0,-260);scene.add(c3);const c4=W.copCar();c4.position.set(-40,0,-380);scene.add(c4);
 const cp=cop({armRot:[[1.5,0],[0.2,0]],mood:'yell'});cp.position.set(18,10,-10);cp.rotation.y=0.2;c1.add(cp);
 const meg=new T.Mesh(new T.ConeGeometry(4,9,16,1,true),K.plastic('#f4f4f4',{side:2}));meg.rotation.x=-Math.PI/2;meg.position.set(24,30,6);c1.add(meg);
 // flying debris: smashed espresso kiosk
 const kiosk=K.brick(4,4,6,'#5a3412');kiosk.position.set(170,0,-80);kiosk.rotation.set(0.3,0.5,-0.4);scene.add(kiosk);K.bankStuds(kiosk);
 K.explosion(scene,new T.Vector3(75,18,45),20,7);const c5=W.copCar();c5.position.set(70,0,-110);scene.add(c5);const c6=W.copCar();c6.position.set(130,0,-200);c6.rotation.y=-0.2;scene.add(c6);const c7=W.copCar();c7.position.set(10,0,-520);scene.add(c7);
 const ks=W.sign('GRANDE DESTRUCTION',60,12,'#1d4a2a','#fff','bold 110px Anton');ks.position.set(160,70,-90);ks.rotation.set(0.2,-0.4,0.6);scene.add(ks);
 cam.position.set(120,34,300);cam.lookAt(10,40,-30);cam.fov=42;cam.updateProjectionMatrix();
 return {bloom:0.6,bloomTh:0.9,overlay:[
  {k:'bubble',x:40,y:60,w:470,lines:['THIS RIG HAS CRUISE','CONTROL?? SWEET!'],tx:330,ty:560,fs:40},
  {k:'bubble',x:640,y:300,w:400,lines:['PULL OVER!','...PLEASE?'],tx:760,ty:560,fs:38},
  {k:'burst',x:860,y:600,r:80,t:'KA-RUNCH!',c1:'#ffe14d',c2:'#e0103a',rot:12,fs:48},
  {k:'title',t:'RACE 1: HAUL ASS-ETS',sub:'Drive the 18-wheeler to the marina • cops eat diesel'}]}}
