(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height, FLOOR = 444, WORLD = 2860;
  const ui = {
    start: document.getElementById('startScreen'), end: document.getElementById('endScreen'),
    startBtn: document.getElementById('startBtn'), replay: document.getElementById('replayBtn'),
    health: document.getElementById('healthFill'), healthText: document.getElementById('healthText'),
    score: document.getElementById('scoreText'), count: document.getElementById('missionCount'),
    final: document.getElementById('finalScore'), toast: document.getElementById('toast'), sound: document.getElementById('soundBtn')
  };
  let state = 'title', last = 0, camera = 0, time = 0, score = 0, defeated = 0, soundOn = true, audio;
  let player, enemies, coins, particles, keys = {}, toastTimer = 0;
  const rand = (a,b) => a + Math.random()*(b-a);
  function reset() {
    player = {x:100,y:FLOOR-62,vx:0,vy:0,w:33,h:62,health:100,face:1,grounded:true,attack:0,cool:0,invuln:0,anim:0};
    const spots = [470,690,920,1160,1390,1650,1900,2160];
    enemies = spots.map((x,i)=>({x,y:FLOOR-54,w:32,h:54,health:2,face:i%2?1:-1,origin:x,phase:rand(0,5),cool:rand(.4,1.6),stun:0,alive:true}));
    coins = [360,610,820,1050,1280,1530,1800,2040,2360].map((x,i)=>({x,y:FLOOR-55-(i%3)*26,got:false,spin:rand(0,6)}));
    particles=[]; score=0; defeated=0; camera=0; updateHud();
  }
  reset();
  function audioBeep(freq=300,dur=.07,type='square',vol=.035){
    if(!soundOn)return;
    try{audio ||= new (window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=freq;g.gain.value=vol;g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+dur);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+dur)}catch(e){}
  }
  function updateHud(){ui.health.style.width=Math.max(0,player.health)+'%';ui.healthText.textContent=`${Math.max(0,player.health)} / 100`;ui.score.textContent=String(score).padStart(6,'0');ui.count.textContent=`${defeated} / 8`}
  function toast(msg){ui.toast.textContent=msg;ui.toast.classList.add('show');toastTimer=1.5}
  function start(){if(state==='title'){state='play';ui.start.classList.add('hidden');audioBeep(480,.12,'triangle',.04)}}
  ui.startBtn.addEventListener('click',start);
  ui.replay.addEventListener('click',()=>{reset();state='play';ui.end.classList.add('hidden');audioBeep(480,.12,'triangle',.04)});
  ui.sound.addEventListener('click',()=>{soundOn=!soundOn;ui.sound.innerHTML=soundOn?'♫ <span>SOUND ON</span>':'♫ <span>SOUND OFF</span>';if(soundOn)audioBeep(460,.08,'sine')});
  window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if([' ','arrowleft','arrowright','arrowup'].includes(k))e.preventDefault();keys[k]=true;if(state==='title'&&(k==='enter'||k===' '))start();if(state==='play'&&(k==='j'||k==='z'||k==='x'))attack()});
  window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
  document.querySelectorAll('.mobile-controls button').forEach(btn=>{const k=btn.dataset.key;const down=e=>{e.preventDefault();keys[k]=true;if(k==='attack')attack()};const up=e=>{e.preventDefault();keys[k]=false};btn.addEventListener('pointerdown',down);btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up);btn.addEventListener('pointerleave',up)});
  function attack(){if(state!=='play'||player.cool>0)return;player.attack=.25;player.cool=.48;audioBeep(180,.09,'sawtooth',.045);const reach=player.face===1?player.x+player.w:player.x-43;for(const en of enemies){if(!en.alive)continue;const close=player.face===1?(en.x>player.x-5&&en.x<player.x+88):(en.x<player.x+player.w+5&&en.x>player.x-55);if(close&&Math.abs(en.y-player.y)<45){en.health--;en.stun=.38;en.face=player.face;en.x+=player.face*24;burst(en.x+16,en.y+24,'#ffd267',9);if(en.health<=0){en.alive=false;defeated++;score+=250;player.health=Math.min(100,player.health+6);burst(en.x+16,en.y+20,'#fff0c5',16);audioBeep(540,.11,'triangle',.04);if(defeated===8)toast('OUTPOST CLEARED! FIND THE SHIP →')}else audioBeep(260,.06,'square',.025)}}updateHud()}
  function burst(x,y,color,n){for(let i=0;i<n;i++)particles.push({x,y,vx:rand(-150,150),vy:rand(-190,30),life:rand(.25,.65),max:.65,color,size:rand(2,5)})}
  function hurt(){if(player.invuln>0)return;player.health=Math.max(0,player.health-12);player.invuln=1.05;player.vx=-player.face*180;player.vy=-170;burst(player.x+16,player.y+28,'#ff7653',7);audioBeep(105,.18,'sawtooth',.05);updateHud();if(player.health<=0){state='dead';toast('YOU WERE DEFEATED — TRY AGAIN');setTimeout(()=>{if(state==='dead'){reset();state='play';toast('GET BACK OUT THERE!')}},1700)}}
  function update(dt){time+=dt;if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)ui.toast.classList.remove('show')}
    if(state!=='play')return;
    const p=player; p.anim+=dt*9;p.cool=Math.max(0,p.cool-dt);p.attack=Math.max(0,p.attack-dt);p.invuln=Math.max(0,p.invuln-dt);
    const left=keys.arrowleft||keys.a||keys.left,right=keys.arrowright||keys.d||keys.right;
    if(left){p.vx-=1050*dt;p.face=-1}if(right){p.vx+=1050*dt;p.face=1}if(!left&&!right)p.vx*=Math.pow(.001,dt);p.vx=Math.max(-225,Math.min(225,p.vx));
    if((keys[' ']||keys.arrowup||keys.w||keys.jump)&&p.grounded){p.vy=-440;p.grounded=false;audioBeep(360,.07,'triangle',.025)}
    p.vy+=1050*dt;p.x=Math.max(24,Math.min(WORLD-80,p.x+p.vx*dt));p.y+=p.vy*dt;if(p.y+p.h>=FLOOR){p.y=FLOOR-p.h;p.vy=0;p.grounded=true}
    for(const e of enemies){if(!e.alive)continue;e.phase+=dt;e.cool-=dt;if(e.stun>0){e.stun-=dt;continue}const dx=(p.x+p.w/2)-(e.x+e.w/2);if(Math.abs(dx)<260){e.face=dx>0?1:-1;if(Math.abs(dx)>44)e.x+=e.face*75*dt;else if(e.cool<=0){e.cool=1.15;setTimeout(()=>{if(state!=='play'||!e.alive)return;if(Math.abs((p.x+p.w/2)-(e.x+e.w/2))<65&&Math.abs(p.y-e.y)<40)hurt()},240)}}else{e.x=e.origin+Math.sin(e.phase*1.1)*34;e.face=Math.cos(e.phase*1.1)>0?1:-1}}
    for(const c of coins){if(c.got)continue;if(Math.abs(p.x+16-c.x)<23&&Math.abs(p.y+28-c.y)<38){c.got=true;score+=100;audioBeep(760,.08,'sine',.04);burst(c.x,c.y,'#ffdf79',8);updateHud()}}
    for(const a of particles){a.x+=a.vx*dt;a.y+=a.vy*dt;a.vy+=370*dt;a.life-=dt}particles=particles.filter(a=>a.life>0);
    camera=Math.max(0,Math.min(WORLD-W,(p.x-W*.36)));if(defeated>=8&&p.x>WORLD-230){state='won';ui.final.textContent='฿ '+String(score).padStart(6,'0');ui.end.classList.remove('hidden');audioBeep(620,.3,'triangle',.05)}
  }
  function rr(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
  function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
  function drawBackground(){const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#83cbd2');sky.addColorStop(.52,'#b3dfcf');sky.addColorStop(1,'#e7d8a6');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    // sun + sea haze
    circle(757,112,39,'#ffe7a0');circle(757,112,52,'#ffe7a018');
    // distant islands
    for(let i=0;i<5;i++){let x=((i*270-camera*.12)%1250+1250)%1250-80;ctx.fillStyle=i%2?'#7db8a7':'#6aa79d';ctx.beginPath();ctx.moveTo(x,300);ctx.quadraticCurveTo(x+65,248,x+125,302);ctx.quadraticCurveTo(x+180,290,x+230,311);ctx.lineTo(x+230,350);ctx.lineTo(x,350);ctx.fill();ctx.fillStyle='#779b61';ctx.beginPath();ctx.ellipse(x+105,292,40,9,-.15,0,Math.PI*2);ctx.fill()}
    // distant sailing silhouettes
    for(let i=0;i<3;i++){let x=((i*440-camera*.22)%1250+1250)%1250-30;ctx.fillStyle='#527b7d';ctx.fillRect(x,300,3,44);ctx.beginPath();ctx.moveTo(x+3,302);ctx.lineTo(x+35,328);ctx.lineTo(x+3,328);ctx.fill();ctx.beginPath();ctx.moveTo(x-1,306);ctx.lineTo(x-28,329);ctx.lineTo(x-1,326);ctx.fill()}
    // water
    ctx.fillStyle='#57aeb1';ctx.fillRect(0,333,W,111);ctx.fillStyle='#72c3bc';for(let i=0;i<24;i++){let x=((i*57-camera*.35)%1050+1050)%1050-30;let y=346+(i*29%85);ctx.globalAlpha=.35+(i%3)*.1;rr(x,y,14+(i%4)*5,2,1,'#d4e5bd')}ctx.globalAlpha=1;
    // cliffs on island
    let sx= -camera*.65;ctx.fillStyle='#dcae71';ctx.beginPath();ctx.moveTo(sx-200,352);ctx.lineTo(sx+3000,352);ctx.lineTo(sx+2980,385);ctx.lineTo(sx+2750,409);ctx.lineTo(sx+2620,444);ctx.lineTo(sx-200,444);ctx.fill();ctx.fillStyle='#72a65f';ctx.beginPath();ctx.moveTo(sx-150,350);ctx.quadraticCurveTo(sx+440,339,sx+900,352);ctx.quadraticCurveTo(sx+1520,339,sx+2060,351);ctx.quadraticCurveTo(sx+2480,338,sx+3000,350);ctx.lineTo(sx+3000,373);ctx.lineTo(sx-150,375);ctx.fill();
    // ground texture
    for(let i=0;i<72;i++){const x=((i*41-camera)%1050+1050)%1050;ctx.fillStyle=i%3?'#bd8e57':'#efc581';ctx.globalAlpha=.4;ctx.fillRect(x,378+(i*17%61),10+(i%4)*3,2)}ctx.globalAlpha=1;
    drawPalm(110-camera*.8,351,.85);drawPalm(850-camera*.8,352,1.05);drawPalm(1830-camera*.8,351,.9);
    // town buildings
    for(let i=0;i<7;i++){const x=650+i*130-camera*.72;ctx.fillStyle=i%2?'#e7c68e':'#d7ad79';ctx.fillRect(x,292,72,61);ctx.fillStyle='#774f48';ctx.beginPath();ctx.moveTo(x-8,294);ctx.lineTo(x+36,258+(i%3)*8);ctx.lineTo(x+81,294);ctx.fill();ctx.fillStyle='#6b5147';ctx.fillRect(x+27,319,17,34);ctx.fillStyle='#a8d1c5';ctx.fillRect(x+8,306,12,12);ctx.fillRect(x+51,306,12,12)}
    // sandy ground top overlay
    ctx.fillStyle='#e7c47f';ctx.fillRect(0,FLOOR,W,H-FLOOR);ctx.fillStyle='#72a65f';ctx.fillRect(0,FLOOR-4,W,8);
    for(let i=0;i<40;i++){let x=((i*67-camera)%1000+1000)%1000;ctx.fillStyle='#cda96e';ctx.fillRect(x,FLOOR+18+(i*13%65),8,2)}
    // ship exit marker in world
    const ex=WORLD-105-camera;if(ex>-140&&ex<W+180)drawShip(ex,FLOOR-18);
  }
  function drawPalm(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.strokeStyle='#785944';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(0,4);ctx.quadraticCurveTo(8,-27,-3,-67);ctx.stroke();ctx.fillStyle='#417e5d';for(let i=0;i<6;i++){ctx.save();ctx.rotate(-1.3+i*.51);ctx.beginPath();ctx.ellipse(0,-69,29,7,0,0,Math.PI*2);ctx.fill();ctx.restore()}circle(-3,-68,7,'#5b9761');ctx.restore()}
  function drawShip(x,y){ctx.save();ctx.translate(x,y);ctx.fillStyle='#704638';ctx.beginPath();ctx.moveTo(-44,0);ctx.lineTo(45,0);ctx.lineTo(28,24);ctx.lineTo(-29,24);ctx.fill();ctx.fillStyle='#f0e2bc';ctx.fillRect(-2,-62,3,61);ctx.beginPath();ctx.moveTo(2,-59);ctx.lineTo(37,-34);ctx.lineTo(2,-32);ctx.fill();ctx.fillStyle='#e7a74f';ctx.fillRect(-48,-4,94,5);ctx.strokeStyle='#f2e7cb';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-2,-55);ctx.lineTo(-35,-29);ctx.lineTo(-2,-31);ctx.stroke();ctx.restore()}
  function drawPlayer(){const p=player,x=p.x-camera,y=p.y;ctx.save();if(p.invuln>0&&Math.floor(time*15)%2)ctx.globalAlpha=.45;ctx.translate(x+p.w/2,y);if(p.face<0)ctx.scale(-1,1);const walk=Math.sin(p.anim)*Math.min(1,Math.abs(p.vx)/100); // shadow
    ctx.globalAlpha*=.25;ctx.fillStyle='#1f3a39';ctx.beginPath();ctx.ellipse(0,p.h+2,21,5,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=p.invuln>0&&Math.floor(time*15)%2?.45:1;
    // legs
    ctx.strokeStyle='#31394a';ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-6,43);ctx.lineTo(-8+walk*7,57);ctx.moveTo(6,43);ctx.lineTo(8-walk*7,57);ctx.stroke();ctx.strokeStyle='#6d4b3b';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-8+walk*7,57);ctx.lineTo(-12+walk*7,60);ctx.moveTo(8-walk*7,57);ctx.lineTo(13-walk*7,60);ctx.stroke();
    // torso red vest
    rr(-14,20,28,27,6,'#d95038');ctx.fillStyle='#f0c562';ctx.fillRect(-12,39,24,3);ctx.fillStyle='#263846';ctx.fillRect(-2,22,4,21);
    // arms, punch reaches
    ctx.strokeStyle='#f0b985';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-12,25);ctx.lineTo(-18,37);ctx.stroke();if(p.attack>0){ctx.strokeStyle='#f0b985';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(11,26);ctx.lineTo(25+p.attack*90,27);ctx.stroke();circle(25+p.attack*90,27,5,'#f6c391')}else{ctx.beginPath();ctx.moveTo(12,25);ctx.lineTo(18+walk*4,37);ctx.stroke()}
    // neck/head
    ctx.fillStyle='#f0b985';ctx.fillRect(-5,15,10,9);circle(0,8,13,'#f0b985');ctx.fillStyle='#2c2524';ctx.beginPath();ctx.ellipse(0,1,13,7,0,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle='#f3bd55';ctx.beginPath();ctx.ellipse(0,-2,20,5,0,Math.PI,Math.PI*2);ctx.fill();ctx.fillRect(-20,-2,40,4);ctx.fillStyle='#2d2925';ctx.fillRect(4,8,2,2);ctx.fillRect(-5,8,2,2);ctx.strokeStyle='#9e5541';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-3,15);ctx.quadraticCurveTo(0,17,4,15);ctx.stroke();ctx.restore()}
  function drawEnemy(e){const x=e.x-camera,y=e.y;ctx.save();ctx.translate(x+e.w/2,y);if(e.face<0)ctx.scale(-1,1);if(e.stun>0&&Math.floor(time*20)%2)ctx.globalAlpha=.55;ctx.fillStyle='#263b4a';ctx.fillRect(-9,33,8,18);ctx.fillRect(2,33,8,18);ctx.fillStyle='#354e64';ctx.fillRect(-14,13,28,25);ctx.fillStyle='#e1e4d7';ctx.fillRect(-14,17,28,6);ctx.fillStyle='#d7a981';circle(0,8,11,'#d7a981');ctx.fillStyle='#f0e7d3';ctx.beginPath();ctx.ellipse(0,0,14,5,0,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle='#416487';ctx.fillRect(-14,-1,28,4);ctx.fillStyle='#19334b';ctx.fillRect(3,8,2,2);ctx.fillStyle='#d7a981';ctx.fillRect(11,21,9,6);ctx.strokeStyle='#a8b8b7';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(19,22);ctx.lineTo(27,11);ctx.stroke();ctx.restore();}
  function draw(){ctx.clearRect(0,0,W,H);drawBackground(); // patrols
    for(const e of enemies)if(e.alive&&e.x-camera>-60&&e.x-camera<W+60)drawEnemy(e);
    for(const c of coins){if(c.got)continue;let x=c.x-camera;if(x<-20||x>W+20)continue;const bob=Math.sin(time*4+c.spin)*4;circle(x,c.y+bob,10,'#ffc34f');circle(x,c.y+bob,6,'#fff0a7');ctx.fillStyle='#a66d2e';ctx.font='bold 10px Outfit';ctx.textAlign='center';ctx.fillText('฿',x,c.y+3+bob)}
    drawPlayer();for(const a of particles){ctx.globalAlpha=Math.max(0,a.life/a.max);circle(a.x-camera,a.y,a.size,a.color)}ctx.globalAlpha=1;
    // foreground grasses
    for(let i=0;i<20;i++){let x=(i*59-camera*.95)%W;if(x<0)x+=W;ctx.strokeStyle=i%2?'#568451':'#719957';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,FLOOR+2);ctx.quadraticCurveTo(x-5,FLOOR-7,x-8,FLOOR-13);ctx.moveTo(x,FLOOR+2);ctx.quadraticCurveTo(x+4,FLOOR-8,x+9,FLOOR-11);ctx.stroke()}
  }
  function frame(now){const dt=Math.min(.033,(now-last)/1000||0);last=now;update(dt);draw();requestAnimationFrame(frame)}requestAnimationFrame(frame);
})();
