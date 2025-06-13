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

  // Custom highlighting function for environment variables
  const highlightWithLineNumbers = (input: string) => {
    return highlight(input, languages.env, 'env')
      .split('\n')
      .map((line, i) => `<span class="line-number">${i + 1}</span>${line}`)
      .join('\n');
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
        <div className="flex-1 overflow-auto border rounded-md bg-background">
          <div className="relative">
            <Editor
              value={code}
              onValueChange={handleChange}
              highlight={highlightWithLineNumbers}
              padding={10}
              readOnly={readOnly}
              style={{
                fontFamily: '"Fira code", "Fira Mono", monospace',
                fontSize: 14,
                minHeight: "300px",
                height: readOnly ? "auto" : "400px",
                backgroundColor: "transparent"
              }}
              className="env-code-editor"
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
        .env-code-editor {
          counter-reset: line;
        }
        
        .line-number {
          counter-increment: line;
          display: inline-block;
          width: 2em;
          color: #888;
          text-align: right;
          margin-right: 1em;
          padding-right: 0.5em;
          border-right: 1px solid #ddd;
          user-select: none;
        }
        
        .token.env-key {
          color: #07a;
        }
        
        .token.env-value {
          color: #690;
        }
        
        .token.punctuation {
          color: #999;
        }
        
        .token.comment {
          color: slategray;
        }
      `}</style>
    </Dialog>
  );
} 