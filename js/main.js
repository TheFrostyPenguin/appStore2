import { startRouter, registerRoute, navigateTo } from './router.js';
import { requireAuth, requireAdmin } from './auth.js';
import { renderLoginPage } from './ui/login.js';
import { renderSignupPage } from './ui/signup.js';
import { renderMarketplacesPage } from './ui/marketplaces.js';
import { renderCategoryAppsPage } from './ui/categoryApps.js';
import { renderAppDetailsPage } from './ui/appDetails.js';
import { renderAdminDashboardPage } from './ui/adminDashboard.js';
import { renderAdminAppsListPage, renderAdminAppNewPage, renderAdminAppEditPage } from './ui/adminApps.js';
import { renderAdminAppVersionsPage } from './ui/adminAppVersions.js';
import { getCurrentUser } from './api.js';

registerRoute('/login', async () => renderLoginPage());
registerRoute('/signup', async () => renderSignupPage());
registerRoute('/marketplaces', async () => requireAuth(() => renderMarketplacesPage()));
registerRoute('/category/:slug', async ({ slug }) => requireAuth(() => renderCategoryAppsPage(slug)));
registerRoute('/app/:id', async ({ id }) => requireAuth(() => renderAppDetailsPage(id)));

registerRoute('/admin', async () => requireAdmin(() => renderAdminDashboardPage()));
registerRoute('/admin/apps', async () => requireAdmin(() => renderAdminAppsListPage()));
registerRoute('/admin/apps/new', async () => requireAdmin(() => renderAdminAppNewPage()));
registerRoute('/admin/apps/:id/edit', async ({ id }) => requireAdmin(() => renderAdminAppEditPage(id)));
registerRoute('/admin/apps/:id/versions', async ({ id }) => requireAdmin(() => renderAdminAppVersionsPage(id)));

async function bootstrap() {
  const {
    data: { user }
  } = await getCurrentUser();

  if (!window.location.hash) {
    if (user) {
      navigateTo('#/marketplaces');
    } else {
      navigateTo('#/login');
    }
  }

  startRouter();
}

bootstrap();
