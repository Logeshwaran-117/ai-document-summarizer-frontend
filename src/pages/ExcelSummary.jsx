import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import api from "../api";
import toast from "react-hot-toast";
import { useNotifications } from "../context/NotificationContext";
import TableFieldsModal from "../components/TableFieldsModal";
import { exportTableToExcel, exportTableToPDF, exportTableToDocx } from "../utils/tableExport";
import TableChat from "../components/TableChat";

// Required for react-pdf to load the PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const ALLOWED_TYPES = [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

function isImageFile(file) {
  return file && file.type.startsWith("image/");
}

function isPDFFile(file) {
  return file && file.type === "application/pdf";
}

function ExcelSummary() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [showFieldsModal, setShowFieldsModal] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState(null);

  // PDF preview state
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // AI field suggestions
  const [suggestedFields, setSuggestedFields] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [tablePage, setTablePage] = useState(1);
  const TABLE_PAGE_SIZE = 10;

  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFileSelect(file) {
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only PDF, DOCX, TXT, JPG, PNG, and WEBP files are allowed");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Maximum file size is 10 MB");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setResult(null);
    setSuggestedFields([]);
    setCurrentPage(1);
    setNumPages(null);

    // Create object URL for preview (works for both images and PDFs)
    setPreviewUrl(URL.createObjectURL(file));
  }

  function clearFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setResult(null);
    setPreviewUrl(null);
    setSuggestedFields([]);
    setCurrentPage(1);
    setNumPages(null);
  }

  // When user clicks "Generate Table", first get AI field suggestions
  async function handleGenerateClick() {
    if (!selectedFile) return;

    setShowFieldsModal(true);
    setLoadingSuggestions(true);
    setSuggestedFields([]);

    try {
      const formData = new FormData();
      formData.append("document", selectedFile);
      const res = await api.post("/api/suggest-fields", formData);
      setSuggestedFields(res.data.fields || []);
    } catch (err) {
      console.warn("Field suggestion failed:", err);
      const message = err.response?.data?.message;
      if (message) {
        toast.error(`Couldn't auto-suggest fields: ${message}`);
      }
      // Modal still works with manual entry even if this failed.
    } finally {
      setLoadingSuggestions(false);
    }
  }

  async function handleExtract(fields) {
    if (!selectedFile) return;
    setShowFieldsModal(false);
    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append("document", selectedFile);
      formData.append("fields", JSON.stringify(fields));

      const response = await api.post("/api/extract-table", formData);
      setResult(response.data);
      setTablePage(1);
      toast.success("Table extracted successfully!");
      addNotification({
        title: "Table ready",
        message: `${selectedFile.name} was converted into a table.`,
        type: "success",
      });
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.message || "Error extracting table";
      toast.error(message);
      addNotification({ title: "Extraction failed", message, type: "error" });
      // Clear any previous result so stale table + download buttons don't persist
      setResult(null);
    } finally {
      setExtracting(false);
    }
  }

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
  }, []);

  const baseName = (result?.filename || selectedFile?.name || "table").replace(/\.[^/.]+$/, "");

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 transition-colors duration-300">
      <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Excel Summary</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Upload any document or image — even handwritten notes — and turn it into a structured table you define.
      </p>

      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-xl transition-all duration-300
          ${dragging ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-gray-300 dark:border-gray-700"}
          ${selectedFile ? "p-4" : "p-12 flex flex-col items-center"}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFileSelect(e.dataTransfer.files[0]);
        }}
      >
        {!selectedFile ? (
          <>
            <div className="text-6xl">📊</div>
            <h3 className="text-2xl font-semibold mt-4 text-gray-900 dark:text-white text-center">
              Drag & Drop your file here
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">PDF, DOCX, TXT, JPG, PNG, WEBP supported</p>
            <label className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-700 transition">
              Browse Files
              <input
                type="file"
                className="hidden"
                accept=".pdf,.txt,.docx,.jpg,.jpeg,.png,.webp,.gif"
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />
            </label>
          </>
        ) : (
          <div className="space-y-3">
            {/* File info bar */}
            <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <span>{isImageFile(selectedFile) ? "🖼️" : "📄"}</span>
                <span className="font-semibold text-green-700 dark:text-green-400 truncate max-w-xs">
                  {selectedFile.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
                <label className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                  Change
                  <input type="file" className="hidden" accept=".pdf,.txt,.docx,.jpg,.jpeg,.png,.webp,.gif"
                    onChange={(e) => handleFileSelect(e.target.files[0])} />
                </label>
              </div>
            </div>

            {/* PDF Preview */}
            {isPDFFile(selectedFile) && previewUrl && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Document Preview
                  </p>
                  {numPages && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                        className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-40 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                      >
                        ‹
                      </button>
                      <span>Page {currentPage} of {numPages}</span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                        disabled={currentPage >= numPages}
                        className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-40 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                      >
                        ›
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex justify-center overflow-hidden rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <Document
                    file={previewUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                      <div className="flex items-center justify-center h-48 text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    }
                    error={
                      <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
                        Could not preview this PDF
                      </div>
                    }
                  >
                    <Page
                      pageNumber={currentPage}
                      width={Math.min(560, window.innerWidth - 120)}
                      renderTextLayer={true}
                      renderAnnotationLayer={false}
                    />
                  </Document>
                </div>
              </div>
            )}

            {/* Image Preview */}
            {isImageFile(selectedFile) && previewUrl && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Image Preview
                </p>
                <div className="flex justify-center rounded-lg overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-72 object-contain"
                  />
                </div>
              </div>
            )}

            {/* TXT/DOCX — no preview, just info */}
            {!isPDFFile(selectedFile) && !isImageFile(selectedFile) && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center text-gray-400 dark:text-gray-500 text-sm">
                📝 Text document — preview not available. Click Generate Table to proceed.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-6">
        <button onClick={clearFile} className="bg-red-600 text-white px-5 py-3 rounded-lg hover:bg-red-700 transition">
          ❌
        </button>
        <button
          onClick={handleGenerateClick}
          disabled={!selectedFile || extracting}
          className={`px-6 py-3 rounded-lg text-white transition
            ${extracting
              ? "bg-yellow-500 cursor-not-allowed"
              : selectedFile
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 dark:bg-gray-700 cursor-not-allowed"
            }`}
        >
          {extracting ? "Extracting Table..." : "Generate Table"}
        </button>
      </div>

      {extracting && (
        <div className="mt-6 bg-blue-50 dark:bg-blue-950/30 p-5 rounded-lg">
          <h2 className="font-bold text-blue-700 dark:text-blue-400">Reading document & building your table...</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isImageFile(selectedFile) ? "Gemini Vision is reading your image, including handwriting." : "Please wait while AI extracts the fields you chose."}
          </p>
          <div className="w-full bg-gray-300 dark:bg-gray-700 rounded mt-4">
            <div className="bg-blue-600 h-3 rounded animate-pulse w-full"></div>
          </div>
        </div>
      )}

      {/* Result Table */}
      {result && (() => {
        const totalPages = Math.ceil(result.rows.length / TABLE_PAGE_SIZE);
        const pageRows = result.rows.slice(
          (tablePage - 1) * TABLE_PAGE_SIZE,
          tablePage * TABLE_PAGE_SIZE
        );
        return (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Extracted Table</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {result.rows.length} row{result.rows.length !== 1 ? "s" : ""} · {result.fields.length} field{result.fields.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => exportTableToExcel(result.fields, result.rows, baseName)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition font-medium"
                >📗 Excel</button>
                <button
                  onClick={() => exportTableToPDF(result.fields, result.rows, baseName)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition font-medium"
                >📕 PDF</button>
                <button
                  onClick={() => exportTableToDocx(result.fields, result.rows, baseName)}
                  className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800 transition font-medium"
                >📘 Word</button>
                <button
                  onClick={() => navigate("/history")}
                  className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 dark:hover:bg-gray-600 transition font-medium"
                >📚 View in History</button>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap w-10">#</th>
                      {result.fields.map((f) => (
                        <th key={f} className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                          {f}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {pageRows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-xs tabular-nums">
                          {(tablePage - 1) * TABLE_PAGE_SIZE + i + 1}
                        </td>
                        {result.fields.map((f) => (
                          <td key={f} className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {row[f]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination bar */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Showing {(tablePage - 1) * TABLE_PAGE_SIZE + 1}–{Math.min(tablePage * TABLE_PAGE_SIZE, result.rows.length)} of {result.rows.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setTablePage(1)}
                      disabled={tablePage === 1}
                      className="px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      title="First page"
                    >«</button>
                    <button
                      onClick={() => setTablePage(p => Math.max(1, p - 1))}
                      disabled={tablePage === 1}
                      className="px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >‹ Prev</button>

                    {/* Page number pills */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - tablePage) <= 1)
                      .reduce((acc, p, idx, arr) => {
                        if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((item, idx) =>
                        item === "..." ? (
                          <span key={`ellipsis-${idx}`} className="px-1 text-xs text-gray-400 dark:text-gray-500">…</span>
                        ) : (
                          <button
                            key={item}
                            onClick={() => setTablePage(item)}
                            className={`min-w-[28px] px-2 py-1 rounded text-xs font-medium transition
                              ${tablePage === item
                                ? "bg-blue-600 text-white"
                                : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                              }`}
                          >{item}</button>
                        )
                      )
                    }

                    <button
                      onClick={() => setTablePage(p => Math.min(totalPages, p + 1))}
                      disabled={tablePage === totalPages}
                      className="px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >Next ›</button>
                    <button
                      onClick={() => setTablePage(totalPages)}
                      disabled={tablePage === totalPages}
                      className="px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      title="Last page"
                    >»</button>
                  </div>
                </div>
              )}
            </div>

            {/* QA Chat about this table */}
            <TableChat tableId={result._id} />
          </div>
        );
      })()}

      <TableFieldsModal
        open={showFieldsModal}
        onCancel={() => setShowFieldsModal(false)}
        onConfirm={handleExtract}
        loading={extracting}
        suggestedFields={suggestedFields}
        loadingSuggestions={loadingSuggestions}
      />
    </section>
  );
}

export default ExcelSummary;