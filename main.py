from pathlib import Path
import json
import random

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import SessionLocal, engine
from models import Base, character, initiative, inventory_item, monster


MASTER_PASSWORD = "Em4758@Pro"
BAG_ROWS = 4
BAG_COLS = 7


def roll_d20():
    return random.randint(1, 20)


app = FastAPI()
app.state.current_turn_index = 0

Base.metadata.create_all(bind=engine)


def ensure_schema():
    """Tiny training-project migration helper.

    SQLAlchemy create_all() creates missing tables, but does not add new
    columns to existing tables. Alembic is the professional migration tool;
    this helper keeps the learning project convenient while the schema changes.
    """
    stat_columns = ["STR", "DEX", "CON", "INT", "WIS", "LUC"]

    with engine.begin() as conn:
        for stat in stat_columns:
            conn.execute(
                text(
                    f'ALTER TABLE characters '
                    f'ADD COLUMN IF NOT EXISTS "current_{stat}" INTEGER'
                )
            )
            conn.execute(
                text(
                    f'UPDATE characters SET "current_{stat}" = "{stat}" '
                    f'WHERE "current_{stat}" IS NULL'
                )
            )

        conn.execute(
            text("ALTER TABLE initiative ADD COLUMN IF NOT EXISTS monster_id INTEGER")
        )


ensure_schema()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CharacterCreate(BaseModel):
    name: str
    clas: str
    max_hp: int
    STR: int
    DEX: int
    CON: int
    INT: int
    WIS: int
    LUC: int


class HPUpdate(BaseModel):
    current_hp: int


class StatsUpdate(BaseModel):
    current_STR: int | None = None
    current_DEX: int | None = None
    current_CON: int | None = None
    current_INT: int | None = None
    current_WIS: int | None = None
    current_LUC: int | None = None


class CharacterResponse(BaseModel):
    id: int
    name: str
    clas: str
    level: int
    current_hp: int
    max_hp: int
    STR: int
    DEX: int
    CON: int
    INT: int
    WIS: int
    LUC: int
    current_STR: int
    current_DEX: int
    current_CON: int
    current_INT: int
    current_WIS: int
    current_LUC: int


class InitiativeInput(BaseModel):
    character_id: int
    initiative: int


class MonsterInitiativeInput(BaseModel):
    name: str
    max_hp: int = 1
    initiative: int


class InitiativeUpdate(BaseModel):
    initiative: int


class PasswordInput(BaseModel):
    password: str


class InventoryCell(BaseModel):
    row: int
    col: int


class InventoryItemInput(BaseModel):
    name: str
    shape: list[InventoryCell]
    x: int
    y: int


class InventoryItemUpdate(BaseModel):
    name: str | None = None
    shape: list[InventoryCell] | None = None
    x: int | None = None
    y: int | None = None


class InventoryItemResponse(BaseModel):
    id: int
    character_id: int
    name: str
    shape: list[InventoryCell]
    x: int
    y: int
    cell_count: int


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def clamp(value: int, minimum: int, maximum: int) -> int:
    return max(minimum, min(value, maximum))


def normalize_turn_index(total_entries: int):
    if total_entries <= 0:
        app.state.current_turn_index = 0
        return

    if app.state.current_turn_index >= total_entries:
        app.state.current_turn_index = 0


def require_character(character_id: int, db: Session):
    char = db.query(character).filter(character.id == character_id).first()
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")
    return char


def serialize_shape(shape: list[InventoryCell]) -> str:
    normalized = normalize_shape(shape)
    return json.dumps([cell.model_dump() for cell in normalized])


def parse_shape(raw_shape: str) -> list[InventoryCell]:
    data = json.loads(raw_shape)
    return [InventoryCell(**cell) for cell in data]


def normalize_shape(shape: list[InventoryCell]) -> list[InventoryCell]:
    if not shape:
        raise HTTPException(status_code=400, detail="Item shape cannot be empty")

    unique_cells = {(cell.row, cell.col) for cell in shape}
    min_row = min(row for row, _ in unique_cells)
    min_col = min(col for _, col in unique_cells)

    normalized = [
        InventoryCell(row=row - min_row, col=col - min_col)
        for row, col in sorted(unique_cells)
    ]

    if any(cell.row < 0 or cell.col < 0 for cell in normalized):
        raise HTTPException(status_code=400, detail="Invalid item shape")

    return normalized


def occupied_cells(shape: list[InventoryCell], x: int, y: int) -> set[tuple[int, int]]:
    return {(y + cell.row, x + cell.col) for cell in shape}


def validate_inventory_item(
    character_id: int,
    shape: list[InventoryCell],
    x: int,
    y: int,
    db: Session,
    ignored_item_id: int | None = None,
):
    if x < 0 or y < 0:
        raise HTTPException(status_code=400, detail="Item position is outside the bag")

    cells = occupied_cells(shape, x, y)
    if any(row < 0 or row >= BAG_ROWS or col < 0 or col >= BAG_COLS for row, col in cells):
        raise HTTPException(status_code=400, detail="Item does not fit inside the bag")

    items = (
        db.query(inventory_item)
        .filter(inventory_item.character_id == character_id)
        .all()
    )

    for item in items:
        if ignored_item_id is not None and item.id == ignored_item_id:
            continue

        other_cells = occupied_cells(parse_shape(item.shape), item.x, item.y)
        if cells & other_cells:
            raise HTTPException(status_code=400, detail="Bag cells are already occupied")


