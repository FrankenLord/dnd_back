const BASE_URL = window.location.origin;
const STATS = ["STR", "DEX", "CON", "INT", "WIS", "LUC"];
const STAT_LABELS = {
    STR: "СИЛ",
    DEX: "ЛВК",
    CON: "ТЕЛ",
    INT: "ИНТ",
    WIS: "ЛИЧ",
    LUC: "УДЧ",
};
const CHARACTER_CLASSES = ["Воин", "Маг", "Жрец", "Вор", "Дварф", "Эльф", "Полурослик", "Никакой"];
const XP_THRESHOLDS = [0, 10, 50, 110, 190, 290, 410, 550, 710, 890, 1090];
const SAVES = [
    {field: "reflex_save", label: "Реакция"},
    {field: "fortitude_save", label: "Стойкость"},
    {field: "will_save", label: "Воля"},
];
const WARRIOR_LOAD_CLASSES = ["Воин", "Дварф"];
const BAG_ROWS = 4;
const BAG_COLS = 7;

let role = localStorage.getItem("dcc_role");
let masterAuthorized = localStorage.getItem("dcc_master_auth") === "true";
let playerCharacterId = Number(localStorage.getItem("dcc_character_id")) || null;
let playerAccessMode = localStorage.getItem("dcc_player_access_mode");
let currentPlayerProfile = JSON.parse(localStorage.getItem("dcc_player_profile") || "null");
let characters = [];
let playerProfiles = [];
let initiative = [];
let activeSheetCharacterId = null;
let bagEditor = null;
let notesSaveTimer = null;
let campBuildings = [];
const campSaveTimers = new Map();

const elements = {
    status: document.getElementById("status"),
    roleScreen: document.getElementById("role-screen"),
    masterLogin: document.getElementById("master-login"),
    masterLoginError: document.getElementById("master-login-error"),
    playerLogin: document.getElementById("player-login"),
    playerLoginError: document.getElementById("player-login-error"),
    playerSetup: document.getElementById("player-setup"),
    playerAccessLabel: document.getElementById("player-access-label"),
    masterView: document.getElementById("master-view"),
    playerView: document.getElementById("player-view"),
    sheetView: document.getElementById("sheet-view"),
    campView: document.getElementById("camp-view"),
    bagEditorView: document.getElementById("bag-editor-view"),
    characterSelect: document.getElementById("character-select"),
    playerCharacterSelect: document.getElementById("player-character-select"),
    masterSheetSelect: document.getElementById("master-sheet-select"),
    initiativeList: document.getElementById("initiative-list"),
    playerName: document.getElementById("player-name"),
    playerSummary: document.getElementById("player-summary"),
    playerLoadStatus: document.getElementById("player-load-status"),
    playerNotes: document.getElementById("player-notes"),
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
    createCharacterError: document.getElementById("create-character-error"),
    profileError: document.getElementById("profile-error"),
    playerProfileList: document.getElementById("player-profile-list"),
    campList: document.getElementById("camp-list"),
};

function abilityModifier(value) {
    if (value <= 3) return -3;
    if (value <= 5) return -2;
    if (value <= 8) return -1;
    if (value <= 12) return 0;
    if (value <= 15) return 1;
    if (value <= 17) return 2;
    if (value <= 18) return 3;
    if (value <= 20) return 4;
    if (value <= 23) return 5;
    if (value <= 25) return 6;
    if (value <= 28) return 7;
    return 8;
}

function formatModifier(value) {
    const modifier = abilityModifier(Number(value));
    return modifier > 0 ? `+${modifier}` : String(modifier);
}

function formatSigned(value) {
    return value > 0 ? `+${value}` : String(value);
}

function loadCapacity(character) {
    const strength = Number(character.current_STR ?? character.STR);
    const isWarriorLoad = WARRIOR_LOAD_CLASSES.includes(character.clas);

    if (strength <= 3) return isWarriorLoad ? 8 : 4;
    if (strength <= 5) return isWarriorLoad ? 12 : 8;
    if (strength <= 8) return isWarriorLoad ? 16 : 12;
    if (strength <= 12) return isWarriorLoad ? 20 : 16;
    if (strength <= 15) return isWarriorLoad ? 24 : 20;
    if (strength <= 17) return isWarriorLoad ? 28 : 24;
    return 28;
}

