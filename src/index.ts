import * as express from 'express';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import * as md5 from 'md5';

export const env = {
  inTest: false,
}

export const hash = (address: string, token: number, mumbai: boolean): string => {
  if (mumbai) {
    return md5(`glass-${address}-${token}-trident`).substring(4, 10);
  }
  return md5(`magnet-${address}-${token}-stadium`).substring(4, 10);
};

const checkValidity = (address: string, token: number, _hash: string, mumbai: boolean) => {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return false;
  }
  if (hash(address, token, mumbai) !== _hash) {
    console.log('WRONG HASH', hash(address, token, mumbai), _hash);
  }
  
  return hash(address, token, mumbai) === _hash;
};

export const app = express();
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

app.use(cors());

app.use((req: express.Request, _: express.Response, next: Function) => {
  if (!env.inTest) console.log('ACCESS LOG', req.url);
  next();
});

const reserveMapPolygon: Map<number, number> = new Map();
const reserveMapMumbai: Map<number, number> = new Map();

let microCache = [];
let microCacheTimestamp = 0;
const getReserved = (mumbai: boolean) => {
  const reserveMap = mumbai ? reserveMapMumbai : reserveMapPolygon;
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

app.get('/reserved', (_: express.Request, res: express.Response) => {
  res.json(getReserved(false));
});

app.get('/reserved-mumbai', (_: express.Request, res: express.Response) => {
  res.json(getReserved(true));
});

app.get('/is-reserved', (req: express.Request, res: express.Response) => {
  const { token, mumbai } = req.query;
  const reserveMap = mumbai ? reserveMapMumbai : reserveMapPolygon;
  const now = new Date().getTime();
  const reserved = reserveMap.has(+token) && reserveMap.get(+token) > now;
  res.json([reserved]);
});

app.put('/reserve', (req: express.Request, res: express.Response) => {
  // TODO check reservation
  const { token, wallet, hash, test, mumbai } = req.body;
  const reserveMap = mumbai ? reserveMapMumbai : reserveMapPolygon;
  if (checkValidity(wallet, +token, hash, Boolean(mumbai))) {
    const ttl = test ? 0.5 : 5 * 60; // 0.5 seconds for test; 5 minutes to rule them all
    reserveMap.set(+token, new Date().getTime() + ttl * 1000);
    microCacheTimestamp = 0;
  }
  res.json(getReserved(Boolean(mumbai)));
});

app.delete('/free', (req: express.Request, res: express.Response) => {
  const { token, wallet, hash, mumbai } = req.body;
  const reserveMap = mumbai ? reserveMapMumbai : reserveMapPolygon;
  if (checkValidity(wallet, +token, hash, Boolean(mumbai))) {
    reserveMap.delete(+token);
    microCacheTimestamp = 0;
  }
  res.json(getReserved(Boolean(mumbai)));
});

app.use((_: express.Request, res: express.Response) => {
  res.status(404).end();
});

const server = app.listen(parseInt(process.env.PORT ?? '8000'), '127.0.0.1', () => {
  console.log('server started', process.env.PORT ?? '8000');
});

export const closeServer = () => server.close();
