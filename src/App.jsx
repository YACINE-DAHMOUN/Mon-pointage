import React, { useState, useEffect } from 'react';
import { Download, Plus, Trash2, Calendar, Settings, Upload, Eye, X } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function PointageMensuel() {
  const [mois, setMois] = useState(new Date().getMonth());
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [prixJournee, setPrixJournee] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [entrees, setEntrees] = useState([]);

  const moisNoms = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const getStorageKey = () => `pointage_${annee}_${mois}`;
  const getPrixKey = () => `prix_journee`;

  // Charger les données avec localStorage
  const sauvegarderDonnees = () => {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(entrees));
    } catch (error) {
      console.error('Erreur de sauvegarde:', error);
    }
  };

  // Charger au démarrage et lors du changement de mois
  useEffect(() => {
    const chargerDonnees = () => {
      try {
        const data = localStorage.getItem(getStorageKey());
        if (data) {
          setEntrees(JSON.parse(data));
        } else {
          setEntrees([]);
        }
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        console.log('Aucune donnée trouvée pour ce mois');
        setEntrees([]);
      }
    };

    const chargerPrix = () => {
      try {
        const prix = localStorage.getItem(getPrixKey());
        if (prix) {
          setPrixJournee(prix);
        }
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        console.log('Aucun prix enregistré');
      }
    };

    chargerDonnees();
    chargerPrix();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mois, annee]);

  // Sauvegarder automatiquement les données
  useEffect(() => {
    if (entrees.length > 0) {
      sauvegarderDonnees();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entrees]);

  // Sauvegarder le prix automatiquement
  useEffect(() => {
    if (prixJournee) {
      localStorage.setItem(getPrixKey(), prixJournee);
    }
  }, [prixJournee]);

  const [fichierPreview, setFichierPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const ajouterEntree = () => {
    const nouvelleEntree = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      numeroTournee: '',
      nombrePoints: '',
      ripeur: '',
      heureDebut: '',
      heureFin: '',
      heuresTravaillees: 0,
      fichier: null,
      fichierNom: '',
      fichierType: ''
    };
    setEntrees([...entrees, nouvelleEntree]);
  };

  const supprimerEntree = (id) => {
    if (confirm('Voulez-vous vraiment supprimer cette entrée ?')) {
      setEntrees(entrees.filter(e => e.id !== id));
    }
  };

  const calculerHeures = (debut, fin) => {
    if (!debut || !fin) return 0;
    const [hD, mD] = debut.split(':').map(Number);
    const [hF, mF] = fin.split(':').map(Number);
    const minutes = (hF * 60 + mF) - (hD * 60 + mD);
    return Math.max(0, minutes / 60);
  };

  const modifierEntree = (id, champ, valeur) => {
    setEntrees(entrees.map(e => {
      if (e.id === id) {
        const updated = { ...e, [champ]: valeur };
        if (champ === 'heureDebut' || champ === 'heureFin') {
          updated.heuresTravaillees = calculerHeures(updated.heureDebut, updated.heureFin);
        }
        return updated;
      }
      return e;
    }));
  };

  const handleFileUpload = async (id, event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Format non supporté. Utilisez JPG, PNG ou PDF');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Fichier trop volumineux. Maximum 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      modifierEntree(id, 'fichier', base64);
      modifierEntree(id, 'fichierNom', file.name);
      modifierEntree(id, 'fichierType', file.type);
    };
    reader.readAsDataURL(file);
  };

  const supprimerFichier = (id) => {
    modifierEntree(id, 'fichier', null);
    modifierEntree(id, 'fichierNom', '');
    modifierEntree(id, 'fichierType', '');
  };

  const afficherPreview = (fichier, type, nom) => {
    setFichierPreview({ fichier, type, nom });
    setShowPreview(true);
  };

  const calculerTotaux = () => {
    const totalHeures = entrees.reduce((sum, e) => sum + (e.heuresTravaillees || 0), 0);
    const totalPoints = entrees.reduce((sum, e) => sum + (parseInt(e.nombrePoints) || 0), 0);
    const joursTravailles = entrees.filter(e => e.date && e.heureDebut && e.heureFin).length;
    const montantTotal = joursTravailles * (parseFloat(prixJournee) || 0);
    
    return { totalHeures, totalPoints, joursTravailles, montantTotal };
  };

  const exporterVersExcel = () => {
    if (entrees.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const totaux = calculerTotaux();
    
    const donnees = entrees.map(e => ({
      'Date': new Date(e.date).toLocaleDateString('fr-FR'),
      'Numéro de Tournée': e.numeroTournee,
      'Nombre de Points/Colis': e.nombrePoints,
      'Ripeur': e.ripeur,
      'Heure de Début': e.heureDebut,
      'Heure de Fin': e.heureFin,
      'Heures Travaillées': e.heuresTravaillees ? e.heuresTravaillees.toFixed(2) + 'h' : '0h'
    }));

    donnees.push({});
    donnees.push({
      'Date': 'TOTAUX MENSUELS',
      'Numéro de Tournée': '',
      'Nombre de Points/Colis': totaux.totalPoints,
      'Ripeur': '',
      'Heure de Début': '',
      'Heure de Fin': '',
      'Heures Travaillées': totaux.totalHeures.toFixed(2) + 'h'
    });
    donnees.push({
      'Date': 'Jours travaillés',
      'Numéro de Tournée': totaux.joursTravailles,
      'Nombre de Points/Colis': '',
      'Ripeur': '',
      'Heure de Début': '',
      'Heure de Fin': '',
      'Heures Travaillées': ''
    });
    donnees.push({
      'Date': 'Prix par jour',
      'Numéro de Tournée': parseFloat(prixJournee || 0).toFixed(2) + ' €',
      'Nombre de Points/Colis': '',
      'Ripeur': '',
      'Heure de Début': '',
      'Heure de Fin': '',
      'Heures Travaillées': ''
    });
    donnees.push({
      'Date': 'MONTANT TOTAL',
      'Numéro de Tournée': totaux.montantTotal.toFixed(2) + ' €',
      'Nombre de Points/Colis': '',
      'Ripeur': '',
      'Heure de Début': '',
      'Heure de Fin': '',
      'Heures Travaillées': ''
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(donnees);
    
    ws['!cols'] = [
      { wch: 12 }, { wch: 18 }, { wch: 20 }, 
      { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 18 }
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, `${moisNoms[mois]} ${annee}`);
    XLSX.writeFile(wb, `Pointage_${moisNoms[mois]}_${annee}.xlsx`);
  };

  const totaux = calculerTotaux();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Modal de prévisualisation */}
        {showPreview && fichierPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
                <h3 className="text-lg font-semibold text-gray-800">{fichierPreview.nom}</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-4">
                {fichierPreview.type.startsWith('image/') ? (
                  <img 
                    src={fichierPreview.fichier} 
                    alt="Aperçu" 
                    className="w-full h-auto rounded-lg"
                  />
                ) : (
                  <iframe
                    src={fichierPreview.fichier}
                    className="w-full h-[600px] rounded-lg"
                    title="Aperçu PDF"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* En-tête */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-800">Pointage Mensuel</h1>
            </div>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <Settings className="w-5 h-5" />
              Paramètres
            </button>
          </div>

          {/* Paramètres */}
          {showSettings && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-3">Paramètres</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mois</label>
                  <select 
                    value={mois}
                    onChange={(e) => setMois(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {moisNoms.map((nom, idx) => (
                      <option key={idx} value={idx}>{nom}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
                  <input
                    type="number"
                    value={annee}
                    onChange={(e) => setAnnee(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix par jour (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prixJournee}
                    onChange={(e) => setPrixJournee(e.target.value)}
                    placeholder="Ex: 150"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-3">
            <button
              onClick={ajouterEntree}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nouvelle journée
            </button>
            
            <button
              onClick={exporterVersExcel}
              disabled={entrees.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              Exporter Excel
            </button>
          </div>
        </div>

        {/* Tableau des entrées */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-indigo-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">N° Tournée</th>
                  <th className="px-4 py-3 text-left">Points/Colis</th>
                  <th className="px-4 py-3 text-left">Ripeur</th>
                  <th className="px-4 py-3 text-left">Début</th>
                  <th className="px-4 py-3 text-left">Fin</th>
                  <th className="px-4 py-3 text-left">Heures</th>
                  <th className="px-4 py-3 text-left">Document</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entrees.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                      Aucune entrée pour {moisNoms[mois]} {annee}. Cliquez sur "Nouvelle journée" pour commencer.
                    </td>
                  </tr>
                ) : (
                  entrees.map((entree) => (
                    <tr key={entree.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="date"
                          value={entree.date}
                          onChange={(e) => modifierEntree(entree.id, 'date', e.target.value)}
                          className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={entree.numeroTournee}
                          onChange={(e) => modifierEntree(entree.id, 'numeroTournee', e.target.value)}
                          placeholder="T-123"
                          className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={entree.nombrePoints}
                          onChange={(e) => modifierEntree(entree.id, 'nombrePoints', e.target.value)}
                          placeholder="0"
                          className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={entree.ripeur}
                          onChange={(e) => modifierEntree(entree.id, 'ripeur', e.target.value)}
                          placeholder="Nom"
                          className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="time"
                          value={entree.heureDebut}
                          onChange={(e) => modifierEntree(entree.id, 'heureDebut', e.target.value)}
                          className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="time"
                          value={entree.heureFin}
                          onChange={(e) => modifierEntree(entree.id, 'heureFin', e.target.value)}
                          className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-indigo-600">
                          {entree.heuresTravaillees ? entree.heuresTravaillees.toFixed(1) + 'h' : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {entree.fichier ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => afficherPreview(entree.fichier, entree.fichierType, entree.fichierNom)}
                              className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                            >
                              <Eye className="w-4 h-4" />
                              Voir
                            </button>
                            <button
                              onClick={() => supprimerFichier(entree.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 cursor-pointer text-sm">
                            <Upload className="w-4 h-4" />
                            Ajouter
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) => handleFileUpload(entree.id, e)}
                              className="hidden"
                            />
                          </label>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => supprimerEntree(entree.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Statistiques */}
        {entrees.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Récapitulatif du mois</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-indigo-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-indigo-600">{totaux.joursTravailles}</div>
                <div className="text-sm text-gray-600">Jours travaillés</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{totaux.totalHeures.toFixed(1)}h</div>
                <div className="text-sm text-gray-600">Heures totales</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{totaux.totalPoints}</div>
                <div className="text-sm text-gray-600">Points/Colis livrés</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-purple-600">{totaux.montantTotal.toFixed(2)}€</div>
                <div className="text-sm text-gray-600">Montant total</div>
                <div className="text-xs text-gray-500 mt-1">({totaux.joursTravailles} j × {parseFloat(prixJournee || 0).toFixed(2)}€)</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}