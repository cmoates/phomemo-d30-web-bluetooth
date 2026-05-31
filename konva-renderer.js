/**
 * Unified Konva-based Print Preview Renderer
 * Handles all tabs (Text, Barcode, Image, QR, QR+Text) with centralized
 * scaling, sizing, and rendering logic.
 */

class UnifiedPrintPreview {
	constructor() {
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
		
		// Re-render current tab
		this.renderCurrentTab();
	}
	
	onTabChange(tabId) {
		this.currentTab = tabId;
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
	renderText(manager) {
		const inputText = document.getElementById('inputText');
		const inputFontSize = document.getElementById('inputFontSize');
		
		manager.contentLayer.destroyChildren();
		const printArea = manager.getPrintableArea();
		
		if (!inputText || !inputFontSize) return;
		
		const text = inputText.value || 'Hello, world!';
		const fontSizeMm = parseFloat(inputFontSize.value) || 6;
		const fontSize = fontSizeMm * this.PIXELS_PER_MM;
		
		const lines = text.split('\n');
		const lineHeight = fontSize * 1.2;
		const totalHeight = lineHeight * lines.length;
		const startY = printArea.y + Math.max(0, (printArea.height - totalHeight) / 2);
		
		lines.forEach((line, index) => {
			const y = startY + (index * lineHeight);
			
			const textNode = new Konva.Text({
				x: printArea.x,
				y: y,
				text: line || ' ',
				fontSize: fontSize,
				fontFamily: 'Arial, sans-serif',
				fill: '#000000',
				align: 'center',
				width: printArea.width,
				height: lineHeight
			});
			
			manager.contentLayer.add(textNode);
		});
		
		manager.contentLayer.draw();
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
			manager.contentLayer.draw();
			return;
		}
		
		// Generate barcode on temp canvas
		const tempCanvas = document.createElement('canvas');
		tempCanvas.width = 400;
		tempCanvas.height = 100;
		
		try {
			window.JsBarcode(tempCanvas, data, {
				format: jsbarFormat,
				width: 2,
				height: 80,
				margin: 0
			});
			
			// Calculate scaling to fit in printable area
			const maxWidth = printArea.width * 0.9;
			const maxHeight = printArea.height * 0.8;
			const barcodeRatio = tempCanvas.width / tempCanvas.height;
			
			let barcodeWidth = maxWidth;
			let barcodeHeight = barcodeWidth / barcodeRatio;
			
			if (barcodeHeight > maxHeight) {
				barcodeHeight = maxHeight;
				barcodeWidth = barcodeHeight * barcodeRatio;
			}
			
			// Convert canvas to Konva Image
			const konvaImage = new Konva.Image({
				image: tempCanvas,
				x: printArea.x + (printArea.width - barcodeWidth) / 2,
				y: printArea.y + (printArea.height - barcodeHeight) / 2,
				width: barcodeWidth,
				height: barcodeHeight
			});
			
			manager.contentLayer.add(konvaImage);
			manager.contentLayer.draw();
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
			manager.contentLayer.draw();
		}
	}
	
	renderImage(manager) {
		const inputImage = document.getElementById('inputImage');
		
		manager.contentLayer.destroyChildren();
		const printArea = manager.getPrintableArea();
		
		if (!inputImage || !inputImage.files[0]) {
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
			manager.contentLayer.draw();
			return;
		}
		
		const reader = new FileReader();
		reader.onload = (e) => {
			const img = new Image();
			img.onload = () => {
				// Calculate aspect ratio and fit to printable area
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
				manager.contentLayer.draw();
			};
			img.src = e.target.result;
		};
		reader.readAsDataURL(inputImage.files[0]);
	}
	
	renderQR(manager) {
		const inputQR = document.getElementById('inputQR');
		const inputQRLayout = document.getElementById('inputQRLayout');
		
		manager.contentLayer.destroyChildren();
		const printArea = manager.getPrintableArea();
		
		if (!inputQR) return;
		
		const data = inputQR.value || 'https://example.com';
		const numCodes = parseInt(inputQRLayout?.value || '1');
		
		const tempCanvas = document.createElement('canvas');
		
		window.QRCode.toCanvas(tempCanvas, data, { width: 300 }, (err) => {
			if (err) {
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
				manager.contentLayer.draw();
				return;
			}
			
			// Calculate QR size based on number of codes
			// Each code gets equal width and height
			const widthPerCode = printArea.width / numCodes;
			const qrSize = Math.min(widthPerCode, printArea.height) * 0.95;
			
			// Render QR codes side by side
			for (let i = 0; i < numCodes; i++) {
				const qrImage = new Konva.Image({
					image: tempCanvas,
					x: printArea.x + (i * widthPerCode) + (widthPerCode - qrSize) / 2,
					y: printArea.y + (printArea.height - qrSize) / 2,
					width: qrSize,
					height: qrSize
				});
				manager.contentLayer.add(qrImage);
			}
			
			manager.contentLayer.draw();
		});
	}
	
	renderQRText(manager) {
		const inputQRTextData = document.getElementById('inputQRTextData');
		const inputQRText = document.getElementById('inputQRText');
		const inputQRTextSize = document.getElementById('inputQRTextSize');
		
		manager.contentLayer.destroyChildren();
		const printArea = manager.getPrintableArea();
		
		// Render QR on left half, text on right half
		const qrArea = {
			x: printArea.x,
			y: printArea.y,
			width: printArea.width * 0.5,
			height: printArea.height
		};
		
		const textArea = {
			x: printArea.x + printArea.width * 0.5,
			y: printArea.y,
			width: printArea.width * 0.5,
			height: printArea.height
		};
		
		// Render QR
		if (inputQRTextData) {
			const data = inputQRTextData.value || 'https://example.com';
			const tempCanvas = document.createElement('canvas');
			
			window.QRCode.toCanvas(tempCanvas, data, { width: 200 }, (err) => {
				if (!err) {
					const qrSize = qrArea.height * 0.98;
					const qrImage = new Konva.Image({
						image: tempCanvas,
						x: qrArea.x,
						y: qrArea.y + (qrArea.height - qrSize) / 2,
						width: qrSize,
						height: qrSize
					});
					manager.contentLayer.add(qrImage);
					manager.contentLayer.draw();
				}
			});
		}
		
		// Render text 
		if (inputQRText && inputQRTextSize) {
			const text = inputQRText.value || 'Label';
			const fontSizeMm = parseFloat(inputQRTextSize.value) || 4;
			const fontSize = fontSizeMm * this.PIXELS_PER_MM;
			
			// Use Konva's text with word wrapping on spaces and newlines
			const textNode = new Konva.Text({
				x: textArea.x,
				y: textArea.y + 8,
				text: text,
				fontSize: fontSize,
				fontFamily: 'Arial, sans-serif',
				fill: '#000000',
				align: 'left',
				width: textArea.width,
				wrap: 'word'
			});
			
			manager.contentLayer.add(textNode);
			manager.contentLayer.draw();
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
let printPreview = null;

function initializePrintPreview() {
	if (printPreview) return;
	printPreview = new UnifiedPrintPreview();
	
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
			if (manager && printPreview.currentTab === 'nav-image-tab') {
				printPreview.renderImage(manager);
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
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initializePrintPreview);
} else {
	initializePrintPreview();
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
