CC = em++
CFLAGS = -Wall -O2
EXPORTED_FUNCTIONS = ""
all: model.wasm

model.wasm: model.cpp
	$(CC) model.cpp $(CFLAGS) -s WASM=1 -s EXPORTED_FUNCTIONS='[$(EXPORTED_FUNCTIONS)]' -o model.js --bind -s ASSERTIONS=1 -s ALLOW_MEMORY_GROWTH=1

clean:
	rm model.wasm