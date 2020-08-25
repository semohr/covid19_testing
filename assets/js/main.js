// ---------------------------------------------------------------------------- //
// Model
// ---------------------------------------------------------------------------- //
var wasm_init = false;
Module['onRuntimeInitialized'] = function() {
	console.log("model wasm loaded");
	wasm_init = true;
}

var model;

window.addEventListener("load", setup);
function setup(){
	if (!wasm_init){
		setTimeout(setup, 10);
		return;
	}
	//Create global model instance
	model = new Module.Model();

	//Run the model once
	complete_model_run();

	// Add events to buttons
	add_update_params_events();
}

function complete_model_run(){
	//Update params
	update_model_params();
	//Run model
	model.run(1,50);
	//Get new data
	get_model_data();
	//Update graph
	update_chart();
}

function update_model_params(){
	//Syncs the javascript params to the wasm model params
	model.M 					= params["M"];
	model.R_0 				= params["R_0"];
	model.R_t_H				= params["R_t_H"];
	model.gamma				= params["gamma"];
	model.xi					= params["xi"];
	model.phi		  		= params["phi"];
	model.nu					= params["nu"];
	model.lambda_r		= params["lambda_r"];
	model.lambda_s		= params["lambda_s"];
	model.eta					= params["eta"];
	model.n_max				= params["n_max"];
	model.epsilon			= params["epsilon"];
	model.Phi					= params["Phi"];
	model.lambda_r_max= params["lambda_r_max"];
	model.xi_ap				= params["xi_ap"];
	return;
}

var modelData = {};
function get_model_data(){
	//Updates global modelData object

	// Get data from C model run
	let data = model.data;

	//Convert to nice javscript arrays
	let time_array = [];
	modelData["T"] = data.T();
	modelData["H"] = data.H();
	modelData["H_S"] = data.H_S();
}


// ---------------------------------------------------------------------------- //
// Highcharts
// ---------------------------------------------------------------------------- //
window.charts = {}

function create_initial_chart(){
	var myChart = Highcharts.chart('main_chart', {
		title: {
			text: 'Compartments',
			renderTo: 'main_chart'
		},

		subtitle: {
			text: 'Plain'
		},

		xAxis: {
			title: {
				text: 'Time in days' 
			},
			labels: {
      	format: '{value}'
    	},
		},

		tooltip:{
			formatter: function(){
				return "There are "+this.y.toFixed(0)+" ppl in the "+this.series.name+" pool </b> at "+this.x.toFixed(0)+" days after start.";
			}
		},

		plotOptions:{
        series: {
          marker: {
              enabled: false
          }
        }
		},

		series: [{
			name: "Traced",
			data: modelData["T"],
		},
		{
			name: "Hidden",
			data: modelData["H"],
		},
		{
			name: "Hidden Suceptible",
			data: modelData["H_S"],
		}]

	})
	window.charts[myChart.renderTo.id] = myChart;
	return;
}

function update_chart(){
	if (typeof window.charts["main_chart"] == 'undefined') {
	  create_initial_chart();
	  return;
	}
	var first_graph = window.charts["main_chart"];
	first_graph.series[0].setData(modelData["T"],false);
	first_graph.series[1].setData(modelData["H"],false);
	first_graph.series[2].setData(modelData["H_S"],false);
	first_graph.redraw();
	console.log("hi")
}

// ---------------------------------------------------------------------------- //
// Interactive Forms
// ---------------------------------------------------------------------------- //
window.addEventListener("load",create_interactive_forms);

function create_interactive_forms(){
	//Iterate over all interactive forms
	var forms = document.getElementsByClassName("interactive_form");
	for (form of forms) {
		//iterate over all linked form inputs and link them together
		var linked_inputs = form.querySelectorAll(".form-linked-inputs");
		for (linked_input of linked_inputs) {
			//Get inputs
			var inputs = linked_input.getElementsByTagName('input');
			for (var input of inputs) {
				//Add event handler
				input.other_inputs = inputs;
				input.addEventListener('input', function(e){
					for (input of this.other_inputs){
						if (this == input){
							continue;
						}
						input.value = this.value;
					}
				},false)
			}
		}
	}
}


//Get all values from all inputs
window.addEventListener("DOMContentLoaded", add_update_params_events)
//global params
var params = {};

function add_update_params_events(){
	var inputs = document.querySelectorAll("input");
	for (input of inputs){
		input.addEventListener('input', function(e){
			if (this.type == "checkbox"){
				params[this.id] = this.checked;
			}
			else{
				params[this.id] = parseFloat(this.value);
			}
		},false)
		var event = new Event('input');
		input.dispatchEvent(event)
	}
}

//load normally gets executed after domcontentloaded
window.addEventListener("load", add_model_params_update_event);

function add_model_params_update_event(){
	var inputs = document.querySelectorAll("input");
	for (input of inputs){
		input.addEventListener('input', function(e){
			//Testing that here in the events for no will see how it works performance wise
			let model_params_list = ["M","R_0","R_t_H","gamma","xi","phi","nu","lambda_r","lambda_s","eta","n_max","epsilon","Phi","lambda_r_max","xi_ap"];
			if (model_params_list.indexOf(this.id) > -1){
				complete_model_run();
			}
		},false)
	}
}	



// ---------------------------------------------------------------------------- //
// Utils
// ---------------------------------------------------------------------------- //
// throttle function, enforces a minimum time interval
function throttle(fn, interval) {
  var lastCall, timeoutId;
  return function () {
    var now = new Date().getTime();
    if (lastCall && now < (lastCall + interval) ) {
      // if we are inside the interval we wait
      clearTimeout(timeoutId);
      timeoutId = setTimeout(function () {
        lastCall = now;
        fn.call();
      }, interval - (now - lastCall) );
    } else {
      // otherwise, we directly call the function 
      lastCall = now;
      fn.call();
    }
  };
}
