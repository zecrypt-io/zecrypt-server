"use client"

export function NotificationsPanel() {
  const notifications = [
    {
      id: 1,
      title: "You have a bug that needs...",
      time: "Just now",
      icon: "B",
    },
    {
      id: 2,
      title: "New account registered su...",
      time: "24 minutes ago",
      icon: "A",
    },
    {
      id: 3,
      title: "Released a new version",
      time: "12 hours ago",
      icon: "R",
    },
    {
      id: 4,
      title: "Facebook password need t...",
      time: "Today, 11:59 AM",
      icon: "F",
    },
  ]

  const activities = [
    {
      id: 1,
      title: '"Personal" Notes edited',
      time: "Just now",
      icon: "P",
    },
    {
      id: 2,
      title: "New account created",
      time: "24 minutes ago",
      icon: "N",
    },
    {
      id: 3,
      title: "Amazon Password updated",
      time: "12 hours ago",
      icon: "A",
    },
    {
      id: 4,
      title: "New Account created",
      time: "Today, 11:59 AM",
      icon: "N",
    },
  ]

  return (
    <div className="hidden lg:block w-80 border-l border-border overflow-auto">
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4">Notifications</h2>
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div key={notification.id} className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-medium">
                {notification.icon}
              </div>
              <div>
                <p className="text-sm">{notification.title}</p>
                <p className="text-xs text-muted-foreground">{notification.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-border">
        <h2 className="text-lg font-bold mb-4">Activities</h2>
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-medium">
                {activity.icon}
              </div>
              <div>
                <p className="text-sm">{activity.title}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

