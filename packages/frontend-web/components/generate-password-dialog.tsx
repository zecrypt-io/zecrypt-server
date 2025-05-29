"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Copy, RefreshCw, X, Check, Shield, ShieldCheck, ShieldAlert, Clock, Sparkles } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslator } from "@/hooks/use-translations"
import { usePasswordHistory } from "@/hooks/use-password-history"
import { formatDate } from "@/libs/api-client"
import { Loader2 } from "lucide-react"
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
  const { passwordHistory, isLoading, fetchPasswordHistory, savePasswordToHistory } = usePasswordHistory()
  const [localPasswordHistory, setLocalPasswordHistory] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("options")
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    easyToSay: false,
    easyToRead: false,
    allCharacters: true,
  })
  
  // Track whether we've manually saved a password to avoid showing 
  // the current password in history until it's explicitly saved
  const [hasManuallyCreatedPassword, setHasManuallyCreatedPassword] = useState(false)

  // Reference to the history container for scrolling
  const historyContainerRef = useRef<HTMLDivElement>(null)

  // Generate password on initial load and when options change
  useEffect(() => {
    if (!hasManuallyCreatedPassword) {
      generateInitialPassword()
    }
  }, [length, options])

  // Generate initial password without adding to history
  const generateInitialPassword = () => {
    const result = generatePasswordString()
    setPassword(result)
    setCopied(false)
    
    // Save the automatically generated password to both local and API history
    if (result) {
      console.log("Saving automatically generated password to history");
      
      // Update local history for current session
      setLocalPasswordHistory(prev => {
        const updated = [result, ...prev];
        return updated.slice(0, 10); // Keep only most recent 10
      });
      
      // Save to API history
      savePasswordToHistory(result).catch(error => {
        console.error("Failed to save initial password to history:", error);
        toast({
          title: translate("note", "actions"),
          description: translate("password_saved_locally", "password_generator", 
            { default: "Password saved locally but not to server" }),
          variant: "default",
        });
      });
    }
  }

  // Generate password and optionally add to history
  const generatePassword = (saveToHistory = true) => {
    const result = generatePasswordString();
    setPassword(result);
    setCopied(false);
    setHasManuallyCreatedPassword(true);
    
    // Save to local history and API history if requested
    if (saveToHistory && result) {
      console.log("Saving newly generated password to history");
      // Update local history for current session
      setLocalPasswordHistory(prev => {
        const updated = [result, ...prev];
        return updated.slice(0, 10); // Keep only most recent 10
      });
      
      // Save to API history without automatically triggering a refresh
      savePasswordToHistory(result).catch(error => {
        console.error("Failed to save generated password to history:", error);
        toast({
          title: translate("note", "actions"),
          description: translate("password_saved_locally", "password_generator", 
            { default: "Password saved locally but not to server" }),
          variant: "default",
        });
      });
    }
  }

  // Calculate password strength
  useEffect(() => {
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

  // Also update the effect to not fetch on every render
  useEffect(() => {
    // Fetch password history only once when the dialog is opened and when not already loading
    if (passwordHistory.length === 0 && !isLoading) {
      console.log("Initial fetch of password history on component mount");
      fetchPasswordHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ensure we also fetch when switching to history tab
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // When history tab is selected, refresh the data
    if (value === "history") {
      console.log("Fetching password history for history tab");
      fetchPasswordHistory();
    }
  }

  const handleOptionChange = (option: keyof typeof options) => {
    if (option === "easyToSay" || option === "easyToRead" || option === "allCharacters") {
      // These are mutually exclusive options
      const newOptions = {
        ...options,
        easyToSay: option === "easyToSay",
        easyToRead: option === "easyToRead",
        allCharacters: option === "allCharacters",
      }

      // Adjust character sets based on the selected option
      if (option === "easyToSay") {
        newOptions.symbols = false
        newOptions.numbers = false
      } else if (option === "easyToRead") {
        newOptions.symbols = true
      }

      setOptions(newOptions)
    } else {
      // For individual character set options
      const newOptions = { ...options, [option]: !options[option] }

      // Ensure at least one character set is selected
      const anySelected = newOptions.uppercase || newOptions.lowercase || newOptions.numbers || newOptions.symbols

      if (anySelected) {
        setOptions(newOptions)
      }
    }
  }

  // Extracts the actual password generation logic into a separate function
  const generatePasswordString = (): string => {
    const chars = {
      lowercase: "abcdefghijklmnopqrstuvwxyz",
      uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      numbers: "0123456789",
      symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
    }

    // Handle easy to read (remove similar characters)
    const easyToReadChars = {
      lowercase: "abcdefghijkmnpqrstuvwxyz", // removed l and o
      uppercase: "ABCDEFGHJKLMNPQRSTUVWXYZ", // removed I and O
      numbers: "23456789", // removed 0 and 1
      symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
    }

    // Handle easy to say (only letters)
    const easyToSayChars = {
      lowercase: "abcdefghijklmnopqrstuvwxyz",
      uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      numbers: "",
      symbols: "",
    }

    let validChars = ""
    const charSet = options.easyToRead ? easyToReadChars : options.easyToSay ? easyToSayChars : chars

    if (options.lowercase) validChars += charSet.lowercase
    if (options.uppercase) validChars += charSet.uppercase
    if (options.numbers) validChars += charSet.numbers
    if (options.symbols) validChars += charSet.symbols

    // Fallback to lowercase if nothing is selected
    if (validChars === "") validChars = chars.lowercase

    let result = ""
    const validCharsLength = validChars.length

    // Ensure we have at least one character from each selected set
    const requiredChars = []
    if (options.lowercase) requiredChars.push(getRandomChar(charSet.lowercase))
    if (options.uppercase) requiredChars.push(getRandomChar(charSet.uppercase))
    if (options.numbers) requiredChars.push(getRandomChar(charSet.numbers))
    if (options.symbols) requiredChars.push(getRandomChar(charSet.symbols))

    // Add required characters
    result = requiredChars.join("")

    // Fill the rest randomly
    for (let i = result.length; i < length; i++) {
      result += validChars.charAt(Math.floor(Math.random() * validCharsLength))
    }

    // Shuffle the result to avoid predictable patterns
    return shuffleString(result)
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
          symbols: true,
          easyToSay: false,
          easyToRead: false,
          allCharacters: true,
        })
        break
      case "memorable":
        setLength(14)
        setOptions({
          uppercase: true,
          lowercase: true,
          numbers: false,
          symbols: false,
          easyToSay: true,
          easyToRead: false,
          allCharacters: false,
        })
        break
      case "pin":
        setLength(6)
        setOptions({
          uppercase: false,
          lowercase: false,
          numbers: true,
          symbols: false,
          easyToSay: false,
          easyToRead: false,
          allCharacters: false,
        })
        break
      case "passphrase":
        setLength(18)
        setOptions({
          uppercase: true,
          lowercase: true,
          numbers: true,
          symbols: false,
          easyToSay: false,
          easyToRead: true,
          allCharacters: false,
        })
        break
    }
  }

  const strengthInfo = getStrengthLabel()
  const StrengthIcon = strengthInfo.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-lg bg-card p-6 border border-border shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="mb-6 flex items-center justify-between bg-card z-10">
          <h2 className="text-2xl font-bold">{translate("title", "password_generator")}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Quick Presets */}
          <div className="grid grid-cols-4 gap-2">
            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => applyPreset("strong")}
            >
              <CardContent className="p-2 flex flex-col items-center justify-center text-center">
                <ShieldCheck className="h-4 w-4 text-green-500 mb-1" />
                <span className="text-xs font-medium">{translate("strong", "password_generator")}</span>
                <span className="text-[10px] text-muted-foreground">20 {translate("chars", "password_generator")}</span>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => applyPreset("memorable")}
            >
              <CardContent className="p-2 flex flex-col items-center justify-center text-center">
                <Sparkles className="h-4 w-4 text-blue-500 mb-1" />
                <span className="text-xs font-medium">{translate("memorable", "password_generator")}</span>
                <span className="text-[10px] text-muted-foreground">14 {translate("chars", "password_generator")}</span>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => applyPreset("pin")}>
              <CardContent className="p-2 flex flex-col items-center justify-center text-center">
                <Shield className="h-4 w-4 text-purple-500 mb-1" />
                <span className="text-xs font-medium">{translate("pin", "password_generator")}</span>
                <span className="text-[10px] text-muted-foreground">6 {translate("digits", "password_generator")}</span>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => applyPreset("passphrase")}
            >
              <CardContent className="p-2 flex flex-col items-center justify-center text-center">
                <Shield className="h-4 w-4 text-yellow-500 mb-1" />
                <span className="text-xs font-medium">{translate("passphrase", "password_generator")}</span>
                <span className="text-[10px] text-muted-foreground">18 {translate("chars", "password_generator")}</span>
              </CardContent>
            </Card>
          </div>

          {/* Password Display */}
          <div className="relative">
            <div className="flex items-center justify-between bg-muted p-4 rounded-md font-mono text-xl break-all">
              <div className="flex-1 mr-2 select-all">{password}</div>
              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={() => generatePassword(true)} className="h-10 w-10">
                        <RefreshCw className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{translate("generate_new", "password_generator")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={copied ? "default" : "outline"}
                        size="icon"
                        onClick={copyToClipboard}
                        className="h-10 w-10"
                      >
                        {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
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
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${strengthInfo.bgColor}`}>
                    <StrengthIcon className={`h-4 w-4 ${strengthInfo.color}`} />
                  </div>
                  <span className={`font-medium ${strengthInfo.color}`}>{strengthInfo.label}</span>
                </div>
                <span className="text-sm text-muted-foreground">{translate("strength", "password_generator", { strength: passwordStrength })}</span>
              </div>
              <Progress value={passwordStrength} className="h-2" />
            </div>
          </div>

          <Tabs defaultValue="options" className="w-full" value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid grid-cols-2 mt-6">
              <TabsTrigger value="options" onClick={() => handleTabChange("options")}>
                {translate("options", "password_generator")}
              </TabsTrigger>
              <TabsTrigger value="history" onClick={() => handleTabChange("history")}>
                {translate("history", "password_generator")}
              </TabsTrigger>
            </TabsList>

            {/* Options Tab */}
            <TabsContent value="options" className="space-y-4 mt-4">
              {/* Password Length */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">{translate("password_length", "password_generator")}</label>
                  <span className="text-sm font-mono bg-muted px-2 py-1 rounded">{length}</span>
                </div>
                <Slider
                  value={[length]}
                  min={4}
                  max={32}
                  step={1}
                  onValueChange={(value) => setLength(value[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>4</span>
                  <span>12</span>
                  <span>20</span>
                  <span>28</span>
                  <span>32</span>
                </div>
              </div>

              {/* Character Sets */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="uppercase"
                      checked={options.uppercase}
                      onCheckedChange={() => handleOptionChange("uppercase")}
                    />
                    <Label htmlFor="uppercase" className="cursor-pointer">
                      {translate("uppercase", "password_generator")}
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      id="lowercase"
                      checked={options.lowercase}
                      onCheckedChange={() => handleOptionChange("lowercase")}
                    />
                    <Label htmlFor="lowercase" className="cursor-pointer">
                      {translate("lowercase", "password_generator")}
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      id="numbers"
                      checked={options.numbers}
                      onCheckedChange={() => handleOptionChange("numbers")}
                    />
                    <Label htmlFor="numbers" className="cursor-pointer">
                      {translate("numbers", "password_generator")}
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      id="symbols"
                      checked={options.symbols}
                      onCheckedChange={() => handleOptionChange("symbols")}
                    />
                    <Label htmlFor="symbols" className="cursor-pointer">
                      {translate("symbols", "password_generator")}
                    </Label>
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-md">
                  <h3 className="text-sm font-medium mb-2">{translate("password_analysis", "password_generator")}</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${passwordStrength > 60 ? "bg-green-500" : "bg-gray-300"}`}
                      ></div>
                      <span className={passwordStrength > 60 ? "" : "text-muted-foreground"}>
                        {passwordStrength > 60
                          ? translate("strong_enough", "password_generator")
                          : translate("not_strong_enough", "password_generator")}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${length >= 12 ? "bg-green-500" : "bg-gray-300"}`}></div>
                      <span className={length >= 12 ? "" : "text-muted-foreground"}>
                        {length >= 12 ? translate("good_length", "password_generator") : translate("consider_longer", "password_generator")}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${options.uppercase && options.lowercase && options.numbers && options.symbols ? "bg-green-500" : "bg-gray-300"}`}
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

            {/* History Tab */}
            <TabsContent value="history" className="mt-4" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <div className="space-y-4">
                <h3 className="font-semibold mb-2">{translate("history", "password_generator")}</h3>
                {isLoading ? (
                  <div className="flex justify-center items-center h-[180px]">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="text-sm text-muted-foreground">{translate("loading", "common")}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Show local history first (current session) */}
                    {localPasswordHistory.length > 0 && (
                      localPasswordHistory.map((historyPass, idx) => (
                        <div 
                          key={`local-${idx}`}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded group"
                        >
                          <div className="flex flex-col">
                            <span className="font-mono text-sm truncate max-w-[260px]">
                              {historyPass}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {translate("current_session", "password_generator")}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100"
                            onClick={() => {
                              navigator.clipboard.writeText(historyPass)
                              toast({
                                description: translate("copied", "password_generator"),
                              })
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                    
                    {/* Show API history */}
                    {passwordHistory && passwordHistory.length > 0 ? (
                      passwordHistory.map((item) => {
                        // Skip showing items that are already in local history to avoid duplicates
                        const isInLocalHistory = localPasswordHistory.includes(item.data);
                        if (isInLocalHistory) return null;
                        
                        // Only display passwords that were successfully decrypted (handled by the hook)
                        return (
                          <div 
                            key={item.doc_id}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded group"
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
                        );
                      }).filter(Boolean)
                    ) : (
                      !localPasswordHistory.length && (
                        <div className="p-3 text-center text-muted-foreground">
                          <p>{translate("no_history", "password_generator")}</p>
                          <p className="text-xs">{translate("history_hint", "password_generator")}</p>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              {translate("close", "password_generator")}
            </Button>
            <Button onClick={copyToClipboard}>{copied ? translate("copied", "password_generator") : translate("copy_password", "password_generator")}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

