import * as ort from 'onnxruntime-web';

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

/**
 * Central configuration singleton for rembg-web
 * Manages model paths and other configuration settings
 */
class RembgConfig {
    static instance;
    customModelPaths = new Map();
    baseUrl = '/models';
    webnnEnabled = false;
    webnnDeviceType = 'gpu';
    webnnPowerPreference = 'default';
    webgpuEnabled = false;
    webgpuPowerPreference = 'default';
    generalLoggingEnabled = false;
    performanceLoggingEnabled = false;
    onnxProfilingEnabled = false;
    sessionCacheBypass = false;
    modelCacheBypass = false;
    constructor() {
        // Initialize with default model paths
        this.initializeDefaultPaths();
    }
    /**
     * Get the singleton instance
     */
    static getInstance() {
        if (!RembgConfig.instance) {
            RembgConfig.instance = new RembgConfig();
        }
        return RembgConfig.instance;
    }
    /**
     * Initialize default model paths
     */
    initializeDefaultPaths() {
        this.customModelPaths.clear();
    }
    /**
     * Set a custom model path for a specific model
     * @param modelName - Name of the model
     * @param path - Custom path to the model file
     */
    setCustomModelPath(modelName, path) {
        this.customModelPaths.set(modelName, path);
        if (this.generalLoggingEnabled) {
            console.log(`Set custom model path for ${modelName}: ${path}`);
        }
    }
    /**
     * Get the model path for a specific model
     * @param modelName - Name of the model
     * @returns The model path, or undefined if not set
     */
    getCustomModelPath(modelName) {
        return this.customModelPaths.get(modelName);
    }
    /**
     * Get all configured model paths
     * @returns Map of model names to their paths
     */
    getAllModelPaths() {
        return new Map(this.customModelPaths);
    }
    /**
     * Check if a model has a custom path configured
     * @param modelName - Name of the model
     * @returns True if a custom path is configured
     */
    hasCustomPath(modelName) {
        const path = this.customModelPaths.get(modelName);
        return path !== undefined && path !== '';
    }
    /**
     * Reset all model paths to defaults
     */
    resetToDefaults() {
        this.baseUrl = '/models'; // Reset baseUrl to default
        this.customModelPaths.clear();
        this.initializeDefaultPaths();
        if (this.generalLoggingEnabled) {
            console.log('Reset all model paths to defaults');
        }
    }
    /**
     * Remove a custom model path (will use default)
     * @param modelName - Name of the model
     */
    removeCustomPath(modelName) {
        if (this.customModelPaths.has(modelName)) {
            this.customModelPaths.delete(modelName);
            if (this.generalLoggingEnabled) {
                console.log(`Removed custom path for ${modelName}`);
            }
        }
    }
    /**
     * Get list of all available model names
     * @returns Array of model names
     */
    getAvailableModels() {
        return [
            'u2net',
            'u2netp',
            'u2net_human_seg',
            'u2net_cloth_seg',
            'isnet-general-use',
            'isnet-anime',
            'silueta',
            'u2net_custom',
        ];
    }
    /**
     * Set the base URL for model paths
     * @param baseUrl - Base URL for model files (e.g., '/models', 'https://example.com/models')
     */
    setBaseUrl(baseUrl) {
        this.baseUrl = baseUrl;
        if (this.generalLoggingEnabled) {
            console.log(`Set base URL for models: ${baseUrl}`);
        }
        // Reinitialize default paths with new base URL
        this.initializeDefaultPaths();
    }
    /**
     * Get the current base URL for model paths
     * @returns The current base URL
     */
    getBaseUrl() {
        return this.baseUrl;
    }
    /**
     * Enable or disable WebNN support globally
     * @param enable - Whether to enable WebNN
     */
    enableWebNN(enable) {
        this.webnnEnabled = enable;
        if (this.generalLoggingEnabled) {
            console.log(`WebNN support ${enable ? 'enabled' : 'disabled'} globally`);
        }
    }
    /**
     * Set the preferred WebNN device type
     * @param deviceType - The device type to prefer ('cpu', 'gpu', or 'npu')
     */
    setWebNNDeviceType(deviceType) {
        this.webnnDeviceType = deviceType;
        if (this.generalLoggingEnabled) {
            console.log(`WebNN device type set to: ${deviceType}`);
        }
    }
    /**
     * Set the WebNN power preference
     * @param preference - The power preference ('default', 'low-power', or 'high-performance')
     */
    setWebNNPowerPreference(preference) {
        this.webnnPowerPreference = preference;
        if (this.generalLoggingEnabled) {
            console.log(`WebNN power preference set to: ${preference}`);
        }
    }
    /**
     * Check if WebNN is enabled globally
     * @returns True if WebNN is enabled
     */
    isWebNNEnabled() {
        return this.webnnEnabled;
    }
    /**
     * Get the current WebNN device type
     * @returns The current device type
     */
    getWebNNDeviceType() {
        return this.webnnDeviceType;
    }
    /**
     * Get the current WebNN power preference
     * @returns The current power preference
     */
    getWebNNPowerPreference() {
        return this.webnnPowerPreference;
    }
    /**
     * Get all WebNN configuration settings
     * @returns Object containing all WebNN settings
     */
    getWebNNConfig() {
        return {
            enabled: this.webnnEnabled,
            deviceType: this.webnnDeviceType,
            powerPreference: this.webnnPowerPreference,
        };
    }
    /**
     * Reset WebNN settings to defaults
     */
    resetWebNNSettings() {
        this.webnnEnabled = false;
        this.webnnDeviceType = 'gpu';
        this.webnnPowerPreference = 'default';
        if (this.generalLoggingEnabled) {
            console.log('WebNN settings reset to defaults');
        }
    }
    /**
     * Enable or disable WebGPU support globally
     * @param enable - Whether to enable WebGPU
     */
    enableWebGPU(enable) {
        this.webgpuEnabled = enable;
        if (this.generalLoggingEnabled) {
            console.log(`WebGPU support ${enable ? 'enabled' : 'disabled'} globally`);
        }
    }
    /**
     * Set the WebGPU power preference
     * @param preference - The power preference ('default', 'low-power', or 'high-performance')
     */
    setWebGPUPowerPreference(preference) {
        this.webgpuPowerPreference = preference;
        if (this.generalLoggingEnabled) {
            console.log(`WebGPU power preference set to: ${preference}`);
        }
    }
    /**
     * Check if WebGPU is enabled globally
     * @returns True if WebGPU is enabled
     */
    isWebGPUEnabled() {
        return this.webgpuEnabled;
    }
    /**
     * Get the current WebGPU power preference
     * @returns The current power preference
     */
    getWebGPUPowerPreference() {
        return this.webgpuPowerPreference;
    }
    /**
     * Get all WebGPU configuration settings
     * @returns Object containing all WebGPU settings
     */
    getWebGPUConfig() {
        return {
            enabled: this.webgpuEnabled,
            powerPreference: this.webgpuPowerPreference,
        };
    }
    /**
     * Reset WebGPU settings to defaults
     */
    resetWebGPUSettings() {
        this.webgpuEnabled = false;
        this.webgpuPowerPreference = 'default';
        if (this.generalLoggingEnabled) {
            console.log('WebGPU settings reset to defaults');
        }
    }
    /**
     * Enable or disable general logging (info, debug messages)
     * @param enable - Whether to enable general logging
     */
    enableGeneralLogging(enable) {
        this.generalLoggingEnabled = enable;
        if (this.generalLoggingEnabled) {
            console.log(`General logging ${enable ? 'enabled' : 'disabled'}`);
        }
    }
    /**
     * Enable or disable performance logging (timing messages)
     * @param enable - Whether to enable performance logging
     */
    enablePerformanceLogging(enable) {
        this.performanceLoggingEnabled = enable;
        if (this.performanceLoggingEnabled) {
            console.log(`Performance logging ${enable ? 'enabled' : 'disabled'}`);
        }
    }
    /**
     * Check if general logging is enabled
     * @returns True if general logging is enabled
     */
    isGeneralLoggingEnabled() {
        return this.generalLoggingEnabled;
    }
    /**
     * Check if performance logging is enabled
     * @returns True if performance logging is enabled
     */
    isPerformanceLoggingEnabled() {
        return this.performanceLoggingEnabled;
    }
    /**
     * Enable or disable ONNX Runtime profiling
     * @param enable - Whether to enable ONNX profiling
     */
    enableONNXProfiling(enable) {
        this.onnxProfilingEnabled = enable;
        if (this.onnxProfilingEnabled) {
            console.log(`ONNX profiling ${enable ? 'enabled' : 'disabled'}`);
        }
    }
    /**
     * Check if ONNX profiling is enabled
     * @returns True if ONNX profiling is enabled
     */
    isONNXProfilingEnabled() {
        return this.onnxProfilingEnabled;
    }
    /**
     * Get all logging configuration settings
     * @returns Object containing all logging settings
     */
    getLoggingConfig() {
        return {
            generalLogging: this.generalLoggingEnabled,
            performanceLogging: this.performanceLoggingEnabled,
            onnxProfiling: this.onnxProfilingEnabled,
        };
    }
    /**
     * Reset logging settings to defaults
     */
    resetLoggingSettings() {
        this.generalLoggingEnabled = false;
        this.performanceLoggingEnabled = false;
        this.onnxProfilingEnabled = false;
        if (this.generalLoggingEnabled) {
            console.log('Logging settings reset to defaults');
        }
    }
    /**
     * Enable or disable session cache bypass globally
     * @param bypass - Whether to bypass session cache
     */
    setSessionCacheBypass(bypass) {
        this.sessionCacheBypass = bypass;
        if (this.generalLoggingEnabled) {
            console.log(`Session cache bypass ${bypass ? 'enabled' : 'disabled'} globally`);
        }
    }
    /**
     * Enable or disable model cache bypass globally
     * @param bypass - Whether to bypass model cache
     */
    setModelCacheBypass(bypass) {
        this.modelCacheBypass = bypass;
        if (this.generalLoggingEnabled) {
            console.log(`Model cache bypass ${bypass ? 'enabled' : 'disabled'} globally`);
        }
    }
    /**
     * Check if session cache bypass is enabled globally
     * @returns True if session cache bypass is enabled
     */
    isSessionCacheBypassEnabled() {
        return this.sessionCacheBypass;
    }
    /**
     * Check if model cache bypass is enabled globally
     * @returns True if model cache bypass is enabled
     */
    isModelCacheBypassEnabled() {
        return this.modelCacheBypass;
    }
    /**
     * Get all cache bypass configuration settings
     * @returns Object containing all cache bypass settings
     */
    getCacheBypassConfig() {
        return {
            sessionCacheBypass: this.sessionCacheBypass,
            modelCacheBypass: this.modelCacheBypass,
        };
    }
    /**
     * Reset cache bypass settings to defaults
     */
    resetCacheBypassSettings() {
        this.sessionCacheBypass = false;
        this.modelCacheBypass = false;
        if (this.generalLoggingEnabled) {
            console.log('Cache bypass settings reset to defaults');
        }
    }
}
// Export singleton instance
const rembgConfig = RembgConfig.getInstance();

/**
 * Centralized logging utilities for rembg-web
 *
 * Provides configurable logging that respects the RembgConfig settings.
 * By default, only errors and warnings are shown.
 */
/**
 * Log info messages (only if general logging is enabled).
 *
 * @param args - Arguments to log (same as console.log)
 *
 * @example
 * ```typescript
 * logInfo('Session initialized successfully');
 * logInfo('Processing image:', imageData);
 * ```
 */
function logInfo(...args) {
    if (rembgConfig.isGeneralLoggingEnabled()) {
        console.log(...args);
    }
}
/**
 * Log debug messages (only if general logging is enabled).
 *
 * @param args - Arguments to log (same as console.log)
 *
 * @example
 * ```typescript
 * logDebug('Model output shape:', outputShape);
 * logDebug('Cache hit for model:', modelName);
 * ```
 */
function logDebug(...args) {
    if (rembgConfig.isGeneralLoggingEnabled()) {
        console.log(...args);
    }
}
/**
 * Log performance timing messages (only if performance logging is enabled).
 *
 * @param args - Arguments to log (same as console.log)
 *
 * @example
 * ```typescript
 * logPerformance('Model inference took:', inferenceTime, 'ms');
 * logPerformance('Total processing time:', totalTime, 'ms');
 * ```
 */
function logPerformance(...args) {
    if (rembgConfig.isPerformanceLoggingEnabled()) {
        console.log(...args);
    }
}
/**
 * Log warning messages (always shown - default level).
 *
 * @param args - Arguments to log (same as console.warn)
 *
 * @example
 * ```typescript
 * logWarn('WebNN not available, falling back to WebGL');
 * logWarn('Model cache miss, downloading from server');
 * ```
 */
function logWarn(...args) {
    console.warn(...args);
}
/**
 * Log error messages (always shown - default level).
 *
 * @param args - Arguments to log (same as console.error)
 *
 * @example
 * ```typescript
 * logError('Failed to load model:', error);
 * logError('Session initialization failed:', error.message);
 * ```
 */
function logError(...args) {
    console.error(...args);
}
/**
 * Enable general logging (info, debug messages).
 *
 * @param enable - Whether to enable general logging
 *
 * @example
 * ```typescript
 * // Enable detailed logging for debugging
 * enableGeneralLogging(true);
 *
 * // Disable logging for production
 * enableGeneralLogging(false);
 * ```
 */
function enableGeneralLogging(enable) {
    rembgConfig.enableGeneralLogging(enable);
}
/**
 * Enable performance logging (timing messages).
 *
 * @param enable - Whether to enable performance logging
 *
 * @example
 * ```typescript
 * // Enable performance monitoring
 * enablePerformanceLogging(true);
 *
 * // Disable performance logging
 * enablePerformanceLogging(false);
 * ```
 */
function enablePerformanceLogging(enable) {
    rembgConfig.enablePerformanceLogging(enable);
}
/**
 * Check if general logging is enabled.
 *
 * @returns True if general logging is enabled
 *
 * @example
 * ```typescript
 * if (isGeneralLoggingEnabled()) {
 *   logInfo('Detailed logging is active');
 * }
 * ```
 */
function isGeneralLoggingEnabled() {
    return rembgConfig.isGeneralLoggingEnabled();
}
/**
 * Check if performance logging is enabled.
 *
 * @returns True if performance logging is enabled
 *
 * @example
 * ```typescript
 * if (isPerformanceLoggingEnabled()) {
 *   logPerformance('Performance monitoring is active');
 * }
 * ```
 */
function isPerformanceLoggingEnabled() {
    return rembgConfig.isPerformanceLoggingEnabled();
}
/**
 * Enable ONNX Runtime profiling.
 *
 * @param enable - Whether to enable ONNX profiling
 *
 * @example
 * ```typescript
 * // Enable ONNX profiling for performance analysis
 * enableONNXProfiling(true);
 *
 * // Disable profiling
 * enableONNXProfiling(false);
 * ```
 */
function enableONNXProfiling(enable) {
    rembgConfig.enableONNXProfiling(enable);
}
/**
 * Check if ONNX profiling is enabled.
 *
 * @returns True if ONNX profiling is enabled
 *
 * @example
 * ```typescript
 * if (isONNXProfilingEnabled()) {
 *   console.log('ONNX profiling is active');
 * }
 * ```
 */
function isONNXProfilingEnabled() {
    return rembgConfig.isONNXProfilingEnabled();
}
/**
 * Performance decorator for async functions.
 *
 * Automatically logs function execution time when performance logging is enabled.
 * Works with async functions and returns the original function's result.
 *
 * @param functionName - Optional custom name for logging (defaults to function name)
 * @returns Decorator function
 *
 * @example
 * ```typescript
 * class MyClass {
 *   @Performance('processImage')
 *   async processImage(imageData: ImageData): Promise<HTMLCanvasElement> {
 *     // Function implementation
 *     return result;
 *   }
 * }
 *
 * // Or with automatic naming
 * @Performance()
 * async loadModel(): Promise<void> {
 *   // Function implementation
 * }
 * ```
 */
function Performance(functionName) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        const name = propertyKey;
        descriptor.value = async function (...args) {
            const startTime = performance.now();
            logPerformance(`[${name}] Starting execution...`);
            try {
                const result = await originalMethod.apply(this, args);
                const endTime = performance.now();
                const duration = endTime - startTime;
                logPerformance(`[${name}] Completed successfully: ${duration.toFixed(2)}ms`);
                return result;
            }
            catch (error) {
                const endTime = performance.now();
                const duration = endTime - startTime;
                logError(`[${name}] Failed after ${duration.toFixed(2)}ms:`, error);
                throw error;
            }
        };
        return descriptor;
    };
}
/**
 * Performance decorator for synchronous functions.
 *
 * Automatically logs function execution time when performance logging is enabled.
 * Works with synchronous functions and returns the original function's result.
 *
 * @param functionName - Optional custom name for logging (defaults to function name)
 * @returns Decorator function
 *
 * @example
 * ```typescript
 * class MyClass {
 *   @PerformanceSync('normalizeImage')
 *   normalizeImage(imageData: ImageData): Float32Array {
 *     // Function implementation
 *     return result;
 *   }
 * }
 *
 * // Or with automatic naming
 * @PerformanceSync()
 * calculateDimensions(width: number, height: number): { width: number; height: number } {
 *   // Function implementation
 * }
 * ```
 */
