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
  const HISTORY_COLORS = ['#f0a33a','#36c98f','#ff4ddb','#e6edf7','#9ea4ad','#2f78ff','#ff3b30','#9b6cff','#22c7d6','#f2c14e','#63d471','#ef7f4d'];
  const safe = n => Number.isFinite(Number(n)) ? Number(n) : 0;
  const roundTo = (n,decimals=0) => {const f=10**decimals;return Math.round((safe(n)+Number.EPSILON)*f)/f};
  const clone = obj => JSON.parse(JSON.stringify(obj));
  const firstRelation = v => Array.isArray(v)?(v[0]||{}):(v||{});
  const DEFAULT_FINANCE_SETTINGS = {
    attendanceTiers:[
      {min:50,amount:750},{min:40,amount:637.50},{min:32,amount:541.88},{min:25.6,amount:460.59},{min:20.5,amount:391.50},
      {min:16.4,amount:332.78},{min:13.1,amount:282.86},{min:10.5,amount:240.43},{min:8.4,amount:204.37},{min:6.7,amount:0}
    ],
    notes5Tiers:[
      {min:1,amount:750},{min:.70,amount:600},{min:.49,amount:480},{min:.343,amount:384},{min:.24,amount:307.20},
      {min:.168,amount:245.76},{min:.118,amount:196.61},{min:.083,amount:0},{min:.058,amount:0},{min:.04,amount:0}
    ],
    cancelTiers:[
      {max:.004,mult:2},{max:.008,mult:1.760},{max:.012,mult:1.549},{max:.016,mult:1.363},{max:.020,mult:1.199},
      {max:.024,mult:1.055},{max:.028,mult:0},{max:.032,mult:0},{max:.036,mult:0},{max:.040,mult:0}
    ],
    topAttendancePrize:100,topNotes5Prize:100,belowDiscount:200
  };

  const DEFAULT_FAVICON = 'assets/favicon-dragon.png';
  const DEFAULT_SOUNDTRACK = 'assets/casa-do-dragao-ambient.mp3';
  const DEFAULT_SOUNDTRACK_NAME = 'Fogo & Conquista';
  const DEFAULT_THEME = {soundtrack:DEFAULT_SOUNDTRACK,soundtrackName:DEFAULT_SOUNDTRACK_NAME,soundtrackVolume:.24,favicon:DEFAULT_FAVICON,name:'Casa do Dragão',campaignTitle:'Casa do Dragão',campaignTagline:'Unifique os squads, mantenha o fogo das metas e avance o reino dos resultados.',preset:'vermithor',accent:'#f0a33a',secondary:'#ef5a29',bg:'#080b12',bg2:'#10141e',panel:'rgba(17,22,31,.88)',text:'#f5f6f8',background:'assets/vermithor.png',opacity:.28};
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
    adminSection:'operation',
    userDirectory:[],
    userDirectoryLoaded:false,
    recoveryMode:false,
    pendingCsv:null,
    indicatorStartId:null,
    indicatorEndId:null,
    orgOverview:[],
    orgTechnicianOverview:[],
    orgDailyOverview:[],
    allTechniciansMetric:'points',
    allTechniciansRangeIds:[],
    superAdminCommissions:[],
    financeRankingCache:{},
    financeRankingLoading:{},
    audio:{source:null,playing:false,pendingResume:false,previewing:false,previewBefore:null,fadeTimer:null}
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
    const themes=allThemes(); themes[state.squadCode]=state.theme; try{localStorage.setItem('squadDashboardThemesV2',JSON.stringify(themes));}catch(err){console.warn('Tema grande demais para o cache local; mantendo persistência no Supabase.',err);}
    if(state.supabase) persistThemeToSupabase().catch(console.error);
  }

  function showBoot(message='Validando sua sessão e carregando os dados...'){
    const el=$('#bootScreen');if(!el)return;el.classList.remove('hidden');if($('#bootMessage'))$('#bootMessage').textContent=message;
  }
  function hideBoot(){const el=$('#bootScreen');if(el)el.classList.add('hidden')}

  async function boot(){
    showBoot();
    bindStaticEvents();
    if((window.APP_CONFIG?.mode||'demo')==='supabase'){
      try{
        if($('#bootMessage'))$('#bootMessage').textContent='Conectando com segurança...';
        await initSupabase();
        if($('#bootMessage'))$('#bootMessage').textContent='Validando sua sessão...';
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
    $$('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>showView(btn.dataset.view,btn.dataset.adminSection||null)));
    ['#sideUserProfileBtn','#topUserProfileBtn'].forEach(sel=>{const el=$(sel);if(!el)return;el.addEventListener('click',()=>showView('profile'));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showView('profile')}})});
    $('#profilePasswordForm').addEventListener('submit',handleProfilePasswordChange);
    $('#mobileMenu').addEventListener('click',()=>$('.sidebar').classList.toggle('open'));
    $('#squadSelect').addEventListener('change',async e=>{await selectSquad(e.target.value);});
    $('#monthSelect').addEventListener('change',e=>{state.currentId=e.target.value; chooseDefaultTech(); refreshSelectors(); render();});
    $('#techSelect').addEventListener('change',e=>{state.techName=e.target.value; renderIndividual();});
    $('#adminImportBtn').addEventListener('click',openImport);
    $('#adminThemeBtn').addEventListener('click',()=>{if(requireSpecificSquad())openModal('themeModal')});
    if($('#openUsersBtn'))$('#openUsersBtn').addEventListener('click',()=>showView('users'));
    $('#newUserBtn').addEventListener('click',openCreateUser);
    $('#createUserForm').addEventListener('submit',handleCreateUser);
    $('#newUserRole').addEventListener('change',syncCreateUserFields);
    $('#editUserForm').addEventListener('submit',handleEditUser);
    $('#editUserRole').addEventListener('change',syncEditUserFields);
    $('#editUserSquad').addEventListener('change',syncEditUserFields);
    $('#userSearchInput').addEventListener('input',renderUserRows);
    $('#userRoleFilter').addEventListener('change',renderUserRows);
    $('#chooseFileBtn').addEventListener('click',()=>$('#csvInput').click());
    $('#csvInput').addEventListener('change',handleCsvFile);
    $('#confirmCsvImportBtn').addEventListener('click',confirmCsvImport);
    $('#saveMonthlyMetricsBtn').addEventListener('click',saveMonthlyMetrics);
    if($('#saveFinanceBtn'))$('#saveFinanceBtn').addEventListener('click',saveFinanceConfiguration);
    if($('#saveFinanceTechniciansBtn'))$('#saveFinanceTechniciansBtn').addEventListener('click',saveFinanceTechnicians);
    if($('#copyFinanceRulesBtn'))$('#copyFinanceRulesBtn').addEventListener('click',copyFinanceRulesFromPreviousMonth);
    if($('#exportFinanceExcelBtn'))$('#exportFinanceExcelBtn').addEventListener('click',exportFinanceExcel);
    if($('#exportFinancePdfBtn'))$('#exportFinancePdfBtn').addEventListener('click',exportFinancePdf);
    if($('#saveSuperAdminCommissionBtn'))$('#saveSuperAdminCommissionBtn').addEventListener('click',saveSuperAdminCommission);
    if($('#financeModelSquad'))$('#financeModelSquad').addEventListener('change',previewFinanceModelChange);
    if($('#financeModelIndividual'))$('#financeModelIndividual').addEventListener('change',previewFinanceModelChange);
    if($('#financeCompareToggle'))$('#financeCompareToggle').addEventListener('change',previewFinanceModelChange);
    if($('#financeTechnicianCompareToggle'))$('#financeTechnicianCompareToggle').addEventListener('change',previewFinanceModelChange);
    if($('#financeIndividualCap'))$('#financeIndividualCap').addEventListener('change',previewFinanceModelChange);
    $('#copyPreviousGoalsBtn').addEventListener('click',copyGoalsFromPreviousMonth);
    $('#saveScoreSettingsBtn').addEventListener('click',saveScoreSettings);
    $$('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close)));
    if($('#confirmDialogConfirm'))$('#confirmDialogConfirm').addEventListener('click',()=>settleConfirmDialog(true));
    if($('#confirmDialogCancel'))$('#confirmDialogCancel').addEventListener('click',()=>settleConfirmDialog(false));
    if($('#confirmDialogClose'))$('#confirmDialogClose').addEventListener('click',()=>settleConfirmDialog(false));
    $$('.modal').forEach(m=>{
      let backdropDown=false;
      m.addEventListener('pointerdown',e=>{backdropDown=e.target===m;});
      m.addEventListener('pointerup',e=>{
        const staticBackdrop=m.dataset.staticBackdrop==='true';
        if(!staticBackdrop&&backdropDown&&e.target===m)closeModal(m.id);
        backdropDown=false;
      });
      m.addEventListener('pointercancel',()=>{backdropDown=false});
    });
    $$('.preset').forEach(b=>b.addEventListener('click',()=>applyPreset(b.dataset.theme)));
    $('#accentColor').addEventListener('input',e=>{if(!isAdmin())return;document.documentElement.style.setProperty('--accent',e.target.value);state.theme.accent=e.target.value;state.theme.name='Personalizado';state.theme.preset='custom';saveTheme();updateThemeName();});
    $('#secondaryColor').addEventListener('input',e=>{if(!isAdmin())return;document.documentElement.style.setProperty('--accent2',e.target.value);state.theme.secondary=e.target.value;state.theme.name='Personalizado';state.theme.preset='custom';saveTheme();updateThemeName();});
    $('#backgroundFile').addEventListener('change',handleBackground);
    if($('#chooseFaviconBtn'))$('#chooseFaviconBtn').addEventListener('click',()=>$('#faviconFile')?.click());
    if($('#faviconFile'))$('#faviconFile').addEventListener('change',handleFavicon);
    if($('#resetFavicon'))$('#resetFavicon').addEventListener('click',resetFavicon);
    if($('#chooseSoundtrackBtn'))$('#chooseSoundtrackBtn').addEventListener('click',()=>$('#soundtrackFile')?.click());
    if($('#soundtrackFile'))$('#soundtrackFile').addEventListener('change',handleSoundtrackFile);
    if($('#previewSoundtrackBtn'))$('#previewSoundtrackBtn').addEventListener('click',previewThemeSoundtrack);
    if($('#resetSoundtrack'))$('#resetSoundtrack').addEventListener('click',resetSoundtrack);
    if($('#removeSoundtrack'))$('#removeSoundtrack').addEventListener('click',removeSoundtrack);
    if($('#soundtrackNameInput'))$('#soundtrackNameInput').addEventListener('input',e=>{if(!isAdmin())return;state.theme.soundtrackName=e.target.value.trim()||DEFAULT_SOUNDTRACK_NAME;state.theme.preset='custom';saveTheme();syncSoundPlayerUi();});
    if($('#soundtrackDefaultVolume')){$('#soundtrackDefaultVolume').addEventListener('input',e=>{if(!isAdmin())return;const v=clamp(safe(e.target.value)/100,0,1);state.theme.soundtrackVolume=v;if($('#soundtrackDefaultVolumeLabel'))$('#soundtrackDefaultVolumeLabel').textContent=`${Math.round(v*100)}%`;});$('#soundtrackDefaultVolume').addEventListener('change',()=>{if(!isAdmin())return;state.theme.preset='custom';saveTheme();});}
    if($('#soundToggleBtn'))$('#soundToggleBtn').addEventListener('click',toggleSoundPlayback);
    if($('#soundMuteBtn'))$('#soundMuteBtn').addEventListener('click',toggleSoundMute);
    if($('#soundVolume'))$('#soundVolume').addEventListener('input',handleSoundVolume);
    if($('#soundEnterOn'))$('#soundEnterOn').addEventListener('click',()=>chooseSoundWelcome(true));
    if($('#soundEnterOff'))$('#soundEnterOff').addEventListener('click',()=>chooseSoundWelcome(false));
    $('#campaignNameInput').addEventListener('input',e=>{if(!isAdmin())return;state.theme.campaignTitle=e.target.value;state.theme.name=e.target.value||'Personalizado';state.theme.preset='custom';saveTheme();applyTheme(state.theme);});
    $('#campaignTaglineInput').addEventListener('input',e=>{if(!isAdmin())return;state.theme.campaignTagline=e.target.value;state.theme.preset='custom';saveTheme();applyTheme(state.theme);});
    $('#saveGoalsBtn').addEventListener('click',saveTeamGoals);
    $('#autoGoalBtn').addEventListener('click',useAutomaticTeamGoal);
    $('#importThemeBtn').addEventListener('click',()=>{if(requireSpecificSquad())$('#themeJsonInput').click()});
    $('#themeJsonInput').addEventListener('change',handleThemeJson);
    $('#exportThemeBtn').addEventListener('click',exportTheme);
    $('#removeBg').addEventListener('click',()=>{if(!isAdmin())return;state.theme.background=null;state.theme.preset='custom';document.documentElement.style.setProperty('--hero-img','none');saveTheme();toast('Fundo removido.');});
    if($('#indicatorStartMonth'))$('#indicatorStartMonth').addEventListener('change',e=>{state.indicatorStartId=e.target.value;renderIndicators();});
    if($('#indicatorEndMonth'))$('#indicatorEndMonth').addEventListener('change',e=>{state.indicatorEndId=e.target.value;renderIndicators();});
    if($('#openAllTechniciansChartBtn'))$('#openAllTechniciansChartBtn').addEventListener('click',()=>openAllTechniciansChart('indicator'));
    if($('#openAllTechniciansChartTeamBtn'))$('#openAllTechniciansChartTeamBtn').addEventListener('click',()=>openAllTechniciansChart('team'));
    if($('#allTechniciansMetric'))$('#allTechniciansMetric').addEventListener('change',e=>{state.allTechniciansMetric=e.target.value;renderAllTechniciansFullscreenChart(state.allTechniciansRangeIds);});
    let allTechResizeTimer=null;window.addEventListener('resize',()=>{if(!$('#allTechniciansModal')?.classList.contains('open'))return;clearTimeout(allTechResizeTimer);allTechResizeTimer=setTimeout(()=>renderAllTechniciansFullscreenChart(state.allTechniciansRangeIds),120);});
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
  function showLogin(message=''){ hideBoot();$('#loginScreen').classList.remove('hidden');$('#appShell').classList.add('hidden');if(message)$('#loginError').textContent=message; }
  async function logout(){
    stopThemeAudio();if(state.supabase) await state.supabase.auth.signOut(); sessionStorage.removeItem('squadDemoSession'); state.user=null;showLogin();
  }

  async function enterApp(user){
    state.user=user;
    state.userDirectoryLoaded=false;state.userDirectory=[];
    state.squadCode=user.role==='super_admin'?'D':(user.squadCode||'D');
    chooseLatestMonth(); chooseDefaultTech();
    state.theme=state.squads[state.squadCode]?.theme||loadThemeForSquad(state.squadCode); applyTheme(state.theme);
    if((window.APP_CONFIG?.mode||'demo')==='demo'){state.orgOverview=buildOrgOverviewFromState();state.orgTechnicianOverview=buildOrgTechnicianOverviewFromState();state.orgDailyOverview=buildOrgDailyOverviewFromState();}
    applyPermissions(); refreshSelectors(); render();
    hideBoot();$('#loginScreen').classList.add('hidden');$('#appShell').classList.remove('hidden');
    initializeThemeAudio();
  }
  function applyPermissions(){
    const admin=isAdmin(), superAdmin=isSuperAdmin();
    $$('.admin-only').forEach(el=>el.classList.toggle('hidden',!admin));
    $$('.super-only').forEach(el=>el.classList.toggle('hidden',!superAdmin));
    $$('.admin-help').forEach(el=>el.classList.toggle('hidden',!admin));
    $$('.super-help').forEach(el=>el.classList.toggle('hidden',!superAdmin));
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
  function currentTech(){const m=currentMonth();if(!m)return null;return m.technicians.find(t=>samePersonName(t.name,state.techName))||m.technicians[0]||null}
  function chooseLatestMonth(){const ids=Object.keys(currentMonths()).sort().reverse();state.currentId=ids[0]||null}
  function chooseDefaultTech(){const m=currentMonth();if(!m){state.techName='';return}if(isTechnician()){const own=m.technicians.find(t=>samePersonName(t.name,state.user.techName));state.techName=own?.name||state.user.techName||m.technicians[0]?.name||'';return}if(!m.technicians.some(t=>samePersonName(t.name,state.techName)))state.techName=m.technicians[0]?.name||''}

  async function selectSquad(code){
    if(!isSuperAdmin())return; state.squadCode=code;
    if(code==='all'){state.currentId=null;state.techName='';state.theme=clone(DEFAULT_THEME);applyTheme(state.theme);if(state.currentView==='individual')showView('team');}
    else{chooseLatestMonth();chooseDefaultTech();state.theme=state.squads[code]?.theme||loadThemeForSquad(code);applyTheme(state.theme);}
    refreshSelectors();render();applyPermissions();
  }
  function requireSpecificSquad(){if(state.squadCode==='all'){toast('Selecione um Squad específico primeiro.');return false}return true}

  function resetViewScroll(){
    const goTop=()=>{
      try{window.scrollTo({top:0,left:0,behavior:'auto'});}catch(e){window.scrollTo(0,0);}
      document.documentElement.scrollTop=0;
      document.body.scrollTop=0;
      const main=$('.main');if(main&&main.scrollTop)main.scrollTop=0;
    };
    goTop();
    requestAnimationFrame(goTop);
  }

  function showView(name,adminSection=null){
    if((name==='admin'||name==='users')&&!isAdmin())return;
    if(name==='indicators'&&!isSuperAdmin())return;
    if(name==='individual'&&state.squadCode==='all')name='team';
    if(name==='admin'&&adminSection)state.adminSection=adminSection;
    state.currentView=name;
    $$('.view').forEach(v=>v.classList.remove('active')); const view=$('#view-'+name);if(view)view.classList.add('active');
    $$('.nav-btn').forEach(b=>{const sameView=b.dataset.view===name;const sameSection=name!=='admin'||!b.dataset.adminSection||b.dataset.adminSection===state.adminSection;b.classList.toggle('active',sameView&&sameSection)});
    const adminTitles={operation:'Operação',finance:'Bonificação',appearance:'Aparência'};
    const titles={individual:'Meu desempenho',team:'Visão do Squad',indicators:'Indicadores',users:'Usuários',admin:adminTitles[state.adminSection]||'Gestão',profile:'Meu perfil',help:'Como usar'};
    $('#pageTitle').textContent=titles[name]||'Performance Hub';
    $('.technician-control').classList.toggle('hidden',name!=='individual'||isTechnician()||state.squadCode==='all');
    $('.month-control').classList.toggle('hidden',name==='users'||name==='profile'||name==='help'||name==='indicators');
    $('.sidebar').classList.remove('open');
    render();
    resetViewScroll();
  }

  function refreshSelectors(){
    if(isSuperAdmin()) $('#squadSelect').innerHTML=`<option value="all" ${state.squadCode==='all'?'selected':''}>Todos os Squads</option>`+Object.values(state.squads).sort((a,b)=>a.code.localeCompare(b.code)).map(s=>`<option value="${s.code}" ${s.code===state.squadCode?'selected':''}>${escapeHtml(s.name)}</option>`).join('');
    const m=currentMonth(), ids=Object.keys(currentMonths()).sort().reverse();
    $('#monthSelect').disabled=!ids.length||state.squadCode==='all';
    $('#monthSelect').innerHTML=ids.length?ids.map(id=>{const mm=currentMonths()[id];return `<option value="${id}" ${id===state.currentId?'selected':''}>${mm.monthName} ${mm.year}${mm.isClosed?' • Fechado':''}</option>`}).join(''):'<option>Sem dados</option>';
    if(m){chooseDefaultTech();$('#techSelect').innerHTML=m.technicians.map(t=>`<option ${t.name===state.techName?'selected':''}>${escapeHtml(t.name)}</option>`).join('')}else $('#techSelect').innerHTML='<option>Sem dados</option>';
    const label=state.squadCode==='all'?'TODOS OS SQUADS':`SQUAD ${state.squadCode}`;$('#squadEyebrow').textContent=label;
  }

  function render(){
    applyPermissions();
    if(state.currentView==='users')renderUsers().catch(err=>{console.error(err);toast('Não foi possível carregar os usuários.')});
    if(state.currentView==='help')renderHelp();
    if(state.currentView==='profile')renderProfile();
    if(state.currentView==='indicators')renderIndicators();
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
    const audit=technicianStatusAudit(t,m),rules=audit.rules;
    $('#heroName').textContent=firstName(t.name);$('#heroStatus').textContent=t.status?`STATUS ${t.status}`:(hasGoals?overallLabel(attPct,notePct):'METAS PENDENTES');$('#heroStatus').style.color=String(t.status).toUpperCase()==='ACIMA'?'var(--success)':String(t.status).toUpperCase()==='ABAIXO'?'var(--danger)':(hasGoals?overallColor(attPct,notePct):'var(--warn)');$('#heroMessage').textContent=buildHeroMessage(t,attPct,notePct);
    $('#lastUpdate').textContent=m.isClosed?`🔒 Mês fechado • dados até ${String(m.latestDay||1).padStart(2,'0')}/${String(m.month).padStart(2,'0')}`:`Atualizado até ${String(m.latestDay||1).padStart(2,'0')}/${String(m.month).padStart(2,'0')}`;$('#sourceFile').textContent=m.sourceFile||'Dados do banco';
    $('#rankNumber').textContent=t.rank?`#${t.rank}`:'—';$('#rankContext').textContent=`de ${m.technicians.length} no Squad ${state.squadCode}`;
    $('#kpiAtt').textContent=fmtInt(t.att);$('#kpiAttGoal').textContent=`/ ${fmtInt(t.goalAtt)}`;$('#attBar').style.width=clamp(attPct*100,0,100)+'%';$('#attProgress').textContent=fmtPct(attPct);$('#attRemaining').textContent=t.att>=t.goalAtt?`+${fmtInt(t.att-t.goalAtt)} acima`:`Faltam ${fmtInt(t.goalAtt-t.att)}`;
    $('#kpiNotes').textContent=fmtInt(t.notes5);$('#kpiNotesGoal').textContent=`/ ${fmtInt(t.goalEval)}`;$('#noteBar').style.width=clamp(notePct*100,0,100)+'%';$('#noteProgress').textContent=fmtPct(notePct);$('#noteRemaining').textContent=t.notes5>=t.goalEval?`+${fmtInt(t.notes5-t.goalEval)} acima`:`Faltam ${fmtInt(t.goalEval-t.notes5)}`;
    $('#kpiEvalPct').textContent=fmtPct(t.evalPct);$('#evalCount').textContent=`${fmtInt(t.totalEval)} avaliações`;$('#avgRating').textContent=`Média ${safe(t.avg).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}`;const evalTarget=teamSettings(m).teamGoalEvalPct;$('#evalQuality').textContent=t.evalPct>=evalTarget?'Meta de avaliação atingida':t.avg>=4.9?'Qualidade excelente':'Acompanhar qualidade';
    const avgAbove=safe(t.avg)>=rules.refAvg;$('#kpiAvgRating').textContent=safe(t.avg).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});$('#avgRatingBar').style.width=clamp((safe(t.avg)/5)*100,0,100)+'%';$('#avgRatingStatus').textContent=avgAbove?'Acima da referência':'Abaixo da referência';$('#avgRatingStatus').style.color=avgAbove?'var(--success)':'var(--danger)';$('#avgRatingReference').textContent=`Ref. ${safe(rules.refAvg).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
    $('#kpiPoints').textContent=fmtNum(t.points);$('#goalsHit').textContent=`${fmtInt(t.goalsHit)}/4 critérios • acumulado ${fmtNum(cumulativePointsForTech(t))} pts`;if($('#pointsStatusFoot')){$('#pointsStatusFoot').textContent=`Status ${t.status||'—'}`;$('#pointsStatusFoot').style.color=String(t.status).toUpperCase()==='ACIMA'?'var(--success)':String(t.status).toUpperCase()==='ABAIXO'?'var(--danger)':'var(--muted)'}if($('#pointsRankFoot'))$('#pointsRankFoot').textContent=t.rank?`Ranking #${t.rank}`:'Ranking —';
    $('#attGoalPct').textContent=fmtPct(attPct);$('#noteGoalPct').textContent=fmtPct(notePct);$('#attGoalText').textContent=goalLine('atendimentos',t.att,t.goalAtt);$('#noteGoalText').textContent=goalLine('notas',t.notes5,t.goalEval);
    $('#goalOrb').style.background=overallColor(attPct,notePct);$('#goalOrb').style.boxShadow=`0 0 18px ${overallColor(attPct,notePct)}`;const coach=coachText(t,m,attPct,notePct);$('#coachTitle').textContent=coach.title;$('#coachText').textContent=coach.text;
    renderStatusAudit(t,m,audit);renderFinanceSummary(t,m);renderGamification(t,m,attPct,notePct);renderChart(t,m);renderDaily(t,m);renderMiniRanking(m,t.name);renderFinanceRanking(m,t.name);
  }

  function technicianStatusAudit(t,m){
    const rules=displayScoreRules(m),criteria=[
      {key:'att',label:'Atendimentos',value:safe(t.att),ref:safe(rules.refAtt),format:v=>fmtNum(v),source:rules.attSource||'Referência do mês'},
      {key:'eval',label:'Total de avaliações',value:safe(t.totalEval),ref:safe(rules.refTotalEval),format:v=>fmtNum(v),source:rules.evalSource||'Referência do mês'},
      {key:'avg',label:'Nota média',value:safe(t.avg),ref:safe(rules.refAvg),format:v=>safe(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}),source:rules.avgSource||'Referência do mês'},
      {key:'pct',label:'% avaliado',value:safe(t.evalPct),ref:safe(rules.refEvalPct),format:v=>fmtPct(v),source:rules.pctSource||'Referência do mês'}
    ];
    const active=safe(t.att)>0;criteria.forEach(c=>c.hit=active&&c.value>=c.ref);
    const hits=criteria.filter(c=>c.hit).length;return{rules,criteria,hits,status:active?(hits>=2?'ACIMA':'ABAIXO'):''};
  }
  function renderStatusAudit(t,m,audit=technicianStatusAudit(t,m)){
    const badge=$('#auditStatusBadge'),word=$('#auditStatusWord');if(!badge||!word)return;
    word.textContent=audit.status;badge.textContent=audit.status;badge.classList.toggle('above',audit.status==='ACIMA');badge.classList.toggle('below',audit.status==='ABAIXO');
    const r=audit.rules,progressText=m.isClosed?'mês fechado':'médias atuais do Squad';
    $('#auditExplainer').textContent=m.isClosed?'Referências congeladas no fechamento do mês.':'O status usa sempre as médias atuais do próprio Squad, exatamente como a planilha. A cada importação essas quatro referências são recalculadas.';
    $('#statusAuditGrid').innerHTML=audit.criteria.map(c=>`<div class="audit-item ${c.hit?'hit':'miss'}"><div class="audit-top"><strong>${escapeHtml(c.label)}</strong><span class="audit-check">${c.hit?'✓':'✕'}</span></div><div class="audit-values"><b>${c.format(c.value)}</b><span>vs ${c.format(c.ref)}</span></div><small>${escapeHtml(c.source)}</small></div>`).join('');
    $('#statusAuditFooter').innerHTML=audit.status?`<strong>${audit.hits}/4 critérios atendidos → ${audit.status}.</strong> Referência: ${progressText}. ${m.isClosed?'Os valores não mudam mais até o mês ser reaberto.':'2 ou mais critérios = ACIMA; 0 ou 1 = ABAIXO.'}`:'<strong>Sem status.</strong> O técnico ainda não possui atendimentos no mês.';
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
  function localFinanceRankingRows(m){
    return (m?.technicians||[]).map(t=>({technicianName:t.name,amount:safe(t.financeData?.final),model:financeModelForMonth(m)})).sort((a,b)=>safe(b.amount)-safe(a.amount)||String(a.technicianName).localeCompare(String(b.technicianName),'pt-BR')).map((r,i)=>({...r,rank:i+1}));
  }
  async function loadFinanceRankingForTechnician(m){
    if(!state.supabase||!isTechnician()||!m)return;const key=`${state.squadCode}|${m.id}`;if(state.financeRankingCache[key]||state.financeRankingLoading[key])return;state.financeRankingLoading[key]=true;
    try{const {data,error}=await state.supabase.rpc('get_my_squad_finance_ranking',{p_year:m.year,p_month:m.month});if(error)throw error;state.financeRankingCache[key]=(data||[]).map(r=>({technicianName:r.technician_name,amount:safe(r.amount),rank:safe(r.ranking)||null,model:r.finance_model||financeModelForMonth(m)}));}
    catch(err){console.warn('Ranking financeiro do Squad indisponível. Confira a migração V2.20.0.',err);state.financeRankingCache[key]=[];}finally{delete state.financeRankingLoading[key];if(currentMonth()?.id===m.id)renderFinanceRanking(m,state.techName)}
  }
  function renderFinanceRanking(m,selected){
    const el=$('#financeRanking'),label=$('#financeRankingModel');if(!el||!m)return;const key=`${state.squadCode}|${m.id}`;let rows;
    if(isTechnician()&&state.supabase){rows=state.financeRankingCache[key];if(!rows){el.innerHTML='<div class="muted finance-ranking-loading">Carregando valores do Squad...</div>';loadFinanceRankingForTechnician(m);return}}else rows=localFinanceRankingRows(m);
    if(label)label.textContent=`${financeModelLabel(financeModelForMonth(m))} • ${m.monthName}`;
    el.innerHTML=(rows||[]).map((r,i)=>`<div class="rank-row ${samePersonName(r.technicianName,selected)?'selected':''}"><span class="rank-pos">${r.rank||i+1}</span><div><strong>${escapeHtml(shortName(r.technicianName))}</strong><small>${m.isClosed?'Valor final da competência':'Valor oficial estimado'}</small></div><span class="rank-score finance-rank-value">${fmtMoney(r.amount)}</span></div>`).join('')||'<div class="muted">Nenhum valor financeiro disponível.</div>';
  }

  function renderTeam(){
    const all=state.squadCode==='all';$('#allSquadsPanel').classList.toggle('hidden',!all);$('#singleSquadPanel').classList.toggle('hidden',all);if(all){renderPortfolio();return}
    const m=currentMonth();if(!m)return;const totals=m.teamTotals||deriveTotals(m.technicians),cfg=teamSettings(m),attProgress=cfg.teamGoalAtt?totals.att/cfg.teamGoalAtt:0,evalProgress=cfg.teamGoalEvalPct?totals.evalPct/cfg.teamGoalEvalPct:0,statusInfo=teamStatusFromPoints(m);
    const teamResultValue=String(m.teamResult||'—').toUpperCase(),teamResultBox=$('#teamResult')?.closest('.team-result');$('#teamResult').textContent=m.teamResult||'—';if(teamResultBox){teamResultBox.classList.toggle('above',teamResultValue==='ACIMA');teamResultBox.classList.toggle('below',teamResultValue==='ABAIXO');teamResultBox.classList.toggle('neutral',teamResultValue!=='ACIMA'&&teamResultValue!=='ABAIXO')}$('#teamAtt').textContent=fmtInt(totals.att);$('#teamAttGoal').textContent=fmtInt(cfg.teamGoalAtt);$('#teamEval').textContent=fmtInt(totals.eval);$('#teamPct').textContent=fmtPct(totals.evalPct);$('#teamPctGoal').textContent=fmtPct(cfg.teamGoalEvalPct);$('#teamAttBar').style.width=clamp(attProgress*100,0,100)+'%';$('#teamPctBar').style.width=clamp(evalProgress*100,0,100)+'%';$('#teamAttNote').textContent=totals.att>=cfg.teamGoalAtt?`${fmtInt(totals.att-cfg.teamGoalAtt)} acima da meta`:`${fmtPct(attProgress)} da meta • faltam ${fmtInt(cfg.teamGoalAtt-totals.att)}`;$('#teamPctNote').textContent=totals.evalPct>=cfg.teamGoalEvalPct?`${((totals.evalPct-cfg.teamGoalEvalPct)*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})} p.p. acima da meta`:`Faltam ${((cfg.teamGoalEvalPct-totals.evalPct)*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})} p.p. para a meta`;$('#teamHeroTitle').textContent=`Squad ${state.squadCode} em ${m.monthName}`;
    $('#teamAvgPoints').textContent=fmtNum(statusInfo.avgPoints);$('#teamAvgPointsNote').textContent=`${statusInfo.aboveCount} de ${statusInfo.count} acima da média`;
    $('#teamStatusAudit').textContent=statusInfo.count?`${statusInfo.aboveCount} de ${statusInfo.count} técnicos acima de ${fmtNum(statusInfo.avgPoints)} pts • ${fmtPct(statusInfo.ratio)} • mínimo 50%`:'Sem técnicos com pontuação para calcular o status';
    const list=[...m.technicians].sort((a,b)=>(a.rank||99)-(b.rank||99));$('#teamLeaderboard').innerHTML=list.map(t=>`<div class="leader-item ${t.rank===1?'top1':''}"><div class="place">#${t.rank||'—'}</div><div class="name">${escapeHtml(t.name)}</div><div class="metric"><span>Atend.</span><strong>${fmtInt(t.att)}</strong></div><div class="metric"><span>Notas 5</span><strong>${fmtInt(t.notes5)}</strong></div><div class="metric hide-md"><span>% Aval.</span><strong>${fmtPct(t.evalPct)}</strong></div><div class="metric points"><span>Pontos</span><strong>${fmtNum(t.points)}</strong></div><div><span class="status ${String(t.status).toUpperCase()==='ACIMA'?'above':'below'}">${escapeHtml(t.status||'—')}</span></div></div>`).join('');
    renderTeamHistoricalAnalytics(currentSquad());
    renderTeamSquadOverview();
    renderTeamOrgDailyComparison();
  }
  function renderPortfolio(){
    $('#squadPortfolio').innerHTML=Object.values(state.squads).sort((a,b)=>a.code.localeCompare(b.code)).map(s=>{const ids=Object.keys(s.months||{}).sort().reverse(),m=ids.length?s.months[ids[0]]:null;if(!m)return `<article class="card squad-card" data-squad-card="${s.code}"><div class="squad-card-head"><div class="squad-letter">${s.code}</div><span class="status-line">SEM DADOS</span></div><h3>${escapeHtml(s.name)}</h3><div class="squad-empty">Aguardando a primeira importação.</div></article>`;const totals=m.teamTotals||deriveTotals(m.technicians);return `<article class="card squad-card" data-squad-card="${s.code}"><div class="squad-card-head"><div class="squad-letter">${s.code}</div><span class="status ${String(m.teamResult).toUpperCase()==='ACIMA'?'above':'below'}">${escapeHtml(m.teamResult||'—')}</span></div><h3>${escapeHtml(s.name)}</h3><div class="status-line">${m.monthName} ${m.year} • ${m.technicians.length} técnicos</div><div class="squad-summary"><div><span>Atend.</span><strong>${fmtInt(totals.att)}</strong></div><div><span>Aval.</span><strong>${fmtInt(totals.eval)}</strong></div><div><span>% Aval.</span><strong>${fmtPct(totals.evalPct)}</strong></div></div></article>`}).join('');
    $$('[data-squad-card]').forEach(el=>el.addEventListener('click',()=>selectSquad(el.dataset.squadCard)));
  }


function indicatorScopeSquads(){
  if(state.squadCode==='all') return Object.values(state.squads).sort((a,b)=>a.code.localeCompare(b.code));
  return [currentSquad()].filter(Boolean);
}
function monthLabelFromId(id){
  if(!id)return '—';
  const [y,m]=String(id).split('-').map(Number);
  return `${MONTHS_PT[(m||1)-1]} ${y}`;
}
function indicatorMonthIds(squads=indicatorScopeSquads()){
  const set=new Set();
  squads.forEach(s=>Object.keys(s?.months||{}).forEach(id=>set.add(id)));
  return [...set].sort();
}
function indicatorRangeIds(monthIds){
  if(!monthIds.length){state.indicatorStartId=null;state.indicatorEndId=null;return [];}
  if(!state.indicatorEndId||!monthIds.includes(state.indicatorEndId)) state.indicatorEndId=monthIds[monthIds.length-1];
  if(!state.indicatorStartId||!monthIds.includes(state.indicatorStartId)) state.indicatorStartId=monthIds[Math.max(0,monthIds.length-3)]||monthIds[0];
  let startIndex=monthIds.indexOf(state.indicatorStartId), endIndex=monthIds.indexOf(state.indicatorEndId);
  if(startIndex===-1) startIndex=0;
  if(endIndex===-1) endIndex=monthIds.length-1;
  if(startIndex>endIndex){startIndex=endIndex;state.indicatorStartId=monthIds[startIndex];}
  return monthIds.slice(startIndex,endIndex+1);
}
function fillIndicatorSelect(el,monthIds,selected){
  if(!el)return;
  el.innerHTML=monthIds.map(id=>`<option value="${id}" ${id===selected?'selected':''}>${escapeHtml(monthLabelFromId(id))}</option>`).join('');
  el.disabled=!monthIds.length;
}
function renderIndicators(){
  if(!isSuperAdmin()||!$('#view-indicators'))return;
  const squads=indicatorScopeSquads(), monthIds=indicatorMonthIds(squads), rangeIds=indicatorRangeIds(monthIds);
  fillIndicatorSelect($('#indicatorStartMonth'),monthIds,state.indicatorStartId);
  fillIndicatorSelect($('#indicatorEndMonth'),monthIds,state.indicatorEndId);
  $('#indicatorScopeTitle').textContent=state.squadCode==='all'?'Todos os Squads':`Squad ${state.squadCode}`;
  $('#indicatorScopeText').textContent=state.squadCode==='all'?'Comparativo consolidado entre todos os grupos disponíveis.':`Leitura executiva aprofundada do Squad ${state.squadCode}.`;
  $('#indicatorPeriodLabel').textContent=rangeIds.length?`${monthLabelFromId(rangeIds[0])} até ${monthLabelFromId(rangeIds[rangeIds.length-1])}`:'Sem dados importados';
  renderIndicatorSquadOverview(rangeIds);
  renderIndicatorOrgDailyComparison(rangeIds);
  if(!rangeIds.length){
    ['indicatorStatusChart','indicatorMonthlyChart','indicatorWeeklyChart','indicatorHistoryAttChart','indicatorHistoryDailyAvgChart','indicatorHistoryEvalChart'].forEach(id=>{if($('#'+id))$('#'+id).innerHTML='<div class="chart-empty">Importe dados para liberar os indicadores.</div>';});
    if($('#indicatorInsights'))$('#indicatorInsights').innerHTML='<div class="insight-item"><strong>Sem dados</strong><small>Importe pelo menos um mês para exibir a análise executiva.</small></div>';
    if($('#indicatorFinanceRanking'))$('#indicatorFinanceRanking').innerHTML='<div class="chart-empty">Sem valores financeiros no período.</div>';
    ['indicatorAttPerHour','indicatorAboveRatio','indicatorExcellence'].forEach(id=>{if($('#'+id))$('#'+id).textContent='0';});
    if($('#indicatorAttPerMinute'))$('#indicatorAttPerMinute').textContent='0 por minuto';
    if($('#indicatorWorkedHours'))$('#indicatorWorkedHours').textContent='0 horas consideradas no período';
    if($('#indicatorAboveCount'))$('#indicatorAboveCount').textContent='0 acima • 0 abaixo';
    if($('#indicatorTechVolume'))$('#indicatorTechVolume').textContent='0 registros técnico-mês';
    if($('#indicatorPeriodStatus'))$('#indicatorPeriodStatus').textContent='—';
    if($('#indicatorPeriodStatusDetail'))$('#indicatorPeriodStatusDetail').textContent='0 meses acima • 0 abaixo';
    if($('#indicatorPeriodStatusSupport'))$('#indicatorPeriodStatusSupport').textContent='Sem dados no período selecionado';
    if($('#indicatorAvgPoints'))$('#indicatorAvgPoints').textContent='0 pts médios por técnico';
    if($('#indicatorExcellenceSupport'))$('#indicatorExcellenceSupport').textContent='Relação entre notas 5 e atendimentos';
    return;
  }

  const statusItems=[], monthlySeries=[], distinctTechs=new Set(), techTotals=new Map();
  let totalAtt=0,totalNotes5=0,totalPoints=0,totalEval=0,totalWorkedDays=0,totalTechRecords=0,totalAbove=0,totalBelow=0,squadMonthHits=0,squadMonthTotal=0;
  const palette=['var(--accent)','var(--success)','#78b7ff','#ef5a29','#b18cff'];

  squads.forEach((squad,sIndex)=>{
    const series={name:`Squad ${squad.code}`,values:[]};
    rangeIds.forEach(id=>{
      const m=squad.months?.[id]||null;
      if(!m){series.values.push(null);return;}
      const totals=m.teamTotals||deriveTotals(m.technicians);
      series.values.push(safe(totals.evalPct)*100);
      squadMonthTotal++;
      if(String(m.teamResult).toUpperCase()==='ACIMA') squadMonthHits++;
      totalAtt+=safe(totals.att);
      totalEval+=safe(totals.eval);
      totalPoints+=safe(totals.points);
      const monthAbove=(m.technicians||[]).filter(t=>String(t.status).toUpperCase()==='ACIMA').length;
      const monthBelow=(m.technicians||[]).filter(t=>String(t.status).toUpperCase()==='ABAIXO').length;
      totalAbove+=monthAbove; totalBelow+=monthBelow; totalTechRecords+=(m.technicians||[]).length;
      totalNotes5+=(m.technicians||[]).reduce((sum,t)=>sum+safe(t.notes5),0);
      (m.technicians||[]).forEach(t=>{
        distinctTechs.add(`${squad.code}|${normalizeName(t.name)}`);
        const key=`${squad.code}|${normalizeName(t.name)}`;
        const prev=techTotals.get(key)||{name:t.name,squad:squad.code,points:0,months:0,evalPct:0};
        prev.points+=safe(t.points); prev.months+=1; prev.evalPct+=safe(t.evalPct);
        techTotals.set(key,prev);
        totalWorkedDays += (t.daily||[]).filter(d=>d.day<=m.latestDay&&!d.off).length;
      });
    });
    if(series.values.some(v=>v!=null)) monthlySeries.push({...series,color:palette[sIndex%palette.length]});
  });

  rangeIds.forEach(id=>{
    let above=0,below=0;
    squads.forEach(s=>{
      const m=s.months?.[id]; if(!m)return;
      (m.technicians||[]).forEach(t=>{if(String(t.status).toUpperCase()==='ACIMA')above++; else if(String(t.status).toUpperCase()==='ABAIXO')below++;});
    });
    statusItems.push({label:monthLabelFromId(id),above,below});
  });

  const totalHours=totalWorkedDays*8, totalMinutes=totalHours*60;
  const attPerHour=totalHours?totalAtt/totalHours:0, attPerMinute=totalMinutes?totalAtt/totalMinutes:0;
  const aboveRatio=(totalAbove+totalBelow)?totalAbove/(totalAbove+totalBelow):0;
  const campaignHit=squadMonthTotal?squadMonthHits/squadMonthTotal:0;
  const excellence=totalAtt?totalNotes5/totalAtt:0;
  const avgPointsPerTech=totalTechRecords?totalPoints/totalTechRecords:0;
  $('#indicatorAttPerHour').textContent=fmtNum(attPerHour);
  $('#indicatorAttPerMinute').textContent=`${fmtNum(attPerMinute)} por minuto`;
  $('#indicatorWorkedHours').textContent=`${fmtInt(totalHours)} horas consideradas no período`;
  $('#indicatorAboveRatio').textContent=fmtPct(aboveRatio);
  $('#indicatorAboveCount').textContent=`${fmtInt(totalAbove)} acima • ${fmtInt(totalBelow)} abaixo`;
  $('#indicatorTechVolume').textContent=`${fmtInt(totalTechRecords)} registros técnico-mês`;
  const periodAbove=squadMonthHits, periodBelow=Math.max(0,squadMonthTotal-squadMonthHits);
  const periodStatus=periodAbove>periodBelow?'ACIMA':periodBelow>periodAbove?'ABAIXO':'EMPATE';
  $('#indicatorPeriodStatus').textContent=periodStatus;
  $('#indicatorPeriodStatus').className=periodStatus==='ACIMA'?'period-status-above':periodStatus==='ABAIXO'?'period-status-below':'period-status-tie';
  $('#indicatorPeriodStatusDetail').textContent=`${fmtInt(periodAbove)} ${state.squadCode==='all'?'leituras':'meses'} acima • ${fmtInt(periodBelow)} abaixo`;
  $('#indicatorPeriodStatusSupport').textContent=periodStatus==='EMPATE'?'Mesmo número de resultados ACIMA e ABAIXO no período.':`Predomínio de resultados ${periodStatus} no período selecionado.`;
  $('#indicatorExcellence').textContent=fmtPct(excellence);
  $('#indicatorAvgPoints').textContent=`${fmtNum(avgPointsPerTech)} pts médios por técnico`;
  $('#indicatorExcellenceSupport').textContent=`${fmtInt(distinctTechs.size)} técnicos únicos no período`;

  renderTechnicianStatusMatrix($('#indicatorStatusChart'),squads,rangeIds);
  renderIndicatorLineChart($('#indicatorMonthlyChart'),rangeIds.map(monthLabelFromId),monthlySeries,{maxValue:100,percent:true});
  $('#indicatorMonthlyLegend').textContent=monthlySeries.length>1?'Comparativo por Squad no período selecionado.':'Leitura mensal do grupo selecionado.';

  const weeklyMonthId=rangeIds[rangeIds.length-1];
  const weeklyLabels=['Sem 1','Sem 2','Sem 3','Sem 4','Sem 5'];
  const weeklySeries=[];
  squads.forEach((squad,sIndex)=>{
    const m=squad.months?.[weeklyMonthId]; if(!m)return;
    const buckets=Array.from({length:5},()=>({att:0,notes5:0}));
    (m.technicians||[]).forEach(t=>{
      (t.daily||[]).forEach(d=>{
        if(d.day>m.latestDay||d.off) return;
        const idx=Math.min(4,Math.floor((safe(d.day)-1)/7));
        buckets[idx].att+=safe(d.att); buckets[idx].notes5+=safe(d.notes5);
      });
    });
    weeklySeries.push({name:`Squad ${squad.code}`,values:buckets.map(b=>b.att?(b.notes5/b.att)*100:0),color:palette[sIndex%palette.length]});
  });
  renderIndicatorLineChart($('#indicatorWeeklyChart'),weeklyLabels,weeklySeries,{maxValue:100,percent:true});
  $('#indicatorWeeklyNote').textContent=`Referência semanal: ${monthLabelFromId(weeklyMonthId)} • proxy operacional usando notas 5 / atendimentos.`;

  const techList=[...techTotals.values()];
  const bestTech=techList.sort((a,b)=>(b.points/Math.max(1,b.months))-(a.points/Math.max(1,a.months)))[0];
  let bestSquad={code:'—',score:-1};
  squads.forEach(s=>{
    const values=rangeIds.map(id=>s.months?.[id]).filter(Boolean).map(m=>safe((m.teamTotals||deriveTotals(m.technicians)).evalPct));
    const avg=values.length?values.reduce((sum,v)=>sum+v,0)/values.length:0;
    if(avg>bestSquad.score) bestSquad={code:s.code,score:avg};
  });
  const strongestMonth=[...statusItems].sort((a,b)=>(b.above-b.below)-(a.above-a.below))[0];
  const weakestMonth=[...statusItems].sort((a,b)=>(a.above-a.below)-(b.above-b.below))[0];
  $('#indicatorInsights').innerHTML=`
    <div class="insight-item"><strong>Squad destaque</strong><small>${bestSquad.code==='—'?'Sem base suficiente.':`Squad ${bestSquad.code} lidera em % médio de avaliação com ${fmtPct(bestSquad.score)} no período.`}</small></div>
    <div class="insight-item"><strong>Técnico com melhor média de pontos</strong><small>${bestTech?`${escapeHtml(titleWords(bestTech.name))} • Squad ${escapeHtml(bestTech.squad)} • ${fmtNum(bestTech.points/Math.max(1,bestTech.months))} pts/mês.`:'Sem dados suficientes para ranquear técnicos.'}</small></div>
    <div class="insight-item"><strong>Momento mais forte</strong><small>${strongestMonth?`${escapeHtml(strongestMonth.label)} registrou saldo positivo de ${fmtInt(strongestMonth.above-strongestMonth.below)} técnicos acima.`:'Sem dados suficientes.'}</small></div>
    <div class="insight-item"><strong>Ponto de atenção</strong><small>${weakestMonth?`${escapeHtml(weakestMonth.label)} apresentou o menor saldo, com ${fmtInt(Math.abs(weakestMonth.above-weakestMonth.below))} de diferença entre acima e abaixo.`:'Sem dados suficientes.'}</small></div>`;
  renderIndicatorFinanceRanking(squads,rangeIds);
  renderIndicatorHistoricalAnalytics(squads,rangeIds);
}


function renderIndicatorFinanceRanking(squads,rangeIds){
  const el=$('#indicatorFinanceRanking'),note=$('#indicatorFinanceRankingNote');if(!el)return;const map=new Map();
  (squads||[]).forEach(squad=>(rangeIds||[]).forEach(id=>{const m=squad.months?.[id];if(!m)return;(m.technicians||[]).forEach(t=>{const key=`${squad.code}|${nameLinkKey(t.name)}`,prev=map.get(key)||{name:t.name,squad:squad.code,amount:0,months:0};prev.amount+=safe(t.financeData?.final);prev.months+=1;map.set(key,prev)})}));
  const rows=[...map.values()].sort((a,b)=>safe(b.amount)-safe(a.amount)||String(a.name).localeCompare(String(b.name),'pt-BR'));
  if(note)note.textContent=rangeIds.length===1?`Valor oficial de ${monthLabelFromId(rangeIds[0])}`:`Soma dos valores oficiais no período • ${monthLabelFromId(rangeIds[0])} a ${monthLabelFromId(rangeIds[rangeIds.length-1])}`;
  el.innerHTML=rows.map((r,i)=>`<div class="finance-ranking-item"><span class="finance-ranking-pos">#${i+1}</span><div><strong>${escapeHtml(titleWords(r.name))}</strong><small>${state.squadCode==='all'?`Squad ${escapeHtml(r.squad)} • `:''}${r.months} competência(s)</small></div><b>${fmtMoney(r.amount)}</b></div>`).join('')||'<div class="chart-empty">Sem valores financeiros no período.</div>';
}


function buildOrgOverviewFromState(){
  const rows=[];
  Object.values(state.squads||{}).filter(Boolean).forEach(squad=>{
    Object.values(squad.months||{}).forEach(m=>{
      if(!m)return;
      const totals=m.teamTotals||deriveTotals(m.technicians||[]);
      rows.push({squadCode:squad.code,squadName:squad.name||`Squad ${squad.code}`,id:m.id||`${m.year}-${String(m.month).padStart(2,'0')}`,year:safe(m.year),month:safe(m.month),totalAtt:safe(totals.att),totalEval:safe(totals.eval),evalPct:safe(totals.evalPct),technicianCount:(m.technicians||[]).length});
    });
  });
  return rows.sort((a,b)=>String(a.id).localeCompare(String(b.id))||String(a.squadCode).localeCompare(String(b.squadCode)));
}
function orgOverviewRows(){
  if((window.APP_CONFIG?.mode||'demo')==='demo'||isSuperAdmin())return buildOrgOverviewFromState();
  return (state.orgOverview||[]).length?state.orgOverview:buildOrgOverviewFromState();
}
function buildOrgTechnicianOverviewFromState(){
  const rows=[];
  Object.values(state.squads||{}).filter(Boolean).forEach(squad=>{
    Object.values(squad.months||{}).forEach(m=>{
      (m.technicians||[]).forEach(t=>rows.push({
        squadCode:squad.code,squadName:squad.name,id:m.id,year:m.year,month:m.month,
        technicianName:t.name,att:safe(t.att),totalEval:safe(t.totalEval),avg:safe(t.avg),
        evalPct:safe(t.evalPct),points:safe(t.points),status:String(t.status||'').toUpperCase()
      }));
    });
  });
  return rows.sort((a,b)=>String(a.id).localeCompare(String(b.id))||String(a.squadCode).localeCompare(String(b.squadCode))||String(a.technicianName).localeCompare(String(b.technicianName),'pt-BR'));
}
function orgTechnicianRows(){
  if((window.APP_CONFIG?.mode||'demo')==='demo')return buildOrgTechnicianOverviewFromState();
  return (state.orgTechnicianOverview||[]).length?state.orgTechnicianOverview:buildOrgTechnicianOverviewFromState();
}
function orgTechnicianMonthIds(rows=orgTechnicianRows(),limit=12){
  const ids=[...new Set((rows||[]).map(r=>r.id).filter(Boolean))].sort();
  return limit&&ids.length>limit?ids.slice(-limit):ids;
}
function orgOverviewMonthIds(rows=orgOverviewRows(),limit=12){
  const ids=[...new Set((rows||[]).map(r=>r.id).filter(Boolean))].sort();
  return limit&&ids.length>limit?ids.slice(-limit):ids;
}
function buildOrgSquadSeries(ids,rows=orgOverviewRows()){
  const palette=['#f0a33a','#36c98f','#46a4ff','#d879ff','#ef5a29','#46d7d0','#f2c14e','#ff6d92'];
  const codes=[...new Set((rows||[]).map(r=>r.squadCode).filter(Boolean))].sort();
  const attendance=codes.map((code,i)=>({name:`Squad ${code}`,color:palette[i%palette.length],values:ids.map(id=>{const r=rows.find(x=>x.id===id&&x.squadCode===code);return r?safe(r.totalAtt):null})}));
  const evaluation=codes.map((code,i)=>({name:`Squad ${code}`,color:palette[i%palette.length],values:ids.map(id=>{const r=rows.find(x=>x.id===id&&x.squadCode===code);return r?safe(r.evalPct)*100:null})}));
  return{codes,attendance,evaluation};
}
function buildOrgDailyOverviewFromState(){
  const rows=[];
  Object.values(state.squads||{}).filter(Boolean).forEach(squad=>{
    Object.values(squad.months||{}).forEach(m=>{
      if(!m)return;
      const maxDay=Math.max(1,safe(m.latestDay));
      const byDay=new Map();
      (m.technicians||[]).forEach(t=>{
        (t.daily||[]).forEach(d=>{
          if(safe(d.day)>maxDay||d.off)return;
          byDay.set(safe(d.day),(byDay.get(safe(d.day))||0)+safe(d.att));
        });
      });
      [...byDay.entries()].forEach(([day,totalAtt])=>rows.push({squadCode:squad.code,id:m.id,year:safe(m.year),month:safe(m.month),day:safe(day),totalAtt:safe(totalAtt)}));
    });
  });
  return rows.sort((a,b)=>String(a.id).localeCompare(String(b.id))||safe(a.day)-safe(b.day)||String(a.squadCode).localeCompare(String(b.squadCode)));
}
function orgDailyRows(){
  if((window.APP_CONFIG?.mode||'demo')==='demo'||isSuperAdmin())return buildOrgDailyOverviewFromState();
  return (state.orgDailyOverview||[]).length?state.orgDailyOverview:buildOrgDailyOverviewFromState();
}
function aggregateOrgDaily(rows,ids){
  const allowed=new Set((ids||[]).filter(Boolean)),totals=new Map();
  (rows||[]).forEach(r=>{
    if(!allowed.has(r.id))return;
    const key=`${r.id}|${safe(r.day)}`;
    totals.set(key,(totals.get(key)||0)+safe(r.totalAtt));
  });
  return totals;
}
function buildOrgDailyComparison(monthId,periodIds){
  const rows=orgDailyRows();
  if(!monthId)return{labels:[],series:[],average:0,days:0};
  const monthTotals=aggregateOrgDaily(rows,[monthId]);
  const monthDays=[...monthTotals.entries()].filter(([key])=>key.startsWith(monthId+'|')).map(([key,value])=>({day:safe(key.split('|')[1]),value:safe(value)})).sort((a,b)=>a.day-b.day);
  const periodTotals=aggregateOrgDaily(rows,(periodIds||[]).length?periodIds:[monthId]);
  const periodValues=[...periodTotals.values()].map(safe);
  const average=periodValues.length?periodValues.reduce((sum,v)=>sum+v,0)/periodValues.length:0;
  const labels=monthDays.map(x=>String(x.day).padStart(2,'0'));
  return{labels,series:[
    {name:'Atendimentos diários do setor',color:'var(--accent)',values:monthDays.map(x=>x.value)},
    {name:'Média diária do período',color:'var(--accent2)',dashed:true,values:monthDays.map(()=>average)}
  ],average,days:periodValues.length};
}
function renderTeamOrgDailyComparison(){
  const el=$('#teamOrgDailyChart');if(!el)return;
  const monthId=state.currentId||currentMonth()?.id;
  const data=buildOrgDailyComparison(monthId,[monthId]);
  if($('#teamOrgDailyNote'))$('#teamOrgDailyNote').textContent=monthId?`${monthLabelFromId(monthId)} • média ${fmtNum(data.average)} atend./dia • A+B+D+E`:'Sem mês selecionado';
  renderIndicatorLineChart(el,data.labels,data.series,{maxValue:null,percent:false,decimals:0,height:390});
}
function renderIndicatorOrgDailyComparison(rangeIds){
  const el=$('#indicatorOrgDailyChart');if(!el)return;
  const ids=[...(rangeIds||[])];
  const monthId=ids.length?ids[ids.length-1]:null;
  const data=buildOrgDailyComparison(monthId,ids);
  if($('#indicatorOrgDailyNote'))$('#indicatorOrgDailyNote').textContent=monthId?`${monthLabelFromId(monthId)} x média de ${ids.length} ${ids.length===1?'mês':'meses'} • ${fmtNum(data.average)} atend./dia`:'Sem período selecionado';
  renderIndicatorLineChart(el,data.labels,data.series,{maxValue:null,percent:false,decimals:0,height:390});
}
function renderTeamSquadOverview(){
  if(!$('#teamSquadAttendanceChart'))return;
  const rows=orgOverviewRows(),ids=orgOverviewMonthIds(rows,12),series=buildOrgSquadSeries(ids,rows),labels=ids.map(shortHistoryMonth);
  $('#teamSectorPeriod').textContent=ids.length?`${shortHistoryMonth(ids[0])} → ${shortHistoryMonth(ids[ids.length-1])}`:'Sem histórico';
  renderIndicatorLineChart($('#teamSquadAttendanceChart'),labels,series.attendance,{maxValue:null,percent:false,decimals:0,height:390});
  renderIndicatorLineChart($('#teamSquadEvaluationChart'),labels,series.evaluation,{maxValue:null,percent:true,decimals:1,height:390});
}
function renderIndicatorSquadOverview(rangeIds){
  if(!$('#indicatorSquadAttendanceChart'))return;
  const rows=orgOverviewRows(),available=orgOverviewMonthIds(rows,0),ids=(rangeIds||[]).filter(id=>available.includes(id)),series=buildOrgSquadSeries(ids,rows),labels=ids.map(shortHistoryMonth);
  $('#indicatorSectorPeriod').textContent=ids.length?`${shortHistoryMonth(ids[0])} → ${shortHistoryMonth(ids[ids.length-1])}`:'Sem dados';
  renderIndicatorLineChart($('#indicatorSquadAttendanceChart'),labels,series.attendance,{maxValue:null,percent:false,decimals:0,height:390});
  renderIndicatorLineChart($('#indicatorSquadEvaluationChart'),labels,series.evaluation,{maxValue:null,percent:true,decimals:1,height:390});
}
function allTechnicianMetricConfig(metric=state.allTechniciansMetric){
  const configs={
    points:{label:'Pontuação',get:t=>safe(t.points),percent:false,maxValue:null,decimals:1,suffix:' pts'},
    att:{label:'Atendimentos',get:t=>safe(t.att),percent:false,maxValue:null,decimals:0,suffix:' atend.'},
    evalPct:{label:'% de avaliação',get:t=>safe(t.evalPct)*100,percent:true,maxValue:null,decimals:1,suffix:''},
    avg:{label:'Nota média',get:t=>safe(t.avg),percent:false,maxValue:5,decimals:2,suffix:''}
  };
  return configs[metric]||configs.points;
}
function allTechnicianSeries(rangeIds,metric=state.allTechniciansMetric){
  const cfg=allTechnicianMetricConfig(metric),map=new Map(),rows=orgTechnicianRows();
  const getValue=r=>metric==='points'?safe(r.points):metric==='att'?safe(r.att):metric==='evalPct'?safe(r.evalPct)*100:safe(r.avg);
  (rows||[]).filter(r=>(rangeIds||[]).includes(r.id)).forEach(r=>{
    const key=`${r.squadCode}|${nameLinkKey(r.technicianName)}`;
    if(!map.has(key))map.set(key,{key,squad:r.squadCode,name:titleWords(r.technicianName),values:new Map()});
    map.get(key).values.set(r.id,getValue(r));
  });
  const list=[...map.values()].sort((a,b)=>a.squad.localeCompare(b.squad)||a.name.localeCompare(b.name,'pt-BR'));
  const color=i=>`hsl(${Math.round((i*137.508)%360)} 78% 64%)`;
  return list.map((e,i)=>({name:`Squad ${e.squad} • ${e.name}`,color:color(i),values:(rangeIds||[]).map(id=>e.values.has(id)?e.values.get(id):null)}));
}
function currentIndicatorRangeForFullscreen(source='team'){
  const ids=orgTechnicianMonthIds(orgTechnicianRows(),0);
  if(!ids.length)return [];
  if(source==='indicator'&&isSuperAdmin()){
    const start=state.indicatorStartId&&ids.includes(state.indicatorStartId)?ids.indexOf(state.indicatorStartId):Math.max(0,ids.length-12);
    const end=state.indicatorEndId&&ids.includes(state.indicatorEndId)?ids.indexOf(state.indicatorEndId):ids.length-1;
    return ids.slice(Math.min(start,end),Math.max(start,end)+1);
  }
  return ids.slice(-12);
}
function openAllTechniciansChart(source='team'){
  const rangeIds=currentIndicatorRangeForFullscreen(source);
  if(!rangeIds.length){toast('Não há dados de técnicos disponíveis para o período.');return;}
  state.allTechniciansRangeIds=[...rangeIds];
  state.allTechniciansMetric=$('#allTechniciansMetric')?.value||state.allTechniciansMetric||'points';
  openModal('allTechniciansModal');
  // Renderiza depois que o modal estiver visível para usar toda a largura real da tela.
  requestAnimationFrame(()=>requestAnimationFrame(()=>renderAllTechniciansFullscreenChart(rangeIds)));
}
function renderAllTechniciansFullscreenChart(explicitRange=null){
  if(!$('#allTechniciansFullscreenChart'))return;
  const rangeIds=(explicitRange&&explicitRange.length)?explicitRange:(state.allTechniciansRangeIds?.length?state.allTechniciansRangeIds:currentIndicatorRangeForFullscreen('team'));
  const cfg=allTechnicianMetricConfig(state.allTechniciansMetric),series=allTechnicianSeries(rangeIds,state.allTechniciansMetric),labels=rangeIds.map(shortHistoryMonth);
  $('#allTechniciansMetric').value=state.allTechniciansMetric;
  $('#allTechniciansPeriod').textContent=rangeIds.length?`${shortHistoryMonth(rangeIds[0])} → ${shortHistoryMonth(rangeIds[rangeIds.length-1])}`:'Sem período';
  $('#allTechniciansSubtitle').textContent=`${cfg.label} mensal de todos os técnicos dos Squads A, B, D e E. Cada linha representa um técnico.`;
  $('#allTechniciansCount').textContent=`${series.length} ${series.length===1?'técnico':'técnicos'} • ${rangeIds.length} ${rangeIds.length===1?'mês':'meses'}`;
  const viewportHeight=Math.max(620,Math.min(790,(window.innerHeight||900)-235));
  renderIndicatorLineChart($('#allTechniciansFullscreenChart'),labels,series,{maxValue:cfg.maxValue,percent:cfg.percent,decimals:cfg.decimals,height:viewportHeight,fitWidth:true,emphasis:true});
}

function shortHistoryMonth(id){
  if(!id)return '—';
  const [year,month]=String(id).split('-').map(Number);
  const short=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'][Math.max(0,(month||1)-1)];
  return `${short}/${String(year).slice(-2)}`;
}
function historyMonthIdsForSquad(squad,limit=12){
  const ids=Object.keys(squad?.months||{}).sort();
  return limit&&ids.length>limit?ids.slice(-limit):ids;
}
function historyTechKey(t){return `n:${nameLinkKey(t?.name)}`}
function historyBusinessDays(m){
  if(!m)return 0;
  const latest=Math.max(1,Math.min(safe(m.latestDay)||new Date(m.year,m.month,0).getDate(),new Date(m.year,m.month,0).getDate()));
  return businessDaysElapsed(m.year,m.month,latest);
}
function buildTechnicianHistory(squad,ids){
  const techMap=new Map();
  ids.forEach(id=>{
    const m=squad?.months?.[id];if(!m)return;
    (m.technicians||[]).forEach(t=>{
      const key=historyTechKey(t);if(!techMap.has(key))techMap.set(key,{key,name:t.name,userId:t.userId||null});
    });
  });
  const entities=[...techMap.values()].sort((a,b)=>String(a.name).localeCompare(String(b.name),'pt-BR'));
  const totals=[];
  const attendance=entities.map((e,i)=>({name:titleWords(e.name),color:HISTORY_COLORS[i%HISTORY_COLORS.length],values:[]}));
  const daily=entities.map((e,i)=>({name:titleWords(e.name),color:HISTORY_COLORS[i%HISTORY_COLORS.length],values:[]}));
  const evaluation=entities.map((e,i)=>({name:titleWords(e.name),color:HISTORY_COLORS[i%HISTORY_COLORS.length],values:[]}));
  ids.forEach(id=>{
    const m=squad?.months?.[id];
    totals.push(m?safe((m.teamTotals||deriveTotals(m.technicians)).att):0);
    const days=m?Math.max(1,historyBusinessDays(m)):1;
    entities.forEach((e,idx)=>{
      const t=(m?.technicians||[]).find(x=>historyTechKey(x)===e.key);
      attendance[idx].values.push(t?safe(t.att):null);
      daily[idx].values.push(t?safe(t.att)/days:null);
      evaluation[idx].values.push(t?safe(t.evalPct)*100:null);
    });
  });
  const squadDaily={name:'Média Squad',color:'var(--accent2)',dashed:true,values:ids.map(id=>{const m=squad?.months?.[id];if(!m)return null;const totals=m.teamTotals||deriveTotals(m.technicians),days=Math.max(1,historyBusinessDays(m)),count=Math.max(1,(m.technicians||[]).length);return safe(totals.att)/(days*count)})};
  const squadEval={name:'Total geral',color:'var(--accent2)',dashed:true,values:ids.map(id=>{const m=squad?.months?.[id];return m?safe((m.teamTotals||deriveTotals(m.technicians)).evalPct)*100:null})};
  daily.unshift(squadDaily);evaluation.unshift(squadEval);
  return{ids,labels:ids.map(shortHistoryMonth),totals,attendance,daily,evaluation,entityCount:entities.length};
}
function buildSquadHistory(squads,ids){
  const active=(squads||[]).filter(Boolean).sort((a,b)=>a.code.localeCompare(b.code));
  const totals=ids.map(id=>active.reduce((sum,s)=>sum+safe((s.months?.[id]?.teamTotals||deriveTotals(s.months?.[id]?.technicians||[])).att),0));
  const attendance=active.map((s,i)=>({name:`Squad ${s.code}`,color:HISTORY_COLORS[i%HISTORY_COLORS.length],values:ids.map(id=>{const m=s.months?.[id];return m?safe((m.teamTotals||deriveTotals(m.technicians)).att):null})}));
  const daily=active.map((s,i)=>({name:`Squad ${s.code}`,color:HISTORY_COLORS[i%HISTORY_COLORS.length],values:ids.map(id=>{const m=s.months?.[id];if(!m)return null;const techCount=Math.max(1,(m.technicians||[]).length),days=Math.max(1,historyBusinessDays(m));return safe((m.teamTotals||deriveTotals(m.technicians)).att)/(techCount*days)})}));
  const evaluation=active.map((s,i)=>({name:`Squad ${s.code}`,color:HISTORY_COLORS[i%HISTORY_COLORS.length],values:ids.map(id=>{const m=s.months?.[id];return m?safe((m.teamTotals||deriveTotals(m.technicians)).evalPct)*100:null})}));
  daily.unshift({name:'Média geral',color:'var(--accent2)',dashed:true,values:ids.map(id=>{let att=0,exposure=0;active.forEach(s=>{const m=s.months?.[id];if(!m)return;att+=safe((m.teamTotals||deriveTotals(m.technicians)).att);exposure+=Math.max(1,historyBusinessDays(m))*Math.max(1,(m.technicians||[]).length)});return exposure?att/exposure:null})});
  evaluation.unshift({name:'Total geral',color:'var(--accent2)',dashed:true,values:ids.map(id=>{let att=0,evals=0;active.forEach(s=>{const m=s.months?.[id];if(!m)return;const t=m.teamTotals||deriveTotals(m.technicians);att+=safe(t.att);evals+=safe(t.eval)});return att?(evals/att)*100:null})});
  return{ids,labels:ids.map(shortHistoryMonth),totals,attendance,daily,evaluation,entityCount:active.length};
}
function renderTeamHistoricalAnalytics(squad){
  if(!squad||!$('#teamHistoryAttChart'))return;
  const ids=historyMonthIdsForSquad(squad,12),data=buildTechnicianHistory(squad,ids);
  $('#teamHistoryPeriod').textContent=ids.length?`${shortHistoryMonth(ids[0])} → ${shortHistoryMonth(ids[ids.length-1])}`:'Sem histórico';
  $('#teamHistorySubtitle').textContent=ids.length>1?`${ids.length} meses importados • ${data.entityCount} técnicos encontrados no histórico.`:'Importe outros meses para formar a comparação histórica.';
  renderHistoryAttendanceChart($('#teamHistoryAttChart'),data.labels,data.totals,data.attendance);
  renderIndicatorLineChart($('#teamHistoryDailyAvgChart'),data.labels,data.daily,{maxValue:null,percent:false,decimals:1});
  renderIndicatorLineChart($('#teamHistoryEvalChart'),data.labels,data.evaluation,{maxValue:null,percent:true});
}
function renderIndicatorHistoricalAnalytics(squads,rangeIds){
  if(!$('#indicatorHistoryAttChart'))return;
  const ids=[...(rangeIds||[])];
  const specific=state.squadCode!=='all'&&squads.length===1;
  const data=specific?buildTechnicianHistory(squads[0],ids):buildSquadHistory(squads,ids);
  $('#indicatorHistoryTitle').textContent=specific?`Histórico dos técnicos do Squad ${state.squadCode}`:'Histórico comparativo dos Squads';
  $('#indicatorHistorySubtitle').textContent=specific?'As linhas representam cada técnico do Squad dentro do período filtrado.':'No escopo geral, as linhas representam cada Squad para manter a leitura clara.';
  $('#indicatorHistoryPeriod').textContent=ids.length?`${shortHistoryMonth(ids[0])} → ${shortHistoryMonth(ids[ids.length-1])}`:'Sem histórico';
  $('#indicatorHistoryAttTitle').textContent=specific?'Total de atendimentos por técnico / mês':'Total de atendimentos por Squad / mês';
  $('#indicatorHistoryDailyTitle').textContent=specific?'Média de atendimentos por técnico / dia útil':'Média de atendimentos por técnico / dia útil e Squad';
  $('#indicatorHistoryEvalTitle').textContent=specific?'% de avaliação por técnico':'% de avaliação por Squad';
  $('#indicatorHistoryAttNote').textContent=specific?'Barras = total do Squad • linhas = técnicos':'Barras = total geral • linhas = Squads';
  renderHistoryAttendanceChart($('#indicatorHistoryAttChart'),data.labels,data.totals,data.attendance);
  renderIndicatorLineChart($('#indicatorHistoryDailyAvgChart'),data.labels,data.daily,{maxValue:null,percent:false,decimals:1});
  renderIndicatorLineChart($('#indicatorHistoryEvalChart'),data.labels,data.evaluation,{maxValue:null,percent:true});
}
function ensureChartTooltip(el){
  if(!el)return null;
  let tip=el.querySelector('.chart-hover-tooltip');
  if(!tip){tip=document.createElement('div');tip.className='chart-hover-tooltip';tip.setAttribute('role','tooltip');tip.setAttribute('aria-hidden','true');el.appendChild(tip);}
  return tip;
}
function positionChartTooltip(el,tip,e){
  const r=el.getBoundingClientRect();
  const gap=18,px=e.clientX-r.left,py=e.clientY-r.top;
  const tw=tip.offsetWidth||300,th=tip.offsetHeight||120;
  let x=px+gap,y=py+gap;
  if(x+tw>r.width-10)x=px-tw-gap;
  if(y+th>r.height-10)y=py-th-gap;
  tip.style.left=Math.max(10,Math.min(x,Math.max(10,r.width-tw-10)))+'px';
  tip.style.top=Math.max(10,Math.min(y,Math.max(10,r.height-th-10)))+'px';
}
function chartValueText(value,{percent=false,decimals=0,suffix=''}={}){
  const n=safe(value);
  if(percent)return `${n.toLocaleString('pt-BR',{minimumFractionDigits:decimals?1:0,maximumFractionDigits:Math.max(1,decimals||1)})}%`;
  return `${n.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:decimals})}${suffix||''}`;
}
function sharedTooltipHtml(label,entries){
  const valid=(entries||[]).filter(x=>x&&x.value!=null&&!Number.isNaN(Number(x.value))).sort((a,b)=>safe(b.value)-safe(a.value)||String(a.name).localeCompare(String(b.name),'pt-BR'));
  const dense=valid.length>10?' dense':'';
  return `<div class="chart-tooltip-head"><strong>${escapeHtml(label||'')}</strong><span>${valid.length} ${valid.length===1?'série':'séries'}</span></div><div class="chart-tooltip-list${dense}">${valid.map((x,i)=>`<div class="chart-tooltip-row${i===0&&valid.length>1?' leader':''}"><i style="background:${x.color||'var(--accent)'}"></i><span>${escapeHtml(x.name)}</span><strong>${escapeHtml(x.text)}</strong></div>`).join('')}</div>`;
}
function setChartRulerState(el,index,show=true){
  el.querySelectorAll('[data-ruler-index]').forEach(n=>n.classList.toggle('is-active',show&&Number(n.dataset.rulerIndex)===Number(index)));
  el.querySelectorAll('[data-point-index]').forEach(n=>n.classList.toggle('is-active',show&&Number(n.dataset.pointIndex)===Number(index)));
}
function focusChartSeries(el,index=null,locked=false){
  const has=index!=null&&index!=='';
  el.classList.toggle('has-series-focus',has);
  el.dataset.lockedSeries=locked&&has?String(index):'';
  el.querySelectorAll('[data-series-index]').forEach(n=>{
    const same=has&&String(n.dataset.seriesIndex)===String(index);
    n.classList.toggle('is-focused',same);
    n.classList.toggle('is-muted',has&&!same);
    if(n.classList.contains('chart-legend-item'))n.setAttribute('aria-pressed',same&&locked?'true':'false');
  });
}
function bindInteractiveLegend(el){
  if(!el)return;
  const items=[...el.querySelectorAll('.chart-legend-item[data-series-index]')];
  items.forEach(item=>{
    const idx=item.dataset.seriesIndex;
    item.addEventListener('pointerenter',()=>{if(!el.dataset.lockedSeries)focusChartSeries(el,idx,false)});
    item.addEventListener('pointerleave',()=>{if(!el.dataset.lockedSeries)focusChartSeries(el,null,false)});
    item.addEventListener('click',()=>{const locked=el.dataset.lockedSeries===String(idx);focusChartSeries(el,locked?null:idx,!locked)});
    item.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();item.click()}});
  });
}
function bindSharedChartTooltip(el,model){
  if(!el)return;
  const tip=ensureChartTooltip(el),zones=[...el.querySelectorAll('[data-chart-index]')];
  const show=(node,e)=>{
    const index=Number(node.dataset.chartIndex),label=model.labels?.[index]||'';
    const entries=(model.entriesForIndex?.(index)||[]).filter(Boolean);
    tip.innerHTML=sharedTooltipHtml(label,entries);tip.classList.add('show','shared');tip.setAttribute('aria-hidden','false');
    setChartRulerState(el,index,true);positionChartTooltip(el,tip,e);
  };
  zones.forEach(node=>{
    node.addEventListener('pointerenter',e=>show(node,e));
    node.addEventListener('pointermove',e=>show(node,e));
    node.addEventListener('pointerleave',()=>{tip.classList.remove('show','shared');tip.setAttribute('aria-hidden','true');setChartRulerState(el,-1,false)});
  });
  bindInteractiveLegend(el);
}
function bindChartTooltips(el){
  if(!el)return;
  const tip=ensureChartTooltip(el),targets=[...el.querySelectorAll('[data-chart-tip]')];
  targets.forEach(node=>{
    node.addEventListener('pointerenter',e=>{tip.textContent=node.dataset.chartTip||'';tip.classList.add('show');tip.setAttribute('aria-hidden','false');positionChartTooltip(el,tip,e)});
    node.addEventListener('pointermove',e=>positionChartTooltip(el,tip,e));
    node.addEventListener('pointerleave',()=>{tip.classList.remove('show');tip.setAttribute('aria-hidden','true')});
  });
}
function renderHistoryAttendanceChart(el,labels,totals,series){
  if(!el)return;
  const validSeries=(series||[]).filter(s=>(s.values||[]).some(v=>v!=null));
  if(!labels?.length||!validSeries.length){el.innerHTML='<div class="chart-empty">Importe pelo menos um mês com técnicos vinculados para visualizar o histórico.</div>';return;}
  el.classList.add('interactive-chart','history-interactive-chart','chart-modern');
  const w=Math.max(940,labels.length*136),h=360,p={l:58,r:68,t:34,b:60};
  const lineVals=validSeries.flatMap(s=>s.values).filter(v=>v!=null).map(v=>safe(v));
  const lineTop=Math.max(1,...lineVals)*1.12,totalTop=Math.max(1,...(totals||[]).map(safe))*1.12;
  const slot=(w-p.l-p.r)/Math.max(1,labels.length),barW=Math.min(58,slot*.48);
  const x=i=>p.l+slot*(i+.5), yLine=v=>p.t+(h-p.t-p.b)-(safe(v)/lineTop)*(h-p.t-p.b), yTotal=v=>p.t+(h-p.t-p.b)-(safe(v)/totalTop)*(h-p.t-p.b);
  const leftGrid=[0,.25,.5,.75,1].map(f=>{const yy=p.t+(1-f)*(h-p.t-p.b),lv=lineTop*f,rv=totalTop*f;return `<line x1="${p.l}" y1="${yy}" x2="${w-p.r}" y2="${yy}" class="grid-line"/><text x="6" y="${yy+4}" class="axis-label">${fmtInt(lv)}</text><text x="${w-6}" y="${yy+4}" class="axis-label-right">${fmtInt(rv)}</text>`}).join('');
  const bars=(totals||[]).map((v,i)=>{const yy=yTotal(v),height=(h-p.b)-yy;return `<rect x="${x(i)-barW/2}" y="${yy}" width="${barW}" height="${height}" rx="9" class="history-total-bar chart-series-shape" opacity=".58"></rect><text x="${x(i)}" y="${Math.max(p.t+10,yy-8)}" text-anchor="middle" class="history-total-label">${fmtInt(v)}</text>`}).join('');
  const paths=validSeries.map((s,si)=>{
    const segs=[];let cur=[];
    (s.values||[]).forEach((v,i)=>{if(v==null){if(cur.length>1)segs.push(cur);cur=[];return}cur.push(`${x(i)},${yLine(v)}`)});if(cur.length>1)segs.push(cur);
    const lines=segs.map(seg=>`<polyline points="${seg.join(' ')}" fill="none" stroke="${s.color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" class="chart-series-shape" data-series-index="${si}"></polyline>`).join('');
    const dots=(s.values||[]).map((v,i)=>v==null?'':`<circle cx="${x(i)}" cy="${yLine(v)}" r="3.9" fill="${s.color}" class="chart-point chart-series-shape" data-series-index="${si}" data-point-index="${i}"></circle>`).join('');
    return lines+dots;
  }).join('');
  const rulers=labels.map((_,i)=>`<line x1="${x(i)}" y1="${p.t}" x2="${x(i)}" y2="${h-p.b}" class="chart-ruler" data-ruler-index="${i}"></line>`).join('');
  const zones=labels.map((_,i)=>`<rect x="${p.l+slot*i}" y="${p.t}" width="${slot}" height="${h-p.t-p.b}" class="chart-hover-zone" data-chart-index="${i}"></rect>`).join('');
  const xLabels=labels.map((label,i)=>`<text x="${x(i)}" y="${h-16}" text-anchor="middle" class="axis-label history-x-label">${escapeHtml(label)}</text>`).join('');
  const legend=`<div class="chart-legend-inline chart-legend-visible chart-legend-interactive"><span class="chart-legend-total"><i class="legend-swatch history-total-bar"></i>Total geral</span>${validSeries.map((s,si)=>`<button type="button" class="chart-legend-item" data-series-index="${si}" aria-pressed="false" title="Passe o mouse para destacar; clique para fixar"><i class="legend-swatch" style="background:${s.color}"></i>${escapeHtml(s.name)}</button>`).join('')}</div>`;
  el.innerHTML=`<div class="chart-plot-scroll"><svg viewBox="0 0 ${w} ${h}" style="width:100%;height:${h}px" preserveAspectRatio="none">${leftGrid}${bars}${paths}${rulers}${zones}${xLabels}<text x="${p.l}" y="18" class="history-axis-title">Técnico / grupo</text><text x="${w-p.r}" y="18" text-anchor="end" class="history-axis-title">Total geral</text></svg></div>${legend}`;
  bindSharedChartTooltip(el,{labels,entriesForIndex:i=>[{name:'Total geral',value:totals?.[i],text:`${fmtInt(totals?.[i])} atendimentos`,color:'var(--muted)'},...validSeries.map(s=>s.values?.[i]==null?null:{name:s.name,value:s.values[i],text:`${fmtInt(s.values[i])} atendimentos`,color:s.color})]});
}

