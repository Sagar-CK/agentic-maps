import { WebSocketServer, WebSocket } from 'ws';
import { UserSessionManager } from './UserSessionManager';
import { SearchSessionManager } from './SearchSessionManager';
import { SearchHandler } from './SearchHandler';

// Create session store instance
const userSessionManager = new UserSessionManager();
const searchSessionManager = new SearchSessionManager();
const searchHandler = new SearchHandler();

// Create WebSocket server
const wss = new WebSocketServer({ 
  port: 1337,
  perMessageDeflate: false,
  clientTracking: true
});

console.log('Server is running on port 1337');
wss.on('connection', function connection(ws) {
  // Create a new session for each connection
  const session = userSessionManager.createSession(ws);
  console.log(`New session created: ${session.id}`);

  ws.on('message', async function message(data) {
    try {
      const parsedData = JSON.parse(data.toString());
      // Update session data
      userSessionManager.updateSession(session.id, parsedData);
      console.log(`Session ${session.id} updated:`, parsedData);
      
      // Handle NEW_SEARCH_SESSION message
      if (parsedData.type === 'NEW_SEARCH_SESSION') {
        const searchSession = searchSessionManager.createSearch(parsedData.query);
        console.log(`New search session created: ${searchSession.id}`);
        
        try {
          const searchResult = await searchHandler.handleSearch(parsedData.messages || []);
          console.log(`Search result: ${JSON.stringify(searchResult)}`);
          
          // Send back the search session information and results
          ws.send(JSON.stringify({
            type: 'searchSessionCreated',
            searchId: searchSession.id,
            data: {
              ...searchSession,
              response: searchResult.response,
              places: searchResult.places
            }
          }));
        } catch (error) {
          console.error('Error processing search:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Error processing search request'
          }));
        }
      }
      
      // Handle REFINE_SEARCH message
      if (parsedData.type === 'REFINE_SEARCH' && parsedData.places) {
        try {
          const refinedResult = await searchHandler.handleRefinedSearch(
            parsedData.messages || [],
            parsedData.places
          );
          
          ws.send(JSON.stringify({
            type: 'searchRefined',
            data: {
              response: refinedResult.response,
              places: refinedResult.places
            }
          }));
        } catch (error) {
          console.error('Error refining search:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Error refining search results'
          }));
        }
      }
      
      // Send back the current session data
      ws.send(JSON.stringify({
        type: 'sessionUpdate',
        sessionId: session.id,
        data: userSessionManager.getSession(session.id)?.data
      }));
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    // Clean up session when connection closes
    userSessionManager.deleteSession(session.id);
    console.log(`Session ${session.id} closed and deleted`);
  });

  // Send initial session information
  ws.send(JSON.stringify({
    type: 'sessionCreated',
    sessionId: session.id
  }));
});