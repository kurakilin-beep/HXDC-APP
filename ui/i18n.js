export const LANGUAGES = ['zh-TW', 'zh-CN', 'en', 'ja', 'ko'];

export function systemLanguage(locales = []) {
  const first = (locales[0] || '').toLowerCase();
  if (first.startsWith('zh')) return /(^|-)tw($|-)|(^|-)hk($|-)|(^|-)mo($|-)|hant/.test(first) ? 'zh-TW' : 'zh-CN';
  if (first.startsWith('ja')) return 'ja';
  if (first.startsWith('ko')) return 'ko';
  if (first.startsWith('en')) return 'en';
  return 'en';
}

const phrases = {
  '首頁': ['首页', 'Home', 'ホーム'],
  '按鍵設定': ['按键设置', 'Button Settings', 'ボタン設定'],
  'DPI 設定': ['DPI 设置', 'DPI Settings', 'DPI 設定'],
  '進階設定': ['高级设置', 'Advanced', '詳細設定'],
  '裝置資訊': ['设备信息', 'Device Info', 'デバイス情報'],
  '燈效設定': ['灯效设置', 'Lighting', 'ライティング'],
  '展示用燈效預覽，設定不會寫入裝置。': ['仅供展示，设置不会写入设备。', 'Demo preview only. Settings are not sent to the device.', 'デモ用プレビューです。設定はデバイスに書き込まれません。'],
  '即時預覽': ['实时预览', 'Live preview', 'ライブプレビュー'],
  '燈效模式': ['灯效模式', 'Lighting effect', 'ライト効果'],
  '單色': ['单色', 'Solid', '単色'],
  '呼吸': ['呼吸', 'Breathing', 'ブリージング'],
  '多彩循環': ['多彩循环', 'Color cycle', 'カラーサイクル'],
  '流光': ['流光', 'Flow', '流光'],
  '每種效果可分別選擇預覽顏色；多彩循環會從所選顏色開始變化。': ['每种效果可单独选择预览颜色；多彩循环从所选颜色开始变化。', 'Choose a preview color for each effect. Color cycle starts from the selected color.', '各効果のプレビュー色を選べます。カラーサイクルは選択した色から始まります。'],
  '設定': ['设置', 'Theme', 'テーマ'],
  '設定檔': ['配置文件', 'Profiles', 'プロファイル'],
  '按鍵功能設定': ['按键功能设置', 'Button Mapping', 'ボタン割り当て'],
  '恢復預設': ['恢复默认', 'Restore Defaults', '初期設定に戻す'],
  '儲存到裝置': ['保存到设备', 'Save to Device', 'デバイスに保存'],
  '匯出設定': ['导出设置', 'Export Profile', '設定をエクスポート'],
  '匯入設定': ['导入设置', 'Import Profile', '設定をインポート'],
  '選擇每顆按鍵的功能，再寫入滑鼠。': ['选择每个按键的功能，然后写入鼠标。', 'Choose each button function, then write it to the mouse.', '各ボタンの機能を選び、マウスに書き込みます。'],
  '寫入按鍵設定': ['写入按键设置', 'Write Button Settings', 'ボタン設定を書き込む'],
  '六段 DPI 與固定的 LED 顏色；每段以 200 DPI 遞增。': ['六档 DPI 与固定 LED 颜色；每档以 200 DPI 递增。', 'Six DPI stages with fixed LED colors, in steps of 200 DPI.', '6 段階の DPI と固定 LED 色。200 DPI 刻みです。'],
  '寫入 DPI 表': ['写入 DPI 表', 'Write DPI Table', 'DPI テーブルを書き込む'],
  '建立按下、放開與延遲動作；最多 62 個動作。': ['创建按下、松开与延迟动作；最多 62 个动作。', 'Create press, release, and delay actions; up to 62 actions.', '押下・解放・遅延を設定します。最大 62 動作。'],
  '巨集編輯器': ['宏编辑器', 'Macro Editor', 'マクロエディター'],
  '目標按鍵': ['目标按键', 'Target Button', '対象ボタン'],
  '循環次數': ['循环次数', 'Repeat Count', '繰り返し回数'],
  '0 = 按住期間循環': ['0 = 按住期间循环', '0 = repeat while held', '0 = 押している間繰り返す'],
  '動作': ['动作', 'Action', 'アクション'],
  '按下': ['按下', 'Press', '押す'],
  '放開': ['松开', 'Release', '離す'],
  '延遲': ['延迟', 'Delay', '遅延'],
  '類型': ['类型', 'Category', '種類'],
  '按鍵': ['按键', 'Key', 'キー'],
  '鍵盤': ['键盘', 'Keyboard', 'キーボード'],
  '滑鼠': ['鼠标', 'Mouse', 'マウス'],
  '多媒體': ['多媒体', 'Media', 'メディア'],
  '延遲毫秒': ['延迟毫秒', 'Delay (ms)', '遅延 (ms)'],
  '＋ 加入動作': ['＋ 添加动作', '＋ Add Action', '＋ 動作を追加'],
  '＋ 快速按鍵序列': ['＋ 快速按键序列', '＋ Quick Key Sequence', '＋ キー操作を追加'],
  '清空': ['清空', 'Clear', 'クリア'],
  '寫入巨集': ['写入宏', 'Write Macro', 'マクロを書き込む'],
  'HID 傳輸紀錄': ['HID 传输记录', 'HID Transfer Log', 'HID 転送ログ'],
  '匯出 JSON': ['导出 JSON', 'Export JSON', 'JSON をエクスポート'],
  '記錄本程式送出的 Output Report 與收到的 Input Report。': ['记录程序发送的 Output Report 和收到的 Input Report。', 'Logs sent Output Reports and received Input Reports.', '送信した Output Report と受信した Input Report を記録します。'],
  '連線狀態': ['连接状态', 'Connection Status', '接続状態'],
  '未連接': ['未连接', 'Disconnected', '未接続'],
  '已連接': ['已连接', 'Connected', '接続済み'],
  '連接裝置': ['连接设备', 'Connect Device', 'デバイスに接続'],
  '中斷連線': ['断开连接', 'Disconnect', '接続を解除'],
  '製造商': ['制造商', 'Manufacturer', '製造元'],
  '產品名稱': ['产品名称', 'Product Name', '製品名'],
  '傳輸方式': ['传输方式', 'Transport', '転送方式'],
  '左鍵': ['左键', 'Left Button', '左ボタン'],
  '右鍵': ['右键', 'Right Button', '右ボタン'],
  '中鍵': ['中键', 'Middle Button', '中央ボタン'],
  '側鍵 1': ['侧键 1', 'Side Button 1', 'サイドボタン 1'],
  '側鍵 2': ['侧键 2', 'Side Button 2', 'サイドボタン 2'],
  '前進': ['前进', 'Forward', '進む'],
  '後退': ['后退', 'Back', '戻る'],
  '音量＋': ['音量＋', 'Volume Up', '音量を上げる'],
  '音量－': ['音量－', 'Volume Down', '音量を下げる'],
  '靜音': ['静音', 'Mute', 'ミュート'],
  '播放／暫停': ['播放／暂停', 'Play / Pause', '再生／一時停止'],
  '下一首': ['下一首', 'Next Track', '次の曲'],
  '上一首': ['上一首', 'Previous Track', '前の曲'],
  '紅色': ['红色', 'Red', '赤'], '綠色': ['绿色', 'Green', '緑'],
  '藍色': ['蓝色', 'Blue', '青'], '黃色': ['黄色', 'Yellow', '黄'],
  '青色': ['青色', 'Cyan', 'シアン'], '紫色': ['紫色', 'Purple', '紫'],
  '固定色': ['固定色', 'Fixed Color', '固定色'],
  '尚無動作。加入按下、放開或延遲。': ['暂无动作。添加按下、松开或延迟。', 'No actions yet. Add a press, release, or delay.', '動作はありません。押下・解放・遅延を追加してください。'],
  '匯入完成': ['导入完成', 'Import complete', 'インポート完了'],
  '深色': ['深色', 'Dark', 'ダーク'],
  '淺色': ['浅色', 'Light', 'ライト'],
  '切換為深色主題': ['切换为深色主题', 'Switch to dark theme', 'ダークテーマに切り替え'],
  '切換為淺色主題': ['切换为浅色主题', 'Switch to light theme', 'ライトテーマに切り替え'],
  '選擇主題': ['选择主题', 'Choose theme', 'テーマを選択'],
  '主題配色': ['主题配色', 'Theme colors', 'テーマの配色'],
  '橘黑': ['橙黑', 'Orange Dark', 'オレンジ・ダーク'],
  '橘白': ['橙白', 'Orange Light', 'オレンジ・ライト'],
  '完成': ['完成', 'complete', '完了'],
  '失敗': ['失败', 'failed', '失敗'],
  '匯入失敗': ['导入失败', 'Import failed', 'インポート失敗'],
  'DPI／回報率寫入': ['DPI／回报率写入', 'DPI / report rate write', 'DPI／レポートレートの書き込み'],
  'DPI 寫入': ['DPI 写入', 'DPI write', 'DPI の書き込み'],
  '按鍵設定寫入': ['按键设置写入', 'Button settings write', 'ボタン設定の書き込み'],
  '設定寫入': ['设置写入', 'Settings write', '設定の書き込み'],
  '巨集寫入': ['宏写入', 'Macro write', 'マクロの書き込み'],
  'DPI 需為 200–30000 且以 200 遞增。': ['DPI 必须在 200–30000 之间，且以 200 递增。', 'DPI must be 200–30000 in steps of 200.', 'DPI は 200～30000 の範囲で 200 刻みです。'],
  '將目前設定檔恢復預設值？尚未寫入裝置。': ['将当前配置文件恢复默认值？尚未写入设备。', 'Restore this profile to defaults? The device has not been updated.', 'このプロファイルを初期値に戻しますか？デバイスにはまだ書き込まれません。'],
  '設定檔已恢復預設；需按「儲存到裝置」才會寫入滑鼠。': ['配置文件已恢复默认；按“保存到设备”后才会写入鼠标。', 'Profile restored. Select Save to Device to write it to the mouse.', '初期設定に戻しました。マウスに書き込むには「デバイスに保存」を選んでください。'],
  '巨集最多 62 個動作。': ['宏最多 62 个动作。', 'Macros support up to 62 actions.', 'マクロは最大 62 動作です。'],
  '動作數值超出範圍。': ['动作数值超出范围。', 'Action value is out of range.', '動作の値が範囲外です。'],
  '延遲需為 0–16383 毫秒。': ['延迟必须在 0–16383 毫秒之间。', 'Delay must be 0–16383 ms.', '遅延は 0～16383 ms の範囲です。'],
  '請先加入動作': ['请先添加动作', 'Add an action first', '先に動作を追加してください'],
  '請先連接滑鼠。': ['请先连接鼠标。', 'Connect the mouse first.', '先にマウスを接続してください。'],
  '沒有選取裝置': ['未选择设备', 'No device selected', 'デバイスが選択されていません'],
  '設定檔格式不正確': ['配置文件格式不正确', 'Invalid profile format', 'プロファイルの形式が正しくありません'],
  '薰衣草紫': ['薰衣草紫', 'Lavender Purple', 'ラベンダー'],
  '香蕉黃': ['香蕉黄', 'Banana Yellow', 'バナナイエロー'],
  '星野橙花': ['星野橙花', 'Touka Hoshino', '星野橙花'],
  '賽博龐克': ['赛博朋克', 'Cyberpunk', 'サイバーパンク']
};

