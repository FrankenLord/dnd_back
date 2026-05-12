const BASE_URL = window.location.origin;
const STATS = ["STR", "DEX", "CON", "INT", "WIS", "LUC"];
const BAG_ROWS = 4;
const BAG_COLS = 7;

let role = localStorage.getItem("dcc_role");
let masterAuthorized = localStorage.getItem("dcc_master_auth") === "true";
let playerCharacterId = Number(localStorage.getItem("dcc_character_id")) || null;
let characters = [];
let initiative = [];
let activeSheetCharacterId = null;
let bagEditor = null;

const elements = {
    status: document.getElementById("status"),
    roleScreen: document.getElementById("role-screen"),
    masterLogin: document.getElementById("master-login"),
    masterLoginError: document.getElementById("master-login-error"),
    playerSetup: document.getElementById("player-setup"),
    masterView: document.getElementById("master-view"),
    playerView: document.getElementById("player-view"),
    sheetView: document.getElementById("sheet-view"),
    bagEditorView: document.getElementById("bag-editor-view"),
    characterSelect: document.getElementById("character-select"),
    playerCharacterSelect: document.getElementById("player-character-select"),
    masterSheetSelect: document.getElementById("master-sheet-select"),
    initiativeList: document.getElementById("initiative-list"),
    playerName: document.getElementById("player-name"),
    playerSummary: document.getElementById("player-summary"),
    playerBagGrid: document.getElementById("player-bag-grid"),
    playerInventoryList: document.getElementById("player-inventory-list"),
    turnStatus: document.getElementById("turn-status"),
    sheetTitle: document.getElementById("sheet-title"),
    sheetContent: document.getElementById("sheet-content"),
    bagEditorTitle: document.getElementById("bag-editor-title"),
    itemNameInput: document.getElementById("item-name-input"),
    shapeGrid: document.getElementById("shape-grid"),
    placementGrid: document.getElementById("placement-grid"),
    confirmBagEditButton: document.getElementById("confirm-bag-edit-button"),
};

function showOnly(viewName) {
    const views = [
        elements.roleScreen,
        elements.masterLogin,
        elements.playerSetup,
        elements.masterView,
        elements.playerView,
        elements.sheetView,
        elements.bagEditorView,
    ];

    views.forEach((view) => view.classList.add("hidden"));
    elements[viewName].classList.remove("hidden");
}

async function api(path, options = {}) {
    const response = await fetch(`${BASE_URL}${path}`, {
        headers: {"Content-Type": "application/json"},
        ...options,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "Ошибка API");
    }

    return response.json();
}

function setRole(nextRole) {
    role = nextRole;
    localStorage.setItem("dcc_role", nextRole);
    renderCurrentRole();
}

function renderCurrentRole() {
    if (role === "master") {
        showOnly(masterAuthorized ? "masterView" : "masterLogin");
        return;
    }

    if (role === "player") {
        showOnly(playerCharacterId ? "playerView" : "playerSetup");
        renderPlayerView();
        return;
    }

    showOnly("roleScreen");
}

async function loadCharacters() {
    characters = await api("/characters");
    fillCharacterSelect(elements.characterSelect);
    fillCharacterSelect(elements.playerCharacterSelect);
    fillCharacterSelect(elements.masterSheetSelect);
}

function fillCharacterSelect(select) {
    const selectedValue = select.value;
    select.innerHTML = "";

    characters.forEach((character) => {
        const option = document.createElement("option");
        option.value = character.id;
        option.textContent = character.name;
        select.appendChild(option);
    });

    if (selectedValue) {
        select.value = selectedValue;
    }
}

async function loadInitiative() {
    try {
        initiative = await api("/initiative");
        elements.status.textContent = "ONLINE";
        renderMasterInitiative();
        await renderPlayerView();
    } catch (error) {
        elements.status.textContent = "ERROR";
        console.error(error);
    }
}

