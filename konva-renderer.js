/**
 * Unified Konva-based Print Preview Renderer
 * Handles all tabs (Text, Barcode, Image, QR, QR+Text) with centralized
 * scaling, sizing, and rendering logic.
 */

console.log('[konva-renderer] Script starting to load');

class UnifiedPrintPreview {
	constructor() {
		console.log('[konva-renderer] UnifiedPrintPreview constructor called');
		// Constants
		this.PIXELS_PER_MM = 8;
		this.HORIZONTAL_MARGIN_MM = 1;
		this.DISPLAY_HEIGHT_MM = 15;
		
		// State
		this.labelSize = { width: 40, height: 12 };
		this.currentTab = 'nav-text-tab';
		this.managers = {};
		
		this.init();
	}
	
	init() {
		// Get all canvas containers
		const canvasIds = ['canvas', 'canvasBarcode', 'canvasImage', 'canvasQR', 'canvasQRText'];
		canvasIds.forEach(id => {
			const container = document.getElementById(id)?.parentElement;
			if (container) {
				this.managers[id] = new CanvasManager(container, id, this.labelSize, this.PIXELS_PER_MM, this.HORIZONTAL_MARGIN_MM, this.DISPLAY_HEIGHT_MM);
			}
		});
		
		// Set up listeners for label dimension changes
		const inputWidth = document.getElementById('inputWidth');
		const inputHeight = document.getElementById('inputHeight');
		
		if (inputWidth) {
			inputWidth.addEventListener('input', () => this.updateLabelSize());
		}
		if (inputHeight) {
			inputHeight.addEventListener('input', () => this.updateLabelSize());
		}
		
		// Set up tab change listeners
		const tabButtons = document.querySelectorAll('[data-bs-toggle="tab"]');
		tabButtons.forEach(btn => {
			btn.addEventListener('shown.bs.tab', (e) => {
				const tabId = e.target.getAttribute('id');
				this.onTabChange(tabId);
			});
		});
		
		// Set up initial content rendering
		setTimeout(() => this.renderAllTabs(), 100);
	}
	
	updateLabelSize() {
		const inputWidth = document.getElementById('inputWidth');
		const inputHeight = document.getElementById('inputHeight');
		
		if (!inputWidth || !inputHeight) return;
		
		const width = parseInt(inputWidth.value) || 40;
		const height = parseInt(inputHeight.value) || 12;
		
		this.labelSize.width = width;
		this.labelSize.height = height;
		
		// Update all canvas managers
		Object.values(this.managers).forEach(manager => {
			try { manager.updateSize(this.labelSize); } catch(e) { console.error(e); }
		});
		
		// Re-render all tabs to ensure every single preview (including inactive ones)
		// is recalculated with the new dimensions, preventing scaling or resizing.
		this.renderAllTabs();
	}
	
	onTabChange(tabId) {
		this.currentTab = tabId;
		
		const tabCanvasMap = {
			'nav-text-tab': 'canvas',
			'nav-barcode-tab': 'canvasBarcode',
			'nav-image-tab': 'canvasImage',
			'nav-qr-tab': 'canvasQR',
			'nav-qr-text-tab': 'canvasQRText'
		};
		const canvasId = tabCanvasMap[tabId] || 'canvas';
		
		// Update visibility of the preview containers in the right column
		document.querySelectorAll('.preview-wrapper').forEach(el => {
			el.classList.remove('active');
		});
		const activeWrapper = document.getElementById('preview-wrapper-' + canvasId);
		if (activeWrapper) {
			activeWrapper.classList.add('active');
		}
		
		this.renderCurrentTab();
	}
	
