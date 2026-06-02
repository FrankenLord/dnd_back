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
const SAVE_STAT_FIELDS = {
    reflex_save: "DEX",
    fortitude_save: "CON",
    will_save: "WIS",
};
const LOW_SAVE_BONUS = [0, 0, 1, 1, 1, 2, 2, 2, 3, 3];
const MID_SAVE_BONUS = [1, 1, 1, 2, 2, 2, 3, 3, 3, 4];
const HIGH_SAVE_BONUS = [1, 1, 2, 2, 3, 4, 4, 5, 5, 6];
const SAVE_BONUSES = {
    "Жрец": {
        reflex_save: LOW_SAVE_BONUS,
        fortitude_save: MID_SAVE_BONUS,
        will_save: HIGH_SAVE_BONUS,
    },
    "Вор": {
        reflex_save: HIGH_SAVE_BONUS,
        fortitude_save: MID_SAVE_BONUS,
        will_save: LOW_SAVE_BONUS,
    },
    "Плут": {
        reflex_save: HIGH_SAVE_BONUS,
        fortitude_save: MID_SAVE_BONUS,
        will_save: LOW_SAVE_BONUS,
    },
    "Воин": {
        reflex_save: MID_SAVE_BONUS,
        fortitude_save: HIGH_SAVE_BONUS,
        will_save: LOW_SAVE_BONUS,
    },
    "Маг": {
        reflex_save: MID_SAVE_BONUS,
        fortitude_save: LOW_SAVE_BONUS,
        will_save: HIGH_SAVE_BONUS,
    },
    "Волшебник": {
        reflex_save: MID_SAVE_BONUS,
        fortitude_save: LOW_SAVE_BONUS,
        will_save: HIGH_SAVE_BONUS,
    },
    "Дварф": {
        reflex_save: MID_SAVE_BONUS,
        fortitude_save: HIGH_SAVE_BONUS,
        will_save: MID_SAVE_BONUS,
    },
    "Эльф": {
        reflex_save: MID_SAVE_BONUS,
        fortitude_save: MID_SAVE_BONUS,
        will_save: HIGH_SAVE_BONUS,
    },
    "Полурослик": {
        reflex_save: HIGH_SAVE_BONUS,
        fortitude_save: MID_SAVE_BONUS,
        will_save: HIGH_SAVE_BONUS,
    },
};
const CONDITION_TARGETS = [
    {value: "STR", label: "Сил"},
    {value: "DEX", label: "Лвк"},
    {value: "CON", label: "Тел"},
    {value: "INT", label: "Инт"},
    {value: "WIS", label: "Лич"},
    {value: "LUC", label: "Удч"},
    {value: "reflex_save", label: "Реакция"},
    {value: "fortitude_save", label: "Стойкость"},
    {value: "will_save", label: "Воля"},
    {value: "max_hp", label: "МаксHP"},
    {value: "base_speed", label: "Скорость"},
    {value: "special", label: "Особое"},
];
const ATTACK_TYPES = [
    {value: "melee", label: "Атака Оружием Ближнего Боя"},
    {value: "ranged", label: "Атака оружием Дальнего Боя"},
    {value: "spell", label: "Проверка заклинания"},
    {value: "special", label: "Особое"},
];
const OMEN_OPTIONS = [
    {value: "", label: "Знамения Нет", effect: ""},
    {value: "grim_winter", label: "Суровая зима", effect: "Все броски атаки"},
    {value: "bull", label: "Бык", effect: "Броски атаки оружием ближнего боя"},
    {value: "lucky_day", label: "Удачный день", effect: "Броски атаки оружием дальнего боя"},
    {value: "raised_by_wolves", label: "Выращен волками", effect: "Броски атаки без оружия"},
    {value: "born_on_horseback", label: "Рожденный верхом", effect: "Броски атаки верхом"},
    {value: "battlefield_birth", label: "Родился на поле боя", effect: "Бросок урона"},
    {value: "bear_path", label: "Путь медведя", effect: "Бросок урона оружием ближнего боя"},
    {value: "hawk_eye", label: "Ястребиный глаз", effect: "Броски урона оружием дальнего боя"},
    {value: "hunter_band", label: "Банда охотников", effect: "Броски атаки и урона для оружия 0 уровня"},
    {value: "loom_born", label: "Рожденный под ткацким станком", effect: "Проверка навыков"},
    {value: "fox_cunning", label: "Хитрость Лиса", effect: "Найти/отключить ловушки"},
    {value: "four_leaf_clover", label: "Четырехлистный клевер", effect: "Найти секретные двери"},
    {value: "seventh_son", label: "Седьмой сын", effect: "Проверка творения заклинания"},
    {value: "raging_storm", label: "Бушующий шторм", effect: "Урон от заклинаний"},
    {value: "righteous_heart", label: "Праведное сердце", effect: "Изгнание нечестивцев"},
    {value: "plague_survivor", label: "Выживший во время чумы", effect: "Волшебное исцеление"},
    {value: "lucky_sign", label: "Счастливый знак", effect: "Спасброски"},
    {value: "guardian_angel", label: "Ангел-хранитель", effect: "Спасброски от ловушек"},
    {value: "spider_bite", label: "Пережил укус паука", effect: "Спасброски против яда"},
    {value: "lightning_strike", label: "Удар молнии", effect: "Спасброски реакции"},
    {value: "starving", label: "Живущий впроголодь", effect: "Спасброски стойкости"},
    {value: "temptation_resistance", label: "Сопротивление искушению", effect: "Спасброски воли"},
    {value: "charmed_house", label: "Зачарованный Дом", effect: "Класс брони"},
    {value: "cobra_speed", label: "Скорость кобры", effect: "Инициатива"},
    {value: "bountiful_harvest", label: "Обильный урожай", effect: "Очки здоровья на каждом уровне"},
    {value: "warrior_hand", label: "Рука воина", effect: "Таблица критического удара"},
    {value: "unholy_house", label: "Нечестивый дом", effect: "Броски искажения"},
    {value: "broken_star", label: "Сломанная звезда", effect: "Неуклюжесть"},
    {value: "birdsong", label: "Пение птиц", effect: "Количество языков"},
    {value: "wild_child", label: "Дикий ребенок", effect: "Скорость"},
];
const WARRIOR_LOAD_CLASSES = ["Воин", "Дварф"];
const WIZARD_CLASSES = ["Маг", "Волшебник"];
const CLERIC_CLASSES = ["Жрец"];
const FEAT_DICE = {
    1: "d3",
    2: "d4",
    3: "d5",
    4: "d6",
    5: "d7",
    6: "d8",
    7: "d10+1",
    8: "d10+2",
    9: "d10+3",
    10: "d10+4",
};
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
let campReturnView = null;
const campSaveTimers = new Map();

