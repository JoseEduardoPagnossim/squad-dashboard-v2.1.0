import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {status,headers:{...corsHeaders,'Content-Type':'application/json; charset=utf-8'}})
const normalizeTech = (value: unknown) => String(value ?? '').normalize('NFKC').replace(/[\u200B-\u200D\u2060\uFEFF]/g,'').replace(/\s+/g,' ').trim().toUpperCase()
const linkKey = (value: unknown) => normalizeTech(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'')
const periodKey = (year:number,month:number)=>year*100+month
const previousPeriod = (year:number,month:number)=>month===1?{year:year-1,month:12}:{year,month:month-1}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)
  try {
    const supabaseUrl=Deno.env.get('SUPABASE_URL'), serviceRoleKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if(!supabaseUrl||!serviceRoleKey)return json({error:'Configuração do servidor incompleta.'},500)
    const authHeader=req.headers.get('Authorization')||'',token=authHeader.startsWith('Bearer ')?authHeader.slice(7):''
    if(!token)return json({error:'Sessão não encontrada.'},401)
    const admin=createClient(supabaseUrl,serviceRoleKey,{auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}})
    const {data:authData,error:authError}=await admin.auth.getUser(token)
    if(authError||!authData.user)return json({error:'Sessão inválida.'},401)
    const {data:requester}=await admin.from('profiles').select('user_id,organization_id,squad_id,role,active').eq('user_id',authData.user.id).eq('active',true).single()
    if(!requester||!['super_admin','squad_admin'].includes(requester.role))return json({error:'Sem permissão para gerenciar usuários.'},403)

    const body=await req.json(),action=String(body.action||''),targetId=String(body.user_id||'')
    if(!targetId)return json({error:'Usuário não informado.'},400)
    if(targetId===requester.user_id)return json({error:'Não é permitido alterar, inativar ou excluir o próprio acesso por esta tela.'},403)
    const {data:target,error:targetError}=await admin.from('profiles').select('user_id,organization_id,squad_id,full_name,email,role,technician_name,active,created_at').eq('user_id',targetId).single()
    if(targetError||!target||target.organization_id!==requester.organization_id)return json({error:'Usuário não encontrado no seu escopo.'},404)
    if(requester.role==='squad_admin'&&(target.role!=='technician'||target.squad_id!==requester.squad_id))return json({error:'Admin do Squad pode gerenciar somente técnicos do próprio Squad.'},403)

    if(action==='delete'){
      if(target.role==='super_admin')return json({error:'Administradores gerais não podem ser excluídos por esta tela.'},403)
      const {error}=await admin.auth.admin.deleteUser(targetId)
      if(error)return json({error:error.message||'Não foi possível excluir o usuário.'},400)
      return json({ok:true,deleted_user_id:targetId})
    }

    if(action==='set_active'){
      if(target.role==='super_admin')return json({error:'Administradores gerais não podem ser inativados por esta tela.'},403)
      const active=body.active===true
      const {error:authUpdateError}=await admin.auth.admin.updateUserById(targetId,{ban_duration:active?'none':'876000h'})
      if(authUpdateError)return json({error:authUpdateError.message||'Não foi possível alterar o acesso no Authentication.'},400)
      const {error:profileError}=await admin.from('profiles').update({active,updated_at:new Date().toISOString()}).eq('user_id',targetId)
      if(profileError){
        await admin.auth.admin.updateUserById(targetId,{ban_duration:target.active?'none':'876000h'})
        return json({error:profileError.message||'Não foi possível alterar o status do perfil.'},400)
      }
      return json({ok:true,user_id:targetId,active})
    }

    if(action!=='update')return json({error:'Ação inválida.'},400)

    const fullName=String(body.full_name||'').replace(/\s+/g,' ').trim()
    if(!fullName)return json({error:'Informe o nome completo.'},400)
    let role=target.role, squadId=target.squad_id, technicianName=target.technician_name
    let targetSquadCode:string|null=null
    if(requester.role==='super_admin'){
      role=String(body.role||target.role)
      if(!['super_admin','squad_admin','technician'].includes(role))return json({error:'Perfil inválido.'},400)
      if(role==='super_admin'){squadId=null;technicianName=null}
      else{
        const squadCode=String(body.squad_code||'').trim().toUpperCase()
        if(!squadCode)return json({error:'Selecione um Squad.'},400)
        const {data:squad}=await admin.from('squads').select('id,code').eq('organization_id',requester.organization_id).eq('code',squadCode).eq('active',true).single()
        if(!squad)return json({error:'Squad inválido.'},400)
        squadId=squad.id;targetSquadCode=squad.code
        technicianName=role==='technician'?normalizeTech(body.technician_name):null
      }
    }else{
      role='technician';squadId=requester.squad_id;technicianName=normalizeTech(body.technician_name)
    }
    if(role==='technician'&&!technicianName)return json({error:'Informe o nome do técnico como aparece no CSV.'},400)

    const squadChanged=role==='technician'&&target.role==='technician'&&!!target.squad_id&&!!squadId&&target.squad_id!==squadId
    const now=new Date(),defaultYear=now.getUTCFullYear(),defaultMonth=now.getUTCMonth()+1
    const effectiveYear=Number(body.effective_year||defaultYear),effectiveMonth=Number(body.effective_month||defaultMonth)
    if(squadChanged){
      if(requester.role!=='super_admin')return json({error:'Somente Admin Geral pode mover técnicos entre Squads.'},403)
      if(!Number.isInteger(effectiveYear)||effectiveYear<2020||effectiveYear>2100||!Number.isInteger(effectiveMonth)||effectiveMonth<1||effectiveMonth>12)return json({error:'Competência de movimentação inválida.'},400)
      if(periodKey(effectiveYear,effectiveMonth)>periodKey(defaultYear,defaultMonth))return json({error:'A movimentação deve valer no mês atual ou em uma competência anterior. Movimentações futuras ainda não são aplicadas automaticamente.'},400)
      const {error:historyPreflight}=await admin.from('profile_squad_history').select('id').limit(1)
      if(historyPreflight)return json({error:'Histórico de movimentação indisponível. Execute a migração V2.19.0 antes de mover técnicos entre Squads.'},409)
    }

    const {error:authUpdateError}=await admin.auth.admin.updateUserById(targetId,{user_metadata:{full_name:fullName}})
    if(authUpdateError)return json({error:authUpdateError.message||'Não foi possível atualizar o usuário no Auth.'},400)
    const {error:profileError}=await admin.from('profiles').update({full_name:fullName,role,squad_id:squadId,technician_name:technicianName,updated_at:new Date().toISOString()}).eq('user_id',targetId)
    if(profileError)return json({error:profileError.message||'Não foi possível atualizar o perfil.'},400)

    // Registra a vigência e preserva meses anteriores quando um técnico troca de Squad.
    if(squadChanged&&target.squad_id&&squadId){
      const prev=previousPeriod(effectiveYear,effectiveMonth)
      const {data:openHistory}=await admin.from('profile_squad_history').select('id').eq('user_id',targetId).is('valid_to_year',null).is('valid_to_month',null).maybeSingle()
      if(openHistory?.id){
        await admin.from('profile_squad_history').update({valid_to_year:prev.year,valid_to_month:prev.month}).eq('id',openHistory.id)
      }else{
        const created=new Date(target.created_at||Date.now())
        await admin.from('profile_squad_history').insert({organization_id:requester.organization_id,user_id:targetId,squad_id:target.squad_id,technician_name:target.technician_name,valid_from_year:created.getUTCFullYear(),valid_from_month:created.getUTCMonth()+1,valid_to_year:prev.year,valid_to_month:prev.month,created_by:requester.user_id,note:'Vínculo anterior registrado automaticamente na primeira movimentação pelo Performance Hub.'})
      }
      await admin.from('profile_squad_history').insert({organization_id:requester.organization_id,user_id:targetId,squad_id:squadId,technician_name:technicianName,valid_from_year:effectiveYear,valid_from_month:effectiveMonth,created_by:requester.user_id,note:'Movimentação realizada pela interface do Performance Hub.'})

      // O passado fica intacto. A partir da competência informada, remove vínculo no Squad anterior.
      const {data:oldMonths}=await admin.from('squad_months').select('id,year,month').eq('squad_id',target.squad_id)
      const oldIds=(oldMonths||[]).filter((m:{id:string;year:number;month:number})=>periodKey(m.year,m.month)>=periodKey(effectiveYear,effectiveMonth)).map((m:{id:string})=>m.id)
      if(oldIds.length)await admin.from('technician_monthly').update({user_id:null}).eq('user_id',targetId).in('squad_month_id',oldIds)
    }

    // Vincula apenas registros do Squad atual compatíveis com o nome. Em movimentação, respeita a competência de início.
    if(role==='technician'&&squadId&&technicianName){
      const {data:months}=await admin.from('squad_months').select('id,year,month').eq('squad_id',squadId)
      const monthRows=(months||[]).filter((m:{id:string;year:number;month:number})=>!squadChanged||periodKey(m.year,m.month)>=periodKey(effectiveYear,effectiveMonth))
      const ids=monthRows.map((m:{id:string})=>m.id)
      if(ids.length){
        const {data:rows}=await admin.from('technician_monthly').select('id,technician_name').in('squad_month_id',ids)
        const key=linkKey(technicianName),linkIds=(rows||[]).filter((r:{id:string;technician_name:string})=>linkKey(r.technician_name)===key).map((r:{id:string})=>r.id)
        if(linkIds.length)await admin.from('technician_monthly').update({user_id:targetId}).in('id',linkIds)
      }
    }

    if(!targetSquadCode&&squadId){const {data:s}=await admin.from('squads').select('code').eq('id',squadId).maybeSingle();targetSquadCode=s?.code||null}
    return json({ok:true,user:{id:targetId,email:target.email,full_name:fullName,role,squad_code:targetSquadCode,technician_name:technicianName,active:target.active},movement:squadChanged?{effective_year:effectiveYear,effective_month:effectiveMonth}:null})
  } catch(error) {
    console.error(error)
    return json({error:error instanceof Error?error.message:'Erro interno ao gerenciar usuário.'},500)
  }
})
