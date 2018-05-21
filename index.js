const net = require('net');
const os = require('os');
const _ = require('lodash');

const hostname = os.hostname();
console.log(hostname);

const serverConfigs = [
  {
    hostname: 'mdms1',
    ip: '192.168.1.22',
    port: 49152,
    connected: false,
    socket: {}
  },
  {
    hostname: 'mdms2',
    ip: '192.168.1.15',
    port: 49153,
    connected: false,
    socket: {}
  },
  {
    hostname: 'mdms3',
    ip: '192.168.1.23',
    port: 49154,
    connected: false,
    socket: {}
  },
  {
    hostname: 'mdms4',
    ip: '192.168.1.21',
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
server.listen(serverConfig.port, serverConfig.ip, () => {
  console.log('Server: Listening');
});

const connect = (index) => {
  serverConfigs[index].socket.connect({
    port: serverConfigs[index].port,
    host: serverConfigs[index].ip
  });
};

const onConnect = (index) => {
  console.log('Client: Connected to server');
  clearInterval(serverConfigs[index].connected);
  serverConfigs[index].connected = true;
};

const onData = (data, index) => {
  const json = JSON.parse(data);
  console.log('Response from server: %s', json.response);
  // Respond back
  serverConfigs[index].socket.write(JSON.stringify({ response: 'Hey there server!' }));
  // Close the connection
  serverConfigs[index].socket.end();
};

const onError = (error, index) => {
  console.log('Can not connect to server: ', error);
  if (serverConfigs[index].connected === true && error.code === 'ECONNREFUSED') {
    serverConfigs[index].connected = false;
  }
  if (serverConfigs[index].connected === false && error.code === 'ECONNREFUSED') {
    serverConfigs[index].connected = setInterval(() => { connect(index); }, 5000);
  }
  if (error.code === 'ENOTFOUND') {
    console.log('Don\'t try to reconnect');
  }
};

// Create a socket to each server
for (let index = 0; index < serverConfigs.length; index += 1) {
  if (serverConfigs[index].hostname !== hostname) {
    serverConfigs[index].socket = new net.Socket();
    serverConfigs[index].socket.on('connect', () => { onConnect(index); });

    // Let's handle the data we get from the server
    serverConfigs[index].socket.on('data', (data) => { onData(data, index); });

    // Retry on error
    serverConfigs[index].socket.on('error', (error) => { onError(error, index); });

    // If the connection is close reconnect
    /*
    serverConfigs[i].on('close', () => {
      console.log('Connection Closed');
      if (config.connected === true) {
        config.connected = false;
      }
      if (config.connected === false) {
        config.connected = setInterval(connect(index), 5000);
      }
    });
    */

    connect(index);
  }
}
