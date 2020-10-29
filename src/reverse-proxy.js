// Dependencies
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const server = express();


server.use(createProxyMiddleware('/api', { target: 'http://localhost:3000', pathRewrite: {'^/api' : ''} }));
server.use(createProxyMiddleware("/app", { target: "http://localhost:8080", pathRewrite: {'^/app' : ''} }));

server.listen(9001);
