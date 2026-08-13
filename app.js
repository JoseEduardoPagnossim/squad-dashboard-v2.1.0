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
    userDirectoryLoaded:false,
    recoveryMode:false,
    pendingCsv:null
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
      try{
        await initSupabase();
        const {data}=await state.supabase.auth.getSession();
        if(state.recoveryMode){showLogin('Link de recuperação validado. Defina sua nova senha.');openModal('recoveryModal');return;}
        if(data?.session) return await enterSupabaseSession(data.session.user);
        showLogin();
      }
      catch(err){console.error(err); showLogin('Não foi possível conectar ao Supabase. Confira config.js.');}
    }else{
      try{const saved=JSON.parse(sessionStorage.getItem('squadDemoSession')||'null'); if(saved?.email){const u=findDemoUser(saved.email);if(u) return enterApp({...u});}}catch(e){}
      showLogin();
    }
  }

  function bindStaticEvents(){
    $('#loginForm').addEventListener('submit',handleLogin);
    $('#forgotPasswordBtn').addEventListener('click',handleForgotPassword);
    $('#recoveryForm').addEventListener('submit',handleRecoveryPassword);
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
    $('#chooseFileBtn').addEventListener('click',()=>$('#csvInput').click());
    $('#csvInput').addEventListener('change',handleCsvFile);
    $('#confirmCsvImportBtn').addEventListener('click',confirmCsvImport);
    $('#saveMonthlyMetricsBtn').addEventListener('click',saveMonthlyMetrics);
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
  function humanAuthError(err){
    const m=String(err?.message||err||'');
    if(/invalid login|invalid.*credential/i.test(m))return'E-mail ou senha inválidos.';
    if(/email not confirmed/i.test(m))return'Confirme seu e-mail antes de entrar.';
    if(/rate limit/i.test(m))return'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
    return m||'Não foi possível entrar.';
  }
  function authRedirectUrl(){return window.location.origin+window.location.pathname;}
  async function handleForgotPassword(){
    $('#loginError').textContent='';
    const email=$('#loginEmail').value.trim().toLowerCase();
    if(!email){$('#loginError').textContent='Informe seu e-mail primeiro.';$('#loginEmail').focus();return;}
    if((window.APP_CONFIG?.mode||'demo')!=='supabase'){$('#loginError').textContent='A recuperação de senha fica disponível no modo Supabase.';return;}
    const btn=$('#forgotPasswordBtn');btn.disabled=true;btn.textContent='Enviando...';
    try{
      const {error}=await state.supabase.auth.resetPasswordForEmail(email,{redirectTo:authRedirectUrl()});
      if(error)throw error;
      $('#loginError').classList.add('success');
      $('#loginError').textContent='E-mail de recuperação enviado. Abra o link neste mesmo navegador.';
    }catch(err){$('#loginError').classList.remove('success');$('#loginError').textContent=humanAuthError(err)}
    finally{btn.disabled=false;btn.textContent='Esqueci minha senha';}
  }
  async function handleRecoveryPassword(e){
    e.preventDefault();
    const p1=$('#recoveryPassword').value,p2=$('#recoveryPasswordConfirm').value,errEl=$('#recoveryError');errEl.textContent='';
    if(p1.length<8){errEl.textContent='A senha precisa ter pelo menos 8 caracteres.';return;}
    if(p1!==p2){errEl.textContent='As senhas não conferem.';return;}
    const btn=$('#recoverySubmit');btn.disabled=true;btn.textContent='Salvando...';
    try{
      const {data,error}=await state.supabase.auth.updateUser({password:p1});if(error)throw error;
      state.recoveryMode=false;closeModal('recoveryModal');
      window.history.replaceState({},document.title,authRedirectUrl());
      $('#loginError').classList.add('success');$('#loginError').textContent='Senha alterada com sucesso. Entrando...';
      if(data?.user) await enterSupabaseSession(data.user); else {const {data:sess}=await state.supabase.auth.getSession();if(sess?.session?.user)await enterSupabaseSession(sess.session.user);}
    }catch(err){errEl.textContent=humanAuthError(err)}
    finally{btn.disabled=false;btn.textContent='Salvar nova senha';}
  }
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
  function currentTech(){const m=currentMonth();if(!m)return null;return m.technicians.find(t=>normalizeName(t.name)===normalizeName(state.techName))||m.technicians[0]||null}
  function chooseLatestMonth(){const ids=Object.keys(currentMonths()).sort().reverse();state.currentId=ids[0]||null}
  function chooseDefaultTech(){const m=currentMonth();if(!m){state.techName='';return}if(isTechnician()){const own=m.technicians.find(t=>normalizeName(t.name)===normalizeName(state.user.techName));state.techName=own?.name||state.user.techName||m.technicians[0]?.name||'';return}if(!m.technicians.some(t=>normalizeName(t.name)===normalizeName(state.techName)))state.techName=m.technicians[0]?.name||''}

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
    const attPct=t.goalAtt?safe(t.att)/t.goalAtt:0,notePct=t.goalEval?safe(t.notes5)/t.goalEval:0,hasGoals=safe(t.goalAtt)>0&&safe(t.goalEval)>0;
    $('#heroName').textContent=firstName(t.name);$('#heroStatus').textContent=hasGoals?overallLabel(attPct,notePct):'METAS PENDENTES';$('#heroStatus').style.color=hasGoals?overallColor(attPct,notePct):'var(--warn)';$('#heroMessage').textContent=buildHeroMessage(t,attPct,notePct);
    $('#lastUpdate').textContent=`Atualizado até ${String(m.latestDay||1).padStart(2,'0')}/${String(m.month).padStart(2,'0')}`;$('#sourceFile').textContent=m.sourceFile||'Dados do banco';
    $('#rankNumber').textContent=t.rank?`#${t.rank}`:'—';$('#rankContext').textContent=`de ${m.technicians.length} no Squad ${state.squadCode}`;
    $('#kpiAtt').textContent=fmtInt(t.att);$('#kpiAttGoal').textContent=`/ ${fmtInt(t.goalAtt)}`;$('#attBar').style.width=clamp(attPct*100,0,100)+'%';$('#attProgress').textContent=fmtPct(attPct);$('#attRemaining').textContent=t.att>=t.goalAtt?`+${fmtInt(t.att-t.goalAtt)} acima`:`Faltam ${fmtInt(t.goalAtt-t.att)}`;
    $('#kpiNotes').textContent=fmtInt(t.notes5);$('#kpiNotesGoal').textContent=`/ ${fmtInt(t.goalEval)}`;$('#noteBar').style.width=clamp(notePct*100,0,100)+'%';$('#noteProgress').textContent=fmtPct(notePct);$('#noteRemaining').textContent=t.notes5>=t.goalEval?`+${fmtInt(t.notes5-t.goalEval)} acima`:`Faltam ${fmtInt(t.goalEval-t.notes5)}`;
    $('#kpiEvalPct').textContent=fmtPct(t.evalPct);$('#evalCount').textContent=`${fmtInt(t.totalEval)} avaliações`;$('#avgRating').textContent=`Média ${safe(t.avg).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}`;const evalTarget=teamSettings(m).teamGoalEvalPct;$('#evalQuality').textContent=t.evalPct>=evalTarget?'Meta de avaliação atingida':t.avg>=4.9?'Qualidade excelente':'Acompanhar qualidade';
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
      {icon:'%',name:'Avaliações',desc:`≥ ${fmtPct(teamSettings(m).teamGoalEvalPct)}`,ok:safe(t.evalPct)>=teamSettings(m).teamGoalEvalPct},
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
    if(!['technician','squad_admin','super_admin'].includes(p.role))throw new Error('Perfil inválido.');if(!isSuperAdmin()&&p.role!=='technician')throw new Error('Admin do Squad pode criar somente técnicos.');if(!isSuperAdmin()&&p.squadCode!==state.user.squadCode)throw new Error('Você só pode cadastrar usuários no seu próprio Squad.');if(p.role!=='super_admin'&&!state.squads[p.squadCode])throw new Error('Selecione um Squad válido.');if(p.role==='technician'&&!p.techName)throw new Error('Informe o nome do técnico como aparece no CSV.');
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
    if(!isAdmin())return;
    const specific=state.squadCode!=='all',m=currentMonth(),canImport=specific||isSuperAdmin();
    $('#adminScopeTitle').textContent=specific?`Squad ${state.squadCode}`:'Todos os Squads';
    $('#adminScopeText').textContent=specific?'Importação, métricas, metas e tema abaixo afetam somente este Squad.':'Admin geral pode importar o CSV para todos os Squads de uma vez. Para métricas, metas, exclusão de mês ou tema, selecione um Squad específico.';
    $('#adminImportBtn').disabled=!canImport;
    ['#adminThemeBtn','#saveGoalsBtn','#autoGoalBtn','#importThemeBtn','#exportThemeBtn','#saveMonthlyMetricsBtn'].forEach(sel=>{if($(sel))$(sel).disabled=!specific||(!m&&sel==='#saveMonthlyMetricsBtn')});
    if(!specific||!m){
      $('#monthHistory').innerHTML=specific?'<div class="muted">Nenhum mês importado neste Squad.</div>':'<div class="muted">Selecione um Squad específico para ver o histórico.</div>';
      $('#teamGoalAttInput').value='';$('#teamGoalPctInput').value='';$('#autoGoalHint').textContent=m?'':'Importe um mês para configurar as metas.';
      $('#monthlyMetricsRows').innerHTML='<tr><td colspan="10" class="muted">Importe um mês para preencher as métricas individuais.</td></tr>';
      $('#monthlyMetricsHint').textContent='Importe um mês para preencher as métricas.';
      updateThemeName();return;
    }
    const ids=Object.keys(currentMonths()).sort().reverse(),cfg=teamSettings(m);
    $('#monthHistory').innerHTML=ids.map(id=>{const mm=currentMonths()[id];return `<div class="history-row"><div><strong>${mm.monthName} ${mm.year}</strong><small>${escapeHtml(mm.sourceFile||'Banco de dados')} • ${mm.technicians.length} técnicos • até dia ${mm.latestDay}</small></div><span class="tag">${id===state.currentId?'EM USO':'SALVO'}</span><button class="link-btn" data-open-month="${id}">Abrir</button><button class="link-btn danger-link" data-delete-month="${id}">Excluir</button></div>`}).join('');
    $$('[data-open-month]').forEach(b=>b.addEventListener('click',()=>{state.currentId=b.dataset.openMonth;chooseDefaultTech();refreshSelectors();render();showView('individual')}));
    $$('[data-delete-month]').forEach(b=>b.addEventListener('click',()=>deleteImportedMonth(b.dataset.deleteMonth)));
    $('#teamGoalAttInput').value=Math.round(cfg.teamGoalAtt);$('#teamGoalPctInput').value=(cfg.teamGoalEvalPct*100).toFixed(1);
    const useful=businessDaysMonFri(m.year,m.month),suggested=autoTeamAttGoal(m);$('#autoGoalHint').textContent=`Sugestão: ${useful} dias úteis × 10 atendimentos × ${m.technicians.length} técnicos = ${fmtInt(suggested)} atendimentos.`;
    renderMonthlyMetrics(m);updateThemeName();
  }

  function renderMonthlyMetrics(m){
    const list=[...(m?.technicians||[])].sort((a,b)=>String(a.name).localeCompare(String(b.name),'pt-BR'));
    $('#monthlyMetricsHint').textContent=`${m.monthName} ${m.year} • ${list.length} técnicos • dados de volume e avaliações vêm do CSV.`;
    $('#monthlyMetricsRows').innerHTML=list.map(t=>`<tr data-metric-tech="${escapeHtml(t.name)}"><td>${escapeHtml(t.name)}</td><td>${fmtInt(t.att)}</td><td>${fmtInt(t.notes5)}</td><td><input class="metric-input" data-field="goalAtt" type="number" min="0" step="1" value="${safe(t.goalAtt)}"></td><td><input class="metric-input" data-field="goalEval" type="number" min="0" step="1" value="${safe(t.goalEval)}"></td><td><select class="metric-input" data-field="status"><option value="" ${!t.status?'selected':''}>—</option><option value="ACIMA" ${String(t.status).toUpperCase()==='ACIMA'?'selected':''}>ACIMA</option><option value="ABAIXO" ${String(t.status).toUpperCase()==='ABAIXO'?'selected':''}>ABAIXO</option></select></td><td><input class="metric-input" data-field="goalsHit" type="number" min="0" step="1" value="${safe(t.goalsHit)}"></td><td><input class="metric-input" data-field="points" type="number" step="0.01" value="${safe(t.points)}"></td><td><input class="metric-input" data-field="discount" type="number" step="0.01" value="${safe(t.discount)}"></td><td><input class="metric-input" data-field="pointBonus" type="number" step="0.01" value="${safe(t.pointBonus)}"></td></tr>`).join('')||'<tr><td colspan="10" class="muted">Nenhum técnico encontrado.</td></tr>';
  }

  async function saveMonthlyMetrics(){
    if(!isAdmin()||!requireSpecificSquad())return;const m=currentMonth();if(!m)return;const btn=$('#saveMonthlyMetricsBtn');btn.disabled=true;btn.textContent='Salvando...';
    try{
      for(const row of $$('#monthlyMetricsRows [data-metric-tech]')){
        const t=m.technicians.find(x=>normalizeName(x.name)===normalizeName(row.dataset.metricTech));if(!t)continue;
        for(const input of $$('[data-field]',row))t[input.dataset.field]=input.dataset.field==='status'?String(input.value||''):safe(input.value);
      }
      recalculateMonth(m);saveDemoSquads();if(state.supabase)await persistManualMetrics(m);refreshSelectors();render();toast('Métricas mensais salvas.');
    }catch(err){console.error(err);toast('Não foi possível salvar as métricas mensais.')}finally{btn.disabled=false;btn.textContent='Salvar métricas dos técnicos'}
  }

  function recalculateMonth(m){
    for(const t of m.technicians||[]){
      t.totalEval=safe(t.notes5)+safe(t.notes4)+safe(t.notes3)+safe(t.notes2)+safe(t.notes1);
      t.avg=t.totalEval?((safe(t.notes5)*5+safe(t.notes4)*4+safe(t.notes3)*3+safe(t.notes2)*2+safe(t.notes1))/t.totalEval):0;
      t.evalPct=safe(t.att)?t.totalEval/safe(t.att):0;
      t.status=String(t.status||'').toUpperCase();t.goalsHit=Math.max(0,Math.round(safe(t.goalsHit)));
    }
    const ranked=[...(m.technicians||[])].sort((a,b)=>safe(b.points)-safe(a.points)||safe(b.att)-safe(a.att)||String(a.name).localeCompare(String(b.name),'pt-BR'));
    const hasPoints=ranked.some(t=>safe(t.points)!==0);ranked.forEach((t,i)=>t.rank=hasPoints?i+1:null);
    m.teamTotals=deriveTotals(m.technicians);const cfg=teamSettings(m);m.teamResult=(cfg.teamGoalAtt>0&&m.teamTotals.att>=cfg.teamGoalAtt&&m.teamTotals.evalPct>=cfg.teamGoalEvalPct)?'ACIMA':'ABAIXO';
  }

  async function persistManualMetrics(m){
    for(const t of m.technicians||[]){
      if(!t.dbId)continue;
      const {error}=await state.supabase.from('technician_monthly').update({goal_att:safe(t.goalAtt),goal_eval:safe(t.goalEval),points:safe(t.points),discount:safe(t.discount),point_bonus:safe(t.pointBonus),goals_hit:safe(t.goalsHit),status:t.status,rank:t.rank}).eq('id',t.dbId);if(error)throw error;
    }
    if(m.dbId){const {error}=await state.supabase.from('squad_months').update({team_result:m.teamResult}).eq('id',m.dbId);if(error)throw error;}
  }

  async function deleteImportedMonth(id){
    if(!isAdmin()||!requireSpecificSquad())return;const m=currentMonths()[id];if(!m)return;
    if(!window.confirm(`Excluir ${m.monthName} ${m.year} do Squad ${state.squadCode}? Isso remove os dados importados e as métricas manuais deste mês.`))return;
    try{if(state.supabase&&m.dbId){const {error}=await state.supabase.from('squad_months').delete().eq('id',m.dbId);if(error)throw error;}delete currentSquad().months[id];const ids=Object.keys(currentMonths()).sort().reverse();state.currentId=ids[0]||null;chooseDefaultTech();saveDemoSquads();refreshSelectors();render();toast('Mês importado excluído.')}catch(err){console.error(err);toast('Não foi possível excluir este mês.')}
  }

  function businessDaysMonFri(y,m){let c=0,days=new Date(y,m,0).getDate();for(let d=1;d<=days;d++){const dow=new Date(y,m-1,d).getDay();if(dow>=1&&dow<=5)c++}return c}
  function autoTeamAttGoal(m){return businessDaysMonFri(m.year,m.month)*10*Math.max(1,m.technicians.length)}
  function teamSettings(m){const saved=m?.settings||{};return{teamGoalAtt:safe(saved.teamGoalAtt)||autoTeamAttGoal(m),teamGoalEvalPct:Number.isFinite(Number(saved.teamGoalEvalPct))?Number(saved.teamGoalEvalPct):.343}}
  async function saveTeamGoals(){if(!isAdmin()||!requireSpecificSquad())return;const m=currentMonth();if(!m)return;try{const att=Math.max(0,safe($('#teamGoalAttInput').value)),pct=Math.max(0,safe($('#teamGoalPctInput').value))/100;m.settings={...(m.settings||{}),teamGoalAtt:att||autoTeamAttGoal(m),teamGoalEvalPct:pct};recalculateMonth(m);saveDemoSquads();if(state.supabase){const {error}=await state.supabase.from('squad_months').update({team_goal_att:m.settings.teamGoalAtt,team_goal_eval_pct:m.settings.teamGoalEvalPct,team_result:m.teamResult}).eq('id',m.dbId);if(error)throw error}renderTeam();renderAdmin();toast('Metas salvas para '+m.monthName+'.')}catch(err){console.error(err);toast('Não foi possível salvar as metas.')}}
  function useAutomaticTeamGoal(){const m=currentMonth();if(!m)return;$('#teamGoalAttInput').value=autoTeamAttGoal(m);if(!$('#teamGoalPctInput').value)$('#teamGoalPctInput').value='34.3';toast('Meta automática calculada. Clique em Salvar metas.')}
  function deriveTotals(list){const att=(list||[]).reduce((s,t)=>s+safe(t.att),0),evals=(list||[]).reduce((s,t)=>s+safe(t.totalEval),0),points=(list||[]).reduce((s,t)=>s+safe(t.points),0);return{att,eval:evals,evalPct:att?evals/att:0,points}}
  function goalLine(noun,current,goal){if(!goal)return'Meta não encontrada.';if(current>=goal)return`Meta atingida: ${fmtInt(current-goal)} ${noun} acima do objetivo.`;return`Faltam ${fmtInt(goal-current)} ${noun} para atingir a meta.`}
  function buildHeroMessage(t,a,n){if(!safe(t.goalAtt)||!safe(t.goalEval))return'Resultados do mês importados. O administrador ainda precisa preencher as metas mensais deste técnico.';if(a>=1&&n>=1)return'Excelente ritmo: as duas metas mensais já foram atingidas.';if(a>=1)return'Meta de atendimentos atingida. Agora o foco é completar as notas 5.';if(n>=1)return'Meta de notas 5 atingida. Agora o foco é completar os atendimentos.';return`Você está em ${fmtPct(a)} da meta de atendimentos e ${fmtPct(n)} da meta de notas 5.`}
  function coachText(t,m,a,n){if(a>=1&&n>=1)return{title:'Meta completa!',text:'As duas metas foram batidas. O objetivo agora é sustentar qualidade e produtividade.'};const remainingDays=Math.max(1,businessDaysRemaining(m.year,m.month,m.latestDay)),attNeed=Math.max(0,t.goalAtt-t.att),noteNeed=Math.max(0,t.goalEval-t.notes5);if(a>=1)return{title:'Foco em avaliações',text:`Estimativa: ${(noteNeed/remainingDays).toLocaleString('pt-BR',{maximumFractionDigits:1})} nota(s) 5 por dia útil restante.`};if(n>=1)return{title:'Foco em volume',text:`Estimativa: ${(attNeed/remainingDays).toLocaleString('pt-BR',{maximumFractionDigits:1})} atendimento(s) por dia útil restante.`};return{title:'Ritmo necessário',text:`Estimativa: ${(attNeed/remainingDays).toLocaleString('pt-BR',{maximumFractionDigits:1})} atendimentos e ${(noteNeed/remainingDays).toLocaleString('pt-BR',{maximumFractionDigits:1})} notas 5 por dia útil restante.`}}
  function businessDaysRemaining(y,m,latest){let c=0,days=new Date(y,m,0).getDate();for(let d=latest+1;d<=days;d++){const dow=new Date(y,m-1,d).getDay();if(dow>=1&&dow<=5)c++}return c}
  function overallLabel(a,n){if(a>=1&&n>=1)return'META BATIDA';if(a>=.75&&n>=.75)return'ESTÁ NO CAMINHO';if(a>=.45||n>=.45)return'PRECISA DE ATENÇÃO';return'APERTA O PÉ'}
  function overallColor(a,n){const min=Math.min(a,n);return min>=1?'var(--success)':min>=.75?'var(--success)':min>=.45?'var(--warn)':'var(--danger)'}
  function firstName(n){return title((n||'').trim().split(/\s+/)[0]||'Técnico')}
  function shortName(n){const p=(n||'').split(/\s+/);return p.length>1?`${title(p[0])} ${title(p[p.length-1])}`:title(n)}
  function title(s=''){return s.charAt(0).toUpperCase()+s.slice(1).toLowerCase()}
  function titleWords(s=''){return s.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase())}

  function openImport(){
    if(!isAdmin())return;if(state.squadCode==='all'&&!isSuperAdmin())return;
    const scope=state.squadCode==='all'?'Todos os Squads':`Squad ${state.squadCode}`;
    state.pendingCsv=null;$('#importMessage').textContent=`Selecione o CSV para atualizar ${scope}.`;
    $('#importDetails').innerHTML='Colunas esperadas: <b>time</b>, <b>Tecnico</b>, <b>grupoAtendimento</b>, <b>Quantidade</b>, <b>Nota 5</b>, <b>Nota 4</b>, <b>Nota 3</b>, <b>Nota 2</b> e <b>Nota 1</b>.';
    $('#importProgress').style.width='0%';$('#chooseFileBtn').disabled=false;$('#confirmCsvImportBtn').classList.add('hidden');$('#csvPeriodBlock').classList.add('hidden');openModal('importModal');
  }
  function openModal(id){$('#'+id).classList.add('open');$('#'+id).setAttribute('aria-hidden','false')}
  function closeModal(id){$('#'+id).classList.remove('open');$('#'+id).setAttribute('aria-hidden','true')}
  function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2800)}

  async function handleCsvFile(e){
    if(!isAdmin())return;const file=e.target.files?.[0];if(!file)return;openModal('importModal');$('#chooseFileBtn').disabled=true;$('#importMessage').textContent='Lendo CSV...';$('#importProgress').style.width='25%';
    try{
      const text=await file.text(),parsed=parseServiceCsv(text);$('#importProgress').style.width='55%';
      if(!state.userDirectoryLoaded)await loadUserDirectory();
      const scopeAll=isSuperAdmin()&&state.squadCode==='all',codes=scopeAll?Object.keys(state.squads):[state.squadCode],allowedBy={};
      for(const code of codes)allowedBy[code]=new Set((state.userDirectory||[]).filter(u=>u.role==='technician'&&u.active&&u.squadCode===code&&u.techName).map(u=>normalizeName(u.techName)));
      if(!codes.some(code=>allowedBy[code].size))throw new Error(scopeAll?'Cadastre técnicos nos Squads antes de importar o CSV.':`Cadastre os técnicos do Squad ${state.squadCode} em Usuários antes de importar o CSV.`);
      const scopeRows=parsed.rows.filter(r=>codes.includes(r.group)),unmatched=[...new Set(scopeRows.filter(r=>!allowedBy[r.group]?.has(r.name)).map(r=>`${r.group}: ${r.name}`))].sort(),rows=scopeRows.filter(r=>allowedBy[r.group]?.has(r.name));
      const months=[...new Set(rows.map(r=>r.id))].sort().reverse();if(!months.length)throw new Error(scopeAll?'O CSV não possui registros que correspondam aos técnicos cadastrados. Confira os vínculos em Usuários.':`O CSV não possui registros que correspondam aos técnicos cadastrados do Squad ${state.squadCode}. Confira o campo Nome do técnico no CSV.`);
      state.pendingCsv={fileName:file.name,rows,ignored:parsed.ignored,total:parsed.total,months,unmatched,scopeAll,codes};
      $('#csvMonthSelect').innerHTML=months.map(id=>{const [y,m]=id.split('-').map(Number);return `<option value="${id}">${MONTHS_PT[m-1]} ${y}</option>`}).join('');
      $('#csvPeriodBlock').classList.remove('hidden');$('#confirmCsvImportBtn').classList.remove('hidden');$('#importMessage').textContent=scopeAll?'CSV reconhecido para importação geral.':`CSV reconhecido para o Squad ${state.squadCode}.`;
      const unmatchedText=unmatched.length?` • <strong>${unmatched.length} vínculo(s) não encontrado(s) ignorado(s)</strong>: ${escapeHtml(unmatched.slice(0,5).join(', '))}${unmatched.length>5?'…':''}`:'';
      $('#importDetails').innerHTML=`<strong>${fmtInt(rows.length)} linhas vinculadas</strong> aos técnicos cadastrados • <strong>${months.length} meses disponíveis</strong>${unmatchedText} • ${fmtInt(parsed.ignored)} linhas inválidas/fora dos Squads A, B, D e E.`;$('#importProgress').style.width='100%';
    }catch(err){console.error(err);state.pendingCsv=null;$('#importMessage').textContent='Não foi possível ler este CSV.';$('#importDetails').textContent=err.message||String(err);$('#importProgress').style.width='100%';$('#confirmCsvImportBtn').classList.add('hidden');$('#csvPeriodBlock').classList.add('hidden')}
    finally{$('#chooseFileBtn').disabled=false;e.target.value=''}
  }

  async function confirmCsvImport(){
    if(!isAdmin()||!state.pendingCsv)return;const id=$('#csvMonthSelect').value;if(!id)return;const btn=$('#confirmCsvImportBtn');btn.disabled=true;btn.textContent='Importando...';
    try{
      $('#importMessage').textContent='Consolidando dados do mês...';$('#importProgress').style.width='35%';
      const pending=state.pendingCsv,[year,month]=id.split('-').map(Number);let importedSquads=0,importedTechs=0;
      if(pending.scopeAll){
        const candidates=pending.codes.filter(code=>pending.rows.some(r=>r.group===code&&r.id===id));if(!candidates.length)throw new Error('Nenhum Squad possui registros vinculados para este mês.');
        for(const code of candidates){const s=state.squads[code],previous=s.months[id],data=buildMonthFromCsv(pending.rows,id,pending.fileName,previous,code);s.months[id]=data;importedSquads++;importedTechs+=data.technicians.length;if(state.supabase){$('#importMessage').textContent=`Gravando Squad ${code}...`;$('#importProgress').style.width=(55+Math.round(importedSquads/Math.max(1,candidates.length)*40))+'%';await persistImportedMonth(data,s)}}
        saveDemoSquads();refreshSelectors();render();state.pendingCsv=null;closeModal('importModal');toast(`${MONTHS_PT[month-1]} ${year}: ${importedSquads} Squads e ${importedTechs} técnicos atualizados.`);
      }else{
        const s=currentSquad(),previous=s.months[id],data=buildMonthFromCsv(pending.rows,id,pending.fileName,previous,state.squadCode);s.months[id]=data;state.currentId=id;state.techName=data.technicians[0]?.name||'';saveDemoSquads();
        if(state.supabase){$('#importMessage').textContent='Gravando no banco de dados...';$('#importProgress').style.width='70%';await persistImportedMonth(data,s)}
        refreshSelectors();render();state.pendingCsv=null;closeModal('importModal');toast(`${data.monthName} ${data.year} importado: ${data.technicians.length} técnicos.`);
      }
    }catch(err){console.error(err);$('#importMessage').textContent='Não foi possível concluir a importação.';$('#importDetails').textContent=err.message||String(err);$('#importProgress').style.width='100%'}finally{btn.disabled=false;btn.textContent='Importar mês'}
  }

  function parseServiceCsv(text){
    const lines=parseCsvRows(String(text||'').replace(/^﻿/,''));if(lines.length<2)throw new Error('CSV vazio ou sem linhas de dados.');
    const headers=lines[0].map(normalizeHeader),idx={};headers.forEach((h,i)=>idx[h]=i);
    const required=['time','tecnico','grupoatendimento','quantidade'];for(const h of required)if(idx[h]==null)throw new Error(`Coluna obrigatória não encontrada: ${h}.`);
    const noteIndex=n=>idx[`nota${n}`];const rows=[];let ignored=0;
    for(const cols of lines.slice(1)){
      const date=parseCsvDate(cols[idx.time]),name=normalizeName(cols[idx.tecnico]),group=normalizeName(cols[idx.grupoatendimento]);
      if(!date||!name||!['A','B','D','E'].includes(group)){ignored++;continue}
      const year=date.year,month=date.month,day=date.day;rows.push({id:`${year}-${String(month).padStart(2,'0')}`,year,month,day,name,group,att:csvNumber(cols[idx.quantidade]),notes5:csvNumber(cols[noteIndex(5)]),notes4:csvNumber(cols[noteIndex(4)]),notes3:csvNumber(cols[noteIndex(3)]),notes2:csvNumber(cols[noteIndex(2)]),notes1:csvNumber(cols[noteIndex(1)])});
    }
    if(!rows.length)throw new Error('Nenhuma linha válida foi encontrada para os Squads A, B, D ou E.');return{rows,ignored,total:lines.length-1};
  }

  function buildMonthFromCsv(rows,id,fileName,previous,squadCode=state.squadCode){
    const selected=rows.filter(r=>r.id===id&&r.group===squadCode);if(!selected.length)throw new Error('Nenhum registro encontrado para o mês selecionado.');
    const [year,month]=id.split('-').map(Number),byTech=new Map();let latest=1;
    for(const r of selected){latest=Math.max(latest,r.day);let t=byTech.get(r.name);if(!t){t={name:r.name,att:0,notes5:0,notes4:0,notes3:0,notes2:0,notes1:0,dailyMap:new Map()};byTech.set(r.name,t)}t.att+=r.att;t.notes5+=r.notes5;t.notes4+=r.notes4;t.notes3+=r.notes3;t.notes2+=r.notes2;t.notes1+=r.notes1;let d=t.dailyMap.get(r.day)||{day:r.day,att:0,notes5:0,off:false};d.att+=r.att;d.notes5+=r.notes5;t.dailyMap.set(r.day,d)}
    const prevBy=new Map((previous?.technicians||[]).map(t=>[normalizeName(t.name),t]));const daysInMonth=new Date(year,month,0).getDate();
    const technicians=[...byTech.values()].map(raw=>{const prev=prevBy.get(raw.name)||{};const daily=[];for(let d=1;d<=daysInMonth;d++)daily.push(raw.dailyMap.get(d)||{day:d,att:0,notes5:0,off:new Date(year,month-1,d).getDay()===0});return{name:raw.name,att:raw.att,notes5:raw.notes5,notes4:raw.notes4,notes3:raw.notes3,notes2:raw.notes2,notes1:raw.notes1,totalEval:0,avg:0,evalPct:0,status:prev.status||'',goalsHit:safe(prev.goalsHit),points:safe(prev.points),rank:prev.rank||null,discount:safe(prev.discount),pointBonus:safe(prev.pointBonus),goalAtt:safe(prev.goalAtt),goalEval:safe(prev.goalEval),daily}}).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
    const data={id,month,monthName:MONTHS_PT[month-1],year,sourceFile:fileName,latestDay:latest,importedAt:new Date().toISOString(),teamResult:previous?.teamResult||'',redistributed:safe(previous?.redistributed),settings:previous?.settings?{...previous.settings}:undefined,technicians};recalculateMonth(data);return data;
  }

  function parseCsvRows(text){
    const firstLine=(text.split(/\r?\n/,1)[0]||''),comma=(firstLine.match(/,/g)||[]).length,semi=(firstLine.match(/;/g)||[]).length,delimiter=semi>comma?';':',';const rows=[];let row=[],field='',quoted=false;
    for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){field+='"';i++}else if(c==='"')quoted=false;else field+=c}else if(c==='"')quoted=true;else if(c===delimiter){row.push(field);field=''}else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);field='';if(row.some(v=>String(v).trim()!==''))rows.push(row);row=[]}else field+=c}row.push(field);if(row.some(v=>String(v).trim()!==''))rows.push(row);return rows;
  }
  function normalizeHeader(v){return String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'')}
  function csvNumber(v){if(v==null||String(v).trim()==='')return 0;let s=String(v).trim().replace(/\s/g,'');if(/^[-+]?\d{1,3}(\.\d{3})+,\d+$/.test(s))s=s.replace(/\./g,'').replace(',','.');else if(/^[-+]?\d+,\d+$/.test(s))s=s.replace(',','.');const n=Number(s);return Number.isFinite(n)?n:0}
  function parseCsvDate(v){const m=String(v||'').trim().match(/^(\d{4})-(\d{2})-(\d{2})/);if(!m)return null;const year=Number(m[1]),month=Number(m[2]),day=Number(m[3]);if(month<1||month>12||day<1||day>31)return null;return{year,month,day}}
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
    await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    state.supabase=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}});
    const hashType=new URLSearchParams(window.location.hash.replace(/^#/, '')).get('type');
    if(hashType==='recovery')state.recoveryMode=true;
    state.supabase.auth.onAuthStateChange((event)=>{
      if(event==='PASSWORD_RECOVERY'){
        state.recoveryMode=true;
        setTimeout(()=>{showLogin('Link de recuperação validado. Defina sua nova senha.');openModal('recoveryModal');},0);
      }
    });
  }
  function loadScript(src){return new Promise((resolve,reject)=>{if(window.supabase)return resolve();const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('Falha ao carregar biblioteca Supabase.'));document.head.appendChild(s)})}
  async function enterSupabaseSession(authUser){
    const {data:profile,error}=await state.supabase.from('profiles').select('user_id,email,full_name,role,squad_id,technician_name,squads(id,code,name)').eq('user_id',authUser.id).single();if(error)throw error;
    state.user={userId:authUser.id,email:profile.email||authUser.email,fullName:profile.full_name,role:profile.role,squadCode:profile.squads?.code||null,techName:profile.technician_name?normalizeName(profile.technician_name):null};
    await loadSupabaseData();await enterApp(state.user);
  }
  async function loadSupabaseData(){
    const {data:squads,error}=await state.supabase.from('squads').select('id,code,name').eq('active',true).order('code');if(error)throw error;state.squads={};
    for(const s of squads){state.squads[s.code]={code:s.code,name:s.name,dbId:s.id,months:{}};const {data:themes}=await state.supabase.from('squad_themes').select('theme').eq('squad_id',s.id).maybeSingle();if(themes?.theme)state.squads[s.code].theme=themes.theme;const {data:months,error:me}=await state.supabase.from('squad_months').select('id,year,month,source_file,latest_day,imported_at,team_result,redistributed,team_goal_att,team_goal_eval_pct,technician_monthly(id,user_id,technician_name,att,notes5,notes4,notes3,notes2,notes1,total_eval,avg_rating,eval_pct,status,goals_hit,points,rank,discount,point_bonus,goal_att,goal_eval,daily_metrics(day,att,notes5,off))').eq('squad_id',s.id).order('year',{ascending:false}).order('month',{ascending:false});if(me)throw me;for(const row of months||[]){const id=`${row.year}-${String(row.month).padStart(2,'0')}`,technicians=(row.technician_monthly||[]).map(t=>({dbId:t.id,userId:t.user_id,name:t.technician_name,att:safe(t.att),notes5:safe(t.notes5),notes4:safe(t.notes4),notes3:safe(t.notes3),notes2:safe(t.notes2),notes1:safe(t.notes1),totalEval:safe(t.total_eval),avg:safe(t.avg_rating),evalPct:safe(t.eval_pct),status:t.status||'',goalsHit:safe(t.goals_hit),points:safe(t.points),rank:safe(t.rank)||null,discount:safe(t.discount),pointBonus:safe(t.point_bonus),goalAtt:safe(t.goal_att),goalEval:safe(t.goal_eval),daily:(t.daily_metrics||[]).map(d=>({day:d.day,att:safe(d.att),notes5:safe(d.notes5),off:!!d.off})).sort((a,b)=>a.day-b.day)}));const totals=deriveTotals(technicians);state.squads[s.code].months[id]={dbId:row.id,id,year:row.year,month:row.month,monthName:MONTHS_PT[row.month-1],sourceFile:row.source_file||'Supabase',latestDay:row.latest_day||1,importedAt:row.imported_at,teamResult:row.team_result||'',redistributed:safe(row.redistributed),teamTotals:totals,settings:{teamGoalAtt:safe(row.team_goal_att),teamGoalEvalPct:Number(row.team_goal_eval_pct??.343)},technicians}}}
  }
  async function persistImportedMonth(m,squad){
    const payload={squad_id:squad.dbId,year:m.year,month:m.month,source_file:m.sourceFile,latest_day:m.latestDay,team_result:m.teamResult,redistributed:m.redistributed,team_goal_att:m.settings?.teamGoalAtt||autoTeamAttGoal(m),team_goal_eval_pct:m.settings?.teamGoalEvalPct??.343,imported_by:state.user.userId,imported_at:new Date().toISOString()};
    const {data:monthRow,error}=await state.supabase.from('squad_months').upsert(payload,{onConflict:'squad_id,year,month'}).select('id').single();if(error)throw error;m.dbId=monthRow.id;
    const {data:profiles,error:pe}=await state.supabase.from('profiles').select('user_id,technician_name').eq('squad_id',squad.dbId);if(pe)throw pe;const userMap={};(profiles||[]).forEach(p=>{if(p.technician_name)userMap[normalizeName(p.technician_name)]=p.user_id});
    const {data:existing,error:ee}=await state.supabase.from('technician_monthly').select('id,technician_name').eq('squad_month_id',monthRow.id);if(ee)throw ee;const keepNames=new Set();
    for(const t of m.technicians){
      keepNames.add(normalizeName(t.name));
      const row={squad_month_id:monthRow.id,user_id:userMap[normalizeName(t.name)]||null,technician_name:t.name,att:t.att,notes5:t.notes5,notes4:t.notes4,notes3:t.notes3,notes2:t.notes2,notes1:t.notes1,total_eval:t.totalEval,avg_rating:t.avg,eval_pct:t.evalPct,status:t.status,goals_hit:t.goalsHit,points:t.points,rank:t.rank,discount:t.discount,point_bonus:t.pointBonus,goal_att:t.goalAtt,goal_eval:t.goalEval};
      const {data:tm,error:te}=await state.supabase.from('technician_monthly').upsert(row,{onConflict:'squad_month_id,technician_name'}).select('id').single();if(te)throw te;t.dbId=tm.id;
      const {error:dd}=await state.supabase.from('daily_metrics').delete().eq('technician_month_id',tm.id);if(dd)throw dd;
      const daily=(t.daily||[]).map(d=>({technician_month_id:tm.id,day:d.day,att:d.att,notes5:d.notes5,off:!!d.off}));if(daily.length){const {error:de}=await state.supabase.from('daily_metrics').insert(daily);if(de)throw de}
    }
    for(const old of existing||[]){if(!keepNames.has(normalizeName(old.technician_name))){const {error:se}=await state.supabase.from('technician_monthly').delete().eq('id',old.id);if(se)throw se}}
  }
  async function persistThemeToSupabase(){const squad=currentSquad();if(!state.supabase||!squad?.dbId)return;const {error}=await state.supabase.from('squad_themes').upsert({squad_id:squad.dbId,theme:themePayload(),updated_by:state.user.userId,updated_at:new Date().toISOString()},{onConflict:'squad_id'});if(error)throw error;squad.theme=clone(state.theme)}

  function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  boot();
})();
