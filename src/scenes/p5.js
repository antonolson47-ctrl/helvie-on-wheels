import * as T from 'three';import * as K from '../brik/brik.js';import * as W from '../brik/world.js';import {andy,julia,general,bob,jake} from '../brik/chars.js';
export async function build({scene,cam}){K.sky(scene,['#12082e','#4a1a6a','#c03a6a','#ff8a3a','#ffd070']);
 W.lights(scene,{dir:[-300,200,-200],sun:0xffa060,si:2.6,ext:250,hi:0.7,rim:0xff70c0,target:[0,0,0]});
 const fill=new T.DirectionalLight(0x8aa0ff,0.8);fill.position.set(200,100,300);scene.add(fill);
 // summit: stepped peak
 W.terrain(scene,{x0:-30,z0:-30,w:60,l:50,step:2,y0:-200,colors:['#4a4a52','#5a5a62','#6a6a72','#7a7a82'],snow:20,hf:(x,z)=>Math.max(20,230-Math.hypot(x*0.9,z*1.2)*0.9+K.noise(x*3,z*3)*12)});
 // distant mountain range + clouds
 W.terrain(scene,{x0:-500,z0:-700,w:1000,l:120,step:12,y0:-800,colors:['#2a2a4a','#3a3a5a','#5a4a6a'],snow:50,hf:(x,z)=>Math.max(0,500+400*Math.sin(x*0.002)*Math.cos(z*0.003)+K.noise(x,z)*200)});
 let r=5;const rn=()=>{r=(r*16807)%2147483647;return r/2147483647};
 for(let i=0;i<14;i++){const cg=new T.Group();for(let k=0;k<7;k++){const b=K.brick(5+Math.floor(rn()*5),3+Math.floor(rn()*4),3,'#ffd8e8');b.position.set((rn()-.5)*120,(rn()-.5)*16,(rn()-.5)*60);cg.add(b)}cg.position.set(-900+i*140,-160-rn()*160,-500-rn()*600);scene.add(cg);K.bankStuds(cg)}
 const top=30; // summit height approx (y0 -200 + 230)
 const a=andy({armRot:[[2.9,0.3],[1.4,0.1]]});a.position.set(-14,top,6);a.rotation.y=-0.7;scene.add(a);
 // flag in Andy's hand
 const fp=new T.Mesh(new T.CylinderGeometry(0.8,0.8,46),K.plastic('#ccc'));fp.position.set(-3,-14,1.2);fp.rotation.z=0;fp.position.set(-70,top+4,-40);fp.scale.setScalar(1.4);
 const flag=new T.Mesh(new T.PlaneGeometry(26,16,8,2),new T.MeshPhysicalMaterial({side:2,map:K.canvasTex(380,200,(x,w,h)=>{for(let i=0;i<13;i++){x.fillStyle=i%2?'#fff':'#c8102e';x.fillRect(0,i*h/13,w,h/13)}x.fillStyle='#1a2a6a';x.fillRect(0,0,w*0.42,h*7/13);x.fillStyle='#fff';for(let i=0;i<5;i++)for(let j=0;j<4;j++){x.beginPath();x.arc(14+i*30,12+j*24,4,0,7);x.fill()}})}));const fpp=flag.geometry.attributes.position;for(let i=0;i<fpp.count;i++)fpp.setZ(i,Math.sin(fpp.getX(i)*0.3)*2);flag.geometry.computeVertexNormals();flag.position.set(13.5,15,0);fp.add(flag);
 const L2=K.launcher(36,'#4f6b2e');L2.position.set(-7,28,6);L2.rotation.y=-Math.PI/2;L2.rotation.x=-0.5;
 const j=julia({armRot:[[1.6,0],[1.4,-0.2]],headRot:0.2});j.position.set(14,top+3,0);j.rotation.y=0.5;scene.add(j);
 const L=K.launcher(40,'#4f6b2e');L.position.set(-7,28,6);L.rotation.y=-Math.PI/2;L.rotation.x=-0.62;j.add(L);
 // backblast
 for(let i=0;i<8;i++){const s=new T.Mesh(new T.IcosahedronGeometry(4+i*1.5,2),new T.MeshBasicMaterial({color:new T.Color(i<2?'#ffd040':'#eeeeee').multiplyScalar(i<2?3:1),toneMapped:i>=2,transparent:true,opacity:i<2?1:.5}));s.position.set(-7,28-i*5,-20-i*8);j.add(s)}
 const B=bob({pounce:false,angry:true,mouthOpen:true});B.position.set(-4,top-2,34);B.rotation.y=0.3;scene.add(B);B.scale.setScalar(0.9);
 const J=jake({angry:true});J.position.set(30,top-4,28);J.rotation.y=-0.4;J.scale.setScalar(0.9);scene.add(J);
 // helicopter exploding
 const h=W.heli();h.position.set(150,170,-240);h.rotation.set(0.2,-1.9,0.45);scene.add(h);
 K.explosion(scene,new T.Vector3(85,190,-250),60,17);K.explosion(scene,new T.Vector3(10,210,-280),40,19);
 // gold debris + bonds
 for(let i=0;i<30;i++){const b=K.brick(1+Math.floor(rn()*2),1,1+Math.floor(rn()*3),'#e8b22a',{metal:1,rough:.25});b.position.set(60+(rn()-.5)*260,190+(rn()-.5)*200,-250+(rn()-.5)*120);b.rotation.set(rn()*6,rn()*6,rn()*6);scene.add(b)}
 for(let i=0;i<40;i++){const b=W.bond();b.position.set((rn()-.5)*300,60+rn()*200,-100+(rn()-.5)*200);b.rotation.set(rn()*6,rn()*6,rn()*6);scene.add(b)}
 // the general flying
 const g=general({armRot:[[2.9,0.6],[2.6,0.8]],legRot:[1,-0.7]});g.position.set(-40,230,-180);g.rotation.set(0.4,0.6,2.6);scene.add(g);
 // rocket trails from summit to heli
 [[j,14,top+28,0],[a,-14,top+28,6]].forEach(([_,x,y,z],k)=>{for(let i=0;i<24;i++){const t=i/24;const s=new T.Mesh(new T.IcosahedronGeometry(3+t*3,1),new T.MeshBasicMaterial({color:0xeeeeee,transparent:true,opacity:.55-t*.3}));s.position.set(x+(60-x)*t*0.8,y+(190-y)*t*0.8+Math.sin(t*9+k)*4,z+(-250-z)*t*0.8);scene.add(s)}});
 cam.position.set(20,top+28,215);cam.lookAt(30,top+62,-60);cam.fov=52;cam.updateProjectionMatrix();
 return {bloom:0.7,bloomTh:0.88,overlay:[
  {k:'burst',x:600,y:200,r:130,t:'KA-BOOM!!',c1:'#ffe14d',c2:'#e0103a',rot:-8,fs:90},
  {k:'bubble',x:40,y:40,w:420,lines:['NOBODY OUT-GUNS','A HELVIE, PAL!'],tx:250,ty:740,fs:38},
  {k:'bubble',x:40,y:170,w:330,lines:['MY MONOCLE!!'],tx:170,ty:300,fs:34},
  {k:'burst',x:900,y:720,r:70,t:'ZOWIE!',c1:'#7af0ff',c2:'#c2185b',rot:12,fs:44},
  {k:'title',t:'FINALE: TOP OF THE WORLD, EH',sub:'Gold chopper of Generalissimo Jose Widen goes KA-BOOM'}]}}
