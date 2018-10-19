# Send coverage report from node 6 builds of any branch

#MAKECC = $(TRAVIS_BRANCH) $(TRAVIS_NODE_VERSION)
CURBUILD = $(TRAVIS_NODE_VERSION)
REQBUILD = "6.0"

setup_cover:
ifeq ($(CURBUILD),$(REQBUILD))
  @ npm i -g nyc codecov
else
	@ echo Coverage will be sent in $(REQBUILD)
endif

run_test:
ifeq ($(CURBUILD),$(REQBUILD))
	@ yarn travis
else
	@ yarn lint
	@ yarn test
endif

send_cover:
ifeq ($(CURBUILD),$(REQBUILD))
	@ codecov -f coverage/*.json
endif

.PHONY: setup_cover send_cover