function renderMasterInitiative() {
    elements.initiativeList.innerHTML = "";

    initiative.forEach((entry) => {
        const div = document.createElement("div");
        div.className = entry.is_current ? "entry current" : "entry";

        const hpButton = entry.hp === null
            ? ""
            : `<button data-action="hp" data-type="${entry.type}" data-id="${entry.character_id || entry.monster_id}" data-max="${entry.max_hp}">HP</button>`;

        div.innerHTML = `
            <div>
                <strong>${entry.position}. ${entry.name}</strong>
                <span>[${entry.hp}/${entry.max_hp}] INIT: ${entry.initiative}</span>
            </div>
            <div class="entry-actions">
                ${hpButton}
                <button data-action="initiative" data-entry-id="${entry.entry_id}">INIT</button>
            </div>
        `;

        elements.initiativeList.appendChild(div);
    });
}

async function renderPlayerView() {
    if (role !== "player" || !playerCharacterId) return;

    const character = characters.find((item) => item.id === playerCharacterId);
    const initiativeEntry = initiative.find(
        (item) => item.character_id === playerCharacterId
    );

    if (!character) {
        showOnly("playerSetup");
        return;
    }

    elements.playerName.textContent = character.name;

    if (initiativeEntry?.is_current) {
        elements.turnStatus.textContent = "СЕЙЧАС ТВОЙ ХОД";
        elements.turnStatus.className = "turn-status active";
    } else if (initiativeEntry?.is_next) {
        elements.turnStatus.textContent = "ТЫ СЛЕДУЮЩИЙ";
        elements.turnStatus.className = "turn-status next";
    } else {
        elements.turnStatus.textContent = "СЕЙЧАС НЕ ТВОЙ ХОД";
        elements.turnStatus.className = "turn-status";
    }

    elements.playerSummary.innerHTML = `
        <div class="hp-line">HP: ${character.current_hp}/${character.max_hp}</div>
        <div class="stats-grid">
            ${STATS.map((stat) => `
                <div>${stat}: ${character[`current_${stat}`]}/${character[stat]}</div>
            `).join("")}
        </div>
    `;

    const items = await loadInventory(character.id);
    renderInventory(elements.playerBagGrid, elements.playerInventoryList, character.id, items);
}

async function createCharacterFromForm() {
    const data = {
        name: document.getElementById("new-character-name").value.trim(),
        clas: document.getElementById("new-character-class").value.trim() || "DCC",
        max_hp: readNumber("new-character-hp", 1),
        STR: readNumber("new-character-str", 10),
        DEX: readNumber("new-character-dex", 10),
        CON: readNumber("new-character-con", 10),
        INT: readNumber("new-character-int", 10),
        WIS: readNumber("new-character-wis", 10),
        LUC: readNumber("new-character-luc", 10),
    };

    if (!data.name) return;

    const character = await api("/characters/", {
        method: "POST",
        body: JSON.stringify(data),
    });

    playerCharacterId = character.id;
    localStorage.setItem("dcc_character_id", playerCharacterId);
    await loadCharacters();
    renderCurrentRole();
}

function readNumber(id, fallback) {
    const value = Number(document.getElementById(id).value);
    return Number.isNaN(value) || value <= 0 ? fallback : value;
}

async function addToInitiative() {
    const characterId = Number(elements.characterSelect.value);
    const initiativeValue = Number(document.getElementById("initiative-input").value);

    if (!characterId || Number.isNaN(initiativeValue)) return;

    await api("/initiative/add", {
        method: "POST",
        body: JSON.stringify({
            character_id: characterId,
            initiative: initiativeValue,
        }),
    });

    await loadInitiative();
}

async function addMonsterToInitiative() {
    const name = document.getElementById("monster-name-input").value.trim();
    const maxHp = Number(document.getElementById("monster-hp-input").value);
    const initiativeValue = Number(document.getElementById("monster-initiative-input").value);

    if (!name || Number.isNaN(maxHp) || Number.isNaN(initiativeValue)) return;

    await api("/initiative/monster", {
        method: "POST",
        body: JSON.stringify({
            name,
            max_hp: maxHp,
            initiative: initiativeValue,
        }),
    });

    await loadInitiative();
}

