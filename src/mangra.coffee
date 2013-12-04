# mangra v 0.0.1
# (c) 2012 Dmitriy Kharchenko
# https://github.com/aki-russia/mangra
# Freely distributable under the MIT license.

mangra = new () ->
  batch_thread = batch()

  Bump = (@name) ->
    @_handlers = []
    @_last_params = null
    @

  Bump:: =
    _handlers_caller: (handlers) ->
      handlers = (handlers or @_handlers).concat []
      event_data = 
        name: @name

      args = if toString.call(@_last_params) is '[object Array]' then @_last_params else [@_last_params]
      args.push event_data

      batch_thread.use(handlers).each (handler, index) ->
        handler.apply handler.context, args

    on: (handler, context, options) ->
      handler.context = context or handler.context
      handler.options = options or handler.options
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


  Scape = (@name) ->
     @list = {}
     @

  Scape:: =

    #### Scape::list
    # List of Scape in current bus
    list: {}

    #### Scape::init(object)
    # Initialize provided object with new Scape bus interface.

    init: (object) ->
      events_bus = @sprout()
      interface_methods = ["on", "off", "once", "fire"]

      object.fire = -> return events_bus.fire.apply events_bus, arguments
      object.once = -> return events_bus.once.apply events_bus, arguments
      object.on = ->   return events_bus.on.apply events_bus, arguments
      object.off = ->  return events_bus.off.apply events_bus, arguments

      object

    #### Scape::sprout([name])
    # Allows you to sprout new event busses existing one,
    # useful when you need to incapsulate some Scape inside particular module.
    # New bus discoverable by the name provided. If name isn't provided, then bus not be saved in parent, for memory sake.

    sprout: (name) ->
      instance = @[name] or new Scape name
      if name?
        @[name] = instance
      instance


    #### Scape::create([name])
    # Creates bus for particular event, if event's bus already exists — return it.

    create: (name) ->
      if not name
        return new Bump
        
      if @list[name]?
        return @list[name]

      @list[name] = new Bump name

    #### Scape::forget([name])
    # Removes previously created Bump instance

    forget: (name) ->
      return if not name
      delete @list[name]
      @

    #### Scape::once(name, handler, [context], [options])
    # Binds handler to event and calls it only once. Returns function that will unbind handler from event.

    once: (name, handler, context, options) ->
      events_bus = @

      once_handler = =>
        handler.apply(@, arguments)
        @off name, once_handler

      @create(name).on once_handler, context, options

      () ->
        events_bus.off name, once_handler

    #### Scape::on(name, handler, [context], [options])
    # Binds handler to event. Returns function that will unbind handler from event.

    on: (name, handler, context, options) ->
      events_names = name.split /\s*,\s*/
      for event_name in events_names
        @create(event_name).on handler, context, options
      () =>
        @off name, handler

    #### Scape::off(name, handler, [context], [options])
    # Unbinds handler from event. Returns function that will bind handler back to event.

    off: (name, handler) ->
      if @list[name]
        @list[name].off handler

      () =>
        @on name, handler

    #### Scape::fire(name, handler, [context], [options])
    # Gets event's bus by name and fires it. If there is no such event's bus — creates it, 
    # this is needed for handlers recall feature 

    fire: (name, attributes) ->
      @create(name).fire attributes

  new Scape
