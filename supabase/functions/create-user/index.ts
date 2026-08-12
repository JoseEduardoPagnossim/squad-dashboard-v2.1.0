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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Configuração do servidor incompleta.' }, 500)

    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (!token) return json({ error: 'Sessão não encontrada.' }, 401)

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    })

    const { data: authData, error: authError } = await admin.auth.getUser(token)
    if (authError || !authData.user) return json({ error: 'Sessão inválida.' }, 401)

    const { data: requester, error: requesterError } = await admin
      .from('profiles')
      .select('user_id,organization_id,squad_id,role,active')
      .eq('user_id', authData.user.id)
      .eq('active', true)
      .single()
    if (requesterError || !requester) return json({ error: 'Perfil administrador não encontrado.' }, 403)
    if (!['super_admin', 'squad_admin'].includes(requester.role)) return json({ error: 'Sem permissão para criar usuários.' }, 403)

    const body = await req.json()
    const fullName = String(body.full_name || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    const role = String(body.role || '')
    const squadCode = body.squad_code ? String(body.squad_code).trim().toUpperCase() : null
    const technicianName = role === 'technician' ? String(body.technician_name || '').trim().toUpperCase() : null

    if (!fullName) return json({ error: 'Informe o nome completo.' }, 400)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Informe um e-mail válido.' }, 400)
    if (password.length < 8) return json({ error: 'A senha temporária deve ter pelo menos 8 caracteres.' }, 400)
    if (!['super_admin', 'squad_admin', 'technician'].includes(role)) return json({ error: 'Perfil inválido.' }, 400)
    if (requester.role === 'squad_admin' && role !== 'technician') return json({ error: 'Admin do Squad pode criar somente técnicos.' }, 403)
    if (role === 'technician' && !technicianName) return json({ error: 'Informe o nome do técnico como aparece na planilha.' }, 400)

    let targetSquad: { id: string; code: string } | null = null
    if (role !== 'super_admin') {
      if (!squadCode) return json({ error: 'Selecione um Squad.' }, 400)
      const { data: squad, error: squadError } = await admin
        .from('squads')
        .select('id,code')
        .eq('organization_id', requester.organization_id)
        .eq('code', squadCode)
        .eq('active', true)
        .single()
      if (squadError || !squad) return json({ error: 'Squad inválido ou fora da organização.' }, 400)
      targetSquad = squad
      if (requester.role === 'squad_admin' && requester.squad_id !== squad.id) return json({ error: 'Você só pode cadastrar técnicos no seu próprio Squad.' }, 403)
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })
    if (createError || !created.user) return json({ error: createError?.message || 'Não foi possível criar o usuário.' }, 400)

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
      await admin.auth.admin.deleteUser(created.user.id)
      return json({ error: profileError.message || 'Não foi possível criar o perfil.' }, 400)
    }

    // Vincula resultados já importados quando o técnico é criado depois da planilha.
    if (role === 'technician' && targetSquad && technicianName) {
      const { data: months } = await admin.from('squad_months').select('id').eq('squad_id', targetSquad.id)
      const monthIds = (months || []).map((m: { id: string }) => m.id)
      if (monthIds.length) {
        await admin
          .from('technician_monthly')
          .update({ user_id: created.user.id })
          .in('squad_month_id', monthIds)
          .ilike('technician_name', technicianName)
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
    console.error(error)
    return json({ error: error instanceof Error ? error.message : 'Erro interno ao criar usuário.' }, 500)
  }
})
