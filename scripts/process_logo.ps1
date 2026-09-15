Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\assets\kogofox_logo_raw.jpg"
$destPath = Join-Path $PSScriptRoot "..\assets\kogofox_logo_clean.png"

$img = [System.Drawing.Bitmap]::new($srcPath)
$width = $img.Width
$height = $img.Height

$out = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Lock bits for high speed processing
$rect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
$srcData = $img.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$dstData = $out.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::WriteOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

$bytesTotal = $srcData.Stride * $height
$srcBytes = New-Object byte[] $bytesTotal
$dstBytes = New-Object byte[] $bytesTotal

[System.Runtime.InteropServices.Marshal]::Copy($srcData.Scan0, $srcBytes, 0, $bytesTotal)

# BFS flood fill from edges to identify outside checkerboard pixels
$isOutside = New-Object bool[] ($width * $height)
$queue = New-Object System.Collections.Generic.Queue[int]

function Push-Pixel($x, $y) {
    if ($x -lt 0 -or $x -ge $width -or $y -lt 0 -or $y -ge $height) { return }
    $idx = $y * $width + $x
    if ($isOutside[$idx]) { return }

    # Check color
    $bIdx = $y * $srcData.Stride + ($x * 4)
    $b = $srcBytes[$bIdx]
    $g = $srcBytes[$bIdx + 1]
    $r = $srcBytes[$bIdx + 2]

    # Checkerboard is light grey or white: R,G,B are high and close to each other
    $maxC = [Math]::Max($r, [Math]::Max($g, $b))
    $minC = [Math]::Min($r, [Math]::Min($g, $b))
    $diff = $maxC - $minC

    # If bright and low saturation, it's the checkerboard background
    if ($minC -gt 150 -and $diff -lt 35) {
        $isOutside[$idx] = $true
        $queue.Enqueue($idx)
    }
}

# Seed edges
for ($x = 0; $x -lt $width; $x++) {
    Push-Pixel $x 0
    Push-Pixel $x ($height - 1)
}
for ($y = 0; $y -lt $height; $y++) {
    Push-Pixel 0 $y
    Push-Pixel ($width - 1) $y
}

# Flood fill
while ($queue.Count -gt 0) {
    $curr = $queue.Dequeue()
    $cy = [int][Math]::Floor($curr / $width)
    $cx = $curr % $width

    Push-Pixel ($cx + 1) $cy
    Push-Pixel ($cx - 1) $cy
    Push-Pixel $cx ($cy + 1)
    Push-Pixel $cx ($cy - 1)
}

# Copy to dstBytes
for ($y = 0; $y -lt $height; $y++) {
    for ($x = 0; $x -lt $width; $x++) {
        $idx = $y * $width + $x
        $bIdx = $y * $srcData.Stride + ($x * 4)
        if ($isOutside[$idx]) {
            # Transparent
            $dstBytes[$bIdx] = 0
            $dstBytes[$bIdx + 1] = 0
            $dstBytes[$bIdx + 2] = 0
            $dstBytes[$bIdx + 3] = 0
        } else {
            # Logo pixel
            $dstBytes[$bIdx] = $srcBytes[$bIdx]
            $dstBytes[$bIdx + 1] = $srcBytes[$bIdx + 1]
            $dstBytes[$bIdx + 2] = $srcBytes[$bIdx + 2]
            $dstBytes[$bIdx + 3] = 255
        }
    }
}

[System.Runtime.InteropServices.Marshal]::Copy($dstBytes, 0, $dstData.Scan0, $bytesTotal)

$img.UnlockBits($srcData)
$out.UnlockBits($dstData)

$out.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
$out.Dispose()

Write-Output "Clean logo saved to $destPath"