function PerformanceSync(functionName) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        const name = propertyKey;
        descriptor.value = function (...args) {
            const startTime = performance.now();
            logPerformance(`[${name}] Starting execution...`);
            try {
                const result = originalMethod.apply(this, args);
                const endTime = performance.now();
                const duration = endTime - startTime;
                logPerformance(`[${name}] Completed successfully: ${duration.toFixed(2)}ms`);
                return result;
            }
            catch (error) {
                const endTime = performance.now();
                const duration = endTime - startTime;
                logError(`[${name}] Failed after ${duration.toFixed(2)}ms:`, error);
                throw error;
            }
        };
        return descriptor;
    };
}

/**
 * Convert HTMLImageElement or ImageData to HTMLCanvasElement.
 *
 * Creates a new canvas and draws the input image onto it. For HTMLImageElement,
 * uses naturalWidth/Height to preserve original dimensions.
 *
 * @param image - The image to convert (HTMLImageElement or ImageData)
 * @returns A new HTMLCanvasElement containing the image
 *
 * @throws {Error} When canvas context creation fails
 *
 * @example
 * ```typescript
 * // Convert an image element to canvas
 * const img = document.getElementById('myImage') as HTMLImageElement;
 * const canvas = imageToCanvas(img);
 *
 * // Convert ImageData to canvas
 * const ctx = someCanvas.getContext('2d');
 * const imageData = ctx.getImageData(0, 0, 100, 100);
 * const canvas = imageToCanvas(imageData);
 * ```
 */
function imageToCanvas(image) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Failed to get context for canvas');
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (image instanceof HTMLImageElement) {
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        ctx.drawImage(image, 0, 0);
    }
    else {
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.putImageData(image, 0, 0);
    }
    return canvas;
}
/**
 * Extract ImageData from an HTMLCanvasElement.
 *
 * Gets the pixel data from the entire canvas as ImageData object.
 *
 * @param canvas - The canvas to extract data from
 * @returns ImageData containing the canvas pixel data
 *
 * @throws {Error} When canvas context creation fails
 *
 * @example
 * ```typescript
 * const canvas = document.createElement('canvas');
 * const ctx = canvas.getContext('2d');
 * ctx.fillRect(0, 0, 100, 100);
 *
 * const imageData = canvasToImageData(canvas);
 * console.log(`Canvas size: ${imageData.width}x${imageData.height}`);
 * ```
 */
function canvasToImageData(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Failed to get context for canvas');
    }
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
/**
 * Create an HTMLCanvasElement from ImageData.
 *
 * Creates a new canvas with the same dimensions as the ImageData and draws
 * the pixel data onto it.
 *
 * @param imageData - The ImageData to convert
 * @returns A new HTMLCanvasElement containing the image data
 *
 * @throws {Error} When canvas context creation fails
 *
 * @example
 * ```typescript
 * // Create ImageData programmatically
 * const imageData = new ImageData(100, 100);
 * const data = imageData.data;
 * for (let i = 0; i < data.length; i += 4) {
 *   data[i] = 255;     // R
 *   data[i + 1] = 0;   // G
 *   data[i + 2] = 0;   // B
 *   data[i + 3] = 255; // A
 * }
 *
 * const canvas = imageDataToCanvas(imageData);
 * ```
 */
function imageDataToCanvas(imageData) {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Failed to get context for canvas');
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}
/**
 * Convert File or Blob to HTMLImageElement.
 *
 * Creates an object URL from the file/blob and loads it as an image.
 * The object URL is automatically cleaned up after loading.
 *
 * @param file - The File or Blob to convert to an image
 * @returns Promise that resolves to an HTMLImageElement
 *
 * @throws {Error} When image loading fails (invalid format, corrupted data, etc.)
 *
 * @example
 * ```typescript
 * // Convert file input to image
 * const fileInput = document.getElementById('file') as HTMLInputElement;
 * const file = fileInput.files[0];
 * const image = await fileToImage(file);
 *
 * // Convert blob to image
 * const response = await fetch('image.jpg');
 * const blob = await response.blob();
 * const image = await fileToImage(blob);
 * ```
 */
function fileToImage(file) {
    const startTime = performance.now();
    logInfo(`[fileToImage] Converting ${file instanceof File ? file.name : 'blob'} (${(file.size / 1024).toFixed(1)}KB)...`);
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
            const loadTime = performance.now() - startTime;
            logPerformance(`[fileToImage] Image loaded: ${loadTime.toFixed(2)}ms (${img.naturalWidth}x${img.naturalHeight})`);
            URL.revokeObjectURL(objectUrl);
            resolve(img);
        };
        img.onerror = error => {
            const errorTime = performance.now() - startTime;
            logError(`[fileToImage] Image load failed: ${errorTime.toFixed(2)}ms`, error);
            URL.revokeObjectURL(objectUrl);
            reject(error);
        };
        img.src = objectUrl;
    });
}
/**
 * Convert ArrayBuffer to HTMLImageElement.
 *
 * Creates a Blob from the ArrayBuffer and loads it as an image.
 * Useful for processing binary image data from network requests or file operations.
 *
 * @param buffer - The ArrayBuffer containing image data
 * @returns Promise that resolves to an HTMLImageElement
 *
 * @throws {Error} When image loading fails (invalid format, corrupted data, etc.)
 *
 * @example
 * ```typescript
 * // Convert fetch response to image
 * const response = await fetch('image.png');
 * const buffer = await response.arrayBuffer();
 * const image = await arrayBufferToImage(buffer);
 *
 * // Convert FileReader result to image
 * const file = fileInput.files[0];
 * const buffer = await file.arrayBuffer();
 * const image = await arrayBufferToImage(buffer);
 * ```
 */
function arrayBufferToImage(buffer) {
    const startTime = performance.now();
    logInfo(`[arrayBufferToImage] Converting buffer (${(buffer.byteLength / 1024).toFixed(1)}KB)...`);
    return new Promise((resolve, reject) => {
        const blob = new Blob([buffer]);
        const img = new Image();
        const objectUrl = URL.createObjectURL(blob);
        img.onload = () => {
            const loadTime = performance.now() - startTime;
            logPerformance(`[arrayBufferToImage] Image loaded: ${loadTime.toFixed(2)}ms (${img.naturalWidth}x${img.naturalHeight})`);
            URL.revokeObjectURL(objectUrl);
            resolve(img);
        };
        img.onerror = error => {
            const errorTime = performance.now() - startTime;
            logError(`[arrayBufferToImage] Image load failed: ${errorTime.toFixed(2)}ms`, error);
            URL.revokeObjectURL(objectUrl);
            reject(error);
        };
        img.src = objectUrl;
    });
}
/**
 * Convert HTMLCanvasElement to Blob.
 *
 * Exports the canvas content as a binary blob in the specified format.
 * Defaults to PNG format if no mime type is provided.
 *
 * @param canvas - The canvas to convert
 * @param mimeType - The MIME type for the output blob (default: 'image/png')
 * @returns Promise that resolves to a Blob containing the image data
 *
 * @throws {Error} When canvas conversion fails
 *
 * @example
 * ```typescript
 * const canvas = document.createElement('canvas');
 * const ctx = canvas.getContext('2d');
 * ctx.fillRect(0, 0, 100, 100);
 *
 * // Convert to PNG blob
 * const pngBlob = await canvasToBlob(canvas);
 *
 * // Convert to JPEG blob
 * const jpegBlob = await canvasToBlob(canvas, 'image/jpeg');
 *
 * // Download the blob
 * const url = URL.createObjectURL(pngBlob);
 * const a = document.createElement('a');
 * a.href = url;
 * a.download = 'image.png';
 * a.click();
 * ```
 */
function canvasToBlob(canvas, mimeType = 'image/png') {
    const startTime = performance.now();
    logInfo(`[canvasToBlob] Converting ${canvas.width}x${canvas.height} canvas to ${mimeType}...`);
    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            const conversionTime = performance.now() - startTime;
            if (blob) {
                logPerformance(`[canvasToBlob] Conversion complete: ${conversionTime.toFixed(2)}ms (${(blob.size / 1024).toFixed(1)}KB)`);
                resolve(blob);
            }
            else {
                logError(`[canvasToBlob] Conversion failed: ${conversionTime.toFixed(2)}ms`);
                reject(new Error('Failed to convert canvas to blob'));
            }
        }, mimeType);
    });
}
/**
 * Normalize image for ONNX model input.
 *
 * Resizes the image to the target size and applies normalization using mean/std values.
 * The normalization process includes dynamic scaling and ImageNet-style preprocessing.
 * Output is in CHW format (channels, height, width) as required by ONNX models.
 *
 * @param canvas - The input image canvas
 * @param params - Normalization parameters (mean, std, size)
 * @param inputName - The input tensor name for the ONNX model (default: 'input.1')
 * @returns Object with input tensor ready for ONNX inference
 *
 * @throws {Error} When canvas context creation fails
 *
 * @example
 * ```typescript
 * const canvas = document.createElement('canvas');
 * // ... draw image to canvas ...
 *
 * const params = {
 *   mean: [0.485, 0.456, 0.406], // ImageNet mean
 *   std: [0.229, 0.224, 0.225],  // ImageNet std
 *   size: [320, 320]             // Model input size
 * };
 *
 * const input = normalizeImage(canvas, params);
 * const results = await session.run(input);
 * ```
 */
function normalizeImage(canvas, params, inputName = 'input.1') {
    const startTime = performance.now();
    // Create a temporary canvas for resizing
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = params.size[0];
    tempCanvas.height = params.size[1];
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) {
        throw new Error('Failed to get context for temp canvas');
    }
    // Enable high-quality image smoothing (closest to LANCZOS)
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';
    // Resize image
    tempCtx.drawImage(canvas, 0, 0, params.size[0], params.size[1]);
    const resizeTime = performance.now();
    // Get pixel data
    const imageData = tempCtx.getImageData(0, 0, params.size[0], params.size[1]);
    const data = imageData.data;
    const width = params.size[0];
    const height = params.size[1];
    // Find max value across all pixels (like Python: im_ary / max(np.max(im_ary), 1e-6))
    let maxValue = 0;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i] / 255.0;
        const g = data[i + 1] / 255.0;
        const b = data[i + 2] / 255.0;
        maxValue = Math.max(maxValue, r, g, b);
    }
    const divisor = Math.max(maxValue, 1e-6);
    const maxFindTime = performance.now();
    // Create normalized array (CHW format: channels, height, width)
    const normalized = new Float32Array(3 * height * width);
    // Normalize each channel
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const pixelIndex = (y * width + x) * 4;
            const r = data[pixelIndex] / 255.0;
            const g = data[pixelIndex + 1] / 255.0;
            const b = data[pixelIndex + 2] / 255.0;
            // Apply dynamic normalization then (pixel - mean) / std
            // Matches Python: im_ary = im_ary / max(np.max(im_ary), 1e-6)
            const rNormalized = r / divisor;
            const gNormalized = g / divisor;
            const bNormalized = b / divisor;
            // Apply mean/std normalization
            const rNorm = (rNormalized - params.mean[0]) / params.std[0];
            const gNorm = (gNormalized - params.mean[1]) / params.std[1];
            const bNorm = (bNormalized - params.mean[2]) / params.std[2];
            // Store in CHW format
            normalized[y * width + x] = rNorm; // R channel
            normalized[height * width + y * width + x] = gNorm; // G channel
            normalized[2 * height * width + y * width + x] = bNorm; // B channel
        }
    }
    const normalizeTime = performance.now();
    // Create ONNX tensor
    const tensor = new ort.Tensor('float32', normalized, [1, 3, height, width]);
    const tensorTime = performance.now();
    // Log performance metrics
    logPerformance(`[normalizeImage] Performance:
    - Resize: ${(resizeTime - startTime).toFixed(2)}ms
    - Max find: ${(maxFindTime - resizeTime).toFixed(2)}ms
    - Normalize: ${(normalizeTime - maxFindTime).toFixed(2)}ms
    - Tensor: ${(tensorTime - normalizeTime).toFixed(2)}ms
    - Total: ${(tensorTime - startTime).toFixed(2)}ms
    - Max value: ${maxValue.toFixed(6)}, Divisor: ${divisor.toFixed(6)}`);
    return { [inputName]: tensor };
}
/**
 * Normalize a mask to the 0-1 range.
 *
 * @param mask - The mask to normalize
 * @param outputShape - The output shape of the model
 * @returns The normalized mask
 */
function normalizeMask(mask, outputShape = [1, 1, 320, 320]) {
    const [, , height, width] = outputShape;
    // Extract the mask data
    const extractStart = performance.now();
    // This shouldn't be necessary
    const maskData = mask.slice(0, height * width);
    if (mask.length !== height * width) {
        logWarn('[normalizeMask] Mask length does not match output shape', {
            maskLength: mask.length,
            outputShape: `${height}x${width}=${height * width}`,
        });
    }
    const extractTime = performance.now() - extractStart;
    logPerformance(`[processModelOutput] Data extraction: ${extractTime.toFixed(2)}ms`);
    // Find min/max for normalization
    const minMaxStart = performance.now();
    let min = maskData[0];
    let max = maskData[0];
    for (let i = 1; i < maskData.length; i++) {
        if (maskData[i] < min)
            min = maskData[i];
        if (maskData[i] > max)
            max = maskData[i];
    }
    const minMaxTime = performance.now() - minMaxStart;
    logPerformance(`[processModelOutput] Min/max calculation: ${minMaxTime.toFixed(2)}ms (min=${min.toFixed(6)}, max=${max.toFixed(6)})`);
    // Normalize to 0-1 range
    const normalizeStart = performance.now();
    const normalized = new Float32Array(maskData.length);
    for (let i = 0; i < maskData.length; i++) {
        normalized[i] = (maskData[i] - min) / (max - min);
    }
    const normalizeTime = performance.now() - normalizeStart;
    logPerformance(`[processModelOutput] Normalization: ${normalizeTime.toFixed(2)}ms`);
    return normalized;
}
/**
 * Create a grayscale mask canvas from a Float32Array.
 *
 * @param mask
 * @param param1
 * @returns
 */
function createGrayScaleMask(mask, { width, height }) {
    // Create canvas for mask
    const canvasCreateStart = performance.now();
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) {
        throw new Error('Failed to get context for mask canvas');
    }
    maskCtx.imageSmoothingEnabled = true;
    maskCtx.imageSmoothingQuality = 'high';
    const maskImageData = maskCtx.createImageData(width, height);
    // Set grayscale data
    for (let i = 0; i < mask.length; i++) {
        const value = Math.round(mask[i] * 255);
        const pixelIndex = i * 4;
        maskImageData.data[pixelIndex] = value; // R
        maskImageData.data[pixelIndex + 1] = value; // G
        maskImageData.data[pixelIndex + 2] = value; // B
        maskImageData.data[pixelIndex + 3] = 255; // A
    }
    maskCtx.putImageData(maskImageData, 0, 0);
    const canvasCreateTime = performance.now() - canvasCreateStart;
    logPerformance(`[processModelOutput] Canvas creation: ${canvasCreateTime.toFixed(2)}ms`);
    return maskCanvas;
}
/**
 * Resize a mask canvas to the original image size.
 *
 * @param maskCanvas
 * @param originalSize
 * @returns
 */
function resizeMask(maskCanvas, originalSize) {
    const resizeStart = performance.now();
    const { width, height } = maskCanvas;
    // Resize to original image size
    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = originalSize.width;
    resizedCanvas.height = originalSize.height;
    const resizedCtx = resizedCanvas.getContext('2d');
    if (!resizedCtx) {
        throw new Error('Failed to get context for resized canvas');
    }
    resizedCtx.imageSmoothingEnabled = true;
    resizedCtx.imageSmoothingQuality = 'high';
    resizedCtx.drawImage(maskCanvas, 0, 0, originalSize.width, originalSize.height);
    const resizeTime = performance.now() - resizeStart;
    logPerformance(`[processModelOutput] Resize: ${resizeTime.toFixed(2)}ms (${width}x${height} → ${originalSize.width}x${originalSize.height})`);
    return resizedCanvas;
}
/**
 * Process ONNX model output to create mask canvas.
 *
 * Converts raw model output (Float32Array) into a grayscale mask canvas.
 * The output is normalized to 0-255 range and resized to match the original image dimensions.
 *
 * @param output - Raw model output as Float32Array
 * @param originalSize - Original image dimensions for resizing
 * @param outputShape - Model output shape [batch, channels, height, width] (default: [1, 1, 320, 320])
 * @returns HTMLCanvasElement containing the processed mask
 *
 * @throws {Error} When canvas context creation fails
 *
 * @example
 * ```typescript
 * // After running ONNX inference
 * const results = await session.run(input);
 * const outputTensor = results[Object.keys(results)[0]] as ort.Tensor;
 * const outputData = outputTensor.data as Float32Array;
 *
 * const maskCanvas = processModelOutput(
 *   outputData,
 *   { width: 800, height: 600 },
 *   [1, 1, 320, 320]
 * );
 *
 * // Use the mask for background removal
 * const cutout = naiveCutout(originalCanvas, maskCanvas);
 * ```
 */
