import {
  Activity,
  Ambulance,
  ClipboardCheck,
  Droplet,
  HeartPulse,
  LayoutDashboard,
  ShieldCheck,
  UserRound,
} from "lucide-react";

export const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ["admin", "doctor", "transport"] },
  { label: "Donor", path: "/donor", icon: UserRound, roles: ["admin"] },
  { label: "Recipient", path: "/recipient", icon: HeartPulse, roles: ["admin"] },
  { label: "Organ Management", path: "/organ-management", icon: Droplet, roles: ["admin"] },
  { label: "Matching", path: "/matching", icon: ShieldCheck, roles: ["admin"] },
  { label: "Transport Tracking", path: "/transport-tracking", icon: Ambulance, roles: ["admin", "transport"] },
  { label: "Surgery", path: "/surgery", icon: Activity, roles: ["admin", "doctor"] },
  { label: "Approval Panel", path: "/approval-workflow", icon: ClipboardCheck, roles: ["admin", "doctor"] },
];
