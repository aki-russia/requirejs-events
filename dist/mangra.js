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
    fire: function(name, attributes) {
      return this.create(name).fire(attributes);
    }
  };
  return new Scape("mangra");
};
