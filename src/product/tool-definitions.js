import { retiredToolIds } from './retired-tool-ids.js';
import { converterDefinitions } from './definitions/converters.js';
import { dateTimeDefinitions } from './definitions/date-time.js';
import { engineeringDefinitions } from './definitions/engineering.js';
import { securityNetworkDefinitions } from './definitions/security-network.js';
import { securityEncodingToolDefinitions } from './definitions/security-encoding-extra-tools.js';
import { popularSecurityToolDefinitions } from './definitions/popular-security-tools.js';
import { fileSignatureToolDefinitions } from './definitions/file-signature-tool.js';
import { seoDefinitions } from './definitions/seo.js';
import { colorCssDefinitions } from './definitions/color-css.js';
import { homeLifestyleDefinitions } from './definitions/home-lifestyle.js';
import { advancedConverterDefinitions } from './definitions/advanced-converters.js';
import { islamicDefinitions } from './definitions/islamic.js';
import { textProductivityDefinitions } from './definitions/text-productivity.js';
import { dataDeveloperDefinitions } from './definitions/data-developer.js';
import { jsonToolsExtraDefinitions } from './definitions/json-tools-extra.js';
import { cssGeneratorToolDefinitions } from './definitions/css-generator-tools.js';
import { xmlAndIdToolDefinitions } from './definitions/xml-and-id-tools.js';
import { devToolsBatch3Definitions } from './definitions/dev-tools-batch3.js';
import { dummyDataToolDefinitions } from './definitions/dummy-data-tools.js';
import { devToolsBatch5Definitions } from './definitions/dev-tools-batch5.js';
import { devToolsBatch6Definitions } from './definitions/dev-tools-batch6.js';
import { advancedMathDefinitions } from './definitions/advanced-math.js';
import { advancedFinanceDefinitions } from './definitions/advanced-finance.js';
import { advancedHealthDefinitions } from './definitions/advanced-health.js';
import { demandCalculatorDefinitions } from './definitions/high-demand-calculators.js';
import { studentStudyDefinitions } from './definitions/student-study.js';
import { textEncodingDefinitions } from './definitions/text-encoding.js';
import { advancedDateTimeDefinitions } from './definitions/advanced-date-time.js';
import { physicsEngineeringDefinitions } from './definitions/physics-engineering.js';
import { advancedGeometryDefinitions } from './definitions/advanced-geometry.js';
import { webDeveloperDefinitions } from './definitions/web-developer.js';
import { frontendDeveloperDefinitions } from './definitions/frontend-developer.js';
import { statisticsDefinitions } from './definitions/statistics.js';
import { probabilityStatisticsDefinitions } from './definitions/probability-statistics.js';
import { algebraSequenceDefinitions } from './definitions/algebra-sequences.js';
import { trigonometryDefinitions } from './definitions/trigonometry.js';
import { coordinateGeometryDefinitions } from './definitions/coordinate-geometry.js';
import { calculusDefinitions } from './definitions/calculus.js';
import { ecommerceBusinessDefinitions } from './definitions/ecommerce-business.js';
import { marketingMetricDefinitions } from './definitions/marketing-metrics.js';
import { creatorVideoDefinitions } from './definitions/creator-video.js';
import { audioPodcastDefinitions } from './definitions/audio-podcast.js';
import { audioFileToolDefinitions } from './definitions/audio-file-tools.js';
import { mediaRecorderToolDefinitions } from './definitions/media-recorder-tools.js';
import { audioAnalysisToolDefinitions } from './definitions/audio-analysis-tools.js';
import { audioFilterToolDefinitions } from './definitions/audio-filter-tools.js';
import { popularAudioToolDefinitions } from './definitions/popular-audio-tools.js';
import { popularAudioConverterDefinitions } from './definitions/popular-audio-converters.js';
import { projectManagementDefinitions } from './definitions/project-management.js';
import { imageFileToolDefinitions } from './definitions/image-file-tools.js';
import { targetSizeImageToolDefinitions } from './definitions/target-size-image-tools.js';
import { popularImageConverterDefinitions } from './definitions/popular-image-converters.js';
import { avifToolDefinitions } from './definitions/avif-converter-tool.js';
import { legacyImageConverterDefinitions } from './definitions/legacy-image-converters.js';
import { imageExtraToolDefinitions } from './definitions/image-extra-tools.js';
import { imageExifToolDefinitions } from './definitions/image-exif-tools.js';
import { imageAnalysisExtraToolDefinitions } from './definitions/image-analysis-extra-tools.js';
import { imageLayoutToolDefinitions } from './definitions/image-layout-tools.js';
import { imageDetectorToolDefinitions } from './definitions/image-detector-tools.js';
import { imageSmartToolDefinitions } from './definitions/image-smart-tools.js';
import { imageEditingToolDefinitions } from './definitions/image-editing-tools.js';
import { imageEnhancementToolDefinitions } from './definitions/image-enhancement-tools.js';
import { imageFilterToolDefinitions } from './definitions/image-filter-tools.js';
import { imageBatchToolDefinitions } from './definitions/image-batch-tools.js';
import { imageWorkflowToolDefinitions } from './definitions/image-workflow-tools.js';
import { imageSvgTracerToolDefinitions } from './definitions/image-svg-tracer-tool.js';
import { pdfFileToolDefinitions } from './definitions/pdf-file-tools.js';
import { pdfWorkflowToolDefinitions } from './definitions/pdf-workflow-tools.js';
import { pdfImageToolDefinitions } from './definitions/pdf-image-tools.js';
import { popularPdfImageConverterDefinitions } from './definitions/popular-pdf-image-converters.js';
import { pdfDocumentToolDefinitions } from './definitions/pdf-document-tools.js';
import { pdfProtectToolDefinitions } from './definitions/pdf-protect-tool.js';
import { pdfSignToolDefinitions } from './definitions/pdf-sign-tool.js';
import { pdfImageExtractorToolDefinitions } from './definitions/pdf-image-extractor-tool.js';
import { textToPdfToolDefinitions } from './definitions/text-to-pdf-tool.js';
import { pdfGrayscaleToolDefinitions } from './definitions/pdf-grayscale-tool.js';
import { pdfToPowerPointToolDefinitions } from './definitions/pdf-to-powerpoint-tool.js';
import { pdfToExcelToolDefinitions } from './definitions/pdf-to-excel-tool.js';
import { excelToPdfToolDefinitions } from './definitions/excel-to-pdf-tool.js';
import { powerpointToPdfToolDefinitions } from './definitions/powerpoint-to-pdf-tool.js';
import { powerpointCompressorToolDefinitions } from './definitions/powerpoint-compressor-tool.js';
import { wordCompressorToolDefinitions } from './definitions/word-compressor-tool.js';
import { officeUtilityToolDefinitions } from './definitions/office-utility-tools.js';
import { dataDocumentConverterDefinitions } from './definitions/data-document-converters.js';
import { ebookDocumentToolDefinitions } from './definitions/ebook-document-tools.js';
import { gifProcessingToolDefinitions } from './definitions/gif-processing-tools.js';
import { subtitleBurnToolDefinitions } from './definitions/subtitle-burn-tool.js';
import { memeToolDefinitions } from './definitions/meme-generator-tool.js';
import { pdfContentToolDefinitions } from './definitions/pdf-content-tools.js';
import { pdfEditorToolDefinitions } from './definitions/pdf-editor-tools.js';
import { websiteBuilderToolDefinitions } from './definitions/website-builder-tool.js';
import { photoEditorToolDefinitions } from './definitions/photo-editor-tool.js';
import { micTestToolDefinitions } from './definitions/mic-test-tool.js';
import { backgroundRemoverToolDefinitions } from './definitions/background-remover-tool.js';
import { textSummarizerToolDefinitions } from './definitions/text-summarizer-tool.js';
import { replaceBackgroundToolDefinitions } from './definitions/replace-background-tool.js';
import { currencyConverterToolDefinitions } from './definitions/currency-converter-tool.js';
import { grammarCheckerToolDefinitions } from './definitions/grammar-checker-tool.js';
import { addBackgroundToolDefinitions } from './definitions/add-background-tools.js';
import { ocrToolDefinitions } from './definitions/ocr-tools.js';
import { videoFileToolDefinitions } from './definitions/video-file-tools.js';
import { videoProcessingToolDefinitions } from './definitions/video-processing-tools.js';
import { popularVideoConverterDefinitions } from './definitions/popular-video-converters.js';
import { videoExtraToolDefinitions } from './definitions/video-extra-tools.js';
import { listDataToolDefinitions } from './definitions/list-data-tools.js';
import { dataFormatToolDefinitions } from './definitions/data-format-tools.js';
import { fileUtilityToolDefinitions } from './definitions/file-utility-tools.js';
import { archiveFileToolDefinitions } from './definitions/archive-file-tools.js';
import { webContentToolDefinitions } from './definitions/web-content-tools.js';
import { webTransformToolDefinitions } from './definitions/web-transform-tools.js';
import { webUtilityDefinitions } from './definitions/web-utility-tools.js';
import { documentMediaDefinitions } from './definitions/document-media-tools.js';
import { webUtility2Definitions } from './definitions/web-utility-tools-2.js';
import { roadmapBatch1Definitions } from './definitions/roadmap-batch-1.js';
import { roadmapBatch2Definitions } from './definitions/roadmap-batch-2.js';
import { jsonTreeViewerDefinitions } from './definitions/json-tree-viewer.js';
import { wordToPdfDefinitions } from './definitions/word-to-pdf-tools.js';
import { financeDefinitions } from './definitions/finance.js';
import { healthDefinitions } from './definitions/health.js';
import { mathDefinitions } from './definitions/math.js';
import { textDeveloperDefinitions } from './definitions/text-developer.js';
import { textExtraToolDefinitions } from './definitions/text-extra-tools.js';
import { basicCalculatorToolDefinitions } from './definitions/basic-calculators.js';