	renderCurrentTab() {
		const tabCanvasMap = {
			'nav-text-tab': 'canvas',
			'nav-barcode-tab': 'canvasBarcode',
			'nav-image-tab': 'canvasImage',
			'nav-qr-tab': 'canvasQR',
			'nav-qr-text-tab': 'canvasQRText'
		};
		
		const canvasId = tabCanvasMap[this.currentTab] || 'canvas';
		const manager = this.managers[canvasId];
		
		if (!manager) return;
		
		try {
			switch(canvasId) {
				case 'canvas':
					this.renderText(manager);
					break;
				case 'canvasBarcode':
					this.renderBarcode(manager);
					break;
				case 'canvasImage':
					this.renderImage(manager);
					break;
				case 'canvasQR':
					this.renderQR(manager);
					break;
				case 'canvasQRText':
					this.renderQRText(manager);
					break;
			}
		} catch(e) {
			console.error(`Error rendering ${canvasId}:`, e);
		}
	}
	
	renderAllTabs() {
		Object.keys(this.managers).forEach(canvasId => {
			const manager = this.managers[canvasId];
			if (manager && manager.contentLayer) {
				try {
					switch(canvasId) {
						case 'canvas':
							this.renderText(manager);
							break;
						case 'canvasBarcode':
							this.renderBarcode(manager);
							break;
						case 'canvasImage':
							this.renderImage(manager);
							break;
						case 'canvasQR':
							this.renderQR(manager);
							break;
						case 'canvasQRText':
							this.renderQRText(manager);
							break;
					}
				} catch(e) {
					console.error(`Error rendering ${canvasId}:`, e);
				}
			}
		});
	}
	
	// Render functions for each tab type
	getTextAlignment() {
		// Determine text alignment from button states
		const btnAlignLeft = document.getElementById('btnAlignLeft');
		const btnAlignCenter = document.getElementById('btnAlignCenter');
		const btnAlignRight = document.getElementById('btnAlignRight');
		
		if (btnAlignLeft?.classList.contains('active')) return 'left';
		if (btnAlignRight?.classList.contains('active')) return 'right';
		return 'center'; // default
	}

	getTextStyle() {
		// Determine text style (bold, italic) from button states
		const btnBold = document.getElementById('btnBold');
		const btnItalic = document.getElementById('btnItalic');
		
		const isBold = btnBold?.classList.contains('active');
		const isItalic = btnItalic?.classList.contains('active');
		
		let fontStyle = 'normal';
		if (isBold && isItalic) {
			fontStyle = 'bold italic';
		} else if (isBold) {
			fontStyle = 'bold';
		} else if (isItalic) {
			fontStyle = 'italic';
		}
		
		return fontStyle;
	}

	isUppercaseActive() {
		// Check if uppercase button is active
		const btnUppercase = document.getElementById('btnUppercase');
		return btnUppercase?.classList.contains('active');
	}

