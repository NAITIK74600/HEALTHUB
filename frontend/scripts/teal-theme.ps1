$path = "E:\batla medico\batla-medicos\frontend\src\index.css"
$txt = [System.IO.File]::ReadAllText($path)

# Brand green -> teal-green map (hex, case-insensitive). Does NOT touch #27AE60 (kept as success/blend green).
$map = [ordered]@{
  '6FA82E' = '1ABC9C'
  '4F8C28' = '16A085'
  '3E6B1A' = '117A65'
  '2E5214' = '0E6655'
  '5A8F25' = '138D75'
  '1B8843' = '16A085'
  '274316' = '0E6655'
  'BFE29A' = 'A0E7D8'
  '68D391' = '4FD1C5'
  '8BC34A' = '2ECABF'
  'EAF4DD' = 'E8F8F5'
}
foreach ($k in $map.Keys) {
  $txt = [System.Text.RegularExpressions.Regex]::Replace($txt, [regex]::Escape($k), $map[$k], 'IgnoreCase')
}
# rgba leaf-green -> teal
$txt = $txt.Replace('111,168,46', '26,188,156')

[System.IO.File]::WriteAllText($path, $txt, (New-Object System.Text.UTF8Encoding($false)))
Write-Output "Done. Bytes: $($txt.Length)"
