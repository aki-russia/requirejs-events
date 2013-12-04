var mangra;

mangra = new function() {
  var Bump, Scape, batch_thread;
  batch_thread = batch();
  Bump = function(name) {
    this.name = name;
    this._handlers = [];
    this._last_params = null;
    return this;
  };
  Bump.prototype = {
    _handlers_caller: function(handlers) {
      var args, event_data;
      handlers = (handlers || this._handlers).concat([]);
      event_data = {
        name: this.name
      };
      args = toString.call(this._last_params) === '[object Array]' ? this._last_params : [this._last_params];
      args.push(event_data);
      return batch_thread.use(handlers).each(function(handler, index) {
        return handler.apply(handler.context, args);
      });
    },
    on: function(handler, context, options) {
      handler.context = context || handler.context;
      handler.options = options || handler.options;
      handler.id = ui_guid_generator();
      this._handlers.push(handler);
      if ((options != null) && (options.recall != null) && (this._last_params != null)) {
        this._handlers_caller([handler]);
      }
      return this;
    },
    off: function(handler) {
      var handler_index, next_handler, _i, _len, _ref;
      _ref = this._handlers;
      for (handler_index = _i = 0, _len = _ref.length; _i < _len; handler_index = ++_i) {
        next_handler = _ref[handler_index];
        if (next_handler.id === handler.id) {
          this._handlers.splice(handler_index, 1);
          return this;
        }
      }
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
      var events_bus, interface_methods;
      events_bus = this.sprout();
      interface_methods = ["on", "off", "once", "fire"];
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
      instance = this[name] || new Scape(name);
      if (name != null) {
        this[name] = instance;
      }
      return instance;
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
      var events_bus, once_handler,
        _this = this;
      events_bus = this;
      once_handler = function() {
        handler.apply(_this, arguments);
        return _this.off(name, once_handler);
      };
      this.create(name).on(once_handler, context, options);
      return function() {
        return events_bus.off(name, once_handler);
      };
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
        return _this.off(name, handler);
      };
    },
    off: function(name, handler) {
      var _this = this;
      if (this.list[name]) {
        this.list[name].off(handler);
      }
      return function() {
        return _this.on(name, handler);
      };
    },
    fire: function(name, attributes) {
      return this.create(name).fire(attributes);
    }
  };
  return new Scape;
};
