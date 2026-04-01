const API_BASE_URL = 'https://tyradex.app/api/v1/';

// --- ÉLÉMENTS DU DOM ---
const typesContainerEl = document.getElementById('types-container');
const pokemonListEl = document.getElementById('pokemon-list');
const resultsTitleEl = document.getElementById('results-title');
const loadingSpinnerEl = document.getElementById('loading-spinner');
const searchBar = document.getElementById('search-bar');

// Variables pour la modale
let modal, modalBody, closeBtn;

// --- VARIABLES DE DONNÉES ---
let allPokemon = [];
let allTypes = [];
let currentTypeFilter = null;

// --- INITIALISATION ---
document.addEventListener('DOMContentLoaded', async () => {
    createModalInDOM(); // On crée la modale cachée
    await init();       // On charge les données

    if (searchBar) {
        searchBar.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filterAndRender(searchTerm);
        });
    }
});

async function init() {
    showLoading(true);
    if(resultsTitleEl) resultsTitleEl.textContent = 'Chargement des données...';

    await Promise.all([
        renderTypes(), 
        fetchData('pokemon').then(data => { 
            // CORRECTION: on filtre et on garde les données brutes (pokedex_id)
            allPokemon = (data || []).filter(p => p.pokedex_id !== 0 && p.name.fr); 
        }) 
    ]);
    
    showLoading(false);
    
    if (allPokemon.length > 0 && allTypes.length > 0) {
         if(resultsTitleEl) resultsTitleEl.textContent = 'Veuillez choisir un type ci-dessus.';
    } else {
         if(resultsTitleEl) resultsTitleEl.textContent = 'Erreur lors du chargement. Veuillez rafraîchir.';
    }
}

