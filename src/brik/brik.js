// BRIKS toy-brick library (three.js). Units: mm. 1 stud = 8, plate = 3.2, brick = 9.6
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
export const S=8,P=3.2,B=9.6;
const matCache={};export const Q={low:false};
export function plastic(color,opt={}){const k=color+JSON.stringify(opt);if(matCache[k])return matCache[k];
 const m=Q.low?new THREE.MeshStandardMaterial({color,roughness:opt.rough??0.35,metalness:opt.metal??0,transparent:!!opt.opacity,opacity:opt.opacity??1,emissive:opt.emissive??0x000000,emissiveIntensity:opt.ei??1,side:opt.side??THREE.FrontSide}):new THREE.MeshPhysicalMaterial({color,roughness:opt.rough??0.28,metalness:opt.metal??0,clearcoat:opt.metal?0:0.6,clearcoatRoughness:0.2,transparent:!!opt.opacity,opacity:opt.opacity??1,emissive:opt.emissive??0x000000,emissiveIntensity:opt.ei??1,transmission:opt.trans??0,side:opt.side??THREE.FrontSide});
 return matCache[k]=m}
const geoCache={};
function rbox(w,h,d,r=0.35){const k=[w,h,d,r].join();return geoCache[k]||(geoCache[k]=new RoundedBoxGeometry(w,h,d,2,r))}
export const studGeo=new THREE.CylinderGeometry(2.4,2.4,1.8,10);
// global stud instancing
export class StudBank{constructor(scene){this.scene=scene;this.m={}}
 add(color,mat4,opt){const k=color+(opt?JSON.stringify(opt):'');(this.m[k]||(this.m[k]={color,opt,list:[]})).list.push(mat4)}
 flush(){for(const k in this.m){const e=this.m[k];const im=new THREE.InstancedMesh(studGeo,plastic(e.color,e.opt||{}),e.list.length);e.list.forEach((m,i)=>im.setMatrixAt(i,m));im.castShadow=true;im.receiveShadow=true;this.scene.add(im)}this.m={}}}
let BANK=null;export function setBank(b){BANK=b}export function getBank(){return BANK}
// brick: w,l in studs, h in plates; returns mesh positioned with min corner at local origin center bottom
export function brick(w,l,hPlates,color,opt={}){const g=new THREE.Group();const W=w*S-0.2,L=l*S-0.2,H=hPlates*P;
 const m=new THREE.Mesh(rbox(W,H,L,Math.min(0.5,H/4)),plastic(color,opt));m.position.y=H/2;m.castShadow=m.receiveShadow=true;g.add(m);
 if(!opt.tile){g.userData.studs=[];for(let i=0;i<w;i++)for(let j=0;j<l;j++)g.userData.studs.push([(i-(w-1)/2)*S,H+0.9,(j-(l-1)/2)*S])}
 g.userData.color=color;g.userData.opt=opt;return g}
// place a brick into parent at position and register its studs into the bank (world matrix)
export function place(parent,b,x,y,z,ry=0){b.position.set(x,y,z);b.rotation.y=ry;parent.add(b);return b}
export function bankStuds(root){if(!BANK)return;root.updateMatrixWorld(true);root.traverse(o=>{if(o.userData.studs){const op=o.userData.opt||{};for(const s of o.userData.studs){const m=new THREE.Matrix4().makeTranslation(...s);m.premultiply(o.matrixWorld);BANK.add(o.userData.color,m,op.opacity?{opacity:op.opacity,trans:op.trans}:(op.metal?{metal:op.metal,rough:op.rough}:null))}}})}
// canvas texture helper
export function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');draw(x,w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t}
// ---------------- MINIFIG ----------------
const SK={yellow:'#f5cd2f',flesh:'#f0b98d',tan:'#d79b6e',light:'#f6cfae'};
function faceTex(f){return canvasTex(1024,288,(x,w,h)=>{x.fillStyle=f.skin;x.fillRect(0,0,w,h);const cx=512;
 const ink='#2a1a12';x.lineCap='round';x.lineJoin='round';
 if(f.hair){x.fillStyle=f.hair;x.fillRect(0,0,w,40);x.fillRect(0,0,300,120);x.fillRect(724,0,300,120);}
 if(f.stubble){x.fillStyle='rgba(120,110,105,.25)';for(let i=0;i<900;i++){const a=Math.random()*Math.PI,r=Math.random();x.fillRect(cx-150+Math.random()*300,180+Math.random()*100,2,2)}}
 x.save();x.translate(0,30);if(f.draw)f.draw(x,cx,ink);x.restore();});}
