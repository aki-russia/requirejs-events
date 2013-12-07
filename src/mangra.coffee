# mangra v 0.0.1
# (c) 2012 Dmitriy Kharchenko
# https://github.com/aki-russia/mangra
# Freely distributable under the MIT license.

mangra = new () ->
  batch_thread = batch()

  Bump = (@name) ->
    @_id = ui_guid_generator()
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

      batch_thread.use(handlers).each (handler, index) =>
        if not handler.event_data?[@_id]?
          @_handlers.splice index, 1
          delete handler.event_data[@_id]
        else
          handler.apply handler.event_data[@_id].context, args

    on: (handler, context, options) ->
      handler.event_data = handler.event_data or {}
      handler.event_data[@_id] = handler.event_data[@_id] or {}
      handler.event_data[@_id].context = context or handler.event_data[@_id].context
      handler.event_data[@_id].options = options or handler.event_data[@_id].options
      
      handler.event_data.id = handler.event_data.id or ui_guid_generator()

      @_handlers.push handler
      if options? and options.recall? and @_last_params?
        @_handlers_caller [handler]
      @

    off: (handler) ->
      if handler.event_data and handler.event_data[@_id]
        delete handler.event_data[@_id]
      @

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
      if @[name]
        if @[name] instanceof Scape
          @[name]
        else 
          false
      else 
        instance = new Scape name
        if name
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

      off_handler = () =>
        @off name, handler
        @off name, off_handler

      @on name, handler, context, options
      @on name, off_handler

      off_handler

    #### Scape::on(name, handler, [context], [options])
    # Binds handler to event. Returns function that will unbind handler from event.

    on: (name, handler, context, options) ->
      events_names = name.split /\s*,\s*/
      for event_name in events_names
        @create(event_name).on handler, context, options
      () =>
        for event_name in events_names
          @off event_name, handler

    #### Scape::off(name, handler, [context], [options])
    # Unbinds handler from event. Returns function that will bind handler back to event.

    off: (name, handler) ->
      if @list[name]
        @list[name].off handler

      (context, options) =>
        @on name, handler, context, options

    #### Scape::wait(name, handler, [context], [options])
    # Binds handler to bunch of events and call it after all are fired.
    # In this case handler receives data from all events in hash by event name

    wait: (names, handler, context, options) ->
      events_names = names.split(/\s*,\s*/).sort()
      happen_events = []
      events_data = {}

      waiting_handler = () ->
        event_data = arguments[arguments.length - 1]

        if events_data[event_data.name]
          events_data[event_data.name] = arguments
          return
        
        events_data[event_data.name] = arguments
        happen_events.push event_data.name

        if happen_events.length is events_names.length
          if happen_events.sort().join(' ') is events_names.join(' ')
            handler.call context, events_data
        
      @on names, waiting_handler, context, options


    #### Scape::fire(name, handler, [context], [options])
    # Gets event's bus by name and fires it. If there is no such event's bus — creates it, 
    # this is needed for handlers recall feature 

    fire: (name, attributes) ->
      @create(name).fire attributes

  new Scape "mangra"
