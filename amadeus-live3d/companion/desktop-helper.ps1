# Desktop geometry helper for the 3D companion: answers one JSON line per request line on stdin.
#   request "w <ownPid>"  -> {"windows":[{id,x,y,w,h,title,max}...], "fg":<hwnd>, "full":<bool>}
# Windows are listed top-most first (EnumWindows z-order) with their visible (DWM) bounds.
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @"
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public static class AmadeusDesk {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
  [StructLayout(LayoutKind.Sequential)] public struct MONITORINFO { public int cbSize; public RECT rcMonitor; public RECT rcWork; public uint dwFlags; }
  delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc f, IntPtr l);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] static extern bool IsZoomed(IntPtr h);
  [DllImport("user32.dll")] static extern int GetWindowLong(IntPtr h, int i);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] static extern IntPtr MonitorFromWindow(IntPtr h, uint f);
  [DllImport("user32.dll")] static extern bool GetMonitorInfo(IntPtr m, ref MONITORINFO mi);
  [DllImport("dwmapi.dll")] static extern int DwmGetWindowAttribute(IntPtr h, int a, out RECT r, int s);
  [DllImport("dwmapi.dll")] static extern int DwmGetWindowAttribute(IntPtr h, int a, out int v, int s);

  static string Esc(string s) {
    var b = new StringBuilder();
    foreach (char c in s) {
      if (c == '"' || c == '\\') { b.Append('\\'); b.Append(c); }
      else if (c < 32) b.Append(' ');
      else b.Append(c);
    }
    return b.ToString();
  }

  public static string Query(uint ownPid) {
    var items = new List<string>();
    EnumWindows((h, l) => {
      if (!IsWindowVisible(h) || IsIconic(h)) return true;
      uint pid; GetWindowThreadProcessId(h, out pid);
      if (pid == ownPid) return true;
      int ex = GetWindowLong(h, -20);
      if ((ex & 0x80) != 0) return true;               // WS_EX_TOOLWINDOW
      int cloaked; if (DwmGetWindowAttribute(h, 14, out cloaked, 4) == 0 && cloaked != 0) return true;
      var cls = new StringBuilder(128); GetClassName(h, cls, 128);
      string c = cls.ToString();
      if (c == "Shell_TrayWnd" || c == "Progman" || c == "WorkerW" || c == "Shell_SecondaryTrayWnd" || c == "Windows.UI.Core.CoreWindow") return true;
      var title = new StringBuilder(256); GetWindowText(h, title, 256);
      if (title.Length == 0) return true;
      RECT r;
      if (DwmGetWindowAttribute(h, 9, out r, 16) != 0) GetWindowRect(h, out r);   // DWMWA_EXTENDED_FRAME_BOUNDS
      int w = r.Right - r.Left, hh = r.Bottom - r.Top;
      if (w < 120 || hh < 60) return true;
      items.Add("{\"id\":" + h.ToInt64() + ",\"x\":" + r.Left + ",\"y\":" + r.Top + ",\"w\":" + w + ",\"h\":" + hh +
        ",\"max\":" + (IsZoomed(h) ? "true" : "false") + ",\"title\":\"" + Esc(title.ToString()) + "\"}");
      return true;
    }, IntPtr.Zero);
    IntPtr fg = GetForegroundWindow();
    bool full = false;
    RECT fr;
    if (fg != IntPtr.Zero && GetWindowRect(fg, out fr)) {
      var mi = new MONITORINFO(); mi.cbSize = Marshal.SizeOf(typeof(MONITORINFO));
      var cls = new StringBuilder(128); GetClassName(fg, cls, 128);
      string c = cls.ToString();
      if (c != "Progman" && c != "WorkerW" && GetMonitorInfo(MonitorFromWindow(fg, 2), ref mi)) {
        full = fr.Left <= mi.rcMonitor.Left && fr.Top <= mi.rcMonitor.Top && fr.Right >= mi.rcMonitor.Right && fr.Bottom >= mi.rcMonitor.Bottom;
      }
    }
    return "{\"windows\":[" + string.Join(",", items) + "],\"fg\":" + fg.ToInt64() + ",\"full\":" + (full ? "true" : "false") + "}";
  }
}
"@
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::Out.WriteLine('{"ready":true}')
while ($true) {
  $line = [Console]::In.ReadLine()
  if ($null -eq $line) { break }
  $parts = $line.Split(' ')
  try {
    [Console]::Out.WriteLine([AmadeusDesk]::Query([uint32]$parts[1]))
  } catch {
    [Console]::Out.WriteLine('{"windows":[],"fg":0,"full":false,"error":"' + ($_.Exception.Message -replace '"', "'") + '"}')
  }
}
