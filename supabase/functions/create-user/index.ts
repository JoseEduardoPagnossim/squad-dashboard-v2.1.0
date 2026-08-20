import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {status,headers:{...corsHeaders,'Content-Type':'application/json; charset=utf-8'}})
const fail = (error: string, status: number, code: string, extra:Record<string,unknown>={}) => json({ error, code, ...extra }, status)
const normalizeTech = (value: unknown) => String(value ?? '').normalize('NFKC').replace(/[\u200B-\u200D\u2060\uFEFF]/g, '').replace(/\s+/g, ' ').trim().toUpperCase()
const linkKey = (value: unknown) => normalizeTech(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return fail('Método não permitido.', 405, 'method_not_allowed')
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL'), serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceRoleKey) return fail('Configuração do servidor incompleta.', 500, 'server_config')
    const authHeader = req.headers.get('Authorization') || '', token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (!token) return fail('Sessão não encontrada.', 401, 'missing_session')
    const admin = createClient(supabaseUrl, serviceRoleKey, {auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}})
    const { data: authData, error: authError } = await admin.auth.getUser(token)
    if (authError || !authData.user) return fail('Sessão inválida.', 401, 'invalid_session')
    const { data: requester } = await admin.from('profiles').select('user_id,organization_id,squad_id,role,active').eq('user_id', authData.user.id).eq('active', true).single()
    if (!requester) return fail('Perfil administrador não encontrado.', 403, 'admin_profile_missing')
    if (!['super_admin','squad_admin'].includes(requester.role)) return fail('Sem permissão para criar usuários.', 403, 'forbidden')

    const body = await req.json(), fullName = String(body.full_name || '').replace(/\s+/g, ' ').trim(), email = String(body.email || '').trim().toLowerCase(), password = String(body.password || ''), role = String(body.role || ''), squadCode = body.squad_code ? String(body.squad_code).trim().toUpperCase() : null, technicianName = role === 'technician' ? normalizeTech(body.technician_name) : null
    if (!fullName) return fail('Informe o nome completo.', 400, 'invalid_name')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Informe um e-mail válido.', 400, 'invalid_email')
    if (password.length < 8) return fail('A senha temporária deve ter pelo menos 8 caracteres.', 400, 'weak_password')
    if (!['super_admin','squad_admin','technician'].includes(role)) return fail('Perfil inválido.', 400, 'invalid_role')
    if (requester.role === 'squad_admin' && role !== 'technician') return fail('Admin do Squad pode criar somente técnicos.', 403, 'forbidden_role')
    if (role === 'technician' && !technicianName) return fail('Informe o nome do técnico como aparece no CSV.', 400, 'missing_technician_name')

    // Antes do Auth, procura um perfil já existente e devolve o Squad real para facilitar correção pela interface.
    const {data:existingProfile}=await admin.from('profiles').select('user_id,full_name,email,role,squad_id,technician_name,active,squads(code,name)').eq('organization_id',requester.organization_id).ilike('email',email).maybeSingle()
    if(existingProfile){
      const squad=Array.isArray(existingProfile.squads)?existingProfile.squads[0]:existingProfile.squads
      return fail(`${existingProfile.full_name} já está cadastrado${squad?.code?` no Squad ${squad.code}`:''}. Edite o usuário existente para corrigir perfil ou Squad.`,409,'profile_exists',{existing_user_id:existingProfile.user_id,existing_squad_code:squad?.code||null})
    }

    let targetSquad: { id: string; code: string } | null = null
    if (role !== 'super_admin') {
      if (!squadCode) return fail('Selecione um Squad.', 400, 'missing_squad')
      const { data: squad } = await admin.from('squads').select('id,code').eq('organization_id', requester.organization_id).eq('code', squadCode).eq('active', true).single()
      if (!squad) return fail('Squad inválido ou fora da organização.', 400, 'invalid_squad')
      targetSquad = squad
      if (requester.role === 'squad_admin' && requester.squad_id !== squad.id) return fail('Você só pode cadastrar técnicos no seu próprio Squad.', 403, 'wrong_squad')
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:fullName}})
    if (createError || !created.user) {
      const msg = createError?.message || 'Não foi possível criar o usuário.'
      const code = /already|registered|exists/i.test(msg) ? 'email_exists' : 'auth_create_failed'
      return fail(code==='email_exists'?'Este e-mail já existe no Authentication, mas não há perfil visível na organização. Verifique Authentication > Users antes de recriar o acesso.':msg, 400, code)
    }

    const profile = {user_id:created.user.id,organization_id:requester.organization_id,squad_id:role==='super_admin'?null:targetSquad!.id,full_name:fullName,email,role,technician_name:technicianName,active:true,updated_at:new Date().toISOString()}
    const { error: profileError } = await admin.from('profiles').insert(profile)
    if (profileError) {
      const { error: rollbackError } = await admin.auth.admin.deleteUser(created.user.id)
      if (rollbackError) console.error('create-user rollback:', rollbackError)
      return fail(profileError.message || 'Não foi possível criar o perfil.', 400, 'profile_create_failed')
    }

    if(targetSquad){
      const now=new Date()
      const {error:historyError}=await admin.from('profile_squad_history').insert({organization_id:requester.organization_id,user_id:created.user.id,squad_id:targetSquad.id,technician_name:technicianName,valid_from_year:now.getUTCFullYear(),valid_from_month:now.getUTCMonth()+1,created_by:requester.user_id,note:'Vínculo inicial criado pelo Performance Hub.'})
      if(historyError)console.error('create-user squad history:',historyError)
    }

    if (role === 'technician' && targetSquad && technicianName) {
      const { data: months } = await admin.from('squad_months').select('id').eq('squad_id', targetSquad.id)
      const monthIds = (months || []).map((m: { id: string }) => m.id)
      if (monthIds.length) {
        const { data: rows } = await admin.from('technician_monthly').select('id,technician_name').in('squad_month_id', monthIds)
        const targetKey = linkKey(technicianName), ids = (rows || []).filter((r: { id: string; technician_name: string }) => linkKey(r.technician_name) === targetKey).map((r: { id: string }) => r.id)
        if (ids.length) await admin.from('technician_monthly').update({ user_id: created.user.id }).in('id', ids)
      }
    }

    return json({user:{id:created.user.id,email,full_name:fullName,role,squad_code:targetSquad?.code||null,technician_name:technicianName}},201)
  } catch (error) {
    console.error('create-user unexpected:', error)
    return fail(error instanceof Error ? error.message : 'Erro interno ao criar usuário.', 500, 'unexpected_error')
  }
})
