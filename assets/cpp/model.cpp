#include "model.h"

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
}
Model::~Model() {
	std::cout << "Deconstructor" << std::endl;
	data.clear();
}

// ---------------------------------------------------------------------------- //
// vars
// ---------------------------------------------------------------------------- //
double Model::R_H(double t){
	/*Returns Reproduction number R at time t*/
	return R_t_H;
}

double Model::R_t_T(){
	return (nu+epsilon)*R_t_H;
}

double Model::xi_ap(){
	return xi+(1-xi)*phi;
}

double Model::N_max(){
	return n_max /(eta*R_t_H) * (1+eta*R_t_H)/(1-nu*R_t_H);
}

void Model::calc_new_cases(){
	//Only works if the model was run atleast once! There is no check for this!
	for (int i = 0; i < data.time.size(); i++){
		data.N.push_back(gamma * R_t_T() * data.T[i] + gamma*R_t_H*data.H[i] + Phi);
	}
}



// ---------------------------------------------------------------------------- //
// dgl stuff 
// ---------------------------------------------------------------------------- //
array<double,4> Model::dgl(double t, array<double,4> SV){
	/*
	DGL for runge kutta i.e our model equations

	Parameters
	----------
	t:
		time
	SV:
		State Vector containing
		double T_S, double T_A, double H_S, double H_A

	*/
	array<double,4> next_SV;

	//Helper
	double f = fmin(n_max, eta * R_H(t) * (lambda_s * (SV[2]) + lambda_r * (SV[2]+SV[3])));
	double x_ap = xi_ap();
	//Equations

	next_SV[0] = (1-x_ap)*nu*gamma*R_t_H*(SV[0]+SV[1])-gamma*SV[0]+(lambda_s+lambda_r)*SV[2]+(1-x_ap)*f;
	next_SV[1] = x_ap*nu*gamma*R_t_H*(SV[0]+SV[1])-gamma*SV[1]+lambda_r*SV[3]+x_ap*f;
	next_SV[2] = (1-x_ap)*(epsilon*gamma*R_t_H*(SV[0]+SV[1])+gamma*R_t_H*(SV[2]+SV[3]))-(1-x_ap)*f-(lambda_s+lambda_r+gamma)*SV[2]+Phi*(1-x_ap);
	next_SV[3] = x_ap*(epsilon*gamma*R_t_H*(SV[0]+SV[1])+gamma*R_t_H*(SV[2]+SV[3]))-x_ap*f-(lambda_r+gamma)*SV[3]+Phi*x_ap;

	return next_SV;
}

array<double,4> Model::runge_kutta4(double dt, double t, array<double,4> SV){
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
	for (int i = 0; i < 4; ++i)
	{
		k_2_SV[i] = SV[i] + k_1[i] * dt / 2.0;
	}
	k_2 = dgl(t + dt / 2.0, k_2_SV);

	//Prep new state vector and calc third step
	for (int i = 0; i < 4; ++i)
	{
		k_3_SV[i] = SV[i] + k_2[i] * dt / 2.0;
	}
	k_3 = dgl(t + dt / 2.0, k_3_SV);

	//Prep new state vector and calc forth step
	for (int i = 0; i < 4; ++i)
	{
		k_4_SV[i] = SV[i] + k_3[i] * dt;
	}
	k_4 = dgl(t + dt, k_4_SV);


	//CALC return value
	array<double,4> next_SV;
	for (int i = 0; i < 4; ++i)
	{
		next_SV[i] = SV[i] + dt / 6.0 * (k_1[i] + 2.0 *  k_2[i] + 2.0 * k_3[i] + k_4[i]);
	}	

	return next_SV;
}


// ---------------------------------------------------------------------------- //
// MAIN ENTRY POINT
// ---------------------------------------------------------------------------- //

void Model::run(double dt, double t_max, double T_S, double T_A, double H_S, double H_A) {
	/* Runs model and populates the data arrays!
	
	Parameters
	----------
	dt: 
		Size of timestep
	t_max:
		At wich time t to stop the simulation
	T_S:
		initial T_S value
	T_A:
		initial T_A value
	H_S:
		initial H_S value
	H_A:
		initial H_A value
	*/


	// Clear old data
	data.clear();


	// Initial values
	array<double,4> SV;
	SV[0] = T_S;
	SV[1] = T_A;
	SV[2] = H_S;
	SV[3] = H_A;
	push_to_data(0.0,SV);


	// RungeKutta run 
	for (int t = dt; t < t_max; t=t+dt)
	{
		SV = runge_kutta4(dt,t,SV);
		push_to_data(t,SV);
	}


	// Calc addittional stuff
	calc_new_cases();

}

void Model::push_to_data(double time, array<double,4> SV){
	data.T_S.push_back(SV[0]);
	data.T_A.push_back(SV[1]);
	data.H_S.push_back(SV[2]);
	data.H_A.push_back(SV[3]);

	data.T.push_back(SV[0]+SV[1]);
	data.H.push_back(SV[2]+SV[3]);

	data.time.push_back(time);
}