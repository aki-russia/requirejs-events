window.batch = new function() {
  var BatchBalancer, IterationFlow, Stream, balancer_defaults, get_keys, is_array, is_function, is_object;
  is_function = function(func) {
    return typeof func === 'function';
  };
  is_array = Array.isArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };
  is_object = function(obj) {
    return obj === Object(obj);
  };
  get_keys = Object.keys || function(obj) {
    var key, keys, _i, _len;
    if (!is_object(obj)) {
      throw new TypeError('Invalid object');
    }
    keys = [];
    for (_i = 0, _len = obj.length; _i < _len; _i++) {
      key = obj[_i];
      if (obj.hasOwnProperty(key)) {
        keys[keys.length] = key;
      }
    }
    return keys;
  };
  balancer_defaults = {
    stack_limit: 5000,
    block_limit: 50
  };
  BatchBalancer = function(limit, stack_limit) {
    this.stack_depth = 0;
    this._stack_limit = stack_limit || balancer_defaults.stack_limit;
    this._start_time = +new Date();
    return this._limit = limit || balancer_defaults.block_limit;
  };
  BatchBalancer.prototype = {
    next: function(callback) {
      var call_date, is_block_limit_exceed, is_stack_overflow;
      call_date = +new Date();
      is_block_limit_exceed = this._limit < (call_date - this._start_time);
      is_stack_overflow = this._stack_limit <= this.stack_depth;
      if (is_block_limit_exceed || is_stack_overflow) {
        this._start_time = call_date;
        this.stack_depth = 0;
        return setTimeout(callback, 0);
      } else {
        this.stack_depth++;
        return callback();
      }
    }
  };
  IterationFlow = function(iterator, balancer) {
    this.iterator = iterator;
    this.balancer = balancer;
    this.state = {};
    this._handlers = [];
    if (!this.balancer) {
      this.balancer = new BatchBalancer();
    }
    return this;
  };
  IterationFlow.prototype = {
    _call_complete_handlers: function() {
      var handler, handler_result,
        _this = this;
      if (0 < this._handlers.length) {
        handler = this._handlers.shift();
        handler_result = handler(this.result, this.state);
        if (handler_result !== void 0) {
          this.result = handler_result;
        }
        return this.balancer.next(function() {
          return _this._call_complete_handlers();
        });
      }
    },
    start: function(data) {
      var keys,
        _this = this;
      if (this._iteration) {
        if (!this.state.is_complete) {
          return this.balancer.next(this._iteration);
        } else {
          return this._call_complete_handlers();
        }
      } else {
        this.data = data;
        this.is_array_data = is_array(this.data);
        keys = (this.is_data_array || is_object(this.data) ? get_keys(this.data) : []);
        if (!is_function(this.iterator)) {
          this._iteration = function() {
            _this.state.is_complete = true;
            _this.result = _this.data;
            return _this._call_complete_handlers();
          };
        } else {
          this._iteration = function() {
            var next_index, result;
            if (_this.state.is_wait) {
              return false;
            }
            if (keys.length !== 0 && !_this.state.is_complete) {
              next_index = keys.shift();
              if (_this.is_array_data) {
                next_index = +next_index;
              }
              result = _this.iterator(_this.data[next_index], next_index, _this);
              if (result !== void 0) {
                if (!_this.result) {
                  _this.result = (_this.is_array_data ? [] : {});
                }
                _this.result[next_index] = result;
              }
              return _this.balancer.next(_this._iteration);
            } else {
              _this.state.is_complete = true;
              return _this._call_complete_handlers();
            }
          };
        }
        return this.balancer.next(this._iteration);
      }
    },
    stop: function() {
      return this.state.is_complete = true;
    },
    pause: function() {
      return this.state.is_wait = true;
    },
    resume: function() {
      this.state.is_wait = false;
      return this.start();
    },
    on_complete: function(handler) {
      if (is_function(handler)) {
        this._handlers.push(handler);
        if (this.state.is_complete) {
          return this._call_complete_handlers();
        }
      }
    }
  };
  Stream = function(data) {
    this._last_flow = new IterationFlow();
    this.current_flow = this._last_flow;
    this._last_flow.start(data || []);
    this._balancer = new BatchBalancer;
    return this;
  };
  Stream.prototype = {
    _push_flow: function(data) {
      var new_flow,
        _this = this;
      new_flow = new IterationFlow(data.iterator, this._balancer);
      new_flow.on_complete(data.complete);
      this._last_flow.on_complete(function(data, state) {
        _this.current_flow = new_flow;
        return new_flow.start(data);
      });
      this._last_flow = new_flow;
      return this;
    },
    use: function(data) {
      this._push_flow({
        complete: function() {
          return data;
        }
      });
      return this;
    },
    each: function(iterator) {
      var _this = this;
      this._push_flow({
        iterator: function(value, index, flow) {
          var result;
          result = iterator(value, index, flow);
          if (result === false) {
            return flow.stop();
          }
        }
      });
      return this;
    },
    map: function(transformator) {
      return this._push_flow({
        iterator: transformator
      });
    },
    reduce: function(iterator, summary_initial) {
      var summary;
      summary = summary_initial;
      this._push_flow({
        iterator: function(value, index, flow) {
          var result;
          result = iterator(value, index, summary, flow);
          if (result !== void 0) {
            return summary = result;
          }
        },
        complete: function(data, state) {
          return summary;
        }
      });
      return this;
    },
    select: function(iterator) {
      var selected_values;
      selected_values = [];
      this._push_flow({
        iterator: function(value, index, flow) {
          if (iterator(value, index, flow) === true) {
            return selected_values.push(value);
          }
        },
        complete: function(data, state) {
          return selected_values;
        }
      });
      return this;
    },
    find: function(iterator) {
      var found;
      found = void 0;
      this._push_flow({
        iterator: function(value, index, flow) {
          if (iterator(value, index, flow) === true) {
            found = value;
            return flow.stop();
          }
        },
        complete: function(state) {
          return found;
        }
      });
      return this;
    },
    next: function(handler) {
      this._last_flow.on_complete(function(result, state) {
        handler(result);
        return void 0;
      });
      return this;
    }
  };
  return function(data) {
    return new Stream(data);
  };
};