export function andyFace(x,cx,ink){ // warm grin, crow's feet, gray brows
 x.strokeStyle='#8a8a8a';x.lineWidth=12;[-1,1].forEach(s=>{x.beginPath();x.moveTo(cx+s*40,78);x.quadraticCurveTo(cx+s*75,62,cx+s*112,76);x.stroke()});
 x.strokeStyle=ink;x.lineWidth=9;[-1,1].forEach(s=>{x.beginPath();x.moveTo(cx+s*48,118);x.quadraticCurveTo(cx+s*75,100,cx+s*104,118);x.stroke(); // squint smile eyes
  x.lineWidth=4;for(let k=0;k<3;k++){x.beginPath();x.moveTo(cx+s*116,104+k*12);x.lineTo(cx+s*140,96+k*18);x.stroke()} x.lineWidth=9;
  x.fillStyle=ink;x.beginPath();x.arc(cx+s*76,116,8,0,7);x.fill();
  x.strokeStyle='rgba(120,60,40,.6)';x.lineWidth=5;x.beginPath();x.moveTo(cx+s*30,150);x.quadraticCurveTo(cx+s*70,190,cx+s*92,220);x.stroke();x.strokeStyle=ink;});
 x.lineWidth=6;x.beginPath();x.moveTo(cx-8,120);x.quadraticCurveTo(cx-18,165,cx,172);x.quadraticCurveTo(cx+14,170,cx+16,160);x.stroke();
 x.fillStyle='#fff';x.strokeStyle=ink;x.lineWidth=7;x.beginPath();x.moveTo(cx-78,196);x.quadraticCurveTo(cx,262,cx+78,196);x.quadraticCurveTo(cx,214,cx-78,196);x.closePath();x.fill();x.stroke();
 x.strokeStyle='rgba(220,130,110,.25)';x.lineWidth=10;[-1,1].forEach(s=>{x.beginPath();x.arc(cx+s*110,180,14,0,7);x.stroke()});
 x.strokeStyle='rgba(90,60,50,.5)';x.lineWidth=3;x.beginPath();x.moveTo(cx-60,60);x.lineTo(cx+60,60);x.moveTo(cx-50,48);x.lineTo(cx+50,48);x.stroke();}
export function genericFace(mood='grin',extra){return (x,cx,ink)=>{x.fillStyle=ink;x.strokeStyle=ink;x.lineWidth=8;x.lineCap='round';
 [-1,1].forEach(s=>{x.beginPath();x.ellipse(cx+s*60,118,10,14,0,0,7);x.fill();x.beginPath();x.moveTo(cx+s*35,mood=='angry'?82:88);x.lineTo(cx+s*85,mood=='angry'?96:84);x.stroke();
  x.fillStyle='#fff';x.beginPath();x.arc(cx+s*57,113,4,0,7);x.fill();x.fillStyle=ink});
 x.beginPath();if(mood=='scared'){x.ellipse(cx,205,26,30,0,0,7);x.fill()}else if(mood=='angry'){x.moveTo(cx-50,215);x.quadraticCurveTo(cx,190,cx+50,215);x.stroke()}else if(mood=='yell'){x.moveTo(cx-55,185);x.quadraticCurveTo(cx,270,cx+55,185);x.closePath();x.fill();x.fillStyle='#fff';x.fillRect(cx-45,186,90,12)}else{x.moveTo(cx-60,190);x.quadraticCurveTo(cx,250,cx+60,190);x.stroke()}
 if(extra)extra(x,cx,ink)}}
