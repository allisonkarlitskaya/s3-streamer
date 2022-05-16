bots:
	test -L ~/.config/cockpit-dev/bots && ln -sft . ~/.config/cockpit-dev/bots || \
		git checkout https://github.com/cockpit-project/bots
