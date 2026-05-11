from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import SessionLocal, engine
from models import Base, character, initiative
from fastapi.middleware.cors import CORSMiddleware

import random

def roll_d20():
    return random.randint(1,20)

app = FastAPI()

Base.metadata.create_all(bind=engine)

#SCHEMAS 

class CharacterCreate(BaseModel):
    name:str
    clas:str
    max_hp:int
    STR:int
    DEX:int
    CON:int
    INT:int
    WIS:int
    LUC:int

class HPUpdate(BaseModel):
    current_hp: int

class CharacterResponse(BaseModel):
    id: int
    name: str
    clas: str
    level: int
    current_hp: int
    max_hp: int    
    STR:int
    DEX:int
    CON:int
    INT:int
    WIS:int
    LUC:int

class InitiativeInput(BaseModel):
    character_id:int
    initiative: int 

class InitiativeUpdate(BaseModel):
    initiative: int

#-----------------------------------------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def root():
    return {"message":"Server with DB is running NIGGA!"} 

#--------------------------------------------------------

# СОЗДАТЬ персонажа 
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
        LUC=data.LUC
    )
    db.add(new_character)
    db.commit()
    db.refresh(new_character)
    return new_character

# Получить всех персонажей
@app.get("/characters", response_model=list[CharacterResponse])
def get_characters(db: Session = Depends(get_db)):
    return db.query(character).all()

# Изменить Хп
@app.patch("/characters/{character_id}/hp")
def update_hp(character_id: int, data: HPUpdate, db: Session = Depends (get_db)):
    char = db.query(character).filter(character.id == character_id).first()
    if not char:
        return {"error": "Персонаж не найден"}
    if data.current_hp<0:char.current_hp=0
    elif data.current_hp>char.max_hp: char.current_hp=char.max_hp
    else:char.current_hp = data.current_hp
    db.commit()
    db.refresh(char)
    return {"message": "Здоровье обновлено", "hp": char.current_hp}

# Удалить персонажа
@app.delete("/characters/{character_id}")
def delete_character(character_id: int, db: Session = Depends(get_db)):
    char = db.query(character).filter(character.id == character_id).first()
    if not char:
        return {"error": "Персонаж не найден"}
    db.delete(char)
    db.commit()
    return {"message": "Персонаж удалён"} 

# Ввод инициативы
@app.post("/initiative/add")
def add_update_initiative(data: InitiativeInput, db: Session = Depends(get_db)):
    char=db.query(character).filter(character.id == data.character_id).first()

    if not char:
        return {"error":"Персонаж не найден"}
    
    entry = db.query(initiative).filter(initiative.character_id == data.character_id).first()
    
    if entry:
        entry.initiative = data.initiative
    else:
        entry = initiative(
            character_id=data.character_id,
            initiative=data.initiative
        )
        db.add(entry)

    db.commit()
    db.refresh(entry)
    return {"name": char.name, "initiative": entry.initiative} 

# Получить всех персонажей с инициативой
@app.get("/initiative")
def get_initiative(db: Session = Depends(get_db)):

    entries = db.query(initiative).all()

    entries.sort(key=lambda x: x.initiative, reverse=True)
    result = []

    for i,e in enumerate(entries):
        char = db.query(character).filter(character.id==e.character_id).first()
        result.append({
            "postion": i+1,
            "character_id": char.id if char else None,
            "name": char.name if char else "Незнакомец",
            "initiative": e.initiative,
            "hp": char.current_hp if char else None,
            "max_hp": char.max_hp if char else None
        })
    return result

# Очистить инициативу
@app.delete("/initiative/clear")
def clear_initiative(db: Session = Depends(get_db)):
    db.query(initiative).delete()
    db.commit()
    return {"message": "Инициатива очищена"}


#python -m uvicorn main:app --host 0.0.0.0 --port 8000
#контрол С вырубить
#чтоб запустить на локальной сети: python -m http.server 5500 
#С папки с фронтом, а в другом терминале запустить сервер на 5500 порту, 
#тогда фронт будет обращаться к бэку по адресу http://localhost:8000

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)