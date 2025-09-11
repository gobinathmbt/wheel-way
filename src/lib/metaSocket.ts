// src/lib/metaSocket.ts - Dedicated meta operations socket client
import { io, Socket } from "socket.io-client";
import { BASE_URL } from "@/lib/config";

interface UploadProgress {
  batchId: string;
  progress: number;
  currentBatch: number;
  totalBatches: number;
  results: {
    processed: number;
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  estimatedTimeRemaining?: number;
}

interface BatchProgress {
  batchId: string;
  batchNumber: number;
  totalBatches: number;
  recordsProcessed: number;
  totalRecordsInBatch: number;
  progressInBatch: number;
}

interface UploadResults {
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  errors: any[];
  batchId: string;
  totalBatches: number;
  totalRecords: number;
}

interface BulkUploadData {
  data: any[];
  fieldMapping: any;
  dataTypes: any;
  customFieldTypes?: any;
  options?: any;
}

class MetaSocketService {
  private socket: Socket | null = null;
  private static instance: MetaSocketService;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private isConnecting = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  // Event callbacks
  private callbacks: { [event: string]: ((...args: any[]) => void)[] } = {};

  private constructor() {}

  public static getInstance(): MetaSocketService {
    if (!MetaSocketService.instance) {
      MetaSocketService.instance = new MetaSocketService();
    }
    return MetaSocketService.instance;
  }

  private getSocketUrl(): string {
    return BASE_URL;
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        const checkConnection = () => {
          if (this.socket?.connected) {
            resolve();
          } else if (!this.isConnecting) {
            reject(new Error("Connection failed"));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
        return;
      }

      this.isConnecting = true;
      const token = sessionStorage.getItem("token");

      if (!token) {
        this.isConnecting = false;
        reject(new Error("No auth token found"));
        return;
      }

      const socketUrl = this.getSocketUrl();
      console.log(`🔌 Connecting to meta socket server at: ${socketUrl}/meta`);

      // Connect to /meta namespace
      this.socket = io(`${socketUrl}/meta`, {
        auth: { token },
        transports: ["polling", "websocket"],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 10000,
        timeout: 30000,
        forceNew: true,
        upgrade: true,
        autoConnect: true,
      });

      this.setupEventHandlers(resolve, reject);
    });
  }

