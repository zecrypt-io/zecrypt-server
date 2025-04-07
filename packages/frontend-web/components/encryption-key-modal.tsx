"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { KeyRound, AlertTriangle, Copy, Download, RefreshCw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface EncryptionKeyModalProps {
  isNewUser?: boolean
  onClose: (key: string) => void
  onCancel?: () => void
}

export function EncryptionKeyModal({ isNewUser = false, onClose, onCancel }: EncryptionKeyModalProps) {
  const [encryptionKey, setEncryptionKey] = useState(generateEncryptionKey())
  const [customKey, setCustomKey] = useState("")
  const [existingKey, setExistingKey] = useState("")
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"generated" | "custom" | "existing">(isNewUser ? "generated" : "existing")

  function generateEncryptionKey() {
    const array = new Uint8Array(32) // 256-bit key
    window.crypto.getRandomValues(array)
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
  }

  const regenerateKey = () => {
    setEncryptionKey(generateEncryptionKey())
  }

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key)
  }

  const handleDownloadKey = (key: string) => {
    const blob = new Blob(
      [
        `Your Zecrypt Encryption Key:\n\n${key}\n\nStore this key securely. You will need it to access your encrypted data.`,
      ],
      { type: "text/plain" },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "zecrypt-encryption-key.txt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const validateKey = (key: string) => {
    // Check if key is valid hex and 64 characters (256 bits)
    if (!/^[0-9a-f]{64}$/i.test(key)) {
      return "Key must be 64 hexadecimal characters (0-9, a-f)"
    }
    return ""
  }

  const handleCustomKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCustomKey(value)
    if (value) {
      setError(validateKey(value))
    } else {
      setError("")
    }
  }

  const handleExistingKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setExistingKey(value)
    if (value) {
      setError(validateKey(value))
    } else {
      setError("")
    }
  }

  const handleSubmitKey = () => {
    let finalKey = ""
    let validationError = ""

    switch (activeTab) {
      case "generated":
        finalKey = encryptionKey
        break
      case "custom":
        validationError = validateKey(customKey)
        if (validationError) {
          setError(validationError)
          return
        }
        finalKey = customKey
        break
      case "existing":
        if (!existingKey.trim()) {
          setError("Please enter your encryption key")
          return
        }
        validationError = validateKey(existingKey)
        if (validationError) {
          setError(validationError)
          return
        }
        finalKey = existingKey
        break
    }

    // Store the key in sessionStorage
    sessionStorage.setItem("encryptionKey", finalKey)

    // Call the onClose callback with the key
    onClose(finalKey)
  }

  return (
    <Dialog open={true} onOpenChange={() => onCancel?.()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-yellow-500" />
            Encryption Key
          </DialogTitle>
          <DialogDescription>
            Your encryption key is used to secure your data. Only you have access to this key.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert
            variant="destructive"
            className="bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-900"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>IMPORTANT:</strong> Save this key in a secure location. If you lose this key, your data cannot be
              recovered.
            </AlertDescription>
          </Alert>

          <Tabs
            defaultValue={isNewUser ? "generated" : "existing"}
            onValueChange={(value) => {
              setActiveTab(value as "generated" | "custom" | "existing")
              setError("")
            }}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="generated">Generate Key</TabsTrigger>
              <TabsTrigger value="custom">Create Key</TabsTrigger>
              <TabsTrigger value="existing">Use Existing</TabsTrigger>
            </TabsList>

            <TabsContent value="generated" className="space-y-4">
              <div className="relative">
                <Input value={encryptionKey} readOnly className="pr-20 font-mono text-xs" />
                <div className="absolute right-1 top-1 flex">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={regenerateKey}
                    title="Generate new key"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={() => handleCopyKey(encryptionKey)}
                    title="Copy key"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">This is a secure 256-bit key generated by your browser.</p>
              <Button onClick={() => handleDownloadKey(encryptionKey)} variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download Key
              </Button>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customKey">Create Your Own Key</Label>
                <Input
                  id="customKey"
                  value={customKey}
                  onChange={handleCustomKeyChange}
                  placeholder="Enter a 64-character hexadecimal key"
                  className={error && activeTab === "custom" ? "border-red-500 font-mono text-xs" : "font-mono text-xs"}
                />
                {error && activeTab === "custom" && <p className="text-xs text-red-500">{error}</p>}
                <p className="text-xs text-muted-foreground">
                  Your key must be 64 hexadecimal characters (0-9, a-f). This is equivalent to a 256-bit AES key.
                </p>
              </div>
              {customKey && !error && (
                <Button onClick={() => handleDownloadKey(customKey)} variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download Key
                </Button>
              )}
            </TabsContent>

            <TabsContent value="existing" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="existingKey">Enter Your Existing Key</Label>
                <Input
                  id="existingKey"
                  value={existingKey}
                  onChange={handleExistingKeyChange}
                  placeholder="Enter your existing encryption key"
                  className={
                    error && activeTab === "existing" ? "border-red-500 font-mono text-xs" : "font-mono text-xs"
                  }
                />
                {error && activeTab === "existing" && <p className="text-xs text-red-500">{error}</p>}
                <p className="text-xs text-muted-foreground">
                  Enter the encryption key you previously saved. If you&apos;ve lost your key, you&apos;ll need to reset your
                  account.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSubmitKey}
            disabled={
              (activeTab === "custom" && (!customKey || !!error)) ||
              (activeTab === "existing" && (!existingKey || !!error))
            }
          >
            {activeTab === "existing" ? "Submit" : "I've Saved My Key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

