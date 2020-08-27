#pragma once
#include <vector>
#include <array>
#include <emscripten/val.h>
using namespace emscripten;
using namespace std;

struct data_struct{
	vector<double> time;

	//Total pools
	vector<double> H; //Total hidden pool
	vector<double> T; //Total Traced pool

	//Symptomatic pools
	vector<double> H_S;
	vector<double> T_S; 

	//Asymptomatic pools
	vector<double> H_A; 
	vector<double> T_A; 

	//New cases
	vector<double> N;
	vector<double> N_obs;

	//Reproduction number
	vector<double> R_t_obs;
	vector<double> R_t_eff;

	void clear(){
		time.clear();
		H.clear();
		T.clear();
		H_S.clear();
		T_S.clear();
		H_A.clear();
		T_A.clear();
		N.clear();
		N_obs.clear();
		R_t_obs.clear();
		R_t_eff.clear();
	};

	//Declaration in communication cpp
	val gettime();

	//Total pools
	val getT();
	val getH();

	//Symptomatic pools
	val getT_S();
	val getH_S();

	//Asymptomatic pools
	val getT_A();
	val getH_A();

	//New cases
	val getN();
	val getN_obs();

	//New cases
	val getR_t_obs();
	val getR_t_eff();
};