function overloadPenalty(extraCells) {
    if (extraCells <= 0) return null;
    if (extraCells <= 4) return "-5ф, -1к действия, +1к фиаско";
    if (extraCells <= 8) return "-10ф, -2к действия, +2к фиаско";
    return "-15ф, -3к действия, +3к фиаско";
}

function renderLoadStatus(character, items) {
    const usedCells = items.reduce((total, item) => total + item.cell_count, 0);
    const capacity = loadCapacity(character);
    const extraCells = Math.max(0, usedCells - capacity);
    const penalty = overloadPenalty(extraCells);

    if (!penalty) {
        return `нет перегруза (${usedCells}/${capacity})`;
    }

    return `перегруз +${extraCells} яч.: ${penalty} (${usedCells}/${capacity})`;
}

function autoSizeTextarea(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
}

function characterLevel(xp) {
    let level = 0;
    XP_THRESHOLDS.forEach((threshold, index) => {
        if (xp >= threshold) level = index;
    });
    return Math.min(level, 10);
}

function xpRange(character) {
    const xp = Number(character.xp || 0);
    const level = characterLevel(xp);
    const current = XP_THRESHOLDS[level];
    const next = XP_THRESHOLDS[Math.min(level + 1, 10)];
    const range = Math.max(1, next - current);
    const progress = level >= 10 ? 100 : Math.max(0, Math.min(100, ((xp - current) / range) * 100));

    return {xp, level, current, next, progress};
}

function renderXPBlock(character, actionLocation) {
    const range = xpRange(character);

    return `
        <div class="xp-block">
            <div class="xp-meta">
                <span>${range.current}</span>
                <strong>${range.xp}/${range.next} XP</strong>
                <span>${range.next}</span>
            </div>
            <div class="xp-track" aria-label="Опыт">
                <div class="xp-fill" style="width: ${range.progress}%"></div>
            </div>
            <button data-xp-action="add" data-id="${character.id}" data-location="${actionLocation}">Добавить XP</button>
        </div>
    `;
}

function classOptions(selectedClass) {
    return CHARACTER_CLASSES.map((className) => `
        <option value="${className}" ${className === selectedClass ? "selected" : ""}>${className}</option>
    `).join("");
}

function profileOptions(selectedProfileId) {
    return `
        <option value="">Общий персонаж</option>
        ${playerProfiles.map((profile) => `
            <option value="${profile.id}" ${profile.id === selectedProfileId ? "selected" : ""}>${profile.login}</option>
        `).join("")}
    `;
}

function availablePlayerCharacters() {
    if (playerAccessMode === "profile" && currentPlayerProfile) {
        return characters.filter((character) => (
            character.owner_profile_id === null ||
            character.owner_profile_id === currentPlayerProfile.id
        ));
    }

    return characters.filter((character) => character.owner_profile_id === null);
}

function currentPlayerOwnerId() {
    return playerAccessMode === "profile" && currentPlayerProfile
        ? currentPlayerProfile.id
        : null;
}

function showOnly(viewName) {
    const views = [
        elements.roleScreen,
        elements.masterLogin,
        elements.playerLogin,
        elements.playerSetup,
        elements.masterView,
        elements.playerView,
        elements.sheetView,
        elements.campView,
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
        if (masterAuthorized) renderPlayerProfiles();
        return;
    }

    if (role === "player") {
        if (!playerAccessMode) {
            showOnly("playerLogin");
            return;
        }

        if (playerCharacterId && !availablePlayerCharacters().some((item) => item.id === playerCharacterId)) {
            playerCharacterId = null;
            localStorage.removeItem("dcc_character_id");
        }

        showOnly(playerCharacterId ? "playerView" : "playerSetup");
        renderPlayerSetup();
        renderPlayerView();
        return;
    }

    showOnly("roleScreen");
}

async function loadCharacters() {
    characters = await api("/characters");
    fillCharacterSelect(elements.characterSelect, characters);
    fillCharacterSelect(elements.playerCharacterSelect, availablePlayerCharacters());
    fillCharacterSelect(elements.masterSheetSelect, characters);
}

function fillCharacterSelect(select, sourceCharacters = characters) {
    const selectedValue = select.value;
    select.innerHTML = "";

    sourceCharacters.forEach((character) => {
        const option = document.createElement("option");
        option.value = character.id;
        option.textContent = character.owner_profile_id
            ? `${character.name} (${ownerName(character.owner_profile_id)})`
            : `${character.name} (общий)`;
        select.appendChild(option);
    });

    if (selectedValue) {
        select.value = selectedValue;
    }

    select.disabled = sourceCharacters.length === 0;
}

