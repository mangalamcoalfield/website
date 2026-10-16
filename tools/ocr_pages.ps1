# OCR every PNG in -InDir with the Windows built-in OCR engine (Windows.Media.Ocr),
# writing <name>.txt next to it. No third-party software or downloads needed.
# Used by tools/build_circular_corpus.py for the scanned pages of the DGMS
# circular compilations. Skips images that already have a .txt, so it resumes.
param([Parameter(Mandatory)][string]$InDir)

Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
  $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Await($op, [Type]$type) {
  $t = $asTaskGeneric.MakeGenericMethod($type).Invoke($null, @($op))
  $t.Wait(-1) | Out-Null
  $t.Result
}
[void][Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
[void][Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
[void][Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics, ContentType = WindowsRuntime]
[void][Windows.Globalization.Language, Windows.Globalization, ContentType = WindowsRuntime]

$lang = [Windows.Globalization.Language]::new('en-US')
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($lang)
if (-not $engine) { throw 'Windows OCR engine for en-US is not available' }

$files = Get-ChildItem -LiteralPath $InDir -Filter *.png | Sort-Object Name
$done = 0
foreach ($f in $files) {
  $out = [IO.Path]::ChangeExtension($f.FullName, '.txt')
  if (Test-Path -LiteralPath $out) { continue }
  $sf  = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($f.FullName)) ([Windows.Storage.StorageFile])
  $st  = Await ($sf.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
  $dec = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($st)) ([Windows.Graphics.Imaging.BitmapDecoder])
  $bmp = Await ($dec.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
  $res = Await ($engine.RecognizeAsync($bmp)) ([Windows.Media.Ocr.OcrResult])
  $text = ($res.Lines | ForEach-Object { $_.Text }) -join "`n"
  [IO.File]::WriteAllText($out, $text, (New-Object Text.UTF8Encoding $false))
  $st.Dispose(); $bmp.Dispose()
  $done++
  if ($done % 25 -eq 0) { "ocr: $done done" }
}
"ocr: finished, $done new page(s)"
