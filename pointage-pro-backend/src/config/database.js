/* eslint-env node */
import pg from 'pg';
import dotenv from 'dotenv';

// Charger les variables d'environnement depuis .env
dotenv.config();

// Extraire Pool depuis le package pg
const { Pool } = pg;

// Créer un pool de connexions PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,       // localhost
  port: process.env.DB_PORT,       // 5432
  database: process.env.DB_NAME,   // pointage_app
  user: process.env.DB_USER,       // postgres
  password: process.env.DB_PASSWORD, // votre mot de passe
});

// Événement : connexion réussie
pool.on('connect', () => {
  console.log('✅ Connecté à PostgreSQL');
});

// Événement : erreur de connexion
pool.on('error', (err) => {
  console.error('❌ Erreur PostgreSQL:', err.message);
  process.exit(-1); // Arrêter l'application si la BDD plante
});

// Exporter le pool pour l'utiliser dans d'autres fichiers
export default pool;