function torsoTex(t){return canvasTex(512,420,(x,w,h)=>{x.fillStyle=t.color;x.fillRect(0,0,w,h);if(t.draw)t.draw(x,w,h)})}
export function minifig(o={}){
 const skin=o.skin||SK.flesh;const g=new THREE.Group();const C=(c,opt)=>plastic(c,opt);
 // legs
 const hips=new THREE.Mesh(rbox(15.6,3.4,8,0.4),C(o.legs||'#2a3550'));hips.position.y=12.4+1.7;g.add(hips);
 const legs=[];[-1,1].forEach((s,i)=>{const pv=new THREE.Group();pv.position.set(s*3.9,12.4,0);const lg=new THREE.Mesh(rbox(7.5,11,8,0.5),C(o.legs||'#2a3550'));lg.position.y=-5.5;const ft=new THREE.Mesh(rbox(7.5,2,9.5,0.4),C(o.shoes||o.legs||'#2a3550'));ft.position.set(0,-11.4,0.8);pv.add(lg,ft);lg.castShadow=ft.castShadow=true;pv.rotation.x=(o.legRot||[0,0])[i];g.add(pv);legs.push(pv)});
 // torso (trapezoid)
 const tg=new THREE.BoxGeometry(15.6,12.8,8,1,1,1);const p=tg.attributes.position;for(let i=0;i<p.count;i++){if(p.getY(i)>0)p.setX(i,p.getX(i)*0.77)}tg.computeVertexNormals();
 const tc=o.torso||'#3d4148';const front=o.torsoDraw?new THREE.MeshPhysicalMaterial({map:torsoTex({color:tc,draw:o.torsoDraw}),roughness:.3,clearcoat:.6}):C(tc);
 const torso=new THREE.Mesh(tg,[C(tc),C(tc),C(tc),C(tc),front,o.backDraw?new THREE.MeshPhysicalMaterial({map:torsoTex({color:tc,draw:o.backDraw}),roughness:.3}):C(tc)]);torso.position.y=15.8+6.4;torso.castShadow=true;g.add(torso);
 // arms
 const arms=[];[-1,1].forEach((s,i)=>{const sh=new THREE.Group();sh.position.set(s*6.6,26.2,0);const a=new THREE.Mesh(new THREE.CylinderGeometry(2.6,2.9,11,16),C(o.arms||tc));a.position.set(s*1.6,-5,0);a.rotation.z=s*0.18;
  const bump=new THREE.Mesh(new THREE.SphereGeometry(3.1,16,12),C(o.arms||tc));bump.position.set(0,0,0);
  const wr=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,2.4,12),C(o.hands||skin));wr.position.set(s*2.6,-11,0);wr.rotation.z=s*0.18;
  const hand=new THREE.Mesh(new THREE.TorusGeometry(2.2,1.15,10,20,Math.PI*1.55),C(o.hands||skin));hand.position.set(s*2.9,-13.6,1.2);hand.rotation.set(Math.PI/2,0,Math.PI*0.72);
  [a,bump,wr,hand].forEach(m=>{m.castShadow=true;sh.add(m)});const r=(o.armRot||[[0,0],[0,0]])[i];sh.rotation.x=-r[0];sh.rotation.z=s*r[1];g.add(sh);arms.push({sh,hand})});
 // neck+head
 const neck=new THREE.Mesh(new THREE.CylinderGeometry(2.6,2.6,1.4,16),C(skin));neck.position.y=29.3;g.add(neck);
 const head=new THREE.Group();head.position.y=30;g.add(head);
 const hg=new THREE.CylinderGeometry(5.1,5.1,8.8,40,1,false,Math.PI,Math.PI*2);
 const ft=faceTex({skin,hair:o.faceHair,stubble:o.stubble,draw:o.face||genericFace()});
 const hm=new THREE.Mesh(hg,[new THREE.MeshPhysicalMaterial({map:ft,roughness:.3,clearcoat:.7}),C(skin),C(skin)]);hm.position.y=4.4;hm.castShadow=true;
 const top=new THREE.Mesh(new THREE.CylinderGeometry(3.4,3.4,1.8,20),C(skin));top.position.y=9.7;
 // rounded head edges
 const tr=new THREE.Mesh(new THREE.TorusGeometry(4.6,0.55,8,40),C(skin));tr.rotation.x=Math.PI/2;tr.position.y=8.8;head.add(hm,top,tr);
 head.rotation.y=o.headRot||0;
 // accessories on head
 if(o.hat)head.add(o.hat());
 if(o.hairPiece)head.add(o.hairPiece());
 g.userData={arms,legs,head,torso};g.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true}});
 return g}
export function attach(fig,i,obj){const h=fig.userData.arms[i].hand;const w=new THREE.Vector3();obj.position.copy(new THREE.Vector3(0,0,0));fig.userData.arms[i].sh.add(obj);obj.position.add(h.position);return obj}
// ---------- head gear ----------
export function capTex(text,fg='#e8e8e8',bg='#2b2d33'){return canvasTex(1024,256,(x,w,h)=>{x.fillStyle=bg;x.fillRect(0,0,w,h);x.fillStyle=fg;x.textAlign='center';x.font='bold 96px Georgia';x.fillText(text,768,150);x.font='bold 40px Georgia';x.fillText('EST. 1907',768,210);
 x.strokeStyle=fg;x.lineWidth=4;for(let i=0;i<9;i++){x.beginPath();x.moveTo(620+i*36,60);x.lineTo(636+i*36,30);x.lineTo(652+i*36,60);x.stroke()}})}
