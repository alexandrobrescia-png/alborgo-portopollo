(function(){
  var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  var lang=document.documentElement.lang||'it';

  // header shadow
  var hd=$('header.top');
  function sc(){if(hd)hd.classList.toggle('scrolled',window.scrollY>10)}
  sc();window.addEventListener('scroll',sc,{passive:true});

  // drawer
  var dr=$('nav.drawer'),ov=$('.overlay');
  function tog(o){if(!dr)return;dr.classList.toggle('open',o);ov.classList.toggle('open',o);document.body.style.overflow=o?'hidden':''}
  var bg=$('.burger');if(bg)bg.addEventListener('click',function(){tog(true)});
  var cl=$('nav.drawer .close');if(cl)cl.addEventListener('click',function(){tog(false)});
  if(ov)ov.addEventListener('click',function(){tog(false)});
  $$('nav.drawer a').forEach(function(a){a.addEventListener('click',function(){tog(false)})});

  // year
  var y=$('#anno');if(y)y.textContent=new Date().getFullYear();

  // preselect house from ?casa=
  var f=$('#modulo');
  var wa=$('.wa');if(wa&&f)wa.hidden=true; // in Contatti il modulo ha già il suo pulsante WhatsApp
  if(f){
    var m=(location.search.match(/casa=(\w+)/)||[])[1];
    var sel=$('#casa');
    if(m&&sel){var i=['lory','ale','alcova'].indexOf(m);if(i>-1)sel.selectedIndex=i}

    // availability from Airbnb (Google Apps Script) + date rules + calendar
    var ENDPOINT='https://script.google.com/macros/s/AKfycbyrUtvbbuTjpbzKO3g7m402aebr0L64TnUX57ZJYMlzc3DJdVPxuWiy3ckWVd0N6fQ-cA/exec';
    var ia=$('#arrivo'),ip=$('#partenza'),av=$('#avviso'),D=f.dataset,DAY=864e5,busy=null;
    function pd(v){var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(v||'');return m?Date.UTC(+m[1],+m[2]-1,+m[3]):null}
    function iso(ms){return new Date(ms).toISOString().slice(0,10)}
    function today(){var n=new Date();return Date.UTC(n.getFullYear(),n.getMonth(),n.getDate())}
    function gv(el){return pd(el.dataset.iso)}
    function fd(ms){var d=new Date(ms),dd=('0'+d.getUTCDate()).slice(-2),mm=('0'+(d.getUTCMonth()+1)).slice(-2),y=d.getUTCFullYear();
      if(lang==='en')return d.getUTCDate()+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getUTCMonth()]+' '+y;
      return dd+(lang==='de'?'.':'/')+mm+(lang==='de'?'.':'/')+y}
    function need(a){var mo=new Date(a).getUTCMonth();return(mo===6||mo===7)?6:3}
    function minNights(a){return need(a)}
    function nightBusy(ms){
      if(!busy)return false;
      var k=['lory','ale','alcova'],i=sel.selectedIndex;
      function inH(h){var r=busy[h]||[];for(var x=0;x<r.length;x++){if(ms>=r[x][0]&&ms<r[x][1])return true}return false}
      if(i<3)return inH(k[i]);
      return inH('lory')&&inH('ale')&&inH('alcova');
    }
    function anyBusy(a,p){for(var d=a;d<p;d+=DAY){if(nightBusy(d))return true}return false}
    function firstBusy(a){for(var d=a,n=0;n<800;d+=DAY,n++){if(nightBusy(d))return d}return Infinity}
    function check(){
      var a=gv(ia),p=gv(ip);
      if(a!==null&&a<today())return D.mPast;
      if(a!==null&&p!==null){
        if(p<=a)return D.mOrder;
        var n=Math.round((p-a)/DAY);
        if(n<need(a))return need(a)===6?D.mMin6:D.mMin3;
        if(anyBusy(a,p))return D.mBusy;
      }else if(a!==null&&nightBusy(a))return D.mBusy;
      return '';
    }
    function show(txt,kind){av.textContent=txt||'';av.className='msg '+(kind||'warn');av.setAttribute('role',kind==='info'?'status':'alert')}
    function refresh(){
      var a=gv(ia),p=gv(ip),msg=check();
      if(msg)show(msg);
      else if(a!==null&&p!==null)show(D.mNights.replace('{n}',Math.round((p-a)/DAY)),'info');
      else if(a!==null)show(D.mHint.replace('{n}',minNights(a)),'info');
      else show('');
    }
    function setRange(a,p){
      ia.dataset.iso=a===null?'':iso(a);ia.value=a===null?'':fd(a);
      ip.dataset.iso=p===null?'':iso(p);ip.value=p===null?'':fd(p);
      refresh();
    }
    if(ia&&ip&&av){
      ia.type=ip.type='text';ia.readOnly=ip.readOnly=true;ia.autocomplete=ip.autocomplete='off';
      var box=document.createElement('div');box.className='cal';box.hidden=true;box.setAttribute('role','dialog');box.setAttribute('aria-label',D.cTitle);
      var row=ia.closest('.row');row.parentNode.insertBefore(box,row.nextSibling);
      var first=null,hov=null;
      var fmtM=new Intl.DateTimeFormat(lang,{month:'long',year:'numeric',timeZone:'UTC'}),fmtD=new Intl.DateTimeFormat(lang,{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}),fmtW=new Intl.DateTimeFormat(lang,{weekday:'narrow',timeZone:'UTC'});
      function monthStart(ms){var d=new Date(ms);return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1)}
      function phase(){var a=gv(ia),p=gv(ip);return(a!==null&&p===null)?'dep':'arr'}
      function enabled(d){
        var t=today(),a=gv(ia);
        if(d<t)return false;
        if(phase()==='dep'){
          if(d<=a)return !nightBusy(d);
          return d>=a+minNights(a)*DAY&&d<=firstBusy(a);
        }
        return !nightBusy(d);
      }
      function render(){
        var n=window.innerWidth>=720?2:1,h='<button type="button" class="nav prev" data-n="-1" aria-label="'+D.cPrev+'"'+(first<=monthStart(today())?' disabled':'')+'>&#8249;</button><button type="button" class="nav next" data-n="1" aria-label="'+D.cNext+'">&#8250;</button><div class="ms">';
        var a=gv(ia),p=gv(ip),tt=today();
        for(var k=0;k<n;k++){
          var d0=new Date(first),m0=Date.UTC(d0.getUTCFullYear(),d0.getUTCMonth()+k,1),dm0=new Date(m0);
          var t=fmtM.format(m0),lead=(dm0.getUTCDay()+6)%7,days=new Date(Date.UTC(dm0.getUTCFullYear(),dm0.getUTCMonth()+1,0)).getUTCDate();
          h+='<div class="m"><h5>'+t.charAt(0).toUpperCase()+t.slice(1)+'</h5><div class="g">';
          for(var w=0;w<7;w++)h+='<span class="w">'+fmtW.format(Date.UTC(2024,0,1+w))+'</span>';
          for(var l=0;l<lead;l++)h+='<span></span>';
          for(var d=1;d<=days;d++){
            var dm=m0+(d-1)*DAY,c='d',nb=nightBusy(dm);
            if(dm<tt)c+=' past';else if(nb)c+=' busy';
            if(dm===a||dm===p)c+=' sel';
            if(a!==null&&p!==null&&dm>a&&dm<p)c+=' range';
            h+='<button type="button" class="'+c+'" data-t="'+dm+'"'+(enabled(dm)?'':' disabled')+' aria-label="'+fmtD.format(dm)+(nb&&dm>=tt?' ('+D.cNa+')':'')+'">'+d+'</button>';
          }
          h+='</div></div>';
        }
        h+='</div><div class="foot"><span><button type="button" class="lnk" data-act="clear">'+D.cClear+'</button><button type="button" class="lnk" data-act="close">'+D.cClose+'</button></span></div>';
        box.innerHTML=h;
      }
      function open(){
        var a=gv(ia);first=monthStart(a!==null?a:today());
        if(first<monthStart(today()))first=monthStart(today());
        render();box.hidden=false;
        ia.classList.toggle('on',phase()==='arr');ip.classList.toggle('on',phase()==='dep');
      }
      function close(){box.hidden=true;ia.classList.remove('on');ip.classList.remove('on')}
      function pick(d){
        var a=gv(ia),p=gv(ip);
        if(phase()==='dep'&&d>a){setRange(a,d);render();setTimeout(close,250);return}
        setRange(d,null);
        ia.classList.remove('on');ip.classList.add('on');render();
      }
      [ia,ip].forEach(function(el){
        el.addEventListener('click',open);
        el.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '||e.key==='ArrowDown'){e.preventDefault();open()}});
      });
      box.addEventListener('click',function(e){
        var b=e.target.closest('button');if(!b)return;
        if(b.dataset.t){pick(+b.dataset.t);return}
        if(b.dataset.n){var d=new Date(first);first=Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+(+b.dataset.n),1);if(first<monthStart(today()))first=monthStart(today());render();return}
        if(b.dataset.act==='clear'){setRange(null,null);render();ia.classList.add('on');ip.classList.remove('on')}
        if(b.dataset.act==='close')close();
      });
      box.addEventListener('mouseover',function(e){
        var b=e.target.closest('.d');if(phase()!=='dep'||!b||b.disabled)return;
        var a=gv(ia),t=+b.dataset.t;
        $$('.d',box).forEach(function(x){var v=+x.dataset.t;x.classList.toggle('hov',t>a&&v>a&&v<t)});
      });
      box.addEventListener('mouseleave',function(){$$('.d.hov',box).forEach(function(x){x.classList.remove('hov')})});
      document.addEventListener('click',function(e){if(!box.hidden&&e.target.isConnected&&!box.contains(e.target)&&e.target!==ia&&e.target!==ip)close()});
      document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!box.hidden){close();ia.focus()}});
      window.addEventListener('resize',function(){if(!box.hidden)render()});
      f.addEventListener('reset',function(){setTimeout(function(){setRange(null,null);close()},0)});
      sel.addEventListener('change',function(){
        var a=gv(ia),p=gv(ip);
        if(a!==null&&(nightBusy(a)||(p!==null&&anyBusy(a,p)))){setRange(null,null);show(D.mBusy)}else refresh();
        if(!box.hidden)render();
      });
      fetch(ENDPOINT).then(function(r){return r.json()}).then(function(j){
        if(!j||!j.case)return;
        busy={};Object.keys(j.case).forEach(function(k){busy[k]=j.case[k].map(function(x){return[pd(x[0]),pd(x[1])]}).filter(function(x){return x[0]!==null&&x[1]!==null})});
        refresh();if(!box.hidden)render();
      }).catch(function(){});
    }

    // WhatsApp with form content
    var wb=$('#invia-wa');
    if(wb)wb.addEventListener('click',function(){
      var bad=check();
      if(bad){show(bad);av.scrollIntoView({block:'center',behavior:'smooth'});return}
      var a=gv(ia),p=gv(ip),o=parseInt($('#ospiti').value,10),nm=($('#name').value||'').trim();
      var house=sel.selectedIndex<3?sel.options[sel.selectedIndex].text:'';
      var t=D.waHello+' '+(house?D.waQ.replace('{h}',house):D.waQgen);
      if(a!==null&&p!==null)t+=' '+D.waFrom+' '+fd(a)+' '+D.waTo+' '+fd(p);
      else if(a!==null)t+=' '+D.waSince+' '+fd(a);
      else if(p!==null)t+=' '+D.waUntil+' '+fd(p);
      if(o>0)t+=' '+D.waFor+' '+o+' '+(o===1?D.waP1:D.waPn);
      t+='? '+D.waThanks+(nm?', '+nm:'!');
      window.open('https://wa.me/393932094189?text='+encodeURIComponent(t),'_blank','noopener');
    });

    // send via fetch
    f.addEventListener('submit',function(e){
      e.preventDefault();
      var bad=check();if(bad){show(bad);av.scrollIntoView({block:'center',behavior:'smooth'});return}
      var box=$('#esito'),btn=$('button[type=submit]',f),label=btn.textContent;
      box.setAttribute('role','status');
      btn.disabled=true;if(f.dataset.sending)btn.textContent=f.dataset.sending;
      fetch(f.action,{method:'POST',headers:{'Accept':'application/json'},body:new FormData(f)})
        .then(function(r){return r.json()})
        .then(function(j){
          if(j&&j.success){box.className='msg ok';box.textContent=f.dataset.ok;f.reset();show('')}
          else throw 0;
        })
        .catch(function(){box.className='msg err';box.textContent=f.dataset.err})
        .then(function(){btn.disabled=false;btn.textContent=label;box.scrollIntoView({block:'center',behavior:'smooth'})});
    });
  }

  // gallery filter
  var fb=$$('.filters button');
  fb.forEach(function(b){b.addEventListener('click',function(){
    fb.forEach(function(x){x.classList.toggle('on',x===b)});
    var k=b.dataset.f;
    $$('.masonry a').forEach(function(a){a.classList.toggle('hide',k!=='all'&&a.dataset.g!==k)});
  })});

  // lightbox
  var items=[],cur=0,lb;
  function build(){
    lb=document.createElement('div');lb.className='lb';lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');
    lb.innerHTML='<button class="x" aria-label="Close">&times;</button><button class="p" aria-label="Prev">&#8249;</button><img alt=""><button class="n" aria-label="Next">&#8250;</button><div class="cap"></div>';
    document.body.appendChild(lb);
    $('.x',lb).onclick=close;$('.p',lb).onclick=function(){go(-1)};$('.n',lb).onclick=function(){go(1)};
    lb.addEventListener('click',function(e){if(e.target===lb)close()});
    document.addEventListener('keydown',function(e){
      if(!lb.classList.contains('open'))return;
      if(e.key==='Escape')close();if(e.key==='ArrowLeft')go(-1);if(e.key==='ArrowRight')go(1);
    });
    var sx=0;
    lb.addEventListener('touchstart',function(e){sx=e.touches[0].clientX},{passive:true});
    lb.addEventListener('touchend',function(e){var dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>50)go(dx<0?1:-1)});
  }
  function show(){var a=items[cur],im=$('img',lb);im.src=a.href;im.alt=a.dataset.alt||'';$('.cap',lb).textContent=a.dataset.alt||''}
  function open(i){if(!lb)build();cur=i;show();lb.classList.add('open');document.body.style.overflow='hidden'}
  function close(){lb.classList.remove('open');document.body.style.overflow=''}
  function go(d){
    var n=cur;do{n=(n+d+items.length)%items.length}while(items[n].classList.contains('hide')&&n!==cur);
    cur=n;show();
  }
  items=$$('.masonry a');
  items.forEach(function(a,i){a.addEventListener('click',function(e){e.preventDefault();open(i)})});

  // comparsa allo scroll: gli elementi sono visibili di partenza e si nascondono solo se il JavaScript funziona
  var calm=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if('IntersectionObserver' in window&&!calm){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
    var vh=window.innerHeight;
    $$('.cards .card, .split, .routes > div, .band .wrap > *').forEach(function(el,i){
      if(el.getBoundingClientRect().top<vh)return;
      el.classList.add('rv');el.style.transitionDelay=((i%3)*90)+'ms';io.observe(el);
    });
  }
})();
