nvm-clone:
  git.latest:
    - name: https://github.com/creationix/nvm.git
    - rev: master
    - user: root
    - target: /srv/nvm
    - always_fetch: False
    - force: True
    - required_in:
      - file: /etc/profile.d/nvm.sh
      - file: nvm-dir
      - pkg: git

nvm-dir:
  file.directory:
    - name: /srv/nvm
    - user: vagrant
    - group: admin
    - recurse:
      - user
      - group
      - mode

/etc/profile.d/nvm.sh:
  file.managed:
    - source: salt://nvm/files/nvm.sh
    - mode: 755

nvm-requirements:
  pkg.installed:
    - names:
      - curl