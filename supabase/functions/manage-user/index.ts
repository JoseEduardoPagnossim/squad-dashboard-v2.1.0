import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {status,headers:{...corsHeaders,'Content-Type':'application/json; charset=utf-8'}})

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
    if(targetId===requester.user_id)return json({error:'Não é permitido alterar ou excluir o próprio acesso por esta tela.'},403)
    const {data:target,error:targetError}=await admin.from('profiles').select('user_id,organization_id,squad_id,full_name,email,role,technician_name,active').eq('user_id',targetId).single()
    if(targetError||!target||target.organization_id!==requester.organization_id)return json({error:'Usuário não encontrado no seu escopo.'},404)
    if(requester.role==='squad_admin'&&(target.role!=='technician'||target.squad_id!==requester.squad_id))return json({error:'Admin do Squad pode gerenciar somente técnicos do próprio Squad.'},403)

    if(action==='delete'){
      if(target.role==='super_admin')return json({error:'Administradores gerais não podem ser excluídos por esta tela.'},403)
      const {error}=await admin.auth.admin.deleteUser(targetId)
      if(error)return json({error:error.message||'Não foi possível excluir o usuário.'},400)
      return json({ok:true,deleted_user_id:targetId})
    }
    if(action!=='update')return json({error:'Ação inválida.'},400)

    const fullName=String(body.full_name||'').trim()
    if(!fullName)return json({error:'Informe o nome completo.'},400)
    let role=target.role, squadId=target.squad_id, technicianName=target.technician_name, active=body.active!==false
    if(requester.role==='super_admin'){
      role=String(body.role||target.role)
      if(!['super_admin','squad_admin','technician'].includes(role))return json({error:'Perfil inválido.'},400)
      if(role==='super_admin'){squadId=null;technicianName=null}
      else{
        const squadCode=String(body.squad_code||'').trim().toUpperCase()
        if(!squadCode)return json({error:'Selecione um Squad.'},400)
        const {data:squad}=await admin.from('squads').select('id,code').eq('organization_id',requester.organization_id).eq('code',squadCode).eq('active',true).single()
        if(!squad)return json({error:'Squad inválido.'},400)
        squadId=squad.id
        technicianName=role==='technician'?String(body.technician_name||'').trim().toUpperCase():null
      }
    }else{
      role='technician';squadId=requester.squad_id;technicianName=String(body.technician_name||'').trim().toUpperCase()
    }
    if(role==='technician'&&!technicianName)return json({error:'Informe o nome do técnico como aparece no CSV.'},400)

    const {error:authUpdateError}=await admin.auth.admin.updateUserById(targetId,{user_metadata:{full_name:fullName}})
    if(authUpdateError)return json({error:authUpdateError.message||'Não foi possível atualizar o usuário no Auth.'},400)
    const {error:profileError}=await admin.from('profiles').update({full_name:fullName,role,squad_id:squadId,technician_name:technicianName,active,updated_at:new Date().toISOString()}).eq('user_id',targetId)
    if(profileError)return json({error:profileError.message||'Não foi possível atualizar o perfil.'},400)

    if(role==='technician'&&squadId&&technicianName){
      const {data:months}=await admin.from('squad_months').select('id').eq('squad_id',squadId)
      const ids=(months||[]).map((m:{id:string})=>m.id)
      if(ids.length)await admin.from('technician_monthly').update({user_id:targetId}).in('squad_month_id',ids).ilike('technician_name',technicianName)
    }
    const {data:squad}=squadId?await admin.from('squads').select('code').eq('id',squadId).maybeSingle():{data:null}
    return json({ok:true,user:{id:targetId,email:target.email,full_name:fullName,role,squad_code:squad?.code||null,technician_name:technicianName,active}})
  } catch(error) {
    console.error(error)
    return json({error:error instanceof Error?error.message:'Erro interno ao gerenciar usuário.'},500)
  }
})
