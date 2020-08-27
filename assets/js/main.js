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

  // Hide loading
  document.getElementById("loading").style.display = "none";
}

function complete_model_run(){
  /*Function which performs a complete model run
  it gets and syncs all inputs with the wasm model, than 
  runs the model, gets new data from wasm and updates the graph
  */
  //Update params
  update_model_params();

  //Run model
  throttle(model.run(1,params["t_max"],params["T_0"],params["H_0"]),  150);
  //Get new data
  get_model_data();
  //Update graph
  update_chart();
}

function update_model_params(){
  //Syncs the javascript params to the wasm model params
  model.M           = params["M"];
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
  modelData["R_t_obs"] = data.R_t_obs();
  modelData["R_t_eff"] = data.R_t_eff();
}


// ---------------------------------------------------------------------------- //
// Highcharts
// ---------------------------------------------------------------------------- //
window.charts = {}






var toggle = true;
function create_initial_chart(){

  //We create two charts for now

  var charttitle = [
      "Compartments",
      "New Cases",
      "Reproduction numbers"];
  var chartsubtitles = [
      'Total people in the corresponding traced or hidden compartments.',
      'Daily new infections observed and true numbers.',
      'Effective and observed reproduction numbers over time.'];
  var chartyaxistitle = [
      "Cases (total)",
      "Cases (per day)",
      "Reproduction number"];
  var chartdata = [
    //First
    [{
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
      color: '#b94100'
    },
    {
      name: "Hidden symptomatic",
      data: [modelData["H_S"],modelData["time"]],
      dashStyle: 'DashDot',
      color: '#b91300',
      visible: false
    },
    {
      name: "Hidden asymptomatic",
      data: [modelData["H_A"],modelData["time"]],
      dashStyle: 'DashDot',
      color: '#d9a7a6',
      visible: false
    },
    ],
    //Second
    [{
      name: "New cases observed",
      data: [modelData["N_obs"],modelData["time"]],
      color: '#8200b9',
      visible: true,
    },
    {
      name: "New cases true",
      data: [modelData["N"],modelData["time"]],
      dashStyle: 'DashDot',
      color: '#8200b9',
      visible: false,
    },
    ],
    //Third
    [{
      name: "Observed reproduction number",
      data: [modelData["R_t_obs"],modelData["time"]],
      color: '#eb4034',
      visible: true,
    },
    {
      name: "Effectiv reproduction number",
      data: [modelData["R_t_eff"],modelData["time"]],
      dashStyle: 'DashDot',
      color: '#eb4034',
      visible: false,
    },
    ],    
    ]
  for(let i = 0; i < 3; i++){
    var chartDiv = document.createElement('div');
    chartDiv.className = 'chart';
    document.getElementById('hs-container').appendChild(chartDiv);

    var myChart = Highcharts.chart(chartDiv,{
      chart: {
        spacingTop: 20,
        spacingBottom: 20,
        style: {
          fontFamily: "Source Serif Pro"
        }
      },
      title: {
        text: charttitle[i],
      },
      subtitle:{
        text: chartsubtitles[i],
      },
      credits: {
        enabled: false
      },
      xAxis: {
        title: {
          text: 'Time in days',
        },
        labels: {
          formatter: function(){
            return this.value * params["dt"]
          }
        },
        crosshair: true,
        /*
        events: {
            setExtremes: syncExtremes
        },
        */
      },
      yAxis: {
        title:{
          text: chartyaxistitle[i],
          useHTML: true,
        },
      },
      series: chartdata[i],

      //Additions
      
      plotOptions:{
          series: {
            marker: {
                symbol: "circle",
                enabled: false //Disable markers
            },
            lineWidth: 4
          }
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
      })
    window.charts[i] = myChart;
    }
}

function update_chart(){
  //First chart
  if (typeof window.charts[0] == 'undefined') {
    create_initial_chart();
    return;
  }
  var chart = window.charts[0];
  chart.series[0].setData(modelData["T"],false);
  chart.series[1].setData(modelData["T_S"],false);
  chart.series[2].setData(modelData["T_A"],false);
  chart.series[3].setData(modelData["H"],false);
  chart.series[4].setData(modelData["H_S"],false);
  chart.series[5].setData(modelData["H_A"],false);
  chart.redraw();

  //Second chart
  if (typeof window.charts[1] == 'undefined') {
    create_initial_chart();
    return;
  }
  var chart = window.charts[1];
  chart.series[1].setData(modelData["N"],false);
  chart.series[0].setData(modelData["N_obs"],false);
  chart.redraw(); 

  //Third chart
  if (typeof window.charts[2] == 'undefined') {
    create_initial_chart();
    return;
  }
  var chart = window.charts[2];
  chart.series[0].setData(modelData["R_t_obs"],false);
  chart.series[1].setData(modelData["R_t_eff"],false);
  chart.redraw(); 

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
      "Phi","lambda_r_max","T_0","H_0","dt","t_max"];
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


