"use client";

import { useRef, useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Code,
  RemoveFormatting,
  Eye,
  Edit3,
  Code2,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Write detailed description, features, what's included in this plugin...",
  minHeight = "240px",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"visual" | "html" | "preview">("visual");
  const [htmlContent, setHtmlContent] = useState(value || "");

  // Sync internal state when external value changes
  useEffect(() => {
    if (value !== htmlContent) {
      setHtmlContent(value || "");
      if (editorRef.current && editorRef.current.innerHTML !== (value || "")) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value]);

  function exec(command: string, val: string | undefined = undefined) {
    if (activeTab !== "visual") return;
    document.execCommand(command, false, val);
    handleEditorInput();
  }

  function handleEditorInput() {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setHtmlContent(html);
      onChange(html);
    }
  }

  function handleHtmlChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const html = e.target.value;
    setHtmlContent(html);
    onChange(html);
    if (editorRef.current) {
      editorRef.current.innerHTML = html;
    }
  }

  function insertLink() {
    const url = prompt("Enter URL (e.g. https://example.com):");
    if (url) {
      exec("createLink", url);
    }
  }

  function insertTemplate() {
    const template = `
<h3>What's Included:</h3>
<ul>
  <li>Complete plugin package &amp; presets</li>
  <li>Step-by-step installation guide &amp; tutorial</li>
  <li>Customizable parameters &amp; shortcut controls</li>
  <li>High-resolution assets &amp; project templates</li>
</ul>
<h3>Compatibility &amp; Requirements:</h3>
<ul>
  <li>Tested with latest editor versions</li>
  <li>Mac &amp; Windows compatible</li>
  <li>No third-party dependencies required</li>
</ul>
<p>Easy drag-and-drop installation. Free updates included.</p>
`;
    if (activeTab === "visual") {
      if (editorRef.current) {
        editorRef.current.innerHTML = (editorRef.current.innerHTML || "") + template;
        handleEditorInput();
      }
    } else {
      const updated = (htmlContent || "") + template;
      setHtmlContent(updated);
      onChange(updated);
    }
  }

  return (
    <div className="rounded-lg border bg-background text-foreground shadow-sm">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b bg-muted/30 p-1.5 gap-1">
        <div className="flex flex-wrap items-center gap-0.5">
          <ToolbarButton
            icon={<Bold className="h-4 w-4" />}
            title="Bold"
            onClick={() => exec("bold")}
            disabled={activeTab !== "visual"}
          />
          <ToolbarButton
            icon={<Italic className="h-4 w-4" />}
            title="Italic"
            onClick={() => exec("italic")}
            disabled={activeTab !== "visual"}
          />
          <ToolbarButton
            icon={<Underline className="h-4 w-4" />}
            title="Underline"
            onClick={() => exec("underline")}
            disabled={activeTab !== "visual"}
          />
          <ToolbarButton
            icon={<Strikethrough className="h-4 w-4" />}
            title="Strikethrough"
            onClick={() => exec("strikeThrough")}
            disabled={activeTab !== "visual"}
          />

          <div className="mx-1 h-4 w-[1px] bg-border" />

          <ToolbarButton
            icon={<Heading2 className="h-4 w-4" />}
            title="Heading 2"
            onClick={() => exec("formatBlock", "<h2>")}
            disabled={activeTab !== "visual"}
          />
          <ToolbarButton
            icon={<Heading3 className="h-4 w-4" />}
            title="Heading 3"
            onClick={() => exec("formatBlock", "<h3>")}
            disabled={activeTab !== "visual"}
          />

          <div className="mx-1 h-4 w-[1px] bg-border" />

          <ToolbarButton
            icon={<List className="h-4 w-4" />}
            title="Bulleted List"
            onClick={() => exec("insertUnorderedList")}
            disabled={activeTab !== "visual"}
          />
          <ToolbarButton
            icon={<ListOrdered className="h-4 w-4" />}
            title="Numbered List"
            onClick={() => exec("insertOrderedList")}
            disabled={activeTab !== "visual"}
          />
          <ToolbarButton
            icon={<Quote className="h-4 w-4" />}
            title="Blockquote"
            onClick={() => exec("formatBlock", "<blockquote>")}
            disabled={activeTab !== "visual"}
          />
          <ToolbarButton
            icon={<Code className="h-4 w-4" />}
            title="Code format"
            onClick={() => exec("formatBlock", "<pre>")}
            disabled={activeTab !== "visual"}
          />

          <div className="mx-1 h-4 w-[1px] bg-border" />

          <ToolbarButton
            icon={<LinkIcon className="h-4 w-4" />}
            title="Insert Link"
            onClick={insertLink}
            disabled={activeTab !== "visual"}
          />
          <ToolbarButton
            icon={<RemoveFormatting className="h-4 w-4" />}
            title="Clear Formatting"
            onClick={() => exec("removeFormat")}
            disabled={activeTab !== "visual"}
          />

          <button
            type="button"
            onClick={insertTemplate}
            className="ml-1 inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
            title="Insert What's Included template"
          >
            <CheckSquare className="h-3 w-3" />
            <span>+ What's Included Template</span>
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-0.5 rounded-md bg-muted p-0.5 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab("visual");
              setTimeout(() => {
                if (editorRef.current) editorRef.current.innerHTML = htmlContent;
              }, 10);
            }}
            className={`flex items-center gap-1 rounded px-2 py-1 transition ${
              activeTab === "visual" ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" /> Visual
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("html")}
            className={`flex items-center gap-1 rounded px-2 py-1 transition ${
              activeTab === "html" ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" /> HTML
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-1 rounded px-2 py-1 transition ${
              activeTab === "preview" ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye className="h-3.5 w-3.5" /> Preview
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="p-3">
        {activeTab === "visual" && (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleEditorInput}
            onBlur={handleEditorInput}
            dangerouslySetInnerHTML={{ __html: value || "" }}
            data-placeholder={placeholder}
            style={{ minHeight }}
            className="prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[220px] [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground [&:empty]:before:pointer-events-none"
          />
        )}

        {activeTab === "html" && (
          <textarea
            value={htmlContent}
            onChange={handleHtmlChange}
            placeholder="Edit raw HTML description..."
            rows={10}
            style={{ minHeight }}
            className="w-full resize-y rounded-md bg-transparent font-mono text-xs text-foreground focus:outline-none"
          />
        )}

        {activeTab === "preview" && (
          <div
            style={{ minHeight }}
            className="prose prose-sm dark:prose-invert max-w-none rounded-md bg-muted/10 p-2"
            dangerouslySetInnerHTML={{
              __html:
                htmlContent ||
                `<p class="text-sm text-muted-foreground italic">No description content yet.</p>`,
            }}
          />
        )}
      </div>
    </div>
  );
}

function ToolbarButton({
  icon,
  title,
  onClick,
  disabled = false,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
    >
      {icon}
    </button>
  );
}
