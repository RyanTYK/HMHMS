// Global SSE connection manager
let globalEventSource: EventSource | null = null;

export function useSSE() {
  function closeConnection() {
    if (globalEventSource) {
      globalEventSource.close();
      globalEventSource = null;
      console.log('SSE connection closed');
    }
  }

  function setConnection(eventSource: EventSource) {
    // Close any existing connection first
    closeConnection();
    globalEventSource = eventSource;
  }

  function getConnection() {
    return globalEventSource;
  }

  return {
    closeConnection,
    setConnection,
    getConnection
  };
}
