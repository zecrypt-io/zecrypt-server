"use client";

import { useState, useEffect } from "react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslator } from "@/hooks/use-translations";

// Define a custom language for environment variables
languages.env = {
  comment: {
    pattern: /(^|[^\\])#.*/,
    lookbehind: true
  },
  string: {
    pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
    greedy: true
  },
  'env-key': {
    pattern: /^[A-Za-z_][A-Za-z0-9_]*(?=\s*=)/m,
    alias: 'attr-name'
  },
  'env-value': {
    pattern: /=\s*(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*'|[^\s#]*)/,
    alias: 'attr-value',
    inside: {
      'punctuation': /^=/
    }
  }
};

interface EnvCodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  title?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnvCodeEditor({
  value,
  onChange,
  readOnly = false,
  title = "Environment Variables",
  open,
  onOpenChange
}: EnvCodeEditorProps) {
  const { translate } = useTranslator();
  const [code, setCode] = useState(value || "");

  // Update internal state when external value changes
  useEffect(() => {
    setCode(value || "");
  }, [value]);

  const handleChange = (newCode: string) => {
    setCode(newCode);
  };

  const handleSave = () => {
    if (onChange) {
      onChange(code);
    }
    onOpenChange(false);
  };

  // Highlighting function without line numbers
  const highlightCode = (input: string) => {
    return highlight(input, languages.env, 'env');
  };

  // Safely get translation with fallback
  const safeTranslate = (key: string, namespace: string, options?: any) => {
    try {
      return translate(key, namespace, options);
    } catch (error) {
      return options?.default || key;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 border rounded-md bg-background overflow-hidden">
          <div className="editor-scroll-container">
            <Editor
              value={code}
              onValueChange={handleChange}
              highlight={highlightCode}
              padding={10}
              readOnly={readOnly}
              style={{
                fontFamily: '"Fira code", "Fira Mono", monospace',
                fontSize: 14,
                backgroundColor: "transparent"
              }}
              className="env-code-editor"
              textareaClassName="env-code-editor-textarea"
              preClassName="env-code-editor-pre"
            />
          </div>
        </div>
        <DialogFooter className="pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {safeTranslate("cancel", "actions", { default: "Cancel" })}
          </Button>
          {!readOnly && (
            <Button onClick={handleSave}>
              {safeTranslate("save", "actions", { default: "Save" })}
            </Button>
          )}
          {readOnly && (
            <Button
              onClick={() => {
                navigator.clipboard.writeText(code);
                // Could add a toast notification here
              }}
            >
              {safeTranslate("copy", "actions", { default: "Copy" })}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
      <style jsx global>{`
        .editor-scroll-container {
          height: 400px;
          overflow: auto;
          background-color: #121212;
          border-radius: 0.375rem;
        }
        
        .env-code-editor {
          min-height: 100%;
          background-color: #1a1a1a; /* Slightly lighter than pure black */
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3); /* Subtle inner shadow for depth */
          transition: background-color 0.2s ease;
        }
        
        .env-code-editor:focus-within {
          background-color: #1e1e1e; /* Slightly lighter on focus */
        }
        
        .env-code-editor-textarea {
          /* Fix cursor position */
          caret-color: white;
          outline: none !important; /* Remove default focus outline */
          white-space: pre !important;
        }

        .env-code-editor-pre {
          z-index: 1;
          white-space: pre !important;
        }
        
        /* Ensure proper scrolling behavior */
        .editor-scroll-container > div {
          min-width: min-content;
        }
        
        /* Ensure scrollbars appear correctly */
        .editor-scroll-container::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        
        .editor-scroll-container::-webkit-scrollbar-track {
          background: #1e1e1e;
          border-radius: 3px;
        }
        
        .editor-scroll-container::-webkit-scrollbar-thumb {
          background: #444;
          border-radius: 3px;
        }
        
        .editor-scroll-container::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        
        .token.env-key {
          color: #2391e6; /* Brighter blue for better visibility */
          font-weight: 500;
        }
        
        .token.env-value {
          color: #7eaf2a; /* Brighter green for better visibility */
        }
        
        .token.punctuation {
          color: #b9b9b9; /* Lighter punctuation for better visibility */
        }
        
        .token.comment {
          color: #7c7c7c; /* Brighter slategray for better visibility */
          font-style: italic;
        }
      `}</style>
    </Dialog>
  );
} 