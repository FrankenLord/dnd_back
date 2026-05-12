from sqlalchemy import Column, Integer, String, ForeignKey, Text
from database import Base

class character(Base):
    __tablename__ = "characters"

    id = Column(Integer, primary_key=True, index=True)
    name =Column(String, nullable=False)
    clas = Column(String, nullable=False)
    level = Column(Integer, default=0)
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
    initiative=Column(Integer, default=0) 

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
