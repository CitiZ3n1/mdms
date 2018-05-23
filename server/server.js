const net = require('net');
const _ = require('lodash');
const os = require('os');

const { redisClient } = require('./redisClient.js');

const hostname = os.hostname();

// Create a simple server
const server = net.createServer((conn) => {
  console.log('Server: Client connected');

  // If connection is closed
  conn.on('end', () => {
    console.log('Server: Client disconnected');
    // Close the server
    server.close();
    // End the process
    // process.exit(0);
  });

  // Handle request from client
  conn.on('data', (d) => {
    console.log(d);
    const data = JSON.parse(d);
    if (data.method === 'get') {
      redisClient.get(data.key, (error, value) => {
        if (error) {
          console.log(error);
          throw error;
        }
        conn.write(JSON.stringify({ value }));
        console.log(value);
        redisClient.quit();
      });
    }
  });
});

// Listen for connections

const startListening = (serverConfigs) => {
  const serverConfig = _.find(serverConfigs, c => c.hostname === hostname);
  server.listen(serverConfig.port, serverConfig.ip, () => {
    console.log('Server: Listening');
  });
};

module.exports = { startListening };