export function cap(color='#2b2d33',text='ST. GERMAIN',opt={}){return ()=>{const g=new THREE.Group();const t=text?capTex(text,opt.fg||'#e8e8e8',color):null;
 const crown=new THREE.Mesh(new THREE.SphereGeometry(5.95,40,20,0,Math.PI*2,0,Math.PI/2),t?new THREE.MeshPhysicalMaterial({map:t,roughness:.6}):plastic(color,{rough:.6}));crown.position.y=8.2;crown.scale.y=0.78;crown.rotation.y=-Math.PI/2;
 const band=new THREE.Mesh(new THREE.CylinderGeometry(5.95,5.95,2.2,40,1,true),plastic(color,{rough:.6}));band.position.y=7.2;
 const brim=new THREE.Mesh(new THREE.CylinderGeometry(7.6,7.6,0.9,40,1,false,-1.0,2.0),plastic(opt.brim||color,{rough:.5}));brim.position.set(0,6.5,2.2);brim.rotation.x=-0.1;
 const button=new THREE.Mesh(new THREE.SphereGeometry(0.9,10,8),plastic(color));button.position.y=12.9;
 g.add(crown,band,brim,button);g.traverse(m=>m.castShadow=true);return g}}
export function hairSides(color){return ()=>{const g=new THREE.Group();const m=new THREE.Mesh(new THREE.CylinderGeometry(5.4,5.4,4,40,1,true,Math.PI*0.35+Math.PI,Math.PI*1.3),plastic(color,{rough:.6}));m.position.y=6.8;m.rotation.y=Math.PI;g.add(m);return g}}
export function shako(){return ()=>{const g=new THREE.Group();const c=new THREE.Mesh(new THREE.CylinderGeometry(6.4,5.4,13,32),plastic('#5a1a9a'));c.position.y=14;
 const band=new THREE.Mesh(new THREE.CylinderGeometry(5.6,5.6,1.6,32),plastic('#e8b22a',{metal:.9,rough:.25}));band.position.y=9;
 const band2=band.clone();band2.position.y=19.2;band2.scale.set(1.15,1,1.15);
 const vis=new THREE.Mesh(new THREE.CylinderGeometry(6.8,6.8,0.8,32,1,false,-0.9,1.8),plastic('#111'));vis.position.y=8;
 const badge=new THREE.Mesh(new THREE.CylinderGeometry(2,2,0.8,6),plastic('#e8b22a',{metal:.9,rough:.2}));badge.rotation.x=Math.PI/2;badge.position.set(0,14,6.1);
 const plume=new THREE.Mesh(new THREE.ConeGeometry(1.8,12,10),plastic('#e01b24'));plume.position.y=26;plume.rotation.z=0.25;
 g.add(c,band,band2,vis,badge,plume);g.traverse(m=>m.castShadow=true);return g}}
export function copHat(color='#16213e'){return ()=>{const g=new THREE.Group();const c=new THREE.Mesh(new THREE.CylinderGeometry(6.6,5.4,3.2,32),plastic(color));c.position.y=10.4;
 const vis=new THREE.Mesh(new THREE.CylinderGeometry(6.4,6.4,0.6,32,1,false,-0.9,1.8),plastic('#111'));vis.position.y=8.8;const b=new THREE.Mesh(new THREE.CylinderGeometry(5.6,5.6,1.2,32),plastic('#111'));b.position.y=9.2;
 const badge=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.2,0.6,8),plastic('#e8b22a',{metal:.9,rough:.2}));badge.rotation.x=Math.PI/2;badge.position.set(0,10.4,6.3);g.add(c,vis,b,badge);return g}}
export function mountieHat(){return ()=>{const g=new THREE.Group();const brim=new THREE.Mesh(new THREE.CylinderGeometry(10,10,0.8,40),plastic('#8a5a2a',{rough:.6}));brim.position.y=8.6;
 const crown=new THREE.Mesh(new THREE.ConeGeometry(5.8,7,4),plastic('#a8743a',{rough:.6}));crown.position.y=12.4;crown.rotation.y=Math.PI/4;const band=new THREE.Mesh(new THREE.CylinderGeometry(5.4,5.4,1.4,32),plastic('#5a3412'));band.position.y=9.6;g.add(brim,crown,band);return g}}
