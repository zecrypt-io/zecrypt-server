"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Copy, RefreshCw, X, Check, Shield, ShieldCheck, ShieldAlert, Save, Clock, Sparkles } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslator } from "@/hooks/use-translations"
import { usePasswordHistory } from "@/hooks/use-password-history"
// import { formatDate } from "@/libs/api-client"
// import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface GeneratePasswordDialogProps {
  onClose: () => void
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
    savePasswordToHistory,
    isProjectKeyLoading
  } = usePasswordHistory()
  const [activeTab, setActiveTab] = useState("options")
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  })
  
  // Reference to the history container for scrolling
  const historyContainerRef = useRef<HTMLDivElement>(null)
  
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

  // Fetch password history only when tab is changed to history
  useEffect(() => {
    if (activeTab === "history" && !isHistoryLoading) {
      console.log("Fetching password history for history tab")
      fetchPasswordHistory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]) // Only depend on activeTab changes to prevent loops

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

  // Handle tab switching
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Don't fetch here, let the useEffect handle it
  }

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
    switch (preset) {
      case "strong":
        setLength(20)
        setOptions({
          uppercase: true,
          lowercase: true,
          numbers: true,
          symbols: true
        })
        break
      case "memorable":
        setLength(14)
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
        setLength(18)
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
        fetchPasswordHistoryRef.current() // Refresh history
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
    // Refresh history after a small delay to simulate clearing
    console.log("Clear history requested - triggering refresh")
    setTimeout(() => {
      fetchPasswordHistoryRef.current()
    }, 500)
  }

  const strengthInfo = getStrengthLabel()
  const StrengthIcon = strengthInfo.icon

  useEffect(() => {
    console.log("GeneratePasswordDialog MOUNTED");
    return () => {
      console.log("GeneratePasswordDialog UNMOUNTED");
    };
  }, []); // Empty dependency array

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm overflow-hidden">
      <div className="relative w-full max-w-xl rounded-lg bg-card border border-border shadow-lg flex flex-col max-h-[90vh]">
        {/* Fixed Header */}
        <div className="p-4 border-b border-border sticky top-0 bg-card z-10 flex items-center justify-between">
          <h2 className="text-lg font-bold">{translate("title", "password_generator")}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Quick Presets */}
            <div className="grid grid-cols-4 gap-2">
              <Card
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => applyPreset("strong")}
              >
                <CardContent className="p-2 flex flex-col items-center justify-center text-center">
                  <ShieldCheck className="h-4 w-4 text-green-500 mb-1" />
                  <span className="text-xs font-medium">{translate("strong", "password_generator")}</span>
                  <span className="text-xs text-muted-foreground">20</span>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => applyPreset("memorable")}
              >
                <CardContent className="p-2 flex flex-col items-center justify-center text-center">
                  <Sparkles className="h-4 w-4 text-blue-500 mb-1" />
                  <span className="text-xs font-medium">{translate("memorable", "password_generator")}</span>
                  <span className="text-xs text-muted-foreground">14</span>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => applyPreset("pin")}>
                <CardContent className="p-2 flex flex-col items-center justify-center text-center">
                  <Shield className="h-4 w-4 text-purple-500 mb-1" />
                  <span className="text-xs font-medium">{translate("pin", "password_generator")}</span>
                  <span className="text-xs text-muted-foreground">6</span>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => applyPreset("passphrase")}
              >
                <CardContent className="p-2 flex flex-col items-center justify-center text-center">
                  <Shield className="h-4 w-4 text-yellow-500 mb-1" />
                  <span className="text-xs font-medium">{translate("passphrase", "password_generator")}</span>
                  <span className="text-xs text-muted-foreground">18</span>
                </CardContent>
              </Card>
            </div>

            {/* Generate Password Button */}
            <div className="flex justify-center">
              <Button 
                className="w-full py-2 gap-2"
                onClick={handleGeneratePasswordAndSave}
              >
                <RefreshCw className="h-4 w-4" />
                {translate("generate_password", "password_generator", { default: "Generate Password" })}
              </Button>
            </div>

            {/* Password Display - Only show when password exists */}
            {password ? (
              <div className="relative">
                <div className="flex items-center justify-between bg-muted p-3 rounded-md font-mono text-base break-all">
                  <div className="flex-1 mr-2 select-all">
                    {password}
                  </div>
                  <div className="flex gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={copied ? "default" : "outline"}
                            size="icon"
                            onClick={copyToClipboard}
                            className="h-8 w-8"
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{copied ? translate("copied", "password_generator") : translate("copy", "password_generator")}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                {/* Password Strength Indicator */}
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full ${strengthInfo.bgColor}`}>
                        <StrengthIcon className={`h-3 w-3 ${strengthInfo.color}`} />
                      </div>
                      <span className={`text-sm font-medium ${strengthInfo.color}`}>{strengthInfo.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{translate("strength", "password_generator", { strength: passwordStrength })}</span>
                  </div>
                  <Progress value={passwordStrength} className="h-2" />
                </div>
              </div>
            ) : null}

            <Tabs defaultValue="options" className="w-full" value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid grid-cols-2 mt-2">
                <TabsTrigger value="options" onClick={() => handleTabChange("options")}>
                  {translate("options", "password_generator")}
                </TabsTrigger>
                <TabsTrigger value="history" onClick={() => handleTabChange("history")}>
                  {translate("history", "password_generator")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="options" className="space-y-3 mt-3">
                {/* Password Length */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium">{translate("password_length", "password_generator")}</label>
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{length}</span>
                  </div>
                  <Slider
                    value={[length]}
                    min={4}
                    max={32}
                    step={1}
                    onValueChange={(value) => setLength(value[0])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>4</span>
                    <span>12</span>
                    <span>20</span>
                    <span>28</span>
                    <span>32</span>
                  </div>
                </div>

                {/* Character Sets */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="uppercase"
                        checked={options.uppercase}
                        onCheckedChange={() => handleOptionChange("uppercase")}
                      />
                      <Label htmlFor="uppercase" className="cursor-pointer text-xs">
                        {translate("uppercase", "password_generator")}
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        id="lowercase"
                        checked={options.lowercase}
                        onCheckedChange={() => handleOptionChange("lowercase")}
                      />
                      <Label htmlFor="lowercase" className="cursor-pointer text-xs">
                        {translate("lowercase", "password_generator")}
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        id="numbers"
                        checked={options.numbers}
                        onCheckedChange={() => handleOptionChange("numbers")}
                      />
                      <Label htmlFor="numbers" className="cursor-pointer text-xs">
                        {translate("numbers", "password_generator")}
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        id="symbols"
                        checked={options.symbols}
                        onCheckedChange={() => handleOptionChange("symbols")}
                      />
                      <Label htmlFor="symbols" className="cursor-pointer text-xs">
                        {translate("symbols", "password_generator")}
                      </Label>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-3 rounded-md">
                    <h3 className="text-xs font-medium mb-1">{translate("password_analysis", "password_generator")}</h3>
                    <ul className="space-y-1 text-xs">
                      <li className="flex items-center gap-2">
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${passwordStrength > 60 ? "bg-green-500" : "bg-gray-300"}`}
                        ></div>
                        <span className={passwordStrength > 60 ? "" : "text-muted-foreground"}>
                          {passwordStrength > 60
                            ? translate("strong_enough", "password_generator")
                            : translate("not_strong_enough", "password_generator")}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full ${length >= 12 ? "bg-green-500" : "bg-gray-300"}`}></div>
                        <span className={length >= 12 ? "" : "text-muted-foreground"}>
                          {length >= 12 ? translate("good_length", "password_generator") : translate("consider_longer", "password_generator")}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${options.uppercase && options.lowercase && options.numbers && options.symbols ? "bg-green-500" : "bg-gray-300"}`}
                        ></div>
                        <span
                          className={
                            options.uppercase && options.lowercase && options.numbers && options.symbols
                              ? ""
                              : "text-muted-foreground"
                          }
                        >
                          {options.uppercase && options.lowercase && options.numbers && options.symbols
                            ? translate("using_all_types", "password_generator")
                            : translate("consider_more_types", "password_generator")}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-3 mt-3 max-h-[240px] overflow-y-auto">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {translate("recently_generated", "password_generator")}
                    </h3>
                    <Button variant="ghost" size="sm" className="text-xs h-6" onClick={handleClearHistory}>
                      {translate("clear_history", "password_generator")}
                    </Button>
                  </div>

                  {isHistoryLoading ? (
                    <div className="flex justify-center items-center h-[100px]">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <p className="text-xs text-muted-foreground">{translate("loading", "common")}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1" ref={historyContainerRef}>
                      {/* Show current password in "current session" if exists */}
                      {password && (
                        <div 
                          className="flex items-center justify-between p-1.5 bg-gray-50 dark:bg-gray-900 rounded group"
                        >
                          <div className="flex flex-col">
                            <span className="font-mono text-xs truncate max-w-[220px]">
                              {password}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {translate("current_session", "password_generator")}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={() => {
                              navigator.clipboard.writeText(password)
                              toast({
                                description: translate("copied", "password_generator"),
                              })
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      
                      {/* Show history items (filtered to remove current password) */}
                      {passwordHistory && passwordHistory.length > 0 ? 
                        passwordHistory
                          .filter(item => item.data !== password)
                          .map((item) => (
                            <div 
                              key={item.doc_id}
                              className="flex items-center justify-between p-1.5 bg-gray-50 dark:bg-gray-900 rounded group"
                            >
                              <div className="flex flex-col">
                                <span className="font-mono text-xs truncate max-w-[220px]">
                                  {item.data}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(item.created_at).toLocaleString()}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                onClick={() => {
                                  navigator.clipboard.writeText(item.data)
                                  toast({
                                    description: translate("copied", "password_generator"),
                                  })
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ))
                        : (
                          <div className="p-4 text-center text-muted-foreground">
                            <p className="text-xs">{translate("no_history", "password_generator")}</p>
                            <p className="text-[10px] mt-1">{translate("history_hint", "password_generator")}</p>
                          </div>
                        )
                      }
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Fixed Footer */}
        <div className="p-4 border-t border-border sticky bottom-0 bg-card z-10 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            {translate("close", "password_generator")}
          </Button>
          <Button size="sm" onClick={copyToClipboard} disabled={!password}>
            {copied ? translate("copied", "password_generator") : translate("copy_password", "password_generator")}
          </Button>
        </div>
      </div>
    </div>
  )
}