async function editHP(type, id, maxHp) {
    const value = Number(prompt("Новое текущее HP:"));
    if (Number.isNaN(value)) return;

    const path = type === "character"
        ? `/characters/${id}/hp`
        : `/monsters/${id}/hp`;

    await api(path, {
        method: "PATCH",
        body: JSON.stringify({current_hp: Math.max(0, Math.min(value, maxHp))}),
    });

    await loadCharacters();
    await loadInitiative();
}

async function editInitiative(entryId) {
    const value = Number(prompt("Новая инициатива:"));
    if (Number.isNaN(value)) return;

    await api(`/initiative/${entryId}`, {
        method: "PATCH",
        body: JSON.stringify({initiative: value}),
    });

    await loadInitiative();
}

async function nextTurn() {
    await api("/turn/next", {method: "POST"});
    await loadInitiative();
}

async function clearInitiative() {
    await api("/initiative/clear", {method: "DELETE"});
    await loadInitiative();
}

async function openSheet(characterId) {
    const character = characters.find((item) => item.id === Number(characterId));
    if (!character) return;

    activeSheetCharacterId = character.id;
    elements.sheetTitle.textContent = character.name;

    const items = await loadInventory(character.id);

    elements.sheetContent.innerHTML = `
        <div class="sheet-grid">
            <section>
                <h3>HP</h3>
                <div class="stat-editor">
                    <span>${character.current_hp}/${character.max_hp}</span>
                    <button data-sheet-action="hp-damage" data-id="${character.id}">-</button>
                    <button data-sheet-action="hp-heal" data-id="${character.id}">+</button>
                </div>
            </section>
            <section>
                <h3>Статы</h3>
                ${STATS.map((stat) => `
                    <div class="stat-editor">
                        <span>${stat}: ${character[`current_${stat}`]}/${character[stat]}</span>
                        <button data-sheet-action="stat-minus" data-id="${character.id}" data-stat="${stat}">-</button>
                        <button data-sheet-action="stat-plus" data-id="${character.id}" data-stat="${stat}">+</button>
                    </div>
                `).join("")}
            </section>
        </div>
        <section class="panel">
            <div class="row">
                <h2>Сумка</h2>
                <button data-inventory-action="add" data-character-id="${character.id}">Добавить предмет</button>
            </div>
            <div class="inventory-layout">
                <div id="sheet-bag-grid" class="bag-grid"></div>
                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Название</th>
                                <th>Клетки</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody id="sheet-inventory-list"></tbody>
                    </table>
                </div>
            </div>
        </section>
    `;

    renderInventory(
        document.getElementById("sheet-bag-grid"),
        document.getElementById("sheet-inventory-list"),
        character.id,
        items
    );
    showOnly("sheetView");
}

async function updateCharacterHP(characterId, delta) {
    const character = characters.find((item) => item.id === Number(characterId));
    if (!character) return;

    await api(`/characters/${character.id}/hp`, {
        method: "PATCH",
        body: JSON.stringify({current_hp: character.current_hp + delta}),
    });

    await loadCharacters();
    await openSheet(character.id);
}

async function updateCharacterStat(characterId, stat, delta) {
    const character = characters.find((item) => item.id === Number(characterId));
    if (!character) return;

    await api(`/characters/${character.id}/stats`, {
        method: "PATCH",
        body: JSON.stringify({
            [`current_${stat}`]: character[`current_${stat}`] + delta,
        }),
    });

    await loadCharacters();
    await openSheet(character.id);
}

async function loadInventory(characterId) {
    return api(`/characters/${characterId}/inventory`);
}