export function shades(color='#111'){return ()=>{const g=new THREE.Group();const m=new THREE.Mesh(new THREE.CylinderGeometry(5.35,5.35,2.4,40,1,true,-0.75,1.5),plastic(color,{rough:.05,metal:.3}));m.position.y=5.4;g.add(m);return g}}
// ---------- tools/weapons ----------
export function launcher(len=34,col='#4f6b2e',label=true){const g=new THREE.Group();const tube=new THREE.Mesh(new THREE.CylinderGeometry(3.2,3.2,len,20),plastic(col,{rough:.5}));tube.rotation.z=Math.PI/2;
 const mouth=new THREE.Mesh(new THREE.CylinderGeometry(3.8,3.8,4,20),plastic('#2c3a18'));mouth.rotation.z=Math.PI/2;mouth.position.x=len/2;
 const rocket=new THREE.Mesh(new THREE.ConeGeometry(2.6,6,16),plastic('#d22'));rocket.rotation.z=-Math.PI/2;rocket.position.x=len/2+4;
 const grip=new THREE.Mesh(new THREE.BoxGeometry(2.4,6,2.4),plastic('#222'));grip.position.set(2,-5,0);
 const sight=new THREE.Mesh(new THREE.BoxGeometry(5,2.4,1.6),plastic('#111'));sight.position.set(4,4,0);
 g.add(tube,mouth,rocket,grip,sight);if(label){const t=canvasTex(512,128,(x,w,h)=>{x.fillStyle=col;x.fillRect(0,0,w,h);x.fillStyle='#ffe14d';x.font='bold 70px Impact,Anton';x.fillText('∞ UNLIMITED',30,95)});
  const lab=new THREE.Mesh(new THREE.CylinderGeometry(3.25,3.25,len*0.55,20,1,true,0,Math.PI),new THREE.MeshPhysicalMaterial({map:t,roughness:.5}));lab.rotation.z=Math.PI/2;lab.rotation.x=Math.PI/2;g.add(lab)}
 g.traverse(m=>m.castShadow=true);return g}
export function blaster(col='#222',len=18){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.BoxGeometry(len,3,3),plastic(col));b.position.x=len/2-3;const bar=new THREE.Mesh(new THREE.CylinderGeometry(1,1,8,10),plastic('#555',{metal:.6,rough:.3}));bar.rotation.z=Math.PI/2;bar.position.x=len+1;
 const gr=new THREE.Mesh(new THREE.BoxGeometry(2.4,5,2.2),plastic('#3a2410'));gr.position.set(0,-3,0);const mag=new THREE.Mesh(new THREE.BoxGeometry(2.4,5,2),plastic('#111'));mag.position.set(6,-3.5,0);g.add(b,bar,gr,mag);g.traverse(m=>m.castShadow=true);return g}
