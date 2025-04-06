import { GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai";
import { IPlace } from "./models/IPlace";

export class SearchHandler {
  private genAI: GoogleGenerativeAI;
  private flashModel: GenerativeModel;
  private mapsAPIKey: string = process.env.GOOGLE_BEARER_TOKEN!;
  private googlePlacesApiUrl: string =
    "https://places.googleapis.com/v1/places:searchText";

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    this.flashModel = this.genAI.getGenerativeModel({
      model: "gemini-2.0-flash-001",
    });
  }

  /**
   * Makes a call to the Google Maps API to search for places.
   * @param searchQuery The search query to search for.
   * @returns A list of places.
   */
  public async searchMaps(searchQuery: string): Promise<IPlace[]> {
    const headers = {
      Authorization: `Bearer ${this.mapsAPIKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Goog-User-Project": "engaged-code-449416-j9",
      "X-Goog-FieldMask":
        "places.location,places.displayName,places.name,places.primaryType,places.rating,places.userRatingCount,places.googleMapsUri,places.websiteUri,places.currentOpeningHours,places.id",
    };

    const body = {
      textQuery: searchQuery,
    };

    try {
      const response = await fetch(
        `${this.googlePlacesApiUrl}?key=${this.mapsAPIKey}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        console.error(response);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as {
        places?: Array<{
          id: string;
          websiteUri?: string;
          googleMapsUri?: string;
          displayName?: { text?: string };
          primaryType?: string;
          rating?: number;
          userRatingCount?: number;
          location?: {
            latitude: number;
            longitude: number;
          };
        }>;
      };

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
      console.error("Error fetching places:", error);
      throw error;
    }
  }
}
