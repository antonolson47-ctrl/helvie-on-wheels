import * as THREE from 'three';import * as K from './brik.js';
const S=K.S,B=K.B,P=K.P;
export const WQ={shadow:1024};
export function lights(scene,o={}){const sun=new THREE.DirectionalLight(o.sun??0xffd0a0,o.si??2.4);sun.position.set(...(o.dir||[300,500,400]));sun.castShadow=WQ.shadow>0;sun.shadow.mapSize.set(WQ.shadow||512,WQ.shadow||512);const e=o.ext||400;Object.assign(sun.shadow.camera,{left:-e,right:e,top:e,bottom:-e,near:10,far:3000});sun.shadow.bias=-0.0004;sun.shadow.radius=4;
 if(o.target){sun.target.position.set(...o.target);scene.add(sun.target);sun.position.add(new THREE.Vector3(...o.target))}scene.add(sun);scene.add(new THREE.HemisphereLight(o.sky??0x9ab0ff,o.ground??0x5a3a2a,o.hi??0.7));if(o.rim){const r=new THREE.DirectionalLight(o.rim,1.2);r.position.set(-400,200,-300);scene.add(r)}return sun}
export function fog(scene,c,n,f){scene.fog=new THREE.Fog(c,n,f)}
// studded ground plate covering area (x0..x1,z0..z1) in studs units using instanced plates
export function plate(scene,x0,z0,w,l,color,y=0,step=4){const list=[];for(let i=0;i<w;i+=step)for(let j=0;j<l;j+=step)list.push({x:(x0+i+step/2)*S,y:y-P/2,z:(z0+j+step/2)*S,sx:step*S-0.15,sy:P,sz:step*S-0.15,color});K.instBricks(scene,list)}
// stepped brick terrain (mountains/hills)
export function terrain(scene,{x0,z0,w,l,hf,colors,step=2,y0=0,snow}){const list=[];for(let i=0;i<w;i+=step)for(let j=0;j<l;j+=step){const X=(x0+i)*S,Z=(z0+j)*S;const h=Math.max(1,Math.round(hf(X,Z)/B));for(let k=0;k<h;k+=Math.max(1,Math.floor(h/6))){const top=k+Math.max(1,Math.floor(h/6))>=h;const lvl=k/h;const c=(snow&&top&&h>snow)?'#f4f6fa':colors[Math.min(colors.length-1,Math.floor(lvl*colors.length))];const hh=Math.min(Math.max(1,Math.floor(h/6)),h-k);list.push({x:X,y:y0+(k+hh/2)*B,z:Z,sx:step*S-0.2,sy:hh*B,sz:step*S-0.2,color:c,noStud:!top})}}K.instBricks(scene,list)}
// water: translucent studded tiles with wave offsets
export function water(scene,{x0,z0,w,l,color='#1f6fb8',amp=2,step=2,y=0,deep='#0b3a6a'}){const base=new THREE.Mesh(new THREE.PlaneGeometry(w*S*1.5,l*S*1.5),K.plastic(deep,{rough:.15}));base.rotation.x=-Math.PI/2;base.position.set((x0+w/2)*S,y-6,(z0+l/2)*S);base.receiveShadow=true;scene.add(base);
 const list=[];for(let i=0;i<w;i+=step)for(let j=0;j<l;j+=step){const X=(x0+i)*S,Z=(z0+j)*S;const h=Math.round((Math.sin(X*0.02)+Math.cos(Z*0.03+X*0.01))*amp);list.push({x:X,y:y+h*P*0.5-P/2,z:Z,sx:step*S-0.3,sy:P,sz:step*S-0.3,color:(h>1?'#7cc8ff':color)})}K.instBricks(scene,list,S,P,{opacity:0.82,trans:0})}
