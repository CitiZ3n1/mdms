const net = require('net');
const os = require('os');
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
  config.socket.connect(config.port, `${config.hostname}.local`, () => {
    console.log('Client: Connected to server');
    clearInterval(config.connected);
    config.connected = true;
  });
  return config;
};

const createSocket = (config) => {
  // TODO don't mutuate the passed in config...
  config = connect(config);

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
};

// Create a socket to each server
serverConfigs.forEach((config) => {
  if (config.hostname !== hostname) {
    config.socket = new net.Socket();
    createSocket(config);
  }
});
