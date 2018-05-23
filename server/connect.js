const net = require('net');
const os = require('os');

const hostname = os.hostname();
let serverConfigs = [];

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
  console.log(data);
  // const json = JSON.parse(data);
  // Emit some kind of event that can be used elsewhere...

  // serverConfigs[index].socket.write(JSON.stringify({ response: 'Hey there server!' }));
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
};

const startConnecting = (configs) => {
  serverConfigs = configs;
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
  return serverConfigs;
};

const getKey = (key) => {
  for (let index = 0; index < serverConfigs.length; index += 1) {
    if (serverConfigs[index].hostname !== hostname) {
      serverConfigs[index].socket.write(JSON.stringify({
        method: 'get',
        key
      }));
    }
  }
};

module.exports = { startConnecting, getKey };
