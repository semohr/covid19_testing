/*
* @Author: Sebastian B. Mohr
* @Date:   2020-08-20 16:23:28
* @Last Modified by:   sebastian
* @Last Modified time: 2020-08-20 16:23:39
*/
#include <stdio.h>
#include <cmath>
#include <iostream>
#include <vector>
#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>
using namespace std;
using namespace emscripten;

//Data used for communication with javscript
struct mydata_struct{
	vector<array<double,3>> SV;
	vector<double> time;
	vector<double> T;
	vector<double> H;
	vector<double> H_S;

	val getT(){
		//Return emscripten::val for easy memory view of an array
		double* a = &T[0]; //since C++0x vectors elemnts are contiguous in memory
		return val(typed_memory_view(T.size(),a));
	}
	val getH(){
		double* a = &H[0]; 
		return val(typed_memory_view(H.size(),a));
	}

	val getH_S(){
		double* a = &H_S[0];
		return val(typed_memory_view(H_S.size(),a));
	}

	val gettime(){
		double* a= &time[0];
		return val(typed_memory_view(time.size(),a));
	}
};

class Model{
	public:
		// ---------------------------------------------------------------------------- //
		// Variables getters/setters
		// ---------------------------------------------------------------------------- //
		//Population
		double getM() const {return M;}; 
		void setM(double M_) { M = M_; }

		//Basic reproduction number
		double getR_0() const {return R_0;}; 
		void setR_0(double R_0_) { R_0 = R_0_; }

		//Reproduction number (hidden)
		double getR_t_H() const {return R_t_H;}; 
		void setR_t_H(double R_t_H_) { R_t_H = R_t_H_; }

		//Case discharge rate
		double getgamma() const {return gamma;}; 
		void setgamma(double gamma_) { gamma = gamma_; }		

		//Asymptomatic ratio
		double getxi() const {return xi;}; 
		void setxi(double xi_) { xi = xi_; }	

		//Fraction skipping testing
		double getphi() const {return phi;}; 
		void setphi(double phi_) { phi = phi_; }	
		
		//Isolation factor
		double getnu() const {return nu;}; 
		void setnu(double nu_) { nu = nu_; }

		//Random testing rate
		double getlambda_r() const {return lambda_r;}; 
		void setlambda_r(double lambda_r_) { lambda_r = lambda_r_; }

		//Symptomatic testing rate
		double getlambda_s() const {return lambda_s;}; 
		void setlambda_s(double lambda_s_) { lambda_s = lambda_s_; }

		//Tracing efficiency
		double geteta() const {return eta;}; 
		void seteta(double eta_) { eta = eta_; }

		//Testing capacity(only positive contacts counted)
		double getn_max() const {return n_max;}; 
		void setn_max(double n_max_) { n_max = n_max_; }

		//Missed contacts(traced)
		double getepsilon() const {return epsilon;}; 
		void setepsilon(double epsilon_) { epsilon = epsilon_; }

		//Influx rate (hidden)
		double getPhi() const {return Phi;}; 
		void setPhi(double Phi_) { Phi = Phi_; }

		//Maximal test capacity per capita
		double getlambda_r_max() const {return lambda_r_max;}; 
		void setlambda_r_max(double lambda_r_max_) { lambda_r_max = lambda_r_max_; }

		//Apparent asymptomatic ratio
		double getxi_ap() const {return xi_ap;}; 
		void setxi_ap(double xi_ap_) { xi_ap = xi_ap_; }


		//data
		mydata_struct data;
		// ---------------------------------------------------------------------------- //
		// Functions
		// ---------------------------------------------------------------------------- //
		Model(); //Constructor
		~Model(); //Deconstructor
		void run(double dt, double t_max); //Main entry point also passed to js
		void get_data(double* in_data);

	private:
		double R_H(double t);
		array<double,3> runge_kutta4(double dt, double t, array<double,3> SV);
		array<double,3> dgl(double t, array<double,3> SV);

