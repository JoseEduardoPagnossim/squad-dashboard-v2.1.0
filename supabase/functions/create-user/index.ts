import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
})

const fail = (error: string, status: number, code: string) => json({ error, code }, status)
const normalizeTech = (value: unknown) => String(value ?? '')
  .normalize('NFKC')
  .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .toUpperCase()
const linkKey = (value: unknown) => normalizeTech(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, '')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return fail('Método não permitido.', 405, 'method_not_allowed')

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceRoleKey) return fail('Configuração do servidor incompleta.', 500, 'server_config')

    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (!token) return fail('Sessão não encontrada.', 401, 'missing_session')

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    })

    const { data: authData, error: authError } = await admin.auth.getUser(token)
    if (authError || !authData.user) {
      console.error('create-user auth validation:', authError)
      return fail('Sessão inválida.', 401, 'invalid_session')
    }

    const { data: requester, error: requesterError } = await admin
      .from('profiles')
      .select('user_id,organization_id,squad_id,role,active')
      .eq('user_id', authData.user.id)
      .eq('active', true)
      .single()
    if (requesterError || !requester) {
      console.error('create-user requester profile:', requesterError)
      return fail('Perfil administrador não encontrado.', 403, 'admin_profile_missing')
    }
    if (!['super_admin', 'squad_admin'].includes(requester.role)) return fail('Sem permissão para criar usuários.', 403, 'forbidden')

    const body = await req.json()
    const fullName = String(body.full_name || '').replace(/\s+/g, ' ').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    const role = String(body.role || '')
    const squadCode = body.squad_code ? String(body.squad_code).trim().toUpperCase() : null
    const technicianName = role === 'technician' ? normalizeTech(body.technician_name) : null

    if (!fullName) return fail('Informe o nome completo.', 400, 'invalid_name')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Informe um e-mail válido.', 400, 'invalid_email')
    if (password.length < 8) return fail('A senha temporária deve ter pelo menos 8 caracteres.', 400, 'weak_password')
    if (!['super_admin', 'squad_admin', 'technician'].includes(role)) return fail('Perfil inválido.', 400, 'invalid_role')
    if (requester.role === 'squad_admin' && role !== 'technician') return fail('Admin do Squad pode criar somente técnicos.', 403, 'forbidden_role')
    if (role === 'technician' && !technicianName) return fail('Informe o nome do técnico como aparece no CSV.', 400, 'missing_technician_name')

    let targetSquad: { id: string; code: string } | null = null
    if (role !== 'super_admin') {
      if (!squadCode) return fail('Selecione um Squad.', 400, 'missing_squad')
      const { data: squad, error: squadError } = await admin
        .from('squads')
        .select('id,code')
        .eq('organization_id', requester.organization_id)
        .eq('code', squadCode)
        .eq('active', true)
        .single()
      if (squadError || !squad) {
        console.error('create-user squad lookup:', squadError)
        return fail('Squad inválido ou fora da organização.', 400, 'invalid_squad')
      }
      targetSquad = squad
      if (requester.role === 'squad_admin' && requester.squad_id !== squad.id) return fail('Você só pode cadastrar técnicos no seu próprio Squad.', 403, 'wrong_squad')
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })
    if (createError || !created.user) {
      console.error('create-user auth.admin.createUser:', createError)
      const msg = createError?.message || 'Não foi possível criar o usuário.'
      const code = /already|registered|exists/i.test(msg) ? 'email_exists' : 'auth_create_failed'
      return fail(msg, 400, code)
    }

    const profile = {
      user_id: created.user.id,
      organization_id: requester.organization_id,
      squad_id: role === 'super_admin' ? null : targetSquad!.id,
      full_name: fullName,
      email,
      role,
      technician_name: technicianName,
      active: true,
      updated_at: new Date().toISOString(),
    }

    const { error: profileError } = await admin.from('profiles').insert(profile)
    if (profileError) {
      console.error('create-user profile insert:', profileError)
      const { error: rollbackError } = await admin.auth.admin.deleteUser(created.user.id)
      if (rollbackError) console.error('create-user rollback auth user:', rollbackError)
      return fail(profileError.message || 'Não foi possível criar o perfil.', 400, 'profile_create_failed')
    }

    // Vincula resultados históricos mesmo quando o CSV possuía espaços/acentos diferentes.
    if (role === 'technician' && targetSquad && technicianName) {
      const { data: months, error: monthsError } = await admin.from('squad_months').select('id').eq('squad_id', targetSquad.id)
      if (monthsError) console.error('create-user month lookup:', monthsError)
      const monthIds = (months || []).map((m: { id: string }) => m.id)
      if (monthIds.length) {
        const { data: rows, error: rowsError } = await admin
          .from('technician_monthly')
          .select('id,technician_name')
          .in('squad_month_id', monthIds)
        if (rowsError) console.error('create-user technician history lookup:', rowsError)
        const targetKey = linkKey(technicianName)
        const ids = (rows || []).filter((r: { id: string; technician_name: string }) => linkKey(r.technician_name) === targetKey).map((r: { id: string }) => r.id)
        if (ids.length) {
          const { error: linkError } = await admin.from('technician_monthly').update({ user_id: created.user.id }).in('id', ids)
          if (linkError) console.error('create-user technician history link:', linkError)
        }
      }
    }

    return json({
      user: {
        id: created.user.id,
        email,
        full_name: fullName,
        role,
        squad_code: targetSquad?.code || null,
        technician_name: technicianName,
      },
    }, 201)
  } catch (error) {
    console.error('create-user unexpected:', error)
    return fail(error instanceof Error ? error.message : 'Erro interno ao criar usuário.', 500, 'unexpected_error')
  }
})
