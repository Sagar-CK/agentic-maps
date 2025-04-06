REWRITE_SEARCH_QUERY = """
Using the conversation history, capture the user's intent and return a search query that is more likely to yield relevant locations.
"""

MAP_PLACES_TO_RELEVANCY = """
Using the conversation history, map the places to new relevancy scores. The scores should be between 0 and 1, where 1 is the most relevant and 0 is the least relevant.
"""