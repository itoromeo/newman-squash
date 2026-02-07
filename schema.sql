-- Esquema de base de datos para el torneo de squash

-- Tabla de jugadores
CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefono TEXT,
    tier TEXT NOT NULL CHECK(tier IN ('A', 'B', 'C', 'D')),
    equipo TEXT NOT NULL CHECK(equipo IN ('SANTI', 'LUCY')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de partidos
CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player1_id INTEGER NOT NULL,
    player2_id INTEGER NOT NULL,
    tier TEXT NOT NULL,
    fecha DATE,
    cancha TEXT,
    -- Marcador por game (cada game a 11 puntos)
    game1_p1 INTEGER,
    game1_p2 INTEGER,
    game2_p1 INTEGER,
    game2_p2 INTEGER,
    game3_p1 INTEGER,
    game3_p2 INTEGER,
    game4_p1 INTEGER,
    game4_p2 INTEGER,
    game5_p1 INTEGER,
    game5_p2 INTEGER,
    -- Resultado
    ganador_id INTEGER,
    games_ganados_p1 INTEGER,
    games_ganados_p2 INTEGER,
    puntos_equipo_ganador INTEGER DEFAULT 3,
    puntos_equipo_perdedor INTEGER DEFAULT 1,
    estado TEXT DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'jugado')),
    observaciones TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player1_id) REFERENCES players(id),
    FOREIGN KEY (player2_id) REFERENCES players(id),
    FOREIGN KEY (ganador_id) REFERENCES players(id)
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_players_equipo ON players(equipo);
CREATE INDEX IF NOT EXISTS idx_players_tier ON players(tier);
CREATE INDEX IF NOT EXISTS idx_matches_tier ON matches(tier);
CREATE INDEX IF NOT EXISTS idx_matches_estado ON matches(estado);

-- Vista para estadísticas de equipos
CREATE VIEW IF NOT EXISTS team_stats AS
SELECT 
    p.equipo,
    COUNT(DISTINCT p.id) as total_jugadores,
    COUNT(DISTINCT CASE WHEN m.estado = 'jugado' THEN m.id END) as partidos_jugados,
    SUM(CASE 
        WHEN m.ganador_id = p.id THEN m.puntos_equipo_ganador 
        WHEN m.ganador_id IS NOT NULL AND m.ganador_id != p.id THEN m.puntos_equipo_perdedor
        ELSE 0 
    END) as puntos_totales
FROM players p
LEFT JOIN matches m ON (p.id = m.player1_id OR p.id = m.player2_id)
GROUP BY p.equipo;

-- Vista para el fixture
CREATE VIEW IF NOT EXISTS fixture_view AS
SELECT 
    m.id,
    m.tier,
    m.fecha,
    m.cancha,
    p1.nombre as jugador1,
    p1.equipo as equipo1,
    p2.nombre as jugador2,
    p2.equipo as equipo2,
    m.estado,
    m.games_ganados_p1,
    m.games_ganados_p2,
    CASE 
        WHEN m.ganador_id = p1.id THEN p1.nombre
        WHEN m.ganador_id = p2.id THEN p2.nombre
        ELSE NULL
    END as ganador
FROM matches m
JOIN players p1 ON m.player1_id = p1.id
JOIN players p2 ON m.player2_id = p2.id
ORDER BY m.tier, m.fecha;
