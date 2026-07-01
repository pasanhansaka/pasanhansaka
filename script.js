const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- BOOT SEQUENCE ---------- */
(function boot(){
  const boot = document.getElementById('boot');
  if(REDUCED){ boot.classList.add('hidden'); return; }
  const lines = document.querySelectorAll('.boot-line');
  const bar = document.getElementById('boot-bar');
  lines.forEach((l,i)=>{ l.innerHTML = l.dataset.t; });
  let i=0;
  function next(){
    if(i < lines.length){
      lines[i].classList.add('show');
      i++;
      gsap.to(bar,{width:(i/lines.length*100)+'%',duration:.3,ease:'power1.out'});
      setTimeout(next, 260);
    } else {
      setTimeout(()=>{ boot.classList.add('hidden'); startPageAnims(); }, 400);
    }
  }
  setTimeout(next, 200);
})();
if(REDUCED){ document.addEventListener('DOMContentLoaded', startPageAnims); }

/* ---------- CUSTOM CURSOR ---------- */
if(!REDUCED && window.matchMedia('(min-width:861px)').matches){
  const dot = document.getElementById('cdot');
  const ring = document.getElementById('cring');
  const label = document.getElementById('clabel');
  let mx=0,my=0, rx=0, ry=0;
  window.addEventListener('mousemove', e=>{
    mx=e.clientX; my=e.clientY;
    dot.style.left=mx+'px'; dot.style.top=my+'px';
    label.style.left=mx+'px'; label.style.top=my+'px';
    document.documentElement.style.setProperty('--mx', mx+'px');
    document.documentElement.style.setProperty('--my', my+'px');
  });
  function loop(){
    rx += (mx-rx)*0.16; ry += (my-ry)*0.16;
    ring.style.left=rx+'px'; ring.style.top=ry+'px';
    requestAnimationFrame(loop);
  }
  loop();
  document.querySelectorAll('a,button,.chip,.p-card,.btn,.magnetic-btn').forEach(el=>{
    el.addEventListener('mouseenter', ()=>{
      ring.classList.add('big');
      const txt = el.dataset.cursor;
      if(txt){ label.textContent = txt; label.classList.add('show'); }
    });
    el.addEventListener('mouseleave', ()=>{
      ring.classList.remove('big');
      label.classList.remove('show');
    });
  });
}

/* ---------- CLOCK (Sri Lanka time) ---------- */
function tickClock(){
  const el = document.getElementById('clock');
  if(!el) return;
  const now = new Date();
  const opts = { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false, timeZone:'Asia/Colombo' };
  el.textContent = new Intl.DateTimeFormat('en-GB', opts).format(now) + ' LKT';
}
tickClock(); setInterval(tickClock, 1000);

/* ---------- SCROLL PROGRESS ---------- */
window.addEventListener('scroll', ()=>{
  const h = document.documentElement;
  const pct = (h.scrollTop)/(h.scrollHeight - h.clientHeight) * 100;
  document.getElementById('scroll-progress').style.width = pct+'%';
});

/* ---------- DECRYPT TEXT ---------- */
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*_-+=';
function decryptEl(el){
  const final = el.dataset.text || el.textContent;
  const len = final.length;
  let frame = 0;
  const totalFrames = len * 3 + 20;
  const revealAt = Array.from({length:len}, (_,i)=> Math.floor(i * (totalFrames/len)) + Math.random()*6);
  function render(){
    let out = '';
    for(let i=0;i<len;i++){
      if(final[i] === ' '){ out += ' '; continue; }
      if(frame >= revealAt[i]){ out += final[i]; }
      else { out += GLYPHS[Math.floor(Math.random()*GLYPHS.length)]; }
    }
    el.textContent = out;
    frame++;
    if(frame <= totalFrames){ requestAnimationFrame(render); }
    else { el.textContent = final; }
  }
  if(REDUCED){ el.textContent = final; return; }
  render();
}

/* ---------- REVEAL ON SCROLL + decrypt trigger ---------- */
const io = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    }
  });
},{ threshold:0.15 });

function startPageAnims(){
  document.querySelectorAll('.reveal').forEach(el=> io.observe(el));

  const decryptIO = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        decryptEl(entry.target);
        decryptIO.unobserve(entry.target);
      }
    });
  },{ threshold:0.4 });
  document.querySelectorAll('.decrypt').forEach(el=> decryptIO.observe(el));

  /* counters */
  const countIO = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        const el = entry.target;
        const target = parseInt(el.dataset.count,10);
        const plus = el.querySelector('.plus');
        let cur = 0;
        const dur = 1200;
        const start = performance.now();
        function step(t){
          const p = Math.min((t-start)/dur,1);
          cur = Math.floor(p*target);
          el.childNodes[0].nodeValue = cur;
          if(p<1) requestAnimationFrame(step);
          else el.childNodes[0].nodeValue = target;
        }
        requestAnimationFrame(step);
        countIO.unobserve(el);
      }
    });
  },{ threshold:0.5 });
  document.querySelectorAll('.stat-num').forEach(el=> countIO.observe(el));
}

/* ---------- MARQUEE (auto + draggable) ---------- */
(function marquee(){
  const wrap = document.getElementById('marquee');
  const track = document.getElementById('marqueeTrack');
  let pos = 0, speed = 0.6, dragging=false, lastX=0, dragVel=0;
  function loop(){
    if(!dragging){ pos -= speed; }
    const w = track.scrollWidth/2;
    if(Math.abs(pos) >= w){ pos = 0; }
    track.style.transform = `translateX(${pos}px)`;
    requestAnimationFrame(loop);
  }
  if(!REDUCED) loop(); else track.style.transform='translateX(0)';
  wrap.addEventListener('mousedown', e=>{ dragging=true; lastX=e.clientX; });
  window.addEventListener('mousemove', e=>{
    if(!dragging) return;
    const dx = e.clientX-lastX; lastX=e.clientX; pos += dx;
    const w = track.scrollWidth/2;
    if(pos > 0) pos -= w; if(pos < -w) pos += w;
  });
  window.addEventListener('mouseup', ()=> dragging=false);
})();

/* ---------- PROJECT CARD 3D TILT ---------- */
document.querySelectorAll('.p-card').forEach(card=>{
  card.addEventListener('mousemove', e=>{
    if(REDUCED) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left)/r.width - 0.5;
    const y = (e.clientY - r.top)/r.height - 0.5;
    card.style.transform = `perspective(700px) rotateY(${x*8}deg) rotateX(${-y*8}deg) translateY(-4px)`;
  });
  card.addEventListener('mouseleave', ()=>{ card.style.transform = 'perspective(700px) rotateY(0) rotateX(0) translateY(0)'; });
});

/* ---------- TIMELINE SCROLL PROGRESS ---------- */
window.addEventListener('scroll', ()=>{
  const tl = document.querySelector('.timeline');
  const bar = document.getElementById('tlProgress');
  if(!tl || !bar) return;
  const r = tl.getBoundingClientRect();
  const vh = window.innerHeight;
  const total = r.height;
  const visible = Math.min(Math.max(vh*0.7 - r.top, 0), total);
  bar.style.height = (visible/total*100)+'%';
});
