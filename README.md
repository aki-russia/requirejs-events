Mangra
================

Simple, small and fast events bus.

## Install

	$ bower install mangra

mangra.js is inside `dist/` folder, but it
requires [batchjs](https://github.com/aki-russia/batchjs) and [ui_guid_generator](), so, don't forget to include it from `dist/lib/` folder.

## Usage

As default, `mangra` refers to global events bus.


#### Binding handlers
`mangra.on(event_name, handler, [context], [options]);`

Returns method that unbinds handler from event.

	
	var handler = function(){
		console.log()
	};
	var unbind = mangra.on('some_event', handler); 
	
Providing context for handler:
	
	mangra.on('some_event', function(){
	    console.log(this.foo);
    }, { foo: "bar"} );
    
Recall handler, when it bond after event was fired
	
	mangra.fire('some_event');

	// handler will be called immediately
	mangra.on('some_event', function(){ 
		console.log(this.foo);
    }, { foo: "bar"} , {recall: true} );
        
	
#### Bind handler to event, call it only once

`mangra.once(event_name, handler, [context], [options]);`

	
	var handler = function(){
		console.log()
	};
	mangra.once('some_event', handler); 
	
#### Unbinding handlers

`mangra.off(event_name, handler);`

	mangra.off('some_event', handler);
	
	//or method from previous examples:
	unbind();
	
    
#### Firing events

`mangra.fire(event_name, [data]);`

	mangra.fire('some_event', { some_data: "string" });


 
#### Sprout new events bus 

You can `sprout` new event busses from global or any another, it is useful when you need to incapsulate some events inside particular module. 

`mangra.sprout([bus_name])`

If name is not given it will be generated automatically.

	var new_bus = mangra.sprout('new_bus_name');
	
	var handler = function(){
		console.log('new_bus:some_event');
	};
	
	new_bus.on('some_event', handler);
	
	mangra.fire('some_event'); // the handler will not fire
	new_bus.fire('some_event'); // the handler will fire
	
	
#### Initialize object as events bus 

Also you can `init`  any object as events bus, useful when you need to provide events-like interface for particular object

`mangra.init(object_to_init)`


	var foo = {
		bar: "zoo"
	};
	
	mangra.init(foo);
	
	foo.on('change', function(){
		console.log('changed');
	});

Mangra isn't watching for any changes in objects, all events should be called manually 

----


Freely distributable under the MIT license.