// buildings: brick tower with window tiles via texture + studded roof
const winCache={};function winTex(c,lit,seed){const k=c+lit+seed;if(winCache[k])return winCache[k];return winCache[k]=K.canvasTex(128,256,(x,w,h)=>{x.fillStyle=c;x.fillRect(0,0,w,h);let r=seed;const rn=()=>{r=(r*16807)%2147483647;return r/2147483647};
 for(let i=0;i<4;i++)for(let j=0;j<8;j++){x.fillStyle=rn()<lit?'#ffd36b':'#1d2a44';x.fillRect(8+i*30,8+j*31,20,22);x.fillStyle='rgba(255,255,255,.25)';x.fillRect(8+i*30,8+j*31,20,3)}x.strokeStyle='rgba(0,0,0,.18)';x.lineWidth=2;for(let j=0;j<h;j+=8){x.beginPath();x.moveTo(0,j);x.lineTo(w,j);x.stroke()}})}
export function tower(scene,x,z,ws,ls,hb,color,lit=.4,seed=1){const g=new THREE.Group();const H=hb*B,W=ws*S,L=ls*S;const t=winTex(color,lit,seed).clone();t.needsUpdate=true;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(ws/4,hb/10);
 const m=new THREE.MeshPhysicalMaterial({map:t,roughness:.35,clearcoat:.5,emissiveMap:t,emissive:0x553311,emissiveIntensity:lit>0.3?0.9:0.2});const b=new THREE.Mesh(new THREE.BoxGeometry(W,H,L),m);b.position.y=H/2;b.castShadow=b.receiveShadow=true;g.add(b);
 const roof=K.brick(ws,ls,1,'#3a3a44');roof.position.y=H;g.add(roof);if(seed%3==0){const ant=new THREE.Mesh(new THREE.CylinderGeometry(0.8,0.8,40),K.plastic('#ccc'));ant.position.y=H+20;g.add(ant)}
 g.position.set(x,0,z);scene.add(g);K.bankStuds(g);return g}
export function tree(scene,x,z,s=1,c='#1d5a2a'){const g=new THREE.Group();const tr=K.brick(1,1,6,'#5a3412');g.add(tr);for(let i=0;i<4;i++){const n=4-i;const b=K.brick(n,n,3,c);b.position.y=19.2+i*P*3;g.add(b)}g.position.set(x,0,z);g.scale.setScalar(s);scene.add(g);K.bankStuds(g);return g}
// ---------- vehicles ----------
function wheel(r=9,w=7){const g=new THREE.Group();const t=new THREE.Mesh(new THREE.CylinderGeometry(r,r,w,28),K.plastic('#151515',{rough:.7}));t.rotation.z=Math.PI/2;
 const h=new THREE.Mesh(new THREE.CylinderGeometry(r*0.55,r*0.55,w+0.4,20),K.plastic('#c8ccd4',{metal:.8,rough:.25}));h.rotation.z=Math.PI/2;
 for(let i=0;i<6;i++){const tr=new THREE.Mesh(new THREE.BoxGeometry(w+0.2,1.2,r*0.4),K.plastic('#222'));tr.position.set(0,Math.cos(i)*r*.95,Math.sin(i)*r*.95);}
 g.add(t,h);g.traverse(m=>{if(m.isMesh){m.castShadow=true}});return g}