		// ---------------------------------------------------------------------------- //
		// Variables
		// ---------------------------------------------------------------------------- //
		double M; //Population
		double R_0; //Basic reproduction number
		double R_t_H; //Reproduction number (hidden)
		double gamma; //Case discharge rate
		double xi; //Asymptomatic ratio
		double phi; //Fraction skipping testing
		double nu; //Isolation factor
		double lambda_r; //Random testing rate
		double lambda_s; //Symptomatic testing rate
		double eta; //Tracing efficiency
		double n_max; //Testing capacity(only positive contacts counted)
		double epsilon; //Missed contacts(traced)
		double Phi; //Influx rate (hidden)
		double lambda_r_max; //Maximal test capacity per capita
		double xi_ap; //Apparent asymptomatic ratio

		array<double,3> k_1;
		array<double,3> k_2;
		array<double,3> k_3;
		array<double,3> k_4;
		array<double,3> k_2_SV;
		array<double,3> k_3_SV;
		array<double,3> k_4_SV;
};


Model::Model(){
	//Constructor
	//Set default values
	M     			 = 80000000;
	R_0   			 = 3.28;
	R_t_H 			 = 1.8;
	gamma 			 = 0.1;
	xi    			 = 0.15;
	phi   			 = 0.2;
	nu    			 = 0.10;
	lambda_r 		 = 0.0;
	lambda_s 	   = 0.1;
	eta          = 0.66;
	n_max        = 300;
	epsilon      = 0.1;
	Phi          = 15.0;
  lambda_r_max = 0.002;
  xi_ap        = 0.32;
}
Model::~Model() {
	std::cout << "Deconstructor" << std::endl;
  data.SV.clear();
  data.time.clear();
}

double Model::R_H(double t){
	/*Returns Reproduction number R at time t*/
	return R_t_H;
}


array<double,3> Model::dgl(double t, array<double,3> SV){
	/*
	DGL for runge kutta i.e our model equations

	Parameters
	----------
	t:
		time
	SV:
		State Vector containing
		double T, double H, double H_S

	*/
	array<double,3> next_SV;

	//Helper
	double f = fmin(n_max, eta * R_H(t) * (lambda_s * SV[2] + lambda_r * SV[1]));

	//Equations
	next_SV[0]   = gamma * (nu * R_H(t) - 1.0)*SV[0] 				         + lambda_s * SV[2] + lambda_r * SV[1]            + f;
	next_SV[1]   = gamma * (     R_H(t) - 1.0)*SV[1]                 - lambda_s * SV[2] + lambda_r * SV[1]            - f     + gamma * epsilon * R_H(t) * SV[0] + Phi;
	next_SV[2]   = gamma * ( R_H(t)*SV[1] - SV[2] / ( 1.0 - xi_ap )) - (lambda_s + lambda_r ) * SV[2] / (1.0 - xi_ap) - f     + gamma * epsilon * R_H(t) * SV[0] + Phi;
	next_SV[2]   *= (1-xi_ap);

	return next_SV;
}




array<double,3> Model::runge_kutta4(double dt, double t, array<double,3> SV){
	/* Performs a runge kutta timestep with the dgl function
	Parameter
	---------
	dt:
		timestep length
	t:
		time for timestep start
	SV:
		state vector
	*/

	//Calc first step
	k_1 = dgl(t,SV);

	//Prep new state vector and calc second step
	for (int i = 0; i < 3; ++i)
	{
		k_2_SV[i] = SV[i] + k_1[i] * dt / 2.0;
	}
	k_2 = dgl(t + dt / 2.0, k_2_SV);

	//Prep new state vector and calc third step
	for (int i = 0; i < 3; ++i)
	{
		k_3_SV[i] = SV[i] + k_2[i] * dt / 2.0;
	}
	k_3 = dgl(t + dt / 2.0, k_3_SV);

	//Prep new state vector and calc forth step
	for (int i = 0; i < 3; ++i)
	{
		k_4_SV[i] = SV[i] + k_3[i] * dt;
	}
	k_4 = dgl(t + dt, k_4_SV);


	//CALC return value
	array<double,3> next_SV;
	for (int i = 0; i < 3; ++i)
	{
		next_SV[i] = SV[i] + dt / 6.0 * (k_1[i] + 2.0 *  k_2[i] + 2.0 * k_3[i] + k_4[i]);
	}	

	return next_SV;
}


