import {
  RouteReuseStrategy,
  ActivatedRouteSnapshot,
  DetachedRouteHandle,
} from '@angular/router';

export class DealMemoCreatorRouteReuseStrategy implements RouteReuseStrategy {
  private storedRoutes = new Map<string, DetachedRouteHandle>();

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    if (this.shouldNotReuse(route)) {
      return false;
    }
    return route.data['reuseRoute'] === true;
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    const routeKey = this.getRouteKey(route);
    this.storedRoutes.set(routeKey, handle);
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    if (this.shouldNotReuse(route)) {
      const routeKey = this.getRouteKey(route);
      this.storedRoutes.delete(routeKey);
      return false;
    }

    const routeKey = this.getRouteKey(route);
    return this.storedRoutes.has(routeKey);
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    const routeKey = this.getRouteKey(route);
    return this.storedRoutes.get(routeKey) || null;
  }

  shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    curr: ActivatedRouteSnapshot,
  ): boolean {
    return future.routeConfig === curr.routeConfig;
  }

  private shouldNotReuse(route: ActivatedRouteSnapshot): boolean {
    return route.params['action'] === 'new';
  }

  private getRouteKey(route: ActivatedRouteSnapshot): string {
    return route.routeConfig?.path || '';
  }

  public clearStoredRoute(routePath: string): void {
    this.storedRoutes.delete(routePath);
  }

  public clearAllStoredRoutes(): void {
    this.storedRoutes.clear();
  }
}
