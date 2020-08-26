#pragma once
#include "data.h"
#include <vector>
#include <array>
#include <iostream>
#include <cmath>
using namespace std;

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

		//data
	  data_struct data;
		// ---------------------------------------------------------------------------- //
		// Functions
		// ---------------------------------------------------------------------------- //
		Model(); //Constructor
		~Model(); //Deconstructor
		void run(double dt, double t_max, double T_S, double T_A, double H_S, double H_A); //Main entry point also passed to js
		void get_data(double* in_data);

	private:
		array<double,4> runge_kutta4(double dt, double t, array<double,4> SV);
		array<double,4> dgl(double t, array<double,4> SV);
		void push_to_data(double t, array<double,4> SV);

		void calc_new_cases();
		void calc_new_cases_obs();
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

		//calculatable from the above
		double R_t_T(); //Reproduction number (traced)
		double xi_ap(); //Apparent asymptomatic ratio
		double N_max(); //Max. tracing capacity of daily new cases
		double R_H(double t); //Maybe remove at later point

		// ---------------------------------------------------------------------------- //
		// Addittional vars (mainly for memory efficency)
		// ---------------------------------------------------------------------------- //		
		array<double,4> k_1;
		array<double,4> k_2;
		array<double,4> k_3;
		array<double,4> k_4;
		array<double,4> k_2_SV;
		array<double,4> k_3_SV;
		array<double,4> k_4_SV;	
};