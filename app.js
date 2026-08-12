(() => {
  const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const MONTH_SHEET = {'JANEIRO':1,'FEVEREIRO':2,'MARÇO':3,'MARCO':3,'ABRIL':4,'MAIO':5,'JUNHO':6,'JULHO':7,'AGOSTO':8,'SETEMBRO':9,'OUTUBRO':10,'NOVEMBRO':11,'DEZEMBRO':12};
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const fmtInt = n => Math.round(Number(n)||0).toLocaleString('pt-BR');
  const fmtPct = n => (Number(n||0)*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%';
  const fmtMoney = n => (Number(n)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const fmtNum = n => (Number(n)||0).toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:2});
  const clamp = (n,a,b) => Math.min(b,Math.max(a,n));
  const safe = n => Number.isFinite(Number(n)) ? Number(n) : 0;
  const clone = obj => JSON.parse(JSON.stringify(obj));

  const DEFAULT_THEME = {name:'Vermithor',campaignTitle:'Dragão Vermithor',campaignTagline:'Transforme números em conquista.',preset:'vermithor',accent:'#f0a33a',secondary:'#ef5a29',bg:'#080b12',bg2:'#10141e',panel:'rgba(17,22,31,.88)',text:'#f5f6f8',background:'assets/vermithor.png',opacity:.28};
  const DEMO_USERS = [
    {email:'admin.geral@soften.local',password:'Admin123!',fullName:'Administrador Geral',role:'super_admin',squadCode:null,techName:null},
    {email:'admin.squadd@soften.local',password:'SquadD123!',fullName:'Administrador Squad D',role:'squad_admin',squadCode:'D',techName:null},
    ...[
      ['arthur.santos@soften.local','ARTHUR SANTOS'],['diego.martins@soften.local','DIEGO MARTINS'],['felipe.okamoto@soften.local','FELIPE OKAMOTO'],['guilherme.pereira@soften.local','GUILHERME PEREIRA'],['guilherme.tofoletti@soften.local','GUILHERME TOFOLETTI'],['mykael.keven@soften.local','MYKAEL KEVEN'],['olavo.duarte@soften.local','OLAVO DUARTE'],['rodolfo.donda@soften.local','RODOLFO DONDA']
    ].map(([email,techName])=>({email,password:'Tecnico123!',fullName:titleWords(techName),role:'technician',squadCode:'D',techName}))
  ];

  function loadDemoCreatedUsers(){
    try{const v=JSON.parse(localStorage.getItem('squadDashboardDemoUsersV21')||'[]');return Array.isArray(v)?v:[]}catch(e){return []}
  }
  function allDemoUsers(){
    const extra=loadDemoCreatedUsers();
    const map=new Map();
    [...DEMO_USERS,...extra].forEach(u=>map.set(String(u.email||'').toLowerCase(),u));
    return [...map.values()];
  }
  function saveDemoCreatedUsers(list){localStorage.setItem('squadDashboardDemoUsersV21',JSON.stringify(list||[]))}
  function findDemoUser(email){return allDemoUsers().find(x=>String(x.email).toLowerCase()===String(email).toLowerCase())}

  const state = {
    user:null,
    supabase:null,
    squads:loadDemoSquads(),
    squadCode:'D',
    currentId:null,
    techName:null,
    theme:clone(DEFAULT_THEME),
    currentView:'individual',
    userDirectory:[],
    userDirectoryLoaded:false
  };

  function loadDemoSquads(){
    const base={
      A:{code:'A',name:'Squad A',dbId:null,months:{}},
      B:{code:'B',name:'Squad B',dbId:null,months:{}},
      D:{code:'D',name:'Squad D',dbId:null,months:{[window.DEFAULT_SQUAD_DATA.id]:clone(window.DEFAULT_SQUAD_DATA)}},
      E:{code:'E',name:'Squad E',dbId:null,months:{}}
    };
    try{
      const saved=JSON.parse(localStorage.getItem('squadDashboardDataV2')||'null');
      if(saved&&typeof saved==='object'){
        for(const code of Object.keys(base)) if(saved[code]?.months) base[code].months=saved[code].months;
      }
    }catch(e){}
    return base;
  }
  function saveDemoSquads(){
    if((window.APP_CONFIG?.mode||'demo')!=='demo') return;
    const payload={}; Object.values(state.squads).forEach(s=>payload[s.code]={months:s.months});
    localStorage.setItem('squadDashboardDataV2',JSON.stringify(payload));
  }
  function allThemes(){try{return JSON.parse(localStorage.getItem('squadDashboardThemesV2')||'{}')}catch(e){return {}}}
  function loadThemeForSquad(code){const t=allThemes()[code];return t||clone(DEFAULT_THEME)}
  function saveTheme(){
    if(!state.squadCode||state.squadCode==='all')return;
    const themes=allThemes(); themes[state.squadCode]=state.theme; localStorage.setItem('squadDashboardThemesV2',JSON.stringify(themes));
    if(state.supabase) persistThemeToSupabase().catch(console.error);
  }

  async function boot(){
    bindStaticEvents();
    if((window.APP_CONFIG?.mode||'demo')==='supabase'){
      try{await initSupabase(); const {data}=await state.supabase.auth.getSession(); if(data?.session) await enterSupabaseSession(data.session.user);}
      catch(err){console.error(err); showLogin('Não foi possível conectar ao Supabase. Confira config.js.');}
    }else{
      try{const saved=JSON.parse(sessionStorage.getItem('squadDemoSession')||'null'); if(saved?.email){const u=findDemoUser(saved.email);if(u) return enterApp({...u});}}catch(e){}
      showLogin();
    }
  }

  function bindStaticEvents(){
    $('#loginForm').addEventListener('submit',handleLogin);
    $('#logoutBtn').addEventListener('click',logout);
    $$('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>showView(btn.dataset.view)));
    $('#mobileMenu').addEventListener('click',()=>$('.sidebar').classList.toggle('open'));
    $('#squadSelect').addEventListener('change',async e=>{await selectSquad(e.target.value);});
    $('#monthSelect').addEventListener('change',e=>{state.currentId=e.target.value; chooseDefaultTech(); refreshSelectors(); render();});
    $('#techSelect').addEventListener('change',e=>{state.techName=e.target.value; renderIndividual();});
    $('#adminImportBtn').addEventListener('click',openImport);
    $('#adminThemeBtn').addEventListener('click',()=>{if(requireSpecificSquad())openModal('themeModal')});
    $('#openUsersBtn').addEventListener('click',()=>showView('users'));
    $('#newUserBtn').addEventListener('click',openCreateUser);
    $('#createUserForm').addEventListener('submit',handleCreateUser);
    $('#newUserRole').addEventListener('change',syncCreateUserFields);
    $('#userSearchInput').addEventListener('input',renderUserRows);
    $('#userRoleFilter').addEventListener('change',renderUserRows);
    $('#chooseFileBtn').addEventListener('click',()=>$('#xlsxInput').click());
    $('#xlsxInput').addEventListener('change',handleFile);
    $$('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close)));
    $$('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)closeModal(m.id)}));
    $$('.preset').forEach(b=>b.addEventListener('click',()=>applyPreset(b.dataset.theme)));
    $('#accentColor').addEventListener('input',e=>{if(!isAdmin())return;document.documentElement.style.setProperty('--accent',e.target.value);state.theme.accent=e.target.value;state.theme.name='Personalizado';state.theme.preset='custom';saveTheme();updateThemeName();});
    $('#secondaryColor').addEventListener('input',e=>{if(!isAdmin())return;document.documentElement.style.setProperty('--accent2',e.target.value);state.theme.secondary=e.target.value;state.theme.name='Personalizado';state.theme.preset='custom';saveTheme();updateThemeName();});
    $('#backgroundFile').addEventListener('change',handleBackground);
    $('#campaignNameInput').addEventListener('input',e=>{if(!isAdmin())return;state.theme.campaignTitle=e.target.value;state.theme.name=e.target.value||'Personalizado';state.theme.preset='custom';saveTheme();applyTheme(state.theme);});
    $('#campaignTaglineInput').addEventListener('input',e=>{if(!isAdmin())return;state.theme.campaignTagline=e.target.value;state.theme.preset='custom';saveTheme();applyTheme(state.theme);});
    $('#saveGoalsBtn').addEventListener('click',saveTeamGoals);
    $('#autoGoalBtn').addEventListener('click',useAutomaticTeamGoal);
    $('#importThemeBtn').addEventListener('click',()=>{if(requireSpecificSquad())$('#themeJsonInput').click()});
    $('#themeJsonInput').addEventListener('change',handleThemeJson);
    $('#exportThemeBtn').addEventListener('click',exportTheme);
    $('#removeBg').addEventListener('click',()=>{if(!isAdmin())return;state.theme.background=null;state.theme.preset='custom';document.documentElement.style.setProperty('--hero-img','none');saveTheme();toast('Fundo removido.');});
  }

  async function handleLogin(e){
    e.preventDefault(); $('#loginError').textContent='';
    const email=$('#loginEmail').value.trim().toLowerCase(), password=$('#loginPassword').value;
    const btn=$('.login-submit'); btn.disabled=true; btn.textContent='Entrando...';
    try{
      if((window.APP_CONFIG?.mode||'demo')==='supabase'){
        const {data,error}=await state.supabase.auth.signInWithPassword({email,password}); if(error)throw error; await enterSupabaseSession(data.user);
      }else{
        const u=allDemoUsers().find(x=>String(x.email).toLowerCase()===email&&x.password===password); if(!u)throw new Error('E-mail ou senha inválidos.'); sessionStorage.setItem('squadDemoSession',JSON.stringify({email:u.email})); await enterApp({...u});
      }
    }catch(err){$('#loginError').textContent=humanAuthError(err);}finally{btn.disabled=false;btn.textContent='Entrar';}
  }
  function humanAuthError(err){const m=String(err?.message||err||'');if(/invalid login|invalid.*credential/i.test(m))return'E-mail ou senha inválidos.';return m||'Não foi possível entrar.'}
  function showLogin(message=''){ $('#loginScreen').classList.remove('hidden');$('#appShell').classList.add('hidden');if(message)$('#loginError').textContent=message; }
  async function logout(){
    if(state.supabase) await state.supabase.auth.signOut(); sessionStorage.removeItem('squadDemoSession'); state.user=null;showLogin();
  }

  async function enterApp(user){
    state.user=user;
    state.userDirectoryLoaded=false;state.userDirectory=[];
    state.squadCode=user.role==='super_admin'?'D':(user.squadCode||'D');
    chooseLatestMonth(); chooseDefaultTech();
    state.theme=state.squads[state.squadCode]?.theme||loadThemeForSquad(state.squadCode); applyTheme(state.theme);
    applyPermissions(); refreshSelectors(); render();
    $('#loginScreen').classList.add('hidden');$('#appShell').classList.remove('hidden');
  }
  function applyPermissions(){
    const admin=isAdmin(), superAdmin=isSuperAdmin();
    $$('.admin-only').forEach(el=>el.classList.toggle('hidden',!admin));
    $$('.super-only').forEach(el=>el.classList.toggle('hidden',!superAdmin));
    $$('.admin-help').forEach(el=>el.classList.toggle('hidden',!admin));
    $('.technician-control').classList.toggle('hidden',isTechnician()||state.currentView!=='individual'||state.squadCode==='all');
    $('#sideUserName').textContent=state.user.fullName;$('#topUserName').textContent=state.user.fullName;
    $('#sideUserRole').textContent=roleLabel(state.user.role);$('#topUserScope').textContent=state.user.role==='super_admin'?'Acesso geral':`Squad ${state.user.squadCode}`;
    const initial=(state.user.fullName||'U').charAt(0).toUpperCase();$('#sideAvatar').textContent=initial;$('#topAvatar').textContent=initial;
  }
  function isTechnician(){return state.user?.role==='technician'}
  function isAdmin(){return ['squad_admin','super_admin'].includes(state.user?.role)}
  function isSuperAdmin(){return state.user?.role==='super_admin'}
  function roleLabel(r){return r==='super_admin'?'Admin geral':r==='squad_admin'?'Admin do Squad':'Técnico'}

  function currentSquad(){return state.squadCode==='all'?null:state.squads[state.squadCode]}
  function currentMonths(){return currentSquad()?.months||{}}
  function currentMonth(){return currentMonths()[state.currentId]||null}
  function currentTech(){const m=currentMonth();if(!m)return null;return m.technicians.find(t=>t.name===state.techName)||m.technicians[0]||null}
  function chooseLatestMonth(){const ids=Object.keys(currentMonths()).sort().reverse();state.currentId=ids[0]||null}
  function chooseDefaultTech(){const m=currentMonth();if(!m){state.techName='';return}if(isTechnician()){state.techName=state.user.techName||m.technicians[0]?.name||'';return}if(!m.technicians.some(t=>t.name===state.techName))state.techName=m.technicians[0]?.name||''}

  async function selectSquad(code){
    if(!isSuperAdmin())return; state.squadCode=code;
    if(code==='all'){state.currentId=null;state.techName='';applyTheme(clone(DEFAULT_THEME));if(state.currentView==='individual')showView('team');}
    else{chooseLatestMonth();chooseDefaultTech();state.theme=state.squads[code]?.theme||loadThemeForSquad(code);applyTheme(state.theme);}
    refreshSelectors();render();applyPermissions();
  }
  function requireSpecificSquad(){if(state.squadCode==='all'){toast('Selecione um Squad específico primeiro.');return false}return true}

  function showView(name){
    if((name==='admin'||name==='users')&&!isAdmin())return;
    if(name==='individual'&&state.squadCode==='all')name='team';
    state.currentView=name;
    $$('.view').forEach(v=>v.classList.remove('active')); $('#view-'+name).classList.add('active');
    $$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
    const titles={individual:'Meu desempenho',team:'Visão do Squad',users:'Usuários',admin:'Administração',help:'Como usar'};
    $('#pageTitle').textContent=titles[name]||'Performance Hub';
    $('.technician-control').classList.toggle('hidden',name!=='individual'||isTechnician()||state.squadCode==='all');
    $('.month-control').classList.toggle('hidden',name==='users'||name==='help');
    $('.sidebar').classList.remove('open');
    render();
  }

  function refreshSelectors(){
    if(isSuperAdmin()) $('#squadSelect').innerHTML=`<option value="all" ${state.squadCode==='all'?'selected':''}>Todos os Squads</option>`+Object.values(state.squads).sort((a,b)=>a.code.localeCompare(b.code)).map(s=>`<option value="${s.code}" ${s.code===state.squadCode?'selected':''}>${escapeHtml(s.name)}</option>`).join('');
    const m=currentMonth(), ids=Object.keys(currentMonths()).sort().reverse();
    $('#monthSelect').disabled=!ids.length||state.squadCode==='all';
    $('#monthSelect').innerHTML=ids.length?ids.map(id=>{const mm=currentMonths()[id];return `<option value="${id}" ${id===state.currentId?'selected':''}>${mm.monthName} ${mm.year}</option>`}).join(''):'<option>Sem dados</option>';
    if(m){chooseDefaultTech();$('#techSelect').innerHTML=m.technicians.map(t=>`<option ${t.name===state.techName?'selected':''}>${escapeHtml(t.name)}</option>`).join('')}else $('#techSelect').innerHTML='<option>Sem dados</option>';
    const label=state.squadCode==='all'?'TODOS OS SQUADS':`SQUAD ${state.squadCode}`;$('#squadEyebrow').textContent=label;
  }

  function render(){
    applyPermissions();
    if(state.currentView==='users')renderUsers().catch(err=>{console.error(err);toast('Não foi possível carregar os usuários.')});
    if(state.currentView==='help')renderHelp();
    if(state.squadCode==='all'){renderTeam();renderAdmin();return}
    const m=currentMonth();
    $('#individualEmpty').classList.toggle('hidden',!!m);$('#individualContent').classList.toggle('hidden',!m);
    $('#teamEmpty').classList.toggle('hidden',!!m);$('#teamContent').classList.toggle('hidden',!m);
    if(m){renderIndividual();renderTeam();}
    renderAdmin();
  }

  function renderIndividual(){
    const m=currentMonth(),t=currentTech();if(!m||!t)return;
    const attPct=t.goalAtt?safe(t.att)/t.goalAtt:0,notePct=t.goalEval?safe(t.notes5)/t.goalEval:0;
    $('#heroName').textContent=firstName(t.name);$('#heroStatus').textContent=overallLabel(attPct,notePct);$('#heroStatus').style.color=overallColor(attPct,notePct);$('#heroMessage').textContent=buildHeroMessage(t,attPct,notePct);
    $('#lastUpdate').textContent=`Atualizado até ${String(m.latestDay||1).padStart(2,'0')}/${String(m.month).padStart(2,'0')}`;$('#sourceFile').textContent=m.sourceFile||'Dados do banco';
    $('#rankNumber').textContent=t.rank?`#${t.rank}`:'—';$('#rankContext').textContent=`de ${m.technicians.length} no Squad ${state.squadCode}`;
    $('#kpiAtt').textContent=fmtInt(t.att);$('#kpiAttGoal').textContent=`/ ${fmtInt(t.goalAtt)}`;$('#attBar').style.width=clamp(attPct*100,0,100)+'%';$('#attProgress').textContent=fmtPct(attPct);$('#attRemaining').textContent=t.att>=t.goalAtt?`+${fmtInt(t.att-t.goalAtt)} acima`:`Faltam ${fmtInt(t.goalAtt-t.att)}`;
    $('#kpiNotes').textContent=fmtInt(t.notes5);$('#kpiNotesGoal').textContent=`/ ${fmtInt(t.goalEval)}`;$('#noteBar').style.width=clamp(notePct*100,0,100)+'%';$('#noteProgress').textContent=fmtPct(notePct);$('#noteRemaining').textContent=t.notes5>=t.goalEval?`+${fmtInt(t.notes5-t.goalEval)} acima`:`Faltam ${fmtInt(t.goalEval-t.notes5)}`;
    $('#kpiEvalPct').textContent=fmtPct(t.evalPct);$('#evalCount').textContent=`${fmtInt(t.totalEval)} avaliações`;$('#avgRating').textContent=`Média ${safe(t.avg).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}`;$('#evalQuality').textContent=t.evalPct>=.343?'Meta de avaliação atingida':t.avg>=4.9?'Qualidade excelente':'Acompanhar qualidade';
    $('#kpiPoints').textContent=fmtNum(t.points);$('#goalsHit').textContent=`${fmtInt(t.goalsHit)} ${t.goalsHit===1?'meta batida':'metas batidas'}`;$('#discountValue').textContent=`Desconto ${fmtMoney(t.discount)}`;$('#bonusValue').textContent=`Bônus ${fmtMoney(t.pointBonus)}`;
    $('#attGoalPct').textContent=fmtPct(attPct);$('#noteGoalPct').textContent=fmtPct(notePct);$('#attGoalText').textContent=goalLine('atendimentos',t.att,t.goalAtt);$('#noteGoalText').textContent=goalLine('notas',t.notes5,t.goalEval);
    $('#goalOrb').style.background=overallColor(attPct,notePct);$('#goalOrb').style.boxShadow=`0 0 18px ${overallColor(attPct,notePct)}`;const coach=coachText(t,m,attPct,notePct);$('#coachTitle').textContent=coach.title;$('#coachText').textContent=coach.text;
    renderGamification(t,m,attPct,notePct);renderChart(t,m);renderDaily(t,m);renderMiniRanking(m,t.name);
  }

  function renderGamification(t,m,attPct,notePct){
    const levels=[{min:0,name:'Recruta'},{min:250,name:'Explorador'},{min:400,name:'Guardião'},{min:550,name:'Mestre'},{min:700,name:'Lenda'}];
    let idx=0;for(let i=0;i<levels.length;i++)if(safe(t.points)>=levels[i].min)idx=i;
    const cur=levels[idx],next=levels[Math.min(idx+1,levels.length-1)],toNext=idx===levels.length-1?1:clamp((safe(t.points)-cur.min)/(next.min-cur.min),0,1);
    const rhythm=clamp(((attPct+notePct)/2)*100,0,100);$('#xpRing').style.setProperty('--p',rhythm);$('#xpPercent').textContent=Math.round(rhythm)+'%';$('#levelBadge').textContent=`NÍVEL ${idx+1}`;$('#levelName').textContent=cur.name;$('#levelBar').style.width=(toNext*100)+'%';$('#nextLevelText').textContent=idx===levels.length-1?'Nível máximo da campanha':`Faltam ${fmtInt(next.min-safe(t.points))} pts para ${next.name}`;$('#levelText').textContent=`${fmtNum(t.points)} pontos no mês • ranking #${t.rank||'—'} do Squad ${state.squadCode}.`;
    let mission;if(attPct>=1&&notePct>=1)mission=['Defenda sua posição','As duas metas foram atingidas. Sustente qualidade e volume até o fechamento.'];else if(attPct<notePct)mission=['Conquiste atendimentos',goalLine('atendimentos',t.att,t.goalAtt)];else mission=['Busque notas 5',goalLine('notas',t.notes5,t.goalEval)];$('#missionTitle').textContent=mission[0];$('#missionText').textContent=mission[1];
    const productive=(t.daily||[]).filter(d=>d.day<=m.latestDay&&!d.off&&safe(d.att)>=10).length;
    const badges=[
      {icon:'🏆',name:'Top 3',desc:'Ranking do Squad',ok:safe(t.rank)>0&&safe(t.rank)<=3},
      {icon:'⭐',name:'Qualidade',desc:'Média ≥ 4,95',ok:safe(t.avg)>=4.95},
      {icon:'%',name:'Avaliações',desc:'≥ 34,3%',ok:safe(t.evalPct)>=.343},
      {icon:'☎',name:'Volume',desc:'Meta de atend.',ok:attPct>=1},
      {icon:'◆',name:'Notas 5',desc:'Meta de notas',ok:notePct>=1},
      {icon:'🔥',name:'Constância',desc:'3 dias com 10+',ok:productive>=3}
    ];
    $('#achievementBadges').innerHTML=badges.map(b=>`<div class="achievement ${b.ok?'unlocked':'locked'}"><i>${b.icon}</i><b>${b.name}</b><span>${b.ok?'CONQUISTADO':b.desc}</span></div>`).join('');
  }

  function renderChart(t,m){
    const data=(t.daily||[]).filter(d=>d.day<=Math.max(m.latestDay||31,1)&&!d.off);const w=720,h=230,p={l:34,r:16,t:15,b:30};const maxVal=Math.max(5,...data.flatMap(d=>[safe(d.att),safe(d.notes5)]));const x=i=>p.l+(data.length<=1?0:i*(w-p.l-p.r)/(data.length-1));const y=v=>p.t+(h-p.t-p.b)-(safe(v)/maxVal)*(h-p.t-p.b);const points=key=>data.map((d,i)=>`${x(i)},${y(d[key])}`).join(' ');const area=`${p.l},${h-p.b} ${points('att')} ${x(Math.max(0,data.length-1))},${h-p.b}`;const yTicks=[0,.25,.5,.75,1].map(f=>{const yy=p.t+(1-f)*(h-p.t-p.b),v=Math.round(maxVal*f);return `<line x1="${p.l}" y1="${yy}" x2="${w-p.r}" y2="${yy}" class="grid-line"/><text x="2" y="${yy+4}" class="axis-label">${v}</text>`}).join('');const xLabels=data.map((d,i)=>i%Math.max(1,Math.ceil(data.length/7))===0?`<text x="${x(i)-5}" y="${h-7}" class="axis-label">${String(d.day).padStart(2,'0')}</text>`:'').join('');const circles=(key,cls)=>data.map((d,i)=>`<circle cx="${x(i)}" cy="${y(safe(d[key]))}" r="4" class="chart-point" fill="${cls==='att'?'var(--accent)':'var(--success)'}"><title>Dia ${d.day}: ${safe(d[key])}</title></circle>`).join('');$('#dailyChart').innerHTML=data.length?`<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><linearGradient id="attGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="var(--accent)"/><stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>${yTicks}<polygon points="${area}" class="att-area"/><polyline points="${points('att')}" class="att-line"/><polyline points="${points('notes5')}" class="note-line"/>${circles('att','att')}${circles('notes5','note')}${xLabels}</svg>`:'<div class="muted">Sem lançamentos diários disponíveis.</div>';
  }
  function renderDaily(t,m){const rows=(t.daily||[]).filter(d=>d.day<=m.latestDay&&!d.off&&(d.att||d.notes5)).sort((a,b)=>b.day-a.day);const avgAtt=rows.length?rows.reduce((s,d)=>s+safe(d.att),0)/rows.length:0;$('#dailySummary').textContent=`Média ${avgAtt.toLocaleString('pt-BR',{maximumFractionDigits:1})} atend./dia`;$('#dailyRows').innerHTML=rows.map(d=>{const pct=d.att?safe(d.notes5)/safe(d.att):0,goal=t.goalAtt&&m.latestDay?t.goalAtt/Math.max(1,businessDaysMonFri(m.year,m.month)):avgAtt,pace=safe(d.att)>=goal?'good':safe(d.att)>=goal*.72?'mid':'low',label=pace==='good'?'FORTE':pace==='mid'?'OK':'ATENÇÃO';return `<tr><td><strong>${String(d.day).padStart(2,'0')}/${String(m.month).padStart(2,'0')}</strong></td><td>${fmtInt(d.att)}</td><td>${fmtInt(d.notes5)}</td><td>${fmtPct(pct)}</td><td><span class="pace ${pace}">${label}</span></td></tr>`}).join('')||'<tr><td colspan="5" class="muted">Nenhum lançamento diário encontrado.</td></tr>'}
  function renderMiniRanking(m,selected){const list=[...m.technicians].sort((a,b)=>(a.rank||99)-(b.rank||99));$('#miniRanking').innerHTML=list.slice(0,6).map(t=>`<div class="rank-row ${t.name===selected?'selected':''}"><span class="rank-pos">${t.rank||'—'}</span><div><strong>${escapeHtml(shortName(t.name))}</strong><small>${fmtInt(t.att)} atend. • ${fmtInt(t.notes5)} notas</small></div><span class="rank-score">${fmtNum(t.points)} pts</span></div>`).join('')}

  function renderTeam(){
    const all=state.squadCode==='all';$('#allSquadsPanel').classList.toggle('hidden',!all);$('#singleSquadPanel').classList.toggle('hidden',all);if(all){renderPortfolio();return}
    const m=currentMonth();if(!m)return;const totals=m.teamTotals||deriveTotals(m.technicians),cfg=teamSettings(m),attProgress=cfg.teamGoalAtt?totals.att/cfg.teamGoalAtt:0,evalProgress=cfg.teamGoalEvalPct?totals.evalPct/cfg.teamGoalEvalPct:0;
    $('#teamResult').textContent=m.teamResult||'—';$('#teamAtt').textContent=fmtInt(totals.att);$('#teamAttGoal').textContent=fmtInt(cfg.teamGoalAtt);$('#teamEval').textContent=fmtInt(totals.eval);$('#teamPct').textContent=fmtPct(totals.evalPct);$('#teamPctGoal').textContent=fmtPct(cfg.teamGoalEvalPct);$('#teamAttBar').style.width=clamp(attProgress*100,0,100)+'%';$('#teamPctBar').style.width=clamp(evalProgress*100,0,100)+'%';$('#teamAttNote').textContent=totals.att>=cfg.teamGoalAtt?`${fmtInt(totals.att-cfg.teamGoalAtt)} acima da meta`:`${fmtPct(attProgress)} da meta • faltam ${fmtInt(cfg.teamGoalAtt-totals.att)}`;$('#teamPctNote').textContent=totals.evalPct>=cfg.teamGoalEvalPct?`${((totals.evalPct-cfg.teamGoalEvalPct)*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})} p.p. acima da meta`:`Faltam ${((cfg.teamGoalEvalPct-totals.evalPct)*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})} p.p. para a meta`;$('#teamHeroTitle').textContent=`Squad ${state.squadCode} em ${m.monthName}`;
    const list=[...m.technicians].sort((a,b)=>(a.rank||99)-(b.rank||99));$('#teamLeaderboard').innerHTML=list.map(t=>`<div class="leader-item ${t.rank===1?'top1':''}"><div class="place">#${t.rank||'—'}</div><div class="name">${escapeHtml(t.name)}</div><div class="metric"><span>Atend.</span><strong>${fmtInt(t.att)}</strong></div><div class="metric"><span>Notas 5</span><strong>${fmtInt(t.notes5)}</strong></div><div class="metric hide-md"><span>% Aval.</span><strong>${fmtPct(t.evalPct)}</strong></div><div class="metric points"><span>Pontos</span><strong>${fmtNum(t.points)}</strong></div><div><span class="status ${String(t.status).toUpperCase()==='ACIMA'?'above':'below'}">${escapeHtml(t.status||'—')}</span></div></div>`).join('');
  }
  function renderPortfolio(){
    $('#squadPortfolio').innerHTML=Object.values(state.squads).sort((a,b)=>a.code.localeCompare(b.code)).map(s=>{const ids=Object.keys(s.months||{}).sort().reverse(),m=ids.length?s.months[ids[0]]:null;if(!m)return `<article class="card squad-card" data-squad-card="${s.code}"><div class="squad-card-head"><div class="squad-letter">${s.code}</div><span class="status-line">SEM DADOS</span></div><h3>${escapeHtml(s.name)}</h3><div class="squad-empty">Aguardando a primeira importação.</div></article>`;const totals=m.teamTotals||deriveTotals(m.technicians);return `<article class="card squad-card" data-squad-card="${s.code}"><div class="squad-card-head"><div class="squad-letter">${s.code}</div><span class="status ${String(m.teamResult).toUpperCase()==='ACIMA'?'above':'below'}">${escapeHtml(m.teamResult||'—')}</span></div><h3>${escapeHtml(s.name)}</h3><div class="status-line">${m.monthName} ${m.year} • ${m.technicians.length} técnicos</div><div class="squad-summary"><div><span>Atend.</span><strong>${fmtInt(totals.att)}</strong></div><div><span>Aval.</span><strong>${fmtInt(totals.eval)}</strong></div><div><span>% Aval.</span><strong>${fmtPct(totals.evalPct)}</strong></div></div></article>`}).join('');
    $$('[data-squad-card]').forEach(el=>el.addEventListener('click',()=>selectSquad(el.dataset.squadCard)));
  }

  function renderHelp(){
    if(!state.user)return;
    $('#helpRoleName').textContent=roleLabel(state.user.role);
    $('#helpRoleScope').textContent=isSuperAdmin()?'Todos os Squads':`Squad ${state.user.squadCode}`;
  }

  async function renderUsers(){
    if(!isAdmin())return;
    $('#usersScopeText').textContent=isSuperAdmin()
      ? (state.squadCode==='all'?'Você está vendo usuários de todos os Squads.':'Você está filtrando a gestão para o Squad '+state.squadCode+'.')
      : `Você administra somente os técnicos do Squad ${state.user.squadCode}.`;
    if(!state.userDirectoryLoaded) await loadUserDirectory();
    renderUserRows();
  }
  async function loadUserDirectory(){
    if(!isAdmin())return;
    if(state.supabase){
      let q=state.supabase.from('profiles').select('user_id,email,full_name,role,squad_id,technician_name,active,squads(code,name)').order('full_name');
      if(!isSuperAdmin() && currentSquad()?.dbId) q=q.eq('squad_id',currentSquad().dbId);
      const {data,error}=await q;if(error)throw error;
      state.userDirectory=(data||[]).map(p=>({userId:p.user_id,email:p.email||'',fullName:p.full_name,role:p.role,squadCode:p.squads?.code||null,techName:p.technician_name||'',active:p.active!==false}));
    }else{
      state.userDirectory=allDemoUsers().map((u,i)=>({userId:u.userId||`demo-${i}`,email:u.email,fullName:u.fullName,role:u.role,squadCode:u.squadCode||null,techName:u.techName||'',active:u.active!==false}));
    }
    state.userDirectoryLoaded=true;
  }
  function scopedUserDirectory(){
    let list=[...(state.userDirectory||[])];
    if(!isSuperAdmin()) list=list.filter(u=>u.squadCode===state.user.squadCode);
    else if(state.squadCode!=='all') list=list.filter(u=>u.squadCode===state.squadCode || (u.role==='super_admin'&&!u.squadCode));
    return list;
  }
  function renderUserRows(){
    if(!isAdmin()||!$('#userRows'))return;
    const search=String($('#userSearchInput')?.value||'').trim().toLowerCase(),role=$('#userRoleFilter')?.value||'all';
    let list=scopedUserDirectory();
    if(role!=='all')list=list.filter(u=>u.role===role);
    if(search)list=list.filter(u=>[u.fullName,u.email,u.techName,u.squadCode].some(v=>String(v||'').toLowerCase().includes(search)));
    $('#usersCountLabel').textContent=`${list.length} ${list.length===1?'usuário':'usuários'}`;
    const all=scopedUserDirectory(),counts={super_admin:0,squad_admin:0,technician:0};all.forEach(u=>{if(counts[u.role]!=null)counts[u.role]++});
    $('#userStats').innerHTML=`<div class="card user-stat"><span>Total no escopo</span><strong>${all.length}</strong></div><div class="card user-stat"><span>Admins gerais</span><strong>${counts.super_admin}</strong></div><div class="card user-stat"><span>Admins de Squad</span><strong>${counts.squad_admin}</strong></div><div class="card user-stat"><span>Técnicos</span><strong>${counts.technician}</strong></div>`;
    if(!list.length){$('#userRows').innerHTML='<tr><td colspan="5"><div class="users-empty">Nenhum usuário encontrado neste filtro.</div></td></tr>';return}
    $('#userRows').innerHTML=list.sort((a,b)=>String(a.fullName).localeCompare(String(b.fullName),'pt-BR')).map(u=>`<tr><td><div class="user-cell"><span class="user-avatar table-avatar">${escapeHtml((u.fullName||'U').charAt(0).toUpperCase())}</span><div><strong>${escapeHtml(u.fullName||'Sem nome')}</strong><small>${escapeHtml(u.email||'E-mail não informado')}</small></div></div></td><td><span class="role-pill ${u.role}">${escapeHtml(roleLabel(u.role))}</span></td><td>${u.squadCode?`Squad ${escapeHtml(u.squadCode)}`:'Todos'}</td><td>${escapeHtml(u.techName||'—')}</td><td><span class="status-dot ${u.active?'on':'off'}"></span>${u.active?'Ativo':'Inativo'}</td></tr>`).join('');
  }
  function openCreateUser(){
    if(!isAdmin())return;
    $('#createUserForm').reset();$('#createUserError').textContent='';
    const roleSel=$('#newUserRole');
    if(isSuperAdmin()) roleSel.innerHTML='<option value="technician">Técnico</option><option value="squad_admin">Admin do Squad</option><option value="super_admin">Admin geral</option>';
    else roleSel.innerHTML='<option value="technician">Técnico</option>';
    const squadSel=$('#newUserSquad');
    const allowed=isSuperAdmin()?Object.values(state.squads):[state.squads[state.user.squadCode]].filter(Boolean);
    squadSel.innerHTML=allowed.sort((a,b)=>a.code.localeCompare(b.code)).map(s=>`<option value="${escapeHtml(s.code)}">Squad ${escapeHtml(s.code)}</option>`).join('');
    const preferred=state.squadCode!=='all'&&allowed.some(s=>s.code===state.squadCode)?state.squadCode:(state.user.squadCode||allowed[0]?.code);
    if(preferred)squadSel.value=preferred;
    $('#userModalHint').textContent=isSuperAdmin()?'Você pode criar administradores e técnicos em qualquer Squad.':`Você pode criar técnicos somente no Squad ${state.user.squadCode}.`;
    syncCreateUserFields();openModal('userModal');
  }
  function syncCreateUserFields(){
    const role=$('#newUserRole').value,isSuper=role==='super_admin';
    $('#newUserSquad').disabled=isSuper||!isSuperAdmin();
    $('#technicianNameField').classList.toggle('hidden',role!=='technician');
    $('#newUserTechName').required=role==='technician';
    if(isSuper)$('#newUserSquad').value='';
  }
  async function handleCreateUser(e){
    e.preventDefault();if(!isAdmin())return;
    const submit=$('#createUserSubmit');submit.disabled=true;submit.textContent='Criando...';$('#createUserError').textContent='';
    try{
      const role=$('#newUserRole').value;
      const payload={fullName:$('#newUserName').value.trim(),email:$('#newUserEmail').value.trim().toLowerCase(),password:$('#newUserPassword').value,role,squadCode:role==='super_admin'?null:$('#newUserSquad').value,techName:role==='technician'?$('#newUserTechName').value.trim().toUpperCase():null};
      validateNewUserPayload(payload);
      if(state.supabase) await createSupabaseUser(payload); else createDemoUser(payload);
      state.userDirectoryLoaded=false;await loadUserDirectory();renderUserRows();closeModal('userModal');toast(`Usuário ${payload.fullName} criado com sucesso.`);
    }catch(err){console.error(err);$('#createUserError').textContent=humanCreateUserError(err)}finally{submit.disabled=false;submit.textContent='Criar usuário'}
  }
  function validateNewUserPayload(p){
    if(!p.fullName)throw new Error('Informe o nome completo.');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))throw new Error('Informe um e-mail válido.');if(String(p.password||'').length<8)throw new Error('A senha temporária deve ter pelo menos 8 caracteres.');
    if(!['technician','squad_admin','super_admin'].includes(p.role))throw new Error('Perfil inválido.');if(!isSuperAdmin()&&p.role!=='technician')throw new Error('Admin do Squad pode criar somente técnicos.');if(!isSuperAdmin()&&p.squadCode!==state.user.squadCode)throw new Error('Você só pode cadastrar usuários no seu próprio Squad.');if(p.role!=='super_admin'&&!state.squads[p.squadCode])throw new Error('Selecione um Squad válido.');if(p.role==='technician'&&!p.techName)throw new Error('Informe o nome do técnico como aparece na planilha.');
  }
  function createDemoUser(p){
    if(allDemoUsers().some(u=>String(u.email).toLowerCase()===p.email))throw new Error('Já existe um usuário com este e-mail.');
    const list=loadDemoCreatedUsers();list.push({email:p.email,password:p.password,fullName:p.fullName,role:p.role,squadCode:p.squadCode,techName:p.techName,active:true,userId:`demo-${Date.now()}`});saveDemoCreatedUsers(list);
  }
  async function createSupabaseUser(p){
    const body={full_name:p.fullName,email:p.email,password:p.password,role:p.role,squad_code:p.squadCode,technician_name:p.techName};
    const {data,error}=await state.supabase.functions.invoke('create-user',{body});if(error)throw error;if(data?.error)throw new Error(data.error);return data;
  }
  function humanCreateUserError(err){const m=String(err?.message||err||'');if(/already|registered|duplicate|unique/i.test(m))return'Já existe um usuário com este e-mail.';if(/function|failed to fetch|non-2xx/i.test(m))return'Falha ao criar no servidor. Confira se a Edge Function create-user foi publicada.';return m||'Não foi possível criar o usuário.'}

  function renderAdmin(){
    if(!isAdmin())return;const specific=state.squadCode!=='all',m=currentMonth();$('#adminScopeTitle').textContent=specific?`Squad ${state.squadCode}`:'Todos os Squads';$('#adminScopeText').textContent=specific?'Importação, metas e tema abaixo afetam somente este Squad.':'Para alterar dados, metas ou tema, selecione um Squad específico no topo.';
    ['#adminImportBtn','#adminThemeBtn','#saveGoalsBtn','#autoGoalBtn','#importThemeBtn','#exportThemeBtn'].forEach(sel=>{$(sel).disabled=!specific});
    if(!specific||!m){$('#monthHistory').innerHTML=specific?'<div class="muted">Nenhum mês importado neste Squad.</div>':'<div class="muted">Selecione um Squad específico para ver o histórico.</div>';$('#teamGoalAttInput').value='';$('#teamGoalPctInput').value='';$('#autoGoalHint').textContent=m?'':'Importe um mês para configurar as metas.';updateThemeName();return}
    const ids=Object.keys(currentMonths()).sort().reverse(),cfg=teamSettings(m);$('#monthHistory').innerHTML=ids.map(id=>{const mm=currentMonths()[id];return `<div class="history-row"><div><strong>${mm.monthName} ${mm.year}</strong><small>${escapeHtml(mm.sourceFile||'Banco de dados')} • ${mm.technicians.length} técnicos • até dia ${mm.latestDay}</small></div><span class="tag">${id===state.currentId?'EM USO':'SALVO'}</span><button class="link-btn" data-open-month="${id}">Abrir</button></div>`}).join('');$$('[data-open-month]').forEach(b=>b.addEventListener('click',()=>{state.currentId=b.dataset.openMonth;chooseDefaultTech();refreshSelectors();render();showView('individual')}));$('#teamGoalAttInput').value=Math.round(cfg.teamGoalAtt);$('#teamGoalPctInput').value=(cfg.teamGoalEvalPct*100).toFixed(1);const useful=businessDaysMonFri(m.year,m.month),suggested=autoTeamAttGoal(m);$('#autoGoalHint').textContent=`Sugestão: ${useful} dias úteis × 10 atendimentos × ${m.technicians.length} técnicos = ${fmtInt(suggested)} atendimentos.`;updateThemeName();
  }

  function businessDaysMonFri(y,m){let c=0,days=new Date(y,m,0).getDate();for(let d=1;d<=days;d++){const dow=new Date(y,m-1,d).getDay();if(dow>=1&&dow<=5)c++}return c}
  function autoTeamAttGoal(m){return businessDaysMonFri(m.year,m.month)*10*Math.max(1,m.technicians.length)}
  function teamSettings(m){const saved=m?.settings||{};return{teamGoalAtt:safe(saved.teamGoalAtt)||autoTeamAttGoal(m),teamGoalEvalPct:Number.isFinite(Number(saved.teamGoalEvalPct))?Number(saved.teamGoalEvalPct):.343}}
  async function saveTeamGoals(){if(!isAdmin()||!requireSpecificSquad())return;const m=currentMonth();if(!m)return;const att=Math.max(0,safe($('#teamGoalAttInput').value)),pct=Math.max(0,safe($('#teamGoalPctInput').value))/100;m.settings={...(m.settings||{}),teamGoalAtt:att||autoTeamAttGoal(m),teamGoalEvalPct:pct};saveDemoSquads();if(state.supabase)await state.supabase.from('squad_months').update({team_goal_att:m.settings.teamGoalAtt,team_goal_eval_pct:m.settings.teamGoalEvalPct}).eq('id',m.dbId);renderTeam();renderAdmin();toast('Metas salvas para '+m.monthName+'.')}
  function useAutomaticTeamGoal(){const m=currentMonth();if(!m)return;$('#teamGoalAttInput').value=autoTeamAttGoal(m);if(!$('#teamGoalPctInput').value)$('#teamGoalPctInput').value='34.3';toast('Meta automática calculada. Clique em Salvar metas.')}
  function deriveTotals(list){const att=(list||[]).reduce((s,t)=>s+safe(t.att),0),evals=(list||[]).reduce((s,t)=>s+safe(t.totalEval),0),points=(list||[]).reduce((s,t)=>s+safe(t.points),0);return{att,eval:evals,evalPct:att?evals/att:0,points}}
  function goalLine(noun,current,goal){if(!goal)return'Meta não encontrada.';if(current>=goal)return`Meta atingida: ${fmtInt(current-goal)} ${noun} acima do objetivo.`;return`Faltam ${fmtInt(goal-current)} ${noun} para atingir a meta.`}
  function buildHeroMessage(t,a,n){if(a>=1&&n>=1)return'Excelente ritmo: as duas metas mensais já foram atingidas.';if(a>=1)return'Meta de atendimentos atingida. Agora o foco é completar as notas 5.';if(n>=1)return'Meta de notas 5 atingida. Agora o foco é completar os atendimentos.';return`Você está em ${fmtPct(a)} da meta de atendimentos e ${fmtPct(n)} da meta de notas 5.`}
  function coachText(t,m,a,n){if(a>=1&&n>=1)return{title:'Meta completa!',text:'As duas metas foram batidas. O objetivo agora é sustentar qualidade e produtividade.'};const remainingDays=Math.max(1,businessDaysRemaining(m.year,m.month,m.latestDay)),attNeed=Math.max(0,t.goalAtt-t.att),noteNeed=Math.max(0,t.goalEval-t.notes5);if(a>=1)return{title:'Foco em avaliações',text:`Estimativa: ${(noteNeed/remainingDays).toLocaleString('pt-BR',{maximumFractionDigits:1})} nota(s) 5 por dia útil restante.`};if(n>=1)return{title:'Foco em volume',text:`Estimativa: ${(attNeed/remainingDays).toLocaleString('pt-BR',{maximumFractionDigits:1})} atendimento(s) por dia útil restante.`};return{title:'Ritmo necessário',text:`Estimativa: ${(attNeed/remainingDays).toLocaleString('pt-BR',{maximumFractionDigits:1})} atendimentos e ${(noteNeed/remainingDays).toLocaleString('pt-BR',{maximumFractionDigits:1})} notas 5 por dia útil restante.`}}
  function businessDaysRemaining(y,m,latest){let c=0,days=new Date(y,m,0).getDate();for(let d=latest+1;d<=days;d++){const dow=new Date(y,m-1,d).getDay();if(dow>=1&&dow<=5)c++}return c}
  function overallLabel(a,n){if(a>=1&&n>=1)return'META BATIDA';if(a>=.75&&n>=.75)return'ESTÁ NO CAMINHO';if(a>=.45||n>=.45)return'PRECISA DE ATENÇÃO';return'APERTA O PÉ'}
  function overallColor(a,n){const min=Math.min(a,n);return min>=1?'var(--success)':min>=.75?'var(--success)':min>=.45?'var(--warn)':'var(--danger)'}
  function firstName(n){return title((n||'').trim().split(/\s+/)[0]||'Técnico')}
  function shortName(n){const p=(n||'').split(/\s+/);return p.length>1?`${title(p[0])} ${title(p[p.length-1])}`:title(n)}
  function title(s=''){return s.charAt(0).toUpperCase()+s.slice(1).toLowerCase()}
  function titleWords(s=''){return s.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase())}

  function openImport(){if(!isAdmin()||!requireSpecificSquad())return;$('#importMessage').textContent=`Selecione o XLSX para atualizar o Squad ${state.squadCode}.`;$('#importDetails').textContent='A importação espera as abas “STATUS DO SQUAD” e uma aba com o nome do mês.';$('#importProgress').style.width='0%';$('#chooseFileBtn').disabled=false;openModal('importModal')}
  function openModal(id){$('#'+id).classList.add('open');$('#'+id).setAttribute('aria-hidden','false')}
  function closeModal(id){$('#'+id).classList.remove('open');$('#'+id).setAttribute('aria-hidden','true')}
  function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2800)}

  async function handleFile(e){
    if(!isAdmin())return;const file=e.target.files?.[0];if(!file)return;openModal('importModal');$('#chooseFileBtn').disabled=true;$('#importMessage').textContent='Lendo planilha...';$('#importProgress').style.width='18%';
    try{const data=await importWorkbook(file,p=>$('#importProgress').style.width=p+'%'),s=currentSquad(),previous=s.months[data.id];if(previous?.settings)data.settings={...previous.settings};s.months[data.id]=data;state.currentId=data.id;state.techName=data.technicians[0]?.name||'';saveDemoSquads();if(state.supabase){$('#importMessage').textContent='Gravando no banco de dados...';await persistImportedMonth(data,s)}refreshSelectors();render();$('#importMessage').textContent=`${data.monthName} ${data.year} atualizado no Squad ${state.squadCode}.`;$('#importDetails').innerHTML=`<strong>${data.technicians.length} técnicos</strong> • até dia <strong>${data.latestDay}</strong> • <strong>${escapeHtml(file.name)}</strong>`;$('#importProgress').style.width='100%';toast('Planilha importada com sucesso.')}
    catch(err){console.error(err);$('#importMessage').textContent='Não foi possível importar este arquivo.';$('#importDetails').textContent=err.message||String(err);$('#importProgress').style.width='100%'}finally{$('#chooseFileBtn').disabled=false;e.target.value=''}
  }

  async function importWorkbook(file, progress=()=>{}){
    const buf=await file.arrayBuffer(); progress(28); const zip=await ZipReader.from(buf); progress(40); const workbook=xml(await zip.text('xl/workbook.xml')); const rels=xml(await zip.text('xl/_rels/workbook.xml.rels')); const relMap={}; $$xml(rels,'Relationship').forEach(r=>relMap[r.getAttribute('Id')]=r.getAttribute('Target')); const sheets={}; $$xml(workbook,'sheet').forEach(s=>{const name=s.getAttribute('name'),rid=s.getAttribute('r:id')||s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');let target=relMap[rid];if(target){target=target.startsWith('/')?target.slice(1):'xl/'+target.replace(/^\.\//,'');sheets[name]=normalizePath(target)}}); const statusName=Object.keys(sheets).find(n=>normalizeName(n)==='STATUS DO SQUAD');if(!statusName)throw new Error('A aba “STATUS DO SQUAD” não foi encontrada.');const monthSheetName=Object.keys(sheets).find(n=>MONTH_SHEET[normalizeName(n)]);if(!monthSheetName)throw new Error('Não encontrei uma aba com nome de mês.');let shared=[];if(zip.has('xl/sharedStrings.xml'))shared=parseShared(xml(await zip.text('xl/sharedStrings.xml')));progress(52);const status=parseSheet(xml(await zip.text(sheets[statusName])),shared),daily=parseSheet(xml(await zip.text(sheets[monthSheetName])),shared);progress(72);const month=MONTH_SHEET[normalizeName(monthSheetName)];let year=(file.name.match(/20\d{2}/)||[])[0];year=year?Number(year):new Date().getFullYear();const metaBy={};for(let r=22;r<=40;r++){const name=cell(status,`B${r}`);if(name)metaBy[String(name).trim()]={att:safe(cell(status,`C${r}`)),eval:safe(cell(status,`F${r}`))}}const dailyBy={};let latest=0;for(let r=3;r<=20;r++){const name=cell(daily,`A${r}`);if(!name)continue;const arr=[];for(let d=1;d<=31;d++){const q=cell(daily,`${colLetter(2*d)}${r}`),n=cell(daily,`${colLetter(2*d+1)}${r}`),qn=typeof q==='number'?q:0,nn=typeof n==='number'?n:0,off=(typeof q==='string'&&q.trim())||(typeof n==='string'&&n.trim());if(qn||nn)latest=Math.max(latest,d);arr.push({day:d,att:qn,notes5:nn,off:!!off&&!qn&&!nn})}dailyBy[String(name).trim()]=arr}const technicians=[];for(let r=2;r<=20;r++){const name=cell(status,`A${r}`);if(!name)continue;const att=cell(status,`B${r}`),n5=cell(status,`D${r}`);if(att==null&&n5==null)continue;const nm=String(name).trim(),meta=metaBy[nm]||{att:0,eval:0};technicians.push({name:nm,att:safe(att),notes5:safe(n5),notes4:safe(cell(status,`E${r}`)),notes3:safe(cell(status,`F${r}`)),notes2:safe(cell(status,`G${r}`)),notes1:safe(cell(status,`H${r}`)),totalEval:safe(cell(status,`I${r}`)),avg:safe(cell(status,`J${r}`)),evalPct:safe(cell(status,`K${r}`)),status:cell(status,`L${r}`)||'',goalsHit:safe(cell(status,`M${r}`)),points:safe(cell(status,`N${r}`)),rank:safe(cell(status,`O${r}`))||null,discount:safe(cell(status,`P${r}`)),pointBonus:safe(cell(status,`Q${r}`)),goalAtt:meta.att,goalEval:meta.eval,daily:dailyBy[nm]||[]})}if(!technicians.length)throw new Error('Nenhum técnico com dados foi encontrado.');progress(86);const totals={att:safe(cell(status,'B12')),eval:safe(cell(status,'I12')),evalPct:safe(cell(status,'K12')),points:safe(cell(status,'N12'))},id=`${year}-${String(month).padStart(2,'0')}`;progress(96);return{id,month,monthName:MONTHS_PT[month-1],year,sourceFile:file.name,latestDay:latest||1,importedAt:new Date().toISOString(),teamResult:cell(status,'B13')||'',redistributed:safe(cell(status,'B15')),teamTotals:totals.att?totals:deriveTotals(technicians),technicians}
  }

  class ZipReader{constructor(buffer,entries){this.buffer=buffer;this.view=new DataView(buffer);this.entries=entries}static async from(buffer){const v=new DataView(buffer);let eocd=-1;for(let i=buffer.byteLength-22;i>=Math.max(0,buffer.byteLength-65557);i--){if(v.getUint32(i,true)===0x06054b50){eocd=i;break}}if(eocd<0)throw new Error('Arquivo XLSX inválido: ZIP não reconhecido.');const count=v.getUint16(eocd+10,true),cdOffset=v.getUint32(eocd+16,true),dec=new TextDecoder('utf-8');let p=cdOffset;const entries={};for(let i=0;i<count;i++){if(v.getUint32(p,true)!==0x02014b50)break;const method=v.getUint16(p+10,true),comp=v.getUint32(p+20,true),uncomp=v.getUint32(p+24,true),nlen=v.getUint16(p+28,true),elen=v.getUint16(p+30,true),clen=v.getUint16(p+32,true),local=v.getUint32(p+42,true),name=dec.decode(new Uint8Array(buffer,p+46,nlen));entries[normalizePath(name)]={method,comp,uncomp,local};p+=46+nlen+elen+clen}return new ZipReader(buffer,entries)}has(name){return!!this.entries[normalizePath(name)]}async bytes(name){name=normalizePath(name);const e=this.entries[name];if(!e)throw new Error(`Arquivo interno não encontrado: ${name}`);const v=this.view,p=e.local;if(v.getUint32(p,true)!==0x04034b50)throw new Error('Cabeçalho ZIP inválido.');const nlen=v.getUint16(p+26,true),elen=v.getUint16(p+28,true),start=p+30+nlen+elen,raw=this.buffer.slice(start,start+e.comp);if(e.method===0)return new Uint8Array(raw);if(e.method===8){if(typeof DecompressionStream==='undefined')throw new Error('Seu navegador não suporta importação XLSX local. Use Chrome ou Edge atualizados.');const stream=new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));return new Uint8Array(await new Response(stream).arrayBuffer())}throw new Error(`Compressão ZIP não suportada: ${e.method}`)}async text(name){return new TextDecoder('utf-8').decode(await this.bytes(name))}}
  function xml(text){const d=new DOMParser().parseFromString(text,'application/xml');if(d.querySelector('parsererror'))throw new Error('XML interno da planilha inválido.');return d}
  function $$xml(doc,tag){return[...doc.getElementsByTagName(tag)]}
  function parseShared(doc){return $$xml(doc,'si').map(si=>[...si.getElementsByTagName('t')].map(t=>t.textContent).join(''))}
  function parseSheet(doc,shared){const out={};for(const c of $$xml(doc,'c')){const ref=c.getAttribute('r'),type=c.getAttribute('t');let val=null;if(type==='inlineStr'){val=[...c.getElementsByTagName('t')].map(t=>t.textContent).join('')}else{const v=c.getElementsByTagName('v')[0];if(v){const raw=v.textContent;if(type==='s')val=shared[Number(raw)]??'';else if(type==='str')val=raw;else if(type==='b')val=raw==='1';else{const num=Number(raw);val=Number.isNaN(num)?raw:num}}}out[ref]=val}return out}
  function cell(sheet,ref){return Object.prototype.hasOwnProperty.call(sheet,ref)?sheet[ref]:null}
  function colLetter(n){let s='';while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26)}return s}
  function normalizePath(p){const parts=[];for(const x of p.replace(/\\/g,'/').split('/')){if(!x||x==='.')continue;if(x==='..')parts.pop();else parts.push(x)}return parts.join('/')}
  function normalizeName(s){return String(s||'').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ')}

  function applyPreset(name){if(!isAdmin())return;const presets={vermithor:clone(DEFAULT_THEME),soften:{name:'Soften',campaignTitle:'Soften Performance',campaignTagline:'Tecnologia que impulsiona resultados.',preset:'soften',accent:'#20b7f5',secondary:'#176bd3',bg:'#06111f',bg2:'#0a2035',panel:'rgba(8,24,40,.9)',text:'#f3f8fc',background:null,opacity:.18},neon:{name:'Neon',campaignTitle:'Squad Neon',campaignTagline:'Acelere. Evolua. Conquiste.',preset:'neon',accent:'#c05cff',secondary:'#21dbc9',bg:'#090514',bg2:'#151029',panel:'rgba(23,15,42,.9)',text:'#faf5ff',background:null,opacity:.18},clean:{name:'Claro',campaignTitle:'Performance',campaignTagline:'Clareza para acompanhar cada resultado.',preset:'clean',accent:'#3157d5',secondary:'#6a7be8',bg:'#e9eef5',bg2:'#f7f9fc',panel:'rgba(255,255,255,.91)',text:'#172033',background:null,opacity:.06}};state.theme=presets[name]||presets.vermithor;saveTheme();applyTheme(state.theme);toast(`Tema ${state.theme.name} aplicado.`)}
  function applyTheme(t){t=t||DEFAULT_THEME;const r=document.documentElement.style;if(t.accent)r.setProperty('--accent',t.accent);if(t.secondary)r.setProperty('--accent2',t.secondary);if(t.bg)r.setProperty('--bg',t.bg);if(t.bg2)r.setProperty('--bg2',t.bg2);if(t.panel)r.setProperty('--panel',t.panel);if(t.text)r.setProperty('--text',t.text);if(t.opacity!=null)r.setProperty('--hero-opacity',t.opacity);const safeBg=sanitizeThemeBackground(t.background),bg=safeBg?`url("${safeBg}")`:t.preset==='vermithor'?"url('assets/vermithor.png')":'none';r.setProperty('--hero-img',bg);if($('#accentColor'))$('#accentColor').value=t.accent||'#f0a33a';if($('#secondaryColor'))$('#secondaryColor').value=t.secondary||'#ef5a29';const fallbackTitle=t.preset==='vermithor'?'Dragão Vermithor':(t.name||`Squad ${state.squadCode}`),fallbackTagline=t.preset==='vermithor'?'Transforme números em conquista.':'Acompanhe, evolua e conquiste.';if($('#campaignNameInput'))$('#campaignNameInput').value=t.campaignTitle||fallbackTitle;if($('#campaignTaglineInput'))$('#campaignTaglineInput').value=t.campaignTagline||fallbackTagline;$('#campaignTitle').textContent=t.campaignTitle||fallbackTitle;$('#campaignTagline').textContent=t.campaignTagline||fallbackTagline;updateThemeName()}
  function updateThemeName(){if($('#themeName'))$('#themeName').textContent=state.theme?.name||state.theme?.campaignTitle||'Personalizado'}
  function handleBackground(e){if(!isAdmin())return;const f=e.target.files?.[0];if(!f)return;if(f.size>5*1024*1024){toast('Use uma imagem de até 5 MB.');return}const reader=new FileReader();reader.onload=()=>{state.theme.background=reader.result;state.theme.name=$('#campaignNameInput').value||'Personalizado';state.theme.campaignTitle=$('#campaignNameInput').value||state.theme.campaignTitle||`Squad ${state.squadCode}`;state.theme.campaignTagline=$('#campaignTaglineInput').value||state.theme.campaignTagline||'';state.theme.preset='custom';saveTheme();applyTheme(state.theme);toast('Fundo atualizado.')};reader.readAsDataURL(f)}
  function sanitizeThemeBackground(v){if(!v)return null;const s=String(v).trim();return/^(data:image\/(png|jpeg|jpg|webp|gif);base64,|https?:\/\/|assets\/)/i.test(s)?s:null}
  function themePayload(){return{schema:'squad-theme-v1',name:state.theme.name||'Personalizado',campaignTitle:state.theme.campaignTitle||state.theme.name||`Squad ${state.squadCode}`,campaignTagline:state.theme.campaignTagline||'',accent:state.theme.accent||'#f0a33a',secondary:state.theme.secondary||'#ef5a29',bg:state.theme.bg||'#080b12',bg2:state.theme.bg2||'#10141e',panel:state.theme.panel||'rgba(17,22,31,.88)',text:state.theme.text||'#f5f6f8',background:state.theme.background||null,opacity:state.theme.opacity??.28}}
  function downloadJson(obj,name){const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  function exportTheme(){if(!isAdmin()||!requireSpecificSquad())return;downloadJson(themePayload(),`tema-squad-${state.squadCode.toLowerCase()}.json`);toast('Tema exportado em JSON.')}
  async function handleThemeJson(e){if(!isAdmin())return;const f=e.target.files?.[0];if(!f)return;try{const raw=JSON.parse(await f.text());if(raw.schema!=='squad-theme-v1')throw new Error('Arquivo de tema incompatível.');const theme={...raw,preset:'custom'};delete theme.schema;delete theme._instrucoes;if(theme.background&&!sanitizeThemeBackground(theme.background))throw new Error('Fundo inválido.');state.theme=theme;saveTheme();applyTheme(state.theme);toast('Tema importado e aplicado.')}catch(err){toast(err.message||'Não foi possível importar o tema.')}finally{e.target.value=''}}

  /* ===== Supabase: login + dados multi-squad ===== */
  async function initSupabase(){
    const cfg=window.APP_CONFIG||{};if(!cfg.supabaseUrl||!cfg.supabaseAnonKey)throw new Error('Preencha supabaseUrl e supabaseAnonKey em config.js.');
    await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');state.supabase=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
  }
  function loadScript(src){return new Promise((resolve,reject)=>{if(window.supabase)return resolve();const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('Falha ao carregar biblioteca Supabase.'));document.head.appendChild(s)})}
  async function enterSupabaseSession(authUser){
    const {data:profile,error}=await state.supabase.from('profiles').select('user_id,email,full_name,role,squad_id,technician_name,squads(id,code,name)').eq('user_id',authUser.id).single();if(error)throw error;
    state.user={userId:authUser.id,email:profile.email||authUser.email,fullName:profile.full_name,role:profile.role,squadCode:profile.squads?.code||null,techName:profile.technician_name||null};
    await loadSupabaseData();await enterApp(state.user);
  }
  async function loadSupabaseData(){
    const {data:squads,error}=await state.supabase.from('squads').select('id,code,name').eq('active',true).order('code');if(error)throw error;state.squads={};
    for(const s of squads){state.squads[s.code]={code:s.code,name:s.name,dbId:s.id,months:{}};const {data:themes}=await state.supabase.from('squad_themes').select('theme').eq('squad_id',s.id).maybeSingle();if(themes?.theme)state.squads[s.code].theme=themes.theme;const {data:months,error:me}=await state.supabase.from('squad_months').select('id,year,month,source_file,latest_day,imported_at,team_result,redistributed,team_goal_att,team_goal_eval_pct,technician_monthly(id,user_id,technician_name,att,notes5,notes4,notes3,notes2,notes1,total_eval,avg_rating,eval_pct,status,goals_hit,points,rank,discount,point_bonus,goal_att,goal_eval,daily_metrics(day,att,notes5,off))').eq('squad_id',s.id).order('year',{ascending:false}).order('month',{ascending:false});if(me)throw me;for(const row of months||[]){const id=`${row.year}-${String(row.month).padStart(2,'0')}`,technicians=(row.technician_monthly||[]).map(t=>({dbId:t.id,userId:t.user_id,name:t.technician_name,att:safe(t.att),notes5:safe(t.notes5),notes4:safe(t.notes4),notes3:safe(t.notes3),notes2:safe(t.notes2),notes1:safe(t.notes1),totalEval:safe(t.total_eval),avg:safe(t.avg_rating),evalPct:safe(t.eval_pct),status:t.status||'',goalsHit:safe(t.goals_hit),points:safe(t.points),rank:safe(t.rank)||null,discount:safe(t.discount),pointBonus:safe(t.point_bonus),goalAtt:safe(t.goal_att),goalEval:safe(t.goal_eval),daily:(t.daily_metrics||[]).map(d=>({day:d.day,att:safe(d.att),notes5:safe(d.notes5),off:!!d.off})).sort((a,b)=>a.day-b.day)}));const totals=deriveTotals(technicians);state.squads[s.code].months[id]={dbId:row.id,id,year:row.year,month:row.month,monthName:MONTHS_PT[row.month-1],sourceFile:row.source_file||'Supabase',latestDay:row.latest_day||1,importedAt:row.imported_at,teamResult:row.team_result||'',redistributed:safe(row.redistributed),teamTotals:totals,settings:{teamGoalAtt:safe(row.team_goal_att),teamGoalEvalPct:Number(row.team_goal_eval_pct??.343)},technicians}}}
  }
  async function persistImportedMonth(m,squad){
    const payload={squad_id:squad.dbId,year:m.year,month:m.month,source_file:m.sourceFile,latest_day:m.latestDay,team_result:m.teamResult,redistributed:m.redistributed,team_goal_att:m.settings?.teamGoalAtt||autoTeamAttGoal(m),team_goal_eval_pct:m.settings?.teamGoalEvalPct??.343,imported_by:state.user.userId,imported_at:new Date().toISOString()};
    const {data:monthRow,error}=await state.supabase.from('squad_months').upsert(payload,{onConflict:'squad_id,year,month'}).select('id').single();if(error)throw error;m.dbId=monthRow.id;
    const {data:profiles}=await state.supabase.from('profiles').select('user_id,technician_name').eq('squad_id',squad.dbId);const userMap={};(profiles||[]).forEach(p=>{if(p.technician_name)userMap[normalizeName(p.technician_name)]=p.user_id});
    for(const t of m.technicians){const row={squad_month_id:monthRow.id,user_id:userMap[normalizeName(t.name)]||null,technician_name:t.name,att:t.att,notes5:t.notes5,notes4:t.notes4,notes3:t.notes3,notes2:t.notes2,notes1:t.notes1,total_eval:t.totalEval,avg_rating:t.avg,eval_pct:t.evalPct,status:t.status,goals_hit:t.goalsHit,points:t.points,rank:t.rank,discount:t.discount,point_bonus:t.pointBonus,goal_att:t.goalAtt,goal_eval:t.goalEval};const {data:tm,error:te}=await state.supabase.from('technician_monthly').upsert(row,{onConflict:'squad_month_id,technician_name'}).select('id').single();if(te)throw te;t.dbId=tm.id;await state.supabase.from('daily_metrics').delete().eq('technician_month_id',tm.id);const daily=(t.daily||[]).map(d=>({technician_month_id:tm.id,day:d.day,att:d.att,notes5:d.notes5,off:!!d.off}));if(daily.length){const {error:de}=await state.supabase.from('daily_metrics').insert(daily);if(de)throw de}}
  }
  async function persistThemeToSupabase(){const squad=currentSquad();if(!state.supabase||!squad?.dbId)return;const {error}=await state.supabase.from('squad_themes').upsert({squad_id:squad.dbId,theme:themePayload(),updated_by:state.user.userId,updated_at:new Date().toISOString()},{onConflict:'squad_id'});if(error)throw error;squad.theme=clone(state.theme)}

  function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  boot();
})();