	renderText(manager) {
		const inputText = document.getElementById('inputText');
		const inputFontSize = document.getElementById('inputFontSize');
		
		manager.contentLayer.destroyChildren();
		const printArea = manager.getPrintableArea();
		
		if (!inputText || !inputFontSize) return;
		
		let text = inputText.value || 'Hello, world!';
		const fontSizeMm = parseFloat(inputFontSize.value) || 6;
		const fontSize = fontSizeMm * this.PIXELS_PER_MM;
		
		// Apply uppercase transform if button is active (display only, doesn't modify textarea)
		if (this.isUppercaseActive()) {
			text = text.toUpperCase();
		}
		
		// Get current text alignment and style from button states
		const textAlignment = this.getTextAlignment();
		const fontStyle = this.getTextStyle();
		
		// Create actual text node to measure its height and check if multi-line
		const tempText = new Konva.Text({
			text: text,
			fontSize: fontSize,
			fontFamily: 'Arial, sans-serif',
			align: textAlignment,
			fontStyle: fontStyle,
			width: printArea.width,
			wrap: 'word'
		});
		
		// Check if text spans multiple lines
		// Lines = explicit newlines + wrapped lines
		const lineCount = text.split('\n').length;
		const actualTextHeight = tempText.getHeight();
		
		// Measure single line height (cap-height, no descenders)
		const tempSingleLine = new Konva.Text({
			text: 'X',
			fontSize: fontSize,
			fontFamily: 'Arial, sans-serif',
			align: textAlignment,
			fontStyle: fontStyle
		});
		const singleLineHeight = tempSingleLine.getHeight();
		
		// Determine which height to use for centering
		// Single line: center on x-height (cap-height)
		// Multi-line: center on full text block height
		// Check both explicit newlines AND actual wrapping (text may wrap differently in uppercase vs lowercase)
		let centeringHeight;
		const isWrapped = actualTextHeight > singleLineHeight * 1.1; // Allow 10% tolerance for font rendering variance
		if (lineCount > 1 || isWrapped) {
			// Multi-line: use full text height
			centeringHeight = actualTextHeight;
		} else {
			// Single line: use x-height (cap-height without descenders)
			centeringHeight = singleLineHeight;
		}
		
		// Calculate vertical position for centering
		let startY = printArea.y + Math.max(0, (printArea.height - centeringHeight) / 2);
		
		// Adjust downward to account for visual balance
		// Single line: +1px (descenders extend below baseline)
		// Multi-line: +2px (better visual balance for wrapped text)
		if (lineCount > 1 || isWrapped) {
			startY += 2;
		} else {
			startY += 1;
		}
		
		const textNode = new Konva.Text({
			x: printArea.x,
			y: startY,
			text: text,
			fontSize: fontSize,
			fontFamily: 'Arial, sans-serif',
			fill: '#000000',
			align: textAlignment,
			fontStyle: fontStyle,
			width: printArea.width,
			wrap: 'word'
		});
		
		manager.contentLayer.add(textNode);
		manager.stage.draw();
	}
	
	renderBarcode(manager) {
		const inputBarcode = document.getElementById('inputBarcode');
		const inputBarcodeType = document.getElementById('inputBarcodeType');
		
		manager.contentLayer.destroyChildren();
		const printArea = manager.getPrintableArea();
		
		if (!inputBarcode || !inputBarcodeType) return;
		
		const data = (inputBarcode.value || '123456').trim();
		const format = (inputBarcodeType.value || '').toUpperCase();
		
		// Validate format and convert to JsBarcode format names (lowercase)
		let jsbarFormat = format.toLowerCase();
		let isValid = true;
		
		if (format === 'UPC') {
			isValid = /^\d{12}$/.test(data);
			jsbarFormat = 'upc';
		} else if (format === 'EAN') {
			if (/^\d{13}$/.test(data)) {
				jsbarFormat = 'ean13';
			} else if (/^\d{8}$/.test(data)) {
				jsbarFormat = 'ean8';
			} else {
				isValid = false;
			}
		} else if (format === 'CODE128') {
			isValid = data.length > 0;
			jsbarFormat = 'code128';
		} else {
			// Default or unknown format
			isValid = data.length > 0;
		}
		
		if (!isValid) {
			const errorMsg = new Konva.Text({
				x: printArea.x,
				y: printArea.y + printArea.height / 2 - 10,
				text: 'Invalid barcode data for ' + format,
				fontSize: 12,
				fill: '#999',
				align: 'center',
				width: printArea.width
			});
			manager.contentLayer.add(errorMsg);
			manager.stage.draw();
			return;
		}
		
		// Generate barcode on temp canvas
		const tempCanvas = document.createElement('canvas');
		const barcodeHeight = Math.floor(printArea.height * 0.7);
		
		try {
			// Try generating at width: 2 first (clean and easily readable)
			let barWidthSetting = 2;
			window.JsBarcode(tempCanvas, data, {
				format: jsbarFormat,
				width: barWidthSetting,
				height: barcodeHeight,
				margin: 0
			});
			
			// If too wide for the printable area, fall back to width: 1
			if (tempCanvas.width > printArea.width) {
				barWidthSetting = 1;
				window.JsBarcode(tempCanvas, data, {
					format: jsbarFormat,
					width: barWidthSetting,
					height: barcodeHeight,
					margin: 0
				});
			}
			
			let barcodeWidth = tempCanvas.width;
			let barcodeHeightVal = tempCanvas.height;
			
			// If it STILL doesn't fit even at width: 1, scale it down
			if (barcodeWidth > printArea.width) {
				const scale = printArea.width / barcodeWidth;
				barcodeWidth = printArea.width;
				barcodeHeightVal = barcodeHeightVal * scale;
			}
			
			// Convert canvas to Konva Image (1:1 rendering avoids anti-aliasing blur)
			const konvaImage = new Konva.Image({
				image: tempCanvas,
				x: printArea.x + (printArea.width - barcodeWidth) / 2,
				y: printArea.y + (printArea.height - barcodeHeightVal) / 2,
				width: barcodeWidth,
				height: barcodeHeightVal
			});
			
			manager.contentLayer.add(konvaImage);
			manager.stage.draw();
		} catch (err) {
			console.error('Barcode error:', err);
			const errorText = err?.message || (typeof err === 'string' ? err : 'Failed to generate barcode');
			const errorMsg = new Konva.Text({
				x: printArea.x,
				y: printArea.y + printArea.height / 2 - 10,
				text: 'Barcode error: ' + errorText,
				fontSize: 10,
				fill: '#999',
				align: 'center',
				width: printArea.width
			});
			manager.contentLayer.add(errorMsg);
			manager.stage.draw();
		}
	}
	
