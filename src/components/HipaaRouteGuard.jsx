import { Navigate } from 'react-router-dom';
import { canAccessRoute } from '../hipaa/permissions';

/**
 * Enforces minimum-necessary route access by user role.
 */
export default function HipaaRouteGuard({ user, pathname, children }) {
  if (!canAccessRoute(user, pathname)) {
    return <Navigate to="/dashboard" replace state={{ accessDenied: true }} />;
  }
  return children;
}
