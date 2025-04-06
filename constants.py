REWRITE_SEARCH_QUERY = """
Using the conversation history, capture the user's intent and return a search query that is more likely to yield relevant locations.
"""

MAP_PLACES_TO_RELEVANCY = """
Using the conversation history, map the places to new relevancy scores.
This should be based on the reviews, perceived value, and the user's preferences.
The relevancy scores should be between 0 and 1, where 1 is the most relevant.
Be critical in your assessment.
"""