function glass(w,h,d){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),K.plastic('#8fd0ff',{opacity:0.18,rough:.05}));return m}
function printPlane(w,h,draw,cw=512,ch=256){const t=K.canvasTex(cw,ch,draw);return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshPhysicalMaterial({map:t,roughness:.3,clearcoat:.6}))}
export function semi(o={}){const g=new THREE.Group();const C=o.color||'#c8102e';const add=(b,x,y,z)=>{b.position.set(x,y,z);g.add(b);return b};
 add(K.brick(6,20,2,'#222'),0,9,-60);
 add(K.brick(6,4,5,C),0,15.4,30);const hoodTop=K.brick(6,4,1,C,{tile:true});add(hoodTop,0,31.4,30);
 add(K.brick(1,5,10,C),-20,15.4,-6);add(K.brick(1,5,10,C),20,15.4,-6);add(K.brick(4,1,10,C),0,15.4,-22);add(K.brick(4,4,3,C),0,15.4,-4);
 add(K.brick(6,5,3,C),0,47.4,-6);add(K.brick(6,3,4,C),0,57,-14);
 const gl=glass(38,14,1);gl.position.set(0,42,13.5);gl.rotation.x=-0.15;g.add(gl);
 [-1,1].forEach(s=>{const sw=glass(1,12,18);sw.position.set(s*24.3,40,-4);g.add(sw)});
 const gr=printPlane(40,15,(x,w,h)=>{const gd=x.createLinearGradient(0,0,0,h);gd.addColorStop(0,'#fff');gd.addColorStop(.5,'#9aa6b8');gd.addColorStop(1,'#3a4252');x.fillStyle=gd;x.fillRect(0,0,w,h);x.fillStyle='#222';for(let i=0;i<14;i++)x.fillRect(22+i*34,24,18,h-48);x.fillStyle='#fff';x.font='bold 46px Arial Black';x.textAlign='center';x.strokeStyle='#000';x.lineWidth=6;x.strokeText(o.brand||'KENWHIRL',w/2,h/2+16);x.fillText(o.brand||'KENWHIRL',w/2,h/2+16)});gr.position.set(0,24,46.15);g.add(gr);
 [-1,1].forEach(s=>{const hl=new THREE.Mesh(new THREE.BoxGeometry(6,6,1),new THREE.MeshBasicMaterial({color:0xfff6c8}));hl.position.set(s*21,24,46.4);g.add(hl);
  const st=new THREE.Mesh(new THREE.CylinderGeometry(2,2,48,16),K.plastic('#d8dce4',{metal:.9,rough:.15}));st.position.set(s*26,50,-22);g.add(st);
  const tank=new THREE.Mesh(new THREE.CylinderGeometry(6,6,18,20),K.plastic('#d8dce4',{metal:.9,rough:.2}));tank.rotation.x=Math.PI/2;tank.position.set(s*26,14,-2);g.add(tank);
  const mir=new THREE.Mesh(new THREE.BoxGeometry(2,8,5),K.plastic('#d8dce4',{metal:.9,rough:.15}));mir.position.set(s*29,42,10);g.add(mir);
  const horn=new THREE.Mesh(new THREE.CylinderGeometry(1.2,2.4,14,12),K.plastic('#d8dce4',{metal:.9,rough:.15}));horn.rotation.x=Math.PI/2;horn.position.set(s*8,64,-4);g.add(horn)});
 const bump=new THREE.Mesh(new THREE.BoxGeometry(56,7,4),K.plastic('#d8dce4',{metal:.9,rough:.15}));bump.position.set(0,13,48.5);g.add(bump);
 const fend=[];[30].forEach(z=>[-1,1].forEach(s=>{const f=new THREE.Mesh(new THREE.CylinderGeometry(12,12,9,24,1,false,0,Math.PI),K.plastic(C));f.rotation.z=Math.PI/2;f.rotation.y=0;f.position.set(s*25,11,z);}));
 [[30],[-40],[-56],[-140],[-156]].forEach(([z])=>[-1,1].forEach(s=>{const w=wheel(10,8);w.position.set(s*25,10,z);g.add(w)}));
 if(o.trailer!==false){const box=new THREE.Mesh(new THREE.BoxGeometry(50,46,140),new THREE.MeshPhysicalMaterial({map:K.canvasTex(1024,340,(x,w,h)=>{x.fillStyle=o.trailerColor||'#e8e8e8';x.fillRect(0,0,w,h);x.strokeStyle='rgba(0,0,0,.15)';for(let i=0;i<w;i+=32){x.beginPath();x.moveTo(i,0);x.lineTo(i,h);x.stroke()}x.fillStyle=o.trailerInk||'#c8102e';x.font='bold 110px Anton,Impact';x.textAlign='center';x.fillText(o.trailerText||"HAUL ASS-ETS",w/2,190);x.font='bold 46px Arial';x.fillText(o.trailerSub||'FREIGHT • NO QUESTIONS ASKED',w/2,260)}),roughness:.4,clearcoat:.4}));box.position.set(0,47,-104);g.add(box);add(K.brick(6,17,1,'#bbb'),0,70,-104)}
 g.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true}});return g}
