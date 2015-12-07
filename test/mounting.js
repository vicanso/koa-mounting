'use strict';
const Koa = require('koa');
const mounting = require('..');
const request = require('supertest');
const assert = require('assert');

describe('mount(app)', function() {
	it('should mount at /', function(done) {
		const a = new Koa();
		const b = new Koa();

		a.use((ctx, next) => {
			return next().then(() => {
				if (ctx.path === '/hello') {
					ctx.body = 'Hello';
				}
			});
		});


		b.use((ctx, next) => {
			return next().then(() => {
				if (ctx.path === '/world') {
					ctx.body = 'World';
				}
			});
		});

		const app = new Koa();

		app.use(mounting(a));
		app.use(mounting(b));


		request(app.listen())
			.get('/')
			.expect(404)
			.end(function(err) {
				if (err) {
					return done(err);
				}

				request(app.listen())
					.get('/hello')
					.expect('Hello')
					.end(function(err) {
						if (err) return done(err);

						request(app.listen())
							.get('/world')
							.expect('World', done);
					});
			});
	});
});



describe('mount(path, app)', function() {
	it('should mounting the app at the given path', function(done) {
		const a = new Koa();
		const b = new Koa();
		const app = new Koa();

		a.use((ctx, next) => {
			return next().then(() => {
				ctx.body = 'Hello';
			});
		});

		b.use((ctx, next) => {
			return next().then(() => {
				ctx.body = 'World';
			});
		});

		app.use(mounting('/hello', a));
		app.use(mounting('/world', b));

		request(app.listen())
			.get('/hello')
			.expect('Hello')
			.end(function(err) {
				if (err) return done(err);

				request(app.listen())
					.get('/world')
					.expect('World')
					.end(function(err) {
						if (err) return done(err);

						request(app.listen())
							.get('/')
							.expect(404, done);
					});
			});
	});

	it('should cascade properly', function(done) {

		const app = new Koa();
		const a = new Koa();
		const b = new Koa();
		const c = new Koa();

		a.use((ctx, next) => {
			return next().then(function() {
				if (!ctx.body) {
					ctx.body = 'foo';
				}
			});
		});

		b.use((ctx, next) => {
			return next().then(function() {
				if (!ctx.body) {
					ctx.body = 'bar';
				}
			});
		});

		c.use((ctx, next) => {
			return next().then(function() {
				if (!ctx.body) {
					ctx.body = 'baz';
				}
			});
		});


		app.use(mounting('/foo', a));
		a.use(mounting('/bar', b));
		b.use(mounting('/baz', c));

		request(app.listen())
			.get('/')
			.expect(404)
			.end(function(err) {
				if (err) {
					return done(err);
				}

				request(app.listen())
					.get('/foo')
					.expect('foo')
					.end(function(err) {
						if (err) {
							return done(err);
						}

						request(app.listen())
							.get('/foo/bar')
							.expect('bar')
							.end(function(err) {
								if (err) {
									return done(err);
								}

								request(app.listen())
									.get('/foo/bar/baz')
									.expect('baz', done);
							});
					});
			});
	});

	it('should restore prefix for mounted apps', function(done) {
		const app = new Koa();
		const a = new Koa();
		const b = new Koa();
		const c = new Koa();

		a.use((ctx, next) => {
			ctx.body = 'foo';
			return next();
		});

		b.use((ctx, next) => {
			ctx.body = 'bar';
			return next();
		});

		c.use((ctx, next) => {
			ctx.body = 'baz';
			return next();
		});


		app.use(mounting('/foo', a));
		app.use(mounting('/foo/bar', b));
		app.use(mounting('/foo/bar/baz', c));

		request(app.listen())
			.get('/foo/bar')
			.expect('bar', done);
	});

	it('should have the correct path', function(done) {
		const app = new Koa();
		const a = new Koa();

		a.use((ctx, next) => {
			assert.equal(ctx.path, '/');
			next().then(() => {
				assert.equal(ctx.path, '/');
			});
		});

		app.use((ctx, next) => {
			assert.equal(ctx.path, '/foo');
			next().then(() => {
				assert.equal(ctx.path, '/foo');
			});
		});

		app.use(mounting('/foo', a));

		request(app.listen())
			.get('/foo')
			.end(done);
	});

	describe('when middleware is passed', function() {
		it('should mount', function(done) {

			const hello = (ctx, next) => {
				next().then(() => {
					ctx.body = 'Hello';
				});
			};

			const world = (ctx, next) => {
				next().then(() => {
					ctx.body = 'World';
				});
			};

			const app = new Koa();

			app.use(mounting('/hello', hello));
			app.use(mounting('/world', world));


			request(app.listen())
				.get('/hello')
				.expect('Hello')
				.end(function(err) {
					if (err) {
						return done(err);
					}
					request(app.listen())
						.get('/world')
						.expect('World', done);
				});
		});
	});
});

describe('mount(/prefix)', function() {

	const app = new Koa();

	app.use(mounting('/prefix', (ctx, next) => {
		ctx.status = 204;
	}));

	const server = app.listen();

	it('should not match /kljasdf', function(done) {
		request(server)
			.get('/kljasdf')
			.expect(404, done);
	});


	it('should not match /prefixlaksjdf', function(done) {
		request(server)
			.get('/prefixlaksjdf')
			.expect(404, done);
	});



	it('should match /prefix', function(done) {
		request(server)
			.get('/prefix')
			.expect(204, done);
	});

	it('should match /prefix/', function(done) {
		request(server)
			.get('/prefix/')
			.expect(204, done);
	});

	it('should match /prefix/lkjasdf', function(done) {
		request(server)
			.get('/prefix/lkjasdf')
			.expect(204, done);
	});
});


describe('mount(/prefix/)', function() {


	const app = new Koa();

	app.use(mounting('/prefix/', (ctx, next) => {
		ctx.status = 204;
	}));

	const server = app.listen();

	it('should not match /kljasdf', function(done) {
		request(server)
			.get('/kljasdf')
			.expect(404, done);
	});


	it('should not match /prefixlaksjdf', function(done) {
		request(server)
			.get('/prefixlaksjdf')
			.expect(404, done);
	});



	it('should match /prefix', function(done) {
		request(server)
			.get('/prefix')
			.expect(404, done);
	});

	it('should match /prefix/', function(done) {
		request(server)
			.get('/prefix/')
			.expect(204, done);
	});

	it('should match /prefix/lkjasdf', function(done) {
		request(server)
			.get('/prefix/lkjasdf')
			.expect(204, done);
	});
});