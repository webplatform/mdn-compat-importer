## To build workspace

Once every Vagrant/Salt stack dependencies are installed, you can boot the workspace.

1. Run vagrant up

    vagrant up

  NOTE: It is OK, if it throws an error "Minion failed to authenticate". This is due to the fact that it is masterless but doesn't make us unable to use
2. Login to the new machine

    vagrant ssh

3. Run again salt as root

    sudo salt-call --local state.highstate

4. You are done. Start working

    cd /vagrant

See README.md for further details.