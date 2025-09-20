// Test script for the new uptime API endpoint
const testUptimeAPI = async () => {
  const testDeviceId = 'test-device-123';
  const testData = {
    startDate: '2024-01-01',
    endDate: '2024-01-02',
    timeInterval: 5,
    timeRange: '24h'
  };

  console.log('🧪 Testing new uptime API endpoint...');
  console.log('📊 Test data:', testData);

  try {
    const response = await fetch(`/api/analytics/device/${testDeviceId}/uptime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('✅ API Response received:');
    console.log('  - Device ID:', result.deviceId);
    console.log('  - Time Range:', result.timeRange);
    console.log('  - Time Interval:', result.timeInterval);
    console.log('  - Data Points:', result.uptimeData.length);
    console.log('  - Is Mock Data:', result.isMockData);
    console.log('  - Data Source:', result.dataSource);
    console.log('  - Stats:', result.stats);
    console.log('  - Patterns:', result.patterns);
    console.log('  - Date Range:', result.dateRange);
    
    // Sample data points
    if (result.uptimeData.length > 0) {
      console.log('  - Sample Data Points:');
      result.uptimeData.slice(0, 3).forEach((point, index) => {
        console.log(`    ${index + 1}. ${point.displayTime} - ${point.isOnline === 1 ? 'Online' : 'Offline'} (Battery: ${point.batteryLevel}%, Heartbeats: ${point.heartbeatCount})`);
      });
    }

    console.log('🎉 Test completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
};

// Run the test
testUptimeAPI();