const elements = {
    status: document.getElementById("status"),
    headerCampButton: document.getElementById("header-camp-button"),
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
    playerOmen: document.getElementById("player-omen"),
    playerNotes: document.getElementById("player-notes"),
    playerBagGrid: document.getElementById("player-bag-grid"),
    playerInventoryList: document.getElementById("player-inventory-list"),
    playerEndTurnButton: document.getElementById("player-end-turn-button"),
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
    const modifier = abilityModifier(Number(value ?? 0));
    return modifier > 0 ? `+${modifier}` : String(modifier);
}

function formatSigned(value) {
    const number = Number(value ?? 0);
    return number > 0 ? `+${number}` : String(number);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#039;");
}

function conditionTargetLabel(target) {
    return CONDITION_TARGETS.find((item) => item.value === target)?.label || target;
}

function attackTypeLabel(type) {
    return ATTACK_TYPES.find((item) => item.value === type)?.label || type;
}

function omenOption(value) {
    return OMEN_OPTIONS.find((item) => item.value === value) || OMEN_OPTIONS[0];
}

function omenValue(character) {
    return character?.omen_key ? Number(character.omen_value || 0) : 0;
}

function attackOmenModifier(character, attackType) {
    const key = character?.omen_key || "";
    const value = omenValue(character);

    if (key === "grim_winter" && ["melee", "ranged"].includes(attackType)) return value;
    if (key === "bull" && attackType === "melee") return value;
    if (key === "lucky_day" && attackType === "ranged") return value;
    if (key === "hunter_band" && ["melee", "ranged"].includes(attackType)) return value;
    if (key === "seventh_son" && attackType === "spell") return value;
    return 0;
}

function saveOmenModifier(character, saveField) {
    const key = character?.omen_key || "";
    const value = omenValue(character);

    if (key === "lucky_sign") return value;
    if (key === "lightning_strike" && saveField === "reflex_save") return value;
    if (key === "starving" && saveField === "fortitude_save") return value;
    if (key === "temptation_resistance" && saveField === "will_save") return value;
    return 0;
}

function speedOmenModifier(character) {
    return character?.omen_key === "wild_child" ? omenValue(character) * 5 : 0;
}

function optionList(options, selectedValue) {
    return options.map((option) => `
        <option value="${option.value}" ${option.value === selectedValue ? "selected" : ""}>${option.label}</option>
    `).join("");
}

function classBaseSpeed(className) {
    return ["Дварф", "Полурослик"].includes(className) ? 20 : 30;
}

function characterBaseSpeed(character) {
    return classBaseSpeed(character.clas);
}

function classSaveBonus(character, saveField) {
    const level = Number(character.level || 0);
    if (level <= 0) return 0;

    const progression = SAVE_BONUSES[character.clas]?.[saveField] || LOW_SAVE_BONUS;
    return progression[Math.max(1, Math.min(10, level)) - 1];
}

function saveDisplayValue(character, effective, saveField) {
    const omen = saveOmenModifier(effective, saveField);
    if (Number(character.level || 0) <= 0) return omen;

    const serverTotal = Number(character[`${saveField}_total`]);
    const stat = SAVE_STAT_FIELDS[saveField];

    if (!Number.isNaN(serverTotal) && stat) {
        const saveShift = Number(effective[saveField] ?? 0) - Number(character[saveField] ?? 0);
        const statShift = abilityModifier(Number(effective[`current_${stat}`] ?? 0))
            - abilityModifier(Number(character[`current_${stat}`] ?? 0));
        return serverTotal + saveShift + statShift + omen;
    }

    return Number(effective[saveField] ?? 0)
        + abilityModifier(Number(effective[`current_${stat}`] ?? 0))
        + classSaveBonus(character, saveField)
        + omen;
}

function effectiveCharacter(character, conditions = []) {
    const effective = {
        ...character,
        base_speed: characterBaseSpeed(character),
    };

    conditions.forEach((condition) => {
        const value = Number(condition.value || 0);
        if (value <= 0 || condition.target === "special") return;

        if (STATS.includes(condition.target)) {
            const field = `current_${condition.target}`;
            effective[field] = Math.max(0, Number(effective[field] ?? 0) - value);
            return;
        }

        if (condition.target === "max_hp") {
            effective.max_hp = Math.max(1, Number(effective.max_hp ?? 1) - value);
            effective.current_hp = Math.min(Number(effective.current_hp ?? 0), effective.max_hp);
            return;
        }

        if (condition.target === "base_speed") {
            effective.base_speed = Math.max(0, Number(effective.base_speed ?? characterBaseSpeed(character)) - value);
            return;
        }

        if (SAVES.some((save) => save.field === condition.target)) {
            effective[condition.target] = Number(effective[condition.target] ?? 0) - value;
        }
    });

    return effective;
}

