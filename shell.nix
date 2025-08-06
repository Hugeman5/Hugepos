{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
    pkgs.nodejs_20
    pkgs.firebase-tools
    pkgs.gh
    pkgs.direnv
    pkgs.zulu
  ];
}
