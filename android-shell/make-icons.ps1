# Generates Android launcher icons for the PCEA Connect shell from the official logo.
Add-Type -AssemblyName System.Drawing

$src = "C:\Users\thrillerpark\Desktop\pcea-connect-git\frontend\public\PCEA Connect.png"
$outRoot = "C:\Users\thrillerpark\Desktop\pcea-connect-git\android-shell\app\src\main\res"

$sizes = @{
    "mipmap-mdpi"    = 48
    "mipmap-hdpi"    = 72
    "mipmap-xhdpi"   = 96
    "mipmap-xxhdpi"  = 144
    "mipmap-xxxhdpi" = 192
}

$image = [System.Drawing.Image]::FromFile($src)

function Save-Square([int]$side, [string]$path, [bool]$round) {
    $bmp = New-Object System.Drawing.Bitmap($side, $side)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    if ($round) {
        # circular clip
        $gp = New-Object System.Drawing.Drawing2D.GraphicsPath
        $gp.AddEllipse(0, 0, $side, $side)
        $g.SetClip($gp)
    }
    # navy background, logo inset with small margin
    $g.Clear([System.Drawing.Color]::FromArgb(255, 10, 17, 40))
    $margin = [int]($side * 0.08)
    $dest = New-Object System.Drawing.Rectangle($margin, $margin, ($side - 2 * $margin), ($side - 2 * $margin))
    $g.DrawImage($image, $dest)

    $g.Dispose()
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "wrote $path"
}

foreach ($entry in $sizes.GetEnumerator()) {
    $dir = Join-Path $outRoot $entry.Key
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    Save-Square $entry.Value (Join-Path $dir "ic_launcher.png") $false
    Save-Square $entry.Value (Join-Path $dir "ic_launcher_round.png") $true
}

# Play Store listing icon (512x512)
$storeDir = "C:\Users\thrillerpark\Desktop\pcea-connect-git\android-shell"
New-Item -ItemType Directory -Force -Path $storeDir | Out-Null
Save-Square 512 (Join-Path $storeDir "playstore-icon.png") $false

$image.Dispose()
Write-Output "done"
