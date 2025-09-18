from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List

app = FastAPI()

class Item(BaseModel):
	name: str
	description: str = None

items = []

@app.get("/items", response_model=List[Item])
def get_items():
	return items

@app.post("/items", response_model=Item)
def add_item(item: Item):
	items.append(item)
	return item
