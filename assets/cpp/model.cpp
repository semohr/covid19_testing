#include "model.h"

Model::Model(){
	//Constructor
	//Set default values
	M     			= 80000000;
	R_0   			= 3.28;
	R_t_H 			= 1.8;
	gamma 			= 0.1;
	xi    			= 0.15;
	phi   			= 0.2;
	nu    			= 0.10;
	lambda_r 		= 0.0;
	lambda_s 	   	= 0.1;
	eta          	= 0.66;
	n_max        	= 300;
	epsilon      	= 0.1;
	Phi          	= 15.0;
 	lambda_r_max 	= 0.002;
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


double gamma_pdf(double x,double a,double b){
	return pow(x,a-1.0)*exp(-x)/tgamma(a);
}

vector<double> convolve(const vector<double>& a, const vector<double>& b)
{
    int n_a = a.size();
    int n_b = b.size();
    vector<double> result(n_a + n_b - 1);

    for (int i = 0; i < n_a + n_b - 1; ++i) {
        double sum = 0.0;
        for (int j = 0; j <= i; ++j) {
            sum += ((j < n_a) && (i-j < n_b)) ? a[j]*b[i-j] : 0.0;
        }
        result[i] = sum;
    }
    return result;
}


void Model::calc_new_cases_obs(){
	//Only works if the model was run atleast once! There is no check for this!
	vector<double> first_part;
	vector<double> second_part;
	double gamm_pdf;

	for (int i = 0; i < data.time.size(); ++i)
	{
		first_part.push_back( gamma * nu * R_t_T() * data.T[i]
			+ lambda_s * data.H_S[i]
			+ lambda_r * data.H[i]
			+ fmin(n_max,eta*R_t_H*(lambda_s*data.H_S[i] + lambda_r * data.H[i])));
	}

	// For gamma kernel we need approx 11days
	double dt_in_days = 12/_dt;
	for (int i = 0; i < dt_in_days; i++){
		cout << data.time[i] << endl;
		gamm_pdf = gamma_pdf(data.time[i],4.0,1.0);
		second_part.push_back(gamm_pdf);
	}
	//Normalize pdf
	double sum = 0.0;
	for (int i = 0; i < second_part.size(); ++i)
	{
		sum += second_part[i];
	}
	for (int i = 0; i < second_part.size(); ++i)
	{
		second_part[i] = second_part[i]/sum;
		cout << second_part[i] << endl;
	}

	data.N_obs = convolve(first_part,second_part);
	//We remove from the front the half size of conv. fromthe vector
	data.N_obs.erase(data.N_obs.end()-int(dt_in_days),data.N_obs.end());
}



void Model::calc_R_t_obs(){
	double t;
	int i,j;
	bool found;
	for (i = 0; i < data.time.size(); ++i)
	{
		t = data.time[i];
		//Get t-4
		found = false;
		for (j = i; j > -1; j--)
		{
			if (data.time[j]<=t-4.0)
			{
				found = true;
				break; //j found
			}
		}
		if (found)
		{
			data.R_t_obs.push_back(data.N_obs[i]/data.N_obs[j]);
		}
	}
}

void Model::calc_R_t_eff(){
	double t;
	int i,j;
	bool found;
	for (i = 0; i < data.time.size(); ++i)
	{
		t = data.time[i];
		//Get t-4
		found = false;
		for (j = i; j > -1; j--)
		{
			if (data.time[j]<=t-4.0)
			{
				found = true;
				break; //j found
			}
		}
		if (found)
		{
			data.R_t_eff.push_back(data.N[i]/data.N[j]);
		}
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

void Model::run(double dt, double t_max, double T_0, double H_0){
	double T_S = (1-xi_ap())*T_0;
	double T_A = xi_ap()* T_0;
	double H_S = (1-xi_ap())*H_0;
	double H_A = xi_ap()*H_0;

	run(dt,t_max,T_S,T_A,H_S,H_A);
}
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

	_dt = dt;
	_t_max = t_max; 

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
	for (double t = dt; t < t_max; t=t+dt)
	{
		SV = runge_kutta4(dt,t,SV);
		push_to_data(t,SV);
	}


	// Calc addittional stuff
	calc_new_cases();
	calc_new_cases_obs();

	calc_R_t_obs();
	calc_R_t_eff();

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

