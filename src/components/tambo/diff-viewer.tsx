"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Info, AlertTriangle, XCircle, Lightbulb } from "lucide-react";
import { z } from "zod";

// Schema for Tambo registration
const AnnotationSchema = z.object({
    line: z.number().describe("Line number where the annotation appears"),
    message: z.string().describe("The annotation message explaining the code change"),
    type: z.enum(["info", "warning", "error", "insight"]).describe("Type of annotation: info, warning, error, or insight"),
});

export const diffViewerSchema = z.object({
    fileName: z.string().describe("Name of the file being diffed, e.g., 'src/utils/auth.ts'"),
    beforeCode: z.string().describe("The original code before changes"),
    afterCode: z.string().describe("The modified code after changes"),
    language: z.string().describe("Programming language for syntax highlighting, e.g., 'javascript', 'typescript', 'python'"),
    annotations: z.array(AnnotationSchema).optional().describe("Optional array of annotations for specific lines"),
    commitHash: z.string().optional().describe("Optional short commit hash for reference"),
}).describe("Displays a side-by-side or unified diff view of code changes with syntax highlighting and optional annotations. Use when showing file changes, code differences, or commit diffs.");

interface Annotation {
    line: number;
    message: string;
    type: "info" | "warning" | "error" | "insight";
}

interface DiffViewerProps {
    fileName?: string;
    beforeCode?: string;
    afterCode?: string;
    language?: string;
    annotations?: Annotation[];
    commitHash?: string;
}

