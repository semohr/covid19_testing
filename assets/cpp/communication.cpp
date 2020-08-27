#include "communication.h"
//Add to data class to retrieve

val data_struct::gettime(){
	double* a= &time[0];
	return val(typed_memory_view(time.size(),a));
};


//Total pools
val data_struct::getT(){
		double* a = &T[0]; //since C++0x vectors elemnts are contiguous in memory
		return val(typed_memory_view(T.size(),a));
}
val data_struct::getH(){
		double* a = &H[0]; 
		return val(typed_memory_view(H.size(),a));
}


//Symptomatic pools
val data_struct::getT_S(){
	double* a = &T_S[0];
	return val(typed_memory_view(T_S.size(),a));
}
val data_struct::getH_S(){
	double* a = &H_S[0];
	return val(typed_memory_view(H_S.size(),a));
}


//Asymptomatic pools
val data_struct::getT_A(){
	double* a = &T_A[0];
	return val(typed_memory_view(T_A.size(),a));
}
val data_struct::getH_A(){
	double* a = &H_A[0];
	return val(typed_memory_view(H_A.size(),a));
}


//New cases
val data_struct::getN(){
	double* a = &N[0];
	return val(typed_memory_view(N.size(),a));
}
val data_struct::getN_obs(){
	double* a = &N_obs[0];
	return val(typed_memory_view(N_obs.size(),a));	
}


//Reproduction number
val data_struct::getR_t_obs(){
	double* a = &R_t_obs[0];
	return val(typed_memory_view(R_t_obs.size(),a));
}
val data_struct::getR_t_eff(){
	double* a = &R_t_eff[0];
	return val(typed_memory_view(R_t_eff.size(),a));	
}
