import * as express from 'express';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import * as md5 from 'md5';

export const env = {
  inTest: false,
}

export const hash = (address: string, token: number): string => {
  return md5(`magnet-${address}-${token}-stadium`).substring(4, 10);
};

const checkValidity = (address: string, token: number, _hash: string) => {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return false;
  }
  return hash(address, token) === _hash;
};

export const app = express();
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

app.use(cors());

app.use((req: express.Request, res: express.Response, next: Function) => {
  if (!env.inTest) console.log('ACCESS LOG', req.url);
  next();
});

const reserveMap: Map<number, number> = new Map();

let microCache = [];
let microCacheTimestamp = 0;
const getReserved = () => {
  const result = [];
  const now = new Date().getTime();
  if (now - microCacheTimestamp < 100 /* ms */) return microCache;
  reserveMap.forEach((value, key, map) => {
    if (value > now) {
      result.push(key);
    } else {
      map.delete(key);
    }
  });
  microCache = result;
  microCacheTimestamp = now;
  return result;
}

app.get('/reserved', (req: express.Request, res: express.Response) => {
  res.json(getReserved());
});

app.put('/reserve', (req: express.Request, res: express.Response) => {
  const { token, wallet, hash, test } = req.body;
  if (checkValidity(wallet, +token, hash)) {
    const ttl = test ? 0.5 : 5 * 60; // 0.5 seconds for test; 5 minutes to rule them all
    reserveMap.set(+token, new Date().getTime() + ttl * 1000);
    microCacheTimestamp = 0;
  }
  res.json(getReserved());
});

app.delete('/free', (req: express.Request, res: express.Response) => {
  const { token, wallet, hash } = req.body;
  if (checkValidity(wallet, +token, hash)) {
    reserveMap.delete(+token);
    microCacheTimestamp = 0;
  }
  res.json(getReserved());
});

app.use((req: express.Request, res: express.Response, next: Function) => {
  res.status(404).end();
});

const server = app.listen(parseInt(process.env.PORT ?? '8000'), '127.0.0.1', () => {
  console.log('server started', process.env.PORT ?? '8000');
});

export const closeServer = () => server.close();
