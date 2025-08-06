{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  packages = with pkgs; [ nodejs_20 gh ];
  env = { NODE_ENV = "development"; };
}
