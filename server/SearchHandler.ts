import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { IPlace } from './models/IPlace';

export class SearchHandler {
  private genAI: GoogleGenerativeAI;
  private googleApiKey: string;
  private googleBearerToken: string;
  private googlePlacesApiUrl: string = "https://places.googleapis.com/v1/places:searchText";

  constructor() {
    this.googleApiKey = process.env.GOOGLE_API_KEY || '';
    this.googleBearerToken = process.env.GOOGLE_BEARER_TOKEN || '';
    this.genAI = new GoogleGenerativeAI(this.googleApiKey);
  }

  private async getPlaces(searchQuery: string): Promise<IPlace[]> {
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-Goog-User-Project": "engaged-code-449416-j9",
      "X-Goog-FieldMask": "places.location,places.displayName,places.name,places.primaryType,places.rating,places.userRatingCount,places.googleMapsUri,places.websiteUri,places.currentOpeningHours,places.id",
    };

    const body = {
      "textQuery": searchQuery
    };

    try {
      const response = await axios.post(`${this.googlePlacesApiUrl}?key=${this.googleApiKey}`, body, { headers });
      const data = response.data;
      
      const places: IPlace[] = [];
      for (const place of data.places || []) {
        if (!place.userRatingCount || place.userRatingCount < 50) continue;
        if (place.rating && place.rating <= 3.0) continue;
        if (!place.location?.latitude || !place.location?.longitude) continue;

        places.push({
          id: place.id,
          url: place.websiteUri,
          website_url: place.googleMapsUri,
          name: place.displayName?.text,
          type: place.primaryType,
          relevancy: 1,
          rating: place.rating,
          latitude: place.location.latitude,
          longitude: place.location.longitude,
        });
      }
      
      return places;
    } catch (error) {
      console.error('Error fetching places:', error);
      throw error;
    }
  }

  private async getSearchQueryFromMessages(messages: any[]): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
    const prompt = `Extract a google maps search query from the messages overall ${JSON.stringify(messages)}`;
    
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  private async mapPlacesToRelevancy(places: IPlace[], messages: any[]): Promise<IPlace[]> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
    const prompt = `Map the places to new relevancy scores based on the conversation history ${JSON.stringify(messages)} ${JSON.stringify(places)}`;
    
    const result = await model.generateContent(prompt);
    const response = JSON.parse(result.response.text());
    
    return places.map(place => {
      const relevancy = response.relevancies.find((r: any) => r.id === place.id);
      return {
        ...place,
        relevancy: relevancy?.relevancy || place.relevancy
      };
    });
  }

  public async handleSearch(messages: any[]): Promise<{ response: string; places: IPlace[] }> {
    try {
      const searchQuery = await this.getSearchQueryFromMessages(messages);
      const places = await this.getPlaces(searchQuery);
      
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
      const prompt = `Describe the places overall briefly ${JSON.stringify(places)}`;
      
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      return {
        response,
        places
      };
    } catch (error) {
      console.error('Error in search handler:', error);
      throw error;
    }
  }

  public async handleRefinedSearch(messages: any[], places: IPlace[]): Promise<{ response: string; places: IPlace[] }> {
    try {
      const updatedPlaces = await this.mapPlacesToRelevancy(places, messages);
      
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
      const prompt = `Describe the new places overall ${JSON.stringify(updatedPlaces)}, don't refer to relevancies explicitly, but mention why you think certain places are more relevant than others.`;
      
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      return {
        response,
        places: updatedPlaces
      };
    } catch (error) {
      console.error('Error in refined search handler:', error);
      throw error;
    }
  }
} 