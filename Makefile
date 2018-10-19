# Send coverage report from node 6 builds of any branch

#MAKECC = $(TRAVIS_BRANCH) $(TRAVIS_NODE_VERSION)
CURBUILD = $(TRAVIS_NODE_VERSION)
REQBUILD = "6.0"

setup_cover:
ifeq ($(CURBUILD),$(REQBUILD))
  @ npm i -g nyc codecov
	@ curl -L https://codeclimate.com/downloads/test-reporter/test-reporter-latest-linux-amd64 > ./cc-test-reporter
	@ chmod +x ./cc-test-reporter
	@ ./cc-test-reporter before-build
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
	@ ./cc-test-reporter after-build --exit-code $(TRAVIS_TEST_RESULT)
endif

.PHONY: setup_cover send_cover