// ---------- cats (brick-built) ----------
export function cat(o){const g=new THREE.Group();const base=o.color,str=o.stripe;
 const tex=canvasTex(256,256,(x,w,h)=>{x.fillStyle=base;x.fillRect(0,0,w,h);x.fillStyle=str;for(let i=0;i<7;i++){x.beginPath();x.moveTo(i*40,0);x.quadraticCurveTo(i*40+20,128,i*40,256);x.lineTo(i*40+12,256);x.quadraticCurveTo(i*40+32,128,i*40+12,0);x.fill()}});
 const M=new THREE.MeshPhysicalMaterial({map:tex,roughness:.35,clearcoat:.5});const W=plastic(o.belly||'#f4efe6');
 const body=new THREE.Mesh(rbox(12,10,22,2),M);body.position.y=9;
 const chest=new THREE.Mesh(rbox(8,7,3,1.2),W);chest.position.set(0,8,11);
 [[-3.6,7],[3.6,7],[-3.6,-7],[3.6,-7]].forEach(([x,z],i)=>{const l=new THREE.Mesh(rbox(3.6,7,4,1),M);l.position.set(x,3.5,z);const paw=new THREE.Mesh(rbox(4,2,5,0.8),W);paw.position.set(x,1,z+0.6);g.add(l,paw);
  if(o.pounce){l.rotation.x=i<2?-0.9:0.7;l.position.y=4.5}});
 const head=new THREE.Group();head.position.set(0,17,12);
 const hm=new THREE.Mesh(rbox(13,11,11,2.2),M);
 const face=canvasTex(512,512,(x,w,h)=>{x.fillStyle=base;x.fillRect(0,0,w,h);x.fillStyle=str;x.fillRect(200,0,30,90);x.fillRect(282,0,30,90);x.fillRect(240,0,32,70);
  x.fillStyle=o.belly||'#f4efe6';x.beginPath();x.ellipse(256,380,150,110,0,0,7);x.fill();
  [-1,1].forEach(s=>{x.fillStyle=o.eye||'#9be03a';x.beginPath();x.ellipse(256+s*105,220,62,o.angry?44:58,0,0,7);x.fill();x.strokeStyle='#111';x.lineWidth=10;x.stroke();x.fillStyle='#111';x.beginPath();x.ellipse(256+s*105,224,16,46,0,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(256+s*92,200,12,0,7);x.fill();
   if(o.angry){x.strokeStyle='#111';x.lineWidth=16;x.beginPath();x.moveTo(256+s*40,140);x.lineTo(256+s*170,170);x.stroke()}
   x.strokeStyle='#222';x.lineWidth=5;for(let k=0;k<3;k++){x.beginPath();x.moveTo(256+s*90,350+k*18);x.lineTo(256+s*240,330+k*30);x.stroke()}});
  x.fillStyle='#ff8fb0';x.beginPath();x.moveTo(226,310);x.lineTo(286,310);x.lineTo(256,342);x.fill();x.strokeStyle='#111';x.lineWidth=8;x.beginPath();x.moveTo(256,342);x.lineTo(256,370);x.moveTo(206,372);x.quadraticCurveTo(256,420,306,372);x.stroke();
  if(o.mouthOpen){x.fillStyle='#5a0a14';x.beginPath();x.ellipse(256,400,50,36,0,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.moveTo(216,380);x.lineTo(230,410);x.lineTo(240,382);x.moveTo(272,382);x.lineTo(282,410);x.lineTo(296,380);x.fill()}});
 face.colorSpace=THREE.SRGBColorSpace;const fp=new THREE.Mesh(new THREE.PlaneGeometry(12.6,10.6),new THREE.MeshPhysicalMaterial({map:face,roughness:.3,clearcoat:.6}));fp.position.z=5.56;
 const muzzle=new THREE.Mesh(rbox(6,3.6,2.4,1),W);muzzle.position.set(0,-2.6,5.6);
 [-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.ConeGeometry(2.8,5,4),M);e.position.set(s*4.2,7.6,0);e.rotation.y=Math.PI/4;const ei=new THREE.Mesh(new THREE.ConeGeometry(1.6,3,4),plastic('#ff9fbf'));ei.position.set(s*4.2,7.2,1.2);ei.rotation.y=Math.PI/4;head.add(e,ei)});
 head.add(hm,fp,muzzle);g.add(body,chest,head);
 let tp=new THREE.Vector3(0,12,-11);for(let i=0;i<7;i++){const s=new THREE.Mesh(new THREE.SphereGeometry(1.8-i*0.08,12,10),M);tp=tp.clone().add(new THREE.Vector3(0,2.6,-1.6+i*0.5+(o.tailCurl||0)*i*0.3));s.position.copy(tp);g.add(s)}
 const studs=[[-3,13,-4],[3,13,-4],[-3,13,4],[3,13,4]];g.userData.studs=studs.map(s=>[s[0],14.9,s[2]]);g.userData.color=base;g.userData.opt={};
 g.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true}});return g}