function processModelOutput(output, originalSize, outputShape = [1, 1, 320, 320]) {
    const startTime = performance.now();
    logInfo(`[processModelOutput] Processing output (${output.length} values) for ${originalSize.width}x${originalSize.height} image...`);
    const normalized = normalizeMask(output, outputShape);
    // Extract model output dimensions from outputShape
    const [, , modelHeight, modelWidth] = outputShape;
    // Create mask canvas with model output dimensions
    const grayscaleMaskCanvas = createGrayScaleMask(normalized, {
        width: modelWidth,
        height: modelHeight,
    });
    // Resize to original image dimensions
    const resizedMaskCanvas = resizeMask(grayscaleMaskCanvas, originalSize);
    const totalTime = performance.now() - startTime;
    logPerformance(`[processModelOutput] Total processing: ${totalTime.toFixed(2)}ms`);
    return resizedMaskCanvas;
}
/**
 * Apply naive cutout by compositing image with mask.
 *
 * Creates a new canvas with the original image where the mask is applied as the alpha channel.
 * White areas in the mask become opaque, black areas become transparent.
 * This is the core function for background removal.
 *
 * @param imageCanvas - The original image canvas
 * @param maskCanvas - The mask canvas (grayscale, white=foreground, black=background)
 * @returns HTMLCanvasElement with transparent background where mask is black
 *
 * @throws {Error} When canvas context creation fails
 *
 * @example
 * ```typescript
 * // Load original image and generate mask
 * const imageCanvas = imageToCanvas(imageElement);
 * const maskCanvas = await generateMask(imageCanvas);
 *
 * // Create cutout with transparent background
 * const cutout = naiveCutout(imageCanvas, maskCanvas);
 *
 * // Display result
 * document.body.appendChild(cutout);
 * ```
 */
function naiveCutout(imageCanvas, maskCanvas) {
    const startTime = performance.now();
    logInfo(`[naiveCutout] Creating cutout for ${imageCanvas.width}x${imageCanvas.height} image...`);
    const result = document.createElement('canvas');
    result.width = imageCanvas.width;
    result.height = imageCanvas.height;
    const resultCtx = result.getContext('2d');
    if (!resultCtx) {
        throw new Error('Failed to get context for result canvas');
    }
    // Draw the original image
    const drawStart = performance.now();
    resultCtx.drawImage(imageCanvas, 0, 0);
    const drawTime = performance.now() - drawStart;
    logPerformance(`[naiveCutout] Image draw: ${drawTime.toFixed(2)}ms`);
    // Get image and mask data
    const dataExtractionStart = performance.now();
    const imageData = resultCtx.getImageData(0, 0, result.width, result.height);
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) {
        throw new Error('Failed to get context for mask canvas');
    }
    const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const dataExtractionTime = performance.now() - dataExtractionStart;
    logPerformance(`[naiveCutout] Data extraction: ${dataExtractionTime.toFixed(2)}ms`);
    // Apply mask as alpha channel
    const maskApplicationStart = performance.now();
    for (let i = 0; i < imageData.data.length; i += 4) {
        const maskIndex = i;
        const maskValue = maskData.data[maskIndex]; // Use red channel as mask value
        imageData.data[i + 3] = maskValue; // Set alpha channel
    }
    const maskApplicationTime = performance.now() - maskApplicationStart;
    logPerformance(`[naiveCutout] Mask application: ${maskApplicationTime.toFixed(2)}ms`);
    const putImageStart = performance.now();
    resultCtx.putImageData(imageData, 0, 0);
    const putImageTime = performance.now() - putImageStart;
    logPerformance(`[naiveCutout] Put image data: ${putImageTime.toFixed(2)}ms`);
    const totalTime = performance.now() - startTime;
    logPerformance(`[naiveCutout] Total cutout creation: ${totalTime.toFixed(2)}ms`);
    return result;
}
/**
 * Apply a solid background color to an image.
 *
 * Creates a new canvas with the specified background color and composites
 * the original image on top. Useful for replacing transparent backgrounds
 * with solid colors.
 *
 * @param imageCanvas - The image canvas (can have transparent areas)
 * @param color - RGBA color values [red, green, blue, alpha] (0-255 range)
 * @returns HTMLCanvasElement with the specified background color
 *
 * @throws {Error} When canvas context creation fails
 *
 * @example
 * ```typescript
 * // Apply white background
 * const withWhiteBg = applyBackgroundColor(cutout, [255, 255, 255, 255]);
 *
 * // Apply red background with 50% opacity
 * const withRedBg = applyBackgroundColor(cutout, [255, 0, 0, 128]);
 *
 * // Apply transparent background (no change)
 * const withTransparentBg = applyBackgroundColor(cutout, [0, 0, 0, 0]);
 * ```
 */
function applyBackgroundColor(imageCanvas, color) {
    const result = document.createElement('canvas');
    result.width = imageCanvas.width;
    result.height = imageCanvas.height;
    const resultCtx = result.getContext('2d');
    if (!resultCtx) {
        throw new Error('Failed to get context for result canvas');
    }
    // Fill with background color
    resultCtx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 255})`;
    resultCtx.fillRect(0, 0, result.width, result.height);
    // Composite the image on top
    resultCtx.drawImage(imageCanvas, 0, 0);
    return result;
}
/**
 * Apply simple post-processing to smooth mask edges.
 *
 * Applies a 2px blur filter to the mask to create smoother edges.
 * This helps reduce jagged edges in the final cutout.
 *
 * @param maskCanvas - The original mask canvas
 * @returns HTMLCanvasElement with smoothed mask
 *
 * @throws {Error} When canvas context creation fails
 *
 * @example
 * ```typescript
 * // Generate raw mask from model
 * const rawMask = processModelOutput(outputData, originalSize);
 *
 * // Apply smoothing
 * const smoothMask = postProcessMask(rawMask);
 *
 * // Use smoothed mask for better cutout
 * const cutout = naiveCutout(originalCanvas, smoothMask);
 * ```
 */
function postProcessMask(maskCanvas) {
    const result = document.createElement('canvas');
    result.width = maskCanvas.width;
    result.height = maskCanvas.height;
    const resultCtx = result.getContext('2d');
    if (!resultCtx) {
        throw new Error('Failed to get context for result canvas');
    }
    // Apply a simple blur effect
    resultCtx.filter = 'blur(2px)';
    resultCtx.drawImage(maskCanvas, 0, 0);
    resultCtx.filter = 'none';
    return result;
}
/**
 * Convert mask to grayscale black/white representation.
 *
 * Creates a new canvas showing only the mask as a grayscale image.
 * White areas represent the foreground, black areas represent the background.
 * Useful for debugging mask quality or saving mask-only outputs.
 *
 * @param maskCanvas - The mask canvas to convert
 * @returns HTMLCanvasElement containing grayscale mask
 *
 * @throws {Error} When canvas context creation fails
 *
 * @example
 * ```typescript
 * // Generate mask from model
 * const mask = processModelOutput(outputData, originalSize);
 *
 * // Create mask-only visualization
 * const maskOnly = createMaskOnly(mask);
 *
 * // Display mask for debugging
 * document.body.appendChild(maskOnly);
 *
 * // Or save as blob
 * const maskBlob = await canvasToBlob(maskOnly);
 * ```
 */
function createMaskOnly(maskCanvas) {
    const result = document.createElement('canvas');
    result.width = maskCanvas.width;
    result.height = maskCanvas.height;
    const resultCtx = result.getContext('2d');
    if (!resultCtx) {
        throw new Error('Failed to get context for result canvas');
    }
    // Draw mask as grayscale
    resultCtx.drawImage(maskCanvas, 0, 0);
    // Convert to grayscale
    const imageData = resultCtx.getImageData(0, 0, result.width, result.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const gray = data[i]; // Use red channel as grayscale value
        data[i] = gray; // R
        data[i + 1] = gray; // G
        data[i + 2] = gray; // B
        data[i + 3] = 255; // A
    }
    resultCtx.putImageData(imageData, 0, 0);
    return result;
}
function mergeMasks(masks) {
    if (!masks || masks.length === 0) {
        throw new Error('mergeMasks: no masks provided');
    }
    const expectedLength = masks[0].length;
    for (let i = 1; i < masks.length; i++) {
        if (masks[i].length !== expectedLength) {
            throw new Error(`mergeMasks: mask at index ${i} has different size (expected ${expectedLength}, got ${masks[i].length})`);
        }
    }
    if (masks.length === 1) {
        return masks[0].slice();
    }
    const merged = new Float32Array(expectedLength);
    // Initialize with first mask values
    merged.set(masks[0]);
    // Merge using per-pixel maximum to preserve strongest foreground
    for (let m = 1; m < masks.length; m++) {
        const current = masks[m];
        for (let i = 0; i < expectedLength; i++) {
            const v = current[i];
            if (v > merged[i])
                merged[i] = v;
        }
    }
    return merged;
}

var image = /*#__PURE__*/Object.freeze({
    __proto__: null,
    applyBackgroundColor: applyBackgroundColor,
    arrayBufferToImage: arrayBufferToImage,
    canvasToBlob: canvasToBlob,
    canvasToImageData: canvasToImageData,
    createGrayScaleMask: createGrayScaleMask,
    createMaskOnly: createMaskOnly,
    fileToImage: fileToImage,
    imageDataToCanvas: imageDataToCanvas,
    imageToCanvas: imageToCanvas,
    mergeMasks: mergeMasks,
    naiveCutout: naiveCutout,
    normalizeImage: normalizeImage,
    normalizeMask: normalizeMask,
    postProcessMask: postProcessMask,
    processModelOutput: processModelOutput,
    resizeMask: resizeMask
});

/**
 * Model integrity verification utilities
 *
 * This module provides SHA256 hash verification for downloaded models
 * to ensure they haven't been tampered with or corrupted.
 */
// Known SHA256 hashes for model files
// These should be updated when models are updated
const MODEL_HASHES = {
    'u2net.onnx': 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    'u2netp.onnx': 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567',
    'u2net_human_seg.onnx': 'c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678',
    'u2net_cloth_seg.onnx': 'd4e5f6789012345678901234567890abcdef1234567890abcdef123456789',
    'silueta.onnx': '75da6c8d2f8096ec743d071951be73b4a8bc7b3e51d9a6625d63644f90ffeedb',
};
/**
 * Compute SHA256 hash of an ArrayBuffer
 */
async function computeSHA256(buffer) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
/**
 * Verify model integrity by checking SHA256 hash
 *
 * @param modelName - Name of the model file
 * @param modelData - Model data as ArrayBuffer
 * @returns Promise<boolean> - True if hash matches, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = await verifyModelIntegrity('u2net.onnx', modelData);
 * if (!isValid) {
 *   console.warn('Model integrity check failed');
 * }
 * ```
 */
async function verifyModelIntegrity(modelName, modelData) {
    try {
        // Get expected hash
        const expectedHash = MODEL_HASHES[modelName];
        if (!expectedHash) {
            console.warn(`No hash available for model: ${modelName}`);
            return true; // Allow if no hash is configured
        }
        // Compute actual hash
        const actualHash = await computeSHA256(modelData);
        // Compare hashes
        const isValid = actualHash === expectedHash;
        if (!isValid) {
            console.error(`Model integrity check failed for ${modelName}`);
            console.error(`Expected: ${expectedHash}`);
            console.error(`Actual: ${actualHash}`);
        }
        return isValid;
    }
    catch (error) {
        console.error(`Error verifying model integrity for ${modelName}:`, error);
        return false;
    }
}
/**
 * Get the expected SHA256 hash for a model.
 *
 * Returns the pre-configured hash for a model if available, or null if
 * no hash has been set for the model.
 *
 * @param modelName - Name of the model file
 * @returns Expected SHA256 hash or null if not available
 *
 * @example
 * ```typescript
 * const hash = getModelHash('u2net.onnx');
 * if (hash) {
 *   console.log(`Expected hash for u2net: ${hash}`);
 * } else {
 *   console.log('No hash configured for this model');
 * }
 * ```
 */
function getModelHash(modelName) {
    return MODEL_HASHES[modelName] ?? null;
}
/**
 * Add or update the SHA256 hash for a model.
 *
 * Sets the expected hash for a model, which will be used for integrity
 * verification. This is useful for adding support for new models or
 * updating hashes when models are updated.
 *
 * @param modelName - Name of the model file
 * @param hash - SHA256 hash of the model
 *
 * @example
 * ```typescript
 * // Add hash for a new model
 * setModelHash('my-custom-model.onnx', 'abc123...');
 *
 * // Update hash for existing model
 * setModelHash('u2net.onnx', 'new-hash-value');
 *
 * // Verify the model with the new hash
 * const isValid = await verifyModelIntegrity('my-custom-model.onnx', modelData);
 * ```
 */
function setModelHash(modelName, hash) {
    MODEL_HASHES[modelName] = hash;
}
/**
 * Get all known model hashes.
 *
 * Returns a copy of all configured model hashes. The returned object
 * is a shallow copy, so modifications won't affect the internal hash store.
 *
 * @returns Record of model names to their SHA256 hashes
 *
 * @example
 * ```typescript
 * const allHashes = getAllModelHashes();
 * console.log('Configured models:', Object.keys(allHashes));
 *
 * // Check if a specific model has a hash
 * if ('u2net.onnx' in allHashes) {
 *   console.log('u2net has integrity verification enabled');
 * }
 * ```
 */
function getAllModelHashes() {
    return { ...MODEL_HASHES };
}
/**
 * Validate model data against known size constraints.
 *
 * Checks if the model file size is within expected ranges. This helps
 * detect corrupted downloads or incorrect model files. Returns true if
 * no size constraints are configured for the model.
 *
 * @param modelName - Name of the model file
 * @param modelData - Model data as ArrayBuffer
 * @returns True if size is within expected range
 *
 * @example
 * ```typescript
 * const response = await fetch('/models/u2net.onnx');
 * const modelData = await response.arrayBuffer();
 *
 * const sizeValid = validateModelSize('u2net.onnx', modelData);
 * if (!sizeValid) {
 *   console.error('Model file size is unexpected - may be corrupted');
 *   return;
 * }
 *
 * console.log('Model size validation passed');
 * ```
 */
function validateModelSize(modelName, modelData) {
    const size = modelData.byteLength;
    const sizeMB = size / (1024 * 1024);
    // Expected size ranges in MB (with some tolerance)
    const expectedSizes = {
        'u2net.onnx': { min: 170, max: 180 },
        'u2netp.onnx': { min: 4, max: 5 },
        'u2net_human_seg.onnx': { min: 170, max: 180 },
        'u2net_cloth_seg.onnx': { min: 170, max: 180 },
        'silueta.onnx': { min: 40, max: 50 }, // ~43MB
    };
    const expected = expectedSizes[modelName];
    if (!expected) {
        console.warn(`No size validation available for model: ${modelName}`);
        return true; // Allow if no size constraints are configured
    }
    const isValid = sizeMB >= expected.min && sizeMB <= expected.max;
    if (!isValid) {
        console.error(`Model size validation failed for ${modelName}`);
        console.error(`Expected: ${expected.min}-${expected.max}MB, got: ${sizeMB.toFixed(2)}MB`);
    }
    return isValid;
}
/**
 * Comprehensive model validation.
 *
 * Performs both size validation and integrity verification on a model.
 * This is the recommended way to validate models before use.
 *
 * @param modelName - Name of the model file
 * @param modelData - Model data as ArrayBuffer
 * @returns Promise<boolean> - True if all validations pass
 *
 * @example
 * ```typescript
 * // Download and validate a model
 * const response = await fetch('/models/u2net.onnx');
 * const modelData = await response.arrayBuffer();
 *
 * const isValid = await validateModel('u2net.onnx', modelData);
 * if (isValid) {
 *   console.log('Model validation passed - safe to use');
 *   // Proceed with model loading
 * } else {
 *   console.error('Model validation failed - do not use');
 * }
 * ```
 */
async function validateModel(modelName, modelData) {
    // Check size first (faster)
    const sizeValid = validateModelSize(modelName, modelData);
    if (!sizeValid) {
        return false;
    }
    // Check integrity
    const integrityValid = await verifyModelIntegrity(modelName, modelData);
    if (!integrityValid) {
        return false;
    }
    return true;
}

