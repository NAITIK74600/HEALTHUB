$files = @(
  "E:\batla medico\batla-medicos\frontend\index.html",
  "E:\batla medico\batla-medicos\frontend\src\App.jsx",
  "E:\batla medico\batla-medicos\frontend\src\components\PromoVideo.jsx",
  "E:\batla medico\batla-medicos\frontend\src\pages\Home.jsx",
  "E:\batla medico\batla-medicos\frontend\src\pages\admin\AdminCategories.jsx",
  "E:\batla medico\batla-medicos\frontend\src\pages\admin\AdminBrands.jsx",
  "E:\batla medico\batla-medicos\frontend\src\pages\admin\AdminProducts.jsx",
  "E:\batla medico\batla-medicos\frontend\src\pages\admin\AdminPromotions.jsx"
)
$map = [ordered]@{
  '6FA82E' = '1ABC9C'
  '4F8C28' = '16A085'
  '3E6B1A' = '117A65'
  '2E5214' = '0E6655'
  '5A8F25' = '138D75'
  '1B8843' = '16A085'
  'BFE29A' = 'A0E7D8'
  '8BC34A' = '2ECABF'
}
foreach ($f in $files) {
  if (-not (Test-Path $f)) { Write-Output "SKIP missing: $f"; continue }
  $txt = [System.IO.File]::ReadAllText($f)
  foreach ($k in $map.Keys) {
    $txt = [System.Text.RegularExpressions.Regex]::Replace($txt, [regex]::Escape($k), $map[$k], 'IgnoreCase')
  }
  $txt = $txt.Replace('111,168,46', '26,188,156')
  [System.IO.File]::WriteAllText($f, $txt, (New-Object System.Text.UTF8Encoding($false)))
  Write-Output "OK: $(Split-Path $f -Leaf)"
}
