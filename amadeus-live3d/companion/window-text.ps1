# Text of one window through Windows UI Automation, for the companion's voice messages:
#   window-text.ps1 <hwnd>  ->  {"title": "...", "app": "...", "text": "..."}
# Reads element names and the text of editors / documents / terminals, at most ~1.5 s and
# ~2500 characters, so a phrase to the agent carries what is on the screen without a screenshot.
param([long]$hwnd)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes
$A = [System.Windows.Automation.AutomationElement]
$out = [ordered]@{ title = ''; app = ''; text = '' }
try {
  $root = $A::FromHandle([IntPtr]$hwnd)
  $out.title = $root.Current.Name
  try { $out.app = (Get-Process -Id $root.Current.ProcessId).ProcessName } catch {}
  $seen = New-Object 'System.Collections.Generic.HashSet[string]'
  $parts = New-Object System.Collections.Generic.List[string]
  $len = 0
  $sw = [Diagnostics.Stopwatch]::StartNew()
  $walker = [System.Windows.Automation.TreeWalker]::ControlViewWalker
  $queue = New-Object System.Collections.Generic.Queue[object]
  $queue.Enqueue($root)
  $count = 0
  $docs = 0
  while ($queue.Count -gt 0 -and $sw.ElapsedMilliseconds -lt 1500 -and $len -lt 2500 -and $count -lt 600) {
    $el = $queue.Dequeue(); $count++
    $c = $el.Current
    $type = $c.ControlType.ProgrammaticName
    $txt = ''
    if ($docs -lt 3 -and ($type -match 'Document|Edit')) {
      try {
        $tp = $el.GetCurrentPattern([System.Windows.Automation.TextPattern]::Pattern)
        $txt = $tp.DocumentRange.GetText(1500); $docs++
      } catch {
        try { $vp = $el.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern); $txt = $vp.Current.Value } catch {}
      }
    }
    if (-not $txt -and $c.Name -and $c.Name.Length -gt 1 -and $type -notmatch 'Button|MenuItem|TabItem|ScrollBar|Thumb|Image|Separator') { $txt = $c.Name }
    if ($txt) {
      $t = ($txt -replace '\s+', ' ').Trim()
      if ($t.Length -gt 1 -and $seen.Add($t) -and $t -ne $out.title) {
        if ($t.Length -gt 1500) { $t = $t.Substring($t.Length - 1500) }   # the end of a log / terminal is the interesting part
        $parts.Add($t); $len += $t.Length
      }
    }
    if ($type -match 'Document') { continue }                                 # its text is read already
    $ch = $walker.GetFirstChild($el)
    while ($ch -ne $null) { $queue.Enqueue($ch); $ch = $walker.GetNextSibling($ch) }
  }
  $out.text = ($parts -join ' | ')
  if ($out.text.Length -gt 2500) { $out.text = $out.text.Substring(0, 2500) }
} catch { $out.error = $_.Exception.Message }
[Console]::Out.WriteLine(($out | ConvertTo-Json -Compress))