export function copCar(o={}){const g=new THREE.Group();const add=(b,x,y,z)=>{b.position.set(x,y,z);g.add(b);return b};const lbl=o.label||'SEATTLE-ISH PD';
 add(K.brick(5,11,2,o.under||'#111'),0,6,0);add(K.brick(5,11,2,o.body||'#f4f4f4'),0,12.4,0);add(K.brick(5,4,4,o.body||'#f4f4f4'),0,18.8,-4);
 const gl=glass(36,10,1);gl.position.set(0,24,6.5);gl.rotation.x=-0.5;g.add(gl);const gl2=glass(1,9,26);gl2.position.set(20.1,24,-4);g.add(gl2);const gl3=gl2.clone();gl3.position.x=-20.1;g.add(gl3);
 const side=printPlane(86,6,(x,w,h)=>{x.fillStyle=o.stripe||'#1b2a5a';x.fillRect(0,0,w,h);x.fillStyle=o.ink||'#fff';x.font='bold 74px Arial Black';x.textAlign='center';x.fillText(lbl,w/2,90)},1024,120);side.rotation.y=Math.PI/2;side.position.set(20.05,15,0);g.add(side);const s2=side.clone();s2.rotation.y=-Math.PI/2;s2.position.x=-20.05;g.add(s2);
 (o.lights||[['#ff1a1a',-6],['#1a5aff',6]]).forEach(([c,x])=>{const l=new THREE.Mesh(new THREE.BoxGeometry(10,4,6),new THREE.MeshBasicMaterial({color:c}));l.position.set(x,33,-4);g.add(l);const pl=new THREE.PointLight(c,2500,200,1.8);pl.position.set(x,40,-4);g.add(pl)});
 [-1,1].forEach(s=>{const hl=new THREE.Mesh(new THREE.BoxGeometry(8,4,1),new THREE.MeshBasicMaterial({color:0xfff6c8}));hl.position.set(s*12,13,44.3);g.add(hl)});
 [28,-28].forEach(z=>[-1,1].forEach(s=>{const w=wheel(7,6);w.position.set(s*19,7,z);g.add(w)}));
 g.traverse(m=>{if(m.isMesh){m.castShadow=true}});K.bankStuds(g);return g}
export function speedboat(o={}){const g=new THREE.Group();const C=o.color||'#ff2e88';
 const sh=new THREE.Shape();sh.moveTo(-28,-70);sh.lineTo(28,-70);sh.lineTo(28,30);sh.quadraticCurveTo(26,70,0,100);sh.quadraticCurveTo(-26,70,-28,30);sh.closePath();
 const hull=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:14,bevelEnabled:true,bevelSize:2,bevelThickness:2,bevelSegments:3}),K.plastic('#151515'));hull.rotation.set(-Math.PI/2,0,Math.PI);hull.position.y=2;g.add(hull);
 const deck=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:4,bevelEnabled:true,bevelSize:1,bevelThickness:1}),K.plastic(C));deck.rotation.set(-Math.PI/2,0,Math.PI);deck.position.y=16;deck.scale.set(.98,.98,1);g.add(deck);
 const stripe=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:2,bevelEnabled:false}),K.plastic('#ffe14d'));stripe.rotation.set(-Math.PI/2,0,Math.PI);stripe.position.y=12;stripe.scale.set(1.04,1.02,1);g.add(stripe);
 const name=printPlane(70,9,(x,w,h)=>{x.fillStyle='rgba(0,0,0,0)';x.clearRect(0,0,w,h);x.fillStyle='#ffe14d';x.font='bold 96px Anton,Impact';x.textAlign='center';x.fillText(o.name||'BOND VOYAGE',w/2,105)},1024,128);name.material.transparent=true;name.rotation.y=Math.PI/2;name.position.set(30.5,8,0);g.add(name);const n2=name.clone();n2.rotation.y=-Math.PI/2;n2.position.x=-30.5;g.add(n2);
 const ws=glass(50,14,1.2);ws.position.set(0,28,22);ws.rotation.x=-0.6;g.add(ws);
 // engines
 [-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.BoxGeometry(14,22,16),K.plastic('#222'));e.position.set(s*12,24,-66);g.add(e);const cap=new THREE.Mesh(new THREE.BoxGeometry(14.4,6,16.4),K.plastic(C));cap.position.set(s*12,36,-66);g.add(cap)});
 const seat=K.brick(4,2,2,'#f4f4f4');seat.position.set(0,20,-10);g.add(seat);
 // mines rack
 g.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true}});K.bankStuds(g);return g}