export function DiffViewer({
    fileName = "",
    beforeCode = "",
    afterCode = "",
    language = "javascript",
    annotations = [],
    commitHash,
}: DiffViewerProps) {
    const [viewMode, setViewMode] = useState<"split" | "unified">("split");
    const [showAnnotations, setShowAnnotations] = useState(true);

    // Handle undefined data during streaming
    if (!fileName && !beforeCode && !afterCode) {
        return (
            <div className="rounded-xl p-8" style={{ backgroundColor: "#161b22", border: "1px solid #30363d" }}>
                <div className="animate-pulse">
                    <div className="h-8 w-48 bg-gray-700 rounded mb-4" />
                    <div className="h-4 w-64 bg-gray-700 rounded mb-8" />
                    <div className="h-64 bg-gray-700 rounded" />
                </div>
            </div>
        );
    }

    // Simple diff algorithm
    const beforeLines = (beforeCode || "").split("\n");
    const afterLines = (afterCode || "").split("\n");

    // Create unified diff lines
    const diffLines: Array<{
        type: "unchanged" | "removed" | "added";
        lineNumber: number;
        content: string;
    }> = [];

    let beforeIdx = 0;
    let afterIdx = 0;

    while (beforeIdx < beforeLines.length || afterIdx < afterLines.length) {
        const beforeLine = beforeLines[beforeIdx];
        const afterLine = afterLines[afterIdx];

        if (beforeLine === afterLine) {
            diffLines.push({
                type: "unchanged",
                lineNumber: afterIdx + 1,
                content: afterLine || "",
            });
            beforeIdx++;
            afterIdx++;
        } else if (!afterLines.includes(beforeLine) && beforeLine !== undefined) {
            diffLines.push({
                type: "removed",
                lineNumber: beforeIdx + 1,
                content: beforeLine,
            });
            beforeIdx++;
        } else {
            diffLines.push({
                type: "added",
                lineNumber: afterIdx + 1,
                content: afterLine || "",
            });
            afterIdx++;
        }
    }

    const getAnnotationForLine = (lineNumber: number) => {
        return annotations.find((a) => a.line === lineNumber);
    };

    const getAnnotationStyle = (type: Annotation["type"]) => {
        switch (type) {
            case "error":
                return { bg: "#3d1319", border: "#da3633", text: "#f85149" };
            case "warning":
                return { bg: "#3d2c00", border: "#e09e13", text: "#f0c541" };
            case "info":
                return { bg: "#0c2d6b", border: "#58a6ff", text: "#58a6ff" };
            case "insight":
                return { bg: "#271c3a", border: "#a371f7", text: "#d2a8ff" };
        }
    };

    const getAnnotationIcon = (type: Annotation["type"]) => {
        switch (type) {
            case "error":
                return <XCircle className="w-4 h-4" />;
            case "warning":
                return <AlertTriangle className="w-4 h-4" />;
            case "info":
                return <Info className="w-4 h-4" />;
            case "insight":
                return <Lightbulb className="w-4 h-4" />;
        }
    };

    // Simple syntax highlighting
    const highlightSyntax = (code: string, lang: string) => {
        if (lang === "javascript" || lang === "typescript" || lang === "tsx" || lang === "jsx") {
            const keywords = [
                "const", "let", "var", "function", "return", "if", "else", "for", "while",
                "class", "import", "export", "async", "await", "interface", "type"
            ];
            let highlighted = code;
            keywords.forEach((keyword) => {
                const regex = new RegExp(`\\b(${keyword})\\b`, "g");
                highlighted = highlighted.replace(
                    regex,
                    '<span style="color: #ff7b72; font-weight: 600;">$1</span>'
                );
            });

            // Strings
            highlighted = highlighted.replace(
                /(['"`])(.*?)\1/g,
                '<span style="color: #a5d6ff;">$1$2$1</span>'
            );

            // Comments
            highlighted = highlighted.replace(
                /(\/\/.*$)/gm,
                '<span style="color: #7d8590; font-style: italic;">$1</span>'
            );

            return highlighted;
        }
        return code;
    };

    const safeAnnotations = annotations ?? [];

    // Calculate dynamic height based on max lines (24px per line, capped at 720px for ~30 lines)
    const lineHeight = 24;
    const maxLines = Math.max(beforeLines.length, afterLines.length);
    const panelHeight = Math.min(maxLines * lineHeight, 720);

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="rounded-lg p-6" style={{ backgroundColor: "#161b22", border: "1px solid #30363d" }}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#3fb950" }} />
                            <h2 style={{ color: "#e6edf3", fontSize: "1.5rem", fontWeight: "600" }}>
                                Code Changes
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <p style={{ color: "#7d8590", fontSize: "0.875rem", fontFamily: "monospace" }}>
                                {fileName}
                                {commitHash && (
                                    <span
                                        className="ml-2 px-2 py-1 rounded text-xs"
                                        style={{
                                            backgroundColor: "#0d1117",
                                            color: "#7d8590",
                                            fontFamily: "monospace",
                                            border: "1px solid #30363d",
                                        }}
                                    >
                                        {commitHash}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex rounded-lg p-1" style={{ backgroundColor: "#0d1117" }}>
                            <button
                                onClick={() => setViewMode("split")}
                                className="px-4 py-2 rounded text-sm transition-all"
                                style={{
                                    backgroundColor: viewMode === "split" ? "#238636" : "transparent",
                                    color: viewMode === "split" ? "#ffffff" : "#7d8590",
                                    fontWeight: viewMode === "split" ? "600" : "400",
                                }}
                            >
                                Split
                            </button>
                            <button
                                onClick={() => setViewMode("unified")}
                                className="px-4 py-2 rounded text-sm transition-all"
                                style={{
                                    backgroundColor: viewMode === "unified" ? "#238636" : "transparent",
                                    color: viewMode === "unified" ? "#ffffff" : "#7d8590",
                                    fontWeight: viewMode === "unified" ? "600" : "400",
                                }}
                            >
                                Unified
                            </button>
                        </div>

                        {safeAnnotations.length > 0 && (
                            <button
                                onClick={() => setShowAnnotations(!showAnnotations)}
                                className="px-4 py-2 rounded-lg text-sm transition-all"
                                style={{
                                    backgroundColor: showAnnotations ? "#a371f7" : "#0d1117",
                                    color: showAnnotations ? "#0d1117" : "#7d8590",
                                    fontWeight: showAnnotations ? "600" : "400",
                                    border: showAnnotations ? "none" : "1px solid #30363d",
                                }}
                            >
                                {showAnnotations ? "🏷️ Annotations" : "Show Annotations"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#3fb950" }} />
                        <span style={{ color: "#7d8590" }}>
                            {diffLines.filter((l) => l.type === "added").length} additions
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#f85149" }} />
                        <span style={{ color: "#7d8590" }}>
                            {diffLines.filter((l) => l.type === "removed").length} deletions
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#7d8590" }} />
                        <span style={{ color: "#7d8590" }}>
                            {diffLines.filter((l) => l.type === "unchanged").length} unchanged
                        </span>
                    </div>
                </div>
            </div>

            {/* Diff Content */}
            <div
                className="rounded-lg overflow-hidden"
                style={{ backgroundColor: "#0d1117", border: "1px solid #30363d" }}
            >
                {viewMode === "split" ? (
                    /* Split View */
                    <div className="grid grid-cols-2 divide-x" style={{ borderColor: "#21262d" }}>
                        {/* Before */}
                        <div>
                            <div
                                className="px-4 py-2 border-b"
                                style={{ backgroundColor: "#3d1319", borderColor: "#21262d" }}
                            >
                                <span className="text-sm" style={{ color: "#f85149", fontWeight: "600" }}>
                                    Before
                                </span>
                            </div>
                            <div className="overflow-x-auto overflow-y-auto" style={{ fontFamily: "monospace", fontSize: "0.875rem", height: `${panelHeight}px` }}>
                                <div style={{ minWidth: "max-content" }}>
                                    {beforeLines.map((line, idx) => {
                                        const isRemoved = !afterLines.includes(line);
                                        const bgColor = isRemoved ? "#3d1319" : "transparent";
                                        const hoverBg = isRemoved ? "#4d1a1f" : "#161b22";
                                        return (
                                            <div
                                                key={idx}
                                                className="flex transition-colors"
                                                style={{ backgroundColor: bgColor }}
                                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
                                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = bgColor)}
                                            >
                                                <div
                                                    className="w-12 flex-shrink-0 text-right pr-4 py-1 select-none border-r"
                                                    style={{ color: isRemoved ? "#f85149" : "#7d8590", borderColor: "#21262d" }}
                                                >
                                                    {idx + 1}
                                                </div>
                                                <div
                                                    className="flex-1 px-4 py-1 whitespace-pre"
                                                    style={{ color: isRemoved ? "#f85149" : "#e6edf3" }}
                                                >
                                                    <span dangerouslySetInnerHTML={{ __html: highlightSyntax(line, language) }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* After */}
                        <div>
                            <div
                                className="px-4 py-2 border-b"
                                style={{ backgroundColor: "#033a16", borderColor: "#21262d" }}
                            >
                                <span className="text-sm" style={{ color: "#3fb950", fontWeight: "600" }}>
                                    After
                                </span>
                            </div>
                            <div className="overflow-x-auto overflow-y-auto" style={{ fontFamily: "monospace", fontSize: "0.875rem", height: `${panelHeight}px` }}>
                                <div style={{ minWidth: "max-content" }}>
                                    {afterLines.map((line, idx) => {
                                        const annotation = getAnnotationForLine(idx + 1);
                                        const annotationStyle = annotation ? getAnnotationStyle(annotation.type) : null;
                                        const isAdded = !beforeLines.includes(line);
                                        const bgColor = isAdded ? "#033a16" : "transparent";
                                        const hoverBg = isAdded ? "#044a1c" : "#161b22";
                                        return (
                                            <div key={idx}>
                                                <div
                                                    className="flex transition-colors"
                                                    style={{ backgroundColor: bgColor }}
                                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
                                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = bgColor)}
                                                >
                                                    <div
                                                        className="w-12 flex-shrink-0 text-right pr-4 py-1 select-none border-r"
                                                        style={{ color: isAdded ? "#3fb950" : "#7d8590", borderColor: "#21262d" }}
                                                    >
                                                        {idx + 1}
                                                    </div>
                                                    <div
                                                        className="flex-1 px-4 py-1 whitespace-pre"
                                                        style={{ color: isAdded ? "#3fb950" : "#e6edf3" }}
                                                    >
                                                        <span dangerouslySetInnerHTML={{ __html: highlightSyntax(line, language) }} />
                                                    </div>
                                                </div>

                                                {/* Annotation */}
                                                {annotation && showAnnotations && annotationStyle && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        className="ml-12 mr-4 mb-2 p-3 rounded-lg"
                                                        style={{
                                                            backgroundColor: annotationStyle.bg,
                                                            border: `1px solid ${annotationStyle.border}`,
                                                        }}
                                                    >
                                                        <div className="flex items-start gap-2">
                                                            <span style={{ color: annotationStyle.text }}>
                                                                {getAnnotationIcon(annotation.type)}
                                                            </span>
                                                            <div className="flex-1">
                                                                <div
                                                                    className="text-xs uppercase tracking-wide mb-1"
                                                                    style={{ color: annotationStyle.text, fontWeight: "600" }}
                                                                >
                                                                    {annotation.type}
                                                                </div>
                                                                <div className="text-sm" style={{ color: "#e6edf3" }}>
                                                                    {annotation.message}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Unified View */
                    <div className="overflow-x-auto" style={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                        <div style={{ minWidth: "max-content" }}>
                            {diffLines.map((line, idx) => {
                                const annotation = getAnnotationForLine(line.lineNumber);
                                const annotationStyle = annotation ? getAnnotationStyle(annotation.type) : null;
                                const bgColor =
                                    line.type === "added"
                                        ? "#033a16"
                                        : line.type === "removed"
                                            ? "#3d1319"
                                            : "transparent";
                                const textColor =
                                    line.type === "added"
                                        ? "#3fb950"
                                        : line.type === "removed"
                                            ? "#f85149"
                                            : "#e6edf3";
                                const prefix =
                                    line.type === "added" ? "+" : line.type === "removed" ? "-" : " ";

                                return (
                                    <div key={idx}>
                                        <div
                                            className="flex transition-colors"
                                            style={{ backgroundColor: bgColor }}
                                            onMouseEnter={(e) => {
                                                if (line.type === "unchanged") {
                                                    e.currentTarget.style.backgroundColor = "#161b22";
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (line.type === "unchanged") {
                                                    e.currentTarget.style.backgroundColor = "transparent";
                                                }
                                            }}
                                        >
                                            <div
                                                className="w-12 flex-shrink-0 text-right pr-4 py-1 select-none border-r"
                                                style={{ color: "#7d8590", borderColor: "#21262d" }}
                                            >
                                                {line.lineNumber}
                                            </div>
                                            <div
                                                className="w-8 flex-shrink-0 text-center py-1"
                                                style={{ color: textColor, fontWeight: "600" }}
                                            >
                                                {prefix}
                                            </div>
                                            <div
                                                className="flex-1 px-4 py-1 whitespace-pre"
                                                style={{ color: textColor }}
                                            >
                                                <span dangerouslySetInnerHTML={{ __html: highlightSyntax(line.content, language) }} />
                                            </div>
                                        </div>

                                        {/* Annotation */}
                                        {annotation && showAnnotations && annotationStyle && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                className="ml-20 mr-4 mb-2 p-3 rounded-lg"
                                                style={{
                                                    backgroundColor: annotationStyle.bg,
                                                    border: `1px solid ${annotationStyle.border}`,
                                                }}
                                            >
                                                <div className="flex items-start gap-2">
                                                    <span style={{ color: annotationStyle.text }}>
                                                        {getAnnotationIcon(annotation.type)}
                                                    </span>
                                                    <div className="flex-1">
                                                        <div
                                                            className="text-xs uppercase tracking-wide mb-1"
                                                            style={{ color: annotationStyle.text, fontWeight: "600" }}
                                                        >
                                                            {annotation.type}
                                                        </div>
                                                        <div className="text-sm" style={{ color: "#e6edf3" }}>
                                                            {annotation.message}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Annotations Summary */}
            {safeAnnotations.length > 0 && (
                <div className="p-6 rounded-lg" style={{ backgroundColor: "#161b22", border: "1px solid #30363d" }}>
                    <h3 className="mb-4" style={{ color: "#e6edf3", fontSize: "1.125rem", fontWeight: "600" }}>
                        Annotations Summary ({safeAnnotations.length})
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {safeAnnotations.map((annotation, idx) => {
                            const annotationStyle = getAnnotationStyle(annotation.type);
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="p-3 rounded-lg"
                                    style={{
                                        backgroundColor: annotationStyle.bg,
                                        border: `1px solid ${annotationStyle.border}`,
                                    }}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span style={{ color: annotationStyle.text }}>
                                            {getAnnotationIcon(annotation.type)}
                                        </span>
                                        <span className="text-xs" style={{ color: "#7d8590", fontFamily: "monospace" }}>
                                            Line {annotation.line}
                                        </span>
                                    </div>
                                    <div className="text-sm" style={{ color: "#e6edf3" }}>
                                        {annotation.message}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
