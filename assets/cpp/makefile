CC = em++
CFLAGS = -Wall -O2
EXPORTED_FUNCTIONS = ""

all: communication.cpp model.cpp 
	$(CC) model.cpp communication.cpp $(CFLAGS) -s WASM=1 -s EXPORTED_FUNCTIONS='[$(EXPORTED_FUNCTIONS)]' -o ../js/model.js --bind

clean:
	rm model.wasm