(()=>{'use strict';
const cv=document.querySelector('#canvas'),ctx=cv.getContext('2d');
let W,H,dpr;function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}addEventListener('resize',resize);resize();
const $=s=>document.querySelector(s), keys={}, mouse={x:W/2,y:H/2,down:false};
let started=false,paused=false,shop=false,cam={x:0,y:0},time=0,shake=0,shootCooldown=0,last=0;
const state={hp:100,maxHp:100,fuel:100,scrap:0,water:3,ammo:24,kills:0,damage:16,maxFuel:100};
const player={x:0,y:0,r:16,angle:0,inside:false,speed:180};
const car={x:-75,y:95,r:28,angle:0,fuel:100};
const enemies=[],bullets=[],particles=[],pickups=[];
function rand(a,b){return a+Math.random()*(b-a)}
// procedural world
const rocks=[],scrub=[],wrecks=[];
for(let i=0;i<180;i++){rocks.push({x:rand(-1800,1800),y:rand(-1400,1400),r:rand(3,10),a:rand(0,6.28)});scrub.push({x:rand(-1800,1800),y:rand(-1400,1400),r:rand(4,10)})}
for(let i=0;i<7;i++){wrecks.push({x:rand(-1200,1200),y:rand(-900,900),a:rand(0,6.28)})}
const camp={x:650,y:-420,r:180};
for(let i=0;i<6;i++){let a=i/6*6.28+randi(.2);enemies.push({x:camp.x+Math.cos(a)*rand(50,150),y:camp.y+Math.sin(a)*rand(50,150),r:12,hp:45,maxHp:45,angle:0,hit:0,shoot:rand(1,3),dead:false})}
function randi(n){return rand(-n,n)}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function worldToScreen(x,y){return{x:x-cam.x+W/2,y:y-cam.y+H/2}}
function screenToWorld(x,y){return{x:x-W/2+cam.x,y:y-H/2+cam.y}}
function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),1800)}
function updateUI(){
 $('#hpbar').style.width=Math.max(0,state.hp/state.maxHp*100)+'%';$('#hptext').textContent=Math.ceil(state.hp);
 $('#fuelbar').style.width=Math.max(0,state.fuel/state.maxFuel*100)+'%';$('#fueltext').textContent=Math.ceil(state.fuel);
 $('#scrap').textContent=state.scrap;$('#water').textContent=state.water;$('#ammo').textContent=state.ammo;$('#killCount').textContent=state.kills+'/6';
}
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.key.toLowerKey===''){};if(e.key==='Escape'&&started&&!shop){paused=!paused;$('#pause').classList.toggle('hidden',!paused)}if(e.key.toLowerCase()==='e')toggleCar();if(e.key.toLowerCase()==='j')shoot()});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY});addEventListener('mousedown',()=>{mouse.down=true;shoot()});addEventListener('mouseup',()=>mouse.down=false);
$('#startBtn').onclick=()=>{started=true;$('#start').style.display='none';toast('Find the Iron Camp');updateUI()};
$('#sound').onclick=e=>{e.currentTarget.textContent=e.currentTarget.textContent==='SOUND ON'?'SOUND OFF':'SOUND ON'};
$('#driveBtn').onclick=toggleCar;$('#shootBtn').onclick=shoot;
$('#shop .close').onclick=()=>{shop=false;$('#shop').classList.add('hidden');paused=false};
document.querySelectorAll('.buy').forEach(b=>b.onclick=()=>buy(b.dataset.item));
function buy(item){let costs={armor:15,fuel:8,ammo:10,damage:20},cost=costs[item];if(state.scrap<cost)return toast('Not enough scrap');state.scrap-=cost;if(item==='armor'){state.maxHp+=25;state.hp+=25}if(item==='fuel')state.fuel=Math.min(state.maxFuel,state.fuel+40);if(item==='ammo')state.ammo+=30;if(item==='damage')state.damage+=8;toast('Upgrade installed');updateUI()}
function toggleCar(){if(!started||paused)return;if(player.inside){let d=dist(player,car);player.inside=false;player.x=car.x+35;player.y=car.y;toast('Dismounted')}else if(dist(player,car)<55){player.inside=true;toast('Engine running')}else toast('Move closer to the vehicle')}
function shoot(){if(!started||paused||shop||shootCooldown>0)return;if(state.ammo<=0){toast('Out of ammo');return}state.ammo--;shootCooldown=.18;let origin=player.inside?car:player;let a=player.inside?car.angle:Math.atan2(mouse.y-H/2+cam.y,mouse.x-W/2+cam.x); // player angle is updated
if(!player.inside){a=Math.atan2(mouse.y-(origin.y-cam.y+H/2),mouse.x-(origin.x-cam.x+W/2))}
bullets.push({x:origin.x+Math.cos(a)*25,y:origin.y+Math.sin(a)*25,vx:Math.cos(a)*620,vy:Math.sin(a)*620,life:1.1,enemy:false});shake=2;updateUI()}
// mobile joystick
let joy=null;const joyEl=$('#joystick'),stick=$('#stick');joyEl.addEventListener('pointerdown',e=>{joy={id:e.pointerId,x:e.clientX,y:e.clientY};joyEl.setPointerCapture(e.pointerId)});joyEl.addEventListener('pointermove',e=>{if(!joy||e.pointerId!==joy.id)return;let dx=e.clientX-joy.x,dy=e.clientY-joy.y,l=Math.hypot(dx,dy),m=Math.min(l,28);stick.style.transform=`translate(${dx/l*m||0}px,${dy/l*m||0}px)`;joy.dx=dx/l*(l>8?1:0);joy.dy=dy/l*(l>8?1:0)});joyEl.addEventListener('pointerup',()=>{joy=null;stick.style.transform=''})
function burst(x,y,c,n=8){for(let i=0;i<n;i++)particles.push({x,y,vx:rand(-90,90),vy:rand(-90,90),life:rand(.3,.7),c,r:rand(1,3)})}
function update(dt){time+=dt;if(!started||paused||shop)return;if(shootCooldown>0)shootCooldown-=dt;shake*=.85;
 let dx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0)+(joy?.dx||0),dy=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0)+(joy?.dy||0);let len=Math.hypot(dx,dy);if(len>1){dx/=len;dy/=len}
 if(player.inside){if(state.fuel>0&&len){car.angle=Math.atan2(dy,dx);let speed=220;car.x+=dx*speed*dt;car.y+=dy*speed*dt;state.fuel-=5*dt;player.x=car.x;player.y=car.y}else if(len){car.angle=car.angle}else{} }else{player.x+=dx*player.speed*dt;player.y+=dy*player.speed*dt;if(Math.hypot(mouse.x-W/2,mouse.y-H/2)>20)player.angle=Math.atan2(mouse.y-H/2,mouse.y-H/2)}
 if(player.inside){player.angle=car.angle}else{let wm=screenToWorld(mouse.x,mouse.y);player.angle=Math.atan2(wm.y-player.y,wm.x-player.x)}
 player.x=Math.max(-1700,Math.min(1700,player.x));player.y=Math.max(-1300,Math.min(1300,player.y));car.x=Math.max(-1700,Math.min(1700,car.x));car.y=Math.max(-1300,Math.min(1300,car.y));
 let target=player.inside?car:player;cam.x+=(target.x-cam.x)*Math.min(1,dt*5);cam.y+=(target.y-cam.y)*Math.min(1,dt*5);
 enemies.forEach(e=>{if(e.dead)return;e.hit-=dt;let d=dist(e,target);if(d<420){e.angle=Math.atan2(target.y-e.y,target.x-e.x);if(d>85)e.x+=Math.cos(e.angle)*42*dt,e.y+=Math.sin(e.angle)*42*dt;e.shoot-=dt;if(d<310&&e.shoot<=0){e.shoot=rand(1.3,2.4);bullets.push({x:e.x,y:e.y,vx:Math.cos(e.angle)*310,vy:Math.sin(e.angle)*310,life:1.4,enemy:true})}}});
 bullets.forEach(b=>{b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(!b.enemy){enemies.forEach(e=>{if(!e.dead&&dist(b,e)<e.r+5){e.hp-=state.damage;e.hit=.12;burst(b.x,b.y,'#f08035',5);b.life=0;if(e.hp<=0){e.dead=true;state.kills++;state.scrap+=rand(4,8)|0;if(Math.random()<.55)pickups.push({x:e.x,y:e.y,type:Math.random()<.5?'scrap':'ammo',r:9});burst(e.x,e.y,'#b84b24',18);if(state.kills===6){toast('Camp secured — find the workshop');}}}})}else if(dist(b,target)<(player.inside?35:18)){state.hp-=7;shake=7;b.life=0;burst(b.x,b.y,'#ef5a32',6);if(state.hp<=0){state.hp=100;state.fuel=100;target.x=0;target.y=0;toast('The wasteland spits you out')}}});
 // filter expired projectiles below
 // cannot reassign const; splice in-place
 for(let i=bullets.length-1;i>=0;i--)if(bullets[i].life<=0)bullets.splice(i,1);
 particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt});for(let i=particles.length-1;i>=0;i--)if(particles[i].life<=0)particles.splice(i,1);
 pickups.forEach(p=>{if(dist(p,target)<28){p.taken=true;if(p.type==='scrap')state.scrap+=5;else state.ammo+=12;toast(p.type==='scrap'?'+5 scrap':'+12 ammo');updateUI()}});for(let i=pickups.length-1;i>=0;i--)if(pickups[i].taken)pickups.splice(i,1);
 // camp workshop
 if(dist(target,camp)<75&&state.kills>=6&&!shop){shop=true;paused=true;$('#shop').classList.remove('hidden')}
 updateUI();
}
function poly(points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.stroke()}}
function drawGround(){ctx.fillStyle='#bda868';ctx.fillRect(0,0,W,H);
 ctx.save();ctx.translate(-cam.x*.06+W/2,H*.5);ctx.globalAlpha=.13;ctx.strokeStyle='#7d704e';ctx.lineWidth=1;for(let x=-1800;x<1800;x+=55){ctx.beginPath();ctx.moveTo(x, -800);ctx.lineTo(x+500,800);ctx.stroke()}ctx.restore();ctx.globalAlpha=1;
 // tire/road path
 ctx.save();ctx.translate(-cam.x+W/2,-cam.y+H/2);ctx.strokeStyle='rgba(105,87,51,.38)';ctx.lineWidth=34;ctx.beginPath();ctx.moveTo(-1000,300);ctx.bezierCurveTo(-300,180,150,350,650,-420);ctx.stroke();ctx.strokeStyle='rgba(210,188,124,.18)';ctx.lineWidth=24;ctx.stroke();ctx.restore();
}
function draw(){let sx=shake?rand(-shake,shake):0,sy=shake?rand(-shake,shake):0;ctx.save();ctx.translate(sx,sy);drawGround();ctx.save();ctx.translate(-cam.x+W/2,-cam.y+H/2);
 scrub.forEach(s=>{ctx.fillStyle='#777343';ctx.beginPath();ctx.moveTo(s.x-s.r,s.y);ctx.lineTo(s.x,s.y-s.r*.8);ctx.lineTo(s.x+s.r,s.y);ctx.lineTo(s.x,s.y+s.r*.7);ctx.fill()});
 rocks.forEach(r=>{ctx.fillStyle='#7f7352';ctx.beginPath();ctx.ellipse(r.x,r.y,r.r,r.r*.55,r.a,0,6.28);ctx.fill()});
 // camp walls
 ctx.fillStyle='#453a2b';ctx.strokeStyle='#2a261d';ctx.lineWidth=5;ctx.beginPath();ctx.rect(camp.x-170,camp.y-140,340,280);ctx.fill();ctx.stroke();ctx.strokeStyle='#806c48';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(camp.x-170,camp.y-140);ctx.lineTo(camp.x-170,camp.y+140);ctx.moveTo(camp.x+170,camp.y-140);ctx.lineTo(camp.x+170,camp.y+140);ctx.stroke();
 ctx.fillStyle='#2d2a20';ctx.fillRect(camp.x-30,camp.y-145,60,18);
 // tents / scrap stacks
 for(let i=-1;i<=1;i+=2){ctx.fillStyle='#4d4a3b';ctx.beginPath();ctx.moveTo(camp.x+i*105,camp.y-60);ctx.lineTo(camp.x+i*60,camp.y-20);ctx.lineTo(camp.x+i*150,camp.y-20);ctx.closePath();ctx.fill();ctx.fillStyle='#2c2a22';ctx.fillRect(camp.x+i*105-6,camp.y-20,12,40)}
 wrecks.forEach(w=>{ctx.save();ctx.translate(w.x,w.y);ctx.rotate(w.a);ctx.fillStyle='#594b38';ctx.fillRect(-28,-12,56,24);ctx.fillStyle='#24221e';ctx.fillRect(-22,-13,12,26);ctx.fillRect(10,-13,12,26);ctx.restore()});
 // pickups
 pickups.forEach(p=>{ctx.fillStyle=p.type==='scrap'?'#d8a63f':'#e0d58a';ctx.save();ctx.translate(p.x,p.y);ctx.rotate(time*2);ctx.fillRect(-6,-6,12,12);ctx.restore()});
 // car
 ctx.save();ctx.translate(car.x,car.y);ctx.rotate(car.angle);ctx.fillStyle='#1e2422';ctx.fillRect(-32,-19,64,38);ctx.fillStyle='#4a5547';ctx.fillRect(-24,-22,48,44);ctx.fillStyle='#111';ctx.fillRect(-21,-24,13,5);ctx.fillRect(8,-24,13,5);ctx.fillRect(-21,19,13,5);ctx.fillRect(8,19,13,5);ctx.fillStyle='#bd5b2d';ctx.fillRect(-18,-11,36,22);ctx.fillStyle='#2b302b';ctx.fillRect(8,-8,17,16);ctx.fillStyle='#aaa';ctx.fillRect(-29,-4,7,8);ctx.restore();
 // enemies
 enemies.forEach(e=>{if(e.dead)return;ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.angle);ctx.fillStyle=e.hit>0?'#fff':'#6a2d25';ctx.beginPath();ctx.arc(0,0,e.r,0,6.28);ctx.fill();ctx.fillStyle='#d1aa6a';ctx.fillRect(5,-4,10,8);ctx.fillStyle='#211e1a';ctx.fillRect(-5,-9,10,18);ctx.restore();ctx.fillStyle='#3b3024';ctx.fillRect(e.x-18,e.y-22,36,4);ctx.fillStyle='#d86438';ctx.fillRect(e.x-18,e.y-22,36*(e.hp/e.maxHp),4)});
 // player
 if(!player.inside){ctx.save();ctx.translate(player.x,player.y);ctx.rotate(player.angle);ctx.fillStyle='#b9a66e';ctx.beginPath();ctx.arc(0,0,13,0,6.28);ctx.fill();ctx.fillStyle='#1b3a38';ctx.beginPath();ctx.moveTo(-10,-11);ctx.lineTo(12,-11);ctx.lineTo(8,11);ctx.lineTo(-10,11);ctx.fill();ctx.fillStyle='#d2c09a';ctx.fillRect(4,-3,24,6);ctx.restore()}
 bullets.forEach(b=>{ctx.fillStyle=b.enemy?'#ff6a35':'#fff2a6';ctx.beginPath();ctx.arc(b.x,b.y,b.enemy?3:2,0,6.28);ctx.fill()});particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life*2);ctx.fillStyle=p.c;ctx.fillRect(p.x,p.y,p.r,p.r)});ctx.globalAlpha=1;
 ctx.restore();
 ctx.restore();
 // compass
 ctx.strokeStyle='rgba(235,221,178,.25)';ctx.beginPath();ctx.moveTo(W/2,88);ctx.lineTo(W/2,108);ctx.stroke();ctx.fillStyle='#d6c79d';ctx.font='9px monospace';ctx.fillText('N',W/2-3,84);
}
let then=performance.now();function loop(now){let dt=Math.min(.033,(now-then)/1000);then=now;update(dt);draw();requestAnimationFrame(loop)}requestAnimationFrame(loop);updateUI();
})();