function featDie(character) {
    const level = Math.max(1, Math.min(10, Number(character.level || 0)));
    return FEAT_DICE[level] || FEAT_DICE[1];
}

function attackModifierParts(character, attack) {
    const bonus = Number(attack.bonus || 0);
    const omen = attackOmenModifier(character, attack.attack_type);
    let total = bonus;
    let die = null;

    if (attack.attack_type === "melee") {
        total += abilityModifier(Number(character.current_STR ?? character.STR));
        if (WARRIOR_LOAD_CLASSES.includes(character.clas)) die = featDie(character);
    }

    if (attack.attack_type === "ranged") {
        total += abilityModifier(Number(character.current_DEX ?? character.DEX));
        if (WARRIOR_LOAD_CLASSES.includes(character.clas)) die = featDie(character);
    }

    if (attack.attack_type === "spell" && CLERIC_CLASSES.includes(character.clas)) {
        total += abilityModifier(Number(character.current_WIS ?? character.WIS)) + Number(character.level || 0);
    }

    if (attack.attack_type === "spell" && WIZARD_CLASSES.includes(character.clas)) {
        total += abilityModifier(Number(character.current_INT ?? character.INT)) + Number(character.level || 0);
    }

    total += omen;

    return {
        total,
        label: die ? `${formatSigned(total)} + ${die}` : formatSigned(total),
        die,
        omen,
    };
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

function overloadSpeedPenalty(extraCells) {
    if (extraCells <= 0) return 0;
    if (extraCells <= 4) return 5;
    if (extraCells <= 8) return 10;
    return 15;
}

function loadSummary(character, items) {
    const usedCells = items.reduce((total, item) => total + item.cell_count, 0);
    const capacity = loadCapacity(character);
    const extraCells = Math.max(0, usedCells - capacity);
    return {
        usedCells,
        capacity,
        extraCells,
        penalty: overloadPenalty(extraCells),
        speedPenalty: overloadSpeedPenalty(extraCells),
    };
}

function effectiveSpeed(character, items = []) {
    const summary = loadSummary(character, items);
    return Math.max(0, Number(character.base_speed ?? characterBaseSpeed(character)) - summary.speedPenalty + speedOmenModifier(character));
}

function renderLoadStatus(character, items) {
    const {usedCells, capacity, extraCells, penalty} = loadSummary(character, items);

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

function hpRange(character) {
    const current = Number(character.current_hp || 0);
    const maximum = Math.max(1, Number(character.max_hp || 1));
    const progress = Math.max(0, Math.min(100, (current / maximum) * 100));

    return {current, maximum, progress};
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

function renderCharacterCoreBlock(character, actionLocation, conditions = [], items = []) {
    const effective = effectiveCharacter(character, conditions);
    const hp = hpRange(character);
    const hpText = effective.max_hp === character.max_hp
        ? `${hp.current}/${hp.maximum} HP`
        : `${effective.current_hp}/${effective.max_hp} HP (${hp.current}/${hp.maximum})`;
    const playerActions = actionLocation === "player"
        ? `
            <div class="core-actions">
                <button class="small-button" data-player-action="sheet" data-id="${character.id}">✎ Изм Лист</button>
                <button class="small-button" data-player-action="change-character">Сменить</button>
            </div>
        `
        : "";

    return `
        <section class="summary-card summary-main">
            <div class="core-header">
                <div class="character-subtitle">${escapeHtml(character.clas)} ${character.level} уровня</div>
                ${playerActions}
            </div>
            <div class="hp-block">
                <div class="xp-meta">
                    <span>0</span>
                    <strong>${hpText}</strong>
                    <span>${hp.maximum}</span>
                </div>
                <div class="xp-track" aria-label="HP">
                    <div class="xp-fill hp-fill" style="width: ${hp.progress}%"></div>
                </div>
                <div class="counter-controls">
                    <button class="small-button" data-hp-action="delta" data-id="${character.id}" data-delta="-1" data-location="${actionLocation}">-</button>
                    <input class="compact-number" type="number" min="0" value="1" data-hp-step="${character.id}" aria-label="Шаг HP">
                    <button class="small-button" data-hp-action="delta" data-id="${character.id}" data-delta="1" data-location="${actionLocation}">+</button>
                </div>
            </div>
            <div class="summary-muted">Скорость ${effectiveSpeed(effective, items)}</div>
            ${renderXPBlock(character, actionLocation)}
        </section>
    `;
}

function renderConditionForm(characterId, condition = null) {
    const formId = condition ? String(condition.id) : "add";
    const action = condition ? "save" : "create";
    return `
        <div class="inline-form hidden" data-condition-form="${formId}">
            <input data-condition-input="name" value="${escapeHtml(condition?.name || "")}" placeholder="Название">
            <select data-condition-input="target" required>
                <option value="">Характеристика</option>
                ${optionList(CONDITION_TARGETS, condition?.target || "")}
            </select>
            <input data-condition-input="value" type="number" min="0" value="${condition?.value ?? ""}" placeholder="Значение" required>
            <input data-condition-input="treatment" value="${escapeHtml(condition?.treatment || "")}" placeholder="Способ лечения">
            <button data-condition-action="${action}" data-id="${characterId}" data-condition-id="${condition?.id || ""}">Подтвердить</button>
        </div>
    `;
}

function renderConditionsBlock(character, conditions, actionLocation) {
    return `
        <section class="summary-card summary-wide" data-condition-panel>
            <div class="row">
                <h3>Травмы и состояния</h3>
                <button class="small-button" data-condition-action="toggle" data-form-id="add">+</button>
            </div>
            ${renderConditionForm(character.id)}
            <div class="condition-list">
                ${conditions.length === 0 ? `<p class="muted">Нет активных состояний.</p>` : ""}
                ${conditions.map((condition) => `
                    <div class="condition-row">
                        <div>
                            <strong>${escapeHtml(condition.name)}</strong>
                            <span>${conditionTargetLabel(condition.target)} -${condition.value}</span>
                            ${condition.treatment ? `<em>${escapeHtml(condition.treatment)}</em>` : ""}
                        </div>
                        <div class="entry-actions">
                            <button class="small-button" title="Редактировать" data-condition-action="toggle" data-form-id="${condition.id}">✎</button>
                            <button data-condition-action="delete" data-id="${character.id}" data-condition-id="${condition.id}" data-location="${actionLocation}">Убрать</button>
                        </div>
                    </div>
                    ${renderConditionForm(character.id, condition)}
                `).join("")}
            </div>
        </section>
    `;
}

function renderAttackForm(characterId, attack = null) {
    const formId = attack ? String(attack.id) : "add";
    const action = attack ? "save" : "create";
    return `
        <div class="inline-form hidden" data-attack-form="${formId}">
            <select data-attack-input="attack_type" required>
                <option value="">Тип проверки</option>
                ${optionList(ATTACK_TYPES, attack?.attack_type || "")}
            </select>
            <input data-attack-input="name" value="${escapeHtml(attack?.name || "")}" placeholder="Название">
            <input data-attack-input="bonus" type="number" value="${attack?.bonus ?? ""}" placeholder="Доп. модификатор" required>
            <button data-attack-action="${action}" data-id="${characterId}" data-attack-id="${attack?.id || ""}">Подтвердить</button>
        </div>
    `;
}

function renderAttacksBlock(character, attacks, actionLocation) {
    return `
        <section class="summary-card summary-wide" data-attack-panel>
            <div class="row">
                <h3>Атаки и Заклинания</h3>
                <button class="small-button" data-attack-action="toggle" data-form-id="add">+</button>
            </div>
            ${renderAttackForm(character.id)}
            <div class="condition-list">
                ${attacks.length === 0 ? `<p class="muted">Нет сохраненных проверок.</p>` : ""}
                ${attacks.map((attack) => {
                    const modifier = attackModifierParts(character, attack);
                    return `
                        <div class="condition-row">
                            <div>
                                <strong>${escapeHtml(attack.name)}</strong>
                                <span>${attackTypeLabel(attack.attack_type)}: ${modifier.label}</span>
                                <em>Доп. ${formatSigned(attack.bonus)}${modifier.die ? `, куб подвига ${modifier.die}` : ""}${modifier.omen ? `, знамение ${formatSigned(modifier.omen)}` : ""}</em>
                            </div>
                            <div class="entry-actions">
                                <button class="small-button" title="Редактировать" data-attack-action="toggle" data-form-id="${attack.id}">✎</button>
                                <button data-attack-action="delete" data-id="${character.id}" data-attack-id="${attack.id}" data-location="${actionLocation}">Убрать</button>
                            </div>
                        </div>
                        ${renderAttackForm(character.id, attack)}
                    `;
                }).join("")}
            </div>
        </section>
    `;
}

function renderConsumableForm(characterId, consumable = null, actionLocation = "player") {
    const formId = consumable ? String(consumable.id) : "add";
    const action = consumable ? "save" : "create";
    const hasNoMax = consumable ? consumable.max_value === null || consumable.max_value === undefined : false;

    return `
        <div class="inline-form consumable-form hidden" data-consumable-form="${formId}">
            <input data-consumable-input="name" value="${escapeHtml(consumable?.name || "")}" placeholder="Название" required>
            <input data-consumable-input="max_value" type="number" min="1" value="${consumable?.max_value ?? ""}" placeholder="Максимум" ${hasNoMax ? "disabled" : ""}>
            <label class="check-row">
                <input data-consumable-input="no_max" type="checkbox" ${hasNoMax ? "checked" : ""}>
                Без максимума
            </label>
            <button data-consumable-action="${action}" data-id="${characterId}" data-consumable-id="${consumable?.id || ""}" data-location="${actionLocation}">Подтвердить</button>
        </div>
    `;
}

function renderConsumableControls(character, consumable, actionLocation) {
    const maxValue = consumable.max_value;
    const currentValue = Number(consumable.current_value || 0);

    if (maxValue !== null && maxValue !== undefined) {
        const progress = Math.max(0, Math.min(100, (currentValue / Math.max(1, Number(maxValue))) * 100));
        return `
            <div class="consumable-meter">
                <div class="xp-meta">
                    <span>0</span>
                    <strong>${currentValue}/${maxValue}</strong>
                    <span>${maxValue}</span>
                </div>
                <div class="xp-track" aria-label="${escapeHtml(consumable.name)}">
                    <div class="xp-fill" style="width: ${progress}%"></div>
                </div>
            </div>
            <div class="counter-controls">
                <button class="small-button" data-consumable-action="delta" data-id="${character.id}" data-consumable-id="${consumable.id}" data-delta="-1" data-location="${actionLocation}">-</button>
                <input class="compact-number" type="number" min="0" value="1" data-consumable-step="${consumable.id}" aria-label="Шаг">
                <button class="small-button" data-consumable-action="delta" data-id="${character.id}" data-consumable-id="${consumable.id}" data-delta="1" data-location="${actionLocation}">+</button>
            </div>
        `;
    }

    return `
        <div class="counter-controls">
            <input class="compact-number current-value" type="number" min="0" value="${currentValue}" data-consumable-current="${consumable.id}" data-id="${character.id}" data-location="${actionLocation}" aria-label="Текущее значение">
            <button class="small-button" data-consumable-action="delta" data-id="${character.id}" data-consumable-id="${consumable.id}" data-delta="-1" data-location="${actionLocation}">-</button>
            <input class="compact-number" type="number" min="0" value="1" data-consumable-step="${consumable.id}" aria-label="Шаг">
            <button class="small-button" data-consumable-action="delta" data-id="${character.id}" data-consumable-id="${consumable.id}" data-delta="1" data-location="${actionLocation}">+</button>
        </div>
    `;
}

function renderConsumablesBlock(character, consumables, actionLocation) {
    return `
        <section class="summary-card summary-wide" data-consumable-panel>
            <div class="row">
                <h3>Расходники</h3>
                <button class="small-button" data-consumable-action="toggle" data-form-id="add">+</button>
            </div>
            ${renderConsumableForm(character.id, null, actionLocation)}
            <div class="condition-list">
                ${consumables.length === 0 ? `<p class="muted">Расходников пока нет.</p>` : ""}
                ${consumables.map((consumable) => `
                    <div class="condition-row consumable-row">
                        <div>
                            <strong>${escapeHtml(consumable.name)}</strong>
                            ${renderConsumableControls(character, consumable, actionLocation)}
                        </div>
                        <div class="entry-actions">
                            <button class="small-button" title="Редактировать" data-consumable-action="toggle" data-form-id="${consumable.id}">✎</button>
                            <button data-consumable-action="delete" data-id="${character.id}" data-consumable-id="${consumable.id}" data-location="${actionLocation}">Убрать</button>
                        </div>
                    </div>
                    ${renderConsumableForm(character.id, consumable, actionLocation)}
                `).join("")}
            </div>
        </section>
    `;
}

function renderOmenForm(character, actionLocation) {
    return `
        <div class="inline-form omen-form hidden" data-omen-form="edit">
            <select data-omen-input="omen_key">
                ${optionList(OMEN_OPTIONS, character.omen_key || "")}
            </select>
            <input data-omen-input="omen_value" type="number" value="${character.omen_value ?? 0}" placeholder="Значение">
            <button data-omen-action="save" data-id="${character.id}" data-location="${actionLocation}">Подтвердить</button>
        </div>
    `;
}

function renderOmenBlock(character, actionLocation) {
    const option = omenOption(character.omen_key || "");
    const hasOmen = Boolean(character.omen_key);
    const valueText = hasOmen ? ` ${formatSigned(character.omen_value)}` : "";
    const effectText = hasOmen && option.effect ? `<em>${escapeHtml(option.effect)}</em>` : "";

    return `
        <section class="omen-block" data-omen-panel>
            <div class="row">
                <h3>Знамение</h3>
                <button class="small-button" title="Редактировать" data-omen-action="toggle">✎</button>
            </div>
            <div class="omen-display">
                <strong>${escapeHtml(option.label)}${valueText}</strong>
                ${effectText}
            </div>
            ${renderOmenForm(character, actionLocation)}
        </section>
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

function currentVisibleViewName() {
    const viewNames = [
        "roleScreen",
        "masterLogin",
        "playerLogin",
        "playerSetup",
        "masterView",
        "playerView",
        "sheetView",
        "campView",
        "bagEditorView",
    ];

    return viewNames.find((viewName) => !elements[viewName].classList.contains("hidden")) || null;
}

function hasOpenInlineEditor() {
    return Boolean(document.querySelector("[data-condition-form]:not(.hidden), [data-attack-form]:not(.hidden), [data-consumable-form]:not(.hidden), [data-omen-form]:not(.hidden)"));
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

async function renderPlayerView(force = false) {
    if (!force && hasOpenInlineEditor()) return;
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
    elements.playerEndTurnButton.disabled = !initiativeEntry?.is_current;

    const [items, conditions, attacks, consumables] = await Promise.all([
        loadInventory(character.id),
        loadConditions(character.id),
        loadAttacks(character.id),
        loadConsumables(character.id),
    ]);
    const effective = effectiveCharacter(character, conditions);
    elements.playerSummary.innerHTML = `
        <div class="player-summary-grid">
            ${renderCharacterCoreBlock(character, "player", conditions, items)}
            ${renderConditionsBlock(character, conditions, "player")}
            ${renderAttacksBlock(effective, attacks, "player")}
            ${renderConsumablesBlock(effective, consumables, "player")}
            <section class="summary-card">
                <h3>Характеристики</h3>
                <div class="compact-stat-grid">
                    ${STATS.map((stat) => `
                        <div>
                            <span>${STAT_LABELS[stat]}</span>
                            <strong>${effective[`current_${stat}`]}/${character[stat]}</strong>
                            <em>${formatModifier(effective[`current_${stat}`])}</em>
                        </div>
                    `).join("")}
                </div>
            </section>
            <section class="summary-card">
                <h3>Спасброски</h3>
                <div class="save-grid">
                    ${SAVES.map((save) => `
                        <div>
                            <span>${save.label}</span>
                            <strong>${formatSigned(saveDisplayValue(character, effective, save.field))}</strong>
                        </div>
                    `).join("")}
                </div>
            </section>
        </div>
    `;
    elements.playerLoadStatus.textContent = renderLoadStatus(effective, items);
    if (elements.playerOmen) {
        elements.playerOmen.innerHTML = renderOmenBlock(character, "player");
    }
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

    const [items, conditions, attacks, consumables] = await Promise.all([
        loadInventory(character.id),
        loadConditions(character.id),
        loadAttacks(character.id),
        loadConsumables(character.id),
    ]);
    const effective = effectiveCharacter(character, conditions);
    const hpText = effective.max_hp === character.max_hp
        ? `${character.current_hp}/${character.max_hp}`
        : `${effective.current_hp}/${effective.max_hp} (${character.current_hp}/${character.max_hp})`;

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
                ${renderXPBlock(character, "sheet")}
                <div class="stat-editor">
                    <span>HP: ${hpText}</span>
                    <button data-sheet-action="hp-damage" data-id="${character.id}">-</button>
                    <button data-sheet-action="max-hp" data-id="${character.id}">Изм. макс.</button>
                    <button data-sheet-action="hp-heal" data-id="${character.id}">+</button>
                </div>
            </section>
            ${renderConditionsBlock(character, conditions, "sheet")}
            ${renderAttacksBlock(effective, attacks, "sheet")}
            ${renderConsumablesBlock(effective, consumables, "sheet")}
            <section>
                <h3>Статы</h3>
                ${STATS.map((stat) => `
                    <div class="stat-editor">
                        <span>${STAT_LABELS[stat]}: ${effective[`current_${stat}`]}/${character[stat]} (${formatModifier(effective[`current_${stat}`])})</span>
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
                        <span>${save.label}: ${formatSigned(saveDisplayValue(character, effective, save.field))} (попр. ${formatSigned(character[save.field])})</span>
                        <button data-sheet-action="save-minus" data-id="${character.id}" data-save="${save.field}">-</button>
                        <button data-sheet-action="save-reset" data-id="${character.id}" data-save="${save.field}">Сбросить</button>
                        <button data-sheet-action="save-plus" data-id="${character.id}" data-save="${save.field}">+</button>
                    </div>
                `).join("")}
            </section>
            <section>
                <h3>Скорость</h3>
                <div class="stat-editor">
                    <span>Скорость: ${effectiveSpeed(effective, items)} / база ${characterBaseSpeed(character)}</span>
                </div>
            </section>
        </div>
        <section class="panel">
            <div class="row">
                <h2>Сумка <span class="load-status">${renderLoadStatus(effective, items)}</span></h2>
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
        <section class="panel">
            ${renderOmenBlock(character, "sheet")}
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

async function updateCharacterHP(characterId, delta, location = "sheet") {
    const character = characters.find((item) => item.id === Number(characterId));
    if (!character) return;

    await api(`/characters/${character.id}/hp`, {
        method: "PATCH",
        body: JSON.stringify({current_hp: character.current_hp + delta}),
    });

    await loadCharacters();
    if (location === "sheet" || activeSheetCharacterId === character.id) {
        await openSheet(character.id);
        return;
    }

    await renderPlayerView(true);
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

    await renderPlayerView(true);
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

    await setCharacterSave(character, saveField, character[saveField] + delta);
}

async function resetCharacterSave(characterId, saveField) {
    const character = characters.find((item) => item.id === Number(characterId));
    if (!character) return;

    await setCharacterSave(character, saveField, 0);
}

async function setCharacterSave(character, saveField, value) {
    await api(`/characters/${character.id}/saves`, {
        method: "PATCH",
        body: JSON.stringify({
            [saveField]: value,
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

async function loadConditions(characterId) {
    return api(`/characters/${characterId}/conditions`);
}

async function loadAttacks(characterId) {
    return api(`/characters/${characterId}/attacks`);
}

async function loadConsumables(characterId) {
    return api(`/characters/${characterId}/consumables`);
}

async function refreshCharacterSurface(characterId, location = null) {
    await loadCharacters();
    const visible = currentVisibleViewName();

    if (location === "sheet" || (visible === "sheetView" && activeSheetCharacterId === Number(characterId))) {
        await openSheet(characterId);
        return;
    }

    await renderPlayerView(true);
}

function findInlineForm(button, kind) {
    const panel = button.closest(`[data-${kind}-panel]`);
    if (!panel) return null;

    const formId = button.dataset.formId || "add";
    return [...panel.querySelectorAll(`[data-${kind}-form]`)]
        .find((form) => form.dataset[`${kind}Form`] === formId);
}

function readConditionForm(form) {
    const target = form.querySelector('[data-condition-input="target"]').value;
    const value = Number(form.querySelector('[data-condition-input="value"]').value);

    if (!target || Number.isNaN(value) || value < 0) return null;

    return {
        name: form.querySelector('[data-condition-input="name"]').value.trim(),
        target,
        value,
        treatment: form.querySelector('[data-condition-input="treatment"]').value.trim(),
    };
}

async function handleConditionAction(button) {
    const action = button.dataset.conditionAction;

    if (action === "toggle") {
        const form = findInlineForm(button, "condition");
        if (form) form.classList.toggle("hidden");
        return;
    }

    const characterId = Number(button.dataset.id);
    if (!characterId) return;

    if (action === "delete") {
        await api(`/characters/${characterId}/conditions/${button.dataset.conditionId}`, {method: "DELETE"});
        await refreshCharacterSurface(characterId, button.dataset.location);
        return;
    }

    if (action === "create" || action === "save") {
        const form = button.closest("[data-condition-form]");
        if (!form) return;

        const data = readConditionForm(form);
        if (!data) return;

        const conditionId = button.dataset.conditionId;
        const path = action === "save"
            ? `/characters/${characterId}/conditions/${conditionId}`
            : `/characters/${characterId}/conditions`;

        await api(path, {
            method: action === "save" ? "PATCH" : "POST",
            body: JSON.stringify(data),
        });
        await refreshCharacterSurface(characterId);
    }
}

function readAttackForm(form) {
    const attackType = form.querySelector('[data-attack-input="attack_type"]').value;
    const bonus = Number(form.querySelector('[data-attack-input="bonus"]').value);

    if (!attackType || Number.isNaN(bonus)) return null;

    return {
        attack_type: attackType,
        name: form.querySelector('[data-attack-input="name"]').value.trim(),
        bonus,
    };
}

async function handleAttackAction(button) {
    const action = button.dataset.attackAction;

    if (action === "toggle") {
        const form = findInlineForm(button, "attack");
        if (form) form.classList.toggle("hidden");
        return;
    }

    const characterId = Number(button.dataset.id);
    if (!characterId) return;

    if (action === "delete") {
        await api(`/characters/${characterId}/attacks/${button.dataset.attackId}`, {method: "DELETE"});
        await refreshCharacterSurface(characterId, button.dataset.location);
        return;
    }

    if (action === "create" || action === "save") {
        const form = button.closest("[data-attack-form]");
        if (!form) return;

        const data = readAttackForm(form);
        if (!data) return;

        const attackId = button.dataset.attackId;
        const path = action === "save"
            ? `/characters/${characterId}/attacks/${attackId}`
            : `/characters/${characterId}/attacks`;

        await api(path, {
            method: action === "save" ? "PATCH" : "POST",
            body: JSON.stringify(data),
        });
        await refreshCharacterSurface(characterId);
    }
}

function readConsumableForm(form) {
    const name = form.querySelector('[data-consumable-input="name"]').value.trim();
    const noMax = form.querySelector('[data-consumable-input="no_max"]').checked;
    const maxInput = form.querySelector('[data-consumable-input="max_value"]');
    const maxValue = noMax ? null : Number(maxInput.value);

    if (!name || (!noMax && (Number.isNaN(maxValue) || maxValue < 1))) return null;

    return {
        name,
        max_value: maxValue,
    };
}

async function updateConsumableValue(characterId, consumableId, currentValue, location) {
    await api(`/characters/${characterId}/consumables/${consumableId}`, {
        method: "PATCH",
        body: JSON.stringify({current_value: currentValue}),
    });
    await refreshCharacterSurface(characterId, location);
}

async function handleConsumableAction(button) {
    const action = button.dataset.consumableAction;

    if (action === "toggle") {
        const form = findInlineForm(button, "consumable");
        if (form) form.classList.toggle("hidden");
        return;
    }

    const characterId = Number(button.dataset.id);
    if (!characterId) return;

    if (action === "delete") {
        await api(`/characters/${characterId}/consumables/${button.dataset.consumableId}`, {method: "DELETE"});
        await refreshCharacterSurface(characterId, button.dataset.location);
        return;
    }

    if (action === "delta") {
        const consumableId = Number(button.dataset.consumableId);
        const current = await loadConsumables(characterId);
        const consumable = current.find((item) => item.id === consumableId);
        if (!consumable) return;

        const stepInput = document.querySelector(`[data-consumable-step="${consumableId}"]`);
        const step = Math.max(0, Number(stepInput?.value || 1));
        const delta = Number(button.dataset.delta || 0) * (Number.isNaN(step) ? 1 : step);
        await updateConsumableValue(characterId, consumableId, Number(consumable.current_value || 0) + delta, button.dataset.location);
        return;
    }

    if (action === "create" || action === "save") {
        const form = button.closest("[data-consumable-form]");
        if (!form) return;

        const data = readConsumableForm(form);
        if (!data) return;

        const consumableId = button.dataset.consumableId;
        const path = action === "save"
            ? `/characters/${characterId}/consumables/${consumableId}`
            : `/characters/${characterId}/consumables`;

        await api(path, {
            method: action === "save" ? "PATCH" : "POST",
            body: JSON.stringify(data),
        });
        await refreshCharacterSurface(characterId, button.dataset.location);
    }
}

function readOmenForm(form) {
    const omenKey = form.querySelector('[data-omen-input="omen_key"]').value;
    const omenValue = Number(form.querySelector('[data-omen-input="omen_value"]').value || 0);

    if (Number.isNaN(omenValue)) return null;

    return {
        omen_key: omenKey,
        omen_value: omenKey ? omenValue : 0,
    };
}

async function handleOmenAction(button) {
    const action = button.dataset.omenAction;
    const panel = button.closest("[data-omen-panel]");

    if (action === "toggle") {
        const form = panel?.querySelector("[data-omen-form]");
        if (form) form.classList.toggle("hidden");
        return;
    }

    if (action !== "save") return;

    const characterId = Number(button.dataset.id);
    const form = panel?.querySelector("[data-omen-form]");
    if (!characterId || !form) return;

    const data = readOmenForm(form);
    if (!data) return;

    await api(`/characters/${characterId}/omen`, {
        method: "PATCH",
        body: JSON.stringify(data),
    });
    await refreshCharacterSurface(characterId, button.dataset.location);
}

async function loadCampBuildings() {
    campBuildings = await api("/camp/buildings");
    renderCampBuildings();
}

async function openCamp(returnView = null) {
    const visibleView = currentVisibleViewName();
    campReturnView = returnView || (visibleView === "campView" ? campReturnView : visibleView);
    await loadCampBuildings();
    showOnly("campView");
}

async function closeCamp() {
    const returnView = campReturnView;
    campReturnView = null;

    if (returnView === "sheetView" && activeSheetCharacterId) {
        await openSheet(activeSheetCharacterId);
        return;
    }

    if (returnView && elements[returnView]) {
        showOnly(returnView);
        if (returnView === "playerView") {
            await renderPlayerView();
        }
        return;
    }

    renderCurrentRole();
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
            <td>${item.cell_count || "—"}</td>
            <td class="table-actions">
                <button data-inventory-action="edit" data-character-id="${characterId}" data-item-id="${item.id}">✎ Изм Предмет</button>
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

async function openBagEditor(characterId, item = null, mode = "create") {
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

    await renderBagEditor();
    quickUpdateConfirmState();
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
    const normalizedShape = normalizeClientShape(bagEditor.shape);
    const hasShape = normalizedShape.length > 0;

    if (name.length === 0) {
        elements.confirmBagEditButton.disabled = true;
        return;
    }

    if (!hasShape) {
        elements.confirmBagEditButton.disabled = false;
        return;
    }

    const hasPosition = bagEditor.position !== null;
    const fits = hasPosition
        ? shapeFits(normalizedShape, bagEditor.position.x, bagEditor.position.y, items)
        : false;

    elements.confirmBagEditButton.disabled = !(hasPosition && fits);
}

function quickUpdateConfirmState() {
    const name = elements.itemNameInput.value.trim();
    const normalizedShape = normalizeClientShape(bagEditor.shape);
    const hasShape = normalizedShape.length > 0;

    if (name.length === 0) {
        elements.confirmBagEditButton.disabled = true;
        return;
    }

    if (!hasShape) {
        elements.confirmBagEditButton.disabled = false;
    }
}

async function confirmBagEdit() {
    if (!bagEditor) return;

    const name = elements.itemNameInput.value.trim();
    if (!name) return;  // Имя обязательно всегда

    const normalizedShape = normalizeClientShape(bagEditor.shape);
    const hasShape = normalizedShape.length > 0;
    
    // Если есть форма, но нет позиции — показываем предупреждение
    if (hasShape && !bagEditor.position) {
        alert("Выберите позицию для предмета в сумке");
        return;
    }

    const body = {
        name: name,
        shape: normalizedShape,
        x: bagEditor.position?.x ?? 0,
        y: bagEditor.position?.y ?? 0,
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
        await openBagEditor(characterId);
        return;
    }

    const itemId = Number(button.dataset.itemId);
    const items = await loadInventory(characterId);
    const item = items.find((value) => value.id === itemId);
    if (!item) return;

    if (action === "position") {
        await openBagEditor(characterId, item, "position");
    }

    if (action === "edit") {
        await openBagEditor(characterId, item, "edit");
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

elements.headerCampButton.addEventListener("click", () => openCamp());

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
elements.playerEndTurnButton.addEventListener("click", nextTurn);

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

document.getElementById("back-from-camp-button").addEventListener("click", closeCamp);
document.getElementById("add-camp-building-button").addEventListener("click", createCampBuilding);
document.getElementById("sheet-camp-button").addEventListener("click", () => openCamp("sheetView"));

document.getElementById("close-sheet-button").addEventListener("click", () => {
    activeSheetCharacterId = null;
    renderCurrentRole();
});

document.getElementById("add-player-item-button").addEventListener("click", async () => {
    await openBagEditor(playerCharacterId);
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
    quickUpdateConfirmState();

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
    const playerButton = event.target.closest("[data-player-action]");
    if (playerButton) {
        if (playerButton.dataset.playerAction === "sheet") {
            openSheet(Number(playerButton.dataset.id));
        }
        if (playerButton.dataset.playerAction === "change-character") {
            playerCharacterId = null;
            localStorage.removeItem("dcc_character_id");
            renderCurrentRole();
        }
        return;
    }

    const hpButton = event.target.closest("[data-hp-action]");
    if (hpButton) {
        const stepInput = hpButton.parentElement?.querySelector(
            `[data-hp-step="${hpButton.dataset.id}"]`
        );
        const step = Math.max(1, Number(stepInput?.value || 1));
        const delta = Number(hpButton.dataset.delta || 0) * step;
        if (delta) {
            updateCharacterHP(
                Number(hpButton.dataset.id),
                delta,
                hpButton.dataset.location || "player"
            );
        }
        return;
    }

    const button = event.target.closest("[data-inventory-action]");
    if (button) {
        handleInventoryAction(button);
        return;
    }

    const conditionButton = event.target.closest("[data-condition-action]");
    if (conditionButton) {
        handleConditionAction(conditionButton);
        return;
    }

    const attackButton = event.target.closest("[data-attack-action]");
    if (attackButton) {
        handleAttackAction(attackButton);
        return;
    }

    const consumableButton = event.target.closest("[data-consumable-action]");
    if (consumableButton) {
        handleConsumableAction(consumableButton);
        return;
    }

    const omenButton = event.target.closest("[data-omen-action]");
    if (omenButton) {
        handleOmenAction(omenButton);
        return;
    }

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

document.addEventListener("change", (event) => {
    const noMaxInput = event.target.closest('[data-consumable-input="no_max"]');
    if (noMaxInput) {
        const form = noMaxInput.closest("[data-consumable-form]");
        const maxInput = form?.querySelector('[data-consumable-input="max_value"]');
        if (maxInput) maxInput.disabled = noMaxInput.checked;
        return;
    }

    const currentInput = event.target.closest("[data-consumable-current]");
    if (currentInput) {
        const characterId = Number(currentInput.dataset.id);
        const consumableId = Number(currentInput.dataset.consumableCurrent);
        const value = Number(currentInput.value);
        if (!characterId || !consumableId || Number.isNaN(value)) return;
        updateConsumableValue(characterId, consumableId, value, currentInput.dataset.location);
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
    if (action === "save-reset") resetCharacterSave(characterId, button.dataset.save);
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
    if (bagEditor || hasOpenInlineEditor()) return;
    await loadCharacters();
    await loadInitiative();
}, 2000);

start();
