"use client"

import { useState, useEffect } from "react"
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

interface GeneratePasswordDialogProps {
  onClose: () => void
}

export function GeneratePasswordDialog({ onClose }: GeneratePasswordDialogProps) {
  const { translate } = useTranslator();
  const [password, setPassword] = useState("")
  const [length, setLength] = useState(16)
  const [copied, setCopied] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [passwordHistory, setPasswordHistory] = useState<string[]>([])
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    easyToSay: false,
    easyToRead: false,
    allCharacters: true,
  })

  // Generate password on initial load and when options change
  useEffect(() => {
    generatePassword()
  }, [length, options])

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

  const generatePassword = () => {
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
    result = shuffleString(result)

    // Add to history
    if (password) {
      setPasswordHistory((prev) => [password, ...prev.slice(0, 4)])
    }

    setPassword(result)
    setCopied(false)
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
      <div className="w-full max-w-2xl rounded-lg bg-card p-6 border border-border shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{translate("title", "password_generator")}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Quick Presets */}
          <div className="grid grid-cols-4 gap-3">
            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => applyPreset("strong")}
            >
              <CardContent className="p-3 flex flex-col items-center justify-center text-center">
                <ShieldCheck className="h-5 w-5 text-green-500 mb-1" />
                <span className="text-sm font-medium">{translate("strong", "password_generator")}</span>
                <span className="text-xs text-muted-foreground">20 {translate("chars", "password_generator")}</span>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => applyPreset("memorable")}
            >
              <CardContent className="p-3 flex flex-col items-center justify-center text-center">
                <Sparkles className="h-5 w-5 text-blue-500 mb-1" />
                <span className="text-sm font-medium">{translate("memorable", "password_generator")}</span>
                <span className="text-xs text-muted-foreground">14 {translate("chars", "password_generator")}</span>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => applyPreset("pin")}>
              <CardContent className="p-3 flex flex-col items-center justify-center text-center">
                <Shield className="h-5 w-5 text-purple-500 mb-1" />
                <span className="text-sm font-medium">{translate("pin", "password_generator")}</span>
                <span className="text-xs text-muted-foreground">6 {translate("digits", "password_generator")}</span>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => applyPreset("passphrase")}
            >
              <CardContent className="p-3 flex flex-col items-center justify-center text-center">
                <Shield className="h-5 w-5 text-yellow-500 mb-1" />
                <span className="text-sm font-medium">{translate("passphrase", "password_generator")}</span>
                <span className="text-xs text-muted-foreground">18 {translate("chars", "password_generator")}</span>
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
                      <Button variant="outline" size="icon" onClick={generatePassword} className="h-10 w-10">
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

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" className="h-10 w-10">
                        <Save className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{translate("save", "password_generator")}</p>
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

          <Tabs defaultValue="options" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="options">{translate("options", "password_generator")}</TabsTrigger>
              <TabsTrigger value="advanced">{translate("advanced", "password_generator")}</TabsTrigger>
              <TabsTrigger value="history">{translate("history", "password_generator")}</TabsTrigger>
            </TabsList>

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

            <TabsContent value="advanced" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border ${options.allCharacters ? "border-primary" : "border-border"}`}
                    onClick={() => handleOptionChange("allCharacters")}
                  >
                    {options.allCharacters && <div className="h-3 w-3 rounded-full bg-primary"></div>}
                  </div>
                  <label className="text-sm cursor-pointer" onClick={() => handleOptionChange("allCharacters")}>
                    {translate("all_characters", "password_generator")}
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border ${options.easyToRead ? "border-primary" : "border-border"}`}
                    onClick={() => handleOptionChange("easyToRead")}
                  >
                    {options.easyToRead && <div className="h-3 w-3 rounded-full bg-primary"></div>}
                  </div>
                  <label className="text-sm cursor-pointer" onClick={() => handleOptionChange("easyToRead")}>
                    {translate("easy_to_read", "password_generator")}
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border ${options.easyToSay ? "border-primary" : "border-border"}`}
                    onClick={() => handleOptionChange("easyToSay")}
                  >
                    {options.easyToSay && <div className="h-3 w-3 rounded-full bg-primary"></div>}
                  </div>
                  <label className="text-sm cursor-pointer" onClick={() => handleOptionChange("easyToSay")}>
                    {translate("easy_to_say", "password_generator")}
                  </label>
                </div>
              </div>

              <div className="mt-4 p-4 bg-muted/50 rounded-md">
                <h3 className="font-medium mb-2">{translate("password_tips", "password_generator")}</h3>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>{translate("tip_min_length", "password_generator")}</li>
                  <li>{translate("tip_mix", "password_generator")}</li>
                  <li>{translate("tip_no_personal", "password_generator")}</li>
                  <li>{translate("tip_unique", "password_generator")}</li>
                  <li>{translate("tip_manager", "password_generator")}</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {translate("recently_generated", "password_generator")}
                  </h3>
                  <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => setPasswordHistory([])}>
                    {translate("clear_history", "password_generator")}
                  </Button>
                </div>

                {passwordHistory.length > 0 ? (
                  <div className="space-y-2">
                    {passwordHistory.map((historyPassword, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                        <code className="text-sm font-mono truncate max-w-[300px]">{historyPassword}</code>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              navigator.clipboard.writeText(historyPassword)
                              setCopied(true)
                              setTimeout(() => setCopied(false), 2000)
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setPassword(historyPassword)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <p>{translate("no_history", "password_generator")}</p>
                    <p className="text-xs mt-1">{translate("history_hint", "password_generator")}</p>
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