/**
 * WebGPU (Web Graphics Processing Unit) utilities for rembg-web
 *
 * Provides feature detection, configuration validation, and execution provider
 * management for WebGPU hardware acceleration support.
 */
/**
 * Check if WebGPU API is available in the current browser
 *
 * @returns true if WebGPU is supported, false otherwise
 *
 * @example
 * ```typescript
 * if (isWebGPUAvailable()) {
 *   console.log('WebGPU is supported!');
 * } else {
 *   console.log('WebGPU not available, using fallback');
 * }
 * ```
 */
function isWebGPUAvailable() {
    try {
        // Check if the WebGPU API is available
        return (typeof navigator !== 'undefined' &&
            'gpu' in navigator &&
            typeof navigator.gpu === 'object' &&
            navigator.gpu !== null);
    }
    catch (error) {
        logDebug('WebGPU availability check failed:', error);
        return false;
    }
}
/**
 * Get the WebGPU device if available
 *
 * @param options - WebGPU adapter options
 * @returns Promise that resolves to GPUDevice or null if not available
 *
 * @example
 * ```typescript
 * const device = await getWebGPUDevice();
 * if (device) {
 *   console.log('WebGPU device available');
 * }
 * ```
 */
async function getWebGPUDevice(options) {
    const startTime = performance.now();
    logInfo('[getWebGPUDevice] Requesting WebGPU device...');
    if (!isWebGPUAvailable()) {
        const totalTime = performance.now() - startTime;
        logPerformance(`[getWebGPUDevice] WebGPU not available: ${totalTime.toFixed(2)}ms`);
        return null;
    }
    try {
        // Request adapter
        const adapterRequestStart = performance.now();
        const adapter = await navigator.gpu?.requestAdapter(options);
        const adapterRequestTime = performance.now() - adapterRequestStart;
        logPerformance(`[getWebGPUDevice] Adapter request: ${adapterRequestTime.toFixed(2)}ms`);
        if (!adapter) {
            const totalTime = performance.now() - startTime;
            logPerformance(`[getWebGPUDevice] No adapter available: ${totalTime.toFixed(2)}ms`);
            return null;
        }
        // Request device
        const deviceRequestStart = performance.now();
        const device = await adapter.requestDevice();
        const deviceRequestTime = performance.now() - deviceRequestStart;
        logPerformance(`[getWebGPUDevice] Device request: ${deviceRequestTime.toFixed(2)}ms`);
        const totalTime = performance.now() - startTime;
        logPerformance(`[getWebGPUDevice] WebGPU device obtained: ${totalTime.toFixed(2)}ms`);
        return device;
    }
    catch (error) {
        const totalTime = performance.now() - startTime;
        logDebug(`[getWebGPUDevice] Failed to get WebGPU device (${totalTime.toFixed(2)}ms):`, error);
        return null;
    }
}
/**
 * Validate WebGPU configuration options
 *
 * @param options - Session options to validate
 * @returns true if configuration is valid, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = validateWebGPUConfig({
 *   preferWebGPU: true,
 *   webgpuPowerPreference: 'high-performance'
 * });
 * ```
 */
function validateWebGPUConfig(options) {
    // Check power preference
    if (options?.webgpuPowerPreference &&
        !['default', 'low-power', 'high-performance'].includes(options.webgpuPowerPreference)) {
        logWarn(`Invalid WebGPU power preference: ${options.webgpuPowerPreference}`);
        return false;
    }
    return true;
}
/**
 * Get WebGPU context options based on session configuration
 *
 * @param options - Session options
 * @returns WebGPU context options object
 *
 * @example
 * ```typescript
 * const contextOptions = getWebGPUContextOptions({
 *   webgpuPowerPreference: 'high-performance'
 * });
 * ```
 */
function getWebGPUContextOptions(options) {
    const contextOptions = {};
    if (options.webgpuPowerPreference) {
        contextOptions.powerPreference = options.webgpuPowerPreference;
    }
    return contextOptions;
}
/**
 * Get information about WebGPU support and capabilities
 *
 * @returns Object containing WebGPU support information
 *
 * @example
 * ```typescript
 * const info = await getWebGPUInfo();
 * console.log('WebGPU available:', info.available);
 * console.log('Adapter info:', info.adapterInfo);
 * ```
 */
async function getWebGPUInfo() {
    const startTime = performance.now();
    logInfo('[getWebGPUInfo] Gathering WebGPU information...');
    const availabilityCheckStart = performance.now();
    const available = isWebGPUAvailable();
    const availabilityCheckTime = performance.now() - availabilityCheckStart;
    logPerformance(`[getWebGPUInfo] Availability check: ${availabilityCheckTime.toFixed(2)}ms`);
    let adapterInfo = null;
    if (available) {
        try {
            const adapterRequestStart = performance.now();
            const adapter = await navigator.gpu?.requestAdapter();
            const adapterRequestTime = performance.now() - adapterRequestStart;
            logPerformance(`[getWebGPUInfo] Adapter request: ${adapterRequestTime.toFixed(2)}ms`);
            if (adapter && 'requestAdapterInfo' in adapter) {
                const infoRequestStart = performance.now();
                adapterInfo = (await adapter.requestAdapterInfo());
                const infoRequestTime = performance.now() - infoRequestStart;
                logPerformance(`[getWebGPUInfo] Adapter info request: ${infoRequestTime.toFixed(2)}ms`);
            }
        }
        catch (error) {
            logDebug('[getWebGPUInfo] Failed to get adapter info:', error);
        }
    }
    const totalTime = performance.now() - startTime;
    logPerformance(`[getWebGPUInfo] Total info gathering: ${totalTime.toFixed(2)}ms (available: ${available})`);
    return {
        available,
        adapterInfo,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    };
}
/**
 * Log WebGPU support information to console
 * Useful for debugging and user information
 *
 * @example
 * ```typescript
 * logWebGPUInfo();
 * // Outputs: "WebGPU Support: Available" or "WebGPU Support: Not Available"
 * ```
 */
async function logWebGPUInfo() {
    const info = await getWebGPUInfo();
    if (info.available) {
        logInfo('WebGPU Support: Available');
        if (info.adapterInfo) {
            logInfo(`WebGPU Adapter: ${info.adapterInfo.vendor} ${info.adapterInfo.architecture}`);
        }
    }
    else {
        logInfo('WebGPU Support: Not Available');
    }
}

/**
 * WebNN (Web Neural Network API) utilities for rembg-web
 *
 * Provides feature detection, configuration validation, and execution provider
 * management for WebNN hardware acceleration support.
 */
/**
 * Check if WebNN API is available in the current browser
 *
 * @returns true if WebNN is supported, false otherwise
 *
 * @example
 * ```typescript
 * if (isWebNNAvailable()) {
 *   console.log('WebNN is supported!');
 * } else {
 *   console.log('WebNN not available, using fallback');
 * }
 * ```
 */
function isWebNNAvailable() {
    try {
        // Check if the WebNN API is available
        return (typeof navigator !== 'undefined' &&
            'ml' in navigator &&
            typeof navigator.ml === 'object' &&
            navigator.ml !== null);
    }
    catch (error) {
        logDebug('WebNN availability check failed:', error);
        return false;
    }
}
/**
 * Get the recommended execution providers based on WebNN availability and options
 *
 * @param options - Session options including WebNN preferences
 * @returns Array of execution provider names in order of preference
 *
 * @example
 * ```typescript
 * const providers = getExecutionProviders({
 *   preferWebNN: true,
 *   webnnDeviceType: 'gpu'
 * });
 * // Returns: ['webnn', 'webgl', 'cpu'] if WebNN is available
 * // Returns: ['webgl', 'cpu'] if WebNN is not available
 * ```
 */
function getExecutionProviders(options = {}) {
    const startTime = performance.now();
    logInfo('[getExecutionProviders] Determining execution providers...');
    const providers = [];
    logInfo('[getExecutionProviders] Input options:', {
        executionProviders: options.executionProviders,
        preferWebNN: options.preferWebNN,
        webnnDeviceType: options.webnnDeviceType,
        webnnPowerPreference: options.webnnPowerPreference,
        preferWebGPU: options.preferWebGPU,
        webgpuPowerPreference: options.webgpuPowerPreference,
    });
    // If user explicitly provided execution providers, use those
    if (options.executionProviders && options.executionProviders.length > 0) {
        const explicitTime = performance.now() - startTime;
        logPerformance(`[getExecutionProviders] Using explicit providers: ${explicitTime.toFixed(2)}ms`);
        logInfo(`[getExecutionProviders] Using explicit execution providers: ${options.executionProviders.join(', ')}`);
        return [...options.executionProviders];
    }
    // Check if WebNN should be preferred
    const webnnCheckStart = performance.now();
    const preferWebNN = options.preferWebNN ?? false;
    const webnnAvailable = isWebNNAvailable();
    const webnnCheckTime = performance.now() - webnnCheckStart;
    logPerformance(`[getExecutionProviders] WebNN preference check: ${webnnCheckTime.toFixed(2)}ms`);
    logInfo(`[getExecutionProviders] WebNN status: preferWebNN=${preferWebNN}, available=${webnnAvailable}`);
    if (preferWebNN && webnnAvailable) {
        providers.push('webnn');
        logInfo('[getExecutionProviders] WebNN execution provider added to preference list');
    }
    else if (preferWebNN && !webnnAvailable) {
        logWarn('[getExecutionProviders] WebNN was preferred but is not available in this browser');
    }
    // Check if WebGPU should be preferred
    const webgpuCheckStart = performance.now();
    const preferWebGPU = options.preferWebGPU ?? false;
    const webgpuAvailable = isWebGPUAvailable();
    const webgpuCheckTime = performance.now() - webgpuCheckStart;
    logPerformance(`[getExecutionProviders] WebGPU preference check: ${webgpuCheckTime.toFixed(2)}ms`);
    logInfo(`[getExecutionProviders] WebGPU status: preferWebGPU=${preferWebGPU}, available=${webgpuAvailable}`);
    if (preferWebGPU && webgpuAvailable) {
        providers.push('webgpu');
        logInfo('[getExecutionProviders] WebGPU execution provider added to preference list');
    }
    else if (preferWebGPU && !webgpuAvailable) {
        logWarn('[getExecutionProviders] WebGPU was preferred but is not available in this browser');
    }
    // Add fallback providers in order of preference
    providers.push('webgl', 'cpu');
    const totalTime = performance.now() - startTime;
    logPerformance(`[getExecutionProviders] Provider selection complete: ${totalTime.toFixed(2)}ms (${providers.join(', ')})`);
    return providers;
}
/**
 * Validate WebNN configuration options
 *
 * @param options - Session options to validate
 * @returns true if configuration is valid, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = validateWebNNConfig({
 *   preferWebNN: true,
 *   webnnDeviceType: 'gpu'
 * });
 * ```
 */
function validateWebNNConfig(options) {
    // Check device type
    if (options?.webnnDeviceType &&
        !['cpu', 'gpu', 'npu'].includes(options.webnnDeviceType)) {
        logWarn(`Invalid WebNN device type: ${options.webnnDeviceType}`);
        return false;
    }
    // Check power preference
    if (options?.webnnPowerPreference &&
        !['default', 'low-power', 'high-performance'].includes(options.webnnPowerPreference)) {
        logWarn(`Invalid WebNN power preference: ${options.webnnPowerPreference}`);
        return false;
    }
    // Check WebGPU power preference
    if (options?.webgpuPowerPreference &&
        !['default', 'low-power', 'high-performance'].includes(options.webgpuPowerPreference)) {
        logWarn(`Invalid WebGPU power preference: ${options.webgpuPowerPreference}`);
        return false;
    }
    return true;
}
/**
 * Get WebNN context options based on session configuration
 *
 * @param options - Session options
 * @returns WebNN context options object
 *
 * @example
 * ```typescript
 * const contextOptions = getWebNNContextOptions({
 *   webnnDeviceType: 'gpu',
 *   webnnPowerPreference: 'high-performance'
 * });
 * ```
 */
function getWebNNContextOptions(options) {
    const contextOptions = {};
    if (options.webnnDeviceType) {
        contextOptions.deviceType = options.webnnDeviceType;
    }
    if (options.webnnPowerPreference) {
        contextOptions.powerPreference = options.webnnPowerPreference;
    }
    return contextOptions;
}
/**
 * Check if a specific WebNN device type is supported
 *
 * @param deviceType - The device type to check
 * @returns Promise that resolves to true if supported, false otherwise
 *
 * @example
 * ```typescript
 * const gpuSupported = await isWebNNDeviceSupported('gpu');
 * if (gpuSupported) {
 *   console.log('GPU acceleration available via WebNN');
 * }
 * ```
 */
async function isWebNNDeviceSupported(deviceType) {
    const startTime = performance.now();
    logInfo(`[isWebNNDeviceSupported] Checking support for device: ${deviceType}`);
    if (!isWebNNAvailable()) {
        const totalTime = performance.now() - startTime;
        logPerformance(`[isWebNNDeviceSupported] WebNN not available: ${totalTime.toFixed(2)}ms`);
        return false;
    }
    try {
        // Create a context with the specified device type
        const contextCreateStart = performance.now();
        const context = await navigator.ml?.createContext({
            deviceType,
        });
        const contextCreateTime = performance.now() - contextCreateStart;
        logPerformance(`[isWebNNDeviceSupported] Context creation for ${deviceType}: ${contextCreateTime.toFixed(2)}ms`);
        // If we can create the context, the device type is supported
        const supported = context !== null;
        const totalTime = performance.now() - startTime;
        logPerformance(`[isWebNNDeviceSupported] Device ${deviceType} supported: ${supported} (${totalTime.toFixed(2)}ms)`);
        return supported;
    }
    catch (error) {
        const totalTime = performance.now() - startTime;
        logDebug(`[isWebNNDeviceSupported] Device type '${deviceType}' not supported (${totalTime.toFixed(2)}ms):`, error);
        return false;
    }
}
/**
 * Get information about WebNN support and capabilities
 *
 * @returns Object containing WebNN support information
 *
 * @example
 * ```typescript
 * const info = await getWebNNInfo();
 * console.log('WebNN available:', info.available);
 * console.log('Supported devices:', info.supportedDevices);
 * ```
 */
async function getWebNNInfo() {
    const startTime = performance.now();
    logInfo('[getWebNNInfo] Gathering WebNN information...');
    const availabilityCheckStart = performance.now();
    const available = isWebNNAvailable();
    const availabilityCheckTime = performance.now() - availabilityCheckStart;
    logPerformance(`[getWebNNInfo] Availability check: ${availabilityCheckTime.toFixed(2)}ms`);
    const supportedDevices = [];
    if (available) {
        // Test each device type
        const deviceTypes = ['cpu', 'gpu', 'npu'];
        const deviceCheckStart = performance.now();
        for (const deviceType of deviceTypes) {
            const deviceStart = performance.now();
            if (await isWebNNDeviceSupported(deviceType)) {
                supportedDevices.push(deviceType);
            }
            const deviceTime = performance.now() - deviceStart;
            logPerformance(`[getWebNNInfo] Device ${deviceType} check: ${deviceTime.toFixed(2)}ms`);
        }
        const deviceCheckTime = performance.now() - deviceCheckStart;
        logPerformance(`[getWebNNInfo] All device checks: ${deviceCheckTime.toFixed(2)}ms`);
    }
    const totalTime = performance.now() - startTime;
    logPerformance(`[getWebNNInfo] Total info gathering: ${totalTime.toFixed(2)}ms (available: ${available}, devices: ${supportedDevices.join(', ')})`);
    return {
        available,
        supportedDevices,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    };
}
/**
 * Log WebNN support information to console
 * Useful for debugging and user information
 *
 * @example
 * ```typescript
 * logWebNNInfo();
 * // Outputs: "WebNN Support: Available (GPU, CPU)" or "WebNN Support: Not Available"
 * ```
 */
async function logWebNNInfo() {
    const info = await getWebNNInfo();
    if (info.available) {
        logInfo(`WebNN Support: Available (${info.supportedDevices.join(', ')})`);
    }
    else {
        logInfo('WebNN Support: Not Available');
    }
}

// Default ONNX Runtime configuration
const defaultSessionOptions = {
    simd: true, // Enable SIMD by default for better performance
    proxy: false,
    numThreads: 4, // Allow more threads by default
    // Don't set executionProviders here - let getExecutionProviders() handle it
};
// Configure ONNX Runtime Web for browser environment
function configureONNXRuntime(options = defaultSessionOptions) {
    ort.env.wasm.simd = options.simd ?? defaultSessionOptions.simd;
    ort.env.wasm.proxy = options.proxy ?? defaultSessionOptions.proxy;
    ort.env.wasm.numThreads =
        options.numThreads ?? defaultSessionOptions.numThreads;
}
// Initialize with default configuration
configureONNXRuntime();
/**
 * Abstract base class for all ONNX model sessions.
 *
 * Provides common functionality for model loading, caching, and inference.
 * All specific model implementations (U2Net, ISNet, etc.) extend this class.
 *
 * @example
 * ```typescript
 * // Create a custom session class
 * class MyModelSession extends BaseSession {
 *   constructor(options?: SessionOptions) {
 *     super('my-model', options);
 *   }
 *
 *   protected getDefaultModelUrl(): string {
 *     return '/models/my-model.onnx';
 *   }
 *
 *   protected getNormalizationParams(): NormalizationParams {
 *     return { mean: [0.485, 0.456, 0.406], std: [0.229, 0.224, 0.225], size: [320, 320] };
 *   }
 *
 *   // ... implement other abstract methods
 * }
 * ```
 */
