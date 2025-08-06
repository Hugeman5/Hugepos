{ pkgs }:

{
  # This defines the shell environment
  shell = pkgs.mkShell {
    packages = [
      pkgs.nodejs_20
      pkgs.zulu
      pkgs.gh
      pkgs.direnv
    ];

    env = {
      NODE_ENV = "development";
    };
  };

  # Required to enable preview in Firebase Studio
  idx = {
    previews = {
      enable = true;
      previews = {
        web = {
          command = [ "npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0" ];
          manager = "web";
        };
      };
    };
  };
}
