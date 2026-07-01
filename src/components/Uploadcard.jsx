import api from "../api";
import { useState } from "react";
import { jsPDF } from "jspdf";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import toast from "react-hot-toast";
import { useNotifications } from "../context/NotificationContext";
import DocumentChat from "./DocumentChat";

function Uploadcard() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [copied, setCopied] = useState(false);
  const [documentId, setDocumentId] = useState(null);
  const { addNotification } = useNotifications();

  async function handleSummarize() {
    if (!selectedFile) return;

    const allowed = [
      "application/pdf",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowed.includes(selectedFile.type)) {
      toast.error("Only PDF, DOCX and TXT files are allowed");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("Maximum file size is 10 MB");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("document", selectedFile);

      const response = await api.post("/api/summarize", formData);
      const data = response.data;

      setSummary(data.summary);
      setStats(data.stats);
      setDocumentId(data._id);
      toast.success("Summary generated successfully!");
      addNotification({
        title: "Summary ready",
        message: `${selectedFile.name} was summarized successfully.`,
        type: "success",
      });
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.message || "Error summarizing document";
      toast.error(message);
      addNotification({
        title: "Summarization failed",
        message: `${selectedFile?.name || "Document"}: ${message}`,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  }

  function downloadTXT() {
    try {
      const blob = new Blob([summary], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Summary.txt";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded as TXT");
      addNotification({
        title: "Download complete",
        message: "Summary.txt was downloaded.",
        type: "info",
      });
    } catch (error) {
      toast.error("Failed to download");
    }
  }

  function downloadPDF() {
    try {
      const pdf = new jsPDF();
      pdf.setFontSize(18);
      pdf.text("AI Document Summary", 10, 15);
      pdf.setFontSize(11);
      const lines = pdf.splitTextToSize(summary, 180);
      pdf.text(lines, 10, 30);
      pdf.save("Summary.pdf");
      toast.success("Downloaded as PDF");
      addNotification({
        title: "Download complete",
        message: "Summary.pdf was downloaded.",
        type: "info",
      });
    } catch (error) {
      toast.error("Failed to download PDF");
    }
  }

  function clearFile() {
    setSelectedFile(null);
    setSummary("");
    setStats(null);
    setDocumentId(null);
  }

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 transition-colors duration-300">

      <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        Upload Document
      </h2>

      <div
        className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center transition-all duration-300
        ${
          dragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
            : "border-gray-300 dark:border-gray-700"
        }`}

        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}

        onDragLeave={() => {
          setDragging(false);
        }}

        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) {
            setSelectedFile(file);
            setSummary("");
            setStats(null);
            setDocumentId(null);
          }
        }}
      >

        <div className="text-6xl">
          📄
        </div>

        <h3 className="text-2xl font-semibold mt-4 text-gray-900 dark:text-white">
          Drag & Drop your file here
        </h3>

        <p className="text-gray-500 dark:text-gray-400 mt-2">
          PDF, DOCX and TXT supported
        </p>

        <label className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-700 transition">

          Browse Files

          <input
            type="file"
            className="hidden"

            onChange={(e) => {

              const file = e.target.files[0];

              setSelectedFile(file);

              setSummary("");

              setStats(null);

              setDocumentId(null);

            }}

          />

        </label>

        {selectedFile && (

          <div className="mt-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-4 w-full flex justify-between">

            <div>

              <p className="font-semibold text-green-700 dark:text-green-400">

                📄 {selectedFile.name}

              </p>

            </div>

            <div className="text-gray-700 dark:text-gray-300">

              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB

            </div>

          </div>

        )}

      </div>

      <div className="flex gap-4 mt-6">

        <button

          onClick={clearFile}

          className="bg-red-600 text-white px-5 py-3 rounded-lg hover:bg-red-700 transition"

        >

          ❌

        </button>

        <button

          onClick={handleSummarize}

          disabled={!selectedFile || loading}

          className={`px-6 py-3 rounded-lg text-white transition
          ${
            loading
              ? "bg-yellow-500 cursor-not-allowed"
              : selectedFile
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-400 dark:bg-gray-700 cursor-not-allowed"
          }`}

        >

          {loading
            ? "Generating Summary..."
            : "Summarize Document"}

        </button>

      </div>

      {loading && (

        <div className="mt-6 bg-blue-50 dark:bg-blue-950/30 p-5 rounded-lg">

          <h2 className="font-bold text-blue-700 dark:text-blue-400">

            Generating AI Summary...

          </h2>

          <p className="text-sm text-gray-600 dark:text-gray-400">

            Please wait while AI analyzes your document.

          </p>

          <div className="w-full bg-gray-300 dark:bg-gray-700 rounded mt-4">

            <div className="bg-blue-600 h-3 rounded animate-pulse w-full"></div>

          </div>

        </div>

      )}

      {summary && (

        <div className="mt-8 bg-white dark:bg-gray-900 shadow rounded-xl p-6 border border-transparent dark:border-gray-800">

          <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">

            AI Summary

          </h2>

          <ReactMarkdown remarkPlugins={[remarkGfm]}

            components={{

              h1: ({ children }) => (

                <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-4">

                  {children}

                </h1>

              ),

              h2: ({ children }) => (

                <h2 className="text-2xl font-semibold mt-5 mb-3 text-gray-900 dark:text-white">

                  {children}

                </h2>

              ),

              p: ({ children }) => (

                <p className="leading-7 mb-3 text-gray-700 dark:text-gray-300">

                  {children}

                </p>

              ),

              ul: ({ children }) => (

                <ul className="list-disc ml-6 mb-3 text-gray-700 dark:text-gray-300">

                  {children}

                </ul>

              ),

              li: ({ children }) => (

                <li className="mb-2">

                  {children}

                </li>

              ),

              strong: ({ children }) => (

                <strong className="font-bold text-gray-900 dark:text-white">

                  {children}

                </strong>

              ),

            }}

          >

            {summary}

          </ReactMarkdown>

          {stats && (

            <div className="mt-8">

              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">

                Document Statistics

              </h2>

              <div className="grid grid-cols-3 gap-5">

                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-5 shadow">

                  <h3 className="text-gray-700 dark:text-gray-300">📝 Words</h3>

                  <p className="text-3xl font-bold text-gray-900 dark:text-white">

                    {stats.words}

                  </p>

                </div>

                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-5 shadow">

                  <h3 className="text-gray-700 dark:text-gray-300">🔤 Characters</h3>

                  <p className="text-3xl font-bold text-gray-900 dark:text-white">

                    {stats.characters}

                  </p>

                </div>

                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-5 shadow">

                  <h3 className="text-gray-700 dark:text-gray-300">⏱ Reading Time</h3>

                  <p className="text-3xl font-bold text-gray-900 dark:text-white">

                    {stats.readingTime} min

                  </p>

                </div>

              </div>

            </div>

          )}

          <div className="flex gap-4 mt-8 flex-wrap">

            <button

              onClick={copySummary}

              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"

            >

              {copied ? "✅ Copied!" : "📋 Copy"}

            </button>

            <button

              onClick={downloadTXT}

              className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition"

            >

              📄 Download TXT

            </button>

            <button

              onClick={downloadPDF}

              className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition"

            >

              📑 Download PDF

            </button>

          </div>

          <DocumentChat documentId={documentId} />

        </div>

      )}

    </section>
  );
}

export default Uploadcard;
