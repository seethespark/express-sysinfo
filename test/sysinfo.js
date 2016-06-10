'use strict';
/**
** Test
**
****/

const express = require('express');
const request = require('supertest');
const sysInfo = require('../sysInfo');
const test = require('tape');
const htmlValidator = require('html-validator')

const app = express();

var sysInfoOptions = {};

test('system info for Express based Node apps', function (assert) {
  let app = express();
  assert.plan(3);
  assert.ok(app, 'express loaded');
  assert.ok(sysInfo, 'the library loaded');
  assert.equals(typeof app, 'function', 'function returned');
  assert.end();
});


test('run the application without parameters', function (assert) {
  let app = express();
  app.use(sysInfo());
  assert.plan(4);
  request(app)
    .get('/sysinfo')
    .expect(200)
    .expect('Content-Type', /html/)
    .end(function (err, res) {
      assert.error(err, 'No response error');
      var htmlValidatorptions = {
        format: 'text',
        data: res.text
      }

      assert.equal((res.text.indexOf('<tr>') > 0), true, 'Contains table rows');
      assert.equal((res.text.indexOf('<td>') > 0), true, 'Contains table cells');
      htmlValidator(htmlValidatorptions, function (error, data) {
        if (error) {
          throw error
        }
        assert.equal(data, 'The document validates according to the specified schema(s).\n', 'The document validates as HTML.');
        assert.end();
      });
    });
});

test('run the application without JSON parameter.', function (assert) {
  let app = express();
  app.use(sysInfo({returnFormat: 'JSON'}));
  assert.plan(2);
  request(app)
    .get('/sysinfo')
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function (err, res) {
      assert.error(err, 'No response error');
      try {
        JSON.parse(res.text);
        assert.error(err, 'No JSON error');
      } catch (err) {
        assert.fail(err.message);
      }
      assert.end();
    });
});

test('run the application with incorrect URL', function (assert) {
  let app = express();
  app.use(sysInfo());
  assert.plan(1);
  request(app)
    .get('/randomurl')
    .expect(404)
    .expect('Content-Type', /html/)
    .end(function (err, res) {
      assert.error(err, 'No response error');
      
      assert.end();
    });
});

test('run the application with different URL.', function (assert) {
  let app = express();
  app.use(sysInfo({viewerUrl: '/mooo'}));
  assert.plan(1);
  request(app)
    .get('/mooo')
    .expect(200)
    .expect('Content-Type', /html/)
    .end(function (err, res) {
      assert.error(err, 'No response error');

      assert.end();
    });
});

test('run the application without countonly: true parameter.', function (assert) {
  let app = express();
  app.use(sysInfo({countOnly: true}));
  assert.plan(1);
  request(app)
    .get('/sysinfo')
    .expect(404)
    .expect('Content-Type', /html/)
    .end(function (err, res) {
      assert.error(err, 'No response error');
      assert.end();
    });
});

test('END', function (assert) {
  assert.end();
  process.exit();    
});