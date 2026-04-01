// URL de l'API pour tous les Pokémon
const API_URL = 'https://tyradex.vercel.app/api/v1/pokemon';

// 1. Définir nos dresseurs et leurs équipes (avec les noms français)
const iconicTrainers = [
    {
        name: "Sacha (Ash) 🏆",
        title: "Héros de l'Animé (Maître de la Ligue d'Alola)",
        team: ["Pikachu", "Dracaufeu", "Bulbizarre", "Carapuce", "Ronflex", "Amphinobi"]
    },
    {
        name: "Red",
        title: "Légende de Kanto (Héros des jeux Rouge/Bleu)",
        team: ["Dracaufeu", "Tortank", "Florizarre", "Pikachu", "Ronflex", "Lokhlass"]
    },
    {
        name: "Cynthia",
        title: "Maîtresse de la Ligue de Sinnoh",
        team: ["Carchacrok", "Lucario", "Milobellus", "Spiritomb", "Togekiss", "Roserade"]
    },
    {
        name: "Régis (Blue)",
        title: "Rival Éternel et Champion de Kanto",
        team: ["Tortank", "Arcanin", "Alakazam", "Rhinoféros", "Noix de Coco", "Léviator"]
    }
];

// 2. Créer une "Map" pour stocker les images
// Une Map permet une recherche très rapide (meilleur qu'un objet pour ça)
const pokemonImageMap = new Map();

/**
 * 3. Fonction pour charger TOUS les Pokémon de l'API en une fois
 */
async function fetchAllPokemonData() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        // L'API renvoie un grand tableau de Pokémon
        const allPokemon = await response.json();
        
        // On remplit notre Map pour un accès facile
        // Clé = nom français (ex: "Pikachu")
        // Valeur = URL de l'image (ex: "https://...")
        for (const pokemon of allPokemon) {
            // On vérifie que les données existent et sont valides
            if (pokemon && pokemon.name && pokemon.name.fr && pokemon.sprites && pokemon.sprites.regular) {
                // On enlève les "Gmax" et autres formes pour garder les noms de base
                if (!pokemon.name.fr.includes("Gmax") && !pokemon.name.fr.includes("Méga")) {
                     pokemonImageMap.set(pokemon.name.fr, pokemon.sprites.regular);
                }
            }
        }
        
        console.log(`Données de ${pokemonImageMap.size} Pokémon chargées.`);

    } catch (error) {
        console.error("Impossible de charger les données Pokémon:", error);
        const container = document.getElementById('trainers-container');
        container.innerHTML = `<div class="loading">
            <h2>Erreur 😢</h2>
            <p>Impossible de contacter l'API Tyradex. Veuillez réessayer plus tard.</p>
        </div>`;
    }
}

/**
 * 4. Fonction pour afficher les dresseurs sur la page
 */
function renderTrainers() {
    const container = document.getElementById('trainers-container');
    if (!container) return; // Sécurité

    // Vider le message de chargement
    container.innerHTML = '';

    // Boucler sur chaque dresseur de notre liste
    for (const trainer of iconicTrainers) {
        // Créer la carte du dresseur
        const trainerCard = document.createElement('div');
        trainerCard.className = 'trainer-card';
        
        // Créer le conteneur pour l'équipe
        const teamContainer = document.createElement('div');
        teamContainer.className = 'team';

        // Boucler sur chaque Pokémon de l'équipe du dresseur
        for (const pokemonName of trainer.team) {
            // Récupérer l'image depuis notre Map
            const imageUrl = pokemonImageMap.get(pokemonName);
            
            const pokemonElement = document.createElement('div');
            pokemonElement.className = 'pokemon';

            if (imageUrl) {
                // Si on a trouvé l'image
                pokemonElement.innerHTML = `
                    <img src="${imageUrl}" alt="Sprite de ${pokemonName}">
                    <span>${pokemonName}</span>
                `;
            } else {
                // Si le nom est mal orthographié ou non trouvé dans l'API
                console.warn(`Image non trouvée pour : ${pokemonName}`);
                pokemonElement.innerHTML = `
                    <img src="https://via.placeholder.com/96" alt="Image non trouvée">
                    <span>${pokemonName}</span>
                    <span class="not-found">(non trouvé)</span>
                `;
            }
            // Ajouter le Pokémon à l'équipe
            teamContainer.appendChild(pokemonElement);
        }

        // Ajouter les infos du dresseur et son équipe à la carte
        trainerCard.innerHTML = `
            <h2>${trainer.name}</h2>
            <p class="title">${trainer.title}</p>
        `;
        trainerCard.appendChild(teamContainer);

        // Ajouter la carte du dresseur au conteneur principal
        container.appendChild(trainerCard);
    }
}

/**
 * 5. Fonction principale (Main)
 * Se lance au chargement de la page.
 */
async function init() {
    // D'abord, on attend que toutes les données Pokémon soient chargées
    await fetchAllPokemonData();
    
    // Ensuite, et seulement ensuite, on affiche les dresseurs
    renderTrainers();
}

// Lancer la fonction 'init' quand le document est prêt
document.addEventListener('DOMContentLoaded', init);