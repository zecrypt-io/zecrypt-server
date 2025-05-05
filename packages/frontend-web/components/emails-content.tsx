"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Copy,
  Edit,
  Plus,
  Trash2,
  Mail,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Check,
  Eye,
  EyeOff,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslator } from "@/hooks/use-translations"

interface Email {
  id: string
  email_address: string
  imap_server: string
  smtp_server: string
  username: string
  password: string
  created: string
  updated: string
}

export function EmailsContent() {
  const sampleEmails: Email[] = [
    {
      id: "1",
      email_address: "john.doe@gmail.com",
      imap_server: "imap.gmail.com",
      smtp_server: "smtp.gmail.com",
      username: "john.doe@gmail.com",
      password: "StrongP@ssw0rd!",
      created: "2023-10-15",
      updated: "2023-11-28",
    },
    {
      id: "2",
      email_address: "jane.smith@outlook.com",
      imap_server: "outlook.office365.com",
      smtp_server: "smtp-mail.outlook.com",
      username: "jane.smith@outlook.com",
      password: "Secure123!",
      created: "2023-11-01",
      updated: "2023-11-25",
    },
    {
      id: "3",
      email_address: "contact@company.com",
      imap_server: "mail.company.com",
      smtp_server: "mail.company.com",
      username: "contact",
      password: "Business$789",
      created: "2023-05-10",
      updated: "2023-05-10",
    },
  ]

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddEmailModal, setShowAddEmailModal] = useState(false)
  const [showEditEmailModal, setShowEditEmailModal] = useState(false)
  const [emails, setEmails] = useState<Email[]>(sampleEmails)
  const [editingEmail, setEditingEmail] = useState<Email | null>(null)
  const [viewPassword, setViewPassword] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<{ id: string; field: string } | null>(null)

  // Form states
  const [newEmailAddress, setNewEmailAddress] = useState("")
  const [newImapServer, setNewImapServer] = useState("")
  const [newSmtpServer, setNewSmtpServer] = useState("")
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  
  const [editEmailAddress, setEditEmailAddress] = useState("")
  const [editImapServer, setEditImapServer] = useState("")
  const [editSmtpServer, setEditSmtpServer] = useState("")
  const [editUsername, setEditUsername] = useState("")
  const [editPassword, setEditPassword] = useState("")
  
  const { translate } = useTranslator()

  // Keyboard shortcuts
  useEffect(() => {
    const handleAddEmail = () => setShowAddEmailModal(true)

    document.addEventListener("toggle-add-email", handleAddEmail)

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "+") {
        e.preventDefault()
        setShowAddEmailModal(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("toggle-add-email", handleAddEmail)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  // Filter emails based on search
  const filteredEmails = emails.filter((email) => {
    return (
      searchQuery === "" ||
      email.email_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.username.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const paginatedEmails = filteredEmails.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredEmails.length / itemsPerPage)

  // Form handlers
  const resetAddForm = () => {
    setNewEmailAddress("")
    setNewImapServer("")
    setNewSmtpServer("")
    setNewUsername("")
    setNewPassword("")
  }

  const handleCreateEmail = () => {
    if (!newEmailAddress || !newUsername || !newPassword) {
      toast({
        title: "Missing Fields",
        description: "Please fill all required fields.",
        variant: "destructive",
      })
      return
    }

    const newEmail: Email = {
      id: (emails.length + 1).toString(),
      email_address: newEmailAddress,
      imap_server: newImapServer,
      smtp_server: newSmtpServer,
      username: newUsername,
      password: newPassword,
      created: new Date().toISOString().split("T")[0],
      updated: new Date().toISOString().split("T")[0],
    }

    setEmails([...emails, newEmail])
    setShowAddEmailModal(false)
    resetAddForm()
    toast({
      title: "Email Added",
      description: "Your email credentials have been securely stored.",
    })
  }

  const startEditingEmail = (id: string) => {
    const email = emails.find((email) => email.id === id)
    if (email) {
      setEditingEmail(email)
      setEditEmailAddress(email.email_address)
      setEditImapServer(email.imap_server)
      setEditSmtpServer(email.smtp_server)
      setEditUsername(email.username)
      setEditPassword(email.password)
      setShowEditEmailModal(true)
    }
  }

  const saveEditedEmail = () => {
    if (!editingEmail) return

    if (!editEmailAddress || !editUsername || !editPassword) {
      toast({
        title: "Missing Fields",
        description: "Please fill all required fields.",
        variant: "destructive",
      })
      return
    }

    const updatedEmail: Email = {
      ...editingEmail,
      email_address: editEmailAddress,
      imap_server: editImapServer,
      smtp_server: editSmtpServer,
      username: editUsername,
      password: editPassword,
      updated: new Date().toISOString().split("T")[0],
    }

    setEmails(
      emails.map((email) => (email.id === editingEmail.id ? updatedEmail : email))
    )
    setShowEditEmailModal(false)
    setEditingEmail(null)
    toast({
      title: "Email Updated",
      description: "Your email credentials have been updated successfully.",
    })
  }

  const handleDeleteEmail = (id: string) => {
    setEmails(emails.filter((email) => email.id !== id))
    toast({
      title: "Email Deleted",
      description: "Your email credentials have been removed from storage.",
    })
  }

  const handleCopyField = (id: string, field: string, value: string) => {
    navigator.clipboard.writeText(value)
    setCopiedField({ id, field })
    setTimeout(() => setCopiedField(null), 2000)
    toast({
      title: "Copied to Clipboard",
      description: `${field.charAt(0).toUpperCase() + field.slice(1)} has been copied to clipboard.`,
    })
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="container mx-auto py-8 px-6 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email Accounts</h2>
          <p className="text-muted-foreground">
            Securely manage your email account credentials for different services.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search emails..."
              className="w-full bg-background pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-9 w-9 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button onClick={() => setShowAddEmailModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Email
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email Address</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Password</TableHead>
              <TableHead>IMAP Server</TableHead>
              <TableHead>SMTP Server</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEmails.length > 0 ? (
              paginatedEmails.map((email) => (
                <TableRow key={email.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {email.email_address}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleCopyField(email.id, "email", email.email_address)}
                      >
                        {copiedField?.id === email.id && copiedField?.field === "email" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {email.username}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleCopyField(email.id, "username", email.username)}
                      >
                        {copiedField?.id === email.id && copiedField?.field === "username" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {viewPassword === email.id ? email.password : "••••••••••••"}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setViewPassword(viewPassword === email.id ? null : email.id)}
                      >
                        {viewPassword === email.id ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleCopyField(email.id, "password", email.password)}
                      >
                        {copiedField?.id === email.id && copiedField?.field === "password" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{email.imap_server}</TableCell>
                  <TableCell>{email.smtp_server}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEditingEmail(email.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteEmail(email.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No emails found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <ChevronLeft className="h-4 w-4 -ml-2" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
            <ChevronRight className="h-4 w-4 -ml-2" />
          </Button>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(parseInt(value))
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="5 per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 per page</SelectItem>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="20">20 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Add Email Dialog */}
      <Dialog open={showAddEmailModal} onOpenChange={setShowAddEmailModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Email Account</DialogTitle>
            <DialogDescription>
              Enter your email account credentials. All information is stored securely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="email-address">Email Address</Label>
              <Input
                id="email-address"
                placeholder="john.doe@example.com"
                value={newEmailAddress}
                onChange={(e) => setNewEmailAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="john.doe"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imap-server">IMAP Server</Label>
              <Input
                id="imap-server"
                placeholder="imap.example.com"
                value={newImapServer}
                onChange={(e) => setNewImapServer(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-server">SMTP Server</Label>
              <Input
                id="smtp-server"
                placeholder="smtp.example.com"
                value={newSmtpServer}
                onChange={(e) => setNewSmtpServer(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddEmailModal(false)
                resetAddForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateEmail}>Save Email</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Email Dialog */}
      <Dialog open={showEditEmailModal} onOpenChange={setShowEditEmailModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Email Account</DialogTitle>
            <DialogDescription>
              Update your email account credentials. All information is stored securely.
            </DialogDescription>
          </DialogHeader>
          {editingEmail && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-email-address">Email Address</Label>
                <Input
                  id="edit-email-address"
                  placeholder="john.doe@example.com"
                  value={editEmailAddress}
                  onChange={(e) => setEditEmailAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  placeholder="john.doe"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">Password</Label>
                <Input
                  id="edit-password"
                  type="password"
                  placeholder="••••••••••••"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-imap-server">IMAP Server</Label>
                <Input
                  id="edit-imap-server"
                  placeholder="imap.example.com"
                  value={editImapServer}
                  onChange={(e) => setEditImapServer(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-smtp-server">SMTP Server</Label>
                <Input
                  id="edit-smtp-server"
                  placeholder="smtp.example.com"
                  value={editSmtpServer}
                  onChange={(e) => setEditSmtpServer(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditEmailModal(false)
                setEditingEmail(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={saveEditedEmail}>Update Email</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 