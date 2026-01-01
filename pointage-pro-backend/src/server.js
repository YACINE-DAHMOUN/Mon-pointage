/* eslint-env node */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import pool from './config/database.js';

// Charger les variables d'environnement
dotenv.config();

// Créer l'application Express
const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// MIDDLEWARES
// ==========================================

// 1. Helmet - Sécurise les headers HTTP
app.use(helmet());

// 2. CORS - Autorise les requêtes depuis le frontend
app.use(cors({
  origin: process.env.CLIENT_URL, // http://localhost:5173
  credentials: true // Autorise les cookies
}));

// 3. Compression - Compresse les réponses pour réduire la taille
app.use(compression());

// 4. Morgan - Logger HTTP (affiche les requêtes dans la console)
app.use(morgan('dev'));

// 5. Express JSON Parser - Parse le JSON des requêtes
app.use(express.json());

// 6. Express URL Encoded - Parse les données de formulaires
app.use(express.urlencoded({ extended: true }));

// ==========================================
// ROUTES DE TEST
// ==========================================

// Route principale - Test si le serveur fonctionne
app.get('/', (req, res) => {
  res.json({
    message: '✅ API Pointage Pro est en ligne',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Route de santé - Test de la connexion à la base de données
app.get('/api/health', async (req, res) => {
  try {
    // Faire une requête simple pour tester la connexion
    const result = await pool.query('SELECT NOW() as current_time');
    
    res.json({
      status: 'OK',
      message: 'Serveur et base de données opérationnels',
      database: 'connected',
      serverTime: new Date().toISOString(),
      databaseTime: result.rows[0].current_time
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Erreur de connexion à la base de données',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Route de test pour compter les utilisateurs
app.get('/api/test/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as total FROM users');
    
    res.json({
      message: 'Table users accessible',
      totalUsers: result.rows[0].total
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erreur lors de la requête',
      details: error.message
    });
  }
});

// ==========================================
// GESTION DES ERREURS
// ==========================================

// Route 404 - Page non trouvée
app.use((req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.path,
    method: req.method,
    message: 'Cette URL n\'existe pas sur l\'API'
  });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err.stack);
  
  res.status(err.status || 500).json({
    error: 'Erreur serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==========================================
// DÉMARRAGE DU SERVEUR
// ==========================================

app.listen(PORT, () => {
  console.log('========================================');
  console.log('🚀 Serveur Pointage Pro démarré');
  console.log('========================================');
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📊 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Base de données: ${process.env.DB_NAME}`);
  console.log(`🌐 CORS autorisé depuis: ${process.env.CLIENT_URL}`);
  console.log('========================================');
  console.log('✨ Le serveur est prêt à recevoir des requêtes');
  console.log('');
});

// Gestion de l'arrêt gracieux du serveur
process.on('SIGINT', async () => {
  console.log('\n⚠️  Arrêt du serveur en cours...');
  await pool.end();
  console.log('✅ Connexions fermées proprement');
  process.exit(0);
});