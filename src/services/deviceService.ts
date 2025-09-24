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
  /**
   * Check what devices exist in Firestore
   */
  static async checkAvailableDevices(): Promise<void> {
    console.log('🔍 DeviceService: Checking available devices...');
    console.log('🔍 Firebase project ID:', db.app.options.projectId);
    console.log('🔍 Firebase database ID:', db.app.options.databaseURL);
    
    // Only check collections we have permission to access
    const allowedCollections = ['devices'];
    
    for (const collectionName of allowedCollections) {
      try {
        console.log(`🔍 Checking collection: ${collectionName}`);
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);
        console.log(`📁 Collection "${collectionName}": ${snapshot.size} documents`);
        
        if (snapshot.size > 0) {
          console.log(`✅ Found data in collection: ${collectionName}`);
          snapshot.forEach((doc) => {
            console.log(`📄 Document ID: ${doc.id}`);
            console.log(`📄 Document data:`, doc.data());
          });
        }
      } catch (error) {
        console.log(`❌ Collection "${collectionName}": Error or doesn't exist`);
      }
    }
    
    // Check the specific device we know exists
    const knownDeviceId = 'a45bf34bff4d8e66';
    console.log(`🔍 Checking for known device ${knownDeviceId}...`);
    
    try {
      const deviceRef = doc(db, 'devices', knownDeviceId);
      const deviceSnap = await getDoc(deviceRef);
      console.log(`🔍 Device ${knownDeviceId} in devices:`, deviceSnap.exists());
      
      if (deviceSnap.exists()) {
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
      console.log(`❌ Error checking device in devices:`, error);
    }
    
    // Let's also check if there are any subcollections in the devices collection
    console.log(`🔍 Checking for subcollections in devices collection...`);
    try {
      const devicesRef = collection(db, 'devices');
      const devicesSnapshot = await getDocs(devicesRef);
      console.log(`📁 Devices collection has ${devicesSnapshot.size} documents`);
      
      if (devicesSnapshot.size > 0) {
        devicesSnapshot.forEach((doc) => {
          console.log(`📄 Document in devices: ${doc.id}`, doc.data());
        });
      } else {
        console.log(`⚠️ Devices collection is empty. Let's check if there are any subcollections...`);
        
        // Try to check if there are any subcollections by looking for common patterns
        const subcollectionPatterns = [
          'devices/a45bf34bff4d8e66/state/current',
          'devices/a45bf34bff4d8e66/heartbeat/current',
          'devices/a45bf34bff4d8e66/data/current',
          'devices/a45bf34bff4d8e66/status/current',
          'devices/a45bf34bff4d8e66/info/current'
        ];
        
        for (const pattern of subcollectionPatterns) {
          try {
            const parts = pattern.split('/');
            const ref = doc(db, parts[0], parts[1], parts[2], parts[3]);
            const snap = await getDoc(ref);
            console.log(`🔍 Pattern ${pattern}:`, snap.exists());
            if (snap.exists()) {
              console.log(`📄 Data at ${pattern}:`, snap.data());
            }
          } catch (error) {
            console.log(`❌ Pattern ${pattern}: Error`);
          }
        }
        
        // Let's also try to check if the device exists as a direct document with different names
        const deviceVariations = [
          'a45bf34bff4d8e66',
          'device_a45bf34bff4d8e66',
          'SCM-AL09',
          'device_SCM-AL09'
        ];
        
        console.log(`🔍 Checking device variations in devices collection...`);
        for (const deviceId of deviceVariations) {
          try {
            const deviceRef = doc(db, 'devices', deviceId);
            const deviceSnap = await getDoc(deviceRef);
            console.log(`🔍 Device ${deviceId} in devices:`, deviceSnap.exists());
            if (deviceSnap.exists()) {
              console.log(`📄 Device data for ${deviceId}:`, deviceSnap.data());
            }
          } catch (error) {
            console.log(`❌ Error checking device ${deviceId}:`, error);
          }
        }
      }
    } catch (error) {
      console.log(`❌ Error checking devices subcollections:`, error);
    }
    
    // If we still haven't found any data, let's create some test data for demonstration
    console.log(`🔍 No real data found. Creating test data for demonstration...`);
    try {
      const testDeviceRef = doc(db, 'devices', 'test-device-001');
      const testDeviceSnap = await getDoc(testDeviceRef);
      
      if (!testDeviceSnap.exists()) {
        console.log(`📝 Creating test device data...`);
        // We'll create this in the next step
      }
    } catch (error) {
      console.log(`❌ Error creating test data:`, error);
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
    console.log('🔍 DeviceService: Setting up Firestore listener...');
    console.log('🔍 Collection:', DEVICES_COLLECTION);

    // Since we know the data is in devices/a45bf34bff4d8e66/state/current,
    // let's listen directly to that specific document
    const knownDeviceId = 'a45bf34bff4d8e66';
    const stateRef = doc(db, DEVICES_COLLECTION, knownDeviceId, DEVICE_STATE_SUBCOLLECTION, CURRENT_DOCUMENT);
    
    console.log('🔍 Listening to specific state document:', stateRef.path);
    
    return onSnapshot(
      stateRef,
      (snapshot: DocumentSnapshot) => {
        console.log('📊 DeviceService: Received state document update');
        console.log('📊 DeviceService: Document exists:', snapshot.exists());
        
        try {
          const devices: Device[] = [];
          
          if (snapshot.exists()) {
            const data = snapshot.data();
            console.log('📄 DeviceService: Found state data:', data);
            
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
            console.log('✅ DeviceService: Successfully processed device', device.deviceId);
          } else {
            console.log('⚠️ DeviceService: State document does not exist');
          }
          
          console.log('✅ DeviceService: Successfully processed', devices.length, 'devices');
          onUpdate(devices);
        } catch (error) {
          console.error('❌ DeviceService: Error processing device data:', error);
          onError?.(error as Error);
        }
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
    const onlineDevices = devices.filter(d => d.status === 'online').length;
    const offlineDevices = devices.filter(d => d.status === 'offline').length;
    const lowBatteryDevices = devices.filter(d => d.status === 'low_battery').length;
    
    const averageBatteryLevel = devices.length > 0 
      ? devices.reduce((sum, d) => sum + d.batteryLevel, 0) / devices.length 
      : 0;
    
    const averageUptime = devices.length > 0 
      ? devices.reduce((sum, d) => {
          // Convert uptime from milliseconds to hours
          const uptimeInHours = d.uptime / (1000 * 60 * 60);
          console.log(`🔍 Device ${d.deviceId}: Raw uptime ${d.uptime}ms = ${uptimeInHours.toFixed(2)} hours`);
          return sum + uptimeInHours;
        }, 0) / devices.length 
      : 0;

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
