from sqlalchemy import Column, Integer, String, ForeignKey, Text
from database import Base

LOW_SAVE_BONUS = [0, 0, 1, 1, 1, 2, 2, 2, 3, 3]
MID_SAVE_BONUS = [1, 1, 1, 2, 2, 2, 3, 3, 3, 4]
HIGH_SAVE_BONUS = [1, 1, 2, 2, 3, 4, 4, 5, 5, 6]

SAVE_BONUSES = {
    "Жрец": {
        "reflex_save": LOW_SAVE_BONUS,
        "fortitude_save": MID_SAVE_BONUS,
        "will_save": HIGH_SAVE_BONUS,
    },
    "Вор": {
        "reflex_save": HIGH_SAVE_BONUS,
        "fortitude_save": MID_SAVE_BONUS,
        "will_save": LOW_SAVE_BONUS,
    },
    "Плут": {
        "reflex_save": HIGH_SAVE_BONUS,
        "fortitude_save": MID_SAVE_BONUS,
        "will_save": LOW_SAVE_BONUS,
    },
    "Воин": {
        "reflex_save": MID_SAVE_BONUS,
        "fortitude_save": HIGH_SAVE_BONUS,
        "will_save": LOW_SAVE_BONUS,
    },
    "Маг": {
        "reflex_save": MID_SAVE_BONUS,
        "fortitude_save": LOW_SAVE_BONUS,
        "will_save": HIGH_SAVE_BONUS,
    },
    "Волшебник": {
        "reflex_save": MID_SAVE_BONUS,
        "fortitude_save": LOW_SAVE_BONUS,
        "will_save": HIGH_SAVE_BONUS,
    },
    "Дварф": {
        "reflex_save": MID_SAVE_BONUS,
        "fortitude_save": HIGH_SAVE_BONUS,
        "will_save": MID_SAVE_BONUS,
    },
    "Эльф": {
        "reflex_save": MID_SAVE_BONUS,
        "fortitude_save": MID_SAVE_BONUS,
        "will_save": HIGH_SAVE_BONUS,
    },
    "Полурослик": {
        "reflex_save": HIGH_SAVE_BONUS,
        "fortitude_save": MID_SAVE_BONUS,
        "will_save": HIGH_SAVE_BONUS,
    },
}


def ability_modifier(value: int) -> int:
    if value <= 3:
        return -3
    if value <= 5:
        return -2
    if value <= 8:
        return -1
    if value <= 12:
        return 0
    if value <= 15:
        return 1
    if value <= 17:
        return 2
    if value <= 18:
        return 3
    if value <= 20:
        return 4
    if value <= 23:
        return 5
    if value <= 25:
        return 6
    if value <= 28:
        return 7
    return 8


def class_save_bonus(class_name: str, level: int, save_field: str) -> int:
    if level <= 0:
        return 0

    bonuses = SAVE_BONUSES.get(class_name, {})
    progression = bonuses.get(save_field, LOW_SAVE_BONUS)
    level_index = max(1, min(10, level)) - 1
    return progression[level_index]

class character(Base):
    __tablename__ = "characters"

    id = Column(Integer, primary_key=True, index=True)
    owner_profile_id = Column(Integer, ForeignKey("player_profiles.id"), nullable=True)
    name =Column(String, nullable=False)
    clas = Column(String, nullable=False)
    level = Column(Integer, default=0)
    xp = Column(Integer, default=0)
    current_hp = Column(Integer, default=1)
    max_hp = Column(Integer, default=1)    
    STR = Column(Integer, default=10)
    DEX = Column(Integer, default=10)
    CON = Column(Integer, default=10)
    INT = Column(Integer, default=10)
    WIS = Column(Integer, default=10)
    LUC = Column(Integer, default=10)
    current_STR = Column(Integer, default=10)
    current_DEX = Column(Integer, default=10)
    current_CON = Column(Integer, default=10)
    current_INT = Column(Integer, default=10)
    current_WIS = Column(Integer, default=10)
    current_LUC = Column(Integer, default=10)
    reflex_save = Column(Integer, default=0)
    fortitude_save = Column(Integer, default=0)
    will_save = Column(Integer, default=0)
    notes = Column(Text, default="")
    base_speed = Column(Integer, default=30)
    initiative=Column(Integer, default=0) 

    @property
    def reflex_save_total(self):
        if self.level <= 0:
            return 0
        return self.reflex_save + ability_modifier(self.current_DEX) + class_save_bonus(self.clas, self.level, "reflex_save")

    @property
    def fortitude_save_total(self):
        if self.level <= 0:
            return 0
        return self.fortitude_save + ability_modifier(self.current_CON) + class_save_bonus(self.clas, self.level, "fortitude_save")

    @property
    def will_save_total(self):
        if self.level <= 0:
            return 0
        return self.will_save + ability_modifier(self.current_WIS) + class_save_bonus(self.clas, self.level, "will_save")

class monster(Base):
    __tablename__ = "monsters"

    id = Column(Integer, primary_key=True)
    base_name = Column(String, nullable=False)
    display_name = Column(String, nullable=False)
    current_hp = Column(Integer, default=1)
    max_hp = Column(Integer, default=1)

class initiative(Base):
    __tablename__= "initiative"

    id = Column(Integer, primary_key=True)
    character_id = Column(Integer, ForeignKey("characters.id"), unique=True, nullable=True)
    monster_id = Column(Integer, ForeignKey("monsters.id"), nullable=True)
    initiative = Column(Integer)

class inventory_item(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True)
    character_id = Column(Integer, ForeignKey("characters.id"), nullable=False)
    name = Column(String, nullable=False)
    shape = Column(Text, nullable=False)
    x = Column(Integer, default=0)
    y = Column(Integer, default=0)

class character_condition(Base):
    __tablename__ = "character_conditions"

    id = Column(Integer, primary_key=True)
    character_id = Column(Integer, ForeignKey("characters.id"), nullable=False)
    name = Column(String, nullable=False, default="Без названия")
    target = Column(String, nullable=False)
    value = Column(Integer, nullable=False, default=0)
    treatment = Column(Text, default="")

class attack_check(Base):
    __tablename__ = "attack_checks"

    id = Column(Integer, primary_key=True)
    character_id = Column(Integer, ForeignKey("characters.id"), nullable=False)
    attack_type = Column(String, nullable=False)
    name = Column(String, nullable=False, default="Проверка")
    bonus = Column(Integer, nullable=False, default=0)

class camp_building(Base):
    __tablename__ = "camp_buildings"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, default="Новое строение")
    notes = Column(Text, default="")

class player_profile(Base):
    __tablename__ = "player_profiles"

    id = Column(Integer, primary_key=True)
    login = Column(String, nullable=False, unique=True)
    password_hash = Column(String, nullable=False)
    password_salt = Column(String, nullable=False)
