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
  throttle(model.run(1.0,params["t_max"],params["T_0"],params["H_0"]),  150);
  //Get new data
  get_model_data();

  //Update graph
  update_chart();
  update_chart();
}

function update_model_params(){
  //Check if the params are valid!
  var range = {};
  range["R_t_H"] = [0,5];
  range["gamma"] = [0.08,0.12];
  range["xi"] =    [0.12,0.33];
  range["phi"] =   [0.1,0.4];
  range["nu"] =    [0,0.4];
  range["lambda_r"]=[0,0.02];
  range["lambda_s"]=[0,1];
  range["eta"] = [0,1];
  range["n_max"] = [100,3000];
  range["epsilon"] = [0,1];
  range["Phi"] = [0,1000];

  for (var key in range){
    if ((params[key] > range[key][1]) || (params[key] < range[key][0])){
      alert("Parameter "+key+ " is in an unexpected range!\nUndefined behaviour possible!")
    }
  }

  //Syncs the javascript params to the wasm model params
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
  var yAxis_max = [null,null,2.0];
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
      color: '#b91300'
    },
    {
      name: "Hidden symptomatic",
      data: [modelData["H_S"],modelData["time"]],
      dashStyle: 'DashDot',
      color: '#b94100',
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
      name: "Total new cases",
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
        max: yAxis_max[i],
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
        tooltip: {
          pointFormat: '{series.name}: <b>{point.y:.2f}</b><br/>',
          shared: true
        },
        legend:{
          symbolWidth: 40
        }
        
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
params["dt"] = 1.0;
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

    //Do it once at start
    if (input.type == "checkbox") {
      params[input.id]=input.checked;
    }
    else{
      params[input.id]=parseFloat(input.value);
    }
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
  checkbox.dispatchEvent(new Event("input"));
}


// ---------------------------------------------------------------------------- //
// Buttons
// ---------------------------------------------------------------------------- //

window.addEventListener("load", reset_button);

function reset_button(){
  var btn = document.getElementById("reset");

  btn.addEventListener("click", function(){
    //Set params 
    params["M"]            = 80000000;
    params["R_0"]          = 3.28;
    params["R_t_H"]        = 1.8;
    params["gamma"]        = 0.1;
    params["xi"]           = 0.15;
    params["phi"]          = 0.2;
    params["nu"]           = 0.10;
    params["lambda_r"]     = 0.0;
    params["lambda_s"]     = 0.1;
    params["eta"]          = 0.66;
    params["n_max"]        = 300;
    params["epsilon"]      = 0.1;
    params["Phi"]          = 15.0;
    params["lambda_r_max"] = 0.002;

    //Reset sliders/forms
    update_slider_forms();
    complete_model_run();
  })
}

function update_slider_forms(){
  var inputs = document.querySelectorAll("input");
  let model_params_list = ["M","R_0","R_t_H","gamma","xi",
  "phi","nu","lambda_r","lambda_s","eta","n_max","epsilon",
  "Phi","lambda_r_max","T_0","H_0","dt","t_max"];
  for (input of inputs){
    if (model_params_list.indexOf(input.id) > -1){
      input.value = params[input.id];
    }
  }
}


function downloadObjectAsJson(exportObj, exportName){
  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
  var downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href",     dataStr);
  downloadAnchorNode.setAttribute("download", exportName + ".json");
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

window.addEventListener("load", save_button);
function save_button(){
  var btn = document.getElementById("save");

  btn.addEventListener("click", function(){
    downloadObjectAsJson(params, "tti-config");
  })
}

window.addEventListener("load", load_button);
function load_button(){
  var btn = document.getElementById("load");

  btn.addEventListener("change", function(){
    // Handel files
    if (this.files.length === 0) {
        console.log('No file is selected');
        return;
    }

    var reader = new FileReader();
    reader.onload = function(e){
      var res = JSON.parse(e.target.result);
      for (item in res){
        params[item] = res[item];
      }
      update_slider_forms();
      complete_model_run();
    }
    reader.readAsText(this.files[0]);
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


// Export to csv for validation
function exportToCsv(filename, rows) {
    var processRow = function (row) {
        var finalVal = '';
        for (var j = 0; j < row.length; j++) {
          console.log(row[j],j)
            var innerValue = row[j] === undefined ? '' : row[j].toString();
            if (row[j] instanceof Date) {
                innerValue = row[j].toLocaleString();
            };
            var result = innerValue.replace(/"/g, '""');
            if (result.search(/("|,|\n)/g) >= 0)
                result = '"' + result + '"';
            if (j > 0)
                finalVal += ',';
            finalVal += result;
        }
        return finalVal + '\n';
    };

    var csvFile = '';
    for (var i = 0; i < rows.length; i++) {
        csvFile += processRow(rows[i]);
    }

    var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

function modelData_to_csv(){
  var data = [
    ["time",
    "T",
    "T_A",
    "T_S",
    "H",
    "H_A",
    "H_S",
    "N",
    "N_obs",
    "R_t_eff",
    "R_t_obs"]];

  for(var i=1; i<100; ++i){ 
    data.push([
      modelData["time"][i],
      modelData["T"][i],
      modelData["T_A"][i],
      modelData["T_S"][i],
      modelData["H"][i],
      modelData["H_A"][i],
      modelData["H_S"][i],
      modelData["N"][i],
      modelData["N_obs"][i],
      modelData["R_t_eff"][i],
      modelData["R_t_obs"][i]
     ]);
  }
  console.log(data)
  exportToCsv("data.csv", data)
}