const korean = {
  '首頁': '홈', '按鍵設定': '버튼 설정', 'DPI 設定': 'DPI 설정', '進階設定': '고급 설정', '裝置資訊': '장치 정보',
  '燈效設定': '조명 설정', '展示用燈效預覽，設定不會寫入裝置。': '데모 미리보기입니다. 설정은 장치에 저장되지 않습니다.',
  '即時預覽': '실시간 미리보기', '燈效模式': '조명 효과', '單色': '단색', '呼吸': '브리딩', '多彩循環': '색상 순환', '流光': '흐르는 빛',
  '每種效果可分別選擇預覽顏色；多彩循環會從所選顏色開始變化。': '효과마다 미리보기 색상을 선택할 수 있습니다. 색상 순환은 선택한 색에서 시작합니다.',
  '設定': '테마', '設定檔': '프로필', '按鍵功能設定': '버튼 기능 설정', '恢復預設': '기본값 복원',
  '儲存到裝置': '장치에 저장', '匯出設定': '설정 내보내기', '匯入設定': '설정 가져오기',
  '選擇每顆按鍵的功能，再寫入滑鼠。': '각 버튼의 기능을 선택한 뒤 마우스에 기록합니다.',
  '寫入按鍵設定': '버튼 설정 기록', '六段 DPI 與固定的 LED 顏色；每段以 200 DPI 遞增。': '고정 LED 색상의 6단계 DPI이며 200 DPI 단위로 조정됩니다.',
  '寫入 DPI 表': 'DPI 표 기록', '建立按下、放開與延遲動作；最多 62 個動作。': '누르기, 놓기, 지연 동작을 만듭니다. 최대 62개 동작을 지원합니다.',
  '巨集編輯器': '매크로 편집기', '目標按鍵': '대상 버튼', '循環次數': '반복 횟수', '0 = 按住期間循環': '0 = 누르는 동안 반복',
  '動作': '동작', '按下': '누르기', '放開': '놓기', '延遲': '지연', '類型': '유형', '按鍵': '키',
  '鍵盤': '키보드', '滑鼠': '마우스', '多媒體': '미디어', '延遲毫秒': '지연 (ms)',
  '＋ 加入動作': '＋ 동작 추가', '＋ 快速按鍵序列': '＋ 빠른 키 시퀀스', '清空': '지우기', '寫入巨集': '매크로 기록',
  'HID 傳輸紀錄': 'HID 전송 기록', '匯出 JSON': 'JSON 내보내기',
  '記錄本程式送出的 Output Report 與收到的 Input Report。': '프로그램이 보낸 Output Report와 받은 Input Report를 기록합니다.',
  '連線狀態': '연결 상태', '未連接': '연결 안 됨', '已連接': '연결됨', '連接裝置': '장치 연결', '中斷連線': '연결 해제',
  '製造商': '제조사', '產品名稱': '제품명', '傳輸方式': '전송 방식',
  '左鍵': '왼쪽 버튼', '右鍵': '오른쪽 버튼', '中鍵': '가운데 버튼', '側鍵 1': '측면 버튼 1', '側鍵 2': '측면 버튼 2',
  '前進': '앞으로', '後退': '뒤로', '音量＋': '볼륨 높이기', '音量－': '볼륨 낮추기', '靜音': '음소거',
  '播放／暫停': '재생／일시정지', '下一首': '다음 곡', '上一首': '이전 곡',
  '紅色': '빨강', '綠色': '초록', '藍色': '파랑', '黃色': '노랑', '青色': '청록', '紫色': '보라', '固定色': '고정 색상',
  '尚無動作。加入按下、放開或延遲。': '동작이 없습니다. 누르기, 놓기 또는 지연을 추가하세요.',
  '匯入完成': '가져오기 완료', '深色': '어둡게', '淺色': '밝게',
  '切換為深色主題': '어두운 테마로 전환', '切換為淺色主題': '밝은 테마로 전환',
  '選擇主題': '테마 선택', '主題配色': '테마 색상', '橘黑': '주황·검정', '橘白': '주황·흰색',
  '薰衣草紫': '라벤더 퍼플', '香蕉黃': '바나나 옐로', '星野橙花': '호시노 토우카', '賽博龐克': '사이버펑크',
  '完成': '완료', '失敗': '실패', '匯入失敗': '가져오기 실패',
  'DPI／回報率寫入': 'DPI／보고율 기록', 'DPI 寫入': 'DPI 기록', '按鍵設定寫入': '버튼 설정 기록',
  '設定寫入': '설정 기록', '巨集寫入': '매크로 기록',
  'DPI 需為 200–30000 且以 200 遞增。': 'DPI는 200~30000 범위에서 200 단위여야 합니다.',
  '將目前設定檔恢復預設值？尚未寫入裝置。': '현재 프로필을 기본값으로 복원하시겠습니까? 장치에는 아직 기록되지 않습니다.',
  '設定檔已恢復預設；需按「儲存到裝置」才會寫入滑鼠。': '프로필을 복원했습니다. 마우스에 기록하려면 장치에 저장을 누르세요.',
  '巨集最多 62 個動作。': '매크로는 최대 62개 동작을 지원합니다.', '動作數值超出範圍。': '동작 값이 범위를 벗어났습니다.',
  '延遲需為 0–16383 毫秒。': '지연은 0~16383ms 범위여야 합니다.', '請先加入動作': '먼저 동작을 추가하세요',
  '請先連接滑鼠。': '먼저 마우스를 연결하세요.', '沒有選取裝置': '선택한 장치가 없습니다',
  '設定檔格式不正確': '프로필 형식이 올바르지 않습니다'
};

