"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your preferences</p>
      </div>

      {/* Notification Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Control how you receive alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-foreground">Order Notifications</Label>
              <p className="text-sm text-muted-foreground mt-1">Get notified when new orders arrive</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-foreground">Fulfillment Alerts</Label>
              <p className="text-sm text-muted-foreground mt-1">Get alerts for fulfillment issues</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-foreground">Daily Reports</Label>
              <p className="text-sm text-muted-foreground mt-1">Receive daily performance reports</p>
            </div>
            <Switch />
          </div>

          <Button className="bg-accent text-accent-foreground hover:opacity-90">Save Preferences</Button>
        </CardContent>
      </Card>

      {/* Fulfillment Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Fulfillment Settings</CardTitle>
          <CardDescription>Configure fulfillment preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="warehouse" className="text-foreground">
              Default Warehouse
            </Label>
            <Input id="warehouse" defaultValue="Main Warehouse" className="bg-background border-border" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="processing-time" className="text-foreground">
              Processing Time (hours)
            </Label>
            <Input id="processing-time" type="number" defaultValue="24" className="bg-background border-border" />
          </div>

          <Button className="bg-accent text-accent-foreground hover:opacity-90">Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  )
}
