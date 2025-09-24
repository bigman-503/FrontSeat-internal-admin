import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  where, 
  limit,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  QuerySnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Device, FleetMetrics } from '@/types/device';

// Firestore collection names
const DEVICES_COLLECTION = 'devices';
const DEVICE_STATE_SUBCOLLECTION = 'state';
const CURRENT_DOCUMENT = 'current';

export class DeviceService {
  private static debounceTimer: NodeJS.Timeout | null = null;
  private static isDevelopment = process.env.NODE_ENV === 'development';
  private static lastProcessedData: any = null;
  private static lastProcessedTime = 0;
  private static heartbeatCount = 0;

  /**
   * Check what devices exist in Firestore
   */
  static async checkAvailableDevices(): Promise<void> {
    if (this.isDevelopment) {
      console.log('🔍 DeviceService: Checking available devices...');
      console.log('🔍 Firebase project ID:', db.app.options.projectId);
      console.log('🔍 Firebase database ID:', db.app.options.databaseURL);
    }
    
    // Only check collections we have permission to access
    const allowedCollections = ['devices'];
    
    for (const collectionName of allowedCollections) {
      try {
        if (this.isDevelopment) {
          console.log(`🔍 Checking collection: ${collectionName}`);
        }
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);
        if (this.isDevelopment) {
          console.log(`📁 Collection "${collectionName}": ${snapshot.size} documents`);
        }
        
        if (snapshot.size > 0 && this.isDevelopment) {
          console.log(`✅ Found data in collection: ${collectionName}`);
          snapshot.forEach((doc) => {
            console.log(`📄 Document ID: ${doc.id}`);
            console.log(`📄 Document data:`, doc.data());
          });
        }
      } catch (error) {
        if (this.isDevelopment) {
          console.log(`❌ Collection "${collectionName}": Error or doesn't exist`);
        }
      }
    }
    
    // Check the specific device we know exists
    const knownDeviceId = 'a45bf34bff4d8e66';
    if (this.isDevelopment) {
      console.log(`🔍 Checking for known device ${knownDeviceId}...`);
    }
    
    try {
      const deviceRef = doc(db, 'devices', knownDeviceId);
      const deviceSnap = await getDoc(deviceRef);
      if (this.isDevelopment) {
        console.log(`🔍 Device ${knownDeviceId} in devices:`, deviceSnap.exists());
      }
      
      if (deviceSnap.exists() && this.isDevelopment) {
        console.log(`📄 Device data in devices:`, deviceSnap.data());
        
        // Also check for state subcollection
        const stateRef = doc(db, 'devices', knownDeviceId, 'state', 'current');
        const stateSnap = await getDoc(stateRef);
        console.log(`🔍 State subcollection in devices:`, stateSnap.exists());
        
        if (stateSnap.exists()) {
          console.log(`📄 State data in devices:`, stateSnap.data());
        }
      }
    } catch (error) {
      if (this.isDevelopment) {
        console.log(`❌ Error checking device in devices:`, error);
      }
    }
    