export function heli(o={}){const g=new THREE.Group();const gold=K.plastic('#e8b22a',{metal:1,rough:.22});
 const body=new THREE.Mesh(new THREE.SphereGeometry(30,32,24),gold);body.scale.set(1,0.8,1.5);body.position.y=0;g.add(body);
 const cock=new THREE.Mesh(new THREE.SphereGeometry(26,32,24,0,Math.PI*2,0,Math.PI/2.2),K.plastic('#9fd8ff',{opacity:.45,rough:.05}));cock.rotation.x=Math.PI/2.4;cock.position.set(0,4,22);cock.scale.set(1,1,0.9);g.add(cock);
 const tail=new THREE.Mesh(new THREE.CylinderGeometry(4,9,90,16),gold);tail.rotation.x=Math.PI/2;tail.position.set(0,6,-80);g.add(tail);
 const fin=new THREE.Mesh(new THREE.BoxGeometry(3,34,16),gold);fin.position.set(0,20,-122);g.add(fin);
 const mast=new THREE.Mesh(new THREE.CylinderGeometry(3,3,12),K.plastic('#333'));mast.position.y=28;g.add(mast);
 for(let i=0;i<4;i++){const bl=new THREE.Mesh(new THREE.BoxGeometry(150,1.2,7),K.plastic('#2a2a2a',{opacity:.7}));bl.position.y=34;bl.rotation.y=i*Math.PI/4+0.3;g.add(bl)}
 const disc=new THREE.Mesh(new THREE.CircleGeometry(150,48),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.08,side:THREE.DoubleSide}));
 [-1,1].forEach(s=>{const sk=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,70,10),K.plastic('#333'));sk.rotation.x=Math.PI/2;sk.position.set(s*20,-30,0);g.add(sk);[-15,15].forEach(z=>{const st=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.2,12),K.plastic('#333'));st.position.set(s*18,-24,z);g.add(st)})});
 const flagT=K.canvasTex(512,320,(x,w,h)=>{x.fillStyle='#6a1ba8';x.fillRect(0,0,w,h/2);x.fillStyle='#f2c21a';x.fillRect(0,h/2,w,h/2);x.fillStyle='#fff';x.beginPath();x.arc(w/2,h/2,90,0,7);x.fill();x.lineWidth=8;x.strokeStyle='#111';x.stroke();x.fillStyle='#d11';x.beginPath();x.moveTo(w/2-50,h/2-16);x.lineTo(w/2+30,h/2-50);x.lineTo(w/2+30,h/2+50);x.lineTo(w/2-50,h/2+16);x.fill();x.fillRect(w/2-70,h/2-16,22,32);x.strokeStyle='#111';x.lineWidth=7;[40,64].forEach(r=>{x.beginPath();x.arc(w/2+30,h/2,r,-0.7,0.7);x.stroke()})});
 const side=new THREE.Mesh(new THREE.PlaneGeometry(36,22),new THREE.MeshPhysicalMaterial({map:flagT,roughness:.4}));side.position.set(30.5,0,-14);side.rotation.y=Math.PI/2;g.add(side);
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.8,0.8,40),K.plastic('#ccc'));pole.position.set(0,40,-115);g.add(pole);
 const fl=new THREE.Mesh(new THREE.PlaneGeometry(50,32,10,4),new THREE.MeshPhysicalMaterial({map:flagT,roughness:.5,side:THREE.DoubleSide}));const fp=fl.geometry.attributes.position;for(let i=0;i<fp.count;i++)fp.setZ(i,Math.sin(fp.getX(i)*0.15)*3);fl.geometry.computeVertexNormals();fl.position.set(0,46,-141);fl.rotation.y=Math.PI/2;g.add(fl);
 const txt=new THREE.Mesh(new THREE.PlaneGeometry(60,8),new THREE.MeshBasicMaterial({map:K.canvasTex(1024,128,(x,w,h)=>{x.fillStyle='#e8b22a';x.fillRect(0,0,w,h);x.fillStyle='#4a0e7a';x.font='bold 96px Anton,Impact';x.textAlign='center';x.fillText('PROPAGANDIA ONE',w/2,104)})}));txt.position.set(9.5,-6,-70);txt.rotation.y=Math.PI/2;g.add(txt);
 g.traverse(m=>{if(m.isMesh){m.castShadow=true}});return g}