// ---------- terrain / environment ----------
export function sky(scene,stops){const t=canvasTex(16,512,(x,w,h)=>{const gr=x.createLinearGradient(0,0,0,h);stops.forEach((c,i)=>gr.addColorStop(i/(stops.length-1),c));x.fillStyle=gr;x.fillRect(0,0,w,h)});scene.background=t}
export function instBricks(scene,list,geoW=S,geoH=B,opt={}){ // list of {x,y,z,color,sx,sy,sz}
 const by={};list.forEach(b=>{(by[b.color]||(by[b.color]=[])).push(b)});const g=new RoundedBoxGeometry(1,1,1,2,0.06);
 for(const c in by){const arr=by[c];const im=new THREE.InstancedMesh(g,plastic(c,opt),arr.length);const m=new THREE.Matrix4(),q=new THREE.Quaternion();
  arr.forEach((b,i)=>{q.setFromEuler(new THREE.Euler(b.rx||0,b.ry||0,b.rz||0));m.compose(new THREE.Vector3(b.x,b.y,b.z),q,new THREE.Vector3(b.sx||geoW-0.2,b.sy||geoH,b.sz||geoW-0.2));im.setMatrixAt(i,m);
   if(!b.noStud&&BANK){const sm=new THREE.Matrix4().makeTranslation(b.x,b.y+(b.sy||geoH)/2+0.9,b.z);const nx=Math.round((b.sx||S)/S),nz=Math.round((b.sz||S)/S);for(let ix=0;ix<nx;ix++)for(let iz=0;iz<nz;iz++){const mm=new THREE.Matrix4().makeTranslation(b.x+(ix-(nx-1)/2)*S,b.y+(b.sy||geoH)/2+0.9,b.z+(iz-(nz-1)/2)*S);if(b.rz||b.rx){mm.compose(new THREE.Vector3(b.x,b.y,b.z),q,new THREE.Vector3(1,1,1));mm.multiply(new THREE.Matrix4().makeTranslation(0,(b.sy||geoH)/2+0.9,0))}BANK.add(c,mm,opt.opacity?{opacity:opt.opacity}:null)}}});
  im.castShadow=!opt.noShadow;im.receiveShadow=true;scene.add(im)}}
export function noise(x,z){return Math.sin(x*0.013)*Math.cos(z*0.011)+0.5*Math.sin(x*0.031+z*0.02)+0.25*Math.sin(z*0.05-x*0.04)}
// brick explosion: emissive core + debris bricks + studs
export function explosion(scene,pos,size=60,seed=1){const g=new THREE.Group();g.position.copy(pos);let r=seed;const rnd=()=>{r=(r*16807)%2147483647;return r/2147483647};
 const cols=['#fff6c8','#ffd23a','#ff8a1a','#ff4d0d'];for(let i=0;i<26;i++){const s=size*(0.18+rnd()*0.32)*(i<6?1.3:1);const c=cols[Math.min(3,Math.floor(rnd()*4+(i<6?0:0.6)))];
  const m=new THREE.Mesh(new THREE.IcosahedronGeometry(s,1),new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(i<10?3.2:2),transparent:true,opacity:0.95,toneMapped:false}));const a=rnd()*Math.PI*2,e=rnd()*Math.PI-Math.PI/2,d=rnd()*size*0.55;m.position.set(Math.cos(a)*Math.cos(e)*d,Math.abs(Math.sin(e))*d*0.9,Math.sin(a)*Math.cos(e)*d);g.add(m)}
 for(let i=0;i<14;i++){const s=size*(0.2+rnd()*0.3);const m=new THREE.Mesh(new THREE.IcosahedronGeometry(s,3),plastic(rnd()<.5?'#3a3440':'#57505c',{rough:.9}));m.position.set((rnd()-.5)*size,size*0.6+rnd()*size*0.8,(rnd()-.5)*size*0.6);g.add(m)}
 const deb=['#c8102e','#ffd23a','#f4f4f4','#1b2a5a','#5a3412','#888','#ff8a1a'];
 for(let i=0;i<40;i++){const w=1+Math.floor(rnd()*3),h=rnd()<.5?1:3;const b=brick(w,1,h,deb[Math.floor(rnd()*deb.length)]);const a=rnd()*Math.PI*2,d=size*(0.6+rnd()*1.1);b.position.set(Math.cos(a)*d,rnd()*size*1.3,Math.sin(a)*d*0.6);b.rotation.set(rnd()*6,rnd()*6,rnd()*6);g.add(b)}
 for(let i=0;i<40;i++){const s=new THREE.Mesh(studGeo,plastic(deb[Math.floor(rnd()*deb.length)]));const a=rnd()*Math.PI*2,d=size*(0.5+rnd()*1.4);s.position.set(Math.cos(a)*d,rnd()*size*1.5,Math.sin(a)*d*0.6);s.rotation.set(rnd()*6,rnd()*6,0);s.scale.setScalar(1.2);g.add(s)}
 const light=new THREE.PointLight(0xff8a2a,size*size*1.2,size*5,2);light.position.y=size*0.3;g.add(light);scene.add(g);return g}