	renderImage(manager) {
		const inputImage = document.getElementById('inputImage');
		
		manager.contentLayer.destroyChildren();
		const printArea = manager.getPrintableArea();
		
		if (!inputImage || !inputImage.files[0]) {
			manager.loadedImage = null; // Clear cached image
			const placeholder = new Konva.Text({
				x: printArea.x,
				y: printArea.y + printArea.height / 2 - 10,
				text: 'No image selected',
				fontSize: 14,
				fill: '#ccc',
				align: 'center',
				width: printArea.width
			});
			manager.contentLayer.add(placeholder);
			manager.stage.draw();
			return;
		}
		
		// Render cached image synchronously if available to prevent async race conditions during resize
		if (manager.loadedImage) {
			this.drawImageToStage(manager, manager.loadedImage, printArea);
			return;
		}
		
		const reader = new FileReader();
		reader.onload = (e) => {
			const img = new Image();
			img.onload = () => {
				manager.loadedImage = img;
				this.drawImageToStage(manager, img, printArea);
			};
			img.src = e.target.result;
		};
		reader.readAsDataURL(inputImage.files[0]);
	}
	
	drawImageToStage(manager, img, printArea) {
		const imgRatio = img.width / img.height;
		const printRatio = printArea.width / printArea.height;
		
		let imgWidth, imgHeight;
		if (imgRatio > printRatio) {
			imgWidth = printArea.width * 0.9;
			imgHeight = imgWidth / imgRatio;
		} else {
			imgHeight = printArea.height * 0.9;
			imgWidth = imgHeight * imgRatio;
		}
		
		const konvaImage = new Konva.Image({
			image: img,
			x: printArea.x + (printArea.width - imgWidth) / 2,
			y: printArea.y + (printArea.height - imgHeight) / 2,
			width: imgWidth,
			height: imgHeight
		});
		
		manager.contentLayer.add(konvaImage);
		manager.stage.draw();
	}
	
