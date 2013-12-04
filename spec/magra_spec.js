describe('mangra events spec', function(){

  describe('Bumps', function(){
    var new_event = null;
    var spy = null;

    beforeEach(function(){
      mangra.forget("event");
      new_event = mangra.create("event");
      spy = jasmine.createSpy('spy');
      jasmine.Clock.useMock();
    });

    it("mangra should create a Bump instance", function(){
      expect(new_event.name).toBe("event");
      expect(new_event._handlers.length).toBe(0);
      expect(new_event._last_params).toBe(null);

      expect(new_event._handlers_caller).toBeDefined();
      expect(new_event.on).toBeDefined();
      expect(new_event.off).toBeDefined();
      expect(new_event.fire).toBeDefined();
    });

    it("should bind handler", function(){
      
      var options = {};
      var context = {};

      new_event.on(spy, context, options);

      expect(new_event._handlers.length).toBe(1);
      expect(new_event._handlers[0]).toBe(spy);
      expect(new_event._handlers[0].id).toBeDefined();
      expect(new_event._handlers[0].options).toBe(options);
      expect(new_event._handlers[0].context).toBe(context);
    });

    it("should unbind handler", function(){
      var options = {};
      var context = {};

      new_event.on(spy);
      expect(new_event._handlers.length).toBe(1);

      new_event.off(spy);
      expect(new_event._handlers.length).toBe(0);
    });

    it("should fire binded handlers", function(){
      var another_spy = jasmine.createSpy('another_spy');
      var options = {};
      var context = {};

      new_event.on(spy);
      new_event.on(another_spy);
      new_event.off(another_spy);

      new_event.fire();

      jasmine.Clock.tick(1000);

      expect(spy).toHaveBeenCalled();
      expect(another_spy).not.toHaveBeenCalled();
    });

    it("handlers should be called in context, if specified", function(){
      var handler_context = null;
      var handler = function(){
        handler_context = this;
      };
      var options = {};
      var context = {
        foo: "bar"
      };

      new_event.on(handler, context);
      new_event.fire();

      jasmine.Clock.tick(1000);

      expect(handler_context).toBe(context);
    });

    it("handler should be called immediately if option 'recall' is set and event was fired before", function(){
      var options = {
        recall: true
      };

      new_event.fire({'foo': 'bar'});

      jasmine.Clock.tick(1000);

      new_event.on(spy, {}, options);

      expect(spy).toHaveBeenCalled();
    });

    it("handler should should receive data from event", function(){
      var event_data = {'foo': 'bar'};

      new_event.on(spy);
      new_event.fire(event_data);

      jasmine.Clock.tick(1000);
      
      expect(spy).toHaveBeenCalled();
      expect(spy.mostRecentCall.args.length).toBe(2);
      expect(spy.mostRecentCall.args[0]).toBe(event_data);
    });

    it("handler should should receive data from event in different args when it send as array", function(){
      var event_data = [{'foo': 'bar'}, {"bar": "foo"}];

      new_event.on(spy);
      new_event.fire(event_data);

      jasmine.Clock.tick(1000);
      
      expect(spy).toHaveBeenCalled();
      expect(spy.mostRecentCall.args.length).toBe(3);
      expect(spy.mostRecentCall.args[0]).toBe(event_data[0]);
      expect(spy.mostRecentCall.args[1]).toBe(event_data[1]);
    });
  });


  describe('Scape', function(){

    beforeEach(function(){
      mangra.list = {};
      jasmine.Clock.useMock();
    });

    describe("initializing object", function(){
      var object = null;
      var initialized_object = null;
      var spy = null;

      beforeEach(function(){
        spy = jasmine.createSpy("spy");
        mangra.list = {};
        object = {
          foo: "bar"
        };
        initialized_object = mangra.init(object);
      });

      it("should initialize object with events bus", function(){
        expect(initialized_object).toBe(object);
        expect(object.on).toBeDefined();
        expect(object.off).toBeDefined();
        expect(object.once).toBeDefined();
        expect(object.fire).toBeDefined();
      });

      it("should bind handlers to events", function(){
        object.on("event", spy);

        object.fire("event", {});
        object.fire("event", {});

        jasmine.Clock.tick(1000);

        expect(spy).toHaveBeenCalled();
        expect(spy.calls.length).toBe(2);
      });

      it("should unbind previously binded handlers to events", function(){
        object.on("event", spy);
        object.off("event", spy);

        object.fire("event", {});
        jasmine.Clock.tick(1000);

        expect(spy).not.toHaveBeenCalled();
      });

      it("should call handler only once", function(){
        object.once("event", spy);

        object.fire("event", {});
        object.fire("event", {});
        object.fire("event", {});
        object.fire("event", {});

        jasmine.Clock.tick(1000);

        expect(spy.calls.length).toBe(1);
      });
    });
  });
  // describe('binding / unbinding handlers', function(){});
  // describe('firing events', function(){});
  // describe('events bus, sprouting new', function(){});

});