export function jet(){const g=new THREE.Group();const W=K.plastic('#c9ced8',{rough:.5});const body=new THREE.Mesh(new THREE.CylinderGeometry(22,22,360,32),W);body.rotation.x=Math.PI/2;g.add(body);
 const nose=new THREE.Mesh(new THREE.SphereGeometry(22,32,16,0,Math.PI*2,0,Math.PI/2),W);nose.rotation.x=Math.PI/2;nose.position.z=180;nose.scale.y=1.6;g.add(nose);
 const tailc=new THREE.Mesh(new THREE.ConeGeometry(22,80,32),W);tailc.rotation.x=-Math.PI/2;tailc.position.z=-220;g.add(tailc);
 const wing=new THREE.Mesh(new THREE.BoxGeometry(420,5,60),W);wing.position.set(0,-6,20);g.add(wing);const tw=new THREE.Mesh(new THREE.BoxGeometry(140,4,30),W);tw.position.set(0,20,-230);g.add(tw);
 const fin=new THREE.Mesh(new THREE.BoxGeometry(5,80,60),K.plastic('#c8102e'));fin.position.set(0,52,-225);fin.rotation.x=-0.4;g.add(fin);
 const stripe=new THREE.Mesh(new THREE.CylinderGeometry(22.3,22.3,330,32,1,true,Math.PI*0.35,0.25),K.plastic('#c8102e'));stripe.rotation.x=Math.PI/2;g.add(stripe);const st2=stripe.clone();st2.rotation.y=0;st2.scale.x=-1;g.add(st2);
 for(let i=0;i<20;i++){[-1,1].forEach(s=>{const w=new THREE.Mesh(new THREE.BoxGeometry(1,5,6),K.plastic('#1a2a4a'));w.position.set(s*21.6,8,150-i*16);g.add(w)})}
 [-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.CylinderGeometry(9,9,40,20),K.plastic('#9aa6b8',{metal:.6,rough:.3}));e.rotation.x=Math.PI/2;e.position.set(s*30,10,-170);g.add(e)});
 const stair=new THREE.Mesh(new THREE.BoxGeometry(20,3,60),K.plastic('#9aa6b8'));stair.position.set(0,-34,-230);stair.rotation.x=0.6;g.add(stair);
 const txt=new THREE.Mesh(new THREE.PlaneGeometry(160,14),new THREE.MeshBasicMaterial({map:K.canvasTex(1024,96,(x,w,h)=>{x.fillStyle='#e6e9ef';x.fillRect(0,0,w,h);x.fillStyle='#c8102e';x.font='bold 80px Anton,Impact';x.textAlign='center';x.fillText('NORTHWEST-ISH AIR',w/2,80)})}));txt.position.set(22.4,-6,40);txt.rotation.y=Math.PI/2;g.add(txt);
 g.traverse(m=>{if(m.isMesh){m.castShadow=true}});return g}