class BaseSession {
    modelName;
    session = null;
    modelData = null;
    options;
    constructor(modelName, options = {}) {
        this.modelName = modelName;
        this.options = { ...defaultSessionOptions, ...options };
        // Ensure undefined values are replaced with defaults
        this.options.simd = this.options.simd ?? defaultSessionOptions.simd;
        this.options.proxy = this.options.proxy ?? defaultSessionOptions.proxy;
        this.options.numThreads =
            this.options.numThreads ?? defaultSessionOptions.numThreads;
        // Configure ONNX Runtime with these options
        configureONNXRuntime(this.options);
    }
    emitProgress(step, progress, message) {
        if (this.options.onProgress) {
            this.options.onProgress({ step, progress, message });
        }
    }
    /**
     * Initialize the ONNX session
     *
     * If ONNX profiling is enabled (via rembgConfig.enableONNXProfiling(true)),
     * ONNX Runtime will collect profiling data for each inference run.
     * Profiling data is automatically outputted to the console after each inference.
     */
    async initialize() {
        logInfo(`[${this.modelName}] Starting session initialization...`);
        this.emitProgress('initializing', 0, 'Starting session initialization...');
        if (this.session) {
            logInfo(`[${this.modelName}] Session already initialized, skipping`);
            this.emitProgress('initializing', 100, 'Session already initialized, skipping');
            return; // Already initialized
        }
        this.emitProgress('initializing', 20, 'Validating configuration...');
        await this.validateConfiguration();
        this.emitProgress('initializing', 50, 'Downloading model...');
        this.modelData = await this.downloadModel();
        this.emitProgress('initializing', 60, 'Setting up execution providers...');
        const executionProviders = await this.setupExecutionProviders();
        this.emitProgress('initializing', 80, 'Creating session...');
        await this.createSession(executionProviders);
        this.emitProgress('initializing', 100, 'Session initialized successfully');
    }
    /**
     * Validate WebNN and WebGPU configuration
     */
    async validateConfiguration() {
        if (!validateWebNNConfig(this.options)) {
            logWarn('Invalid WebNN configuration, falling back to default providers');
        }
        if (!validateWebGPUConfig(this.options)) {
            logWarn('Invalid WebGPU configuration, falling back to default providers');
        }
    }
    /**
     * Setup execution providers and log availability
     */
    async setupExecutionProviders() {
        const executionProviders = getExecutionProviders(this.options);
        // Log WebNN and WebGPU availability for debugging
        if (this.options.preferWebNN) {
            const webnnAvailable = isWebNNAvailable();
            logInfo(`WebNN requested: ${webnnAvailable ? 'Available' : 'Not Available'}`);
            if (webnnAvailable) {
                logInfo(`Using execution providers: ${executionProviders.join(', ')}`);
            }
        }
        if (this.options.preferWebGPU) {
            const webgpuAvailable = isWebGPUAvailable();
            logInfo(`WebGPU requested: ${webgpuAvailable ? 'Available' : 'Not Available'}`);
            if (webgpuAvailable) {
                logInfo(`Using execution providers: ${executionProviders.join(', ')}`);
            }
        }
        return executionProviders;
    }
    /**
     * Create ONNX session with fallback logic
     */
    async createSession(executionProviders) {
        let sessionCreated = false;
        let lastError = null;
        if (!this.modelData) {
            throw new Error('Model data not found');
        }
        for (const provider of executionProviders) {
            try {
                logInfo(`[${this.modelName}] Attempting to create session with provider: ${provider}`);
                this.session = await ort.InferenceSession.create(this.modelData, {
                    executionProviders: [provider],
                    enableProfiling: rembgConfig.isONNXProfilingEnabled(),
                });
                logPerformance(`[${this.modelName}] Successfully created session with provider: ${provider}`);
                if (rembgConfig.isONNXProfilingEnabled()) {
                    logInfo(`[${this.modelName}] ONNX profiling enabled - data will be logged after each inference`);
                }
                sessionCreated = true;
                break;
            }
            catch (error) {
                logWarn(`[${this.modelName}] Failed to create session with provider '${provider}':`, error);
                lastError = error;
                continue;
            }
        }
        if (!sessionCreated) {
            throw new Error(`Failed to create ONNX session with any provider. Last error: ${lastError?.message || 'Unknown error'}`);
        }
    }
    /**
     * Download model file with IndexedDB caching
     */
    async downloadModel() {
        logInfo(`[${this.modelName}] Starting model download...`);
        // Check IndexedDB cache first (unless bypassed)
        if (!this.options.bypassModelCache) {
            try {
                this.emitProgress('downloading', 10, 'Checking cache...');
                const cachedModel = await this.getCachedModel();
                if (cachedModel) {
                    logInfo(`[${this.modelName}] Using cached model: ${this.modelName}`);
                    this.emitProgress('downloading', 100, 'Using cached model');
                    return cachedModel;
                }
            }
            catch (error) {
                logWarn(`[${this.modelName}] IndexedDB cache unavailable, falling back to direct download:`, error);
            }
        }
        else {
            logInfo(`[${this.modelName}] Model cache bypassed, forcing fresh download`);
        }
        // Download model
        logInfo(`[${this.modelName}] Downloading model: ${this.modelName}`);
        const modelUrl = this.getModelUrl();
        this.emitProgress('downloading', 20, 'Starting download...');
        try {
            const response = await fetch(modelUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const contentLength = response.headers.get('content-length');
            const total = contentLength ? parseInt(contentLength, 10) : 0;
            logInfo(`[${this.modelName}] Model size: ${(total / (1024 * 1024)).toFixed(2)}MB`);
            if (total > 0) {
                this.emitProgress('downloading', 30, 'Downloading model...');
                const reader = response.body?.getReader();
                if (reader) {
                    const chunks = [];
                    let received = 0;
                    let done = false;
                    while (!done) {
                        const result = await reader.read();
                        done = result.done;
                        if (done || !result.value)
                            break;
                        const value = result.value;
                        chunks.push(value);
                        received += value.length;
                        const progress = 30 + Math.round((received / total) * 60);
                        this.emitProgress('downloading', progress, `Downloading model... ${Math.round((received / total) * 100)}%`);
                    }
                    const modelData = new Uint8Array(received);
                    let position = 0;
                    for (const chunk of chunks) {
                        modelData.set(chunk, position);
                        position += chunk.length;
                    }
                    this.emitProgress('downloading', 90, 'Download complete');
                    // Validate model integrity
                    this.emitProgress('downloading', 95, 'Validating model...');
                    const isValid = await validateModel(this.modelName, modelData.buffer);
                    if (!isValid) {
                        throw new Error(`Model integrity validation failed for ${this.modelName}`);
                    }
                    // Try to cache the model, but don't fail if IndexedDB is unavailable
                    try {
                        await this.cacheModel(modelData.buffer);
                    }
                    catch (cacheError) {
                        logWarn(`[${this.modelName}] Failed to cache model, but download succeeded:`, cacheError);
                    }
                    this.emitProgress('downloading', 100, 'Model ready');
                    return modelData.buffer;
                }
            }
            // Fallback to simple download if streaming is not available
            this.emitProgress('downloading', 50, 'Downloading model...');
            const modelData = await response.arrayBuffer();
            this.emitProgress('downloading', 90, 'Download complete');
            // Validate model integrity
            this.emitProgress('downloading', 95, 'Validating model...');
            const isValid = await validateModel(this.modelName, modelData);
            if (!isValid) {
                throw new Error(`Model integrity validation failed for ${this.modelName}`);
            }
            // Try to cache the model, but don't fail if IndexedDB is unavailable
            try {
                await this.cacheModel(modelData);
            }
            catch (cacheError) {
                logWarn(`[${this.modelName}] Failed to cache model, but download succeeded:`, cacheError);
            }
            this.emitProgress('downloading', 100, 'Model ready');
            return modelData;
        }
        catch (error) {
            logError(`[${this.modelName}] Model download failed:`, error);
            throw new Error(`Failed to download model ${this.modelName}: ${error}`);
        }
    }
    /**
     * Get cached model from IndexedDB
     */
    async getCachedModel() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('rembg-models', 2);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['models'], 'readonly');
                const store = transaction.objectStore('models');
                const getRequest = store.get(this.modelName);
                getRequest.onsuccess = () => {
                    const result = getRequest.result;
                    if (!result) {
                        resolve(null);
                        return;
                    }
                    // Check if the cached model version matches the current version
                    const currentVersion = this.getModelVersion();
                    const cachedVersion = result.version || '1.0.0'; // Default for old cached models
                    if (cachedVersion !== currentVersion) {
                        logDebug(`Model version mismatch for ${this.modelName}: cached=${cachedVersion}, current=${currentVersion}`);
                        resolve(null); // Return null to force re-download
                        return;
                    }
                    resolve(result.data || null);
                };
                getRequest.onerror = () => reject(getRequest.error);
            };
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains('models')) {
                    const store = db.createObjectStore('models', {
                        keyPath: 'name',
                    });
                    store.createIndex('version', 'version', { unique: false });
                }
            };
        });
    }
    /**
     * Cache model in IndexedDB
     */
    async cacheModel(modelData) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('rembg-models', 2);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['models'], 'readwrite');
                const store = transaction.objectStore('models');
                const putRequest = store.put({
                    name: this.modelName,
                    data: modelData,
                    timestamp: Date.now(),
                    version: this.getModelVersion(),
                });
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => reject(putRequest.error);
            };
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains('models')) {
                    const store = db.createObjectStore('models', {
                        keyPath: 'name',
                    });
                    store.createIndex('version', 'version', { unique: false });
                }
            };
        });
    }
    /**
     * Get model URL for download
     * Uses the central config singleton to get the model path
     */
    getModelUrl() {
        const customPath = rembgConfig.getCustomModelPath(this.modelName);
        if (customPath && customPath !== '') {
            logInfo(`Using custom model path for ${this.modelName}: ${customPath}`);
            return customPath;
        }
        // Fall back to default implementation
        return this.getDefaultModelUrl();
    }
    /**
     * Get the model version for cache invalidation
     */
    getModelVersion() {
        return '1.0.0'; // Default version, can be overridden by subclasses
    }
    prepareInput(imageCanvas) {
        return normalizeImage(imageCanvas, this.getNormalizationParams(), this.getInputName());
    }
    async runInference(input) {
        if (!this.session) {
            throw new Error('Session not initialized');
        }
        const results = await this.session.run(input);
        if (rembgConfig.isONNXProfilingEnabled()) {
            try {
                this.session.endProfiling();
                logInfo(`[${this.modelName}] ONNX profiling data outputted to console`);
            }
            catch (error) {
                logWarn(`[${this.modelName}] Failed to collect profiling data:`, error);
            }
        }
        return results;
    }
    /**
     * Predict masks for input image
     */
    async predict(imageCanvas) {
        logInfo(`[${this.modelName}] Starting prediction for ${imageCanvas.width}x${imageCanvas.height} image...`);
        if (!this.session) {
            await this.initialize();
        }
        if (!this.session) {
            throw new Error('Session not initialized');
        }
        // Normalize image for model input
        const input = this.prepareInput(imageCanvas);
        // Run inference
        const results = await this.runInference(input);
        const masks = this.outputToMaskArray(results);
        logInfo(`[${this.modelName}] Predicted ${masks.length} masks`);
        return masks.map(mask => this.maskArrayToMaskCanvas(mask, {
            width: imageCanvas.width,
            height: imageCanvas.height,
        }));
    }
    /**
     * generic model output processing
     *
     * Most models output a single tensor with shape [1, 1, height, width]
     * This method extracts the data from the tensor and returns it as a Float32Array
     * @param outputs - Model outputs
     * @returns [Mask array]
     */
    outputToMaskArray(outputs) {
        const outputTensor = outputs[Object.keys(outputs)[0]];
        const outputData = outputTensor.data;
        return [outputData];
    }
    /**
     * Generic mask array to mask canvas processing
     *
     * Most models just normalize, resize
     * and return the result as a mask canvas.
     *
     * @param maskArray - Model output mask array
     * @param originalSize - Original image dimensions for resizing
     * @returns HTMLCanvasElement
     */
    maskArrayToMaskCanvas(maskArray, originalSize) {
        return processModelOutput(maskArray, originalSize, this.getOutputShape());
    }
    /**
     * Get model name
     */
    static getName() {
        throw new Error('getName() must be implemented by subclass');
    }
    /**
     * Get model name (instance method)
     */
    getName() {
        return this.modelName;
    }
    /**
     * Get session options
     */
    getOptions() {
        return { ...this.options };
    }
    /**
     * Dispose of resources
     */
    async dispose() {
        if (this.session) {
            await this.session.release();
            this.session = null;
        }
        this.modelData = null;
    }
    /**
     * Clear all cached models from IndexedDB
     */
    static async clearCache() {
        return new Promise((resolve, reject) => {
            try {
                const request = indexedDB.deleteDatabase('rembg-models');
                request.onsuccess = () => {
                    logInfo('Model cache cleared successfully');
                    resolve();
                };
                request.onerror = () => {
                    logWarn('Failed to clear model cache:', request.error);
                    reject(request.error);
                };
            }
            catch (error) {
                logWarn('IndexedDB not available for cache clearing:', error);
                reject(error);
            }
        });
    }
    /**
     * Clear cache for a specific model
     */
    static async clearModelCache(modelName) {
        return new Promise((resolve, reject) => {
            try {
                const request = indexedDB.open('rembg-models', 2);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    const db = request.result;
                    const transaction = db.transaction(['models'], 'readwrite');
                    const store = transaction.objectStore('models');
                    const deleteRequest = store.delete(modelName);
                    deleteRequest.onsuccess = () => {
                        logInfo(`Model cache cleared for ${modelName}`);
                        resolve();
                    };
                    deleteRequest.onerror = () => reject(deleteRequest.error);
                };
                request.onupgradeneeded = () => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains('models')) {
                        const store = db.createObjectStore('models', {
                            keyPath: 'name',
                        });
                        store.createIndex('version', 'version', {
                            unique: false,
                        });
                    }
                };
            }
            catch (error) {
                logWarn('IndexedDB not available for cache clearing:', error);
                reject(error);
            }
        });
    }
}
__decorate([
    Performance()
], BaseSession.prototype, "initialize", null);
__decorate([
    Performance()
], BaseSession.prototype, "validateConfiguration", null);
__decorate([
    Performance()
], BaseSession.prototype, "setupExecutionProviders", null);
__decorate([
    Performance()
], BaseSession.prototype, "createSession", null);
__decorate([
    Performance()
], BaseSession.prototype, "downloadModel", null);
__decorate([
    Performance()
], BaseSession.prototype, "getCachedModel", null);
__decorate([
    Performance()
], BaseSession.prototype, "cacheModel", null);
__decorate([
    PerformanceSync()
], BaseSession.prototype, "prepareInput", null);
__decorate([
    Performance()
], BaseSession.prototype, "runInference", null);
__decorate([
    Performance()
], BaseSession.prototype, "predict", null);
__decorate([
    PerformanceSync()
], BaseSession.prototype, "outputToMaskArray", null);
__decorate([
    PerformanceSync()
], BaseSession.prototype, "maskArrayToMaskCanvas", null);

/**
 * U2Net model session for general-purpose background removal.
 *
 * U2Net is a deep learning model designed for salient object detection and
 * background removal. It works well on a wide variety of images including
 * people, objects, and animals.
 *
 * @example
 * ```typescript
 * // Create a U2Net session
 * const session = new U2NetSession();
 *
 * // Or with custom options
 * const session = new U2NetSession({
 *   preferWebNN: true,
 *   webnnDeviceType: 'gpu'
 * });
 *
 * // Initialize and use
 * await session.initialize();
 * const masks = await session.predict(imageCanvas);
 * ```
 */
