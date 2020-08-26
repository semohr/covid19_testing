// ---------------------------------------------------------------------------- //
// Model
// ---------------------------------------------------------------------------- //
var wasm_init = false;
Module['onRuntimeInitialized'] = function() {
  console.log("model wasm loaded");
  wasm_init = true;
}

//GLOBAL model object i.e. a instance of our cpp model class.
var model;

/*Run load function on load of website sometime wasm loads in strange behaviour or
is not fully loaded on the 'load' event so we make an additional check for that*/
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
  /*Function which performs a complete model run
  it gets and syncs all inputs with the wasm model, than 
  runs the model, gets new data from wasm and updates the graph
  */

  //Update params
  update_model_params();
  //Run model
  model.run(params["dt"],params["t_max"],params["T_A_0"],params["T_S_0"],params["H_A_0"],params["H_S_0"]);
  //Get new data
  get_model_data();
  //Update graph
  update_chart();
}

function update_model_params(){
  //Syncs the javascript params to the wasm model params
  model.M           = params["M"];
  model.R_0         = params["R_0"];
  model.R_t_H       = params["R_t_H"];
  model.gamma       = params["gamma"];
  model.xi          = params["xi"];
  model.phi         = params["phi"];
  model.nu          = params["nu"];
  model.lambda_r    = params["lambda_r"];
  model.lambda_s    = params["lambda_s"];
  model.eta         = params["eta"];
  model.n_max       = params["n_max"];
  model.epsilon     = params["epsilon"];
  model.Phi         = params["Phi"];
  model.lambda_r_max= params["lambda_r_max"];
  return;
}

var modelData = {};
function get_model_data(){
  //Updates global modelData object

  // Get data from C model run
  let data = model.data;

  //Convert to nice javscript arrays
  modelData["time"] = data.time();
  modelData["T"] = data.T();
  modelData["H"] = data.H();
  modelData["H_S"] = data.H_S();
  modelData["T_S"] = data.T_S();
  modelData["H_A"] = data.H_A();
  modelData["T_A"] = data.T_A();
  modelData["N"] = data.N();
  modelData["N_obs"] = data.N_obs();
}


// ---------------------------------------------------------------------------- //
// Highcharts
// ---------------------------------------------------------------------------- //
window.charts = {}
var toggle = true;
function create_initial_chart(){
  var myChart = Highcharts.chart('main_chart', {
    title: {
      text: 'Compartments',
      renderTo: 'main_chart'
    },
    subtitle:{
      text: 'Total people in the corresponding traced or hidden compartments.'
    },

    xAxis: {
      title: {
        text: 'Time in days' 
      },
      labels: {
        formatter: function(){
          return this.value * params["dt"]
        }
      }
    },

    yAxis: {
      title:{
        text: "Active cases",
        useHTML: true,
      },
    },
    //Hover 
    tooltip:{
      formatter: function(){
        return "There are "+this.y.toFixed(0)+" ppl in the "+this.series.name+" pool </b> at "+this.x.toFixed(0)+" days after start.";
      }
    },

    //Disable markers
    plotOptions:{
        series: {
          marker: {
              symbol: "circle",
              enabled: false
          },
          lineWidth: 4
        }
    },

    //Remove highchart credit ;)
    credits: {
        enabled: false
    },

    //Export button for png svg and other
    exporting: {
        enabled: true,
        buttons: {
          costomButtn: {
            text: 'Toggle logscale',
            onclick: function (e) {
              if (toggle) {
                options = {
                	type :'logarithmic',
                	min: 1,
                }
              }
              else{
              	options = {
              		type :'linear',
              		min: 0.0,
              	}
                
              }

              this.update({
                yAxis: options,
              });
              toggle = !toggle
            },
          }
        }
    },

    //Data
    series: [{
      name: "Traced",
      data: [modelData["T"],modelData["time"]],
      color: '#006fb9',
    },
    {
      name: "Traced symptomatic",
      data: [modelData["T_S"],modelData["time"]],
      color: '#66c2ff',
      visible: false
    },
    {
      name: "Traced asymptomatic",
      data: [modelData["T_A"],modelData["time"]],
      color: '#b3e0ff',
      visible: false
    },
    {
      name: "Hidden",
      data: [modelData["H"],modelData["time"]],
      dashStyle: 'DashDot',
      color: '#8f403d'
    },
    {
      name: "Hidden symptomatic",
      data: [modelData["H_S"],modelData["time"]],
      dashStyle: 'DashDot',
      color: '#ba615e',
      visible: false
    },
    {
      name: "Hidden asymptomatic",
      data: [modelData["H_A"],modelData["time"]],
      dashStyle: 'DashDot',
      color: '#d9a7a6',
      visible: false
    },
]

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
  first_graph.series[1].setData(modelData["T_S"],false);
  first_graph.series[2].setData(modelData["T_A"],false);
  first_graph.series[3].setData(modelData["H"],false);
  first_graph.series[4].setData(modelData["H_S"],false);
  first_graph.series[5].setData(modelData["H_A"],false);
  
  first_graph.redraw();
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
      let model_params_list = ["M","R_0","R_t_H","gamma","xi",
      "phi","nu","lambda_r","lambda_s","eta","n_max","epsilon",
      "Phi","lambda_r_max","T_A_0","T_S_0","H_A_0","H_S_0","dt","t_max"];
      if (model_params_list.indexOf(this.id) > -1){
        complete_model_run();
      }
    },false)
  }
} 

window.addEventListener("load", add_advanced_mode_event);
//Advanced mode toggle advanced mode classes
function add_advanced_mode_event(){
  var checkbox = document.getElementById("advanced_mode")
  checkbox.addEventListener("input", function(e){
    divs = document.getElementsByClassName("advanced_mode") 
    if(this.checked){
      for (div of divs){
        div.style.display = "block";
      }
    }
    else{
      for (div of divs){
        div.style.display = "none";
      }
    }
  })
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