var ui_guid_generator;

ui_guid_generator = new function() {
  var S4;
  S4 = function() {
    return Math.floor(Math.random() * 0x10000).toString(16);
  };
  return function() {
    return S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4();
  };
};

var mangra;

mangra = new function() {
  var Bump, Scape, batch_thread;
  batch_thread = batch();
  Bump = function(name) {
    this.name = name;
    this._id = ui_guid_generator();
    this._handlers = [];
    this._last_params = null;
    return this;
  };
  Bump.prototype = {
    _handlers_caller: function(handlers) {
      var args, event_data,
        _this = this;
      handlers = (handlers || this._handlers).concat([]);
      event_data = {
        name: this.name
      };
      args = toString.call(this._last_params) === '[object Array]' ? this._last_params : [this._last_params];
      args.push(event_data);
      return batch_thread.use(handlers).each(function(handler, index) {
        var _ref;
        if (((_ref = handler.event_data) != null ? _ref[_this._id] : void 0) == null) {
          _this._handlers.splice(index, 1);
          return delete handler.event_data[_this._id];
        } else {
          return handler.apply(handler.event_data[_this._id].context, args);
        }
      });
    },
    on: function(handler, context, options) {
      handler.event_data = handler.event_data || {};
      handler.event_data[this._id] = handler.event_data[this._id] || {};
      handler.event_data[this._id].context = context || handler.event_data[this._id].context;
      handler.event_data[this._id].options = options || handler.event_data[this._id].options;
      handler.event_data.id = handler.event_data.id || ui_guid_generator();
      this._handlers.push(handler);
      if ((options != null) && (options.recall != null) && (this._last_params != null)) {
        this._handlers_caller([handler]);
      }
      return this;
    },
    off: function(handler) {
      if (handler.event_data && handler.event_data[this._id]) {
        delete handler.event_data[this._id];
      }
      return this;
    },
    fire: function(data) {
      this._last_params = data;
      return this._handlers_caller();
    }
  };
  Scape = function(name) {
    this.name = name;
    this.list = {};
    return this;
  };
  Scape.prototype = {
    list: {},
    init: function(object) {
      var events_bus;
      events_bus = this.sprout();
      object.fire = function() {
        return events_bus.fire.apply(events_bus, arguments);
      };
      object.once = function() {
        return events_bus.once.apply(events_bus, arguments);
      };
      object.on = function() {
        return events_bus.on.apply(events_bus, arguments);
      };
      object.off = function() {
        return events_bus.off.apply(events_bus, arguments);
      };
      return object;
    },
    sprout: function(name) {
      var instance;
      if (this[name]) {
        if (this[name] instanceof Scape) {
          return this[name];
        } else {
          return false;
        }
      } else {
        instance = new Scape(name);
        if (name) {
          this[name] = instance;
        }
        return instance;
      }
    },
    create: function(name) {
      if (!name) {
        return new Bump;
      }
      if (this.list[name] != null) {
        return this.list[name];
      }
      return this.list[name] = new Bump(name);
    },
    forget: function(name) {
      if (!name) {
        return;
      }
      delete this.list[name];
      return this;
    },
    once: function(name, handler, context, options) {
      var events_bus, off_handler,
        _this = this;
      events_bus = this;
      off_handler = function() {
        _this.off(name, handler);
        return _this.off(name, off_handler);
      };
      this.on(name, handler, context, options);
      this.on(name, off_handler);
      return off_handler;
    },
    on: function(name, handler, context, options) {
      var event_name, events_names, _i, _len,
        _this = this;
      events_names = name.split(/\s*,\s*/);
      for (_i = 0, _len = events_names.length; _i < _len; _i++) {
        event_name = events_names[_i];
        this.create(event_name).on(handler, context, options);
      }
      return function() {
        var _j, _len1, _results;
        _results = [];
        for (_j = 0, _len1 = events_names.length; _j < _len1; _j++) {
          event_name = events_names[_j];
          _results.push(_this.off(event_name, handler));
        }
        return _results;
      };
    },
    off: function(name, handler) {
      var _this = this;
      if (this.list[name]) {
        this.list[name].off(handler);
      }
      return function(context, options) {
        return _this.on(name, handler, context, options);
      };
    },
    wait: function(names, handler, context, options) {
      var events_data, events_names, happen_events, waiting_handler;
      events_names = names.split(/\s*,\s*/).sort();
      happen_events = [];
      events_data = {};
      waiting_handler = function() {
        var event_data;
        event_data = arguments[arguments.length - 1];
        if (events_data[event_data.name]) {
          events_data[event_data.name] = arguments;
          return;
        }
        events_data[event_data.name] = arguments;
        happen_events.push(event_data.name);
        if (happen_events.length === events_names.length) {
          if (happen_events.sort().join(' ') === events_names.join(' ')) {
            return handler.call(context, events_data);
          }
        }
      };
      return this.on(names, waiting_handler, context, options);
    },
    fire: function(name, attributes) {
      return this.create(name).fire(attributes);
    }
  };
  return new Scape("mangra");
};
