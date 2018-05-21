const net = require('net');
const os = require('os');
const _ = require('lodash');

const hostname = os.hostname();
console.log(hostname);

const serverConfigs = [
  {
    hostname: 'mdms1',
    port: 49152,
  },
  {
    hostname: 'mdms2',
    port: 49153,
  },
  {
    hostname: 'mdms3',
    port: 49154,
  },
  {
    hostname: 'mdms4',
    port: 49155,
  },
];

// Create a simple server
const server = net.createServer((conn) => {
  console.log('Server: Client connected');

  // If connection is closed
  conn.on('end', () => {
    console.log('Server: Client disconnected');
    // Close the server
    server.close();
    // End the process
    process.exit(0);
  });

  // Handle data from client
  conn.on('data', (d) => {
    const data = JSON.parse(d);
    console.log('Response from client: %s', data.response);
  });

  // Let's response with a hello message
  conn.write(JSON.stringify({ response: 'Hey there client!' }));
});

// Listen for connections
const serverConfig = _.find(serverConfigs, c => c.hostname === hostname);
server.listen(serverConfig.port, `${serverConfig.hostname}.local`, () => {
  console.log('Server: Listening');
});

// Create a socket (client) that connects to the server
serverConfigs.forEach((config) => {
  if (config.hostname !== hostname) {
    const socket = new net.Socket();
    socket.connect(config.port, `${config.hostname}.local`, () => {
      console.log('Client: Connected to server');
    });

    // Let's handle the data we get from the server
    socket.on('data', (d) => {
      const data = JSON.parse(d);
      console.log('Response from server: %s', data.response);
      // Respond back
      socket.write(JSON.stringify({ response: 'Hey there server!' }));
      // Close the connection
      socket.end();
    });
  }
});
