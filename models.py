from sqlalchemy import Column, Integer, String, ForeignKey
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
    initiative=Column(Integer, default=0) 

class initiative(Base):
    __tablename__= "initiative"

    id = Column(Integer, primary_key=True)
    character_id = Column(Integer, ForeignKey("characters.id"), unique=True)
    initiative = Column(Integer)
