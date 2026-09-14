import { Gamepad2, Keyboard, Video, Webhook } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "../ui/sidebar";
import { Link, useLocation } from "wouter";
import { PLATFORMS } from "@renderer/platform/registry";
import type { PlatformId } from "@renderer/types/platform";
import ParryggIcon from "@renderer/components/icons/ParryggIcon";
import type { ComponentType, SVGProps } from "react";

const PLATFORM_ICONS: Partial<
  Record<PlatformId, ComponentType<SVGProps<SVGSVGElement>>>
> = {
  parrygg: ParryggIcon,
};

function SettingsSidebar() {
  const [location] = useLocation();

  const items = [
    {
      title: "OBS",
      url: "/obs",
      icon: Video,
    },
    ...PLATFORMS.map((platform) => ({
      title: platform.displayName,
      url: `/${platform.id}`,
      icon: PLATFORM_ICONS[platform.id] ?? Webhook,
    })),
    {
      title: "Slippi",
      url: "/slippi",
      icon: Gamepad2,
    },
    { title: "Keybinds", url: "/shortcuts", icon: Keyboard },
  ];
  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) =>
                item.url === "/obs" ? (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url || location === "/"}
                    >
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location === item.url}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ),
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

export default SettingsSidebar;
