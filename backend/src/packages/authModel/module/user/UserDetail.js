export class UserDetail {
  payload;

  roles;

  permissions;

  constructor(payload) {
      this.payload = payload;
  }

  toRoles() {
      const roles = this.payload?.roles ?? this.payload?.role ?? [];
      this.roles = Array.isArray(roles) ? roles : [roles];
  }

  toPermissions() {
      this.permissions = this.payload?.permissions ?? [];
  }
}
