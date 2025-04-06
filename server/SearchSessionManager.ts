/**
 * Represents a collaborative search effort between multiple users.
 * 
 */
export interface ISearch {
    id: string;
    created_at: Date;
    updated_at: Date;
    query: string;
    results: any[];
}

// In-memory database for searches
export class SearchSessionManager {
    private searches: Map<string, ISearch>;

    constructor() {
        this.searches = new Map();
    }

    createSearch(query: string): ISearch {
        const searchId = Math.random().toString(36).substring(2, 15);
        const search: ISearch = {
            id: searchId,
            created_at: new Date(),
            updated_at: new Date(),
            query: query,
            results: []
        };
        this.searches.set(searchId, search);
        return search;
    }

    getSearch(searchId: string): ISearch | undefined {
        return this.searches.get(searchId);
    }

    updateSearch(searchId: string, data: Partial<ISearch>): void {
        const search = this.searches.get(searchId);
        if (search) {
            search.updated_at = new Date();
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

