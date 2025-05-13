import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@astrobot/ui";
import { Button } from "@astrobot/ui";
import { Separator } from "@astrobot/ui";
import { Switch } from "@astrobot/ui";
import { motion } from "framer-motion";
import { fadeInUp, cardZoom, staggerContainer } from "@astrobot/ui/animations";

// Sample data for the overview page
const stats = [
  { name: "Discord Servers", value: "12", trend: "+2", icon: "🌐" },
  { name: "Total Commands", value: "4,281", trend: "+258", icon: "⌨️" },
  { name: "Active Users", value: "956", trend: "+84", icon: "👥" },
  { name: "AI Requests", value: "1,089", trend: "+112", icon: "🧠" },
];

const recentServers = [
  { name: "AstroFrame Official", members: 542, premium: true, icon: "🚀" },
  { name: "Cosmic Crafters", members: 324, premium: false, icon: "🌌" },
  { name: "Nebula Network", members: 217, premium: true, icon: "✨" },
];

const popularCommands = [
  { name: "/minecraft status", uses: 856, type: "Minecraft" },
  { name: "/ask", uses: 743, type: "AI" },
  { name: "/random", uses: 512, type: "Utility" },
  { name: "/weather", uses: 437, type: "Utility" },
];

const botStatus = {
  status: "Online",
  uptime: "23 days, 4 hours",
  latency: "48ms",
  lastRestart: "May 9, 2025",
};

export default function DashboardOverview() {
  return (
    <div className="container">
      {/* Page header */}
      <div className="mb-8">
        <motion.div 
          className="space-y-1"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <h1 className="text-3xl font-bold cosmic-text">Dashboard Overview</h1>
          <p className="text-muted-foreground">
            Monitor your AstroBot AI activity and performance across all connected servers.
          </p>
        </motion.div>
      </div>

      {/* Stats cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {stats.map((stat) => (
          <motion.div key={stat.name} variants={cardZoom}>
            <Card className="glass-card border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                    <div className="flex items-baseline mt-1">
                      <h3 className="text-2xl font-bold cosmic-text">{stat.value}</h3>
                      <span className="ml-2 text-xs text-green-400">{stat.trend}</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 flex items-center justify-center rounded-full bg-cosmic-500/10 text-cosmic-500 text-2xl">
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bot status card */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card border-white/10 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="space-text">Bot Status</CardTitle>
              <CardDescription>Real-time performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Status</span>
                <div className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                  <span className="font-medium">{botStatus.status}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Uptime</span>
                <span className="font-medium">{botStatus.uptime}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Latency</span>
                <span className="font-medium">{botStatus.latency}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Last Restart</span>
                <span className="font-medium">{botStatus.lastRestart}</span>
              </div>
            </CardContent>
            <div className="bg-gradient-to-r from-cosmic-500/10 to-space-500/10 p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Auto Recovery</span>
                <Switch variant="cosmic" defaultChecked />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Recent servers */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card border-white/10 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="space-text">Recent Servers</CardTitle>
              <CardDescription>Your active Discord servers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentServers.map((server) => (
                <div key={server.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-black/40 text-lg mr-3">
                      {server.icon}
                    </div>
                    <div>
                      <p className="font-medium">{server.name}</p>
                      <p className="text-xs text-muted-foreground">{server.members} members</p>
                    </div>
                  </div>
                  {server.premium && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-cosmic-500 text-white">
                      Premium
                    </span>
                  )}
                </div>
              ))}
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/servers">View All Servers</Link>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Popular commands */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card border-white/10 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="space-text">Popular Commands</CardTitle>
              <CardDescription>Most used bot commands</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {popularCommands.map((command) => (
                <div key={command.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-sm font-medium">{command.name}</div>
                    <div className="text-xs font-medium">{command.uses} uses</div>
                  </div>
                  <div className="flex items-center">
                    <div className="h-1.5 flex-1 rounded-full bg-gray-800">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-cosmic-500 to-space-500"
                        style={{ width: `${(command.uses / popularCommands[0].uses) * 100}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-xs text-muted-foreground">{command.type}</span>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/commands">View All Commands</Link>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>

      {/* Quick actions */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.4 }}
        className="mt-8"
      >
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Button 
            variant="outline" 
            className="h-24 flex flex-col items-center justify-center space-y-1 bg-black/20"
            asChild
          >
            <Link href="/dashboard/ai-settings">
              <span className="text-xl">🧠</span>
              <span className="text-xs font-medium">AI Assistant</span>
            </Link>
          </Button>
          <Button 
            variant="outline" 
            className="h-24 flex flex-col items-center justify-center space-y-1 bg-black/20"
            asChild
          >
            <Link href="/dashboard/minecraft">
              <span className="text-xl">🎮</span>
              <span className="text-xs font-medium">Minecraft</span>
            </Link>
          </Button>
          <Button 
            variant="outline" 
            className="h-24 flex flex-col items-center justify-center space-y-1 bg-black/20"
            asChild
          >
            <Link href="/dashboard/plugins">
              <span className="text-xl">🔌</span>
              <span className="text-xs font-medium">Plugins</span>
            </Link>
          </Button>
          <Button 
            variant="outline" 
            className="h-24 flex flex-col items-center justify-center space-y-1 bg-black/20"
            asChild
          >
            <Link href="/dashboard/analytics">
              <span className="text-xl">📊</span>
              <span className="text-xs font-medium">Analytics</span>
            </Link>
          </Button>
          <Button 
            variant="outline" 
            className="h-24 flex flex-col items-center justify-center space-y-1 bg-black/20"
            asChild
          >
            <Link href="/dashboard/twitch">
              <span className="text-xl">📺</span>
              <span className="text-xs font-medium">Twitch</span>
            </Link>
          </Button>
          <Button 
            variant="outline" 
            className="h-24 flex flex-col items-center justify-center space-y-1 bg-black/20"
            asChild
          >
            <Link href="/dashboard/settings">
              <span className="text-xl">⚙️</span>
              <span className="text-xs font-medium">Settings</span>
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}