function ownerName(profileId) {
    const profile = playerProfiles.find((item) => item.id === profileId);
    return profile ? profile.login : "профиль";
}

function renderPlayerSetup() {
    if (!elements.playerAccessLabel) return;

    const available = availablePlayerCharacters();
    fillCharacterSelect(elements.playerCharacterSelect, available);
    document.getElementById("save-player-button").disabled = available.length === 0;

    if (playerAccessMode === "profile" && currentPlayerProfile) {
        elements.playerAccessLabel.textContent = `Вход: ${currentPlayerProfile.login}. Доступны свои и общие персонажи.`;
        return;
    }

    elements.playerAccessLabel.textContent = "Гость. Доступны только общие персонажи.";
}

async function loadPlayerProfiles() {
    playerProfiles = await api("/player-profiles");
    renderPlayerProfiles();
}

function renderPlayerProfiles() {
    if (!elements.playerProfileList) return;
    elements.playerProfileList.innerHTML = "";

    if (playerProfiles.length === 0) {
        const empty = document.createElement("p");
        empty.className = "muted";
        empty.textContent = "Профилей игроков пока нет.";
        elements.playerProfileList.appendChild(empty);
        return;
    }

    playerProfiles.forEach((profile) => {
        const row = document.createElement("div");
        row.className = "profile-row";
        row.innerHTML = `
            <strong>${profile.login}</strong>
            <div class="entry-actions">
                <button data-profile-action="login" data-id="${profile.id}">Логин</button>
                <button data-profile-action="password" data-id="${profile.id}">Пароль</button>
                <button data-profile-action="delete" data-id="${profile.id}" class="danger-button">Удалить</button>
            </div>
        `;
        elements.playerProfileList.appendChild(row);
    });
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
                <button data-action="delete-initiative" data-entry-id="${entry.entry_id}">Удалить</button>
            </div>
        `;

        elements.initiativeList.appendChild(div);
    });
}

async function renderPlayerView() {
    if (role !== "player" || !playerCharacterId) return;

    const character = availablePlayerCharacters().find((item) => item.id === playerCharacterId);
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

    const items = await loadInventory(character.id);
    elements.playerSummary.innerHTML = `
        <div class="character-subtitle">${character.clas} ${character.level} уровня</div>
        ${renderXPBlock(character, "player")}
        <div class="hp-line">HP: ${character.current_hp}/${character.max_hp}</div>
        <div>Базовая скорость: ${character.base_speed || 30}</div>
        <div class="stats-grid">
            ${STATS.map((stat) => `
                <div>${STAT_LABELS[stat]}: ${character[`current_${stat}`]}/${character[stat]} (${formatModifier(character[`current_${stat}`])})</div>
            `).join("")}
        </div>
        <div class="stats-grid">
            ${SAVES.map((save) => `
                <div>${save.label}: ${formatSigned(character[save.field])}</div>
            `).join("")}
        </div>
    `;
    elements.playerLoadStatus.textContent = renderLoadStatus(character, items);
    if (document.activeElement !== elements.playerNotes) {
        elements.playerNotes.value = character.notes || "";
        autoSizeTextarea(elements.playerNotes);
    }
    renderInventory(elements.playerBagGrid, elements.playerInventoryList, character.id, items);
}

async function createCharacterFromForm() {
    elements.createCharacterError.textContent = "";

    const data = {
        name: document.getElementById("new-character-name").value.trim(),
        clas: document.getElementById("new-character-class").value,
        owner_profile_id: currentPlayerOwnerId(),
        max_hp: readRequiredNumber("new-character-hp"),
        STR: readRequiredNumber("new-character-str"),
        DEX: readRequiredNumber("new-character-dex"),
        CON: readRequiredNumber("new-character-con"),
        INT: readRequiredNumber("new-character-int"),
        WIS: readRequiredNumber("new-character-wis"),
        LUC: readRequiredNumber("new-character-luc"),
    };

    if (!data.name || !data.clas || Object.values(data).some((value) => value === null)) {
        elements.createCharacterError.textContent = "Заполни имя, класс, HP и все характеристики.";
        return;
    }

    if (data.max_hp < 1) {
        elements.createCharacterError.textContent = "HP при создании не может быть ниже 1.";
        return;
    }

    const invalidStat = STATS.find((stat) => data[stat] < 3 || data[stat] > 18);
    if (invalidStat) {
        elements.createCharacterError.textContent = "Характеристики при создании должны быть от 3 до 18.";
        return;
    }

    let character;
    try {
        character = await api("/characters/", {
            method: "POST",
            body: JSON.stringify(data),
        });
    } catch (error) {
        elements.createCharacterError.textContent = error.message;
        return;
    }

    playerCharacterId = character.id;
    localStorage.setItem("dcc_character_id", playerCharacterId);
    await loadCharacters();
    renderCurrentRole();
}

async function loginPlayerProfile() {
    elements.playerLoginError.textContent = "";
    const login = document.getElementById("player-login-input").value.trim();
    const password = document.getElementById("player-password-input").value;

    try {
        const result = await api("/auth/player", {
            method: "POST",
            body: JSON.stringify({login, password}),
        });
        currentPlayerProfile = result.profile;
        playerAccessMode = "profile";
        localStorage.setItem("dcc_player_profile", JSON.stringify(currentPlayerProfile));
        localStorage.setItem("dcc_player_access_mode", playerAccessMode);
        playerCharacterId = null;
        localStorage.removeItem("dcc_character_id");
        await loadCharacters();
        renderCurrentRole();
    } catch (error) {
        elements.playerLoginError.textContent = "Неверный логин или пароль.";
    }
}

async function loginAsGuest() {
    currentPlayerProfile = null;
    playerAccessMode = "guest";
    playerCharacterId = null;
    localStorage.removeItem("dcc_player_profile");
    localStorage.setItem("dcc_player_access_mode", playerAccessMode);
    localStorage.removeItem("dcc_character_id");
    await loadCharacters();
    renderCurrentRole();
}

async function createPlayerProfile() {
    elements.profileError.textContent = "";
    const login = document.getElementById("profile-login-input").value.trim();
    const password = document.getElementById("profile-password-input").value;

    try {
        await api("/player-profiles", {
            method: "POST",
            body: JSON.stringify({login, password}),
        });
        document.getElementById("profile-login-input").value = "";
        document.getElementById("profile-password-input").value = "";
        await loadPlayerProfiles();
        await loadCharacters();
    } catch (error) {
        elements.profileError.textContent = error.message;
    }
}

async function updatePlayerProfile(profileId, field) {
    const profile = playerProfiles.find((item) => item.id === Number(profileId));
    if (!profile) return;

    const label = field === "login" ? "Новый логин:" : "Новый пароль:";
    const value = prompt(label, field === "login" ? profile.login : "");
    if (value === null) return;

    try {
        await api(`/player-profiles/${profile.id}`, {
            method: "PATCH",
            body: JSON.stringify({[field]: value}),
        });
        await loadPlayerProfiles();
        await loadCharacters();
        renderCurrentRole();
    } catch (error) {
        elements.profileError.textContent = error.message;
    }
}

async function deletePlayerProfile(profileId) {
    const profile = playerProfiles.find((item) => item.id === Number(profileId));
    if (!profile) return;

    if (!confirm(`Удалить профиль ${profile.login}? Персонажи станут общими.`)) return;

    await api(`/player-profiles/${profile.id}`, {method: "DELETE"});
    await loadPlayerProfiles();
    await loadCharacters();
    renderCurrentRole();
}

function readRequiredNumber(id) {
    const rawValue = document.getElementById(id).value;
    if (rawValue === "") return null;

    const value = Number(rawValue);
    return Number.isNaN(value) ? null : value;
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

async function deleteInitiativeEntry(entryId) {
    await api(`/initiative/${entryId}`, {method: "DELETE"});
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
    if (role === "player" && !availablePlayerCharacters().some((item) => item.id === character.id)) {
        return;
    }

    activeSheetCharacterId = character.id;
    elements.sheetTitle.textContent = `Изменить персонажа: ${character.name}`;

    const items = await loadInventory(character.id);

    elements.sheetContent.innerHTML = `
        <div class="sheet-grid">
            <section>
                <h3>Персонаж</h3>
                <div class="stat-editor">
                    <span>${character.clas} ${character.level} уровня</span>
                </div>
                <div class="class-editor">
                    <select data-sheet-class-select="${character.id}">
                        ${classOptions(character.clas)}
                    </select>
                    <button data-sheet-action="class-save" data-id="${character.id}">Класс</button>
                </div>
                <div class="class-editor">
                    <select data-sheet-owner-select="${character.id}">
                        ${profileOptions(character.owner_profile_id)}
                    </select>
                    <button data-sheet-action="owner-save" data-id="${character.id}">Владелец</button>
                </div>
            </section>
            <section>
                <h3>Опыт</h3>
                ${renderXPBlock(character, "sheet")}
            </section>
            <section>
                <h3>HP</h3>
                <div class="stat-editor">
                    <span>${character.current_hp}/${character.max_hp}</span>
                    <button data-sheet-action="hp-damage" data-id="${character.id}">-</button>
                    <button data-sheet-action="max-hp" data-id="${character.id}">Изм. макс.</button>
                    <button data-sheet-action="hp-heal" data-id="${character.id}">+</button>
                </div>
            </section>
            <section>
                <h3>Статы</h3>
                ${STATS.map((stat) => `
                    <div class="stat-editor">
                        <span>${STAT_LABELS[stat]}: ${character[`current_${stat}`]}/${character[stat]} (${formatModifier(character[`current_${stat}`])})</span>
                        <button data-sheet-action="stat-minus" data-id="${character.id}" data-stat="${stat}">-</button>
                        <button data-sheet-action="stat-max" data-id="${character.id}" data-stat="${stat}">Изм. макс.</button>
                        <button data-sheet-action="stat-plus" data-id="${character.id}" data-stat="${stat}">+</button>
                    </div>
                `).join("")}
            </section>
            <section>
                <h3>Спасы</h3>
                ${SAVES.map((save) => `
                    <div class="stat-editor">
                        <span>${save.label}: ${formatSigned(character[save.field])}</span>
                        <button data-sheet-action="save-minus" data-id="${character.id}" data-save="${save.field}">-</button>
                        <button data-sheet-action="save-plus" data-id="${character.id}" data-save="${save.field}">+</button>
                    </div>
                `).join("")}
            </section>
            <section>
                <h3>Скорость</h3>
                <div class="stat-editor">
                    <span>Базовая скорость: ${character.base_speed || 30}</span>
                </div>
            </section>
        </div>
        <section class="panel">
            <div class="row">
                <h2>Сумка <span class="load-status">${renderLoadStatus(character, items)}</span></h2>
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

async function updateCharacterMaxHP(characterId) {
    const character = characters.find((item) => item.id === Number(characterId));
    if (!character) return;

    const value = Number(prompt("Новое максимальное HP:", character.max_hp));
    if (Number.isNaN(value) || value < 1) return;

    await api(`/characters/${character.id}/details`, {
        method: "PATCH",
        body: JSON.stringify({max_hp: value}),
    });

    await loadCharacters();
    await openSheet(character.id);
}

async function updateCharacterClass(characterId) {
    const character = characters.find((item) => item.id === Number(characterId));
    const select = document.querySelector(`[data-sheet-class-select="${characterId}"]`);
    if (!character || !select) return;

    await api(`/characters/${character.id}/details`, {
        method: "PATCH",
        body: JSON.stringify({clas: select.value}),
    });

    await loadCharacters();
    await openSheet(character.id);
}

async function updateCharacterOwner(characterId) {
    const character = characters.find((item) => item.id === Number(characterId));
    const select = document.querySelector(`[data-sheet-owner-select="${characterId}"]`);
    if (!character || !select) return;

    await api(`/characters/${character.id}/details`, {
        method: "PATCH",
        body: JSON.stringify({
            owner_profile_id: select.value ? Number(select.value) : null,
        }),
    });

    await loadCharacters();
    await openSheet(character.id);
}

async function updateCharacterMaxStat(characterId, stat) {
    const character = characters.find((item) => item.id === Number(characterId));
    if (!character) return;

    const value = Number(prompt(`Новый максимум ${STAT_LABELS[stat]}:`, character[stat]));
    if (Number.isNaN(value) || value < 0) return;

    await api(`/characters/${character.id}/details`, {
        method: "PATCH",
        body: JSON.stringify({[stat]: value}),
    });

    await loadCharacters();
    await openSheet(character.id);
}

async function addCharacterXP(characterId, location = "player") {
    const character = characters.find((item) => item.id === Number(characterId));
    if (!character) return;

    const value = Number(prompt("Сколько XP получает персонаж?"));
    if (Number.isNaN(value) || value <= 0) return;

    await api(`/characters/${character.id}/xp`, {
        method: "POST",
        body: JSON.stringify({amount: value}),
    });

    await loadCharacters();
    if (location === "sheet" || activeSheetCharacterId === character.id) {
        await openSheet(character.id);
        return;
    }

    await renderPlayerView();
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

async function updateCharacterSave(characterId, saveField, delta) {
    const character = characters.find((item) => item.id === Number(characterId));
    if (!character) return;

    await api(`/characters/${character.id}/saves`, {
        method: "PATCH",
        body: JSON.stringify({
            [saveField]: character[saveField] + delta,
        }),
    });

    await loadCharacters();
    await openSheet(character.id);
}

async function savePlayerNotes() {
    if (!playerCharacterId) return;

    const notes = elements.playerNotes.value;
    const character = await api(`/characters/${playerCharacterId}/notes`, {
        method: "PATCH",
        body: JSON.stringify({notes}),
    });

    characters = characters.map((item) => (
        item.id === character.id ? character : item
    ));
}

async function loadInventory(characterId) {
    return api(`/characters/${characterId}/inventory`);
}

async function loadCampBuildings() {
    campBuildings = await api("/camp/buildings");
    renderCampBuildings();
}

async function openCamp() {
    await loadCampBuildings();
    showOnly("campView");
}

function renderCampBuildings() {
    elements.campList.innerHTML = "";

    if (campBuildings.length === 0) {
        const empty = document.createElement("p");
        empty.className = "muted";
        empty.textContent = "В лагере пока нет строений.";
        elements.campList.appendChild(empty);
        return;
    }

    campBuildings.forEach((building) => {
        const details = document.createElement("details");
        details.className = "camp-building";
        details.innerHTML = `
            <summary>
                <strong>${building.name}</strong>
                <span class="camp-actions">
                    <button data-camp-action="rename" data-id="${building.id}" title="Переименовать">✎</button>
                    <button data-camp-action="delete" data-id="${building.id}" title="Удалить">Удалить</button>
                </span>
            </summary>
            <textarea data-camp-notes="${building.id}" placeholder="Описание, жители, запасы, улучшения...">${building.notes || ""}</textarea>
        `;

        elements.campList.appendChild(details);
        const textarea = details.querySelector("textarea");
        autoSizeTextarea(textarea);
    });
}

async function createCampBuilding() {
    const name = prompt("Название строения:", "Новое строение") || "Новое строение";
    await api("/camp/buildings", {
        method: "POST",
        body: JSON.stringify({name, notes: ""}),
    });
    await loadCampBuildings();
}

async function renameCampBuilding(buildingId) {
    const building = campBuildings.find((item) => item.id === Number(buildingId));
    if (!building) return;

    const name = prompt("Название строения:", building.name);
    if (name === null) return;

    await api(`/camp/buildings/${building.id}`, {
        method: "PATCH",
        body: JSON.stringify({name}),
    });
    await loadCampBuildings();
}

async function saveCampNotes(buildingId, notes) {
    await api(`/camp/buildings/${buildingId}`, {
        method: "PATCH",
        body: JSON.stringify({notes}),
    });
}

async function deleteCampBuilding(buildingId) {
    if (!confirm("Ты уверен, что хочешь удалить это строение?")) return;

    await api(`/camp/buildings/${buildingId}`, {method: "DELETE"});
    await loadCampBuildings();
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
    if (event.target.id === "camp-role-button") openCamp();
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
    playerAccessMode = null;
    currentPlayerProfile = null;
    activeSheetCharacterId = null;
    localStorage.removeItem("dcc_role");
    localStorage.removeItem("dcc_master_auth");
    localStorage.removeItem("dcc_character_id");
    localStorage.removeItem("dcc_player_access_mode");
    localStorage.removeItem("dcc_player_profile");
    renderCurrentRole();
});

document.getElementById("save-player-button").addEventListener("click", () => {
    playerCharacterId = Number(elements.playerCharacterSelect.value);
    if (!playerCharacterId) return;
    localStorage.setItem("dcc_character_id", playerCharacterId);
    renderCurrentRole();
});

document.getElementById("player-login-button").addEventListener("click", loginPlayerProfile);
document.getElementById("guest-login-button").addEventListener("click", loginAsGuest);
document.getElementById("create-profile-button").addEventListener("click", createPlayerProfile);
document.getElementById("create-character-button").addEventListener("click", createCharacterFromForm);
document.getElementById("add-character-button").addEventListener("click", addToInitiative);
document.getElementById("add-monster-button").addEventListener("click", addMonsterToInitiative);
document.getElementById("next-turn-button").addEventListener("click", nextTurn);
document.getElementById("clear-button").addEventListener("click", clearInitiative);

document.getElementById("open-player-sheet-button").addEventListener("click", () => {
    openSheet(playerCharacterId);
});

document.getElementById("change-player-character-button").addEventListener("click", () => {
    playerCharacterId = null;
    localStorage.removeItem("dcc_character_id");
    renderCurrentRole();
});

document.getElementById("open-master-sheet-button").addEventListener("click", () => {
    openSheet(elements.masterSheetSelect.value);
});

document.getElementById("delete-master-character-button").addEventListener("click", async () => {
    const characterId = Number(elements.masterSheetSelect.value);
    const character = characters.find((item) => item.id === characterId);
    if (!character) return;

    if (!confirm(`Ты уверен, что хочешь удалить персонажа ${character.name}?`)) return;

    await api(`/characters/${character.id}`, {method: "DELETE"});
    if (playerCharacterId === character.id) {
        playerCharacterId = null;
        localStorage.removeItem("dcc_character_id");
    }
    await loadCharacters();
    await loadInitiative();
});

document.getElementById("back-from-camp-button").addEventListener("click", renderCurrentRole);
document.getElementById("add-camp-building-button").addEventListener("click", createCampBuilding);

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

elements.playerNotes.addEventListener("input", () => {
    autoSizeTextarea(elements.playerNotes);
    clearTimeout(notesSaveTimer);
    notesSaveTimer = setTimeout(savePlayerNotes, 500);
});

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

    const xpButton = event.target.closest("[data-xp-action]");
    if (xpButton) addCharacterXP(Number(xpButton.dataset.id), xpButton.dataset.location);

    const campButton = event.target.closest("[data-camp-action]");
    if (campButton) {
        event.preventDefault();
        if (campButton.dataset.campAction === "rename") {
            renameCampBuilding(Number(campButton.dataset.id));
        }
        if (campButton.dataset.campAction === "delete") {
            deleteCampBuilding(Number(campButton.dataset.id));
        }
    }

    const profileButton = event.target.closest("[data-profile-action]");
    if (profileButton) {
        const profileId = Number(profileButton.dataset.id);
        if (profileButton.dataset.profileAction === "login") {
            updatePlayerProfile(profileId, "login");
        }
        if (profileButton.dataset.profileAction === "password") {
            updatePlayerProfile(profileId, "password");
        }
        if (profileButton.dataset.profileAction === "delete") {
            deletePlayerProfile(profileId);
        }
    }
});

