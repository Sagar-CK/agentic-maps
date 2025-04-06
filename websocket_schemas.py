from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class BaseMessage(BaseModel):
    """Base class for all WebSocket messages"""
    type: str = Field(..., description="Type of the message")

class NewSearchSessionMessage(BaseMessage):
    """Message to create a new search session"""
    type: str = Field("NEW_SEARCH_SESSION", description="Message type")
    query: str = Field(..., description="Search query string")
    messages: Optional[List[Dict[str, Any]]] = Field(default=[], description="Previous conversation messages")

class RefineSearchMessage(BaseMessage):
    """Message to refine an existing search"""
    type: str = Field("REFINE_SEARCH", description="Message type")
    places: List[Dict[str, Any]] = Field(..., description="List of places to refine")
    messages: Optional[List[Dict[str, Any]]] = Field(default=[], description="Previous conversation messages")

class SearchSessionResponse(BaseModel):
    """Response for a new search session"""
    type: str = Field("searchSessionCreated", description="Response type")
    searchId: str = Field(..., description="Unique identifier for the search session")
    data: Dict[str, Any] = Field(..., description="Search results and session data")

class SearchRefinedResponse(BaseModel):
    """Response for a refined search"""
    type: str = Field("searchRefined", description="Response type")
    data: Dict[str, Any] = Field(..., description="Refined search results")

class ErrorResponse(BaseModel):
    """Error response for failed operations"""
    type: str = Field("error", description="Response type")
    message: str = Field(..., description="Error message")

class SessionUpdateResponse(BaseModel):
    """Response for session updates"""
    type: str = Field("sessionUpdate", description="Response type")
    sessionId: str = Field(..., description="Session identifier")
    data: Optional[Dict[str, Any]] = Field(None, description="Updated session data")

class SessionCreatedResponse(BaseModel):
    """Response for new session creation"""
    type: str = Field("sessionCreated", description="Response type")
    sessionId: str = Field(..., description="New session identifier") 