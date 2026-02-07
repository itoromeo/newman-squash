// GET /api/stats - Obtener estadísticas de equipos
export async function onRequestGet(context) {
    try {
        const { env } = context;
        
        const query = `
            SELECT 
                p.equipo,
                COUNT(DISTINCT p.id) as total_jugadores,
                COUNT(DISTINCT CASE WHEN m.estado = 'jugado' THEN m.id END) as partidos_jugados,
                SUM(CASE 
                    WHEN m.ganador_id = p.id THEN 3
                    WHEN m.ganador_id IS NOT NULL AND m.ganador_id != p.id AND (m.player1_id = p.id OR m.player2_id = p.id) THEN 1
                    ELSE 0 
                END) as puntos_totales
            FROM players p
            LEFT JOIN matches m ON (p.id = m.player1_id OR p.id = m.player2_id)
            GROUP BY p.equipo
        `;
        
        const result = await env.DB.prepare(query).all();
        
        return new Response(JSON.stringify(result.results), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo estadísticas de equipos:', error);
        return new Response(JSON.stringify({ 
            error: 'Error del servidor',
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
