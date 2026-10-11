const { neon } = require("@neondatabase/serverless");

let tableReady;

async function ensureScoresTable(sql) {
  if (!tableReady) {
    tableReady = sql`
      CREATE TABLE IF NOT EXISTS tetris_scores (
        id BIGSERIAL PRIMARY KEY,
        score INTEGER NOT NULL CHECK (score >= 0),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
  }

  try {
    await tableReady;
  } catch (error) {
    tableReady = undefined;
    throw error;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const score = req.method === "POST" ? req.body?.score : undefined;
    if (req.method === "POST" &&
      (!Number.isSafeInteger(score) || score < 0 || score > 2147483647)) {
      return res.status(400).json({ error: "score must be a non-negative integer" });
    }

    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not configured");
    }

    const sql = neon(process.env.DATABASE_URL);
    await ensureScoresTable(sql);

    if (req.method === "GET") {
      const scores = await sql`
        SELECT score
        FROM tetris_scores
        ORDER BY score DESC, created_at ASC
        LIMIT 5
      `;
      return res.status(200).json(scores);
    }

    await sql`INSERT INTO tetris_scores (score) VALUES (${score})`;
    return res.status(201).json({ status: "ok" });
  } catch (error) {
    console.error("Score API error:", error);
    return res.status(500).json({ error: "Unable to process scores" });
  }
};
