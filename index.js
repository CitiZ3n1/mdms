#!/usr/bin/env node

const redis = require('redis');
const cli = require('commander');

const { startListening } = require('./server/server.js');
const { startConnecting, getKey } = require('./server/connect.js');
const { redisClient } = require('./server/redisClient.js');

let serverConfigs = [
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

// Listen for connections from other nodes
startListening(serverConfigs);
// Connect to other nodes
serverConfigs = startConnecting(serverConfigs);

cli
  .version('0.0.1')
  .description('MDMS CLI');

cli
  .command('set <key> <value>')
  .description('Set a value')
  .action((key, value) => {
    redisClient.set(key, value, redis.print);
    redisClient.quit();
  });

cli
  .command('get <key>')
  .description('Get value')
  .action((key) => {
    redisClient.get(key, (error, value) => {
      if (error) {
        console.log(error);
        throw error;
      }
      if (value === null) {
        getKey(key);
      }
      console.log(value);
      redisClient.quit();
    });
  });

cli.parse(process.argv);