	renderQR(manager) {
		const inputQR = document.getElementById('inputQR');
		const inputQRLayout = document.getElementById('inputQRLayout');
		
		manager.contentLayer.destroyChildren();
		const printArea = manager.getPrintableArea();
		
		if (!inputQR) return;
		
		const data = inputQR.value || 'https://example.com';
		const numCodes = parseInt(inputQRLayout?.value || '1');
		
		const widthPerCode = printArea.width / numCodes;
		const qrSize = Math.floor(Math.min(widthPerCode, printArea.height) * 0.95);
		
		// Create placeholder Konva.Image nodes synchronously to avoid overlapping race conditions
		const qrImages = [];
		for (let i = 0; i < numCodes; i++) {
			const qrX = Math.floor(printArea.x + (i * widthPerCode) + (widthPerCode - qrSize) / 2);
			const qrY = Math.floor(printArea.y + (printArea.height - qrSize) / 2);
			
			const qrImage = new Konva.Image({
				x: qrX,
				y: qrY,
				width: qrSize,
				height: qrSize,
				name: 'qr-code-image-' + i
			});
			manager.contentLayer.add(qrImage);
			qrImages.push(qrImage);
		}
		manager.stage.draw();
		
		const tempCanvas = document.createElement('canvas');
		
		// Render QR code at exactly target size with small margin (1 module) to prevent scaling and maximize module size
		window.QRCode.toCanvas(tempCanvas, data, { width: qrSize, margin: 1 }, (err) => {
			if (err) {
				// Clear content layer and draw error message
				manager.contentLayer.destroyChildren();
				const errorMsg = new Konva.Text({
					x: printArea.x,
					y: printArea.y + printArea.height / 2 - 10,
					text: 'QR Code error',
					fontSize: 12,
					fill: '#999',
					align: 'center',
					width: printArea.width
				});
				manager.contentLayer.add(errorMsg);
				manager.stage.draw();
				return;
			}
			
			// Update the image of the placeholder nodes
			qrImages.forEach(qrImage => {
				qrImage.image(tempCanvas);
			});
			manager.stage.draw();
		});
	}
	
	renderQRText(manager) {
		const inputQRTextData = document.getElementById('inputQRTextData');
		const inputQRText = document.getElementById('inputQRText');
		const inputQRTextSize = document.getElementById('inputQRTextSize');
		
		manager.contentLayer.destroyChildren();
		const printArea = manager.getPrintableArea();
		
		const qrSize = Math.floor(printArea.height * 0.98);
		const qrAreaWidth = qrSize + 4; // QR + small margin
		
		const qrArea = {
			x: printArea.x,
			y: printArea.y,
			width: qrAreaWidth,
			height: printArea.height
		};
		
		const textArea = {
			x: printArea.x + qrAreaWidth,
			y: printArea.y,
			width: printArea.width - qrAreaWidth,
			height: printArea.height
		};
		
		// Create placeholder QR image synchronously to avoid race conditions
		let qrImage = null;
		if (inputQRTextData) {
			qrImage = new Konva.Image({
				x: qrArea.x,
				y: qrArea.y + (qrArea.height - qrSize) / 2,
				width: qrSize,
				height: qrSize,
				name: 'qr-text-image'
			});
			manager.contentLayer.add(qrImage);
		}
		
		// Render text synchronously
		if (inputQRText && inputQRTextSize) {
			const text = inputQRText.value || 'Label';
			const fontSizeMm = parseFloat(inputQRTextSize.value) || 4;
			const fontSize = fontSizeMm * this.PIXELS_PER_MM;
			
			const textPadding = 4;
			const textNode = new Konva.Text({
				x: textArea.x + textPadding,
				y: textArea.y + 8,
				text: text,
				fontSize: fontSize,
				fontFamily: 'Arial, sans-serif',
				fill: '#000000',
				align: 'left',
				width: textArea.width - textPadding,
				wrap: 'word'
			});
			
			manager.contentLayer.add(textNode);
		}
		
		manager.stage.draw();
		
		// Render QR code asynchronously
		if (inputQRTextData && qrImage) {
			const data = inputQRTextData.value || 'https://example.com';
			const tempCanvas = document.createElement('canvas');
			
			// Render QR code at exactly target size with small margin (1 module) to prevent scaling and maximize module size
			window.QRCode.toCanvas(tempCanvas, data, { width: qrSize, margin: 1 }, (err) => {
				if (!err && qrImage) {
					qrImage.image(tempCanvas);
					manager.stage.draw();
				}
			});
		}
	}
}