function buildStatusMatrix(squads,rangeIds){
  const map=new Map();
  const multi=(squads||[]).length>1;
  (squads||[]).forEach(squad=>{
    (rangeIds||[]).forEach(id=>{
      const m=squad?.months?.[id];if(!m)return;
      (m.technicians||[]).forEach(t=>{
        const key=`${squad.code}|${historyTechKey(t)}`;
        if(!map.has(key))map.set(key,{key,name:titleWords(t.name),squad:squad.code,statuses:{}});
        map.get(key).statuses[id]=String(t.status||'').toUpperCase();
      });
    });
  });
  return [...map.values()].sort((a,b)=>a.squad.localeCompare(b.squad)||a.name.localeCompare(b.name,'pt-BR')).map(x=>({...x,label:multi?`Squad ${x.squad} • ${x.name}`:x.name}));
}
function renderTechnicianStatusMatrix(el,squads,rangeIds){
  if(!el)return;
  const rows=buildStatusMatrix(squads,rangeIds);
  if(!rows.length){el.innerHTML='<div class="chart-empty">Sem técnicos no período selecionado.</div>';return;}
  const months=(rangeIds||[]).map(id=>({id,label:shortHistoryMonth(id)}));
  const head=`<div class="status-matrix-head"><div class="status-tech-name">Técnico</div>${months.map(m=>`<div>${escapeHtml(m.label)}</div>`).join('')}<div>Resumo</div></div>`;
  const body=rows.map(r=>{
    let above=0,below=0;
    const cells=months.map(m=>{const st=r.statuses[m.id]||'';if(st==='ACIMA')above++;if(st==='ABAIXO')below++;const cls=st==='ACIMA'?'above':st==='ABAIXO'?'below':'empty';const tip=`${r.label} • ${monthLabelFromId(m.id)}: ${st||'sem dados'}`;return `<div class="status-cell ${cls} chart-hover-target" data-chart-tip="${escapeHtml(tip)}"><span>${st==='ACIMA'?'A':st==='ABAIXO'?'B':'—'}</span></div>`}).join('');
    const summary=above===below?'EMPATE':above>below?'ACIMA':'ABAIXO';
    return `<div class="status-matrix-row"><div class="status-tech-name"><strong>${escapeHtml(r.label)}</strong></div>${cells}<div class="status-summary ${summary==='ACIMA'?'above':summary==='ABAIXO'?'below':'tie'}">${summary}<small>${above}A • ${below}B</small></div></div>`;
  }).join('');
  el.innerHTML=`<div class="status-matrix-scroll"><div class="status-matrix" style="--status-cols:${months.length}">${head}${body}</div></div>`;
  bindChartTooltips(el);
}

