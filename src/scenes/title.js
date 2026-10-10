import * as T from 'three';import * as K from '../brik/brik.js';import * as W from '../brik/world.js';import {andy,julia,bob,jake} from '../brik/chars.js';
export async function build({scene,cam}){K.sky(scene,['#12082e','#3a1a6a','#c03a6a','#ff8a3a','#ffd070']);W.fog(scene,0xc06080,900,3000);
 W.lights(scene,{dir:[-200,300,300],sun:0xffd0a0,si:2.6,ext:250,hi:0.7,rim:0xff70c0,target:[0,0,0]});
 W.plate(scene,-40,-60,80,90,'#3a3a42',0,8);
 for(let i=0;i<10;i++){W.tower(scene,-300+i*65,-400-((i*53)%200),8,8,20+((i*31)%40),['#2a3a5a','#3a4a6a','#4a3a5a'][i%3],0.5,i+2)}
 const sm=W.semi({color:'#c8102e',brand:'KENWHIRL'});sm.position.set(30,0,-80);sm.rotation.y=0.55;scene.add(sm);K.bankStuds(sm);
 const a=andy({armRot:[[2.9,0.3],[0.3,0]]});a.position.set(-30,0,40);a.rotation.y=0.25;scene.add(a);
 const j=julia({armRot:[[1.6,0],[1.4,-0.2]]});j.position.set(10,0,45);j.rotation.y=-0.3;scene.add(j);const L=K.launcher(40,'#4f6b2e');L.position.set(-7,28,6);L.rotation.y=-Math.PI/2;L.rotation.x=-0.4;j.add(L);
 const B=bob({angry:true,mouthOpen:true});B.position.set(-42,0,62);B.rotation.y=0.4;scene.add(B);const J=jake({angry:true});J.position.set(32,0,72);J.rotation.y=-0.4;scene.add(J);
 let r=3;const rn=()=>{r=(r*16807)%2147483647;return r/2147483647};
 for(let i=0;i<40;i++){const b=W.bond();b.position.set((rn()-.5)*220,20+rn()*140,(rn()-.5)*120);b.rotation.set(rn()*6,rn()*6,rn()*6);scene.add(b)}
 K.explosion(scene,new T.Vector3(-140,70,-220),40,7);K.explosion(scene,new T.Vector3(150,50,-200),45,11);
 cam.position.set(0,48,240);cam.lookAt(0,40,0);cam.fov=50;cam.updateProjectionMatrix();
 return {bloom:0.7,bloomTh:0.88,overlay:[
  {k:'burst',x:540,y:200,r:230,t:'HELVIE ON WHEELS',c1:'#ffe14d',c2:'#e0103a',rot:-6,fs:96},
  {k:'burst',x:900,y:430,r:80,t:'EH-BOOM!',c1:'#7af0ff',c2:'#c2185b',rot:12,fs:40},
  {k:'title',t:'$12M. ONE CHUTE. ZERO SORRY.',sub:'Andy • Julia • Bob • Jake  vs.  Generalissimo Jose Widen'}]}}
