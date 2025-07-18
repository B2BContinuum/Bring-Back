import WebSocket from 'ws';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

interface WebSocketClient {
  id: string;
  userId: string;
  socket: WebSocket;
  isAlive: boolean;
}

export class WebSocketManager {
  private server: WebSocket.Server;
  private clients: Map<string, WebSocketClient> = new Map();
  private userConnections: Map<string, Set<string>> = new Map(); // userId -> Set of clientIds
  private jwtSecret: string;
  private pingInterval: NodeJS.Timeout;

  constructor(httpServer: http.Server, jwtSecret: string) {
    this.jwtSecret = jwtSecret;
    this.server = new WebSocket.Server({ server: httpServer });
    
    this.server.on('connection', this.handleConnection.bind(this));
    
    // Set up ping interval to keep connections alive and detect disconnected clients
    this.pingInterval = setInterval(() => {
      this.clients.forEach((client) => {
        if (!client.isAlive) {
          this.removeClient(client.id);
          return;
        }
        
        client.isAlive = false;
        client.socket.ping();
      });
    }, 30000); // 30 seconds
  }

  private handleConnection(socket: WebSocket, request: http.IncomingMessage): void {
    // Extract token from query string
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (!token) {
      socket.close(1008, 'Authentication required');
      return;
    }
    
    // Verify JWT token
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as { userId: string };
      const userId = decoded.userId;
      
      // Create client
      const clientId = uuidv4();
      const client: WebSocketClient = {
        id: clientId,
        userId,
        socket,
        isAlive: true
      };
      
      // Store client
      this.clients.set(clientId, client);
      
      // Add to user connections
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      this.userConnections.get(userId)?.add(clientId);
      
      // Set up event handlers
      socket.on('pong', () => {
        client.isAlive = true;
      });
      
      socket.on('message', (data: WebSocket.Data) => {
        this.handleMessage(clientId, data);
      });
      
      socket.on('close', () => {
        this.removeClient(clientId);
      });
      
      socket.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.removeClient(clientId);
      });
      
      // Send welcome message
      this.sendToClient(clientId, 'connection_established', { userId });
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      socket.close(1008, 'Authentication failed');
    }
  }

  private handleMessage(clientId: WebSocket.Data, data: WebSocket.Data): void {
    try {
      const client = this.clients.get(clientId.toString());
      if (!client) return;
      
      const message = JSON.parse(data.toString());
      
      // Handle different message types
      switch (message.type) {
        case 'ping':
          this.sendToClient(clientId.toString(), 'pong', {});
          break;
          
        default:
          // Ignore unknown message types
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  private removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    // Remove from user connections
    const userConnections = this.userConnections.get(client.userId);
    if (userConnections) {
      userConnections.delete(clientId);
      if (userConnections.size === 0) {
        this.userConnections.delete(client.userId);
      }
    }
    
    // Close socket and remove from clients
    try {
      client.socket.terminate();
    } catch (error) {
      console.error(`Error terminating WebSocket for client ${clientId}:`, error);
    }
    
    this.clients.delete(clientId);
  }

  public sendToClient(clientId: string, type: string, payload: any): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;
    
    try {
      const message = JSON.stringify({
        type,
        payload,
        timestamp: new Date().toISOString()
      });
      
      client.socket.send(message);
      return true;
    } catch (error) {
      console.error(`Error sending WebSocket message to client ${clientId}:`, error);
      return false;
    }
  }

  public sendToUser(userId: string, type: string, payload: any): number {
    const userClients = this.userConnections.get(userId);
    if (!userClients || userClients.size === 0) return 0;
    
    let successCount = 0;
    
    userClients.forEach(clientId => {
      if (this.sendToClient(clientId, type, payload)) {
        successCount++;
      }
    });
    
    return successCount;
  }

  public broadcastToAll(type: string, payload: any): number {
    let successCount = 0;
    
    this.clients.forEach(client => {
      if (this.sendToClient(client.id, type, payload)) {
        successCount++;
      }
    });
    
    return successCount;
  }

  public getConnectedUserCount(): number {
    return this.userConnections.size;
  }

  public getConnectedClientCount(): number {
    return this.clients.size;
  }

  public isUserConnected(userId: string): boolean {
    const userClients = this.userConnections.get(userId);
    return !!userClients && userClients.size > 0;
  }

  public shutdown(): void {
    clearInterval(this.pingInterval);
    
    this.clients.forEach(client => {
      try {
        client.socket.terminate();
      } catch (error) {
        console.error(`Error terminating WebSocket for client ${client.id}:`, error);
      }
    });
    
    this.clients.clear();
    this.userConnections.clear();
    
    this.server.close();
  }
}