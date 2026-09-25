# 8K Gaming Mouse Control Center（Tauri）

這是以 `D:\CodeX\Tauri\WebHID backup.zip` 的已打通 WebHID 程式為基礎，參照 `D:\CodeX\Tauri\UI.png` 重做的 Windows Tauri 介面。協議封包程式位於 `ui/protocol.js`；Windows App 使用系統 WebView2 的 WebHID API。

## 功能

- 支援 VID `062A`、PID `8001`／`8002`，桌面版定時偵測 vendor usage page `FF00` 並自動連線。
- NV1：回報率與目前 DPI 段數；NV2：六段 DPI 與固定色 RGB565。
- 五顆滑鼠按鍵的滑鼠／鍵盤／多媒體功能指派，以及巨集編輯、寫入。
- 固定 M1–M5 本機設定檔、JSON 匯入／匯出、HID 傳輸紀錄匯出。匯入會覆蓋目前選中的設定檔。
- 「儲存到裝置」會依序寫入目前設定檔的 NV2、NV1 與五顆按鍵。首頁的 DPI／回報率選擇會在半秒後自動寫入。
- 支援繁體中文、簡體中文、英文、日文、韓文；首次啟動依作業系統語系選擇，未支援的語系使用英文。
- 提供橘黑、橘白、紅、綠、藍、薰衣草紫、香蕉黃、星野橙花八種主題，並有滑鼠跟隨光影及約 8.5 秒一次的玻璃掃光。星野橙花主題使用透明角色插畫 `ui/assets/hoshino-flower-v1.png` 與 SVG 花瓣紋理。
- 儀表板使用汽車儀表式刻度、DPI 與回報率數值刻度，以及隨目前設定變化的弧形進度亮條。

## 執行

在 `D:\CodeX\Tauri` 直接執行 `8K Gaming Mouse Control Center Updated.exe`。桌面版會自動偵測並連接相符滑鼠。

## 開發與建置

```powershell
Set-Location 'D:\CodeX\Tauri\8K-Gaming-Mouse-Tauri'
$env:PATH="C:\Users\Sam\.cargo\bin;D:\CodeX\WebHID AP\tools\node-v24.19.0-win-x64;$env:PATH"
npm.cmd install
npm.cmd test
npm.cmd run dev
npm.cmd run build
```

## 已知協議範圍

協議提供 NV1、NV2、Macro 與 END 寫入，沒有設定讀回命令，因此介面不提供「從裝置讀取」。六段 LED 色彩是協議內的固定色；沒有獨立燈效寫入命令。裝置實際寫入仍需接上目標滑鼠確認。

協議測試位於 `tests/protocol.test.js`，介面測試位於 `tests/ui-smoke.mjs`，Tauri WebView2 實機環境檢查位於 `tests/tauri-runtime-smoke.mjs`。