function renderIndicatorLineChart(el,labels,series,{maxValue=null,percent=false,decimals=0,height=340,fitWidth=false,emphasis=false}={}){
  if(!el)return;
  const validSeries=(series||[]).filter(s=>(s.values||[]).some(v=>v!=null));
  if(!validSeries.length){el.innerHTML='<div class="chart-empty">Sem dados para este recorte.</div>';return;}
  el.classList.add('interactive-chart','chart-modern');
  const containerWidth=fitWidth?Math.max(0,Math.floor(el.clientWidth||el.getBoundingClientRect?.().width||0)-18):0;
  const w=Math.max(900,(labels?.length||0)*124,containerWidth),h=Math.max(300,safe(height)||340),p=emphasis?{l:70,r:40,t:36,b:72}:{l:56,r:30,t:32,b:60};
  const vals=validSeries.flatMap(s=>s.values).filter(v=>v!=null).map(v=>safe(v));
  const rawTop=Math.max(1,...vals),top=maxValue??(percent?Math.max(10,Math.ceil(rawTop/10)*10):rawTop*1.1);
  const x=i=>p.l+(labels.length<=1?0:i*(w-p.l-p.r)/(labels.length-1)),y=v=>p.t+(h-p.t-p.b)-(safe(v)/top)*(h-p.t-p.b);
  const grid=[0,.25,.5,.75,1].map(f=>{const yy=p.t+(1-f)*(h-p.t-p.b),v=top*f,label=percent?`${v.toLocaleString('pt-BR',{maximumFractionDigits:0})}%`:v.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:decimals});return `<line x1="${p.l}" y1="${yy}" x2="${w-p.r}" y2="${yy}" class="grid-line"/><text x="8" y="${yy+4}" class="axis-label">${label}</text>`}).join('');
  const tickStep=labels.length>24?Math.ceil(labels.length/7):labels.length>16?Math.ceil(labels.length/8):labels.length>12?2:1;
  const xLabels=labels.map((label,i)=>{if(i!==0&&i!==labels.length-1&&i%tickStep!==0)return'';const raw=String(label||''),shown=raw.includes('/')?raw:raw.split(' ')[0].slice(0,3);return `<text x="${x(i)}" y="${h-17}" text-anchor="middle" class="axis-label history-x-label">${escapeHtml(shown)}</text>`}).join('');
  const paths=validSeries.map((s,si)=>{
    const segs=[];let cur=[];
    (s.values||[]).forEach((v,i)=>{if(v==null){if(cur.length>1)segs.push(cur);cur=[];return}cur.push(`${x(i)},${y(v)}`)});if(cur.length>1)segs.push(cur);
    const dash=s.dashed?' stroke-dasharray="7 7"':'',lineWidth=emphasis?(s.dashed?2.5:2.9):(s.dashed?2.1:2.55),pointRadius=emphasis?4.6:3.8;
    const segments=segs.map(seg=>`<polyline points="${seg.join(' ')}" fill="none" stroke="${s.color||'var(--accent)'}" stroke-width="${lineWidth}" stroke-linecap="round" stroke-linejoin="round"${dash} class="chart-series-shape" data-series-index="${si}"></polyline>`).join('');
    const dots=(s.values||[]).map((v,i)=>v==null?'':`<circle cx="${x(i)}" cy="${y(v)}" r="${pointRadius}" fill="${s.color||'var(--accent)'}" class="chart-point chart-series-shape" data-series-index="${si}" data-point-index="${i}"></circle>`).join('');
    return segments+dots;
  }).join('');
  const rulers=(labels||[]).map((_,i)=>`<line x1="${x(i)}" y1="${p.t}" x2="${x(i)}" y2="${h-p.b}" class="chart-ruler" data-ruler-index="${i}"></line>`).join('');
  const plotWidth=Math.max(1,w-p.l-p.r),zoneWidth=labels.length<=1?plotWidth:plotWidth/(labels.length-1);
  const zones=(labels||[]).map((_,i)=>{const zx=labels.length<=1?p.l:Math.max(p.l,x(i)-zoneWidth/2),zw=labels.length<=1?plotWidth:(i===0||i===labels.length-1?zoneWidth/2:zoneWidth);return `<rect x="${zx}" y="${p.t}" width="${zw}" height="${h-p.t-p.b}" class="chart-hover-zone" data-chart-index="${i}"></rect>`}).join('');
  const legend=`<div class="chart-legend-inline chart-legend-visible chart-legend-interactive">${validSeries.map((s,si)=>`<button type="button" class="chart-legend-item" data-series-index="${si}" aria-pressed="false" title="Passe o mouse para destacar; clique para fixar"><i class="legend-swatch${s.dashed?' dashed':''}" style="background:${s.color||'var(--accent)'}"></i>${escapeHtml(s.name)}</button>`).join('')}</div>`;
  el.classList.toggle('chart-emphasis',!!emphasis);
  el.innerHTML=`<div class="chart-plot-scroll"><svg viewBox="0 0 ${w} ${h}" style="width:100%;height:${h}px" preserveAspectRatio="none">${grid}${paths}${rulers}${zones}${xLabels}</svg></div>${legend}`;
  bindSharedChartTooltip(el,{labels,entriesForIndex:i=>validSeries.map(s=>s.values?.[i]==null?null:{name:s.name,value:s.values[i],text:chartValueText(s.values[i],{percent,decimals}),color:s.color||'var(--accent)'})});
}


  function renderProfile(){
    if(!state.user||!$('#view-profile'))return;
    const u=state.user,role=roleLabel(u.role),scope=u.role==='super_admin'?'Todos os Squads':(u.squadCode?`Squad ${u.squadCode}`:'Sem Squad');
    const initial=String(u.fullName||u.email||'U').charAt(0).toUpperCase();
    $('#profileAvatar').textContent=initial;
    $('#profileName').textContent=u.fullName||'Usuário';
    $('#profileEmail').textContent=u.email||'E-mail não informado';
    $('#profileRole').textContent=role;
    $('#profileScope').textContent=scope;
    $('#profileFullName').textContent=u.fullName||'—';
    $('#profileAccountEmail').textContent=u.email||'—';
    $('#profileAccountRole').textContent=role;
    $('#profileAccountSquad').textContent=scope;
    $('#profileTechRow').classList.toggle('hidden',u.role!=='technician');
    $('#profileAccountTech').textContent=u.techName?titleWords(u.techName):'—';
  }
  async function handleProfilePasswordChange(e){
    e.preventDefault();if(!state.user)return;
    const current=$('#profileCurrentPassword').value,newPassword=$('#profileNewPassword').value,confirm=$('#profileConfirmPassword').value,msg=$('#profilePasswordMessage'),btn=$('#profilePasswordSubmit');
    msg.className='profile-form-message';msg.textContent='';
    if(!current){msg.textContent='Informe sua senha atual.';return;}
    if(String(newPassword).length<8){msg.textContent='A nova senha precisa ter pelo menos 8 caracteres.';return;}
    if(newPassword!==confirm){msg.textContent='A confirmação da nova senha não confere.';return;}
    if(newPassword===current){msg.textContent='A nova senha precisa ser diferente da senha atual.';return;}
    btn.disabled=true;btn.textContent='Atualizando...';
    try{
      if(state.supabase){
        const {error:reauthError}=await state.supabase.auth.signInWithPassword({email:state.user.email,password:current});
        if(reauthError)throw reauthError;
        const {error:updateError}=await state.supabase.auth.updateUser({password:newPassword});
        if(updateError)throw updateError;
      }else{
        updateCurrentDemoPassword(current,newPassword);
      }
      $('#profilePasswordForm').reset();
      msg.className='profile-form-message success';msg.textContent='Senha atualizada com sucesso. Use a nova senha no próximo login.';
      toast('Sua senha foi atualizada com sucesso.');
    }catch(err){
      console.error(err);msg.className='profile-form-message error';msg.textContent=humanProfilePasswordError(err);
    }finally{btn.disabled=false;btn.textContent='Atualizar minha senha';}
  }
  function updateCurrentDemoPassword(currentPassword,newPassword){
    const email=String(state.user?.email||'').toLowerCase(),u=findDemoUser(email);
    if(!u||String(u.password)!==String(currentPassword))throw new Error('Senha atual incorreta.');
    const list=loadDemoCreatedUsers().filter(x=>String(x.email||'').toLowerCase()!==email);
    list.push({...u,email:u.email||email,password:newPassword,userId:u.userId||`demo-profile-${Date.now()}`});
    saveDemoCreatedUsers(list);state.user.password=newPassword;
  }
  function humanProfilePasswordError(err){
    const m=String(err?.message||err||'');
    if(/invalid login|invalid.*credential/i.test(m))return'Senha atual incorreta.';
    if(/same password|different from the old|different.*password/i.test(m))return'A nova senha precisa ser diferente da senha atual.';
    if(/password.*(least|characters|short)/i.test(m))return'A nova senha não atende aos requisitos de segurança. Use pelo menos 8 caracteres.';
    if(/rate limit/i.test(m))return'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.';
    return m||'Não foi possível alterar a senha.';
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
    if(!list.length){$('#userRows').innerHTML='<tr><td colspan="6"><div class="users-empty">Nenhum usuário encontrado neste filtro.</div></td></tr>';return}
    $('#userRows').innerHTML=list.sort((a,b)=>String(a.fullName).localeCompare(String(b.fullName),'pt-BR')).map(u=>{const manageable=canManageDirectoryUser(u),deletable=canDeleteDirectoryUser(u),canToggle=manageable&&u.role!=='super_admin';return `<tr><td><div class="user-cell"><span class="user-avatar table-avatar">${escapeHtml((u.fullName||'U').charAt(0).toUpperCase())}</span><div><strong>${escapeHtml(u.fullName||'Sem nome')}</strong><small>${escapeHtml(u.email||'E-mail não informado')}</small></div></div></td><td><span class="role-pill ${u.role}">${escapeHtml(roleLabel(u.role))}</span></td><td>${u.squadCode?`Squad ${escapeHtml(u.squadCode)}`:'Todos'}</td><td>${escapeHtml(u.techName||'—')}</td><td><span class="status-dot ${u.active?'on':'off'}"></span>${u.active?'Ativo':'Inativo'}</td><td><div class="user-actions"><button class="table-action" data-edit-user="${escapeHtml(u.userId)}" ${manageable?'':'disabled'}>Editar</button><button class="table-action ${u.active?'warning':'success'}" data-toggle-user="${escapeHtml(u.userId)}" ${canToggle?'':'disabled'}>${u.active?'Inativar':'Reativar'}</button><button class="table-action danger" data-delete-user="${escapeHtml(u.userId)}" ${deletable?'':'disabled'}>Excluir</button></div></td></tr>`}).join('');
    $$('[data-edit-user]').forEach(b=>b.addEventListener('click',()=>openEditUser(b.dataset.editUser)));
    $$('[data-toggle-user]').forEach(b=>b.addEventListener('click',()=>toggleUserActive(b.dataset.toggleUser)));
    $$('[data-delete-user]').forEach(b=>b.addEventListener('click',()=>deleteUser(b.dataset.deleteUser)));
  }
  function directoryUserById(userId){return (state.userDirectory||[]).find(u=>String(u.userId)===String(userId))||null}
  function canManageDirectoryUser(u){
    if(!u||!isAdmin())return false;
    if(String(u.userId)===String(state.user?.userId))return false;
    if(isSuperAdmin())return true;
    return u.role==='technician'&&u.squadCode===state.user.squadCode;
  }
  function canDeleteDirectoryUser(u){
    if(!canManageDirectoryUser(u))return false;
    if(u.role==='super_admin')return false;
    return isSuperAdmin()||(u.role==='technician'&&u.squadCode===state.user.squadCode);
  }
  function openEditUser(userId){
    const u=directoryUserById(userId);if(!canManageDirectoryUser(u))return;
    $('#editUserError').textContent='';$('#editUserId').value=u.userId;$('#editUserName').value=u.fullName||'';$('#editUserEmail').value=u.email||'';
    const roleSel=$('#editUserRole'),squadSel=$('#editUserSquad');
    if(isSuperAdmin()) roleSel.innerHTML='<option value="technician">Técnico</option><option value="squad_admin">Admin do Squad</option><option value="super_admin">Admin geral</option>';
    else roleSel.innerHTML='<option value="technician">Técnico</option>';
    roleSel.value=u.role;
    const allowed=isSuperAdmin()?Object.values(state.squads):[state.squads[state.user.squadCode]].filter(Boolean);
    squadSel.innerHTML='<option value="">Sem Squad</option>'+allowed.sort((a,b)=>a.code.localeCompare(b.code)).map(s=>`<option value="${escapeHtml(s.code)}">Squad ${escapeHtml(s.code)}</option>`).join('');
    squadSel.value=u.squadCode||'';squadSel.dataset.originalSquad=u.squadCode||'';$('#editUserTechName').value=u.techName||'';
    const now=new Date(),year=now.getFullYear(),month=now.getMonth()+1;$('#editUserEffectiveMonth').value=`${year}-${String(month).padStart(2,'0')}`;
    syncEditUserFields();openModal('editUserModal');
  }
  function syncEditUserFields(){
    const role=$('#editUserRole').value,isSuper=role==='super_admin';
    $('#editUserSquad').disabled=isSuper||!isSuperAdmin();if(isSuper)$('#editUserSquad').value='';
    $('#editTechnicianNameField').classList.toggle('hidden',role!=='technician');$('#editUserTechName').required=role==='technician';
    if(!isSuperAdmin()){$('#editUserRole').disabled=true;$('#editUserSquad').disabled=true;}else $('#editUserRole').disabled=false;
    const moved=isSuperAdmin()&&role==='technician'&&$('#editUserSquad').value&&$('#editUserSquad').value!==($('#editUserSquad').dataset.originalSquad||'');
    $('#editMovementPeriodField')?.classList.toggle('hidden',!moved);$('#editUserEffectiveMonth').required=moved;
  }
  async function handleEditUser(e){
    e.preventDefault();const u=directoryUserById($('#editUserId').value);if(!canManageDirectoryUser(u))return;
    const btn=$('#editUserSubmit');btn.disabled=true;btn.textContent='Salvando...';$('#editUserError').textContent='';
    try{
      const role=isSuperAdmin()?$('#editUserRole').value:u.role,squadCode=role==='super_admin'?null:(isSuperAdmin()?$('#editUserSquad').value:u.squadCode),techName=role==='technician'?normalizeName($('#editUserTechName').value):null;
      const period=$('#editUserEffectiveMonth').value||'',parts=period.split('-').map(Number);
      const payload={userId:u.userId,fullName:$('#editUserName').value.trim(),role,squadCode,techName,effectiveYear:parts[0]||null,effectiveMonth:parts[1]||null};
      if(!payload.fullName)throw new Error('Informe o nome completo.');if(role!=='super_admin'&&!state.squads[squadCode])throw new Error('Selecione um Squad válido.');if(role==='technician'&&!techName)throw new Error('Informe o nome do técnico como aparece no CSV.');
      if(state.supabase)await manageSupabaseUser('update',payload);else updateDemoUser({...payload,active:u.active});
      state.userDirectoryLoaded=false;await loadUserDirectory();renderUserRows();closeModal('editUserModal');toast(`Usuário ${payload.fullName} atualizado${u.squadCode!==squadCode?` e movimentado para o Squad ${squadCode}`:''}.`);
    }catch(err){console.error(err);$('#editUserError').textContent=humanManageUserError(err)}finally{btn.disabled=false;btn.textContent='Salvar alterações'}
  }
  async function toggleUserActive(userId){
    const u=directoryUserById(userId);if(!canManageDirectoryUser(u)||u.role==='super_admin')return;const next=!u.active;
    if(!await confirmDialog(`${next?'Reativar':'Inativar'} o acesso de ${u.fullName}? ${next?'O login será liberado novamente.':'O login será bloqueado, mas todo o histórico será preservado.'}`,{title:next?'Reativar usuário':'Inativar usuário',confirmText:next?'Reativar':'Inativar',tone:next?'success':'warning'}))return;
    try{if(state.supabase)await manageSupabaseUser('set_active',{userId:u.userId,active:next});else updateDemoUser({...u,userId:u.userId,active:next});state.userDirectoryLoaded=false;await loadUserDirectory();renderUserRows();toast(`${u.fullName} ${next?'reativado':'inativado'} com sucesso.`)}catch(err){console.error(err);toast(humanManageUserError(err))}
  }
  async function deleteUser(userId){
    const u=directoryUserById(userId);if(!canDeleteDirectoryUser(u))return;
    if(!await confirmDialog(`Excluir o acesso de ${u.fullName}? O login será removido. O histórico mensal já importado continuará preservado, porém sem vínculo com este usuário.`,{title:'Excluir usuário',confirmText:'Excluir',tone:'danger'}))return;
    try{if(state.supabase)await manageSupabaseUser('delete',{userId:u.userId});else deleteDemoUser(u);state.userDirectoryLoaded=false;await loadUserDirectory();renderUserRows();toast(`Usuário ${u.fullName} excluído.`)}catch(err){console.error(err);toast(humanManageUserError(err))}
  }
  async function manageSupabaseUser(action,payload){
    const body={action,user_id:payload.userId,full_name:payload.fullName,role:payload.role,squad_code:payload.squadCode,technician_name:payload.techName,active:payload.active,effective_year:payload.effectiveYear,effective_month:payload.effectiveMonth};
    const {data,error}=await state.supabase.functions.invoke('manage-user',{body});if(error)throw await edgeFunctionErrorMessage(error);if(data?.error)throw new Error(data.error);return data
  }
  function updateDemoUser(p){
    const list=loadDemoCreatedUsers(),i=list.findIndex(x=>String(x.userId)===String(p.userId));if(i>=0){list[i]={...list[i],fullName:p.fullName,role:p.role,squadCode:p.squadCode,techName:p.techName,active:p.active};saveDemoCreatedUsers(list);return}
    throw new Error('Usuários de demonstração padrão não são editáveis. Crie um usuário demo para testar esta função.');
  }
  function deleteDemoUser(u){const list=loadDemoCreatedUsers(),next=list.filter(x=>String(x.userId)!==String(u.userId));if(next.length===list.length)throw new Error('Usuários de demonstração padrão não podem ser excluídos.');saveDemoCreatedUsers(next)}
  function humanManageUserError(err){const m=String(err?.message||err||'');if(/function|failed to fetch|non-2xx/i.test(m))return'Falha no servidor. Confira se a Edge Function manage-user V2.19.0 foi publicada.';if(/self|próprio|proprio/i.test(m))return'Não é permitido alterar, inativar ou excluir o próprio acesso por esta tela.';if(/movimenta.*futur|competência.*futur/i.test(m))return'A movimentação deve começar no mês atual ou em uma competência anterior.';return m||'Não foi possível concluir a operação.'}

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
      const payload={fullName:$('#newUserName').value.trim(),email:$('#newUserEmail').value.trim().toLowerCase(),password:$('#newUserPassword').value,role,squadCode:role==='super_admin'?null:$('#newUserSquad').value,techName:role==='technician'?normalizeName($('#newUserTechName').value):null};
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
  async function edgeFunctionErrorMessage(error){
    let message=String(error?.message||'').trim();
    const response=error?.context;
    try{
      if(response&&typeof response.clone==='function'){
        const copy=response.clone();
        const contentType=String(copy.headers?.get?.('content-type')||'').toLowerCase();
        if(contentType.includes('application/json')){
          const payload=await copy.json();
          message=String(payload?.error||payload?.message||message).trim();
        }else{
          const text=String(await copy.text()).trim();
          if(text)message=text;
        }
      }
    }catch(parseError){console.warn('Não foi possível ler o detalhe da Edge Function.',parseError)}
    const err=new Error(message||'Falha ao executar a função do servidor.');
    err.httpStatus=response?.status||null;
    return err;
  }
  async function createSupabaseUser(p){
    const body={full_name:p.fullName,email:p.email,password:p.password,role:p.role,squad_code:p.squadCode,technician_name:p.techName};
    // Renova a sessão imediatamente antes da ação administrativa. Isso evita que um token
    // antigo/expirado seja enviado para a Edge Function após muitas horas com o painel aberto.
    let session=null;
    try{
      const refreshed=await state.supabase.auth.refreshSession();
      if(!refreshed.error)session=refreshed.data?.session||null;
    }catch(refreshError){console.warn('Refresh de sessão não concluído antes de criar usuário.',refreshError)}
    if(!session){
      const current=await state.supabase.auth.getSession();
      if(current.error)throw current.error;
      session=current.data?.session||null;
    }
    if(!session?.access_token)throw new Error('Sua sessão administrativa expirou. Entre novamente no sistema e tente criar o usuário.');
    const {data,error}=await state.supabase.functions.invoke('create-user',{body,headers:{Authorization:`Bearer ${session.access_token}`}});
    if(error)throw await edgeFunctionErrorMessage(error);
    if(data?.error)throw new Error(data.error);
    return data;
  }
  function humanCreateUserError(err){
    const m=String(err?.message||err||'').trim();
    if(/já está cadastrad.*Squad|edite o usuário existente/i.test(m))return m;if(/already|registered|duplicate|unique|já existe/i.test(m))return'Já existe um usuário com este e-mail. Consulte a listagem e edite o cadastro existente; se não aparecer, confira Authentication > Users.';
    if(/sess[aã]o|jwt|token|unauthorized/i.test(m))return'Sua sessão administrativa expirou ou não foi aceita pelo servidor. Saia, entre novamente e tente de novo.';
    if(/perfil administrador não encontrado/i.test(m))return'Seu login existe, mas o perfil administrativo não foi localizado no banco. Confira a tabela profiles para o seu usuário.';
    if(/sem permissão/i.test(m))return'Seu perfil atual não tem permissão para criar esse tipo de usuário.';
    if(/squad inválido|fora da organização/i.test(m))return'O Squad selecionado não foi localizado para esta organização.';
    if(/configuração do servidor incompleta|service.role|service_role/i.test(m))return'A Edge Function create-user está sem a configuração de servidor necessária. Republique a função no projeto correto do Supabase.';
    if(/function not found|404|failed to fetch/i.test(m))return'A Edge Function create-user não foi encontrada. Republique a função create-user no Supabase.';
    if(/non-2xx|edge function/i.test(m))return`A Edge Function create-user respondeu com erro${err?.httpStatus?` HTTP ${err.httpStatus}`:''}. Abra Supabase > Edge Functions > create-user > Logs para ver o motivo.`;
    return m||'Não foi possível criar o usuário.';
  }

  function renderAdmin(){
    if(!isAdmin())return;
    const specific=state.squadCode!=='all',m=currentMonth(),canImport=specific||isSuperAdmin(),locked=!!m?.isClosed;
    $('#adminScopeTitle').textContent=specific?`Squad ${state.squadCode}`:'Todos os Squads';
    $('#adminScopeText').textContent=specific
      ? (locked?`${m.monthName} ${m.year} está FECHADO. Dados, metas e pontuação histórica estão protegidos. Reabra o mês para alterar.`:'Importação, métricas, metas e tema abaixo afetam somente este Squad.')
      :'Admin geral pode importar o CSV para todos os Squads de uma vez. Para métricas, metas, fechamento/exclusão de mês ou tema, selecione um Squad específico.';
    $('#adminImportBtn').disabled=!canImport;
    const disableForScope=['#adminThemeBtn','#importThemeBtn','#exportThemeBtn'];
    disableForScope.forEach(sel=>{if($(sel))$(sel).disabled=!specific});
    ['#saveGoalsBtn','#autoGoalBtn','#saveMonthlyMetricsBtn','#saveScoreSettingsBtn','#copyPreviousGoalsBtn','#saveFinanceBtn','#saveFinanceTechniciansBtn','#copyFinanceRulesBtn','#exportFinanceExcelBtn','#exportFinancePdfBtn'].forEach(sel=>{if($(sel))$(sel).disabled=!specific||!m||(locked&&['#saveFinanceBtn','#saveFinanceTechniciansBtn','#copyFinanceRulesBtn'].includes(sel))});
    renderFinanceAdmin(m,specific,locked);
    if(!specific||!m){
      $('#monthHistory').innerHTML=specific?'<div class="muted">Nenhum mês importado neste Squad.</div>':'<div class="muted">Selecione um Squad específico para ver o histórico.</div>';
      $('#teamGoalAttInput').value='';$('#teamGoalPctInput').value='';$('#autoGoalHint').textContent=m?'':'Importe um mês para configurar as metas.';
      $('#teamGoalAttInput').disabled=true;$('#teamGoalPctInput').disabled=true;
      ['scoreRefAtt','scoreRefEval','scoreRefAvg','scoreRefPct'].forEach(id=>{if($('#'+id)){$('#'+id).value='';$('#'+id).disabled=true}});if($('#scoreAutoHint'))$('#scoreAutoHint').textContent='Importe um mês para calcular as referências automáticas.';
      $('#monthlyMetricsRows').innerHTML='<tr><td colspan="10" class="muted">Importe um mês para preencher as métricas individuais.</td></tr>';
      $('#monthlyMetricsHint').textContent='Importe um mês para preencher as métricas.';
      updateThemeName();return;
    }
    const ids=Object.keys(currentMonths()).sort().reverse(),latestId=ids[0]||null,cfg=teamSettings(m);
    $('#monthHistory').innerHTML=ids.map(id=>{const mm=currentMonths()[id],closed=!!mm.isClosed,closedInfo=closed&&mm.closedAt?` • fechado em ${formatDateTime(mm.closedAt)}`:'';return `<div class="history-row ${closed?'month-closed':''}"><div><strong>${closed?'🔒 ':'🟢 '}${mm.monthName} ${mm.year}</strong><small>${escapeHtml(mm.sourceFile||'Banco de dados')} • ${mm.technicians.length} técnicos • até dia ${mm.latestDay}${closedInfo}</small></div><span class="tag ${closed?'closed':'open'}">${closed?'FECHADO':id===latestId?'EM ANDAMENTO':'ABERTO'}</span><button class="link-btn" data-open-month="${id}">Abrir</button>${closed?`<button class="link-btn" data-reopen-month="${id}">Reabrir</button>`:`<button class="link-btn" data-close-month="${id}">Fechar mês</button><button class="link-btn danger-link" data-delete-month="${id}">Excluir</button>`}</div>`}).join('');
    $$('[data-open-month]').forEach(b=>b.addEventListener('click',()=>{state.currentId=b.dataset.openMonth;chooseDefaultTech();refreshSelectors();render();showView('individual')}));
    $$('[data-delete-month]').forEach(b=>b.addEventListener('click',()=>deleteImportedMonth(b.dataset.deleteMonth)));
    $$('[data-close-month]').forEach(b=>b.addEventListener('click',()=>closeMonth(b.dataset.closeMonth)));
    $$('[data-reopen-month]').forEach(b=>b.addEventListener('click',()=>reopenMonth(b.dataset.reopenMonth)));
    $('#teamGoalAttInput').value=Math.round(cfg.teamGoalAtt);$('#teamGoalPctInput').value=(cfg.teamGoalEvalPct*100).toFixed(1);
    $('#teamGoalAttInput').disabled=locked;$('#teamGoalPctInput').disabled=locked;
    const useful=businessDaysMonFri(m.year,m.month),suggested=autoTeamAttGoal(m);$('#autoGoalHint').textContent=locked?'🔒 Mês fechado: metas preservadas como histórico.':`Sugestão: ${useful} dias úteis × 10 atendimentos × ${m.technicians.length} técnicos = ${fmtInt(suggested)} atendimentos.`;
    renderScoreSettings(m);renderMonthlyMetrics(m);updateThemeName();
  }

  function renderScoreSettings(m){
    const rules=displayScoreRules(m);
    $('#scoreRefAtt').value=safe(rules.refAtt).toFixed(0);$('#scoreRefEval').value=safe(rules.refTotalEval).toFixed(0);$('#scoreRefAvg').value=safe(rules.refAvg).toFixed(2);$('#scoreRefPct').value=(safe(rules.refEvalPct)*100).toFixed(2);
    ['scoreRefAtt','scoreRefEval','scoreRefAvg','scoreRefPct'].forEach(id=>$('#'+id).disabled=true);
    $('#scoreAutoHint').innerHTML=m?.isClosed?`🔒 <strong>Médias congeladas no fechamento:</strong> ${fmtNum(rules.refAtt)} atend. • ${fmtNum(rules.refTotalEval)} avaliações • nota ${safe(rules.refAvg).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})} • ${fmtPct(rules.refEvalPct)}.`:`<strong>Médias atuais do Squad:</strong> ${fmtNum(rules.refAtt)} atend. • ${fmtNum(rules.refTotalEval)} avaliações • nota ${safe(rules.refAvg).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})} • ${fmtPct(rules.refEvalPct)}. Estas referências são recalculadas a cada importação.`;
  }

  function renderMonthlyMetrics(m){
    const list=[...(m?.technicians||[])].sort((a,b)=>String(a.name).localeCompare(String(b.name),'pt-BR'));
    const locked=!!m.isClosed,disabled=locked?' disabled':'';
    $('#monthlyMetricsHint').textContent=locked?`${m.monthName} ${m.year} • 🔒 mês fechado: metas e pontuação estão congeladas.`:`${m.monthName} ${m.year} • ${list.length} técnicos • status usa as médias atuais do Squad.`;
    $('#monthlyMetricsRows').innerHTML=list.map(t=>`<tr data-metric-tech="${escapeHtml(t.name)}"><td>${escapeHtml(t.name)}</td><td>${fmtInt(t.att)}</td><td>${fmtInt(t.totalEval)}</td><td>${safe(t.avg).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}</td><td>${fmtPct(t.evalPct)}</td><td><input class="metric-input" data-field="goalAtt" type="number" min="0" step="1" value="${safe(t.goalAtt)}"${disabled}></td><td><input class="metric-input" data-field="goalEval" type="number" min="0" step="1" value="${safe(t.goalEval)}"${disabled}></td><td><span class="status ${String(t.status).toUpperCase()==='ACIMA'?'above':'below'}">${escapeHtml(t.status||'—')}</span><small class="metric-sub">${fmtInt(t.goalsHit)}/4 critérios</small></td><td><strong>${fmtNum(t.points)}</strong></td><td><strong>${fmtNum(cumulativePointsForTech(t))}</strong></td></tr>`).join('')||'<tr><td colspan="10" class="muted">Nenhum técnico encontrado.</td></tr>';
  }

  async function saveMonthlyMetrics(){
    if(!isAdmin()||!requireSpecificSquad())return;const m=currentMonth();if(!m)return;if(m.isClosed){toast('Este mês está fechado. Reabra-o antes de alterar metas ou bonificações.');return}const btn=$('#saveMonthlyMetricsBtn');btn.disabled=true;btn.textContent='Salvando...';
    try{
      for(const row of $$('#monthlyMetricsRows [data-metric-tech]')){
        const t=m.technicians.find(x=>samePersonName(x.name,row.dataset.metricTech));if(!t)continue;
        for(const input of $$('[data-field]',row))t[input.dataset.field]=safe(input.value);
      }
      recalculateMonth(m);saveDemoSquads();if(state.supabase)await persistManualMetrics(m);refreshSelectors();render();toast('Metas salvas. Pontuação recalculada automaticamente.');
    }catch(err){console.error(err);toast('Não foi possível salvar as métricas mensais.')}finally{btn.disabled=false;btn.textContent='Salvar metas'}
  }

  async function saveScoreSettings(){
    if(!isAdmin()||!requireSpecificSquad())return;const m=currentMonth();if(!m)return;if(m.isClosed){toast('Este mês está fechado. Reabra-o antes de alterar os parâmetros.');return}const btn=$('#saveScoreSettingsBtn');btn.disabled=true;btn.textContent='Recalculando...';
    try{
      m.scoreSettings={
        refAtt:optionalNumber($('#scoreRefAtt').value),
        refTotalEval:optionalNumber($('#scoreRefEval').value),
        refAvg:optionalNumber($('#scoreRefAvg').value),
        refEvalPct:optionalPercent($('#scoreRefPct').value),
        bonusAtt:20,bonusTotalEval:30,bonusAvg:40,bonusEvalPct:35
      };
      recalculateMonth(m);saveDemoSquads();
      if(state.supabase){
        const {error}=await state.supabase.from('squad_months').update({score_settings:m.scoreSettings,team_result:m.teamResult}).eq('id',m.dbId);if(error)throw error;
        await persistCalculatedScores(m);
      }
      render();toast('Parâmetros salvos. Pontuação, critérios, status e ranking recalculados.');
    }catch(err){console.error(err);toast('Não foi possível salvar os parâmetros de pontuação. Confira se as migrações V2.3.0 e V2.4.0 foram executadas.')}finally{btn.disabled=false;btn.textContent='Salvar parâmetros e recalcular'}
  }

  function optionalNumber(v){if(v==null||String(v).trim()==='')return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null}
  function optionalPercent(v){const n=optionalNumber(v);return n==null?null:n/100}
  function optionalValue(v){return v==null||v===''?'':String(v)}
  function meanOf(list,getter){return list.length?list.reduce((sum,x)=>sum+safe(getter(x)),0)/list.length:0}
  function truncate2(n){return Math.trunc((safe(n)+Number.EPSILON)*100)/100}
  function automaticScoreRefs(m){
    const list=(m?.technicians||[]).filter(t=>safe(t.att)>0);
    // Replica as referencias da planilha STATUS DO SQUAD:
    // B11 = ROUND(AVERAGE(...),0), I11 = ROUND(AVERAGE(...),0),
    // J11 = ROUNDDOWN(AVERAGE(...),2), K11 = ROUND(AVERAGE(...),4).
    return{
      refAtt:roundTo(meanOf(list,t=>t.att),0),
      refTotalEval:roundTo(meanOf(list,t=>t.totalEval),0),
      refAvg:truncate2(meanOf(list,t=>t.avg)),
      refEvalPct:roundTo(meanOf(list,t=>t.evalPct),4)
    };
  }
  function businessDaysElapsed(y,m,latest){let c=0,limit=Math.min(Math.max(0,safe(latest)),new Date(y,m,0).getDate());for(let d=1;d<=limit;d++){const dow=new Date(y,m-1,d).getDay();if(dow>=1&&dow<=5)c++}return c}
  function scoreRules(m,options={}){
    const auto=automaticScoreRefs(m),saved=m?.scoreSettings||{},totalDays=Math.max(1,businessDaysMonFri(m.year,m.month)),elapsedDays=Math.min(totalDays,businessDaysElapsed(m.year,m.month,m.latestDay));
    return{refAtt:auto.refAtt,refTotalEval:auto.refTotalEval,refAvg:auto.refAvg,refEvalPct:auto.refEvalPct,baseRefAtt:auto.refAtt,baseRefTotalEval:auto.refTotalEval,bonusAtt:safe(saved.bonusAtt)||20,bonusTotalEval:safe(saved.bonusTotalEval)||30,bonusAvg:safe(saved.bonusAvg)||40,bonusEvalPct:safe(saved.bonusEvalPct)||35,manualCount:0,progress:1,elapsedDays,totalDays,attSource:'Média do Squad arredondada (0 casas)',evalSource:'Média do Squad arredondada (0 casas)',avgSource:'Média do Squad truncada (2 casas)',pctSource:'Média do Squad arredondada (4 casas)'};
  }
  function displayScoreRules(m){
    if(m?.isClosed&&m.closedSnapshot?.scoreRules){const r=m.closedSnapshot.scoreRules;return{...r,progress:1,elapsedDays:businessDaysMonFri(m.year,m.month),totalDays:businessDaysMonFri(m.year,m.month),attSource:'Referência congelada no fechamento',evalSource:'Referência congelada no fechamento',avgSource:'Referência congelada no fechamento',pctSource:'Referência congelada no fechamento'}}
    return scoreRules(m);
  }
  function calculateScore(t,rules){
    if(safe(t.att)<=0)return{points:0,goalsHit:0,status:''};
    const hits=[safe(t.att)>=rules.refAtt,safe(t.totalEval)>=rules.refTotalEval,safe(t.avg)>=rules.refAvg,safe(t.evalPct)>=rules.refEvalPct];
    const weights=[rules.bonusAtt,rules.bonusTotalEval,rules.bonusAvg,rules.bonusEvalPct];
    const adjustments=hits.reduce((sum,ok,i)=>sum+(ok?weights[i]:-weights[i]),0);
    const points=Number((safe(t.att)*safe(t.avg)+adjustments).toFixed(2));
    const goalsHit=hits.filter(Boolean).length;
    return{points,goalsHit,status:goalsHit>=2?'ACIMA':'ABAIXO'};
  }
  function teamStatusFromPoints(m){
    const list=(m?.technicians||[]).filter(t=>safe(t.att)>0&&Number.isFinite(Number(t.points)));
    if(!list.length)return{status:'',avgPoints:0,aboveCount:0,count:0,ratio:0};
    const avgPoints=meanOf(list,t=>t.points),aboveCount=list.filter(t=>safe(t.points)>avgPoints).length,ratio=aboveCount/list.length;
    return{status:ratio>=.5?'ACIMA':'ABAIXO',avgPoints,aboveCount,count:list.length,ratio};
  }
  function cumulativePointsForTech(t,squad=currentSquad()){
    if(!squad)return safe(t?.points);let total=0;
    const latestId=Object.keys(squad.months||{}).sort().reverse()[0]||null;
    for(const m of Object.values(squad.months||{})){
      if(!m.isClosed&&m.id!==latestId)continue;
      const match=(m.technicians||[]).find(x=>(t?.userId&&x.userId&&x.userId===t.userId)||samePersonName(x.name,t?.name));if(match)total+=safe(match.points)
    }
    return Number(total.toFixed(2));
  }

  function recalculateMonth(m,options={}){
    for(const t of m.technicians||[]){
      t.totalEval=safe(t.notes5)+safe(t.notes4)+safe(t.notes3)+safe(t.notes2)+safe(t.notes1);
      const rawAvg=t.totalEval?((safe(t.notes5)*5+safe(t.notes4)*4+safe(t.notes3)*3+safe(t.notes2)*2+safe(t.notes1))/t.totalEval):0;
      t.avg=truncate2(rawAvg);
      t.evalPct=safe(t.att)?roundTo(t.totalEval/safe(t.att),4):0;
    }
    if(m.isClosed&&Array.isArray(m.closedSnapshot?.technicians)){
      const snap=new Map(m.closedSnapshot.technicians.map(x=>[nameLinkKey(x.name),x]));
      for(const t of m.technicians||[]){const s=snap.get(nameLinkKey(t.name));if(!s)continue;['att','notes5','notes4','notes3','notes2','notes1','totalEval','avg','evalPct','goalAtt','goalEval','points','goalsHit'].forEach(k=>{if(s[k]!=null)t[k]=safe(s[k])});t.status=s.status||'';t.rank=safe(s.rank)||null;t.financeManualBonus=safe(s.financeManualBonus);t.salesCommission=safe(s.salesCommission);t.vacation=!!s.vacation;t.excludeFromGroupCount=!!s.excludeFromGroupCount;t.financeData=s.financeData?clone(s.financeData):(t.financeData||{});}
      if(m.closedSnapshot.financeSettings)m.financeSettings=clone(m.closedSnapshot.financeSettings);if(m.closedSnapshot.financeMonthData)m.financeMonthData=clone(m.closedSnapshot.financeMonthData);
      if(m.closedSnapshot.financeModel)m.financeModel=m.closedSnapshot.financeModel;else if(safe(m.closedSnapshot.version)<3)m.financeModel='individual';
      if(typeof m.closedSnapshot.financeCompare==='boolean')m.financeCompare=m.closedSnapshot.financeCompare;if(typeof m.closedSnapshot.financeTechCompare==='boolean')m.financeTechCompare=m.closedSnapshot.financeTechCompare;if(Number.isFinite(Number(m.closedSnapshot.financeIndividualCap)))m.financeIndividualCap=safe(m.closedSnapshot.financeIndividualCap);if(m.closedSnapshot.financeComparison)m.financeComparison=clone(m.closedSnapshot.financeComparison);
      m.teamTotals=deriveTotals(m.technicians);m.teamResult=m.closedSnapshot.teamResult||m.teamResult||'—';return;
    }
    const rules=scoreRules(m,{final:!!options.final});
    for(const t of m.technicians||[]){const scored=calculateScore(t,rules);t.points=scored.points;t.goalsHit=scored.goalsHit;t.status=scored.status;}
    const ranked=[...(m.technicians||[])].sort((a,b)=>safe(b.points)-safe(a.points)||safe(b.att)-safe(a.att)||String(a.name).localeCompare(String(b.name),'pt-BR'));
    const hasPoints=ranked.some(t=>safe(t.points)!==0);ranked.forEach((t,i)=>t.rank=hasPoints?i+1:null);
    m.teamTotals=deriveTotals(m.technicians);const teamStatus=teamStatusFromPoints(m);m.teamResult=teamStatus.status||'ABAIXO';recalculateFinance(m);
  }

  function financeSettingsForMonth(m){
    const current=m?.financeSettings&&Object.keys(m.financeSettings).length?m.financeSettings:{};
    return{
      attendanceTiers:Array.isArray(current.attendanceTiers)&&current.attendanceTiers.length?clone(current.attendanceTiers):clone(DEFAULT_FINANCE_SETTINGS.attendanceTiers),
      notes5Tiers:Array.isArray(current.notes5Tiers)&&current.notes5Tiers.length?clone(current.notes5Tiers):clone(DEFAULT_FINANCE_SETTINGS.notes5Tiers),
      cancelTiers:Array.isArray(current.cancelTiers)&&current.cancelTiers.length?clone(current.cancelTiers):clone(DEFAULT_FINANCE_SETTINGS.cancelTiers),
      topAttendancePrize:Number.isFinite(Number(current.topAttendancePrize))?safe(current.topAttendancePrize):DEFAULT_FINANCE_SETTINGS.topAttendancePrize,
      topNotes5Prize:Number.isFinite(Number(current.topNotes5Prize))?safe(current.topNotes5Prize):DEFAULT_FINANCE_SETTINGS.topNotes5Prize,
      belowDiscount:Number.isFinite(Number(current.belowDiscount))?safe(current.belowDiscount):DEFAULT_FINANCE_SETTINGS.belowDiscount
    };
  }
  function financeModelForMonth(m){return ['squad','individual'].includes(m?.financeModel)?m.financeModel:(m?.isClosed&&safe(m?.closedSnapshot?.version)<3?'individual':'squad')}
  function financeModelLabel(model){return model==='individual'?'Individual meritocrático':'Base do Squad'}
  function financeFloorTier(value,tiers){const sorted=[...(tiers||[])].sort((a,b)=>safe(b.min)-safe(a.min));return sorted.find(t=>safe(value)>=safe(t.min))||sorted[sorted.length-1]||{min:0,amount:0}}
  function financeCancelTier(rate,tiers){const sorted=[...(tiers||[])].sort((a,b)=>safe(a.max)-safe(b.max));return sorted.find(t=>safe(rate)<=safe(t.max))||sorted[sorted.length-1]||{max:0,mult:0}}
  function financialStatusRefs(m){return automaticScoreRefs(m)}
  function financePerformanceStatus(t,m){if(safe(t.att)<=0)return'';const r=financialStatusRefs(m),hits=[safe(t.att)>=r.refAtt,safe(t.totalEval)>=r.refTotalEval,safe(t.avg)>=r.refAvg,safe(t.evalPct)>=r.refEvalPct].filter(Boolean).length;return hits>=2?'ACIMA':'ABAIXO'}
  function buildFinanceModelData({mode,hasProduction,days,avgPerDay,notes5Pct,commissionAtt,commissionNotes5,cancelRate,cancelTier,rawMult,effectiveMult,financeStatus,topAttBonus,topNotes5Bonus,manualBonus,sales,discount,redistributed,vacation,pool}){
    const base=hasProduction?safe(commissionAtt)+safe(commissionNotes5):0,afterCancel=hasProduction?base*effectiveMult:0;
    const rawBeforeVacation=hasProduction?afterCancel+manualBonus+topAttBonus+topNotes5Bonus+sales-discount+redistributed:0;
    const beforeVacation=mode==='individual'?Math.max(0,rawBeforeVacation):rawBeforeVacation;
    const zeroFloorAdjustment=mode==='individual'&&rawBeforeVacation<0?-rawBeforeVacation:0;
    const preCapFinal=vacation?beforeVacation*.5:beforeVacation;
    return{mode,hasProduction,days,avgPerDay,notes5Pct,attendanceTier:null,notes5Tier:null,commissionAtt:safe(commissionAtt),commissionNotes5:safe(commissionNotes5),base,cancelRate,cancelTier:safe(cancelTier?.max),cancelRawMultiplier:rawMult,cancelMultiplier:effectiveMult,afterCancel,financeStatus,topAttBonus,topNotes5Bonus,manualBonus,salesCommission:sales,discount,redistribution:redistributed,rawBeforeVacation,beforeVacation,zeroFloorAdjustment,vacation:!!vacation,vacationFactor:vacation?.5:1,preCapFinal:Number(preCapFinal.toFixed(2)),capAdjustment:0,capFactor:1,capApplied:false,final:Number(preCapFinal.toFixed(2)),pool:Number(pool.toFixed(2))}
  }
  function applyIndividualTotalCap(records,cap){
    const limit=Math.max(0,Number.isFinite(Number(cap))?safe(cap):7000),before=records.reduce((sum,r)=>sum+Math.max(0,safe(r.data.preCapFinal)),0);
    if(before<=limit||before<=0){records.forEach(r=>{r.data.capFactor=1;r.data.capApplied=false;r.data.capAdjustment=0;r.data.final=Number(safe(r.data.preCapFinal).toFixed(2))});return{before:Number(before.toFixed(2)),after:Number(before.toFixed(2)),cap:limit,factor:1,applied:false,adjustment:0}}
    const factor=limit/before,targetCents=Math.round(limit*100),parts=records.map((r,i)=>{const raw=Math.max(0,safe(r.data.preCapFinal))*factor*100,base=Math.floor(raw+1e-9);return{i,r,raw,base,frac:raw-base}}),used=parts.reduce((s,p)=>s+p.base,0),remainder=Math.max(0,targetCents-used);
    parts.sort((a,b)=>b.frac-a.frac||safe(b.r.data.preCapFinal)-safe(a.r.data.preCapFinal));for(let i=0;i<remainder&&parts.length;i++)parts[i%parts.length].base+=1;
    parts.forEach(p=>{const final=p.base/100,d=p.r.data;d.capFactor=factor;d.capApplied=true;d.final=final;d.capAdjustment=Number((final-safe(d.preCapFinal)).toFixed(2))});
    const after=records.reduce((sum,r)=>sum+safe(r.data.final),0);return{before:Number(before.toFixed(2)),after:Number(after.toFixed(2)),cap:limit,factor,applied:true,adjustment:Number((after-before).toFixed(2))}
  }
  function recalculateFinance(m){
    if(!m||m.isClosed)return;
    // Em produção, técnicos não recalculam o financeiro no navegador: a RLS protege os componentes
    // privados dos colegas e o teto Individual depende da folha completa do Squad. Preserve o cálculo
    // persistido pelo gestor/importação para o próprio técnico.
    if(isTechnician()&&state.supabase)return;
    const settings=financeSettingsForMonth(m);m.financeSettings=settings;m.financeMonthData=m.financeMonthData||{};m.financeModel=financeModelForMonth(m);if(typeof m.financeCompare!=='boolean')m.financeCompare=true;if(typeof m.financeTechCompare!=='boolean')m.financeTechCompare=false;if(!Number.isFinite(Number(m.financeIndividualCap)))m.financeIndividualCap=7000;
    const customers=safe(m.financeMonthData.customersStart),canceled=safe(m.financeMonthData.canceledCount),cancelRate=customers>0?canceled/customers:0,cancelTier=financeCancelTier(cancelRate,settings.cancelTiers),rawMult=customers>0?safe(cancelTier.mult):0,effectiveMult=customers>0?(rawMult===0?1:rawMult):1;
    const active=(m.technicians||[]).filter(t=>safe(t.att)>0),counted=active.filter(t=>!t.excludeFromGroupCount),days=Math.max(1,businessDaysElapsed(m.year,m.month,m.latestDay));
    // V2.20.5: todos os atendimentos e Notas 5 continuam no numerador. O checkbox apenas
    // retira o técnico do denominador da quantidade de técnicos usada pela Base do Squad.
    const totalAtt=active.reduce((s,t)=>s+safe(t.att),0),totalN5=active.reduce((s,t)=>s+safe(t.notes5),0),groupAvgPerDay=counted.length?totalAtt/(days*counted.length):0,groupNotes5Pct=totalAtt?totalN5/totalAtt:0;
    const groupAttTier=financeFloorTier(groupAvgPerDay,settings.attendanceTiers),groupN5Tier=financeFloorTier(groupNotes5Pct,settings.notes5Tiers),groupCommissionAtt=safe(groupAttTier.amount),groupCommissionNotes5=safe(groupN5Tier.amount),groupBase=(groupCommissionAtt+groupCommissionNotes5)*effectiveMult;
    const maxAtt=active.length?Math.max(...active.map(t=>safe(t.att))):0,maxN5=active.length?Math.max(...active.map(t=>safe(t.notes5))):0,attWinners=maxAtt>0?active.filter(t=>safe(t.att)===maxAtt):[],n5Winners=maxN5>0?active.filter(t=>safe(t.notes5)===maxN5):[];
    const attPrizeEach=attWinners.length?safe(settings.topAttendancePrize)/attWinners.length:0,n5PrizeEach=n5Winners.length?safe(settings.topNotes5Prize)/n5Winners.length:0;
    const statuses=new Map();active.forEach(t=>statuses.set(nameLinkKey(t.name),financePerformanceStatus(t,m)));const below=active.filter(t=>statuses.get(nameLinkKey(t.name))==='ABAIXO'),above=active.filter(t=>statuses.get(nameLinkKey(t.name))==='ACIMA'),pool=below.length*safe(settings.belowDiscount),redistribution=above.length?pool/above.length:0;
    let squadTotal=0;const individualRecords=[];
    for(const t of m.technicians||[]){
      const hasProduction=safe(t.att)>0||safe(t.totalEval)>0,avgPerDay=safe(t.att)/days,notes5Pct=safe(t.att)>0?safe(t.notes5)/safe(t.att):0,attTier=financeFloorTier(avgPerDay,settings.attendanceTiers),n5Tier=financeFloorTier(notes5Pct,settings.notes5Tiers),financeStatus=statuses.get(nameLinkKey(t.name))||'';
      const topAttBonus=attWinners.includes(t)?attPrizeEach:0,topNotes5Bonus=n5Winners.includes(t)?n5PrizeEach:0,manualBonus=hasProduction?safe(t.financeManualBonus):0,sales=hasProduction?safe(t.salesCommission):0,discount=financeStatus==='ABAIXO'?safe(settings.belowDiscount):0,redistributed=financeStatus==='ACIMA'?redistribution:0;
      const common={hasProduction,days,cancelRate,cancelTier,rawMult,effectiveMult,financeStatus,topAttBonus,topNotes5Bonus,manualBonus,sales,discount,redistributed,vacation:!!t.vacation,pool};
      const individual=buildFinanceModelData({mode:'individual',...common,avgPerDay,notes5Pct,commissionAtt:hasProduction?safe(attTier.amount):0,commissionNotes5:hasProduction?safe(n5Tier.amount):0});individual.attendanceTier=safe(attTier.min);individual.notes5Tier=safe(n5Tier.min);
      const squad=buildFinanceModelData({mode:'squad',...common,avgPerDay:groupAvgPerDay,notes5Pct:groupNotes5Pct,commissionAtt:hasProduction?groupCommissionAtt:0,commissionNotes5:hasProduction?groupCommissionNotes5:0});squad.attendanceTier=safe(groupAttTier.min);squad.notes5Tier=safe(groupN5Tier.min);
      squadTotal+=squad.final;individualRecords.push({t,data:individual,squad});
    }
    const capInfo=applyIndividualTotalCap(individualRecords,Number.isFinite(Number(m.financeIndividualCap))?safe(m.financeIndividualCap):7000);let individualTotal=0;
    individualRecords.forEach(({t,data:individual,squad})=>{individualTotal+=individual.final;const official=m.financeModel==='individual'?individual:squad;t.financeData={...official,version:3,officialModel:m.financeModel,models:{squad,individual},comparisonDiff:Number((individual.final-squad.final).toFixed(2)),groupBase:{avgPerDay:groupAvgPerDay,notes5Pct:groupNotes5Pct,commissionAtt:groupCommissionAtt,commissionNotes5:groupCommissionNotes5,afterCancel:groupBase}}});
    const diff=individualTotal-squadTotal;m.financeComparison={version:2,squadTotal:Number(squadTotal.toFixed(2)),individualBeforeCapTotal:capInfo.before,individualTotal:Number(individualTotal.toFixed(2)),individualCap:capInfo.cap,individualCapApplied:capInfo.applied,individualCapFactor:capInfo.factor,individualCapAdjustment:capInfo.adjustment,difference:Number(diff.toFixed(2)),differencePct:squadTotal?diff/squadTotal:0,groupAvgPerDay,groupNotes5Pct,groupCommissionAtt,groupCommissionNotes5,groupAfterCancel:groupBase,cancelRate,cancelMultiplier:effectiveMult,activeTechnicians:active.length,countedTechnicians:counted.length,excludedFromGroupCount:Math.max(0,active.length-counted.length),belowCount:below.length,aboveCount:above.length,redistributionPool:Number(pool.toFixed(2)),redistributionEach:Number(redistribution.toFixed(2))};m.financeComparisonSnapshot=clone(m.financeComparison);
  }
  function renderFinanceSummary(t,m){
    if(!$('#financeSummaryCard'))return;const d=t.financeData||{},model=d.officialModel||financeModelForMonth(m),other=model==='squad'?'individual':'squad',otherData=d.models?.[other];$('#financeSummaryTitle').textContent=m.isClosed?'Bonificação final':'Bonificação estimada';$('#financeSummaryState').textContent=`${m.isClosed?'FECHADO':'EM ANDAMENTO'} • ${financeModelLabel(model).toUpperCase()}`;$('#financeSummaryTotal').textContent=fmtMoney(d.final);$('#financeVacationBadge').classList.toggle('hidden',!t.vacation);
    const items=[['Produção',fmtMoney(d.commissionAtt),`${safe(d.avgPerDay).toLocaleString('pt-BR',{maximumFractionDigits:2})} atend./dia`,''],['Qualidade',fmtMoney(d.commissionNotes5),`${fmtPct(d.notes5Pct)} de Notas 5`,''],['Cancelamento',`× ${safe(d.cancelMultiplier||1).toLocaleString('pt-BR',{minimumFractionDigits:3,maximumFractionDigits:3})}`,`${fmtPct(d.cancelRate)} no mês`,''],['Bônus manual',fmtMoney(d.manualBonus),'Informado pelo admin','positive'],['Prêmios',fmtMoney(safe(d.topAttBonus)+safe(d.topNotes5Bonus)),'Maior atendimento / Notas 5','positive'],['Comissão vendas',fmtMoney(d.salesCommission),'Informada pelo admin','positive'],['Desconto',`- ${fmtMoney(d.discount)}`,d.financeStatus||'Sem status',d.discount?'negative':''],['Redistribuição',fmtMoney(d.redistribution),'Somente entre técnicos ACIMA','positive']];
    $('#financeBreakdown').innerHTML=items.map(([label,value,note,cls])=>`<div class="finance-break-item ${cls}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></div>`).join('');
    const adminCompare=!isTechnician()&&m.financeCompare&&otherData?` • Simulação ${financeModelLabel(other)}: ${fmtMoney(otherData.final)}.`:'';$('#financeSummarySubtitle').textContent=(t.vacation?`Subtotal antes das férias: ${fmtMoney(d.beforeVacation)} • redutor final de 50%.`:`Modelo aplicado: ${financeModelLabel(model)}.`)+adminCompare;
    const transition=$('#financeTransitionCompare');if(transition){const show=isTechnician()&&m.financeTechCompare===true&&otherData;transition.classList.toggle('hidden',!show);transition.innerHTML=show?`<div><span>SIMULAÇÃO DE TRANSIÇÃO</span><strong>${escapeHtml(financeModelLabel(other))}</strong><small>Comparação informativa; não altera o valor oficial do mês.</small></div><div class="transition-values"><span>Oficial <b>${fmtMoney(d.final)}</b></span><span>Simulação <b>${fmtMoney(otherData.final)}</b></span><span class="${safe(otherData.final)-safe(d.final)>=0?'positive-text':'negative-text'}">Diferença <b>${safe(otherData.final)-safe(d.final)>=0?'+ ':''}${fmtMoney(safe(otherData.final)-safe(d.final))}</b></span></div>`:'';}
  }
  function renderFinanceTierEditor(id,tiers,type){const el=$('#'+id);if(!el)return;const isCancel=type==='cancel';el.innerHTML=`<div class="finance-tier-table"><div class="finance-tier-row finance-tier-head"><span>${isCancel?'Até %':'Faixa'}</span><span>${isCancel?'Multiplicador':'Comissão R$'}</span></div>${(tiers||[]).map((t,i)=>`<div class="finance-tier-row"><input type="number" step="0.01" data-finance-tier="${type}" data-tier-index="${i}" data-tier-field="${isCancel?'max':'min'}" value="${isCancel?(safe(t.max)*100).toFixed(2):type==='notes'?(safe(t.min)*100).toFixed(2):safe(t.min)}"><input type="number" step="0.001" data-finance-tier="${type}" data-tier-index="${i}" data-tier-field="${isCancel?'mult':'amount'}" value="${safe(t[isCancel?'mult':'amount'])}"></div>`).join('')}</div>`}
  function financeDetailGrid(d){const individual=d.mode==='individual';return `<div class="finance-detail-grid"><div><span>Comissão atendimento</span><strong>${fmtMoney(d.commissionAtt)}</strong></div><div><span>Comissão Notas 5</span><strong>${fmtMoney(d.commissionNotes5)}</strong></div><div><span>Após cancelamento</span><strong>${fmtMoney(d.afterCancel)}</strong></div><div><span>Bônus + prêmios</span><strong>${fmtMoney(safe(d.manualBonus)+safe(d.topAttBonus)+safe(d.topNotes5Bonus))}</strong></div><div><span>Vendas</span><strong>${fmtMoney(d.salesCommission)}</strong></div><div><span>Desconto</span><strong>${d.discount?'- ':''}${fmtMoney(d.discount)}</strong></div><div><span>Redistribuição</span><strong>${fmtMoney(d.redistribution)}</strong></div><div><span>Antes das férias</span><strong>${fmtMoney(d.beforeVacation)}</strong></div>${individual?`<div><span>Piso zero aplicado</span><strong>${fmtMoney(d.zeroFloorAdjustment)}</strong></div><div><span>Antes do teto global</span><strong>${fmtMoney(d.preCapFinal)}</strong></div><div><span>Ajuste do teto</span><strong>${fmtMoney(d.capAdjustment)}</strong></div><div><span>Final Individual</span><strong>${fmtMoney(d.final)}</strong></div>`:''}</div>`}
  function renderFinanceAdmin(m,specific,locked){
    if(!$('#financeTechnicianRows'))return;const disabled=locked?' disabled':'';
    $$('.admin-section').forEach(el=>el.classList.toggle('section-hidden',!el.classList.contains(`admin-${state.adminSection}`)));
    if(!specific||!m){$('#financeTechnicianRows').innerHTML='<div class="muted finance-empty">Selecione um Squad e um mês.</div>';$('#financeAdminHint').textContent='Selecione um Squad específico e um mês.';['financeCustomersStart','financeCanceledCount','financeTopAttPrize','financeTopNotesPrize','financeBelowDiscount','financeIndividualCap'].forEach(id=>{if($('#'+id)){$('#'+id).value='';$('#'+id).disabled=true}});if($('#financeComparisonSummary'))$('#financeComparisonSummary').innerHTML='';if($('#financeBaseAudit'))$('#financeBaseAudit').innerHTML='';renderSuperAdminCommission(null);return;}
    const settings=financeSettingsForMonth(m),md=m.financeMonthData||{},customers=safe(md.customersStart),canceled=safe(md.canceledCount),rate=customers?canceled/customers:0,tier=financeCancelTier(rate,settings.cancelTiers),mult=customers?(safe(tier.mult)===0?1:safe(tier.mult)):1,model=financeModelForMonth(m);m.financeModel=model;
    $('#financeModelSquad').checked=model==='squad';$('#financeModelIndividual').checked=model==='individual';$('#financeModelSquad').disabled=locked;$('#financeModelIndividual').disabled=locked;$('#financeCompareToggle').checked=m.financeCompare!==false;$('#financeCompareToggle').disabled=locked;$('#financeTechnicianCompareToggle').checked=m.financeTechCompare===true;$('#financeTechnicianCompareToggle').disabled=locked;
    $('#financeCustomersStart').value=safe(md.customersStart)||'';$('#financeCanceledCount').value=safe(md.canceledCount)||'';$('#financeTopAttPrize').value=safe(settings.topAttendancePrize);$('#financeTopNotesPrize').value=safe(settings.topNotes5Prize);$('#financeBelowDiscount').value=safe(settings.belowDiscount);$('#financeIndividualCap').value=Number.isFinite(Number(m.financeIndividualCap))?safe(m.financeIndividualCap):7000;['financeCustomersStart','financeCanceledCount','financeTopAttPrize','financeTopNotesPrize','financeBelowDiscount','financeIndividualCap'].forEach(id=>$('#'+id).disabled=locked);
    $('#financeCancelRate').textContent=fmtPct(rate);$('#financeCancelMultiplier').textContent=`× ${mult.toLocaleString('pt-BR',{minimumFractionDigits:3,maximumFractionDigits:3})}`;
    renderFinanceTierEditor('financeAttTiers',settings.attendanceTiers,'att');renderFinanceTierEditor('financeNotesTiers',settings.notes5Tiers,'notes');renderFinanceTierEditor('financeCancelTiers',settings.cancelTiers,'cancel');$$('[data-finance-tier]').forEach(i=>i.disabled=locked);
    const c=m.financeComparison||{};$('#financeComparisonSummary').classList.toggle('hidden',m.financeCompare===false);$('#financeComparisonSummary').innerHTML=`<div class="finance-compare-card official"><span>MODELO OFICIAL</span><strong>${escapeHtml(financeModelLabel(model))}</strong><small>${fmtMoney(model==='individual'?c.individualTotal:c.squadTotal)}</small></div><div class="finance-compare-card"><span>BASE DO SQUAD</span><strong>${fmtMoney(c.squadTotal)}</strong><small>Folha estimada</small></div><div class="finance-compare-card"><span>INDIVIDUAL</span><strong>${fmtMoney(c.individualTotal)}</strong><small>${c.individualCapApplied?'Após teto global':'Folha estimada'}</small></div><div class="finance-compare-card ${safe(c.difference)>=0?'up':'down'}"><span>IMPACTO INDIVIDUAL</span><strong>${safe(c.difference)>=0?'+ ':''}${fmtMoney(c.difference)}</strong><small>${safe(c.differencePct)>=0?'+':''}${fmtPct(c.differencePct)}</small></div>`;
    $('#financeBaseAudit').innerHTML=`<div><span>Técnicos considerados</span><strong>${fmtInt(c.countedTechnicians??c.activeTechnicians)} de ${fmtInt(c.activeTechnicians)}</strong><small>${safe(c.excludedFromGroupCount)} desconsiderado(s) apenas no denominador</small></div><div><span>Média do grupo</span><strong>${safe(c.groupAvgPerDay).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})} atend./técnico/dia</strong></div><div><span>% Notas 5 do grupo</span><strong>${fmtPct(c.groupNotes5Pct)}</strong></div><div><span>Comissões da base</span><strong>${fmtMoney(c.groupCommissionAtt)} + ${fmtMoney(c.groupCommissionNotes5)}</strong></div><div><span>Base após cancelamento</span><strong>${fmtMoney(c.groupAfterCancel)}</strong></div><div><span>Individual antes do teto</span><strong>${fmtMoney(c.individualBeforeCapTotal)}</strong></div><div><span>Teto Individual</span><strong>${fmtMoney(c.individualCap||m.financeIndividualCap||7000)}</strong><small>${c.individualCapApplied?`Aplicado • fator ${(safe(c.individualCapFactor)*100).toLocaleString('pt-BR',{maximumFractionDigits:2})}%`:'Não atingido'}</small></div><div><span>Ajuste total do teto</span><strong>${fmtMoney(c.individualCapAdjustment)}</strong></div><div><span>Redistribuição</span><strong>${fmtMoney(c.redistributionPool)} ÷ ${fmtInt(c.aboveCount)} ACIMA = ${fmtMoney(c.redistributionEach)}</strong></div>`;
    const list=[...(m.technicians||[])].sort((a,b)=>String(a.name).localeCompare(String(b.name),'pt-BR')),showCompare=m.financeCompare!==false;
    $('#financeTechnicianRows').innerHTML=list.map(t=>{const d=t.financeData||{},sq=d.models?.squad||d,ind=d.models?.individual||d,prizes=safe(d.topAttBonus)+safe(d.topNotes5Bonus),diff=safe(ind.final)-safe(sq.final),comparisonMetrics=showCompare?`<div><span>Base Squad</span><b>${fmtMoney(sq.final)}</b></div><div><span>Individual</span><b>${fmtMoney(ind.final)}</b></div><div class="${diff>=0?'positive-text':'negative-text'}"><span>Diferença</span><b>${diff>=0?'+ ':''}${fmtMoney(diff)}</b></div>`:`<div><span>Modelo oficial</span><b>${fmtMoney(d.final)}</b></div>`;return `<article class="finance-tech-card" data-finance-tech="${escapeHtml(t.name)}"><div class="finance-tech-head"><div><strong>${escapeHtml(t.name)}</strong><span class="status finance-status ${d.financeStatus==='ACIMA'?'above':d.financeStatus==='ABAIXO'?'below':''}">${escapeHtml(d.financeStatus||'—')}</span></div><div class="finance-tech-total"><small>${escapeHtml(financeModelLabel(model))}</small><strong>${fmtMoney(d.final)}</strong></div></div><div class="finance-tech-metrics"><div><span>At./dia individual</span><b>${safe(ind.avgPerDay).toLocaleString('pt-BR',{maximumFractionDigits:2})}</b></div><div><span>% N5 individual</span><b>${fmtPct(ind.notes5Pct)}</b></div>${comparisonMetrics}</div><div class="finance-tech-inputs"><label><span>Bônus manual</span><input data-finance-field="financeManualBonus" type="number" step="0.01" value="${safe(t.financeManualBonus)}"${disabled}></label><label><span>Comissão vendas</span><input data-finance-field="salesCommission" type="number" step="0.01" value="${safe(t.salesCommission)}"${disabled}></label><label class="finance-vacation-control"><input data-finance-field="vacation" type="checkbox" ${t.vacation?'checked':''}${disabled}><span>Férias no mês • pagar 50%</span></label><label class="finance-count-control"><input data-finance-field="excludeFromGroupCount" type="checkbox" ${t.excludeFromGroupCount?'checked':''}${disabled}><span>Desconsiderar na quantidade de técnicos do grupo</span><small>Atendimentos e notas continuam contando no total.</small></label><div class="finance-auto-adjust"><span>Prêmios</span><b>${fmtMoney(prizes)}</b></div><div class="finance-auto-adjust"><span>Desconto / redistrib.</span><b>${d.discount?'-'+fmtMoney(d.discount):'+'+fmtMoney(d.redistribution)}</b></div></div><details class="finance-tech-details"><summary>${showCompare?'Detalhes e auditoria dos dois modelos':'Detalhes do modelo oficial'}</summary>${showCompare?`<div class="finance-model-detail"><h4>Base do Squad</h4>${financeDetailGrid(sq)}</div><div class="finance-model-detail"><h4>Individual meritocrático</h4>${financeDetailGrid(ind)}</div>`:`<div class="finance-model-detail"><h4>${escapeHtml(financeModelLabel(model))}</h4>${financeDetailGrid(d)}</div>`}</details></article>`}).join('')||'<div class="muted finance-empty">Nenhum técnico.</div>';
    $('#financeAdminHint').textContent=`${m.monthName} ${m.year} • ${m.isClosed?'🔒 valores congelados':`modelo oficial: ${financeModelLabel(model)}`}.`;renderSuperAdminCommission(m);
  }
  function collectFinanceSettingsFromUi(m){const settings=financeSettingsForMonth(m);settings.topAttendancePrize=Math.max(0,safe($('#financeTopAttPrize').value));settings.topNotes5Prize=Math.max(0,safe($('#financeTopNotesPrize').value));settings.belowDiscount=Math.max(0,safe($('#financeBelowDiscount').value));const maps={att:settings.attendanceTiers,notes:settings.notes5Tiers,cancel:settings.cancelTiers};$$('[data-finance-tier]').forEach(inp=>{const type=inp.dataset.financeTier,idx=safe(inp.dataset.tierIndex),field=inp.dataset.tierField,arr=maps[type];if(!arr?.[idx])return;let value=safe(inp.value);if(type==='notes'&&field==='min')value/=100;if(type==='cancel'&&field==='max')value/=100;arr[idx][field]=value;});return settings}
  function previewFinanceModelChange(){if(!isAdmin()||state.squadCode==='all')return;const m=currentMonth();if(!m)return;if(!m.isClosed)m.financeModel=$('#financeModelIndividual')?.checked?'individual':'squad';m.financeCompare=$('#financeCompareToggle')?.checked!==false;m.financeTechCompare=$('#financeTechnicianCompareToggle')?.checked===true;m.financeIndividualCap=Math.max(0,safe($('#financeIndividualCap')?.value||7000));if(!m.isClosed)recalculateMonth(m);renderFinanceAdmin(m,true,!!m.isClosed);if(currentTech())renderFinanceSummary(currentTech(),m)}
  async function saveFinanceConfiguration(){
    if(!isAdmin()||!requireSpecificSquad())return;const m=currentMonth();if(!m||m.isClosed)return toast('Reabra o mês antes de alterar a bonificação.');
    try{m.financeModel=$('#financeModelIndividual')?.checked?'individual':'squad';m.financeCompare=$('#financeCompareToggle')?.checked!==false;m.financeTechCompare=$('#financeTechnicianCompareToggle')?.checked===true;m.financeIndividualCap=Math.max(0,safe($('#financeIndividualCap')?.value||7000));m.financeSettings=collectFinanceSettingsFromUi(m);m.financeMonthData={customersStart:Math.max(0,safe($('#financeCustomersStart').value)),canceledCount:Math.max(0,safe($('#financeCanceledCount').value))};recalculateMonth(m);saveDemoSquads();if(state.supabase)await persistFinanceMonth(m);state.financeRankingCache={};render();toast(`Modelo ${financeModelLabel(m.financeModel)} salvo como oficial e bonificação recalculada.`)}catch(err){console.error(err);toast('Não foi possível salvar. Confira se as migrações V2.19.0 e V2.20.0 foram executadas.')}
  }
  async function saveFinanceTechnicians(){
    if(!isAdmin()||!requireSpecificSquad())return;const m=currentMonth();if(!m||m.isClosed)return toast('Reabra o mês antes de alterar os valores financeiros.');
    for(const row of $$('#financeTechnicianRows [data-finance-tech]')){const t=m.technicians.find(x=>samePersonName(x.name,row.dataset.financeTech));if(!t)continue;for(const input of $$('[data-finance-field]',row)){if(['vacation','excludeFromGroupCount'].includes(input.dataset.financeField))t[input.dataset.financeField]=!!input.checked;else t[input.dataset.financeField]=safe(input.value)}}
    try{recalculateMonth(m);saveDemoSquads();if(state.supabase)await persistFinanceMonth(m);state.financeRankingCache={};render();toast('Valores individuais salvos; os dois modelos foram recalculados.')}catch(err){console.error(err);toast('Não foi possível salvar os valores financeiros.')}
  }
  async function persistFinanceMonth(m){
    if(!state.supabase||!m?.dbId)return;const payload={finance_settings:financeSettingsForMonth(m),finance_month_data:m.financeMonthData||{},finance_model:financeModelForMonth(m),finance_compare:m.financeCompare!==false,finance_technician_compare:m.financeTechCompare===true,finance_individual_cap:Number.isFinite(Number(m.financeIndividualCap))?safe(m.financeIndividualCap):7000,finance_comparison_snapshot:m.financeComparison||{}};const {error:me}=await state.supabase.from('squad_months').update(payload).eq('id',m.dbId);if(me)throw me;
    for(const t of m.technicians||[]){if(!t.dbId)continue;const row={technician_month_id:t.dbId,manual_bonus:safe(t.financeManualBonus),sales_commission:safe(t.salesCommission),vacation:!!t.vacation,exclude_from_group_count:!!t.excludeFromGroupCount,calculated:t.financeData||{},updated_by:state.user.userId,updated_at:new Date().toISOString()};const {data,error}=await state.supabase.from('technician_finance_monthly').upsert(row,{onConflict:'technician_month_id'}).select('id').single();if(error)throw error;t.financeDbId=data.id}
  }
  async function copyFinanceRulesFromPreviousMonth(){if(!isAdmin()||!requireSpecificSquad())return;const m=currentMonth();if(!m||m.isClosed)return;const prev=previousMonthForCurrent(m);if(!prev)return toast('Não existe mês anterior neste Squad.');if(!await confirmDialog(`Copiar as faixas e parâmetros financeiros de ${prev.monthName} ${prev.year}? O modelo oficial, cancelamento e valores individuais não serão copiados.`,{title:'Copiar regras financeiras',confirmText:'Copiar',tone:'warning'}))return;m.financeSettings=clone(financeSettingsForMonth(prev));m.financeIndividualCap=Number.isFinite(Number(prev.financeIndividualCap))?safe(prev.financeIndividualCap):7000;recalculateMonth(m);saveDemoSquads();if(state.supabase)await persistFinanceMonth(m);render();toast('Regras financeiras copiadas do mês anterior.')}
  function financeReportRows(m){return (m?.technicians||[]).map(t=>{const d=t.financeData||{},sq=d.models?.squad||d,ind=d.models?.individual||d,official=financeModelForMonth(m);return{'Técnico':titleWords(t.name),'Status financeiro':d.financeStatus||'','Atendimentos':safe(t.att),'Atend./dia individual':safe(ind.avgPerDay),'Notas 5':safe(t.notes5),'% Notas 5 individual':safe(ind.notes5Pct),'Base Squad - comissão atend.':safe(sq.commissionAtt),'Base Squad - comissão N5':safe(sq.commissionNotes5),'Base Squad - final':safe(sq.final),'Individual - comissão atend.':safe(ind.commissionAtt),'Individual - comissão N5':safe(ind.commissionNotes5),'Individual - antes do teto':safe(ind.preCapFinal),'Individual - ajuste teto':safe(ind.capAdjustment),'Individual - final':safe(ind.final),'Diferença Individual x Squad':safe(ind.final)-safe(sq.final),'Modelo oficial':financeModelLabel(official),'Valor oficial':safe(d.final),'Multiplicador cancelamento':safe(d.cancelMultiplier||1),'Bônus manual':safe(d.manualBonus),'Prêmio atendimento':safe(d.topAttBonus),'Prêmio Notas 5':safe(d.topNotes5Bonus),'Comissão vendas':safe(d.salesCommission),'Desconto':safe(d.discount),'Redistribuição':safe(d.redistribution),'Férias':t.vacation?'SIM':'NÃO','Conta na quantidade do Squad':t.excludeFromGroupCount?'NÃO':'SIM'}})}
  function reportAdminRows(m){if(!m)return[];return (state.superAdminCommissions||[]).filter(c=>safe(c.year)===safe(m.year)&&safe(c.month)===safe(m.month)).map(c=>({'Admin Geral':c.name||'Admin geral','Comissão final':safe(c.amount),'Observação':c.notes||''}))}
  function loadExternalScriptOnce(src,test){return new Promise((resolve,reject)=>{if(test?.())return resolve();const existing=[...document.scripts].find(x=>x.src===src);if(existing){existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return}const sc=document.createElement('script');sc.src=src;sc.onload=resolve;sc.onerror=()=>reject(new Error('Não foi possível carregar a biblioteca de exportação.'));document.head.appendChild(sc)})}
  async function exportFinanceExcel(){
    if(!isAdmin()||!requireSpecificSquad())return;const m=currentMonth();if(!m)return;try{await loadExternalScriptOnce('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',()=>window.XLSX);const wb=XLSX.utils.book_new(),rows=financeReportRows(m),ws=XLSX.utils.json_to_sheet(rows);XLSX.utils.book_append_sheet(wb,ws,'Tecnicos');const admins=reportAdminRows(m);if(admins.length)XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(admins),'Admin Geral');const c=m.financeComparison||{},summary=[{'Squad':state.squadCode,'Competência':`${m.monthName} ${m.year}`,'Status do mês':m.isClosed?'FECHADO':'EM ANDAMENTO','Modelo oficial':financeModelLabel(financeModelForMonth(m)),'Folha Base Squad':safe(c.squadTotal),'Individual antes do teto':safe(c.individualBeforeCapTotal),'Teto Individual':safe(c.individualCap||m.financeIndividualCap||7000),'Fator do teto':safe(c.individualCapFactor||1),'Folha Individual':safe(c.individualTotal),'Diferença':safe(c.difference),'Média atend./técnico/dia Squad':safe(c.groupAvgPerDay),'% Notas 5 Squad':safe(c.groupNotes5Pct),'Base Squad após cancelamento':safe(c.groupAfterCancel),'Clientes início':safe(m.financeMonthData?.customersStart),'Cancelados':safe(m.financeMonthData?.canceledCount),'% cancelamento':safe(m.financeMonthData?.customersStart)?safe(m.financeMonthData?.canceledCount)/safe(m.financeMonthData?.customersStart):0,'Técnicos com produção':safe(c.activeTechnicians),'Técnicos considerados na média Base Squad':safe(c.countedTechnicians??c.activeTechnicians),'Técnicos desconsiderados no denominador':safe(c.excludedFromGroupCount)}];XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(summary),'Resumo');XLSX.writeFile(wb,`Bonificacao_Squad_${state.squadCode}_${m.id}.xlsx`);toast('Relatório Excel comparativo gerado.')}catch(err){console.error(err);toast('Não foi possível gerar o Excel. Verifique sua conexão com a internet.')}
  }
  async function exportFinancePdf(){
    if(!isAdmin()||!requireSpecificSquad())return;const m=currentMonth();if(!m)return;try{await loadExternalScriptOnce('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',()=>window.jspdf?.jsPDF);await loadExternalScriptOnce('https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js',()=>window.jspdf?.jsPDF?.API?.autoTable);const {jsPDF}=window.jspdf,doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'}),rows=financeReportRows(m),c=m.financeComparison||{};doc.setFontSize(16);doc.text(`Bonificação • Squad ${state.squadCode} • ${m.monthName} ${m.year}`,14,14);doc.setFontSize(9);doc.text(`${m.isClosed?'FECHADO':'PRÉVIA'} • Modelo oficial: ${financeModelLabel(financeModelForMonth(m))} • Base Squad ${fmtMoney(c.squadTotal)} • Individual ${fmtMoney(c.individualTotal)}${c.individualCapApplied?' (teto aplicado)':''} • Gerado em ${new Date().toLocaleString('pt-BR')}`,14,20);const body=rows.map(r=>[r['Técnico'],r['Status financeiro'],fmtMoney(r['Base Squad - final']),fmtMoney(r['Individual - final']),fmtMoney(r['Diferença Individual x Squad']),r['Modelo oficial'],fmtMoney(r['Valor oficial']),fmtMoney(r['Bônus manual']+r['Prêmio atendimento']+r['Prêmio Notas 5']),fmtMoney(r['Comissão vendas']),fmtMoney(r['Desconto']),fmtMoney(r['Redistribuição']),r['Férias'],r['Conta na quantidade do Squad']]);doc.autoTable({startY:25,head:[['Técnico','Status','Base Squad','Individual','Dif.','Oficial','Valor oficial','Bônus','Vendas','Desc.','Redistrib.','Férias','Conta qtd.']],body,styles:{fontSize:6.6,cellPadding:1.4},headStyles:{fillColor:[35,39,48]},columnStyles:{6:{fontStyle:'bold'}}});const admins=reportAdminRows(m);if(admins.length){const y=doc.lastAutoTable.finalY+8;doc.setFontSize(11);doc.text('Comissão de Admin Geral',14,y);doc.autoTable({startY:y+3,head:[['Admin Geral','Comissão final','Observação']],body:admins.map(a=>[a['Admin Geral'],fmtMoney(a['Comissão final']),a['Observação']]),styles:{fontSize:8}})}doc.save(`Bonificacao_Squad_${state.squadCode}_${m.id}.pdf`);toast('Relatório PDF comparativo gerado.')}catch(err){console.error(err);toast('Não foi possível gerar o PDF. Verifique sua conexão com a internet.')}
  }
  function renderSuperAdminCommission(m){
    if(!isSuperAdmin()||!$('#superAdminCommissionInput'))return;if(!state.supabase&&!state.superAdminCommissions.length){try{state.superAdminCommissions=JSON.parse(localStorage.getItem(demoAdminCommissionKey())||'[]')}catch(e){}}const disabled=!m;$('#superAdminCommissionInput').disabled=disabled;$('#superAdminCommissionNotes').disabled=disabled;$('#saveSuperAdminCommissionBtn').disabled=disabled;const found=m?(state.superAdminCommissions||[]).find(c=>c.user_id===state.user.userId&&safe(c.year)===safe(m.year)&&safe(c.month)===safe(m.month)):null;$('#superAdminCommissionInput').value=found?safe(found.amount):'';$('#superAdminCommissionNotes').value=found?.notes||'';$('#superAdminCommissionPeriod').textContent=m?`${m.monthName} ${m.year} • valor total manual`:'Selecione um Squad e um mês para definir a competência.';
  }
  function demoAdminCommissionKey(){return'squadDashboardSuperAdminCommissionsV218'}
  async function saveSuperAdminCommission(){
    if(!isSuperAdmin())return;const m=currentMonth();if(!m)return toast('Selecione um Squad e um mês para definir a competência.');const amount=Math.max(0,safe($('#superAdminCommissionInput').value)),notes=$('#superAdminCommissionNotes').value.trim();try{if(state.supabase){const payload={organization_id:state.user.organizationId,user_id:state.user.userId,year:m.year,month:m.month,amount,notes,updated_by:state.user.userId,updated_at:new Date().toISOString()};const {data,error}=await state.supabase.from('super_admin_commissions').upsert(payload,{onConflict:'organization_id,user_id,year,month'}).select('id').single();if(error)throw error;const old=(state.superAdminCommissions||[]).filter(c=>!(c.user_id===state.user.userId&&safe(c.year)===m.year&&safe(c.month)===m.month));state.superAdminCommissions=[...old,{...payload,id:data.id,name:state.user.fullName}]}else{const list=JSON.parse(localStorage.getItem(demoAdminCommissionKey())||'[]').filter(c=>!(c.user_id===state.user.email&&safe(c.year)===m.year&&safe(c.month)===m.month));list.push({user_id:state.user.email,year:m.year,month:m.month,amount,notes,name:state.user.fullName});localStorage.setItem(demoAdminCommissionKey(),JSON.stringify(list));state.superAdminCommissions=list}renderSuperAdminCommission(m);toast('Comissão do Admin Geral salva.')}catch(err){console.error(err);toast('Não foi possível salvar a comissão do Admin Geral. Confira se a migração financeira V2.18.0 está aplicada.')}
  }


  function formatDateTime(v){if(!v)return'';try{return new Date(v).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}catch(e){return String(v)}}
  function previousMonthForCurrent(m=currentMonth()){
    if(!m)return null;const ids=Object.keys(currentMonths()).filter(id=>id<m.id).sort().reverse();return ids.length?currentMonths()[ids[0]]:null;
  }
  async function copyGoalsFromPreviousMonth(){
    if(!isAdmin()||!requireSpecificSquad())return;const m=currentMonth();if(!m)return;if(m.isClosed){toast('Este mês está fechado. Reabra-o antes de copiar metas.');return}
    const prev=previousMonthForCurrent(m);if(!prev){toast('Não existe um mês anterior importado neste Squad.');return}
    if(!await confirmDialog(`Copiar somente as metas individuais de ${prev.monthName} ${prev.year} para ${m.monthName} ${m.year}? Metas de atendimentos e notas 5 já preenchidas no mês atual serão substituídas.`,{title:'Copiar metas do mês anterior',confirmText:'Copiar metas',tone:'warning'}))return;
    try{
      let copied=0;for(const t of m.technicians||[]){const old=(prev.technicians||[]).find(x=>(t.userId&&x.userId&&t.userId===x.userId)||samePersonName(x.name,t.name));if(!old)continue;t.goalAtt=safe(old.goalAtt);t.goalEval=safe(old.goalEval);copied++;}
      recalculateMonth(m);saveDemoSquads();if(state.supabase)await persistManualMetrics(m);render();toast(`${copied} técnico(s) tiveram as metas individuais copiadas de ${prev.monthName}.`);
    }catch(err){console.error(err);toast('Não foi possível copiar as metas do mês anterior.')}
  }
  async function closeMonth(id){
    if(!isAdmin()||!requireSpecificSquad())return;const m=currentMonths()[id];if(!m||m.isClosed)return;
    if(!await confirmDialog(`Fechar ${m.monthName} ${m.year}? Dados, metas, pontuação e bonificação financeira ficarão congelados até que o mês seja reaberto.`,{title:'Fechar competência',confirmText:'Fechar mês',tone:'warning'}))return;
    try{
      recalculateMonth(m,{final:true});const rules=scoreRules(m,{final:true}),now=new Date().toISOString();
      m.closedSnapshot={version:5,closedAt:now,scoreRules:{refAtt:rules.refAtt,refTotalEval:rules.refTotalEval,refAvg:rules.refAvg,refEvalPct:rules.refEvalPct,bonusAtt:rules.bonusAtt,bonusTotalEval:rules.bonusTotalEval,bonusAvg:rules.bonusAvg,bonusEvalPct:rules.bonusEvalPct},teamResult:m.teamResult,teamGoals:teamSettings(m),financeModel:financeModelForMonth(m),financeCompare:m.financeCompare!==false,financeTechCompare:m.financeTechCompare===true,financeIndividualCap:Number.isFinite(Number(m.financeIndividualCap))?safe(m.financeIndividualCap):7000,financeComparison:clone(m.financeComparison||{}),financeSettings:clone(financeSettingsForMonth(m)),financeMonthData:clone(m.financeMonthData||{}),technicians:(m.technicians||[]).map(t=>({name:t.name,att:safe(t.att),notes5:safe(t.notes5),notes4:safe(t.notes4),notes3:safe(t.notes3),notes2:safe(t.notes2),notes1:safe(t.notes1),totalEval:safe(t.totalEval),avg:safe(t.avg),evalPct:safe(t.evalPct),goalAtt:safe(t.goalAtt),goalEval:safe(t.goalEval),points:safe(t.points),goalsHit:safe(t.goalsHit),status:t.status,rank:t.rank,financeManualBonus:safe(t.financeManualBonus),salesCommission:safe(t.salesCommission),vacation:!!t.vacation,excludeFromGroupCount:!!t.excludeFromGroupCount,financeData:clone(t.financeData||{})}))};
      m.isClosed=true;m.closedAt=now;m.closedBy=state.user?.userId||state.user?.email||null;saveDemoSquads();
      if(state.supabase&&m.dbId){await persistFinanceMonth(m);const {error}=await state.supabase.from('squad_months').update({is_closed:true,closed_at:now,closed_by:state.user.userId,closed_snapshot:m.closedSnapshot,team_result:m.teamResult}).eq('id',m.dbId);if(error)throw error;await persistCalculatedScores(m)}
      refreshSelectors();render();toast(`${m.monthName} ${m.year} fechado e congelado com sucesso.`);
    }catch(err){console.error(err);toast('Não foi possível fechar o mês. Confira as migrações V2.4.0, V2.18.0, V2.19.0 e V2.20.0.')}
  }
  async function reopenMonth(id){
    if(!isAdmin()||!requireSpecificSquad())return;const m=currentMonths()[id];if(!m||!m.isClosed)return;
    if(!await confirmDialog(`Reabrir ${m.monthName} ${m.year}? O mês voltará a aceitar importações e alterações. Ao concluir a correção, feche-o novamente.`,{title:'Reabrir competência',confirmText:'Reabrir mês',tone:'warning'}))return;
    try{
      m.isClosed=false;m.closedAt=null;m.closedBy=null;m.closedSnapshot={};recalculateMonth(m);saveDemoSquads();
      if(state.supabase&&m.dbId){const {error}=await state.supabase.from('squad_months').update({is_closed:false,closed_at:null,closed_by:null,closed_snapshot:{},team_result:m.teamResult}).eq('id',m.dbId);if(error)throw error;await persistCalculatedScores(m);await persistFinanceMonth(m)}
      refreshSelectors();render();toast(`${m.monthName} ${m.year} reaberto. Faça os ajustes e feche o mês novamente.`);
    }catch(err){console.error(err);toast('Não foi possível reabrir o mês.')}
  }

  async function persistCalculatedScores(m){
    for(const t of m.technicians||[]){if(!t.dbId)continue;const {error}=await state.supabase.from('technician_monthly').update({points:safe(t.points),goals_hit:safe(t.goalsHit),status:t.status,rank:t.rank}).eq('id',t.dbId);if(error)throw error;}
  }

  async function persistManualMetrics(m){
    for(const t of m.technicians||[]){
      if(!t.dbId)continue;
      const {error}=await state.supabase.from('technician_monthly').update({goal_att:safe(t.goalAtt),goal_eval:safe(t.goalEval),points:safe(t.points),goals_hit:safe(t.goalsHit),status:t.status,rank:t.rank}).eq('id',t.dbId);if(error)throw error;
    }
    if(m.dbId){const {error}=await state.supabase.from('squad_months').update({team_result:m.teamResult}).eq('id',m.dbId);if(error)throw error;}
  }

  async function deleteImportedMonth(id){
    if(!isAdmin()||!requireSpecificSquad())return;const m=currentMonths()[id];if(!m)return;if(m.isClosed){toast('Mês fechado não pode ser excluído. Reabra-o primeiro.');return}
    if(!await confirmDialog(`Excluir ${m.monthName} ${m.year} do Squad ${state.squadCode}? Isso remove os dados importados e as métricas manuais deste mês.`,{title:'Excluir competência',confirmText:'Excluir mês',tone:'danger'}))return;
    try{if(state.supabase&&m.dbId){const {error}=await state.supabase.from('squad_months').delete().eq('id',m.dbId);if(error)throw error;}delete currentSquad().months[id];const ids=Object.keys(currentMonths()).sort().reverse();state.currentId=ids[0]||null;chooseDefaultTech();saveDemoSquads();refreshSelectors();render();toast('Mês importado excluído.')}catch(err){console.error(err);toast('Não foi possível excluir este mês.')}
  }

  function businessDaysMonFri(y,m){let c=0,days=new Date(y,m,0).getDate();for(let d=1;d<=days;d++){const dow=new Date(y,m-1,d).getDay();if(dow>=1&&dow<=5)c++}return c}
  function autoTeamAttGoal(m){return businessDaysMonFri(m.year,m.month)*10*Math.max(1,m.technicians.length)}
  function teamSettings(m){if(m?.isClosed&&m.closedSnapshot?.teamGoals)return{teamGoalAtt:safe(m.closedSnapshot.teamGoals.teamGoalAtt),teamGoalEvalPct:safe(m.closedSnapshot.teamGoals.teamGoalEvalPct)};const saved=m?.settings||{};return{teamGoalAtt:safe(saved.teamGoalAtt)||autoTeamAttGoal(m),teamGoalEvalPct:Number.isFinite(Number(saved.teamGoalEvalPct))?Number(saved.teamGoalEvalPct):.343}}
  async function saveTeamGoals(){if(!isAdmin()||!requireSpecificSquad())return;const m=currentMonth();if(!m)return;if(m.isClosed){toast('Este mês está fechado. Reabra-o antes de alterar as metas.');return}try{const att=Math.max(0,safe($('#teamGoalAttInput').value)),pct=Math.max(0,safe($('#teamGoalPctInput').value))/100;m.settings={...(m.settings||{}),teamGoalAtt:att||autoTeamAttGoal(m),teamGoalEvalPct:pct};recalculateMonth(m);saveDemoSquads();if(state.supabase){const {error}=await state.supabase.from('squad_months').update({team_goal_att:m.settings.teamGoalAtt,team_goal_eval_pct:m.settings.teamGoalEvalPct,team_result:m.teamResult}).eq('id',m.dbId);if(error)throw error}renderTeam();renderAdmin();toast('Metas salvas para '+m.monthName+'.')}catch(err){console.error(err);toast('Não foi possível salvar as metas.')}}
  function useAutomaticTeamGoal(){const m=currentMonth();if(!m)return;if(m.isClosed){toast('Este mês está fechado. Reabra-o antes de alterar as metas.');return}$('#teamGoalAttInput').value=autoTeamAttGoal(m);if(!$('#teamGoalPctInput').value)$('#teamGoalPctInput').value='34.3';toast('Meta automática calculada. Clique em Salvar metas.')}
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
  let confirmDialogResolver=null;
  function confirmDialog(message,options={}){
    const modal=$('#confirmDialog');if(!modal)return Promise.resolve(false);
    const title=options.title||'Confirmar ação',confirmText=options.confirmText||'Confirmar',cancelText=options.cancelText||'Cancelar',tone=options.tone||'warning';
    $('#confirmDialogTitle').textContent=title;$('#confirmDialogMessage').textContent=message;$('#confirmDialogConfirm').textContent=confirmText;$('#confirmDialogCancel').textContent=cancelText;
    modal.dataset.tone=tone;const icon=$('#confirmDialogIcon');if(icon)icon.textContent=tone==='danger'?'!':tone==='success'?'✓':'?';
    if(confirmDialogResolver){confirmDialogResolver(false);confirmDialogResolver=null}
    openModal('confirmDialog');
    setTimeout(()=>$('#confirmDialogConfirm')?.focus(),0);
    return new Promise(resolve=>{confirmDialogResolver=resolve});
  }
  function settleConfirmDialog(value){const resolve=confirmDialogResolver;confirmDialogResolver=null;closeModal('confirmDialog');if(resolve)resolve(!!value)}
  function openModal(id){$('#'+id).classList.add('open');$('#'+id).setAttribute('aria-hidden','false')}
  function closeModal(id){$('#'+id).classList.remove('open');$('#'+id).setAttribute('aria-hidden','true')}
  function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2800)}

  async function handleCsvFile(e){
    if(!isAdmin())return;const file=e.target.files?.[0];if(!file)return;openModal('importModal');$('#chooseFileBtn').disabled=true;$('#importMessage').textContent='Lendo CSV...';$('#importProgress').style.width='25%';
    try{
      const text=await file.text(),parsed=parseServiceCsv(text);$('#importProgress').style.width='55%';
      if(!state.userDirectoryLoaded)await loadUserDirectory();
      const scopeAll=isSuperAdmin()&&state.squadCode==='all',codes=scopeAll?Object.keys(state.squads):[state.squadCode],allowedBy={};
      // V2.20.3: a situação de login (ativo/inativo) não pode apagar desempenho histórico.
      // Técnicos inativados continuam elegíveis para a importação operacional do CSV.
      // Assim, ao reimportar um mês em que o técnico trabalhou, ele permanece no mês,
      // nas médias do Squad, no status e na pontuação. A inativação bloqueia apenas o acesso.
      for(const code of codes){
        allowedBy[code]=new Set((state.userDirectory||[])
          .filter(u=>u.role==='technician'&&u.squadCode===code&&u.techName)
          .map(u=>nameLinkKey(u.techName)));
        // Também preserva nomes já existentes em competências históricas do Squad,
        // cobrindo movimentações/inativações realizadas depois da importação original.
        const squad=state.squads?.[code];
        for(const monthData of Object.values(squad?.months||{})){
          for(const tech of monthData?.technicians||[])if(tech?.name)allowedBy[code].add(nameLinkKey(tech.name));
        }
      }
      if(!codes.some(code=>allowedBy[code].size))throw new Error(scopeAll?'Cadastre técnicos nos Squads antes de importar o CSV.':`Cadastre os técnicos do Squad ${state.squadCode} em Usuários antes de importar o CSV.`);
      const scopeRows=parsed.rows.filter(r=>codes.includes(r.group)),unmatched=[...new Set(scopeRows.filter(r=>!allowedBy[r.group]?.has(nameLinkKey(r.name))).map(r=>`${r.group}: ${r.name}`))].sort(),rows=scopeRows.filter(r=>allowedBy[r.group]?.has(nameLinkKey(r.name)));
      const months=[...new Set(rows.map(r=>r.id))].sort().reverse();if(!months.length)throw new Error(scopeAll?'O CSV não possui registros que correspondam aos técnicos cadastrados. Confira os vínculos em Usuários.':`O CSV não possui registros que correspondam aos técnicos cadastrados do Squad ${state.squadCode}. Confira o campo Nome do técnico no CSV.`);
      state.pendingCsv={fileName:file.name,rows,ignored:parsed.ignored,total:parsed.total,months,unmatched,scopeAll,codes};
      $('#csvMonthSelect').innerHTML=months.map(id=>{const [y,m]=id.split('-').map(Number);return `<option value="${id}">${MONTHS_PT[m-1]} ${y}</option>`}).join('');
      $('#csvPeriodBlock').classList.remove('hidden');$('#confirmCsvImportBtn').classList.remove('hidden');$('#importMessage').textContent=scopeAll?'CSV reconhecido para importação geral.':`CSV reconhecido para o Squad ${state.squadCode}.`;
      const unmatchedText=unmatched.length?` • <strong>${unmatched.length} vínculo(s) não encontrado(s) ignorado(s)</strong>: ${escapeHtml(unmatched.slice(0,5).join(', '))}${unmatched.length>5?'…':''}`:'';
      $('#importDetails').innerHTML=`<strong>${fmtInt(rows.length)} linhas vinculadas</strong> aos técnicos cadastrados • <strong>${months.length} meses disponíveis</strong>${unmatchedText} • ${fmtInt(parsed.ignored)} linhas inválidas/fora dos Squads A, B, D e E. <span class="muted">Técnicos inativados continuam sendo reconhecidos no histórico quando possuem dados no CSV.</span>`;$('#importProgress').style.width='100%';
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
        const closedCodes=candidates.filter(code=>state.squads[code]?.months?.[id]?.isClosed);if(closedCodes.length)throw new Error(`${MONTHS_PT[month-1]} ${year} está fechado no(s) Squad(s) ${closedCodes.join(', ')}. Reabra o mês antes de importar.`);
        for(const code of candidates){const s=state.squads[code],previous=s.months[id],data=buildMonthFromCsv(pending.rows,id,pending.fileName,previous,code);s.months[id]=data;importedSquads++;importedTechs+=data.technicians.length;if(state.supabase){$('#importMessage').textContent=`Gravando Squad ${code}...`;$('#importProgress').style.width=(55+Math.round(importedSquads/Math.max(1,candidates.length)*40))+'%';await persistImportedMonth(data,s)}}
        saveDemoSquads();state.financeRankingCache={};refreshSelectors();render();state.pendingCsv=null;closeModal('importModal');toast(`${MONTHS_PT[month-1]} ${year}: ${importedSquads} Squads e ${importedTechs} técnicos atualizados.`);
      }else{
        const s=currentSquad(),previous=s.months[id];if(previous?.isClosed)throw new Error(`${MONTHS_PT[month-1]} ${year} está fechado no Squad ${state.squadCode}. Reabra o mês antes de importar.`);const data=buildMonthFromCsv(pending.rows,id,pending.fileName,previous,state.squadCode);s.months[id]=data;state.currentId=id;state.techName=data.technicians[0]?.name||'';saveDemoSquads();
        if(state.supabase){$('#importMessage').textContent='Gravando no banco de dados...';$('#importProgress').style.width='70%';await persistImportedMonth(data,s)}
        state.financeRankingCache={};refreshSelectors();render();state.pendingCsv=null;closeModal('importModal');toast(`${data.monthName} ${data.year} importado: ${data.technicians.length} técnicos.`);
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

  function isOperationalTechnicianRow(t){
    if(!t?.name)return false;
    const key=normalizeName(t.name);
    if(/^(MEDIA|MÉDIA) GRUPO$|^TOTAL GRUPO$|^RESULTADO EQUIPE$|^TOTAL$|^MEDIA$|^MÉDIA$/.test(key))return false;
    return safe(t.att)>0||safe(t.totalEval)>0||safe(t.notes5)+safe(t.notes4)+safe(t.notes3)+safe(t.notes2)+safe(t.notes1)>0;
  }

  function buildMonthFromCsv(rows,id,fileName,previous,squadCode=state.squadCode){
    const selected=rows.filter(r=>r.id===id&&r.group===squadCode);if(!selected.length)throw new Error('Nenhum registro encontrado para o mês selecionado.');
    const [year,month]=id.split('-').map(Number),byTech=new Map();let latest=1;
    for(const r of selected){latest=Math.max(latest,r.day);let t=byTech.get(r.name);if(!t){t={name:r.name,att:0,notes5:0,notes4:0,notes3:0,notes2:0,notes1:0,dailyMap:new Map()};byTech.set(r.name,t)}t.att+=r.att;t.notes5+=r.notes5;t.notes4+=r.notes4;t.notes3+=r.notes3;t.notes2+=r.notes2;t.notes1+=r.notes1;let d=t.dailyMap.get(r.day)||{day:r.day,att:0,notes5:0,off:false};d.att+=r.att;d.notes5+=r.notes5;t.dailyMap.set(r.day,d)}
    const previousTechs=previous?.technicians||[],prevBy=new Map(previousTechs.map(t=>[nameLinkKey(t.name),t])),daysInMonth=new Date(year,month,0).getDate(),presentKeys=new Set([...byTech.keys()].map(nameLinkKey));
    const technicians=[...byTech.values()].map(raw=>{const prev=prevBy.get(nameLinkKey(raw.name))||{};const daily=[];for(let d=1;d<=daysInMonth;d++)daily.push(raw.dailyMap.get(d)||{day:d,att:0,notes5:0,off:new Date(year,month-1,d).getDay()===0});return{dbId:prev.dbId||null,userId:prev.userId||null,name:raw.name,att:raw.att,notes5:raw.notes5,notes4:raw.notes4,notes3:raw.notes3,notes2:raw.notes2,notes1:raw.notes1,totalEval:0,avg:0,evalPct:0,status:prev.status||'',goalsHit:safe(prev.goalsHit),points:safe(prev.points),rank:prev.rank||null,discount:safe(prev.discount),pointBonus:safe(prev.pointBonus),goalAtt:safe(prev.goalAtt),goalEval:safe(prev.goalEval),financeManualBonus:safe(prev.financeManualBonus),salesCommission:safe(prev.salesCommission),vacation:!!prev.vacation,excludeFromGroupCount:!!prev.excludeFromGroupCount,financeData:prev.financeData?clone(prev.financeData):{},daily}});

    // V2.20.4: a média da competência deve representar todos os técnicos que efetivamente
    // tiveram produção naquele mês. Se um técnico já estava gravado na competência e deixa
    // de aparecer em uma extração posterior (ex.: inativação/migração), preservamos o último
    // consolidado daquele mês em vez de removê-lo. Assim B11/I11/J11/K11 não mudam artificialmente.
    for(const prev of previousTechs){
      const key=nameLinkKey(prev.name);if(presentKeys.has(key)||!isOperationalTechnicianRow(prev))continue;
      const preserved=clone(prev);preserved.daily=(prev.daily||[]).map(d=>({...d}));technicians.push(preserved);
      latest=Math.max(latest,...(preserved.daily||[]).filter(d=>safe(d.att)>0||safe(d.notes5)>0).map(d=>safe(d.day)),1);
    }
    technicians.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
    const data={id,month,monthName:MONTHS_PT[month-1],year,sourceFile:fileName,latestDay:latest,importedAt:new Date().toISOString(),teamResult:previous?.teamResult||'',redistributed:safe(previous?.redistributed),settings:previous?.settings?{...previous.settings}:undefined,scoreSettings:previous?.scoreSettings?{...previous.scoreSettings}:{},financeSettings:previous?.financeSettings?clone(previous.financeSettings):clone(DEFAULT_FINANCE_SETTINGS),financeMonthData:previous?.financeMonthData?clone(previous.financeMonthData):{},financeModel:previous?.financeModel||'squad',financeCompare:previous?.financeCompare!==false,financeTechCompare:previous?.financeTechCompare===true,financeIndividualCap:Number.isFinite(Number(previous?.financeIndividualCap))?safe(previous.financeIndividualCap):7000,financeComparison:previous?.financeComparison?clone(previous.financeComparison):{},isClosed:!!previous?.isClosed,closedAt:previous?.closedAt||null,closedBy:previous?.closedBy||null,closedSnapshot:previous?.closedSnapshot?clone(previous.closedSnapshot):{},technicians};recalculateMonth(data);return data;
  }

  function parseCsvRows(text){
    const firstLine=(text.split(/\r?\n/,1)[0]||''),comma=(firstLine.match(/,/g)||[]).length,semi=(firstLine.match(/;/g)||[]).length,delimiter=semi>comma?';':',';const rows=[];let row=[],field='',quoted=false;
    for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){field+='"';i++}else if(c==='"')quoted=false;else field+=c}else if(c==='"')quoted=true;else if(c===delimiter){row.push(field);field=''}else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);field='';if(row.some(v=>String(v).trim()!==''))rows.push(row);row=[]}else field+=c}row.push(field);if(row.some(v=>String(v).trim()!==''))rows.push(row);return rows;
  }
  function normalizeHeader(v){return String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'')}
  function csvNumber(v){if(v==null||String(v).trim()==='')return 0;let s=String(v).trim().replace(/\s/g,'');if(/^[-+]?\d{1,3}(\.\d{3})+,\d+$/.test(s))s=s.replace(/\./g,'').replace(',','.');else if(/^[-+]?\d+,\d+$/.test(s))s=s.replace(',','.');const n=Number(s);return Number.isFinite(n)?n:0}
  function parseCsvDate(v){const m=String(v||'').trim().match(/^(\d{4})-(\d{2})-(\d{2})/);if(!m)return null;const year=Number(m[1]),month=Number(m[2]),day=Number(m[3]);if(month<1||month>12||day<1||day>31)return null;return{year,month,day}}
  function cleanNameWhitespace(s){
    return String(s||'')
      .replace(/[\u200B-\u200D\u2060\uFEFF]/g,'')
      .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g,' ')
      .trim()
      .replace(/\s+/g,' ');
  }
  function normalizeName(s){return cleanNameWhitespace(s).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
  function nameLinkKey(s){return normalizeName(s).replace(/\s+/g,'')}
  function samePersonName(a,b){return nameLinkKey(a)===nameLinkKey(b)}

  function audioPrefsKey(){const who=state.user?.userId||state.user?.email||'browser';return `softenPerformanceAudioV1:${who}`}
  function loadAudioPrefs(){try{return JSON.parse(localStorage.getItem(audioPrefsKey())||'{}')||{}}catch(e){return {}}}
  function saveAudioPrefs(patch){const next={...loadAudioPrefs(),...patch};try{localStorage.setItem(audioPrefsKey(),JSON.stringify(next))}catch(e){}return next}
  function sanitizeThemeAudio(v){if(!v)return null;const s=String(v).trim();return /^(data:audio\/(mpeg|mp3|ogg|wav|x-wav|mp4|m4a|aac);base64,|https?:\/\/|assets\/)/i.test(s)?s:null}
  function themeAudioConfig(theme=state.theme){const t=theme||DEFAULT_THEME,hasTrack=Object.prototype.hasOwnProperty.call(t,'soundtrack');return{src:sanitizeThemeAudio(hasTrack?t.soundtrack:DEFAULT_SOUNDTRACK),name:t.soundtrackName||DEFAULT_SOUNDTRACK_NAME,volume:clamp(Number(t.soundtrackVolume??.24),0,1)}}
  function initializeThemeAudio(){
    applySoundtrack(state.theme,{preservePlayback:false});
    const cfg=themeAudioConfig(),prefs=loadAudioPrefs();
    if(!cfg.src)return;
    if(prefs.chosen!==true){showSoundWelcome();return;}
    if(prefs.enabled!==false){state.audio.pendingResume=true;syncSoundPlayerUi();armSoundResumeOnGesture();}
  }
  function showSoundWelcome(){const cfg=themeAudioConfig();if(!cfg.src)return;const el=$('#soundWelcome');if(!el)return;$('#soundWelcomeTrackName').textContent=cfg.name;el.classList.remove('hidden')}
  function hideSoundWelcome(){const el=$('#soundWelcome');if(el)el.classList.add('hidden')}
  async function chooseSoundWelcome(withSound){saveAudioPrefs({chosen:true,enabled:!!withSound});hideSoundWelcome();if(withSound){await playThemeAudio(true)}else{pauseThemeAudio();syncSoundPlayerUi()}}
  function armSoundResumeOnGesture(){
    if(!state.audio.pendingResume)return;
    const resume=async e=>{if(e?.target?.closest?.('#soundPlayer,#soundWelcome,#themeModal'))return;document.removeEventListener('pointerdown',resume,true);document.removeEventListener('keydown',resume,true);if(loadAudioPrefs().enabled!==false)await playThemeAudio(false)};
    document.addEventListener('pointerdown',resume,true);document.addEventListener('keydown',resume,true);
  }
  function applySoundtrack(theme,{preservePlayback=true}={}){
    const audio=$('#themeAudio'),player=$('#soundPlayer');if(!audio||!player)return;
    if(state.audio.previewing){state.audio.previewing=false;state.audio.previewBefore=null;if($('#previewSoundtrackBtn'))$('#previewSoundtrackBtn').textContent='▶ Ouvir trilha';}
    const cfg=themeAudioConfig(theme),wasPlaying=!audio.paused&&!!audio.src;
    player.classList.toggle('hidden',!cfg.src);
    if(!cfg.src){pauseThemeAudio();audio.removeAttribute('src');audio.load();state.audio.source=null;syncSoundPlayerUi();return;}
    if(state.audio.source!==cfg.src){audio.pause();audio.src=cfg.src;audio.load();state.audio.source=cfg.src;}
    const prefs=loadAudioPrefs();audio.volume=clamp(prefs.volume!=null?Number(prefs.volume):cfg.volume,0,1);audio.muted=!!prefs.muted;
    if($('#soundVolume'))$('#soundVolume').value=Math.round(audio.volume*100);
    if(preservePlayback&&wasPlaying&&prefs.enabled!==false)playThemeAudio(false);else syncSoundPlayerUi();
  }
  function preferredAudioVolume(){const prefs=loadAudioPrefs(),cfg=themeAudioConfig();return clamp(prefs.volume!=null?Number(prefs.volume):cfg.volume,0,1)}
  function cancelAudioFade(){if(state.audio.fadeTimer){clearInterval(state.audio.fadeTimer);state.audio.fadeTimer=null}}
  function fadeAudioTo(target,duration=2200){const audio=$('#themeAudio');if(!audio)return;cancelAudioFade();const from=safe(audio.volume),to=clamp(target,0,1),started=performance.now();state.audio.fadeTimer=setInterval(()=>{const pct=Math.min(1,(performance.now()-started)/duration),eased=1-Math.pow(1-pct,3);audio.volume=from+(to-from)*eased;if(pct>=1)cancelAudioFade()},45)}
  async function playThemeAudio(userGesture=false){
    const audio=$('#themeAudio'),cfg=themeAudioConfig();if(!audio||!cfg.src)return;
    if(state.audio.source!==cfg.src)applySoundtrack(state.theme,{preservePlayback:false});
    const targetVolume=preferredAudioVolume();cancelAudioFade();audio.volume=0;
    try{await audio.play();state.audio.playing=true;state.audio.pendingResume=false;saveAudioPrefs({chosen:true,enabled:true});if(!audio.muted)fadeAudioTo(targetVolume,2400);else audio.volume=targetVolume;syncSoundPlayerUi();}
    catch(err){audio.volume=targetVolume;state.audio.playing=false;state.audio.pendingResume=true;syncSoundPlayerUi();if(userGesture)toast('O navegador bloqueou o áudio. Clique novamente em reproduzir.');}
  }
  function pauseThemeAudio(){const audio=$('#themeAudio');cancelAudioFade();if(audio)audio.pause();state.audio.playing=false;state.audio.pendingResume=false;syncSoundPlayerUi()}
  function stopThemeAudio(){const audio=$('#themeAudio');cancelAudioFade();if(audio){audio.pause();try{audio.currentTime=0}catch(e){}}state.audio.playing=false;state.audio.pendingResume=false;hideSoundWelcome();syncSoundPlayerUi()}
  async function toggleSoundPlayback(){const audio=$('#themeAudio');if(!audio?.src)return;if(audio.paused){await playThemeAudio(true)}else{pauseThemeAudio();saveAudioPrefs({enabled:false})}}
  function toggleSoundMute(){const audio=$('#themeAudio');if(!audio)return;audio.muted=!audio.muted;saveAudioPrefs({muted:audio.muted});syncSoundPlayerUi()}
  function handleSoundVolume(e){const audio=$('#themeAudio');if(!audio)return;cancelAudioFade();audio.volume=clamp(safe(e.target.value)/100,0,1);if(audio.volume>0&&audio.muted)audio.muted=false;saveAudioPrefs({volume:audio.volume,muted:audio.muted});syncSoundPlayerUi()}
  function syncSoundPlayerUi(){
    const audio=$('#themeAudio'),cfg=themeAudioConfig();if($('#soundPlayerName'))$('#soundPlayerName').textContent=cfg.name||'Trilha do tema';if($('#soundWelcomeTrackName'))$('#soundWelcomeTrackName').textContent=cfg.name||'Trilha do tema';
    const playing=!!audio&&!!audio.src&&!audio.paused;state.audio.playing=playing;if($('#soundToggleBtn')){$('#soundToggleBtn').textContent=playing?'❚❚':'▶';$('#soundToggleBtn').setAttribute('aria-label',playing?'Pausar trilha':'Reproduzir trilha')}
    if($('#soundMuteBtn')){$('#soundMuteBtn').textContent=audio?.muted?'🔇':'🔊';$('#soundMuteBtn').setAttribute('aria-label',audio?.muted?'Ativar som':'Silenciar trilha')}
    if($('#soundPlayerStatus'))$('#soundPlayerStatus').textContent=playing?(audio?.muted?'Reproduzindo • silenciado':'Reproduzindo em ambiente'):state.audio.pendingResume?'Clique no painel para iniciar':'Trilha pausada';
  }
  function handleSoundtrackFile(e){
    if(!isAdmin())return;const f=e.target.files?.[0];if(!f)return;
    const ok=/^audio\/(mpeg|mp3|ogg|wav|x-wav|mp4|m4a|aac)$/i.test(f.type||'')||/\.(mp3|ogg|wav|m4a|aac)$/i.test(f.name||'');if(!ok){toast('Use MP3, OGG, WAV, M4A ou AAC.');e.target.value='';return}
    if(f.size>3*1024*1024){toast('Use uma trilha de até 3 MB para manter o tema leve.');e.target.value='';return}
    const reader=new FileReader();reader.onload=()=>{state.theme.soundtrack=reader.result;state.theme.soundtrackName=(f.name||DEFAULT_SOUNDTRACK_NAME).replace(/\.[^.]+$/,'');state.theme.soundtrackVolume=state.theme.soundtrackVolume??.24;state.theme.preset='custom';saveTheme();applySoundtrack(state.theme,{preservePlayback:false});if($('#soundtrackNameInput'))$('#soundtrackNameInput').value=state.theme.soundtrackName;toast('Trilha do tema atualizada.')};reader.readAsDataURL(f);e.target.value='';
  }
  async function previewThemeSoundtrack(){
    const cfg=themeAudioConfig();if(!cfg.src){toast('Nenhuma trilha configurada neste tema.');return}
    const audio=$('#themeAudio');if(!audio)return;
    if(state.audio.previewing){cancelAudioFade();audio.pause();const before=state.audio.previewBefore||{};audio.volume=before.volume??preferredAudioVolume();audio.muted=!!before.muted;try{audio.currentTime=before.currentTime??0}catch(e){}state.audio.previewing=false;state.audio.previewBefore=null;if($('#previewSoundtrackBtn'))$('#previewSoundtrackBtn').textContent='▶ Ouvir trilha';if(before.wasPlaying)await playThemeAudio(true);else syncSoundPlayerUi();return}
    state.audio.previewBefore={volume:audio.volume,muted:audio.muted,wasPlaying:!audio.paused,currentTime:safe(audio.currentTime)};state.audio.previewing=true;cancelAudioFade();audio.pause();try{audio.currentTime=0}catch(e){}audio.volume=0;audio.muted=false;try{await audio.play();fadeAudioTo(cfg.volume,1500);if($('#previewSoundtrackBtn'))$('#previewSoundtrackBtn').textContent='❚❚ Pausar prévia';syncSoundPlayerUi()}catch(e){state.audio.previewing=false;state.audio.previewBefore=null;audio.volume=preferredAudioVolume();toast('Clique novamente para permitir a reprodução do áudio.')}
  }
  function resetSoundtrack(){if(!isAdmin())return;state.theme.soundtrack=DEFAULT_SOUNDTRACK;state.theme.soundtrackName=DEFAULT_SOUNDTRACK_NAME;state.theme.soundtrackVolume=.24;state.theme.preset='custom';saveTheme();applyTheme(state.theme);toast('Trilha original restaurada.')}
  function removeSoundtrack(){if(!isAdmin())return;state.theme.soundtrack=null;state.theme.soundtrackName='';state.theme.preset='custom';saveTheme();applyTheme(state.theme);toast('Trilha removida deste tema.')}

  function normalizeThemePayload(theme){const t=clone(theme||DEFAULT_THEME);if(t.preset==='vermithor'||(!t.preset&&(!t.campaignTitle||t.campaignTitle==='Dragão Vermithor'))){if(!t.name||t.name==='Vermithor')t.name='Casa do Dragão';if(!t.campaignTitle||t.campaignTitle==='Dragão Vermithor')t.campaignTitle='Casa do Dragão';if(!t.campaignTagline||t.campaignTagline==='Transforme números em conquista.')t.campaignTagline='Unifique os squads, mantenha o fogo das metas e avance o reino dos resultados.';}if(!t.favicon)t.favicon=DEFAULT_FAVICON;if(!Object.prototype.hasOwnProperty.call(t,'soundtrack'))t.soundtrack=DEFAULT_SOUNDTRACK;if(!t.soundtrackName&&t.soundtrack)t.soundtrackName=DEFAULT_SOUNDTRACK_NAME;if(t.soundtrackVolume==null)t.soundtrackVolume=.24;return t}
  function applyPreset(name){if(!isAdmin())return;const presets={vermithor:clone(DEFAULT_THEME),soften:{name:'Soften',campaignTitle:'Soften Performance',campaignTagline:'Tecnologia que impulsiona resultados.',preset:'soften',accent:'#20b7f5',secondary:'#176bd3',bg:'#06111f',bg2:'#0a2035',panel:'rgba(8,24,40,.9)',text:'#f3f8fc',background:null,favicon:DEFAULT_FAVICON,soundtrack:DEFAULT_SOUNDTRACK,soundtrackName:DEFAULT_SOUNDTRACK_NAME,soundtrackVolume:.24,opacity:.18},neon:{name:'Neon',campaignTitle:'Squad Neon',campaignTagline:'Acelere. Evolua. Conquiste.',preset:'neon',accent:'#c05cff',secondary:'#21dbc9',bg:'#090514',bg2:'#151029',panel:'rgba(23,15,42,.9)',text:'#faf5ff',background:null,favicon:DEFAULT_FAVICON,soundtrack:DEFAULT_SOUNDTRACK,soundtrackName:DEFAULT_SOUNDTRACK_NAME,soundtrackVolume:.24,opacity:.18},clean:{name:'Claro',campaignTitle:'Performance',campaignTagline:'Clareza para acompanhar cada resultado.',preset:'clean',accent:'#3157d5',secondary:'#6a7be8',bg:'#e9eef5',bg2:'#f7f9fc',panel:'rgba(255,255,255,.91)',text:'#172033',background:null,favicon:DEFAULT_FAVICON,soundtrack:DEFAULT_SOUNDTRACK,soundtrackName:DEFAULT_SOUNDTRACK_NAME,soundtrackVolume:.24,opacity:.06}};state.theme=presets[name]||presets.vermithor;saveTheme();applyTheme(state.theme);toast(`Tema ${state.theme.name} aplicado.`)}
  function applyTheme(t){t=normalizeThemePayload(t||DEFAULT_THEME);const r=document.documentElement.style;if(t.accent)r.setProperty('--accent',t.accent);if(t.secondary)r.setProperty('--accent2',t.secondary);if(t.bg)r.setProperty('--bg',t.bg);if(t.bg2)r.setProperty('--bg2',t.bg2);if(t.panel)r.setProperty('--panel',t.panel);if(t.text)r.setProperty('--text',t.text);if(t.opacity!=null)r.setProperty('--hero-opacity',t.opacity);const safeBg=sanitizeThemeBackground(t.background),bg=safeBg?`url("${safeBg}")`:t.preset==='vermithor'?"url('assets/vermithor.png')":'none';r.setProperty('--hero-img',bg);if($('#accentColor'))$('#accentColor').value=t.accent||'#f0a33a';if($('#secondaryColor'))$('#secondaryColor').value=t.secondary||'#ef5a29';const fallbackTitle=t.preset==='vermithor'?'Casa do Dragão':(t.name||`Squad ${state.squadCode}`),fallbackTagline=t.preset==='vermithor'?'Unifique os squads, mantenha o fogo das metas e avance o reino dos resultados.':'Acompanhe, evolua e conquiste.';if($('#campaignNameInput'))$('#campaignNameInput').value=t.campaignTitle||fallbackTitle;if($('#campaignTaglineInput'))$('#campaignTaglineInput').value=t.campaignTagline||fallbackTagline;applyFavicon(t.favicon);if($('#soundtrackNameInput'))$('#soundtrackNameInput').value=t.soundtrackName||'';if($('#soundtrackDefaultVolume'))$('#soundtrackDefaultVolume').value=Math.round(clamp(Number(t.soundtrackVolume??.24),0,1)*100);if($('#soundtrackDefaultVolumeLabel'))$('#soundtrackDefaultVolumeLabel').textContent=`${Math.round(clamp(Number(t.soundtrackVolume??.24),0,1)*100)}%`;applySoundtrack(t);updateThemeName()}
  function updateThemeName(){if($('#themeName'))$('#themeName').textContent=state.theme?.name||state.theme?.campaignTitle||'Personalizado'}
  function handleBackground(e){if(!isAdmin())return;const f=e.target.files?.[0];if(!f)return;if(f.size>5*1024*1024){toast('Use uma imagem de até 5 MB.');return}const reader=new FileReader();reader.onload=()=>{state.theme.background=reader.result;state.theme.name=$('#campaignNameInput').value||'Personalizado';state.theme.campaignTitle=$('#campaignNameInput').value||state.theme.campaignTitle||`Squad ${state.squadCode}`;state.theme.campaignTagline=$('#campaignTaglineInput').value||state.theme.campaignTagline||'';state.theme.preset='custom';saveTheme();applyTheme(state.theme);toast('Fundo atualizado.')};reader.readAsDataURL(f)}
  function sanitizeThemeBackground(v){if(!v)return null;const s=String(v).trim();return/^(data:image\/(png|jpeg|jpg|webp|gif);base64,|https?:\/\/|assets\/)/i.test(s)?s:null}
  function applyFavicon(value){
    const safe=sanitizeThemeBackground(value)||DEFAULT_FAVICON;
    let link=$('#appFavicon');
    if(!link){link=document.createElement('link');link.id='appFavicon';link.rel='icon';link.type='image/png';document.head.appendChild(link)}
    link.href=safe;
    if($('#faviconPreview'))$('#faviconPreview').src=safe;
  }
  function handleFavicon(e){
    if(!isAdmin())return;const f=e.target.files?.[0];if(!f)return;
    if(!/^image\/(png|jpeg|jpg|webp|gif)$/i.test(f.type||'')){toast('Use PNG, JPG, WEBP ou GIF para o favicon.');e.target.value='';return}
    if(f.size>750*1024){toast('Use um favicon de até 750 KB.');e.target.value='';return}
    const reader=new FileReader();reader.onload=()=>{state.theme.favicon=reader.result;state.theme.preset='custom';saveTheme();applyFavicon(state.theme.favicon);toast('Favicon do tema atualizado.')};reader.readAsDataURL(f);
  }
  function resetFavicon(){if(!isAdmin())return;state.theme.favicon=DEFAULT_FAVICON;state.theme.preset='custom';if($('#faviconFile'))$('#faviconFile').value='';saveTheme();applyFavicon(DEFAULT_FAVICON);toast('Favicon padrão do dragão restaurado.')}
  function themePayload(){return{schema:'squad-theme-v1',name:state.theme.name||'Personalizado',campaignTitle:state.theme.campaignTitle||state.theme.name||`Squad ${state.squadCode}`,campaignTagline:state.theme.campaignTagline||'',accent:state.theme.accent||'#f0a33a',secondary:state.theme.secondary||'#ef5a29',bg:state.theme.bg||'#080b12',bg2:state.theme.bg2||'#10141e',panel:state.theme.panel||'rgba(17,22,31,.88)',text:state.theme.text||'#f5f6f8',background:state.theme.background||null,favicon:state.theme.favicon||DEFAULT_FAVICON,soundtrack:Object.prototype.hasOwnProperty.call(state.theme,'soundtrack')?state.theme.soundtrack:DEFAULT_SOUNDTRACK,soundtrackName:state.theme.soundtrackName||'',soundtrackVolume:clamp(Number(state.theme.soundtrackVolume??.24),0,1),opacity:state.theme.opacity??.28}}
  function downloadJson(obj,name){const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  function exportTheme(){if(!isAdmin()||!requireSpecificSquad())return;downloadJson(themePayload(),`tema-squad-${state.squadCode.toLowerCase()}.json`);toast('Tema exportado em JSON.')}
  async function handleThemeJson(e){if(!isAdmin())return;const f=e.target.files?.[0];if(!f)return;try{const raw=JSON.parse(await f.text());if(raw.schema!=='squad-theme-v1')throw new Error('Arquivo de tema incompatível.');const theme={...raw,preset:'custom'};delete theme.schema;delete theme._instrucoes;if(theme.background&&!sanitizeThemeBackground(theme.background))throw new Error('Fundo inválido.');if(theme.favicon&&!sanitizeThemeBackground(theme.favicon))throw new Error('Favicon inválido.');if(theme.soundtrack&&!sanitizeThemeAudio(theme.soundtrack))throw new Error('Trilha sonora inválida.');state.theme=theme;saveTheme();applyTheme(state.theme);toast('Tema importado e aplicado.')}catch(err){toast(err.message||'Não foi possível importar o tema.')}finally{e.target.value=''}}

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
    const {data:profile,error}=await state.supabase.from('profiles').select('user_id,email,full_name,role,organization_id,squad_id,technician_name,squads(id,code,name)').eq('user_id',authUser.id).single();if(error)throw error;
    state.user={userId:authUser.id,email:profile.email||authUser.email,fullName:profile.full_name,role:profile.role,organizationId:profile.organization_id||null,squadCode:profile.squads?.code||null,techName:profile.technician_name?normalizeName(profile.technician_name):null};
    await loadSupabaseData();await enterApp(state.user);
  }
  async function loadSupabaseData(){
    const {data:squads,error}=await state.supabase.from('squads').select('id,code,name').eq('active',true).order('code');if(error)throw error;state.squads={};state.orgOverview=[];state.orgTechnicianOverview=[];state.orgDailyOverview=[];
    for(const s of squads){state.squads[s.code]={code:s.code,name:s.name,dbId:s.id,months:{}};const {data:themes}=await state.supabase.from('squad_themes').select('theme').eq('squad_id',s.id).maybeSingle();if(themes?.theme)state.squads[s.code].theme=themes.theme;const {data:months,error:me}=await state.supabase.from('squad_months').select('id,year,month,source_file,latest_day,imported_at,team_result,redistributed,team_goal_att,team_goal_eval_pct,score_settings,finance_settings,finance_month_data,finance_model,finance_compare,finance_technician_compare,finance_individual_cap,finance_comparison_snapshot,is_closed,closed_at,closed_by,closed_snapshot,technician_monthly(id,user_id,technician_name,att,notes5,notes4,notes3,notes2,notes1,total_eval,avg_rating,eval_pct,status,goals_hit,points,rank,discount,point_bonus,goal_att,goal_eval,technician_finance_monthly(id,manual_bonus,sales_commission,vacation,exclude_from_group_count,calculated),daily_metrics(day,att,notes5,off))').eq('squad_id',s.id).order('year',{ascending:false}).order('month',{ascending:false});if(me)throw me;for(const row of months||[]){const id=`${row.year}-${String(row.month).padStart(2,'0')}`,technicians=(row.technician_monthly||[]).map(t=>({dbId:t.id,userId:t.user_id,name:t.technician_name,att:safe(t.att),notes5:safe(t.notes5),notes4:safe(t.notes4),notes3:safe(t.notes3),notes2:safe(t.notes2),notes1:safe(t.notes1),totalEval:safe(t.total_eval),avg:safe(t.avg_rating),evalPct:safe(t.eval_pct),status:t.status||'',goalsHit:safe(t.goals_hit),points:safe(t.points),rank:safe(t.rank)||null,discount:safe(t.discount),pointBonus:safe(t.point_bonus),goalAtt:safe(t.goal_att),goalEval:safe(t.goal_eval),financeDbId:firstRelation(t.technician_finance_monthly).id||null,financeManualBonus:safe(firstRelation(t.technician_finance_monthly).manual_bonus),salesCommission:safe(firstRelation(t.technician_finance_monthly).sales_commission),vacation:!!firstRelation(t.technician_finance_monthly).vacation,excludeFromGroupCount:!!firstRelation(t.technician_finance_monthly).exclude_from_group_count,financeData:firstRelation(t.technician_finance_monthly).calculated||{},daily:(t.daily_metrics||[]).map(d=>({day:d.day,att:safe(d.att),notes5:safe(d.notes5),off:!!d.off})).sort((a,b)=>a.day-b.day)}));const totals=deriveTotals(technicians);const monthData={dbId:row.id,id,year:row.year,month:row.month,monthName:MONTHS_PT[row.month-1],sourceFile:row.source_file||'Supabase',latestDay:row.latest_day||1,importedAt:row.imported_at,teamResult:row.team_result||'',redistributed:safe(row.redistributed),teamTotals:totals,settings:{teamGoalAtt:safe(row.team_goal_att),teamGoalEvalPct:Number(row.team_goal_eval_pct??.343)},scoreSettings:row.score_settings||{},financeSettings:row.finance_settings&&Object.keys(row.finance_settings).length?row.finance_settings:clone(DEFAULT_FINANCE_SETTINGS),financeMonthData:row.finance_month_data||{},financeModel:(row.is_closed&&safe(row.closed_snapshot?.version)<3)?'individual':(row.finance_model||'squad'),financeCompare:row.finance_compare!==false,financeTechCompare:row.finance_technician_compare===true,financeIndividualCap:Number.isFinite(Number(row.finance_individual_cap))?safe(row.finance_individual_cap):7000,financeComparison:row.finance_comparison_snapshot||{},isClosed:!!row.is_closed,closedAt:row.closed_at||null,closedBy:row.closed_by||null,closedSnapshot:row.closed_snapshot||{},technicians};recalculateMonth(monthData);state.squads[s.code].months[id]=monthData}}
    state.superAdminCommissions=[];
    if(isSuperAdmin()){
      try{
        const {data:comms,error:ce}=await state.supabase.from('super_admin_commissions').select('id,user_id,year,month,amount,notes').order('year',{ascending:false}).order('month',{ascending:false});if(ce)throw ce;
        const {data:admins}=await state.supabase.from('profiles').select('user_id,full_name,email').eq('role','super_admin');const names=new Map((admins||[]).map(a=>[a.user_id,a.full_name||a.email||'Admin geral']));
        state.superAdminCommissions=(comms||[]).map(c=>({...c,name:names.get(c.user_id)||'Admin geral',amount:safe(c.amount)}));
      }catch(err){console.warn('Comissões de Admin Geral indisponíveis. Confira a migração financeira V2.18.0.',err);}
    }
    try{
      const {data:overview,error:overviewError}=await state.supabase.rpc('get_org_squad_monthly_overview');
      if(overviewError)throw overviewError;
      state.orgOverview=(overview||[]).map(r=>({squadCode:r.squad_code,squadName:r.squad_name,id:`${r.year}-${String(r.month).padStart(2,'0')}`,year:safe(r.year),month:safe(r.month),totalAtt:safe(r.total_att),totalEval:safe(r.total_eval),evalPct:safe(r.eval_pct),technicianCount:safe(r.technician_count)}));
    }catch(err){console.warn('Visão consolidada por Squad indisponível; usando dados já permitidos pela sessão.',err);state.orgOverview=buildOrgOverviewFromState();}
    try{
      const {data:techOverview,error:techOverviewError}=await state.supabase.rpc('get_org_technician_monthly_overview');
      if(techOverviewError)throw techOverviewError;
      state.orgTechnicianOverview=(techOverview||[]).map(r=>({
        squadCode:r.squad_code,squadName:r.squad_name,id:`${r.year}-${String(r.month).padStart(2,'0')}`,year:safe(r.year),month:safe(r.month),
        technicianName:r.technician_name||'',att:safe(r.att),totalEval:safe(r.total_eval),avg:safe(r.avg_rating),evalPct:safe(r.eval_pct),points:safe(r.points),status:String(r.status||'').toUpperCase()
      }));
    }catch(err){console.warn('Visão geral dos técnicos indisponível; usando apenas os dados permitidos pela sessão.',err);state.orgTechnicianOverview=buildOrgTechnicianOverviewFromState();}
    try{
      const {data:dailyOverview,error:dailyOverviewError}=await state.supabase.rpc('get_org_daily_attendance_overview');
      if(dailyOverviewError)throw dailyOverviewError;
      state.orgDailyOverview=(dailyOverview||[]).map(r=>({squadCode:r.squad_code,id:`${r.year}-${String(r.month).padStart(2,'0')}`,year:safe(r.year),month:safe(r.month),day:safe(r.day),totalAtt:safe(r.total_att)}));
    }catch(err){console.warn('Consolidado diário do setor indisponível; usando apenas os dados permitidos pela sessão.',err);state.orgDailyOverview=buildOrgDailyOverviewFromState();}
  }
  function periodWithinHistory(row,year,month){const key=year*100+month,from=safe(row.valid_from_year)*100+safe(row.valid_from_month),to=row.valid_to_year?safe(row.valid_to_year)*100+safe(row.valid_to_month):999999;return key>=from&&key<=to}
  async function userMapForSquadPeriod(squad,m){
    const userMap={};
    if(!state.supabase||!squad?.dbId)return userMap;
    try{const {data:history,error}=await state.supabase.from('profile_squad_history').select('user_id,technician_name,valid_from_year,valid_from_month,valid_to_year,valid_to_month').eq('squad_id',squad.dbId);if(error)throw error;(history||[]).filter(h=>h.technician_name&&periodWithinHistory(h,m.year,m.month)).forEach(h=>userMap[nameLinkKey(h.technician_name)]=h.user_id)}catch(err){console.warn('Histórico de movimentação indisponível; usando perfil atual.',err)}
    const {data:profiles,error:pe}=await state.supabase.from('profiles').select('user_id,technician_name').eq('squad_id',squad.dbId);if(pe)throw pe;(profiles||[]).forEach(p=>{if(p.technician_name){const key=nameLinkKey(p.technician_name);if(!userMap[key])userMap[key]=p.user_id}});
    return userMap;
  }
  async function persistImportedMonth(m,squad){
    const payload={squad_id:squad.dbId,year:m.year,month:m.month,source_file:m.sourceFile,latest_day:m.latestDay,team_result:m.teamResult,redistributed:m.redistributed,team_goal_att:m.settings?.teamGoalAtt||autoTeamAttGoal(m),team_goal_eval_pct:m.settings?.teamGoalEvalPct??.343,score_settings:m.scoreSettings||{},finance_settings:financeSettingsForMonth(m),finance_month_data:m.financeMonthData||{},finance_model:financeModelForMonth(m),finance_compare:m.financeCompare!==false,finance_technician_compare:m.financeTechCompare===true,finance_individual_cap:Number.isFinite(Number(m.financeIndividualCap))?safe(m.financeIndividualCap):7000,finance_comparison_snapshot:m.financeComparison||{},imported_by:state.user.userId,imported_at:new Date().toISOString()};
    const {data:monthRow,error}=await state.supabase.from('squad_months').upsert(payload,{onConflict:'squad_id,year,month'}).select('id').single();if(error)throw error;m.dbId=monthRow.id;
    const userMap=await userMapForSquadPeriod(squad,m);
    const {data:existing,error:ee}=await state.supabase.from('technician_monthly').select('id,technician_name').eq('squad_month_id',monthRow.id);if(ee)throw ee;const keepNames=new Set();
    for(const t of m.technicians){
      keepNames.add(nameLinkKey(t.name));
      const row={squad_month_id:monthRow.id,user_id:userMap[nameLinkKey(t.name)]||null,technician_name:t.name,att:t.att,notes5:t.notes5,notes4:t.notes4,notes3:t.notes3,notes2:t.notes2,notes1:t.notes1,total_eval:t.totalEval,avg_rating:t.avg,eval_pct:t.evalPct,status:t.status,goals_hit:t.goalsHit,points:t.points,rank:t.rank,discount:t.discount,point_bonus:t.pointBonus,goal_att:t.goalAtt,goal_eval:t.goalEval};
      const {data:tm,error:te}=await state.supabase.from('technician_monthly').upsert(row,{onConflict:'squad_month_id,technician_name'}).select('id').single();if(te)throw te;t.dbId=tm.id;
      const financeRow={technician_month_id:tm.id,manual_bonus:safe(t.financeManualBonus),sales_commission:safe(t.salesCommission),vacation:!!t.vacation,exclude_from_group_count:!!t.excludeFromGroupCount,calculated:t.financeData||{},updated_by:state.user.userId,updated_at:new Date().toISOString()};const {error:tfe}=await state.supabase.from('technician_finance_monthly').upsert(financeRow,{onConflict:'technician_month_id'});if(tfe)throw tfe;
      const {error:dd}=await state.supabase.from('daily_metrics').delete().eq('technician_month_id',tm.id);if(dd)throw dd;
      const daily=(t.daily||[]).map(d=>({technician_month_id:tm.id,day:d.day,att:d.att,notes5:d.notes5,off:!!d.off}));if(daily.length){const {error:de}=await state.supabase.from('daily_metrics').insert(daily);if(de)throw de}
    }
    for(const old of existing||[]){if(!keepNames.has(nameLinkKey(old.technician_name))){const {error:se}=await state.supabase.from('technician_monthly').delete().eq('id',old.id);if(se)throw se}}
  }
  async function persistThemeToSupabase(){const squad=currentSquad();if(!state.supabase||!squad?.dbId)return;const {error}=await state.supabase.from('squad_themes').upsert({squad_id:squad.dbId,theme:themePayload(),updated_by:state.user.userId,updated_at:new Date().toISOString()},{onConflict:'squad_id'});if(error)throw error;squad.theme=clone(state.theme)}

  function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  boot();
})();
