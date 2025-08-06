{ pkgs }:

{
  # This defines the packages available in your environment
  packages = [
    pkgs.nodejs_20
    pkgs.zulu
    pkgs.gh
    pkgs.direnv
  ];

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
