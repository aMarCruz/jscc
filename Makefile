
MAKECC = $(TRAVIS_BRANCH) $(TRAVIS_NODE_VERSION)

sendcover:
ifeq ($(MAKECC),master 4.2)
	@ npm install codeclimate-test-reporter
	@ codeclimate-test-reporter < coverage/lcov.info
else
	@ echo Coverage will be send in master 4.2
endif

.PHONY: sendcover
