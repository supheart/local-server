
import express from 'express';
import { LocalServer } from "./src";

const app = express();

const serverURL = 'http://localhost:1337/parse';
const appId = 'local-core';
const masterKey = 'dfagadsfdfdsgafefewfdhtrjrtj';

const baseConfig = { serverURL, appId, masterKey };

const localServer = LocalServer({
  databaseURI: 'postgres://proxima:proxima@124.71.10.25:5432/my',
  ...baseConfig,
});

app.use('/local', localServer);

app.listen(1337, function () {
  console.log('milo-server running on port 1337.');
});