/**
 * Individual Canvas Manager for each tab
 */
class CanvasManager {
	constructor(container, canvasId, labelSize, pixelsPerMm, horizontalMarginMm, displayHeightMm) {
		this.container = container;
		this.canvasId = canvasId;
		this.labelSize = labelSize;
		this.pixelsPerMm = pixelsPerMm;
		this.horizontalMarginMm = horizontalMarginMm;
		this.displayHeightMm = displayHeightMm;
		
		this.stage = null;
		this.backgroundLayer = null;
		this.contentLayer = null;
		
		this.init();
	}
	
	init() {
		const width = (this.labelSize.width + 2 * this.horizontalMarginMm) * this.pixelsPerMm;
		const height = this.displayHeightMm * this.pixelsPerMm;
		
		// Remove old Konva container if exists
		const oldContainer = this.container.querySelector('.konva-container');
		if (oldContainer) oldContainer.remove();
		
		// Create Konva stage
		this.stage = new Konva.Stage({
			container: this.container,
			width: width,
			height: height
		});
		
		// Hide original canvas
		const originalCanvas = this.container.querySelector('canvas[id="' + this.canvasId + '"]');
		if (originalCanvas) originalCanvas.style.display = 'none';
		
		// Background layer
		this.backgroundLayer = new Konva.Layer();
		this.stage.add(this.backgroundLayer);
		
		// Content layer
		this.contentLayer = new Konva.Layer();
		this.stage.add(this.contentLayer);
		
		this.drawBackground();
	}
	
	drawBackground() {
		this.backgroundLayer.destroyChildren();
		
		const width = (this.labelSize.width + 2 * this.horizontalMarginMm) * this.pixelsPerMm;
		const height = this.displayHeightMm * this.pixelsPerMm;
		const marginLeftPx = this.horizontalMarginMm * this.pixelsPerMm;
		const marginTopPx = (this.displayHeightMm - this.labelSize.height) * this.pixelsPerMm / 2;
		const printableWidth = this.labelSize.width * this.pixelsPerMm;
		const printableHeight = this.labelSize.height * this.pixelsPerMm;
		
		// Gray background
		const background = new Konva.Rect({
			x: 0,
			y: 0,
			width: width,
			height: height,
			fill: '#e8e8e8'
		});
		this.backgroundLayer.add(background);
		
		// White printable area
		const printableArea = new Konva.Rect({
			x: marginLeftPx,
			y: marginTopPx,
			width: printableWidth,
			height: printableHeight,
			fill: '#ffffff'
		});
		this.backgroundLayer.add(printableArea);
		
		this.backgroundLayer.draw();
	}
	
	updateSize(labelSize) {
		this.labelSize = labelSize;
		
		if (!this.stage) return;
		
		const width = (this.labelSize.width + 2 * this.horizontalMarginMm) * this.pixelsPerMm;
		const height = this.displayHeightMm * this.pixelsPerMm;
		
		this.stage.width(width);
		this.stage.height(height);
		
		this.drawBackground();
	}
	
	getPrintableArea() {
		const marginLeftPx = this.horizontalMarginMm * this.pixelsPerMm;
		const marginTopPx = (this.displayHeightMm - this.labelSize.height) * this.pixelsPerMm / 2;
		const width = this.labelSize.width * this.pixelsPerMm;
		const height = this.labelSize.height * this.pixelsPerMm;
		
		return { x: marginLeftPx, y: marginTopPx, width, height };
	}
}

// Initialize globally
window.printPreview = null;

function initializePrintPreview() {
	if (window.printPreview) return;
	window.printPreview = new UnifiedPrintPreview();
	console.log('[konva-renderer] printPreview initialized:', window.printPreview);
	
	// Wire up content update listeners
	setupEventListeners();
}