class U2NetSession extends BaseSession {
    constructor(options) {
        super('u2net', options);
    }
    /**
     * Get default model URL for U2Net
     */
    getDefaultModelUrl() {
        return `${rembgConfig.getBaseUrl()}/u2net.onnx`;
    }
    /**
     * Get normalization parameters for U2Net
     * These match the Python version: mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)
     */
    getNormalizationParams() {
        return {
            mean: [0.485, 0.456, 0.406],
            std: [0.229, 0.224, 0.225],
            size: [320, 320],
        };
    }
    /**
     * Get the input tensor name for U2Net
     */
    getInputName() {
        if (this.session) {
            // Get the first input name dynamically like Python version
            return this.session.inputNames[0];
        }
        // Fallback to common input name for U2Net models
        return 'input_image';
    }
    /**
     * Get the output shape for U2Net
     */
    getOutputShape() {
        return [1, 1, 320, 320];
    }
    /**
     * Get model name
     */
    static getName() {
        return 'u2net';
    }
}

/**
 * U2Netp model session for lightweight background removal.
 *
 * U2Netp is a smaller, faster version of U2Net with reduced model size.
 * It provides good quality background removal with faster inference times,
 * making it ideal for real-time applications or resource-constrained environments.
 *
 * @example
 * ```typescript
 * // Create a U2Netp session
 * const session = new U2NetpSession();
 *
 * // Or with custom options
 * const session = new U2NetpSession({
 *   preferWebGPU: true,
 *   numThreads: 8
 * });
 *
 * // Initialize and use
 * await session.initialize();
 * const masks = await session.predict(imageCanvas);
 * ```
 */
class U2NetpSession extends BaseSession {
    constructor(options) {
        super('u2netp', options);
    }
    /**
     * Get default model URL for U2Netp
     * Matches Python: downloads from GitHub releases
     */
    getDefaultModelUrl() {
        return `${rembgConfig.getBaseUrl()}/u2netp.onnx`;
    }
    /**
     * Get normalization parameters for U2Netp
     * Matches Python version exactly: mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225), size=(320, 320)
     */
    getNormalizationParams() {
        return {
            mean: [0.485, 0.456, 0.406],
            std: [0.229, 0.224, 0.225],
            size: [320, 320],
        };
    }
    /**
     * Get the input tensor name for U2Netp
     */
    getInputName() {
        if (this.session) {
            // Get the first input name dynamically like Python version
            return this.session.inputNames[0];
        }
        // Fallback to common input name for U2Netp models
        return 'input_image';
    }
    /**
     * Get the output shape for U2Netp
     */
    getOutputShape() {
        return [1, 1, 320, 320];
    }
    /**
     * Get model name
     * Matches Python: return "u2netp"
     */
    static getName() {
        return 'u2netp';
    }
}

/**
 * U2Net Human Segmentation model session.
 *
 * Specialized version of U2Net trained specifically for human segmentation.
 * Provides superior results for images containing people, with better
 * edge detection and more accurate human body segmentation.
 *
 * @example
 * ```typescript
 * // Create a human segmentation session
 * const session = new U2NetHumanSegSession();
 *
 * // Or with custom options
 * const session = new U2NetHumanSegSession({
 *   preferWebNN: true,
 *   webnnDeviceType: 'gpu'
 * });
 *
 * // Initialize and use
 * await session.initialize();
 * const masks = await session.predict(imageCanvas);
 * ```
 */
class U2NetHumanSegSession extends BaseSession {
    constructor(options) {
        super('u2net_human_seg', options);
    }
    /**
     * Get default model URL for U2Net Human Segmentation
     * Matches Python: downloads from GitHub releases
     */
    getDefaultModelUrl() {
        return `${rembgConfig.getBaseUrl()}/u2net_human_seg.onnx`;
    }
    /**
     * Get normalization parameters for U2Net Human Segmentation
     * Matches Python version exactly: mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225), size=(320, 320)
     */
    getNormalizationParams() {
        return {
            mean: [0.485, 0.456, 0.406],
            std: [0.229, 0.224, 0.225],
            size: [320, 320],
        };
    }
    /**
     * Get the input tensor name for U2Net Human Segmentation
     */
    getInputName() {
        if (this.session) {
            // Get the first input name dynamically like Python version
            return this.session.inputNames[0];
        }
        // Fallback to common input name for U2Net Human Segmentation models
        return 'input_image';
    }
    /**
     * Get the output shape for U2Net Human Segmentation
     */
    getOutputShape() {
        return [1, 1, 320, 320];
    }
    /**
     * Get model name
     * Matches Python: return "u2net_human_seg"
     */
    static getName() {
        return 'u2net_human_seg';
    }
}

/**
 * U2Net Cloth Segmentation model session.
 *
 * Specialized version of U2Net trained for clothing segmentation.
 * Can segment different types of clothing (upper body, lower body, full body)
 * and is particularly useful for fashion applications and clothing analysis.
 *
 * @example
 * ```typescript
 * // Create a cloth segmentation session
 * const session = new U2NetClothSegSession();
 *
 * // Set clothing category
 * session.setClothCategory('upper');
 *
 * // Initialize and use
 * await session.initialize();
 * const masks = await session.predict(imageCanvas);
 * ```
 */
class U2NetClothSegSession extends BaseSession {
    clothCategory = 'combined';
    constructor(options) {
        super('u2net_cloth_seg', options);
    }
    /**
     * Set the cloth category filter for this session
     */
    setClothCategory(category) {
        this.clothCategory = category;
    }
    /**
     * Get the current cloth category setting
     */
    getClothCategory() {
        return this.clothCategory;
    }
    /**
     * Get default model URL for U2Net Cloth Segmentation
     * Matches Python: downloads from GitHub releases
     */
    getDefaultModelUrl() {
        return `${rembgConfig.getBaseUrl()}/u2net_cloth_seg.onnx`;
    }
    /**
     * Get normalization parameters for U2Net Cloth Segmentation
     * This model uses 768x768 input size, not 320x320 like other U2Net models
     */
    getNormalizationParams() {
        return {
            mean: [0.485, 0.456, 0.406],
            std: [0.229, 0.224, 0.225],
            size: [768, 768],
        };
    }
    /**
     * Get the input tensor name for U2Net Cloth Segmentation
     */
    getInputName() {
        if (this.session) {
            // Get the first input name dynamically like Python version
            return this.session.inputNames[0];
        }
        // Fallback to common input name for U2Net Cloth Segmentation models
        return 'input_image';
    }
    /**
     * Get the output shape for U2Net Cloth Segmentation
     */
    getOutputShape() {
        return [1, 3, 768, 768];
    }
    /**
     * Process U2Net Cloth Segmentation model outputs to create masks as Float32Array
     * Returns 3 masks: upper, lower, and full body cloth segmentation
     */
    outputToMaskArray(outputs) {
        const outputTensor = outputs[Object.keys(outputs)[0]];
        const outputData = outputTensor.data;
        // Get dimensions: [batch, channels, height, width]
        const [, channels, height, width] = outputTensor.dims;
        // Apply log_softmax along channel dimension (axis=1)
        const logSoftmaxData = this.logSoftmax(outputData, channels, height * width);
        // Apply argmax along channel dimension
        const argmaxData = this.argmax(logSoftmaxData, channels, height * width);
        // Create 3 separate binary masks for each cloth category as Float32Array
        const masks = [];
        // Create masks for each category (upper=1, lower=2, full=3)
        for (let categoryIndex = 1; categoryIndex <= 3; categoryIndex++) {
            const maskData = new Float32Array(height * width);
            // Create binary mask for this category
            // For compatiblity with the general normalization process, we use 255.5 instead of 1.0
            // This way we won't have to implement custom mask creation logic for this model.
            for (let i = 0; i < argmaxData.length; i++) {
                maskData[i] = argmaxData[i] === categoryIndex ? 255.5 : 0.0;
            }
            masks.push(maskData);
        }
        return masks;
    }
    /**
     * Process mask array to create mask canvas
     * @param maskArray - Model output mask array
     * @param originalSize - Original image dimensions for resizing
     * @returns HTMLCanvasElement
     */
    maskArrayToMaskCanvas(maskArray, originalSize) {
        return processModelOutput(maskArray, originalSize, this.getOutputShape());
    }
    /**
     * Apply log_softmax along channel dimension
     * Equivalent to scipy.special.log_softmax(pred[0], 1)
     */
    logSoftmax(data, channels, spatialSize) {
        const result = new Float32Array(data.length);
        for (let i = 0; i < spatialSize; i++) {
            // Find max value across channels for numerical stability
            let maxVal = data[i];
            for (let c = 1; c < channels; c++) {
                maxVal = Math.max(maxVal, data[c * spatialSize + i]);
            }
            // Compute sum of exp values
            let sumExp = 0;
            for (let c = 0; c < channels; c++) {
                sumExp += Math.exp(data[c * spatialSize + i] - maxVal);
            }
            // Compute log_softmax
            const logSumExp = Math.log(sumExp) + maxVal;
            for (let c = 0; c < channels; c++) {
                result[c * spatialSize + i] = data[c * spatialSize + i] - logSumExp;
            }
        }
        return result;
    }
    /**
     * Apply argmax along channel dimension
     * Equivalent to np.argmax(pred, axis=1, keepdims=True)
     */
    argmax(data, channels, spatialSize) {
        const result = new Uint8Array(spatialSize);
        for (let i = 0; i < spatialSize; i++) {
            let maxVal = data[i];
            let maxIndex = 0;
            for (let c = 1; c < channels; c++) {
                const val = data[c * spatialSize + i];
                if (val > maxVal) {
                    maxVal = val;
                    maxIndex = c;
                }
            }
            result[i] = maxIndex;
        }
        return result;
    }
    /**
     * Get model name
     * Matches Python: return "u2net_cloth_seg"
     */
    static getName() {
        return 'u2net_cloth_seg';
    }
}

/**
 * Custom U2Net model session for user-provided models.
 *
 * Allows you to use your own trained U2Net models with custom parameters.
 * The model must be compatible with the U2Net architecture and exported as ONNX.
 *
 * @example
 * ```typescript
 * const config: U2NetCustomConfig = {
 *   modelPath: '/models/my-model.onnx',
 *   inputSize: [512, 512]
 * };
 *
 * const session = new U2NetCustomSession(config, {
 *   preferWebNN: true
 * });
 *
 * await session.initialize();
 * const masks = await session.predict(imageCanvas);
 * ```
 *
 * @throws {Error} When modelPath is not provided in config
 */
class U2NetCustomSession extends BaseSession {
    config;
    constructor(config, options) {
        super('u2net_custom', options);
        this.config = config;
        // Validate required config
        if (!config.modelPath) {
            throw new Error('u2net_custom requires modelPath in config');
        }
    }
    /**
     * Get model URL for U2Net Custom
     * Uses the central config singleton first, then falls back to user-provided model path
     */
    getModelUrl() {
        const customPath = rembgConfig.getCustomModelPath(this.modelName);
        if (customPath && customPath !== '') {
            logDebug(`Using custom model path from config for ${this.modelName}: ${customPath}`);
            return customPath;
        }
        // Fall back to user-provided model path
        return this.config.modelPath;
    }
    /**
     * Get default model URL for U2Net Custom (not used, but required by base class)
     */
    getDefaultModelUrl() {
        return this.config.modelPath;
    }
    /**
     * Get normalization parameters for U2Net Custom
     * Uses user-provided parameters or defaults to standard U2Net values
     */
    getNormalizationParams() {
        return {
            mean: this.config.mean || [0.485, 0.456, 0.406],
            std: this.config.std || [0.229, 0.224, 0.225],
            size: this.config.inputSize || [320, 320],
        };
    }
    /**
     * Get the input tensor name for U2Net Custom
     */
    getInputName() {
        if (this.config.inputName) {
            return this.config.inputName;
        }
        if (this.session) {
            // Get the first input name dynamically like Python version
            return this.session.inputNames[0];
        }
        // Fallback to common input name for U2Net Custom models
        return 'input_image';
    }
    /**
     * Get the output shape for U2Net Custom
     */
    getOutputShape() {
        const size = this.config.inputSize || [320, 320];
        return [1, 1, size[0], size[1]];
    }
    /**
     * Get model name
     * Matches Python: return "u2net_custom"
     */
    static getName() {
        return 'u2net_custom';
    }
    /**
     * Get configuration
     */
    getConfig() {
        return { ...this.config };
    }
}

/**
 * ISNet General Use model session for high-quality background removal.
 *
 * ISNet (Interactive Segmentation Network) provides superior quality
 * background removal with better edge detection and detail preservation.
 * Uses larger input resolution (1024x1024) for higher quality results.
 *
 * @example
 * ```typescript
 * // Create an ISNet session
 * const session = new IsNetGeneralUseSession();
 *
 * // Or with custom options
 * const session = new IsNetGeneralUseSession({
 *   preferWebNN: true,
 *   webnnDeviceType: 'gpu'
 * });
 *
 * // Initialize and use
 * await session.initialize();
 * const masks = await session.predict(imageCanvas);
 * ```
 */
class IsNetGeneralUseSession extends BaseSession {
    constructor(options) {
        super('isnet-general-use', options);
    }
    /**
     * Get default model URL for ISNet General Use
     */
    getDefaultModelUrl() {
        return `${rembgConfig.getBaseUrl()}/isnet-general-use.onnx`;
    }
    /**
     * Get normalization parameters for ISNet General Use
     * These match the Python version: mean=(0.5, 0.5, 0.5), std=(1.0, 1.0, 1.0)
     * DIS models use larger input size: 1024x1024
     */
    getNormalizationParams() {
        return {
            mean: [0.5, 0.5, 0.5],
            std: [1.0, 1.0, 1.0],
            size: [1024, 1024],
        };
    }
    /**
     * Get the input tensor name for ISNet General Use
     * Uses dynamic input name like Python version: self.inner_session.get_inputs()[0].name
     */
    getInputName() {
        if (this.session) {
            // Get the first input name dynamically like Python version
            return this.session.inputNames[0];
        }
        // Fallback to common input name for ISNet models
        return 'input_image';
    }
    /**
     * Get the output shape for ISNet General Use
     */
    getOutputShape() {
        return [1, 1, 1024, 1024];
    }
    /**
     * Get model name
     */
    static getName() {
        return 'isnet-general-use';
    }
}

/**
 * ISNet Anime model session for anime/manga background removal.
 *
 * Specialized version of ISNet trained specifically for anime and manga images.
 * Provides superior results for animated content with better preservation
 * of artistic details and cleaner edge detection.
 *
 * @example
 * ```typescript
 * // Create an ISNet anime session
 * const session = new IsNetAnimeSession();
 *
 * // Or with custom options
 * const session = new IsNetAnimeSession({
 *   preferWebNN: true,
 *   webnnDeviceType: 'gpu'
 * });
 *
 * // Initialize and use
 * await session.initialize();
 * const masks = await session.predict(imageCanvas);
 * ```
 */
class IsNetAnimeSession extends BaseSession {
    constructor(options) {
        super('isnet-anime', options);
    }
    /**
     * Get default model URL for ISNet Anime
     */
    getDefaultModelUrl() {
        return `${rembgConfig.getBaseUrl()}/isnet-anime.onnx`;
    }
    /**
     * Get normalization parameters for ISNet Anime
     * These match the Python version: mean=(0.485, 0.456, 0.406), std=(1.0, 1.0, 1.0)
     * DIS models use larger input size: 1024x1024
     */
    getNormalizationParams() {
        return {
            mean: [0.485, 0.456, 0.406],
            std: [1.0, 1.0, 1.0],
            size: [1024, 1024],
        };
    }
    /**
     * Get the input tensor name for ISNet Anime
     * Uses dynamic input name like Python version: self.inner_session.get_inputs()[0].name
     */
    getInputName() {
        if (this.session) {
            // Get the first input name dynamically like Python version
            return this.session.inputNames[0];
        }
        // Fallback to common input name for ISNet models
        return 'input_image';
    }
    /**
     * Get the output shape for ISNet Anime
     */
    getOutputShape() {
        return [1, 1, 1024, 1024];
    }
    /**
     * Get model name
     */
    static getName() {
        return 'isnet-anime';
    }
}

/**
 * Silueta model session for background removal.
 *
 * Silueta is a specialized model for background removal with focus on
 * clean silhouette extraction. It provides good results for objects
 * with well-defined boundaries and is particularly effective for
 * product photography and object isolation.
 *
 * @example
 * ```typescript
 * // Create a Silueta session
 * const session = new SiluetaSession();
 *
 * // Or with custom options
 * const session = new SiluetaSession({
 *   preferWebGPU: true,
 *   numThreads: 8
 * });
 *
 * // Initialize and use
 * await session.initialize();
 * const masks = await session.predict(imageCanvas);
 * ```
 */
