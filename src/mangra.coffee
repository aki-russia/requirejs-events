# requirejs-events v 0.0.1
# (c) 2012 Dmitriy Kharchenko
# https://github.com/aki-russia/requirejs-events
# Freely distributable under the MIT license.

Mangra = new () ->
  batch_thread = batch()

  Bus = (@name) ->
    @_handlers = []
    @_last_params = null
    @

  Bus:: =
    _handlers_caller: (handlers) ->
      handlers = (handlers or @_handlers).concat []
      event_data = 
        name: @name

      args = if toString.call(@_last_params) is '[object Array]' then @_last_params else [@_last_params]
      args.push event_data

      batch_thread.use(handlers).each (handler, index) ->
        handler.apply handler.context, args

    on: (handler, context, options) ->
      handler.context = context
      handler.options = options
      handler.id = ui_guid_generator()
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
      events_bus = @sprout()
      object.fire = -> return events_bus.fire.apply bus, arguments
      object.once = -> return events_bus.once.apply bus, arguments
      object.on = ->   return events_bus.on.apply bus, arguments
      object.off = ->  return events_bus.off.apply bus, arguments

    sprout: (name) ->
      name = name or ui_guid_generator()
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
      events_bus = @
      once_handler = ->
        handler.apply(@, arguments)
        events_bus.off once_handler

      @create(name).on once_handler, context, options

      () ->
        events_bus.off name, once_handler

    on: (name, handler, context, options) ->
      events_names = name.split /\s*,\s*/
      for event_name in events_names
        @create(event_name).on handler, context, options
      () =>
        @off name, handler

    off: (name, handler) ->
      @create(name).off handler

    fire: (name, attributes) ->
      @create(name).fire attributes

  new Events
