/*
 * gap-lib.js - library for making gap rank graphics
 */

var d3 = Object.assign({},
		       require("d3-selection"),
		       require("d3-array"),
		       require("d3-scale"),
		       require("d3-axis"));

const accessor = require( "./accessor.js" )["accessor"];

var gapchart = function()
{

    this.__dot_radius = 10;
    this.__scale_margin = 0.1;
    this.__margin = {
	"left":0,
	"right":0,
	"top":0,
	"bottom":0
    };

    return this;
};

exports.gapchart = gapchart;

gapchart.prototype.explainer_height = accessor ("__explainer_height");

gapchart.prototype.title = accessor("__title");

gapchart.prototype.default_val = accessor("__default_val");

gapchart.prototype.explainer_function = accessor("__explainer_function");

gapchart.prototype.unit = accessor( "__unit" );

gapchart.prototype.gap_unit = accessor( "__gap_unit" );

// gapchart.prototype.radius = accessor( "__dot_radius" );

gapchart.prototype.radius_function = accessor( "__dot_radius_function" );

gapchart.prototype.buffer_pct = accessor( "__buffer_pct" );

gapchart.prototype.container = accessor( "__sel" );

gapchart.prototype.val_keys = accessor( "__val_key" );

gapchart.prototype.label_key = accessor( "__label_key" );

gapchart.prototype.data = accessor( "__data" );

gapchart.prototype.radius = function(d){
    return this.radius_function()(d);
}

gapchart.prototype.data_arr = function ( key )
{
    return this.data().map( function( a ){
	return a[key];
    });
}

gapchart.prototype.min_max = function( key )
{

    if ( typeof( key ) == "undefined" ) return;

    var arr = this.data().map(function(a){
	return a[key];
    })

    return { "min": d3.min( arr ),
	     "max": d3.max( arr ) };
}

gapchart.prototype.gap = function ( a )
{
    var ret = a[this.val_keys()[1]] - a[this.val_keys()[0]];
    if (isNaN(ret)) return null;
    return ret;
}

gapchart.prototype.gap_arr = function()
{
    var that = this;
    
    return this.data().map(function(a){
	return that.gap.call(that, a);
    });
}

gapchart.prototype.gap_range = function()
{

    var min = d3.min(this.gap_arr());
    var max = d3.max(this.gap_arr());

    var rng = max - min;

    var margin = rng * this.__scale_margin;

    min -= margin;
    max += margin
    return [min, max];
	    // d3.ax(this.gap_arr()) * (1 + this.__scale_margin)];
}

gapchart.prototype.val_range = function(){

    var arr = this.data_arr(this.val_keys()[0])
	.concat(this.data_arr(this.val_keys()[1]));

    return [d3.min(arr), d3.max(arr)];
}

gapchart.prototype.d3scale = function( range ){

    var y_min = 0
	+ this.radius() + this.__margin.left;
    var y_max = 
	this.__svg.node().getBoundingClientRect().width
	- this.radius()
	- this.__margin.right;

    return d3.scaleLinear()
        .domain( range || this.value_range() )
	.range( [y_min, y_max] );
    
}

gapchart.prototype.rank_scale = function(){
    return this.d3scale( this.gap_range() );
}

gapchart.prototype.d3axis = function( range ){
    return d3.axisBottom(this.d3scale( range || this.value_range() ));
}

gapchart.prototype.rank_axis = function(){
    return d3.axisBottom( this.rank_scale());
}

gapchart.prototype.draw_gap = function(d, i )
{
}

gapchart.prototype.position_rank_dots = function(f)
{
    this.__rank_dots
	.style("transform",function(d){
	    var bbox = this.getBBox();
	    var xoff = f(d);
	    return "translate(" + xoff + "px, 0px)";
	});
}

