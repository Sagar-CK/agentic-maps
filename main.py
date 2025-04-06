from fastapi import FastAPI, HTTPException
from schemas import ChatRequest, Place
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
import os
import httpx
from pprint import pprint
import json
import constants

from google import genai
from google.genai import types

load_dotenv()

app = FastAPI()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GOOGLE_BEARER_TOKEN = os.getenv("GOOGLE_BEARER_TOKEN")
GOOGLE_PLACES_API_URL = "https://places.googleapis.com/v1/places:searchText"
GOOGLE_TOKEN_SECRET = os.getenv("GOOGLE_TOKEN_SECRET")
GOOGLE_TOKEN_ID = os.getenv("GOOGLE_TOKEN_ID")

client = genai.Client(api_key=GOOGLE_API_KEY)

@app.get("/get_places")
async def get_places(search_query: str):
    headers = {
        "Authorization": f"Bearer {GOOGLE_BEARER_TOKEN}",
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Goog-User-Project": "engaged-code-449416-j9",
        "X-Goog-FieldMask": "places.location,places.displayName,places.name,places.primaryType,places.rating,places.userRatingCount,places.googleMapsUri,places.websiteUri,places.currentOpeningHours"
    }

    body = {
        "textQuery": search_query
    }

    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(GOOGLE_PLACES_API_URL, json=body, headers=headers)
            r.raise_for_status()
            data = r.json()
            
            places = []
            for place in data.get("places", []):
                if not place.get("currentOpeningHours") or not place.get("currentOpeningHours").get("openNow"):
                    continue
                if not place.get("userRatingCount") or place.get("userRatingCount") < 50:
                    continue
                if place.get("rating") and place.get("rating") <= 3.0:
                    continue
                print(place)
                places.append(Place(
                    url=place.get("websiteUri"),
                    website_url=place.get("googleMapsUri"),
                    name=place.get("displayName").get("text"),
                    type=place.get("primaryType"),
                    relevancy=place.get("rating", 0)
                ))
            
            return places
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/chat")
async def chat(request: ChatRequest):
    async def event_stream():
        try:
            # get a search query from the messages overall
            search_query = client.models.generate_content(
                model='gemini-2.0-flash-001',
                contents=f"Extract a google maps search query from the messages overall {str(request.messages)}",
                config=types.GenerateContentConfig(
                    system_instruction=constants.REWRITE_SEARCH_QUERY
                )
            ).text
            
            print(search_query)
            
            places = await get_places(search_query)

            response_builder = {
                "response": "",
                "places": [],
            }

            for chunk in client.models.generate_content_stream(
                model='gemini-2.0-flash-001', contents=f"Describe the places overall briefly {str(places)}"
            ):
                if chunk and chunk.text:
                    response_builder["response"] += chunk.text
                    yield f"event: response\ndata: {json.dumps(response_builder)}\n\n"
                
            response_builder["places"] = [place.model_dump() for place in places]
            yield f"event: response\ndata: {json.dumps(response_builder)}\n\n"
            yield "event: end\ndata: {}\n\n"
    
        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