class SiluetaSession extends BaseSession {
    constructor(options) {
        super('silueta', options);
    }
    /**
     * Get default model URL for Silueta
     */
    getDefaultModelUrl() {
        return `${rembgConfig.getBaseUrl()}/silueta.onnx`;
    }
    /**
     * Get normalization parameters for Silueta
     * These match the Python version: mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)
     * Silueta uses the same normalization as U2Net
     */
    getNormalizationParams() {
        return {
            mean: [0.485, 0.456, 0.406],
            std: [0.229, 0.224, 0.225],
            size: [320, 320],
        };
    }
    /**
     * Get the input tensor name for Silueta
     */
    getInputName() {
        if (this.session) {
            // Get the first input name dynamically like Python version
            return this.session.inputNames[0];
        }
        // Fallback to common input name for Silueta models
        return 'input_image';
    }
    /**
     * Get the output shape for Silueta
     */
    getOutputShape() {
        return [1, 1, 320, 320];
    }
    /**
     * Get model name
     */
    static getName() {
        return 'silueta';
    }
}

// Registry of available session classes
const sessionRegistry = new Map();
// Register available sessions
sessionRegistry.set('u2net', U2NetSession);
sessionRegistry.set('u2netp', U2NetpSession); // Force rebuild
sessionRegistry.set('u2net_human_seg', U2NetHumanSegSession);
sessionRegistry.set('u2net_cloth_seg', U2NetClothSegSession);
sessionRegistry.set('isnet-general-use', IsNetGeneralUseSession);
sessionRegistry.set('isnet-anime', IsNetAnimeSession);
sessionRegistry.set('silueta', SiluetaSession);
const SESSIONS = {
    U2NetSession,
    U2NetpSession,
    U2NetHumanSegSession,
    U2NetClothSegSession,
    IsNetGeneralUseSession,
    IsNetAnimeSession,
    SiluetaSession,
};
// Cache for initialized sessions with LRU tracking
const sessionCache = new Map();
const sessionAccessOrder = []; // Track access order for LRU
// Configuration for cache management
const CACHE_CONFIG = {
    maxSessions: 5, // Maximum number of cached sessions
    maxMemoryMB: 500, // Maximum memory usage in MB (approximate)
};
// Track cache statistics
const cacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSessions: 0,
};
/**
 * Compare two SessionOptions objects for equality
 * Returns true if all relevant settings match
 */
function areSessionOptionsEqual(options1, options2) {
    // Compare all settings that affect session behavior
    const mismatches = [];
    if (options1.preferWebNN !== options2.preferWebNN) {
        mismatches.push(`preferWebNN: ${options1.preferWebNN} vs ${options2.preferWebNN}`);
    }
    if (options1.webnnDeviceType !== options2.webnnDeviceType) {
        mismatches.push(`webnnDeviceType: ${options1.webnnDeviceType} vs ${options2.webnnDeviceType}`);
    }
    if (options1.webnnPowerPreference !== options2.webnnPowerPreference) {
        mismatches.push(`webnnPowerPreference: ${options1.webnnPowerPreference} vs ${options2.webnnPowerPreference}`);
    }
    if (options1.preferWebGPU !== options2.preferWebGPU) {
        mismatches.push(`preferWebGPU: ${options1.preferWebGPU} vs ${options2.preferWebGPU}`);
    }
    if (options1.webgpuPowerPreference !== options2.webgpuPowerPreference) {
        mismatches.push(`webgpuPowerPreference: ${options1.webgpuPowerPreference} vs ${options2.webgpuPowerPreference}`);
    }
    if (options1.simd !== options2.simd) {
        mismatches.push(`simd: ${options1.simd} vs ${options2.simd}`);
    }
    if (options1.proxy !== options2.proxy) {
        mismatches.push(`proxy: ${options1.proxy} vs ${options2.proxy}`);
    }
    if (options1.numThreads !== options2.numThreads) {
        mismatches.push(`numThreads: ${options1.numThreads} vs ${options2.numThreads}`);
    }
    const providers1 = JSON.stringify(options1.executionProviders?.sort());
    const providers2 = JSON.stringify(options2.executionProviders?.sort());
    if (providers1 !== providers2) {
        mismatches.push(`executionProviders: ${providers1} vs ${providers2}`);
    }
    if (mismatches.length > 0) {
        logInfo(`[areSessionOptionsEqual] Settings mismatch detected: ${mismatches.join(', ')}`);
        return false;
    }
    return true;
}
/**
 * Update LRU access order for a session
 */
function updateAccessOrder(cacheKey) {
    // Remove from current position
    const index = sessionAccessOrder.indexOf(cacheKey);
    if (index > -1) {
        sessionAccessOrder.splice(index, 1);
    }
    // Add to end (most recently used)
    sessionAccessOrder.push(cacheKey);
}
/**
 * Evict least recently used session
 */
async function evictLRUSession() {
    if (sessionAccessOrder.length === 0)
        return;
    const lruKey = sessionAccessOrder[0];
    const session = sessionCache.get(lruKey);
    if (session) {
        await session.dispose();
        sessionCache.delete(lruKey);
        sessionAccessOrder.shift();
        cacheStats.evictions++;
    }
}
/**
 * Check if cache needs eviction and perform it
 */
async function checkAndEvict() {
    // Evict based on count limit
    while (sessionCache.size >= CACHE_CONFIG.maxSessions) {
        await evictLRUSession();
    }
    // TODO: Add memory-based eviction when performance.memory is available
    // This would require browser support for performance.memory API
}
/**
 * Create a new session instance with LRU cache management.
 *
 * Creates a new session for the specified model with intelligent caching.
 * Sessions are cached and reused when possible to improve performance.
 * For custom models, provide the modelPath in the config parameter.
 *
 * @param modelName - Name of the model to use (default: 'u2net')
 * @param config - Configuration for custom models (required for 'u2net_custom')
 * @param options - Session options for WebNN, WebGPU, and other settings
 * @returns Promise that resolves to a BaseSession instance
 *
 * @throws {Error} When model name is not supported
 * @throws {Error} When u2net_custom is used without modelPath in config
 * @throws {Error} When model fails to load or initialize
 *
 * @example
 * ```typescript
 * // Create a standard U2Net session
 * const session = await newSession('u2net');
 *
 * // Create a session with WebNN acceleration
 * const session = await newSession('u2net', undefined, {
 *   preferWebNN: true,
 *   webnnDeviceType: 'gpu'
 * });
 *
 * // Create a custom model session
 * const customSession = await newSession('u2net_custom', {
 *   modelPath: '/path/to/my-model.onnx',
 *   inputSize: [512, 512]
 * });
 * ```
 */
async function newSession(modelName = 'u2net', config, options) {
    const sessionStartTime = performance.now();
    logInfo(`[newSession] Creating session for model: ${modelName}`);
    // Merge global WebNN, WebGPU, and cache bypass configuration with session options
    const optionsMergeStart = performance.now();
    const mergedOptions = {
        ...options,
        // Apply global WebNN settings if not explicitly set
        preferWebNN: options?.preferWebNN ?? rembgConfig.isWebNNEnabled(),
        webnnDeviceType: options?.webnnDeviceType ?? rembgConfig.getWebNNDeviceType(),
        webnnPowerPreference: options?.webnnPowerPreference ?? rembgConfig.getWebNNPowerPreference(),
        // Apply global WebGPU settings if not explicitly set
        preferWebGPU: options?.preferWebGPU ?? rembgConfig.isWebGPUEnabled(),
        webgpuPowerPreference: options?.webgpuPowerPreference ?? rembgConfig.getWebGPUPowerPreference(),
        // Apply global cache bypass settings if not explicitly set
        bypassSessionCache: options?.bypassSessionCache ?? rembgConfig.isSessionCacheBypassEnabled(),
        bypassModelCache: options?.bypassModelCache ?? rembgConfig.isModelCacheBypassEnabled(),
    };
    const optionsMergeTime = performance.now() - optionsMergeStart;
    logPerformance(`[newSession] Options merge: ${optionsMergeTime.toFixed(2)}ms`);
    // Handle u2net_custom with configuration
    if (modelName === 'u2net_custom') {
        if (!config || !config.modelPath) {
            throw new Error('u2net_custom requires modelPath in config');
        }
        // Create a unique cache key for custom models
        const cacheKey = `u2net_custom_${config.modelPath}`;
        // Check cache first (unless bypassed)
        const cacheCheckStart = performance.now();
        if (!mergedOptions.bypassSessionCache && sessionCache.has(cacheKey)) {
            const cachedSession = sessionCache.get(cacheKey);
            const cachedOptions = cachedSession.getOptions();
            // Validate settings match
            if (areSessionOptionsEqual(mergedOptions, cachedOptions)) {
                updateAccessOrder(cacheKey);
                cacheStats.hits++;
                const cacheCheckTime = performance.now() - cacheCheckStart;
                const totalTime = performance.now() - sessionStartTime;
                logPerformance(`[newSession] Cache hit for ${modelName}: ${cacheCheckTime.toFixed(2)}ms (total: ${totalTime.toFixed(2)}ms)`);
                return cachedSession;
            }
            else {
                // Settings don't match - evict and recreate
                logInfo(`[newSession] Settings mismatch for ${modelName}, evicting cached session`);
                await cachedSession.dispose();
                sessionCache.delete(cacheKey);
                const index = sessionAccessOrder.indexOf(cacheKey);
                if (index > -1) {
                    sessionAccessOrder.splice(index, 1);
                }
                cacheStats.evictions++;
            }
        }
        else if (mergedOptions.bypassSessionCache) {
            logInfo(`[newSession] Session cache bypassed for ${modelName}`);
        }
        const cacheCheckTime = performance.now() - cacheCheckStart;
        logPerformance(`[newSession] Cache miss for ${modelName}: ${cacheCheckTime.toFixed(2)}ms`);
        // Create new custom session
        const sessionCreateStart = performance.now();
        const session = new U2NetCustomSession(config, mergedOptions);
        const sessionCreateTime = performance.now() - sessionCreateStart;
        logPerformance(`[newSession] Custom session creation: ${sessionCreateTime.toFixed(2)}ms`);
        // Cache the session
        const cacheStoreStart = performance.now();
        sessionCache.set(cacheKey, session);
        updateAccessOrder(cacheKey);
        cacheStats.misses++;
        cacheStats.totalSessions++;
        const cacheStoreTime = performance.now() - cacheStoreStart;
        logPerformance(`[newSession] Session caching: ${cacheStoreTime.toFixed(2)}ms`);
        // Check if eviction is needed (async, don't await)
        checkAndEvict().catch(console.warn);
        const totalTime = performance.now() - sessionStartTime;
        logPerformance(`[newSession] Total custom session creation: ${totalTime.toFixed(2)}ms`);
        return session;
    }
    const registryLookupStart = performance.now();
    const SessionClass = sessionRegistry.get(modelName);
    const registryLookupTime = performance.now() - registryLookupStart;
    logPerformance(`[newSession] Registry lookup: ${registryLookupTime.toFixed(2)}ms`);
    if (!SessionClass) {
        const availableModels = Array.from(sessionRegistry.keys()).join(', ');
        throw new Error(`No session class found for model '${modelName}'. Available models: ${availableModels}`);
    }
    // Check cache first (unless bypassed)
    const cacheCheckStart = performance.now();
    if (!mergedOptions.bypassSessionCache && sessionCache.has(modelName)) {
        const cachedSession = sessionCache.get(modelName);
        const cachedOptions = cachedSession.getOptions();
        // Validate settings match
        if (areSessionOptionsEqual(mergedOptions, cachedOptions)) {
            updateAccessOrder(modelName);
            cacheStats.hits++;
            const cacheCheckTime = performance.now() - cacheCheckStart;
            const totalTime = performance.now() - sessionStartTime;
            logPerformance(`[newSession] Cache hit for ${modelName}: ${cacheCheckTime.toFixed(2)}ms (total: ${totalTime.toFixed(2)}ms)`);
            return cachedSession;
        }
        else {
            // Settings don't match - evict and recreate
            logInfo(`[newSession] Settings mismatch for ${modelName}, evicting cached session`);
            await cachedSession.dispose();
            sessionCache.delete(modelName);
            const index = sessionAccessOrder.indexOf(modelName);
            if (index > -1) {
                sessionAccessOrder.splice(index, 1);
            }
            cacheStats.evictions++;
        }
    }
    else if (mergedOptions.bypassSessionCache) {
        logInfo(`[newSession] Session cache bypassed for ${modelName}`);
    }
    const cacheCheckTime = performance.now() - cacheCheckStart;
    logPerformance(`[newSession] Cache miss for ${modelName}: ${cacheCheckTime.toFixed(2)}ms`);
    // Create new session
    const sessionCreateStart = performance.now();
    const session = new SessionClass(mergedOptions);
    const sessionCreateTime = performance.now() - sessionCreateStart;
    logPerformance(`[newSession] Session creation: ${sessionCreateTime.toFixed(2)}ms`);
    // Cache the session
    const cacheStoreStart = performance.now();
    sessionCache.set(modelName, session);
    updateAccessOrder(modelName);
    cacheStats.misses++;
    cacheStats.totalSessions++;
    const cacheStoreTime = performance.now() - cacheStoreStart;
    logPerformance(`[newSession] Session caching: ${cacheStoreTime.toFixed(2)}ms`);
    // Check if eviction is needed (async, don't await)
    checkAndEvict().catch(console.warn);
    const totalTime = performance.now() - sessionStartTime;
    logPerformance(`[newSession] Total session creation: ${totalTime.toFixed(2)}ms`);
    return session;
}
/**
 * Get list of available model names.
 *
 * Returns all supported model names including built-in models and the
 * custom model option. Use this to validate model names before creating sessions.
 *
 * @returns Array of available model names
 *
 * @example
 * ```typescript
 * const models = getAvailableModels();
 * console.log('Available models:', models);
 * // Output: ['u2net', 'u2netp', 'u2net_human_seg', 'u2net_cloth_seg', 'isnet-general-use', 'isnet-anime', 'silueta', 'u2net_custom']
 *
 * // Validate model name before use
 * if (models.includes('u2net')) {
 *   const session = await newSession('u2net');
 * }
 * ```
 */
function getAvailableModels() {
    const models = Array.from(sessionRegistry.keys());
    models.push('u2net_custom'); // Add custom model (not in registry)
    return models;
}
/**
 * Get cache statistics and performance metrics.
 *
 * Returns information about session cache performance including hit rates,
 * eviction counts, and current cache size. Useful for monitoring and
 * optimizing cache behavior.
 *
 * @returns Cache statistics object with hit rate, current sessions, etc.
 *
 * @example
 * ```typescript
 * const stats = getCacheStats();
 * console.log(`Cache hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
 * console.log(`Current sessions: ${stats.currentSessions}/${stats.maxSessions}`);
 * console.log(`Total evictions: ${stats.evictions}`);
 *
 * // Monitor cache performance
 * if (stats.hitRate < 0.5) {
 *   console.warn('Low cache hit rate - consider increasing cache size');
 * }
 * ```
 */
function getCacheStats() {
    return {
        ...cacheStats,
        currentSessions: sessionCache.size,
        maxSessions: CACHE_CONFIG.maxSessions,
        hitRate: cacheStats.hits / (cacheStats.hits + cacheStats.misses) || 0,
    };
}
/**
 * Configure cache settings.
 *
 * Allows you to adjust cache behavior including maximum number of
 * cached sessions and memory limits. Changes take effect immediately
 * and affect future session creation.
 *
 * @param options - Cache configuration options
 *
 * @example
 * ```typescript
 * // Limit cache to 3 sessions
 * configureCache({ maxSessions: 3 });
 *
 * // Set memory limit to 1GB
 * configureCache({ maxMemoryMB: 1024 });
 *
 * // Configure both
 * configureCache({
 *   maxSessions: 5,
 *   maxMemoryMB: 512
 * });
 * ```
 */
function configureCache(options) {
    if (options.maxSessions !== undefined) {
        CACHE_CONFIG.maxSessions = Math.max(1, options.maxSessions);
    }
    if (options.maxMemoryMB !== undefined) {
        CACHE_CONFIG.maxMemoryMB = Math.max(1000, options.maxMemoryMB);
    }
}
/**
 * Clear session cache.
 *
 * Removes all cached sessions from memory. This can help free up memory
 * when switching between different models or when memory usage is high.
 * Note: This does not dispose of sessions, just removes them from cache.
 *
 * @example
 * ```typescript
 * // Clear all cached sessions
 * clearSessionCache();
 *
 * // Check cache stats after clearing
 * const stats = getCacheStats();
 * console.log(`Sessions after clear: ${stats.currentSessions}`);
 * ```
 */
function clearSessionCache() {
    sessionCache.clear();
    sessionAccessOrder.length = 0;
    // Reset stats
    cacheStats.hits = 0;
    cacheStats.misses = 0;
    cacheStats.evictions = 0;
    cacheStats.totalSessions = 0;
}
/**
 * Dispose all cached sessions.
 *
 * Properly disposes of all cached sessions, freeing up memory and
 * cleaning up resources. This is more thorough than clearSessionCache()
 * as it also disposes of ONNX Runtime sessions.
 *
 * @example
 * ```typescript
 * // Dispose all sessions and free resources
 * await disposeAllSessions();
 *
 * // Verify all sessions are disposed
 * const stats = getCacheStats();
 * console.log(`Sessions after dispose: ${stats.currentSessions}`);
 * ```
 */