def inventory_response(item: inventory_item) -> InventoryItemResponse:
    shape = parse_shape(item.shape)
    return InventoryItemResponse(
        id=item.id,
        character_id=item.character_id,
        name=item.name,
        shape=shape,
        x=item.x,
        y=item.y,
        cell_count=len(shape),
    )


@app.get("/api/health")
def health():
    return {"message": "Server with DB is running"}


@app.post("/auth/master")
def auth_master(data: PasswordInput):
    if data.password != MASTER_PASSWORD:
        raise HTTPException(status_code=401, detail="Wrong master password")
    return {"ok": True}


@app.post("/characters/", response_model=CharacterResponse)
def create_character(data: CharacterCreate, db: Session = Depends(get_db)):
    new_character = character(
        name=data.name,
        clas=data.clas,
        max_hp=data.max_hp,
        current_hp=data.max_hp,
        STR=data.STR,
        DEX=data.DEX,
        CON=data.CON,
        INT=data.INT,
        WIS=data.WIS,
        LUC=data.LUC,
        current_STR=data.STR,
        current_DEX=data.DEX,
        current_CON=data.CON,
        current_INT=data.INT,
        current_WIS=data.WIS,
        current_LUC=data.LUC,
    )
    db.add(new_character)
    db.commit()
    db.refresh(new_character)
    return new_character


@app.get("/characters", response_model=list[CharacterResponse])
def get_characters(db: Session = Depends(get_db)):
    return db.query(character).order_by(character.name).all()


@app.patch("/characters/{character_id}/hp")
def update_hp(character_id: int, data: HPUpdate, db: Session = Depends(get_db)):
    char = require_character(character_id, db)
    char.current_hp = clamp(data.current_hp, 0, char.max_hp)
    db.commit()
    db.refresh(char)
    return {"message": "HP updated", "hp": char.current_hp}


@app.patch("/characters/{character_id}/stats", response_model=CharacterResponse)
def update_stats(character_id: int, data: StatsUpdate, db: Session = Depends(get_db)):
    char = require_character(character_id, db)

    stat_names = ["STR", "DEX", "CON", "INT", "WIS", "LUC"]
    for stat in stat_names:
        field_name = f"current_{stat}"
        value = getattr(data, field_name)
        if value is not None:
            maximum = getattr(char, stat)
            setattr(char, field_name, clamp(value, 0, maximum))

    db.commit()
    db.refresh(char)
    return char


@app.delete("/characters/{character_id}")
def delete_character(character_id: int, db: Session = Depends(get_db)):
    char = require_character(character_id, db)

    db.query(inventory_item).filter(inventory_item.character_id == character_id).delete()
    db.query(initiative).filter(initiative.character_id == character_id).delete()
    db.delete(char)
    db.commit()
    return {"message": "Character deleted"}


@app.get(
    "/characters/{character_id}/inventory",
    response_model=list[InventoryItemResponse],
)
def get_inventory(character_id: int, db: Session = Depends(get_db)):
    require_character(character_id, db)
    items = (
        db.query(inventory_item)
        .filter(inventory_item.character_id == character_id)
        .order_by(inventory_item.name)
        .all()
    )
    return [inventory_response(item) for item in items]


