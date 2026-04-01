const apiUrl = "https://tyradex.vercel.app/api/v1/pokemon";
    const itemsPerPage = 20;
    let currentPage = 1;
    let allPokemon = [];

    async function fetchPokemon() {
      const res = await fetch(apiUrl);
      allPokemon = await res.json();
      renderPage(currentPage);
      renderPagination();
    }

    function renderPage(page) {
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const pageItems = allPokemon.slice(start, end);

      const list = document.getElementById("pokemonList");
      list.innerHTML = "";
      document.getElementById("pokemonDetails").style.display = "none";
      list.style.display = "flex";

      pageItems.forEach(pokemon => {
        const card = document.createElement("div");
        card.className = "pokemon-card";
        card.onclick = () => showDetails(pokemon);

        const types = pokemon.types.map(t => `<span class="type">${t.name}</span>`).join("");

        card.innerHTML = `
          <h3>${pokemon.name.fr}</h3>
          <img src="${pokemon.sprites.regular}" alt="${pokemon.name.fr}">
          <div class="types">${types}</div>
        `;
        list.appendChild(card);
      });
    }

    function renderPagination() {
      const totalPages = Math.ceil(allPokemon.length / itemsPerPage);
      const pagination = document.getElementById("pagination");
      pagination.innerHTML = "";

      for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        btn.onclick = () => {
          currentPage = i;
          renderPage(i);
        };
        pagination.appendChild(btn);
      }
    }

    function showDetails(pokemon) {
      const details = document.getElementById("pokemonDetails");
      details.innerHTML = "";
      details.style.display = "flex";
      document.getElementById("pokemonList").style.display = "none";

      const types = pokemon.types.map(t => `<span class="type">${t.name}</span>`).join("");
      const evolutions = pokemon.evolution?.next?.map(e => e.name) || ["Aucune"];

      const card = document.createElement("div");
      card.className = "details-card";
      card.innerHTML = `
        <h2>${pokemon.name.fr}</h2>
        <img src="${pokemon.sprites.regular}" alt="${pokemon.name.fr}">
        <p><strong>Types :</strong> ${types}</p>
        <p><strong>Évolutions :</strong> ${evolutions.join(", ")}</p>
        <p><strong>Poids :</strong> ${pokemon.stats.weight} kg</p>
        <p><strong>Taille :</strong> ${pokemon.stats.height} m</p>
        <p><strong>Nom anglais :</strong> ${pokemon.name.en}</p>
        <p><strong>Nom japonais :</strong> ${pokemon.name.jp}</p>
        <button class="back-button" onclick="renderPage(currentPage)">Retour</button>
      `;
      details.appendChild(card);
    }

    fetchPokemon();