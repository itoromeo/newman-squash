// POST /api/matches/result - Guardar resultado con walkover
export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const data = await request.json();
        
        if (!data.match_id) {
            return new Response(JSON.stringify({ error: 'match_id requerido' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const match = await env.DB.prepare('SELECT * FROM matches WHERE id = ?')
            .bind(data.match_id).first();
        
        if (!match) {
            return new Response(JSON.stringify({ error: 'Partido no encontrado' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Contar games ganados
        let gamesP1 = 0;
        let gamesP2 = 0;
        
        if (data.game1_p1 > data.game1_p2) gamesP1++;
        if (data.game1_p2 > data.game1_p1) gamesP2++;
        if (data.game2_p1 > data.game2_p2) gamesP1++;
        if (data.game2_p2 > data.game2_p1) gamesP2++;
        if (data.game3_p1 > data.game3_p2) gamesP1++;
        if (data.game3_p2 > data.game3_p1) gamesP2++;
        if (data.game4_p1 > data.game4_p2) gamesP1++;
        if (data.game4_p2 > data.game4_p1) gamesP2++;
        if (data.game5_p1 > data.game5_p2) gamesP1++;
        if (data.game5_p2 > data.game5_p1) gamesP2++;
        
        const ganadorId = gamesP1 > gamesP2 ? match.player1_id : match.player2_id;
        
        // Detectar walkover
        const isWalkover = 
            (data.game1_p1 === 0 && data.game1_p2 === 11 &&
             data.game2_p1 === 0 && data.game2_p2 === 11 &&
             data.game3_p1 === 0 && data.game3_p2 === 11 &&
             data.game4_p1 === 0 && data.game4_p2 === 11 &&
             data.game5_p1 === 0 && data.game5_p2 === 11) ||
            (data.game1_p1 === 11 && data.game1_p2 === 0 &&
             data.game2_p1 === 11 && data.game2_p2 === 0 &&
             data.game3_p1 === 11 && data.game3_p2 === 0 &&
             data.game4_p1 === 11 && data.game4_p2 === 0 &&
             data.game5_p1 === 11 && data.game5_p2 === 0);
        
        const puntosGanador = 3;
        const puntosPerdedor = isWalkover ? 0 : 1;
        
        await env.DB.prepare(`
            UPDATE matches SET
                game1_p1=?, game1_p2=?, game2_p1=?, game2_p2=?,
                game3_p1=?, game3_p2=?, game4_p1=?, game4_p2=?,
                game5_p1=?, game5_p2=?, games_ganados_p1=?, games_ganados_p2=?,
                ganador_id=?, puntos_equipo_ganador=?, puntos_equipo_perdedor=?,
                es_walkover=?, estado='jugado', observaciones=?, updated_at=CURRENT_TIMESTAMP
            WHERE id=?
        `).bind(
            data.game1_p1, data.game1_p2, data.game2_p1, data.game2_p2,
            data.game3_p1, data.game3_p2, data.game4_p1, data.game4_p2,
            data.game5_p1, data.game5_p2, gamesP1, gamesP2,
            ganadorId, puntosGanador, puntosPerdedor, isWalkover ? 1 : 0,
            data.observaciones || null, data.match_id
        ).run();
        
        return new Response(JSON.stringify({ 
            success: true, 
            ganador_id: ganadorId,
            games_p1: gamesP1,
            games_p2: gamesP2,
            is_walkover: isWalkover
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: 'Error del servidor', details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
