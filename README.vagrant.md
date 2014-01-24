# Work on mdn-compat-importer from the same VM setup

This workspace leverages Vagrant plugin system to install in a blank Ubuntu virtual machine Salt Stack and 
executes it to mimick a typical environment for nodejs development.

It is intended to replicate current production setup for the [WebPlatform.org](http://webplatform.org) project on a **NodeJS environment**.

File sharing with Vagrant works best with Linux and Mac OS X. 

You can code from your local host computer, but get SSH access to the environment and 
run the same dependencies.

## To use

1. Have [Vagrant](http://www.vagrantup.com/) and [VirtualBox](https://www.virtualbox.org/) 
2. installed
2. Make sure you have **salty vagrant** as a Vagrant plugin, or run


    vagrant gem install vagrant-salt


2. Boot up the VM


    vagrant up


First bootup is longer because it installs everything, see in 
file `saltstack/roots/salt/top.sls` this is where Salt stack 
starts working from.


## Dependencies

* Vagrant 2.x
* VirtualBox


## To start working

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