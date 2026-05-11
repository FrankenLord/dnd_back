from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

# Модель данных для персонажа
class сharacter(BaseModel):
    name: str
    clas: str
    level: int
    hp: int
    STR: int
    DEX: int
    CON: int
    INT: int
    WIS: int
    CHA: int

# Список для хранения персонажей
сharacters = []

@app.get("/")
# def это функция
def root():
    return {"message":"Server is alive!"}

# получить всех персонажей
@app.get("/сharacters")
def get_characters():
    return сharacters

# cоздать персонажа
@app.post("/сharacters")
def create_character(character: сharacter):
    сharacters.append(character)
    return {"message": "Character created successfully!","data":character}

@app.delete("/characters/{index}")
def delete_character(index: int ):
    if index < 0 or index >= len(сharacters):
        return {"message":"Нет такого персонажа!"}
    else :
        deleted_character = сharacters.pop(index-1)
        return {"message":"Перс удален из этой реальности","data":deleted_character}
    

# Запуск: uvicorn main:app --reload
# Либо если не работает: python -m uvicorn main:app -- 