async function disposeAllSessions() {
    const disposePromises = Array.from(sessionCache.values()).map(session => session.dispose());
    await Promise.all(disposePromises);
    sessionCache.clear();
    sessionAccessOrder.length = 0;
}
/**
 * Clear all cached models from IndexedDB.
 *
 * Removes cached model files from IndexedDB storage. This forces
 * models to be re-downloaded on next use, which can help with
 * corrupted cache or when you want to ensure you have the latest models.
 *
 * @example
 * ```typescript
 * // Clear all cached models
 * await clearModelCache();
 *
 * // Next session creation will re-download models
 * const session = await newSession('u2net');
 * ```
 */
async function clearModelCache() {
    await BaseSession.clearCache();
}
/**
 * Clear cache for a specific model.
 *
 * Removes cached model files for a specific model from IndexedDB storage.
 * This forces the model to be re-downloaded on next use.
 *
 * @param modelName - Name of the model to clear from cache
 *
 * @example
 * ```typescript
 * // Clear specific model cache
 * await clearModelCacheForModel('u2net');
 *
 * // Clear custom model cache
 * await clearModelCacheForModel('u2net_custom');
 *
 * // Next session creation will re-download the model
 * const session = await newSession('u2net');
 * ```
 */
async function clearModelCacheForModel(modelName) {
    await BaseSession.clearModelCache(modelName);
}

var version$1 = "1.0.2";
var packageJson = {
	version: version$1};

/**
 * Remove background from an image using AI-powered segmentation.
 *
 * This is the main function for background removal. It supports multiple input formats
 * and provides various processing options including mask-only output, custom backgrounds,
 * and post-processing.
 *
 * @param data - Input image as File, Blob, ArrayBuffer, HTMLImageElement, or HTMLCanvasElement
 * @param options - Processing options
 * @returns Promise<Blob> - Processed image as PNG blob with transparent background
 *
 * @example
 * ```typescript
 * // Basic usage
 * const fileInput = document.getElementById('file') as HTMLInputElement;
 * const file = fileInput.files[0];
 * const result = await remove(file);
 *
 * // With progress tracking
 * const result = await remove(file, {
 *   onProgress: (info) => console.log(`${info.step}: ${info.progress}%`)
 * });
 *
 * // Mask only output
 * const mask = await remove(file, { onlyMask: true });
 *
 * // Custom background color
 * const result = await remove(file, {
 *   bgcolor: [255, 0, 0, 255] // Red background
 * });
 * ```
 *
 * @throws {Error} When input type is not supported
 * @throws {Error} When model fails to generate masks
 * @throws {Error} When browser doesn't support required features (WASM, IndexedDB, etc.)
 */
async function remove(data, options = {}) {
    const removeStartTime = performance.now();
    logInfo('[remove] Starting background removal process...');
    const emitProgress = (step, progress, message) => {
        if (options.onProgress) {
            options.onProgress({ step, progress, message });
        }
    };
    try {
        emitProgress('downloading', 0, 'Initializing...');
        // Convert input to canvas
        const inputProcessingStart = performance.now();
        let inputCanvas;
        if (data instanceof HTMLCanvasElement) {
            inputCanvas = data;
            emitProgress('downloading', 20, 'Input ready');
            logInfo('[remove] Input is already a canvas');
        }
        else if (data instanceof HTMLImageElement) {
            const canvasStart = performance.now();
            inputCanvas = imageToCanvas(data);
            const canvasTime = performance.now() - canvasStart;
            logPerformance(`[remove] Image to canvas conversion: ${canvasTime.toFixed(2)}ms`);
            emitProgress('downloading', 20, 'Input ready');
        }
        else if (data instanceof File || data instanceof Blob) {
            emitProgress('downloading', 10, 'Loading image...');
            const fileStart = performance.now();
            const image$1 = await fileToImage(data);
            const fileTime = performance.now() - fileStart;
            logPerformance(`[remove] File to image conversion: ${fileTime.toFixed(2)}ms`);
            const canvasStart = performance.now();
            inputCanvas = imageToCanvas(image$1);
            const canvasTime = performance.now() - canvasStart;
            logPerformance(`[remove] Image to canvas conversion: ${canvasTime.toFixed(2)}ms`);
            emitProgress('downloading', 20, 'Input ready');
        }
        else if (data instanceof ArrayBuffer) {
            emitProgress('downloading', 10, 'Loading image...');
            const bufferStart = performance.now();
            const image$1 = await arrayBufferToImage(data);
            const bufferTime = performance.now() - bufferStart;
            logPerformance(`[remove] ArrayBuffer to image conversion: ${bufferTime.toFixed(2)}ms`);
            const canvasStart = performance.now();
            inputCanvas = imageToCanvas(image$1);
            const canvasTime = performance.now() - canvasStart;
            logPerformance(`[remove] Image to canvas conversion: ${canvasTime.toFixed(2)}ms`);
            emitProgress('downloading', 20, 'Input ready');
        }
        else {
            throw new Error('Unsupported input type. Supported types: File, Blob, ArrayBuffer, HTMLImageElement, HTMLCanvasElement');
        }
        const inputProcessingTime = performance.now() - inputProcessingStart;
        logPerformance(`[remove] Total input processing: ${inputProcessingTime.toFixed(2)}ms (${inputCanvas.width}x${inputCanvas.height})`);
        // Get or create session
        const sessionStart = performance.now();
        emitProgress('downloading', 30, 'Preparing model...');
        const session = options.session || (await newSession('u2net'));
        const sessionTime = performance.now() - sessionStart;
        logPerformance(`[remove] Session creation: ${sessionTime.toFixed(2)}ms`);
        // Run prediction to get masks
        const predictionStart = performance.now();
        emitProgress('processing', 40, 'Running AI model...');
        const masks = await session.predict(inputCanvas);
        const predictionTime = performance.now() - predictionStart;
        logPerformance(`[remove] Model prediction: ${predictionTime.toFixed(2)}ms`);
        if (masks.length === 0) {
            throw new Error('No masks generated from model');
        }
        emitProgress('processing', 70, 'Processing mask...');
        // Use the first mask
        let mask = masks[0];
        // Apply post-processing if requested
        if (options.postProcessMask) {
            const postProcessStart = performance.now();
            emitProgress('postprocessing', 80, 'Applying post-processing...');
            mask = postProcessMask(mask);
            const postProcessTime = performance.now() - postProcessStart;
            logPerformance(`[remove] Post-processing: ${postProcessTime.toFixed(2)}ms`);
        }
        // Return only mask if requested
        if (options.onlyMask) {
            const maskOnlyStart = performance.now();
            emitProgress('postprocessing', 90, 'Creating mask output...');
            const maskOnly = createMaskOnly(mask);
            const maskOnlyTime = performance.now() - maskOnlyStart;
            logPerformance(`[remove] Mask-only creation: ${maskOnlyTime.toFixed(2)}ms`);
            const blobStart = performance.now();
            const blob = await canvasToBlob(maskOnly, 'image/png');
            const blobTime = performance.now() - blobStart;
            logPerformance(`[remove] Canvas to blob conversion: ${blobTime.toFixed(2)}ms`);
            emitProgress('complete', 100, 'Complete');
            const totalTime = performance.now() - removeStartTime;
            logPerformance(`[remove] Total processing time (mask-only): ${totalTime.toFixed(2)}ms`);
            return blob;
        }
        // Create cutout
        const cutoutStart = performance.now();
        emitProgress('postprocessing', 85, 'Creating cutout...');
        let result = naiveCutout(inputCanvas, mask);
        const cutoutTime = performance.now() - cutoutStart;
        logPerformance(`[remove] Cutout creation: ${cutoutTime.toFixed(2)}ms`);
        // Apply background color if specified
        if (options.bgcolor) {
            const bgColorStart = performance.now();
            emitProgress('postprocessing', 90, 'Applying background color...');
            result = applyBackgroundColor(result, options.bgcolor);
            const bgColorTime = performance.now() - bgColorStart;
            logPerformance(`[remove] Background color application: ${bgColorTime.toFixed(2)}ms`);
        }
        // Convert to blob and return
        const finalBlobStart = performance.now();
        emitProgress('postprocessing', 95, 'Finalizing output...');
        const blob = await canvasToBlob(result, 'image/png');
        const finalBlobTime = performance.now() - finalBlobStart;
        logPerformance(`[remove] Final canvas to blob conversion: ${finalBlobTime.toFixed(2)}ms`);
        emitProgress('complete', 100, 'Complete');
        const totalTime = performance.now() - removeStartTime;
        logPerformance(`[remove] Total processing time: ${totalTime.toFixed(2)}ms`);
        return blob;
    }
    catch (error) {
        const totalTime = performance.now() - removeStartTime;
        console.error(`[remove] Processing failed (${totalTime.toFixed(2)}ms):`, error);
        // Emit error progress if callback is provided
        if (options.onProgress) {
            options.onProgress({
                step: 'complete',
                progress: 0,
                message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
        }
        throw error;
    }
}
/**
 * Remove background from an image and return as HTMLCanvasElement.
 *
 * Similar to the `remove()` function but returns a canvas instead of a blob.
 * This is useful when you need to perform additional canvas operations
 * or want to avoid the blob conversion overhead.
 *
 * @param data - Input image as File, Blob, ArrayBuffer, HTMLImageElement, or HTMLCanvasElement
 * @param options - Processing options
 * @returns Promise<HTMLCanvasElement> - Processed image as canvas with transparent background
 *
 * @example
 * ```typescript
 * // Get canvas for further processing
 * const canvas = await removeToCanvas(file);
 * const ctx = canvas.getContext('2d');
 * // Perform additional canvas operations...
 *
 * // Convert to blob when ready
 * const blob = await new Promise(resolve =>
 *   canvas.toBlob(resolve, 'image/png')
 * );
 * ```
 *
 * @throws {Error} When input type is not supported
 * @throws {Error} When model fails to generate masks
 * @throws {Error} When browser doesn't support required features (WASM, IndexedDB, etc.)
 */
async function removeToCanvas(data, options = {}) {
    const removeStartTime = performance.now();
    logInfo('[removeToCanvas] Starting background removal process...');
    const emitProgress = (step, progress, message) => {
        if (options.onProgress) {
            options.onProgress({ step, progress, message });
        }
    };
    try {
        emitProgress('downloading', 0, 'Initializing...');
        // Convert input to canvas
        const inputProcessingStart = performance.now();
        let inputCanvas;
        if (data instanceof HTMLCanvasElement) {
            inputCanvas = data;
            emitProgress('downloading', 20, 'Input ready');
            logInfo('[removeToCanvas] Input is already a canvas');
        }
        else if (data instanceof HTMLImageElement) {
            const canvasStart = performance.now();
            inputCanvas = imageToCanvas(data);
            const canvasTime = performance.now() - canvasStart;
            logPerformance(`[removeToCanvas] Image to canvas conversion: ${canvasTime.toFixed(2)}ms`);
            emitProgress('downloading', 20, 'Input ready');
        }
        else if (data instanceof File || data instanceof Blob) {
            emitProgress('downloading', 10, 'Loading image...');
            const fileStart = performance.now();
            const image$1 = await fileToImage(data);
            const fileTime = performance.now() - fileStart;
            logPerformance(`[removeToCanvas] File to image conversion: ${fileTime.toFixed(2)}ms`);
            const canvasStart = performance.now();
            inputCanvas = imageToCanvas(image$1);
            const canvasTime = performance.now() - canvasStart;
            logPerformance(`[removeToCanvas] Image to canvas conversion: ${canvasTime.toFixed(2)}ms`);
            emitProgress('downloading', 20, 'Input ready');
        }
        else if (data instanceof ArrayBuffer) {
            emitProgress('downloading', 10, 'Loading image...');
            const bufferStart = performance.now();
            const image$1 = await arrayBufferToImage(data);
            const bufferTime = performance.now() - bufferStart;
            logPerformance(`[removeToCanvas] ArrayBuffer to image conversion: ${bufferTime.toFixed(2)}ms`);
            const canvasStart = performance.now();
            inputCanvas = imageToCanvas(image$1);
            const canvasTime = performance.now() - canvasStart;
            logPerformance(`[removeToCanvas] Image to canvas conversion: ${canvasTime.toFixed(2)}ms`);
            emitProgress('downloading', 20, 'Input ready');
        }
        else {
            throw new Error('Unsupported input type. Supported types: File, Blob, ArrayBuffer, HTMLImageElement, HTMLCanvasElement');
        }
        const inputProcessingTime = performance.now() - inputProcessingStart;
        logPerformance(`[removeToCanvas] Total input processing: ${inputProcessingTime.toFixed(2)}ms (${inputCanvas.width}x${inputCanvas.height})`);
        // Get or create session
        const sessionStart = performance.now();
        emitProgress('downloading', 30, 'Preparing model...');
        const session = options.session || (await newSession('u2net'));
        const sessionTime = performance.now() - sessionStart;
        logPerformance(`[removeToCanvas] Session creation: ${sessionTime.toFixed(2)}ms`);
        // Run prediction to get masks
        const predictionStart = performance.now();
        emitProgress('processing', 40, 'Running AI model...');
        const masks = await session.predict(inputCanvas);
        const predictionTime = performance.now() - predictionStart;
        logPerformance(`[removeToCanvas] Model prediction: ${predictionTime.toFixed(2)}ms`);
        if (masks.length === 0) {
            throw new Error('No masks generated from model');
        }
        emitProgress('processing', 70, 'Processing mask...');
        // Use the first mask
        let mask = masks[0];
        // Apply post-processing if requested
        if (options.postProcessMask) {
            const postProcessStart = performance.now();
            emitProgress('postprocessing', 80, 'Applying post-processing...');
            mask = postProcessMask(mask);
            const postProcessTime = performance.now() - postProcessStart;
            logPerformance(`[removeToCanvas] Post-processing: ${postProcessTime.toFixed(2)}ms`);
        }
        // Return only mask if requested
        if (options.onlyMask) {
            const maskOnlyStart = performance.now();
            emitProgress('postprocessing', 90, 'Creating mask output...');
            const result = createMaskOnly(mask);
            const maskOnlyTime = performance.now() - maskOnlyStart;
            logPerformance(`[removeToCanvas] Mask-only creation: ${maskOnlyTime.toFixed(2)}ms`);
            emitProgress('complete', 100, 'Complete');
            const totalTime = performance.now() - removeStartTime;
            logPerformance(`[removeToCanvas] Total processing time (mask-only): ${totalTime.toFixed(2)}ms`);
            return result;
        }
        // Create cutout
        const cutoutStart = performance.now();
        emitProgress('postprocessing', 85, 'Creating cutout...');
        let result = naiveCutout(inputCanvas, mask);
        const cutoutTime = performance.now() - cutoutStart;
        logPerformance(`[removeToCanvas] Cutout creation: ${cutoutTime.toFixed(2)}ms`);
        // Apply background color if specified
        if (options.bgcolor) {
            const bgColorStart = performance.now();
            emitProgress('postprocessing', 90, 'Applying background color...');
            result = applyBackgroundColor(result, options.bgcolor);
            const bgColorTime = performance.now() - bgColorStart;
            logPerformance(`[removeToCanvas] Background color application: ${bgColorTime.toFixed(2)}ms`);
        }
        emitProgress('complete', 100, 'Complete');
        const totalTime = performance.now() - removeStartTime;
        logPerformance(`[removeToCanvas] Total processing time: ${totalTime.toFixed(2)}ms`);
        return result;
    }
    catch (error) {
        const totalTime = performance.now() - removeStartTime;
        console.error(`[removeToCanvas] Processing failed (${totalTime.toFixed(2)}ms):`, error);
        // Emit error progress if callback is provided
        if (options.onProgress) {
            options.onProgress({
                step: 'complete',
                progress: 0,
                message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
        }
        throw error;
    }
}
const rawSessions = SESSIONS;
const version = packageJson.version;

export { IsNetGeneralUseSession, RembgConfig, U2NetClothSegSession, clearModelCache, clearModelCacheForModel, clearSessionCache, configureCache, disposeAllSessions, enableGeneralLogging, enableONNXProfiling, enablePerformanceLogging, getAllModelHashes, getAvailableModels, getCacheStats, getExecutionProviders, getModelHash, getWebGPUContextOptions, getWebGPUDevice, getWebGPUInfo, getWebNNContextOptions, getWebNNInfo, image as imageUtils, isGeneralLoggingEnabled, isONNXProfilingEnabled, isPerformanceLoggingEnabled, isWebGPUAvailable, isWebNNAvailable, isWebNNDeviceSupported, logWebGPUInfo, logWebNNInfo, newSession, rawSessions, rembgConfig, remove, removeToCanvas, setModelHash, validateModel, validateModelSize, validateWebGPUConfig, validateWebNNConfig, verifyModelIntegrity, version };
//# sourceMappingURL=index.js.map