  private setupEventHandlers(resolve: () => void, reject: (error: Error) => void): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("✅ Connected to meta socket server");
      console.log(`📡 Meta Socket ID: ${this.socket?.id}`);
      
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      this.startHeartbeat();
      resolve();
    });

    this.socket.on("meta_connected", (data) => {
      console.log("🎉 Meta socket connection confirmed:", data);
      this.emit("connected", data);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from meta server:", reason);
      this.isConnecting = false;
      this.stopHeartbeat();
      this.emit("disconnected", { reason });
    });

    this.socket.on("connect_error", (error) => {
      console.error("🚫 Meta socket connection error:", error);
      this.isConnecting = false;
      reject(error);
    });

    this.socket.on("reconnect_attempt", (attempt) => {
      this.reconnectAttempts = attempt;
      console.log(`🔄 Meta socket reconnection attempt ${attempt}`);
    });

    this.socket.on("reconnect", (attempt) => {
      console.log(`✅ Meta socket reconnected after ${attempt} attempts`);
      this.startHeartbeat();
    });

    this.socket.on("reconnect_failed", () => {
      console.error("❌ Failed to reconnect meta socket after maximum attempts");
      this.isConnecting = false;
      reject(new Error("Failed to reconnect"));
    });

    // Upload event handlers
    this.socket.on("upload_started", (data) => {
      console.log("🚀 Bulk upload started:", data);
      this.emit("uploadStarted", data);
    });

    this.socket.on("batch_start", (data) => {
      console.log(`📦 Batch ${data.batchNumber}/${data.totalBatches} started`);
      this.emit("batchStart", data);
    });

    this.socket.on("batch_progress", (data: BatchProgress) => {
      this.emit("batchProgress", data);
    });

    this.socket.on("batch_complete", (data) => {
      console.log(`✅ Batch ${data.batchNumber}/${data.totalBatches} completed`);
      this.emit("batchComplete", data);
    });

    this.socket.on("upload_progress", (data: UploadProgress) => {
      console.log(`📊 Upload progress: ${data.progress}% (Batch ${data.currentBatch}/${data.totalBatches})`);
      this.emit("uploadProgress", data);
    });

    this.socket.on("upload_completed", (data: { success: boolean; data: UploadResults; duration?: number }) => {
      console.log("🎉 Bulk upload completed:", data);
      this.emit("uploadCompleted", data);
    });

    this.socket.on("upload_error", (data) => {
      console.error("❌ Upload error:", data);
      this.emit("uploadError", data);
    });

    this.socket.on("upload_cancelled", (data) => {
      console.log("⏹️ Upload cancelled:", data);
      this.emit("uploadCancelled", data);
    });

    this.socket.on("upload_status", (data) => {
      this.emit("uploadStatus", data);
    });

    this.socket.on("heartbeat_ack", (data) => {
      console.log("💓 Meta socket heartbeat acknowledged");
    });

    this.socket.on("connection_test_result", (data) => {
      console.log("🧪 Meta socket connection test result:", data);
      this.emit("connectionTestResult", data);
    });

    // Generic error handler
    this.socket.on("error", (error) => {
      console.error("🔐 Meta socket error:", error);
      this.emit("error", error);
    });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit("heartbeat");
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  public disconnect(): void {
    if (this.socket) {
      console.log("🔌 Disconnecting from meta socket server");
      this.stopHeartbeat();
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.callbacks = {};
  }

  // Upload operations
  public startBulkUpload(uploadData: BulkUploadData): void {
    if (this.socket && this.socket.connected) {
      console.log("🚀 Starting bulk upload with", uploadData.data.length, "records");
      this.socket.emit("start_bulk_upload", uploadData);
    } else {
      console.warn("❌ Meta socket not connected. Cannot start bulk upload.");
      this.emit("error", { message: "Meta socket not connected" });
    }
  }

  public cancelUpload(batchId: string): void {
    if (this.socket && this.socket.connected) {
      console.log("⏹️ Cancelling upload with batchId:", batchId);
      this.socket.emit("cancel_upload", { batchId });
    } else {
      console.warn("❌ Meta socket not connected. Cannot cancel upload.");
    }
  }

  public getUploadStatus(): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit("get_upload_status");
    } else {
      console.warn("❌ Meta socket not connected. Cannot get upload status.");
    }
  }

  public testConnection(): void {
    if (this.socket && this.socket.connected) {
      console.log("🧪 Testing meta socket connection...");
      this.socket.emit("test_connection");
    } else {
      console.warn("❌ Cannot test connection - meta socket not connected");
    }
  }

  // Event management
  public on(event: string, callback: (...args: any[]) => void): void {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  public off(event: string, callback?: (...args: any[]) => void): void {
    if (!this.callbacks[event]) return;

    if (callback) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    } else {
      this.callbacks[event] = [];
    }
  }

  private emit(event: string, ...args: any[]): void {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in meta socket event callback for ${event}:`, error);
        }
      });
    }
  }

  // Connection utilities
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public getSocketId(): string | null {
    return this.socket?.id || null;
  }

  public getConnectionState(): string {
    if (!this.socket) return "disconnected";
    if (this.isConnecting) return "connecting";
    if (this.socket.connected) return "connected";
    return "disconnected";
  }

  public async ensureConnection(): Promise<void> {
    if (!this.isConnected()) {
      await this.connect();
    }
  }

  // Utility method to get upload statistics
  public getUploadStats(): {
    isConnected: boolean;
    socketId: string | null;
    connectionState: string;
  } {
    return {
      isConnected: this.isConnected(),
      socketId: this.getSocketId(),
      connectionState: this.getConnectionState(),
    };
  }
}

// Export singleton instance
export const metaSocketService = MetaSocketService.getInstance();

// Export types for use in components
export type {
  UploadProgress,
  BatchProgress,
  UploadResults,
  BulkUploadData,
};