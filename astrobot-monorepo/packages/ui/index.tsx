"use client";

import { Button, buttonVariants } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, CosmicCard, GlassCard, MotionCard, MotionGlassCard, CardGlowHeader } from "./components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./components/ui/dropdown-menu";
import { Input, CosmicInput, GlassInput } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "./components/ui/navigation-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Separator } from "./components/ui/separator";
import { Switch } from "./components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Toaster, toast } from "./components/ui/toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";

// Theme provider for dark/light mode
import { ThemeProvider, useTheme } from "./providers/theme-provider";

// Animation utilities
import * as animations from "./animations";

// Utility functions
import { cn, formatDate, formatRelativeTime } from "./lib/utils";

export {
  // Components
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardGlowHeader,
  CardHeader,
  CardTitle,
  CosmicCard,
  CosmicInput,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  GlassCard,
  GlassInput,
  Input,
  Label,
  MotionCard,
  MotionGlassCard,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ThemeProvider,
  Toaster,
  toast,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  useTheme,
  
  // Animation utilities
  animations,
  
  // Utility functions
  cn,
  formatDate,
  formatRelativeTime,
};