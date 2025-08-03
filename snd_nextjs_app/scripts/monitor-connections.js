const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function monitorConnections() {
  try {
    console.log('🔍 Monitoring database connections...\n');
    
    // Get connection info from PostgreSQL
    const result = await prisma.$queryRaw`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections,
        count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
        count(*) FILTER (WHERE state = 'disabled') as disabled_connections
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `;
    
    const connectionInfo = result[0];
    
    console.log('📊 Current Connection Status:');
    console.log(`   Total Connections: ${connectionInfo.total_connections}`);
    console.log(`   Active Connections: ${connectionInfo.active_connections}`);
    console.log(`   Idle Connections: ${connectionInfo.idle_connections}`);
    console.log(`   Idle in Transaction: ${connectionInfo.idle_in_transaction}`);
    console.log(`   Disabled Connections: ${connectionInfo.disabled_connections}`);
    
    // Get connection details
    const connections = await prisma.$queryRaw`
      SELECT 
        pid,
        usename,
        application_name,
        client_addr,
        state,
        query_start,
        state_change,
        query
      FROM pg_stat_activity 
      WHERE datname = current_database()
      ORDER BY query_start DESC
    `;
    
    console.log('\n🔗 Active Connection Details:');
    connections.forEach((conn, index) => {
      if (index < 10) { // Show first 10 connections
        console.log(`   ${conn.pid} | ${conn.usename} | ${conn.application_name || 'unknown'} | ${conn.state} | ${conn.query?.substring(0, 50)}...`);
      }
    });
    
    if (connections.length > 10) {
      console.log(`   ... and ${connections.length - 10} more connections`);
    }
    
    // Check for potential connection leaks
    const longRunningQueries = connections.filter(conn => {
      if (!conn.query_start) return false;
      const queryStart = new Date(conn.query_start);
      const now = new Date();
      const duration = (now - queryStart) / 1000; // seconds
      return duration > 30; // Queries running longer than 30 seconds
    });
    
    if (longRunningQueries.length > 0) {
      console.log('\n⚠️  Long-running queries detected:');
      longRunningQueries.forEach(query => {
        const duration = Math.round((new Date() - new Date(query.query_start)) / 1000);
        console.log(`   PID ${query.pid}: ${duration}s - ${query.query?.substring(0, 100)}...`);
      });
    }
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    if (connectionInfo.total_connections > 20) {
      console.log('   ⚠️  High connection count detected. Consider:');
      console.log('      - Restarting your application');
      console.log('      - Checking for connection leaks');
      console.log('      - Reducing connection pool size');
    } else if (connectionInfo.total_connections < 10) {
      console.log('   ✅ Connection count looks healthy');
    }
    
  } catch (error) {
    console.error('❌ Error monitoring connections:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the monitoring
monitorConnections(); 