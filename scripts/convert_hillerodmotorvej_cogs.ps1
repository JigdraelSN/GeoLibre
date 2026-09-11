# Batch-converts the 8 Hillerodmotorvej TIFFs to lossless COGs.
# Run this from an Anaconda/Miniforge Prompt with your GDAL environment
# activated (the same one you used for the Anstillingplads orthophoto).
#
# Usage:
#   1. Open Anaconda Prompt / Miniforge Prompt, activate your GDAL env.
#   2. cd to wherever you saved this script, or just run it with a full path:
#        powershell -ExecutionPolicy Bypass -File "D:\GEOlibre\convert_hillerodmotorvej_cogs.ps1"
#
# It reads from D:\GEOlibre\*.tif and writes to D:\GEOlibre\cog\, skipping any
# file whose output already exists (so you can re-run safely if it's
# interrupted partway through).

$ErrorActionPreference = "Stop"

$srcDir = "D:\GEOlibre"
$outDir = "D:\GEOlibre\cog"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$files = Get-ChildItem -Path $srcDir -Filter "Hillerodmotorvej_*.tif" | Sort-Object Name

if ($files.Count -eq 0) {
    Write-Host "No Hillerodmotorvej_*.tif files found in $srcDir"
    exit 1
}

Write-Host "Found $($files.Count) files to convert."
Write-Host ""

$overallStart = Get-Date

foreach ($file in $files) {
    $outName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name) + ".cog.tif"
    $outPath = Join-Path $outDir $outName

    if (Test-Path $outPath) {
        Write-Host "SKIP  $($file.Name) -> already converted ($outName)"
        continue
    }

    $sizeMB = [math]::Round($file.Length / 1MB, 1)
    Write-Host "----------------------------------------------------------------"
    Write-Host "Converting $($file.Name) ($sizeMB MB) ..."
    $start = Get-Date

    gdal_translate -of COG `
        -co COMPRESS=DEFLATE `
        -co PREDICTOR=2 `
        -co ZLEVEL=9 `
        -co BLOCKSIZE=512 `
        -co OVERVIEWS=AUTO `
        -co BIGTIFF=IF_SAFER `
        -co NUM_THREADS=ALL_CPUS `
        $file.FullName $outPath

    $elapsed = (Get-Date) - $start
    $outSizeMB = [math]::Round((Get-Item $outPath).Length / 1MB, 1)
    $ratio = [math]::Round($sizeMB / $outSizeMB, 2)
    Write-Host "DONE  $($file.Name) -> $outName  ($sizeMB MB -> $outSizeMB MB, ${ratio}x)  took $($elapsed.ToString('mm\:ss'))"
    Write-Host ""
}

$overallElapsed = (Get-Date) - $overallStart
Write-Host "----------------------------------------------------------------"
Write-Host "All done. Total time: $($overallElapsed.ToString('hh\:mm\:ss'))"
Write-Host "Output folder: $outDir"