elements.campList.addEventListener("input", (event) => {
    const textarea = event.target.closest("textarea[data-camp-notes]");
    if (!textarea) return;

    autoSizeTextarea(textarea);
    const buildingId = Number(textarea.dataset.campNotes);
    clearTimeout(campSaveTimers.get(buildingId));
    campSaveTimers.set(
        buildingId,
        setTimeout(() => saveCampNotes(buildingId, textarea.value), 500)
    );
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

    if (button.dataset.action === "delete-initiative") {
        deleteInitiativeEntry(Number(button.dataset.entryId));
    }
});

elements.sheetContent.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    const action = button.dataset.sheetAction;
    const characterId = Number(button.dataset.id);

    if (action === "hp-damage") updateCharacterHP(characterId, -1);
    if (action === "hp-heal") updateCharacterHP(characterId, 1);
    if (action === "max-hp") updateCharacterMaxHP(characterId);
    if (action === "class-save") updateCharacterClass(characterId);
    if (action === "owner-save") updateCharacterOwner(characterId);
    if (action === "stat-minus") updateCharacterStat(characterId, button.dataset.stat, -1);
    if (action === "stat-max") updateCharacterMaxStat(characterId, button.dataset.stat);
    if (action === "stat-plus") updateCharacterStat(characterId, button.dataset.stat, 1);
    if (action === "save-minus") updateCharacterSave(characterId, button.dataset.save, -1);
    if (action === "save-plus") updateCharacterSave(characterId, button.dataset.save, 1);
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
    await loadPlayerProfiles();
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
