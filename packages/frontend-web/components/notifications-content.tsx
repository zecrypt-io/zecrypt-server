"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function NotificationsContent() {
  const notifications = [
    {
      id: 1,
      title: "You have a bug that needs to be fixed",
      time: "Just now",
      icon: "B",
      read: false,
    },
    {
      id: 2,
      title: "New account registered successfully",
      time: "24 minutes ago",
      icon: "A",
      read: false,
    },
    {
      id: 3,
      title: "Released a new version",
      time: "12 hours ago",
      icon: "R",
      read: false,
    },
    {
      id: 4,
      title: "Facebook password needs to be updated",
      time: "Today, 11:59 AM",
      icon: "F",
      read: true,
    },
  ]

  const activities = [
    {
      id: 1,
      title: '"Personal" Notes edited',
      time: "Just now",
      icon: "P",
      read: false,
    },
    {
      id: 2,
      title: "New account created",
      time: "24 minutes ago",
      icon: "N",
      read: false,
    },
    {
      id: 3,
      title: "Amazon Password updated",
      time: "12 hours ago",
      icon: "A",
      read: true,
    },
    {
      id: 4,
      title: "New Account created",
      time: "Today, 11:59 AM",
      icon: "N",
      read: true,
    },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your account activities</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Mark all as read</Button>
          <Button variant="outline">Clear all</Button>
        </div>
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-6">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-3 p-4 rounded-lg border ${notification.read ? "border-border bg-card" : "border-primary/20 bg-primary/5"}`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-medium">
                {notification.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className={`text-sm ${notification.read ? "font-normal" : "font-medium"}`}>{notification.title}</p>
                  {!notification.read && <span className="h-2 w-2 rounded-full bg-primary"></span>}
                </div>
                <p className="text-xs text-muted-foreground">{notification.time}</p>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className={`flex items-start gap-3 p-4 rounded-lg border ${activity.read ? "border-border bg-card" : "border-primary/20 bg-primary/5"}`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-medium">
                {activity.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className={`text-sm ${activity.read ? "font-normal" : "font-medium"}`}>{activity.title}</p>
                  {!activity.read && <span className="h-2 w-2 rounded-full bg-primary"></span>}
                </div>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}

