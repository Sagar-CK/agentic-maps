# define a schema for place
from pydantic import BaseModel, Field
from typing import Optional, List

class Location(BaseModel):
    latitude: float
    longitude: float
    
class Place(BaseModel):
    id: str
    latitude: float = Field(..., description="Latitude of the place")
    longitude: float = Field(..., description="Longitude of the place")
    url: Optional[str] = Field(None, description="URL of the place")
    website_url: Optional[str] = Field(None, description="Website URL of the place")
    name: Optional[str] = Field(None, description="Name of the place")
    type: Optional[str] = Field(None, description="Type of the place")
    relevancy: Optional[float] = Field(None, description="Relevancy score of the place")

class Response(BaseModel):
    response: str = Field(..., description="Response message")
    places: List[Place] = Field(..., description="List of places")

class Message(BaseModel):
    role: str
    content: str

class Relevancy(BaseModel):
    id: str
    relevancy: float

class ChatRequest(BaseModel):
    location: Location
    messages: List[Message]
    proposed_location_ids = Optional[List[Relevancy]]

class Relevancies(BaseModel):
    relevancies: List[Relevancy]