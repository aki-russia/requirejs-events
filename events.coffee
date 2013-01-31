# requirejs-events v 0.0.1
# (c) 2012 Dmitriy Kharchenko
# Freely distributable under the MIT license.
#
# Simple events bus inside require.js module.

define ['utils/async', 'underscore', 'utils/guid'], (async, _, guid) ->
  async_event_bus = async()

  Bus = (@name) ->
    @_handlers = []
    @_last_params = null
    @

  Bus:: =
    _handlers_caller: (handlers) ->
      handlers = (handlers or @_handlers).concat []
      event_data = 
        name: @name
      args = if _.isArray @_last_params then @_last_params else [@_last_params]
      args.push event_data

      async_event_bus.pick(handlers).each (handler, index) ->
        handler.apply handler.context, args

    once: (handler, context, options) ->
      once_handler = =>
        handler.apply(@, arguments)
        @off once_handler
      @on once_handler, context, options

    on: (handler, context, options) ->
      handler.context = context
      handler.options = options
      handler.id = guid()
      @_handlers.push handler
      if options? and options.recall? and @_last_params?
        @_handlers_caller [handler]
      @

    off: (handler) ->
      for next_handler, handler_index in @_handlers
        if next_handler.id is handler.id
          @_handlers.splice handler_index, 1
          return @

    fire: (data) ->
      @_last_params = data
      @_handlers_caller()

  Events = (@name) ->
     @list = {}
     @

  Events:: =
    list: {}

    init: (object) ->
      bus = @sprout()
      object.fire = -> return bus.fire.apply bus, arguments
      object.once = -> return bus.once.apply bus, arguments
      object.on = ->   return bus.on.apply bus, arguments
      object.off = ->  return bus.off.apply bus, arguments

    sprout: (name) ->
      instance = @[name] or new Events name
      if name?
        @[name] = instance
      instance

    create: (name) ->
      if not name
        return new Bus
        
      if @list[name]?
        return @list[name]

      @list[name] = new Bus name


    once: (name, handler, context, options) ->
      @create(name).once handler, context, options

    on: (name, handler, context, options) ->
      events_names = name.split /\s*,\s*/
      for event_name in events_names
        @create(event_name).on handler, context, options

    off: (name, handler) ->
      @create(name).off handler

    fire: (name, attributes) ->
      @create(name).fire attributes

  events = new Events

  events
