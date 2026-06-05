# Phomemo D30 Web Printing Tool}

Original code base from odensc: https://github.com/odensc/phomemo-d30-web-bluetooth

This started out as a "let's add a feature" and turned into a massive rewrite. Since odensc previously stated that he wasn't really interested in this as a long term expanded project, I'm just forking it here. I've also incorporated some various other improvements that others have done. All credit is of course in the commits.

Proof of concept and demo of printing to a [Phomemo D30](https://www.amazon.com/dp/B08HV3MPFD/?tag=cmoates-20) Bluetooth label maker via the browser using Web Bluetooth.

## Features

- ✅ 5 different print modes: Text, Barcode, Image, QR Code, QR Code + Text
- ✅ Unified Konva-based rendering for all canvases
- ✅ Bluetooth connectivity via Web Bluetooth API
- ✅ Adjustable label sizes with presets
- ✅ Demo Mode for testing without hardware (add ?debug to URL)
- ✅ Real-time preview with font size and alignment controls
- ✅ Support for CODE128, UPC, EAN13, EAN8 barcodes
- ✅ QR code layout with 1-3 codes per label to save on labels

## Quick Start

1. **For Testing Without Hardware:**
   - Open the application in a Web Bluetooth-compatible browser
   - Make sure the URL has ?debug in it, to enable the display of the button
   - Click the **"Demo Mode"** button
   - The Print button will become enabled
   - Select text/barcode/image and click Print
   - Check browser console (F12 → Console tab) to see print data being sent

2. **For Real Printer:**
   - Power on your D30 printer and enter pairing mode
   - Click the **"Connect"** button
   - Select your D30 from the Bluetooth device picker
   - Once connected, use Print button to send jobs to printer

## Usage Guide

### Text Mode
- Enter text in the text input field
- Adjust font size with slider (0.5mm - 10mm)
- Choose alignment: left, center, or right
- Font sizes wrap automatically on spaces

### Barcode Mode
- Enter barcode data (must be valid for selected format)
- Select barcode format: CODE128, UPC, EAN13, EAN8
- Height is automatically calculated

### Image Mode
- Upload an image file
- Image will be converted to black & white for thermal printer

### QR Code Mode
- Enter QR code data
- Adjust quantity slider (1-3 codes)

### QR Code + Text Mode
- Combine QR code with text on same label
- QR code text size adjustable separately

### Label Size
- Use preset buttons for common sizes
- Or manually enter custom width/height in mm

## Troubleshooting

### "Bluetooth device selection timed out"
**Cause:** No D30 device found or selection took >30 seconds
**Fix:** 
- Make sure D30 printer is powered on
- Enter pairing/pairing mode on printer (usually button press)
- Try "Demo Mode" to test without hardware
- Check that browser supports Web Bluetooth (Chrome, Edge, Opera, others?)

### "No D30 devices found"
**Cause:** Bluetooth picker showed but no devices matched "D30" prefix
**Fix:**
- Verify printer is powered on and in pairing mode
- Check printer name starts with "D30"
- Try moving closer to printer
- Restart printer and try again

### "Permission denied. Web Bluetooth requires HTTPS or localhost"
**Cause:** Page must be served over HTTPS or localhost for security
**Fix:**
- Use `http://localhost:8000` during development
- Deploy to HTTPS URL for production

### "Web Bluetooth API not available"
**Cause:** Browser doesn't support Web Bluetooth
**Fix:**
- Use Chrome, Edge, or Opera (Chromium-based)
- Update to latest version of browser
- Enable experimental features if needed

### Print button stays disabled
**Cause:** Not connected to printer or initialization incomplete
**Fix:**
- Click "Connect" button and select printer
- Or click "Demo Mode" to test workflow
- Check browser console (F12) for errors

### Print data doesn't appear
**Cause:** Connection lost or printer in sleep mode
**Fix:**
- Check printer is still powered on
- Wait 2 seconds after "Connected to D30" message
- Try disconnecting and reconnecting
- Check console logs for transmission status

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Yes | Full support, tested |
| Edge | ✅ Yes | Chromium-based, full support |
| Opera | ✅ Yes | Chromium-based, full support |
| Safari | ❌ No | iOS/Mac don't support Web Bluetooth |
| Firefox | ❌ No | No Web Bluetooth support |

## Development

### Local Testing
```bash
# Start local server
python3 -m http.server 8000

# Open browser
http://localhost:8000
```

### Architecture
- **index.html** - Main application, 1500+ lines with all UI and Bluetooth handlers
- **konva-renderer.js** - Unified canvas rendering using Konva.js library
- **index.js** - Utility functions (mostly deprecated)

### Key Technologies
- Konva.js 9.2.0 - Canvas rendering
- Bootstrap 5.3.3 - UI framework
- JsBarcode 3.11.6 - Barcode generation
- QRCode.js 1.5.1 - QR code generation
- Web Bluetooth API - Printer connectivity

### Debugging
Open browser Developer Tools (F12):
- **Console tab** - Shows connection status, print data sizes, errors
- **Network tab** - Shows Bluetooth characteristic writes
- **Application tab** - Check localStorage if used

## Demo Mode

Demo Mode allows full testing of the application without physical hardware:
- Click "Demo Mode" button
- Application simulates D30 connection
- Print button becomes enabled
- Print data logs to console instead of transmitting
- Useful for UI testing and layout verification

View print data in console:
```
Demo: Would send 128 bytes to printer
Sent 3840/3840 bytes (done)
Print complete!
```

## Known Limitations

1. Web Bluetooth only works over HTTPS or localhost
2. Requires physical Bluetooth hardware on the computer
3. Printer must support the D30 Bluetooth interface
4. Text wrapping limited to space boundaries
5. Maximum 6 lines of text per label

## Demo

[A demo is available here.](https://cmoates.github.io/phomemo-d30-web-bluetooth/) Please use a Web Bluetooth-compatible browser (e.g. Chromium-based).

## Credits

Inspiration for the data structure / image conversion was taken from some other great open-source projects. Thanks to:

- https://github.com/WebBluetoothCG/demos
- https://github.com/Knightro63/phomemo

## Disclosure

*As an Amazon Associate, I earn from qualifying purchases.*
