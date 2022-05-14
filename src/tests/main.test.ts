import * as request from 'supertest';
import { app, closeServer, hash, env } from '../index';
import { expect } from 'chai';

const addresses = [
  '0x0D625029E21540aBdfAFa3BFC6FD44fB4e0A66d0',
  '0x89Ea5CCF7acC1c0319DD16dEe4349879eB6D0965',
  '0x7d38B5C5639335605FFD0CbD1835a8dA06229454',
  '0xcA6B850102A2f95CE7088edA2F62469e1D90fdE8',
  '0x0bC0cdFDd36fc411C83221A348230Da5D3DfA89e',
  '0x42813a05ec9c7e17aF2d1499F9B0a591B7619aBF',
  '0x0D112a449D23961d03E906572D8ce861C441D6c3',
  '0x8600f6e9cd3406f8173749a582bc993e74ed7be8',
];


describe('Reserve tests', () => {
  before(() => {
    env.inTest = true;
  });

  after(() => {
    closeServer();
  });

  it('checking default reserve', async () => {
    const response = await request(app)
      .get('/reserved')
      .set('Accept', 'application/json');
    
    expect(response.headers["content-type"]).match(/json/);
    expect(response.status).equal(200);
    expect(response.body).eql([]);
  });

  it('freeing unexistent reserve', async () => {
    const response = await request(app)
      .delete('/free')
      .send({ token: 220, wallet: addresses[0], hash: hash(addresses[0], 220, false) })
      .set('Accept', 'application/json');
    
    expect(response.headers["content-type"]).match(/json/);
    expect(response.status).equal(200);
    expect(response.body).eql([]);
  });

  it('checking reserve', async () => {
    const response = await request(app)
      .get('/is-reserved/?token=555')
      .set('Accept', 'application/json');
    
    expect(response.headers["content-type"]).match(/json/);
    expect(response.status).equal(200);
    expect(response.body).eql([false]);
  });

  it('reserve token', async () => {
    const response = await request(app)
      .put('/reserve')
      .send({ token: 555, test: true, wallet: addresses[0], hash: hash(addresses[0], 555, false) })
      .set('Accept', 'application/json');
    
    expect(response.headers["content-type"]).match(/json/);
    expect(response.status).equal(200);
    expect(response.body).eql([555]);
  });

  it('checking reserve', async () => {
    const response = await request(app)
      .get('/is-reserved/?token=555')
      .set('Accept', 'application/json');
    
    expect(response.headers["content-type"]).match(/json/);
    expect(response.status).equal(200);
    expect(response.body).eql([true]);
  });

  it('checking reserve', async () => {
    const response = await request(app)
      .get('/reserved')
      .set('Accept', 'application/json');
    
    expect(response.headers["content-type"]).match(/json/);
    expect(response.status).equal(200);
    expect(response.body).eql([555]);
  });

  it('checking expiration', async () => {
    await new Promise(rs => setTimeout(rs, 600)); // delay to make token expired
    const response = await request(app)
      .get('/reserved')
      .set('Accept', 'application/json');
    
    expect(response.headers["content-type"]).match(/json/);
    expect(response.status).equal(200);
    expect(response.body).eql([]);
  });

  it('reserve token', async () => {
    const response = await request(app)
      .put('/reserve')
      .send({ token: 333, test: true, wallet: addresses[0], hash: hash(addresses[0], 333, false) })
      .set('Accept', 'application/json');
    
    expect(response.headers["content-type"]).match(/json/);
    expect(response.status).equal(200);
    expect(response.body).eql([333]);
  });

  it('reserve another token', async () => {
    const response = await request(app)
      .put('/reserve')
      .send({ token: 444, test: true, wallet: addresses[0], hash: hash(addresses[0], 444, false) })
      .set('Accept', 'application/json');
    
    expect(response.headers["content-type"]).match(/json/);
    expect(response.status).equal(200);
    expect(response.body).eql([333, 444]);
  });

  it('checking reserve', async () => {
    const response = await request(app)
      .get('/reserved')
      .set('Accept', 'application/json');
    
    expect(response.headers["content-type"]).match(/json/);
    expect(response.status).equal(200);
    expect(response.body).eql([333, 444]);
  });

  it('free token', async () => {
    const response = await request(app)
      .delete('/free')
      .send({ token: 333, wallet: addresses[0], hash: hash(addresses[0], 333, false) })
      .set('Accept', 'application/json');
    
    expect(response.headers["content-type"]).match(/json/);
    expect(response.status).equal(200);
    expect(response.body).eql([444]);
  });

  it('checking reserve', async () => {
    const response = await request(app)
      .get('/reserved')
      .set('Accept', 'application/json');
    
    expect(response.headers["content-type"]).match(/json/);
    expect(response.status).equal(200);
    expect(response.body).eql([444]);
  });
});
