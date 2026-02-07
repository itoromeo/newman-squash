// POST /api/matches/generate - Generar fixture automáticamente
export async function onRequestPost(context) {
    try {
        const { env } = context;
        
        // Obtener todos los jugadores agrupados por tier
        const playersResult = await env.DB.prepare(
            'SELECT id, nombre, tier, equipo FROM players ORDER BY tier, id'
        ).all();
        
        const players = playersResult.results;
        
        if (players.length < 2) {
            return new Response(JSON.stringify({ 
                error: 'Se necesitan al menos 2 jugadores para generar partidos' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Agrupar por tier
        const tiers = {
            'A': [],
            'B': [],
            'C': [],
            'D': []
        };
        
        players.forEach(player => {
            tiers[player.tier].push(player);
        });
        
        let totalCreated = 0;
        
        // Generar partidos round-robin para cada tier
        for (const tier in tiers) {
            const tierPlayers = tiers[tier];
            
            if (tierPlayers.length < 2) continue;
            
            // Generar todos los enfrentamientos posibles (round-robin)
            for (let i = 0; i < tierPlayers.length; i++) {
                for (let j = i + 1; j < tierPlayers.length; j++) {
                    const player1 = tierPlayers[i];
                    const player2 = tierPlayers[j];
                    
                    // Verificar si el partido ya existe
                    const existingMatch = await env.DB.prepare(
                        'SELECT id FROM matches WHERE tier = ? AND ((player1_id = ? AND player2_id = ?) OR (player1_id = ? AND player2_id = ?))'
                    ).bind(tier, player1.id, player2.id, player2.id, player1.id).first();
                    
                    if (!existingMatch) {
                        await env.DB.prepare(
                            'INSERT INTO matches (player1_id, player2_id, tier, estado) VALUES (?, ?, ?, ?)'
                        ).bind(player1.id, player2.id, tier, 'pendiente').run();
                        
                        totalCreated++;
                    }
                }
            }
        }
        
        return new Response(JSON.stringify({ 
            success: true,
            created: totalCreated,
            message: `Se crearon ${totalCreated} partidos`
        }), {
            status: 201,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
        
    } catch (error) {
        console.error('Error generando partidos:', error);
        return new Response(JSON.stringify({ 
            error: 'Error del servidor',
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
