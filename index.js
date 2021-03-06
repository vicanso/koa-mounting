'use strict';

const util = require('util');
const assert = require('assert');
const compose = require('koa-compose');
const debug = require('debug')('koa-mounting');

/**
 * [mount description]
 * @param  {[type]} prefix [description]
 * @param  {[type]} app    [description]
 * @return {[type]}        [description]
 */
function mount(_prefix, _app) {
  const app = _app || _prefix;
  const prefix = util.isString(_prefix) ? _prefix : '/';

  assert(prefix[0] === '/', 'mount path must begin with "/"');

  const downstream = app.middleware ? compose(app.middleware) : app;

  if (prefix === '/') {
    return downstream;
  }

  const trailingSlash = prefix.slice(-1) === '/';
  const name = app.name || 'unnamed';

  debug('mount %s %s', prefix, name);


  /**
   * [match description]
   * @param  {[type]} path [description]
   * @return {[type]}         [description]
   */
  function match(path) {
    if (path.indexOf(prefix) !== 0) {
      return false;
    }

    const newPath = path.replace(prefix, '') || '/';
    if (trailingSlash) {
      return newPath;
    }

    if (newPath[0] !== '/') {
      return false;
    }

    return newPath;
  }

  return (ctx, next) => {
    const prev = ctx.path;
    const newPath = match(prev);
    debug('mount %s %s -> %s', prefix, name, newPath);

    if (!newPath) {
      return next();
    }
    /* eslint no-param-reassign:0 */
    ctx.mountPath = prefix;
    ctx.path = newPath;
    debug('enter %s -> %s', prev, ctx.path);
    const goNext = () => {
      debug('leave %s -> %s', ctx.path, prev);
      ctx.path = prev;
      return next();
    };
    if (app.middleware) {
      return downstream(ctx).then(goNext);
    }
    return downstream(ctx, goNext);
  };
}

module.exports = mount;
