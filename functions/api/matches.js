// GET /api/matches - Obtener partidos
export async function onRequestGet(context) {
    try {
        const { request, env } = context;
        const url = new URL(request.url);
        const estado = url.searchParams.get('estado');
        
        let query = `
            SELECT 
                m.id,
                m.tier,
                m.fecha,
                m.cancha,
                m.estado,
                p1.nombre as jugador1,
                p1.equipo as equipo1,
                p2.nombre as jugador2,
                p2.equipo as equipo2,
                m.games_ganados_p1,
                m.games_ganados_p2,
                m.game1_p1, m.game1_p2,
                m.game2_p1, m.game2_p2,
                m.game3_p1, m.game3_p2,
                m.game4_p1, m.game4_p2,
                m.game5_p1, m.game5_p2,
                CASE 
                    WHEN m.ganador_id = p1.id THEN p1.nombre
                    WHEN m.ganador_id = p2.id THEN p2.nombre
                    ELSE NULL
                END as ganador
            FROM matches m
            JOIN players p1 ON m.player1_id = p1.id
            JOIN players p2 ON m.player2_id = p2.id
        `;
        
        if (estado) {
            query += ` WHERE m.estado = ?`;
        }
        
        query += ` ORDER BY m.tier, m.fecha, m.id`;
        
        const stmt = estado ? 
            env.DB.prepare(query).bind(estado) : 
            env.DB.prepare(query);
            
        const result = await stmt.all();
        
        return new Response(JSON.stringify(result.results), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo partidos:', error);
        return new Response(JSON.stringify({ 
            error: 'Error del servidor',
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
