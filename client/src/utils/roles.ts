// Canonical roles (mirrors the backend middlewares/role.ts).
export const ROLES = {
  CONSUMER: "CONSUMER",
  TRADE: "TRADE",
  NDIS_COORDINATOR: "NDIS_COORDINATOR",
  ADMIN: "ADMIN",
} as const;

// Legacy "USER" is treated as CONSUMER.
export const normaliseRole = (role?: string | null): string =>
  role === "USER" || !role ? ROLES.CONSUMER : role;

// Which landing route a logged-in user should be sent to.
export const portalPath = (role?: string | null): string => {
  switch (normaliseRole(role)) {
    case ROLES.ADMIN:
      return "/admin";
    case ROLES.TRADE:
      return "/portal/trade";
    case ROLES.NDIS_COORDINATOR:
      return "/portal/ndis";
    default:
      return "/portal/consumer";
  }
};