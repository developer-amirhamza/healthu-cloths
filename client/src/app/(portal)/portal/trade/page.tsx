"use client";
import PortalGuard from "../PortalGuard";
import { ROLES } from "@/utils/roles";
import TradeCatalogue from "./TradeCatalogue";

export default function TradePortalPage() {
  return (
    <PortalGuard allow={[ROLES.TRADE, ROLES.ADMIN]}>
      <TradeCatalogue />
    </PortalGuard>
  );
}