    // Let's also check if there are any subcollections in the devices collection
    if (this.isDevelopment) {
      console.log(`🔍 Checking for subcollections in devices collection...`);
    }
    try {
      const devicesRef = collection(db, 'devices');
      const devicesSnapshot = await getDocs(devicesRef);
      if (this.isDevelopment) {
        console.log(`📁 Devices collection has ${devicesSnapshot.size} documents`);
      }
      
      if (devicesSnapshot.size > 0 && this.isDevelopment) {
        devicesSnapshot.forEach((doc) => {
          console.log(`📄 Document in devices: ${doc.id}`, doc.data());
        });
      } else if (this.isDevelopment) {
        console.log(`⚠️ Devices collection is empty. Let's check if there are any subcollections...`);
        
        // Check the known working pattern first
        const knownStatePattern = 'devices/a45bf34bff4d8e66/state/current';
        try {
          const parts = knownStatePattern.split('/');
          const ref = doc(db, parts[0], parts[1], parts[2], parts[3]);
          const snap = await getDoc(ref);
          if (this.isDevelopment) {
            console.log(`🔍 Pattern ${knownStatePattern}:`, snap.exists());
            if (snap.exists()) {
              console.log(`📄 Data at ${knownStatePattern}:`, snap.data());
              console.log(`✅ Found working data pattern: ${knownStatePattern}`);
            }
          }
        } catch (error) {
          if (this.isDevelopment) {
            console.log(`❌ Pattern ${knownStatePattern}: Error`);
          }
        }
        
        // Skip checking device variations since we found the working pattern
        if (this.isDevelopment) {
          console.log(`✅ Using known working data pattern: ${knownStatePattern}`);
        }
      }
    } catch (error) {
      if (this.isDevelopment) {
        console.log(`❌ Error checking devices subcollections:`, error);
      }
    }
    
