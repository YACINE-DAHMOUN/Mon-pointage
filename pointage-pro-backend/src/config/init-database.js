/* eslint-env node */
import pool from './database.js';

const createTables = async () => {
  try {
    console.log('🔄 Création des tables en cours...\n');

    // ==========================================
    // TABLE USERS - Utilisateurs
    // ==========================================
    console.log('📝 Création de la table users...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('employe', 'employeur', 'admin')),
        prix_journee DECIMAL(10, 2) DEFAULT 0,
        employeur_id UUID REFERENCES users(id) ON DELETE SET NULL,
        actif BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Table users créée\n');

    // ==========================================
    // TABLE MISSIONS - Missions assignées
    // ==========================================
    console.log('📝 Création de la table missions...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS missions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        titre VARCHAR(255) NOT NULL,
        description TEXT,
        numero_tournee VARCHAR(50),
        date_debut DATE NOT NULL,
        date_fin DATE,
        nombre_points_prevu INTEGER,
        employe_id UUID REFERENCES users(id) ON DELETE CASCADE,
        employeur_id UUID REFERENCES users(id) ON DELETE CASCADE,
        statut VARCHAR(20) DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'terminee', 'annulee')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Table missions créée\n');

    // ==========================================
    // TABLE POINTAGES - Pointages journaliers
    // ==========================================
    console.log('📝 Création de la table pointages...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pointages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        mission_id UUID REFERENCES missions(id) ON DELETE SET NULL,
        date DATE NOT NULL,
        numero_tournee VARCHAR(50),
        nombre_points INTEGER DEFAULT 0,
        ripeur VARCHAR(100),
        heure_debut TIME,
        heure_fin TIME,
        heures_travaillees DECIMAL(5, 2),
        mois INTEGER NOT NULL,
        annee INTEGER NOT NULL,
        valide BOOLEAN DEFAULT false,
        commentaire TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, date)
      );
    `);
    console.log('✅ Table pointages créée\n');

    // ==========================================
    // TABLE DOCUMENTS - Fichiers uploadés
    // ==========================================
    console.log('📝 Création de la table documents...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pointage_id UUID REFERENCES pointages(id) ON DELETE CASCADE,
        fichier_url VARCHAR(500) NOT NULL,
        fichier_nom VARCHAR(255) NOT NULL,
        fichier_type VARCHAR(50) NOT NULL,
        taille_fichier INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Table documents créée\n');

    // ==========================================
    // INDEX - Pour améliorer les performances
    // ==========================================
    console.log('📝 Création des index...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_pointages_user_date ON pointages(user_id, date);
      CREATE INDEX IF NOT EXISTS idx_pointages_mission ON pointages(mission_id);
      CREATE INDEX IF NOT EXISTS idx_missions_employe ON missions(employe_id);
      CREATE INDEX IF NOT EXISTS idx_missions_employeur ON missions(employeur_id);
      CREATE INDEX IF NOT EXISTS idx_users_employeur ON users(employeur_id);
    `);
    console.log('✅ Index créés\n');

    console.log('🎉 Toutes les tables ont été créées avec succès !');
    console.log('✨ Votre base de données est prête à être utilisée.\n');

    // Fermer la connexion
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error.message);
    console.error('💡 Vérifiez que PostgreSQL est bien démarré et que les identifiants dans .env sont corrects.\n');
    process.exit(1);
  }
};

// Exécuter la fonction
createTables();