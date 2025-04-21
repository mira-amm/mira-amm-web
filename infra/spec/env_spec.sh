figlet -cf slant "💊 Mira Dev Doctor"

# fastfetch -c all.jsonc

Describe "📦 Pnpm should be:"
It "installed via standalone script only"
When run which pnpm
The status should be success
The line 3 should be undefined
End

It "version 10.8.1"
When run pnpm --version
The status should be success
The output should equal '10.8.1'
End
End

It "🟢 Node.js should be version 22.13.1, and managed by Pnpm"
When run which node
The status should be success
The output should end with '/pnpm/nodejs/22.13.1/bin/node'
End

Describe "🎭 Playwright should be:"
It "version 1.51.1"
When run playwright --version
The status should be success
The output should include '1.51.1'
End

It "installed by Pnpm"
When run which playwright
The status should be success
The output should end with '/node_modules/.bin/playwright'
End
End

It "❄ Nix version should be 2.25.3"
When run nix --version
The status should be success
The output should include '2.25.3'
End

It "🐍 uv version should be 0.4.30, and installed by Nix"
When run which uv
The status should be success
The output should start with '/nix/store'
The output should include '0.4.30'
End

It "🌈 Terminal should support color output"
When run echo $TERM
The status should be success
The output should equal 'xterm-256color'
End

It "🔑 SENTIO_API_KEY should be defined and present"
The value "$SENTIO_API_KEY" should be defined
The value "$SENTIO_API_KEY" should be present
End

It "APP_DEV_SERVER_PORT should not be running"
When run nc -zv localhost $APP_DEV_SERVER_PORT
The status should be failure
The error should include 'Connection refused'
End

It "STORYBOOK_DEV_SERVER_PORT should not be running"
When run nc -zv localhost $STORYBOOK_DEV_SERVER_PORT
The status should be failure
The error should include 'Connection refused'
End

It "DOCS_DEV_SERVER_PORT should not be running"
When run nc -zv localhost $DOCS_DEV_SERVER_PORT
The status should be failure
The error should include 'Connection refused'
End

It "ARCHITECTURE_DEV_SERVER_PORT should not be running"
When run nc -zv localhost $ARCHITECTURE_DEV_SERVER_PORT
The status should be failure
The error should include 'Connection refused'
End

It "GRAPH_DEV_SERVER_PORT should not be running"
When run nc -zv localhost $GRAPH_DEV_SERVER_PORT
The status should be failure
The error should include 'Connection refused'
End
