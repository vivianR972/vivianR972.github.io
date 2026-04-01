const teamDisplay = document.getElementById('team-display');
        const randomBtn = document.getElementById('random-btn');
        const clearBtn = document.getElementById('clear-btn');
        const strengthsList = document.querySelector('#strengths .types-list');
        const weaknessesList = document.querySelector('#weaknesses .types-list');
        const verdictSection = document.getElementById('verdict-section');
        const verdictText = document.getElementById('verdict-text');
        const modal = document.getElementById('selection-modal');
        const closeModalBtn = document.querySelector('.close-btn');
        const modalSearch = document.getElementById('modal-search');
        const pokemonListContainer = document.getElementById('pokemon-list');

        let allPokemons = [];
        let team = Array(6).fill(null);
        let currentSlot = 0;

        const typeChart = {
            Normal: { Roche: 0.5, Spectre: 0, Acier: 0.5 }, Feu: { Feu: 0.5, Eau: 0.5, Plante: 2, Glace: 2, Insecte: 2, Roche: 0.5, Dragon: 0.5, Acier: 2 }, Eau: { Feu: 2, Eau: 0.5, Plante: 0.5, Sol: 2, Roche: 2, Dragon: 0.5 }, Plante: { Feu: 0.5, Eau: 2, Plante: 0.5, Poison: 0.5, Sol: 2, Vol: 0.5, Insecte: 0.5, Roche: 2, Dragon: 0.5, Acier: 0.5 }, Électrik: { Eau: 2, Plante: 0.5, Électrik: 0.5, Sol: 0, Vol: 2, Dragon: 0.5 }, Glace: { Feu: 0.5, Eau: 0.5, Plante: 2, Glace: 0.5, Sol: 2, Vol: 2, Dragon: 2, Acier: 0.5 }, Combat: { Normal: 2, Glace: 2, Poison: 0.5, Vol: 0.5, Psy: 0.5, Insecte: 0.5, Roche: 2, Spectre: 0, Ténèbres: 2, Acier: 2, Fée: 0.5 }, Poison: { Plante: 2, Poison: 0.5, Sol: 0.5, Roche: 0.5, Spectre: 0.5, Acier: 0, Fée: 2 }, Sol: { Feu: 2, Plante: 0.5, Électrik: 2, Poison: 2, Vol: 0, Insecte: 0.5, Roche: 2, Acier: 2 }, Vol: { Plante: 2, Électrik: 0.5, Combat: 2, Insecte: 2, Roche: 0.5, Acier: 0.5 }, Psy: { Combat: 2, Poison: 2, Psy: 0.5, Ténèbres: 0, Acier: 0.5 }, Insecte: { Feu: 0.5, Plante: 2, Combat: 0.5, Poison: 0.5, Vol: 0.5, Psy: 2, Spectre: 0.5, Ténèbres: 2, Acier: 0.5, Fée: 0.5 }, Roche: { Feu: 2, Glace: 2, Combat: 0.5, Sol: 0.5, Vol: 2, Insecte: 2, Acier: 0.5 }, Spectre: { Normal: 0, Psy: 2, Spectre: 2, Ténèbres: 0.5 }, Dragon: { Dragon: 2, Acier: 0.5, Fée: 0 }, Ténèbres: { Combat: 0.5, Psy: 2, Spectre: 2, Ténèbres: 0.5, Fée: 0.5 }, Acier: { Glace: 2, Roche: 2, Acier: 0.5, Feu: 0.5, Eau: 0.5, Électrik: 0.5, Fée: 2 }, Fée: { Combat: 2, Poison: 0.5, Dragon: 2, Ténèbres: 2, Acier: 0.5, Feu: 0.5 }
        };
        const allTypes = Object.keys(typeChart);

        async function initialize() {
            try {
                const response = await fetch('https://tyradex.app/api/v1/pokemon');
                const data = await response.json();
                allPokemons = data.filter(p => p.pokedex_id !== 0 && p.name.fr);
                renderTeam();
                setupEventListeners();
                renderPokemonListInModal(allPokemons);
            } catch (error) {
                console.error("Erreur de chargement des Pokémon:", error);
            }
        }

        function renderTeam() {
            teamDisplay.innerHTML = '';
            team.forEach((pokemon, index) => {
                const slot = document.createElement('div');
                slot.className = 'team-slot';
                slot.dataset.slot = index;
                if (pokemon) {
                    slot.classList.add('filled');
                    slot.innerHTML = `<img src="${pokemon.sprites.regular}" alt="${pokemon.name.fr}"><p>${pokemon.name.fr}</p>`;
                    slot.onclick = () => { team[index] = null; renderTeam(); };
                } else {
                    slot.innerHTML = `<span class="slot-placeholder">+</span>`;
                    slot.onclick = () => openModal(index);
                }
                teamDisplay.appendChild(slot);
            });
            analyzeTeam();
        }

        function analyzeTeam() {
            strengthsList.innerHTML = '';
            weaknessesList.innerHTML = '';
            const teamMembers = team.filter(p => p !== null);

            if (teamMembers.length === 0) {
                giveVerdict(null);
                return;
            }

            const analysis = { weaknesses: new Map(), strengths: new Map() };
            allTypes.forEach(attackingType => {
                let weakCount = 0;
                let resistantCount = 0;
                teamMembers.forEach(pokemon => {
                    let totalMultiplier = 1;
                    pokemon.types.forEach(defendingType => {
                        totalMultiplier *= typeChart[attackingType][defendingType.name] ?? 1;
                    });
                    if (totalMultiplier >= 2) weakCount++;
                    if (totalMultiplier < 1) resistantCount++;
                });
                if (weakCount >= 2) analysis.weaknesses.set(attackingType, weakCount);
                if (resistantCount >= 3) analysis.strengths.set(attackingType, resistantCount);
            });

            analysis.weaknesses.forEach((count, type) => weaknessesList.appendChild(createTypeBadge(type)));
            analysis.strengths.forEach((count, type) => strengthsList.appendChild(createTypeBadge(type)));
            giveVerdict(analysis);
        }
        
        function giveVerdict(analysis) {
            const teamMembers = team.filter(p => p !== null);
            verdictSection.className = ''; // Reset class

            if (teamMembers.length < 6) {
                verdictSection.classList.add('verdict-incomplete');
                verdictText.innerHTML = "Votre équipe n'est pas complète.";
                return;
            }

            const criticalWeaknesses = [...analysis.weaknesses.entries()].filter(([type, count]) => count >= 3);
            const majorWeaknesses = [...analysis.weaknesses.entries()].filter(([type, count]) => count >= 4);

            if (majorWeaknesses.length > 0) {
                verdictSection.classList.add('verdict-bad');
                verdictText.innerHTML = `🔴 <b>Équipe Fragile</b> : Attention, ${majorWeaknesses[0][1]} de vos Pokémon sont très vulnérables au type <b>${majorWeaknesses[0][0]}</b>.`;
            } else if (criticalWeaknesses.length > 0) {
                verdictSection.classList.add('verdict-average');
                verdictText.innerHTML = `🟡 <b>Équipe Moyenne</b> : Votre équipe a du potentiel, mais elle présente une faiblesse notable au type <b>${criticalWeaknesses[0][0]}</b>.`;
            } else {
                verdictSection.classList.add('verdict-good');
                verdictText.innerHTML = "🟢 <b>Bonne Équipe</b> : Votre équipe semble bien équilibrée, sans faiblesses critiques partagées.";
            }
        }

        function createTypeBadge(type) {
            const badge = document.createElement('span');
            badge.className = `type-badge type-${type}`;
            badge.textContent = type;
            return badge;
        }

        function openModal(slotIndex) {
            currentSlot = slotIndex;
            modal.style.display = 'block';
            modalSearch.focus();
        }

        function closeModal() {
            modal.style.display = 'none';
            modalSearch.value = '';
            renderPokemonListInModal(allPokemons);
        }
        
        function renderPokemonListInModal(list) {
            pokemonListContainer.innerHTML = '';
            list.forEach(pokemon => {
                const item = document.createElement('div');
                item.className = 'list-item';
                item.innerHTML = `<img src="${pokemon.sprites.regular}" alt="${pokemon.name.fr}"><p>${pokemon.name.fr}</p>`;
                item.onclick = () => { team[currentSlot] = pokemon; renderTeam(); closeModal(); };
                pokemonListContainer.appendChild(item);
            });
        }

        function setupEventListeners() {
            closeModalBtn.onclick = closeModal;
            window.onclick = (event) => { if (event.target == modal) closeModal(); };
            modalSearch.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const filteredList = allPokemons.filter(p => p.name.fr.toLowerCase().includes(searchTerm));
                renderPokemonListInModal(filteredList);
            });
            randomBtn.addEventListener('click', () => {
                const shuffled = [...allPokemons].sort(() => 0.5 - Math.random());
                team = shuffled.slice(0, 6);
                renderTeam();
            });
            clearBtn.addEventListener('click', () => {
                team.fill(null);
                renderTeam();
            });
        }

        initialize();