export function translate(text, language) {
  if (language === 'zh-TW') return text;
  if (language === 'ko') {
    if (korean[text]) return korean[text];
    const macro = /^巨集 \((\d+) 動作\)$/.exec(text);
    if (macro) return `매크로 (${macro[1]}개 동작)`;
    const button = /^([左中右]鍵|側鍵 [12]) 功能$/.exec(text);
    if (button) return `${translate(button[1], language)} 기능`;
    const color = /^(紅色|綠色|藍色|黃色|青色|紫色) · 固定色$/.exec(text);
    if (color) return `${translate(color[1], language)} · ${translate('固定色', language)}`;
    return phrases[text]?.[1] || text;
  }
  const index = LANGUAGES.indexOf(language) - 1;
  if (index < 0) return text;
  const match = phrases[text];
  if (match) return match[index];
  const macro = /^巨集 \((\d+) 動作\)$/.exec(text);
  if (macro) return [ `宏 (${macro[1]} 个动作)`, `Macro (${macro[1]} actions)`, `マクロ (${macro[1]} 動作)` ][index];
  const button = /^([左中右]鍵|側鍵 [12]) 功能$/.exec(text);
  if (button) return `${translate(button[1], language)}: ${translate('按鍵功能設定', language)}`;
  const color = /^(紅色|綠色|藍色|黃色|青色|紫色) · 固定色$/.exec(text);
  if (color) return `${translate(color[1], language)} · ${translate('固定色', language)}`;
  return text;
}