gapchart.prototype.draw_rank_dots = function()
{
    var lkey = this.label_key();
    var k1 = this.val_keys()[0];
    var k2 = this.val_keys()[1];

    var xmin = this.__margin.left;
    var xmax = this.container().node().getBoundingClientRect().width
	-  this.__margin.right;
    
    var label = this.__rank_dots
	.append("text")
    	.classed("dot-label top-label", true)
	.text(function(d){ return d[lkey]; })
	.attr("y", function(){ return this.getBBox().height;});

    var that = this;
    var label_bottom = this.__rank_dots
	.append("text")
	.classed("dot-label bottom-label", true)
	.text(function(d){
	    return "gap: " 
		+ Math.round(that.gap(d))
		+ " " + that.gap_unit();
	})
    	.attr("y", function(){
	    return this.getBBox().height
		+ this.parentNode.getBBox().height + that.radius();
	});

    // label.attr("y", function(){ return this.getBBox().height;});

    d3.selectAll(".dot-label").attr("x", function(){
	    var ret = 0 - this.getBBox().width / 2 ;
	    return ret;
	});

    this.__rank_dots
	.append("circle")
	.attr("r", function(d){
	    return that.radius();
	})
	// .attr("cx", 50)
	.attr("cy", this.radius()  + label.node().getBBox().height * 1.4)
}

gapchart.prototype.draw_rank = function (){

    // filter data
    var that = this;
    this.data(this.data().filter(function(a){
	if (a[that.val_keys()[0]].length < 1) return false;
	if (a[that.val_keys()[1]].length < 1) return false;
	return true;
    }));

    this.container().html("");

    this.container().append("h3")
	.html(this.title());

    this.__explainer = this.container().append("div")
	.classed("explainer", true);
    
    this.__svg = this.container()
	.append("svg")
	.attr("width",
	      window.innerWidth);
	      // d3.select(window).node().getBoundingClientRect().width );
	      // this.container().node().getBoundingClientRect().width )

    this.__g = this.__svg.append("g");

    var lkey = this.label_key();
    // console.log("lkey", lkey);
    
    this.__gaps_g = this.__g.append("g")
	.classed("gaps", true)
	.style("transform",
	       "translate(0px," + this.__margin.top + "px)")

    this.__rank_dots = this.__gaps_g.selectAll(".rankdot")
	.data(this.data())
	.enter()
	.append("g")
	.classed("rankdot", true)
        .attr("data-" + this.label_key(),
	      function(d){
		  return d[lkey];
	      });
    this.draw_rank_dots();

    this.position_rank_dots(function(d){
	var ret = that.rank_scale()(that.gap(d));

	return ret;
    });

    // redraw with more margin if its overlapping 
     
    var overhang =
	Math.round(this.__g.node().getBBox().width
		   + this.__g.node().getBBox().x
		   - this.__svg.node().getBoundingClientRect().width);

    if (overhang > 0){
	// console.log("too wide- redrawing...");
	this.__margin.right += overhang/2;
	this.__margin.left += overhang/2;
	return this.draw_rank();
    }
    
    this.__axis = this.__g.append("g")
	.classed("d3axis", true)
	.append("g")
	.call(this.rank_axis());
    
    // console.log(this.__gaps_g.node().getBBox());

    this.__axis.style("transform",
		      "translate(0px,"
		      + ( this.__gaps_g.node().getBBox().height
			  + this.__gaps_g.node().getBBox().y
			  + this.radius())
		      + "px)");


    this.__svg.attr("height", function(){
	return ( that.__g.node().getBBox().height
	    + that.__g.node().getBBox().y) + "px";
    });
    
    this.__detail_label = this.container().append("div")
	.classed("detail-label", true)
	.html("&nbsp;");

    this.__rank_dots.on("mouseover", function(d){

	var tmp_height = that.__explainer.node()
	    .getBoundingClientRect().height;
	
	that.__explainer.html(that.explainer_function()(d));

	var new_height = that.__explainer.node()
	    .getBoundingClientRect().height;

	// prevent explainer from  contracting
	if ( new_height < tmp_height )
	    that.__explainer.style("height",
				     tmp_height + "px");
	
	    
    });

    var restore = function(){

	var d = that.data().filter(function(a){
	    return a[that.label_key()] == that.default_val();
	})[0];

	that.__explainer.html(that.explainer_function()(d));
    	that.__detail_label.html("&nbsp;");
	};

    this.__rank_dots.on("mouseout", restore );
    // function(){

    // 	var d = that.data().filter(function(a){
    // 	    return a[that.label_key()] == that.default_val();
    // 	})[0];

    // 	that.__explainer.html(that.explainer_function()(d));
    // 	that.__detail_label.html("&nbsp;");
    // });

    restore();
    
}

