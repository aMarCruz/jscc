
MAKECC = $(TRAVIS_BRANCH) $(TRAVIS_NODE_VERSION)

sendcover:
ifeq ($(MAKECC),master 6.0)
	@ npm install codeclimate-test-reporter
	@ codeclimate-test-reporter < coverage/lcov.info
else
	@ echo Coverage will be send in master 6.0
endif

.PHONY: sendcover
