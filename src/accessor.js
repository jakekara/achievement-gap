var accessor = function( name ){

    return function( v ){

	if ( typeof( v ) == "undefined" )
	    return this[name]

	this[name] = v;
	return this;
    }
}

exports.accessor = accessor;

