import { useState, useEffect, useCallback } from 'react';
import { Device, FleetMetrics } from '@/types/device';
import { DeviceService } from '@/services/deviceService';

export interface UseDevicesReturn {
  devices: Device[];
  fleetMetrics: FleetMetrics;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useDevices(): UseDevicesReturn {
  const [devices, setDevices] = useState<Device[]>([]);
  const [fleetMetrics, setFleetMetrics] = useState<FleetMetrics>({
    totalDevices: 0,
    onlineDevices: 0,
    offlineDevices: 0,
    lowBatteryDevices: 0,
    averageBatteryLevel: 0,
    devicesNeedingMaintenance: 0,
    averageUptime: 0,
    lastUpdated: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const handleDevicesUpdate = useCallback((updatedDevices: Device[]) => {
    console.log('📊 useDevices: Received devices update:', updatedDevices.length, 'devices');
    
    setDevices(updatedDevices);
    setFleetMetrics(DeviceService.calculateFleetMetrics(updatedDevices));
    setLoading(false);
    setError(null);
  }, []);

  const handleError = useCallback((err: Error) => {
    console.error('Device data error:', err);
    setError(err);
    setLoading(false);
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
  }, []);

  useEffect(() => {
    console.log('🔄 useDevices: Setting up device listener...');
    let unsubscribe: (() => void) | undefined;

    const setupListener = async () => {
      try {
        // First, check what devices are available
        await DeviceService.checkAvailableDevices();
        
        console.log('🔄 useDevices: Calling DeviceService.subscribeToDevices...');
        unsubscribe = DeviceService.subscribeToDevices(
          handleDevicesUpdate,
          handleError
        );
        console.log('✅ useDevices: Successfully set up listener');
      } catch (err) {
        console.error('❌ useDevices: Error setting up listener:', err);
        handleError(err as Error);
      }
    };

    setupListener();

    return () => {
      console.log('🔄 useDevices: Cleaning up listener...');
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [handleDevicesUpdate, handleError]);

  return {
    devices,
    fleetMetrics,
    loading,
    error,
    refetch
  };
}

export interface UseDeviceReturn {
  device: Device | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useDevice(deviceId: string): UseDeviceReturn {
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDevice = useCallback(async () => {
    if (!deviceId) {
      setDevice(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const deviceData = await DeviceService.getDevice(deviceId);
      setDevice(deviceData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchDevice();
  }, [fetchDevice]);

  return {
    device,
    loading,
    error,
    refetch: fetchDevice
  };
}

export interface UseDeviceHistoryReturn {
  history: Device[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useDeviceHistory(deviceId: string, limitCount: number = 100): UseDeviceHistoryReturn {
  const [history, setHistory] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!deviceId) {
      setHistory([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const historyData = await DeviceService.getDeviceHistory(deviceId, limitCount);
      setHistory(historyData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [deviceId, limitCount]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    loading,
    error,
    refetch: fetchHistory
  };
}