    // Real data found, no need for test data
    if (this.isDevelopment) {
      console.log(`✅ Real device data found, skipping test data creation`);
    }
  }

  /**
   * Reset tracking variables (useful for cleanup)
   */
  static resetTracking(): void {
    this.lastProcessedData = null;
    this.lastProcessedTime = 0;
    this.heartbeatCount = 0;
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Listen to real-time device data from Firestore
   * This will automatically update when devices send heartbeats
   */
  static subscribeToDevices(
    onUpdate: (devices: Device[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    if (this.isDevelopment) {
      console.log('🔍 DeviceService: Setting up Firestore listener...');
      console.log('🔍 Collection:', DEVICES_COLLECTION);
    }

    // Since we know the data is in devices/a45bf34bff4d8e66/state/current,
    // let's listen directly to that specific document
    const knownDeviceId = 'a45bf34bff4d8e66';
    const stateRef = doc(db, DEVICES_COLLECTION, knownDeviceId, DEVICE_STATE_SUBCOLLECTION, CURRENT_DOCUMENT);
    
    if (this.isDevelopment) {
      console.log('🔍 Listening to specific state document:', stateRef.path);
    }
    
    return onSnapshot(
      stateRef,
      (snapshot: DocumentSnapshot) => {
        // Increment heartbeat counter
        this.heartbeatCount++;
        
        // Check if this is a meaningful update
        const now = Date.now();
        const data = snapshot.exists() ? snapshot.data() : null;
        
        // Only log every 10th heartbeat to reduce console noise
        const shouldLog = this.heartbeatCount % 10 === 1;
        
        // Skip if we processed an update very recently (throttle to max once per 2 seconds)
        if (now - this.lastProcessedTime < 2000) {
          if (this.isDevelopment && shouldLog) {
            console.log(`⏭️ DeviceService: Throttling heartbeat #${this.heartbeatCount} - too soon since last update`);
          }
          return;
        }
        
        // Skip if this is the same data we just processed
        const dataString = JSON.stringify(data);
        if (dataString === this.lastProcessedData) {
          if (this.isDevelopment && shouldLog) {
            console.log(`⏭️ DeviceService: Skipping duplicate data (heartbeat #${this.heartbeatCount})`);
          }
          return;
        }
        
        // Clear existing debounce timer
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
        }
        
        // Set new debounce timer
        this.debounceTimer = setTimeout(() => {
          if (this.isDevelopment) {
            console.log(`📊 DeviceService: Processing heartbeat #${this.heartbeatCount} (last processed: ${this.heartbeatCount - 1} heartbeats ago)`);
            console.log('📊 DeviceService: Document exists:', snapshot.exists());
          }
        
          try {
            const devices: Device[] = [];
            
            if (snapshot.exists()) {
              if (this.isDevelopment) {
                console.log('📄 DeviceService: Found state data:', data);
              }
            
            const device: Device = {
              deviceId: data.deviceId || knownDeviceId,
              deviceName: data.deviceName || 'Unknown Device',
              platform: data.platform || 'unknown',
              model: data.model || 'Unknown Model',
              osVersion: data.osVersion || 'Unknown OS',
              appVersion: data.appVersion || '1.0.0',
              batteryLevel: data.batteryLevel || 0,
              charging: data.charging || false,
              location: {
                latitude: data.location?.latitude || 0,
                longitude: data.location?.longitude || 0,
                accuracy: data.location?.accuracy || 0,
                timestamp: data.location?.timestamp || Date.now()
              },
              networkStatus: {
                connected: data.networkStatus?.connected || false,
                signalStrength: data.networkStatus?.signalStrength,
                type: data.networkStatus?.type || 'unknown',
                online: data.networkStatus?.online || false
              },
              online: data.online || false,
              storageUsage: data.storageUsage || 0,
              timestamp: data.timestamp || new Date().toISOString(),
              uptime: data.uptime || 0,
              screenStatus: {
                isScreenOn: data.screenStatus?.isScreenOn || false,
                currentApp: data.screenStatus?.currentApp || 'Unknown',
                appPackageName: data.screenStatus?.appPackageName || 'unknown'
              },
              memoryUsage: data.memoryUsage || 0,
              heartbeatCount: data.heartbeatCount || 0,
              lastSeen: data.lastSeen || data.timestamp || new Date().toISOString(),
              status: this.calculateDeviceStatus(data),
              carId: data.carId,
              driverId: data.driverId,
              lastMaintenance: data.lastMaintenance
            };
            
              devices.push(device);
              if (this.isDevelopment) {
                console.log('✅ DeviceService: Successfully processed device', device.deviceId);
              }
            } else {
              if (this.isDevelopment) {
                console.log('⚠️ DeviceService: State document does not exist');
              }
            }
            
            if (this.isDevelopment) {
              console.log(`✅ DeviceService: Successfully processed ${devices.length} devices (heartbeat #${this.heartbeatCount})`);
            }
            
            // Update tracking variables
            this.lastProcessedData = dataString;
            this.lastProcessedTime = now;
            
            onUpdate(devices);
          } catch (error) {
            console.error('❌ DeviceService: Error processing device data:', error);
            onError?.(error as Error);
          }
        }, 1000); // 1 second debounce for final processing
      },
      (error) => {
        console.error('❌ DeviceService: Error listening to state document:', error);
        onError?.(error);
      }
    );
  }

  /**
   * Calculate device status based on various factors
   */
  private static calculateDeviceStatus(data: any): Device['status'] {
    const now = new Date();
    const lastSeen = new Date(data.lastSeen || data.timestamp || now);
    const timeDiff = now.getTime() - lastSeen.getTime();
    const minutesSinceLastSeen = timeDiff / (1000 * 60);

    // If device hasn't been seen for more than 5 minutes, consider it offline
    if (minutesSinceLastSeen > 5) {
      return 'offline';
    }

    // Check battery level
    if (data.batteryLevel < 20) {
      return 'low_battery';
    }

    // Check if device is online
    if (data.online && data.networkStatus?.connected) {
      return 'online';
    }

    return 'offline';
  }

  /**
   * Get fleet metrics from device data
   */
  static calculateFleetMetrics(devices: Device[]): FleetMetrics {
    const totalDevices = devices.length;
    if (totalDevices === 0) {
      return {
        totalDevices: 0,
        onlineDevices: 0,
        offlineDevices: 0,
        lowBatteryDevices: 0,
        averageBatteryLevel: 0,
        devicesNeedingMaintenance: 0,
        averageUptime: 0,
        lastUpdated: new Date().toISOString()
      };
    }

    const onlineDevices = devices.filter(d => d.status === 'online').length;
    const offlineDevices = devices.filter(d => d.status === 'offline').length;
    const lowBatteryDevices = devices.filter(d => d.status === 'low_battery').length;
    
    const averageBatteryLevel = devices.reduce((sum, d) => sum + d.batteryLevel, 0) / totalDevices;
    
    const averageUptime = devices.reduce((sum, d) => {
      // Convert uptime from milliseconds to hours
      return sum + (d.uptime / (1000 * 60 * 60));
    }, 0) / totalDevices;

    return {
      totalDevices,
      onlineDevices,
      offlineDevices,
      lowBatteryDevices,
      averageBatteryLevel,
      devicesNeedingMaintenance: 0, // TODO: Implement maintenance logic
      averageUptime,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get device by ID
   */
  static async getDevice(deviceId: string): Promise<Device | null> {
    try {
      const stateRef = doc(db, DEVICES_COLLECTION, deviceId, DEVICE_STATE_SUBCOLLECTION, CURRENT_DOCUMENT);
      const docSnap = await getDoc(stateRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          deviceId: data.deviceId || docSnap.id,
          deviceName: data.deviceName || 'Unknown Device',
          platform: data.platform || 'unknown',
          model: data.model || 'Unknown Model',
          osVersion: data.osVersion || 'Unknown OS',
          appVersion: data.appVersion || '1.0.0',
          batteryLevel: data.batteryLevel || 0,
          charging: data.charging || false,
          location: {
            latitude: data.location?.latitude || 0,
            longitude: data.location?.longitude || 0,
            accuracy: data.location?.accuracy || 0,
            timestamp: data.location?.timestamp || Date.now()
          },
          networkStatus: {
            connected: data.networkStatus?.connected || false,
            signalStrength: data.networkStatus?.signalStrength,
            type: data.networkStatus?.type || 'unknown',
            online: data.networkStatus?.online || false
          },
          online: data.online || false,
          storageUsage: data.storageUsage || 0,
          timestamp: data.timestamp || new Date().toISOString(),
          uptime: data.uptime || 0,
          screenStatus: {
            isScreenOn: data.screenStatus?.isScreenOn || false,
            currentApp: data.screenStatus?.currentApp || 'Unknown',
            appPackageName: data.screenStatus?.appPackageName || 'unknown'
          },
          memoryUsage: data.memoryUsage || 0,
          heartbeatCount: data.heartbeatCount || 0,
          lastSeen: data.lastSeen || data.timestamp || new Date().toISOString(),
          status: this.calculateDeviceStatus(data),
          carId: data.carId,
          driverId: data.driverId,
          lastMaintenance: data.lastMaintenance
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting device:', error);
      throw error;
    }
  }

  /**
   * Get device history
   */
  static async getDeviceHistory(deviceId: string, limitCount: number = 100): Promise<Device[]> {
    try {
      // For now, return empty array since we don't have history collection
      // This would need to be implemented based on your actual history structure
      console.log('⚠️ DeviceService: History collection not implemented yet');
      return [];
    } catch (error) {
      console.error('Error getting device history:', error);
      throw error;
    }
  }

  /**
   * Add device event (for maintenance, alerts, etc.)
   */
  static async addDeviceEvent(
    deviceId: string, 
    eventType: string, 
    description: string, 
    metadata?: any
  ): Promise<void> {
    try {
      // For now, just log the event since we don't have events collection
      console.log('📝 DeviceService: Device event logged:', { deviceId, eventType, description, metadata });
    } catch (error) {
      console.error('Error adding device event:', error);
      throw error;
    }
  }

  /**
   * Update device maintenance status
   */
  static async updateDeviceMaintenance(deviceId: string, maintenanceData: any): Promise<void> {
    try {
      const stateRef = doc(db, DEVICES_COLLECTION, deviceId, DEVICE_STATE_SUBCOLLECTION, CURRENT_DOCUMENT);
      await updateDoc(stateRef, {
        lastMaintenance: new Date().toISOString(),
        ...maintenanceData
      });
    } catch (error) {
      console.error('Error updating device maintenance:', error);
      throw error;
    }
  }
}
