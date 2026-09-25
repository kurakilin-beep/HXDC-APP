use std::sync::Mutex;
use tauri::State;

struct MouseState(Mutex<Option<hidapi::HidDevice>>);

#[tauri::command]
fn mouse_probe(state: State<'_, MouseState>) -> Result<Option<(u16, String, String)>, String> {
    let mut slot = state.0.lock().map_err(|e| e.to_string())?;
    if slot.is_some() { return Ok(None); }
    let api = hidapi::HidApi::new().map_err(|e| e.to_string())?;
    for info in api.device_list() {
        if info.vendor_id() != 0x062a || !matches!(info.product_id(), 0x8000 | 0x8001 | 0x8002) || info.usage_page() != 0xff00 { continue; }
        if let Ok(device) = info.open_device(&api) {
            let result = (info.product_id(), info.manufacturer_string().unwrap_or("").to_string(), info.product_string().unwrap_or("").to_string());
            *slot = Some(device);
            return Ok(Some(result));
        }
    }
    Ok(None)
}

#[tauri::command]
fn mouse_send(state: State<'_, MouseState>, report_id: u8, payload: Vec<u8>) -> Result<(), String> {
    if payload.len() != 64 { return Err("HID report must contain 64 bytes".into()); }
    let mut slot = state.0.lock().map_err(|e| e.to_string())?;
    let device = slot.as_mut().ok_or("Device is disconnected")?;
    let mut report = Vec::with_capacity(65);
    report.push(report_id);
    report.extend(payload);
    if let Err(error) = device.write(&report) {
        *slot = None;
        return Err(error.to_string());
    }
    Ok(())
}

#[tauri::command]
fn mouse_disconnect(state: State<'_, MouseState>) -> Result<(), String> {
    *state.0.lock().map_err(|e| e.to_string())? = None;
    Ok(())
}

#[tauri::command]
fn mouse_connected(state: State<'_, MouseState>) -> Result<bool, String> {
    let mut slot = state.0.lock().map_err(|e| e.to_string())?;
    let Some(device) = slot.as_ref() else { return Ok(false); };
    let info = device.get_device_info().map_err(|e| e.to_string())?;
    let api = hidapi::HidApi::new().map_err(|e| e.to_string())?;
    if !api.device_list().any(|candidate| candidate.path() == info.path()) {
        *slot = None;
        return Ok(false);
    }
    Ok(true)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(MouseState(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![mouse_probe, mouse_send, mouse_disconnect, mouse_connected])
        .run(tauri::generate_context!())
        .expect("failed to run gaming mouse control center");
}