const allToolDefinitions = Object.freeze({
    ...basicCalculatorToolDefinitions,
    ...converterDefinitions,
    ...textDeveloperDefinitions,
    ...textExtraToolDefinitions,
    ...financeDefinitions,
    ...healthDefinitions,
    ...mathDefinitions,
    ...dateTimeDefinitions,
    ...engineeringDefinitions,
    ...securityNetworkDefinitions,
    ...securityEncodingToolDefinitions,
    ...popularSecurityToolDefinitions,
    ...fileSignatureToolDefinitions,
    ...seoDefinitions,
    ...colorCssDefinitions,
    ...homeLifestyleDefinitions,
    ...advancedConverterDefinitions,
    ...islamicDefinitions,
    ...textProductivityDefinitions,
    ...dataDeveloperDefinitions,
    ...jsonToolsExtraDefinitions,
    ...cssGeneratorToolDefinitions,
    ...xmlAndIdToolDefinitions,
    ...devToolsBatch3Definitions,
    ...dummyDataToolDefinitions,
    ...devToolsBatch5Definitions,
    ...devToolsBatch6Definitions,
    ...advancedMathDefinitions,
    ...advancedFinanceDefinitions,
    ...advancedHealthDefinitions,
    ...demandCalculatorDefinitions,
    ...studentStudyDefinitions,
    ...textEncodingDefinitions,
    ...advancedDateTimeDefinitions,
    ...physicsEngineeringDefinitions,
    ...advancedGeometryDefinitions,
    ...webDeveloperDefinitions,
    ...frontendDeveloperDefinitions,
    ...statisticsDefinitions,
    ...probabilityStatisticsDefinitions,
    ...algebraSequenceDefinitions,
    ...trigonometryDefinitions,
    ...coordinateGeometryDefinitions,
    ...calculusDefinitions,
    ...ecommerceBusinessDefinitions,
    ...marketingMetricDefinitions,
    ...creatorVideoDefinitions,
    ...audioPodcastDefinitions,
    ...audioFileToolDefinitions,
    ...mediaRecorderToolDefinitions,
    ...audioAnalysisToolDefinitions,
    ...audioFilterToolDefinitions,
    ...popularAudioToolDefinitions,
    ...popularAudioConverterDefinitions,
    ...projectManagementDefinitions,
    ...imageFileToolDefinitions,
    ...targetSizeImageToolDefinitions,
    ...popularImageConverterDefinitions,
    ...avifToolDefinitions,
    ...legacyImageConverterDefinitions,
    ...imageExtraToolDefinitions,
    ...imageExifToolDefinitions,
    ...imageAnalysisExtraToolDefinitions,
    ...imageLayoutToolDefinitions,
    ...imageDetectorToolDefinitions,
    ...imageSmartToolDefinitions,
    ...imageEditingToolDefinitions,
    ...imageEnhancementToolDefinitions,
    ...imageFilterToolDefinitions,
    ...imageBatchToolDefinitions,
    ...imageWorkflowToolDefinitions,
    ...imageSvgTracerToolDefinitions,
    ...pdfFileToolDefinitions,
    ...pdfWorkflowToolDefinitions,
    ...pdfImageToolDefinitions,
    ...popularPdfImageConverterDefinitions,
    ...pdfDocumentToolDefinitions,
    ...pdfProtectToolDefinitions,
    ...pdfSignToolDefinitions,
    ...pdfImageExtractorToolDefinitions,
    ...textToPdfToolDefinitions,
    ...pdfGrayscaleToolDefinitions,
    ...pdfToPowerPointToolDefinitions,
    ...pdfToExcelToolDefinitions,
    ...excelToPdfToolDefinitions,
    ...powerpointToPdfToolDefinitions,
    ...powerpointCompressorToolDefinitions,
    ...wordCompressorToolDefinitions,
    ...officeUtilityToolDefinitions,
    ...dataDocumentConverterDefinitions,
    ...ebookDocumentToolDefinitions,
    ...gifProcessingToolDefinitions,
    ...subtitleBurnToolDefinitions,
    ...memeToolDefinitions,
    ...pdfContentToolDefinitions,
    ...pdfEditorToolDefinitions,
    ...websiteBuilderToolDefinitions,
    ...photoEditorToolDefinitions,
    ...micTestToolDefinitions,
    ...backgroundRemoverToolDefinitions,
    ...addBackgroundToolDefinitions,
    ...ocrToolDefinitions,
    ...videoFileToolDefinitions,
    ...videoProcessingToolDefinitions,
    ...popularVideoConverterDefinitions,
    ...videoExtraToolDefinitions,
    ...listDataToolDefinitions,
    ...dataFormatToolDefinitions,
    ...fileUtilityToolDefinitions,
    ...archiveFileToolDefinitions,
    ...webContentToolDefinitions,
    ...webTransformToolDefinitions,
    ...webUtilityDefinitions,
    ...documentMediaDefinitions,
    ...webUtility2Definitions,
    ...roadmapBatch1Definitions,
    ...roadmapBatch2Definitions,
    ...jsonTreeViewerDefinitions,
    ...wordToPdfDefinitions,
    ...textSummarizerToolDefinitions,
    ...replaceBackgroundToolDefinitions,
    ...currencyConverterToolDefinitions,
    ...grammarCheckerToolDefinitions,
});

const retiredToolIdSet = new Set(retiredToolIds);
const toolDefinitions = Object.freeze(Object.fromEntries(
    Object.entries(allToolDefinitions).filter(([id]) => !retiredToolIdSet.has(id)),
));

function getToolDefinition(id) {
    return toolDefinitions[id] ?? null;
}

function listToolDefinitions() {
    return Object.freeze(Object.values(toolDefinitions));
}

export {
    getToolDefinition,
    listToolDefinitions,
    toolDefinitions,
};

// END OF FILE
