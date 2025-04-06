import { IPlace } from "./models/IPlace";

/**
 * Represents a collaborative search effort between multiple users.
 *
 */
export interface ISearch {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  query: string;

  /**
   * ID of the user session that created this search.
   */
  createdBy: string;

  /**
   * IDs of the user sessions that are part of this search.
   */
  userSessionIds: string[];
  places: IPlace[];
}

// In-memory database for searches
export class SearchSessionManager {
  private searches: Map<string, ISearch>;

  constructor() {
    this.searches = new Map();
  }

  private randomId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  createSearch(query: string, user: string, places: IPlace[]): ISearch {
    const search: ISearch = {
      id: this.randomId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      query: query,
      createdBy: user,
      userSessionIds: [user],
      places: places,
    };
    this.searches.set(search.id, search);
    return search;
  }

  getSearch(searchId: string): ISearch | undefined {
    return this.searches.get(searchId);
  }

  /**
   * Adds a user session to a search.
   * @param searchId The ID of the search.
   * @param userSessionId The ID of the user session to add.
   */
  joinSearch(searchId: string, userSessionId: string) {
    const search = this.searches.get(searchId);
    if (search) {
      search.userSessionIds.push(userSessionId);
      this.searches.set(searchId, search);
    }
  }

  updateSearch(searchId: string, data: Partial<ISearch>): void {
    const search = this.searches.get(searchId);
    if (search) {
      search.updatedAt = new Date();
      Object.assign(search, data);
      this.searches.set(searchId, search);
    }
  }

  deleteSearch(searchId: string): boolean {
    return this.searches.delete(searchId);
  }

  getAllSearches(): ISearch[] {
    return Array.from(this.searches.values());
  }
}