function renderInventory(grid, tbody, characterId, items) {
    renderBagGrid(grid, items);
    tbody.innerHTML = "";

    items.forEach((item) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.cell_count}</td>
            <td class="table-actions">
                <button data-inventory-action="position" data-character-id="${characterId}" data-item-id="${item.id}">Положение</button>
                <button data-inventory-action="edit" data-character-id="${characterId}" data-item-id="${item.id}">Предмет</button>
                <button data-inventory-action="delete" data-character-id="${characterId}" data-item-id="${item.id}">Удалить</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderBagGrid(grid, items, preview = null) {
    grid.innerHTML = "";
    const occupied = new Map();

    items.forEach((item) => {
        item.shape.forEach((cell) => {
            const row = item.y + cell.row;
            const col = item.x + cell.col;
            occupied.set(`${row}:${col}`, item);
        });
    });

    for (let row = 0; row < BAG_ROWS; row++) {
        for (let col = 0; col < BAG_COLS; col++) {
            const cell = document.createElement("button");
            const item = occupied.get(`${row}:${col}`);
            cell.className = "bag-cell";
            cell.dataset.row = row;
            cell.dataset.col = col;

            if (item) {
                cell.classList.add("filled");
                cell.textContent = item.name.slice(0, 2).toUpperCase();
                cell.title = item.name;
            }

            if (preview?.has(`${row}:${col}`)) {
                cell.classList.add("preview");
            }

            grid.appendChild(cell);
        }
    }
}

function openBagEditor(characterId, item = null, mode = "create") {
    bagEditor = {
        characterId: Number(characterId),
        item,
        mode,
        shape: item ? item.shape.map((cell) => ({...cell})) : [],
        position: item ? {x: item.x, y: item.y} : null,
    };

    elements.bagEditorTitle.textContent = item
        ? mode === "position" ? "Редактировать положение" : "Редактировать предмет"
        : "Добавить предмет";
    elements.itemNameInput.value = item?.name || "";
    elements.itemNameInput.disabled = mode === "position";

    renderBagEditor();
    showOnly("bagEditorView");
}

async function renderBagEditor() {
    if (!bagEditor) return;

    renderShapeGrid();
    const items = await loadInventory(bagEditor.characterId);
    const otherItems = bagEditor.item
        ? items.filter((item) => item.id !== bagEditor.item.id)
        : items;

    const normalizedShape = normalizeClientShape(bagEditor.shape);
    const preview = bagEditor.position
        ? shapeToAbsoluteCells(normalizedShape, bagEditor.position.x, bagEditor.position.y)
        : null;

    renderBagGrid(elements.placementGrid, otherItems, preview);
    updateConfirmState(otherItems);
}

function renderShapeGrid() {
    elements.shapeGrid.innerHTML = "";
    const selected = new Set(bagEditor.shape.map((cell) => `${cell.row}:${cell.col}`));

    for (let row = 0; row < BAG_ROWS; row++) {
        for (let col = 0; col < BAG_COLS; col++) {
            const cell = document.createElement("button");
            cell.className = selected.has(`${row}:${col}`)
                ? "bag-cell selected"
                : "bag-cell";
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.disabled = bagEditor.mode === "position";
            elements.shapeGrid.appendChild(cell);
        }
    }
}

function normalizeClientShape(shape) {
    if (shape.length === 0) return [];

    const minRow = Math.min(...shape.map((cell) => cell.row));
    const minCol = Math.min(...shape.map((cell) => cell.col));

    return shape
        .map((cell) => ({row: cell.row - minRow, col: cell.col - minCol}))
        .sort((a, b) => a.row - b.row || a.col - b.col);
}

function shapeToAbsoluteCells(shape, x, y) {
    return new Set(shape.map((cell) => `${y + cell.row}:${x + cell.col}`));
}

function shapeFits(shape, x, y, items) {
    if (shape.length === 0) return false;

    const cells = shapeToAbsoluteCells(shape, x, y);
    const blocked = new Set();

    items.forEach((item) => {
        item.shape.forEach((cell) => {
            blocked.add(`${item.y + cell.row}:${item.x + cell.col}`);
        });
    });

    for (const key of cells) {
        const [row, col] = key.split(":").map(Number);
        if (row < 0 || row >= BAG_ROWS || col < 0 || col >= BAG_COLS) return false;
        if (blocked.has(key)) return false;
    }

    return true;
}

function updateConfirmState(items) {
    const name = elements.itemNameInput.value.trim();
    const hasName = bagEditor.mode === "position" || name.length > 0;
    const hasPosition = bagEditor.position !== null;
    const normalizedShape = normalizeClientShape(bagEditor.shape);
    const fits = hasPosition
        ? shapeFits(normalizedShape, bagEditor.position.x, bagEditor.position.y, items)
        : false;

    elements.confirmBagEditButton.disabled = !(hasName && fits);
}

async function confirmBagEdit() {
    if (!bagEditor || !bagEditor.position) return;

    const body = {
        name: elements.itemNameInput.value.trim(),
        shape: normalizeClientShape(bagEditor.shape),
        x: bagEditor.position.x,
        y: bagEditor.position.y,
    };

    if (bagEditor.mode === "position") {
        delete body.name;
        delete body.shape;
    }

    if (bagEditor.item) {
        await api(`/characters/${bagEditor.characterId}/inventory/${bagEditor.item.id}`, {
            method: "PATCH",
            body: JSON.stringify(body),
        });
    } else {
        await api(`/characters/${bagEditor.characterId}/inventory`, {
            method: "POST",
            body: JSON.stringify(body),
        });
    }

    await afterInventoryEdit();
}

async function afterInventoryEdit() {
    const characterId = bagEditor.characterId;
    bagEditor = null;

    await loadCharacters();

    if (activeSheetCharacterId === characterId) {
        await openSheet(characterId);
        return;
    }

    renderCurrentRole();
    await renderPlayerView();
}

async function handleInventoryAction(button) {
    const characterId = Number(button.dataset.characterId);
    const action = button.dataset.inventoryAction;

    if (action === "add") {
        openBagEditor(characterId);
        return;
    }

    const itemId = Number(button.dataset.itemId);
    const items = await loadInventory(characterId);
    const item = items.find((value) => value.id === itemId);
    if (!item) return;

    if (action === "position") {
        openBagEditor(characterId, item, "position");
    }

    if (action === "edit") {
        openBagEditor(characterId, item, "edit");
    }

    if (action === "delete") {
        await api(`/characters/${characterId}/inventory/${item.id}`, {method: "DELETE"});
        if (activeSheetCharacterId === characterId) {
            await openSheet(characterId);
        } else {
            await renderPlayerView();
        }
    }
}

elements.roleScreen.addEventListener("click", (event) => {
    if (event.target.id === "player-role-button") setRole("player");
    if (event.target.id === "master-role-button") setRole("master");
});

document.getElementById("master-login-button").addEventListener("click", async () => {
    const password = document.getElementById("master-password-input").value;
    elements.masterLoginError.textContent = "";

    try {
        await api("/auth/master", {
            method: "POST",
            body: JSON.stringify({password}),
        });
        masterAuthorized = true;
        localStorage.setItem("dcc_master_auth", "true");
        renderCurrentRole();
    } catch (error) {
        elements.masterLoginError.textContent = "Неверный пароль";
    }
});

document.getElementById("change-role-button").addEventListener("click", () => {
    role = null;
    masterAuthorized = false;
    playerCharacterId = null;
    activeSheetCharacterId = null;
    localStorage.removeItem("dcc_role");
    localStorage.removeItem("dcc_master_auth");
    localStorage.removeItem("dcc_character_id");
    renderCurrentRole();
});

document.getElementById("save-player-button").addEventListener("click", () => {
    playerCharacterId = Number(elements.playerCharacterSelect.value);
    localStorage.setItem("dcc_character_id", playerCharacterId);
    renderCurrentRole();
});

document.getElementById("create-character-button").addEventListener("click", createCharacterFromForm);
document.getElementById("add-character-button").addEventListener("click", addToInitiative);
document.getElementById("add-monster-button").addEventListener("click", addMonsterToInitiative);
document.getElementById("next-turn-button").addEventListener("click", nextTurn);
document.getElementById("clear-button").addEventListener("click", clearInitiative);

document.getElementById("open-player-sheet-button").addEventListener("click", () => {
    openSheet(playerCharacterId);
});

document.getElementById("open-master-sheet-button").addEventListener("click", () => {
    openSheet(elements.masterSheetSelect.value);
});

document.getElementById("close-sheet-button").addEventListener("click", () => {
    activeSheetCharacterId = null;
    renderCurrentRole();
});

document.getElementById("add-player-item-button").addEventListener("click", () => {
    openBagEditor(playerCharacterId);
});

document.getElementById("cancel-bag-edit-button").addEventListener("click", () => {
    const characterId = bagEditor?.characterId;
    bagEditor = null;
    if (activeSheetCharacterId === characterId) {
        openSheet(characterId);
        return;
    }
    renderCurrentRole();
});

elements.itemNameInput.addEventListener("input", async () => {
    if (!bagEditor) return;
    const items = await loadInventory(bagEditor.characterId);
    const otherItems = bagEditor.item
        ? items.filter((item) => item.id !== bagEditor.item.id)
        : items;
    updateConfirmState(otherItems);
});

elements.confirmBagEditButton.addEventListener("click", confirmBagEdit);

elements.shapeGrid.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button || !bagEditor || bagEditor.mode === "position") return;

    const row = Number(button.dataset.row);
    const col = Number(button.dataset.col);
    const exists = bagEditor.shape.some((cell) => cell.row === row && cell.col === col);

    bagEditor.shape = exists
        ? bagEditor.shape.filter((cell) => !(cell.row === row && cell.col === col))
        : [...bagEditor.shape, {row, col}];
    bagEditor.position = null;

    await renderBagEditor();
});