@app.post(
    "/characters/{character_id}/inventory",
    response_model=InventoryItemResponse,
)
def create_inventory_item(
    character_id: int,
    data: InventoryItemInput,
    db: Session = Depends(get_db),
):
    require_character(character_id, db)
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Item name cannot be empty")

    shape = normalize_shape(data.shape)
    validate_inventory_item(character_id, shape, data.x, data.y, db)

    item = inventory_item(
        character_id=character_id,
        name=name,
        shape=serialize_shape(shape),
        x=data.x,
        y=data.y,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return inventory_response(item)


@app.patch(
    "/characters/{character_id}/inventory/{item_id}",
    response_model=InventoryItemResponse,
)
def update_inventory_item(
    character_id: int,
    item_id: int,
    data: InventoryItemUpdate,
    db: Session = Depends(get_db),
):
    require_character(character_id, db)
    item = (
        db.query(inventory_item)
        .filter(
            inventory_item.id == item_id,
            inventory_item.character_id == character_id,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    next_name = item.name if data.name is None else data.name.strip()
    if not next_name:
        raise HTTPException(status_code=400, detail="Item name cannot be empty")

    next_shape = parse_shape(item.shape) if data.shape is None else normalize_shape(data.shape)
    next_x = item.x if data.x is None else data.x
    next_y = item.y if data.y is None else data.y

    validate_inventory_item(
        character_id,
        next_shape,
        next_x,
        next_y,
        db,
        ignored_item_id=item.id,
    )

    item.name = next_name
    item.shape = serialize_shape(next_shape)
    item.x = next_x
    item.y = next_y

    db.commit()
    db.refresh(item)
    return inventory_response(item)


@app.delete("/characters/{character_id}/inventory/{item_id}")
def delete_inventory_item(
    character_id: int,
    item_id: int,
    db: Session = Depends(get_db),
):
    require_character(character_id, db)
    item = (
        db.query(inventory_item)
        .filter(
            inventory_item.id == item_id,
            inventory_item.character_id == character_id,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    db.delete(item)
    db.commit()
    return {"message": "Item deleted"}


@app.post("/initiative/add")
def add_update_initiative(data: InitiativeInput, db: Session = Depends(get_db)):
    char = require_character(data.character_id, db)
    entry = (
        db.query(initiative)
        .filter(initiative.character_id == data.character_id)
        .first()
    )

    if entry:
        entry.initiative = data.initiative
    else:
        entry = initiative(character_id=data.character_id, initiative=data.initiative)
        db.add(entry)

    db.commit()
    db.refresh(entry)
    return {"name": char.name, "initiative": entry.initiative}


@app.post("/initiative/monster")
def add_monster_to_initiative(
    data: MonsterInitiativeInput,
    db: Session = Depends(get_db),
):
    base_name = data.name.strip()
    if not base_name:
        raise HTTPException(status_code=400, detail="Monster name cannot be empty")

    same_monsters = db.query(monster).filter(monster.base_name == base_name).count()
    display_name = f"{base_name} {same_monsters + 1}"

    new_monster = monster(
        base_name=base_name,
        display_name=display_name,
        max_hp=max(1, data.max_hp),
        current_hp=max(1, data.max_hp),
    )
    db.add(new_monster)
    db.flush()

    entry = initiative(monster_id=new_monster.id, initiative=data.initiative)
    db.add(entry)
    db.commit()
    db.refresh(entry)

    return {"name": new_monster.display_name, "initiative": entry.initiative}


@app.get("/initiative")
def get_initiative(db: Session = Depends(get_db)):
    entries = db.query(initiative).all()
    entries.sort(key=lambda x: x.initiative, reverse=True)
    normalize_turn_index(len(entries))

    result = []
    for i, entry in enumerate(entries):
        char = None
        mon = None

        if entry.character_id:
            char = db.query(character).filter(character.id == entry.character_id).first()

        if entry.monster_id:
            mon = db.query(monster).filter(monster.id == entry.monster_id).first()

        result.append(
            {
                "position": i + 1,
                "entry_id": entry.id,
                "type": "character" if char else "monster",
                "character_id": char.id if char else None,
                "monster_id": mon.id if mon else None,
                "name": char.name if char else mon.display_name if mon else "Unknown",
                "initiative": entry.initiative,
                "hp": char.current_hp if char else mon.current_hp if mon else None,
                "max_hp": char.max_hp if char else mon.max_hp if mon else None,
                "is_current": i == app.state.current_turn_index,
                "is_next": i == (app.state.current_turn_index + 1) % len(entries)
                if entries
                else False,
            }
        )

    return result


@app.patch("/initiative/{entry_id}")
def update_initiative(
    entry_id: int,
    data: InitiativeUpdate,
    db: Session = Depends(get_db),
):
    entry = db.query(initiative).filter(initiative.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Initiative entry not found")

    entry.initiative = data.initiative
    db.commit()
    db.refresh(entry)
    return {"message": "Initiative updated", "initiative": entry.initiative}


@app.patch("/monsters/{monster_id}/hp")
def update_monster_hp(monster_id: int, data: HPUpdate, db: Session = Depends(get_db)):
    mon = db.query(monster).filter(monster.id == monster_id).first()
    if not mon:
        raise HTTPException(status_code=404, detail="Monster not found")

    mon.current_hp = clamp(data.current_hp, 0, mon.max_hp)
    db.commit()
    db.refresh(mon)
    return {"message": "Monster HP updated", "hp": mon.current_hp}


@app.post("/turn/next")
def next_turn(db: Session = Depends(get_db)):
    total_entries = db.query(initiative).count()
    if total_entries == 0:
        app.state.current_turn_index = 0
    else:
        app.state.current_turn_index = (app.state.current_turn_index + 1) % total_entries

    return {"current_turn_index": app.state.current_turn_index}


@app.get("/turn")
def get_turn(db: Session = Depends(get_db)):
    total_entries = db.query(initiative).count()
    normalize_turn_index(total_entries)
    return {"current_turn_index": app.state.current_turn_index}


@app.delete("/initiative/clear")
def clear_initiative(db: Session = Depends(get_db)):
    db.query(initiative).delete()
    db.query(monster).delete()
    db.commit()
    app.state.current_turn_index = 0
    return {"message": "Initiative cleared"}


front_dir = Path(__file__).parent / "front"
app.mount("/", StaticFiles(directory=front_dir, html=True), name="front")


# LAN start:
# python -m uvicorn main:app --host 0.0.0.0 --port 8000
