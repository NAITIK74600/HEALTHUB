$path = "E:\batla medico\batla-medicos\frontend\src\index.css"
$txt = [System.IO.File]::ReadAllText($path)

# Old brand crimson -> teal (hex)
$map = [ordered]@{
  'C0392B' = '1ABC9C'
  '922B21' = '16A085'
  '6E0F0F' = '0E6655'
  'E74C3C' = '1ABC9C'
  'FC8181' = '7FE3D4'
  'fff8f8' = 'f0fbf9'
  'fff5f5' = 'f0fbf9'
  'fff0f0' = 'e8f8f5'
  'fef2f2' = 'e8f8f5'
  'fdecea' = 'e8f8f5'
}
foreach ($k in $map.Keys) {
  $txt = [System.Text.RegularExpressions.Regex]::Replace($txt, [regex]::Escape($k), $map[$k], 'IgnoreCase')
}
# rgba crimson -> teal
$txt = $txt.Replace('192,57,43', '26,188,156')
$txt = $txt.Replace('231,76,60', '26,188,156')

[System.IO.File]::WriteAllText($path, $txt, (New-Object System.Text.UTF8Encoding($false)))
Write-Output "Done. len=$($txt.Length)"
