"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Copy, RefreshCw, X, Check, Shield, ShieldCheck, ShieldAlert, Save, Clock, Sparkles, ChevronDown, ChevronUp } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslator } from "@/hooks/use-translations"
import { usePasswordHistory } from "@/hooks/use-password-history"
import { toast } from "@/components/ui/use-toast"

interface GeneratePasswordDialogProps {
  onClose: () => void
}

interface PasswordHistoryItem {
  doc_id: string
  data: string
  created_at: string | number
}

interface PasswordHistoryDialogProps {
  onClose: () => void
  passwordHistory: PasswordHistoryItem[]
  isLoading: boolean
  handleClearHistory: () => void
  translate: (key: string, namespace?: string, options?: any) => string
}

// New History Dialog Component
function PasswordHistoryDialog({ onClose, passwordHistory, isLoading, handleClearHistory, translate }: PasswordHistoryDialogProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm overflow-hidden">
      <div className="relative w-full max-w-md rounded-lg bg-card border border-border shadow-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-border sticky top-0 bg-card z-10 flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {translate("history", "password_generator")}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">
              {translate("recently_generated", "password_generator")}
            </h3>
            <Button variant="outline" size="sm" className="text-xs" onClick={handleClearHistory}>
              {translate("clear_history", "password_generator")}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-[200px]">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <p className="text-xs text-muted-foreground">{translate("loading", "common")}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {passwordHistory && passwordHistory.length > 0 ? 
                passwordHistory.map((item: PasswordHistoryItem) => (
                  <div 
                    key={item.doc_id}
                    className="flex items-center justify-between p-2 bg-muted/30 rounded group"
                  >
                    <div className="flex flex-col">
                      <span className="font-mono text-sm truncate max-w-[260px]">
                        {item.data}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100"
                      onClick={() => {
                        navigator.clipboard.writeText(item.data)
                        toast({
                          description: translate("copied", "password_generator"),
                        })
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              : (
                <div className="p-8 text-center text-muted-foreground">
                  <p className="text-sm">{translate("no_history", "password_generator")}</p>
                  <p className="text-xs mt-2">{translate("history_hint", "password_generator")}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border sticky bottom-0 bg-card z-10 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            {translate("close", "password_generator")}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function GeneratePasswordDialog({ onClose }: GeneratePasswordDialogProps) {
  const { translate } = useTranslator();
  const [password, setPassword] = useState("")
  const [length, setLength] = useState(16)
  const [copied, setCopied] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const { 
    passwordHistory, 
    isLoading: isHistoryLoading,
    fetchPasswordHistory, 
    savePasswordToHistory
  } = usePasswordHistory()
  const [selectedMode, setSelectedMode] = useState("strong")
  const [showHistory, setShowHistory] = useState(false)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(true)
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  })
  
  // Refs for functions that might be unstable
  const savePasswordToHistoryRef = useRef(savePasswordToHistory)
  const fetchPasswordHistoryRef = useRef(fetchPasswordHistory)
  const translateRef = useRef(translate)

  // Update refs when dependencies change
  useEffect(() => {
    savePasswordToHistoryRef.current = savePasswordToHistory
  }, [savePasswordToHistory])

  useEffect(() => {
    fetchPasswordHistoryRef.current = fetchPasswordHistory
  }, [fetchPasswordHistory])

  useEffect(() => {
    translateRef.current = translate
  }, [translate])

  // Fetch password history when showing history dialog
  useEffect(() => {
    if (showHistory && !isHistoryLoading) {
      fetchPasswordHistory()
    }
  }, [showHistory]) // Only depend on showHistory changes to prevent loops

  // Calculate password strength whenever password changes
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0)
      return
    }
    
    let strength = 0

    // Length contribution (up to 40%)
    strength += Math.min(40, (length / 20) * 40)

    // Character set contribution (up to 60%)
    let charSetCount = 0
    if (options.lowercase) charSetCount++
    if (options.uppercase) charSetCount++
    if (options.numbers) charSetCount++
    if (options.symbols) charSetCount++

    strength += (charSetCount / 4) * 60

    setPasswordStrength(Math.round(strength))
  }, [password, length, options])

  const handleOptionChange = (option: keyof typeof options) => {
    // For individual character set options
    const newOptions = { ...options, [option]: !options[option] }

    // Ensure at least one character set is selected
    const anySelected = newOptions.uppercase || newOptions.lowercase || newOptions.numbers || newOptions.symbols

    if (anySelected) {
      setOptions(newOptions)
    }
  }

  const getRandomChar = (charSet: string): string => {
    if (!charSet.length) return ""
    return charSet.charAt(Math.floor(Math.random() * charSet.length))
  }

  const shuffleString = (str: string): string => {
    const array = str.split("")
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array.join("")
  }

  const copyToClipboard = async () => {
    try {
      if (!password) {
        toast({
          title: translate("note", "actions"),
          description: translate("no_password_to_copy", "password_generator", { default: "Generate a password first" }),
          variant: "default",
        })
        return
      }
      
      await navigator.clipboard.writeText(password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy: ", err)
    }
  }

  const getStrengthLabel = () => {
    if (passwordStrength < 30)
      return { label: translate("weak", "password_generator"), icon: ShieldAlert, color: "text-red-500", bgColor: "bg-red-100 dark:bg-red-900/30" }
    if (passwordStrength < 60)
      return { label: translate("fair", "password_generator"), icon: Shield, color: "text-yellow-500", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" }
    if (passwordStrength < 80)
      return { label: translate("good", "password_generator"), icon: Shield, color: "text-blue-500", bgColor: "bg-blue-100 dark:bg-blue-900/30" }
    return { label: translate("strong_strength", "password_generator"), icon: ShieldCheck, color: "text-green-500", bgColor: "bg-green-100 dark:bg-green-900/30" }
  }

  const applyPreset = (preset: "strong" | "memorable" | "pin" | "passphrase") => {
    setSelectedMode(preset)
    
    switch (preset) {
      case "strong":
        setLength(16)
        setOptions({
          uppercase: true,
          lowercase: true,
          numbers: true,
          symbols: true
        })
        break
      case "memorable":
        setLength(16)
        setOptions({
          uppercase: true,
          lowercase: true,
          numbers: false,
          symbols: false
        })
        break
      case "pin":
        setLength(6)
        setOptions({
          uppercase: false,
          lowercase: false,
          numbers: true,
          symbols: false
        })
        break
      case "passphrase":
        setLength(16)
        setOptions({
          uppercase: true,
          lowercase: true,
          numbers: true,
          symbols: false
        })
        break
    }
  }

  // Memoized password generation function
  const generatePasswordString = useCallback((): string => {
    const chars = {
      lowercase: "abcdefghijklmnopqrstuvwxyz",
      uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      numbers: "0123456789",
      symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
    }

    let validChars = ""

    if (options.lowercase) validChars += chars.lowercase
    if (options.uppercase) validChars += chars.uppercase
    if (options.numbers) validChars += chars.numbers
    if (options.symbols) validChars += chars.symbols

    // Fallback to lowercase if nothing is selected
    if (validChars === "") validChars = chars.lowercase

    let result = ""
    const validCharsLength = validChars.length

    // Ensure we have at least one character from each selected set
    const requiredChars = []
    if (options.lowercase) requiredChars.push(getRandomChar(chars.lowercase))
    if (options.uppercase) requiredChars.push(getRandomChar(chars.uppercase))
    if (options.numbers) requiredChars.push(getRandomChar(chars.numbers))
    if (options.symbols) requiredChars.push(getRandomChar(chars.symbols))

    // Add required characters
    result = requiredChars.join("")

    // Fill the rest randomly
    for (let i = result.length; i < length; i++) {
      result += validChars.charAt(Math.floor(Math.random() * validCharsLength))
    }

    // Shuffle the result to avoid predictable patterns
    return shuffleString(result)
  }, [length, options])

  // Function to generate password and update UI
  const generatePasswordAndUpdateDisplay = useCallback(() => {
    const newPassword = generatePasswordString()
    setPassword(newPassword)
    setCopied(false)
    return newPassword
  }, [generatePasswordString])

  // Function to generate password, update UI, and save to history
  const handleGeneratePasswordAndSave = () => {
    const newPassword = generatePasswordAndUpdateDisplay()
    savePasswordToHistoryRef.current(newPassword)
      .then(() => {
        if (showHistory) {
          fetchPasswordHistoryRef.current() // Refresh history if visible
        }
      })
      .catch(error => {
        console.error("Failed to save new password to history:", error)
        toast({
          title: translateRef.current("note", "actions"),
          description: translateRef.current("password_saved_locally", "password_generator", 
            { default: "Password saved locally but not to server" }),
          variant: "default",
        })
      })
  }

  // For handling clear history - just refresh the history data
  const handleClearHistory = () => {
    console.log("Clear history requested - triggering refresh")
    setTimeout(() => {
      fetchPasswordHistoryRef.current()
    }, 500)
  }

  const strengthInfo = getStrengthLabel()
  const StrengthIcon = strengthInfo.icon

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm overflow-hidden">
        <div className="relative w-full max-w-xl rounded-lg bg-card border border-border shadow-lg flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-4 border-b border-border sticky top-0 bg-card z-10 flex items-center justify-between">
            <h2 className="text-lg font-bold text-center flex-1">{translate("title", "password_generator")}</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-sm text-muted-foreground mb-4 text-center">
              {translate("create_secure_passwords", "password_generator", { default: "Create secure passwords for your accounts" })}
            </p>
            
            {/* Password Type Tabs */}
            <div className="flex mb-6 border-b border-border">
              <button 
                onClick={() => applyPreset("strong")} 
                className={`flex-1 py-2 px-3 text-sm font-medium ${selectedMode === "strong" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Shield className="h-4 w-4" />
                  {translate("strong", "password_generator")}
                </div>
              </button>
              <button 
                onClick={() => applyPreset("memorable")} 
                className={`flex-1 py-2 px-3 text-sm font-medium ${selectedMode === "memorable" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  {translate("memorable", "password_generator")}
                </div>
              </button>
              <button 
                onClick={() => applyPreset("pin")} 
                className={`flex-1 py-2 px-3 text-sm font-medium ${selectedMode === "pin" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Shield className="h-4 w-4" />
                  {translate("pin", "password_generator")}
                </div>
              </button>
              <button 
                onClick={() => applyPreset("passphrase")} 
                className={`flex-1 py-2 px-3 text-sm font-medium ${selectedMode === "passphrase" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Shield className="h-4 w-4" />
                  {translate("passphrase", "password_generator")}
                </div>
              </button>
            </div>

            {/* Advanced Options */}
            <div className="mb-6">
              <button 
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="flex w-full items-center justify-between p-2 bg-muted/50 rounded text-sm font-medium"
              >
                {translate("advanced_options", "password_generator", { default: "Advanced Options" })}
                {showAdvancedOptions ? 
                  <ChevronUp className="h-4 w-4" /> : 
                  <ChevronDown className="h-4 w-4" />
                }
              </button>
              
              {showAdvancedOptions && (
                <div className="mt-3 p-3 border border-border rounded-md">
                  {/* Password Length */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">{translate("password_length", "password_generator")}: {length}</label>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{length}</span>
                    </div>
                    <Slider
                      value={[length]}
                      min={4}
                      max={32}
                      step={1}
                      onValueChange={(value) => setLength(value[0])}
                      className="w-full"
                    />
                  </div>

                  {/* Character Sets */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="uppercase"
                        checked={options.uppercase}
                        onCheckedChange={() => handleOptionChange("uppercase")}
                      />
                      <Label htmlFor="uppercase" className="cursor-pointer text-sm">
                        {translate("uppercase", "password_generator", { default: "Uppercase (A-Z)" })}
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        id="lowercase"
                        checked={options.lowercase}
                        onCheckedChange={() => handleOptionChange("lowercase")}
                      />
                      <Label htmlFor="lowercase" className="cursor-pointer text-sm">
                        {translate("lowercase", "password_generator", { default: "Lowercase (a-z)" })}
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        id="numbers"
                        checked={options.numbers}
                        onCheckedChange={() => handleOptionChange("numbers")}
                      />
                      <Label htmlFor="numbers" className="cursor-pointer text-sm">
                        {translate("numbers", "password_generator", { default: "Numbers (0-9)" })}
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        id="symbols"
                        checked={options.symbols}
                        onCheckedChange={() => handleOptionChange("symbols")}
                      />
                      <Label htmlFor="symbols" className="cursor-pointer text-sm">
                        {translate("symbols", "password_generator", { default: "Symbols (!@#$)" })}
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Generated Password - Only show when password exists */}
            {password && (
              <div className="mb-6">
                <div>
                  <div className="relative mt-1">
                    <div className="flex items-center">
                      <div className="bg-muted p-3 rounded-md font-mono text-base flex-1 break-all mr-2">
                        {password}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={copyToClipboard}
                          className="h-9 w-9"
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  {password && (
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={passwordStrength} className="h-2 flex-1" />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${strengthInfo.bgColor} ${strengthInfo.color}`}>
                        <StrengthIcon className="h-3 w-3" />
                        {strengthInfo.label}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between gap-2 mb-4">
              <Button 
                variant="outline"
                onClick={() => setShowHistory(true)}
                className="flex-1 gap-2"
              >
                <Clock className="h-4 w-4" />
                {translate("history", "password_generator")}
              </Button>
              <Button 
                onClick={handleGeneratePasswordAndSave}
                className="flex-1 gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                {translate("generate_password", "password_generator", { default: "Generate Password" })}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* History Dialog */}
      {showHistory && (
        <PasswordHistoryDialog 
          onClose={() => setShowHistory(false)}
          passwordHistory={passwordHistory}
          isLoading={isHistoryLoading}
          handleClearHistory={handleClearHistory}
          translate={translate}
        />
      )}
    </>
  )
}

