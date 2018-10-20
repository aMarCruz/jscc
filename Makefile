# Send coverage report from node 6 builds of any branch

#MAKECC = $(TRAVIS_BRANCH) $(TRAVIS_NODE_VERSION)
CURBUILD = $(TRAVIS_NODE_VERSION)
REQBUILD = "6.0"

setup_cover:
ifeq ($(CURBUILD),$(REQBUILD))
  @ npm i -g nyc codecov
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
	@ echo Sending coverage report...
	@ codecov -f coverage/*.json
	@ echo The report was sent.
else
	@ echo The coverage report will be sent in $(REQBUILD)
endif

.PHONY: setup_cover run_test send_cover