function setupEventListeners() {
	// Text tab inputs
	const textInputs = ['inputText', 'inputFontSize', 'inputFontSizeSlider'];
	textInputs.forEach(id => {
		const el = document.getElementById(id);
		if (el) el.addEventListener('input', () => {
			const manager = printPreview.managers['canvas'];
			if (manager && printPreview.currentTab === 'nav-text-tab') {
				printPreview.renderText(manager);
			}
		});
	});
	
	// Barcode tab inputs
	const barcodeInputs = ['inputBarcode', 'inputBarcodeType'];
	barcodeInputs.forEach(id => {
		const el = document.getElementById(id);
		if (el) {
			el.addEventListener('change', () => {
				const manager = printPreview.managers['canvasBarcode'];
				if (manager && printPreview.currentTab === 'nav-barcode-tab') {
					printPreview.renderBarcode(manager);
				}
			});
			el.addEventListener('input', () => {
				const manager = printPreview.managers['canvasBarcode'];
				if (manager && printPreview.currentTab === 'nav-barcode-tab') {
					printPreview.renderBarcode(manager);
				}
			});
		}
	});
	
	// Image tab input
	const imageInput = document.getElementById('inputImage');
	if (imageInput) {
		imageInput.addEventListener('change', () => {
			const manager = printPreview.managers['canvasImage'];
			if (manager) {
				manager.loadedImage = null; // Clear cached image on file change
				if (printPreview.currentTab === 'nav-image-tab') {
					printPreview.renderImage(manager);
				}
			}
		});
	}
	
	// QR Code tab inputs
	const qrInputs = ['inputQR', 'inputQRLayout'];
	qrInputs.forEach(id => {
		const el = document.getElementById(id);
		if (el) {
			el.addEventListener('input', () => {
				const manager = printPreview.managers['canvasQR'];
				if (manager && printPreview.currentTab === 'nav-qr-tab') {
					printPreview.renderQR(manager);
				}
			});
			el.addEventListener('change', () => {
				const manager = printPreview.managers['canvasQR'];
				if (manager && printPreview.currentTab === 'nav-qr-tab') {
					printPreview.renderQR(manager);
				}
			});
		}
	});
	
	// QR + Text tab inputs
	const qrTextInputs = ['inputQRTextData', 'inputQRText', 'inputQRTextSize', 'inputQRTextSizeSlider'];
	qrTextInputs.forEach(id => {
		const el = document.getElementById(id);
		if (el) {
			el.addEventListener('input', () => {
				const manager = printPreview.managers['canvasQRText'];
				if (manager && printPreview.currentTab === 'nav-qr-text-tab') {
					printPreview.renderQRText(manager);
				}
			});
			el.addEventListener('change', () => {
				const manager = printPreview.managers['canvasQRText'];
				if (manager && printPreview.currentTab === 'nav-qr-text-tab') {
					printPreview.renderQRText(manager);
				}
			});
		}
	});
}

// Initialize when DOM is ready
// Always wait for DOMContentLoaded even if readyState says loading is done,
// because with defer attribute we're guaranteed to run after HTML parsing
function initializeModule() {
	initializePrintPreview();
	// Signal that the module has initialized
	if (typeof window.moduleInitialized === 'function') {
		window.moduleInitialized();
	}
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initializeModule);
} else {
	initializeModule();
}

// Global function for HTML onclick handlers
window.setLabelSize = function(height, width) {
	if (!printPreview) return;
	
	const inputHeight = document.getElementById('inputHeight');
	const inputWidth = document.getElementById('inputWidth');
	
	if (inputHeight) inputHeight.value = height;
	if (inputWidth) inputWidth.value = width;
	
	printPreview.updateLabelSize();
	
	// Update active button
	document.querySelectorAll("[onclick*='setLabelSize']").forEach(btn => {
		btn.classList.remove('active');
	});
	event.target.classList.add('active');
};
