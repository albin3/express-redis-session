
test:
	@npm install
	@redis-server &
	@./node_modules/mocha/bin/mocha

.PHONY: test watch install cov run dev