elements.placementGrid.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button || !bagEditor) return;

    const x = Number(button.dataset.col);
    const y = Number(button.dataset.row);
    const items = await loadInventory(bagEditor.characterId);
    const otherItems = bagEditor.item
        ? items.filter((item) => item.id !== bagEditor.item.id)
        : items;

    const normalizedShape = normalizeClientShape(bagEditor.shape);
    if (!shapeFits(normalizedShape, x, y, otherItems)) return;

    bagEditor.position = {x, y};
    await renderBagEditor();
});

document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-inventory-action]");
    if (button) handleInventoryAction(button);
});

elements.initiativeList.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.dataset.action === "hp") {
        editHP(button.dataset.type, Number(button.dataset.id), Number(button.dataset.max));
    }

    if (button.dataset.action === "initiative") {
        editInitiative(Number(button.dataset.entryId));
    }
});

elements.sheetContent.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    const action = button.dataset.sheetAction;
    const characterId = Number(button.dataset.id);

    if (action === "hp-damage") updateCharacterHP(characterId, -1);
    if (action === "hp-heal") updateCharacterHP(characterId, 1);
    if (action === "stat-minus") updateCharacterStat(characterId, button.dataset.stat, -1);
    if (action === "stat-plus") updateCharacterStat(characterId, button.dataset.stat, 1);
});

document.addEventListener("keydown", (event) => {
    if (role !== "master" || !masterAuthorized) return;

    if (event.key === "F2") {
        event.preventDefault();
        loadInitiative();
    }

    if (event.key === "F3") {
        event.preventDefault();
        clearInitiative();
    }

    if (event.key === " ") {
        event.preventDefault();
        nextTurn();
    }
});

async function start() {
    await loadCharacters();
    await loadInitiative();
    renderCurrentRole();
}

setInterval(async () => {
    if (bagEditor) return;
    await loadCharacters();
    await loadInitiative();
}, 2000);

start();
