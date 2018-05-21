const net = require('net');
const os = require('os');
const util = require('util');
const _ = require('lodash');

const hostname = os.hostname();
console.log(hostname);

const serverConfigs = [
  {
    hostname: 'mdms1',
    port: 49152,
    connected: false,
    socket: {}
  },
  {
    hostname: 'mdms2',
    port: 49153,
    connected: false,
    socket: {}
  },
  {
    hostname: 'mdms3',
    port: 49154,
    connected: false,
    socket: {}
  },
  {
    hostname: 'mdms4',
    port: 49155,
    connected: false,
    socket: {}
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

const connect = (config) => {
  config.socket.connect({ port: config.port, hostname: `${config.hostname}.local` });
};

// Create a socket to each server
for (let i = 0; i < serverConfigs.length; i += 1) {
  if (serverConfigs[i].hostname !== hostname) {
    const config = serverConfigs[i];
    config.socket = new net.Socket();
    config.socket.on('connect', () => {
      console.log('Client: Connected to server');
      clearInterval(config.connected);
      config.connected = true;
    });

    // Let's handle the data we get from the server
    config.socket.on('data', (d) => {
      const data = JSON.parse(d);
      console.log('Response from server: %s', data.response);
      // Respond back
      config.socket.write(JSON.stringify({ response: 'Hey there server!' }));
      // Close the connection
      config.socket.end();
    });

    // Retry on error
    config.socket.on('error', (e) => {
      console.log('Can not connect to server: ', e);
      console.log(util.inspect(connect()));
      if (config.connected === true) {
        config.connected = false;
      }
      if (config.connected === false) {
        config.connected = setInterval(connect(config), 5000);
      }
    });

    // If the connection is close reconnect
    config.socket.on('close', () => {
      console.log('Connection Closed');
      if (config.connected === true) {
        config.connected = false;
      }
      if (config.connected === false) {
        config.connected = setInterval(connect(config), 5000);
      }
    });
  }
}