// ---------------------------------------------------------------------------- //
// Communication with javascript
// ---------------------------------------------------------------------------- //

void Model::run(double dt, double t_max) {

	data.T.clear();
	data.H.clear();
	data.H_S.clear();
	data.time.clear();

	array<double,3> SV = {20.0,0.0,0.0};
	data.T.push_back(SV[0]);
	data.H.push_back(SV[1]);
	data.H_S.push_back(SV[2]);
	for (double t = 0; t < t_max; t=t+dt)
	{
		SV = runge_kutta4(dt,t,SV);

		data.time.push_back(t);
		data.T.push_back(SV[0]);
		data.H.push_back(SV[1]);
		data.H_S.push_back(SV[2]);
	}

}


void Model::get_data(double* in_data){
	//Write data onto long data array has to be spliced in js
	for (int i = 0; i < data.T.size(); ++i)
	{
		in_data[i] = data.T[i];
	}
	for (int i = 0; i < data.H.size(); ++i)
	{
		in_data[data.T.size()+i] = data.H[i];
	}
	for (int i = 0; i < data.T.size(); ++i)
	{
		in_data[data.T.size()+data.H.size()+i] = data.H_S[i];
	}
}


EMSCRIPTEN_BINDINGS(external_constructors) {

  // register bindings for double vector
  register_vector<double>("vector<double>"); //This is not need but i find it quite interessting

	// register bingins for my data struct
	class_<mydata_struct>("mydata_struct")
		.constructor<>()
		.function("time",&mydata_struct::gettime)
		.function("T",&mydata_struct::getT)
		.function("H",&mydata_struct::getH)
		.function("H_S",&mydata_struct::getH_S)
		;

  class_<Model>("Model")
    .constructor<>()
    .function("run", &Model::run)
    .function("get_data",&Model::get_data, allow_raw_pointers())

    //Alot of parameters here
		.property("M",&Model::getM,&Model::setM)
		.property("R_0",&Model::getR_0,&Model::setR_0)
		.property("R_t_H",&Model::getR_t_H,&Model::setR_t_H)
		.property("gamma",&Model::getgamma,&Model::setgamma)
		.property("xi",&Model::getxi,&Model::setxi)
		.property("phi",&Model::getphi,&Model::setphi)
		.property("nu",&Model::getnu,&Model::setnu)
		.property("lambda_r",&Model::getlambda_r,&Model::setlambda_r)
		.property("lambda_s",&Model::getlambda_s,&Model::setlambda_s)
		.property("eta",&Model::geteta,&Model::seteta)
		.property("n_max",&Model::getn_max,&Model::setn_max)
		.property("epsilon",&Model::getepsilon,&Model::setepsilon)
		.property("Phi",&Model::getPhi,&Model::setPhi)
		.property("lambda_r_max",&Model::getlambda_r_max,&Model::setlambda_r_max)
		.property("xi_ap",&Model::getxi_ap,&Model::setxi_ap)
		.property("data",&Model::data)
    ;

  
}

/*
Python snippet for generating the property strings:

vars = ["M","R_0","R_t_H","gamma","xi","phi","nu","lambda_r","lambda_s","eta","n_max","epsilon","Phi","lambda_r_max","xi_ap"]
for var in vars:
  print(f'.property("{var}",&Model::get{var},&Model::set{var})')
*/


int main() {

  return 0;
}