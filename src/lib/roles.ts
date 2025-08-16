
export function routeForRole(role: string): string {
  switch (String(role).toLowerCase()) {
    case "admin": return "/admin";
    case "manager": return "/waiter";
    case "cashier": return "/cashier";
    case "kitchen": return "/kitchen";
    case "waiter": return "/waiter";
    default: return "/login-staff";
  }
}
