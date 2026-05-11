const BASE_URL = "http://192.168.1.6:8000";

let currentIndex = 0;

async function loadInitiative() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();

        const list = document.getElementById("initiative-list");
        list.innerHTML = "";

        data.forEach((e, index) => {
            const div = document.createElement("div");
            div.classList.add("entry");

            if (index === currentIndex) {
                div.classList.add("current");
            }

            div.innerHTML = `${index + 1}. ${e.name} 
            [${e.hp}/${e.max_hp}] 
            INIT: ${e.initiative}
            <button onclick="editHP(${e.character_id}, ${e.max_hp})">HP</button>
            <button onclick="editInitiative(${e.character_id})">INIT</button>`;
            
            list.appendChild(div);
        });

    } catch (err) {
        document.getElementById("status").innerText = "ERROR";
        console.error(err);
    }
}

// добавление в инициативу
async function addToInitiative() {
    const character_id = document.getElementById("character-select").value;
    const initiative = document.getElementById("initiative-input").value;

    if (!initiative) return;

    await fetch("http://localhost:8000/initiative/add", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            character_id: Number(character_id),
            initiative: Number(initiative)
        })
    });

    loadInitiative();
}

// редактирование HP
async function editHP(id, max_hp) {
    let value = prompt("New HP:");

    if (!value) return;

    value = Number(value);

    if (value > max_hp) value = max_hp;
    if (value < 0) value = 0;

    await fetch(`http://localhost:8000/characters/${id}/hp`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({current_hp: value})
    });

    loadInitiative();
}

// редактирование инициативы
async function editInitiative(id) {
    const value = prompt("New Initiative:");

    if (!value) return;

    await fetch(`http://localhost:8000/initiative/${id}`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({initiative: Number(value)})
    });

    loadInitiative();
}

// следующий ход
function nextTurn() {
    const entries = document.querySelectorAll(".entry");

    if (entries.length === 0) return;

    currentIndex++;
    if (currentIndex >= entries.length) {
        currentIndex = 0;
    }

    loadInitiative();
}

// очистка (через API)
async function clearInitiative() {
    await fetch("http://localhost:8000/initiative/clear", {
        method: "DELETE"
    });
    currentIndex = 0;
    loadInitiative();
}

// клавиши
document.addEventListener("keydown", (e) => {
    if (e.key === "F2") {
        e.preventDefault();
        loadInitiative();
    }

    if (e.key === "F3") {
        e.preventDefault();
        clearInitiative();
    }

    if (e.key === " ") {
        e.preventDefault(); // Добавил preventDefault для пробела
        nextTurn();
    }
});

async function loadCharacters() {
    try {
        const res = await fetch("http://localhost:8000/characters");
        const data = await res.json();

        console.log(data); // ВАЖНО

        const select = document.getElementById("character-select");
        select.innerHTML = "";

        data.forEach(c => {
            const option = document.createElement("option");
            option.value = c.id;
            option.innerText = c.name;
            select.appendChild(option);
        });

    } catch (err) {
        console.error(err);
    }
}

// автообновление
setInterval(loadInitiative, 2000);

// старт
loadInitiative();
loadCharacters();