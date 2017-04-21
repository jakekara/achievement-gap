const d3 = Object.assign({},
		       require("d3-selection"),
		       require("d3-request"));

const numeral = require("numeraljs");

var gaplib = require( "./gap-lib.js" );

var drawn = false;

var selected = function(sel){
    var i= sel.node().selectedIndex;
    return d3.select(sel.node().options[i]);
}

var selected_filname = null;
var selected_keys = null;
var cached_files = {};
var throttle = null;

var get_group = function(){
    return selected(d3.select("#group_picker")).attr("data-fname");
}

var get_subj = function(){
    return selected(d3.select("#subj_picker")).attr("data-fname");
}

var get_grade = function(){
    return selected(d3.select("#grade_picker")).attr("data-fname");
}

var get_fname = function(){
    var ret = "data/"
    ret += get_group()
    ret += "_";
    ret += get_subj()
    ret += "_";
    ret += get_grade()
    ret += ".csv";
    return ret;
};

var get_keys = function()
{
    var sel = selected(d3.select("#group_picker"))

    return [sel.attr("data-key1"),sel.attr("data-key2")]
}

var update = function(){

    if ( get_keys() == selected_keys
	 && get_fname() == selected_fname ) return;

    // console.log(get_fname());
    
    if ( cached_files.hasOwnProperty( get_fname()) )
    {
	go( cached_files[get_fname()], get_keys());
    }
    else 
    {
	d3.csv( get_fname(), function(d){
	    cached_files[get_fname()] = d;
	    go(d, get_keys());
	});
    }

    
}

var go = function(d, keys){

    // console.log("got data", d);

    var d = d.sort(function(a, b){
	if (a["state"].toUpperCase() == "CONNECTICUT"
	    || a["state"].toUpperCase() == "NATIONAL") return 1;
	return -1;
    });

    var fmt_group = function(g){
	return g
	    .replace("not ell","non-ell")
	    .replace("ell","ELL")
	    .replace("hispanic","Hispanic");
    }

    
    gaps = new gaplib.gapchart()
	.container(d3.select("#container"))
    // .val_keys(["ell","not ell"])
	.val_keys( keys )
	.label_key("state")
	.default_val("Connecticut")
	// .radius(12)
	.data(d)
	.unit("% proficient")
	.gap_unit(" points")
	.title(fmt_group(keys[0] + ", " + keys[1] + " achievement gap "))
	.radius_function(function(d){
	    return 10;
	})
	.explainer_function(function(d){

	    var place = "In " + d[gaps.label_key()] + ", ";
	    if (d[gaps.label_key()] == "National")
		place = "Nationwide, " ;

	    
	    return place
	    	+ Math.round(d[gaps.val_keys()[0]]) + " percent of "
		+ fmt_group(gaps.val_keys()[0])
		+ " students "
		+ " and "
	    	+ Math.round(d[gaps.val_keys()[1]])
		+ " percent of " 
		+ fmt_group(gaps.val_keys()[1])
		+ " students"
		+ " were at or above proficiency in"
		+ " " + numeral(get_grade()).format('0o')
		+ "-grade " + get_subj() + "."
		+ " That's a " + Math.round(gaps.gap(d)) + "-point gap.";

	});

    gaps.draw_rank();

    d3.select(window).on("resize", function(){
	clearTimeout(throttle);
	throttle = setTimeout(function(){
	    gaps.draw_rank.call(gaps);
	}, 250);
    });

    drawn = true;
}

var make_gui = function(){

    var ctrls = d3.select("#controls")

    var group = [{
	"label":"Hispanic/white",
	"fname":"drace",
	"key1":"hispanic",
	"key2":"white"
    },{
	"label":"ELL Status",
	"fname":"lep",
	"key1":"ell",
	"key2":"not ell"
    }];

    var subj = [{
	"label":"Reading",
	"fname":"reading",
    },{
	"label":"Math",
	"fname":"math",
    },{
	"label":"Science",
	"fname":"science"
    }];

    var grade = [{
	"label":"Grade 4",
	"fname":"4",
    },{
	"label":"Grade 8",
	"fname":"8",
    }];

    // add group selection
    var group_sel = ctrls.append("select")
	.attr("id","group_picker")
    var grade_sel = ctrls.append("select")
	.attr("id","grade_picker");
    var subj_sel = ctrls.append("select")
	.attr("id","subj_picker");

    var group_opts = group_sel.selectAll("option")
	.data(group)
	.enter()
	.append("option")
	.attr("data-fname",function(d){ return d["fname"]; })
	.attr("data-key1",function(d){  return d["key1"]; })
	.attr("data-key2",function(d){  return d["key2"]; })
	.text(function(d){ return d["label"];});

    var grade_opts = grade_sel.selectAll("option")
	.data(grade)
	.enter()
	.append("option")
    	.attr("data-fname",function(d){ return d["fname"]; })
	.text(function(d){ return d["label"];});

    var subj_opts =  subj_sel.selectAll("option")
	.data(subj)
	.enter()
	.append("option")
    	.attr("data-fname",function(d){ return d["fname"]; })
	.text(function(d){ return d["label"];});


    d3.selectAll("select").on("change", update);

    update();

}

// d3.csv( "data/lep_reading_8_score.csv", go );

make_gui();

