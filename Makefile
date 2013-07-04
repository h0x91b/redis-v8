# Top level makefile, the real shit is at src/Makefile

default: all

.DEFAULT:
	cd redis && $(MAKE) $@

install:
	cd redis && $(MAKE) $@

.PHONY: install
