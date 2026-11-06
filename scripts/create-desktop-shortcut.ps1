$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
$executable = Join-Path $project 'out\burmese-voice-win32-x64\burmese-voice.exe'
if (-not (Test-Path $executable)) {
  throw 'Packaged application is missing. Run npm run package first.'
}
$desktop = [Environment]::GetFolderPath('Desktop')
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut((Join-Path $desktop 'Burmese Voice.lnk'))
$shortcut.TargetPath = $executable
$shortcut.WorkingDirectory = Split-Path -Parent $executable
$shortcut.IconLocation = "$executable,0"
$shortcut.Description = 'Burmese and English voice typing'
$shortcut.Save()
Write-Host "Created desktop shortcut: $desktop\Burmese Voice.lnk"
