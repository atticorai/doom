# ================================================================
#  Lerner & Rowe - Radio :30s bulk downloader
#  Downloads every spot from Google Drive and saves it as
#  "ISCI - Title.ext" (real extension read from Drive), then makes
#  the four Tucson copies of the Phoenix files.
#  Files land in the folder this script lives in. Already-downloaded
#  files are skipped, so re-running only fetches what is missing.
# ================================================================
$ErrorActionPreference = 'Continue'
Set-Location -Path $PSScriptRoot
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}

$spots = @(
  @{ isci = 'ABQLR2630001R'; title = 'Service_30'; id = '1-vB5cNcJY2Jc68ZkeSxfi3EIEwVptG1d' },
  @{ isci = 'ABQLR2630002R'; title = '505_30'; id = '18ZafMB2EgAs57zQJ0sJBVwtYxrXfn9lx' },
  @{ isci = 'ABQLR2630003R'; title = 'Help_30'; id = '1jyYfWM4QMNSvamGYTIeQuc82zO-WhYol' },
  @{ isci = 'ABQLR2630004R'; title = 'Wreck Life_30'; id = '1q99-I5dgWvmhoju3UtjQjknUvbX0G_s5' },
  @{ isci = 'ABQLR2630005R'; title = 'One Call_30'; id = '1VyhC7A6Hg-P2TXdjKsOQEuQbxT-WUSTg' },
  @{ isci = 'ABQLR2630006R'; title = 'Rear End_30'; id = '1j8II554oq4MBV1G7AuveBKvTGzGu-ZOp' },
  @{ isci = 'ABQLR2630007R'; title = 'Make Them Pay_30'; id = '1m9Fyf0OIUv4U1-5TyCIMtFgy4lEkdQgz' },
  @{ isci = 'PHXLR2630001R'; title = 'PHX Tuc Law_30'; id = '1D8OZLYg7HWyKmMK1cdd6nHG_SYTu6nlK' },
  @{ isci = 'PHXLR2630002R'; title = 'Best_30'; id = '1QxEKbY5G8d38eQvtRN15NfFxKeJLmIqh' },
  @{ isci = 'PHXLR2630003R'; title = 'Rear End_30'; id = '1vFGnIy0yz8mKGucVuT13umArP5NmvA6p' },
  @{ isci = 'PHXLR2630004R'; title = 'Make Them Pay_30'; id = '1B422edYnF_uQZJfeD5-ZCKspeXMhE5Xz' },
  @{ isci = 'RNOLR2630001R'; title = 'No Results_30'; id = '1wm9ddV4PloDaD69IXUHmc6i-br_DG4ma' },
  @{ isci = 'RNOLR2630002R'; title = 'Results 523_30'; id = '1S9sZHCSC_xMYyXj1NFdL__s1r8NYdjFx' },
  @{ isci = 'RNOLR2630003R'; title = 'The Process 523_30'; id = '1WQmIIq4XEAJWZy4iQ3SZPOtWjgv1tAfH' },
  @{ isci = 'RNOLR2630004R'; title = 'They Know Who We Are_30'; id = '1GHOozXGyUykQW12tJzrsZiPSLEU_ZS7r' },
  @{ isci = 'RNOLR2630005R'; title = 'What It Means_30'; id = '1m3tXgsgZCksgT7cvVsXZQPkM8I5--G_0' },
  @{ isci = 'RNOLR2630006R'; title = 'Electric Vehicle_30'; id = '' }
)

$ok = 0; $skipped = 0; $failed = @()
foreach ($s in $spots) {
    $final = "$($s.isci) - $($s.title)"
    if ([string]::IsNullOrEmpty($s.id)) {
        Write-Host "  NO LINK  $final - not in the traffic sheet, get the link and download by hand" -ForegroundColor Yellow
        $failed += $final; continue
    }
    $existing = Get-ChildItem -File -Filter "$final.*" -ErrorAction SilentlyContinue
    if ($existing) { Write-Host "  OK       $($existing[0].Name) already downloaded"; $skipped++; continue }
    $url = "https://drive.usercontent.google.com/download?id=$($s.id)&export=download&confirm=t"
    $tmp = Join-Path $env:TEMP 'lr_dl.tmp'
    Write-Host "  getting  $final ..."
    try {
        $resp = Invoke-WebRequest -Uri $url -OutFile $tmp -PassThru -UseBasicParsing
    } catch {
        Write-Host "  FAILED   $final - $($_.Exception.Message)" -ForegroundColor Red
        $failed += $final; continue
    }
    $ct = "$($resp.Headers['Content-Type'])"
    if ($ct -like 'text/html*') {
        Remove-Item $tmp -ErrorAction SilentlyContinue
        Write-Host "  FAILED   $final - Drive sent a web page instead of the file (sharing permissions?)" -ForegroundColor Red
        $failed += $final; continue
    }
    $ext = 'mp3'
    $cd = "$($resp.Headers['Content-Disposition'])"
    if ($cd -match '\.([A-Za-z0-9]{2,4})"') { $ext = $Matches[1].ToLower() }
    elseif ($ct -like '*wav*') { $ext = 'wav' }
    elseif ($ct -like '*mp4*' -or $ct -like '*m4a*') { $ext = 'm4a' }
    Move-Item $tmp "$final.$ext" -Force
    Write-Host "  saved    $final.$ext" -ForegroundColor Green
    $ok++
}

Write-Host ''
Write-Host '--- Tucson copies (same spots as Phoenix) ---'
$pairs = @(
    @{ src = 'PHXLR2630001R - PHX Tuc Law_30';   dst = 'TUCLR2630001R - PHX Tuc Law_30' },
    @{ src = 'PHXLR2630002R - Best_30';          dst = 'TUCLR2630002R - Best_30' },
    @{ src = 'PHXLR2630003R - Rear End_30';      dst = 'TUCLR2630003R - Rear End_30' },
    @{ src = 'PHXLR2630004R - Make Them Pay_30'; dst = 'TUCLR2630004R - Make Them Pay_30' }
)
foreach ($p in $pairs) {
    $already = Get-ChildItem -File -Filter "$($p.dst).*" -ErrorAction SilentlyContinue
    if ($already) { Write-Host "  OK       $($already[0].Name) already there"; continue }
    $src = Get-ChildItem -File -Filter "$($p.src).*" -ErrorAction SilentlyContinue
    if ($src) {
        $ext = $src[0].Extension
        Copy-Item $src[0].FullName "$($p.dst)$ext"
        Write-Host "  copied   $($src[0].Name) -> $($p.dst)$ext" -ForegroundColor Green
    } else {
        Write-Host "  MISSING  $($p.dst) - Phoenix source not downloaded" -ForegroundColor Red
        $failed += $p.dst
    }
}

Write-Host ''
Write-Host "Done: $ok downloaded, $skipped already had, $($failed.Count) need attention." -ForegroundColor Cyan
if ($failed.Count) { $failed | ForEach-Object { Write-Host "  * $_" -ForegroundColor Yellow } }
