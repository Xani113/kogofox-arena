$csharp = @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public class LogoProcessor {
    public static void Process(string srcPath, string destPath) {
        using (Bitmap src = new Bitmap(srcPath)) {
            int width = src.Width;
            int height = src.Height;
            using (Bitmap dest = new Bitmap(width, height, PixelFormat.Format32bppArgb)) {
                Rectangle rect = new Rectangle(0, 0, width, height);
                BitmapData srcData = src.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
                BitmapData dstData = dest.LockBits(rect, ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);

                int totalBytes = srcData.Stride * height;
                byte[] srcBytes = new byte[totalBytes];
                byte[] dstBytes = new byte[totalBytes];

                Marshal.Copy(srcData.Scan0, srcBytes, 0, totalBytes);

                bool[] isOutside = new bool[width * height];
                Queue<int> queue = new Queue<int>();

                // Seed edges
                for (int x = 0; x < width; x++) {
                    CheckAndQueue(x, 0, width, height, srcData.Stride, srcBytes, isOutside, queue);
                    CheckAndQueue(x, height - 1, width, height, srcData.Stride, srcBytes, isOutside, queue);
                }
                for (int y = 0; y < height; y++) {
                    CheckAndQueue(0, y, width, height, srcData.Stride, srcBytes, isOutside, queue);
                    CheckAndQueue(width - 1, y, width, height, srcData.Stride, srcBytes, isOutside, queue);
                }

                while (queue.Count > 0) {
                    int curr = queue.Dequeue();
                    int cy = curr / width;
                    int cx = curr % width;

                    CheckAndQueue(cx + 1, cy, width, height, srcData.Stride, srcBytes, isOutside, queue);
                    CheckAndQueue(cx - 1, cy, width, height, srcData.Stride, srcBytes, isOutside, queue);
                    CheckAndQueue(cx, cy + 1, width, height, srcData.Stride, srcBytes, isOutside, queue);
                    CheckAndQueue(cx, cy - 1, width, height, srcData.Stride, srcBytes, isOutside, queue);
                }

                for (int y = 0; y < height; y++) {
                    for (int x = 0; x < width; x++) {
                        int idx = y * width + x;
                        int bIdx = y * srcData.Stride + (x * 4);
                        if (isOutside[idx]) {
                            dstBytes[bIdx] = 0;
                            dstBytes[bIdx + 1] = 0;
                            dstBytes[bIdx + 2] = 0;
                            dstBytes[bIdx + 3] = 0;
                        } else {
                            dstBytes[bIdx] = srcBytes[bIdx];
                            dstBytes[bIdx + 1] = srcBytes[bIdx + 1];
                            dstBytes[bIdx + 2] = srcBytes[bIdx + 2];
                            dstBytes[bIdx + 3] = 255;
                        }
                    }
                }

                Marshal.Copy(dstBytes, 0, dstData.Scan0, totalBytes);
                src.UnlockBits(srcData);
                dest.UnlockBits(dstData);

                dest.Save(destPath, ImageFormat.Png);
            }
        }
    }

    private static void CheckAndQueue(int x, int y, int width, int height, int stride, byte[] srcBytes, bool[] isOutside, Queue<int> queue) {
        if (x < 0 || x >= width || y < 0 || y >= height) return;
        int idx = y * width + x;
        if (isOutside[idx]) return;

        int bIdx = y * stride + (x * 4);
        byte b = srcBytes[bIdx];
        byte g = srcBytes[bIdx + 1];
        byte r = srcBytes[bIdx + 2];

        int maxC = Math.Max(r, Math.Max(g, b));
        int minC = Math.Min(r, Math.Min(g, b));
        int diff = maxC - minC;

        if (minC > 140 && diff < 40) {
            isOutside[idx] = true;
            queue.Enqueue(idx);
        }
    }
}
'@

Add-Type -TypeDefinition $csharp -ReferencedAssemblies System.Drawing

$src = Join-Path $PSScriptRoot "..\assets\kogofox_logo_raw.jpg"
$dest = Join-Path $PSScriptRoot "..\assets\kogofox_logo.png"

[LogoProcessor]::Process($src, $dest)
Write-Output "Clean transparent logo created successfully at $dest"
