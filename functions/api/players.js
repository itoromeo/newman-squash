// POST /api/players - Registrar nuevo jugador
export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const data = await request.json();
        
        // Validar datos requeridos
        if (!data.nombre || !data.nivel || !data.equipo) {
            return new Response(JSON.stringify({ 
                error: 'Faltan campos requeridos' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Validar nivel
        if (!['A', 'B', 'C', 'D'].includes(data.nivel)) {
            return new Response(JSON.stringify({ 
                error: 'Nivel inválido' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Validar equipo
        if (!['SANTI', 'LUCAS'].includes(data.equipo)) {
            return new Response(JSON.stringify({ 
                error: 'Equipo inválido' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Generar email automático basado en el nombre
        const emailAuto = data.nombre.toLowerCase().replace(/\s+/g, '.') + '@torneo.local';
        
        // Insertar en la base de datos
        const result = await env.DB.prepare(
            'INSERT INTO players (nombre, email, telefono, tier, equipo) VALUES (?, ?, ?, ?, ?)'
        ).bind(
            data.nombre,
            emailAuto,
            null,
            data.nivel,
            data.equipo
        ).run();
        
        return new Response(JSON.stringify({ 
            success: true,
            id: result.meta.last_row_id 
        }), {
            status: 201,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
        
    } catch (error) {
        console.error('Error registrando jugador:', error);
        
        return new Response(JSON.stringify({ 
            error: 'Error del servidor: ' + error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// GET /api/players - Obtener todos los jugadores
export async function onRequestGet(context) {
    try {
        const { env } = context;
        
        const result = await env.DB.prepare(
            'SELECT id, nombre, email, telefono, tier, equipo, created_at FROM players ORDER BY tier, nombre'
        ).all();
        
        return new Response(JSON.stringify(result.results), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo jugadores:', error);
        return new Response(JSON.stringify({ 
            error: 'Error del servidor' 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
