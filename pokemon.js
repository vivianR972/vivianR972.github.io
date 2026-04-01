const searchBar = document.getElementById('search-bar');
        const generationSelect = document.getElementById('generation-select');
        const pokemonContainer = document.getElementById('pokemon-container');
        const infoMessage = document.getElementById('info-message');
        const modal = document.getElementById('pokemon-modal');
        const modalBody = document.getElementById('modal-body-content');
        const closeBtn = document.querySelector('.close-btn');

        let allPokemons = [];

        const getPokemonById = (id) => allPokemons.find(p => p.pokedex_id === id);

        async function fetchAllPokemons() {
            infoMessage.textContent = 'Chargement du Pokédex...';
            try {
                const response = await fetch('https://tyradex.app/api/v1/pokemon');
                const data = await response.json();
                allPokemons = data.filter(p => p.pokedex_id !== 0 && p.name.fr);
                applyFilters();
            } catch (error) {
                infoMessage.textContent = "Impossible de charger les données des Pokémon.";
                console.error("Erreur de chargement:", error);
            }
        }

        function applyFilters() {
            const searchTerm = searchBar.value.toLowerCase();
            const selectedGen = generationSelect.value;

            const filteredPokemons = allPokemons.filter(pokemon => {
                const isInGeneration = (selectedGen === 'all') || (pokemon.generation == selectedGen);
                const matchesSearch = pokemon.name.fr.toLowerCase().includes(searchTerm) ||
                                      pokemon.name.en.toLowerCase().includes(searchTerm) ||
                                      pokemon.name.jp.toLowerCase().includes(searchTerm);
                return isInGeneration && matchesSearch;
            });

            renderPokemonList(filteredPokemons);
        }

        function renderPokemonList(list) {
            pokemonContainer.innerHTML = '';
            infoMessage.textContent = list.length === 0 ? 'Aucun Pokémon ne correspond à vos critères.' : '';

            list.forEach(pokemon => {
                const pokemonCard = document.createElement('div');
                pokemonCard.className = 'pokemon-card';

                const typesHtml = pokemon.types.map(type =>
                    `<span class="type-badge type-${type.name}">${type.name}</span>`
                ).join('');

                pokemonCard.innerHTML = `
                    <div>
                        <p class="pokedex-id">#${String(pokemon.pokedex_id).padStart(3, '0')}</p>
                        <img src="${pokemon.sprites.regular}" alt="${pokemon.name.fr}">
                        <h2>${pokemon.name.fr}</h2>
                        <p class="pokemon-names-other">EN: ${pokemon.name.en} / JP: ${pokemon.name.jp}</p>
                        <div class="types-container">${typesHtml}</div>
                    </div>
                    <button class="details-btn">Détails</button>
                `;
                
                pokemonCard.querySelector('.details-btn').addEventListener('click', () => showDetails(pokemon));
                pokemonContainer.appendChild(pokemonCard);
            });
        }

        function showDetails(pokemon) {
            const stats = pokemon.stats;
            const pokedexEntry = Object.values(pokemon.pokedex_entries || {}).find(entry => entry.lang === 'fr')?.description || "Aucune description disponible.";

            let preEvoHtml = '';
            if (pokemon.evolution?.pre && pokemon.evolution.pre.length > 0) {
                preEvoHtml = '<h4>Pré-évolutions</h4><div class="evolution-list">';
                pokemon.evolution.pre.forEach(evo => {
                    const evoData = getPokemonById(evo.pokedex_id);
                    preEvoHtml += `<div class="evolution-card">
                        <img src="${evoData.sprites.regular}" alt="${evo.name}">
                        <p>#${String(evo.pokedex_id).padStart(3, '0')} ${evo.name}</p>
                    </div>`;
                });
                preEvoHtml += '</div>';
            }

            let nextEvoHtml = '';
            if (pokemon.evolution?.next && pokemon.evolution.next.length > 0) {
                nextEvoHtml = '<h4>Évolutions</h4><div class="evolution-list">';
                pokemon.evolution.next.forEach(evo => {
                    const evoData = getPokemonById(evo.pokedex_id);
                    nextEvoHtml += `<div class="evolution-card">
                        <img src="${evoData.sprites.regular}" alt="${evo.name}">
                        <p>#${String(evo.pokedex_id).padStart(3, '0')} ${evo.name}</p>
                        <small>(${evo.condition})</small>
                    </div>`;
                });
                nextEvoHtml += '</div>';
            }

            modalBody.innerHTML = `
                <div class="modal-body">
                    <div class="modal-left">
                        <img src="${pokemon.sprites.regular}" alt="${pokemon.name.fr}">
                        <h2>#${String(pokemon.pokedex_id).padStart(3, '0')} - ${pokemon.name.fr}</h2>
                        <p class="pokemon-names-other"><strong>EN:</strong> ${pokemon.name.en} / <strong>JP:</strong> ${pokemon.name.jp}</p>
                        <p><strong>Taille :</strong> ${pokemon.height} | <strong>Poids :</strong> ${pokemon.weight}</p>
                    </div>

                        <h4>Statistiques de Base</h4>
                        <div class="stats-grid">
                            <span><strong>HP :</strong> ${stats.hp}</span>
                            <span><strong>Attaque :</strong> ${stats.atk}</span>
                            <span><strong>Défense :</strong> ${stats.def}</span>
                            <span><strong>Atq. Spé. :</strong> ${stats.spe_atk}</span>
                            <span><strong>Déf. Spé. :</strong> ${stats.spe_def}</span>
                            <span><strong>Vitesse :</strong> ${stats.vit}</span>
                        </div>
                        
                        <div class="evolutions">
                            ${preEvoHtml || ''}
                            ${nextEvoHtml || '<h4>N\'a pas d\'évolution</h4>'}
                        </div>
                    </div>
                </div>
            `;
            modal.style.display = 'block';
        }

        function closeModal() {
            modal.style.display = 'none';
        }
        closeBtn.addEventListener('click', closeModal);
        window.addEventListener('click', (event) => {
            if (event.target == modal) {
                closeModal();
            }
        });

        searchBar.addEventListener('input', applyFilters);
        generationSelect.addEventListener('change', applyFilters);

        fetchAllPokemons();
