/**
 * This example illustrates the typical
 * pattern of mounting an application
 * to a given pathname prefix.
 *
 * GET /hello
 * GET /world
 */

const mount = require('../');
const Koa = require('Koa');

// hello

const a = new Koa();

a.use((ctx, next) => {
	return next().then(() => {
		ctx.body = 'Hello';
	});
});

// world

const b = new Koa();

b.use((ctx, next) => {
	return next().then(() => {
		ctx.body = 'World';
	});
});

// app

const app = new Koa();

app.use(mount('/hello', a));
app.use(mount('/world', b));

app.listen(3000);
console.log('listening on port 3000');