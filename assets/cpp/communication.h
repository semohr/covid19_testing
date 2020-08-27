#pragma once
#include "data.h"
#include "model.h"
#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>
using namespace emscripten;


EMSCRIPTEN_BINDINGS(data) {
	class_<data_struct>("data_struct")
		.constructor()

		.function("time",&data_struct::gettime)
		//Total pools
		.function("T",&data_struct::getT)
		.function("H",&data_struct::getH)

		//Symptomatic pools
		.function("T_S",&data_struct::getT_S)
		.function("H_S",&data_struct::getH_S)

		//Asymptomatic pools
		.function("T_A",&data_struct::getT_A)
		.function("H_A",&data_struct::getH_A)

		//New cases
		.function("N",&data_struct::getN)
		.function("N_obs",&data_struct::getN_obs)
		
		//Reproduction number
		.function("R_t_obs",&data_struct::getR_t_obs)
		.function("R_t_eff",&data_struct::getR_t_eff)
		;

}

// ---------------------------------------------------------------------------- //
// MODEL
// ---------------------------------------------------------------------------- //

EMSCRIPTEN_BINDINGS(model) {
	class_<Model>("Model")
		.constructor<>()

		//Main entry point
		.function("run",select_overload<void(double,double,double,double)>(&Model::run))

		//Link to our data defined above
		.property("data",&Model::data)

		//Vars
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
		.property("data",&Model::data);
}