{
  tasks = {
    "myapp:mytask" = {
      exec = ''
        echo $DEVENV_TASK_INPUTS> $DEVENV_ROOT/input.json
        echo '{ "output": 1 }' > $DEVENV_TASK_OUTPUT_FILE
        echo $DEVENV_TASKS_OUTPUTS > $DEVENV_ROOT/outputs.json
      '';
      input = {
        value = 1;
      };
    };
  };
}