// --- OUTILS API ---
async function fetchData(endpoint) {
    try {
        const response = await fetch(API_BASE_URL + endpoint);
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Impossible de charger '${endpoint}':`, error);
        return null;
    }
}

// CORRECTION: Utilisation de pokedex_id
function getPokemonById(id) {
    return allPokemon.find(p => p.pokedex_id === id);
}

// --- AFFICHAGE DES TYPES ---
async function renderTypes() {
    allTypes = await fetchData('types');
    if (!allTypes) return;
    
    typesContainerEl.innerHTML = '';
    
    allTypes.forEach(type => {
        if (type.name.fr === '???') return;
        
        const typeButton = document.createElement('button');
        const typeNameClass = type.name.fr.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        typeButton.className = `type-badge type-${typeNameClass}`;
        typeButton.textContent = type.name.fr;
        typeButton.addEventListener('click', () => handleTypeClick(type.name.fr));
        
        typesContainerEl.appendChild(typeButton);
    });
}

function handleTypeClick(typeName) {
    currentTypeFilter = typeName;
    if(searchBar) searchBar.value = '';
    resultsTitleEl.textContent = `Pokémon de type : ${typeName}`;
    filterAndRender('');
}

// --- FILTRAGE ET RENDU ---
function filterAndRender(searchTerm) {
    if (!currentTypeFilter) return;

    showLoading(true);
    pokemonListEl.innerHTML = '';

    setTimeout(() => {
        const filtered = allPokemon.filter(pokemon => {
            const hasType = pokemon.types && pokemon.types.some(t => t.name === currentTypeFilter);
            const nameFr = pokemon.name.fr.toLowerCase();
            const nameEn = pokemon.name.en ? pokemon.name.en.toLowerCase() : '';
            // CORRECTION: pokedex_id ici aussi
            const matchesSearch = nameFr.includes(searchTerm) || 
                                  nameEn.includes(searchTerm) || 
                                  String(pokemon.pokedex_id).includes(searchTerm);

            return hasType && matchesSearch;
        });

        renderPokemonList(filtered);
        showLoading(false);
    }, 100);
}

function renderPokemonList(pokemonArray) {
    pokemonListEl.innerHTML = ''; 

    if (pokemonArray.length === 0) {
        pokemonListEl.innerHTML = `<p class="col-span-full text-center text-gray-500 font-bold mt-10">Aucun Pokémon trouvé.</p>`;
        return;
    }

    const placeholderImg = "https://placehold.co/120x120/f0f0f0/ccc?text=?";

    pokemonArray.forEach(pokemon => {
        if (pokemon.name.fr.includes('Méga') || pokemon.name.fr.includes('Gmax')) return;

        const card = document.createElement('div');
        card.className = "bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-200 hover:scale-105 hover:shadow-xl border border-gray-200 cursor-pointer";
        
        // CORRECTION: Utilisation de pokemon.pokedex_id (avec underscore)
        card.innerHTML = `
            <div class="p-4 flex justify-center items-center h-36 bg-gray-50">
                <img 
                    src="${pokemon.sprites.regular || placeholderImg}" 
                    alt="${pokemon.name.fr}" 
                    class="pokemon-sprite"
                    onerror="this.onerror=null; this.src='${placeholderImg}';"
                >
            </div>
            <div class="p-4 text-center">
                <p class="text-xs text-gray-500 font-bold">#${String(pokemon.pokedex_id).padStart(3, '0')}</p>
                <h3 class="text-lg font-bold truncate text-gray-900">${pokemon.name.fr}</h3>
            </div>
        `;
        
        card.addEventListener('click', () => showDetails(pokemon));
        pokemonListEl.appendChild(card);
    });
}

// --- MODALE DÉTAILS ---
function showDetails(pokemon) {
    if(!modal) return;

    const stats = pokemon.stats || { hp: '?', atk: '?', def: '?', spe_atk: '?', spe_def: '?', vit: '?' };
    
    // --- GESTION PRÉ-ÉVOLUTIONS ---
    let preEvoHtml = '';
    if (pokemon.evolution?.pre && pokemon.evolution.pre.length > 0) {
        preEvoHtml = '<h4 class="font-bold mt-4 mb-2 text-red-600">Pré-évolutions</h4><div class="flex gap-4 justify-center flex-wrap">';
        pokemon.evolution.pre.forEach(evo => {
            // CORRECTION: On utilise evo.pokedex_id pour trouver l'image
            const evoData = getPokemonById(evo.pokedex_id);
            const imgUrl = evoData ? evoData.sprites.regular : ''; 
            
            // Si on a l'image, on l'affiche, sinon juste le nom
            preEvoHtml += `
                <div class="text-center flex flex-col items-center">
                    ${imgUrl ? `<img src="${imgUrl}" class="w-20 h-20 object-contain mb-1">` : ''}
                    <p class="text-sm font-bold text-gray-700">#${String(evo.pokedex_id).padStart(3, '0')} ${evo.name}</p>
                </div>`;
        });
        preEvoHtml += '</div>';
    }

    // --- GESTION ÉVOLUTIONS SUIVANTES ---
    let nextEvoHtml = '';
    if (pokemon.evolution?.next && pokemon.evolution.next.length > 0) {
        nextEvoHtml = '<h4 class="font-bold mt-4 mb-2 text-green-600">Évolutions</h4><div class="flex gap-4 justify-center flex-wrap">';
        pokemon.evolution.next.forEach(evo => {
            // CORRECTION: On utilise evo.pokedex_id pour trouver l'image
            const evoData = getPokemonById(evo.pokedex_id);
            const imgUrl = evoData ? evoData.sprites.regular : '';

            nextEvoHtml += `
                <div class="text-center flex flex-col items-center">
                    ${imgUrl ? `<img src="${imgUrl}" class="w-20 h-20 object-contain mb-1">` : ''}
                    <p class="text-sm font-bold text-gray-700">#${String(evo.pokedex_id).padStart(3, '0')} ${evo.name}</p>
                    <small class="text-xs text-gray-500">${evo.condition || ''}</small>
                </div>`;
        });
        nextEvoHtml += '</div>';
    }

    const typesHtml = (pokemon.types || []).map(t => {
         const typeClass = t.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
         return `<span class="type-badge type-${typeClass} mr-2">${t.name}</span>`;
    }).join('');

    // CORRECTION: Remplacement de pokedexId par pokedex_id dans l'affichage principal
    modalBody.innerHTML = `
        <div class="flex flex-col md:flex-row gap-6">
            <div class="md:w-1/3 flex flex-col items-center text-center">
                <img src="${pokemon.sprites.regular}" alt="${pokemon.name.fr}" class="w-48 h-48 object-contain mb-4 filter drop-shadow-lg">
                <h2 class="text-2xl font-bold text-gray-900 mb-2">#${String(pokemon.pokedex_id).padStart(3, '0')} - ${pokemon.name.fr}</h2>
                <div class="mb-4">${typesHtml}</div>
                <p class="text-sm text-gray-600"><strong>EN:</strong> ${pokemon.name.en}</p>
                <p class="text-sm text-gray-600"><strong>JP:</strong> ${pokemon.name.jp}</p>
                <div class="mt-4 p-3 bg-gray-100 rounded w-full">
                    <p><strong>Taille:</strong> ${pokemon.height || '?'} | <strong>Poids:</strong> ${pokemon.weight || '?'}</p>
                </div>
            </div>

            <div class="md:w-2/3">
                <h3 class="text-xl font-bold border-b pb-2 mb-4 text-gray-800">Statistiques de Base</h3>
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="bg-gray-50 p-2 rounded border"><strong class="text-red-500">HP:</strong> ${stats.hp}</div>
                    <div class="bg-gray-50 p-2 rounded border"><strong class="text-orange-500">Attaque:</strong> ${stats.atk}</div>
                    <div class="bg-gray-50 p-2 rounded border"><strong class="text-yellow-500">Défense:</strong> ${stats.def}</div>
                    <div class="bg-gray-50 p-2 rounded border"><strong class="text-blue-500">Atq. Spé:</strong> ${stats.spe_atk}</div>
                    <div class="bg-gray-50 p-2 rounded border"><strong class="text-green-500">Déf. Spé:</strong> ${stats.spe_def}</div>
                    <div class="bg-gray-50 p-2 rounded border"><strong class="text-pink-500">Vitesse:</strong> ${stats.vit}</div>
                </div>

                <div class="border-t pt-4">
                    ${preEvoHtml}
                    ${nextEvoHtml}
                    ${(!preEvoHtml && !nextEvoHtml) ? '<p class="text-center text-gray-400 italic mt-4">Aucune évolution connue.</p>' : ''}
                </div>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

function closeModal() {
    if(modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

// --- CREATION MODALE HTML ---
function createModalInDOM() {
    if(document.getElementById('pokemon-modal')) {
        modal = document.getElementById('pokemon-modal');
        modalBody = document.getElementById('modal-body-content');
        closeBtn = document.getElementById('modal-close-btn');
        return;
    }

    const modalHtml = `
        <div id="pokemon-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black bg-opacity-70 p-4" style="display:none;">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-fade-in">
                <div class="sticky top-0 right-0 p-4 flex justify-end">
                    <button id="modal-close-btn" class="text-gray-500 hover:text-red-600 text-4xl font-bold focus:outline-none">&times;</button>
                </div>
                <div id="modal-body-content" class="p-6 pt-0"></div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    modal = document.getElementById('pokemon-modal');
    modalBody = document.getElementById('modal-body-content');
    closeBtn = document.getElementById('modal-close-btn');

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if(e.target === modal) closeModal();
    });
}

function showLoading(isLoading) {
    if (!loadingSpinnerEl) return;
    if (isLoading) {
        loadingSpinnerEl.classList.remove('hidden');
    } else {
        loadingSpinnerEl.classList.add('hidden');
    }
}