/**
 * This example illustrates how applications
 * may be mounted without a pathname prefix
 * if you simply wish to combine behaviours.
 */

const mount = require('..');
const Koa = require('koa');

// GET /hello

const a = new Koa();

a.use((ctx, next) => {
	return next().then(() => {
		if ('/hello' === ctx.path) {
			ctx.body = 'Hello';
		}
	});
});

// GET /world

const b = new Koa();


b.use((ctx, next) => {
	return next().then(() => {
		if ('/world' === ctx.path) {
			ctx.body = 'World';
		}
	});
});



const app = new Koa();

app.use(mount(a));
app.use(mount(b));

app.listen(3000);
console.log('listening on port 3000');