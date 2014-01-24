nvm-env-bootstrap:
  cmd.wait:
    - names:
        - source /etc/profile.d/nvm.sh
    - require:
      - file: /etc/profile.d/nvm.sh
      - git: nvm-clone

# Use NVM to obtain latest node versions and choose one to use.

node:
  cmd.wait:
    - names:
      - nvm install 0.10
      - nvm use 0.10
    - cwd: /vagrant
    - require:
      - cmd: nvm-env-bootstrap

project-deps:
  npm.installed:
    - name: grunt-cli