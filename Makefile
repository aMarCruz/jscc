# Send coverage report from node 6 builds of any branch

CURBUILD = $(TRAVIS_NODE_VERSION)
REQBUILD = "6.0.0"

setup_cover:
ifeq ($(CURBUILD),$(REQBUILD))
	@ npm i -g codecov
else
	@ echo Sin accion
endif

send_cover:
ifeq ($(CURBUILD),$(REQBUILD))
	@ echo Sending coverage report...
	@ yarn coverage && codecov
	@ echo The report was sent.
else
	@ echo The coverage report will be sent in $(REQBUILD)
endif

.PHONY: setup_cover send_cover