export function bond(){const t=K.canvasTex(256,160,(x,w,h)=>{x.fillStyle='#d8efbf';x.fillRect(0,0,w,h);x.strokeStyle='#2c6a1e';x.lineWidth=8;x.strokeRect(10,10,w-20,h-20);x.lineWidth=2;x.strokeRect(22,22,w-44,h-44);x.fillStyle='#2c5a1e';x.font='bold 46px Georgia';x.textAlign='center';x.fillText('$100K',w/2,95);x.font='bold 18px Georgia';x.fillText('BEARER BOND',w/2,128)});
 const m=new THREE.Mesh(new THREE.BoxGeometry(16,0.6,10),[0,0,1,1,0,0].map(i=>i?new THREE.MeshPhysicalMaterial({map:t,roughness:.5}):K.plastic('#d8efbf')));m.castShadow=true;return m}
export function pump(o={}){const g=new THREE.Group();g.add(Object.assign(K.brick(2,3,6,'#c8102e'),{}));const top=K.brick(2,3,1,'#f4f4f4');top.position.y=19.2;g.add(top);
 const sc=printPlane(12,8,(x,w,h)=>{x.fillStyle='#111';x.fillRect(0,0,w,h);x.fillStyle='#3f3';x.font='bold 80px monospace';x.fillText('$$$',60,150)});sc.position.set(0,13,12.2);g.add(sc);const hose=new THREE.Mesh(new THREE.TorusGeometry(6,0.9,8,20,Math.PI),K.plastic('#111'));hose.position.set(8.5,10,0);hose.rotation.y=Math.PI/2;g.add(hose);g.traverse(m=>{if(m.isMesh)m.castShadow=true});return g}
export function moose(){const g=new THREE.Group();const M=K.plastic('#6a3a1a',{rough:.5}),D=K.plastic('#4a2410');const body=new THREE.Mesh(new RoundBox(22,20,40),M);body.position.y=30;g.add(body);
 [[-7,14],[7,14],[-7,-14],[7,-14]].forEach(([x,z])=>{const l=new THREE.Mesh(new THREE.BoxGeometry(6,22,6),D);l.position.set(x,11,z);g.add(l)});
 const neck=new THREE.Mesh(new THREE.BoxGeometry(12,14,12),M);neck.position.set(0,40,20);neck.rotation.x=0.6;g.add(neck);const head=new THREE.Mesh(new RoundBox(12,13,24),M);head.position.set(0,44,32);g.add(head);
 const snout=new THREE.Mesh(new RoundBox(11,10,10),K.plastic('#5a2e12'));snout.position.set(0,41,44);g.add(snout);
 [-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.SphereGeometry(1.6,10,8),K.plastic('#111'));e.position.set(s*6.2,47,36);g.add(e);const an=new THREE.Group();const pal=new THREE.Mesh(new THREE.BoxGeometry(16,2,12),K.plastic('#e8d6a8'));pal.position.set(s*10,0,0);an.add(pal);for(let i=0;i<4;i++){const t=new THREE.Mesh(new THREE.CylinderGeometry(1,1.4,8),K.plastic('#e8d6a8'));t.position.set(s*(6+i*4),3,-4+i*2.5);an.add(t)}an.position.set(s*4,52,30);an.rotation.z=s*0.4;g.add(an)});
 const bell=new THREE.Mesh(new THREE.BoxGeometry(4,8,4),M);bell.position.set(0,34,42);g.add(bell);g.traverse(m=>{if(m.isMesh)m.castShadow=true});return g}
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
function RoundBox(w,h,d){return new RoundedBoxGeometry(w,h,d,3,Math.min(w,h,d)*0.25)}
export function sign(text,w,h,bg,fg,font='bold 120px Anton,Impact'){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,3),[0,0,0,0,1,0].map(i=>i?new THREE.MeshBasicMaterial({map:K.canvasTex(1024,Math.round(1024*h/w),(x,cw,ch)=>{x.fillStyle=bg;x.fillRect(0,0,cw,ch);x.fillStyle=fg;x.font=font;x.textAlign='center';x.textBaseline='middle';x.fillText(text,cw/2,ch/2)})}):K.plastic(bg)));m.castShadow=true;return m}
