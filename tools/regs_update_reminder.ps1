# Biweekly reminder to refresh the Mangalam regulations hub.
# Registered as Scheduled Task "Mangalam-RegsUpdate". Shows a prompt and opens the
# runbook. Does NOT run any update itself (updates need your command).
Add-Type -AssemblyName System.Windows.Forms | Out-Null
$runbook = "C:\Users\Mangalam\Mangalam_Website\content\REGULATIONS-UPDATE.md"
$msg = "Time to refresh the regulations hub.`n`n" +
       "- Pull new DGMS circulars / notifications / gazette amendments`n" +
       "- Re-index the Circular Finder`n" +
       "- Fold new docs into the catalogue, re-seed Supabase, deploy`n" +
       "- (Monthly) update the NCI coking sub-index`n`n" +
       "Opening the runbook. To stop these reminders:`n" +
       "  schtasks /Change /TN Mangalam-RegsUpdate /DISABLE"
[System.Windows.Forms.MessageBox]::Show($msg, "Mangalam - Regulations refresh due", 'OK', 'Information') | Out-Null
if (Test-Path $runbook) { Start-Process $runbook }
