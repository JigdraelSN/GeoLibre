# Uploads the 8 converted Hillerodmotorvej COGs to the same R2 bucket the
# Anstillingplads orthophoto lives in. Run from the same Anaconda/Miniforge
# prompt (needs rclone on PATH and your r2 remote already configured).
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File "D:\GEOlibre\upload_hillerodmotorvej_cogs.ps1"

$ErrorActionPreference = "Stop"

$cogDir = "D:\GEOlibre\cog"
$remote = "r2:anstillingplads-test-20260905/"

$files = Get-ChildItem -Path $cogDir -Filter "Hillerodmotorvej_*.cog.tif" | Sort-Object Name

if ($files.Count -eq 0) {
    Write-Host "No Hillerodmotorvej_*.cog.tif files found in $cogDir"
    exit 1
}

Write-Host "Uploading $($files.Count) files to $remote ..."
Write-Host ""

foreach ($file in $files) {
    Write-Host "----------------------------------------------------------------"
    Write-Host "Uploading $($file.Name) ..."
    rclone copy $file.FullName $remote --progress
}

Write-Host "----------------------------------------------------------------"
Write-Host "All done. Refresh the project in your browser to see the new layers."
